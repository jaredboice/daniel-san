const { isUndefinedOrNull } = require('../utility/validation');
const errorDisc = require('../utility/errorHandling');
const { DATE_FORMAT_STRING, ONCE, DAILY, WEEKLY, MONTHLY, ANNUALLY, DATE_DELIMITER } = require('../constants');

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
            break;
        case MONTHLY:
            return currentDayString;
            break;
        case WEEKLY:
            return currentWeekday;
            break;
        case DAILY:
            break;
        case ONCE:
            return `${currentYearString}${DATE_DELIMITER}${currentMonthString}${DATE_DELIMITER}${currentDayString}`;
            break;
    }
};

const flagRuleForRetirement = ({ danielSan, rule, date, index }) => {
    try {
        // if dateEnd has been reached, flag the rule for retirement
        if (!isUndefinedOrNull(rule.dateEnd) && date.format(DATE_FORMAT_STRING) >= rule.dateEnd) {
            danielSan.cashflowRetiredRuleIndices.push(index);
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
        if (danielSan.cashflowRetiredRuleIndices.length > 0) {
            for (looper = 0; looper < danielSan.cashflowRetiredRuleIndices.length; looper++) {
                const looperIndex = looper - indexOffset;
                danielSan.rules.splice(danielSan.cashflowRetiredRuleIndices[looperIndex], 1);
                indexOffset++;
            }
            danielSan.cashflowRetiredRuleIndices = [];
        }
    } catch (err) {
        throw errorDisc(err, 'error in retireRules()', {
            looper,
            cashflowRetiredRuleIndices: danielSan.cashflowRetiredRuleIndices
        });
    }
};

module.exports = {
    getRelevantDateSegmentByFrequency,
    retireRules,
    flagRuleForRetirement
};
