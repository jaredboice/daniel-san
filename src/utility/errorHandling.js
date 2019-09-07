const { DEFAULT_ERROR_MESSAGE, APP_NAME } = require('../constants');

const errorDisc = (disc) => {
    const { err = {}, errorMessage = DEFAULT_ERROR_MESSAGE, data = {}, app = APP_NAME } = disc;
    if (!err.app) {
        err.app = app;
    }
    if (!err.data) {
        err.data = data;
    }
    if (!err.data.rule && data.rule) {
        err.data.rule = data.rule;
    }
    if (!err.data.event && data.event) {
        err.data.event = data.event;
    }
    if (!err.errorMessage) {
        err.errorMessage = errorMessage;
    }
    return err;
};

module.exports = {
    errorDisc
};
