# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Summarized Documentation

get the [full documentation](https://github.com/jaredboice/daniel-san) at gitHub.

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU 
(use this address until 2022)

## Starter Kit
click [here](https://github.com/jaredboice/daniel-san-starter-kit "Daniel-San-Starter-Kit")

## Description

maximize your potential with **Daniel-San**, a node-based budget-projection engine that helps your routines and finances find balance. The program features text, json, terminal and file-based reporting output, aggregates, multi-currency conversion capability and multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. Timezones help to keep your enterprise in sync, while special adjustments allow the movement of process-dates around holidays and weekends via prepay or postpay. Dynamic rule modification allows the injection of growth-and-decay functions. Additionally, the user can create reminder/routine rules for events that won't contribute to the balanceEnding calculation. Extend rule/event properties by adding custom fields. Breathe in through nose, out the mouth. Wax on, wax off. Don't forget to breathe, very important.  

## Breaking Changes in v11.0.0
see documentation on github

## Install, Import & Execute

**Install**

`npm install --save daniel-san`

**Import**

```javascript
const findBalance = require('daniel-san');
const report = require('daniel-san/report');
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