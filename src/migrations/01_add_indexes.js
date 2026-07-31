const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const addIndexes = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  const indexDefinitions = [
    { table: 'products', name: 'idx_products_category_status', fields: ['categoryId', 'isDeleted'] },
    { table: 'products', name: 'idx_products_subcategory_status', fields: ['subcategoryId', 'isDeleted'] },
    { table: 'products', name: 'idx_products_slug', fields: ['slug'] },
    { table: 'orders', name: 'idx_orders_user_created', fields: ['userId', 'createdAt'] },
    { table: 'orders', name: 'idx_orders_status', fields: ['paymentStatus', 'orderStatus'] },
    { table: 'orders', name: 'idx_orders_number', fields: ['orderNumber'] },
    { table: 'users', name: 'idx_users_email', fields: ['email'] },
    { table: 'users', name: 'idx_users_phone', fields: ['phoneNumber'] }
  ];

  for (const idx of indexDefinitions) {
    try {
      const tables = await queryInterface.showAllTables();
      if (tables.includes(idx.table)) {
        await queryInterface.addIndex(idx.table, idx.fields, {
          name: idx.name,
          logging: false
        });
        logger.info(`Index ${idx.name} ensured on table ${idx.table}`);
      }
    } catch (err) {
      // Ignore if index already exists
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate key')) {
        logger.warn(`Notice adding index ${idx.name}: ${err.message}`);
      }
    }
  }
};

module.exports = { addIndexes };
