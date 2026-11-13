const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file at root or server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'posterapp_jwt_secret_change_this_in_production_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '30d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
