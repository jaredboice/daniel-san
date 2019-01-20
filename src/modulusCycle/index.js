const moment = require('moment');
const { streamForward, streamBackward } = require('../timeStream');
const { isUndefinedOrNull } = require('../utility/validation');
const { getRelevantDateSegmentByFrequency } = require('../standardEvents/common');
const {
    DATE_FORMAT_STRING,
    DAILY
} = require('../constants');

const cycleModulusUpToDate = ({ rule, dateStartString }) => {
    // note: for when syncDate input is less than dateStartString
    if (rule.syncDate) {
        let looperDate = moment(rule.syncDate, DATE_FORMAT_STRING);
        switch (rule.frequency) {
            case DAILY:
                // streamForward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamForward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) < dateStartString) {
                    cycleModulusUp(rule);
                    looperDate = streamForward(looperDate);
                }
                break;
            default:
                let relevantDateSegmentByFrequency;
                // streamForward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamForward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) < dateStartString) {
                    relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                        frequency: rule.frequency,
                        date: looperDate
                    });
                    if (
                        !isUndefinedOrNull(rule.processDate) &&
                        rule.processDate === relevantDateSegmentByFrequency
                    ) {
                        cycleModulusUp(rule);
                    }
                    looperDate = streamForward(looperDate);
                }
                break;
        }
    }
};

const cycleModulusDownToDate = ({ rule, dateStartString }) => {
    // note: for when syncDate input is greater than dateStartString
    if (rule.syncDate) {
        let looperDate = moment(rule.syncDate, DATE_FORMAT_STRING);
        switch (rule.frequency) {
            case DAILY:
                // streamBackward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamBackward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) > dateStartString) {
                    cycleModulusDown({ rule });
                    looperDate = streamBackward(looperDate);
                }
                break;
            default:
                let relevantDateSegmentByFrequency;
                // streamBackward before the loop to prevent cycle modulation on the syncDate
                looperDate = streamBackward(looperDate);
                while (looperDate.format(DATE_FORMAT_STRING) > dateStartString) {
                    relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                        frequency: rule.frequency,
                        date: looperDate
                    });
                    if (
                        !isUndefinedOrNull(rule.processDate) &&
                        rule.processDate === relevantDateSegmentByFrequency
                    ) {
                        cycleModulusDown({ rule });
                    }
                    looperDate = streamBackward(looperDate);
                }
                break;
        }
    }
};

const cycleModulusUp = (rule) => {
    let newCycle = (rule.cycle % rule.modulus) + 1;
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
    cycleModulusUpToDate, cycleModulusDownToDate, cycleModulusUp, cycleModulusDown, isCycleAtModulus
};