const { errorDisc } = require('../utility/errorHandling');
const { isUndefinedOrNull } = require('../utility/validation');
const { initializeTimeZoneData, convertTimeZone } = require('../timeZone');
const { getRelevantDateSegmentByFrequency } = require('../core/dateUtility');
const { modulateCycleUpToDate } = require('../modulusCycle/modulateCycleToDate');
const { EVENT_SOURCE, DAILY, ONCE, CURRENCY_DEFAULT } = require('../constants');

const validateConfig = ({ danielSan }) => {
    let errorMessage = null;
    if (isUndefinedOrNull(danielSan) || (!Array.isArray(danielSan.rules) || danielSan.rules.length === 0)) {
        errorMessage = 'expected a danielSan object with an array of rules';
    }
    if (
        isUndefinedOrNull(danielSan.config.effectiveDateStart) ||
        isUndefinedOrNull(danielSan.config.effectiveDateEnd)
    ) {
        errorMessage = 'there is a problem with an effective date';
    }
    if (danielSan.config.effectiveDateStart > danielSan.config.effectiveDateEnd) {
        errorMessage = 'effectiveDateStart cannot be greater than effectiveDateEnd';
    }
    // to avoid unnecessary future checks to see if certain properties exist, we will add them with default values
    if (!danielSan.events) {
        danielSan.events = [];
    }
    if (!danielSan.discardedEvents) {
        danielSan.discardedEvents = [];
    }
    if (!danielSan.irrelevantRules) {
        danielSan.irrelevantRules = [];
    }
    if (!danielSan.retiredRuleIndices) {
        danielSan.retiredRuleIndices = [];
    }
    if (!danielSan.config.balanceBeginning) {
        danielSan.config.balanceBeginning = 0;
    }
    if (!danielSan.config) {
        danielSan.config = {};
    }
    if (isUndefinedOrNull(danielSan.config.timeZoneType) || isUndefinedOrNull(danielSan.config.timeZone)) {
        const initialTimeZoneData = initializeTimeZoneData(danielSan);
        danielSan.config.timeZoneType = initialTimeZoneData.timeZoneType;
        danielSan.config.timeZone = initialTimeZoneData.timeZone;
    }
    if (isUndefinedOrNull(danielSan.config.currencyConversion)) {
        danielSan.config.currencyConversion = ({ amount }) => {
            return amount;
        };
    }
    if (isUndefinedOrNull(danielSan.config.currencySymbol)) {
        danielSan.config.currencySymbol = CURRENCY_DEFAULT;
    } else {
        danielSan.config.currencySymbol = danielSan.config.currencySymbol.toUpperCase();
    }
    if (errorMessage) {
        throw errorDisc({ err: {}, errorMessage });
    }
};

const validateRules = ({ danielSan, date, skipTimeTravel = null }) => {
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
            rule.timeZoneType = danielSan.config.timeZoneType; // assign the danielSan config timeZoneType value to each rule
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
                            skipTimeTravel
                        });
                    }
                }
            }
            if (rule.frequency === DAILY) {
                rule.processDate = null;
            }
        } catch (err) {
            throw errorDisc({ err, data: { date, rule: ruleTracker, indexTracker, skipTimeTravel } });
        }
    });
};

module.exports = {
    validateConfig,
    validateRules
};
