
const schedule = require('node-schedule');
const config = require('../../config/config');
const logger = require('../utils/logger');
const {startFetchArticles} = require("./articleService");

function startScheduler() {
    schedule.scheduleJob(`*/${config.fetchIntervalMinutes} * * * *`, async () => {
        logger.info(`Scheduler Start for Fetching new articles... after ${config.fetchIntervalMinutes} minutes`);
        await startFetchArticles();
    });
}

module.exports = startScheduler;
