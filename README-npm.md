# Copyright 2019 Jared Boice (MIT License / Open Source)

# Daniel-San - Summarized Documentation

get the [full documentation](https://github.com/jaredboice/daniel-san) at gitHub.

![Daniel-San](screenshots/daniel-san-logo.png 'Daniel-San')

## Donations - Bitcoin: 19XgiRojJnv9VDhyW9HmF6oKQeVc7k9McU (use this address until 2020)

## Description

**Daniel-San** is a node-based budget-projection engine that helps your finances find balance.  The program features multi-currency conversion, multi-frequency accounting triggers, including: once, daily, weekly, bi-weekly, tri-weekly, monthly, annually and more. And special adjustments allow the movement of process-dates beyond holidays and weekends. The user can create reminder/routine rules for events that won't contribute to the endBalance calculation. And beyond that, daniel-san is completely customizable. Create your own custom properties that you track on your own. Breath in through nose. Breath out through mouth. 

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
            processDate: FRIDAY, // 0-6 with 0 representing Sunday - weekday constants are available to be imported
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