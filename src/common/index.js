const { isUndefinedOrNull } = require('../utility/validation');
let { createTimeZone } = require('../timeZone');
const { errorDisc } = require('../utility/errorHandling');
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

/*
    function: generateEvent
    description:
        when a rule satisfies all of its conditions, the rule gets imprinted as an event in this function

*/
const generateEvent = ({ danielSan, rule, date, skipTimeTravel = null }) => {
    const { timeZone, timeZoneType } = danielSan;
    const newEvent = { ...rule };
    // the idea is that we should only provide useful data that makes sense in the context of each event
    // as it may relate to timezone or currency conversion
    // any other information that may be required can be gathered from the original rule (matched via name or custom id property)
    delete newEvent.specialAdjustments;
    delete newEvent.exclusions;
    delete newEvent.processDate;
    if (typeof newEvent.frequency !== 'string') {
        delete newEvent.frequency;
    }
    // define dateStart
    newEvent.dateStart = date.format(DATE_FORMAT_STRING);
    // whether or not we timeTravel, the output timeZone is always assumed to be from OBSERVER_SOURCE
    newEvent.timeZone = danielSan.timeZone;
    newEvent.timeZoneType = danielSan.timeZoneType; // this is currently redundant since we are auto-assigning the danielSan value to event???
    // however, if we ever want to change that behavior and add additional options, we'd still want to be sure that this value matches the event output???
    if (!createTimeZone) {
        // TODO: check to see why this function was undefined at runtime
        createTimeZone = require('../timeZone').createTimeZone;
    }
    const newTargetTimeStartDate = createTimeZone({
        timeZone: newEvent.timeZone,
        timeZoneType: newEvent.timeZoneType,
        dateString: newEvent.dateStart,
        timeString: newEvent.timeStart
    });
    newEvent.timeZoneEventSource = `${newEvent.timeZone}${COMPOUND_DATA_DELIMITER}${newEvent.timeZoneType}`; // for future convenience
    newEvent.dateTimeStartEventSource = newTargetTimeStartDate; // for future convenience, store the full original moment-timezone date from the rule
    // note: perform the following only if skipTimeTravel is true since it would otherwise execute the same pattern with converted values
    // define timeStart
    // then define dateEnd / timeEnd IF there is a timeStart
    if (skipTimeTravel) {
        if (newEvent.timeStart) {
            const DATE_TIME_FORMAT_STRING = `${DATE_FORMAT_STRING}${DATE_TIME_DELIMITER}${TIME_FORMAT_STRING}`;
            const dateTimeString = newTargetTimeStartDate.format(DATE_TIME_FORMAT_STRING); // lowercase the AM/PM
            const [dateString, newTimeString] = dateTimeString.split(DATE_TIME_DELIMITER);
            newEvent.timeStart = newTimeString;
        } else {
            newEvent.timeStart = null;
        }
        generateTimeSpan({ event: newEvent, date: newTargetTimeStartDate, weekday: newTargetTimeStartDate.day() });
    }
    danielSan.events.push({ ...newEvent });
    const processPhase = MODIFIED;
    return processPhase;
};

module.exports = {
    generateTimeSpan,
    generateEvent
};
