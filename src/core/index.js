const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { convertTimeZone } = require('../timeZone');
const { buildStandardEvent } = require('../standardEvents');
const { nthWeekdaysOfMonth, weekdayOnDate } = require('../specialEvents');
const { flagRuleForRetirement, retireRules } = require('./obliterate');
const {
    moveThisProcessDateBeforeTheseWeekdays,
    moveThisProcessDateBeforeTheseDates,
    moveThisProcessDateAfterTheseWeekdays,
    moveThisProcessDateAfterTheseDates,
    adjustAmountOnTheseDates
} = require('../specialAdjustments');
const {
    OBSERVER_SOURCE,
    DATE_FORMAT_STRING,
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
    DISCOVERING_EVENT_TYPE,
    EXECUTING_SPECIAL_ADJUSTMENT,
    MODIFIED,
    RETIRING_RULES,
    STANDARD_EVENT_ROUTINE,
    STANDARD_EVENT_REMINDER
} = require('../constants');

const buildEvents = ({ danielSan, date, options = {} }) => {
    const { skipTimeTravel } = options;
    let processPhase;
    let convertedDate;
    let ruleTracker; // for errorDisc
    let indexTracker; // for errorDisc
    try {
        danielSan.rules.forEach((rule, index) => {
            ruleTracker = rule;
            indexTracker = index;
            convertedDate = !skipTimeTravel
                ? convertTimeZone({
                    timeZone: rule.timeZone,
                    timeZoneType: rule.timeZoneType,
                    date
                }).date
                : date;
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
                                danielSan,
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES:
                        case PRE_PAY:
                            moveThisProcessDateBeforeTheseDates({
                                danielSan,
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS:
                            moveThisProcessDateAfterTheseWeekdays({
                                danielSan,
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES:
                        case POST_PAY:
                            moveThisProcessDateAfterTheseDates({
                                danielSan,
                                event: danielSan.events[danielSan.events.length - 1],
                                specialAdjustment,
                                date: convertedDate,
                                skipTimeTravel
                            });
                            break;
                        case ADJUST_AMOUNT_ON_THESE_DATES:
                        case ADJUST_AMOUNT:
                            if (danielSan.events[danielSan.events.length - 1].amount) {
                                adjustAmountOnTheseDates({
                                    danielSan,
                                    event: danielSan.events[danielSan.events.length - 1],
                                    specialAdjustment,
                                    date: convertedDate
                                });
                            }
                            break;
                        default:
                            break;
                        }
                    });
                }
                processPhase = RETIRING_RULES;
                flagRuleForRetirement({ danielSan, rule, date: convertedDate, index });
            }
            if (rule.ruleModification) {
                const ruleModification = rule.ruleModification;
                ruleModification({ danielSan, rule, date, convertedDate });
            }
        });
        retireRules(danielSan);
    } catch (err) {
        throw errorDisc({ err, data: { date, processPhase, convertedDate, rule: ruleTracker, indexTracker, options } });
    }
};

const executeEvents = (danielSan) => {
    danielSan.events.forEach((event, index) => {
        try {
            event.balanceBeginning =
                index === 0 ? danielSan.config.balanceBeginning : danielSan.events[index - 1].balanceEnding;
            event.balanceEnding = event.balanceBeginning; // default value in case there is no amount field on the rule with which to adjust it
            let observerSourceCurrencyAmount = 0;
            if (!isUndefinedOrNull(event.amount)) {
                event.eventSourceCurrencyAmount = event.amount;
                if (event.eventSourceCurrencyAmount !== 0) {
                    observerSourceCurrencyAmount =
                        danielSan.config.currencySymbol &&
                        event.currencySymbol &&
                        danielSan.config.currencySymbol !== event.currencySymbol
                            ? danielSan.config.currencyConversion({
                                  amount: event.eventSourceCurrencyAmount,
                                  inputSymbol: event.currencySymbol,
                                  outputSymbol: danielSan.config.currencySymbol
                              })
                            : event.eventSourceCurrencyAmount;
                }
                event.context = OBSERVER_SOURCE; // simply so the user understands the context
                event.eventSourceCurrencySymbol = event.currencySymbol; // for future convenience
                event.eventSourceCurrencyAmount = event.amount; // for future convenience
                event.balanceEnding = event.balanceBeginning + observerSourceCurrencyAmount; // routine types like STANDARD_EVENT_ROUTINE do not require an amount field
                event.currencySymbol = danielSan.config.currencySymbol;
                event.observerSourceCurrencyAmount = observerSourceCurrencyAmount;
                event.amount = observerSourceCurrencyAmount;
            }
        } catch (err) {
            throw errorDisc({ err, data: { event, index } });
        }
    });
};

const cleanUpEvents = (danielSan) => {
    // the idea is that we should only provide useful data that makes sense in the context of each event
    // as it may relate to timezone or currency conversion
    // any other information that may be required can be gathered from the original rule (matched via name or custom id property)
    danielSan.events.forEach((event) => {
        delete event.specialAdjustments;
        delete event.exclusions;
        delete event.processDate;
        delete event.ruleModification;
        delete event.transientData;
        delete event.observerSourceCurrencyAmount;
        if (typeof event.frequency !== 'string') {
            delete event.frequency;
        }
    });
};

module.exports = {
    buildEvents,
    executeEvents,
    cleanUpEvents
};
