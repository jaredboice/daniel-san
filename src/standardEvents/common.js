const moment = 'moment';
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
    EXECUTING_RULE_INSERTION,
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

// flags rule that is no longer relevant for active budget-projection calculations
const flagRuleForRetirement = ({ danielSan, rule, date, index }) => {
    try {
        // if dateEnd has been reached, flag the rule for retirement
        if (!isUndefinedOrNull(rule.dateEnd) && date.format(DATE_FORMAT_STRING) >= rule.dateEnd) {
            danielSan.retiredRuleIndices.push(index);
        }
    } catch (err) {
        throw errorDisc(err, 'error in flagRuleForRetirement()', { date, rule, index });
    }
};

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

// eslint-disable-next-line max-len
// _28DayCondition checks if processDate (such as 30th) is greater than the last day of the month (for example, february has only 28 days)
// eslint-disable-next-line no-underscore-dangle
const _28DayCondition = ({ processDate, date, frequency }) => {
    if (frequency === MONTHLY && parseInt(processDate, 10) > 28) {
        const dateString = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY, // we are going to compare dates like this '2019-06-28' === '2019-06-31'
            date
        });
        const fullDateOfLastDayOfMonth = moment(date).endOf('month');
        const dateStringOfLastDayOfMonth = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY,
            date: fullDateOfLastDayOfMonth
        });
        if (processDate >= dateStringOfLastDayOfMonth && dateString >= dateStringOfLastDayOfMonth) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

const modulusPhase = ({ rule, processPhase }) => {
    // if there are modulus/cycle attributes, then execute them
    let transientProcessPhase = processPhase || '';
    if (rule.modulus) {
        if (isCycleAtModulus(rule) && transientProcessPhase !== EXECUTION_REJECTED) {
            transientProcessPhase = EXECUTING_RULE_INSERTION;
        }
        cycleModulusUp(rule);
    } else if (transientProcessPhase !== EXECUTION_REJECTED) {
        transientProcessPhase = EXECUTING_RULE_INSERTION;
    }
    return transientProcessPhase;
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
    _28DayCondition,
    modulusPhase,
    exclusionsPhase
};
