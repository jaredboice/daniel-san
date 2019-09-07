const { errorDisc } = require('../utility/errorHandling');
const {
    EXECUTING_RULE_INSERTION,
    EXECUTION_REJECTED
} = require('../constants');

const cycleModulusUp = (rule) => {
    const newCycle = (rule.cycle % rule.modulus) + 1;
    rule.cycle = newCycle;
};

const cycleModulusDown = (rule) => {
    let newCycle = rule.cycle - 1;
    if (newCycle === 0) newCycle = rule.modulus;
    rule.cycle = newCycle;
};

const isCycleAtModulus = (rule) => {
    if (rule.cycle === rule.modulus) {
        return true;
        // eslint-disable-next-line no-else-return
    } else {
        return false;
    }
};

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

module.exports = {
    cycleModulusUp,
    cycleModulusDown,
    isCycleAtModulus,
    modulusPhase
};
