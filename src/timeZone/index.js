const moment = require('moment-timezone');
const { errorDisc } = require('../utility/errorHandling');
const { generateTimeSpan } = require('../core/eventGeneration');
const {
    UTC,
    DATE_TIME_DELIMITER,
    DATE_FORMAT_STRING,
    TIME_FORMAT_STRING,
    OBSERVER_SOURCE
} = require('../constants');

const initializeTimeZoneData = (obj) => {
    try {
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
    } catch (err) {
        throw errorDisc({ err, data: { obj } });
    }
};

/* TODO: for some reason, npm was throwing the following warning when attempting
    to require createTimeZone from the timeZone directory, so it had to be redefined in core/eventGeneration:

    warning message as follows:

    Warning: Accessing non-existent property 'createTimeZone' of module exports inside circular dependency
*/
const createTimeZone = ({ timeZone, timeZoneType, date = null, dateString = null, timeString = null }) => {
    try {
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
    } catch (err) {
        throw errorDisc({ err, data: { date, timeZone, timeZoneType, dateString, timeString } });
    }
};

const convertTimeZone = ({ timeZone, timeZoneType, date, timeString }) => {
    try {
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
            timeString: timeString ? newTimeString.toLowerCase() : null // only return timeString if the user intended so (via setting the timeStart property on the rule which will be passed as timeString into this function)
        };
    } catch (err) {
        throw errorDisc({ err, data: { date, timeZone, timeZoneType, timeString } });
    }
};

const timeTravel = (danielSan) => {
    const { config: { timeZone, timeZoneType } } = danielSan;
    let eventTracker; // for errorDisc
    let targetTimeStartObj = {};
    try {
        danielSan.events.forEach((event) => {
            eventTracker = event;
            targetTimeStartObj = convertTimeZone({
                timeZone,
                timeZoneType,
                date: event.dateTimeStartEventSource,
                timeString: event.timeStart
            });
            event.context = OBSERVER_SOURCE; // simply so the user understands the context
            event.eventSourceTimeZoneType = timeZoneType; // for future convenience
            event.eventSourceTimeZone = timeZone; // for future convenience
            event.dateTimeStartObserverSource = targetTimeStartObj.date; // for future convenience, store the full converted moment-timezone date for the event
            if (event.effectiveDateStart) {
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
            if (event.effectiveDateEnd) {
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
            if (event.anchorSyncDate) {
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
            
            event.dateStart = targetTimeStartObj.dateString; // as seen from the observer
            event.timeStart = event.timeStart ? targetTimeStartObj.timeString : null;
            generateTimeSpan({ event, date: targetTimeStartObj.date, weekday: targetTimeStartObj.weekday });
        });
    } catch (err) {
        throw errorDisc({
            err,
            data: { timeZone, timeZoneType, event: eventTracker, targetTimeStartObj }
        });
    }
};

module.exports = {
    initializeTimeZoneData,
    createTimeZone,
    convertTimeZone,
    timeTravel
};
