const { isUndefinedOrNull } = require('../utility/validation');
const { deepCopy } = require('../utility/dataStructures');
const { createStream, closeStream } = require('../utility/fileIo');
const { TimeStream } = require('../timeStream');
const { validateConfig, validateRules } = require('../core/validation');
const selectAggregateFunction = require('../analytics/aggregateSelector');
const {
    filterEventsByKeysAndValues,
    findCriticalSnapshots,
    findRulesToRetire,
    findIrrelevantRules,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    findSnapshotsGreaterThanSupport,
    findSnapshotsLessThanResistance,
    findGreatestValueSnapshots,
    sumAllPositiveEventAmounts,
    sumAllNegativeEventAmounts
} = require('../analytics');

const {
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY,
    STANDARD_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
    POSITIVE,
    NEGATIVE,
    BOTH,
    DISPLAY_EVENTS_BY_GROUP,
    DISPLAY_EVENTS_BY_GROUPS,
    DISPLAY_EVENTS_BY_NAME,
    DISPLAY_EVENTS_BY_NAMES,
    DISPLAY_EVENTS_BY_TYPE,
    DISPLAY_EVENTS_BY_TYPES,
    DISPLAY_EVENTS,
    DISPLAY_CRITICAL_SNAPSHOTS,
    DISPLAY_DISCARDED_EVENTS,
    DISPLAY_IMPORTANT_EVENTS,
    DISPLAY_TIME_EVENTS,
    DISPLAY_ROUTINE_EVENTS,
    DISPLAY_REMINDER_EVENTS,
    DISPLAY_RULES_TO_RETIRE,
    DISPLAY_IRRELEVANT_RULES,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
    DISPLAY_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_NEGATIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_NEGATIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_POSITIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_POSITIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_SUPPORT,
    DISPLAY_BALANCE_ENDING_SNAPSHOTS_LESS_THAN_MIN_AMOUNT,
    DISPLAY_GREATEST_BALANCE_ENDING_SNAPSHOTS,
    DISPLAY_LEAST_BALANCE_ENDING_SNAPSHOTS,
    DISPLAY_GREATEST_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_LEAST_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_GREATEST_POSITIVE_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_LEAST_POSITIVE_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_GREATEST_NEGATIVE_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_LEAST_NEGATIVE_EVENT_FLOW_SNAPSHOTS,
    DISPLAY_AGGREGATES,
    MIN_INT_DIGITS_DEFAULT,
    MIN_DECIMAL_DIGITS_DEFAULT,
    MAX_DECIMAL_DIGITS_DEFAULT,
    LOCALE_DEFAULT,
    STYLE_DEFAULT,
    CURRENCY_DEFAULT,
    FORMATTING_FUNCTION_DEFAULT
} = require('../constants');

const BOUNDARY_LIMIT = 144;

const getRandomMiyagiQuote = () => {
    const quotes = [
        "'First learn balance. Balance good, karate good, everything good.\nBalance bad, might as well pack up, go home.'",
        "'To make honey, young bee need young flower, not old prune.'",
        "'Look eye! Always look eye!'",
        "'Daniel-san, you much humor!'",
        "'First learn stand, then learn fly. Nature rule, Daniel-san, not mine.'",
        "'You remember lesson about balance? Lesson not just karate only.\nLesson for whole life. Whole life have a balance. Everything be better.'",
        "'Banzai, Daniel-san!'",
        "'In Okinawa, all Miyagi know two things: fish and karate.'",
        "'Show me, sand the floor'",
        "'Show me, wax on, wax off'",
        "'Show me, paint the fence'",
        "'Called crane technique. If do right, no can defence.'",
        "'License never replace eye, ear and brain.'",
        "'Learn balance Daniel san... Wax-on... Wax-off.'",
        "'It’s ok to lose to opponent. It’s never okay to lose to fear'",
        "'Better learn balance. Balance is key. Balance good, karate good.\nEverything good. Balance bad, better pack up, go home. Understand?'",
        "'Never put passion in front of principle, even if you win, you’ll lose'",
        "'Either you karate do 'yes' or karate do 'no'\nYou karate do 'guess so,' (get squished) just like grape.'",
        "'Never trust spiritual leader who cannot dance.'",
        "'If come from inside you, always right one.'",
        "'Walk on road, hm? Walk left side, safe. Walk right side, safe.\nWalk middle, sooner or later...get squish just like grape'",
        "'Daniel-San, lie become truth only if person wanna believe it.'",
        "'Wax on, wax off. Wax on, wax off.'",
        "'Man who catch fly with chopstick, accomplish anything.'",
        "'If karate used defend honor, defend life, karate mean something.\nIf karate used defend plastic metal trophy, karate no mean nothing.'",
        "'Wax-on, wax-off.'",
        "'You trust the quality of what you know, not quantity.'",
        "'For person with no forgiveness in heart, living even worse punishment than death.'",
        "'In Okinawa, belt mean no need rope to hold up pants.'",
        "'Miyagi have hope for you.'",
        "'First, wash all car. Then wax. Wax on...'",
        "'Wax on, right hand. Wax off, left hand. Wax on, wax off. \nBreathe in through nose, out the mouth. Wax on, wax off.\nDon't forget to breathe, very important.'",
        "'Karate come from China, sixteenth century, called te, 'hand.'\nHundred year later, Miyagi ancestor bring to Okinawa,\ncall *kara*-te, 'empty hand.''",
        "'No such thing as bad student, only bad teacher. Teacher say, student do.'",
        "'Now use head for something other than target.'",
        "'Make block. Left, right. Up, down. Side, side.\nBreathe in, breathe out. And no scare fish.'",
        "'Ah, not everything is as seems...'",
        "'What'sa matter, you some kind of girl or something?'",
        "'Punch! Drive a punch! Not just arm, whole body! \nHip, leg, drive a punch! Make 'kiai.' Kiai! Kiai!\nGive you power. Now, try punch.'",
        "'I tell you what Miyagi think! I think you *dance around* too much!\nI think you *talk* too much! I think you not concentrate enough!\nLots of work to be done! Tournament just around the corner!\nCome. Stand up! Now, ready. Concentrate. Focus power.'",
        "'We make sacred pact. I promise teach karate to you, you promise learn.\nI say, you do, no questions.'",
        "'Choose.'"
    ];
    const elementIndex = Math.floor(Math.random() * quotes.length);
    return `${quotes[elementIndex]} -Miyagi-`;
};

const danielSanAsciiArt = (writeStream) => {
    const lineArt = [
        '________                .__       .__              _________              ',
        '\\______ \\ _____    ____ |__| ____ |  |            /   _____/____    ____  ',
        ' |    |  \\\\__  \\  /    \\|  |/ __ \\|  |    ______  \\_____  \\\\__  \\  /    \\ ',
        ' |    `   \\/ __ \\|   |  \\  \\  ___/|  |__ /_____/  /        \\/ __ \\|   |  \\ ',
        '/_______  (____  /___|  /__|___  >____/         /_______  (____  /___|  /',
        '        \\/     \\/     \\/        \\/                       \\/     \\/     \\/'
    ];
    lineArt.forEach((line) => {
        writeStream(`${line}`);
    });
};

const rightPadToBoundary = ({ leftSideOfHeading, character }) => {
    let rightSideOfHeading = '';
    const length = BOUNDARY_LIMIT - leftSideOfHeading.length < 0 ? 0 : BOUNDARY_LIMIT - leftSideOfHeading.length;
    for (let looper = 0; looper < length; looper++) {
        rightSideOfHeading = `${rightSideOfHeading}${character}`;
    }
    const fullLineHeading = rightSideOfHeading ? `${leftSideOfHeading}${rightSideOfHeading}` : leftSideOfHeading;
    return fullLineHeading;
};

const reportingBoundary = ({ loops = 1, char = '*', writeStream }) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: char });
        // eslint-disable-next-line no-console
        writeStream(`${fullHeading}`);
    }
};

const lineHeading = ({ heading, char = '*', writeStream }) => {
    const leadingChars = `${char}${char}${char}${char}${char}${char}${char}${char}`;
    const leftSideOfHeading = `${leadingChars}${heading}`;
    const fullLineHeading = rightPadToBoundary({ leftSideOfHeading, character: char });
    // eslint-disable-next-line no-console
    writeStream(`${fullLineHeading}`);
};

const lineSeparator = (loops = 1, writeStream) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: '-' });
        // eslint-disable-next-line no-console
        writeStream(`${fullHeading}`);
    }
};

const eventCountHeading = ({ events, writeStream }) => {
    lineHeading({ heading: ` event count: ${events.length} `, writeStream });
    lineSeparator(2, writeStream);
};

const showNothingToDisplay = (writeStream) => {
    lineSeparator(2, writeStream);
    // eslint-disable-next-line quotes
    lineHeading({ heading: ` nothing to display `, char: '-', writeStream });
    lineSeparator(2, writeStream);
};

const getDefaultParamsForDecimalFormatter = (reportingConfig) => {
    const formattingOptions = reportingConfig.formatting || {};
    const formattingFunction =
        formattingOptions && formattingOptions.formattingFunction
            ? formattingOptions.formattingFunction
            : FORMATTING_FUNCTION_DEFAULT;
    const minIntegerDigits =
        formattingOptions && formattingOptions.minIntegerDigits
            ? formattingOptions.minIntegerDigits
            : MIN_INT_DIGITS_DEFAULT;
    const minDecimalDigits =
        formattingOptions && formattingOptions.minDecimalDigits
            ? formattingOptions.minDecimalDigits
            : MIN_DECIMAL_DIGITS_DEFAULT;
    const maxDecimalDigits =
        formattingOptions && formattingOptions.maxDecimalDigits
            ? formattingOptions.maxDecimalDigits
            : MAX_DECIMAL_DIGITS_DEFAULT;
    const locale = formattingOptions && formattingOptions.locale ? formattingOptions.locale : LOCALE_DEFAULT;
    const style = formattingOptions && formattingOptions.style ? formattingOptions.style : STYLE_DEFAULT;
    const currency = formattingOptions && formattingOptions.currency ? formattingOptions.currency : CURRENCY_DEFAULT;
    return {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style,
        currency
    };
};

const getWeekdayString = (weekday) => {
    let weekdayString;
    switch (weekday) {
        case MONDAY:
            weekdayString = 'monday';
            break;
        case TUESDAY:
            weekdayString = 'tuesday';
            break;
        case WEDNESDAY:
            weekdayString = 'wednesday';
            break;
        case THURSDAY:
            weekdayString = 'thursday';
            break;
        case FRIDAY:
            weekdayString = 'friday';
            break;
        case SATURDAY:
            weekdayString = 'saturday';
            break;
        case SUNDAY:
            weekdayString = 'sunday';
            break;
        default:
            weekdayString = 'some day';
            break;
    }
    return weekdayString;
};

const shyOutput = ({ event, reportingConfig, currencySymbol, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.name)) writeStream(`name: ${event.name}`); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.amount)) {
        // eslint-disable-next-line no-console
        writeStream(
            `amount: ${formattingFunction(event.amount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: event.currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }
    if (!isUndefinedOrNull(event.amount) && !isUndefinedOrNull(event.balanceEnding)) {
        // eslint-disable-next-line no-console
        writeStream(
            `balanceEnding: ${formattingFunction(event.balanceEnding, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }
    // eslint-disable-next-line no-console
    writeStream(`dateStart: ${event.dateStart}`); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.timeStart) writeStream(`timeStart: ${event.timeStart}`);
    lineSeparator(2, writeStream);
};

const conciseOutput = ({ event, reportingConfig, currencySymbol, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.name)) writeStream(`name: ${event.name}`);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.group)) writeStream(`group: ${event.group}`);
    if (!isUndefinedOrNull(event.amount)) {
        // eslint-disable-next-line no-console
        writeStream(
            `amount: ${formattingFunction(event.amount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: event.currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }
    if (!isUndefinedOrNull(event.amount) && !isUndefinedOrNull(event.balanceEnding)) {
        // eslint-disable-next-line no-console
        writeStream(
            `balanceEnding: ${formattingFunction(event.balanceEnding, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }

    // eslint-disable-next-line no-console
    writeStream(`dateStart: ${event.dateStart}`);
    // eslint-disable-next-line no-console
    if (event.dateEnd) writeStream(`dateEnd: ${event.dateEnd}`);
    // eslint-disable-next-line no-console
    if (event.timeStart) writeStream(`timeStart: ${event.timeStart}`);
    // eslint-disable-next-line no-console
    if (event.timeEnd) writeStream(`timeEnd: ${event.timeEnd}`);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.weekdayStart)) {
        const weekdayString = getWeekdayString(event.weekdayStart);
        writeStream(`weekdayStart: ${weekdayString}`); // eslint-disable-line no-console
    }
    if (!isUndefinedOrNull(event.weekdayEnd)) {
        const weekdayString = getWeekdayString(event.weekdayEnd);
        writeStream(`weekdayEnd: ${weekdayString}`); // eslint-disable-line no-console
    } // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.notes)) writeStream(`notes: ${event.notes}`); // eslint-disable-line quotes
    lineSeparator(2, writeStream);
};

const verboseOutput = ({ event, reportingConfig, currencySymbol, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    const ttyMessageStack = [];
    const dataBouncer = (message, order) => {
        ttyMessageStack.push({ message, order });
    };
    Object.entries(event).forEach(([key, value]) => {
        if (
            key !== 'specialAdjustments' &&
            key !== 'exclusions' &&
            key !== 'processDate' &&
            key !== 'frequency' &&
            key !== 'ruleModification' &&
            key !== 'transientData'
        ) {
            if (key === 'name' && event.name != null) {
                dataBouncer(`name: ${event.name}`, 10); // eslint-disable-line quotes
            } else if (key === 'type') {
                dataBouncer(`type: ${event.type}`, 20);
            } else if (key === 'frequency' && typeof event.frequency === 'string') {
                dataBouncer(`frequency: ${event.frequency}`, 30); // code check: this line might be redundant, check to see if we are deleting frequency (if not a string) from the event printing process
            } else if (key === 'context') {
                dataBouncer(`context: ${event.context}`, 40);
            } else if (key === 'currencySymbol' && !isUndefinedOrNull(event.amount)) {
                dataBouncer(`currencySymbol: ${event.currencySymbol}`, 50);
            } else if (key === 'amount') {
                dataBouncer(
                    `amount: ${formattingFunction(event.amount, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: event.currencySymbol || CURRENCY_DEFAULT
                    })}`,
                    60
                );
            } else if (key === 'balanceBeginning' && !isUndefinedOrNull(event.amount)) {
                dataBouncer(
                    `balanceBeginning: ${formattingFunction(event.balanceBeginning, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: currencySymbol || CURRENCY_DEFAULT
                    })}`,
                    80
                );
            } else if (key === 'balanceEnding' && !isUndefinedOrNull(event.amount)) {
                dataBouncer(
                    `balanceEnding: ${formattingFunction(event.balanceEnding, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: currencySymbol || CURRENCY_DEFAULT
                    })}`,
                    90
                );
            } else if (key === 'sortPriority' && key.sortPriority != null) {
                dataBouncer(`sortPriority: ${event.sortPriority}`, 150);
            } else if (key === 'timeZone') {
                dataBouncer(`timeZone: ${event.timeZone}`, 160);
            } else if (key === 'timeZoneType') {
                dataBouncer(`timeZoneType: ${event.timeZoneType}`, 170);
            } else if (key === 'timeStart' && event.timeStart != null) {
                dataBouncer(`timeStart: ${event.timeStart}`, 180);
            } else if (key === 'timeEnd' && event.timeEnd != null) {
                dataBouncer(`timeEnd: ${event.timeEnd}`, 190);
            } else if (key === 'dateStart' && event.dateStart != null) {
                dataBouncer(`dateStart: ${event.dateStart}`, 200);
            } else if (key === 'dateEnd' && event.dateEnd != null) {
                dataBouncer(`dateEnd: ${event.dateEnd}`, 210);
            } else if (key === 'weekdayStart' && event.weekdayStart != null) {
                const weekdayString = getWeekdayString(event.weekdayStart);
                dataBouncer(`weekdayStart: ${weekdayString}`, 220);
            } else if (key === 'weekdayEnd' && event.weekdayEnd != null) {
                const weekdayString = getWeekdayString(event.weekdayEnd);
                dataBouncer(`weekdayEnd: ${weekdayString}`, 230);
            } else if (key === 'spanningDays' && event.spanningDays != null) {
                dataBouncer(`spanningDays: ${event.spanningDays}`, 231);
            } else if (key === 'spanningHours' && event.spanningHours != null) {
                dataBouncer(`spanningHours: ${event.spanningHours}`, 232);
            } else if (key === 'spanningMinutes' && event.spanningMinutes != null) {
                dataBouncer(`spanningMinutes: ${event.spanningMinutes}`, 233);
            } else if (key === 'cycle' && event.cycle != null) {
                dataBouncer(`cycle: ${event.cycle}`, 234);
            } else if (key === 'modulus' && event.modulus != null) {
                dataBouncer(`modulus: ${event.modulus}`, 235);
            } else if (key === 'anchorSyncDate' && event.anchorSyncDate != null) {
                dataBouncer(`anchorSyncDate: ${event.anchorSyncDate}`, 236);
            } else if (key === 'effectiveDateStart' && event.effectiveDateStart != null) {
                dataBouncer(`effectiveDateStart: ${event.effectiveDateStart}`, 240);
            } else if (key === 'effectiveDateEnd' && event.effectiveDateEnd != null) {
                dataBouncer(`effectiveDateEnd: ${event.effectiveDateEnd}`, 250);
            } else if (
                key === 'eventSourceCurrencySymbol' &&
                event.eventSourceCurrencySymbol != null &&
                !isUndefinedOrNull(event.amount)
            ) {
                dataBouncer(`eventSourceCurrencySymbol: ${event.eventSourceCurrencySymbol}`, 252);
            } else if (
                key === 'eventSourceCurrencyAmount' &&
                event.eventSourceCurrencyAmount != null &&
                !isUndefinedOrNull(event.amount)
            ) {
                dataBouncer(`eventSourceCurrencyAmount: ${event.eventSourceCurrencyAmount}`, 254);
            } else if (key === 'eventSourceTimeZoneType' && event.eventSourceTimeZoneType != null) {
                dataBouncer(`eventSourceTimeZoneType: ${event.eventSourceTimeZoneType}`, 260);
            } else if (key === 'eventSourceTimeZone' && event.eventSourceTimeZone != null) {
                dataBouncer(`eventSourceTimeZone: ${event.eventSourceTimeZone}`, 270);
            } else if (key === 'dateTimeStartEventSource' && event.dateTimeStartEventSource != null) {
                dataBouncer(`dateTimeStartEventSource: ${event.dateTimeStartEventSource}`, 280);
            } else if (key === 'dateTimeObserverSource' && event.dateTimeObserverSource != null) {
                dataBouncer(`dateTimeObserverSource: ${event.dateTimeObserverSource}`, 290);
            } else if (
                key !== 'name' &&
                key !== 'type' &&
                key !== 'frequency' &&
                key !== 'context' &&
                key !== 'currencySymbol' &&
                key !== 'amount' &&
                key !== 'balanceBeginning' &&
                key !== 'balanceEnding' &&
                key !== 'sortPriority' &&
                key !== 'timeZone' &&
                key !== 'timeZoneType' &&
                key !== 'timeStart' &&
                key !== 'timeEnd' &&
                key !== 'dateStart' &&
                key !== 'dateEnd' &&
                key !== 'weekdayStart' &&
                key !== 'weekdayEnd' &&
                key !== 'spanningDays' &&
                key !== 'spanningHours' &&
                key !== 'spanningMinutes' &&
                key !== 'cycle' &&
                key !== 'modulus' &&
                key !== 'anchorSyncDate' &&
                key !== 'effectiveDateStart' &&
                key !== 'effectiveDateEnd' &&
                key !== 'eventSourceCurrencySymbol' &&
                key !== 'eventSourceCurrencyAmount' &&
                key !== 'eventSourceTimeZoneType' &&
                key !== 'eventSourceTimeZone' &&
                key !== 'dateTimeStartEventSource' &&
                key !== 'dateTimeObserverSource'
            ) {
                // eslint-disable-next-line no-console
                dataBouncer(`${key}: ${value}`, 300);
            }
        }
    });
    const ttyMessageStackOrdered = ttyMessageStack.slice().sort((a, b) => {
        if (a.order > b.order) {
            return 1;
        } else if (a.order < b.order) {
            return -1;
            // eslint-disable-next-line no-else-return
        } else {
            return 0;
        }
    });
    ttyMessageStackOrdered.forEach((obj) => {
        writeStream(`${obj.message}`); // eslint-disable-line no-console
    });
    lineSeparator(2, writeStream);
};

const eventsLogger = ({ events, reportingConfig, currencySymbol, showNothingToDisplaySwitch = true, writeStream }) => {
    if (events && events.length > 0) {
        lineSeparator(2, writeStream);
        switch (reportingConfig.mode) {
            case VERBOSE:
                events.forEach((event) => {
                    verboseOutput({ event, reportingConfig, currencySymbol, writeStream });
                });
                break;
            case CONCISE:
                events.forEach((event) => {
                    conciseOutput({ event, reportingConfig, currencySymbol, writeStream });
                });
                break;
            case SHY:
                events.forEach((event) => {
                    shyOutput({ event, reportingConfig, currencySymbol, writeStream });
                });
                break;
            default:
                break;
        }
        eventCountHeading({ events, writeStream });
    } else if (showNothingToDisplaySwitch) {
        showNothingToDisplay(writeStream);
    }
};

const aggregateHeader = ({ aggregate, writeStream }) => {
    reportingBoundary({ loops: 1, char: '%', writeStream });
    lineHeading({ heading: `  begin aggregate function: `, char: '%', writeStream });
    if (!isUndefinedOrNull(aggregate.name)) {
        lineHeading({ heading: `  name: ${aggregate.name}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.type)) {
        lineHeading({ heading: `  type: ${aggregate.type}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.frequency)) {
        lineHeading({ heading: `  frequency: ${aggregate.frequency}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.propertyKey)) {
        lineHeading({ heading: `  propertyKey: ${aggregate.propertyKey}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.flowDirection)) {
        lineHeading({ heading: `  flowDirection: ${aggregate.flowDirection}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.selectionAmount)) {
        lineHeading({ heading: `  selectionAmount: ${aggregate.selectionAmount}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.modeMax)) {
        lineHeading({ heading: `  modeMax: ${aggregate.modeMax}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.dayCycles)) {
        lineHeading({ heading: `  dayCycles: ${aggregate.dayCycles}  `, char: '%', writeStream });
    }
    reportingBoundary({ loops: 1, char: '%', writeStream });
    lineSeparator(2, writeStream);
};

const aggregateFooter = ({ aggregate, writeStream }) => {
    reportingBoundary({ loops: 1, char: '%', writeStream });
    lineHeading({ heading: `  end aggregate function: `, char: '%', writeStream });
    if (!isUndefinedOrNull(aggregate.name)) {
        lineHeading({ heading: `  name: ${aggregate.name}  `, char: '%', writeStream });
    }
    if (!isUndefinedOrNull(aggregate.type)) {
        lineHeading({ heading: `  type: ${aggregate.type}  `, char: '%', writeStream });
    }
    reportingBoundary({ loops: 1, char: '%', writeStream });
    lineSeparator(2, writeStream);
};

const getStringOfValues = ({
    data,
    formattingFunction,
    minIntegerDigits,
    minDecimalDigits,
    maxDecimalDigits,
    locale,
    style,
    currencySymbol
}) => {
    let stringOfValues = '';
    if (typeof data === 'number') {
        stringOfValues = `${formattingFunction(data, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: currencySymbol || CURRENCY_DEFAULT
        })}`;
    } else {
        // arraay
        data.forEach((val, i) => {
            stringOfValues += `${formattingFunction(val, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`;
            if (i !== data.length - 1) {
                stringOfValues += ', ';
            }
        });
    }
    return stringOfValues;
};

const aggregateLogger = ({ aggregate, reportingConfig, currencySymbol, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    writeStream(`dateStart: ${aggregate.dateStart}`); // eslint-disable-line quotes
    writeStream(`dateEnd: ${aggregate.dateEnd}`); // eslint-disable-line quotes
    writeStream(`eventCount: ${aggregate.eventCount}`); // eslint-disable-line quotes

    if (!isUndefinedOrNull(aggregate.sum)) {
        // eslint-disable-next-line no-console
        writeStream(
            `sum: ${formattingFunction(aggregate.sum, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }

    if (!isUndefinedOrNull(aggregate.average)) {
        // eslint-disable-next-line no-console
        writeStream(
            `average: ${formattingFunction(aggregate.average, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }

    if (!isUndefinedOrNull(aggregate.min)) {
        writeStream(
            `min: ${formattingFunction(aggregate.min, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }

    if (!isUndefinedOrNull(aggregate.max)) {
        writeStream(
            `max: ${formattingFunction(aggregate.max, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })}`
        );
    }

    if (!isUndefinedOrNull(aggregate.medians)) {
        const stringOfValues = getStringOfValues({
            data: aggregate.medians,
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currencySymbol
        });
        writeStream(`medians: ${stringOfValues}`); // eslint-disable-line quotes
    }

    if (!isUndefinedOrNull(aggregate.modes)) {
        const stringOfValues = getStringOfValues({
            data: aggregate.modes,
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currencySymbol
        });
        writeStream(`modes: ${stringOfValues}`); // eslint-disable-line quotes
    }

    if (!isUndefinedOrNull(aggregate.greatestValues)) {
        const stringOfValues = getStringOfValues({
            data: aggregate.greatestValues,
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currencySymbol
        });
        writeStream(`greatestValues: ${stringOfValues}`); // eslint-disable-line quotes
    }

    if (!isUndefinedOrNull(aggregate.leastValues)) {
        const stringOfValues = getStringOfValues({
            data: aggregate.leastValues,
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currencySymbol
        });
        writeStream(`leastValues: ${stringOfValues}`); // eslint-disable-line quotes
    }
    lineSeparator(2, writeStream);
};

const standardHeader = ({ reportingConfig, writeStream }) => {
    reportingBoundary({ loops: 3, writeStream });
    lineHeading({
        heading: ' daniel-san: astral-projecting your budget with a crane-kick to the face ',
        writeStream
    });
    lineHeading({ heading: ' must find balance ', writeStream });
    reportingBoundary({ loops: 2, writeStream });
    if (!isUndefinedOrNull(reportingConfig.name)) lineHeading({ heading: ` report: ${reportingConfig.name} `, writeStream });
    lineHeading({ heading: ` reporting mode: ${reportingConfig.mode} `, writeStream });
    reportingBoundary({ loops: 3, writeStream });
    lineSeparator(2, writeStream);
    // eslint-disable-next-line no-console
    writeStream(`${getRandomMiyagiQuote()}`);
    lineSeparator(2, writeStream);
};

const standardSubheader = ({ danielSan, reportingConfig, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    lineHeading({ heading: ` config `, writeStream });
    if (!isUndefinedOrNull(danielSan['balanceBeginning'])) {
        lineHeading({ heading: ` currencySymbol: ${danielSan.config.currencySymbol} `, writeStream });
        lineHeading({
            heading: ` balanceBeginning: ${formattingFunction(danielSan['balanceBeginning'], {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
            })} `,
            writeStream
        });
    }
    if (!isUndefinedOrNull(danielSan['balanceEnding'])) {
        lineHeading({
            heading: ` balanceEnding: ${formattingFunction(danielSan['balanceEnding'], {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
            })} `,
            writeStream
        });
    }
    if (!isUndefinedOrNull(danielSan.config.timeZoneType)) {
        lineHeading({ heading: ` timeZoneType: ${danielSan.config.timeZoneType} `, writeStream });
    }
    if (!isUndefinedOrNull(danielSan.config.timeZone)) {
        lineHeading({ heading: ` timeZone: ${danielSan.config.timeZone} `, writeStream });
    }
    lineHeading({ heading: ` effectiveDateStart: ${danielSan.config.effectiveDateStart} `, writeStream });
    if (danielSan.config.timeStart) lineHeading({ heading: ` timeStart: ${danielSan.config.timeStart} `, writeStream });
    lineHeading({ heading: ` effectiveDateEnd:   ${danielSan.config.effectiveDateEnd} `, writeStream });
    if (danielSan.config.timeEnd) lineHeading({ heading: ` timeEnd: ${danielSan.config.timeEnd} `, writeStream });
    lineSeparator(2, writeStream);
};

const showRulesToRetire = ({ danielSan, reportingConfig, writeStream }) => {
    const rulesToRetire = findRulesToRetire(danielSan);
    if (rulesToRetire && rulesToRetire.length > 0) {
        lineHeading({ heading: ' the following rules have obsolete effectiveDateEnd values ', writeStream });
        lineSeparator(2, writeStream);
    }
    eventsLogger({
        events: rulesToRetire,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const showIrrelevantRules = ({ danielSan, reportingConfig, writeStream }) => {
    // when executing in this context, there is a chance that the config/rules have not yet been validated (both are validated prior to calling findIrrelevantRules during the normal projection phase)
    validateConfig(danielSan);
    const timeStream = new TimeStream({
        effectiveDateStartString: danielSan.config.effectiveDateStart,
        effectiveDateEndString: danielSan.config.effectiveDateEnd,
        timeStartString: danielSan.config.timeStart,
        timeEndString: danielSan.config.timeEnd,
        timeZone: danielSan.config.timeZone,
        timeZoneType: danielSan.config.timeZoneType
    });
    // we will pass false for skipTimeTravel for simplicity, since whether or not the time zones in the config are identical to the time zones in rules,
    // the performance overhead is minor in this case
    validateRules({ danielSan, date: timeStream.effectiveDateStart, skipTimeTravel: false });
    const { irrelevantRules } = findIrrelevantRules(danielSan);
    if (irrelevantRules && irrelevantRules.length > 0) {
        lineHeading({
            heading: ' the following rules would not be triggered via the current configuration ',
            writeStream
        });
        lineSeparator(2, writeStream);
    }
    eventsLogger({
        events: irrelevantRules,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const showDiscardedEvents = ({ danielSan, reportingConfig, showNothingToDisplaySwitch = true, writeStream }) => {
    const discardedEvents = danielSan.discardedEvents;
    if (discardedEvents && discardedEvents.length > 0) {
        lineHeading({
            heading: ' these events were excluded for residing beyond the provided date range ',
            writeStream
        });
        lineSeparator(2, writeStream);
    }
    eventsLogger({
        events: discardedEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        showNothingToDisplaySwitch,
        writeStream
    });
};

const showCriticalSnapshots = ({ danielSan, reportingConfig, showNothingToDisplaySwitch = true, writeStream }) => {
    const criticalSnapshots = findCriticalSnapshots({
        events: danielSan.events,
        criticalThreshold: reportingConfig.criticalThreshold
    });
    if (criticalSnapshots && criticalSnapshots.length > 0) {
        const {
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style
        } = getDefaultParamsForDecimalFormatter(reportingConfig);
        reportingBoundary({ loops: 2, writeStream });
        if (!isUndefinedOrNull(reportingConfig.criticalThreshold)) {
            lineHeading({
                heading: ` begin critical threshold: < ${formattingFunction(reportingConfig.criticalThreshold, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
                })} `,
                writeStream
            });
            lineSeparator(2, writeStream);
        }
        eventsLogger({
            events: criticalSnapshots,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            writeStream
        });
        if (!isUndefinedOrNull(reportingConfig.criticalThreshold)) {
            lineHeading({
                heading: ` end critical threshold: < ${formattingFunction(reportingConfig.criticalThreshold, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
                })} `,
                writeStream
            });
            lineSeparator(2, writeStream);
        }
    } else if (showNothingToDisplaySwitch) {
        showNothingToDisplay(writeStream);
    }
};

const showSumOfAllPositiveEventAmounts = ({ danielSan, reportingConfig, writeStream }) => {
    const sum = sumAllPositiveEventAmounts(danielSan.events);
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    lineSeparator(2, writeStream);
    lineHeading({
        heading: ` total sum: ${formattingFunction(sum || 0, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
        })} -`,
        writeStream
    });
    lineSeparator(2, writeStream);
    if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
        reportingBoundary({ loops: 2, writeStream });
    }
    showDiscardedEvents({ danielSan, reportingConfig, showNothingToDisplaySwitch: false, writeStream });
};

const showSumOfAllNegativeEventAmounts = ({ danielSan, reportingConfig, writeStream }) => {
    const sum = sumAllNegativeEventAmounts(danielSan.events);
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig);
    lineSeparator(2, writeStream);
    lineHeading({
        heading: ` total sum: ${formattingFunction(sum || 0, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
        })} -`,
        writeStream
    });
    lineSeparator(2, writeStream);
    if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
        reportingBoundary({ loops: 2, writeStream });
    }
    showDiscardedEvents({ danielSan, reportingConfig, showNothingToDisplaySwitch: false, writeStream });
};

const displayRulesToRetire = ({ danielSan, reportingConfig, writeStream }) => {
    showRulesToRetire({ danielSan, reportingConfig, writeStream });
};

const displayIrrelevantRules = ({ danielSan, reportingConfig, writeStream }) => {
    showIrrelevantRules({ danielSan, reportingConfig, writeStream });
};

const displayDiscardedEvents = ({ danielSan, reportingConfig, writeStream }) => {
    showDiscardedEvents({ danielSan, reportingConfig, writeStream });
};

const displayCriticalSnapshots = ({ danielSan, reportingConfig, writeStream }) => {
    showCriticalSnapshots({ danielSan, reportingConfig, writeStream });
};

const displaySumOfAllPositiveEventAmounts = ({ danielSan, reportingConfig, writeStream }) => {
    showSumOfAllPositiveEventAmounts({ danielSan, reportingConfig, writeStream });
};

const displaySumOfAllNegativeEventAmounts = ({ danielSan, reportingConfig, writeStream }) => {
    showSumOfAllNegativeEventAmounts({ danielSan, reportingConfig, writeStream });
};

const displaySnapshotsGreaterThanSupport = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    boundaryField,
    writeStream
}) => {
    const collection = findSnapshotsGreaterThanSupport({
        events,
        amount: boundaryField || 0,
        propertyKey
    });
    const relevantEvents = collection;
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const displaySnapshotsLessThanResistance = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    boundaryField,
    writeStream
}) => {
    const collection = findSnapshotsLessThanResistance({
        events,
        amount: boundaryField || 0,
        propertyKey
    });
    const relevantEvents = collection;
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const displayGreatestValueSnapshots = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    flowDirection,
    writeStream
}) => {
    const collection = findGreatestValueSnapshots({
        events,
        propertyKey,
        flowDirection,
        selectionAmount: reportingConfig.selectionAmount || 7,
        reverse: false
    });
    const relevantEvents = collection;
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const displayLeastValueSnapshots = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    flowDirection,
    writeStream
}) => {
    const collection = findGreatestValueSnapshots({
        events,
        propertyKey,
        flowDirection,
        selectionAmount: reportingConfig.selectionAmount || 7,
        reverse: true // used to reverse the results of findGreatestValueSnapshots
    });
    const relevantEvents = collection;
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const standardOutput = ({ danielSan, reportingConfig, writeStream }) => {
    const relevantEvents = danielSan.events;
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
    if (reportingConfig.type !== DISPLAY_EVENTS) {
        showCriticalSnapshots({ danielSan, reportingConfig, showNothingToDisplaySwitch: false, writeStream });
    }
    if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
        reportingBoundary({ loops: 2, writeStream });
    }
    showDiscardedEvents({ danielSan, reportingConfig, showNothingToDisplaySwitch: false, writeStream });
};

const displayEventsWithProperty = ({
    danielSan,
    reportingConfig,
    propertyKey,
    findFunction = findEventsWithProperty,
    writeStream
}) => {
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey });
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const displayEventsByPropertyKeyAndValues = ({
    danielSan,
    reportingConfig,
    propertyKey,
    findFunction = findEventsByPropertyKeyAndValues,
    writeStream
}) => {
    const { searchValues } = reportingConfig;
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, searchValues });
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const displayEventsWithPropertyKeyContainingSubstring = ({
    danielSan,
    reportingConfig,
    propertyKey,
    substring,
    findFunction = findEventsWithPropertyKeyContainingSubstring,
    writeStream
}) => {
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, substring });
    eventsLogger({
        events: relevantEvents,
        reportingConfig,
        currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
        writeStream
    });
};

const createReport = ({ danielSan, reportingConfig = {}, error = null, originalDanielSan = null }) => {
    const fileStruct = !reportingConfig.file
        ? {
              fileStream: null,
              writeStream: (content) => {
                  process.stdout.write(`${content}\n`);
              }
          }
        : createStream({
              filepath: reportingConfig.file.path,
              filename: reportingConfig.file.name,
              extension: reportingConfig.file.extension,
              dirname: __dirname
          });
    const { writeStream, fileStream } = fileStruct;
    danielSanAsciiArt(writeStream);
    if (error) {
        // eslint-disable-next-line no-console
        lineHeading({ heading: ' something bad happened and a lot of robots died ', writeStream });
        // eslint-disable-next-line no-console
        writeStream(`${error}`);
        lineHeading({ heading: ' !@#$%^& ', writeStream });
    } else if (danielSan) {
        const newDanielSan = deepCopy(danielSan);
        try {
            // begin validating reportingConfig
            if (!reportingConfig) reportingConfig = { type: STANDARD_OUTPUT, mode: CONCISE };
            // eslint-disable-next-line no-lonely-if
            if (!reportingConfig.mode) reportingConfig.mode = CONCISE;
            // eslint-disable-next-line no-lonely-if
            if (!reportingConfig.type) reportingConfig.type = STANDARD_OUTPUT;
            // end validating reportingConfig
            newDanielSan.events = filterEventsByKeysAndValues({
                events: newDanielSan.events,
                filterKeys: reportingConfig.filterKeys,
                filterValues: reportingConfig.filterValues,
                filterType: reportingConfig.filterType
            });
            standardHeader({ reportingConfig, writeStream });
            standardSubheader({ danielSan: newDanielSan, reportingConfig, writeStream });
            let reportingTypes = [];
            if (Array.isArray(reportingConfig.type)) {
                reportingTypes = reportingConfig.type;
            } else {
                reportingTypes.push(reportingConfig.type);
            }
            let transientEvents = [];
            reportingTypes.forEach((reportingType) => {
                reportingBoundary({ loops: 2, char: '#', writeStream });
                lineHeading({ heading: `  begin reporting type: ${reportingType}  `, char: '#', writeStream });
                reportingBoundary({ loops: 2, char: '#', writeStream });
                switch (reportingType) {
                case DISPLAY_EVENTS:
                case STANDARD_OUTPUT:
                    standardOutput({ danielSan: newDanielSan, reportingConfig, writeStream });
                    break;
                case DISPLAY_EVENTS_BY_GROUP:
                case DISPLAY_EVENTS_BY_GROUPS:
                    displayEventsByPropertyKeyAndValues({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'group',
                        writeStream
                    });
                    break;
                case DISPLAY_EVENTS_BY_NAME:
                case DISPLAY_EVENTS_BY_NAMES:
                    displayEventsByPropertyKeyAndValues({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'name',
                        writeStream
                    });
                    break;
                case DISPLAY_EVENTS_BY_TYPE:
                case DISPLAY_EVENTS_BY_TYPES:
                    displayEventsByPropertyKeyAndValues({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'type',
                        writeStream
                    });
                    break;
                case DISPLAY_CRITICAL_SNAPSHOTS:
                    displayCriticalSnapshots({ danielSan: newDanielSan, reportingConfig, writeStream });
                    break;
                case DISPLAY_DISCARDED_EVENTS:
                    displayDiscardedEvents({ danielSan: newDanielSan, reportingConfig, writeStream });
                    break;
                case DISPLAY_IMPORTANT_EVENTS:
                    displayEventsWithProperty({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'important',
                        writeStream
                    });
                    break;
                case DISPLAY_TIME_EVENTS:
                    displayEventsWithProperty({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'timeStart',
                        writeStream
                    });
                    break;
                case DISPLAY_ROUTINE_EVENTS:
                    displayEventsWithPropertyKeyContainingSubstring({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'type',
                        substring: 'ROUTINE',
                        writeStream
                    });
                    break;
                case DISPLAY_REMINDER_EVENTS:
                    displayEventsWithPropertyKeyContainingSubstring({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'type',
                        substring: 'REMINDER',
                        writeStream
                    });
                    break;
                case DISPLAY_RULES_TO_RETIRE:
                    displayRulesToRetire({
                        danielSan: originalDanielSan || newDanielSan,
                        reportingConfig,
                        writeStream
                    });
                    break;
                case DISPLAY_IRRELEVANT_RULES:
                    displayIrrelevantRules({
                        danielSan: originalDanielSan || newDanielSan,
                        reportingConfig,
                        writeStream
                    });
                    break;
                case DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS:
                case DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS:
                    displaySumOfAllPositiveEventAmounts({
                        danielSan: newDanielSan,
                        reportingConfig,
                        writeStream
                    });
                    break;
                case DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS:
                case DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS:
                    displaySumOfAllNegativeEventAmounts({
                        danielSan: newDanielSan,
                        reportingConfig,
                        writeStream
                    });
                    break;
                case DISPLAY_EVENT_FLOWS_GREATER_THAN_SUPPORT:
                    displaySnapshotsGreaterThanSupport({
                        danielSan: newDanielSan,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'support',
                        writeStream
                    });
                    break;
                case DISPLAY_EVENT_FLOWS_LESS_THAN_RESISTANCE:
                    displaySnapshotsLessThanResistance({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'resistance',
                        writeStream
                    });
                    break;
                case DISPLAY_NEGATIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT:
                    transientEvents = newDanielSan.events.filter((element) => {
                        return element.amount < 0;
                    });
                    displaySnapshotsGreaterThanSupport({
                        danielSan: newDanielSan,
                        events: transientEvents,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'negativeSupport',
                        writeStream
                    });
                    break;
                case DISPLAY_NEGATIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE:
                    transientEvents = newDanielSan.events.filter((element) => {
                        return element.amount < 0;
                    });
                    displaySnapshotsLessThanResistance({
                        danielSan: newDanielSan,
                        events: transientEvents,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'negativeResistance',
                        writeStream
                    });
                    break;
                case DISPLAY_POSITIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT:
                    transientEvents = newDanielSan.events.filter((element) => {
                        return element.amount > 0;
                    });
                    displaySnapshotsGreaterThanSupport({
                        danielSan: newDanielSan,
                        events: transientEvents,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'positiveSupport',
                        writeStream
                    });
                    break;
                case DISPLAY_POSITIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE:
                    transientEvents = newDanielSan.events.filter((element) => {
                        return element.amount > 0;
                    });
                    displaySnapshotsLessThanResistance({
                        danielSan: newDanielSan,
                        events: transientEvents,
                        reportingConfig,
                        propertyKey: 'amount',
                        boundaryField: 'positiveResistance',
                        writeStream
                    });
                    break;
                case DISPLAY_BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_SUPPORT:
                    displaySnapshotsGreaterThanSupport({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'balanceEnding',
                        boundaryField: 'balanceEndingSupport',
                        writeStream
                    });
                    break;
                case DISPLAY_BALANCE_ENDING_SNAPSHOTS_LESS_THAN_MIN_AMOUNT:
                    displaySnapshotsLessThanResistance({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'balanceEnding',
                        boundaryField: 'balanceEndingResistance',
                        writeStream
                    });
                    break;
                case DISPLAY_GREATEST_BALANCE_ENDING_SNAPSHOTS:
                    displayGreatestValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'balanceEnding',
                        flowDirection: BOTH,
                        writeStream
                    });
                    break;
                case DISPLAY_LEAST_BALANCE_ENDING_SNAPSHOTS:
                    displayLeastValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'balanceEnding',
                        flowDirection: BOTH,
                        writeStream
                    });
                    break;
                case DISPLAY_GREATEST_EVENT_FLOW_SNAPSHOTS:
                    displayGreatestValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: BOTH,
                        writeStream
                    });
                    break;
                case DISPLAY_LEAST_EVENT_FLOW_SNAPSHOTS:
                    displayLeastValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: BOTH,
                        writeStream
                    });
                    break;
                case DISPLAY_GREATEST_POSITIVE_EVENT_FLOW_SNAPSHOTS:
                    displayGreatestValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: POSITIVE,
                        writeStream
                    });
                    break;
                case DISPLAY_LEAST_POSITIVE_EVENT_FLOW_SNAPSHOTS:
                    displayLeastValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: POSITIVE,
                        writeStream
                    });
                    break;
                case DISPLAY_GREATEST_NEGATIVE_EVENT_FLOW_SNAPSHOTS:
                    displayGreatestValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: NEGATIVE,
                        writeStream
                    });
                    break;
                case DISPLAY_LEAST_NEGATIVE_EVENT_FLOW_SNAPSHOTS:
                    displayLeastValueSnapshots({
                        danielSan: newDanielSan,
                        events: newDanielSan.events,
                        reportingConfig,
                        propertyKey: 'amount',
                        flowDirection: NEGATIVE,
                        writeStream
                    });
                    break;
                case DISPLAY_AGGREGATES:
                    reportingConfig.aggregates.forEach((aggregateConfig) => {
                        const aggregateFunction = selectAggregateFunction(aggregateConfig);
                        const aggregateResults = aggregateFunction({
                            ...aggregateConfig,
                            type: aggregateConfig.type,
                            events: newDanielSan.events
                        });
                        if (aggregateResults && aggregateResults.length > 0) {
                            const firstElement = aggregateResults[0];
                            aggregateHeader({ aggregate: { ...firstElement }, writeStream });
                            aggregateResults.forEach((aggregateResult) => {
                                aggregateLogger({
                                    aggregate: aggregateResult,
                                    reportingConfig,
                                    currencySymbol: newDanielSan.currencySymbol,
                                    writeStream
                                });
                            });
                            aggregateFooter({ aggregate: { ...firstElement }, writeStream });
                        } else {
                            showNothingToDisplay(writeStream);
                        }
                    });
                    break;
                default:
                    break;
                }
                reportingBoundary({ loops: 2, char: '$', writeStream });
                lineHeading({ heading: `  end reporting type: ${reportingType}  `, char: '$', writeStream });
                reportingBoundary({ loops: 2, char: '$', writeStream });
                lineSeparator(2, writeStream);
            });
            standardSubheader({ danielSan: newDanielSan, reportingConfig, writeStream });
            standardHeader({ reportingConfig, writeStream });
            danielSanAsciiArt(writeStream);
        } catch (err) {
            lineHeading({ heading: ' something bad happened and a lot of robots died ', writeStream });
            // eslint-disable-next-line no-console
            writeStream(`${err}`);
        } finally {
            if (reportingConfig.file) {
                closeStream(fileStream);
            }
        }
    } else {
        lineHeading({ heading: ' the danielSan bonsai tree is likely null or undefined ', writeStream });
        if (reportingConfig.file) {
            closeStream(fileStream);
        }
    }
};

module.exports = createReport;
