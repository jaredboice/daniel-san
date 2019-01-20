const moment = require('moment');
const { isUndefinedOrNull } = require('../utility/validation');
const { isCycleAtModulus, cycleModulusUp } = require('../modulusCycle');
const { getRelevantDateSegmentByFrequency } = require('../standardOperations/common');
const {
    DATE_DELIMITER,
    DATE_FORMAT_STRING,
    STANDARD_OPERATION,
    NTH_WEEKDAYS_OF_MONTH,
    WEEKDAY_ON_DATE,
    MOVE_THIS_PARTICULAR_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    VOID_AMOUNT_ON_THIS_PARTICULAR_DATE,
    ADJUST_AMOUNT_ON_THESE_PARTICULAR_DATES,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAILY,
    ONCE,
    SUNDAY_NUM,
    MONDAY_NUM,
    TUESDAY_NUM,
    WEDNESDAY_NUM,
    THURSDAY_NUM,
    FRIDAY_NUM,
    SATURDAY_NUM,
    DISCOVERING_OPERATION_TYPE,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    EXECUTION_REJECTED,
    MODIFIED
} = require('../constants');

// eslint-disable-next-line max-len
// _28DayCondition checks if processDate (such as 30th) is greater than the last day of the month (for example, february has only 28 days)
// eslint-disable-next-line no-underscore-dangle
const _28DayCondition = ({ processDate, date, frequency }) => {
    if (frequency === MONTHLY && parseInt(processDate, 10) > 28) {
        const dateString = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY, // we are going to compare dates like this '2019-06-28' === '2019-06-31'
            date
        });
        const fullDateOfLastDayOfMonth = moment(date)
            .endOf('month');
        const dateStringOfLastDayOfMonth = getRelevantDateSegmentByFrequency({ frequency: MONTHLY, date: fullDateOfLastDayOfMonth });
        if (processDate >= dateStringOfLastDayOfMonth && dateString >= dateStringOfLastDayOfMonth) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

const buildStandardCashflowOperation = ({ danielSan, cashflowRule, date, index }) => {
    let processPhase;
    try {
        processPhase = EVALUATING_RULE_INSERTION;
        if (isUndefinedOrNull(cashflowRule.dateStart) || cashflowRule.dateStart <= date.format(DATE_FORMAT_STRING)) {
            const relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                frequency: cashflowRule.frequency,
                date
            });
            if (
                cashflowRule.frequency === DAILY ||
                isUndefinedOrNull(cashflowRule.processDate) ||
                (cashflowRule.processDate === relevantDateSegmentByFrequency ||
                    _28DayCondition({ processDate: cashflowRule.processDate, date, frequency: cashflowRule.frequency })) // TODO: place this 2nd condition in a function and create special case for after the 28th and also a special case for last day of month
            ) {
                // if there are modulus/cycle attributes, then perform the modulus operation type
                if (cashflowRule.excluding) {
                    // eslint-disable-next-line no-unused-vars
                    let relevantDateSegmentForExclusion;
                    let dynamicDateSegmentForExclusion;
                    let anyMatch = false;
                    if (cashflowRule.excluding.weekdays) {
                        relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                            frequency: WEEKLY,
                            date
                        });
                        anyMatch = cashflowRule.excluding.weekdays.some((thisDate) => {
                            dynamicDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                                frequency: WEEKLY,
                                date: moment(thisDate, DATE_FORMAT_STRING)
                            });
                            return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                    if (cashflowRule.excluding.dates) {
                        relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                            frequency: MONTHLY,
                            date
                        });
                        anyMatch = cashflowRule.excluding.dates.some((thisDate) => {
                            dynamicDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                                frequency: MONTHLY,
                                date: moment(thisDate, DATE_FORMAT_STRING)
                            });
                            return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                    if (cashflowRule.excluding.exactDates) {
                        relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                            frequency: ONCE,
                            date
                        });
                        anyMatch = cashflowRule.excluding.weekdays.some((thisDate) => {
                            dynamicDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                                frequency: ONCE,
                                date: moment(thisDate, DATE_FORMAT_STRING)
                            });
                            return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                }
                if (cashflowRule.modulus) {
                    if (isCycleAtModulus(cashflowRule) && processPhase !== EXECUTION_REJECTED) {
                        processPhase = EXECUTING_RULE_INSERTION;
                    }
                    cycleModulusUp(cashflowRule);
                } else if (processPhase !== EXECUTION_REJECTED) {
                    processPhase = EXECUTING_RULE_INSERTION;
                }
                if (processPhase === EXECUTING_RULE_INSERTION) {
                    cashflowRule.thisDate = date.format(DATE_FORMAT_STRING);
                    danielSan.cashflowOperations.push({ ...cashflowRule });
                    processPhase = MODIFIED;
                }
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in buildStandardCashflowOperation()', { date, processPhase, cashflowRule });
    }
};

module.exports = { buildStandardCashflowOperation };
