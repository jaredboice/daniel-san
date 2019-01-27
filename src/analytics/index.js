const moment = 'moment';
const { isUndefinedOrNull } = require('../utility/validation');
const { DATE_FORMAT_STRING, MONDAY, INFLOW_AND_OUTFLOW, INFLOW, OUTFLOW } = require('../constants');

const findCriticalSnapshots = ({ danielSan, criticalThreshold = 0 }) => {
    let criticalSnapshots = null;
    if (!isUndefinedOrNull(criticalThreshold)) {
        criticalSnapshots = danielSan.events.filter((event) => {
            return event.endBalance < criticalThreshold;
        });
    }
    return criticalSnapshots;
};

const findRulesToRetire = ({ danielSan }) => {
    const { dateStart } = danielSan;
    // eslint-disable-next-line array-callback-return
    const rulesToRetire = danielSan.rules.filter((rule) => {
        if (!isUndefinedOrNull(rule.dateEnd) && dateStart.format(DATE_FORMAT_STRING) >= rule.dateEnd) {
            rulesToRetire.push(rule);
        }
    });
    if (rulesToRetire.length > 0) {
        return rulesToRetire;
    } else {
        return null;
    }
    // eslint-disable-next-line no-unreachable
    return null; // this line satisfies another linting error
};

const findEventsWithProperty = ({ events, propertyKey }) => {
    // eslint-disable-next-line array-callback-return
    const eventsFound = events.filter((event) => {
        // eslint-disable-line consistent-return
        if (event[propertyKey]) {
            return event;
        }
    });
    if (eventsFound.length > 0) {
        return eventsFound;
        // eslint-disable-next-line no-else-return
    } else {
        return null;
    }
    // eslint-disable-next-line no-unreachable
    return null; // this line satisfies another linting error
};

const findEventsByPropertyKeyAndValues = ({ events, propertyKey, searchValues }) => {
    if (events && propertyKey && searchValues && Array.isArray(searchValues) && searchValues.length > 0) {
        const eventsFound = [];
        events.forEach((event) => {
            searchValues.forEach((searchCriteriaValue) => {
                if (event[propertyKey] && event[propertyKey] === searchCriteriaValue) {
                    eventsFound.push(event);
                }
            });
        });
        if (eventsFound && eventsFound.length > 0) {
            return eventsFound;
            // eslint-disable-next-line no-else-return
        } else {
            return null;
        }
        // eslint-disable-next-line no-else-return
    } else {
        return null;
    }
};

const findEventsWithPropertyKeyContainingSubstring = ({ events, propertyKey, substring }) => {
    // eslint-disable-next-line array-callback-return
    const eventsFound = events.filter((event) => {
        // eslint-disable-line consistent-return
        if (event[propertyKey] && event[propertyKey].includes(substring)) {
            return event;
        }
    });
    if (eventsFound.length > 0) {
        return eventsFound;
        // eslint-disable-next-line no-else-return
    } else {
        return null;
    }
    // eslint-disable-next-line no-unreachable
    return null; // this line satisfies another linting error
};

const snapshotsGreaterThanAmount = ({ collection = [], level = 0, propertyKey = 'endBalance' }) => {
    const newCollection = collection.filter((element) => {
        if (element[propertyKey] > level) {
            return element;
        }
    });
    return newCollection;
};

const snapshotsLessThanAmount = ({ collection = [], level = 0, propertyKey = 'endBalance' }) => {
    const newCollection = collection.filter((element) => {
        if (element[propertyKey] < level) {
            return element;
        }
    });
    return newCollection;
};

// this function requires a chronology via preSort by propertyKey
const collectAnnualEvents = ({ collection = [], propertyKey = 'eventDate' }) => {
    const frequencyMatrix = [];
    let frequencies = [];
    let endOfYear =
        collection && collection.length > 0
            ? moment(collection[0][propertyKey], DATE_FORMAT_STRING).endOf('year')
            : null;
    let eventDate = null;
    collection.forEach((element, index) => {
        eventDate = moment(element[propertyKey], DATE_FORMAT_STRING);
        if (frequencies.length < 1) {
            frequencies.push(element); // if the frequencies are empty - then its the start of a new cycle
        }
        if (eventDate.diff(endOfYear, 'days') > 0) {
            frequencyMatrix.push(frequencies);
            frequencies = [];
            if (index === collection.length - 1) {
                // this represents a lonely entity on the last loop, so add it to its own frequency collection
                // in any other scenario, this element would get added to the next round of frequencies
                frequencyMatrix.push([element]);
            } else {
                endOfYear = eventDate.endOf('year');
            }
        } else if (index === collection.length - 1) {
            frequencies.push(element); // while we did not yet enter a new cycle, this is the last loop anyway so wrap it up
            frequencyMatrix.push(frequencies);
        } else {
            frequencies.push(element);
        }
    });
    return frequencyMatrix;
};

// this function requires a chronology via preSort by propertyKey
const collectMonthlyEvents = ({ collection = [], propertyKey = 'eventDate' }) => {
    const frequencyMatrix = [];
    let frequencies = [];
    let endOfMonth =
        collection && collection.length > 0
            ? moment(collection[0][propertyKey], DATE_FORMAT_STRING).endOf('month')
            : null;
    let eventDate = null;
    collection.forEach((element, index) => {
        eventDate = moment(element[propertyKey], DATE_FORMAT_STRING);
        if (frequencies.length < 1) {
            frequencies.push(element); // if the frequencies are empty - then its the start of a new cycle
        }
        if (eventDate.diff(endOfMonth, 'days') > 0) {
            frequencyMatrix.push(frequencies);
            frequencies = [];
            if (index === collection.length - 1) {
                // this represents a lonely entity on the last loop, so add it to its own frequency collection
                // in any other scenario, this element would get added to the next round of frequencies
                frequencyMatrix.push([element]);
            } else {
                endOfMonth = eventDate.endOf('month');
            }
        } else if (index === collection.length - 1) {
            frequencies.push(element); // while we did not yet enter a new cycle, this is the last loop anyway so wrap it up
            frequencyMatrix.push(frequencies);
        } else {
            frequencies.push(element);
        }
    });
    return frequencyMatrix;
};

// this function requires a chronology via preSort by propertyKey
const collectWeeklyEvents = ({ collection = [], propertyKey = 'eventDate', startOfWeek = MONDAY }) => {
    const frequencyMatrix = [];
    let frequencies = [];
    let nextWeek =
        collection && collection.length > 0
            ? moment(collection[0][propertyKey], DATE_FORMAT_STRING).add(1, 'weeks')
            : null;
    let eventDate = null;
    collection.forEach((element, index) => {
        eventDate = moment(element[propertyKey], DATE_FORMAT_STRING);
        if (frequencies.length < 1) {
            frequencies.push(element); // if the frequencies are empty - then its the start of a new cycle
        }
        if (eventDate.diff(nextWeek, 'days') >= 0 || eventDate.weekday() === startOfWeek) {
            frequencyMatrix.push(frequencies);
            frequencies = [];
            if (index === collection.length - 1) {
                // this represents a lonely entity on the last loop, so add it to its own frequency collection
                // in any other scenario, this element would get added to the next round of frequencies
                frequencyMatrix.push([element]);
            } else {
                nextWeek = eventDate.add(1, 'weeks');
            }
        } else if (index === collection.length - 1) {
            frequencies.push(element); // while we did not yet enter a new cycle, this is the last loop anyway so wrap it up
            frequencyMatrix.push(frequencies);
        } else {
            frequencies.push(element);
        }
    });
    return frequencyMatrix;
};

const reduceToTotalFlow = ({ flowCollection, dateKey, amountKey }) => {
    const reducedFlowCollection = [];
    let reducedInflow = {};
    let nextEventDateThreshold =
        flowCollection.length > 0 ? moment(flowCollection[0][dateKey], DATE_FORMAT_STRING).add(1, 'days') : null;
    let activeDate;
    flowCollection.forEach((flow, index) => {
        if (reducedFlowCollection.length === 0) {
            reducedInflow = {
                [dateKey]: flow[dateKey],
                totalFlow: flow[amountKey]
            };
        } else {
            activeDate = moment(flow[dateKey], DATE_FORMAT_STRING);
            if (activeDate.diff(nextEventDateThreshold, 'days') >= 0) {
                reducedFlowCollection.push(reducedInflow);
                if (index === flowCollection.length - 1) {
                    // last loop so this element is a lonely entity who should be pushed
                    reducedFlowCollection.push({
                        [dateKey]: flow[dateKey],
                        totalFlow: flow[amountKey]
                    });
                } else {
                    reducedInflow = {
                        [dateKey]: flow[dateKey],
                        totalFlow: flow[amountKey]
                    };
                    nextEventDateThreshold = activeDate.add(1, 'days');
                }
            } else if (index === flowCollection.length - 1) {
                // last loop
                reducedInflow = {
                    [dateKey]: flow[dateKey],
                    totalFlow: reducedInflow.totalFlow + flow[amountKey]
                };
                reducedFlowCollection.push(reducedInflow);
            } else {
                reducedInflow = {
                    [dateKey]: flow[dateKey],
                    totalFlow: reducedInflow.totalFlow + flow[amountKey]
                };
            }
        }
    });
    return reducedFlowCollection;
};

// needs to be presorted by the appropriate date field (typically eventDate)
const getGreatestTotalInflows = ({
    collection = [],
    dateKey = 'eventDate',
    amountKey = 'endBalance',
    selectionNumber = 3,
    reverse = false
}) => {
    const flowCollection = [];
    collection.forEach((element) => {
        if (!isUndefinedOrNull(element[amountKey])) {
            if (element[amountKey] > 0) {
                flowCollection.push(element);
            }
        }
    });

    const reducedFlowCollection = reduceToTotalFlow({ flowCollection, dateKey, amountKey });
    let sortedInflows = reducedFlowCollection.sort((a, b) => {
        if (a.totalFlow > b.totalFlow) {
            return 1;
        } else if (a.totalFlow > b.totalFlow) {
            return -1;
        } else {
            return 0;
        }
    });

    if (reverse) {
        sortedInflows = sortedInflows.reverse();
    }

    const slicedInflows = sortedInflows.slice(0, selectionNumber);
    return slicedInflows;
};

// needs to be presorted by the appropriate date field (typically eventDate)
const getGreatestTotalOutflows = ({
    collection = [],
    dateKey = 'eventDate',
    amountKey = 'endBalance',
    selectionNumber = 3,
    reverse = false
}) => {
    const flowCollection = [];
    collection.forEach((element) => {
        if (!isUndefinedOrNull(element[amountKey])) {
            if (element[amountKey] < 0) {
                flowCollection.push(element);
            }
        }
    });
    const reducedFlowCollection = reduceToTotalFlow({ flowCollection, dateKey, amountKey });
    let sortedOutflows = reducedFlowCollection.sort((a, b) => {
        if (Math.abs(a.totalFlow) > Math.abs(b.totalFlow)) {
            return 1;
        } else if (Math.abs(a.totalFlow) > Math.abs(b.totalFlow)) {
            return -1;
        } else {
            return 0;
        }
    });

    if (reverse) {
        sortedOutflows = sortedOutflows.reverse();
    }

    const slicedOutflows = sortedOutflows.slice(0, selectionNumber);
    return slicedOutflows;
};

const getGreatestTotalInflowsAndOutflows = ({
    collection = [],
    amountKey = 'endBalance',
    selectionNumber = 3,
    reverse = false
}) => {
    const inflows = [];
    const outflows = [];
    collection.forEach((element) => {
        if (!isUndefinedOrNull(element[amountKey])) {
            if (element[amountKey] > 0) {
                inflows.push(element);
            } else if (element[amountKey] < 0) {
                outflows.push(element);
            }
        }
    });

    let sortedInflows = inflows.sort((a, b) => {
        if (a[amountKey] > b[amountKey]) {
            return 1;
        } else if (a[amountKey] > b[amountKey]) {
            return -1;
        } else {
            return 0;
        }
    });
    let sortedOutflows = outflows.sort((a, b) => {
        if (Math.abs(a[amountKey]) > Math.abs(b[amountKey])) {
            return 1;
        } else if (Math.abs(a[amountKey]) > Math.abs(b[amountKey])) {
            return -1;
        } else {
            return 0;
        }
    });

    if (reverse) {
        sortedInflows = sortedInflows.reverse();
        sortedOutflows = sortedOutflows.reverse();
    }

    const bundle = {
        inflows: sortedInflows.slice(0, selectionNumber),
        outflows: sortedOutflows.slice(0, selectionNumber)
    };
    return bundle;
};

const getGreatestWeeklyEventFlows = (
    collection = [],
    amountKey = 'endBalance',
    dateKey = 'eventDate',
    selectionNumber = 3,
    reverse = false,
    startOfWeek = MONDAY,
    flowDirection = INFLOW_AND_OUTFLOW
) => {
    const rawFrequencyMatrix = collectWeeklyEvents({ collection, propertyKey: dateKey, startOfWeek });
    const processedFrequencyMatrix = [];
    let bundle = {};
    switch (flowDirection) {
    case INFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                inflows: getGreatestTotalInflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case OUTFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                outflows: getGreatestTotalOutflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case INFLOW_AND_OUTFLOW:
    default:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = getGreatestTotalInflowsAndOutflows({
                collection: frequencyCollection,
                propertyKey: amountKey,
                selectionNumber,
                reverse
            });
            processedFrequencyMatrix.push(bundle);
        });
        break;
    }
    return processedFrequencyMatrix;
};

const getGreatestMonthlyEventFlows = (
    collection = [],
    amountKey = 'endBalance',
    dateKey = 'eventDate',
    selectionNumber = 3,
    reverse = false,
    flowDirection = INFLOW_AND_OUTFLOW
) => {
    const rawFrequencyMatrix = collectMonthlyEvents({ collection, propertyKey: dateKey });
    const processedFrequencyMatrix = [];
    let bundle = {};
    switch (flowDirection) {
    case INFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                inflows: getGreatestTotalInflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case OUTFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                outflows: getGreatestTotalOutflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case INFLOW_AND_OUTFLOW:
    default:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = getGreatestTotalInflowsAndOutflows({
                collection: frequencyCollection,
                propertyKey: amountKey,
                selectionNumber,
                reverse
            });
            processedFrequencyMatrix.push(bundle);
        });
        break;
    }
    return processedFrequencyMatrix;
};

const getGreatestAnnualEventFlows = (
    collection = [],
    amountKey = 'endBalance',
    dateKey = 'eventDate',
    selectionNumber = 3,
    reverse = false,
    flowDirection = INFLOW_AND_OUTFLOW
) => {
    const rawFrequencyMatrix = collectAnnualEvents({ collection, propertyKey: dateKey });
    const processedFrequencyMatrix = [];
    let bundle = {};
    switch (flowDirection) {
    case INFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                inflows: getGreatestTotalInflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case OUTFLOW:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = {
                outflows: getGreatestTotalOutflows({
                    collection: frequencyCollection,
                    propertyKey: amountKey,
                    selectionNumber,
                    reverse
                })
            };
            processedFrequencyMatrix.push(bundle);
        });
        break;
    case INFLOW_AND_OUTFLOW:
    default:
        rawFrequencyMatrix.forEach((frequencyCollection) => {
            bundle = getGreatestTotalInflowsAndOutflows({
                collection: frequencyCollection,
                propertyKey: amountKey,
                selectionNumber,
                reverse
            });
            processedFrequencyMatrix.push(bundle);
        });
        break;
    }
    return processedFrequencyMatrix;
};

module.exports = {
    snapshotsGreaterThanAmount,
    snapshotsLessThanAmount,
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    collectWeeklyEvents,
    collectMonthlyEvents,
    collectAnnualEvents,
    getGreatestTotalInflows,
    getGreatestTotalOutflows,
    getGreatestTotalInflowsAndOutflows,
    getGreatestWeeklyEventFlows,
    getGreatestMonthlyEventFlows,
    getGreatestAnnualEventFlows
};
