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

const terminalBoundary = (loops = 1) => {
    for (let looper = 0; looper < loops; looper++) {
        console.log('*******************************************************');
    }
};

const lineHeading = (heading) => {
    console.log(`********${heading}********`);
};

const lineSeparator = (loops = 1) => {
    for (let looper = 0; looper < loops; looper++) {
        console.log('-------------------------------------------------------');
    }
};

const conciseOutput = (cashflowOperation) => {
    lineSeparator(1);
    console.log(`name: `, cashflowOperation.name);
    console.log(`amount: `, cashflowOperation.amount);
    console.log(`endBalance: `, cashflowOperation.endBalance);
    console.log(`thisDate: `, cashflowOperation.thisDate);
    lineSeparator(1);
};

const verboseOutput = (cashflowOperation) => {
    console.log(cashflowOperation);
};

const cashflowOperationsLogger = ({ cashflowOperations, terminalOptions }) => {
    switch (terminalOptions.mode) {
        case VERBOSE:
            cashflowOperations.forEach((cashflowOperation) => {
                verboseOutput(cashflowOperation);
            });
            break;
        case CONCISE:
            cashflowOperations.forEach((cashflowOperation) => {
                conciseOutput(cashflowOperation);
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
        criticalSnapshots = danielSan.cashflowOperations.filter((cashflowOperation) => {
            return cashflowOperation.endBalance < terminalOptions.criticalThreshold;
        });
    }
    lineHeading(` beginBalance: ${danielSan.beginBalance} `);
    lineHeading(` dateStart: ${danielSan.dateStart} `);
    lineHeading(` dateEnd:   ${danielSan.dateEnd} `);
    lineSeparator(2);

    lineHeading(' begin cashflow operations ');
    lineSeparator(2);
    cashflowOperationsLogger({ cashflowOperations: danielSan.cashflowOperations, terminalOptions });
    lineSeparator(2);
    lineHeading(' end cashflow operations ');
    lineSeparator(2);

    if (criticalSnapshots) {
        terminalBoundary(3);
        lineHeading(' begin critical snapshots ');
        lineHeading(` critical threshold: < ${terminalOptions.criticalThreshold} `);
        lineSeparator(2);
        if (criticalSnapshots) cashflowOperationsLogger({ cashflowOperations: criticalSnapshots, terminalOptions });
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
