const express = require('express');
const { validationResult } = require('express-validator'); // <-- ADD THIS
const router = express.Router();
const userController = require('../controllers/userController');

// Import the new schemas from the validators folder
const { clockInSchema } = require('../validators/clockinSchema'); 
const { editClockOutTimeSchema } = require('../validators/clockoutSchema'); 


// Validation Middleware (Define this in your userRoutes or a separate file)
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array() // Returns the detailed errors
    });
};


router.get('/attendance/last-4-days/:id', userController.getLastFourDaysAttendance);


// Clock-In Route: Apply schema and validate middleware
router.post(
    '/attendance/clock-in/:id',
    clockInSchema,      // <-- New validation schema applied
    validate,           // <-- Middleware to check results
    userController.clockIn
);


// Clock-Out Route: Apply schema and validate middleware
router.put(
    '/attendance/clock-out/:id',
    editClockOutTimeSchema, // <-- New validation schema applied
    validate,               // <-- Middleware to check results
    userController.editClockOutTime
);


router.get('/', userController.getAllEmployees);
router.get('/:id', userController.getEmployeeWithAllAttendance);

module.exports = router;