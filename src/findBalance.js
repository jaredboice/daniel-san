const moment = require('moment-timezone');
const { TimeStream } = require('./timeStream');
const { initializeTimeZoneData, convertTimeZone, timeTravel } = require('./timeZone');
const { getRelevantDateSegmentByFrequency } = require('./standardEvents/common');
const { errorDisc } = require('./utility/errorHandling');
const { isUndefinedOrNull } = require('./utility/validation');
const { deepCopy } = require('./utility/dataStructures');
const { buildStandardEvent } = require('./standardEvents');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('./specialEvents');
const {
    moveThisProcessDateBeforeTheseWeekdays,
    moveThisProcessDateBeforeTheseDates,
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    adjustAmountOnTheseDates
} = require('./specialAdjustments');
const { flagRuleForRetirement, retireRules } = require('./standardEvents/common');
const { cycleModulusUpToDate, cycleModulusDownToDate } = require('./modulusCycle/cycleModulusToDate');
const {
    LOCAL,
    UTC,
    GREENWICH,
    DATE_FORMAT_STRING,
    DATE_DELIMITER,
    STANDARD_EVENT,
    NTH_WEEKDAYS_OF_MONTH,
    NTH_WEEKDAYS_OF_MONTH_ROUTINE,
    NTH_WEEKDAYS_OF_MONTH_REMINDER,
    WEEKDAY_ON_DATE,
    WEEKDAY_ON_DATE_ROUTINE,
    WEEKDAY_ON_DATE_REMINDER,
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES,
    PRE_PAY,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
    POST_PAY,
    ADJUST_AMOUNT_ON_THESE_DATES,
    ADJUST_AMOUNT,
    DAILY,
    ONCE,
    DISCOVERING_EVENT_TYPE,
    EXECUTING_SPECIAL_ADJUSTMENT,
    MODIFIED,
    RETIRING_RULES,
    STANDARD_EVENT_ROUTINE,
    STANDARD_EVENT_REMINDER,
    CURRENCY_DEFAULT
} = require('./constants');

const discardEventsOutsideDateRange = (danielSan) => {
    const eventsToDiscard = [];
    const newEventList = [];
    danielSan.events.forEach((event) => {
        if (event.eventDate < danielSan.dateStart || event.eventDate > danielSan.dateEnd) {
            eventsToDiscard.push(event);
        } else {
            newEventList.push(event);
        }
    });
    danielSan.discardedEvents = eventsToDiscard;
    // we only need to re-reference danielSan.events if we are discarding anything
    if (eventsToDiscard.length > 0) {
        danielSan.events = newEventList;
    }
};

const buildEvents = ({ danielSan, rules, date }) => {
    let processPhase;
    try {
        rules.forEach((rule, index) => {
            const convertedDate = convertTimeZone({
                timeZone: rule.timeZone,
                timeZoneType: rule.timeZoneType,
                date
            }).date;
            rule.dateCycleSource = `danielSan / ${danielSan.timeZone} / ${danielSan.timeZoneType}`; // for future convenience
            rule.dateCycleTarget = `rule / ${rule.timeZone} / ${rule.timeZoneType}`; // for future convenience
            rule.dateCycleAtSource = date;
            rule.dateCycleAtTarget = convertedDate;
            if (isUndefinedOrNull(rule.dateStart) || rule.dateStart <= convertedDate.format(DATE_FORMAT_STRING)) {
                processPhase = DISCOVERING_EVENT_TYPE;
                switch (rule.type) {
                    case STANDARD_EVENT:
                    case STANDARD_EVENT_ROUTINE:
                    case STANDARD_EVENT_REMINDER:
                        processPhase = buildStandardEvent({ danielSan, rule, date: convertedDate });
                        break;
                    case NTH_WEEKDAYS_OF_MONTH:
                    case NTH_WEEKDAYS_OF_MONTH_ROUTINE:
                    case NTH_WEEKDAYS_OF_MONTH_REMINDER:
                        processPhase = nthWeekdaysOfMonth({ danielSan, rule, date: convertedDate });
                        break;
                    case WEEKDAY_ON_DATE:
                    case WEEKDAY_ON_DATE_ROUTINE:
                    case WEEKDAY_ON_DATE_REMINDER:
                        processPhase = weekdayOnDate({ danielSan, rule, date: convertedDate });
                        break;
                    default:
                        break;
                }
                if (processPhase === MODIFIED && danielSan.events[danielSan.events.length - 1].specialAdjustments) {
                    // note: execute specialAdjustments if exists
                    processPhase = EXECUTING_SPECIAL_ADJUSTMENT;
                    danielSan.events[danielSan.events.length - 1].specialAdjustments.forEach((specialAdjustment) => {
                        switch (specialAdjustment.type) {
                            case MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS:
                                moveThisProcessDateBeforeTheseWeekdays({
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES:
                            case PRE_PAY:
                                moveThisProcessDateBeforeTheseDates({
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS:
                                moveThisProcessDateAfterTheseWeekdays({
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES:
                            case POST_PAY:
                                moveThisProcessDateAfterTheseDates({
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case ADJUST_AMOUNT_ON_THESE_DATES:
                            case ADJUST_AMOUNT:
                                adjustAmountOnTheseDates({
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment
                                });
                                break;
                            default:
                                break;
                        }
                    });
                }
                processPhase = RETIRING_RULES;
                flagRuleForRetirement({ danielSan, rule, date: convertedDate, index });
            }
        });
        retireRules({ danielSan });
    } catch (err) {
        throw errorDisc(err, 'error in buildEvents()', { date, processPhase });
    }
};

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

const sortDanielSan = (danielSan) => {
    danielSan.events.sort((a, b) => {
        const thisDateA = a.eventDate.split(DATE_DELIMITER).join('');
        const thisDateB = b.eventDate.split(DATE_DELIMITER).join('');
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

const deleteIrrelevantRules = ({ danielSan, dateStartString }) => {
    const newRules = danielSan.rules.filter((rule) => {
        try {
            if (rule.frequency === ONCE && rule.processDate < dateStartString) {
                // exclude:
                return false;
            }
            if (isUndefinedOrNull(rule.dateEnd)) {
                // include
                return true;
            } else if (rule.dateEnd < dateStartString) {
                // exclude
                return false;
                // eslint-disable-next-line no-else-return
            } else {
                // include
                return true;
            }
        } catch (err) {
            throw errorDisc(err, 'error in deleteIrrelevantRules()', { dateStartString, rule });
        }
    });
    danielSan.rules = newRules;
};

const prepareRules = ({ danielSan, date }) => {
    // to avoid unnecessary future checks to see if certain properties exist, we will add them with default values
    if (!danielSan.retiredRuleIndices) {
        danielSan.retiredRuleIndices = [];
    }
    if (!danielSan.events) {
        danielSan.events = [];
    }
    if (!danielSan.discardedEvents) {
        danielSan.discardedEvents = [];
    }
    if (!danielSan.beginBalance) {
        danielSan.beginBalance = 0;
    }
    if (isUndefinedOrNull(danielSan.currencyConversion)) {
        danielSan.currencyConversion = ({ amount }) => {
            return amount;
        };
    }
    if (isUndefinedOrNull(danielSan.currencySymbol)) {
        danielSan.currencySymbol = CURRENCY_DEFAULT;
    } else {
        danielSan.currencySymbol = danielSan.currencySymbol.toUpperCase();
    }
    if (isUndefinedOrNull(danielSan.timeZoneType) || isUndefinedOrNull(danielSan.timeZone)) {
        const initialTimeZoneData = initializeTimeZoneData(danielSan);
        danielSan.timeZoneType = initialTimeZoneData.timeZoneType;
        danielSan.timeZone = initialTimeZoneData.timeZone;
    }
    danielSan.rules.forEach((rule, index) => {
        if (isUndefinedOrNull(rule.currencySymbol)) {
            rule.currencySymbol = CURRENCY_DEFAULT;
        } else {
            rule.currencySymbol = rule.currencySymbol.toUpperCase();
        }
        // initialize timezone data
        if (isUndefinedOrNull(rule.timeZoneType) || isUndefinedOrNull(rule.timeZone)) {
            const initialTimeZoneData = initializeTimeZoneData(rule);
            rule.timeZoneType = initialTimeZoneData.timeZoneType;
            rule.timeZone = initialTimeZoneData.timeZone;
        }
        // if standard event, check to pre-modulate
        if (
            rule.type === STANDARD_EVENT ||
            rule.type === STANDARD_EVENT_ROUTINE ||
            rule.type === STANDARD_EVENT_REMINDER
        ) {
            try {
                if (isUndefinedOrNull(rule.modulus) || isUndefinedOrNull(rule.cycle) || rule.frequency === ONCE) {
                    rule.modulus = 0;
                    rule.cycle = 0;
                } else {
                    // if we made it to this block of code then at least a modulus or cycle attribute is present
                    //  check for input errors to modulus/cycle attributes
                    if (!rule.modulus) {
                        rule.modulus = 1;
                    }
                    if (!rule.cycle) {
                        rule.cycle = 1;
                    }
                    // if there is a dateStart without a syncDate, then just assign it to the syncDate
                    if (!rule.syncDate && rule.dateStart) {
                        rule.syncDate = rule.dateStart;
                    }
                    const convertedDate = convertTimeZone({
                        timeZone: rule.timeZone,
                        timeZoneType: rule.timeZoneType,
                        date
                    }).date;
                    const dateStartString = getRelevantDateSegmentByFrequency({
                        frequency: ONCE,
                        date: convertedDate
                    });
                    // if the following condition is not true, there is no reason to modify the modulus cycle
                    // eslint-disable-next-line no-lonely-if
                    if (rule.syncDate && rule.syncDate !== dateStartString) {
                        if (rule.syncDate > dateStartString) {
                            // pre-modulation is not necessary here since we will simply start the cycle in the future
                            rule.dateStart = rule.syncDate; // future date
                            rule.syncDate = null;
                        } else {
                            rule.dateStart = null;
                            cycleModulusUpToDate({
                                rule,
                                dateStartString
                            });
                        }
                    }
                }
                if (rule.frequency === DAILY) {
                    rule.processDate = null;
                }
            } catch (err) {
                throw errorDisc(err, 'error in prepareRules()', { index, date, rule });
            }
        }
    });
};

const executeEvents = ({ danielSan }) => {
    danielSan.events.forEach((event, index) => {
        try {
            event.beginBalance = index === 0 ? danielSan.beginBalance : danielSan.events[index - 1].endBalance;
            event.endBalance = event.beginBalance; // default value in case there is no amount field
            if (!isUndefinedOrNull(event.amount)) {
                const convertedAmount =
                    danielSan.currencySymbol &&
                    event.currencySymbol &&
                    danielSan.currencySymbol !== event.currencySymbol
                        ? danielSan.currencyConversion({
                              amount: event.amount,
                              inputSymbol: event.currencySymbol,
                              outputSymbol: danielSan.currencySymbol
                          })
                        : event.amount;
                event.endBalance = event.beginBalance + convertedAmount; // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
                event.convertedAmount = convertedAmount;
                event.timeZoneType = danielSan.timeZoneType;
                event.timeZone = danielSan.timeZone;
                event.currencySymbol = danielSan.currencySymbol;
            }
        } catch (err) {
            throw errorDisc(err, 'error in executeEvents()', { event, index });
        }
    });
};

const checkForInputErrors = ({ danielSan, dateStartString, dateEndString }) => {
    let errorMessage = null;
    if (
        isUndefinedOrNull(danielSan) ||
        danielSan === {} ||
        (!Array.isArray(danielSan.rules) || danielSan.rules.length === 0)
    ) {
        errorMessage =
            'findBalance() must first find appropriate parameters. expected danielSan to be an object with cashflow rules';
    }
    if (isUndefinedOrNull(dateStartString) || isUndefinedOrNull(dateEndString) || dateStartString > dateEndString) {
        errorMessage = 'findBalance() must first find appropriate parameters. there was a problem with a date input';
    }
    if (!danielSan.rules || !Array.isArray(danielSan.rules) || danielSan.rules.length === 0) {
        errorMessage = 'findBalance() must first find appropriate parameters. where are the cashflow rules?';
    }

    if (errorMessage) {
        const error = errorDisc({}, errorMessage);
        throw error;
    }
};

const findBalance = (danielSan = {}) => {
    const newDanielSan = deepCopy(danielSan);
    try {
        const dateStartString = newDanielSan.dateStart;
        const dateEndString = newDanielSan.dateEnd;
        const timeStartString = newDanielSan.timeStart;
        const timeZone = newDanielSan.timeZone;
        const timeZoneType = newDanielSan.timeZoneType;
        checkForInputErrors({ danielSan: newDanielSan, dateStartString, dateEndString });
        deleteIrrelevantRules({
            danielSan: newDanielSan
        });
        const timeStream = new TimeStream({
            dateStartString,
            dateEndString,
            timeZone,
            timeZoneType,
            timeString: timeStartString
        });
        prepareRules({ danielSan: newDanielSan, date: timeStream.looperDate });
        do {
            buildEvents({
                danielSan: newDanielSan,
                rules: newDanielSan.rules,
                date: timeStream.looperDate
            });
        } while (timeStream.stream1DayForward());
        timeTravel(newDanielSan); // note: newDanielSan timezones must be converted prior to sorting and executing events
        sortDanielSan(newDanielSan); // note: newDanielSan must be sorted prior to executing events
        discardEventsOutsideDateRange(newDanielSan);
        executeEvents({ danielSan: newDanielSan });

        if (newDanielSan.events.length > 0) {
            newDanielSan.endBalance = newDanielSan.events[newDanielSan.events.length - 1].endBalance;
        }
        return {
            error: null,
            danielSan: newDanielSan
        };
    } catch (err) {
        const error = errorDisc(err, 'error in findBalance(). something bad happened and a lot of robots died');
        return error;
    }
};

module.exports = findBalance;
