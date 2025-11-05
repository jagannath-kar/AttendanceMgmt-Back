const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const Login = require('../models/loginModel');
require('dotenv').config();
 
const cookieExtractor = function(req) {
  if (!req || !req.cookies) return null;
  return req.cookies.token || null;
};
 
module.exports = function(passport) {
  const opts = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET || 'default_jwt_secret'
  };
 
  passport.use(new JwtStrategy(opts, async (payload, done) => {
    try {
      // payload.id is the login doc id
      const login = await Login.findById(payload.id).populate('employeeId').exec();
      if (!login) return done(null, false);
 
      const user = {
        id: login._id,
        empRefId: login.empRefId,
        // if populated employeeId will be the employee doc else ObjectId
        employee: login.employeeId
      };
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }));
};
 