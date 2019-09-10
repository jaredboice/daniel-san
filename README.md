# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Documentation

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU

(use this address until 2022)

## Starter Kit

click [here](https://github.com/jaredboice/daniel-san-starter-kit 'Daniel-San-Starter-Kit')

## Description

maximize your potential with **Daniel-San**, a node-based budget-projection engine that helps your routines and finances find balance. The program features multi-currency conversion capability and multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. Timezones help to keep your enterprise in sync, while special adjustments allow the movement of process-dates around holidays and weekends via prepay or postpay. Dynamic rule modification allows the injection of growth-and-decay functions. Additionally, the user can create reminder/routine rules for events that won't contribute to the balanceEnding calculation. Extend rule/event properties by adding custom fields. Breathe in through nose, out the mouth. Wax on, wax off. Don't forget to breathe, very important.

## Breaking Change in v10.0.0
all non-rule configuration for the danielSan object have been moved into the new "config" field.

## Breaking Change in v8.0.0

In keeping with the trend of adding clarity and consistency to variable names, the following properties have been changed accordingly. beginBalance is now balanceBeginning. endBalance is now balanceEnding. And syncDate is now anchorSyncDate.

## Breaking Change in v8.0.0

As of v8.0.0, to make way for a cleaner distinction between event dates and effective dates, dateStart and dateEnd at the top-level of the danielSan master control unit are now effectiveDateStart and effectiveDateEnd, respectively. And the eventDate on the event level has been changed to dateStart as a cleaner approach to applying time spans to events.

## Breaking Change in v3.0.0

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

**Defining Rules**

Plase note that the format of property values are strict. For example, Years are always strings in the format YYYY, months are always MM, and days are always DD. Weekdays are an integer between 0-6, and times are always strings in the format hh:mm:am or hh:mm:pm (case sensitive on the am and pm).

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03, // always required / the final balanceBeginning and balanceEnding results will be added to the root of this danielSan bonsai-tree
        effectiveDateStart: '2019-03-20', // always required - inclusive (effectiveDateStart is included in the budget projection)
        effectiveDateEnd: '2019-12-13', // always required - inclusive (effectiveDateEnd is included in the budget projection)
        timeStart: null, // optional: '09:00am'
        timeEnd: null // optional: '05:00pm'
    },
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js / see list of importable constants at the bottom of this readme
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            effectiveDateStart: '2019-01-01', // date to start evaluating and processing this account, if there is no start date, daniel-san will determine the first process date
            effectiveDateEnd: null, // null effectiveDateEnd represents an ongoing account
            modulus: 1, // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null, // null effectiveDateEnd represents an ongoing account
            modulus: 2, // See "Modulus/Cycle" to review this advanced feature
            cycle: 1 // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
        },
        { // rule 3
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            exclusions: { // exclusion matches will still modulate the cycle when using the modulus/cycle feature
                weekdays: [SATURDAY, SUNDAY], // excluding these weekdays (you could have also just imported the WEEKENDS constant and spreaded it within the array here)
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // exluding these specific dates (always in this exact string format: YYYY-MM-DD)
            }
        },
        { // rule 4
            name: 'fitness routine',
            type: STANDARD_EVENT_ROUTINE, // no amount field needed
            frequency: WEEKLY,
            processDate: SATURDAY,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            note: '20 minutes of jogging, 20 minutes of cycling, free weights'
        },
        { // rule 5
            name: 'new years party arrangements',
            type: STANDARD_EVENT_REMINDER, // no amount field needed
            frequency: DAILY, // no processDate needed for DAILY events
            effectiveDateStart: '2020-12-13',
            effectiveDateEnd: '2020-12-21', // remind me daily until the 21st
            note: 'finalize arrangements for the party'
        }
    ],
    events: [] // future balance projections stored here and a balanceEnding field is assigned to each event
};

const craneKick = findBalance(danielSan);
```

**Execution Example**

```javascript
// after executing findBalance with danielSan, craneKick will embody the danielSan object with the newly produced events, 
// and it will contain an object called "err" if there are errors during execution
const craneKick = findBalance(danielSan);
```

## Event Types

**Standard Events**

-   `type: 'STANDARD_EVENT'` _(see "Modulus/Cycle" to review an advanced feature)_
-   `type: 'STANDARD_EVENT_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'STANDARD_EVENT_REMINDER'` _(same as above but does not need an amount field, solely for semantic differentiation)_

_includes all standard frequencies: 'ONCE', 'ANNUALLY', 'MONTHLY', 'WEEKLY', and 'DAILY'_

the processDate formats for each frequency, in the same order, are:

ONCE - '2020-01-29',  
ANNUALLY - '01-29',  
MONTHLY - '29'  
WEEKLY - an integer between 0-6 for weekdays. constants for the weekday integers can be imported  
DAILY - needs no processDate

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: STANDARD_EVENT, 
            frequency: MONTHLY, // if a MONTHLY processDate is greater than days in month, it resorts to match against the last day of the month;
                                // so 31 will always execute on the last day of the month
            processDate: '28',
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null
        },
        { // rule 2
            name: 'tri-monthly stipend',
            amount: 2035.56, // positive amount signifies an inflow of cash
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            processDate: '01',
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: '2019-12-13'
            modulus: 3, // this attribute signifies every THIRD match will trigger a processing event
            cycle: 1 // the current cycle of this modulation phase - see "Modulus/Cycle" to review this advanced feature
        },
    ],
    events: [] // future balance projections stored here
};
```

**28 Day Rule**

For MONTHLY frequencies of STANDARD_EVENTS, any rule with a processDate greater than '28' will check to see if it is an actual date for that month. If it is not, it will use the last date of the month instead, leap years included.

**Date Arrays**

STANDARD_EVENTS also accept date arrays for processDate. This applies to all possible frequency types of STANDARD_EVENTS, including ONCE. The format of the date elements must all match the date format for that particular frequency. While it would seem like overkill to use the modulus/cycle feature with date arrays, it is certainly possible to do. Be aware that, when using date arrays, the program will look for any possible match within the array. Any match will modulate the cycle. So order of the elements does not matter:

eg. frequency === ANNUALLY process  
Date: ['12-24', '12-25', '01-01']

**Special Events**

-   `type: 'NTH_WEEKDAYS_OF_MONTH'` _(trigger an event process every 1st and 3rd Friday)_
-   `type: 'NTH_WEEKDAYS_OF_MONTH_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'NTH_WEEKDAYS_OF_MONTH_REMINDER'` _(same as above but does not need an amount field, solely for semantic differentiation)_
-   `type: 'WEEKDAY_ON_DATE'` _(trigger an event process every Friday the 13th)_
-   `type: 'WEEKDAY_ON_DATE_ROUTINE'` _(same as above but does not need an amount field)_
-   `type: 'WEEKDAY_ON_DATE_REMINDER'` _(same as above but does not need an amount field, solely for semantic differentiation)_

_special events can also utilize the modulus/cycle/anchorSyncDate attributes, however this feature is likely rarely needed with special events_

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        {
            // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: NTH_WEEKDAYS_OF_MONTH, // see "Event Types" - import from constants.js
            frequency: [
                { rank: 1, weekday: FRIDAY }, // every 1st friday
                { rank: 3, weekday: FRIDAY }, // and 3rd friday
                { rank: -1, weekday: SUNDAY } // a negative rank means the last occurence of the month
            ],
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null
        },
        {
            // rule 2
            name: 'jasons birthday party',
            amount: -66.6,
            type: WEEKDAY_ON_DATE, // see "Event Types" - import from constants.js
            frequency: [
                { processDate: '13', weekday: FRIDAY } // process this frequency element every friday the 13th, add more elements as desired
            ],
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null
        }
    ],
    events: [] // future balance projections stored here
};
```

## Adjustments

**Special Adjustments**

When using time zones or multi-currency conversions, special adjustments take place in the context of the rule by default. See the Time Zone section for more information.

-   `type: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS'` _(prepay: move processing before specific weekdays)_
-   `type: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES' or simply 'PRE_PAY'` _(prepay: move processing before specific dates of the month with an optional weekdays attribute)_
-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS'` _(postpay: delay processing after specific weekdays)_
-   `type: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES' or simply 'POST_PAY'` _(postpay: delay processing after specific dates of the month with an optional weekdays attribute)_
-   `type: 'ADJUST_AMOUNT_ON_THESE_DATES' or simply 'ADJUST_AMOUNT'` _(add/subtract to/from the amount on a specific date)_

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        {
            // rule 1
            name: 'le cinema',
            amount: -23.57,
            type: STANDARD_EVENT,
            frequency: WEEKLY,
            processDate: 0, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported, such as FRIDAY
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            specialAdjustments: [
                {
                    // the moving of process dates should generally come last in the array of adjustments
                    // the below type is synonymous with MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES
                    type: PRE_PAY, // to postpay after the specified dates, use POST_PAY or the equivalent constant, MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES
                    dates: ['2019-07-04', '2019-12-25'], // if a processing date falls on one of these dates it will roll back to precede it
                    weekdays: [SATURDAY, SUNDAY] // weekdays are optional for both PRE_PAY and POST_PAY. If falling on a provided weekday, it will roll back to precede it
                }
            ]
        },
        {
            // rule 2, this specific specialAdjustment example focuses on weekdays ONLY
            name: 'fortress mortgage',
            amount: -2357.11,
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            specialAdjustments: [
                {
                    // the moving of process dates should generally come last in the array of adjustments
                    type: MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS, // to prepay before the specified days, use MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS
                    weekdays: [SATURDAY, SUNDAY]
                }
            ]
        },
        {
            // rule 3
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: NTH_WEEKDAYS_OF_MONTH, // see "Event Types" - import from constants.js
            frequency: [
                { rank: 1, weekday: FRIDAY }, // every 1st friday
                { rank: 3, weekday: FRIDAY }, // and 3rd friday
                { rank: -1, weekday: SUNDAY } // a negative rank means the last occurence of the month
            ],
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            specialAdjustments: [
                {
                    type: ADJUST_AMOUNT,
                    dates: ['2019-09-17', '2019-12-25'],
                    amounts: [223.0, 271.0] // dates and amounts are parallel arrays
                }
            ]
        }
    ],
    events: [] // future balance projections stored here
};
```

## Modulus/Cycle

**Custom BIWEEKLY / BIMONTHLY Event Types**

Note: when using the Modulus/Cycle feature, you should ALWAYS set an effectiveDateStart.

In the code block below, the 'monthly bitcoin' account/rule has a modulus of 3 and a cycle of 1. In this context, the event will occur
every third trigger of the frequency (in this case every third occurrence of the 30th - or every three months on the 30th). The cycle represents
the current phase towards the modulus (in this case it represents the 1st month out of the 3 total modulus cycles). The cycle fires on the modulus, and then it loops back around to 1.
If your cycle/modulus isn't getting expected results, try modifying the cycle (an anchorSyncDate can also modify results as explained below, which is used if you are applying the modulus/cycle attributes). If you are confused, it will make sense after trying a couple different settings.

As of daniel-san version 6.1.0, adding an effectiveDateStart to any rule with modulus/cycle attributes will automatically assign that effectiveDateStart value to anchorSyncDate. So manuallly adding anchorSyncDate is no longer required. If the date is in the future, it will simply treat it as effectiveDateStart as explained below. Read on, however, to understand the functionality of anchorSyncDate.

Adding an anchorSyncDate attribute (as seen in the 'shenanigans' account/rule) can make your life easier by syncing the appropriate cycle/modulus phase to a specific process-execution "anchor" date in the past. For example, by syncing a cycle of 2 within a modulus of 2 on an anchorSyncDate of '2019-08-12' you are "syncing" that specific phase of the 2/2 cycle to that date (cycling forward into the future). So whatever the cycle value is on that anchorSyncDate will be locked in its position at that time and that will dictate how the cycle will moduluate into the future. This will keep that account/rule moduluating as you expect without any further adjustments ever needed. However, updating the anchorSyncDate every so often will increase performance since this feature requires more computation.

Adding an effectiveDateStart WITH an anchorSyncDate is redundant to daniel-san. You can, however, still start the cycle in the future. When you set an anchorSyncDate at some point in the future (after the start date of the projections) daniel-san will simply assign that value to the effectiveDateStart attribute for that rule (while assigning null to anchorSyncDate) so it will begin its forward-moving cycle at that time. When that same anchorSyncDate is eventually found to be less than the effectiveDateStart of the projections (due to manually moving the effectiveDateStart forward through the normal course of using the program), it will then be used to sync the modulation cycle to that anchor point now in the past.

The bottom line is this: if you are using modulus/cycle values of anything other than 1/1 (which would equate to normal behavior for any event), you should always have an anchorSyncDate (which you can achieve by simply setting the effectiveDateStart attribute on every rule that applies this modulus/cycle feature).

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2020-09-17',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83,
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            processDate: '30',
            effectiveDateStart: '2019-01-01', // since the effectiveDateStart is set BEFORE the config's effectiveDateStart, the cycle will start on 2019-09-17
            effectiveDateEnd: null,
            modulus: 3,
            cycle: 1
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            anchorSyncDate: '2019-08-12', // you can actually just use effectiveDateStart here, instead of anchorSyncDate, since version 6.1.0, although anchorSyncDate is still being used in the background
            effectiveDateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1
        }
    ],
    events: [] // future balance projections stored here
};
```

## Dynamic Rule Modification

**Growth and Decay Capability**

If added to a rule, the ruleModification function will execute after eaching passing day of the projection phase. While it was initially added for the capability to modify the amount field over time, you are being provided with enough parameters to do some damage if you don't know what you're doing. You get access to the full danielSan bonsai tree, the rule, and two moment dates, including the convertedDate via time zone functionality. You are also encouraged to store temporary data for calculations in the object, rule.transientData. That specific field gets deleted for you in the cleanUpEvents phase, after the completion of all event generation.

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        {
            // rule 1
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            name: 'projected revenue',
            amount: +25.0,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            ruleModification: ({ danielSan, rule, date, convertedDate }) => {
                // every SUNDAY, we expect that day of revenue to increase by 100
                // so the first SUNDAY it adds 25 to the balanceEnding field, and the next SUNDAY it adds 125, and the next, 225, etc..
                if (convertedDate.day() === 0) {
                    rule.amount += 100; // if you were modifying an expense (instead of revenue) you'd subtract from the amount field instead, for example, when anticipating greater losses
                }
            }
        }
    ],
    events: [] // future balance projections stored here
};
```

## Exclusions

Exclusions will skip an event trigger entirely. If an exclusion is triggered, not even special adjustments will fire as exclusions precede them.
_(when making use of the modulus/cycle operators, exclusion hits will still modulate the cycle)_

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
    rules: [
        {
            // rule 1
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.0,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            exclusions: {
                // (exclusion hits will still modulate the cycle for STANDARD_EVENT)
                weekdays: [SATURDAY, SUNDAY], // event triggers will exclude these weekdays
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // and exclude these specific dates
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
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13',
        currencySymbol: 'USD', // the PRIMARY-OUTPUT currency symbol that everything will be converted to, it represents the outputSymbol parameter in the currencyConversion function
        // (when using the terminalOptions, the currencySymbol parameter should be exact/case-sensitive as respected by javascripts built-in toLocaleString function - via the Intl api)
        currencyConversion: ({ amount, inputSymbol, outputSymbol }) => {
            // a global currency conversion function that will return the converted amount.
            // the amount parameter represents the rule amount (as defined below for each provided rule)
            // the inputSymbol parameter here represents the currencySymbol property field from the rule
            // outputSymbol represents the output currency you will be converting to (the primary-output USD value above, as defined in the config branch)
            // even if you do not add a currencyConversion function, a default function is added to the danielSan object for you
            // (so a currencyConversion function is used in every calculation, regardless, which by default returns the same amount passed in)
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
            // since this function provides you with all the necessary parameters,
            // you could of course create your currencyConversion function however you want as long as it computes and returns accurate results
            // if you are using an api call to get real time figures for the enums prior to running your projections,
            // you could just define the currencyConversion function dynamically at runtime
        }
    },
    rules: [
        { // rule 1
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            currencySymbol: 'CNY' // in this context, CNY will be passed as the currentSymbol argument in the currencyConversion function and get converted to USD (the primary-output symbol)
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
        }
    ],
    events: []
};
```

**Pro Tip**

When applying the ADJUST_AMOUNT specialAdjustment for rules with multi-currency data, the following property is useful:

-   `context: EVENT_SOURCE` _(applies the adjustment in the context of the original rule's currencySymbol, as if you yourself were at the event-source spending the native currency as it is defined on the rule)_

options in the above scenario include:

-   `context: EVENT_SOURCE` _(default value)_
-   `context: OBSERVER_SOURCE` _(applies the adjustment in the context of the final converted currency value via the currencySymbol in the config object)_

-all constants are available for import-

##Time

timeStart and timeEnd are optional fields for the config object. Any events that fall outside of those start and end time values will be discarded.

timeStart is optional at the rule level as well. However, in rule context, timeEnd is calculated for you, specifically when applying any of the following time-span fields (individually or combined) to a rule:

-   `spanningMinutes: 30` _(adds 30 minutes to the event timespan)_
-   `spanningHours: 3` _(adds 3 hours to the event timespan)_
-   `spanningDays: 5` _(adds 5 days to the event timespan)_

## Time Zones

**Time Zone Props**

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13',
        timeZone: 'US/Eastern', // the time zone in context of the observer that every rule will be converted to; see moment-timezone for a complete list time zones
        timeZoneType: LOCAL // LOCAL and UTC are available to be imported as constants
    },
    rules: [
        {
            // rule 1
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'international video conference',
            amount: -20.0,
            effectiveDateStart: '2019-03-20',
            effectiveDateEnd: '2019-04-01',
            timeZone: 'Europe/Paris', // see immediately below for a time zone list
            timeStart: '11:00am',
            spanningMinutes: 30
        }
    ],
    events: [] // future balance projections stored here
};
```

```javascript
// run the following for a complete list of time zones:
const moment = require('moment-timezone');
moment.tz.names().forEach(name => console.log(name);
```

**Pro Tip**

Be aware that the big difference between UTC and LOCAL is that LOCAL will convert times to compensate for Local and Civil Daylight Savings Time.

In Addition, when applying PRE_PAY and POST_PAY specialAdjustments, or exclusions to rules with time zones, the following property is useful:

-   `context: EVENT_SOURCE` _(applies the adjustment in the context of the original rule's timeZone data, as seen and interpreted at the source of the event)_

options in the above scenario include:

-   `context: EVENT_SOURCE` _(default value)_
-   `context: OBSERVER_SOURCE` _(applies the adjustment in the context of the event's final calculated time zone via the timeZone indicator in the config object)_
-   `context: BOTH` _(applies the adjustment with respect to both of the contexts mentioned above; As an example of usage, BOTH is great when you don't want a weekend or bank holiday to trigger in ANY context)_

-all of the above referenced constants are available for import-

## Terminal

**Logging Results to the Command-Line**

_note: the terminal options are executed in the context of events (not rules), with exception to DISPLAY_RULES_TO_RETIRE and DISPLAY_IRRELEVANT_RULES_

```javascript
// passing a non-null value for error will log it to the console and bypass all other terminal functionality
terminal({ danielSan, terminalOptions, error, originalDanielSan });// the originalDanielSan is useful for passing the original unmodified danielSan reference to display irrelevant or retired rules.
```

**Terminal Type Options**

-   `type: 'DISPLAY_EVENTS'` _(display only the events, nothing fancy, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_DISCARDED_EVENTS'` _(when special adjustments move events beyond the effectiveDateStart and effectiveDateEnd range, they can be displayed with this terminal type )_
-   `type: 'DISPLAY_CRITICAL_SNAPSHOTS'` _(display only the critical balanceEnding snapshots below a criticalThreshold by passing something like criticalThreshold: 150.00)_
-   `type: 'STANDARD_TERMINAL_OUTPUT'` _(the default command-line functionality, will output discarded events if they exist, and critical snapshots if passed a criticalThreshold)_
-   `type: 'DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS' or 'DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS'` _(displays the sum of all positive event flows, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS' or 'DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS'` _(displays the sum of all negative event flows, and will also display discarded events if they exist)_
-   `type: 'DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS'` _(pass selectionAmount: 10 to display the top 10 highest balanceEnding values, ordered by value)_
-   `type: 'DISPLAY_LEAST_END_BALANCE_SNAPSHOTS'` _(pass selectionAmount: 10 to display the 10 lowest balanceEnding values, ordered by value)_
-   `type: 'DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT'` _(pass maxAmount: 1000 to display all the balanceEnding values greater than 1000)_
-   `type: 'DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT'` _(pass minAmount: 100 to display all the balanceEnding values less than 1000)_
-   `type: 'DISPLAY_EVENTS_BY_GROUP'` _(passing searchValues: ['Group1', 'Group2'] into terminalOptions will search against the optional group property)_
-   `type: 'DISPLAY_EVENTS_BY_NAME'` _(passing searchValues: ['Name1', 'Name2'] will search against the name property)_
-   `type: 'DISPLAY_EVENTS_BY_TYPE'` _(passing searchValues: ['STANDARD_EVENT', 'NTH_WEEKDAYS_OF_MONTH'] will search against the type property)_
-   `type: 'DISPLAY_IMPORTANT_EVENTS'` _(display events with the optional attribute important: true)_
-   `type: 'DISPLAY_TIME_EVENTS'` _(display events with the optional attribute timeStart: '09:30pm')_
-   `type: 'DISPLAY_ROUTINE_EVENTS'` _(display events that contain 'ROUTINE' somewhere in the string of the type field)_
-   `type: 'DISPLAY_REMINDER_EVENTS'` _(display events that contain 'REMINDER' somewhere in the string of the type field)_
-   `type: 'DISPLAY_IRRELEVANT_RULES'` _(display rules that have no chance of being triggered via the current configuration - this particular terminal function works on your original danielSan object. However, when executing events as normal, a field called irrelevantRules is populated for you_
-   `type: 'DISPLAY_RULES_TO_RETIRE'` _(displays obsolete rules to retire - but only works on your original danielSan object. It does not work if you pass it the danielSan object that is returned by findBalance after proecessing -
    since findBalance retires rules [with obsolete effectiveDateEnd dates] automatically during the projection phase)_

**Terminal Mode Options**

-   `mode: 'SHY'` _(minimal output)_
-   `mode: 'CONCISE'` _(standard output)_
-   `mode: 'VERBOSE'` _(maximum output - allows output for custom properties)_

**Critical Snapshots**

Passing a criticalThreshold property will log snapshots to the command-line when the balanceEnding is less than the criticalThreshold, for STANDARD_TERMINAL_OUTPUT and DISPLAY_CRITICAL_SNAPSHOTS.

**Search Values**

searchValues: [string1, string2, string3] is used for the DISPLAY*EVENTS_BY*\* terminal types. Case-Sensitive!

**Formatting**

See the terminal option configuration example below. If passing a custom formatting function, it must take the form shown below.
The default formattingFunction utilizes javascript's built-in toLocaleString() function - via the Intl api

```javascript
const decimalFormatterCustom = (number, { minIntegerDigits, minDecimalDigits, maxDecimalDigits, locale, style, currency }) => { /* return number formatted */ };
const terminalOptions = {
    type: STANDARD_TERMINAL_OUTPUT,
    mode: CONCISE,
    criticalThreshold: 577.00,
    // the formatting object is optional as the following values are defaulted for you
    // which will format amount, balanceBeginning, and balanceEnding
    formatting: {
        formattingFunction: decimalFormatterCustom
        minIntegerDigits: 1,
        minDecimalDigits: 2,
        maxDecimalDigits: 2,
        locale: 'en-US',
        style: 'currency', // change to 'decimal' to remove the prepended currency symbol (if using the default formattingFunction)
        currency: 'USD'
    }
}
```

**Terminal Option Configuration Example**

```javascript
const terminalOptions = {
    type: STANDARD_TERMINAL_OUTPUT,
    mode: CONCISE,
    criticalThreshold: 577.0,
    // the formatting object is optional as the following values are defaulted for you
    // which will format amount, balanceBeginning, and balanceEnding in mode: CONCISE
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
const waxOn = require('./rules'); // so we can use the word waxOn
const findBalance = require('daniel-san');
const terminal = require('daniel-san/terminal');

const eventResults = findBalance(waxOn.danielSan);
terminal({ danielSan: eventResults.danielSan, terminalOptions: terminalOptions, error: eventResults.err }); // on err, the terminal's error logger will be executed instead of the event logger
```

## More Useful Features

**Additional Attributes**

```javascript
const danielSan = {
    config: {
        balanceBeginning: 1618.03,
        effectiveDateStart: '2019-03-20',
        effectiveDateEnd: '2019-12-13'
    },
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
                                // the sooner it is applied in the event sequence, (the processed event dates and timeStart take precedence over sortPriority)
            notes: 'some message to your future self', // optional
            important: true, // optional: assign important: true and filter the results with DISPLAY_IMPORTANT_EVENTS
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            modulus: 1,
            cycle: 1
        }
    ],
    events: []
};
```

**Useful Functions**

You can always use any exported function in the program by simply requiring it. However, a few such useful functions are shown below. The analytic functions, with exception to findRulesToRetire (and findIrrelevantRules which is also available), are executed on events. If using multi-currency conversion, the analysis takes place in the context of the currencySymbol in the config object.  


```javascript
const {
    findCriticalSnapshots,
    findRulesToRetire,
    findEventsWithProperty,
    findEventsByPropertyKeyAndValues,
    findEventsWithPropertyKeyContainingSubstring } = require('daniel-san/analytics');

// see the source code for real example use cases of the following exposed functions
// there are also useful functions in the utility directory
const criticalSnapshots = findCriticalSnapshots({ events: danielSan.events, criticalThreshold }); // uses the criticalThreshold field
const sevenHighestValues = findGreatestValueSnapshots({ collection: danielSan.events, propertyKey: 'balanceEnding', selectionAmount: 7, reverse = false });
const sevenLowestValues = findGreatestValueSnapshots({ collection: danielSan.events, propertyKey: 'balanceEnding', selectionAmount: 7, reverse = true }); // reverse sort gets the lowest values
const bigSnapshots = findSnapshotsGreaterThanAmount({ collection: danielSan.events, amount: 3000, propertyKey: 'balanceEnding' });
const smallSnapshots = findSnapshotsLessThanAmount({ collection: danielSan.rules, amount: 0, propertyKey: 'convertedAmount' });
const rulesToRetire = findRulesToRetire(danielSan); // finds rules with an effectiveDateEnd lower than the config's effectiveDateStart value, and rules with effectiveDateStart that are higher than the config's effectiveDateEnd.
// also adds a ruleIndex on each rule so that you can delete them from the original array if required
// rules are auto retired during the budget projection process, however, so if you want to find rules that you need to retire/
// then make sure you perform it on the original danielSan and not the resulting danielSan object that is returned from findBalance()
const eventsWithProperty = findEventsWithProperty({ events: danielSan.events, propertyKey: 'youCouldEvenAddACustomProperty' }); // eg. propertyKey: 'timeStart'
const eventsWithValues = findEventsByPropertyKeyAndValues({ events: danielSan.events, propertyKey: 'name', searchValues: ['groceries', 'movie tickets', 'concert tickets'] }); // eg. propertyKey: 'group', searchValues: ['Group 1', 'Group 2']
const eventsContainingSubstringInField = findEventsWithPropertyKeyContainingSubstring({ events: danielSan.events, propertyKey: 'name', substring: 'tickets' }); // eg. propertyKey: 'type', substring: 'ROUTINE'
```

## Constants

**Constants Available For Import**

```javascript
const {
    UTC,
    LOCAL,
    AM,
    PM,
    EVENT_SOURCE,
    OBSERVER_SOURCE,
    BOTH,
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
    PRE_PAY,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS,
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES,
    POST_PAY,
    ADJUST_AMOUNT_ON_THESE_DATES,
    ADJUST_AMOUNT,
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
    WEEKENDS, // an array containing [SATURDAY, SUNDAY]
    VERBOSE,
    CONCISE,
    SHY,
    STANDARD_TERMINAL_OUTPUT,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
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
    DISPLAY_IRRELEVANT_RULES_
} = require('daniel-san/constants');
```
