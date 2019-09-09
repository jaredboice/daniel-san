const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { _28DayCondition } = require('./conditional');
const { modulusPhase } = require('../modulusCycle');
const { exclusionsPhase } = require('../core/obliterate');
const { generateEvent } = require('../core/eventGeneration');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const { DAILY, EVALUATING_RULE_INSERTION, EXECUTING_RULE_INSERTION } = require('../constants');

const buildStandardEvent = ({ danielSan, rule, date, skipTimeTravel, eventGen = true }) => {
    let processPhase;
    try {
        const relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
            frequency: rule.frequency,
            date
        });
        // treat every rule.processDate like an array for simplicity
        let processDates = [];
        if (!Array.isArray(rule.processDate)) {
            processDates.push(rule.processDate);
        } else {
            processDates = [...rule.processDate];
        }
        for (let looper = 0; looper < processDates.length; looper++) {
            const processDate = processDates[looper];
            processPhase = EVALUATING_RULE_INSERTION;
            if (
                rule.frequency === DAILY ||
                isUndefinedOrNull(processDate) ||
                (processDate === relevantDateSegmentByFrequency ||
                    _28DayCondition({
                        processDate,
                        date,
                        frequency: rule.frequency,
                        timeZone: rule.timeZone,
                        timeZoneType: rule.timeZoneType
                    }))
            ) {
                processPhase = exclusionsPhase({ rule, date, processPhase, danielSan });
                processPhase = modulusPhase({ rule, processPhase });
                if (processPhase === EXECUTING_RULE_INSERTION) {
                    // when we are pre-modulating the cycle during validation, we do not want to generate an event
                    if (eventGen) {
                        processPhase = generateEvent({ danielSan, rule, date, skipTimeTravel });
                    }
                    break; // exit loop
                }
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc({ err, data: { rule, date, processPhase, skipTimeTravel, eventGen } });
    }
};

module.exports = { buildStandardEvent };
