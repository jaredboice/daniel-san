const { TimeStream } = require('./timeStream');
const { initializeTimeZoneData, timeTravel } = require('./timeZone');
const { buildEvents, executeEvents, cleanUpData } = require('./core/index');
const { discardEventsOutsideDateRange, deleteIrrelevantRules } = require('./core/obliterate');
const { validateAndConfigureBonsaiTree, validateAndConfigureRules } = require('./core/validation');
const { sortEvents } = require('./core/sorting');
const { errorDisc } = require('./utility/errorHandling');
const { isUndefinedOrNull } = require('./utility/validation');
const { deepCopy } = require('./utility/dataStructures');

const findBalance = (danielSan = {}, options = {}) => {
    /*
        the first parameter is the entire danielSan bonsai tree of data that you configure.
        the options parameter defines execution options for enhancing performance
            if you  know for a fact that your danielSan object and your rules are validated/configured according to that function's specifications, then you can skip that phase
            likewise, you can skip deleteIrrelevantRules if you have already removed irrelevant rules manually
            and you can skip time travel when appropriate, just keep in mind that timeTravel assumes all of the rules are in sync with the daniel-san bonsai tree's time zone data (the MCU / Master Control Unit)
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
        validateAndConfigureBonsaiTree({ danielSan: newDanielSan, effectiveDateStartString, effectiveDateEndString });
        const timeStream = new TimeStream({
            effectiveDateStartString,
            effectiveDateEndString,
            timeStartString,
            timeEndString: timeStartString,
            timeZone,
            timeZoneType
        });
        if (!skipValidateAndConfigure) {
            validateAndConfigureRules({ danielSan: newDanielSan, date: timeStream.looperDate, skipTimeTravel });
        }
        if (!skipDeleteIrrelevantRules) {
            deleteIrrelevantRules({
                danielSan: newDanielSan
            }); // this follows validateAndConfigureRules just in case timezones were not yet present where they needed to be
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
        sortEvents(newDanielSan.events); // note: newDanielSan must be sorted prior to executing events
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
            err: errorDisc({ err, data: { options } })
        };
    }
};

module.exports = findBalance;
