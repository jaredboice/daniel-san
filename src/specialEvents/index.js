const moment = require('moment');
const { errorDisc } = require('../utility/errorHandling');
const { TimeStream, streamForward, streamBackward } = require('../timeStream');
const {
    getRelevantDateSegmentByFrequency,
    flagRuleForRetirement,
    retireRules,
    exclusionsPhase
} = require('../standardEvents/common');
const {
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    EXECUTION_REJECTED,
    MODIFIED,
    DATE_FORMAT_STRING,
    DAILY,
    WEEKLY,
    MONTHLY,
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY
} = require('../constants');

/*
    0 = Sunday
    6 = Saturday
*/
const findAllWeekdaysInTheMonth = (date) => {
    try {
        const monthlyWeekdayConstruct = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        };
        const startOfMonth = moment(date, DATE_FORMAT_STRING).startOf('month');
        const endOfMonth = moment(date, DATE_FORMAT_STRING).endOf('month');

        const processThisLooperDate = (thisLooperDate) => {
            try {
                const thisWeekday = getRelevantDateSegmentByFrequency({
                    frequency: WEEKLY,
                    date: thisLooperDate
                });
                switch (thisWeekday) {
                    case SUNDAY:
                        monthlyWeekdayConstruct[SUNDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case MONDAY:
                        monthlyWeekdayConstruct[MONDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case TUESDAY:
                        monthlyWeekdayConstruct[TUESDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case WEDNESDAY:
                        monthlyWeekdayConstruct[WEDNESDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case THURSDAY:
                        monthlyWeekdayConstruct[THURSDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case FRIDAY:
                        monthlyWeekdayConstruct[FRIDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case SATURDAY:
                        monthlyWeekdayConstruct[SATURDAY].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                }
            } catch (err) {
                throw errorDisc(err, 'error in processThisLooperDate()', { thisLooperDate });
            }
        };

        let looperDate = startOfMonth;
        do {
            processThisLooperDate(looperDate);
            looperDate = streamForward(looperDate);
        } while (looperDate.format(DATE_FORMAT_STRING) !== endOfMonth.format(DATE_FORMAT_STRING));
        processThisLooperDate(looperDate); // post execution for the last day of the month
        return monthlyWeekdayConstruct;
    } catch (err) {
        throw errorDisc(err, 'error in findAllWeekdaysInTheMonth()', { date });
    }
};

/*
    frequency = [
        { nthId: 1, weekday: FRIDAY },
        { nthId: 3, weekday: FRIDAY }
        { nthId: -1, weekday: SUNDAY } // a negative nthId means the last occurence of the month
    ];

*/
const nthWeekdaysOfMonth = ({ danielSan, rule, date }) => {
    let processPhase = EVALUATING_RULE_INSERTION;
    try {
        const nthProcessDays = rule.frequency;
        const weekdaysInMonth = findAllWeekdaysInTheMonth(date);
        nthProcessDays.forEach((nthProcessDay) => {
            const objectKey = nthProcessDay.weekday;
            const sizeOfObjectKeyArray = weekdaysInMonth[objectKey].length;
            weekdaysInMonth[objectKey].forEach((looperDate, looperDateIndex) => {
                processPhase = EVALUATING_RULE_INSERTION;
                if (
                    date.format(DATE_FORMAT_STRING) === looperDate &&
                    (nthProcessDay.nthId === looperDateIndex + 1 ||
                        nthProcessDay.nthId === 0 ||
                        (nthProcessDay.nthId < 0 && looperDateIndex === sizeOfObjectKeyArray - 1))
                ) {
                    processPhase = EXECUTING_RULE_INSERTION;
                    processPhase = exclusionsPhase({ rule, date, processPhase });
                    if (processPhase !== EXECUTION_REJECTED) {
                        rule.thisDate = date.format(DATE_FORMAT_STRING);
                        danielSan.events.push({ ...rule });
                        processPhase = MODIFIED;
                    }
                }
            });
        });
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in nthWeekdaysOfMonth()', { processPhase, rule, date });
    }
};

/*
    frequency: FRIDAY,
    processDate: '13',

*/
const weekdayOnDate = ({ danielSan, rule, date }) => {
    let processPhase = EVALUATING_RULE_INSERTION;
    try {
        const thisProcessDate = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY,
            date: date
        });
        const thisWeekday = getRelevantDateSegmentByFrequency({
            frequency: WEEKLY,
            date: date
        });
        if (rule.processDate === thisProcessDate && rule.frequency === thisWeekday) {
            processPhase = EXECUTING_RULE_INSERTION;
            processPhase = exclusionsPhase({ rule, date, processPhase });
            if (processPhase !== EXECUTION_REJECTED) {
                rule.thisDate = date.format(DATE_FORMAT_STRING);
                danielSan.events.push({ ...rule });
                processPhase = MODIFIED;
            }
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in weekdayOnDate()', { date, processPhase, rule });
    }
};

module.exports = { nthWeekdaysOfMonth, weekdayOnDate };
