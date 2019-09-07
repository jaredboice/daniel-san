const { isUndefinedOrNull } = require('../utility/validation');
const { createTimeZone } = require('../timeZone');
const { streamForward } = require('../timeStream');
const { cycleModulusUp, cycleModulusDown } = require('./index.js');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const { DATE_FORMAT_STRING, DAILY } = require('../constants');

const cycleModulusUpToDate = ({ rule, effectiveDateStartString }) => {
    // note: for when anchorSyncDate input is less than effectiveDateStartString
    let looperDate = createTimeZone({
        timeZone: rule.timeZone,
        timeZoneType: rule.timeZoneType,
        dateString: rule.anchorSyncDate
    });
    let looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
    switch (rule.frequency) {
    case DAILY:
        // cycle back once for daily since every day is a modulation and because Math
        cycleModulusDown(rule);
        while (looperDateFormatted <= effectiveDateStartString) {
            cycleModulusUp(rule);
            looperDate = streamForward(looperDate);
            looperDateFormatted = looperDate.format(DATE_FORMAT_STRING);
        }
        break;
    // eslint-disable-next-line no-case-declarations
    default:
        // treat every rule.processDate like an array for simplicity
        let processDates = [];
        if (!Array.isArray(rule.processDate)) {
            processDates.push(rule.processDate);
        } else {
            processDates = [...rule.processDate];
        }
        let relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
            frequency: rule.frequency,
            date: looperDate
        });
        while (looperDateFormatted < effectiveDateStartString) {
            relevantDateSegmentByFrequency = getRelevantDateSegmentByFrequency({
                frequency: rule.frequency,
                date: looperDate
            });
            for(let looper = 0; looper < processDates.length; looper++){
                const processDate = processDates[looper];
                if (!isUndefinedOrNull(processDate) && processDate === relevantDateSegmentByFrequency) {
                    cycleModulusUp(rule);
                    break; // exit loop
                }
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
