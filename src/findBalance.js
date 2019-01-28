const { TimeStream } = require('./timeStream');
const { errorDisc } = require('./utility/errorHandling');
const { isUndefinedOrNull } = require('./utility/validation');
const { buildStandardEvent } = require('./standardEvents');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('./specialEvents');
const {
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    adjustAmountOnTheseDates
} = require('./specialAdjustments');
const { flagRuleForRetirement, retireRules } = require('./standardEvents/common');
const { cycleModulusUpToDate, cycleModulusDownToDate } = require('./modulusCycle/cycleModulusToDate');
const {
    DATE_DELIMITER,
    STANDARD_EVENT,
    NTH_WEEKDAYS_OF_MONTH,
    NTH_WEEKDAYS_OF_MONTH_ROUTINE,
    NTH_WEEKDAYS_OF_MONTH_REMINDER,
    WEEKDAY_ON_DATE,
    WEEKDAY_ON_DATE_ROUTINE,
    WEEKDAY_ON_DATE_REMINDER,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
    ADJUST_AMOUNT_ON_THESE_DATES,
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

const buildEvents = ({ danielSan, rules, date }) => {
    let processPhase;
    try {
        rules.forEach((rule, index) => {
            danielSan.cashflowRetiredRuleIndices = [];
            processPhase = DISCOVERING_EVENT_TYPE;
            switch (rule.type) {
            case STANDARD_EVENT:
            case STANDARD_EVENT_ROUTINE:
            case STANDARD_EVENT_REMINDER:
                processPhase = buildStandardEvent({ danielSan, rule, date });
                break;
            case NTH_WEEKDAYS_OF_MONTH:
            case NTH_WEEKDAYS_OF_MONTH_ROUTINE:
            case NTH_WEEKDAYS_OF_MONTH_REMINDER:
                processPhase = nthWeekdaysOfMonth({ danielSan, rule, date });
                break;
            case WEEKDAY_ON_DATE:
            case WEEKDAY_ON_DATE_ROUTINE:
            case WEEKDAY_ON_DATE_REMINDER:
                processPhase = weekdayOnDate({ danielSan, rule, date });
                break;
            default:
                break;
            }
            if (processPhase === MODIFIED && danielSan.events[danielSan.events.length - 1].specialAdjustments) {
                // note: execute specialAdjustments if exists
                processPhase = EXECUTING_SPECIAL_ADJUSTMENT;
                danielSan.events[danielSan.events.length - 1].specialAdjustments.forEach((specialAdjustment) => {
                    switch (specialAdjustment.type) {
                    case MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS:
                        moveThisProcessDateAfterTheseWeekdays({
                            rule: danielSan.events[danielSan.events.length - 1],
                            specialAdjustment
                        });
                        break;
                    case MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES:
                        moveThisProcessDateAfterTheseDates({
                            rule: danielSan.events[danielSan.events.length - 1],
                            specialAdjustment
                        });
                        break;
                    case ADJUST_AMOUNT_ON_THESE_DATES:
                        adjustAmountOnTheseDates({
                            rule: danielSan.events[danielSan.events.length - 1],
                            specialAdjustment
                        });
                        break;
                    default:
                        break;
                    }
                });
            }
            processPhase = RETIRING_RULES;
            flagRuleForRetirement({ danielSan, rule, date, index });
            retireRules({ danielSan });
        });
    } catch (err) {
        throw errorDisc(err, 'error in buildEvents()', { date, processPhase });
    }
};

const compareByPropertyKey = (a, b, propertyKey) => {
    if (a[propertyKey] && b[propertyKey]) {
        const paramA = typeof a[propertyKey] === 'string' ? a[propertyKey].toLowerCase() : a[propertyKey];
        const paramB = typeof b[propertyKey] === 'string' ? b[propertyKey].toLowerCase() : b[propertyKey];
        if (paramA > paramB) {
            return 1;
        } else if (paramA < paramB) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    } else if (a && !b) {
        return 1;
    } else if (b && !a) {
        return -1;
    } else {
        return 0;
    }
};

const compareTime = (a, b) => {
    if (a && b) {
        const paramA = a.toLowerCase();
        const paramB = b.toLowerCase();
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
            return 0;
        }
    } else if (a && !b) {
        return 1;
    } else if (b && !a) {
        return -1;
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
                return compareTime(a.timeStart, b.timeStart);
                // eslint-disable-next-line no-else-return
            } else {
                return compareByPropertyKey(a, b, 'sortPriority');
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

const prepareRules = ({ danielSan, dateStartString }) => {
    // to avoid unnecessary future checks to see if certain properties exist, we will add them with default values
    if (!danielSan.events) {
        danielSan.events = [];
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
    danielSan.rules.forEach((rule, index) => {
        if (isUndefinedOrNull(rule.currencySymbol)) {
            rule.currencySymbol = CURRENCY_DEFAULT;
        } else {
            rule.currencySymbol = rule.currencySymbol.toUpperCase();
        }
        if (rule.type === STANDARD_EVENT || STANDARD_EVENT_ROUTINE) {
            try {
                if (isUndefinedOrNull(rule.modulus) || isUndefinedOrNull(rule.cycle) || rule.frequency === ONCE) {
                    rule.modulus = 0;
                    rule.cycle = 0;
                } else {
                    // bring modulus/cycle up-to-date for each rule
                    // eslint-disable-next-line no-lonely-if
                    if (rule.syncDate && rule.syncDate < dateStartString) {
                        cycleModulusUpToDate({ rule, dateStartString });
                    } else if (rule.syncDate && rule.syncDate > dateStartString) {
                        cycleModulusDownToDate({ rule, dateStartString });
                    }
                }
                if (rule.frequency === DAILY) {
                    rule.processDate = null;
                }
            } catch (err) {
                throw errorDisc(err, 'error in prepareRules()', { index, dateStartString, rule });
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
                const convertedAmount = (danielSan.currencySymbol && event.currencySymbol && danielSan.currencySymbol !== event.currencySymbol) ? danielSan.currencyConversion({ amount: event.amount, currentSymbol: event.currencySymbol, futureSymbol: danielSan.currencySymbol }) : event.amount;
                event.endBalance = event.beginBalance + convertedAmount; // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
                event.convertedAmount = convertedAmount;
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
    try {
        const dateStartString = danielSan.dateStart;
        const dateEndString = danielSan.dateEnd;
        checkForInputErrors({ danielSan, dateStartString, dateEndString });
        deleteIrrelevantRules({
            danielSan,
            dateStartString
        });
        prepareRules({ danielSan, dateStartString });
        const timeStream = new TimeStream({ dateStartString, dateEndString });
        do {
            buildEvents({
                danielSan,
                rules: danielSan.rules,
                date: timeStream.looperDate
            });
        } while (timeStream.stream1DayForward());
        sortDanielSan(danielSan); // note: danielSan must be sorted prior to executing events
        executeEvents({ danielSan });
        danielSan.endBalance = danielSan.events[danielSan.events.length - 1].endBalance;
        return {
            error: null,
            danielSan
        };
    } catch (err) {
        const error = errorDisc(err, 'error in findBalance(). something bad happened and a lot of robots died');
        return error;
    }
};

module.exports = findBalance;
