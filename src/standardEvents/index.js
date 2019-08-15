const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const {
    getRelevantDateSegmentByFrequency,
    _28DayCondition,
    modulusPhase,
    exclusionsPhase
} = require('../standardEvents/common');
const {
    DATE_FORMAT_STRING,
    DAILY,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    MODIFIED
} = require('../constants');

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
                _28DayCondition({ processDate: rule.processDate, date, frequency: rule.frequency }))
        ) {
            processPhase = exclusionsPhase({ rule, date, processPhase });
            processPhase = modulusPhase({ rule, processPhase });
            if (processPhase === EXECUTING_RULE_INSERTION) {
                rule.eventDate = date.format(DATE_FORMAT_STRING);
                danielSan.events.push({ ...rule });
                processPhase = MODIFIED;
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in buildStandardEvent()', { date, processPhase, rule });
    }
};

module.exports = { buildStandardEvent };
