const { isUndefinedOrNull } = require('../utility/validation');

const {
    DATE_FORMAT_STRING,
    ONCE,
    DAILY,
    WEEKLY,
    MONTHLY,
    ANNUALLY,
    STANDARD_TERMINAL_OUTPUT,
    VERBOSE,
    CONCISE,
    BUILD_DATE_STRING,
    NOT_AVAILABLE
} = require('../constants');

const TERMINAL_BOUNDARY_LIMIT = 89;

const rightPadToBoundary = ({ leftSideOfHeading, character }) => {
    let rightSideOfHeading = '';
    const length = ((TERMINAL_BOUNDARY_LIMIT - leftSideOfHeading.length) < 0) ? 0 : TERMINAL_BOUNDARY_LIMIT - leftSideOfHeading.length;
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
        console.log(fullHeading);
    }
};

const lineHeading = (heading) => {
    const leftSideOfHeading = `********${heading}`;
    const fullLineHeading = rightPadToBoundary({ leftSideOfHeading, character: '*' });
    console.log(fullLineHeading);
};

const lineSeparator = (loops = 1) => {
    for (let looper = 0; looper < loops; looper++) {
        const leftSideOfHeading = '';
        const fullHeading = rightPadToBoundary({ leftSideOfHeading, character: '-' });
        console.log(fullHeading);
    }
};

const conciseOutput = (event) => {
    lineSeparator(1);
    console.log(`name: `, event.name);
    console.log(`amount: `, event.amount);
    console.log(`endBalance: `, event.endBalance);
    console.log(`thisDate: `, event.thisDate);
    lineSeparator(1);
};

const verboseOutput = (event) => {
    console.log(event);
};

const eventsLogger = ({ events, terminalOptions }) => {
    switch (terminalOptions.mode) {
        case VERBOSE:
            events.forEach((event) => {
                verboseOutput(event);
            });
            break;
        case CONCISE:
            events.forEach((event) => {
                conciseOutput(event);
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
};

const standardTerminalOutput = ({ danielSan, terminalOptions }) => {
    standardTerminalHeader({ terminalOptions });
    let criticalSnapshots = null;
    if (!isUndefinedOrNull(terminalOptions.criticalThreshold)) {
        criticalSnapshots = danielSan.events.filter((event) => {
            return event.endBalance < terminalOptions.criticalThreshold;
        });
    }
    lineHeading(` beginBalance: ${danielSan.beginBalance} `);
    lineHeading(` dateStart: ${danielSan.dateStart} `);
    lineHeading(` dateEnd:   ${danielSan.dateEnd} `);
    lineSeparator(2);

    lineHeading(' begin cashflow events ');
    lineSeparator(2);
    eventsLogger({ events: danielSan.events, terminalOptions });
    lineSeparator(2);
    lineHeading(' end cashflow events ');
    lineSeparator(2);

    if (criticalSnapshots) {
        terminalBoundary(3);
        lineHeading(' begin critical snapshots ');
        lineHeading(` critical threshold: < ${terminalOptions.criticalThreshold} `);
        lineSeparator(2);
        if (criticalSnapshots) eventsLogger({ events: criticalSnapshots, terminalOptions });
        lineSeparator(2);
        lineHeading(' end critical snapshots ');
        lineSeparator(2);
    }
    terminalBoundary(5);
};

const terminal = ({ danielSan, terminalOptions = {}, error }) => {
    if (error) {
        console.log(error);
    } else {
        if (!terminalOptions) terminalOptions = { type: STANDARD_TERMINAL_OUTPUT, mode: CONCISE };
        // eslint-disable-next-line no-lonely-if
        if (!terminalOptions.mode) terminalOptions.mode = CONCISE;
        // TODO: actually just check for danielSan....and then check for terminalOptions...if none, then default to standard_terminal_output
        switch (terminalOptions.type) {
            case STANDARD_TERMINAL_OUTPUT:
                standardTerminalOutput({ danielSan, terminalOptions });
                break;
            default:
                break;
        }
    }
};

module.exports = terminal;
