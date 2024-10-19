const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { createTimeZone, convertTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('./dateUtility');
const { findIrrelevantRules } = require('../analytics');
const {
    EVENT_SOURCE,
    OBSERVER_SOURCE,
    BOTH,
    DATE_FORMAT_STRING,
    EXECUTION_REJECTED,
    ONCE
} = require('../constants');

// flags a rule that is no longer relevant for active budget-projection calculations
const flagRuleForRetirement = ({ danielSan, rule, date, index }) => {
    try {
        // if effectiveDateEnd has been reached, flag the rule for retirement
        const dateString = date.format(DATE_FORMAT_STRING);
        if (
            (!isUndefinedOrNull(rule.effectiveDateEnd) && dateString >= rule.effectiveDateEnd) ||
            (rule.frequency === ONCE && typeof rule.processDate === 'string' && dateString >= rule.processDate)
        ) {
            danielSan.retiredRuleIndices.push(index);
        }
    } catch (err) {
        throw errorDisc({ err, data: { rule, date, index } });
    }
};

// retires rules that were flagged in flagRuleForRetirement()
const retireRules = (danielSan) => {
    let looper;
    try {
        // retire obsolete rules
        if (danielSan.retiredRuleIndices.length > 0) {
            // optimize later - but this works
            const newRules = [];
            danielSan.rules.forEach((rule, index) => {
                if(!danielSan.retiredRuleIndices.includes(index)){
                    newRules.push(rule);
                }
            });
            danielSan.rules = [...newRules];
            danielSan.retiredRuleIndices = []; // reset retiredRuleIndices
        }
    } catch (err) {
        throw errorDisc({ err, data: { retiredRuleIndices: danielSan.retiredRuleIndices, looper } });
    }
};

// returns/removes rules that have no chance ot being included into a projected event
const seekAndDestroyIrrelevantRules = (danielSan) => {
    const { relevantRules, irrelevantRules } = findIrrelevantRules(danielSan);
    danielSan.rules = relevantRules; // remove irrelevantRules from the danielSan reference
    return irrelevantRules; // return irrelevantRules if needed
};

const deleteIrrelevantRules = (danielSan) => {
    try {
        const irrelevantRules = seekAndDestroyIrrelevantRules(danielSan);
        danielSan.irrelevantRules = irrelevantRules;
    } catch (err) {
        throw errorDisc({ err });
    }
};

const discardEventsOutsideDateRange = (danielSan) => {
    const { config: { effectiveDateStart, timeStart, effectiveDateEnd, timeEnd, timeZone, timeZoneType } } = danielSan;
    const eventsToDiscard = [];
    const newEventList = [];
    danielSan.events.forEach((event) => {
        const dateToStart = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateStart,
            timeString: timeStart
        });
        const eventDateStart = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: event.dateStart,
            timeString: event.timeStart
        });
        const dateToEnd = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateEnd,
            timeString: timeEnd || timeStart
        });
        if (eventDateStart.isBefore(dateToStart) || eventDateStart.isAfter(dateToEnd)) {
            eventsToDiscard.push(event);
        } else {
            newEventList.push(event);
        }
    });
    danielSan.discardedEvents = eventsToDiscard;
    // we only need to re-reference danielSan.events if we are discarding anything
    if (eventsToDiscard.length > 0) {
        danielSan.events = newEventList;
    }
};

/*
    exclusions: {
        weekdays: [SATURDAY, SUNDAY],
        dates: ['2019-07-04', '2019-09-17', '2019-10-31']
    }
*/
const exclusionsPhase = ({ danielSan, rule, date, processPhase }) => {
    let transientProcessPhase;
    try {
        transientProcessPhase = processPhase || '';
        if (rule.exclusions) {
            // eslint-disable-next-line no-unused-vars
            let relevantDateSegmentForExclusion;
            let dynamicDateSegmentForExclusion;
            let anyMatch = false;
            if (rule.exclusions.weekdays) {
                if (
                    isUndefinedOrNull(rule.exclusions.context) ||
                    rule.exclusions.context === EVENT_SOURCE ||
                    rule.exclusions.context === BOTH
                ) {
                    relevantDateSegmentForExclusion = date.day();
                    anyMatch = rule.exclusions.weekdays.some((eventDate) => {
                        dynamicDateSegmentForExclusion = eventDate;
                        // eslint-disable-next-line eqeqeq
                        return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                    });
                } else if (rule.exclusions.context === OBSERVER_SOURCE || rule.exclusions.context === BOTH) {
                    const convertedDate = convertTimeZone({
                        timeZone: danielSan.config.timeZone,
                        timeZoneType: danielSan.config.timeZoneType,
                        date
                    });
                    relevantDateSegmentForExclusion = convertedDate.day();
                    anyMatch = rule.exclusions.weekdays.some((eventDate) => {
                        dynamicDateSegmentForExclusion = eventDate;
                        // eslint-disable-next-line eqeqeq
                        return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                    });
                }
                if (anyMatch) transientProcessPhase = EXECUTION_REJECTED;
            }
            if (rule.exclusions.dates && transientProcessPhase !== EXECUTION_REJECTED) {
                if (
                    isUndefinedOrNull(rule.exclusions.context) ||
                    rule.exclusions.context === EVENT_SOURCE ||
                    rule.exclusions.context === BOTH
                ) {
                    relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                        frequency: ONCE,
                        date
                    });
                    anyMatch = rule.exclusions.dates.some((eventDate) => {
                        dynamicDateSegmentForExclusion = eventDate;
                        return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                    });
                } else if (rule.exclusions.context === OBSERVER_SOURCE || rule.exclusions.context === BOTH) {
                    const convertedDate = convertTimeZone({
                        timeZone: danielSan.config.timeZone,
                        timeZoneType: danielSan.config.timeZoneType,
                        date
                    });
                    relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                        frequency: ONCE,
                        date: convertedDate
                    });
                    anyMatch = rule.exclusions.dates.some((eventDate) => {
                        dynamicDateSegmentForExclusion = eventDate;
                        return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                    });
                }
                if (anyMatch) transientProcessPhase = EXECUTION_REJECTED;
            }
        }
        return transientProcessPhase;
    } catch (err) {
        throw errorDisc({ err, data: { rule, date, processPhase, transientProcessPhase } });
    }
};

module.exports = {
    flagRuleForRetirement, retireRules, seekAndDestroyIrrelevantRules, deleteIrrelevantRules, discardEventsOutsideDateRange, exclusionsPhase
};
