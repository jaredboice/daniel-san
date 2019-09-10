const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { createTimeZone, convertTimeZone } = require('../timeZone');
const { streamForward, streamBackward } = require('../timeStream');
const { redefineTimeStartAndTimeSpan } = require('../core/eventGeneration');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const {
    DATE_FORMAT_STRING,
    WEEKLY,
    ONCE,
    EXECUTING_RULE_ADJUSTMENT,
    MODIFIED,
    EVENT_SOURCE,
    OBSERVER_SOURCE,
    BOTH
} = require('../constants');

const reusableLogicForDateMovements = ({
    date,
    event,
    specialAdjustment,
    danielSan,
    streamForwardOrBackWard,
    dateArray,
    frequency,
    skipTimeTravel
}) => {
    let processPhase = EXECUTING_RULE_ADJUSTMENT;
    if (dateArray) {
        // note: timezone for "OBSERVER_SOURCE" is actually coming from the danielSan config.
        // Because that will be the final assigned timezone for the event.
        // even though the timezones for "EVENT_SOURCE" are coming from the event object,
        // their below dates are calcluated via the rule timezone data (which is still the original data as it hasn't changed to the converted timezone yet)
        let ruleContextLooperDate = date;
        let ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
            frequency,
            date: ruleContextLooperDate
        });
        // note: the following 2 variables would only be used in OBSERVER_SOURCE or BOTH
        let observerContextLooperDate = convertTimeZone({
            timeZone: danielSan.config.timeZone,
            timeZoneType: danielSan.config.timeZoneType,
            date: ruleContextLooperDate
        });
        let observerContextLooperDateString = getRelevantDateSegmentByFrequency({
            frequency,
            date: observerContextLooperDate.date
        });
        /* conditions: EVENT_SOURCE / OBSERVER_SOURCE / BOTH */
        if (isUndefinedOrNull(specialAdjustment.context) || specialAdjustment.context === EVENT_SOURCE) {
            while (dateArray.includes(ruleContextLooperDateString)) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.dateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                redefineTimeStartAndTimeSpan({ event, skipTimeTravel });
                processPhase = MODIFIED;
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.dateStart,
                    timeString: event.timeStart
                });
                ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: ruleContextLooperDate
                });
            }
        } else if (specialAdjustment.context === OBSERVER_SOURCE) {
            while (dateArray.includes(observerContextLooperDateString)) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.dateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                processPhase = MODIFIED;
                redefineTimeStartAndTimeSpan({ event, skipTimeTravel });
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.dateStart,
                    timeString: event.timeStart
                });
                observerContextLooperDate = convertTimeZone({
                    timeZone: danielSan.config.timeZone,
                    timeZoneType: danielSan.config.timeZoneType,
                    date: ruleContextLooperDate
                });
                observerContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: observerContextLooperDate.date
                });
            }
        } else if (specialAdjustment.context === BOTH) {
            while (
                dateArray.includes(observerContextLooperDateString) ||
                dateArray.includes(ruleContextLooperDateString)
            ) {
                ruleContextLooperDate = streamForwardOrBackWard(ruleContextLooperDate);
                event.dateStart = ruleContextLooperDate.format(DATE_FORMAT_STRING);
                processPhase = MODIFIED;
                redefineTimeStartAndTimeSpan({ event, skipTimeTravel });
                ruleContextLooperDate = createTimeZone({
                    timeZone: event.timeZone,
                    timeZoneType: event.timeZoneType,
                    dateString: event.dateStart,
                    timeString: event.timeStart
                });
                ruleContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: ruleContextLooperDate
                });
                observerContextLooperDate = convertTimeZone({
                    timeZone: danielSan.config.timeZone,
                    timeZoneType: danielSan.config.timeZoneType,
                    date: ruleContextLooperDate
                });
                observerContextLooperDateString = getRelevantDateSegmentByFrequency({
                    frequency,
                    date: observerContextLooperDate.date
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
const moveThisProcessDateBeforeTheseWeekdays = ({ event, specialAdjustment, danielSan, date, skipTimeTravel }) => {
    let processPhase;
    try {
        processPhase = reusableLogicForDateMovements({
            date,
            event,
            specialAdjustment,
            danielSan,
            streamForwardOrBackWard: streamBackward,
            dateArray: specialAdjustment.weekdays,
            frequency: WEEKLY,
            skipTimeTravel
        });
        return processPhase;
    } catch (err) {
        throw errorDisc({ err, data: { specialAdjustment, event, processPhase, skipTimeTravel } });
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
const moveThisProcessDateAfterTheseWeekdays = ({ event, specialAdjustment, danielSan, date, skipTimeTravel }) => {
    let processPhase;
    try {
        processPhase = reusableLogicForDateMovements({
            date,
            event,
            specialAdjustment,
            danielSan,
            streamForwardOrBackWard: streamForward,
            dateArray: specialAdjustment.weekdays,
            frequency: WEEKLY,
            skipTimeTravel
        });
    } catch (err) {
        throw errorDisc({ err, data: { specialAdjustment, event, processPhase, skipTimeTravel } });
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
const moveThisProcessDateBeforeTheseDates = ({ event, specialAdjustment, danielSan, date, skipTimeTravel }) => {
    let processPhase;
    try {
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        if (specialAdjustment.dates) {
            processPhase = reusableLogicForDateMovements({
                date,
                event,
                specialAdjustment,
                danielSan,
                streamForwardOrBackWard: streamBackward,
                dateArray: specialAdjustment.dates,
                frequency: ONCE,
                skipTimeTravel
            });
        }
        if (specialAdjustment.weekdays) {
            processPhase = moveThisProcessDateBeforeTheseWeekdays({
                date,
                event,
                specialAdjustment,
                danielSan,
                skipTimeTravel
            });
            if (processPhase === MODIFIED) {
                processPhase = moveThisProcessDateBeforeTheseDates({ date, event, specialAdjustment, danielSan, skipTimeTravel });
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc({ err, data: { specialAdjustment, event, processPhase, skipTimeTravel } });
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
const moveThisProcessDateAfterTheseDates = ({ event, specialAdjustment, danielSan, date, skipTimeTravel }) => {
    let processPhase;
    try {
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        if (specialAdjustment.dates) {
            processPhase = reusableLogicForDateMovements({
                date,
                event,
                specialAdjustment,
                danielSan,
                streamForwardOrBackWard: streamForward,
                dateArray: specialAdjustment.dates,
                frequency: ONCE,
                skipTimeTravel
            });
        }
        if (specialAdjustment.weekdays) {
            processPhase = moveThisProcessDateAfterTheseWeekdays({
                date,
                event,
                specialAdjustment,
                danielSan,
                skipTimeTravel
            });
            if (processPhase === MODIFIED) {
                processPhase = moveThisProcessDateAfterTheseDates({ date, event, specialAdjustment, danielSan, skipTimeTravel });
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc({ err, data: { specialAdjustment, event, processPhase, skipTimeTravel } });
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
    let ruleContextLooperDateTracker;
    let looperDateIndexTracker;
    try {
        specialAdjustment.dates.forEach((ruleContextLooperDate, looperDateIndex) => {
            ruleContextLooperDateTracker = ruleContextLooperDate;
            looperDateIndexTracker = looperDateIndex;
            if (ruleContextLooperDate === event.dateStart && event.amount) {
                if (
                    isUndefinedOrNull(specialAdjustment.context) ||
                    specialAdjustment.context === EVENT_SOURCE
                ) {
                    event.amount += specialAdjustment.amounts[looperDateIndex];
                } else if (specialAdjustment.context === OBSERVER_SOURCE) {
                    const adjustmentConverted =
                        danielSan.config.currencySymbol &&
                        event.currencySymbol &&
                        danielSan.config.currencySymbol !== event.currencySymbol
                            ? danielSan.config.currencyConversion({
                                amount: specialAdjustment.amounts[looperDateIndex],
                                inputSymbol: event.currencySymbol,
                                outputSymbol: danielSan.config.currencySymbol
                            })
                            : specialAdjustment.amounts[looperDateIndex];
                    event.amount += adjustmentConverted;
                }
                processPhase = MODIFIED;
            }
        });
        return processPhase;
    } catch (err) {
        throw errorDisc({
            err,
            data: { specialAdjustment, event, processPhase, ruleContextLooperDateTracker, looperDateIndexTracker }
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
