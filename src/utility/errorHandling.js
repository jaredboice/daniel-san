const errorDisc = (error = {}, message = 'error: something bad happened and a lot of robots died', moreInfo = {}) => {
    const err = error || {};
    return {
        message,
        err,
        moreInfo
    };
};

module.exports = {
    errorDisc
};
