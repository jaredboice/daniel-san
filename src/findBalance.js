const moment = require('moment-timezone');
const { TimeStream } = require('./timeStream');
const { initializeTimeZoneData, createTimeZone, convertTimeZone, timeTravel } = require('./timeZone');
const { seekAndDestroyIrrelevantRules } = require('./analytics');
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
    EVENT_SOURCE,
    OBSERVER_SOURCE,
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
    CURRENCY_DEFAULT,
    COMPOUND_DATA_DELIMITER
} = require('./constants');

const discardEventsOutsideDateRange = (danielSan) => {
    const { effectiveDateStart, timeStart, effectiveDateEnd, timeEnd, timeZone, timeZoneType } = danielSan;
    const eventsToDiscard = [];
    const newEventList = [];
    danielSan.events.forEach((event) => {
        const dateToStart = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateStart,
            timeString: timeStart
        });
        const eventDateStart = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: event.dateStart,
            timeString: event.timeStart
        });
        const dateToEnd = createTimeZone({
            timeZone,
            timeZoneType,
            dateString: effectiveDateEnd,
            timeString: timeEnd || timeStart
        });
        if (eventDateStart.isBefore(dateToStart) || eventDateStart.isAfter(dateToEnd)) {
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

const buildEvents = ({ danielSan, rules, date, options = {} }) => {
    const { skipTimeTravel } = options;
    let processPhase;
    let convertedDate;
    let ruleTracker; // for errorDisc
    let indexTracker; // for errorDisc
    try {
        rules.forEach((rule, index) => {
            ruleTracker = rule;
            indexTracker = index;
            convertedDate = convertTimeZone({
                timeZone: rule.timeZone,
                timeZoneType: rule.timeZoneType,
                date
            }).date;
            if (
                isUndefinedOrNull(rule.effectiveDateStart) ||
                rule.effectiveDateStart <= convertedDate.format(DATE_FORMAT_STRING)
            ) {
                processPhase = DISCOVERING_EVENT_TYPE;
                switch (rule.type) {
                    case STANDARD_EVENT:
                    case STANDARD_EVENT_ROUTINE:
                    case STANDARD_EVENT_REMINDER:
                        processPhase = buildStandardEvent({ danielSan, rule, date: convertedDate, skipTimeTravel });
                        break;
                    case NTH_WEEKDAYS_OF_MONTH:
                    case NTH_WEEKDAYS_OF_MONTH_ROUTINE:
                    case NTH_WEEKDAYS_OF_MONTH_REMINDER:
                        processPhase = nthWeekdaysOfMonth({ danielSan, rule, date: convertedDate, skipTimeTravel });
                        break;
                    case WEEKDAY_ON_DATE:
                    case WEEKDAY_ON_DATE_ROUTINE:
                    case WEEKDAY_ON_DATE_REMINDER:
                        processPhase = weekdayOnDate({ danielSan, rule, date: convertedDate, skipTimeTravel });
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
                                specialAdjustment,
                                danielSan,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES:
                        case PRE_PAY:
                            moveThisProcessDateBeforeTheseDates({
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                danielSan,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS:
                            moveThisProcessDateAfterTheseWeekdays({
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                danielSan,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES:
                        case POST_PAY:
                            moveThisProcessDateAfterTheseDates({
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                danielSan,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case ADJUST_AMOUNT_ON_THESE_DATES:
                        case ADJUST_AMOUNT:
                            adjustAmountOnTheseDates({
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                danielSan,
                                date: convertedDate
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
        throw errorDisc({ err, data: { date, processPhase, convertedDate, rule: ruleTracker, indexTracker, options } });
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

const deleteIrrelevantRules = ({ danielSan, effectiveDateStartString }) => {
    try {
        const irrelevantRules = seekAndDestroyIrrelevantRules(danielSan);
        danielSan.irrelevantRules = irrelevantRules;
    } catch (err) {
        throw errorDisc({ err, data: { effectiveDateStartString } });
    }
};

const validateAndConfigure = ({ danielSan, date }) => {
    let ruleTracker; // for errorDisc
    let indexTracker; // for errorDisc
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
    if (!danielSan.balanceBeginning) {
        danielSan.balanceBeginning = 0;
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
    danielSan.rules.forEach((rule, index) => {
        ruleTracker = rule;
        indexTracker = index;
        rule.context = EVENT_SOURCE;
        if (isUndefinedOrNull(rule.currencySymbol)) {
            rule.currencySymbol = CURRENCY_DEFAULT;
        } else {
            rule.currencySymbol = rule.currencySymbol.toUpperCase();
        }
        // initialize timezone data
        if (isUndefinedOrNull(rule.timeZoneType) || isUndefinedOrNull(rule.timeZone)) {
            const initialTimeZoneData = initializeTimeZoneData(rule);
            rule.timeZoneType = danielSan.timeZoneType; // assign the danielSan timeZoneType value to each rule
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
                    // if there is a effectiveDateStart without a anchorSyncDate, then just assign it to the anchorSyncDate
                    if (!rule.anchorSyncDate && rule.effectiveDateStart) {
                        rule.anchorSyncDate = rule.effectiveDateStart;
                    }
                    const convertedDate = convertTimeZone({
                        timeZone: rule.timeZone,
                        timeZoneType: rule.timeZoneType,
                        date
                    }).date;
                    const effectiveDateStartString = getRelevantDateSegmentByFrequency({
                        frequency: ONCE,
                        date: convertedDate
                    });
                    // if the following condition is not true, there is no reason to modify the modulus cycle
                    // eslint-disable-next-line no-lonely-if
                    if (rule.anchorSyncDate && rule.anchorSyncDate !== effectiveDateStartString) {
                        if (rule.anchorSyncDate > effectiveDateStartString) {
                            // pre-modulation is not necessary here since we will simply start the cycle in the future
                            rule.effectiveDateStart = rule.anchorSyncDate; // future date
                            rule.anchorSyncDate = null;
                        } else {
                            rule.effectiveDateStart = null;
                            cycleModulusUpToDate({
                                rule,
                                effectiveDateStartString
                            });
                        }
                    }
                }
                if (rule.frequency === DAILY) {
                    rule.processDate = null;
                }
            } catch (err) {
                throw errorDisc({ err, data: { date, rule: ruleTracker, indexTracker } });
            }
        }
    });
};

const executeEvents = ({ danielSan }) => {
    danielSan.events.forEach((event, index) => {
        try {
            event.balanceBeginning =
                index === 0 ? danielSan.balanceBeginning : danielSan.events[index - 1].balanceEnding;
            event.balanceEnding = event.balanceBeginning; // default value in case there is no amount field
            let amountConverted = 0;
            if (!isUndefinedOrNull(event.amount)) {
                if (event.amount !== 0) {
                    amountConverted =
                        danielSan.currencySymbol &&
                        event.currencySymbol &&
                        danielSan.currencySymbol !== event.currencySymbol
                            ? danielSan.currencyConversion({
                                  amount: event.amount,
                                  inputSymbol: event.currencySymbol,
                                  outputSymbol: danielSan.currencySymbol
                              })
                            : event.amount;
                }
                event.context = OBSERVER_SOURCE;
                event.balanceEnding = event.balanceBeginning + amountConverted; // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
                event.amountConverted = amountConverted;
                event.currencyEventSource = `${event.currencySymbol}${COMPOUND_DATA_DELIMITER}${event.amount}`; // for future convenience
                event.currencyObserverSource = `${danielSan.currencySymbol}${COMPOUND_DATA_DELIMITER}${event.amountConverted}`; // for future convenience
                event.currencySymbol = danielSan.currencySymbol;
            }
        } catch (err) {
            throw errorDisc({ err, data: { event, index } });
        }
    });
};

const checkForInputErrors = ({ danielSan, effectiveDateStartString, effectiveDateEndString }) => {
    let errorMessage = null;
    if (
        isUndefinedOrNull(danielSan) ||
        danielSan === {} ||
        (!Array.isArray(danielSan.rules) || danielSan.rules.length === 0)
    ) {
        errorMessage =
            'findBalance() must first find appropriate parameters. expected danielSan to be an object with cashflow rules';
    }
    if (
        isUndefinedOrNull(effectiveDateStartString) ||
        isUndefinedOrNull(effectiveDateEndString) ||
        effectiveDateStartString > effectiveDateEndString
    ) {
        errorMessage = 'findBalance() must first find appropriate parameters. there was a problem with a date input';
    }
    if (!danielSan.rules || !Array.isArray(danielSan.rules) || danielSan.rules.length === 0) {
        errorMessage = 'findBalance() must first find appropriate parameters. where are the cashflow rules?';
    }

    if (errorMessage) {
        throw errorDisc({ err, errorMessage, data: { effectiveDateStartString, effectiveDateEndString } });
    }
};

const cleanUpData = (danielSan) => {
    // the idea is that we should only provide useful data that makes sense in the context of each event
    // as it may relate to timezone or currency conversion
    // any other information that may be required can be gathered from the original rule (matched via name or custom id property)
    danielSan.events.forEach((event) => {
        delete event.specialAdjustments;
        delete event.exclusions;
        delete event.processDate;
        if (typeof event.frequency !== 'string') {
            delete event.frequency;
        }
    });
};

const findBalance = (danielSan = {}, options = {}) => {
    /*
        the first parameter is the entire danielSan bonsai tree of data that you configure.
        the options parameter defines execution options for enhancing performance
            if you  know for a fact that your danielSan object and your rules are validated/configured according to that function's specifications, then you can skip that phase
            likewise, you can skip deleteIrrelevantRules if you have already removed irrelevant rules manually
            and you can skip time travel when appropriate, just keep in mind that timeTravel assumes that all of the rules are in sync with the daniel-san bonsai tree's time zone data (the MCU / Master Control Unit)
            see the options from the object destructuring below
    */
    const {
        skipValidateAndConfigure = null,
        skipDeleteIrrelevantRules = null,
        skipTimeTravel = null,
        skipDiscardEventsOutsideDateRange = null,
        skipCleanUpData = null
    } = options;
    const newDanielSan = deepCopy(danielSan);
    try {
        if (isUndefinedOrNull(newDanielSan.timeZoneType) || isUndefinedOrNull(newDanielSan.timeZone)) {
            const initialTimeZoneData = initializeTimeZoneData(newDanielSan);
            newDanielSan.timeZoneType = initialTimeZoneData.timeZoneType;
            newDanielSan.timeZone = initialTimeZoneData.timeZone;
        }
        const timeZone = newDanielSan.timeZone;
        const timeZoneType = newDanielSan.timeZoneType;
        const effectiveDateStartString = newDanielSan.effectiveDateStart;
        const effectiveDateEndString = newDanielSan.effectiveDateEnd;
        const timeStartString = newDanielSan.timeStart;
        checkForInputErrors({ danielSan: newDanielSan, effectiveDateStartString, effectiveDateEndString });
        const timeStream = new TimeStream({
            effectiveDateStartString,
            effectiveDateEndString,
            timeStartString,
            timeEndString: timeStartString,
            timeZone,
            timeZoneType
        });
        if (!skipValidateAndConfigure) {
            validateAndConfigure({ danielSan: newDanielSan, date: timeStream.looperDate });
        }
        if (!skipDeleteIrrelevantRules) {
            deleteIrrelevantRules({
                danielSan: newDanielSan
            }); // this follows validateAndConfigure just in case timezones were not yet present where they needed to be
        }
        do {
            buildEvents({
                danielSan: newDanielSan,
                rules: newDanielSan.rules,
                date: timeStream.looperDate,
                options
            });
        } while (timeStream.stream1DayForward());
        // note: newDanielSan timezones must be converted prior to sorting and executing events
        if (!skipTimeTravel) {
            timeTravel(newDanielSan);
        }
        sortDanielSan(newDanielSan); // note: newDanielSan must be sorted prior to executing events
        if (!skipDiscardEventsOutsideDateRange) {
            discardEventsOutsideDateRange(newDanielSan);
        }
        executeEvents({ danielSan: newDanielSan });
        if (!skipCleanUpData) {
            cleanUpData(newDanielSan);
        }
        if (newDanielSan.events.length > 0) {
            newDanielSan.balanceEnding = newDanielSan.events[newDanielSan.events.length - 1].balanceEnding;
        }
        return {
            error: null,
            danielSan: newDanielSan
        };
    } catch (err) {
        return {
            err: errorDisc({ err, data: { skipValidateAndConfigure, skipDeleteIrrelevantRules } })
        };
    }
};

module.exports = findBalance;
