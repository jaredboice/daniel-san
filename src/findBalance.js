const { TimeStream } = require('./timeStream');
const errorDisc = require('./utility/errorHandling');
const { buildStandardEvent } = require('./standardEvents');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('./specialEvents');
const {
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    adjustAmountOnTheseDates
} = require('./specialAdjustments');
const {
    getRelevantDateSegmentByFrequency,
    flagRuleForRetirement,
    retireRules
} = require('./standardEvents/common');
const { cycleModulusUpToDate, cycleModulusDownToDate, cycleModulusUp, isCycleAtModulus } = require('./modulusCycle');
const { isUndefinedOrNull } = require('./utility/validation');
const {
    DATE_DELIMITER,
    DATE_FORMAT_STRING,
    STANDARD_EVENT,
    NTH_WEEKDAYS_OF_MONTH,
    WEEKDAY_ON_DATE,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
    VOID_AMOUNT_ON_THIS_PARTICULAR_DATE,
    ADJUST_AMOUNT_ON_THESE_DATES,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAILY,
    ONCE,
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    BUILD_DATE_STRING,
    DISCOVERING_EVENT_TYPE,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    EXECUTING_SPECIAL_ADJUSTMENT,
    MODIFIED,
    RETIRING_RULES
} = require('./constants');

const buildEvents = ({ danielSan, rules, date }) => {
    let processPhase;
    try {
        rules.forEach((rule, index) => {
            danielSan.cashflowRetiredRuleIndices = [];
            processPhase = DISCOVERING_EVENT_TYPE;
            switch (rule.type) {
                case STANDARD_EVENT:
                    processPhase = buildStandardEvent({ danielSan, rule, date });
                    break;
                case NTH_WEEKDAYS_OF_MONTH:
                    processPhase = nthWeekdaysOfMonth({ danielSan, rule, date });
                    break;
                case WEEKDAY_ON_DATE:
                    processPhase = weekdayOnDate({ danielSan, rule, date });
                    break;
                default:
                    break;
            }
            if (
                processPhase === MODIFIED &&
                danielSan.events[danielSan.events.length - 1].specialAdjustments
            ) {
                // note: execute specialAdjustments if exists
                processPhase = EXECUTING_SPECIAL_ADJUSTMENT;
                danielSan.events[danielSan.events.length - 1].specialAdjustments.forEach(
                    (specialAdjustment) => {
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
                    }
                );
            }
            processPhase = RETIRING_RULES;
            flagRuleForRetirement({ danielSan, rule, date, index });
            retireRules({ danielSan });
        });
    } catch (err) {
        throw errorDisc(err, 'error in buildEvents()', { date, processPhase, rules });
    }
};

const sortDanielSan = (danielSan) => {
    danielSan.events.sort((a, b) => {
        const thisDateA = a.thisDate.split(DATE_DELIMITER).join('');
        const thisDateB = b.thisDate.split(DATE_DELIMITER).join('');
        if (thisDateA > thisDateB) {
            return 1;
        } else if (thisDateA < thisDateB) {
            return -1;
        } else {
            return 0;
        }
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
    // bring modulus/cycle up-to-date for each rule
    danielSan.rules.forEach((rule, index) => {
        try {
            // modulus and cycle are required for unambiguous conditioning (better to define it and know it is there in this case)
            if (
                isUndefinedOrNull(rule.modulus) ||
                isUndefinedOrNull(rule.cycle) ||
                rule.frequency === ONCE
            ) {
                rule.modulus = 0;
                rule.cycle = 0;
            } else {
                // cycleModulus
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
    });
};

const executeEvents = ({ danielSan }) => {
    danielSan.events.forEach((rule, index) => {
        try {
            rule.beginBalance =
                index === 0 ? danielSan.beginBalance : danielSan.events[index - 1].endBalance;
            rule.endBalance = rule.beginBalance + rule.amount;
        } catch (err) {
            throw errorDisc(err, 'error in executeEvents()', { rule, index });
        }
    });
};

const checkForInputErrors = ({ danielSan, dateStartString, dateEndString, rules }) => {
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
        const error = errorDisc(err, 'error in findBalance(). something bad happened and a lot of robots died', { events: danielSan.events });
        return error;
    }
};

module.exports = findBalance;
