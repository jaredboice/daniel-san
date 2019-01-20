const moment = require('moment');
const { errorDisc } = require('../utility/errorHandling');
const { TimeStream, streamForward } = require('../timeStream');
const {
    getRelevantDateSegmentByFrequency,
    flagRuleForRetirement,
    retireRules
} = require('../standardEvents/common');
const {
    DATE_DELIMITER,
    DATE_FORMAT_STRING,
    DAILY,
    WEEKLY,
    MONTHLY,
    ANNUALLY,
    ONCE,
    EXECUTING_RULE_ADJUSTMENT,
    MODIFIED
} = require('../constants');

/*
    specialAdjustments: [
        {
            type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS
            weekdays: [SATURDAY, SUNDAY]
        }
    ];

*/
const moveThisProcessDateAfterTheseWeekdays = ({ rule, specialAdjustment }) => {
    let processPhase;
    try {
        const { weekdays } = specialAdjustment;
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        let thisWeekday = getRelevantDateSegmentByFrequency({
            frequency: WEEKLY,
            date: moment(rule.thisDate, DATE_FORMAT_STRING)
        });
        while (weekdays.includes(thisWeekday)) {
            const looperDate = streamForward(moment(rule.thisDate, DATE_FORMAT_STRING));
            rule.thisDate = looperDate.format(DATE_FORMAT_STRING);
            thisWeekday = getRelevantDateSegmentByFrequency({
                frequency: WEEKLY,
                date: moment(rule.thisDate, DATE_FORMAT_STRING)
            });
            processPhase = MODIFIED;
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateAfterTheseWeekdays()', {
            processPhase,
            rule,
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
const moveThisProcessDateAfterTheseDates = ({ rule, specialAdjustment }) => {
    let processPhase;
    try {
        const { dates } = specialAdjustment;
        processPhase = EXECUTING_RULE_ADJUSTMENT;
        if (specialAdjustment.dates) {
            let currentProcessDate = getRelevantDateSegmentByFrequency({
                frequency: ONCE,
                date: moment(rule.thisDate, DATE_FORMAT_STRING)
            });
            while (dates.includes(currentProcessDate)) {
                const looperDate = streamForward(moment(rule.thisDate, DATE_FORMAT_STRING));
                rule.thisDate = looperDate.format(DATE_FORMAT_STRING);
                currentProcessDate = getRelevantDateSegmentByFrequency({
                    frequency: ONCE,
                    date: moment(rule.thisDate, DATE_FORMAT_STRING)
                });
            }
        }
        if (specialAdjustment.weekdays) {
            processPhase = moveThisProcessDateAfterTheseWeekdays({
                rule,
                specialAdjustment
            });
            if (processPhase === MODIFIED) {
                processPhase = moveThisProcessDateAfterTheseDates({ rule, specialAdjustment });
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in moveThisProcessDateAfterTheseDates()', {
            processPhase,
            rule,
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
const adjustAmountOnTheseDates = ({ rule, specialAdjustment }) => {
    let processPhase = EXECUTING_RULE_ADJUSTMENT;
    try {
        specialAdjustment.dates.forEach((looperDate, looperDateIndex) => {
            if (looperDate === rule.thisDate) {
                rule.amount += specialAdjustment.amounts[looperDateIndex];
            }
            processPhase = MODIFIED;
        });
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in adjustAmountOnTheseDates()', {
            processPhase,
            rule,
            specialAdjustment
        });
    }
};

module.exports = {
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    adjustAmountOnTheseDates
};
