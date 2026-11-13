const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
