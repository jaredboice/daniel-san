const { isUndefinedOrNull } = require('../utility/validation');
const { DATE_FORMAT_STRING } = require('../constants');

const findCriticalSnapshots = ({ danielSan, terminalOptions }) => {
    let criticalSnapshots = null;
    if (!isUndefinedOrNull(terminalOptions.criticalThreshold)) {
        criticalSnapshots = danielSan.events.filter((event) => {
            return event.endBalance < terminalOptions.criticalThreshold;
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
    const eventsFound = events.filter((event) => { // eslint-disable-line consistent-return
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
    const eventsFound = events.filter((event) => { // eslint-disable-line consistent-return
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

module.exports = {
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring
};
