const cycleModulusUp = (rule) => {
    const newCycle = (rule.cycle % rule.modulus) + 1;
    rule.cycle = newCycle;
};

const cycleModulusDown = ({ rule }) => {
    let newCycle = rule.cycle - 1;
    if (newCycle === 0) newCycle = rule.modulus;
    rule.cycle = newCycle;
};

const isCycleAtModulus = (rule) => {
    if (rule.cycle === rule.modulus) {
        return true;
    } else {
        return false;
    }
};

module.exports = {
    cycleModulusUp,
    cycleModulusDown,
    isCycleAtModulus
};
