const moment = require('moment');
const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { isCycleAtModulus, cycleModulusUp } = require('../modulusCycle');
const { getRelevantDateSegmentByFrequency, _28DayCondition, modulusPhase, exclusionsPhase } = require('../standardEvents/common');
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
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    DISCOVERING_EVENT_TYPE,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    EXECUTION_REJECTED,
    MODIFIED
} = require('../constants');

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
                processPhase = exclusionsPhase({ rule, date, processPhase });
                processPhase = modulusPhase({ rule, processPhase });
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