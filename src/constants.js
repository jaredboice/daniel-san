const { decimalFormatterStandard } = require('./utility/formatting');

const DATE_DELIMITER = '-';

const appConstants = {
    DATE_DELIMITER,
    DATE_FORMAT_STRING: `YYYY${DATE_DELIMITER}MM${DATE_DELIMITER}DD`,
    STANDARD_EVENT: 'STANDARD_EVENT',
    STANDARD_EVENT_ROUTINE: 'STANDARD_EVENT_ROUTINE',
    STANDARD_EVENT_REMINDER: 'STANDARD_EVENT_ROUTINE_REMINDER',
    NTH_WEEKDAYS_OF_MONTH: 'NTH_WEEKDAYS_OF_MONTH',
    NTH_WEEKDAYS_OF_MONTH_ROUTINE: 'NTH_WEEKDAYS_OF_MONTH_ROUTINE',
    NTH_WEEKDAYS_OF_MONTH_REMINDER: 'NTH_WEEKDAYS_OF_MONTH_REMINDER',
    WEEKDAY_ON_DATE: 'WEEKDAY_ON_DATE',
    WEEKDAY_ON_DATE_ROUTINE: 'WEEKDAY_ON_DATE_ROUTINE',
    WEEKDAY_ON_DATE_REMINDER: 'WEEKDAY_ON_DATE_REMINDER',
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_WEEKDAYS',
    MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES: 'MOVE_THIS_PROCESS_DATE_BEFORE_THESE_DATES',
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS',
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES',
    ADJUST_AMOUNT_ON_THESE_DATES: 'ADJUST_AMOUNT_ON_THESE_DATES',
    ANNUALLY: 'ANNUALLY',
    MONTHLY: 'MONTHLY',
    WEEKLY: 'WEEKLY',
    DAILY: 'DAILY',
    ONCE: 'ONCE',
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    DISCOVERING_EVENT_TYPE: 'DISCOVERING_EVENT_TYPE',
    EVALUATING_RULE_INSERTION: 'EVALUATING_RULE_INSERTION',
    EXECUTING_RULE_INSERTION: 'EXECUTING_RULE_INSERTION',
    EXECUTING_RULE_ADJUSTMENT: 'EXECUTING_RULE_ADJUSTMENT',
    EXECUTION_REJECTED: 'EXECUTION_REJECTED',
    MODIFIED: 'MODIFIED',
    RETIRING_RULES: 'RETIRING_RULES',
    STANDARD_TERMINAL_OUTPUT: 'STANDARD_TERMINAL_OUTPUT',
    VERBOSE: 'VERBOSE',
    CONCISE: 'CONCISE',
    SHY: 'SHY',
    DISPLAY_EVENTS_BY_GROUPS: 'DISPLAY_EVENTS_BY_GROUPS',
    DISPLAY_EVENTS_BY_NAMES: 'DISPLAY_EVENTS_BY_NAMES',
    DISPLAY_EVENTS_BY_TYPES: 'DISPLAY_EVENTS_BY_TYPES',
    DISPLAY_EVENTS: 'DISPLAY_EVENTS',
    DISPLAY_CRITICAL_SNAPSHOTS: 'DISPLAY_CRITICAL_SNAPSHOTS',
    DISPLAY_IMPORTANT_EVENTS: 'DISPLAY_IMPORTANT_EVENTS',
    DISPLAY_TIME_EVENTS: 'DISPLAY_TIME_EVENTS',
    DISPLAY_ROUTINE_EVENTS: 'DISPLAY_ROUTINE_EVENTS',
    DISPLAY_REMINDER_EVENTS: 'DISPLAY_REMINDER_EVENTS',
    DISPLAY_RULES_TO_RETIRE: 'DISPLAY_RULES_TO_RETIRE',
    DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT: 'DISPLAY_END_BALANCE_SNAPSHOTS_GREATER_THAN_MAX_AMOUNT',
    DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT: 'DISPLAY_END_BALANCE_SNAPSHOTS_LESS_THAN_MIN_AMOUNT',
    DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS: 'DISPLAY_GREATEST_END_BALANCE_SNAPSHOTS',
    DISPLAY_LEAST_END_BALANCE_SNAPSHOTS: 'DISPLAY_LEAST_END_BALANCE_SNAPSHOTS',
    FORMATTING_FUNCTION_DEFAULT: decimalFormatterStandard,
    MIN_INT_DIGITS_DEFAULT: 1,
    MIN_DECIMAL_DIGITS_DEFAULT: 2,
    MAX_DECIMAL_DIGITS_DEFAULT: 2,
    LOCALE_DEFAULT: 'en-US',
    STYLE_DEFAULT: 'currency',
    CURRENCY_DEFAULT: 'USD'
};

module.exports = appConstants;
