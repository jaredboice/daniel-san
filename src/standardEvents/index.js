const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { _28DayCondition } = require('./conditional');
const { getRelevantDateSegmentByFrequency, exclusionsPhase } = require('../standardEvents/common');
const { cycleModulusUp, isCycleAtModulus } = require('../modulusCycle');
const {
    DATE_FORMAT_STRING,
    DAILY,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    MODIFIED,
    EXECUTION_REJECTED
} = require('../constants');

const modulusPhase = ({ rule, processPhase }) => {
    let transientProcessPhase;
    try {
        // if there are modulus/cycle attributes, then execute them
        transientProcessPhase = processPhase || '';
        if (rule.modulus) {
            if (transientProcessPhase !== EXECUTION_REJECTED && isCycleAtModulus(rule)) {
                transientProcessPhase = EXECUTING_RULE_INSERTION;
            }
            cycleModulusUp(rule);
        } else if (transientProcessPhase !== EXECUTION_REJECTED) {
            transientProcessPhase = EXECUTING_RULE_INSERTION;
        }
        return transientProcessPhase;
    } catch (err) {
        throw errorDisc({ err, data: { rule, processPhase, transientProcessPhase } });
    }
};

const buildStandardEvent = ({ danielSan, rule, date }) => {
    let processPhase;
    try {
        processPhase = EVALUATING_RULE_INSERTION;
        const relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
            frequency: rule.frequency,
            date
        });
        if (
            rule.frequency === DAILY ||
            isUndefinedOrNull(rule.processDate) ||
            (rule.processDate === relevantDateSegmentByFrequency ||
                _28DayCondition({
                    processDate: rule.processDate,
                    date,
                    frequency: rule.frequency,
                    timeZone: rule.timeZone,
                    timeZoneType: rule.timeZoneType
                }))
        ) {
            processPhase = exclusionsPhase({ rule, date, processPhase, danielSan });
            processPhase = modulusPhase({ rule, processPhase });
            if (processPhase === EXECUTING_RULE_INSERTION) {
                rule.dateStart = date.format(DATE_FORMAT_STRING);
                danielSan.events.push({ ...rule });
                processPhase = MODIFIED;
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc({ err, data: { rule, date, processPhase } });
    }
};

module.exports = { buildStandardEvent };
