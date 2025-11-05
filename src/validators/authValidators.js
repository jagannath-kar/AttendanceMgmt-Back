// src/validators/authValidators.js
const { check, validationResult } = require('express-validator');
const loginValidators = [
  // empRefId: required, must be a number
  check('empRefId')
    .exists({ checkFalsy: true }).withMessage('empRefId is required')
    .bail()
    .isInt().withMessage('empRefId must be an integer'),

  // password: required, string, min length
  check('password')
    .exists({ checkFalsy: true }).withMessage('password is required')
    .bail()
    .isString().withMessage('password must be a string')
    .bail()
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
  // result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
module.exports = {
  loginValidators
};
