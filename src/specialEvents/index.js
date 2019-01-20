const moment = require('moment');
const errorDisc = require('../utility/errorHandling');
const { TimeStream, streamForward, streamBackward } = require('../timeStream');
const {
    getRelevantDateSegmentByFrequency,
    flagRuleForRetirement,
    retireRules
} = require('../standardEvents/common');
const {
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    MODIFIED,
    DATE_FORMAT_STRING,
    DAILY,
    WEEKLY,
    MONTHLY,
    SUNDAY_NUM,
    MONDAY_NUM,
    TUESDAY_NUM,
    WEDNESDAY_NUM,
    THURSDAY_NUM,
    FRIDAY_NUM,
    SATURDAY_NUM
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
                    case SUNDAY_NUM:
                        monthlyWeekdayConstruct[SUNDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case MONDAY_NUM:
                        monthlyWeekdayConstruct[MONDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case TUESDAY_NUM:
                        monthlyWeekdayConstruct[TUESDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case WEDNESDAY_NUM:
                        monthlyWeekdayConstruct[WEDNESDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case THURSDAY_NUM:
                        monthlyWeekdayConstruct[THURSDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case FRIDAY_NUM:
                        monthlyWeekdayConstruct[FRIDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
                        break;
                    case SATURDAY_NUM:
                        monthlyWeekdayConstruct[SATURDAY_NUM].push(thisLooperDate.format(DATE_FORMAT_STRING));
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
        { nthId: 1, weekday: FRIDAY_NUM },
        { nthId: 3, weekday: FRIDAY_NUM }
        { nthId: -1, weekday: SUNDAY_NUM } // a negative nthId means the last occurence of the month
    ];

*/
const nthWeekdaysOfMonth = ({ danielSan, rule, date }) => {
    let processPhase;
    try {
        const nthProcessDays = rule.frequency;
        const weekdaysInMonth = findAllWeekdaysInTheMonth(date);
        processPhase = EVALUATING_RULE_INSERTION;
        nthProcessDays.forEach((nthProcessDay) => {
            const objectKey = nthProcessDay.weekday;
            const sizeOfObjectKeyArray = weekdaysInMonth[objectKey].length;
            processPhase = EXECUTING_RULE_INSERTION;
            weekdaysInMonth[objectKey].forEach((looperDate, looperDateIndex) => {
                if (
                    date.format(DATE_FORMAT_STRING) === looperDate &&
                    (nthProcessDay.nthId === looperDateIndex + 1 ||
                        nthProcessDay.nthId === 0 ||
                        (nthProcessDay.nthId < 0 && looperDateIndex === sizeOfObjectKeyArray - 1))
                ) {
                    rule.thisDate = date.format(DATE_FORMAT_STRING);
                    danielSan.events.push({ ...rule });
                    processPhase = MODIFIED;
                }
            });
        });
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in nthWeekdaysOfMonth()', { processPhase, rule, date });
    }
};

/*
    frequency: FRIDAY_NUM,
    processDate: '13',

*/
const weekdayOnDate = ({ danielSan, rule, date }) => {
    let processPhase;
    try {
        const thisProcessDate = getRelevantDateSegmentByFrequency({
            frequency: MONTHLY,
            date: date
        });
        const thisWeekday = getRelevantDateSegmentByFrequency({
            frequency: WEEKLY,
            date: date
        });
        processPhase = EVALUATING_RULE_INSERTION;
        if (rule.processDate === thisProcessDate && rule.frequency === thisWeekday) {
            processPhase = EXECUTING_RULE_INSERTION;
            rule.thisDate = date.format(DATE_FORMAT_STRING);
            danielSan.events.push({ ...rule });
            processPhase = MODIFIED;
        }
        return processPhase;
    } catch (err) {
        throw errorDisc(err, 'error in weekdayOnDate()', { date, processPhase, rule });
    }
};

module.exports = { nthWeekdaysOfMonth, weekdayOnDate };
