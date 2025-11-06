// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Login = require('../models/loginModel');
const { add: addToBlacklist } = require('../utils/tokenBlacklist');
require('dotenv').config();
 
async function login(req, res) {
  try {
    const { employee_id, password } = req.body;
    if (employee_id == null || !password) {
      return res.status(400).json({ error: 'employee_id and password required' });
    }
 
    // find login doc and populate employee details
    const loginDoc = await Login.findOne({ employee_id }).populate('employee_ref_id').exec();
    if (!loginDoc) return res.status(401).json({ error: 'Invalid credentials' });
 
    // verify password
    const match = await bcrypt.compare(password, loginDoc.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
 
    // ensure single active session: check if someone else has activeToken
    if (loginDoc.activeToken) {
      // verify if token still valid
      try {
        jwt.verify(loginDoc.activeToken, process.env.JWT_SECRET || 'default_jwt_secret');
        // still valid -> block
        return res.status(409).json({ error: 'Already logged in. Logout first.' });
      } catch (err) {
        // expired/invalid -> clear it and continue
        await Login.findByIdAndUpdate(loginDoc._id, { $unset: { activeToken: "" } }).exec();
      }
    }
 
    // create token
    const payload = { id: loginDoc._id, employee_id: loginDoc.employee_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
 
    // atomically set activeToken only if currently null (avoid race)
    const updated = await Login.findOneAndUpdate(
      { _id: loginDoc._id, $or: [{ activeToken: { $exists: false } }, { activeToken: null }] },
      { $set: { activeToken: token } },
      { new: true }
    ).exec();
 
    if (!updated) {
      // someone else set it in the meantime
      return res.status(409).json({ error: 'Another user logged in just now. Please try again after logout.' });
    }
 
    // prepare employee payload (include isManager)
    const emp = updated.employee_ref_id || null;
    const employeePayload = emp ? {
      _id: emp._id,
      name: emp.name,
      isManager: !!emp.isManager
    } : null;
 
    return res.json({
      message: 'Login successful',
      token,
      user: {
        employee_id: updated.employee_id,
        employee: employeePayload
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
 
function welcome(req, res) {
  const employee_id = req.user?.employee_id;
  const emp = req.user?.employee_ref_id || {};
  return res.json({
    message: `Welcome ${employee_id}`,
    user: {
      name: emp.empName || null,
      employee_id,
      isManager: !!emp.isManager
    }
  });
}
 
async function logout(req, res) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
 
    if (!token) {
      return res.status(200).json({ message: 'No token present' });
    }
 
    addToBlacklist(token);
 
    if (req.user && req.user._id) {
      await Login.findByIdAndUpdate(req.user._id, { $unset: { activeToken: "" } }).exec();
    } else {
      // fallback: try to clear by token
      await Login.findOneAndUpdate({ activeToken: token }, { $unset: { activeToken: "" } }).exec();
    }
 
    return res.json({ message: 'Logout successful. Token blacklisted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
 
module.exports = { login, welcome, logout };