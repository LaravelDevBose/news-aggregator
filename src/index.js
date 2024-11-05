const mongoose = require('mongoose');
const startScheduler = require('./services/schedulerService');
const {startFetchArticles, searchAndFilterArticles} = require('./services/articleService');
const logger = require('./utils/logger');
const { handleErrorWithLog} = require('./utils/errorHandler');
const config = require('../config/config');

const express = require('express');

const app = express();

// base url
app.get('/', async (req, res) => {
    try {
        res.status(200).json({ message: 'News Aggregator Service up And Running..' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// fetch articles manually if need
app.get('/fetch-articles', async (req, res) => {
    try {
        await startFetchArticles()
            .then((response) => {
                res.status(200).json({message: `Fetch ${response.length} Articles successfully`});
            })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Search and filter articles endpoint
app.get('/search-articles', async (req, res) => {
    try {
        const results = await searchAndFilterArticles(req.query);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search articles' });
    }
});


// Connect to MongoDB using the URI from config.js
mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    logger.info('Connected to MongoDB');
    app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        startScheduler();
    });
}).catch(err => {
    handleErrorWithLog('Failed to connect to MongoDB', err);
});

module.exports = app;