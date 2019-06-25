const { isUndefinedOrNull } = require('../utility/validation');
const { DATE_FORMAT_STRING } = require('../constants');

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
        // eslint-disable-next-line no-else-return
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
                let eventProperty = event[propertyKey];
                if (eventProperty && typeof eventProperty === 'string') {
                    eventProperty = eventProperty.toLowerCase();
                }
                const newSearchCriteriaValue =
                    typeof searchCriteriaValue === 'string' ? searchCriteriaValue.toLowerCase() : searchCriteriaValue;
                if (eventProperty && eventProperty === newSearchCriteriaValue) {
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

const findSnapshotsGreaterThanAmount = ({ collection = [], amount = 0, propertyKey = 'endBalance' }) => {
    const newCollection = collection.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] > amount) {
            return element;
        }
    });
    return newCollection;
};

const findSnapshotsLessThanAmount = ({ collection = [], amount = 0, propertyKey = 'endBalance' }) => {
    const newCollection = collection.filter((element) => {
        if (!isUndefinedOrNull(element[propertyKey]) && element[propertyKey] < amount) {
            return element;
        }
    });
    return newCollection;
};

const findGreatestValueSnapshots = ({
    collection = [],
    propertyKey = 'endBalance',
    selectionAmount = 7,
    reverse = false
}) => {
    let sortedCollection = collection.sort((a, b) => {
        if (a[propertyKey] > b[propertyKey]) {
            return -1;
        } else if (a[propertyKey] < b[propertyKey]) {
            return 1;
        } else {
            return 0;
        }
    });
    if (reverse) {
        sortedCollection = sortedCollection.reverse();
    }
    const finalCollection = sortedCollection.slice(0, selectionAmount);
    return finalCollection;
};

const sumAllPositiveEventAmounts = (danielSan) => {
    let sum = 0;
    danielSan.events.forEach((event) => {
        if (!isUndefinedOrNull(event.amount) && event.amount > 0) { // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
            const convertedAmount =
                danielSan.currencySymbol &&
                event.currencySymbol &&
                danielSan.currencySymbol !== event.currencySymbol
                    ? danielSan.currencyConversion({
                        amount: event.amount,
                        currentSymbol: event.currencySymbol,
                        futureSymbol: danielSan.currencySymbol
                    })
                    : event.amount;
            sum += convertedAmount;
        }
    });
    return sum;
};

const sumAllNegativeEventAmounts = (danielSan) => {
    let sum = 0;
    danielSan.events.forEach((event) => {
        if (!isUndefinedOrNull(event.amount) && event.amount < 0) { // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
            const convertedAmount =
                danielSan.currencySymbol &&
                event.currencySymbol &&
                danielSan.currencySymbol !== event.currencySymbol
                    ? danielSan.currencyConversion({
                        amount: event.amount,
                        currentSymbol: event.currencySymbol,
                        futureSymbol: danielSan.currencySymbol
                    })
                    : event.amount;
            sum += convertedAmount;
        }
    });
    return sum;
};

module.exports = {
    findSnapshotsGreaterThanAmount,
    findSnapshotsLessThanAmount,
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    findGreatestValueSnapshots,
    sumAllPositiveEventAmounts,
    sumAllNegativeEventAmounts
};
