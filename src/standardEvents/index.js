const moment = require('moment');
const { isUndefinedOrNull } = require('../utility/validation');
const { isCycleAtModulus, cycleModulusUp } = require('../modulusCycle');
const { getRelevantDateSegmentByFrequency } = require('../standardEvents/common');
const {
    DATE_DELIMITER,
    DATE_FORMAT_STRING,
    STANDARD_EVENT,
    NTH_WEEKDAYS_OF_MONTH,
    WEEKDAY_ON_DATE,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    VOID_AMOUNT_ON_THIS_PARTICULAR_DATE,
    ADJUST_AMOUNT_ON_THESE_DATES,
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
    DISCOVERING_EVENT_TYPE,
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

const buildStandardEvent = ({ danielSan, rule, date, index }) => {
    let processPhase;
    try {
        processPhase = EVALUATING_RULE_INSERTION;
        if (isUndefinedOrNull(rule.dateStart) || rule.dateStart <= date.format(DATE_FORMAT_STRING)) {
            const relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                frequency: rule.frequency,
                date
            });
            if (
                rule.frequency === DAILY ||
                isUndefinedOrNull(rule.processDate) ||
                (rule.processDate === relevantDateSegmentByFrequency ||
                    _28DayCondition({ processDate: rule.processDate, date, frequency: rule.frequency })) // TODO: place this 2nd condition in a function and create special case for after the 28th and also a special case for last day of month
            ) {
                /*
                    excluding: {
                        weekdays: [SATURDAY_NUM, SUNDAY_NUM],
                        dates: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                        exactDates: ['2019-07-04', '2019-09-17', '2019-10-31']
                    }
                */
                // TODO: abstract this exluding section more
                if (rule.excluding) {
                    // eslint-disable-next-line no-unused-vars
                    let relevantDateSegmentForExclusion;
                    let dynamicDateSegmentForExclusion;
                    let anyMatch = false;
                    if (rule.excluding.weekdays) {
                        relevantDateSegmentForExclusion = date.weekday();
                        anyMatch = rule.excluding.weekdays.some((thisDate) => {
                            dynamicDateSegmentForExclusion = thisDate;
                            // eslint-disable-next-line eqeqeq
                            return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                    if (rule.excluding.dates && processPhase !== EXECUTION_REJECTED) {
                        relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                            frequency: MONTHLY,
                            date
                        });
                        anyMatch = rule.excluding.dates.some((thisDate) => {
                            dynamicDateSegmentForExclusion = thisDate;
                            return (
                                dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion ||
                                _28DayCondition({
                                    processDate: dynamicDateSegmentForExclusion,
                                    date,
                                    frequency: MONTHLY
                                })
                            );
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                    if (rule.excluding.exactDates && processPhase !== EXECUTION_REJECTED) {
                        relevantDateSegmentForExclusion = getRelevantDateSegmentByFrequency({
                            frequency: ONCE,
                            date
                        });
                        anyMatch = rule.excluding.exactDates.some((thisDate) => {
                            dynamicDateSegmentForExclusion = thisDate;
                            return dynamicDateSegmentForExclusion === relevantDateSegmentForExclusion;
                        });
                        if (anyMatch) processPhase = EXECUTION_REJECTED;
                    }
                }
                // if there are modulus/cycle attributes, then execute them
                if (rule.modulus) {
                    if (isCycleAtModulus(rule) && processPhase !== EXECUTION_REJECTED) {
                        processPhase = EXECUTING_RULE_INSERTION;
                    }
                    cycleModulusUp(rule);
                } else if (processPhase !== EXECUTION_REJECTED) {
                    processPhase = EXECUTING_RULE_INSERTION;
                }
                if (processPhase === EXECUTING_RULE_INSERTION) {
                    rule.thisDate = date.format(DATE_FORMAT_STRING);
                    danielSan.events.push({ ...rule });
                    processPhase = MODIFIED;
                }
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in buildStandardEvent()', { date, processPhase, rule });
    }
};

module.exports = { buildStandardEvent };
