# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Documentation

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU (use this address until 2020)

## Description

**Daniel-San** is a node-based budget-projection engine that helps your finances find balance. The program offers multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. And special adjustments allow the movement of process-dates beyond holidays and weekends.

## Install, Import & Execute

**Install**

`npm install --save daniel-san`

**Import**

```javascript
const findBalance = require('daniel-san');
const terminal = require('daniel-san/terminal');
const { STANDARD_EVENT, MONTHLY, WEEKLY, DAILY, FRIDAY, SATURDAY, SUNDAY } = require('daniel-san/constants');
```

**Defining Accounts/Cashflow Rules**

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20', // always required
    dateEnd: '2019-12-13', // required except when using the STANDARD_EVENT with a frequency of ONCE
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account
            dateEnd: null, // null dateEnd represents an ongoing account
            modulus: 1, // not required - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - see "Modulus/Cycle" to review this advanced feature
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            dateStart: '2019-01-01',
            dateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1,
            syncDate: '2019-08-12' // specific to "Modulus/Cycle" - read that section for instructions
        },
        { // rule 3
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            dateStart: '2019-01-01',
            dateEnd: null,
            exclusions: { // (exclusion hits will still cycle the modulus for STANDARD_EVENT)
                weekdays: [SATURDAY, SUNDAY], // excluding these weekdays
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // exluding these specific dates
            }
        }
    ],
    events: [] // future balance projections stored here
};

const craneKick = findBalance(danielSan);
```

**Execution Example**

```javascript
// after executing findBalance with danielSan, craneKick will embody the danielSan object with the newly produced events
const craneKick = findBalance(danielSan);
);
```

## Event Types

**Standard Events**

-   `type: 'STANDARD_EVENT'` _(see "Modulus/Cycle" to review an advanced feature exclusive to Standard Events)_
-   `type: 'STANDARD_EVENT_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'STANDARD_EVENT_REMINDER'` _(same as above but does not need an amount field)_

_includes all standard frequencies: 'ANNUALLY', 'MONTHLY', 'WEEKLY', 'DAILY', and 'ONCE'_

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20',
    dateEnd: '2019-12-13',
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount signifies an outflow of cash
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY, // if a MONTHLY processDate is greater than days in month, it resorts to match against the last day of the month;
                                // so 31 will always fire on the last day of the month
            processDate: '28', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account
            dateEnd: null, // null dateEnd represents an ongoing account
            modulus: 1, // not required - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - see "Modulus/Cycle" to review this advanced feature
        },
        { // rule 2
            name: 'tri-monthly stipend',
            amount: 2035.56, // positive amount signifies an inflow of cash
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '01', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account
            dateEnd: '2019-12-13'
            modulus: 3, // in conjunction with cycle, this attribute signifies every THIRD match will trigger a processing event
            cycle: 1 // the cycle of this modulus - see "Modulus/Cycle" to review this advanced feature
        },
    ],
    events: [] // future balance projections stored here
};
```

**Special Events**

-   `type: 'NTH_WEEKDAYS_OF_MONTH'` _(trigger an event process every 1st and 3rd Friday)_
-   `type: 'NTH_WEEKDAYS_OF_MONTH_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'NTH_WEEKDAYS_OF_MONTH_REMINDER'` _(same as above but does not need an amount field)_
-   `type: 'WEEKDAY_ON_DATE'` _(trigger an event process every Friday the 13th)_
-   `type: 'WEEKDAY_ON_DATE_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'WEEKDAY_ON_DATE_REMINDER'` _(same as above but does not need an amount field)_

_special events do not utilize the frequency attribute, nor modulus/cycle/syncDate_

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20',
    dateEnd: '2019-12-13',
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: NTH_WEEKDAYS_OF_MONTH, // see "Event Types" - import from constants.js
            frequency: [
                { nthId: 1, weekday: FRIDAY }, // every 1st friday
                { nthId: 3, weekday: FRIDAY }, // and 3rd friday
                { nthId: -1, weekday: SUNDAY } // a negative nthId means the last occurence of the month
        ],
            dateStart: '2019-01-01', // date to start evaluating and processing this account
            dateEnd: null // null dateEnd represents an ongoing account
        },
        { // rule 2
            name: 'jasons birthday party',
            amount: -66.6,
            type: WEEKDAY_ON_DATE, // see "Event Types" - import from constants.js
            frequency: FRIDAY,
            processDate: '13',
            dateStart: '2019-01-01',
            dateEnd: null
        }
    ],
    events: [] // future balance projections stored here
};
```

## Adjustments

**Special Adjustments**

-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS'` _(delay processing after specific weekdays)_
-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES'` _(delay processing after specific dates of the month)_
-   `type: 'ADJUST_AMOUNT_ON_THESE_DATES'` _(add/subtract to/from the amount on a very specific date)_

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20',
    dateEnd: '2019-12-13',
    rules: [
        { // rule 1
            name: 'fortress mortgage',
            amount: -2357.11,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            dateStart: '2019-01-01', // date to start evaluating and processing this account
            dateEnd: null, // null dateEnd represents an ongoing account
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            modulus: 1, // not required - see "Modulus/Cycle" to review this advanced feature
            cycle: 1, // not required - see "Modulus/Cycle" to review this advanced feature
            specialAdjustments: [
                { 
                    type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
                    weekdays: [SATURDAY, SUNDAY] 
                }
            ]
        },
        { // rule 2
            name: 'le cinema',
            amount: -23.57,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: 0, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            dateStart: '2019-01-01',
            dateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1,
            syncDate: '2019-08-12', // specific to "Modulus/Cycle" - read that section for instructions,
            specialAdjustments: [
                {
                    type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
                    dates: ['2019-07-04', '2019-12-25'], // if a processing date falls on one of these dates it rolls over them
                    weekdays: [SATURDAY, SUNDAY] // weekdays are optional
                }
            ]
        },
        { // rule 3
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: NTH_WEEKDAYS_OF_MONTH, // see "Event Types" - import from constants.js
            frequency: [
                { nthId: 1, weekday: FRIDAY }, // every 1st friday
                { nthId: 3, weekday: FRIDAY }, // and 3rd friday
                { nthId: -1, weekday: SUNDAY } // a negative nthId means the last occurence of the month
        ],
            dateStart: '2019-01-01', // date to start evaluating and processing this account
            dateEnd: null, // null dateEnd represents an ongoing account
            specialAdjustments: [
                { 
                    type: ADJUST_AMOUNT_ON_THESE_DATES,
                    dates: [
                        '2019-09-17', 
                        '2019-12-25'
                    ],
                    amounts: [
                        223.00,
                        271.00
                    ] // dates and amounts are parallel arrays
                }
            ]
        },
    ],
    events: [] // future balance projections stored here
};fs
```

## Modulus/Cycle _(only for STANDARD_EVENT)_

In the code block below, the 'monthly bitcoin' account/rule has a modulus of 3 and a cycle of 1. In this context, the event will occur
every third trigger of the frequency (in this case every third occurrence of the 30th - or every three months on the 30th). The cycle represents
the current phase towards the modulus (in this case it represents the 1st month out of the 3 total modulus cycles). Adding a syncDate attribute (as seen in the 'shenanigans' account/rule) can make your life easier by syncing the appropriate cycle/modulus phase to a specific date (either forwards or backwards).
By syncing a cycle of 1 within a modulus of 2 on a syncDate of '2019-08-12' you are "syncing" that specific phase of the 1/2 cycle to that date (cycling backward or forward depending on whether the syncDate is in the past or the future). This will keep that account/rule moduluating as you expect without any further adjustments.


```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20', // always required
    dateEnd: '2019-12-13', // required except when using the STANDARD_EVENT with a frequency of ONCE
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account
            dateEnd: null, // null dateEnd represents an ongoing account
            modulus: 3, // not required - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - see "Modulus/Cycle" to review this advanced feature
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            dateStart: '2019-01-01',
            dateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1,
            syncDate: '2019-08-12' // specific to "Modulus/Cycle" - read that section for instructions
        }
    ],
    events: [] // future balance projections stored here
};
```

## Exclusions

Exclusions will skip an event trigger entirely. 
_(When making use of the modulus/cycle operators on STANDARD_EVENT, exclusion hits will still cycle the modulus)_


```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2019-03-20', // always required
    dateEnd: '2019-12-13', // required except when using the STANDARD_EVENT with a frequency of ONCE
    rules: [
        { // rule 1
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            dateStart: '2019-01-01',
            dateEnd: null,
            exclusions: { // (exclusion hits will still cycle the modulus for STANDARD_EVENT)
                weekdays: [SATURDAY, SUNDAY], // excluding these weekdays
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // exluding these specific dates
            }
        }
    ],
    events: [] // future balance projections stored here
};
```

## Terminal

**Logging Results to the Command-Line**

```javascript
// passing error will log it to the console and bypass all other terminal functionality
terminal({ danielSan, terminalOptions, error });
```

**Terminal Type Options**

-   `type: 'STANDARD_TERMINAL_OUTPUT'` \_(standard command-line functionality)\_
-   `type: 'DISPLAY_CRITICAL_SNAPSHOTS'` \_(display only the critical snapshots)\_
-   `type: 'DISPLAY_EVENTS'` \_(display only the events, nothing fancy)\_
-   `type: 'DISPLAY_EVENTS_BY_GROUPS'` \_(passing searchValues: ['Group1', 'Group2'] will search against the optional group property)\_
-   `type: 'DISPLAY_EVENTS_BY_NAMES'` \_(passing searchValues: ['Name1', 'Name2'] will search against the name property)\_
-   `type: 'DISPLAY_EVENTS_BY_TYPE'` \_(passing searchValues: ['STANDARD_EVENT', 'NTH_WEEKDAYS_OF_MONTH'] will search against the type property)\_
-   `type: 'DISPLAY_IMPORTANT_EVENTS'` \_(display events with the optional attribute important: true)\_
-   `type: 'DISPLAY_TIME_EVENTS'` \_(display events with the optional attribute timeStart)\_
-   `type: 'DISPLAY_ROUTINE_EVENTS'` \_(display events that contain 'ROUTINE' somewhere in the string of the type field)\_
-   `type: 'DISPLAY_REMINDER_EVENTS'` \_(display events that contain 'REMINDER' somewhere in the string of the type field)\_
-   `type: 'DISPLAY_RULES_TO_RETIRE'` \_(displays obsolete rules to retire but only works if you have not already executed findBalance)\_

**Terminal Mode Options**

-   `mode: 'CONCISE'` \_(minimal output)\_
-   `mode: 'VERBOSE'` \_(maximum output)\_

**Critical Snapshots**

Passing a criticalThreshold property will log snapshots to the command-line when the endBalance is less than the criticalThreshold, for STANDARD_TERMINAL_OUTPUT and DISPLAY_CRITICAL_SNAPSHOTS.

**Search Values**

searchValues: [string1, string2, string3] is used for the DISPLAY_EVENTS_BY_* terminal types. Case-Sensitive!

**Terminal Option Configuration Example**

```javascript
    const terminalOptions = {
        type: STANDARD_TERMINAL_OUTPUT,
        mode: CONCISE,
        criticalThreshold: 577.00,
        // the formatting object is optional as the following values are defaulted for you which will format amount, beginBalance, and endBalance in mode: CONCISE
        formatting: {
            minIntegerDigits: 1,
            minDecimalDigits: 2,
            maxDecimalDigits: 2,
            locale: 'en-US',
            style: 'currency', // change to 'decimal' to remove the prepended currency symbol if using the default formattingFunction
            currency: 'USD'
        } // in addition, you can also pass formattingFunction into the formatting object above and all of the above parameters will be passed into that function call for you
    };
```

**An Example Assuming Rules and Terminal Options are Defined**

```javascript
const waxOn = require('./rules'); // defined by user as const { rules = {} } = waxOn (so we can use the word waxOn)
const findBalance = require('daniel-san');
const terminal = require('daniel-san/terminal');

const eventResults = findBalance(waxOn.danielSan);
if (eventResults.err) {
    if (terminalOptions) { 
        terminal({ error: eventResults });
    }
} else {
    if {
        (terminalOptions) terminal({ danielSan: eventResults.danielSan, terminalOptions: terminalOptions });
    }
}
```

## More Useful Features

**Additional Attributes**

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null,
    dateStart: '2019-03-20',
    dateEnd: '2019-12-13',
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            group: 'investments' // optional: assign a group category and filter the results with DISPLAY_EVENTS_BY_GROUPS
            amount: -79.83, 
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            processDate: '30',
            timeStart: '09:11am', // optional: assigning a timeStart attribute will order the event appropriately
            sortPriority: 25,   // optional: forces higher sort priority for event operations, the lower the sortPriority value, 
                                // the sooner it is applied in the event sequence, (thisDate and timeStart take precedence over sortPriority)
            notes: 'some message to your future self', // optional
            important: true, // optional: assign important: true and filter the results with DISPLAY_IMPORTANT_EVENTS
            dateStart: '2019-01-01'
            dateEnd: null,
            modulus: 1,
            cycle: 1 
        }
    ],
    events: [] // future balance projections stored here
};
```

**Useful Functions**

```javascript
const {     
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring } = require('daniel-san/analytics');

// see the source code for real example cases of the following exposed funtions
// there are also useful functions in the utility directory
const criticalSnapshots = findCriticalSnapshots({ danielSan, terminalOptions }); // uses the criticalThreshold field
const rulesToRetire = findRulesToRetire({ danielSan }); // finds rules with a dateEnd lower than the dateStart value for the projection
const eventsWithProperty = findEventsWithProperty({ events: danielSan.events, propertyKey }); // eg. propertyKey: 'timeStart'
const eventsWithValues = findEventsByPropertyKeyAndValues({ events: danielSan.events, propertyKey, searchValues }); // eg. propertyKey: 'group', searchValues: ['Group 1', 'Group 2']
const eventsContainingSubstringInField = findEventsWithPropertyKeyContainingSubstring({ events: danielSan.events, propertyKey, substring }); // eg. propertyKey: 'type', substring: 'ROUTINE'
```

## Constants

**Constants Available For Import**

```javascript
const { 
    STANDARD_EVENT,
    STANDARD_EVENT_ROUTINE,
    STANDARD_EVENT_REMINDER,
    NTH_WEEKDAYS_OF_MONTH,
    NTH_WEEKDAYS_OF_MONTH_ROUTINE,
    NTH_WEEKDAYS_OF_MONTH_REMINDER,
    WEEKDAY_ON_DATE,
    WEEKDAY_ON_DATE_ROUTINE,
    WEEKDAY_ON_DATE_REMINDER,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
    ADJUST_AMOUNT_ON_THESE_DATES,
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAILY,
    ONCE,
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    STANDARD_TERMINAL_OUTPUT,
    VERBOSE,
    CONCISE,
    DISPLAY_EVENTS_BY_GROUPS,
    DISPLAY_EVENTS_BY_NAMES,
    DISPLAY_EVENTS_BY_TYPES,
    DISPLAY_EVENTS,
    DISPLAY_CRITICAL_SNAPSHOTS,
    DISPLAY_IMPORTANT_EVENTS,
    DISPLAY_TIME_EVENTS,
    DISPLAY_ROUTINE_EVENTS,
    DISPLAY_REMINDER_EVENTS,
    DISPLAY_RULES_TO_RETIRE
} = require('daniel-san/constants');
```
