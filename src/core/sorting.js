const { isUndefinedOrNull } = require('../utility/validation');
const {
    DATE_DELIMITER
} = require('../constants');

const compareByPropertyKey = (a, b, propertyKey) => {
    const paramA = typeof a[propertyKey] === 'string' ? a[propertyKey].toLowerCase() : a[propertyKey];
    const paramB = typeof b[propertyKey] === 'string' ? b[propertyKey].toLowerCase() : b[propertyKey];
    if (!isUndefinedOrNull(paramA) && !isUndefinedOrNull(paramB)) {
        if (paramA > paramB) {
            return 1;
        } else if (paramA < paramB) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    } else if (!isUndefinedOrNull(paramA) && isUndefinedOrNull(paramB)) {
        return -1;
    } else if (isUndefinedOrNull(paramA) && !isUndefinedOrNull(paramB)) {
        return 1;
    } else {
        return 0;
    }
};

const compareTime = (a, b) => {
    const propertyKey = 'timeStart';
    const paramA = typeof a[propertyKey] === 'string' ? a[propertyKey].toLowerCase() : a[propertyKey];
    const paramB = typeof b[propertyKey] === 'string' ? b[propertyKey].toLowerCase() : b[propertyKey];
    if (!isUndefinedOrNull(paramA) && !isUndefinedOrNull(paramB)) {
        if (paramA.includes('pm') && paramB.includes('am')) {
            return 1;
        } else if (paramA.includes('am') && paramB.includes('pm')) {
            return -1;
        } else if (paramA > paramB) {
            return 1;
        } else if (paramA < paramB) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            // the times are equal so check if there is a sortPriority to sort against
            // eslint-disable-next-line no-lonely-if
            if (a.sortPriority || b.sortPriority) {
                return compareByPropertyKey(a, b, 'sortPriority');
                // eslint-disable-next-line no-else-return
            } else {
                return 0;
            }
        }
    } else if (!isUndefinedOrNull(paramA) && isUndefinedOrNull(paramB)) {
        return -1;
    } else if (!isUndefinedOrNull(paramB) && isUndefinedOrNull(paramA)) {
        return 1;
    } else {
        return 0;
    }
};

const sortEvents = (events) => {
    events.sort((a, b) => {
        const thisDateA = a.dateStart.split(DATE_DELIMITER).join('');
        const thisDateB = b.dateStart.split(DATE_DELIMITER).join('');
        if (thisDateA > thisDateB) {
            return 1;
        } else if (thisDateA < thisDateB) {
            return -1;
        } else if (thisDateA === thisDateB) {
            if (a.timeStart || b.timeStart) {
                return compareTime(a, b);
                // eslint-disable-next-line no-else-return
            } else {
                // eslint-disable-next-line no-lonely-if
                if (a.sortPriority || b.sortPriority) {
                    return compareByPropertyKey(a, b, 'sortPriority');
                    // eslint-disable-next-line no-else-return
                } else {
                    return 0;
                }
            }
        } else {
            return 0;
        }
        // eslint-disable-next-line no-unreachable
        return 0; // this line is unreachable/dead code, but it satisfies another linting error
    });
};

module.exports = {
    compareByPropertyKey, compareTime, sortEvents
};
