const { errorDisc } = require('../utility/errorHandling');
const { createTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const { MONTHLY, ANNUALLY, ONCE, DATE_DELIMITER } = require('../constants');

const getRelevantDateStringFor28DayCondition = ({ frequency, processDate, date }) => {
    let parsedDate = 0; // will autofail the test if 0 is not reassigned, since 0 can never be greater than 28
    const fullCurrentYearString = getRelevantDateSegmentByFrequency({ frequency: ONCE, date });
    const [year, month, day] = fullCurrentYearString.split(DATE_DELIMITER);
    switch (frequency) {
    case MONTHLY:
        parsedDate = processDate;
        break;
    case ANNUALLY:
        const [eventMonthAnnually, eventDayAnnually] = processDate.split(DATE_DELIMITER);
        if (eventMonthAnnually === month) {
            parsedDate = eventDayAnnually;
        }
        break;
    case ONCE:
        const [eventYearOnce, eventMonthOnce, eventDayOnce] = processDate.split(DATE_DELIMITER);
        if (eventYearOnce === year && eventMonthOnce === month) {
            parsedDate = eventDayOnce;
        }
        break;
    default:
        parsedDate = processDate;
        break;
    }
    return parsedDate;
};

const parseDateFor28DayCondition = ({ frequency, processDate }) => {
    let parsedDate;
    switch (frequency) {
    case MONTHLY:
        parsedDate = parseInt(processDate, 10);
        break;
    case ANNUALLY:
        parsedDate = parseInt(processDate.split(DATE_DELIMITER)[1], 10);
        break;
    case ONCE:
        parsedDate = parseInt(processDate.split(DATE_DELIMITER)[2], 10);
        break;
    default:
        parsedDate = 0; // if not one of the above cases, then the 28DayCondition definitely isn't valid and an assigned value of 0 will never be greater than 28 so it will autofail
        break;
    }
    return parsedDate;
};

// eslint-disable-next-line max-len
// _28DayCondition checks if processDate (such as 30th) is greater than the last day of the month (for example, february has only 28 days)
// eslint-disable-next-line no-underscore-dangle
const _28DayCondition = ({ processDate, date, frequency, timeZone = null, timeZoneType = null }) => {
    try {
        if (parseDateFor28DayCondition({ frequency, processDate }) > 28) {
            const dateString = getRelevantDateSegmentByFrequency({
                frequency: MONTHLY, // we are going to compare dates like this '31' >= '28'
                date
            });
            const fullDateOfLastDayOfMonth = createTimeZone({ timeZone, timeZoneType, date }).endOf('month');
            const dateStringOfLastDayOfMonth = getRelevantDateSegmentByFrequency({
                frequency: MONTHLY,
                date: fullDateOfLastDayOfMonth
            });
            if (
                getRelevantDateStringFor28DayCondition({ frequency, processDate, date }) >= dateStringOfLastDayOfMonth &&
                dateString >= dateStringOfLastDayOfMonth
            ) {
                return true;
                // eslint-disable-next-line no-else-return
            } else {
                return false;
            }
            // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    } catch (err) {
        throw errorDisc({ err, data: { date, frequency, timeZone, timeZoneType, processDate } });
    }
};

module.exports = {
    _28DayCondition
};
