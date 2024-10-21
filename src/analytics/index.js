const moment = require('moment');
const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { deepCopy } = require('../utility/dataStructures');
const { initializeTimeZoneData, createTimeZone, convertTimeZone } = require('../timeZone');
const { TimeStream } = require('../timeStream');
const {
    DATE_FORMAT_STRING,
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
    ANY,
    UNION,
    INTERSECTION,
    DEFAULT,
    ASCENDING,
    DESCENDING,
    SUM,
    AVERAGE,
    MEDIANS,
    MODES,
    MIN,
    MAX,
    DEFAULT_SELECTION_LIMIT
} = require('../constants');

const dropEventsWithDuplicateKey = ({ events, key: uniqueKey }) => {
    if (isUndefinedOrNull(uniqueKey)) {
        return events;
    } else {
        const set = new Set();
        const newEvents = [];
        events.forEach((event) => {
            if (!set.has(event[uniqueKey])) {
                set.add(event[uniqueKey]);
                newEvents.push(event);
            }
        });
        return newEvents;
    }
};

const sortEventsForReports = ({ sortKey = null, sortDirection = ASCENDING, selectionLimit = null, uniqueKey = null, events }) => {
    const eventsWithUniqueKeyCheck = dropEventsWithDuplicateKey({ events, key: uniqueKey }); // if uniqueKey was defined on reporting rule, then remove duplicates
    if (isUndefinedOrNull(sortKey) || sortKey === DEFAULT || sortDirection === DEFAULT) {
        const finalResult = eventsWithUniqueKeyCheck.slice(
            0,
            !isUndefinedOrNull(selectionLimit) && selectionLimit <= eventsWithUniqueKeyCheck.length ? selectionLimit : eventsWithUniqueKeyCheck.length
        );
        return finalResult;
        // eslint-disable-next-line no-else-return
    } else {
        const sortingDirection = sortDirection === DESCENDING ? -1 : 1;
        const sortedEvents = deepCopy(eventsWithUniqueKeyCheck).sort((aObj, bObj) => {
            const a = aObj[sortKey];
            const b = bObj[sortKey];
            if (a > b) {
                return 1 * sortingDirection;
            } else if (a < b) {
                return -1 * sortingDirection;
                // eslint-disable-next-line no-else-return
            } else {
                return 0;
            }
        });
        const finalCollection = sortedEvents.slice(
            0,
            !isUndefinedOrNull(selectionLimit) && selectionLimit <= sortedEvents.length ? selectionLimit : sortedEvents.length
        );
        return finalCollection;
    }
};

const sortAggregates = ({ aggregateConfig, aggregates }) => {
    let newAggregates;
    let configSortKey = aggregateConfig.sortKey;
    let sortKey;
    let sortDirection;
    if (isUndefinedOrNull(aggregateConfig.sortKey)) {
        configSortKey = DEFAULT;
    }
    if (configSortKey === DEFAULT || aggregateConfig.sortDirection === DEFAULT) {
        return aggregates;
    }
    if (isUndefinedOrNull(aggregateConfig.sortDirection)) {
        sortDirection = 1; // defaults to ASCENDING order
    } else {
        sortDirection = aggregateConfig.sortDirection === DESCENDING ? -1 : 1;
    }
    switch (configSortKey) {
        case SUM:
            sortKey = 'sum';
            break;
        case AVERAGE:
            sortKey = 'average';
            break;
        case MEDIANS:
            sortKey = 'medians';
            break;
        case MODES:
            sortKey = 'modes';
            break;
        case MIN:
            sortKey = 'min';
            break;
        case MAX:
            sortKey = 'max';
            break;
        case DEFAULT:
            return aggregates;
        default:
            sortKey = aggregateConfig.sortKey;
    }
    if (sortKey === 'medians' || sortKey === 'modes') {
        newAggregates = deepCopy(aggregates).sort((aObj, bObj) => {
            const aList = aObj[sortKey];
            const bList = bObj[sortKey];
            let sortResult = -1;
            aList.some((a) => {
                return bList.some((b) => {
                    if (a > b) {
                        sortResult = 1 * sortDirection;
                        if (sortDirection === ASCENDING) return true;
                    } else if (a < b) {
                        sortResult = -1 * sortDirection;
                        if (sortDirection === DESCENDING) return true;
                        // eslint-disable-next-line no-else-return
                    } else {
                        sortResult = 0;
                    }
                });
            });
            return sortResult;
        });
    } else {
        newAggregates = deepCopy(aggregates).sort((aObj, bObj) => {
            const a = aObj[sortKey];
            const b = bObj[sortKey];
            if (a > b) {
                return 1 * sortDirection;
            } else if (a < b) {
                return -1 * sortDirection;
                // eslint-disable-next-line no-else-return
            } else {
                return 0;
            }
        });
    }
    const finalCollection = newAggregates.slice(
        0,
        !isUndefinedOrNull(aggregateConfig.selectionLimit) && aggregateConfig.selectionLimit <= newAggregates.length
            ? aggregateConfig.selectionLimit
            : newAggregates.length
    );
    return finalCollection;
};

const isThisWithinXPercentOfThat = ({ value, xPercentRange = 0, xPercentTarget }) => {
    // const difference = value - xPercentTarget;
    const xPercentOfValue = Math.abs(xPercentRange * xPercentTarget);
    const lowValue = xPercentTarget - xPercentOfValue;
    const highValue = xPercentTarget + xPercentOfValue;
    if (value >= lowValue && value <= highValue) {
        return true;
        // eslint-disable-next-line no-else-return
    } else {
        return false;
    }
};

// TODO: delete
// const isThisWithinXPercentOfThat = ({ value, xPercentRange = 0, xPercentTarget }) => {
//     // const difference = value - xPercentTarget;
//     const xPercentOfValue = Math.abs(xPercentRange * xPercentTarget);
//     const lowValue = value - xPercentOfValue;
//     const highValue = value + xPercentOfValue;
//     if (xPercentTarget >= lowValue && xPercentTarget <= highValue) {
//         return true;
//         // eslint-disable-next-line no-else-return
//     } else {
//         return false;
//     }
// };

const findEventsWithinXPercentOfValue = ({
    events,
    propertyKey = 'balanceEnding',
    xPercentRange = 0,
    xPercentTarget
}) => {
    const newEvents = events.filter((event) => {
        return isThisWithinXPercentOfThat({ value: event[propertyKey], xPercentRange, xPercentTarget });
    });
    return newEvents || [];
};

const getWeekdayNumFromString = (weekdayString) => {
    let weekdayNum;
    switch (weekdayString) {
        case 'sunday':
            weekdayNum = SUNDAY;
            break;
        case 'monday':
            weekdayNum = MONDAY;
            break;
        case 'tuesday':
            weekdayNum = TUESDAY;
            break;
        case 'wednesday':
            weekdayNum = WEDNESDAY;
            break;
        case 'thursday':
            weekdayNum = THURSDAY;
            break;
        case 'friday':
            weekdayNum = FRIDAY;
            break;
        case 'saturday':
            weekdayNum = SATURDAY;
            break;
        default:
            weekdayNum = MONDAY;
            break;
    }
    return weekdayNum;
};

const defaultStringComparator = (filterKey, filterValue) => {
    return filterKey === filterValue;
};

const filterEventsByKeysAndValues = ({
    events,
    filterKeys = [],
    filterValues = [],
    filterType = UNION,
    filterComparator = defaultStringComparator // note: this default value might not be sufficient
}) => {
    if (isUndefinedOrNull(filterComparator)) {
        filterComparator = defaultStringComparator;
    }
    if (isUndefinedOrNull(filterType)) {
        filterType = UNION;
    }
    let transientEvent; // for errorDisc
    try {
        let newEvents = events; // default value
        if (filterKeys && filterKeys.length > 0 && filterValues && filterValues.length === filterKeys.length) {
            const duplicateEvents = deepCopy(events);
            newEvents = duplicateEvents.filter((event) => {
                transientEvent = event;
                let includeEvent = false;
                for (let looper = 0; looper < filterKeys.length; looper++) {
                    if (
                        !isUndefinedOrNull(event[filterKeys[looper]]) &&
                        (filterValues[looper] === ANY ||
                            filterComparator(event[filterKeys[looper]], filterValues[looper]))
                    ) {
                        includeEvent = true;
                        if (isUndefinedOrNull(filterType) || filterType === UNION) {
                            break;
                        }
                    } else {
                        includeEvent = false;
                        if (filterType === INTERSECTION) {
                            break;
                        }
                    }
                }
                return includeEvent;
            });
        }
        return newEvents;
    } catch (err) {
        throw errorDisc({ err, data: { event: transientEvent, filterKeys, filterValues, filterType } });
    }
};

// you should probably run the validation functions in core/validation.js prior to using this
// finds rules with end dates that are less than the beginning date range of the budget projection
const findRulesToRetire = (danielSan) => {
    const {
        config: { effectiveDateStart }
    } = danielSan;
    const newRulesToRetire = [];
    // eslint-disable-next-line array-callback-return
    danielSan.rules.forEach((rule, index) => {
        const dateToStartConfig = initializeTimeZoneData(danielSan);
        const dateToStart = createTimeZone({
            timeZone: dateToStartConfig.timeZone,
            timeZoneType: dateToStartConfig.timeZoneType,
            dateString: effectiveDateStart
        });
        const convertedDateToStartConfig = initializeTimeZoneData(rule);
        const convertedDateToStart = convertTimeZone({
            timeZone: convertedDateToStartConfig.timeZone,
            timeZoneType: convertedDateToStartConfig.timeZoneType,
            date: dateToStart
        }).date;
        const convertedDateStartString = convertedDateToStart.format(DATE_FORMAT_STRING);
        if (!isUndefinedOrNull(rule.effectiveDateEnd) && rule.effectiveDateEnd < convertedDateStartString) {
            rule.ruleIndex = index;
            newRulesToRetire.push(rule);
        } else if (
            rule.frequency === ONCE &&
            typeof rule.processDate === 'string' &&
            rule.processDate < convertedDateStartString
        ) {
            rule.ruleIndex = index;
            newRulesToRetire.push(rule);
        }
    });
    // TODO: below - couldn't we simply return newToRetire?
    if (newRulesToRetire.length > 0) {
        return newRulesToRetire;
        // eslint-disable-next-line no-else-return
    } else {
        return [];
    }
    // eslint-disable-next-line no-unreachable
    return []; // this line satisfies another linting error
};

// you should probably run the validation functions in core/validation.js prior to using this
// finds rules that have no chance of being triggered via the current configuration
const findIrrelevantRules = (danielSan) => {
    const {
        rules,
        config: { effectiveDateStart, effectiveDateEnd, timeZone, timeZoneType }
    } = danielSan;
    const relevantRules = [];
    const irrelevantRules = [];
    rules.forEach((rule, index) => {
        const dateToStart = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateStart
        });
        const convertedDateToStart = convertTimeZone({
            timeZone: rule.timeZone,
            timeZoneType: rule.timeZoneType,
            date: dateToStart
        }).date;
        const convertedDateToStartString = convertedDateToStart.format(DATE_FORMAT_STRING);
        const dateToEnd = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateEnd
        });
        const convertedDateToEnd = convertTimeZone({
            timeZone: rule.timeZone,
            timeZoneType: rule.timeZoneType,
            date: dateToEnd
        }).date;
        const convertedDateToEndString = convertedDateToEnd.format(DATE_FORMAT_STRING);
        let allowToLive = true;

        if (
            (!isUndefinedOrNull(rule.effectiveDateEnd) && rule.effectiveDateEnd < convertedDateToStartString) ||
            (!isUndefinedOrNull(rule.effectiveDateStart) && rule.effectiveDateStart > convertedDateToEndString)
        ) {
            // exclude
            allowToLive = false;
            // eslint-disable-next-line no-else-return
        } else if (
            rule.frequency === ONCE &&
            typeof rule.EventProcessDate === 'string' &&
            rule.EventProcessDate < convertedDateToStartString
        ) {
            // exclude:
            allowToLive = false;
        } else if (isUndefinedOrNull(rule.effectiveDateEnd)) {
            // include
            allowToLive = true;
        } else {
            // include
            allowToLive = true;
        }

        if (allowToLive) {
            relevantRules.push(rule);
        } else {
            rule.ruleIndex = index;
            irrelevantRules.push(rule);
        }
    });
    return { relevantRules, irrelevantRules };
};

const findEventsWithProperty = ({ events, propertyKey }) => {
    // eslint-disable-next-line array-callback-return
    const eventsFound = events.filter((event) => {
        // eslint-disable-line consistent-return
        if (!isUndefinedOrNull(event[propertyKey])) {
            return event;
            // eslint-disable-next-line no-else-return
        } else {
            return false;
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
                let eventProperty = event[propertyKey];
                if (!isUndefinedOrNull(eventProperty) && typeof eventProperty === 'string') {
                    eventProperty = eventProperty.toLowerCase();
                }
                const newSearchCriteriaValue =
                    typeof searchCriteriaValue === 'string' ? searchCriteriaValue.toLowerCase() : searchCriteriaValue;
                if (!isUndefinedOrNull(eventProperty) && eventProperty === newSearchCriteriaValue) {
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
    let substrings;
    if (typeof substring === 'string') {
        substrings = [];
        substrings.push(substring);
    } else {
        substrings = substring;
    }
    // eslint-disable-next-line array-callback-return
    const eventsFound = events.filter((event) => {
        // eslint-disable-next-line consistent-return
        return substrings.some((string) => {
            // eslint-disable-line array-callback-return
            // eslint-disable-line consistent-return
            if (!isUndefinedOrNull(event[propertyKey]) && event[propertyKey].includes(string)) {
                return true;
            }
        });
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

const findCriticalSnapshots = ({ events = [], criticalThreshold = 0, propertyKey = 'balanceEnding' }) => {
    let criticalSnapshots = [];
    if (!isUndefinedOrNull(criticalThreshold)) {
        criticalSnapshots = events.filter((event) => {
            if (!isUndefinedOrNull(event[propertyKey])) {
                return event[propertyKey] < criticalThreshold;
                // eslint-disable-next-line no-else-return
            } else {
                return false;
            }
        });
    }
    return criticalSnapshots;
};

const findSnapshotsGreaterThanSupport = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] > amount) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const findSnapshotsLessThanResistance = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] < amount) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const findPositiveSnapshotsGreaterThanSupport = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] > 0 && element[propertyKey] > amount) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const findPositiveSnapshotsLessThanResistance = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] > 0 && element[propertyKey] < amount) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const findNegativeSnapshotsGreaterThanSupport = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (
            !isUndefinedOrNull(element[propertyKey]) &&
            element[propertyKey] < 0 &&
            Math.abs(element[propertyKey]) > Math.abs(amount)
        ) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const findNegativeSnapshotsLessThanResistance = ({ events = [], amount = 0, propertyKey = 'balanceEnding' }) => {
    const newCollection = events.filter((element) => {
        if (
            !isUndefinedOrNull(element[propertyKey]) &&
            element[propertyKey] < 0 &&
            Math.abs(element[propertyKey]) < Math.abs(amount)
        ) {
            return element; // eslint-disable-next-line no-else-return
        } else {
            return false;
        }
    });
    return newCollection;
};

const isVal1GreaterThanVal2 = (val1, val2) => {
    return val1 > val2;
};

const isAbsVal1GreaterThanAbsVal2 = (val1, val2) => {
    return Math.abs(val1) > Math.abs(val2);
};

const isVal1LessThanVal2 = (val1, val2) => {
    return val1 < val2;
};

const isAbsVal1LessThanAbsVal2 = (val1, val2) => {
    return Math.abs(val1) < Math.abs(val2);
};

const filterEventsByFlowDirection = ({ events, propertyKey = 'balanceEnding', flowDirection }) => {
    const deepCopyOfEvents = deepCopy(events);
    let newEvents;
    switch (flowDirection) {
        case POSITIVE:
            newEvents = deepCopyOfEvents.filter((event) => {
                return event[propertyKey] > 0;
            });
            break;
        case NEGATIVE:
            newEvents = deepCopyOfEvents.filter((event) => {
                return event[propertyKey] < 0;
            });
            break;
        case BOTH:
            newEvents = deepCopyOfEvents;
            break;
        default:
            newEvents = deepCopyOfEvents;
            break;
    }
    return newEvents;
};

// TODO: performance could be increased by making a separete function for findLeastValueSnapshots
// TODO cont: instead of passing reverse as a parameter and reverse the sort
const findGreatestValueSnapshots = ({
    events = [],
    propertyKey = 'balanceEnding',
    selectionLimit = DEFAULT_SELECTION_LIMIT,
    flowDirection = BOTH,
    reverse = false,
    alreadyFiltered = false // TODO: check if this can be used in findGreatestPositiveValueSnapshots and findGreatestNegativeValueSnapshots and similar functions since we are sometimes already prefiltering before calling this function
}) => {
    let sortedCollection = [];
    const newEvents = deepCopy(events); // TODO: should refactor to only send this function pre-filtered events: for eg. with filterEventsByFlowDirection, whatever you do make sure you test it a lot!
    let greaterThanComparator;
    let lessThanComparator;
    switch (flowDirection) {
        case POSITIVE:
            greaterThanComparator = isVal1GreaterThanVal2;
            lessThanComparator = isVal1LessThanVal2;
            break;
        case NEGATIVE:
            greaterThanComparator = isAbsVal1GreaterThanAbsVal2;
            lessThanComparator = isAbsVal1LessThanAbsVal2;
            break;
        case BOTH:
            greaterThanComparator = isVal1GreaterThanVal2;
            lessThanComparator = isVal1LessThanVal2;
            break;
        default:
            greaterThanComparator = isVal1GreaterThanVal2;
            lessThanComparator = isVal1LessThanVal2;
            break;
    }

    sortedCollection = newEvents.sort((a, b) => {
        if (isUndefinedOrNull(a) && !isUndefinedOrNull(b)) {
            return -1;
        } else if (!isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
            return 1;
        } else if (isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
            return 0;
        } else if (greaterThanComparator(a[propertyKey], b[propertyKey])) {
            return -1;
        } else if (lessThanComparator(a[propertyKey], b[propertyKey])) {
            return 1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    });

    if (reverse) {
        sortedCollection = sortedCollection.reverse();
    }

    return sortedCollection;
};

const findGreatestPositiveValueSnapshots = ({
    events = [],
    propertyKey = 'balanceEnding',
    selectionLimit = DEFAULT_SELECTION_LIMIT,
    reverse = false
}) => {
    const newEvents = deepCopy(events);
    let sortedCollection = newEvents
        .filter((e) => {
            return e[propertyKey] > 0;
        })
        .sort((a, b) => {
            if (isUndefinedOrNull(a) && !isUndefinedOrNull(b)) {
                return -1;
            } else if (!isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
                return 1;
            } else if (isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
                return 0;
            } else if (a[propertyKey] > b[propertyKey]) {
                return -1;
            } else if (a[propertyKey] < b[propertyKey]) {
                return 1;
                // eslint-disable-next-line no-else-return
            } else {
                return 0;
            }
        });

    if (reverse) {
        sortedCollection = sortedCollection.reverse();
    }

    return sortedCollection;
};

const findGreatestNegativeValueSnapshots = ({
    events = [],
    propertyKey = 'balanceEnding',
    selectionLimit = DEFAULT_SELECTION_LIMIT,
    reverse = false
}) => {
    const newEvents = deepCopy(events);
    let sortedCollection = newEvents
        .filter((e) => {
            return e[propertyKey] < 0;
        })
        .sort((a, b) => {
            if (isUndefinedOrNull(a) && !isUndefinedOrNull(b)) {
                return -1;
            } else if (!isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
                return 1;
            } else if (isUndefinedOrNull(a) && isUndefinedOrNull(b)) {
                return 0;
            } else if (Math.abs(a[propertyKey]) > Math.abs(b[propertyKey])) {
                return -1;
            } else if (Math.abs(a[propertyKey]) < Math.abs(b[propertyKey])) {
                return 1;
                // eslint-disable-next-line no-else-return
            } else {
                return 0;
            }
        });

    if (reverse) {
        sortedCollection = sortedCollection.reverse();
    }

    return sortedCollection;
};

const sumAllPositiveEventAmounts = (events) => {
    let sum = 0;
    events.forEach((event) => {
        const { amount } = event;
        if (!isUndefinedOrNull(amount) && amount > 0) {
            // routine/reminder types like STANDARD_EVENT_ROUTINE do not require an amount field
            // we first check to make sure it had an amount field so that it satisfies our required context
            // however, we are actually only interested in the multi-currency converted amount
            sum += amount;
        }
    });
    return sum;
};

const sumAllNegativeEventAmounts = (events) => {
    let sum = 0;
    events.forEach((event) => {
        const { amount } = event;
        if (!isUndefinedOrNull(amount) && amount < 0) {
            // routine/reminder types like STANDARD_EVENT_ROUTINE do not require an amount field
            // we first check to make sure it had an amount field so that it satisfies our required context
            // however, we are actually only interested in the multi-currency converted amount
            sum += amount;
        }
    });
    return sum;
};

module.exports = {
    sortEventsForReports,
    sortAggregates,
    isThisWithinXPercentOfThat,
    findEventsWithinXPercentOfValue,
    filterEventsByKeysAndValues,
    filterEventsByFlowDirection,
    findSnapshotsGreaterThanSupport,
    findSnapshotsLessThanResistance,
    findPositiveSnapshotsGreaterThanSupport,
    findPositiveSnapshotsLessThanResistance,
    findNegativeSnapshotsGreaterThanSupport,
    findNegativeSnapshotsLessThanResistance,
    findGreatestValueSnapshots,
    findGreatestPositiveValueSnapshots,
    findGreatestNegativeValueSnapshots,
    findCriticalSnapshots,
    findRulesToRetire,
    findIrrelevantRules,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    sumAllPositiveEventAmounts,
    sumAllNegativeEventAmounts
};
