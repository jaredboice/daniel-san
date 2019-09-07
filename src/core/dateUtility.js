const {
    DATE_FORMAT_STRING,
    DAILY,
    DATE_DELIMITER,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    ONCE
} = require('../constants');

/*
    function: getRelevantDateSegmentByFrequency
    description:
        returns the relevant part of the date.
        example:
            for WEEKLY frequency it only needs to return the weekday (as a number 0-6).
            for ANNUAL frequency it returns something like "12-31"


*/
const getRelevantDateSegmentByFrequency = ({ frequency, date }) => {
    const currentDateString = date.format(DATE_FORMAT_STRING);
    const [currentYearString, currentMonthString, currentDayString] = currentDateString.split(DATE_DELIMITER);
    const currentWeekday = date.day();
    switch (frequency) {
    case ANNUALLY:
        return `${currentMonthString}${DATE_DELIMITER}${currentDayString}`;
    case MONTHLY:
        return currentDayString;
    case WEEKLY:
        return currentWeekday;
    case DAILY:
        break;
    case ONCE:
        return `${currentYearString}${DATE_DELIMITER}${currentMonthString}${DATE_DELIMITER}${currentDayString}`;
    default:
        break;
    }
};

module.exports = {
    getRelevantDateSegmentByFrequency
};
