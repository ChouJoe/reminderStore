const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const recurrenceService = require('../services/recurrenceService');

/**
 * 获取Reminder模型
 * 从app.locals中获取sequelize实例
 */
function getReminderModel(req) {
  return req.app.locals.sequelize.models.Reminder;
}

/**
 * 获取User模型
 */
function getUserModel(req) {
  return req.app.locals.sequelize.models.User;
}

router.post('/', async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      reminderDate,
      reminderTime,
      advanceMinutes,
      recurrenceType,
      recurrenceValue,
      recurrenceNthWeekday,
      recurrenceWeekday,
      recurrenceDay,
      recurrenceEndDate,
      maxRecurrenceCount
    } = req.body;

    if (!userId || !title || !reminderDate || !reminderTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const Reminder = getReminderModel(req);

    const reminderData = {
      userId,
      title,
      description,
      reminderDate,
      reminderTime,
      advanceMinutes: advanceMinutes || 0,
      recurrenceType: recurrenceType || 'none',
      recurrenceValue: recurrenceValue || null,
      recurrenceNthWeekday: recurrenceNthWeekday || null,
      recurrenceWeekday: recurrenceWeekday || null,
      recurrenceDay: recurrenceDay || null,
      recurrenceEndDate: recurrenceEndDate || null,
      maxRecurrenceCount: maxRecurrenceCount || null
    };

    if (recurrenceType && recurrenceType !== 'none') {
      reminderData.nextReminderDate = recurrenceService.calculateNextReminderDate(reminderData);
    }

    const reminder = await Reminder.create(reminderData);

    res.json({
      success: true,
      reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Create reminder failed' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, status } = req.query;

    const Reminder = getReminderModel(req);

    const whereClause = { userId };

    if (startDate && endDate) {
      whereClause.reminderDate = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
    }

    if (status === 'completed') {
      whereClause.isCompleted = true;
    } else if (status === 'pending') {
      whereClause.isCompleted = false;
    }

    const reminders = await Reminder.findAll({
      where: whereClause,
      order: [
        ['reminderDate', 'ASC'],
        ['reminderTime', 'ASC']
      ]
    });

    res.json({
      success: true,
      reminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Get reminders failed' });
  }
});

router.get('/:userId/:reminderId', async (req, res) => {
  try {
    const { userId, reminderId } = req.params;

    const Reminder = getReminderModel(req);

    const reminder = await Reminder.findOne({
      where: {
        id: reminderId,
        userId
      }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({
      success: true,
      reminder
    });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Get reminder failed' });
  }
});

router.put('/:userId/:reminderId', async (req, res) => {
  try {
    const { userId, reminderId } = req.params;
    const {
      title,
      description,
      reminderDate,
      reminderTime,
      advanceMinutes,
      isCompleted,
      recurrenceType,
      recurrenceValue,
      recurrenceNthWeekday,
      recurrenceWeekday,
      recurrenceDay,
      recurrenceEndDate,
      maxRecurrenceCount
    } = req.body;

    const Reminder = getReminderModel(req);

    const reminder = await Reminder.findOne({
      where: {
        id: reminderId,
        userId
      }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updateData = {
      title,
      description,
      reminderDate,
      reminderTime,
      advanceMinutes,
      isCompleted,
      isNotified: false,
      notificationSentAt: null
    };

    if (recurrenceType !== undefined) {
      updateData.recurrenceType = recurrenceType;
      updateData.recurrenceValue = recurrenceValue || null;
      updateData.recurrenceNthWeekday = recurrenceNthWeekday || null;
      updateData.recurrenceWeekday = recurrenceWeekday || null;
      updateData.recurrenceDay = recurrenceDay || null;
      updateData.recurrenceEndDate = recurrenceEndDate || null;
      updateData.maxRecurrenceCount = maxRecurrenceCount || null;

      if (recurrenceType && recurrenceType !== 'none') {
        const tempReminder = { ...reminder.toJSON(), ...updateData };
        updateData.nextReminderDate = recurrenceService.calculateNextReminderDate(tempReminder);
      } else {
        updateData.nextReminderDate = null;
      }
    }

    await reminder.update(updateData);

    res.json({
      success: true,
      reminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Update reminder failed' });
  }
});

router.delete('/:userId/:reminderId', async (req, res) => {
  try {
    const { userId, reminderId } = req.params;

    const Reminder = getReminderModel(req);

    const reminder = await Reminder.findOne({
      where: {
        id: reminderId,
        userId
      }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await reminder.destroy();

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Delete reminder failed' });
  }
});

router.post('/:userId/:reminderId/complete', async (req, res) => {
  try {
    const { userId, reminderId } = req.params;

    const Reminder = getReminderModel(req);

    const reminder = await Reminder.findOne({
      where: {
        id: reminderId,
        userId
      }
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    if (reminder.recurrenceType && reminder.recurrenceType !== 'none') {
      const nextReminderDate = recurrenceService.calculateNextReminderDate(reminder.toJSON());

      if (nextReminderDate) {
        await reminder.update({
          reminderDate: nextReminderDate,
          isCompleted: false,
          isNotified: false,
          notificationSentAt: null,
          recurrenceCount: (reminder.recurrenceCount || 0) + 1,
          nextReminderDate: recurrenceService.calculateNextReminderDate({
            ...reminder.toJSON(),
            reminderDate: nextReminderDate,
            recurrenceCount: (reminder.recurrenceCount || 0) + 1
          })
        });
      } else {
        await reminder.update({
          isCompleted: true,
          nextReminderDate: null
        });
      }
    } else {
      await reminder.update({
        isCompleted: true
      });
    }

    res.json({
      success: true,
      reminder
    });
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ error: 'Complete reminder failed' });
  }
});

router.get('/:userId/recurrence/description', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      recurrenceType,
      recurrenceValue,
      recurrenceNthWeekday,
      recurrenceWeekday,
      recurrenceDay
    } = req.query;

    const reminder = {
      recurrenceType: recurrenceType || 'none',
      recurrenceValue: recurrenceValue ? parseInt(recurrenceValue) : null,
      recurrenceNthWeekday: recurrenceNthWeekday ? parseInt(recurrenceNthWeekday) : null,
      recurrenceWeekday: recurrenceWeekday ? parseInt(recurrenceWeekday) : null,
      recurrenceDay: recurrenceDay ? parseInt(recurrenceDay) : null
    };

    const description = recurrenceService.getRecurrenceDescription(reminder);

    res.json({
      success: true,
      description
    });
  } catch (error) {
    console.error('Get recurrence description error:', error);
    res.status(500).json({ error: 'Get recurrence description failed' });
  }
});

module.exports = router;
