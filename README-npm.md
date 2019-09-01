# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Summarized Documentation

get the [full documentation](https://github.com/jaredboice/daniel-san) at gitHub.

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU 
(use this address until 2022)

## Starter Kit
click [here](https://github.com/jaredboice/daniel-san-starter-kit "Daniel-San-Starter-Kit")

## Description

maximize your potential with **Daniel-San**, a node-based budget-projection engine that helps your routines and finances find balance.  The program features multi-currency conversion and multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. Timezones help to keep your enterprise in sync, while special adjustments allow the movement of process-dates around holidays and weekends via prepay or postpay. The user can create reminder/routine rules for events that won't contribute to the endBalance calculation. And beyond that, daniel-san is completely customizable. Create your own custom properties that you track on your own. Breathe in through nose, out the mouth. Wax on, wax off. Don't forget to breathe, very important.

## Breaking Change in v8.0.0
As of v8.0.0, to make way for a cleaner distinction between event dates and effective dates, dateStart and dateEnd are now effectiveDateStart and effectiveDateEnd, respectively. And eventDate has been changed to eventStartDate as a cleaner approach to applying time spans to events.

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

**Defining Accounts/Cashflow Rules**

```javascript
const danielSan = {
    beginBalance: 1618.03,
    endBalance: null, // future end balance is stored here
    effectiveDateStart: '2019-03-20', // always required - inclusive (effectiveDateStart is included in the budget projection)
    effectiveDateEnd: '2019-12-13', // always required - inclusive (effectiveDateEnd is included in the budget projection)
    timeStart: null, // optional: '09:00am'
    timeEnd: null, // optional: '05:00pm'
    rules: [
        { // rule 1
            name: 'monthly bitcoin investment',
            amount: -79.83, // negative amount subtracts, positive amount adds
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: MONTHLY,
            processDate: '30', // for MONTHLY events, this string represents the day within that month
            effectiveDateStart: '2019-01-01' // date to start evaluating and processing this account, if there is no start date, daniel-san will try to determine the first process date
            effectiveDateEnd: null, // null effectiveDateEnd represents an ongoing account
            modulus: 1, // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
            cycle: 1 // not required - for BIWEEKLY / BIMONTHLY types of events - see "Modulus/Cycle" to review this advanced feature
        },
        { // rule 2
            name: 'shenanigans',
            amount: -97.00,
            type: STANDARD_EVENT, // see "Event Types" - import from constants.js
            frequency: WEEKLY,
            processDate: FRIDAY, // 0-6 with 0 representing Sunday - weekday constants are available to be imported
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            modulus: 2, // the modulus/cycle attributes here equate to every other Weekday (in this particular case due to the WEEKLY frequency)
            cycle: 1
        },
        { // rule 3
            type: STANDARD_EVENT,
            frequency: DAILY,
            name: 'cafeteria breakfast',
            amount: -5.00,
            effectiveDateStart: '2019-01-01',
            effectiveDateEnd: null,
            exclusions: { // (exclusion hits will still cycle the modulus for STANDARD_EVENTS
                weekdays: [SATURDAY, SUNDAY], // excluding these weekdays
                dates: ['2019-07-04', '2019-09-17', '2019-10-31'] // exluding these specific dates
            }
        }
    ],
    events: [] // future balance projections stored here
};

const craneKick = findBalance(danielSan);
```