const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 1. Create the winston instance
const bot = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logsDir, 'security.log'), level: 'warn' }),
        new winston.transports.File({ filename: path.join(logsDir, 'access.log') })
    ]
});

// 2. Define the exact functions the server is calling
const logger = {
    logAccess: (req, res, duration) => {
        bot.info(`ACCESS: ${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    },
    logSecurityEvent: (event, details) => {
        bot.warn(`SECURITY: ${event}`, details);
    },
    logError: (err, details) => {
        bot.error(err.message, { stack: err.stack, ...details });
    },
    info: (msg) => bot.info(msg),
    warn: (msg) => bot.warn(msg),
    error: (msg) => bot.error(msg)
};

// 3. Export as a single object
module.exports = logger;

