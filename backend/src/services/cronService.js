const cron = require('node-cron');
const moment = require('moment');
const { Op } = require('sequelize');
const wechatService = require('./wechatService');
const recurrenceService = require('./recurrenceService');

const TEMPLATE_ID = 'p8lNVDs_r0trdq-SnOzDiiiqU5hAGpWhLV1Z0oM7nvU';

/**
 * 获取模型
 * 从全局sequelize实例获取
 */
function getModels() {
  const sequelize = global.sequelize;
  return {
    Reminder: sequelize.models.Reminder,
    User: sequelize.models.User
  };
}

/**
 * 检查并发送提醒
 */
async function checkAndSendReminders() {
  try {
    console.log('Checking reminders at:', new Date().toISOString());

    const { Reminder, User } = getModels();

    const now = moment();
    const currentDateTime = now.format('YYYY-MM-DD HH:mm');

    const reminders = await Reminder.findAll({
      where: {
        isCompleted: false,
        isNotified: false
      }
    });

    for (const reminder of reminders) {
      let reminderDate = reminder.reminderDate;

      if (reminder.recurrenceType && reminder.recurrenceType !== 'none') {
        if (reminder.nextReminderDate) {
          reminderDate = reminder.nextReminderDate;
        }
      }

      const reminderDateTime = moment(reminderDate).format('YYYY-MM-DD') + ' ' + reminder.reminderTime;
      const reminderMoment = moment(reminderDateTime, 'YYYY-MM-DD HH:mm');

      const notificationTime = reminderMoment.clone().subtract(reminder.advanceMinutes, 'minutes');
      const notificationDateTime = notificationTime.format('YYYY-MM-DD HH:mm');

      if (currentDateTime >= notificationDateTime) {
        let user = await User.findOne({ where: { id: reminder.userId } });
        if (!user) {
          console.log(`Creating new user for userId: ${reminder.userId}`);
          user = await User.create({ 
            id: reminder.userId,
            openid: reminder.userId
          });
        }
        // 检查是否配置了微信小程序参数
        const hasWechatConfig = process.env.WECHAT_APPID && process.env.WECHAT_SECRET && process.env.WECHAT_APPID !== 'your_wechat_appid';
        if (!hasWechatConfig) {
          console.log(`Skipping message send for local development: ${reminder.title}`);
          
          // 仍然更新提醒状态
          const updateData = {
            isNotified: true,
            notificationSentAt: new Date()
          };

          if (reminder.recurrenceType && reminder.recurrenceType !== 'none') {
            const nextReminderDate = recurrenceService.calculateNextReminderDate(reminder.toJSON());

            if (nextReminderDate) {
              updateData.reminderDate = nextReminderDate;
              updateData.isNotified = false;
              updateData.notificationSentAt = null;
              updateData.recurrenceCount = (reminder.recurrenceCount || 0) + 1;
              updateData.nextReminderDate = recurrenceService.calculateNextReminderDate({
                ...reminder.toJSON(),
                reminderDate: nextReminderDate,
                recurrenceCount: (reminder.recurrenceCount || 0) + 1
              });
              console.log(`Recurring reminder updated for user ${user.openid}: ${reminder.title}, next date: ${nextReminderDate}`);
            } else {
              updateData.isCompleted = true;
              updateData.nextReminderDate = null;
              console.log(`Recurring reminder completed for user ${user.openid}: ${reminder.title}`);
            }
          }

          await reminder.update(updateData);
          continue;
        }

        const messageData = {
          thing3: {
            value: reminder.title
          },
          date2: {
            value: reminder.reminderTime
          },
          time11: {
            value: moment(reminderDate).format('YYYY年MM月DD日')
          },
          thing10: {
            value: reminder.description || '无描述'
          }
        };

        const result = await wechatService.sendSubscribeMessage(
          user.openid,
          TEMPLATE_ID,
          messageData,
          'pages/index/index'
        );

        if (result.success) {
          const updateData = {
            isNotified: true,
            notificationSentAt: new Date()
          };

          if (reminder.recurrenceType && reminder.recurrenceType !== 'none') {
            const nextReminderDate = recurrenceService.calculateNextReminderDate(reminder.toJSON());

            if (nextReminderDate) {
              updateData.reminderDate = nextReminderDate;
              updateData.isNotified = false;
              updateData.notificationSentAt = null;
              updateData.recurrenceCount = (reminder.recurrenceCount || 0) + 1;
              updateData.nextReminderDate = recurrenceService.calculateNextReminderDate({
                ...reminder.toJSON(),
                reminderDate: nextReminderDate,
                recurrenceCount: (reminder.recurrenceCount || 0) + 1
              });
              console.log(`Recurring reminder updated for user ${user.openid}: ${reminder.title}, next date: ${nextReminderDate}`);
            } else {
              updateData.isCompleted = true;
              updateData.nextReminderDate = null;
              console.log(`Recurring reminder completed for user ${user.openid}: ${reminder.title}`);
            }
          }

          await reminder.update(updateData);
          console.log(`Reminder sent to user ${user.openid}: ${reminder.title}`);
        } else {
          console.error(`Failed to send reminder to user ${user.openid}: ${result.error}`);
        }
      }
    }
  } catch (error) {
    console.error('Check reminders error:', error);
  }
}

let cronJob = null;

/**
 * 启动定时任务
 */
function start() {
  if (cronJob) {
    console.log('Cron job already running');
    return;
  }

  cronJob = cron.schedule('*/1 * * * *', checkAndSendReminders, {
    timezone: 'Asia/Shanghai'
  });

  console.log('Cron job started: checking reminders every minute');
}

/**
 * 停止定时任务
 */
function stop() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Cron job stopped');
  }
}

module.exports = {
  start,
  stop,
  checkAndSendReminders
};
