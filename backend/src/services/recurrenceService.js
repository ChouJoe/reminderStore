const moment = require('moment');

/**
 * 计算下一次提醒日期
 * @param {Object} reminder - 提醒对象
 * @returns {Date|null} 下一次提醒日期或null
 */
function calculateNextReminderDate(reminder) {
  const {
    reminderDate,
    reminderTime,
    recurrenceType,
    recurrenceValue,
    recurrenceNthWeekday,
    recurrenceWeekday,
    recurrenceDay,
    recurrenceEndDate,
    maxRecurrenceCount,
    recurrenceCount
  } = reminder;

  if (recurrenceType === 'none') {
    return null;
  }

  const currentDateTime = moment(reminderDate);
  const [hours, minutes] = reminderTime.split(':').map(Number);
  currentDateTime.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  let nextDate = null;

  switch (recurrenceType) {
    case 'daily':
      nextDate = calculateDailyRecurrence(currentDateTime, recurrenceValue);
      break;
    case 'weekly':
      nextDate = calculateWeeklyRecurrence(currentDateTime, recurrenceValue, recurrenceWeekday);
      break;
    case 'monthly':
      nextDate = calculateMonthlyRecurrence(currentDateTime, recurrenceValue, recurrenceDay);
      break;
    case 'monthly_nth_weekday':
      nextDate = calculateMonthlyNthWeekdayRecurrence(
        currentDateTime,
        recurrenceValue,
        recurrenceNthWeekday,
        recurrenceWeekday
      );
      break;
  }

  if (!nextDate) {
    return null;
  }

  if (recurrenceEndDate && nextDate.isAfter(moment(recurrenceEndDate))) {
    return null;
  }

  if (maxRecurrenceCount && recurrenceCount >= maxRecurrenceCount) {
    return null;
  }

  return nextDate.toDate();
}

/**
 * 计算每日重复
 * @param {moment.Moment} currentDate - 当前日期
 * @param {number} interval - 间隔天数
 * @returns {moment.Moment} 下一次日期
 */
function calculateDailyRecurrence(currentDate, interval) {
  const days = interval || 1;
  return currentDate.clone().add(days, 'days');
}

/**
 * 计算每周重复
 * @param {moment.Moment} currentDate - 当前日期
 * @param {number} interval - 间隔周数
 * @param {number} weekday - 星期几 (0-6)
 * @returns {moment.Moment} 下一次日期
 */
function calculateWeeklyRecurrence(currentDate, interval, weekday) {
  const weeks = interval || 1;
  let nextDate = currentDate.clone().add(weeks, 'weeks');

  if (weekday !== null && weekday !== undefined) {
    nextDate.day(weekday);
  }

  return nextDate;
}

/**
 * 计算每月重复
 * @param {moment.Moment} currentDate - 当前日期
 * @param {number} interval - 间隔月数
 * @param {number} day - 每月几号
 * @returns {moment.Moment} 下一次日期
 */
function calculateMonthlyRecurrence(currentDate, interval, day) {
  const months = interval || 1;
  let nextDate = currentDate.clone().add(months, 'months');

  if (day !== null && day !== undefined) {
    nextDate.date(day);
  }

  return nextDate;
}

/**
 * 计算每月第几周星期几重复
 * @param {moment.Moment} currentDate - 当前日期
 * @param {number} interval - 间隔月数
 * @param {number} nthWeekday - 第几周 (1-5)
 * @param {number} weekday - 星期几 (0-6)
 * @returns {moment.Moment} 下一次日期
 */
function calculateMonthlyNthWeekdayRecurrence(currentDate, interval, nthWeekday, weekday) {
  const months = interval || 1;
  let nextDate = currentDate.clone().add(months, 'months');

  if (nthWeekday !== null && nthWeekday !== undefined && weekday !== null && weekday !== undefined) {
    const year = nextDate.year();
    const month = nextDate.month();
    const firstDayOfMonth = moment([year, month, 1]);

    let targetDay = firstDayOfMonth.clone();

    if (weekday === 0) {
      targetDay.day(0);
    } else {
      targetDay.day(weekday);
    }

    if (targetDay.date() > 7) {
      targetDay.add(7, 'days');
    }

    targetDay.add((nthWeekday - 1) * 7, 'days');

    if (targetDay.month() !== month) {
      targetDay = firstDayOfMonth.clone().add(1, 'months');
      targetDay.day(weekday);
      if (targetDay.date() > 7) {
        targetDay.add(7, 'days');
      }
      targetDay.add((nthWeekday - 1) * 7, 'days');
    }

    nextDate = targetDay;
  }

  return nextDate;
}

/**
 * 获取某月第几周星期几的日期
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @param {number} nthWeekday - 第几周 (1-5)
 * @param {number} weekday - 星期几 (0-6)
 * @returns {moment.Moment|null} 目标日期或null
 */
function getNextNthWeekdayOfMonth(year, month, nthWeekday, weekday) {
  const firstDayOfMonth = moment([year, month, 1]);

  let targetDay = firstDayOfMonth.clone();

  if (weekday === 0) {
    targetDay.day(0);
  } else {
    targetDay.day(weekday);
  }

  if (targetDay.date() > 7) {
    targetDay.add(7, 'days');
  }

  targetDay.add((nthWeekday - 1) * 7, 'days');

  if (targetDay.month() !== month) {
    return null;
  }

  return targetDay;
}

/**
 * 获取重复规则描述
 * @param {Object} reminder - 提醒对象
 * @returns {string} 描述文本
 */
function getRecurrenceDescription(reminder) {
  const {
    recurrenceType,
    recurrenceValue,
    recurrenceNthWeekday,
    recurrenceWeekday,
    recurrenceDay
  } = reminder;

  if (recurrenceType === 'none') {
    return '一次性提醒';
  }

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const nthWeekdayNames = ['', '第一个', '第二个', '第三个', '第四个', '第五个'];

  switch (recurrenceType) {
    case 'daily':
      return recurrenceValue === 1 ? '每天' : `每${recurrenceValue}天`;

    case 'weekly':
      if (recurrenceWeekday !== null && recurrenceWeekday !== undefined) {
        const interval = recurrenceValue || 1;
        return interval === 1
          ? `每周${weekdayNames[recurrenceWeekday]}`
          : `每${interval}周${weekdayNames[recurrenceWeekday]}`;
      }
      return recurrenceValue === 1 ? '每周' : `每${recurrenceValue}周`;

    case 'monthly':
      if (recurrenceDay !== null && recurrenceDay !== undefined) {
        const interval = recurrenceValue || 1;
        return interval === 1
          ? `每月${recurrenceDay}号`
          : `每${interval}月${recurrenceDay}号`;
      }
      return recurrenceValue === 1 ? '每月' : `每${recurrenceValue}月`;

    case 'monthly_nth_weekday':
      if (recurrenceNthWeekday !== null && recurrenceWeekday !== null) {
        const interval = recurrenceValue || 1;
        const description = `${nthWeekdayNames[recurrenceNthWeekday]}${weekdayNames[recurrenceWeekday]}`;
        return interval === 1
          ? `每月${description}`
          : `每${interval}月${description}`;
      }
      return '每月';

    default:
      return '周期性提醒';
  }
}

module.exports = {
  calculateNextReminderDate,
  calculateDailyRecurrence,
  calculateWeeklyRecurrence,
  calculateMonthlyRecurrence,
  calculateMonthlyNthWeekdayRecurrence,
  getNextNthWeekdayOfMonth,
  getRecurrenceDescription
};
