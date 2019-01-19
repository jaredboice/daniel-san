const { isUndefinedOrNull } = require('../utility/validation');
const errorDisc = require('../utility/errorHandling');
const appConstants = require('../constants');
const { DATE_FORMAT_STRING, ONCE, DAILY, WEEKLY, MONTHLY, ANNUALLY, DATE_DELIMITER } = appConstants;

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

const flagCashflowRuleForRetirement = ({ danielSan, cashflowRule, date, index }) => {
    try {
        // if dateEnd has been reached, flag the rule for retirement
        if (!isUndefinedOrNull(cashflowRule.dateEnd) && date.format(DATE_FORMAT_STRING) >= cashflowRule.dateEnd) {
            danielSan.cashflowRetiredRuleIndices.push(index);
        }
    } catch (err) {
        throw errorDisc(err, 'error in flagCashflowRuleForRetirement()', { date, cashflowRule, index });
    }
};

const retireCashflowRules = ({ danielSan }) => {
    let looper;
    try {
        // retire obsolete cashflowRules
        let indexOffset = 0;
        if (danielSan.cashflowRetiredRuleIndices.length > 0) {
            for (looper = 0; looper < danielSan.cashflowRetiredRuleIndices.length; looper++) {
                const looperIndex = looper - indexOffset;
                danielSan.cashflowRules.splice(danielSan.cashflowRetiredRuleIndices[looperIndex], 1);
                indexOffset++;
            }
            danielSan.cashflowRetiredRuleIndices = [];
        }
    } catch (err) {
        throw errorDisc(err, 'error in retireCashflowRules()', { looper, cashflowRetiredRuleIndices: danielSan.cashflowRetiredRuleIndices });
    }
};

module.exports = {
    getRelevantDateSegmentByFrequency,
    retireCashflowRules,
    flagCashflowRuleForRetirement
};
