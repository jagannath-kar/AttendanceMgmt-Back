const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Login = require('../models/loginModel'); // adjust path
const { add } = require('../utils/tokenBlacklist'); // adjust path to your blacklist helper
 
const COOKIE_NAME = 'token';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
 
async function login(req, res) {
  try {
    const { empRefId, password } = req.body;
    if (!empRefId || !password) return res.status(400).json({ error: 'empRefId and password required' });
 
    // empRefId is number: find login doc by number
    const login = await Login.findOne({ empRefId }).populate('employeeId').exec();
    if (!login) return res.status(401).json({ error: 'Invalid credentials' });
 
    const match = await bcrypt.compare(password, login.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
 
    // payload contains login doc id (for passport lookup) plus optionally empRefId or employeeId
    const payload = { id: login._id, empRefId: login.empRefId };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
 
    // set cookie (httpOnly)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // 1 hour
    });
 
    // response — keep it minimal. return empRefId and maybe employee basic info from populate
    return res.json({
      message: 'Login successful',
      user: {
        empRefId: login.empRefId,
        // if populated, return employee simple info; otherwise return employeeId
        employee: login.employeeId ? { id: login.employeeId._id, empId: login.employeeId.empId, name: login.employeeId.empName } : { id: login.employeeId }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
 
function welcome(req, res) {
  // passport attaches user (the small object you returned in passport strategy) to req.user
  // You wanted just name and empid -> look at req.user.employee
  const empRefId = req.user?.empRefId;
  const name = req.user?.employee?.empName || req.user?.employee?.name || null;
  return res.json({ message: `Welcome ${empRefId}`, user: { name, empRefId } });
}
 
async function logout(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.clearCookie(COOKIE_NAME);
      return res.status(200).json({ message: 'No token present; cookie cleared' });
    }
 
    // add token to blacklist
    add(token);
    // clear cookie on client
    res.clearCookie(COOKIE_NAME);
    return res.json({ message: 'Logout successful. Token blacklisted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
 
module.exports = { login, welcome, logout };