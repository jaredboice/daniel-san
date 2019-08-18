# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Documentation

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU
(use this address until 2022)

## Starter Kit
click [here](https://github.com/jaredboice/daniel-san-starter-kit "Daniel-San-Starter-Kit")

## Description

**Daniel-San** is a node-based budget-projection engine that helps your finances find balance.  The program features multi-currency conversion, multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. And special adjustments allow the movement of process-dates around holidays and weekends via prepay or postpay. The user can create reminder/routine rules for events that won't contribute to the endBalance calculation. And beyond that, daniel-san is completely customizable. Create your own custom properties that you track on your own. Breathe in through nose, out the mouth. Wax on, wax off. Don't forget to breathe, very important.

## Breaking Change in v3.0
In v3.0, the currencyConversion function parameters have changed from currentSymbol and futureSymbol to inputSymbol and outputSymbol, respectively. Because naming things is hard.

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
    dateStart: '2019-03-20', // always required - inclusive (dateStart is included in the budget projection)
    dateEnd: '2019-12-13', // required except when using the STANDARD_EVENT with a frequency of ONCE - inclusive (dateEnd is included in the budget projection)
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account, if there is no start date, daniel-san will try to determine the first process date
            dateEnd: null, // null dateEnd represents an ongoing account
            modulus: 1, // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
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
            cycle: 1
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

_special events do not utilize the modulus/cycle/syncDate attributes_

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

-   `type: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS'` _(prepay: move processing before specific weekdays)_
-   `type: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES'` _(prepay: move processing before specific dates of the month)_
-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS'` _(postpay: delay processing after specific weekdays)_
-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES'` _(postpay: delay processing after specific dates of the month)_
-   `type: 'ADJUST_AMOUNT_ON_THESE_DATES'` _(add/subtract to/from the amount on a specific date)_

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
                { // the moving of process dates should generally come last in the array of adjustments
                    type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS, // to prepay before the specified days, use MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS
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
            specialAdjustments: [
                { // the moving of process dates should generally come last in the array of adjustments
                    type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES, // to prepay before the specified dates, use MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES
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

**Custom BIWEEKLY / BIMONTHLY Event Types**

In the code block below, the 'monthly bitcoin' account/rule has a modulus of 3 and a cycle of 1. In this context, the event will occur
every third trigger of the frequency (in this case every third occurrence of the 30th - or every three months on the 30th). The cycle represents
the current phase towards the modulus (in this case it represents the 1st month out of the 3 total modulus cycles). The cycle fires on the modulus, and then it loops back around to 1.
If your cycle/modulus isn't getting expected results, try modifying the cycle (a syncDate can also modify results as explained below). If you are confused, it will make sense after trying a couple different settings.

Adding a syncDate attribute (as seen in the 'shenanigans' account/rule) can make your life easier by syncing the appropriate cycle/modulus phase to a specific process execution date in the past. For example, by syncing a cycle of 2 within a modulus of 2 on a syncDate of '2019-08-12' you are "syncing" that specific phase of the 2/2 cycle to that date (cycling forward into the future). So whatever the cycle value is on that syncDate will be locked in its position at that time and that will dictate how the cycle will moduluate into the future. This will keep that account/rule moduluating as you expect without any further adjustments ever needed. However, updating the syncDate every so often will increase performance since this feature requires more computation.  

Adding a dateStart on the rule object will nullify the syncDate if the dateStart property is in the future. If you want to "sync" the starting date for the cycle in the future (after the start date of the projections) then use the dateStart attribute on the rule instead of a syncDate. When that same dateStart is eventually found to be less than the start date of the projections (due to manually moving the global start date forward), that dateStart on the rule object will become the new syncDate.


```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    dateStart: '2020-09-17', // always required
    dateEnd: '2019-12-13', // required except when using the STANDARD_EVENT with a frequency of ONCE
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            dateStart: '2019-01-01' // date to start evaluating and processing this account
            // since it is before the global date start of all the projections, the cycle will start on 2019-09-17
            dateEnd: null, // null dateEnd represents an ongoing account
            modulus: 3,
            cycle: 1
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            syncDate: '2019-08-12',
            dateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1
        }
    ],
    events: [] // future balance projections stored here
};
```

## Exclusions

Exclusions will skip an event trigger entirely. If an exclusion is triggered, not even special adjustments will fire as exclusions precede them.
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

## Multi-Currency

**Currency Props**

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null,
    dateStart: '2019-03-20',
    dateEnd: '2019-12-13',
    currencySymbol: 'USD', // the PRIMARY-OUTPUT currency symbol that everything will be converted to, it represetns the outputSymbol parameter in the currencyConversion function
    // (when using the terminalOptions, the currencySymbol parameter should be exact/case-sensitive as respected by javascripts built-in toLocaleString function - via the Intl api)
    currencyConversion: ({ amount, inputSymbol, outputSymbol }) => {
        // a global currency conversion function that will return the converted amount
        // the amount parameter represents the rule amount (as defined below for each provided rule)
        // the inputSymbol parameter here represents the currencySymbol property field from the rule
        // outputSymbol represents the output currency you will be converting to (the primary-output USD value above)
        // even if you do not add a currencyConversion function, a default function is added to the danielSan object for you 
        // (so a currencyConversion function is used in every calculation regardless)
        // the default currencyConversion returns the same amount that is passed in
       const UsdSymbolEnum = {
           'USD': 1,   // in this case, USD represents the root field of this usd enum so its conversion factor should be 1, since 1 USD is worth 1 USD
           'EUR': 0.88, // 1 USD is worth 0.88 EUR
           'CNY': 6.75 // 1 USD is worth 6.75 CNY
       };

       const EurSymbolEnum = {
           'EUR': 1,
           'USD': 1.14,
           'CNY': 0.15
       };
       // you may have a need for multiple switch-case rules (and associated  enums) that execute based on different primary-output currency symbols
       // eg. when switching your primary-output currency symbol to some other symbol, (as shown above the currencyConversion function) 
       // so for each possible primary-output, you need to define different enums for potential output and/or input symbol (notice the EUR case example below)
       switch (outputSymbol) {
       case 'USD': // since our primary-output is USD, this case will convert the rule amount symbol (CNY) to USD
           return amount * (UsdSymbolEnum[inputSymbol] || 1); // defensive programming example in cases when inputSymbol is null/undefined
       case 'EUR': // this case would only execute if you changed your primary-output symbol to EUR
           return amount * (EurSymbolEnum[inputSymbol] || 1);
       default:
           return amount;
       }
       // since this function provides you will all the necessary parameters, 
       // you could of course create your currencyConversion function however you want as long as it computes and returns accurate results
       // if you are using an api call to get real time figures for the enums prior to running your projections, 
       // you could just define the currencyConversion function dynamically at runtime
   },
    rules: [
        { // rule 1
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            currencySymbol: 'CNY' // in this context, CNY will be passed as the currentSumbol argument in the currencyConversion function and get converted to USD (the primary-output symbol)
            dateStart: '2019-01-01',
            dateEnd: null,
        }
    ],
    events: [] // future balance projections stored here
};
```

## Terminal

**Logging Results to the Command-Line**

```javascript
// passing a non-null value for error will log it to the console and bypass all other terminal functionality
terminal({ danielSan, terminalOptions, error });
```

**Terminal Type Options**

-   `type: 'DISPLAY_EVENTS'` _(display only the events, nothing fancy, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_DISCARDED_EVENTS'` _(when special adjustments move events beyond the dateStart and dateEnd range, they can be displayed with this terminal type )_
-   `type: 'DISPLAY_CRITICAL_SNAPSHOTS'` _(display only the critical snapshots below a criticalThreshold by passing something like criticalThreshold: 150.00)_
-   `type: 'STANDARD_TERMINAL_OUTPUT'` _(the default command-line functionality, will output discarded events if they exist, and critical snapshots if passed a criticalThreshold)_
-   `type: 'DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS'` _(displays the sum of all positive event flows, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS'` _(displays the sum of all negative event flows, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS'` _(pass selectionAmount: 10 to display the top 10 highest endBalance values, ordered by value)_
-   `type: 'DISPLAY_LEAST_END_BALANCE_SNAPSHOTS'` _(pass selectionAmount: 10 to display the 10 lowest endBalance values, ordered by value)_
-   `type: 'DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT'` _(pass maxAmount: 1000 to display all the endBalance values greater than 1000)_
-   `type: 'DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT'` _(pass minAmount: 100 to display all the endBalance values less than 1000)_
-   `type: 'DISPLAY_EVENTS_BY_GROUP'` _(passing searchValues: ['Group1', 'Group2'] into terminalOptions will search against the optional group property)_
-   `type: 'DISPLAY_EVENTS_BY_NAME'` _(passing searchValues: ['Name1', 'Name2'] will search against the name property)_
-   `type: 'DISPLAY_EVENTS_BY_TYPE'` _(passing searchValues: ['STANDARD_EVENT', 'NTH_WEEKDAYS_OF_MONTH'] will search against the type property)_
-   `type: 'DISPLAY_IMPORTANT_EVENTS'` _(display events with the optional attribute important: true)_
-   `type: 'DISPLAY_TIME_EVENTS'` _(display events with the optional attribute timeStart: '09:30pm')_
-   `type: 'DISPLAY_ROUTINE_EVENTS'` _(display events that contain 'ROUTINE' somewhere in the string of the type field)_
-   `type: 'DISPLAY_REMINDER_EVENTS'` _(display events that contain 'REMINDER' somewhere in the string of the type field)_
-   `type: 'DISPLAY_RULES_TO_RETIRE'` _(displays obsolete rules to retire - but only works on your original danielSan object. It does not work if you pass it the danielSan object that is returned by findBalance after proecessing - since findBalance retires rules [with obsolete dateEnd dates] automatically during the projection phase)_

**Terminal Mode Options**

-   `mode: 'SHY'` _(minimal output)_
-   `mode: 'CONCISE'` _(standard output)_
-   `mode: 'VERBOSE'` _(maximum output - allows output for custom properties)_

**Critical Snapshots**

Passing a criticalThreshold property will log snapshots to the command-line when the endBalance is less than the criticalThreshold, for STANDARD_TERMINAL_OUTPUT and DISPLAY_CRITICAL_SNAPSHOTS.

**Search Values**

searchValues: [string1, string2, string3] is used for the DISPLAY_EVENTS_BY_* terminal types. Case-Sensitive!

**Formatting**

See the terminal option configuration example below. If passing a custom formatting function, it must take the form shown below. 
The default formattingFunction utilizes javascripts built-in toLocaleString() function - via the Intl api

```javascript
const decimalFormatterCustom = (number, { minIntegerDigits, minDecimalDigits, maxDecimalDigits, locale, style, currency }) => { /* return formatted */ };
const terminalOptions = {
        type: STANDARD_TERMINAL_OUTPUT,
        mode: CONCISE,
        criticalThreshold: 577.00,
        // the formatting object is optional as the following values are defaulted for you
        // which will format amount, beginBalance, and endBalance
        formatting: {
            formattingFunction: decimalFormatterCustom
            minIntegerDigits: 1,
            minDecimalDigits: 2,
            maxDecimalDigits: 2,
            locale: 'en-US',
            style: 'currency', // change to 'decimal' to remove the prepended currency symbol (if using the default formattingFunction)
            currency: 'USD'
        }
```

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
            group: 'investments' // optional: assign a group category and filter the results with DISPLAY_EVENTS_BY_GROUP
            amount: -79.83, 
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            processDate: '30',
            timeStart: '09:11am', // optional: assigning a timeStart attribute will order the event appropriately
            sortPriority: 25,   // optional: forces higher sort priority for event operations, the lower the sortPriority value, 
                                // the sooner it is applied in the event sequence, (eventDate and timeStart take precedence over sortPriority)
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
const criticalSnapshots = findCriticalSnapshots({ danielSan, criticalThreshold }); // uses the criticalThreshold field
const seventHighestValues = findGreatestValueSnapshots({ collection: danielSan.events, propertyKey: 'endBalance', selectionAmount: 7, reverse = false });
const sevenLowestValues = findGreatestValueSnapshots({ collection: danielSan.events, propertyKey: 'endBalance', selectionAmount: 7, reverse = true }); // reverse sort gets the lowest values
const bigSnapshots = findSnapshotsGreaterThanAmount({ collection: danielSan.events, amount: 3000, propertyKey: 'endBalance' });
const smallSnapshots = findSnapshotsLessThanAmount({ collection: danielSan.rules, amount: 0, propertyKey: 'convertedAmount' }); 
const rulesToRetire = findRulesToRetire({ danielSan }); // finds rules with a dateEnd lower than the dateStart value of the main danielSan tree trunk.
// rules are auto retired during the budget projection process however so if you want to find rules that you need to retire/
// then make sure you perform it on the original danielSan and not the one returned from findBalance()
const eventsWithProperty = findEventsWithProperty({ events: danielSan.events, propertyKey: 'youCouldEvenAddACustomProperty' }); // eg. propertyKey: 'timeStart'
const eventsWithValues = findEventsByPropertyKeyAndValues({ events: danielSan.events, propertyKey: 'name', searchValues: ['groceries', 'movie tickets', 'concert tickets'] }); // eg. propertyKey: 'group', searchValues: ['Group 1', 'Group 2']
const eventsContainingSubstringInField = findEventsWithPropertyKeyContainingSubstring({ events: danielSan.events, propertyKey: 'name', substring: 'tickets' }); // eg. propertyKey: 'type', substring: 'ROUTINE'
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
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES,
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
    VERBOSE,
    CONCISE,
    SHY,
    STANDARD_TERMINAL_OUTPUT,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS
    DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT,
    DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT,
    DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS,
    DISPLAY_LEAST_END_BALANCE_SNAPSHOTS,
    DISPLAY_EVENTS_BY_GROUP,
    DISPLAY_EVENTS_BY_NAME,
    DISPLAY_EVENTS_BY_TYPE,
    DISPLAY_EVENTS,
    DISPLAY_CRITICAL_SNAPSHOTS,
    DISPLAY_DISCARDED_EVENTS,
    DISPLAY_IMPORTANT_EVENTS,
    DISPLAY_TIME_EVENTS,
    DISPLAY_ROUTINE_EVENTS,
    DISPLAY_REMINDER_EVENTS,
    DISPLAY_RULES_TO_RETIRE,
} = require('daniel-san/constants');
```
