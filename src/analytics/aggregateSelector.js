const {
    findAnnualMediansAndModes,
    findAnnualSumsAndAvgs,
    findAnnualMinimumsAndMaximums,
    findAnnualGreatestValues,
    findMonthlyMediansAndModes,
    findMonthlySumsAndAvgs,
    findMonthlyMinimumsAndMaximums,
    findMonthlyGreatestValues,
    findWeeklyMediansAndModes,
    findWeeklySumsAndAvgs,
    findWeeklyMinimumsAndMaximums,
    findWeeklyGreatestValues,
    findDayCycleMediansAndModes,
    findDayCycleSumsAndAvgs,
    findDayCycleMinimumsAndMaximums,
    findDayCycleGreatestValues,
    findDateSetMediansAndModes,
    findDateSetSumsAndAvgs,
    findDateSetMinimumsAndMaximums,
    findDateSetGreatestValues
} = require('./aggregates');
const {
    ANNUALLY,
    MONTHLY,
    WEEKLY,
    DAY_CYCLES,
    DATE_SETS,
    SUMS_AND_AVERAGES,
    MEDIANS_AND_MODES,
    MINIMUMS_AND_MAXIMUMS,
    GREATEST_VALUES,
    LEAST_VALUES,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY,
    STANDARD_OUTPUT,
    VERBOSE,
    CONCISE,
    SHY,
    DISPLAY_EVENTS_BY_GROUP,
    DISPLAY_EVENTS_BY_GROUPS,
    DISPLAY_EVENTS_BY_NAME,
    DISPLAY_EVENTS_BY_NAMES,
    DISPLAY_EVENTS_BY_TYPE,
    DISPLAY_EVENTS_BY_TYPES,
    DISPLAY_EVENTS,
    DISPLAY_CRITICAL_SNAPSHOTS,
    DISPLAY_DISCARDED_EVENTS,
    DISPLAY_IMPORTANT_EVENTS,
    DISPLAY_TIME_EVENTS,
    DISPLAY_ROUTINE_EVENTS,
    DISPLAY_REMINDER_EVENTS,
    DISPLAY_RULES_TO_RETIRE,
    DISPLAY_IRRELEVANT_RULES,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_POSITIVE_EVENT_FLOWS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_AMOUNTS,
    DISPLAY_SUM_OF_ALL_NEGATIVE_EVENT_FLOWS,
    DISPLAY_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_NEGATIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_NEGATIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_POSITIVE_EVENT_FLOWS_GREATER_THAN_SUPPORT,
    DISPLAY_POSITIVE_EVENT_FLOWS_LESS_THAN_RESISTANCE,
    DISPLAY_BALANCE_ENDING_SNAPSHOTS_GREATER_THAN_SUPPORT,
    DISPLAY_BALANCE_ENDING_SNAPSHOTS_LESS_THAN_MIN_AMOUNT,
    DISPLAY_GREATEST_BALANCE_ENDING_SNAPSHOTS,
    DISPLAY_LEAST_BALANCE_ENDING_SNAPSHOTS,
    MIN_INT_DIGITS_DEFAULT,
    MIN_DECIMAL_DIGITS_DEFAULT,
    MAX_DECIMAL_DIGITS_DEFAULT,
    LOCALE_DEFAULT,
    STYLE_DEFAULT,
    CURRENCY_DEFAULT,
    FORMATTING_FUNCTION_DEFAULT
} = require('../constants');

const selectAnnualAggregate = (type) => {
    switch (type) {
    case SUMS_AND_AVERAGES:
        return findAnnualSumsAndAvgs;
    case MEDIANS_AND_MODES:
        return findAnnualMediansAndModes;
    case MINIMUMS_AND_MAXIMUMS:
        return findAnnualMinimumsAndMaximums;
    case GREATEST_VALUES:
        return findAnnualGreatestValues;
    case LEAST_VALUES:
        return (parameters) => {
            parameters.reverse = true;
            return findAnnualGreatestValues(parameters);
        };
    default:
        break;
    }
};

const selectMonthlyAggregate = (type) => {
    switch (type) {
    case SUMS_AND_AVERAGES:
        return findMonthlySumsAndAvgs;
    case MEDIANS_AND_MODES:
        return findMonthlyMediansAndModes;
    case MINIMUMS_AND_MAXIMUMS:
        return findMonthlyMinimumsAndMaximums;
    case GREATEST_VALUES:
        return findMonthlyGreatestValues;
    case LEAST_VALUES:
        return (parameters) => {
            parameters.reverse = true;
            return findMonthlyGreatestValues(parameters);
        };
    default:
        break;
    }
};

const selectWeeklyAggregate = (type) => {
    switch (type) {
    case SUMS_AND_AVERAGES:
        return findWeeklySumsAndAvgs;
    case MEDIANS_AND_MODES:
        return findWeeklyMediansAndModes;
    case MINIMUMS_AND_MAXIMUMS:
        return findWeeklyMinimumsAndMaximums;
    case GREATEST_VALUES:
        return findWeeklyGreatestValues;
    case LEAST_VALUES:
        return (parameters) => {
            parameters.reverse = true;
            return findWeeklyGreatestValues(parameters);
        };
    default:
        break;
    }
};

const selectDayCycleAggregate = (type) => {
    switch (type) {
    case SUMS_AND_AVERAGES:
        return findDayCycleSumsAndAvgs;
    case MEDIANS_AND_MODES:
        return findDayCycleMediansAndModes;
    case MINIMUMS_AND_MAXIMUMS:
        return findDayCycleMinimumsAndMaximums;
    case GREATEST_VALUES:
        return findDayCycleGreatestValues;
    case LEAST_VALUES:
        return (parameters) => {
            parameters.reverse = true;
            return findDayCycleGreatestValues(parameters);
        };
    default:
        break;
    }
};

const selectDateSetAggregate = (type) => {
    switch (type) {
    case SUMS_AND_AVERAGES:
        return findDateSetSumsAndAvgs;
    case MEDIANS_AND_MODES:
        return findDateSetMediansAndModes;
    case MINIMUMS_AND_MAXIMUMS:
        return findDateSetMinimumsAndMaximums;
    case GREATEST_VALUES:
        return findDateSetGreatestValues;
    case LEAST_VALUES:
        return (parameters) => {
            parameters.reverse = true;
            return findDateSetGreatestValues(parameters);
        };
    default:
        break;
    }
};

const selectAggregateFrequency = (reportingConfig) => {
    switch (reportingConfig.frequency) {
    case ANNUALLY:
        return selectAnnualAggregate(reportingConfig.type);
    case MONTHLY:
        return selectMonthlyAggregate(reportingConfig.type);
    case WEEKLY:
        return selectWeeklyAggregate(reportingConfig.type);
    case DAY_CYCLES:
        return selectDayCycleAggregate(reportingConfig.type);
    case DATE_SETS:
        return selectDateSetAggregate(reportingConfig.type);
    default:
        break;
    }
};

const selectAggregateFunction = (reportingConfig) => {
    return selectAggregateFrequency(reportingConfig);
};

module.exports = selectAggregateFunction;
