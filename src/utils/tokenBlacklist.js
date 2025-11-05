// src/utils/tokenBlacklist.js
const tokenSet = new Set();
 
function add(token) {
  if (!token) return;
  tokenSet.add(token);
}
 
function has(token) {
  return tokenSet.has(token);
}
 
module.exports = { add, has };