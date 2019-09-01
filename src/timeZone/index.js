const moment = require('moment-timezone');
const {
    UTC,
    LOCAL,
    GREENWICH,
    AM,
    PM,
    TIME_DELIMITER,
    DATE_TIME_DELIMITER,
    DATE_FORMAT_STRING,
    TIME_FORMAT_STRING
} = require('../constants');
const { isUndefinedOrNull } = require('../utility/validation');

const initializeTimeZoneData = (obj) => {
    const thisTimeZoneType = obj.timeZoneType || LOCAL; // default value
    let thisTimeZone; // default value is set below
    if (!obj.timeZone && thisTimeZoneType === UTC) {
        thisTimeZone = GREENWICH;
    } else if (!obj.timeZone) {
        thisTimeZone = moment.tz.guess();
    } else {
        thisTimeZone = obj.timeZone;
    }
    obj.timeZoneType = thisTimeZoneType;
    obj.timeZone = thisTimeZone;
    return {
        timeZoneType: thisTimeZoneType,
        timeZone: thisTimeZone
    };
};

const createTimeZone = ({ timeZone, timeZoneType, date = null, dateString = null, timeString = null }) => {
    const DATE_TIME_FORMAT_STRING = timeString
        ? `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`
        : DATE_FORMAT_STRING;
    const dateTimeString = timeString ? `${dateString}${DATE_TIME_DELIMITER}${timeString}` : dateString;
    let outputDate = date; // default value
    const thisMoment = timeZoneType === LOCAL ? moment.tz : moment.utc;

    // process date
    if (date) {
        outputDate = thisMoment(date, timeZone);
    } else {
        outputDate = thisMoment(dateTimeString, DATE_TIME_FORMAT_STRING, timeZone);
    }
    return outputDate;
};

const convertTimeZone = ({ timeZone, timeZoneType, date, timeString }) => {
    const newDate = date.clone();
    let outputDate = newDate; // default value;
    outputDate = timeZoneType === LOCAL ? newDate.tz(timeZone) : newDate.utc(timeZone);
    const DATE_TIME_FORMAT_STRING = `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`;
    const dateTimeString = outputDate.format(DATE_TIME_FORMAT_STRING); // lowercase the AM/PM
    const [dateString, newTimeString] = dateTimeString.split(DATE_TIME_DELIMITER);
    return {
        date: outputDate,
        weekday: outputDate.day(),
        dateString, // generic dateString information / without time
        timeString: timeString ? newTimeString.toLowerCase() : null // only return timeString if the user intended so (via the timeStart property on the rule which will be passed into this function as timeString)
    };
};

const timeTravel = (danielSan) => {
    const { timeZone, timeZoneType } = danielSan;
    let newTargetTimeStartDate;
    let targetTimeStartObj = {};
    let newTargetTimeEndDate;
    danielSan.events.forEach((event) => {
        newTargetTimeStartDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.eventDateStart,
            timeString: event.timeStart,
            name: event.name
        });
        newTargetTimeEndDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.eventDateStart,
            timeString: event.timeStart,
            name: event.name
        });
        targetTimeStartObj = convertTimeZone({
            timeZone,
            timeZoneType,
            date: newTargetTimeStartDate,
            name: event.name,
            timeString: event.timeStart
        });
        event.timeZoneEventSource = `event source: ${event.timeZone} / ${event.timeZoneType}`; // for future convenience
        event.timeZoneObserverSource = `observer source: ${timeZone} / ${timeZoneType}`; // for future convenience
        event.dateTimeEventSource = newTargetTimeStartDate; // for future convenience, store the full original moment-timezone date from the rule
        event.dateTimeObserverSource = targetTimeStartObj.date; // for future convenience, store the full converted moment-timezone date for the event
        event.timeZone = danielSan.timeZone;
        event.timeZoneType = danielSan.timeZoneType;
        event.eventDateStart = targetTimeStartObj.dateString; // as seen from the observer
        event.timeStart = event.timeStart ? targetTimeStartObj.timeString : null;
        event.weekdayStart = targetTimeStartObj.weekday;
        event.timeEnd = null;
        if (event.timeStart) {
            newTargetTimeEndDate = createTimeZone({
                timeZone: event.timeZone,
                timeZoneType: event.timeZoneType,
                dateString: event.eventDateStart,
                timeString: event.timeStart,
                name: event.name
            });
            let spanningTime = false;
            const targetTimeEndDateClone = targetTimeStartObj.date;
            if (event.spanningMinutes) {
                targetTimeEndDateClone.add(event.spanningMinutes, 'minute');
                spanningTime = true;
            }
            if (event.spanningHours) {
                targetTimeEndDateClone.add(event.spanningHours, 'hour');
                spanningTime = true;
            }
            if (event.spanningDays) {
                targetTimeEndDateClone.add(event.spanningDays, 'day');
                spanningTime = true;
            }
            if (spanningTime) {
                const DATE_TIME_FORMAT_STRING = `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`;
                const dateTimeString = targetTimeEndDateClone.format(DATE_TIME_FORMAT_STRING); // lowercase the AM/PM
                const [dateString, newTimeString] = dateTimeString.split(DATE_TIME_DELIMITER);
                event.eventDateEnd = dateString;
                event.timeEnd = newTimeString.toLowerCase();
                event.weekdayEnd = targetTimeEndDateClone.day();
            }
        }
    });
};

module.exports = {
    initializeTimeZoneData,
    createTimeZone,
    convertTimeZone,
    timeTravel
};
