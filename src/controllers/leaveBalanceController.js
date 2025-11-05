const mongoose = require('mongoose');
const LeaveManagement = require('../models/leaveManagementModel');
const Employee = require('../models/employeeModel');
const Leave = require('../models/leaveBalanceModel');

// Apply for leave
exports.applyLeave = async (req, res) => {
    try {
        const { empId, leaveType, startDate, endDate, appliedDays } = req.body;

        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findOne({ empId: empObjectId });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const leavePolicy = await Leave.findOne();
        if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

        const currentTaken = leaveType === 'Sick Leave'
            ? employee.totalSickLeaveTaken
            : employee.totalCasualLeaveTaken;

        const maxAllowed = leaveType === 'Sick Leave'
            ? leavePolicy.sick.total
            : leavePolicy.casual.total;

        if (currentTaken + appliedDays > maxAllowed) {
            return res.status(400).json({ error: 'Insufficient leave balance' });
        }

        const newLeave = new LeaveManagement({
            leaveRefId: leavePolicy._id,
            empId: empObjectId,
            startDate,
            endDate,
            leaveType,
            appliedDays,
            status: 'pending'
        });

        await newLeave.save();

        if (leaveType === 'Sick Leave') {
            employee.totalSickLeaveTaken += appliedDays;
        } else {
            employee.totalCasualLeaveTaken += appliedDays;
        }

        await employee.save();

        res.status(201).json({ message: 'Leave applied', data: newLeave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update leave status (approve/reject)
exports.updateLeaveStatus = async (req, res) => {
    try {
        const leaveManagementId = req.params.leaveManagementId.trim();
        const { status } = req.body;

        const leaveRequest = await LeaveManagement.findById(leaveManagementId);
        if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });

        const empObjectId = new mongoose.Types.ObjectId(leaveRequest.empId);
        const employee = await Employee.findOne({ empId: empObjectId });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        if (leaveRequest.status !== 'rejected' && status === 'rejected') {
            if (leaveRequest.leaveType === 'Sick Leave') {
                employee.totalSickLeaveTaken -= leaveRequest.appliedDays;
            } else {
                employee.totalCasualLeaveTaken -= leaveRequest.appliedDays;
            }
            await employee.save();
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        res.json({ message: 'Leave status updated', data: leaveRequest });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get leave balance for an employee
exports.getLeaveBalance = async (req, res) => {
    try {
        const empId = req.params.empId.trim();
        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findOne({ empId: empObjectId });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const leavePolicy = await Leave.findOne();
        if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

        const sickUsed = employee.totalSickLeaveTaken || 0;
        const casualUsed = employee.totalCasualLeaveTaken || 0;

        const sickRemaining = leavePolicy.sick.total - sickUsed;
        const casualRemaining = leavePolicy.casual.total - casualUsed;

        res.json({
            empId,
            sickLeaveUsed: sickUsed,
            sickLeaveRemaining: sickRemaining,
            casualLeaveUsed: casualUsed,
            casualLeaveRemaining: casualRemaining
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
