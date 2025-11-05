const express = require('express');
const router = express.Router();

const {
    applyLeave,
    updateLeaveStatus,
    getLeaveBalance
} = require('../controllers/leaveBalanceController');

// Apply for leave
router.post('/leave-management/apply', applyLeave);

// Update leave status (approve/reject)
router.patch('/leave-management/status/:leaveManagementId', updateLeaveStatus);

// Get leave balance for an employee
router.get('/leave-management/balance/:empId', getLeaveBalance);

module.exports = router;
