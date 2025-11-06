// middleware/rejectBlacklistedTokens.js
const { has } = require('../utils/tokenBlacklist');
const Login = require('../models/loginModel');
 
async function rejectBlacklistedTokens(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (token && has(token)) return res.status(401).json({ error: 'Token blacklisted' });
 
  // optional extra check: if req.user is set later by passport we can verify equality,
  // but to compare activeToken we need req.user. We'll add a small helper used after passport:
  req._presentedToken = token;
  next();
}
 
// optional middleware to ensure req.user.activeToken === token (use AFTER passport authenticate)
function ensureTokenMatchesActive(req, res, next) {
  const token = req._presentedToken;
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!req.user.activeToken) return res.status(401).json({ error: 'No active session' });
  if (req.user.activeToken !== token) return res.status(401).json({ error: 'Token mismatch' });
  next();
}
 
module.exports = { rejectBlacklistedTokens, ensureTokenMatchesActive };
 