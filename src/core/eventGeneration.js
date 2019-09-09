let { createTimeZone } = require('../timeZone');
const {
    DATE_FORMAT_STRING,
    MODIFIED,
    DATE_TIME_DELIMITER,
    TIME_FORMAT_STRING,
    COMPOUND_DATA_DELIMITER
} = require('../constants');

const generateTimeSpan = ({ event, date, weekday }) => {
    event.weekdayStart = weekday;
    event.timeEnd = null;
    if (event.timeStart) {
        let spanningTime = false;
        const targetTimeEndDateClone = date;
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
};

const redefineTimeStartAndTimeSpan = ({ event, skipTimeTravel = null }) => {
    if (!createTimeZone) {
        // TODO: check to see why this function was undefined at runtime
        createTimeZone = require('../timeZone').createTimeZone; // eslint-disable-line global-require
    }
    const newTargetTimeStartDate = createTimeZone({
        timeZone: event.timeZone,
        timeZoneType: event.timeZoneType,
        dateString: event.dateStart,
        timeString: event.timeStart
    });
    event.dateTimeStartEventSource = newTargetTimeStartDate; // for future convenience, store the full original moment-timezone date from the rule
    event.dateTimeStartObserverSource = newTargetTimeStartDate; // default value (in the event that timeTravel does not execute)
    // note: perform the following only if skipTimeTravel is true since it would otherwise execute the same pattern with converted values
    // define timeStart
    // then define dateEnd / timeEnd IF there is a timeStart
    if (skipTimeTravel) {
        if (event.timeStart) {
            const DATE_TIME_FORMAT_STRING = `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`;
            const dateTimeString = newTargetTimeStartDate.format(DATE_TIME_FORMAT_STRING); // lowercase the AM/PM
            const [dateString, newTimeString] = dateTimeString.split(DATE_TIME_DELIMITER);
            event.timeStart = newTimeString;
        } else {
            event.timeStart = null;
        }
        generateTimeSpan({ event, date: newTargetTimeStartDate, weekday: newTargetTimeStartDate.day() });
    }
};

/*
    function: generateEvent
    description:
        when a rule satisfies all of its conditions, the rule gets imprinted as an event in this function

*/
const generateEvent = ({ danielSan, rule, date, skipTimeTravel = null }) => {
    const newEvent = { ...rule };
    // define dateStart
    newEvent.dateStart = date.format(DATE_FORMAT_STRING);
    // whether or not we timeTravel, the output timeZone is always assumed to be from OBSERVER_SOURCE
    newEvent.timeZone = danielSan.timeZone;
    newEvent.timeZoneType = danielSan.timeZoneType; // this is currently redundant since we are auto-assigning the danielSan value to event???
    // however, if we ever want to change that behavior and add additional options, we'd still want to be sure that this value matches the event output???
    newEvent.timeZoneEventSource = `${newEvent.timeZone}${COMPOUND_DATA_DELIMITER}${newEvent.timeZoneType}`; // for future convenience
    newEvent.timeZoneObserverSource = `${danielSan.timeZone}${COMPOUND_DATA_DELIMITER}${danielSan.timeZoneType}`; // default value and for future convenience
    // related code block
    redefineTimeStartAndTimeSpan({ event: newEvent, skipTimeTravel });
    danielSan.events.push({ ...newEvent });
    const processPhase = MODIFIED;
    return processPhase;
};

module.exports = {
    redefineTimeStartAndTimeSpan,
    generateTimeSpan,
    generateEvent
};

