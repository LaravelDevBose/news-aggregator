const nlp = require('compromise');

function extractTopics(text)
{
    const doc = nlp(text);

    const nounTerms = doc.match('#Noun').out('array');
    const verbTerms = doc.match('#Verb').out('array');
    const adjectiveTerms = doc.match('#Adjective').out('array');

    const topics = [...nounTerms, ...verbTerms, ...adjectiveTerms]
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(word => word.length > 4)
        .map(word => word.toLowerCase());

    const topicsFrequency = topics.reduce((freq, word) => {
        freq[word] = (freq[word] || 0) + 1;
        return freq;
    }, {});

    return Object.entries(topicsFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([word]) => word);
}

function extractEntities(text) {
    const doc = nlp(text);

    const people = doc.people().out('array');
    const locations = doc.places().out('array');
    const organizations = doc.organizations().out('array');

    return [
        ...people.map(word => word.replace(/[^a-zA-Z0-9]/g, '')).map(word => word),
        ...locations.map(word => word.replace(/[^a-zA-Z0-9]/g, '')).map(word => word),
        ...organizations.map(word => word.replace(/[^a-zA-Z0-9]/g, '')).map(word => word)
    ];
}

module.exports = {
    extractTopics,
    extractEntities
};
