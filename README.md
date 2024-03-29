# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Documentation

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU

(use this address until 2022)

## Starter Kit

click [here](https://github.com/jaredboice/daniel-san-starter-kit 'Daniel-San-Starter-Kit')

## Description

maximize your potential with **Daniel-San**, a node-based budget-projection engine that helps your routines and finances find balance. The program features text, json, terminal and file-based reporting output, aggregates, multi-currency conversion capability and multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. Timezones help to keep your enterprise in sync, while special adjustments allow the movement of process-dates around holidays and weekends via prepay or postpay. Dynamic rule modification allows the injection of growth-and-decay functions. Additionally, the user can create reminder/routine rules for events that won't contribute to the balanceEnding calculation. Extend rule/event properties by adding custom fields. Breathe in through nose, out the mouth. Wax on, wax off. Don't forget to breathe, very important.

## Install, Import & Execute

**Install**

`npm install --save daniel-san`

**Import**

```javascript
const findBalance = require('daniel-san');
const createReport = require('daniel-san/reporting');
const { STANDARD_EVENT, MONTHLY, WEEKLY, DAILY, FRIDAY, SATURDAY, SUNDAY } = require('daniel-san/constants');
```

**Defining Rules**

Please note that the format of property values are strict. For example, Years are always strings in the format YYYY, months are always MM, and days are always DD. Weekdays are an integer between 0-6, and times are always strings in the format \[hh:mm\]am or \[hh:mm\]pm (case sensitive on the am and pm).

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
        {
            // rule 1
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
        {
            // rule 2
            name: 'shenanigans',
            amount: -97.0,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 (Number) with 0 representing Sunday - weekday constants are available to be imported
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null, // null effectiveDateEnd represents an ongoing account
            modulus: 2, // See "Modulus/Cycle" to review this advanced feature
            cycle: 1 // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
        },
        {
            // rule 3
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.0,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            exclusions: {
                // exclusion matches will still modulate the cycle when using the modulus/cycle feature
                weekdays: [SATURDAY, SUNDAY], // excluding these weekdays (you could have also just imported the WEEKENDS constant and spreaded it within the array here)
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // exluding these specific dates (always in this exact string format: YYYY-MM-DD)
            }
        },
        {
            // rule 4
            name: 'fitness routine',
            type: STANDARD_EVENT_ROUTINE, // no amount field needed
            frequency: WEEKLY,
            processDate: SATURDAY,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            note: '20 minutes of jogging, 20 minutes of cycling, free weights'
        },
        {
            // rule 5
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

Note: when using the Modulus/Cycle feature, you should ALWAYS set an effectiveDateStart and it should fall on an expected trigger date.

In the code block below, the 'monthly bitcoin' account/rule has a modulus of 3 and a cycle of 1. In this context, the event will occur
every third trigger of the frequency (in this case every third occurrence of the 30th - or every three months on the 30th). The cycle represents
the current phase towards the modulus (in this case it represents the 1st month out of the 3 total modulus cycles). The cycle fires on the modulus, and then it loops back around to 1.
If your cycle/modulus isn't getting expected results, try modifying the cycle (an anchorSyncDate can also modify results as explained below, which is used if you are applying the modulus/cycle attributes). If you are confused, it will make sense after trying a couple different settings.

As of daniel-san version 6.1.0, adding an effectiveDateStart to any rule with modulus/cycle attributes will automatically assign that effectiveDateStart value to anchorSyncDate. So manuallly adding anchorSyncDate is no longer required. If the date is in the future, it will simply treat it as effectiveDateStart as explained below. Read on, however, to understand the functionality of anchorSyncDate.

Adding an anchorSyncDate attribute (as seen in the 'shenanigans' account/rule) can make your life easier by syncing the appropriate cycle/modulus phase to a specific process-execution "anchor" date in the past. For example, by syncing a cycle of 2 within a modulus of 2 on an anchorSyncDate of '2019-08-12' you are "syncing" that specific phase of the 2/2 cycle to that date (cycling forward into the future). So whatever the cycle value is on that anchorSyncDate will be locked in its position at that time and that will dictate how the cycle will modulate into the future. This will keep that account/rule moduluating as you expect without any further adjustments ever needed. However, updating the anchorSyncDate every so often will increase performance since this feature requires more computation.

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
        {
            // rule 1
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
        {
            // rule 2
            name: 'shenanigans',
            amount: -97.0,
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
        // (when using the reportController, the currencySymbol parameter should be exact/case-sensitive as respected by javascripts built-in toLocaleString function - via the Intl api)
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

## Aggregate Functions

Requires the reporting type, AGGREGATES

To compute aggregates, add the following "aggregateRules" array to a report rule of type AGGREGATES for computing aggregates:  
(add as many as desired)

```javascript
const reportController = {
    config: {
        name: 'some name', // optional but convenient
        mode: CONCISE
    },
    rules: [
        {
            type: STANDARD_OUTPUT
        },
        {
            name: 'some name', // optional but convenient
            type: AGGREGATES, // both type and aggregates properties are necessary
            aggregateRules: [
                {
                    name: 'some name', // optional but convenient
                    type:
                        SUMS_AND_AVERAGES ||
                        MINIMUMS_AND_MAXIMUMS ||
                        MEDIANS_AND_MODES ||
                        GREATEST_VALUES ||
                        LEAST_VALUES,
                    frequency: ANNUALLY || MONTHLY || WEEKLY || DAY_CYCLES || DATE_SETS,
                    propertyKey: 'balanceEnding' || 'amount', // determines the field that this aggregate will execute against
                    // note: flowKey/flowDirection filter the events prior to running computations
                    flowKey: 'balanceEnding', // when using flowDirection (below), this is the key that it checks against
                    flowDirection: POSITIVE || NEGATIVE || BOTH, // filters events that are either greater than or less than 0
                    // note: flowDirection/flowKey can be used on the reportController's config object and also in any particular report rule object, where the effects will be made  in each respective scope
                    sortKey: DEFAULT || SUM || AVERAGE || MEDIANS || MODES || MIN || MAX || 'any property key', // optional: be aware that medians and modes will not always sort accurately since there could be more than 1 median/mode for each aggregate
                    sortDirection: ASCENDING || DESCENDING, // optional: defaults to ASCENDING
                    selectionLimit: 5, // this property is only for GREATEST_VALUES || LEAST_VALUES; pass null for no selectionLimit
                    dateSets: ['2020-01-01', '2020-03-19', '2020-06-20', '2020-09-17'], // this property is required for DATE_SETS; this example will find aggregates between 2020-01-01 and 2020-03-19 and then between 2020-06-20 and 2020-09-17
                    modeMax: 3, // this property sets the limit for the amount of modes returned by MEDIANS_AND_MODES
                    xPercentRange: 0.1, // sets the percentage difference allowed for mode matches, specifically. Defaults to 0 which is 0% difference (exact match); 0.1 indicates 10%
                    // while xPercentRange defaults to 0, it is probably necessary to boost it to at least 0.01 or so as it might be common for you to otherwise get no mode matches at all
                    weekdayStart: SUNDAY, // this optional property allows you to adjust the starting weekday for WEEKLY aggregate types
                    dayCycles: 10, // when using the DAY_CYCLES type, you can choose how many cycles of days to aggregate against for each collection
                    cycleDateStart: '2020-09-17', // this optional property allows you to change the starting date for the DAY_CYCLES type
                    fiscalYearStart: '12-25' // this optional property allows you to change the starting date for the ANNUALLY type; the default value is the first of january
                }
            ]
        }
    ]
};
```

**Additional Rule Options**

After aggregates were added as a reporting type, a few of the following aggregateRule options were added as options to the primary rules of the report controller. Refer to the aggregate section as well.  

-   `sortKey: 'balanceEnding` _(any property key to sort on)_  
-   `sortDirection: ASCENDING || DESCENDING`  
-   `selectionLimit: 10` _(max amount of events returned)_  
-   `flowKey: 'balanceEnding' || 'amount`  _(you can restrict this property to positive or negative values)_  
-   `flowDirection: POSITIVE || NEGATIVE`  
  
In addition, **uniqueKey** can be used on the primary rules of the report controller to remove events that have a value for a specific parameter that is already present in another event. An example of this use case would be on LEAST_BALANCE_ENDING_SNAPSHOTS if you wanted to restrict the least _balanceEnding_ values for a specific _dateStart_ value. This would ensure that you get the minimum value for any particular date throughout that collection report. This particular functionality takes place before any custom sorting.
  
-   `uniqueKey: 'dateStart'` _(any property key with a primitive data type value that should be unique)_  
  
## Time

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

## Reports - File and Terminal Output

Terminal output is configured by default. File output is configured, instead, by adding the following attributes to the reportController options object:

```javascript
const reportController = {
    config: {
        mode: CONCISE,
        file: {
            path: path.resolve(__dirname), // a path string; defaults to a "reports" directory four levels up from fileIo.js, but make sure that this reports directory exists!
            name: 'MyReport.txt',
            onFinish: () => {}, // optional
            onError: (err) => {}, // optional
            jsonSpacing: 4 // OPTIONAL! This is the default setting when using the rawJson attribute
        }
    },
    rules: [
        {
            name: 'All Events',
            type: STANDARD_OUTPUT,
            criticalThreshold: 500.0 // optional for STANDARD_OUTPUT, adding this property to a STANDARD_OUTPUT report type will force the execution of CRITICAL_SNAPSHOTS
        },
        {
            name: 'Largest Expenses',
            type: GREATEST_NEGATIVE_EVENT_FLOWS,
            selectionLimit: 10 // pass null for no selectionLimit
        }
    ]
};
```

**Logging Results to the Command-Line**

_note: the reporting options are executed in the context of events (not rules), with exception to RULES_TO_RETIRE and IRRELEVANT_RULES_

```javascript
// passing a non-null value for error will log it to the console and bypass all other report functionality
createReport({ danielSan, controller: reportController, error, originalDanielSan }); // the originalDanielSan is useful for passing the original unmodified danielSan reference to display irrelevant or retired rules.
```

**Report Type Options**

-   `type: 'EVENTS'` _(display only the events, nothing fancy)_
-   `type: 'DISCARDED_EVENTS'` _(this function is automatically called for you to alert you when special adjustments move specific events beyond the effectiveDateStart and effectiveDateEnd range)_
-   `type: 'CRITICAL_SNAPSHOTS'` _(display only the critical balanceEnding snapshots below a criticalThreshold by passing something like criticalThreshold: 150.00)_
-   `type: 'STANDARD_OUTPUT'` _(the default command-line functionality, displays events and will also conveniently add critical snapshots if passed a criticalThreshold)_
-   `type: 'SUM_OF_ALL_POSITIVE_EVENT_FLOWS'` _(displays the sum of all positive event flows)_
-   `type: 'SUM_OF_ALL_NEGATIVE_EVENT_FLOWS'` _(displays the sum of all negative event flows)_
-   `type: 'EVENT_FLOWS_GREATER_THAN_TARGET'` _(pass target: 1000 to display all the amount values greater than 1000)_
-   `type: 'EVENT_FLOWS_LESS_THAN_TARGET'` _(pass target: 100 to display all the amount values less than 100)_
-   `type: 'NEGATIVE_EVENT_FLOWS_GREATER_THAN_TARGET'` _(pass target: 1000 to display all negative absolute-value amount values greater than 1000)_
-   `type: 'NEGATIVE_EVENT_FLOWS_LESS_THAN_TARGET'` _(pass target: 100 to display all negative absolute-value amount values greater than 1000)_
-   `type: 'POSITIVE_EVENT_FLOWS_GREATER_THAN_TARGET'` _(pass target: 1000 to display all positive amount values greater than 1000)_
-   `type: 'POSITIVE_EVENT_FLOWS_LESS_THAN_TARGET'` _(pass target: 100 to display all positive amount values greater than 1000)_
-   `type: 'BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_TARGET'` _(pass target: 1000 to display all the balanceEnding values greater than 1000)_
-   `type: 'BALANCE_ENDING_SNAPSHOTS_LESS_THAN_TARGET'` _(pass target: 100 to display all the balanceEnding values less than 100)_
-   `type: 'GREATEST_BALANCE_ENDING_SNAPSHOTS'` _(pass selectionLimit: 10 to display the top 10 highest balanceEnding values, ordered by value; pass null for no limit)_
-   `type: 'LEAST_BALANCE_ENDING_SNAPSHOTS'` _(pass selectionLimit: 10 to display the 10 lowest balanceEnding values, ordered by value; pass null for no limit)_
-   `type: 'GREATEST_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the top 10 highest amount values, ordered by value; pass null for no limit)_
-   `type: 'LEAST_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the 10 lowest amount values, ordered by value; pass null for no limit)_
-   `type: 'GREATEST_NEGATIVE_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the top 10 highest absolute-value amounts, ordered by value; pass null for no limit)_
-   `type: 'LEAST_NEGATIVE_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the 10 lowest absolute-value amounts, ordered by value; pass null for no limit)_
-   `type: 'GREATEST_POSITIVE_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the top 10 highest positive amount values, ordered by value; pass null for no limit)_
-   `type: 'LEAST_POSITIVE_EVENT_FLOWS'` _(pass selectionLimit: 10 to display the 10 lowest positive amount values, ordered by value; pass null for no limit)_
-   `type: 'EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET'` _(pass xPercentRange: 0.1 and xPercentTarget: -1000 to find all event flows within 10 percent of -1000)_
-   `type: 'NEGATIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET'` _(pass xPercentRange: 0.1 and xPercentTarget: -1000 to find all event flows within 10 percent of -1000)_
-   `type: 'POSITIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET'` _(pass xPercentRange: 0.1 and xPercentTarget: -1000 to find all event flows within 10 percent of -1000)_
-   `type: 'BALANCE_ENDING_SNAPSHOTS_WITHIN_X_PERCENT_OF_TARGET'` _(pass xPercentRange: 0.1 and xPercentTarget: 500 to find all balanceEnding snapshots within 10 percent of 500)_
-   `type: 'AGGREGATES'` _(see section on Aggregate Functions)_
-   `type: 'EVENTS_BY_GROUP'` _(passing searchValues: ['Group1', 'Group2'] into reportController will search against the optional group property)_
-   `type: 'EVENTS_BY_NAME'` _(passing searchValues: ['Name1', 'Name2'] will search against the name property)_
-   `type: 'EVENTS_BY_TYPE'` _(passing searchValues: ['STANDARD_EVENT', 'NTH_WEEKDAYS_OF_MONTH'] will search against the type property)_
-   `type: 'EVENTS_BY_KEYS_AND_VALUES'` _(works exactly like filterKeys on the reportController's config object, but the params are assigned to a particular rule object instead; for numeric values you might be better off using one of the WITHIN_X_PERCENT_OF_TARGET types)_  
-   `type: 'IMPORTANT_EVENTS'` _(display events with the optional attribute important: true)_
-   `type: 'TIME_EVENTS'` _(display events with the optional attribute timeStart: '09:30pm')_
-   `type: 'ROUTINE_EVENTS'` _(display events that contain 'ROUTINE' somewhere in the string of the type field)_
-   `type: 'REMINDER_EVENTS'` _(display events that contain 'REMINDER' somewhere in the string of the type field)_
-   `type: 'ROUTINE_AND_REMINDER_EVENTS'` _(display events that contain 'ROUTINE' || 'REMINDER' somewhere in the string of the type field)_
-   `type: 'IRRELEVANT_RULES'` _(display rules that have no chance of being triggered via the current configuration - this particular report function works on your original danielSan object. However, when executing events as normal, a field called irrelevantRules is populated for you_
-   `type: 'RULES_TO_RETIRE'` _(displays obsolete rules to retire - but only works on your original danielSan object. It does not work if you pass it the danielSan object that is returned by findBalance after proecessing -  
    since findBalance retires rules [with obsolete effectiveDateEnd dates] automatically during the projection phase)_

**Report Mode Options**

-   `mode: 'SHY'` _(minimal output)_
-   `mode: 'CONCISE'` _(standard output)_
-   `mode: 'VERBOSE'` _(maximum output - allows output for custom properties)_

**Critical Snapshots**

Passing a criticalThreshold property will log snapshots to the command-line when the balanceEnding is less than the criticalThreshold, for STANDARD_OUTPUT and CRITICAL_SNAPSHOTS.

**Search Values**

searchValues: [string1, string2, string3] is used for the "EVENTS_BY" report types. Case-Sensitive!

**Formatting**

See the report option configuration example below. If passing a custom formatting function, it must take the form shown below.
The default formattingFunction utilizes javascript's built-in toLocaleString() function - via the Intl api

```javascript
const decimalFormatterCustom = (
    number,
    { minIntegerDigits, minDecimalDigits, maxDecimalDigits, locale, style, currency }
) => {
    /* return number formatted */
};
const reportController = {
    config: {
        name: 'some name',
        mode: CONCISE,
        // the formatting object is optional as the following values are defaulted for you
        // which will format amount, balanceBeginning, and balanceEnding
        formatting: {
            formattingFunction: decimalFormatterCustom,
            minIntegerDigits: 1,
            minDecimalDigits: 2,
            maxDecimalDigits: 2,
            locale: 'en-US',
            style: 'currency', // change to 'decimal' to remove the prepended currency symbol (if using the default formattingFunction)
            currency: 'USD'
        } // in addition, you can also pass formattingFunction into the formatting object above and all of the above parameters will be passed into that function call for you
    },
    rules: [
        {
            name: 'Sum of all Revenue',
            type: SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
            criticalThreshold: 577.0 // optional for STANDARD_OUTPUT reports
        },
        {
            name: 'some name',
            type: STANDARD_OUTPUT,
            flowDirection: POSITIVE || NEGATIVE || BOTH, // eg. NEGATIVE will focus the computations on only expenses
        }
    ]
};
```

**An Example Assuming Rules and Report Options are Defined**

```javascript
const waxOn = require('./rules'); // so we can use the word waxOn
const findBalance = require('daniel-san');
const createReport = require('daniel-san/reporting');

const eventResults = findBalance(waxOn.danielSan);
createReport({ danielSan: eventResults.danielSan, controller: reportController, error: eventResults.err }); // on err, the report's error logger will be executed instead of the event logger
```

**Filter Events prior to running calculations**

Add the following attributes to the config object of the reportController || a report rule object || an aggregate rule - for fine-tuned pre-filter control. filterKeys and filterValues are parallel arrays.

```javascript
const reportController = {
    config: {
        name: 'my report',
        mode: CONCISE,
        filterKeys: ['name', 'group'], 
        filterValues: ['rent', ANY], // the constant for ANY, INTERSECTION and UNION are available for import
        filterType: UNION || INTERSECTION, // event inclusion is governed by Any attributes that match || All attributes must match
        filterComparator: (filterKey, filterValue) => {
            // OPTIONAL! This is the default comparator
            return filterKey === filterValue;
        }   
    },
    rules: [
        {
            name: 'standard events',
            type: STANDARD_OUTPUT,
        }
    ]
};
```

With a filterType of UNION, the above configuration will include events that have a name with the value "rent" or a group attribute with any value, including null.
With a filterType of INTERSECTION, the above configuration will include events that have both a name with the value "rent" And a group attribute with any value.

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
            group: 'investments' // optional: assign a group category and filter the results with EVENTS_BY_GROUP
            amount: -79.83,
            type: STANDARD_EVENT,
            frequency: MONTHLY,
            processDate: '30',
            timeStart: '09:11am', // optional: assigning a timeStart attribute will order the event appropriately
            sortPriority: 25,   // optional: forces higher sort priority for event operations, the lower the sortPriority value,
                                // the sooner it is applied in the event sequence, (the processed event dates and timeStart take precedence over sortPriority)
            notes: 'some message to your future self', // optional
            important: true, // optional: assign important: true and filter the results with IMPORTANT_EVENTS
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            modulus: 1,
            cycle: 1
        }
    ],
    events: []
};
```

## Options for Fine-Tuning Output Control

```javascript
const reportController = {
    name: 'some name',
    type: [STANDARD_OUTPUT, DISPLAY, SUM_OF_ALL_NEGATIVE_EVENT_FLOWS],
    mode: CONCISE,
    // note: you can use outputRelay or the file options but you cannot use both
    outputRelay: (content, error) => {
        if (content) process.stdout.write(content);
    }, // if you do not want to use the terminal or the default file writing functionality, you can push each chunk to a readstream that pipes into a write stream, or do as you like;
    // null content indicates end of output "stream"
    // note: the 2nd paramter indicates whether or not the content is provided in the context of an error
    // note: when not using rawJson, each line of output is already formatted with a newline
    rawJson: false, // OPTIONAL! When set to true, each json chunk is either sent to outputRelay as content, or, if using the default file writing functionality, is output to a json file
    reportCharWidth: 89 // changes width of the print screen when not using the rawJson option
};
```

**Useful Functions and Notes**

You can always use any exported function in the program by simply requiring it. However, the most useful functions can be found in the analytics and utility directories. Review the code in the reporting folder for examples of usage. When using multi-currency conversion, the analysis takes place in the context of the currencySymbol within the config object. Most of the analytic functions, with exception to findRulesToRetire and findIrrelevantRules, are executed on events. If you are running a subroutine related to rules, you should typically run the validation functions in core/validation.js first, in order to avoid errors.

## Constants

**Constants/Formatting Functions Available For Import**

Importing the following constants, to be discoverable by your code editor's auto-complete functionality, makes working with daniel-san more convenient.

```javascript
const {
    APP_NAME,
    AMOUNT,
    BALANCE_ENDING,
    DEFAULT_ERROR_MESSAGE,
    TIME_DELIMITER,
    DATE_TIME_DELIMITER,
    DATE_FORMAT_STRING,
    TIME_FORMAT_STRING,
    UTC,
    LOCAL,
    AM,
    PM,
    EVENT_SOURCE,
    OBSERVER_SOURCE,
    BOTH,
    ANY,
    UNION,
    INTERSECTION,
    POSITIVE,
    NEGATIVE,
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
    WEEKENDS,
    STANDARD_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
    EVENTS_BY_GROUP,
    EVENTS_BY_GROUPS,
    EVENTS_BY_NAME,
    EVENTS_BY_NAMES,
    EVENTS_BY_TYPE,
    EVENTS_BY_TYPES,
    EVENTS_BY_KEYS_AND_VALUES,
    EVENTS,
    CRITICAL_SNAPSHOTS,
    DISCARDED_EVENTS,
    IMPORTANT_EVENTS,
    TIME_EVENTS,
    ROUTINE,
    REMINDER,
    ROUTINE_EVENTS,
    REMINDER_EVENTS,
    ROUTINE_AND_REMINDER_EVENTS,
    RULES_TO_RETIRE,
    IRRELEVANT_RULES,
    SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
    SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    EVENT_FLOWS_GREATER_THAN_TARGET,
    EVENT_FLOWS_LESS_THAN_TARGET,
    NEGATIVE_EVENT_FLOWS_GREATER_THAN_TARGET,
    NEGATIVE_EVENT_FLOWS_LESS_THAN_TARGET,
    POSITIVE_EVENT_FLOWS_GREATER_THAN_TARGET,
    POSITIVE_EVENT_FLOWS_LESS_THAN_TARGET,
    BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_TARGET,
    BALANCE_ENDING_SNAPSHOTS_LESS_THAN_TARGET,
    GREATEST_BALANCE_ENDING_SNAPSHOTS,
    LEAST_BALANCE_ENDING_SNAPSHOTS,
    GREATEST_EVENT_FLOWS,
    LEAST_EVENT_FLOWS,
    GREATEST_POSITIVE_EVENT_FLOWS,
    LEAST_POSITIVE_EVENT_FLOWS,
    GREATEST_NEGATIVE_EVENT_FLOWS,
    LEAST_NEGATIVE_EVENT_FLOWS,
    EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET,
    NEGATIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET,
    POSITIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET,
    BALANCE_ENDING_SNAPSHOTS_WITHIN_X_PERCENT_OF_TARGET,
    AGGREGATES,
    DAY_CYCLES,
    DATE_SETS,
    SUMS_AND_AVERAGES,
    MEDIANS_AND_MODES,
    MINIMUMS_AND_MAXIMUMS,
    GREATEST_VALUES,
    LEAST_VALUES,
    DEFAULT,
    ASCENDING,
    DESCENDING,
    SUM,
    AVERAGE,
    MEDIANS,
    MODES,
    MIN,
    MAX,
    MIN_INT_DIGITS_DEFAULT,
    MIN_DECIMAL_DIGITS_DEFAULT,
    MAX_DECIMAL_DIGITS_DEFAULT,
    LOCALE_DEFAULT,
    STYLE_DEFAULT,
    CURRENCY_DEFAULT,
    RULE,
    EVENT,
    REPORT,
    AGGREGATE,
    AGGREGATE_GROUP,
    DEFAULT_JSON_SPACING,
    DEFAULT_SELECTION_LIMIT
} = require('daniel-san/constants');
```

## Breaking Changes in v13.0.0

Completely revamped the entire reporting experience and updated many of the application constants.

## Breaking Changes in v12.0.0

All constants beginning with 'DISPLAY\_' had that substring removed with whitespace

## Breaking Changes in v11.0.0

Significant changes were made in Version 11 which included many breaking changes. Some of the most significant changes are documented below:

changed all of the following constants accordingly:

MAX_AMOUNT with TARGET  
MIN_AMOUNT with TARGET  
GREATER_THAN_AMOUNT with GREATER_THAN_TARGET  
LESS_THAN_AMOUNT with LESS_THAN_TARGET  
END_BALANCE with BALANCE_ENDING  
STANDARD_TERMINAL_OUTPUT to STANDARD_OUTPUT  
TERMINAL_BOUNDARY_LIMIT to BOUNDARY_LIMIT

changed all of the following variable names accordingly:

LessThanMinAmount with LessThanResistance  
GreaterThanMaxAmount with GreaterThanSupport  
GreaterThanAmount with GreaterThanSupport  
LessThanAmount with LessThanResistance  
maxAmount with balanceEndingSupport  
minAmount with balanceEndingResistance  
endBalance with balanceEnding  
terminalType to reportingType  
terminalOptions to reportController  
standardTerminalOutput to standardOutput  
terminalTypes to reportingTypes  
terminalBoundary to reportingBoundary  
standardTerminalHeader to standardHeader  
standardTerminalSubheader to standardSubheader  
changed the terminal function to createReport  
changed terminal to report  
changed report path to /reporting

## Breaking Change in v10.0.0

all non-rule configuration for the danielSan object have been moved into the new "config" field.

## Breaking Change in v8.0.0

In keeping with the trend of adding clarity and consistency to variable names, the following properties have been changed accordingly. beginBalance is now balanceBeginning. balanceEnding is now balanceEnding. And syncDate is now anchorSyncDate.

## Breaking Change in v8.0.0

As of v8.0.0, to make way for a cleaner distinction between event dates and effective dates, dateStart and dateEnd at the top-level of the danielSan master control unit are now effectiveDateStart and effectiveDateEnd, respectively. And the eventDate on the event level has been changed to dateStart as a cleaner approach to applying time spans to events.

## Breaking Change in v3.0.0

In v3.0, the currencyConversion function parameters have changed from currentSymbol and futureSymbol to inputSymbol and outputSymbol, respectively. Because naming things is hard.
