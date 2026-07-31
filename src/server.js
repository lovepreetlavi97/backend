const app = require("./app");
const port = process.env.PORT || 5000;
const { initKittyCron } = require("./cron/kittyJobs");
const { validateEnv } = require("./config/envValidation");
const { addIndexes } = require("./migrations/01_add_indexes");
const { sequelize } = require("./config/database");
const { redisClient } = require("./config/redis");
const logger = require("./utils/logger");

// Validate startup environment variables
validateEnv();

// Ensure database indexes exist
addIndexes().catch(err => logger.warn('Migration warning:', err.message));

// Start background cron jobs
initKittyCron();

const server = app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode [PID ${process.pid}]`);
    console.log(`Server running on http://localhost:${port} [PID ${process.pid}]`);
});

// Graceful Shutdown Helper
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    const forceTimeout = setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);

    try {
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await sequelize.close();
                logger.info('Sequelize database connection pool closed.');
            } catch (e) {}

            try {
                if (redisClient && redisClient.isReady) {
                    await redisClient.quit();
                    logger.info('Redis client disconnected.');
                }
            } catch (e) {}

            clearTimeout(forceTimeout);
            process.exit(0);
        });
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
