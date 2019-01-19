const errorDisc = (error = {}, message = '', moreInfo = {}) => {
    const err = error || {};
    return {
        err,
        message,
        moreInfo
    };
};

module.exports = errorDisc;
