const cron = require('node-cron');
const { UserKitty } = require('../models');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const initKittyCron = () => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        let lockAcquired = false;
        const lockKey = 'cron_lock_kitty_daily';
        
        try {
            // Distributed lock: Only 1 cluster worker executes the cron job
            if (redisClient && redisClient.isReady) {
                const acquired = await redisClient.set(lockKey, String(process.pid), { NX: true, EX: 3600 });
                if (!acquired) {
                    logger.info(`Cron kitty job skipped on worker ${process.pid} (already locked by another worker)`);
                    return;
                }
                lockAcquired = true;
            }

            logger.info('Starting daily Kitty plan status update cron job...');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeKitties = await UserKitty.findAll({
                where: { status: 'active' }
            });

            for (const kitty of activeKitties) {
                try {
                    let updated = false;
                    const payments = Array.isArray(kitty.payments) ? [...kitty.payments] : [];
                    payments.forEach(p => {
                        if (p.status === 'pending' && new Date(p.dueDate) < today) {
                            p.status = 'overdue';
                            updated = true;
                        }
                    });
                    if (updated) {
                        await kitty.update({ payments });
                    }
                } catch (recordErr) {
                    logger.error(`Error updating kitty record ${kitty.id}:`, recordErr.message);
                }
            }
            logger.info('Completed daily Kitty plan cron job.');
        } catch (error) {
            logger.error('Error in kitty cron job execution:', error);
        }
    });
};

module.exports = { initKittyCron };
