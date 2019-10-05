const { isUndefinedOrNull } = require('../utility/validation');
const { deepCopy } = require('../utility/dataStructures');
const { danielSanAsciiArt } = require('./asciiArt');
const { getRandomMiyagiQuote } = require('./quoteGenerator');
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
    STANDARD_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
    POSITIVE,
    NEGATIVE,
    BOTH,
    EVENTS_BY_GROUP,
    EVENTS_BY_GROUPS,
    EVENTS_BY_NAME,
    EVENTS_BY_NAMES,
    EVENTS_BY_TYPE,
    EVENTS_BY_TYPES,
    EVENTS,
    CRITICAL_SNAPSHOTS,
    DISCARDED_EVENTS,
    IMPORTANT_EVENTS,
    TIME_EVENTS,
    ROUTINE_EVENTS,
    REMINDER_EVENTS,
    ROUTINE_AND_REMINDER_EVENTS,
    RULES_TO_RETIRE,
    IRRELEVANT_RULES,
    SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
    EVENT_FLOWS_GREATER_THAN_SUPPORT,
    EVENT_FLOWS_LESS_THAN_RESISTANCE,
    NEGATIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    NEGATIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    POSITIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    POSITIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_SUPPORT,
    BALANCE_ENDING_SNAPSHOTS_LESS_THAN_MIN_AMOUNT,
    GREATEST_BALANCE_ENDING_SNAPSHOTS,
    LEAST_BALANCE_ENDING_SNAPSHOTS,
    GREATEST_EVENT_FLOW_SNAPSHOTS,
    LEAST_EVENT_FLOW_SNAPSHOTS,
    GREATEST_POSITIVE_EVENT_FLOW_SNAPSHOTS,
    LEAST_POSITIVE_EVENT_FLOW_SNAPSHOTS,
    GREATEST_NEGATIVE_EVENT_FLOW_SNAPSHOTS,
    LEAST_NEGATIVE_EVENT_FLOW_SNAPSHOTS,
    AGGREGATES,
    REPORT,
    CURRENCY_DEFAULT,
    getDefaultParamsForDecimalFormatter,
    getWeekdayString,
    DEFAULT_JSON_SPACING
} = require('../constants');

const BOUNDARY_LIMIT = 144;

const rightPadToBoundary = ({ leftSideOfHeading, reportCharWidth, character }) => {
    let rightSideOfHeading = '';
    const boundaryLimit = reportCharWidth || BOUNDARY_LIMIT;
    const length = boundaryLimit - leftSideOfHeading.length < 0 ? 0 : boundaryLimit - leftSideOfHeading.length;
    for (let looper = 0; looper < length; looper++) {
        rightSideOfHeading = `${rightSideOfHeading}${character}`;
    }
    const fullLineHeading = rightSideOfHeading ? `${leftSideOfHeading}${rightSideOfHeading}` : leftSideOfHeading;
    return fullLineHeading;
};

const reportingBoundary = ({ loops = 1, char = '*', reportCharWidth, writeStream }) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: char, reportCharWidth });
        // eslint-disable-next-line no-console
        writeStream(`${fullHeading}\n`);
    }
};

const lineHeading = ({ heading, char = '*', reportCharWidth, writeStream }) => {
    const leadingChars = `${char}${char}${char}${char}${char}${char}${char}${char}`;
    const leftSideOfHeading = `${leadingChars}${heading}`;
    const fullLineHeading = rightPadToBoundary({ leftSideOfHeading, character: char, reportCharWidth });
    // eslint-disable-next-line no-console
    writeStream(`${fullLineHeading}\n`);
};

const lineSeparator = ({ loops = 1, reportCharWidth, writeStream }) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: '-', reportCharWidth });
        // eslint-disable-next-line no-console
        writeStream(`${fullHeading}\n`);
    }
};

const eventCountHeading = ({ events, reportCharWidth, writeStream }) => {
    lineHeading({ heading: ` event count: ${events.length} `, reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const showNothingToDisplay = ({ reportCharWidth, writeStream }) => {
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
    // eslint-disable-next-line quotes
    lineHeading({ heading: ` nothing to display `, char: '-', reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const shyOutput = ({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.name)) writeStream(`name: ${event.name}\n`); // eslint-disable-line quotes
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
            })}\n`
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
            })}\n`
        );
    }
    // eslint-disable-next-line no-console
    if (event.dateStart) writeStream(`dateStart: ${event.dateStart}\n`); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.timeStart) writeStream(`timeStart: ${event.timeStart}\n`);
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const conciseOutput = ({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.name)) writeStream(`name: ${event.name}\n`);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.group)) writeStream(`group: ${event.group}\n`);
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
            })}\n`
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
            })}\n`
        );
    }

    // eslint-disable-next-line no-console
    if (event.dateStart) writeStream(`dateStart: ${event.dateStart}\n`);
    // eslint-disable-next-line no-console
    if (event.dateEnd) writeStream(`dateEnd: ${event.dateEnd}\n`);
    // eslint-disable-next-line no-console
    if (event.timeStart) writeStream(`timeStart: ${event.timeStart}\n`);
    // eslint-disable-next-line no-console
    if (event.timeEnd) writeStream(`timeEnd: ${event.timeEnd}\n`);
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.weekdayStart)) {
        const weekdayString = getWeekdayString(event.weekdayStart);
        writeStream(`weekdayStart: ${weekdayString}\n`); // eslint-disable-line no-console
    }
    if (!isUndefinedOrNull(event.weekdayEnd)) {
        const weekdayString = getWeekdayString(event.weekdayEnd);
        writeStream(`weekdayEnd: ${weekdayString}\n`); // eslint-disable-line no-console
    } // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.notes)) writeStream(`notes: ${event.notes}\n`); // eslint-disable-line quotes
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const verboseOutput = ({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
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
            } else if (key === 'entityType') {
                dataBouncer(`entityType: ${event.entityType}`, 15);
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
                key !== 'entityType' &&
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
        writeStream(`${obj.message}\n`); // eslint-disable-line no-console
    });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const eventsLogger = ({
    events,
    reportingConfig,
    currencySymbol,
    showNothingToDisplaySwitch = true,
    reportCharWidth,
    leadingLineSeparator = true,
    writeStream
}) => {
    if (events && events.length > 0) {
        if (leadingLineSeparator) {
            lineSeparator({ loops: 2, reportCharWidth, writeStream });
        }
        switch (reportingConfig.mode) {
            case VERBOSE:
                events.forEach((event) => {
                    verboseOutput({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream });
                });
                break;
            case CONCISE:
                events.forEach((event) => {
                    conciseOutput({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream });
                });
                break;
            case SHY:
                events.forEach((event) => {
                    shyOutput({ event, reportingConfig, currencySymbol, reportCharWidth, writeStream });
                });
                break;
            default:
                break;
        }
        eventCountHeading({ events, reportCharWidth, writeStream });
    } else if (showNothingToDisplaySwitch) {
        showNothingToDisplay({ reportCharWidth, writeStream });
    }
};

const aggregateHeader = ({ aggregate, reportCharWidth, writeStream }) => {
    reportingBoundary({ loops: 1, char: '%', reportCharWidth, writeStream });
    lineHeading({ heading: `  begin aggregate function: `, char: '%', reportCharWidth, writeStream });
    if (!isUndefinedOrNull(aggregate.name)) {
        lineHeading({ heading: `  name: ${aggregate.name}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.type)) {
        lineHeading({ heading: `  type: ${aggregate.type}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.frequency)) {
        lineHeading({ heading: `  frequency: ${aggregate.frequency}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.propertyKey)) {
        lineHeading({ heading: `  propertyKey: ${aggregate.propertyKey}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.flowDirection)) {
        lineHeading({
            heading: `  flowDirection: ${aggregate.flowDirection}  `,
            char: '%',
            reportCharWidth,
            writeStream
        });
    }
    if (!isUndefinedOrNull(aggregate.selectionAmount)) {
        lineHeading({
            heading: `  selectionAmount: ${aggregate.selectionAmount}  `,
            char: '%',
            reportCharWidth,
            writeStream
        });
    }
    if (!isUndefinedOrNull(aggregate.modeMax)) {
        lineHeading({ heading: `  modeMax: ${aggregate.modeMax}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.dayCycles)) {
        lineHeading({ heading: `  dayCycles: ${aggregate.dayCycles}  `, char: '%', reportCharWidth, writeStream });
    }
    reportingBoundary({ loops: 1, char: '%', reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const aggregateFooter = ({ aggregate, reportCharWidth, writeStream }) => {
    reportingBoundary({ loops: 1, char: '%', reportCharWidth, writeStream });
    lineHeading({ heading: `  end aggregate function: `, char: '%', reportCharWidth, writeStream });
    if (!isUndefinedOrNull(aggregate.name)) {
        lineHeading({ heading: `  name: ${aggregate.name}  `, char: '%', reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(aggregate.type)) {
        lineHeading({ heading: `  type: ${aggregate.type}  `, char: '%', reportCharWidth, writeStream });
    }
    reportingBoundary({ loops: 1, char: '%', reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
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

const aggregateLogger = ({ aggregate, reportingConfig, currencySymbol, reportCharWidth, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
    writeStream(`name: ${aggregate.name}\n`);
    if (reportingConfig.mode === CONCISE) {
        writeStream(`type: ${aggregate.type}\n`);
    } else if (reportingConfig.mode === VERBOSE) {
        writeStream(`entityType: ${aggregate.entityType}\n`);
        writeStream(`type: ${aggregate.type}\n`);
    }
    writeStream(`dateStart: ${aggregate.dateStart}\n`); // eslint-disable-line quotes
    writeStream(`dateEnd: ${aggregate.dateEnd}\n`); // eslint-disable-line quotes
    writeStream(`eventCount: ${aggregate.eventCount}\n`); // eslint-disable-line quotes

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
            })}\n`
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
            })}\n`
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
            })}\n`
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
            })}\n`
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
        writeStream(`medians: ${stringOfValues}\n`); // eslint-disable-line quotes
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
        writeStream(`modes: ${stringOfValues}\n`); // eslint-disable-line quotes
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
        writeStream(`greatestValues: ${stringOfValues}\n`); // eslint-disable-line quotes
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
        writeStream(`leastValues: ${stringOfValues}\n`); // eslint-disable-line quotes
    }
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const standardHeader = ({ reportingConfig, reportCharWidth, writeStream }) => {
    reportingBoundary({ loops: 3, reportCharWidth, writeStream });
    lineHeading({
        heading: ' daniel-san: astral-projecting your budget with a crane-kick to the face ',
        reportCharWidth,
        writeStream
    });
    lineHeading({ heading: ' must find balance ', reportCharWidth, writeStream });
    reportingBoundary({ loops: 2, reportCharWidth, writeStream });
    if (!isUndefinedOrNull(reportingConfig.name)) {
        lineHeading({ heading: ` report: ${reportingConfig.name} `, reportCharWidth, writeStream });
    }
    lineHeading({ heading: ` reporting mode: ${reportingConfig.mode} `, reportCharWidth, writeStream });
    reportingBoundary({ loops: 3, reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
    // eslint-disable-next-line no-console
    writeStream(`${getRandomMiyagiQuote()}\n`);
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const standardSubheader = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
    lineHeading({ heading: ` config `, reportCharWidth, writeStream });
    if (!isUndefinedOrNull(danielSan['balanceBeginning'])) {
        lineHeading({ heading: ` currencySymbol: ${danielSan.config.currencySymbol} `, reportCharWidth, writeStream });
        lineHeading({
            heading: ` balanceBeginning: ${formattingFunction(danielSan['balanceBeginning'], {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
            })} `,
            reportCharWidth,
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
            reportCharWidth,
            writeStream
        });
    }
    if (!isUndefinedOrNull(danielSan.config.timeZoneType)) {
        lineHeading({ heading: ` timeZoneType: ${danielSan.config.timeZoneType} `, reportCharWidth, writeStream });
    }
    if (!isUndefinedOrNull(danielSan.config.timeZone)) {
        lineHeading({ heading: ` timeZone: ${danielSan.config.timeZone} `, reportCharWidth, writeStream });
    }
    lineHeading({
        heading: ` effectiveDateStart: ${danielSan.config.effectiveDateStart} `,
        reportCharWidth,
        writeStream
    });
    if (danielSan.config.timeStart)
        lineHeading({ heading: ` timeStart: ${danielSan.config.timeStart} `, reportCharWidth, writeStream });
    lineHeading({
        heading: ` effectiveDateEnd:   ${danielSan.config.effectiveDateEnd} `,
        reportCharWidth,
        writeStream
    });
    if (danielSan.config.timeEnd)
        lineHeading({ heading: ` timeEnd: ${danielSan.config.timeEnd} `, reportCharWidth, writeStream });
    lineSeparator({ loops: 2, reportCharWidth, writeStream });
};

const showRulesToRetire = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    const rulesToRetire = findRulesToRetire(danielSan);
    if (!reportingConfig.rawJson) {
        if (rulesToRetire && rulesToRetire.length > 0) {
            lineHeading({
                heading: ' the following rules have obsolete effectiveDateEnd values ',
                reportCharWidth,
                writeStream
            });
            lineSeparator({ loops: 2, reportCharWidth, writeStream });
        }
        eventsLogger({
            events: rulesToRetire,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return rulesToRetire || [];
    }
};

const showIrrelevantRules = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
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
    if (!reportingConfig.rawJson) {
        if (irrelevantRules && irrelevantRules.length > 0) {
            lineHeading({
                heading: ' the following rules would not be triggered via the current configuration ',
                reportCharWidth,
                writeStream
            });
            lineSeparator({ loops: 2, reportCharWidth, writeStream });
        }
        eventsLogger({
            events: irrelevantRules,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return irrelevantRules || [];
    }
};

const showDiscardedEvents = ({
    danielSan,
    reportingConfig,
    showNothingToDisplaySwitch = true,
    reportCharWidth,
    leadingLineSeparator = true,
    trailingFooter = true,
    writeStream
}) => {
    const discardedEvents = danielSan.discardedEvents;
    if (!reportingConfig.rawJson) {
        if (discardedEvents && discardedEvents.length > 0) {
            if (leadingLineSeparator) {
                lineSeparator({ loops: 2, reportCharWidth, writeStream });
            }
            reportingBoundary({ loops: 2, reportCharWidth, writeStream });
            lineHeading({
                heading: ' these events were excluded for residing beyond the provided date range ',
                reportCharWidth,
                writeStream
            });
            reportingBoundary({ loops: 2, reportCharWidth, writeStream });
            eventsLogger({
                events: discardedEvents,
                reportingConfig,
                currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
                showNothingToDisplaySwitch,
                reportCharWidth,
                writeStream
            });
            if (trailingFooter) {
                lineHeading({
                    heading: ' end discarded events ',
                    char: '-',
                    reportCharWidth,
                    writeStream
                });
                lineSeparator({ loops: 2, reportCharWidth, writeStream });
            }
        }
    } else {
        return discardedEvents || [];
    }
};

const showCriticalSnapshots = ({
    danielSan,
    reportingConfig,
    showNothingToDisplaySwitch = true,
    reportCharWidth,
    leadingLineSeparator = true,
    writeStream
}) => {
    const criticalSnapshots = findCriticalSnapshots({
        events: danielSan.events,
        criticalThreshold: reportingConfig.criticalThreshold
    });
    if (!reportingConfig.rawJson) {
        if (criticalSnapshots && criticalSnapshots.length > 0) {
            const {
                formattingFunction,
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style
            } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
            if (!isUndefinedOrNull(reportingConfig.criticalThreshold)) {
                if (leadingLineSeparator) {
                    lineSeparator({ loops: 2, reportCharWidth, writeStream });
                }
                lineHeading({
                    heading: ` begin critical threshold: < ${formattingFunction(reportingConfig.criticalThreshold, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
                    })} `,
                    char: '-',
                    reportCharWidth,
                    writeStream
                });
            }
            eventsLogger({
                events: criticalSnapshots,
                reportingConfig,
                currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
                reportCharWidth,
                leadingLineSeparator: true,
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
                    char: '-',
                    reportCharWidth,
                    writeStream
                });
                lineSeparator({ loops: 2, reportCharWidth, writeStream });
            }
        } else if (showNothingToDisplaySwitch) {
            showNothingToDisplay({ reportCharWidth, writeStream });
        }
    } else {
        return criticalSnapshots || [];
    }
};

const showSumOfAllPositiveEventAmounts = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    const sum = sumAllPositiveEventAmounts(danielSan.events);
    if (!reportingConfig.rawJson) {
        const {
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style
        } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
        lineSeparator({ loops: 2, reportCharWidth, writeStream });
        lineHeading({
            heading: ` total sum: ${formattingFunction(sum || 0, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
            })} -`,
            reportCharWidth,
            writeStream
        });
        lineSeparator({ loops: 2, reportCharWidth, writeStream });
        if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
            showDiscardedEvents({
                danielSan,
                reportingConfig,
                showNothingToDisplaySwitch: false,
                reportCharWidth,
                leadingLineSeparator: false,
                writeStream
            });
        }
    } else {
        return sum;
    }
};

const showSumOfAllNegativeEventAmounts = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    const sum = sumAllNegativeEventAmounts(danielSan.events);
    if (!reportingConfig.rawJson) {
        const {
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style
        } = getDefaultParamsForDecimalFormatter(reportingConfig.formatting || {});
        lineSeparator({ loops: 2, reportCharWidth, writeStream });
        lineHeading({
            heading: ` total sum: ${formattingFunction(sum || 0, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.config.currencySymbol || CURRENCY_DEFAULT
            })} -`,
            reportCharWidth,
            writeStream
        });
        lineSeparator({ loops: 2, reportCharWidth, writeStream });
        if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
            showDiscardedEvents({
                danielSan,
                reportingConfig,
                showNothingToDisplaySwitch: false,
                leadingLineSeparator: false,
                reportCharWidth,
                writeStream
            });
        }
    } else {
        return sum;
    }
};

const getRulesToRetire = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showRulesToRetire({ danielSan, reportingConfig, reportCharWidth, writeStream });
};

const getIrrelevantRules = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showIrrelevantRules({ danielSan, reportingConfig, reportCharWidth, writeStream });
};

const getDiscardedEvents = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showDiscardedEvents({ danielSan, reportingConfig, reportCharWidth, trailingFooter: false, writeStream });
};

const getCriticalSnapshots = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showCriticalSnapshots({ danielSan, reportingConfig, reportCharWidth, writeStream });
};

const getSumOfAllPositiveEventAmounts = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showSumOfAllPositiveEventAmounts({ danielSan, reportingConfig, reportCharWidth, writeStream });
};

const getSumOfAllNegativeEventAmounts = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    return showSumOfAllNegativeEventAmounts({ danielSan, reportingConfig, reportCharWidth, writeStream });
};

const getSnapshotsGreaterThanSupport = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    boundaryField,
    reportCharWidth,
    writeStream
}) => {
    const collection = findSnapshotsGreaterThanSupport({
        events,
        amount: boundaryField || 0,
        propertyKey
    });
    const relevantEvents = collection;
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const getSnapshotsLessThanResistance = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    boundaryField,
    reportCharWidth,
    writeStream
}) => {
    const collection = findSnapshotsLessThanResistance({
        events,
        amount: boundaryField || 0,
        propertyKey
    });
    const relevantEvents = collection;
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const getGreatestValueSnapshots = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    flowDirection,
    reportCharWidth,
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
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const getLeastValueSnapshots = ({
    danielSan,
    events,
    reportingConfig,
    propertyKey,
    flowDirection,
    reportCharWidth,
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
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const standardOutput = ({ danielSan, reportingConfig, reportCharWidth, writeStream }) => {
    const relevantEvents = danielSan.events;
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            leadingLineSeparator: true,
            writeStream
        });
        if (reportingConfig.type !== EVENTS) {
            showCriticalSnapshots({
                danielSan,
                reportingConfig,
                showNothingToDisplaySwitch: false,
                reportCharWidth,
                leadingLineSeparator: false,
                writeStream
            });
        }
        if (danielSan.discardedEvents && danielSan.discardedEvents.length > 0) {
            showDiscardedEvents({
                danielSan,
                reportingConfig,
                showNothingToDisplaySwitch: false,
                reportCharWidth,
                leadingLineSeparator: false,
                writeStream
            });
        }
    } else {
        return relevantEvents || [];
    }
};

const getEventsWithProperty = ({
    danielSan,
    reportingConfig,
    propertyKey,
    findFunction = findEventsWithProperty,
    reportCharWidth,
    writeStream
}) => {
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey });
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const getEventsByPropertyKeyAndValues = ({
    danielSan,
    reportingConfig,
    propertyKey,
    findFunction = findEventsByPropertyKeyAndValues,
    reportCharWidth,
    writeStream
}) => {
    const { searchValues } = reportingConfig;
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, searchValues });
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const getEventsWithPropertyKeyContainingSubstring = ({
    danielSan,
    reportingConfig,
    propertyKey,
    substring,
    findFunction = findEventsWithPropertyKeyContainingSubstring,
    reportCharWidth,
    writeStream
}) => {
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, substring });
    if (!reportingConfig.rawJson) {
        eventsLogger({
            events: relevantEvents,
            reportingConfig,
            currencySymbol: danielSan.config.currencySymbol || CURRENCY_DEFAULT,
            reportCharWidth,
            writeStream
        });
    } else {
        return relevantEvents || [];
    }
};

const createReport = ({ danielSan, reportingConfig = {}, error = null, originalDanielSan = null }) => {
    let jsonSpacingSelected = DEFAULT_JSON_SPACING;
    let reportResults = null;
    let fileStream = null;
    let writeStream = null;
    let newDanielSan = null;
    if (reportingConfig.outputRelay) {
        writeStream = reportingConfig.outputRelay;
    } else if (reportingConfig.file) {
        const defineEventHandlers = reportingConfig.file.onFinish ? false : true; // eslint-disable-line no-unneeded-ternary
        const fileStruct = createStream({
            filepath: reportingConfig.file.path,
            filename: reportingConfig.file.name,
            dirname: __dirname,
            defineEventHandlers,
            json: reportingConfig.rawJson
        });
        const { writeStream: transientWriteStream, fileStream: transientFileStream } = fileStruct;
        writeStream = transientWriteStream;
        fileStream = transientFileStream;
        if (reportingConfig.file.onFinish) {
            fileStream.on('finish', reportingConfig.file.onFinish);
        }
        if (reportingConfig.file.onError) {
            fileStream.on('error', reportingConfig.file.onError);
        }
        jsonSpacingSelected = reportingConfig.file.jsonSpacing
            ? reportingConfig.file.jsonSpacing
            : DEFAULT_JSON_SPACING;
    } else {
        // default setting
        fileStream = null;
        writeStream = (content) => {
            process.stdout.write(`${content}`);
        };
    }
    const reportCharWidth = reportingConfig.reportCharWidth || BOUNDARY_LIMIT;
    if (!reportingConfig.rawJson) {
        danielSanAsciiArt(writeStream);
    }
    if (error) {
        if (!reportingConfig.rawJson) {
            lineHeading({ heading: ' something bad happened and a lot of robots died ', reportCharWidth, writeStream });
            // eslint-disable-next-line no-console
            writeStream(`${error}\n`, true);
            lineHeading({ heading: ' !@#$%^& ', reportCharWidth, writeStream });
        } else {
            writeStream(error, true);
        }
        if (reportingConfig.outputRelay) {
            reportingConfig.outputRelay(null);
        }
        if (reportingConfig.file) {
            closeStream(fileStream);
        }
    } else if (danielSan) {
        newDanielSan = deepCopy(danielSan);
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
            if (!reportingConfig.rawJson) {
                standardHeader({ reportingConfig, reportCharWidth, writeStream });
                standardSubheader({ danielSan: newDanielSan, reportingConfig, reportCharWidth, writeStream });
            }
            let reportingTypes = [];
            if (Array.isArray(reportingConfig.type)) {
                reportingTypes = reportingConfig.type;
            } else {
                reportingTypes.push(reportingConfig.type);
            }
            let transientEvents = [];
            if (reportingConfig.rawJson && reportingConfig.file) {
                fileStream.write('{');
                fileStream.write(' "reports": [');
            }
            reportingTypes.forEach((reportingType, reportIndex) => {
                if (!reportingConfig.rawJson) {
                    reportingBoundary({ loops: 2, char: '#', reportCharWidth, writeStream });
                    lineHeading({
                        heading: `  begin reporting type: ${reportingType}  `,
                        char: '#',
                        reportCharWidth,
                        writeStream
                    });
                    reportingBoundary({ loops: 2, char: '#', reportCharWidth, writeStream });
                }
                switch (reportingType) {
                    case EVENTS:
                    case STANDARD_OUTPUT:
                        reportResults = standardOutput({
                            danielSan: newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case EVENTS_BY_GROUP:
                    case EVENTS_BY_GROUPS:
                        reportResults = getEventsByPropertyKeyAndValues({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'group',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case EVENTS_BY_NAME:
                    case EVENTS_BY_NAMES:
                        reportResults = getEventsByPropertyKeyAndValues({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'name',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case EVENTS_BY_TYPE:
                    case EVENTS_BY_TYPES:
                        reportResults = getEventsByPropertyKeyAndValues({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'type',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case CRITICAL_SNAPSHOTS:
                        reportResults = getCriticalSnapshots({
                            danielSan: newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case DISCARDED_EVENTS:
                        reportResults = getDiscardedEvents({
                            danielSan: newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case IMPORTANT_EVENTS:
                        reportResults = getEventsWithProperty({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'important',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case TIME_EVENTS:
                        reportResults = getEventsWithProperty({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'timeStart',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case ROUTINE_EVENTS:
                        reportResults = getEventsWithPropertyKeyContainingSubstring({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'type',
                            substring: 'ROUTINE',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case REMINDER_EVENTS:
                        reportResults = getEventsWithPropertyKeyContainingSubstring({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'type',
                            substring: 'REMINDER',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case ROUTINE_AND_REMINDER_EVENTS:
                        reportResults = getEventsWithPropertyKeyContainingSubstring({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'type',
                            substring: ['ROUTINE', 'REMINDER'],
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case RULES_TO_RETIRE:
                        reportResults = getRulesToRetire({
                            danielSan: originalDanielSan || newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case IRRELEVANT_RULES:
                        reportResults = getIrrelevantRules({
                            danielSan: originalDanielSan || newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS:
                    case SUM_OF_ALL_POSITIVE_EVENT_FLOWS:
                        reportResults = getSumOfAllPositiveEventAmounts({
                            danielSan: newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS:
                    case SUM_OF_ALL_NEGATIVE_EVENT_FLOWS:
                        reportResults = getSumOfAllNegativeEventAmounts({
                            danielSan: newDanielSan,
                            reportingConfig,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case EVENT_FLOWS_GREATER_THAN_SUPPORT:
                        reportResults = getSnapshotsGreaterThanSupport({
                            danielSan: newDanielSan,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'support',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case EVENT_FLOWS_LESS_THAN_RESISTANCE:
                        reportResults = getSnapshotsLessThanResistance({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'resistance',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case NEGATIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT:
                        transientEvents = newDanielSan.events.filter((element) => {
                            return element.amount < 0;
                        });
                        reportResults = getSnapshotsGreaterThanSupport({
                            danielSan: newDanielSan,
                            events: transientEvents,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'negativeSupport',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case NEGATIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE:
                        transientEvents = newDanielSan.events.filter((element) => {
                            return element.amount < 0;
                        });
                        reportResults = getSnapshotsLessThanResistance({
                            danielSan: newDanielSan,
                            events: transientEvents,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'negativeResistance',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case POSITIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT:
                        transientEvents = newDanielSan.events.filter((element) => {
                            return element.amount > 0;
                        });
                        reportResults = getSnapshotsGreaterThanSupport({
                            danielSan: newDanielSan,
                            events: transientEvents,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'positiveSupport',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case POSITIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE:
                        transientEvents = newDanielSan.events.filter((element) => {
                            return element.amount > 0;
                        });
                        reportResults = getSnapshotsLessThanResistance({
                            danielSan: newDanielSan,
                            events: transientEvents,
                            reportingConfig,
                            propertyKey: 'amount',
                            boundaryField: 'positiveResistance',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_SUPPORT:
                        reportResults = getSnapshotsGreaterThanSupport({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'balanceEnding',
                            boundaryField: 'balanceEndingSupport',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case BALANCE_ENDING_SNAPSHOTS_LESS_THAN_MIN_AMOUNT:
                        reportResults = getSnapshotsLessThanResistance({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'balanceEnding',
                            boundaryField: 'balanceEndingResistance',
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case GREATEST_BALANCE_ENDING_SNAPSHOTS:
                        reportResults = getGreatestValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'balanceEnding',
                            flowDirection: BOTH,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case LEAST_BALANCE_ENDING_SNAPSHOTS:
                        reportResults = getLeastValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'balanceEnding',
                            flowDirection: BOTH,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case GREATEST_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getGreatestValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: BOTH,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case LEAST_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getLeastValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: BOTH,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case GREATEST_POSITIVE_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getGreatestValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: POSITIVE,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case LEAST_POSITIVE_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getLeastValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: POSITIVE,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case GREATEST_NEGATIVE_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getGreatestValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: NEGATIVE,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case LEAST_NEGATIVE_EVENT_FLOW_SNAPSHOTS:
                        reportResults = getLeastValueSnapshots({
                            danielSan: newDanielSan,
                            events: newDanielSan.events,
                            reportingConfig,
                            propertyKey: 'amount',
                            flowDirection: NEGATIVE,
                            reportCharWidth,
                            writeStream
                        });
                        break;
                    case AGGREGATES:
                        if (!reportingConfig.aggregates) {
                            reportingConfig.aggregates = [];
                        }
                        reportingConfig.aggregates.forEach((aggregateConfig) => {
                            const aggregateFunction = selectAggregateFunction(aggregateConfig);
                            const aggregateResults = aggregateFunction({
                                ...aggregateConfig,
                                type: aggregateConfig.type,
                                events: newDanielSan.events
                            });
                            reportResults = aggregateResults;
                            if (!reportingConfig.rawJson) {
                                if (aggregateResults && aggregateResults.length > 0) {
                                    const firstElement = aggregateResults[0];
                                    aggregateHeader({ aggregate: { ...firstElement }, reportCharWidth, writeStream });
                                    aggregateResults.forEach((aggregateResult) => {
                                        aggregateLogger({
                                            aggregate: aggregateResult,
                                            reportingConfig,
                                            currencySymbol: newDanielSan.currencySymbol,
                                            reportCharWidth,
                                            writeStream
                                        });
                                    });
                                    aggregateFooter({ aggregate: { ...firstElement }, reportCharWidth, writeStream });
                                } else {
                                    showNothingToDisplay({ reportCharWidth, writeStream });
                                }
                            }
                        });
                        break;
                    default:
                        break;
                }
                if (!reportingConfig.rawJson) {
                    reportingBoundary({ loops: 2, char: '$', reportCharWidth, writeStream });
                    lineHeading({
                        heading: `  end reporting type: ${reportingType}  `,
                        char: '$',
                        reportCharWidth,
                        writeStream
                    });
                    reportingBoundary({ loops: 2, char: '$', reportCharWidth, writeStream });
                    lineSeparator({ loops: 2, reportCharWidth, writeStream });
                } else {
                    const returnObject = {
                        entityType: REPORT,
                        reportType: reportingType,
                        reportResults
                    };
                    // eslint-disable-next-line no-lonely-if
                    if (reportingConfig.file) {
                        if (reportIndex !== reportingTypes.length - 1) {
                            fileStream.write(`${JSON.stringify(returnObject, null, jsonSpacingSelected)},`);
                        } else {
                            fileStream.write(`${JSON.stringify(returnObject, null, jsonSpacingSelected)}`);
                        }
                    } else {
                        writeStream(returnObject);
                    }
                }
            });
            if (!reportingConfig.rawJson) {
                standardSubheader({ danielSan: newDanielSan, reportingConfig, reportCharWidth, writeStream });
                standardHeader({ reportingConfig, reportCharWidth, writeStream });
                danielSanAsciiArt(writeStream);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (reportingConfig.file) {
                    fileStream.write(']');
                    fileStream.write(', "completed": true ');
                }
            }
        } catch (err) {
            console.log(err);
            if (!reportingConfig.rawJson) {
                lineHeading({
                    heading: ' something bad happened and a lot of robots died ',
                    reportCharWidth,
                    writeStream
                });
                // eslint-disable-next-line no-console
                writeStream(`${err}\n`, true);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (reportingConfig.file) {
                    fileStream.write(']');
                    fileStream.write(', "error": true }');
                } else {
                    writeStream(err, true);
                }
            }
        } finally {
            if (reportingConfig.outputRelay) {
                reportingConfig.outputRelay(null);
            }
            if (reportingConfig.file) {
                if (reportingConfig.rawJson) {
                    fileStream.write('}');
                }
                closeStream(fileStream);
            }
        }
    } else {
        const errorMsg = 'the danielSan bonsai tree is likely null or undefined';
        if (!reportingConfig.rawJson) {
            lineHeading({
                heading: ` ${errorMsg} `,
                reportCharWidth,
                writeStream
            });
        } else {
            writeStream(` ${errorMsg} `, error);
        }
        if (reportingConfig.outputRelay) {
            reportingConfig.outputRelay(null);
        }
        if (reportingConfig.file) {
            closeStream(fileStream);
        }
    }
};

module.exports = createReport;
