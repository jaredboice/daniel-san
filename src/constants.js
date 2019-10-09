const DATE_DELIMITER = '-';
const TIME_DELIMITER = ':';
const DATE_TIME_DELIMITER = 'T';

const MIN_INT_DIGITS_DEFAULT = 1;
const MIN_DECIMAL_DIGITS_DEFAULT = 2;
const MAX_DECIMAL_DIGITS_DEFAULT = 2;
const LOCALE_DEFAULT = 'en-US';
const STYLE_DEFAULT = 'currency';
const CURRENCY_DEFAULT = 'USD';

const SUNDAY = 0;
const MONDAY = 1;
const TUESDAY = 2;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;
const SATURDAY = 6;

const appConstants = {
    APP_NAME: 'daniel-san',
    DEFAULT_ERROR_MESSAGE: 'something bad happened and a lot of robots died',
    DATE_DELIMITER,
    TIME_DELIMITER,
    DATE_TIME_DELIMITER,
    DATE_FORMAT_STRING: `YYYY${DATE_DELIMITER}MM${DATE_DELIMITER}DD`,
    TIME_FORMAT_STRING: `hh${TIME_DELIMITER}mmA`,
    UTC: 'UTC',
    LOCAL: 'LOCAL',
    AM: 'am',
    PM: 'pm',
    EVENT_SOURCE: 'EVENT_SOURCE',
    OBSERVER_SOURCE: 'OBSERVER_SOURCE',
    BOTH: 'BOTH',
    ANY: 'ANY',
    UNION: 'UNION',
    INTERSECTION: 'INTERSECTION',
    POSITIVE: 'POSITIVE',
    NEGATIVE: 'NEGATIVE',
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
    PRE_PAY: 'PRE_PAY',
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_WEEKDAYS',
    MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES: 'MOVE_THIS_PROCESS_DATE_AFTER_THESE_DATES',
    POST_PAY: 'POST_PAY',
    ADJUST_AMOUNT_ON_THESE_DATES: 'ADJUST_AMOUNT_ON_THESE_DATES',
    ADJUST_AMOUNT: 'ADJUST_AMOUNT',
    ANNUALLY: 'ANNUALLY',
    MONTHLY: 'MONTHLY',
    WEEKLY: 'WEEKLY',
    DAILY: 'DAILY',
    ONCE: 'ONCE',
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    WEEKENDS: [6, 0],
    DISCOVERING_EVENT_TYPE: 'DISCOVERING_EVENT_TYPE',
    EVALUATING_RULE_INSERTION: 'EVALUATING_RULE_INSERTION',
    EXECUTING_RULE_INSERTION: 'EXECUTING_RULE_INSERTION',
    EXECUTING_RULE_ADJUSTMENT: 'EXECUTING_RULE_ADJUSTMENT',
    EXECUTION_REJECTED: 'EXECUTION_REJECTED',
    MODIFIED: 'MODIFIED',
    RETIRING_RULES: 'RETIRING_RULES',
    STANDARD_OUTPUT: 'STANDARD_OUTPUT',
    VERBOSE: 'VERBOSE',
    CONCISE: 'CONCISE',
    SHY: 'SHY',
    EVENTS_BY_GROUP: 'EVENTS_BY_GROUP',
    EVENTS_BY_GROUPS: 'EVENTS_BY_GROUPS',
    EVENTS_BY_NAME: 'EVENTS_BY_NAME',
    EVENTS_BY_NAMES: 'EVENTS_BY_NAMES',
    EVENTS_BY_TYPE: 'EVENTS_BY_TYPE',
    EVENTS_BY_TYPES: 'EVENTS_BY_TYPES',
    EVENTS_BY_KEYS_AND_VALUES: 'EVENTS_BY_KEYS_AND_VALUES',
    EVENTS: 'EVENTS',
    CRITICAL_SNAPSHOTS: 'CRITICAL_SNAPSHOTS',
    DISCARDED_EVENTS: 'DISCARDED_EVENTS',
    IMPORTANT_EVENTS: 'IMPORTANT_EVENTS',
    TIME_EVENTS: 'TIME_EVENTS',
    ROUTINE_EVENTS: 'ROUTINE_EVENTS',
    REMINDER_EVENTS: 'REMINDER_EVENTS',
    ROUTINE_AND_REMINDER_EVENTS: 'ROUTINE_AND_REMINDER_EVENTS',
    RULES_TO_RETIRE: 'RULES_TO_RETIRE',
    IRRELEVANT_RULES: 'IRRELEVANT_RULES',
    SUM_OF_ALL_POSITIVE_EVENT_FLOWS: 'SUM_OF_ALL_POSITIVE_EVENT_FLOWS',
    SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS: 'SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS',
    SUM_OF_ALL_NEGATIVE_EVENT_FLOWS: 'SUM_OF_ALL_NEGATIVE_EVENT_FLOWS',
    SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS: 'SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS',
    EVENT_FLOWS_GREATER_THAN_TARGET: 'EVENT_FLOWS_GREATER_THAN_TARGET',
    EVENT_FLOWS_LESS_THAN_TARGET: 'EVENT_FLOWS_LESS_THAN_TARGET',
    NEGATIVE_EVENT_FLOWS_GREATER_THAN_TARGET: 'NEGATIVE_EVENT_FLOWS_GREATER_THAN_TARGET',
    NEGATIVE_EVENT_FLOWS_LESS_THAN_TARGET: 'NEGATIVE_EVENT_FLOWS_LESS_THAN_TARGET',
    POSITIVE_EVENT_FLOWS_GREATER_THAN_TARGET: 'POSITIVE_EVENT_FLOWS_GREATER_THAN_TARGET',
    POSITIVE_EVENT_FLOWS_LESS_THAN_TARGET: 'POSITIVE_EVENT_FLOWS_LESS_THAN_TARGET',
    BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_TARGET: 'BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_TARGET',
    BALANCE_ENDING_SNAPSHOTS_LESS_THAN_TARGET: 'BALANCE_ENDING_SNAPSHOTS_LESS_THAN_TARGET',
    GREATEST_BALANCE_ENDING_SNAPSHOTS: 'GREATEST_BALANCE_ENDING_SNAPSHOTS',
    LEAST_BALANCE_ENDING_SNAPSHOTS: 'LEAST_BALANCE_ENDING_SNAPSHOTS',
    GREATEST_EVENT_FLOWS: 'GREATEST_EVENT_FLOWS',
    LEAST_EVENT_FLOWS: 'LEAST_EVENT_FLOWS',
    GREATEST_POSITIVE_EVENT_FLOWS: 'GREATEST_POSITIVE_EVENT_FLOWS',
    LEAST_POSITIVE_EVENT_FLOWS: 'LEAST_POSITIVE_EVENT_FLOWS',
    GREATEST_NEGATIVE_EVENT_FLOWS: 'GREATEST_NEGATIVE_EVENT_FLOWS',
    LEAST_NEGATIVE_EVENT_FLOWS: 'LEAST_NEGATIVE_EVENT_FLOWS',
    EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET: 'EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET',
    NEGATIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET: 'NEGATIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET',
    POSITIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET: 'POSITIVE_EVENT_FLOWS_WITHIN_X_PERCENT_OF_TARGET',
    BALANCE_ENDING_SNAPSHOTS_WITHIN_X_PERCENT_OF_TARGET: 'BALANCE_ENDING_SNAPSHOTS_WITHIN_X_PERCENT_OF_TARGET',
    AGGREGATES: 'AGGREGATES',
    DAY_CYCLES: 'DAY_CYCLES',
    DATE_SETS: 'DATE_SETS',
    SUMS_AND_AVERAGES: 'SUMS_AND_AVERAGES',
    MEDIANS_AND_MODES: 'MEDIANS_AND_MODES',
    MINIMUMS_AND_MAXIMUMS: 'MINIMUMS_AND_MAXIMUMS',
    GREATEST_VALUES: 'GREATEST_VALUES',
    LEAST_VALUES: 'LEAST_VALUES',
    DEFAULT: 'DEFAULT',
    ASCENDING: 'ASCENDING',
    DESCENDING: 'DESCENDING',
    SUM: 'SUM',
    AVERAGE: 'AVERAGE',
    MEDIANS: 'MEDIANS',
    MODES: 'MODES',
    MIN: 'MIN',
    MAX: 'MAX',
    MIN_INT_DIGITS_DEFAULT,
    MIN_DECIMAL_DIGITS_DEFAULT,
    MAX_DECIMAL_DIGITS_DEFAULT,
    LOCALE_DEFAULT,
    STYLE_DEFAULT,
    CURRENCY_DEFAULT,
    RULE: 'RULE',
    EVENT: 'EVENT',
    REPORT: 'REPORT',
    AGGREGATE: 'AGGREGATE',
    AGGREGATE_GROUP: 'AGGREGATE_GROUP',
    DEFAULT_JSON_SPACING: 4,
    DEFAULT_SELECTION_AMOUNT: 7
};

const decimalFormatterStandard = (
    number,
    {
        minIntegerDigits = MIN_INT_DIGITS_DEFAULT,
        minDecimalDigits = MIN_DECIMAL_DIGITS_DEFAULT,
        maxDecimalDigits = MAX_DECIMAL_DIGITS_DEFAULT,
        locale = LOCALE_DEFAULT,
        style = STYLE_DEFAULT,
        currency = CURRENCY_DEFAULT
    }
) => {
    let value = null;
    if (currency) {
        value = number.toLocaleString(locale, {
            minimumIntegerDigits: minIntegerDigits,
            minimumFractionDigits: minDecimalDigits,
            maximumFractionDigits: maxDecimalDigits,
            style,
            currency
        });
    } else {
        value = number.toLocaleString(locale, {
            minimumIntegerDigits: minIntegerDigits,
            minimumFractionDigits: minDecimalDigits,
            maximumFractionDigits: maxDecimalDigits,
            style
        });
    }
    return value;
};

const formattingFunctionDefault = decimalFormatterStandard;

const getDefaultParamsForDecimalFormatter = (formatting) => {
    const formattingOptions = formatting || {};
    const formattingFunction =
        formattingOptions && formattingOptions.formattingFunction
            ? formattingOptions.formattingFunction
            : formattingFunctionDefault;
    const minIntegerDigits =
        formattingOptions && formattingOptions.minIntegerDigits
            ? formattingOptions.minIntegerDigits
            : MIN_INT_DIGITS_DEFAULT;
    const minDecimalDigits =
        formattingOptions && formattingOptions.minDecimalDigits
            ? formattingOptions.minDecimalDigits
            : MIN_DECIMAL_DIGITS_DEFAULT;
    const maxDecimalDigits =
        formattingOptions && formattingOptions.maxDecimalDigits
            ? formattingOptions.maxDecimalDigits
            : MAX_DECIMAL_DIGITS_DEFAULT;
    const locale = formattingOptions && formattingOptions.locale ? formattingOptions.locale : LOCALE_DEFAULT;
    const style = formattingOptions && formattingOptions.style ? formattingOptions.style : STYLE_DEFAULT;
    const currency = formattingOptions && formattingOptions.currency ? formattingOptions.currency : CURRENCY_DEFAULT;
    return {
        formattingFunction,
        minIntegerDigits,
        minDecimalDigits,
        maxDecimalDigits,
        locale,
        style,
        currency
    };
};

const getWeekdayString = (weekdayNum) => {
    let weekdayString;
    switch (weekdayNum) {
        case MONDAY:
            weekdayString = 'monday';
            break;
        case TUESDAY:
            weekdayString = 'tuesday';
            break;
        case WEDNESDAY:
            weekdayString = 'wednesday';
            break;
        case THURSDAY:
            weekdayString = 'thursday';
            break;
        case FRIDAY:
            weekdayString = 'friday';
            break;
        case SATURDAY:
            weekdayString = 'saturday';
            break;
        case SUNDAY:
            weekdayString = 'sunday';
            break;
        default:
            weekdayString = 'some day';
            break;
    }
    return weekdayString;
};

module.exports = {
    ...appConstants,
    decimalFormatterStandard,
    formattingFunctionDefault,
    getDefaultParamsForDecimalFormatter,
    getWeekdayString
};
