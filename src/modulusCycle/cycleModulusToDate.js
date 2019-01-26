const moment = require('moment');
const { cycleModulusUp, cycleModulusDown } = require('./index.js');
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
            // eslint-disable-next-line no-case-declarations
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
            // eslint-disable-next-line no-case-declarations
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

module.exports = {
    cycleModulusUpToDate,
    cycleModulusDownToDate
};
