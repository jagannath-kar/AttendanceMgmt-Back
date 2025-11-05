// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport=require('passport');
const { login, welcome, logout } = require('../controllers/authController');
const checkBlacklist=require('../middleware/checkBlacklist');
const { loginValidators }= require('../validators/authValidators');
 
router.post('/login',loginValidators, login);

router.get('/welcome',checkBlacklist, passport.authenticate('jwt', { session:false}),welcome)

router.post('/logout',checkBlacklist,logout);
 
 
module.exports = router;