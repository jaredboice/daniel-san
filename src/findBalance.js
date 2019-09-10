const { TimeStream } = require('./timeStream');
const { initializeTimeZoneData, timeTravel } = require('./timeZone');
const { buildEvents, executeEvents, cleanUpEvents } = require('./core/index');
const { discardEventsOutsideDateRange, deleteIrrelevantRules } = require('./core/obliterate');
const { validateConfig, validateRules } = require('./core/validation');
const { sortEvents } = require('./core/sorting');
const { errorDisc } = require('./utility/errorHandling');
const { isUndefinedOrNull } = require('./utility/validation');
const { deepCopy } = require('./utility/dataStructures');

const findBalance = (danielSan = {}, options = {}) => {
    /*
        the first parameter is the entire danielSan bonsai tree of data that you configure.
        the options parameter defines execution options for enhancing performance in appropriate conditions
            if you  know for a fact that your danielSan config and rules are validated/configured according to required specification, then you can skip that phase
            likewise, you can skip deleteIrrelevantRules if you have already removed irrelevant rules manually
            and you can skip time travel when appropriate
            just keep in mind that timeTravel assumes all of the time zone fields in the rules are in sync with
            all of the time zone fields in the danielSan config
            see the options from the object destructuring below
    */
    const {
        skipValidateConfig = null,
        skipValidateRules = null,
        skipDeleteIrrelevantRules = null,
        skipTimeTravel = null,
        skipDiscardEventsOutsideDateRange = null,
        skipCleanUpEvents = null
    } = options;
    const newDanielSan = deepCopy(danielSan);
    try {
        if (!skipValidateConfig) {
            validateConfig({ danielSan: newDanielSan });
        }
        const timeZone = newDanielSan.config.timeZone;
        const timeZoneType = newDanielSan.config.timeZoneType;
        const effectiveDateStartString = newDanielSan.config.effectiveDateStart;
        const effectiveDateEndString = newDanielSan.config.effectiveDateEnd;
        const timeStartString = newDanielSan.config.timeStart;
        const timeStream = new TimeStream({
            effectiveDateStartString,
            effectiveDateEndString,
            timeStartString,
            timeEndString: timeStartString,
            timeZone,
            timeZoneType
        });
        if (!skipValidateRules) {
            validateRules({ danielSan: newDanielSan, date: timeStream.looperDate, skipTimeTravel });
        }
        if (!skipDeleteIrrelevantRules) {
            deleteIrrelevantRules({
                danielSan: newDanielSan
            }); // this follows validateRules just in case time zones were not yet assigned where they needed to be
        }
        do {
            buildEvents({
                danielSan: newDanielSan,
                rules: newDanielSan.rules,
                date: timeStream.looperDate,
                options
            });
        } while (timeStream.stream1DayForward());
        // note: timezones must be converted prior to sorting and executing events
        if (!skipTimeTravel) {
            timeTravel(newDanielSan);
        }
        sortEvents(newDanielSan.events); // note: events must be sorted prior to executing their linked-list style of sums
        if (!skipDiscardEventsOutsideDateRange) {
            discardEventsOutsideDateRange(newDanielSan);
        }
        executeEvents({ danielSan: newDanielSan });
        if (!skipCleanUpEvents) {
            cleanUpEvents(newDanielSan);
        }
        if (newDanielSan.events.length > 0) {
            newDanielSan.balanceBeginning = newDanielSan.events[0].balanceBeginning;
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
