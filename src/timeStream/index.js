const moment = require('moment');
const { DATE_FORMAT_STRING } = require('../constants');

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
        this.looperDate = streamForward(this.looperDate);
        // const looperIsNotOnTheEdge = moment.max([this.looperDate, this.dateEnd]) !== this.looperDate;
        const looperIsNotBeyondTheEdge = !this.looperDate.isAfter(this.dateEnd);
        return looperIsNotBeyondTheEdge;
    }
    stream1DayBackward() {
        this.looperDate = streamBackward(this.looperDate);
        const looperIsNotBeyondTheEdge = !this.looperDate.isBefore(this.dateEnd);
        return looperIsNotBeyondTheEdge;
    }
}

module.exports = { TimeStream, streamForward, streamBackward };
