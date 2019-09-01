const moment = require('moment');
const { isUndefinedOrNull } = require('../utility/validation');
const { errorDisc } = require('../utility/errorHandling');
const { streamForward, streamBackward } = require('../timeStream');
const { createTimeZone, convertTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('../standardEvents/common');
const {
    DATE_FORMAT_STRING,
    WEEKLY,
    ONCE,
    EXECUTING_RULE_ADJUSTMENT,
    MODIFIED,
    RULE_CONTEXT,
    EVENT_CONTEXT,
    BOTH
} = require('../constants');

const reusableLogicForDatesMovements = ({
    event,
    specialAdjustment,
    danielSan,
    streamForwardOrBackWard,
    dateArray,
    frequency
}) => {
    const processPhase = EXECUTING_RULE_ADJUSTMENT;
    if (dateArray) {
        // note: timezone for "EVENT_CONTEXT" is actually coming from the root of the master danielSan controller for all the projections.
        // Because that will be the final assigned timezone for the event.
        // even though the timezones for "RULE_CONTEXT" are coming from the event object,
        // their below dates are calcluated via the rule timezone data (which still hasn't changed yet)
        let ruleContextLooperDate = createTimeZone({
            timeZone: event.timeZone,
            timeZoneType: event.timeZoneType,
            dateString: event.eventDateStart,
            timeString: event.timeStart
        });
        let ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
            frequency,
            date: ruleContextLooperDate
        });
        // note: the following 2 variables would only be used in EVENT_CONTEXT or BOTH
        let eventContextLooperDate = convertTimeZone({
            timeZone: danielSan.timeZone,
            timeZoneType: danielSan.timeZoneType,
            date: ruleContextLooperDate
        });
        let eventContextLooperDateString = getRelevantDateSegmentByFrequency({
            frequency,
            date: eventContextLooperDate.date
        });
        /* begin big code block */
        /* conditions: RULE_CONTEXT / EVENT_CONTEXT / BOTH */
        if (isUndefinedOrNull(specialAdjustment.context) || specialAdjustment.context === RULE_CONTEXT) {
            while (dateArray.includes(ruleContextLooperDateString)) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.eventDateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.eventDateStart,
                    timeString: event.timeStart
                });
                ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: ruleContextLooperDate
                });
            }
        } else if (specialAdjustment.context === EVENT_CONTEXT) {
            while (dateArray.includes(eventContextLooperDateString)) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.eventDateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.eventDateStart,
                    timeString: event.timeStart
                });
                eventContextLooperDate = convertTimeZone({
                    timeZone: danielSan.timeZone,
                    timeZoneType: danielSan.timeZoneType,
                    date: ruleContextLooperDate
                });
                eventContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: eventContextLooperDate.date
                });
            }
        } else if (specialAdjustment.context === BOTH) {
            while (
                dateArray.includes(eventContextLooperDateString) ||
                dateArray.includes(ruleContextLooperDateString)
            ) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.eventDateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.eventDateStart,
                    timeString: event.timeStart
                });
                ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: ruleContextLooperDate
                });
                eventContextLooperDate = convertTimeZone({
                    timeZone: danielSan.timeZone,
                    timeZoneType: danielSan.timeZoneType,
                    date: ruleContextLooperDate
                });
                eventContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: eventContextLooperDate.date
                });
            }
        }
    }
    return processPhase;
};

/*
    specialAdjustments: [
        {
            type: MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS
            weekdays: [SATURDAY, SUNDAY]
        }
    ];

*/
const moveThisProcessDateBeforeTheseWeekdays = ({ event, specialAdjustment, danielSan }) => {
    let processPhase;
    try {
        processPhase = reusableLogicForDatesMovements({
            event,
            specialAdjustment,
            danielSan,
            streamForwardOrBackWard: streamBackward,
            dateArray: specialAdjustment.weekdays,
            frequency: WEEKLY
        });
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateBeforeTheseWeekdays()', {
            processPhase,
            event,
            specialAdjustment
        });
    }
};

/*
    specialAdjustments: [
        {
            type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS
            weekdays: [SATURDAY, SUNDAY]
        }
    ];

*/
const moveThisProcessDateAfterTheseWeekdays = ({ event, specialAdjustment, danielSan }) => {
    let processPhase;
    try {
        processPhase = reusableLogicForDatesMovements({
            event,
            specialAdjustment,
            danielSan,
            streamForwardOrBackWard: streamForward,
            dateArray: specialAdjustment.weekdays,
            frequency: WEEKLY
        });
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateAfterTheseWeekdays()', {
            processPhase,
            event,
            specialAdjustment
        });
    }
};

/*
        specialAdjustments: [
            {
                type: MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES,
                dates: ['2019-07-04', '2019-12-25'],
                weekdays: [SATURDAY, SUNDAY] // weekdays are optional
            }
        ]

*/
const moveThisProcessDateBeforeTheseDates = ({ event, specialAdjustment, danielSan }) => {
    let processPhase;
    try {
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        if (specialAdjustment.dates) {
            processPhase = reusableLogicForDatesMovements({
                event,
                specialAdjustment,
                danielSan,
                streamForwardOrBackWard: streamBackward,
                dateArray: specialAdjustment.dates,
                frequency: ONCE
            });
        }
        if (specialAdjustment.weekdays) {
            processPhase = moveThisProcessDateBeforeTheseWeekdays({
                event,
                specialAdjustment,
                danielSan
            });
            if (processPhase === MODIFIED) {
                processPhase = moveThisProcessDateBeforeTheseDates({ event, specialAdjustment, danielSan });
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateBeforeTheseDates()', {
            processPhase,
            event,
            specialAdjustment
        });
    }
};

/*
        specialAdjustments: [
            {
                type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
                dates: ['2019-07-04', '2019-12-25'],
                weekdays: [SATURDAY, SUNDAY] // weekdays are optional
            }
        ]

*/
const moveThisProcessDateAfterTheseDates = ({ event, specialAdjustment, danielSan }) => {
    let processPhase;
    try {
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        if (specialAdjustment.dates) {
            processPhase = reusableLogicForDatesMovements({
                event,
                specialAdjustment,
                danielSan,
                streamForwardOrBackWard: streamForward,
                dateArray: specialAdjustment.dates,
                frequency: ONCE
            });
        }
        if (specialAdjustment.weekdays) {
            processPhase = moveThisProcessDateAfterTheseWeekdays({
                event,
                specialAdjustment,
                danielSan
            });
            if (processPhase === MODIFIED) {
                processPhase = moveThisProcessDateAfterTheseDates({ event, specialAdjustment, danielSan });
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateAfterTheseDates()', {
            processPhase,
            event,
            specialAdjustment
        });
    }
};

/*
    dates & amounts are parallel arrays
    specialAdjustments: [
        { 
            type: ADJUST_AMOUNT_ON_THESE_DATES,
            dates: [
                '2019-06-01', 
                '2019-09-01'
            ],
            amounts: [
                500000,
                250000
            ]
        }
    ]
*/
const adjustAmountOnTheseDates = ({ event, specialAdjustment, danielSan }) => {
    let processPhase = EXECUTING_RULE_ADJUSTMENT;
    try {
        specialAdjustment.dates.forEach((ruleContextLooperDate, looperDateIndex) => {
            if (ruleContextLooperDate === event.eventDateStart && event.amount) {
                if (isUndefinedOrNull(specialAdjustment.context) || specialAdjustment.context === RULE_CONTEXT) {
                    event.amount += specialAdjustment.amounts[looperDateIndex];
                } else if (specialAdjustment.context === EVENT_CONTEXT) {
                    const adjustmentConverted =
                        danielSan.currencySymbol &&
                        event.currencySymbol &&
                        danielSan.currencySymbol !== event.currencySymbol
                            ? danielSan.currencyConversion({
                                  amount: specialAdjustment.amounts[looperDateIndex],
                                  inputSymbol: event.currencySymbol,
                                  outputSymbol: danielSan.currencySymbol
                              })
                            : specialAdjustment.amounts[looperDateIndex];
                    event.amount += adjustmentConverted;
                }
                processPhase = MODIFIED;
            }
        });
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in adjustAmountOnTheseDates()', {
            processPhase,
            event,
            specialAdjustment
        });
    }
};

module.exports = {
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    moveThisProcessDateBeforeTheseWeekdays,
    moveThisProcessDateBeforeTheseDates,
    adjustAmountOnTheseDates
};
