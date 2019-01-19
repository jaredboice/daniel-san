const moment = require('moment');
const appConstants = require('../constants');
const {
    DATE_FORMAT_STRING
} = appConstants;

const streamForward = (momentDate) => {
    return momentDate.add(1, 'day');
};

const streamBackward = (momentDate) => {
    return momentDate.add(-1, 'day');
};

class TimeStream {
    constructor({ dateStartString, dateEndString }) {
        this.dateStartString = dateStartString;
        this.dateEndString = dateEndString;
        this.dateStart = moment(dateStartString, DATE_FORMAT_STRING);
        this.dateEnd = moment(dateEndString, DATE_FORMAT_STRING);
        this.looperDate = moment(dateStartString, DATE_FORMAT_STRING);
    }

    stream1DayForward() {
        this.looperDate = this.looperDate.add(1, 'day');
        let looperIsNotBeyondTheEdge = moment.max([this.looperDate, this.dateEnd]) !== this.looperDate;
        return looperIsNotBeyondTheEdge;
    }
    stream1DayBackward() {
        this.looperDate = this.looperDate.add(-1, 'day');
        const looperIsNotBeyondTheEdge = moment.min([this.looperDate, this.dateStart]) !== this.looperDate;
        return looperIsNotBeyondTheEdge;
    }
};

module.exports = { TimeStream, streamForward, streamBackward };