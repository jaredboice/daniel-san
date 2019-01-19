const moment = require('moment');
const { streamForward, streamBackward } = require('../timeStream');
const { isUndefinedOrNull } = require('../utility/validation');
const { getRelevantDateSegmentByFrequency } = require('../standardOperations/common');
const appConstants = require('../constants');
const {
    DATE_FORMAT_STRING,
    DAILY
} = appConstants;

const cycleModulusUpToDate = ({ cashflowRule, dateStartString }) => {
    // note: for when syncDate input is less than dateStartString
    if (cashflowRule.syncDate) {
        let looperDate = moment(cashflowRule.syncDate, DATE_FORMAT_STRING);
        switch (cashflowRule.frequency) {
            case DAILY:
                // streamForward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamForward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) < dateStartString) {
                    cycleModulusUp(cashflowRule);
                    looperDate = streamForward(looperDate);
                }
                break;
            default:
                let relevantDateSegmentByFrequency;
                // streamForward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamForward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) < dateStartString) {
                    relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                        frequency: cashflowRule.frequency,
                        date: looperDate
                    });
                    if (
                        !isUndefinedOrNull(cashflowRule.processDate) &&
                        cashflowRule.processDate === relevantDateSegmentByFrequency
                    ) {
                        cycleModulusUp(cashflowRule);
                    }
                    looperDate = streamForward(looperDate);
                }
                break;
        }
    }
};

const cycleModulusDownToDate = ({ cashflowRule, dateStartString }) => {
    // note: for when syncDate input is greater than dateStartString
    if (cashflowRule.syncDate) {
        let looperDate = moment(cashflowRule.syncDate, DATE_FORMAT_STRING);
        switch (cashflowRule.frequency) {
            case DAILY:
                // streamBackward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamBackward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) > dateStartString) {
                    cycleModulusDown({ cashflowRule });
                    looperDate = streamBackward(looperDate);
                }
                break;
            default:
                let relevantDateSegmentByFrequency;
                // streamBackward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamBackward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) > dateStartString) {
                    relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                        frequency: cashflowRule.frequency,
                        date: looperDate
                    });
                    if (
                        !isUndefinedOrNull(cashflowRule.processDate) &&
                        cashflowRule.processDate === relevantDateSegmentByFrequency
                    ) {
                        cycleModulusDown({ cashflowRule });
                    }
                    looperDate = streamBackward(looperDate);
                }
                break;
        }
    }
};

const cycleModulusUp = (cashflowRule) => {
    let newCycle = (cashflowRule.cycle % cashflowRule.modulus) + 1;
    cashflowRule.cycle = newCycle;
};

const cycleModulusDown = ({ cashflowRule }) => {
    let newCycle = cashflowRule.cycle - 1;
    if (newCycle === 0) newCycle = cashflowRule.modulus;
    cashflowRule.cycle = newCycle;
};

const isCycleAtModulus = (cashflowRule) => {
    if (cashflowRule.cycle === cashflowRule.modulus) {
        return true;
    } else {
        return false;
    }
};

module.exports = {
    cycleModulusUpToDate, cycleModulusDownToDate, cycleModulusUp, cycleModulusDown, isCycleAtModulus
};