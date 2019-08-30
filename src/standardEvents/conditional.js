const { isUndefinedOrNull } = require('../utility/validation');
const { createTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('./common');
const { MONTHLY } = require('../constants');

// eslint-disable-next-line max-len
// _28DayCondition checks if processDate (such as 30th) is greater than the last day of the month (for example, february has only 28 days)
// eslint-disable-next-line no-underscore-dangle
const _28DayCondition = ({ processDate, date, frequency, timeZone = null, timeZoneType = null }) => {
    if (frequency === MONTHLY && parseInt(processDate, 10) > 28) {
        const dateString = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY, // we are going to compare dates like this '2019-06-28' === '2019-06-31'
            date
        });
        const fullDateOfLastDayOfMonth = createTimeZone({ timeZone, timeZoneType, date }).endOf('month');
        const dateStringOfLastDayOfMonth = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY,
            date: fullDateOfLastDayOfMonth
        });
        if (processDate >= dateStringOfLastDayOfMonth && dateString >= dateStringOfLastDayOfMonth) {
            return true;
            // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
        // eslint-disable-next-line no-else-return
    } else {
        return false;
    }
};

module.exports = {
    _28DayCondition
};
