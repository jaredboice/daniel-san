const decimalFormatterStandard = (
    number,
    {
        minIntegerDigits = 1,
        minDecimalDigits = 2,
        maxDecimalDigits = 2,
        locale = 'en-US',
        style = 'currency',
        currency = 'USD'
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

module.exports = {
    decimalFormatterStandard
};
