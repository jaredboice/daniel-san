const { createTimeZone } = require('../timeZone');
const { streamForward } = require('../timeStream');
const { modulateCycleUp } = require('./index.js');
const { buildStandardEvent } = require('../standardEvents');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('../specialEvents');
const {
    DATE_FORMAT_STRING,
    DAILY,
    STANDARD_EVENT,
    STANDARD_EVENT_REMINDER,
    STANDARD_EVENT_ROUTINE,
    NTH_WEEKDAYS_OF_MONTH,
    NTH_WEEKDAYS_OF_MONTH_REMINDER,
    NTH_WEEKDAYS_OF_MONTH_ROUTINE,
    WEEKDAY_ON_DATE,
    WEEKDAY_ON_DATE_REMINDER,
    WEEKDAY_ON_DATE_ROUTINE
} = require('../constants');

const modulateCycleUpToDate = ({ danielSan, rule, effectiveDateStartString, skipTimeTravel }) => {
    let looperDate = createTimeZone({
        timeZone: rule.timeZone,
        timeZoneType: rule.timeZoneType,
        dateString: rule.anchorSyncDate
    });
    let looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
    switch (rule.type) {
    case STANDARD_EVENT:
    case STANDARD_EVENT_ROUTINE:
    case STANDARD_EVENT_REMINDER:
        if (rule.frequency === DAILY) {
            while (looperDateFormatted < effectiveDateStartString) {
                modulateCycleUp(rule);
                looperDate = streamForward(looperDate);
                looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
            }
        } else {
            while (looperDateFormatted < effectiveDateStartString) {
                buildStandardEvent({ danielSan, rule, date: looperDate, skipTimeTravel, eventGen: false });
                looperDate = streamForward(looperDate);
                looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
            }
        }
        break;
    case NTH_WEEKDAYS_OF_MONTH:
    case NTH_WEEKDAYS_OF_MONTH_ROUTINE:
    case NTH_WEEKDAYS_OF_MONTH_REMINDER:
        while (looperDateFormatted < effectiveDateStartString) {
            nthWeekdaysOfMonth({ danielSan, rule, date: looperDate, skipTimeTravel, eventGen: false });
            looperDate = streamForward(looperDate);
            looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
        }
        break;
    case WEEKDAY_ON_DATE:
    case WEEKDAY_ON_DATE_ROUTINE:
    case WEEKDAY_ON_DATE_REMINDER:
        while (looperDateFormatted < effectiveDateStartString) {
            weekdayOnDate({ danielSan, rule, date: looperDate, skipTimeTravel, eventGen: false });
            looperDate = streamForward(looperDate);
            looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
        }
        break;
    default:
        break;
    }
};

module.exports = {
    modulateCycleUpToDate
};
