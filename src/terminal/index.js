const { isUndefinedOrNull } = require('../utility/validation');
const {
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring,
    findSnapshotsGreaterThanAmount,
    findSnapshotsLessThanAmount,
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
    STANDARD_TERMINAL_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
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
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
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
    const formattingOptions = terminalOptions.formatting || {};
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
    if (!isUndefinedOrNull(event.name)) console.log(`name: `, event.name); // eslint-disable-line quotes
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
    if (
        !isUndefinedOrNull(event.amountConverted) &&
        !isUndefinedOrNull(event.amount) &&
        currencySymbol !== event.currencySymbol
    ) {
        // eslint-disable-next-line no-console
        console.log(
            `amountConverted: `, // eslint-disable-line quotes
            formattingFunction(event.amountConverted, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.amount) && !isUndefinedOrNull(event.balanceEnding)) {
        // eslint-disable-next-line no-console
        console.log(
            `balanceEnding: `, // eslint-disable-line quotes
            formattingFunction(event.balanceEnding, {
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
    console.log(`dateStart: `, event.dateStart); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.timeStart) console.log('timeStart: ', event.timeStart);
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
    if (!isUndefinedOrNull(event.name)) console.log(`name: `, event.name); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.group)) console.log(`group: `, event.group); // eslint-disable-line quotes
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
    if (
        !isUndefinedOrNull(event.amountConverted) &&
        !isUndefinedOrNull(event.amount) &&
        event.currencySymbol !== currencySymbol
    ) {
        // eslint-disable-next-line no-console
        console.log(
            `amountConverted: `, // eslint-disable-line quotes
            formattingFunction(event.amountConverted, {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: currencySymbol || CURRENCY_DEFAULT
            })
        );
    }
    if (!isUndefinedOrNull(event.amount) && !isUndefinedOrNull(event.balanceEnding)) {
        // eslint-disable-next-line no-console
        console.log(
            `balanceEnding: `, // eslint-disable-line quotes
            formattingFunction(event.balanceEnding, {
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
    console.log(`dateStart: `, event.dateStart); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.dateEnd) console.log(`dateEnd: `, event.dateEnd); // eslint-disable-line quotes
            // eslint-disable-next-line no-console
    if (event.timeStart) console.log(`timeStart: `, event.timeStart); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (event.timeEnd) console.log(`timeEnd: `, event.timeEnd); // eslint-disable-line quotes
    // eslint-disable-next-line no-console
    if (!isUndefinedOrNull(event.weekdayStart)) {
        const weekdayString = getWeekdayString(event.weekdayStart);
        console.log(`weekdayStart: ${weekdayString}`); // eslint-disable-line no-console
    }
    if (!isUndefinedOrNull(event.weekdayEnd)) {
        const weekdayString = getWeekdayString(event.weekdayEnd);
        console.log(`weekdayEnd: ${weekdayString}`); // eslint-disable-line no-console
    }
    if (!isUndefinedOrNull(event.notes)) console.log(`notes: `, event.notes); // eslint-disable-line quotes
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
    const ttyMessageStack = [];
    const dataBouncer = (message, order) => {
        ttyMessageStack.push({ message, order });
    };
    Object.entries(event).forEach(([key, value]) => {
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
                `amount: ${
                formattingFunction(event.amount, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: event.currencySymbol || CURRENCY_DEFAULT
                })}`, 60
            );
        } else if (
            key === 'amountConverted' &&
            !isUndefinedOrNull(event.amount) &&
            event.currencySymbol !== currencySymbol
        ) {
            dataBouncer(
                `amountConverted: ${formattingFunction(event.amountConverted, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: currencySymbol || CURRENCY_DEFAULT
                })}`, 70
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
                })}`, 80
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
                })}`, 90
            );
        } else if (key === 'currencyEventSource' && event.currencyEventSource != null && !isUndefinedOrNull(event.amount) &&
        event.currencySymbol !== currencySymbol) {
            dataBouncer(`currencyEventSource: ${event.currencyEventSource}`, 100);
        } else if (key === 'currencyObserverSource' && event.currencyObserverSource != null && !isUndefinedOrNull(event.amount) &&
        event.currencySymbol !== currencySymbol) {
            dataBouncer(`currencyObserverSource: ${event.currencyObserverSource}`, 110);
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
        } else if (key === 'timeZoneEventSource' && event.timeZoneEventSource != null && event.timeZoneEventSource !== event.timeZoneObserverSource) {
            dataBouncer(`timeZoneEventSource: ${event.timeZoneEventSource}`, 260);
        } else if (key === 'timeZoneObserverSource' && event.timeZoneObserverSource != null) {
            dataBouncer(`timeZoneObserverSource: ${event.timeZoneObserverSource}`, 270);
        } else if (key === 'dateTimeStartEventSource' && event.dateTimeStartEventSource != null && event.timeZoneEventSource !== event.timeZoneObserverSource) {
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
            key !== 'amountConverted' &&
            key !== 'balanceBeginning' &&
            key !== 'balanceEnding' &&
            key !== 'currencyEventSource' &&
            key !== 'currencyObserverSource' &&
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
            key !== 'timeZoneEventSource' &&
            key !== 'timeZoneObserverSource' &&
            key !== 'dateTimeStartEventSource' &&
            key !== 'dateTimeObserverSource'
        ) {
            // eslint-disable-next-line no-console
            dataBouncer(`${key}: ${value}`, 300);
        }
    });
    const ttyMessageStackOrdered = ttyMessageStack.slice().sort((a, b) => {
        if(a.order > b.order){
            return 1;
        } else if(a.order < b.order) {
            return -1;
        } else {
            return 0;
        }
    });
    ttyMessageStackOrdered.forEach((obj) => {
        console.log(obj.message);
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
    lineHeading(` terminal mode: ${terminalOptions.mode} `);
    lineSeparator(2);
    // eslint-disable-next-line no-console
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
    if (!isUndefinedOrNull(danielSan['balanceBeginning'])) {
        lineHeading(` currencySymbol: ${danielSan.currencySymbol} `);
        lineHeading(
            ` ${'balanceBeginning'}: ${formattingFunction(danielSan['balanceBeginning'], {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.currencySymbol || CURRENCY_DEFAULT
            })} `
        );
    }
    if (!isUndefinedOrNull(danielSan['balanceEnding'])) {
        lineHeading(` currencySymbol: ${danielSan.currencySymbol} `);
        lineHeading(
            ` ${balanceEnding}: ${formattingFunction(danielSan['balanceEnding'], {
                minIntegerDigits,
                minDecimalDigits,
                maxDecimalDigits,
                locale,
                style,
                currency: danielSan.currencySymbol || CURRENCY_DEFAULT
            })} `
        );
    }
    if (!isUndefinedOrNull(danielSan.timeZoneType)) {
        lineHeading(` timeZoneType: ${danielSan.timeZoneType} `);
    }
    if (!isUndefinedOrNull(danielSan.timeZone)) {
        lineHeading(` timeZone: ${danielSan.timeZone} `);
    }
    lineHeading(` effectiveDateStart: ${danielSan.effectiveDateStart} `);
    if (danielSan.timeStart) lineHeading(` timeStart: ${danielSan.timeStart} `);
    lineHeading(` effectiveDateEnd:   ${danielSan.effectiveDateEnd} `);
    if (danielSan.timeEnd) lineHeading(` timeEnd: ${danielSan.timeEnd} `);
    lineSeparator(2);
};

const showDiscardedEvents = ({ danielSan, terminalOptions }) => {
    const discardedEvents = danielSan.discardedEvents;
    if (discardedEvents && discardedEvents.length > 0) {
        terminalBoundary(3);
        lineHeading(' begin discarded events ');
        lineHeading(' these events were excluded for residing beyond the provided date range ');
        lineSeparator(2);
        eventsLogger({
            events: discardedEvents,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
        lineSeparator(2);
        lineHeading(` discarded event count: ${discardedEvents.length} `);
        lineSeparator(2);
        lineHeading(' end discarded events ');
        lineSeparator(2);
    }
};

const showCriticalSnapshots = ({ danielSan, terminalOptions }) => {
    const criticalSnapshots = findCriticalSnapshots({
        danielSan,
        criticalThreshold: terminalOptions.criticalThreshold
    });
    if (criticalSnapshots) {
        const {
            formattingFunction,
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style
        } = getDefaultParamsForDecimalFormatter(terminalOptions);
        terminalBoundary(3);
        lineHeading(' begin critical snapshots ');
        if (!isUndefinedOrNull(terminalOptions.criticalThreshold)) {
            lineHeading(
                ` critical threshold: < ${formattingFunction(terminalOptions.criticalThreshold, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: danielSan.currencySymbol || CURRENCY_DEFAULT
                })} `
            );
        }
        lineSeparator(2);
        eventsLogger({
            events: criticalSnapshots,
            terminalOptions,
            currencySymbol: danielSan.currencySymbol || CURRENCY_DEFAULT
        });
        lineSeparator(2);
        lineHeading(` snapshot count: ${criticalSnapshots.length} `);
        lineSeparator(2);
        lineHeading(' end critical snapshots ');
        if (!isUndefinedOrNull(terminalOptions.criticalThreshold)) {
            lineHeading(
                ` critical threshold: < ${formattingFunction(terminalOptions.criticalThreshold, {
                    minIntegerDigits,
                    minDecimalDigits,
                    maxDecimalDigits,
                    locale,
                    style,
                    currency: danielSan.currencySymbol || CURRENCY_DEFAULT
                })} `
            );
        }
        lineSeparator(2);
    }
};

const showRulesToRetire = ({ danielSan, terminalOptions }) => {
    const rulesToRetire = findRulesToRetire(danielSan);
    if (rulesToRetire) {
        terminalBoundary(3);
        lineHeading(' begin showRulesToRetire ');
        lineHeading(' the following rules have obsolete effectiveDateEnd values ');
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

const showSumOfAllPositiveEventAmounts = ({ danielSan, terminalOptions }) => {
    lineHeading(' begin showSumOfAllPositiveEventAmounts ');
    const sum = sumAllPositiveEventAmounts(danielSan);
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
    console.log(
        `total sum: `, // eslint-disable-line quotes
        formattingFunction(sum, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: danielSan.currencySymbol || CURRENCY_DEFAULT
        })
    );
    terminalBoundary(2);
    showDiscardedEvents({ danielSan, terminalOptions });
};

const showSumOfAllNegativeEventAmounts = ({ danielSan, terminalOptions }) => {
    lineHeading(' begin showSumOfAllNegativeEventAmounts ');
    const sum = sumAllNegativeEventAmounts(danielSan);
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
    console.log(
        `total sum: `, // eslint-disable-line quotes
        formattingFunction(sum, {
            minIntegerDigits,
            minDecimalDigits,
            maxDecimalDigits,
            locale,
            style,
            currency: danielSan.currencySymbol || CURRENCY_DEFAULT
        })
    );
    terminalBoundary(2);
    showDiscardedEvents({ danielSan, terminalOptions });
};

const displaySumOfAllPositiveEventAmounts = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    showSumOfAllPositiveEventAmounts({ danielSan, terminalOptions });
    terminalBoundary(3);
};

const displaySumOfAllNegativeEventAmounts = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    showSumOfAllNegativeEventAmounts({ danielSan, terminalOptions });
    terminalBoundary(3);
};

const displayRulesToRetire = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    showRulesToRetire({ danielSan, terminalOptions });
    terminalBoundary(3);
};

const displayDiscardedEvents = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    showDiscardedEvents({ danielSan, terminalOptions });
    terminalBoundary(3);
};

const displayCriticalSnapshots = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    showCriticalSnapshots({ danielSan, terminalOptions });
    terminalBoundary(3);
};

const displayBalanceEndingSnapshotsGreaterThanMaxAmount = ({ danielSan, terminalOptions }) => {
    const collection = findSnapshotsGreaterThanAmount({
        collection: danielSan.events,
        amount: terminalOptions.maxAmount || 0,
        propertyKey: 'balanceEnding'
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayBalanceEndingSnapshotsGreaterThanMaxAmount ');
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
    lineHeading(' end displayBalanceEndingSnapshotsGreaterThanMaxAmount ');
    lineSeparator(2);
    terminalBoundary(3);
};

const displayBalanceEndingSnapshotsLessThanMinAmount = ({ danielSan, terminalOptions }) => {
    const collection = findSnapshotsLessThanAmount({
        collection: danielSan.events,
        amount: terminalOptions.minAmount || 0,
        propertyKey: 'balanceEnding'
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayBalanceEndingSnapshotsLessThanMinAmount ');
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
    lineHeading(' end displayBalanceEndingSnapshotsLessThanMinAmount ');
    lineSeparator(2);
    terminalBoundary(3);
};

const displayfindGreatestValueSnapshots = ({ danielSan, terminalOptions }) => {
    const collection = findGreatestValueSnapshots({
        collection: danielSan.events,
        propertyKey: 'balanceEnding',
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
    terminalBoundary(3);
};

const displayLeastBalanceEndingSnapshots = ({ danielSan, terminalOptions }) => {
    const collection = findGreatestValueSnapshots({
        collection: danielSan.events,
        propertyKey: 'balanceEnding',
        selectionAmount: terminalOptions.selectionAmount || 7,
        reverse: true
    });
    standardTerminalHeader({ terminalOptions });
    standardTerminalSubheader({ danielSan, terminalOptions });
    lineHeading(' begin displayLeastBalanceEndingSnapshots');
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
    lineHeading(' end displayLeastBalanceEndingSnapshots ');
    lineSeparator(2);
    terminalBoundary(3);
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
    showDiscardedEvents({ danielSan, terminalOptions });
    terminalBoundary(3);
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
    terminalBoundary(3);
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
    terminalBoundary(3);
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
    terminalBoundary(3);
};

const terminal = ({ danielSan, terminalOptions = {}, error = null, originalDanielSan = null }) => {
    if (error) {
        // eslint-disable-next-line no-console
        lineHeading(' something bad happened and a lot of robots died ');
        // eslint-disable-next-line no-console
        Object.entries(error).forEach(([key, value]) => {
            console.log(`### ${key}`); // eslint-disable-line no-console
            if (typeof key === 'object') {
                console.log(`${JSON.stringify(value, null, 4)}`); // eslint-disable-line no-console
            } else {
                console.log(value); // eslint-disable-line no-console
            }
            console.log('\n'); // eslint-disable-line no-console
        });
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
                case DISPLAY_EVENTS_BY_GROUP:
                case DISPLAY_EVENTS_BY_GROUPS:
                    displayEventsByPropertyKeyAndValues({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'group'
                    });
                    break;
                case DISPLAY_EVENTS_BY_NAME:
                case DISPLAY_EVENTS_BY_NAMES:
                    displayEventsByPropertyKeyAndValues({
                        danielSan,
                        terminalOptions,
                        propertyKey: 'name'
                    });
                    break;
                case DISPLAY_EVENTS_BY_TYPE:
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
                case DISPLAY_DISCARDED_EVENTS:
                    displayDiscardedEvents({ danielSan, terminalOptions });
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
                    displayRulesToRetire({ danielSan: originalDanielSan || danielSan, terminalOptions });
                    break;
                case DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS:
                case DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS:
                    displaySumOfAllPositiveEventAmounts({ danielSan, terminalOptions });
                    break;
                case DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS:
                case DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS:
                    displaySumOfAllNegativeEventAmounts({ danielSan, terminalOptions });
                    break;
                case DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT:
                    displayBalanceEndingSnapshotsGreaterThanMaxAmount({ danielSan, terminalOptions });
                    break;
                case DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT:
                    displayBalanceEndingSnapshotsLessThanMinAmount({ danielSan, terminalOptions });
                    break;
                case DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS:
                    displayfindGreatestValueSnapshots({ danielSan, terminalOptions });
                    break;
                case DISPLAY_LEAST_END_BALANCE_SNAPSHOTS:
                    displayLeastBalanceEndingSnapshots({ danielSan, terminalOptions });
                    break;
                default:
                    break;
            }
            lineSeparator(2);
            standardTerminalSubheader({ danielSan, terminalOptions });
            lineSeparator(2);
            // eslint-disable-next-line no-console
            console.log(getRandomMiyagiQuote());
            lineSeparator(2);
            terminalBoundary(5);
        } catch (err) {
            lineHeading(' something bad happened and a lot of robots died ');
            // eslint-disable-next-line no-console
            console.log(err);
        }
    }
};

module.exports = terminal;
