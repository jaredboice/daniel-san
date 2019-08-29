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

const createTimeZone = ({ timeZone, timeZoneType, date = null, dateString = null, timeString = null }) => {
    const DATE_TIME_FORMAT_STRING = timeString
        ? `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`
        : DATE_FORMAT_STRING;
    const dateTimeString = timeString ? `${dateString}${DATE_TIME_DELIMITER}${timeString}` : dateString;
    let outputDate = date; // default value
    const thisTimeZoneType = timeZoneType || LOCAL; // default value
    let thisTimeZone; // default value is set below
    if (!timeZone && thisTimeZoneType === UTC) {
        thisTimeZone = GREENWICH;
    } else if (!timeZone) {
        thisTimeZone = moment.tz.guess();
    } else {
        thisTimeZone = timeZone;
    }
    const thisMoment = thisTimeZoneType === LOCAL ? moment.tz : moment.utc;

    // process date
    if (date) {
        outputDate = thisMoment(date, thisTimeZone);
    } else {
        outputDate = thisMoment(dateTimeString, DATE_TIME_FORMAT_STRING, thisTimeZone);
    }
    return outputDate;
};

const convertTimeZone = ({ timeZone, timeZoneType, date, timeString }) => {
    const newDate = date.clone();
    let outputDate = newDate; // default value;
    if (newDate && timeString && typeof timeString === 'string') {
        const [preHours, preMinutes] = timeString.split(TIME_DELIMITER);
        const hours = parseInt(preHours, 10);
        const minutes = parseInt(preMinutes.slice(0, 2), 10);
        const dayOrNight = preMinutes.slice(2, 4);
        let militaryHours = hours; // default value
        const militaryMinutes = minutes; // default value
        if (dayOrNight === AM) {
            if (hours === 12) {
                militaryHours = 0;
            } else {
                militaryHours = hours;
            }
        } else if (dayOrNight === PM) {
            if (hours === 12) {
                militaryHours = 12;
            } else {
                militaryHours = hours + 12;
            }
        }
        newDate.set({ h: militaryHours, m: militaryMinutes });
    }
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
    let newDataObj;
    danielSan.events.forEach((event) => {
        newDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.eventDate,
            timeString: event.timeStart,
            name: event.name
        });

        newDataObj = convertTimeZone({ timeZone, timeZoneType, date: newDate, name: event.name, timeString: true, eventTrue: true });
        event.momentTzDateSource = newDate; // for future convenience, store the full original moment-timezone date from the rule
        event.momentTzDateTarget = newDataObj.date; // for future convenience, store the full converted moment-timezone date for the event
        event.eventDate = newDataObj.dateString;
        event.timeStart = event.timeStart ? newDataObj.timeString : null;
        event.timeZone = danielSan.timeZone;
        event.timeZoneType = danielSan.timeZoneType;
    });
};

module.exports = {
    createTimeZone,
    convertTimeZone,
    timeTravel
};
