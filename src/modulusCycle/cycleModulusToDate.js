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
    let looperDate = moment(rule.syncDate, DATE_FORMAT_STRING);
    let looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
    switch (rule.frequency) {
    case DAILY:
        // cycle back once for daily since every day is a modulation and because Math
        cycleModulusDown(rule);
        while (looperDateFormatted <= dateStartString) {
            cycleModulusUp(rule);
            looperDate = streamForward(looperDate);
            looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
        }
        break;
    // eslint-disable-next-line no-case-declarations
    default:
        let relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
            frequency: rule.frequency,
            date: looperDate
        });
        while (looperDateFormatted < dateStartString) {
            relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                frequency: rule.frequency,
                date: looperDate
            });
            if (!isUndefinedOrNull(rule.processDate) && rule.processDate === relevantDateSegmentByFrequency) {
                cycleModulusUp(rule);
            }
            looperDate = streamForward(looperDate);
            looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
        }
        break;
    }
};

module.exports = {
    cycleModulusUpToDate
};
