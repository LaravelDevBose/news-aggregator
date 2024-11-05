const Parser = require('rss-parser');
const parser = new Parser();
const { updateOrInsertArticles, searchArticles} = require('../repositories/articleDbRepository');
const config = require('../../config/config');
const logger = require('../utils/logger');
const { extractTopics, extractEntities } = require('./extractService')
const {handleErrorWithLog} = require("../utils/errorHandler");

async function startFetchArticles() {
    try{
        logger.info('Fetching new articles...');
        const articles = await fetchArticles(config.rssFeedUrls);

        const processedArticles = articles.map(article => {
            const topics = extractTopics(article.description);
            const entities = extractEntities(article.description);
            // console.log(entities)
            return {...article, topics, entities};
        });

        await updateOrInsertArticles(processedArticles);
        logger.info(`Fetched and saved ${processedArticles.length} articles.`);
        return processedArticles;
    } catch (error){
        handleErrorWithLog('FETCH_ARTICLE_ERROR', error);
        throw error;
    }
}



async function fetchArticles(rssUrls) {
    const articles = [];
    for (const url of rssUrls) {
        try {
            if (!/^https?:\/\/\S+$/.test(url)) {
                throw new Error(`Invalid URL format: ${url}`);
            }

            const feed = await parser.parseURL(url);
            feed.items.forEach(item => {
                articles.push({
                    guid: item.guid,
                    title: item.title,
                    description: item.contentSnippet || '',
                    pubDate: item.pubDate || new Date(),
                    sourceUrl: item.link,
                    author: item.creator || 'Unknown',
                });
            });
        } catch (error) {
            if (error.message.includes('Invalid URL format')) {
                handleErrorWithLog('INVALID_URL_ERROR', `${error.message} - Skipping URL: ${url}`);
                logger.error(`Invalid URL format: ${url}`);
            } else if (error.code === 'ENOTFOUND') {
                handleErrorWithLog('NETWORK_ERROR', `Network error - Cannot reach ${url}`);
                logger.error(`Network error - Cannot reach ${url}`);
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                handleErrorWithLog('TIMEOUT_ERROR', `Request timeout - ${url}`);
                logger.error(`Request timeout - ${url}`);
            } else {
                handleErrorWithLog('FETCH_FROM_SOURCE_ERROR', `${error.message} - Failed to fetch articles from ${url}`);
                logger.error(`Failed to fetch articles from ${url}`);
            }
        }
    }
    return articles;
}

async function searchAndFilterArticles(query){
    try{
        const { title='', startDate='', endDate='', topics='', entities='', page = 1, limit = 10 } = query;
        return await searchArticles({title, startDate, endDate, topics, entities}, parseInt(page), parseInt(limit));
    }catch (error) {
        handleErrorWithLog('SEARCH_FILTER_ARTICLE_ERROR', `${error.message} - Failed to filter articles`);
        throw error;
    }
}

module.exports = {
    startFetchArticles,
    searchAndFilterArticles
};
