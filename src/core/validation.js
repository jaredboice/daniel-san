const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { initializeTimeZoneData, convertTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const { modulateCycleUpToDate } = require('../modulusCycle/modulateCycleToDate');
const {
    EVENT_SOURCE,
    STANDARD_EVENT,
    DAILY,
    ONCE,
    STANDARD_EVENT_ROUTINE,
    STANDARD_EVENT_REMINDER,
    CURRENCY_DEFAULT
} = require('../constants');

const validateAndConfigureBonsaiTree = ({ danielSan, effectiveDateStartString, effectiveDateEndString }) => {
    let errorMessage = null;
    if (isUndefinedOrNull(danielSan) || (!Array.isArray(danielSan.rules) || danielSan.rules.length === 0)) {
        errorMessage = 'expected a danielSan object with an array of rules';
    }
    if (
        isUndefinedOrNull(effectiveDateStartString) ||
        isUndefinedOrNull(effectiveDateEndString) ||
        effectiveDateStartString > effectiveDateEndString
    ) {
        errorMessage = 'there is a problem with an effective date';
    }
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
    if (!danielSan.irrelevantRules) {
        danielSan.irrelevantRules = [];
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
    if (errorMessage) {
        throw errorDisc({ err: {}, errorMessage, data: { effectiveDateStartString, effectiveDateEndString } });
    }
};

const validateAndConfigureRules = ({ danielSan, date }) => {
    let ruleTracker; // for errorDisc
    let indexTracker; // for errorDisc
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
        try {
            if (!rule.modulus || !rule.cycle || (rule.frequency === ONCE && !Array.isArray(rule.processDate))) {
                rule.modulus = null;
                rule.cycle = null;
            } else {
                // if we made it to this block of code then at least a modulus or cycle attribute is present
                //  check for input errors to modulus/cycle attributes
                if (!rule.modulus) {
                    rule.modulus = 1;
                }
                if (!rule.cycle) {
                    rule.cycle = 1;
                }
                // if there is an effectiveDateStart without an anchorSyncDate, then just assign it to the anchorSyncDate
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
                        modulateCycleUpToDate({
                            danielSan,
                            rule,
                            effectiveDateStartString,
                            skipTimeTravel: danielSan.skipTimeTravel
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
    });
};

module.exports = {
    validateAndConfigureBonsaiTree,
    validateAndConfigureRules
};
