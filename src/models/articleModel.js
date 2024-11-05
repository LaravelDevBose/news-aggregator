const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    guid: { type: String, required: true, unique: true },
    title: { type: String, required: true, index: true },
    description: { type: String },
    pubDate: { type: Date, index: true },
    sourceUrl: { type: String, required: true },
    topics: { type: [String], index: true },
    entities: { type: [String], index: true },
    author: { type: [String] },
}, {
    timestamps: true
});

module.exports = mongoose.model('Article', articleSchema);
