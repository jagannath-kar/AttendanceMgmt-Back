// src/middleware/checkBlacklist.js
const { has } = require('../utils/tokenBlacklist');
 
module.exports = function(req, res, next) {
  const token = req.cookies?.token || '';
  if (token && has(token)) {
    return res.status(401).json({ error: 'Token is blacklisted. Please login again.' });
  }
  next();
};