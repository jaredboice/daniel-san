const { isUndefinedOrNull } = require('../utility/validation');
const { isCycleAtModulus, cycleModulusUp } = require('../modulusCycle');
const { errorDisc } = require('../utility/errorHandling');
const {
    DATE_FORMAT_STRING,
    ONCE,
    DAILY,
    WEEKLY,
    MONTHLY,
    ANNUALLY,
    DATE_DELIMITER,
    EXECUTION_REJECTED
} = require('../constants');

/*
    function: getRelevantDateSegmentByFrequency
    description:
        returns the relevant part of the date.
        example:
            for WEEKLY frequency it only needs to return the weekday (as a number 0-6).
            for ANNUAL frequency it returns something like "12-31"


*/
const getRelevantDateSegmentByFrequency = ({ frequency, date }) => {
    const currentDateString = date.format(DATE_FORMAT_STRING);
    const [currentYearString, currentMonthString, currentDayString] = currentDateString.split(DATE_DELIMITER);
    const currentWeekday = date.day();
    switch (frequency) {
        case ANNUALLY:
            return `${currentMonthString}${DATE_DELIMITER}${currentDayString}`;
        case MONTHLY:
            return currentDayString;
        case WEEKLY:
            return currentWeekday;
        case DAILY:
            break;
        case ONCE:
            return `${currentYearString}${DATE_DELIMITER}${currentMonthString}${DATE_DELIMITER}${currentDayString}`;
        default:
            break;
    }
};

// flags a rule that is no longer relevant for active budget-projection calculations
const flagRuleForRetirement = ({ danielSan, rule, date, index }) => {
    try {
        // if dateEnd has been reached, flag the rule for retirement
        const dateString = date.format(DATE_FORMAT_STRING);
        if (
            (!isUndefinedOrNull(rule.dateEnd) && dateString >= rule.dateEnd) ||
            (rule.frequency === ONCE && dateString >= rule.processDate)
        ) {
            danielSan.retiredRuleIndices.push(index);
        }
    } catch (err) {
        throw errorDisc(err, 'error in flagRuleForRetirement()', { date, rule, index });
    }
};

// retires rules that were flagged in flagRuleForRetirement()
const retireRules = ({ danielSan }) => {
    let looper;
    try {
        // retire obsolete rules
        let indexOffset = 0;
        if (danielSan.retiredRuleIndices.length > 0) {
            for (looper = 0; looper < danielSan.retiredRuleIndices.length; looper++) {
                const looperIndex = looper - indexOffset;
                danielSan.rules.splice(danielSan.retiredRuleIndices[looperIndex], 1);
                indexOffset++;
            }
            danielSan.retiredRuleIndices = []; // reset retiredRuleIndices
        }
    } catch (err) {
        throw errorDisc(err, 'error in retireRules()', {
            looper,
            retiredRuleIndices: danielSan.retiredRuleIndices
        });
    }
};

/*
    exclusions: {
        weekdays: [SATURDAY, SUNDAY],
        dates: ['2019-07-04', '2019-09-17', '2019-10-31']
    }
*/
const exclusionsPhase = ({ rule, date, processPhase }) => {
    let transientProcessPhase = processPhase || '';
    if (rule.exclusions) {
        // eslint-disable-next-line no-unused-vars
        let relevantDateSegmentForExclusion;
        let dynamicDateSegmentForExclusion;
        let anyMatch = false;
        if (rule.exclusions.weekdays) {
            relevantDateSegmentForExclusion = date.weekday();
            anyMatch = rule.exclusions.weekdays.some((eventDate) => {
                dynamicDateSegmentForExclusion = eventDate;
                // eslint-disable-next-line eqeqeq
                return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
            });
            if (anyMatch) transientProcessPhase = EXECUTION_REJECTED;
        }
        if (rule.exclusions.dates && transientProcessPhase !== EXECUTION_REJECTED) {
            relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                frequency: ONCE,
                date
            });
            anyMatch = rule.exclusions.dates.some((eventDate) => {
                dynamicDateSegmentForExclusion = eventDate;
                return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
            });
            if (anyMatch) transientProcessPhase = EXECUTION_REJECTED;
        }
    }
    return transientProcessPhase;
};

module.exports = {
    getRelevantDateSegmentByFrequency,
    retireRules,
    flagRuleForRetirement,
    exclusionsPhase
};
