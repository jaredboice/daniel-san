const { isUndefinedOrNull } = require('../utility/validation');
const {
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    findSnapshotsGreaterThanAmount,
    findSnapshotsLessThanAmount,
    findGreatestValueSnapshots
} = require('../analytics');

const {
    STANDARD_TERMINAL_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
    DISPLAY_EVENTS_BY_GROUPS,
    DISPLAY_EVENTS_BY_NAMES,
    DISPLAY_EVENTS_BY_TYPES,
    DISPLAY_EVENTS,
    DISPLAY_CRITICAL_SNAPSHOTS,
    DISPLAY_IMPORTANT_EVENTS,
    DISPLAY_TIME_EVENTS,
    DISPLAY_ROUTINE_EVENTS,
    DISPLAY_REMINDER_EVENTS,
    DISPLAY_RULES_TO_RETIRE,
    DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT,
    DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT,
    DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS,
    DISPLAY_LEAST_END_BALANCE_SNAPSHOTS,
    MIN_INT_DIGITS_DEFAULT,
    MIN_DECIMAL_DIGITS_DEFAULT,
    MAX_DECIMAL_DIGITS_DEFAULT,
    LOCALE_DEFAULT,
    STYLE_DEFAULT,
    CURRENCY_DEFAULT,
    FORMATTING_FUNCTION_DEFAULT
} = require('../constants');

const TERMINAL_BOUNDARY_LIMIT = 89;

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
        "'Wax on... Wax off, wax on... wax off.\nBreath in through nose. Breath out through mouth.'",
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
        "'Wax-on, wax-off.'"
    ];
    const elementIndex = Math.floor(Math.random() * quotes.length);
    return `${quotes[elementIndex]} -Miyagi-`;
};

const rightPadToBoundary = ({ leftSideOfHeading, character }) => {
    let rightSideOfHeading = '';
    const length =
        TERMINAL_BOUNDARY_LIMIT - leftSideOfHeading.length < 0 ? 0 : TERMINAL_BOUNDARY_LIMIT - leftSideOfHeading.length;
    for (let looper = 0; looper < length; looper++) {
        rightSideOfHeading = `${rightSideOfHeading}${character}`;
    }
    const fullLineHeading = rightSideOfHeading ? `${leftSideOfHeading}${rightSideOfHeading}` : leftSideOfHeading;
    return fullLineHeading;
};

const terminalBoundary = (loops = 1) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: '*' });
        // eslint-disable-next-line no-console
        console.log(fullHeading);
    }
};

const lineHeading = (heading) => {
    const leftSideOfHeading = `********${heading}`;
    const fullLineHeading = rightPadToBoundary({ leftSideOfHeading, character: '*' });
    // eslint-disable-next-line no-console
    console.log(fullLineHeading);
};

const lineSeparator = (loops = 1) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: '-' });
        // eslint-disable-next-line no-console
        console.log(fullHeading);
    }
};

const showNothingToDisplay = () => {
    // eslint-disable-next-line quotes
    lineHeading(` nothing to display `);
    lineSeparator(2);
};

const getDefaultParamsForDecimalFormatter = (terminalOptions) => {
    const formattingFunction =
        terminalOptions.formatting && terminalOptions.formattingFunction
            ? terminalOptions.formattingFunction
            : FORMATTING_FUNCTION_DEFAULT;
    const minIntegerDigits =
        terminalOptions.formatting && terminalOptions.formatting.minIntegerDigits
            ? terminalOptions.formatting.minIntegerDigits
            : MIN_INT_DIGITS_DEFAULT;
    const minDecimalDigits =
        terminalOptions.formatting && terminalOptions.formatting.minDecimalDigits
            ? terminalOptions.formatting.minDecimalDigits
            : MIN_DECIMAL_DIGITS_DEFAULT;
    const maxDecimalDigits =
        terminalOptions.formatting && terminalOptions.formatting.maxDecimalDigits
            ? terminalOptions.formatting.maxDecimalDigits
            : MAX_DECIMAL_DIGITS_DEFAULT;
    const locale =
        terminalOptions.formatting && terminalOptions.formatting.locale
            ? terminalOptions.formatting.locale
            : LOCALE_DEFAULT;
    const style =
        terminalOptions.formatting && terminalOptions.formatting.style
            ? terminalOptions.formatting.style
            : STYLE_DEFAULT;
    const currency =
        terminalOptions.formatting && terminalOptions.formatting.currency
            ? terminalOptions.formatting.currency
            : CURRENCY_DEFAULT;
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

const shyOutput = ({ event, terminalOptions, currencySymbol }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(terminalOptions);
    lineSeparator(1);
    // eslint-disable-next-line no-console
    if (event.name) console.log(`name: `, event.name); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.amount) && currencySymbol === event.currencySymbol) {
        // eslint-disable-next-line no-console
        console.log(
            `amount: `, // eslint-disable-line quotes
            formattingFunction(event.amount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: event.currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.convertedAmount) && event.currencySymbol !== currencySymbol) {
        // eslint-disable-next-line no-console
        console.log(
            `convertedAmount: `, // eslint-disable-line quotes
            formattingFunction(event.convertedAmount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.amount)) {
        // eslint-disable-next-line no-console
        console.log(
            `endBalance: `, // eslint-disable-line quotes
            formattingFunction(event.endBalance, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    // eslint-disable-next-line no-console
    console.log(`eventDate: `, event.eventDate); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    lineSeparator(1);
};

const conciseOutput = ({ event, terminalOptions, currencySymbol }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(terminalOptions);
    lineSeparator(1);
    // eslint-disable-next-line no-console
    if (event.name) console.log(`name: `, event.name); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.group) console.log(`group: `, event.group); // eslint-disable-line quotes
    if (!isUndefinedOrNull(event.amount)) {
        // eslint-disable-next-line no-console
        console.log(
            `amount: `, // eslint-disable-line quotes
            formattingFunction(event.amount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: event.currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.convertedAmount) && event.currencySymbol !== currencySymbol) {
        // eslint-disable-next-line no-console
        console.log(
            `convertedAmount: `, // eslint-disable-line quotes
            formattingFunction(event.convertedAmount, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.amount)) {
        // eslint-disable-next-line no-console
        console.log(
            `endBalance: `, // eslint-disable-line quotes
            formattingFunction(event.endBalance, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }

    // eslint-disable-next-line no-console
    console.log(`eventDate: `, event.eventDate); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.timeStart) console.log(`timeStart: `, event.timeStart); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.notes) console.log(`notes: `, event.notes); // eslint-disable-line quotes
    lineSeparator(1);
};

const verboseOutput = ({ event, terminalOptions, currencySymbol }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(terminalOptions);
    lineSeparator(1);
    Object.entries(event).forEach(([key, value]) => {
        if (
            key !== 'type' &&
            key !== 'frequency' &&
            key !== 'processDate' &&
            key !== 'dateStart' &&
            key !== 'dateEnd' &&
            key !== 'modulus' &&
            key !== 'cycle' &&
            key !== 'syncDate' &&
            key !== 'specialAdjustments' &&
            key !== 'exclusions' &&
            key !== 'sortPriority'
        ) {
            if (key === 'name') {
                // eslint-disable-next-line no-console
                console.log(`name: `, event.name); // eslint-disable-line quotes
            } else if (key === 'amount') {
                // eslint-disable-next-line no-console
                console.log(
                    `amount: `, // eslint-disable-line quotes
                    formattingFunction(event.amount, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: event.currencySymbol || CURRENCY_DEFAULT
                    })
                );
            } else if (key === 'convertedAmount') {
                // eslint-disable-next-line no-console
                console.log(
                    `convertedAmount: `, // eslint-disable-line quotes
                    formattingFunction(event.convertedAmount, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: currencySymbol || CURRENCY_DEFAULT
                    })
                );
            } else if (key === 'endBalance') {
                // eslint-disable-next-line no-console
                console.log(
                    `endBalance: `, // eslint-disable-line quotes
                    formattingFunction(event.endBalance, {
                        minIntegerDigits,
                        minDecimalDigits,
                        maxDecimalDigits,
                        locale,
                        style,
                        currency: currencySymbol || CURRENCY_DEFAULT
                    })
                );
            } else if (key === 'eventDate') {
                // eslint-disable-next-line no-console
                console.log(`eventDate: `, event.eventDate); // eslint-disable-line quotes
            } else {
                // eslint-disable-next-line no-console
                console.log(`${key}: ${value}`);
            }
        }
    });
    lineSeparator(1);
};

const eventsLogger = ({ events, terminalOptions, currencySymbol }) => {
    switch (terminalOptions.mode) {
        case VERBOSE:
            events.forEach((event) => {
                verboseOutput({ event, terminalOptions, currencySymbol });
            });
            break;
        case CONCISE:
            events.forEach((event) => {
                conciseOutput({ event, terminalOptions, currencySymbol });
            });
            break;
        case SHY:
            events.forEach((event) => {
                shyOutput({ event, terminalOptions, currencySymbol });
            });
            break;
        default:
            break;
    }
};

const standardTerminalHeader = ({ terminalOptions }) => {
    terminalBoundary(5);
    lineHeading(' must find balance, daniel-san ');
    lineHeading(` terminal type: ${terminalOptions.type} `);
    lineHeading(` mode: ${terminalOptions.mode} `);
    lineSeparator(2);
    console.log(getRandomMiyagiQuote());
    lineSeparator(2);
};

const standardTerminalSubheader = ({ danielSan, terminalOptions }) => {
    const {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style
    } = getDefaultParamsForDecimalFormatter(terminalOptions);
    lineHeading(
        ` beginBalance: ${formattingFunction(danielSan.beginBalance, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: danielSan.currencySymbol || CURRENCY_DEFAULT
        })} `
    );
    lineHeading(` dateStart: ${danielSan.dateStart} `);
    lineHeading(` dateEnd:   ${danielSan.dateEnd} `);
    lineSeparator(2);
};

const showCriticalSnapshots = ({ danielSan, terminalOptions }) => {
    const criticalSnapshots = findCriticalSnapshots({
        danielSan,
        criticalThreshold: terminalOptions.criticalThreshold
    });
    if (criticalSnapshots) {
        terminalBoundary(3);
        lineHeading(' begin critical snapshots ');
        if (terminalOptions.criticalThreshold) {
            lineHeading(` critical threshold: < ${terminalOptions.criticalThreshold} `);
        }
        lineSeparator(2);
        eventsLogger({
            events: criticalSnapshots,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
        lineSeparator(2);
        lineHeading(' end critical snapshots ');
        lineSeparator(2);
    }
};

const showRulesToRetire = ({ danielSan, terminalOptions }) => {
    const rulesToRetire = findRulesToRetire({ danielSan });
    if (rulesToRetire) {
        terminalBoundary(3);
        lineHeading(' begin showRulesToRetire ');
        lineHeading(' the following rules have obsolete dateEnd values ');
        lineSeparator(2);
        eventsLogger({
            events: rulesToRetire,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
        lineSeparator(2);
        lineHeading(' end showRulesToRetire ');
        lineSeparator(2);
    }
};

const displayRulesToRetire = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    showRulesToRetire({ danielSan, terminalOptions });
    terminalBoundary(5);
};

const displayCriticalSnapshots = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    showCriticalSnapshots({ danielSan, terminalOptions });
    terminalBoundary(5);
};

const displayEndBalanceSnapshotsGreaterThanMaxAmount = ({ danielSan, terminalOptions }) => {
    const collection = findSnapshotsGreaterThanAmount({
        collection: danielSan.events,
        amount: terminalOptions.maxAmount || 0,
        propertyKey: 'endBalance'
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayEndBalanceSnapshotsGreaterThanMaxAmount ');
    lineSeparator(2);
    const relevantEvents = collection;
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayEndBalanceSnapshotsGreaterThanMaxAmount ');
    lineSeparator(2);
    terminalBoundary(5);
};

const displayEndBalanceSnapshotsLessThanMinAmount = ({ danielSan, terminalOptions }) => {
    const collection = findSnapshotsLessThanAmount({
        collection: danielSan.events,
        amount: terminalOptions.minAmount || 0,
        propertyKey: 'endBalance'
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayEndBalanceSnapshotsLessThanMinAmount ');
    lineSeparator(2);
    const relevantEvents = collection;
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayEndBalanceSnapshotsLessThanMinAmount ');
    lineSeparator(2);
    terminalBoundary(5);
};

const displayfindGreatestValueSnapshots = ({ danielSan, terminalOptions }) => {
    const collection = findGreatestValueSnapshots({
        collection: danielSan.events,
        propertyKey: 'endBalance',
        selectionAmount: terminalOptions.selectionAmount || 7,
        reverse: false
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayfindGreatestValueSnapshots ');
    lineSeparator(2);
    const relevantEvents = collection;
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayfindGreatestValueSnapshots ');
    lineSeparator(2);
    terminalBoundary(5);
};

const displayLeastEndBalanceSnapshots = ({ danielSan, terminalOptions }) => {
    const collection = findGreatestValueSnapshots({
        collection: danielSan.events,
        propertyKey: 'endBalance',
        selectionAmount: terminalOptions.selectionAmount || 7,
        reverse: true
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayLeastEndBalanceSnapshots');
    lineSeparator(2);
    const relevantEvents = collection;
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayLeastEndBalanceSnapshots ');
    lineSeparator(2);
    terminalBoundary(5);
};

const standardTerminalOutput = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin standardTerminalOutput ');
    lineSeparator(2);
    const relevantEvents = danielSan.events;
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end standardTerminalOutput ');
    lineSeparator(2);
    if (terminalOptions.type !== DISPLAY_EVENTS) {
        showCriticalSnapshots({ danielSan, terminalOptions });
    }
    terminalBoundary(5);
};

const displayEventsWithProperty = ({
    danielSan,
    terminalOptions,
    propertyKey,
    findFunction = findEventsWithProperty
}) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayEventsWithProperty ');
    lineSeparator(2);
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey });
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayEventsWithProperty ');
    lineSeparator(2);
    terminalBoundary(5);
};

const displayEventsByPropertyKeyAndValues = ({
    danielSan,
    terminalOptions,
    propertyKey,
    findFunction = findEventsByPropertyKeyAndValues
}) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayEventsByPropertyKeyAndValues ');
    lineSeparator(2);
    const { searchValues } = terminalOptions;
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, searchValues });
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayEventsByPropertyKeyAndValues ');
    lineSeparator(2);
    terminalBoundary(5);
};

const displayEventsWithPropertyKeyContainingSubstring = ({
    danielSan,
    terminalOptions,
    propertyKey,
    substring,
    findFunction = findEventsWithPropertyKeyContainingSubstring
}) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayEventsWithPropertyKeyContainingSubstring ');
    lineSeparator(2);
    const relevantEvents = findFunction({ events: danielSan.events, propertyKey, substring });
    if (relevantEvents) {
        eventsLogger({
            events: relevantEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
    } else {
        showNothingToDisplay();
    }
    lineSeparator(2);
    lineHeading(' end displayEventsWithPropertyKeyContainingSubstring ');
    lineSeparator(2);
    terminalBoundary(5);
};

const terminal = ({ danielSan, terminalOptions = {}, error }) => {
    if (error) {
        // eslint-disable-next-line no-console
        lineHeading(' something bad happened and a lot of robots died ');
        // eslint-disable-next-line no-console
        console.log(error);
    } else if (danielSan) {
        try {
            if (!terminalOptions) terminalOptions = { type: STANDARD_TERMINAL_OUTPUT, mode: CONCISE };
            // eslint-disable-next-line no-lonely-if
            if (!terminalOptions.mode) terminalOptions.mode = CONCISE;
            // eslint-disable-next-line no-lonely-if
            if (!terminalOptions.type) terminalOptions.type = STANDARD_TERMINAL_OUTPUT;
            switch (terminalOptions.type) {
                case DISPLAY_EVENTS:
                case STANDARD_TERMINAL_OUTPUT:
                    standardTerminalOutput({ danielSan, terminalOptions });
                    break;
                case DISPLAY_EVENTS_BY_GROUPS:
                    displayEventsByPropertyKeyAndValues({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'group'
                    });
                    break;
                case DISPLAY_EVENTS_BY_NAMES:
                    displayEventsByPropertyKeyAndValues({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'name'
                    });
                    break;
                case DISPLAY_EVENTS_BY_TYPES:
                    displayEventsByPropertyKeyAndValues({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'type'
                    });
                    break;
                case DISPLAY_CRITICAL_SNAPSHOTS:
                    displayCriticalSnapshots({ danielSan, terminalOptions });
                    break;
                case DISPLAY_IMPORTANT_EVENTS:
                    displayEventsWithProperty({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'important'
                    });
                    break;
                case DISPLAY_TIME_EVENTS:
                    displayEventsWithProperty({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'timeStart'
                    });
                    break;
                case DISPLAY_ROUTINE_EVENTS:
                    displayEventsWithPropertyKeyContainingSubstring({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'type',
                        substring: 'ROUTINE'
                    });
                    break;
                case DISPLAY_REMINDER_EVENTS:
                    displayEventsWithPropertyKeyContainingSubstring({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'type',
                        substring: 'REMINDER'
                    });
                    break;
                case DISPLAY_RULES_TO_RETIRE:
                    displayRulesToRetire({ danielSan, terminalOptions });
                    break;
                case DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT:
                    displayEndBalanceSnapshotsGreaterThanMaxAmount({ danielSan, terminalOptions });
                    break;
                case DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT:
                    displayEndBalanceSnapshotsLessThanMinAmount({ danielSan, terminalOptions });
                    break;
                case DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS:
                    displayfindGreatestValueSnapshots({ danielSan, terminalOptions });
                    break;
                case DISPLAY_LEAST_END_BALANCE_SNAPSHOTS:
                    displayLeastEndBalanceSnapshots({ danielSan, terminalOptions });
                    break;
                default:
                    break;
            }
            lineSeparator(2);
            console.log(getRandomMiyagiQuote());
            lineSeparator(2);
        } catch (err) {
            lineHeading(' something bad happened and a lot of robots died ');
            // eslint-disable-next-line no-console
            console.log(error);
        }
    }
};

module.exports = terminal;
