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
    LEAST_VALUES
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

const selectAggregateFrequency = (rule) => {
    switch (rule.frequency) {
    case ANNUALLY:
        return selectAnnualAggregate(rule.type);
    case MONTHLY:
        return selectMonthlyAggregate(rule.type);
    case WEEKLY:
        return selectWeeklyAggregate(rule.type);
    case DAY_CYCLES:
        return selectDayCycleAggregate(rule.type);
    case DATE_SETS:
        return selectDateSetAggregate(rule.type);
    default:
        break;
    }
};

const selectAggregateFunction = (rule) => {
    return selectAggregateFrequency(rule);
};

module.exports = selectAggregateFunction;
