const logger = require('../utils/logger');

const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const requiredInProd = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'JWT_SECRET_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ];

  if (isProd) {
    const missing = requiredInProd.filter(key => !process.env[key] || process.env[key].includes('dummy') || process.env[key] === 'password');
    if (missing.length > 0) {
      logger.error(`FATAL: Insecure or missing production environment variables: ${missing.join(', ')}`);
      if (process.env.STRICT_ENV_CHECK === 'true') {
        process.exit(1);
      }
    }
  }
};

module.exports = { validateEnv };
