
require('dotenv').config();

const config = {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/news_aggregator',
    fetchIntervalMinutes: parseInt(process.env.FETCH_INTERVAL_MINUTES, 10) || 60,
    port: parseInt(process.env.PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    rssFeedUrls: process.env.RSS_FEED_URLS ? process.env.RSS_FEED_URLS.split(',') : [],
};

module.exports = config;
