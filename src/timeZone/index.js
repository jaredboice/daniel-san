const moment = require('moment-timezone');
const { getRelevantDateSegmentByFrequency } = require('../standardEvents/common');
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
    }
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
        dateString, // generic dateString information / without time
        timeString: timeString ? newTimeString.toLowerCase() : null // only return timeString if the user intended so (via the timeStart property on the rule which will be passed into this function as timeString)
    };
};

const timeTravel = (danielSan) => {
    const { timeZone, timeZoneType } = danielSan;
    let newDate;
    let newDataObj = {};
    danielSan.events.forEach((event) => {
        newDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.eventDate,
            timeString: event.timeStart,
            name: event.name
        });

        newDataObj = convertTimeZone({
            timeZone,
            timeZoneType,
            date: newDate,
            name: event.name,
            timeString: event.timeStart
        });
        event.timeZoneSource = `event / ${event.timeZone} / ${event.timeZoneType}`; // for future convenience
        event.timeZoneTarget = `danielSan / ${timeZone} / ${timeZoneType}`; // for future convenience
        event.dateAtSource = newDate; // for future convenience, store the full original moment-timezone date from the rule
        event.dateAtTarget = newDataObj.date; // for future convenience, store the full converted moment-timezone date for the event
        event.eventDate = newDataObj.dateString;
        event.timeStart = event.timeStart ? newDataObj.timeString : null;
        event.timeZone = danielSan.timeZone;
        event.timeZoneType = danielSan.timeZoneType;
        if (isUndefinedOrNull(event.weekday)) {
            event.weekday = newDate.day();
        }
    });
};

module.exports = {
    initializeTimeZoneData,
    createTimeZone,
    convertTimeZone,
    timeTravel
};
