const logger = require('./logger');

function handleError(error) {
    console.error(`[ERROR] ${error.message}`);
}

function handleErrorWithLog(channel='ERROR', error) {
    let errorMsg = prepareErrorMessage(error);
    console.error(`[${channel}]: ${errorMsg}`);
    logger.error(`[${channel}] ${errorMsg}`);
}

function prepareErrorMessage(error){
    if (error instanceof Error){
        return error.message;
    }
    return error;
}

module.exports = {
    handleError,
    handleErrorWithLog
};
