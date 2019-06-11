const errorDisc = (error = {}, message = 'error: something bad happened and a lot of robots died', moreInfo = {}) => {
    const err = error || {};
    return {
        err,
        message,
        moreInfo
    };
};

module.exports = {
    errorDisc
};
