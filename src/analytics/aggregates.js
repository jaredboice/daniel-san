const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { deepCopy } = require('../utility/dataStructures');
const {
    isThisWithinXPercentOfThat,
    findGreatestValueSnapshots,
    findGreatestPositiveValueSnapshots,
    findGreatestNegativeValueSnapshots
} = require('./index.js');
const { createTimeZone } = require('../timeZone');
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
    MONDAY,
    POSITIVE,
    NEGATIVE,
    BOTH,
    DATE_DELIMITER,
    AGGREGATE,
    DEFAULT_SELECTION_AMOUNT
} = require('../constants');

// TODO: the primary aggregate functions here could most certainly be abstracted and modularized further, thereby decreasing the amount of code in this file.

const aggregateGreatestValuesListProcess = ({
    aggregate,
    events,
    propertyKey,
    flowDirection,
    selectionLimit,
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
                selectionLimit,
                reverse
            });
            break;
        case NEGATIVE:
            collection = findGreatestNegativeValueSnapshots({
                events: newList,
                propertyKey,
                selectionLimit,
                reverse
            });
            break;
        case BOTH:
            collection = findGreatestValueSnapshots({
                events: newList,
                propertyKey,
                selectionLimit,
                reverse
            });
            break;
        default:
            collection = findGreatestValueSnapshots({
                events: newList,
                propertyKey,
                selectionLimit,
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
    if (newSet.length > 2) {
        const maxFrequency = newSet[0].frequency;
        const thereIsAtLeastOneMode = newSet.some((element) => {
            return element.frequency < maxFrequency;
        });
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
    let medians = [];
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
    medians = medians.sort((a, b) => {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    });
    return medians;
};

const pushToMediansAndModesList = ({ value, xPercentRange, transientData }) => {
    let matchFound = false;
    for (let looper = 0; looper < transientData.modeDataSet.length; looper++) {
        if (transientData.modeDataSet[looper].value.toString() === value.toString()) {
            // toString for more precise comparison
            transientData.modeDataSet[looper].frequency++;
            matchFound = true;
        } else if (
            isThisWithinXPercentOfThat({
                value: transientData.modeDataSet[looper].value,
                xPercentRange,
                xPercentTarget: value
            })
        ) {
            // toString for more precise comparison
            transientData.modeDataSet[looper].frequency++;
            // since we are matching on xPercentRange functionality, we should really increment the frequency of both values
            let indexOfValue = -1;
            // eslint-disable-next-line no-loop-func
            matchFound = transientData.modeDataSet.some((element, index) => {
                if (looper !== index) {
                    if (element.value.toString() === value.toString()) {
                        indexOfValue = index;
                        if (indexOfValue > 0) {
                            transientData.modeDataSet[indexOfValue].frequency++;
                            return true;
                        }
                    }
                }
            });
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
    xPercentRange,
    transientData
}) => {
    if (flowDirection === POSITIVE && event[propertyKey] > 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: event[propertyKey], xPercentRange, transientData });
    } else if (flowDirection === NEGATIVE && event[propertyKey] < 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: Math.abs(event[propertyKey]), xPercentRange, transientData });
    } else if (flowDirection === BOTH && event[propertyKey] !== 0) {
        aggregate.eventCount++;
        pushToMediansAndModesList({ value: event[propertyKey], xPercentRange, transientData });
    }
};

const aggregateMediansAndModesInit = ({ aggregate, event, date, propertyKey, flowDirection, transientData }) => {
    transientData.modeDataSet = [];
    transientData.medianDataSet = [];
};

/*
    TODO:
    due to remove the following variables from the aggregate assignment structs, they can probably be removed from several functions

    frequency,
    propertyKey,
    flowDirection,
    selectionLimit,
    modeMax,
    xPercentRange,
    dayCycles
    
*/






const findAnnualAggregates = ({
    name,
    type,
    frequency = ANNUALLY,
    events,
    propertyKey = 'balanceEnding',
    fiscalYearStart,
    flowDirection = BOTH,
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
    reverse = false,
    modeMax,
    xPercentRange = 0,
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
        let effectiveDateStartString;
        if (!fiscalYearStart) {
            effectiveDateStartString = aggregateDateStart
                .clone()
                .startOf('year')
                .format(DATE_FORMAT_STRING);
        } else {
            const dateStartSplit = events[0].dateStart.split(DATE_DELIMITER);
            let potentialDateStartString = `${dateStartSplit[0]}${DATE_DELIMITER}${fiscalYearStart}`;
            if (potentialDateStartString > events[0].dateStart) {
                // we have to make sure that the effectiveDateStartString is less than the dateStart of the first event
                let oldYearString = potentialDateStartString.split(DATE_DELIMITER)[0];
                let oldYearNumber = parseInt(oldYearString, 10);
                oldYearNumber -= 1;
                const unpaddedNewYearString = oldYearNumber.toString();
                const paddedNewYearString = unpaddedNewYearString.padStart(4, '0');
                effectiveDateStartString = paddedNewYearString;
            } else {
                effectiveDateStartString = potentialDateStartString;
            }
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
            entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
            group: name,
            type,
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
                    xPercentRange,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            // if we hit the termDate with a zero event count then reset the termDate and the aggregate dateStart
            if (currentDateInFocus === termDateString && aggregate.eventCount === 0) {
                aggregate.dateStart = currentDateInFocus;
                aggregate.dateEnd = currentDateInFocus; // default value
                termDateString = timeStream.looperDate
                    .clone()
                    .add(1, 'years')
                    .add(-1, 'days')
                    .format(DATE_FORMAT_STRING);
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
                    selectionLimit,
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
                        entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
                        group: name,
                        type,
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
    fiscalYearStart,
    flowDirection = BOTH,
    modeMax = 5,
    xPercentRange = 0,
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
        fiscalYearStart,
        flowDirection,
        modeMax,
        xPercentRange,
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
    fiscalYearStart,
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
        fiscalYearStart,
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
    fiscalYearStart,
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
        fiscalYearStart,
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
    fiscalYearStart,
    flowDirection = BOTH,
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
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
        fiscalYearStart,
        flowDirection,
        selectionLimit,
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
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
    reverse = false,
    modeMax,
    xPercentRange = 0,
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
            entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
            group: name,
            type,
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
                    xPercentRange,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            // if we hit the termDate with a zero event count then reset the termDate and the aggregate dateStart
            if (currentDateInFocus === termDateString && aggregate.eventCount === 0) {
                aggregate.dateStart = currentDateInFocus;
                aggregate.dateEnd = currentDateInFocus; // default value
                termDateString = timeStream.looperDate
                    .clone()
                    .endOf('month')
                    .format(DATE_FORMAT_STRING);
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
                    selectionLimit,
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
                        entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
                        group: name,
                        type,
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
    xPercentRange = 0,
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
        xPercentRange,
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
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
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
        selectionLimit,
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
    cycleDateStart = null, // for findDayCycleAggregates
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
    reverse = false,
    modeMax,
    xPercentRange = 0,
    aggregateInit = () => {},
    aggregateEventProcess = () => {},
    aggregateListProcess = () => {},
    transientData = {}
}) => {
    try {
        const aggregateDateStart = createTimeZone({
            timeZone: events[0].timeZone,
            timeZoneType: events[0].timeZoneType,
            dateString: cycleDateStart || events[0].dateStart
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
            // eslint-disable-next-line no-lonely-if
            if (aggregateDateStart.format(DATE_FORMAT_STRING) <= events[0].dateStart) {
                effectiveDateStart = aggregateDateStart;
            } else {
                let newDate = aggregateDateStart.clone().add(-dayCycles, 'days');
                while (newDate.format(DATE_FORMAT_STRING) > events[0].dateStart) {
                    newDate = newDate.clone().add(-dayCycles, 'days');
                }
                effectiveDateStart = newDate;
            }
        }
        const timeStream = new TimeStream({
            effectiveDateStartString: effectiveDateStart.format(DATE_FORMAT_STRING),
            effectiveDateEndString: aggregateDateEnd.format(DATE_FORMAT_STRING),
            timeStartString: null,
            timeEndString: null,
            timeZone: events[0].timeZone, // all of the events should be expected to share the same timeZone
            timeZoneType: events[0].timeZoneType
        });
        const aggregates = [];
        let aggregate = {
            entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
            group: name,
            type,
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
                    xPercentRange,
                    transientData
                });
                // end logic unique to this specific function
                eventLooper++;
            }
            // if we hit the termDate with a zero event count then reset the termDate and the aggregate dateStart
            if (currentDateInFocus === termDateString && aggregate.eventCount === 0) {
                aggregate.dateStart = currentDateInFocus;
                aggregate.dateEnd = currentDateInFocus; // default value
                termDateString = timeStream.looperDate
                    .clone()
                    .add(dayCycles - 1, 'days') // if timeStream.looperDate starts the cycle on MONDAY, we only want to calculate our EventProcess through SUNDAY of the same week, inclusively
                    .format(DATE_FORMAT_STRING);
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
                    cycleDateStart,
                    selectionLimit,
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
                        entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
                        group: name,
                        type,
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
    xPercentRange = 0,
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
        xPercentRange,
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
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
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
        selectionLimit,
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
    cycleDateStart = null,
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
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
            cycleDateStart,
            selectionLimit,
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
    cycleDateStart = null,
    modeMax = 5,
    xPercentRange = 0,
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
        cycleDateStart,
        modeMax,
        xPercentRange,
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
    cycleDateStart = null,
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
        cycleDateStart,
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
    cycleDateStart = null,
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
        cycleDateStart,
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
    cycleDateStart = null,
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
    reverse = false,
    xPercentRange = 0,
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
        cycleDateStart,
        selectionLimit,
        reverse,
        xPercentRange,
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
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
    reverse = false,
    modeMax = 5,
    xPercentRange = 0,
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
                entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
                group: name,
                type,
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
                        xPercentRange,
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
                        selectionLimit,
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
                            entityType: AGGREGATE, // can be used to categorize if an object is a rule, event, or an aggregate
                            group: name,
                            type,
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
    xPercentRange = 0,
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
        xPercentRange,
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
    selectionLimit = DEFAULT_SELECTION_AMOUNT,
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
        selectionLimit,
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
