const express = require('express');
const { applyLeave,getLeaveStatusForManager, getLeaveStatusByEmpId, updateLeaveStatusByManager} = require('../controllers/leaveController');
const { applyLeaveSchema } = require('../validators/applyLeaveSchema');
const router = express.Router();

router.post('/apply-leave', applyLeaveSchema, applyLeave);
router.get('/leave-status/:empid', getLeaveStatusByEmpId);
router.get('/manager-leave-status', getLeaveStatusForManager);
router.put('/status-update/:leaveId',updateLeaveStatusByManager)
module.exports = router;