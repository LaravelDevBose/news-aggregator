const { createLogger, format, transports } = require('winston');
const path = require('path');
const config = require('../../config/config');

const logger = createLogger({
    level: config.logLevel,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp to log messages
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: path.join(__dirname, '../logs/app.log'),
            level: config.logLevel,
            maxsize: 5242880,
            maxFiles: 5,
        })
    ],
});

module.exports = logger;
