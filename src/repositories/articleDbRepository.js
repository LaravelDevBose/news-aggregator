const Article = require('../models/articleModel');
const {handleErrorWithLog} = require("../utils/errorHandler");
async function updateOrInsertArticles(articles) {
    try {
        const operations = articles.map(article => ({
            updateOne: {
                filter: { guid: article.guid },
                update: { $set: article },
                upsert: true
            }
        }));
        // console.log(operations, '8888888888888888888888')
        await Article.bulkWrite(operations, { ordered: false });
        console.log('Articles saved or updated successfully');
    } catch (error) {
        handleErrorWithLog('STORE_ARTICLE_ERROR', `Error saving articles: ${error.message}`);
        throw error;
    }
}

async function searchArticles(filters, page = 1, limit = 10) {
    console.log(filters);
    const query = {};

    if (filters.title) {
        query.title = { $regex: filters.title, $options: 'i' };
    }

    if (filters.startDate || filters.endDate) {
        query.pubDate = {};
        if (filters.startDate) query.pubDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.pubDate.$lte = new Date(filters.endDate);
    }

    if (filters.topics) {
        query.topics = { $in: filters.topics.split(',') };
    }

    if (filters.entities) {
        query.entities = { $in: filters.entities.split(',') };
    }
    // console.log(query, '---------------')

    const articles = await Article.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ pubDate: -1 })
        .exec();

    // console.log(articles, '=============');
    const total = await Article.countDocuments(query);
    return { articles, total, page, limit };
}

module.exports = {
    updateOrInsertArticles,
    searchArticles,
};
