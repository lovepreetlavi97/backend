const cron = require('node-cron');
const { UserKitty } = require('../models');

const initKittyCron = () => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running daily kitty cron job...');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Mark embedded payments as overdue when dueDate has passed
            const result = await UserKitty.updateMany(
                {
                    status: 'active',
                    payments: {
                        $elemMatch: {
                            status: 'pending',
                            dueDate: { $lt: today }
                        }
                    }
                },
                {
                    $set: {
                        'payments.$[p].status': 'overdue'
                    }
                },
                {
                    arrayFilters: [{ 'p.status': 'pending', 'p.dueDate': { $lt: today } }]
                }
            );

            console.log(`Updated ${result.modifiedCount || result.modifiedDocs || 0} kitty payments to overdue.`);

        } catch (error) {
            console.error('Error running kitty cron:', error.message);
        }
    });
};

module.exports = { initKittyCron };
