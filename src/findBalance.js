const { TimeStream } = require('./timeStream');
const errorDisc = require('./utility/errorHandling');
const { buildStandardCashflowOperation } = require('./standardOperations');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('./specialOperations');
const {
    moveThisParticularProcessDateAfterTheseWeekdays,
    moveThisParticularProcessDateAfterTheseDates,
    adjustAmountOnTheseParticularDates
} = require('./specialAdjustments');
const {
    getRelevantDateSegmentByFrequency,
    flagCashflowRuleForRetirement,
    retireCashflowRules
} = require('./standardOperations/common');
const { cycleModulusUpToDate, cycleModulusDownToDate, cycleModulusUp, isCycleAtModulus } = require('./modulusCycle');
const { isUndefinedOrNull } = require('./utility/validation');
const appConstants = require('./constants');
const {
    DATE_DELIMITER,
    DATE_FORMAT_STRING,
    STANDARD_OPERATION,
    NTH_WEEKDAYS_OF_MONTH,
    WEEKDAY_ON_DATE,
    MOVE_THIS_PARTICULAR_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PARTICULAR_PROCESS_DATE_AFTER_THESE_DATES,
    VOID_AMOUNT_ON_THIS_PARTICULAR_DATE,
    ADJUST_AMOUNT_ON_THESE_PARTICULAR_DATES,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAILY,
    ONCE,
    SUNDAY_NUM,
    MONDAY_NUM,
    TUESDAY_NUM,
    WEDNESDAY_NUM,
    THURSDAY_NUM,
    FRIDAY_NUM,
    SATURDAY_NUM,
    BUILD_DATE_STRING,
    DISCOVERING_OPERATION_TYPE,
    EVALUATING_RULE_INSERTION,
    EXECUTING_RULE_INSERTION,
    EXECUTING_SPECIAL_ADJUSTMENT,
    MODIFIED,
    RETIRING_RULES
} = appConstants;

const buildCashflowOperations = ({ danielSan, cashflowRules, date }) => {
    let processPhase;
    try {
        cashflowRules.forEach((cashflowRule, index) => {
            danielSan.cashflowRetiredRuleIndices = [];
            processPhase = DISCOVERING_OPERATION_TYPE;
            switch (cashflowRule.type) {
                case STANDARD_OPERATION:
                    processPhase = buildStandardCashflowOperation({ danielSan, cashflowRule, date });
                    break;
                case NTH_WEEKDAYS_OF_MONTH:
                    processPhase = nthWeekdaysOfMonth({ danielSan, cashflowRule, date });
                    break;
                case WEEKDAY_ON_DATE:
                    processPhase = weekdayOnDate({ danielSan, cashflowRule, date });
                    break;
                default:
                    break;
            }
            if (
                processPhase === MODIFIED &&
                danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1].specialAdjustments
            ) {
                // note: perform specialAdjustments if exists
                processPhase = EXECUTING_SPECIAL_ADJUSTMENT;
                danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1].specialAdjustments.forEach(
                    (specialAdjustment) => {
                        switch (specialAdjustment.type) {
                            case MOVE_THIS_PARTICULAR_PROCESS_DATE_AFTER_THESE_WEEKDAYS:
                                moveThisParticularProcessDateAfterTheseWeekdays({
                                    cashflowRule: danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case MOVE_THIS_PARTICULAR_PROCESS_DATE_AFTER_THESE_DATES:
                                moveThisParticularProcessDateAfterTheseDates({
                                    cashflowRule: danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1],
                                    specialAdjustment
                                });
                                break;
                            case ADJUST_AMOUNT_ON_THESE_PARTICULAR_DATES:
                                adjustAmountOnTheseParticularDates({
                                    cashflowRule: danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1],
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
            flagCashflowRuleForRetirement({ danielSan, cashflowRule, date, index });
            retireCashflowRules({ danielSan });
        });
    } catch (err) {
        throw errorDisc(err, 'error in buildCashflowOperations()', { date, processPhase, cashflowRules });
    }
};

const sortDanielSan = (danielSan) => {
    danielSan.cashflowOperations.sort((a, b) => {
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

const deleteIrrelevantCashflowRules = ({ danielSan, dateStartString }) => {
    const newCashflowRules = danielSan.cashflowRules.filter((cashflowRule) => {
        try {
            if (cashflowRule.frequency === ONCE && cashflowRule.processDate < dateStartString) {
                // exclude:
                return false;
            }
            if (isUndefinedOrNull(cashflowRule.dateEnd)) {
                // include
                return true;
            } else if (cashflowRule.dateEnd < dateStartString) {
                // exclude
                return false;
                // eslint-disable-next-line no-else-return
            } else {
                // include
                return true;
            }
        } catch (err) {
            throw errorDisc(err, 'error in deleteIrrelevantCashflowRules()', { dateStartString, cashflowRule });
        }
    });
    danielSan.cashflowRules = newCashflowRules;
};

const prepareCashflowRules = ({ danielSan, dateStartString }) => {
    // bring modulus/cycle up-to-date for each cashflowRule
    danielSan.cashflowRules.forEach((cashflowRule, index) => {
        try {
            // modulus and cycle are required for unambiguous conditioning (better to define it and know it is there in this case)
            if (
                isUndefinedOrNull(cashflowRule.modulus) ||
                isUndefinedOrNull(cashflowRule.cycle) ||
                cashflowRule.frequency === ONCE
            ) {
                cashflowRule.modulus = 0;
                cashflowRule.cycle = 0;
            } else {
                // cycleModulus
                // eslint-disable-next-line no-lonely-if
                if (cashflowRule.syncDate && cashflowRule.syncDate < dateStartString) {
                    cycleModulusUpToDate({ cashflowRule, dateStartString });
                } else if (cashflowRule.syncDate && cashflowRule.syncDate > dateStartString) {
                    cycleModulusDownToDate({ cashflowRule, dateStartString });
                }
            }
            if (cashflowRule.frequency === DAILY) {
                cashflowRule.processDate = null;
            }
        } catch (err) {
            throw errorDisc(err, 'error in prepareCashflowRules()', { index, dateStartString, cashflowRule });
        }
    });
};

const executeCashflowOperations = ({ danielSan }) => {
    danielSan.cashflowOperations.forEach((cashflowRule, index) => {
        try {
            cashflowRule.beginBalance =
                index === 0 ? danielSan.beginBalance : danielSan.cashflowOperations[index - 1].endBalance;
            cashflowRule.endBalance = cashflowRule.beginBalance + cashflowRule.amount;
        } catch (err) {
            throw errorDisc(err, 'error in executeCashflowOperations()', { cashflowRule, index });
        }
    });
};

const checkForInputErrors = ({ danielSan, dateStartString, dateEndString, cashflowRules }) => {
    let errorMessage = null;
    if (
        isUndefinedOrNull(danielSan) ||
        danielSan === {} ||
        (!Array.isArray(danielSan.cashflowRules) || danielSan.cashflowRules.length === 0)
    ) {
        errorMessage =
            'findBalance() must first find appropriate parameters. expected danielSan to be an object with cashflow rules';
    }
    if (isUndefinedOrNull(dateStartString) || isUndefinedOrNull(dateEndString) || dateStartString > dateEndString) {
        errorMessage = 'findBalance() must first find appropriate parameters. there was a problem with a date input';
    }
    if (!danielSan.cashflowRules || !Array.isArray(danielSan.cashflowRules) || danielSan.cashflowRules.length === 0) {
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
        deleteIrrelevantCashflowRules({
            danielSan,
            dateStartString
        });
        prepareCashflowRules({ danielSan, dateStartString });
        const timeStream = new TimeStream({ dateStartString, dateEndString });
        do {
            buildCashflowOperations({
                danielSan,
                cashflowRules: danielSan.cashflowRules,
                date: timeStream.looperDate
            });
        } while (timeStream.stream1DayForward());
        sortDanielSan(danielSan); // note: danielSan must be sorted prior to performing operations
        executeCashflowOperations({ danielSan });
        danielSan.endBalance = danielSan.cashflowOperations[danielSan.cashflowOperations.length - 1].endBalance;
        return {
            error: null,
            danielSan
        };
    } catch (err) {
        const error = errorDisc(err, 'error in findBalance(). something bad happened and a lot of robots died', { cashflowOperations: danielSan.cashflowOperations });
        return error;
    }
};

module.exports = findBalance;
