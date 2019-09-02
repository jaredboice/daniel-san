const moment = require('moment-timezone');
const {
    UTC,
    LOCAL,
    AM,
    PM,
    TIME_DELIMITER,
    DATE_TIME_DELIMITER,
    DATE_FORMAT_STRING,
    TIME_FORMAT_STRING,
    OBSERVER_SOURCE_CONTEXT
} = require('../constants');
const { isUndefinedOrNull } = require('../utility/validation');

const initializeTimeZoneData = (obj) => {
    const thisTimeZoneType = obj.timeZoneType || UTC; // default value
    let thisTimeZone; // default value is set below
    if (!obj.timeZone) {
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
    const thisMoment = timeZoneType === UTC ? moment.utc : moment.tz;

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
    outputDate = timeZoneType === UTC ? newDate.utc(timeZone) : newDate.tz(timeZone);
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
            dateString: event.dateStart,
            timeString: event.timeStart,
        });
        newTargetTimeEndDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.dateStart, // assigning dateStart as default value
            timeString: event.timeStart,
        });
        targetTimeStartObj = convertTimeZone({
            timeZone,
            timeZoneType,
            date: newTargetTimeStartDate,
            timeString: event.timeStart
        });
        event.context = OBSERVER_SOURCE_CONTEXT;
        event.timeZoneEventSource = `${event.timeZone} ${event.timeZoneType}`; // for future convenience
        event.timeZoneObserverSource = `${timeZone} ${timeZoneType}`; // for future convenience
        event.dateTimeStartEventSource = newTargetTimeStartDate; // for future convenience, store the full original moment-timezone date from the rule
        event.dateTimeStartObserverSource = targetTimeStartObj.date; // for future convenience, store the full converted moment-timezone date for the event
        if(event.effectiveDateStart){
            const transientDateObj = createTimeZone({
                timeZone: event.timeZone,
                timeZoneType: event.timeZoneType,
                dateString: event.effectiveDateStart
            });
            const transientDateObjConverted = convertTimeZone({
                timeZone,
                timeZoneType,
                date: transientDateObj
            }); // for future convenience
            event.effectiveDateStart = transientDateObjConverted.date.format(DATE_FORMAT_STRING);
        }
        if(event.effectiveDateEnd){
            const transientDateObj = createTimeZone({
                timeZone: event.timeZone,
                timeZoneType: event.timeZoneType,
                dateString: event.effectiveDateEnd
            });
            const transientDateObjConverted = convertTimeZone({
                timeZone,
                timeZoneType,
                date: transientDateObj
            }); // for future convenience
            event.effectiveDateEnd = transientDateObjConverted.date.format(DATE_FORMAT_STRING);
        }
        if(event.anchorSyncDate){
            const transientDateObj = createTimeZone({
                timeZone: event.timeZone,
                timeZoneType: event.timeZoneType,
                dateString: event.anchorSyncDate
            });
            const transientDateObjConverted = convertTimeZone({
                timeZone,
                timeZoneType,
                date: transientDateObj
            }); // for future convenience
            event.anchorSyncDate = transientDateObjConverted.date.format(DATE_FORMAT_STRING);
        }
        event.timeZone = danielSan.timeZone;
        event.timeZoneType = danielSan.timeZoneType; // this is currently redundant since we are auto-assigning the danielSan value to event 
        // however, if we ever want to change that behavior and add additional options, we'd still want to be sure that this value matches the event output
        event.dateStart = targetTimeStartObj.dateString; // as seen from the observer
        event.timeStart = event.timeStart ? targetTimeStartObj.timeString : null;
        event.weekdayStart = targetTimeStartObj.weekday;
        event.timeEnd = null;
        if (event.timeStart) {
            newTargetTimeEndDate = createTimeZone({
                timeZone: event.timeZone,
                timeZoneType: event.timeZoneType,
                dateString: event.dateStart,
                timeString: event.timeStart,
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
                event.dateEnd = dateString;
                event.timeEnd = newTimeString.toLowerCase();
                event.weekdayEnd = targetTimeEndDateClone.day();
            }
        }
        // delete irrelevant data:
        delete event.specialAdjustments;
        delete event.exclusions;
        delete event.processDate;
        if(typeof event.frequency !== 'string'){
            delete event.frequency;
        }
        // the idea is that we should only provide useful data that makes sense in the context of each event
        // as it may relate to timezone or currency conversion
        // any other information that may be required can be gathered from the original rule (matched via name or custom id property)
    });
};

module.exports = {
    initializeTimeZoneData,
    createTimeZone,
    convertTimeZone,
    timeTravel
};
