const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const database = process.env.MYSQL_DATABASE || 'mygold';
const username = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || 'password';

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 50,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false
  },
  timezone: '+05:30' // Match local time zone
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL Database Connected Successfully via Sequelize');
    console.log('MySQL Database Connected Successfully via Sequelize');
  } catch (error) {
    logger.error('Failed to connect to MySQL:', error);
    console.error('Failed to connect to MySQL:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};
