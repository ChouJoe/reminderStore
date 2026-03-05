const { DataTypes } = require('sequelize');

/**
 * 定义Reminder模型
 * @param {Sequelize} sequelize - Sequelize实例
 * @returns {Model} Reminder模型
 */
function defineReminderModel(sequelize) {
  const Reminder = sequelize.define('Reminder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    reminderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reminderTime: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    advanceMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    recurrenceType: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'monthly_nth_weekday'),
      defaultValue: 'none'
    },
    recurrenceValue: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    recurrenceNthWeekday: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      validate: {
        min: 1,
        max: 5
      }
    },
    recurrenceWeekday: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      validate: {
        min: 0,
        max: 6
      }
    },
    recurrenceDay: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      validate: {
        min: 1,
        max: 31
      }
    },
    recurrenceEndDate: {
      type: DataTypes.DATEONLY,
      defaultValue: null
    },
    nextReminderDate: {
      type: DataTypes.DATEONLY,
      defaultValue: null
    },
    recurrenceCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxRecurrenceCount: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notificationSentAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'reminders',
    timestamps: true,
    hooks: {
      beforeUpdate: (reminder) => {
        reminder.updatedAt = new Date();
      }
    },
    indexes: [
      { fields: ['userId', 'reminderDate'] },
      { fields: ['reminderDate', 'reminderTime'] }
    ]
  });

  return Reminder;
}

module.exports = defineReminderModel;
