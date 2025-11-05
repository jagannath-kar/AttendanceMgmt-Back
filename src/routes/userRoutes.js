const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/attendance/last-4-days/:id', userController.getLastFourDaysAttendance);


router.post('/attendance/clock-in/:id', userController.clockIn);


router.put('/attendance/clock-out/:id', userController.editClockOutTime);


router.get('/', userController.getAllEmployees);

router.get('/:id', userController.getEmployeeWithAllAttendance);

module.exports = router;