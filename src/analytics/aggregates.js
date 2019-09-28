const moment = require('moment');
const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { deepCopy } = require('../utility/dataStructures');
const {
    findGreatestValueSnapshots,
    findGreatestPositiveValueSnapshots,
    findGreatestNegativeValueSnapshots
} = require('./index.js');
const { initializeTimeZoneData, createTimeZone, convertTimeZone } = require('../timeZone');
const { TimeStream } = require('../timeStream');
const {
    DATE_FORMAT_STRING,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAY_CYCLES,
    DATE_SETS,
    SUMS_AND_AVERAGES,
    MEDIANS_AND_MODES,
    MINIMUMS_AND_MAXIMUMS,
    GREATEST_VALUES,
    ONCE,
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    POSITIVE,
    NEGATIVE,
    BOTH,
    DATE_DELIMITER
} = require('../constants');

// TODO: the primary aggregate functions here could most certainly be abstracted and modularized further, thereby decreasing the amount of code in this file.

const aggregateGreatestValuesListProcess = ({
    aggregate,
    events,
    propertyKey,
    flowDirection,
    selectionAmount,
    reverse,
    transientData
}) => {
    /*
        TODO: performance could be increased if we replaced the functions being called below with dedicated functions 
            since we are reusing the snapshot functions, we have to accomodate the object data struture by first creating a value list and then adding back the propertyKey
            if we created dedicated functions for each switch case with simple array data structures, we could speed this process up
            also we are using findGreatestPositiveValueSnapshots for least value situations too by reversing the sort (another performance hit)
    */
    const valueList = transientData.dataSet.map((obj) => obj[propertyKey]);
    const set = Array.from(new Set(valueList));
    const newList = set.map((value) => {
        return { [propertyKey]: value };
    });
    let collection = [];
    switch (flowDirection) {
        case POSITIVE:
            collection = findGreatestPositiveValueSnapshots({
                events: newList,
                propertyKey,
                selectionAmount,
                reverse
            });
            break;
        case NEGATIVE:
            collection = findGreatestNegativeValueSnapshots({
                events: newList,
                propertyKey,
                selectionAmount,
                reverse
            });
            break;
        case BOTH:
            collection = findGreatestValueSnapshots({
                events: newList,
                propertyKey,
                selectionAmount,
                reverse
            });
            break;
        default:
            collection = findGreatestValueSnapshots({
                events: newList,
                propertyKey,
                selectionAmount,
                reverse
            });
            break;
    }
    if (reverse) {
        aggregate.leastValues = collection.map((obj) => obj[propertyKey]);
    } else {
        aggregate.greatestValues = collection.map((obj) => obj[propertyKey]);
    }
};

const aggregateGreatestValuesEventProcess = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    if (flowDirection === POSITIVE && event[propertyKey] > 0) {
        aggregate.eventCount++;
        transientData.dataSet.push({ [propertyKey]: event[propertyKey] });
    } else if (flowDirection === NEGATIVE && event[propertyKey] < 0) {
        aggregate.eventCount++;
        transientData.dataSet.push({ [propertyKey]: event[propertyKey] });
    } else if (flowDirection === BOTH && event[propertyKey] !== 0) {
        aggregate.eventCount++;
        transientData.dataSet.push({ [propertyKey]: event[propertyKey] });
    }
};

const aggregateGreatestValuesInit = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    transientData.dataSet = [];
};

const aggregateSumsAndAvgsEventProcess = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    if (flowDirection === POSITIVE && event[propertyKey] > 0) {
        aggregate.eventCount++;
        aggregate.sum += event[propertyKey];
    } else if (flowDirection === NEGATIVE && event[propertyKey] < 0) {
        aggregate.eventCount++;
        aggregate.sum += Math.abs(event[propertyKey]);
    } else if (flowDirection === BOTH && event[propertyKey] !== 0) {
        aggregate.eventCount++;
        aggregate.sum += event[propertyKey];
    }
};

const aggregateSumsAndAvgsListProcess = ({ aggregate, events, propertyKey, flowDirection, transientData }) => {
    aggregate.average = aggregate.sum / aggregate.eventCount;
};

const aggregateSumsAndAvgsInit = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    aggregate.sum = 0;
};

const aggregateMinimumsAndMaximumsEventProcess = ({
    aggregate,
    event,
    date,
    propertyKey,
    flowDirection,
    transientData
}) => {
    if (flowDirection === POSITIVE && event[propertyKey] > 0) {
        aggregate.eventCount++;
        if (!aggregate.max || event[propertyKey] > aggregate.max) {
            aggregate.max = event[propertyKey];
        }
        if (!aggregate.min || event[propertyKey] < aggregate.min) {
            aggregate.min = event[propertyKey];
        }
    } else if (flowDirection === NEGATIVE && event[propertyKey] < 0) {
        aggregate.eventCount++;
        if (!aggregate.max || Math.abs(event[propertyKey]) > aggregate.max) {
            aggregate.max = Math.abs(event[propertyKey]);
        }
        if (!aggregate.min || Math.abs(event[propertyKey]) < aggregate.min) {
            aggregate.min = Math.abs(event[propertyKey]);
        }
    } else if (flowDirection === BOTH && event[propertyKey] !== 0) {
        aggregate.eventCount++;
        if (!aggregate.max || event[propertyKey] > aggregate.max) {
            aggregate.max = event[propertyKey];
        }
        if (!aggregate.min || event[propertyKey] < aggregate.min) {
            aggregate.min = event[propertyKey];
        }
    }
};

const aggregateMinimumsAndMaximumsInit = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {};

const findModes = (set, modeMax = 5) => {
    const modes = [];
    const transientSet = deepCopy(set);
    const newSet = transientSet.sort((a, b) => {
        if (a.frequency < b.frequency) {
            return 1;
        } else if (a.frequency > b.frequency) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    });
    const maxFrequency = newSet[0].frequency;
    const thereIsAtLeastOneMode = newSet.some((element) => {
        return element.frequency < maxFrequency;
    });
    if (newSet.length > 2) {
        if (thereIsAtLeastOneMode) {
            const finalSet = newSet.filter((element) => {
                return element.frequency === maxFrequency;
            });
            const setLength = modeMax <= finalSet.length ? modeMax : finalSet.length;
            for (let looper = 0; looper < setLength; looper++) {
                modes.push(finalSet[looper]);
            }
        } else if (newSet.length === 2) {
            if (newSet[0] === newSet[1]) {
                modes.push(newSet[0]);
                modes.push(newSet[1]);
            }
        } else {
            return [];
        }
    }
    const finalModes = modes.map((mode) => mode.value);
    return finalModes;
};

const findMedians = (set) => {
    const medians = [];
    const transientSet = deepCopy(set);
    const newSet = transientSet.sort((a, b) => {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    });
    const setLength = newSet.length;
    let midPointIndex;
    if (setLength > 2) {
        if (setLength % 2 > 0) {
            midPointIndex = Math.ceil(setLength / 2);
            medians.push(newSet[midPointIndex]);
        } else {
            midPointIndex = setLength / 2;
            medians.push(newSet[midPointIndex]);
            medians.push(newSet[midPointIndex + 1]);
        }
    }
    return medians;
};

const pushToMediansAndModesList = ({ value, transientData }) => {
    let matchFound = false;
    for (let looper = 0; looper < transientData.modeDataSet.length; looper++) {
        if (transientData.modeDataSet[looper].value.toString() === value.toString()) {
            // toString for more precise comparison
            transientData.modeDataSet[looper].frequency++;
            matchFound = true;
            break;
        }
    }
    if (!matchFound) {
        transientData.modeDataSet.push({ value, frequency: 1 });
    }
    transientData.medianDataSet.push(value);
};

const aggregateMediansAndModesListProcess = ({
    aggregate,
    events,
    propertyKey,
    flowDirection,
    modeMax = 5,
    transientData
}) => {
    const modes = findModes(transientData.modeDataSet, modeMax);
    const medians = findMedians(transientData.medianDataSet);
    aggregate.modes = modes;
    aggregate.medians = medians;
};

const aggregateMediansAndModesEventProcess = ({
    aggregate,
    event,
    date,
    propertyKey,
    flowDirection,
    transientData
}) => {
    if (flowDirection === POSITIVE && event[propertyKey] > 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: event[propertyKey], transientData });
    } else if (flowDirection === NEGATIVE && event[propertyKey] < 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: Math.abs(event[propertyKey]), transientData });
    } else if (flowDirection === BOTH && event[propertyKey] !== 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: event[propertyKey], transientData });
    }
};

const aggregateMediansAndModesInit = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    aggregate.propertyKey = propertyKey;
    aggregate.flowDirection = flowDirection;
    transientData.modeDataSet = [];
    transientData.medianDataSet = [];
};

const findAnnualAggregates = ({
    name,
    type,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    selectionAmount = 7,
    reverse = false,
    modeMax,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {},
    fiscalYearStart
}) => {
    try {
        const aggregateDateStart = createTimeZone({
            timeZone: events[0].timeZone,
            timeZoneType: events[0].timeZoneType,
            dateString: events[0].dateStart
        });
        const aggregateDateEnd = createTimeZone({
            timeZone: events[events.length - 1].timeZone,
            timeZoneType: events[events.length - 1].timeZoneType,
            dateString: events[events.length - 1].dateStart // an event's dateEnd is definitely not relevant since there is no need to loop over extra days when there are no more new events
        });
        let effectiveDateStartString;
        const dateStartSplit = events[0].dateStart.split(DATE_DELIMITER);
        if (!fiscalYearStart || `${dateStartSplit[0]}${DATE_DELIMITER}${fiscalYearStart}` > events[0].dateStart) {
            effectiveDateStartString = aggregateDateStart
                .clone()
                .startOf('year')
                .format(DATE_FORMAT_STRING);
        } else {
            effectiveDateStartString = `${dateStartSplit[0]}${DATE_DELIMITER}${fiscalYearStart}`;
        }
        const timeStream = new TimeStream({
            effectiveDateStartString,
            effectiveDateEndString: aggregateDateEnd.format(DATE_FORMAT_STRING),
            timeStartString: null,
            timeEndString: null,
            timeZone: events[0].timeZone, // all of the events should be expected to share the same timeZone
            timeZoneType: events[0].timeZoneType
        });
        const aggregates = [];
        let aggregate = {
            name,
            type,
            frequency,
            propertyKey,
            flowDirection,
            selectionAmount,
            reverse,
            modeMax,
            eventCount: 0,
            dateStart: timeStream.effectiveDateStartString,
            dateEnd: timeStream.effectiveDateStartString // default value; it will most likely be modified
        };
        aggregateInit({
            aggregate,
            event: events[0],
            date: timeStream.looperDate,
            propertyKey,
            flowDirection,
            transientData
        });
        let breakLoop = false;
        let eventLooper = 0;
        let event;
        let termDateString = timeStream.looperDate
            .clone()
            .add(1, 'years')
            .add(-1, 'days')
            .format(DATE_FORMAT_STRING);
        do {
            let currentDateInFocus = timeStream.looperDate.format(DATE_FORMAT_STRING);
            while (
                eventLooper < events.length &&
                events[eventLooper].dateStart === currentDateInFocus &&
                !isUndefinedOrNull(events[eventLooper][propertyKey])
            ) {
                event = events[eventLooper];
                // begin logic unique to this specific function
                aggregateEventProcess({
                    aggregate,
                    event,
                    date: timeStream.looperDate,
                    propertyKey,
                    flowDirection,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            if (
                aggregate.eventCount > 0 &&
                (timeStream.looperDate.format(DATE_FORMAT_STRING) >= termDateString || eventLooper === events.length)
            ) {
                aggregateListProcess({
                    aggregate,
                    events,
                    propertyKey,
                    flowDirection,
                    selectionAmount,
                    reverse,
                    modeMax,
                    transientData
                });
                aggregate.dateEnd = timeStream.looperDate.format(DATE_FORMAT_STRING);
                aggregates.push(aggregate);
                termDateString = timeStream.looperDate
                    .clone()
                    .add(1, 'years')
                    .add(-1, 'days')
                    .format(DATE_FORMAT_STRING); // FORCE the last day of the month (obviously since months do not all have the same amount of days);
                if (eventLooper >= events.length) {
                    breakLoop = true;
                }
                if (!breakLoop) {
                    aggregate = {
                        name,
                        type,
                        frequency,
                        propertyKey,
                        flowDirection,
                        selectionAmount,
                        reverse,
                        modeMax,
                        eventCount: 0,
                        dateStart: events[eventLooper].dateStart,
                        dateEnd: events[eventLooper].dateStart // default value; it will most likely be modified
                    };
                    aggregateInit({
                        aggregate,
                        event: events[eventLooper],
                        date: timeStream.looperDate,
                        propertyKey,
                        flowDirection,
                        transientData
                    });
                }
            }
        } while (!breakLoop && timeStream.stream1DayForward());
        return aggregates;
    } catch (err) {
        throw errorDisc({ err });
    }
};

const findAnnualMediansAndModes = ({
    name,
    type = MEDIANS_AND_MODES,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findAnnualAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        modeMax,
        aggregateInit: aggregateMediansAndModesInit,
        aggregateEventProcess: aggregateMediansAndModesEventProcess,
        aggregateListProcess: aggregateMediansAndModesListProcess,
        transientData
    });
    return aggregates;
};

const findAnnualSumsAndAvgs = ({
    name,
    type = SUMS_AND_AVERAGES,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findAnnualAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        aggregateInit: aggregateSumsAndAvgsInit,
        aggregateEventProcess: aggregateSumsAndAvgsEventProcess,
        aggregateListProcess: aggregateSumsAndAvgsListProcess,
        transientData
    });
    return aggregates;
};

const findAnnualMinimumsAndMaximums = ({
    name,
    type = MINIMUMS_AND_MAXIMUMS,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findAnnualAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        aggregateInit: aggregateMinimumsAndMaximumsInit,
        aggregateEventProcess: aggregateMinimumsAndMaximumsEventProcess,
        transientData
    });
    return aggregates;
};

const findAnnualGreatestValues = ({
    name,
    type = GREATEST_VALUES,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    selectionAmount = 7,
    reverse = false,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findAnnualAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        selectionAmount,
        reverse,
        aggregateInit: aggregateGreatestValuesInit,
        aggregateEventProcess: aggregateGreatestValuesEventProcess,
        aggregateListProcess: aggregateGreatestValuesListProcess,
        transientData
    });
    return aggregates;
};

const findMonthlyAggregates = ({
    name,
    type,
    frequency = MONTHLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    selectionAmount = 7,
    reverse = false,
    modeMax,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    try {
        const aggregateDateStart = createTimeZone({
            timeZone: events[0].timeZone,
            timeZoneType: events[0].timeZoneType,
            dateString: events[0].dateStart
        });
        const aggregateDateEnd = createTimeZone({
            timeZone: events[events.length - 1].timeZone,
            timeZoneType: events[events.length - 1].timeZoneType,
            dateString: events[events.length - 1].dateStart // an event's dateEnd is definitely not relevant since there is no need to loop over extra days when there are no more new events
        });
        const timeStream = new TimeStream({
            effectiveDateStartString: aggregateDateStart
                .clone()
                .startOf('month')
                .format(DATE_FORMAT_STRING),
            effectiveDateEndString: aggregateDateEnd.format(DATE_FORMAT_STRING),
            timeStartString: null,
            timeEndString: null,
            timeZone: events[0].timeZone, // all of the events should be expected to share the same timeZone
            timeZoneType: events[0].timeZoneType
        });
        const aggregates = [];
        let aggregate = {
            name,
            type,
            frequency,
            propertyKey,
            flowDirection,
            selectionAmount,
            reverse,
            modeMax,
            eventCount: 0,
            dateStart: timeStream.effectiveDateStartString,
            dateEnd: timeStream.effectiveDateStartString // default value; it will most likely be modified
        };
        aggregateInit({
            aggregate,
            event: events[0],
            date: timeStream.looperDate,
            propertyKey,
            flowDirection,
            transientData
        });
        let breakLoop = false;
        let eventLooper = 0;
        let event;
        let termDateString = timeStream.looperDate
            .clone()
            .endOf('month')
            .format(DATE_FORMAT_STRING);
        do {
            let currentDateInFocus = timeStream.looperDate.format(DATE_FORMAT_STRING);
            while (
                eventLooper < events.length &&
                events[eventLooper].dateStart === currentDateInFocus &&
                !isUndefinedOrNull(events[eventLooper][propertyKey])
            ) {
                event = events[eventLooper];
                // begin logic unique to this specific function
                aggregateEventProcess({
                    aggregate,
                    event,
                    date: timeStream.looperDate,
                    propertyKey,
                    flowDirection,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            if (
                aggregate.eventCount > 0 &&
                (timeStream.looperDate.format(DATE_FORMAT_STRING) >= termDateString || eventLooper === events.length)
            ) {
                aggregateListProcess({
                    aggregate,
                    events,
                    propertyKey,
                    flowDirection,
                    selectionAmount,
                    reverse,
                    modeMax,
                    transientData
                });
                aggregate.dateEnd = timeStream.looperDate.format(DATE_FORMAT_STRING);
                aggregates.push(aggregate);
                termDateString = timeStream.looperDate
                    .clone()
                    .add(1, 'months')
                    .endOf('month')
                    .format(DATE_FORMAT_STRING); // FORCE the last day of the month (obviously since months do not all have the same amount of days);
                if (eventLooper >= events.length) {
                    breakLoop = true;
                }
                if (!breakLoop) {
                    aggregate = {
                        name,
                        type,
                        frequency,
                        propertyKey,
                        flowDirection,
                        selectionAmount,
                        reverse,
                        modeMax,
                        eventCount: 0,
                        dateStart: events[eventLooper].dateStart,
                        dateEnd: events[eventLooper].dateStart // default value; it will most likely be modified
                    };
                    aggregateInit({
                        aggregate,
                        event: events[eventLooper],
                        date: timeStream.looperDate,
                        propertyKey,
                        flowDirection,
                        transientData
                    });
                }
            }
        } while (!breakLoop && timeStream.stream1DayForward());
        return aggregates;
    } catch (err) {
        throw errorDisc({ err });
    }
};

const findMonthlyMediansAndModes = ({
    name,
    type = MEDIANS_AND_MODES,
    frequency = MONTHLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findMonthlyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        modeMax,
        aggregateInit: aggregateMediansAndModesInit,
        aggregateEventProcess: aggregateMediansAndModesEventProcess,
        aggregateListProcess: aggregateMediansAndModesListProcess,
        transientData
    });
    return aggregates;
};

const findMonthlySumsAndAvgs = ({
    name,
    type = SUMS_AND_AVERAGES,
    frequency = MONTHLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findMonthlyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        aggregateInit: aggregateSumsAndAvgsInit,
        aggregateEventProcess: aggregateSumsAndAvgsEventProcess,
        aggregateListProcess: aggregateSumsAndAvgsListProcess,
        transientData
    });
    return aggregates;
};

const findMonthlyMinimumsAndMaximums = ({
    name,
    type = MINIMUMS_AND_MAXIMUMS,
    frequency = MONTHLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findMonthlyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        aggregateInit: aggregateMinimumsAndMaximumsInit,
        aggregateEventProcess: aggregateMinimumsAndMaximumsEventProcess,
        transientData
    });
    return aggregates;
};

const findMonthlyGreatestValues = ({
    name,
    type = GREATEST_VALUES,
    frequency = MONTHLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    selectionAmount = 7,
    reverse = false,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findMonthlyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        selectionAmount,
        reverse,
        aggregateInit: aggregateGreatestValuesInit,
        aggregateEventProcess: aggregateGreatestValuesEventProcess,
        aggregateListProcess: aggregateGreatestValuesListProcess,
        transientData
    });
    return aggregates;
};

const findWeeklyAggregates = ({
    name,
    type,
    frequency = WEEKLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    dayCycles = 7, // this variable is adjustable in findDayCycleAggregates
    dayCycleStart = null, // for findDayCycleAggregates
    selectionAmount = 7,
    reverse = false,
    modeMax,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    try {
        let dayCycleFunctionality = false;
        const aggregateDateStart = createTimeZone({
            timeZone: events[0].timeZone,
            timeZoneType: events[0].timeZoneType,
            dateString: events[0].dateStart
        });
        const aggregateDateEnd = createTimeZone({
            timeZone: events[events.length - 1].timeZone,
            timeZoneType: events[events.length - 1].timeZoneType,
            dateString: events[events.length - 1].dateStart // an event's dateEnd is definitely not relevant since there is no need to loop over extra days when there are no more new events
        });
        let effectiveDateStart = aggregateDateStart;
        if (!isUndefinedOrNull(weekdayStart)) {
            if (aggregateDateStart.day() === weekdayStart) {
                effectiveDateStart = aggregateDateStart;
            } else {
                let newDate = aggregateDateStart.clone().add(-1, 'days');
                while (newDate.day() !== weekdayStart) {
                    newDate = newDate.clone().add(-1, 'days');
                }
                effectiveDateStart = newDate;
            }
        } else {
            // scenario for findDayCycleAggregates
            dayCycleFunctionality = true;
        }
        const timeStream = new TimeStream({
            effectiveDateStartString:
                dayCycleFunctionality && dayCycleStart ? dayCycleStart : effectiveDateStart.format(DATE_FORMAT_STRING),
            effectiveDateEndString: aggregateDateEnd.format(DATE_FORMAT_STRING),
            timeStartString: null,
            timeEndString: null,
            timeZone: events[0].timeZone, // all of the events should be expected to share the same timeZone
            timeZoneType: events[0].timeZoneType
        });
        const aggregates = [];
        let aggregate = {
            name,
            type,
            frequency,
            propertyKey,
            flowDirection,
            selectionAmount,
            reverse,
            modeMax,
            dayCycles,
            eventCount: 0,
            dateStart: timeStream.effectiveDateStartString,
            dateEnd: timeStream.effectiveDateStartString // default value; it will most likely be modified
        };
        aggregateInit({
            aggregate,
            event: events[0],
            date: timeStream.looperDate,
            propertyKey,
            flowDirection,
            transientData
        });
        let breakLoop = false;
        let eventLooper = 0;
        let event;
        let termDateString = timeStream.looperDate
            .clone()
            .add(dayCycles - 1, 'days') // if timeStream.looperDate starts the cycle on MONDAY, we only want to calculate our EventProcess through SUNDAY of the same week, inclusively
            .format(DATE_FORMAT_STRING);
        do {
            let currentDateInFocus = timeStream.looperDate.format(DATE_FORMAT_STRING);
            while (
                eventLooper < events.length &&
                events[eventLooper].dateStart === currentDateInFocus &&
                !isUndefinedOrNull(events[eventLooper][propertyKey])
            ) {
                event = events[eventLooper];
                // begin logic unique to this specific function
                aggregateEventProcess({
                    aggregate,
                    event,
                    date: timeStream.looperDate,
                    propertyKey,
                    flowDirection,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            if (
                aggregate.eventCount > 0 &&
                (timeStream.looperDate.format(DATE_FORMAT_STRING) >= termDateString || eventLooper === events.length)
            ) {
                aggregateListProcess({
                    aggregate,
                    events,
                    propertyKey,
                    flowDirection,
                    weekdayStart,
                    dayCycles,
                    dayCycleStart,
                    selectionAmount,
                    reverse,
                    modeMax,
                    transientData
                }); // TODO: the parameters being passed to some of the aggregateInit and aggregateEventProcess and aggregateListProcess are sometimes not even being used
                aggregate.dateEnd = timeStream.looperDate.format(DATE_FORMAT_STRING);
                aggregates.push(aggregate);
                termDateString = timeStream.looperDate
                    .clone()
                    .add(dayCycles, 'days') // if timeStream.looperDate ends the previous cycle on SUNDAY, we want to calculate our EventProcess through SUNDAY of the coming week, inclusively
                    .format(DATE_FORMAT_STRING); // FORCE the last day of the month (obviously since months do not all have the same amount of days);
                if (eventLooper >= events.length) {
                    breakLoop = true;
                }
                if (!breakLoop) {
                    aggregate = {
                        name,
                        type,
                        frequency,
                        propertyKey,
                        flowDirection,
                        selectionAmount,
                        reverse,
                        modeMax,
                        dayCycles,
                        eventCount: 0,
                        dateStart: events[eventLooper].dateStart,
                        dateEnd: events[eventLooper].dateStart // default value; it will most likely be modified
                    };
                    aggregateInit({
                        aggregate,
                        event: events[eventLooper],
                        date: timeStream.looperDate,
                        propertyKey,
                        flowDirection,
                        transientData
                    });
                }
            }
        } while (!breakLoop && timeStream.stream1DayForward());
        return aggregates;
    } catch (err) {
        throw errorDisc({ err });
    }
};

const findWeeklyMediansAndModes = ({
    name,
    type = MEDIANS_AND_MODES,
    frequency = WEEKLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findWeeklyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        modeMax,
        aggregateInit: aggregateMediansAndModesInit,
        aggregateEventProcess: aggregateMediansAndModesEventProcess,
        aggregateListProcess: aggregateMediansAndModesListProcess,
        transientData
    });
    return aggregates;
};

const findWeeklySumsAndAvgs = ({
    name,
    type = SUMS_AND_AVERAGES,
    frequency = WEEKLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findWeeklyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        aggregateInit: aggregateSumsAndAvgsInit,
        aggregateEventProcess: aggregateSumsAndAvgsEventProcess,
        aggregateListProcess: aggregateSumsAndAvgsListProcess,
        transientData
    });
    return aggregates;
};

const findWeeklyMinimumsAndMaximums = ({
    name,
    type = MINIMUMS_AND_MAXIMUMS,
    frequency = WEEKLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findWeeklyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        aggregateInit: aggregateMinimumsAndMaximumsInit,
        aggregateEventProcess: aggregateMinimumsAndMaximumsEventProcess,
        transientData
    });
    return aggregates;
};

const findWeeklyGreatestValues = ({
    name,
    type = GREATEST_VALUES,
    frequency = WEEKLY,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    selectionAmount = 7,
    reverse = false,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findWeeklyAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        selectionAmount,
        reverse,
        aggregateInit: aggregateGreatestValuesInit,
        aggregateEventProcess: aggregateGreatestValuesEventProcess,
        aggregateListProcess: aggregateGreatestValuesListProcess,
        transientData
    });
    return aggregates;
};

const findDayCycleAggregates = ({
    name,
    type,
    frequency = DAY_CYCLES,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = null,
    dayCycles = 30,
    dayCycleStart = null,
    selectionAmount = 7,
    reverse = false,
    modeMax,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    try {
        return findWeeklyAggregates({
            name,
            type,
            frequency,
            events,
            propertyKey,
            flowDirection,
            weekdayStart,
            dayCycles,
            dayCycleStart,
            selectionAmount,
            reverse,
            modeMax,
            aggregateInit,
            aggregateEventProcess,
            aggregateListProcess,
            transientData
        });
    } catch (err) {
        throw errorDisc({ err });
    }
};

const findDayCycleMediansAndModes = ({
    name,
    type = MEDIANS_AND_MODES,
    frequency = DAY_CYCLES,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = null,
    dayCycles = 30,
    dayCycleStart = null,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDayCycleAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        dayCycles,
        dayCycleStart,
        modeMax,
        aggregateInit: aggregateMediansAndModesInit,
        aggregateEventProcess: aggregateMediansAndModesEventProcess,
        aggregateListProcess: aggregateMediansAndModesListProcess,
        transientData
    });
    return aggregates;
};

const findDayCycleSumsAndAvgs = ({
    name,
    type = SUMS_AND_AVERAGES,
    frequency = DAY_CYCLES,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = null,
    dayCycles = 30,
    dayCycleStart = null,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDayCycleAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        dayCycles,
        dayCycleStart,
        aggregateInit: aggregateSumsAndAvgsInit,
        aggregateEventProcess: aggregateSumsAndAvgsEventProcess,
        aggregateListProcess: aggregateSumsAndAvgsListProcess,
        transientData
    });
    return aggregates;
};

const findDayCycleMinimumsAndMaximums = ({
    name,
    type = MINIMUMS_AND_MAXIMUMS,
    frequency = DAY_CYCLES,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = null,
    dayCycles = 30,
    dayCycleStart = null,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDayCycleAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        dayCycles,
        dayCycleStart,
        aggregateInit: aggregateMinimumsAndMaximumsInit,
        aggregateEventProcess: aggregateMinimumsAndMaximumsEventProcess,
        transientData
    });
    return aggregates;
};

const findDayCycleGreatestValues = ({
    name,
    type = GREATEST_VALUES,
    frequency = DAY_CYCLES,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    weekdayStart = MONDAY,
    dayCycles = 30,
    dayCycleStart = null,
    selectionAmount = 7,
    reverse = false,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDayCycleAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        weekdayStart,
        dayCycles,
        dayCycleStart,
        selectionAmount,
        reverse,
        aggregateInit: aggregateGreatestValuesInit,
        aggregateEventProcess: aggregateGreatestValuesEventProcess,
        aggregateListProcess: aggregateGreatestValuesListProcess,
        transientData
    });
    return aggregates;
};

const findDateSetAggregates = ({
    name,
    type,
    frequency = DATE_SETS,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    selectionAmount = 7,
    reverse = false,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {},
    dateSets
}) => {
    try {
        let dateSet;
        let dateSetLooper = 0;
        let breakLoop = false;
        let eventLooper = 0;
        let event;
        let timeStream;
        const aggregates = [];
        while (dateSetLooper < dateSets.length) {
            dateSet = dateSets[dateSetLooper];
            const aggregateDateStart = createTimeZone({
                timeZone: events[0].timeZone,
                timeZoneType: events[0].timeZoneType,
                dateString: dateSet.dateStart
            });
            const aggregateDateEnd = createTimeZone({
                timeZone: events[events.length - 1].timeZone,
                timeZoneType: events[events.length - 1].timeZoneType,
                dateString: dateSet.dateEnd
            });
            const effectiveDateStartString = aggregateDateStart.format(DATE_FORMAT_STRING);
            timeStream = new TimeStream({
                effectiveDateStartString,
                effectiveDateEndString: aggregateDateEnd.format(DATE_FORMAT_STRING),
                timeStartString: null,
                timeEndString: null,
                timeZone: events[0].timeZone, // all of the events should be expected to share the same timeZone
                timeZoneType: events[0].timeZoneType
            });
            let aggregate = {
                name,
                type,
                frequency,
                propertyKey,
                flowDirection,
                selectionAmount,
                reverse,
                modeMax,
                eventCount: 0,
                dateStart: timeStream.effectiveDateStartString,
                dateEnd: timeStream.effectiveDateStartString // default value; it will most likely be modified
            };
            aggregateInit({
                aggregate,
                event: events[0],
                date: timeStream.looperDate,
                propertyKey,
                flowDirection,
                transientData
            });
            let termDateString = aggregateDateEnd.format(DATE_FORMAT_STRING);
            do {
                const currentDateInFocus = timeStream.looperDate.format(DATE_FORMAT_STRING);
                while (
                    eventLooper < events.length &&
                    events[eventLooper].dateStart === currentDateInFocus &&
                    !isUndefinedOrNull(events[eventLooper][propertyKey])
                ) {
                    event = events[eventLooper];
                    // begin logic unique to this specific function
                    aggregateEventProcess({
                        aggregate,
                        event,
                        date: timeStream.looperDate,
                        propertyKey,
                        flowDirection,
                        transientData
                    });
                    // end logic unique to this specific function
                    eventLooper++;
                }
                if (
                    aggregate.eventCount > 0 &&
                    (timeStream.looperDate.format(DATE_FORMAT_STRING) >= termDateString ||
                        eventLooper === events.length)
                ) {
                    aggregateListProcess({
                        aggregate,
                        events,
                        propertyKey,
                        flowDirection,
                        selectionAmount,
                        reverse,
                        modeMax,
                        transientData
                    });
                    aggregate.dateEnd = timeStream.looperDate.format(DATE_FORMAT_STRING);
                    aggregates.push(aggregate);
                    termDateString = timeStream.looperDate
                        .clone()
                        .add(1, 'years')
                        .format(DATE_FORMAT_STRING); // FORCE the last day of the month (obviously since months do not all have the same amount of days);
                    if (eventLooper >= events.length) {
                        breakLoop = true;
                    }
                    if (!breakLoop) {
                        aggregate = {
                            name,
                            type,
                            frequency,
                            propertyKey,
                            flowDirection,
                            selectionAmount,
                            reverse,
                            modeMax,
                            eventCount: 0,
                            dateStart: events[eventLooper].dateStart,
                            dateEnd: events[eventLooper].dateStart // default value; it will most likely be modified
                        };
                        aggregateInit({
                            aggregate,
                            event: events[eventLooper],
                            date: timeStream.looperDate,
                            propertyKey,
                            flowDirection,
                            transientData
                        });
                    }
                }
            } while (!breakLoop && timeStream.stream1DayForward());
            dateSetLooper++;
        }
        return aggregates;
    } catch (err) {
        throw errorDisc({ err });
    }
};

const findDateSetMediansAndModes = ({
    name,
    type = MEDIANS_AND_MODES,
    frequency = DATE_SETS,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    dateSets,
    modeMax = 5,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDateSetAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        dateSets,
        modeMax,
        aggregateInit: aggregateMediansAndModesInit,
        aggregateEventProcess: aggregateMediansAndModesEventProcess,
        aggregateListProcess: aggregateMediansAndModesListProcess,
        transientData
    });
    return aggregates;
};

const findDateSetSumsAndAvgs = ({
    name,
    type = SUMS_AND_AVERAGES,
    frequency = DATE_SETS,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    dateSets,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDateSetAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        dateSets,
        aggregateInit: aggregateSumsAndAvgsInit,
        aggregateEventProcess: aggregateSumsAndAvgsEventProcess,
        aggregateListProcess: aggregateSumsAndAvgsListProcess,
        transientData
    });
    return aggregates;
};

const findDateSetMinimumsAndMaximums = ({
    name,
    type = MINIMUMS_AND_MAXIMUMS,
    frequency = DATE_SETS,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    dateSets,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDateSetAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        dateSets,
        aggregateInit: aggregateMinimumsAndMaximumsInit,
        aggregateEventProcess: aggregateMinimumsAndMaximumsEventProcess,
        transientData
    });
    return aggregates;
};

const findDateSetGreatestValues = ({
    name,
    type = GREATEST_VALUES,
    frequency = DATE_SETS,
    events,
    propertyKey = 'balanceEnding',
    flowDirection = BOTH,
    dateSets,
    selectionAmount = 7,
    reverse = false,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    const aggregates = findDateSetAggregates({
        name,
        type,
        frequency,
        events,
        propertyKey,
        flowDirection,
        dateSets,
        selectionAmount,
        reverse,
        aggregateInit: aggregateGreatestValuesInit,
        aggregateEventProcess: aggregateGreatestValuesEventProcess,
        aggregateListProcess: aggregateGreatestValuesListProcess,
        transientData
    });
    return aggregates;
};

module.exports = {
    aggregateGreatestValuesListProcess,
    aggregateGreatestValuesEventProcess,
    aggregateGreatestValuesInit,
    aggregateSumsAndAvgsEventProcess,
    aggregateSumsAndAvgsListProcess,
    aggregateSumsAndAvgsInit,
    aggregateMinimumsAndMaximumsEventProcess,
    aggregateMinimumsAndMaximumsInit,
    findModes,
    findMedians,
    pushToMediansAndModesList,
    aggregateMediansAndModesEventProcess,
    aggregateMediansAndModesInit,
    findAnnualAggregates,
    findAnnualMediansAndModes,
    findAnnualSumsAndAvgs,
    findAnnualMinimumsAndMaximums,
    findAnnualGreatestValues,
    findMonthlyAggregates,
    findMonthlyMediansAndModes,
    findMonthlySumsAndAvgs,
    findMonthlyMinimumsAndMaximums,
    findMonthlyGreatestValues,
    findWeeklyAggregates,
    findWeeklyMediansAndModes,
    findWeeklySumsAndAvgs,
    findWeeklyMinimumsAndMaximums,
    findWeeklyGreatestValues,
    findDayCycleAggregates,
    findDayCycleMediansAndModes,
    findDayCycleSumsAndAvgs,
    findDayCycleMinimumsAndMaximums,
    findDayCycleGreatestValues,
    findDateSetAggregates,
    findDateSetMediansAndModes,
    findDateSetSumsAndAvgs,
    findDateSetMinimumsAndMaximums,
    findDateSetGreatestValues
};
