const { createTimeZone } = require('../timeZone');

const streamForward = (momentDate) => {
    return momentDate.add(1, 'day');
};

const streamBackward = (momentDate) => {
    return momentDate.add(-1, 'day');
};

class TimeStream {
    constructor({ effectiveDateStartString, effectiveDateEndString, timeZone = null, timeZoneType = null, timeStartString = null, timeEndString = null }) {
        this.effectiveDateStartString = effectiveDateStartString;
        this.effectiveDateEndString = effectiveDateEndString;
        this.effectiveDateStart = createTimeZone({ timeZone, timeZoneType, dateString: effectiveDateStartString, timeString: timeStartString });
        this.effectiveDateEnd = createTimeZone({ timeZone, timeZoneType, dateString: effectiveDateEndString, timeString: timeEndString });
        this.looperDate = createTimeZone({ timeZone, timeZoneType, dateString: effectiveDateStartString, timeString: timeStartString });
    }

    stream1DayForward() {
        this.looperDate = streamForward(this.looperDate);
        const looperIsNotBeyondTheEdge = !this.looperDate.isAfter(this.effectiveDateEnd);
        return looperIsNotBeyondTheEdge;
    }
    stream1DayBackward() {
        this.looperDate = streamBackward(this.looperDate);
        const looperIsNotBeyondTheEdge = !this.looperDate.isBefore(this.effectiveDateEnd);
        return looperIsNotBeyondTheEdge;
    }
}

module.exports = { TimeStream, streamForward, streamBackward };
