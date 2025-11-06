// const mongoose = require('mongoose');
// const LeaveManagement = require('../models/leaveManagementModel');
// const Employee = require('../models/employeeModel');
// const Leave = require('../models/leaveBalanceModel');

// // Apply for leave
// exports.applyLeave = async (req, res) => {
//     try {
//         const { empId, leaveType, startDate, endDate, appliedDays } = req.body;

//         const empObjectId = new mongoose.Types.ObjectId(empId);

//         const employee = await Employee.findOne({ empId: empObjectId });
//         if (!employee) return res.status(404).json({ error: 'Employee not found' });

//         const leavePolicy = await Leave.findOne();
//         if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

//         const currentTaken = leaveType === 'Sick Leave'
//             ? employee.totalSickLeaveTaken
//             : employee.totalCasualLeaveTaken;

//         const maxAllowed = leaveType === 'Sick Leave'
//             ? leavePolicy.sick.total
//             : leavePolicy.casual.total;

//         if (currentTaken + appliedDays > maxAllowed) {
//             return res.status(400).json({ error: 'Insufficient leave balance' });
//         }

//         const newLeave = new LeaveManagement({
//             leaveRefId: leavePolicy._id,
//             empId: empObjectId,
//             startDate,
//             endDate,
//             leaveType,
//             appliedDays,
//             status: 'pending'
//         });

//         await newLeave.save();

//         if (leaveType === 'Sick Leave') {
//             employee.totalSickLeaveTaken += appliedDays;
//         } else {
//             employee.totalCasualLeaveTaken += appliedDays;
//         }

//         await employee.save();

//         res.status(201).json({ message: 'Leave applied', data: newLeave });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // Update leave status (approve/reject)
// exports.updateLeaveStatus = async (req, res) => {
//     try {
//         const leaveManagementId = req.params.leaveManagementId.trim();
//         const { status } = req.body;

//         const leaveRequest = await LeaveManagement.findById(leaveManagementId);
//         if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });

//         const empObjectId = new mongoose.Types.ObjectId(leaveRequest.empId);
//         const employee = await Employee.findOne({ empId: empObjectId });
//         if (!employee) return res.status(404).json({ error: 'Employee not found' });

//         if (leaveRequest.status !== 'rejected' && status === 'rejected') {
//             if (leaveRequest.leaveType === 'Sick Leave') {
//                 employee.totalSickLeaveTaken -= leaveRequest.appliedDays;
//             } else {
//                 employee.totalCasualLeaveTaken -= leaveRequest.appliedDays;
//             }
//             await employee.save();
//         }

//         leaveRequest.status = status;
//         await leaveRequest.save();

//         res.json({ message: 'Leave status updated', data: leaveRequest });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // Get leave balance for an employee
// exports.getLeaveBalance = async (req, res) => {
//     try {
//         const empId = req.params.empId.trim();
//         const empObjectId = new mongoose.Types.ObjectId(empId);

//         const employee = await Employee.findOne({ empId: empObjectId });
//         if (!employee) return res.status(404).json({ error: 'Employee not found' });

//         const leavePolicy = await Leave.findOne();
//         if (!leavePolicy) return res.status(500).json({ error: 'Leave policy not found' });

//         const sickUsed = employee.totalSickLeaveTaken || 0;
//         const casualUsed = employee.totalCasualLeaveTaken || 0;

//         const sickRemaining = leavePolicy.sick.total - sickUsed;
//         const casualRemaining = leavePolicy.casual.total - casualUsed;

//         res.json({
//             empId,
//             sickLeaveUsed: sickUsed,
//             sickLeaveRemaining: sickRemaining,
//             casualLeaveUsed: casualUsed,
//             casualLeaveRemaining: casualRemaining
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };
// const mongoose = require('mongoose');

// const leaveManagementSchema = new mongoose.Schema({
//   empId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'employee'
//   },

//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },

//   leaveRefId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Leave',
//     required: true
//   },

//   leaveType: {
//     type: String,
//     enum: ['Sick Leave', 'Casual Leave'],
//     required: true
//   },

//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },

//   appliedDays: {
//     type: Number,
//     required: true,
//     min: 1
//   }
// });

// module.exports = mongoose.model('LeaveManagement', leaveManagementSchema);

// // http://localhost:8000/api/leave-management/balance/2
// // http://localhost:8000/api/leave-management/status/690b12c79b82c4df4930bb71=>we are doing this because for each leave request id is unique
// // http://localhost:8000/api/leave-management/apply
// // {
// //   "empId": 2,
// //   "leaveType": "Sick Leave",
// //   "startDate": "2023-11-06",
// //   "endDate": "2023-11-07",
// //   "appliedDays": 2
// // }


const mongoose = require('mongoose');
const LeaveManagement = require('../models/leaveManagementModel');
const Employee = require('../models/employeeModel');
const Leave = require('../models/leaveBalanceModel');

exports.applyLeave = async (req, res) => {
    try {
        const { empId, leaveType, startDate, endDate, appliedDays } = req.body;
        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findById(empObjectId);
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
            empId: empObjectId,
            leaveRefId: leavePolicy._id,
            startDate,
            endDate,
            leaveType,
            appliedDays
        });

        await newLeave.save();

        if (leaveType === 'Sick Leave') {
            employee.totalSickLeaveTaken += appliedDays;
        } else {
            employee.totalCasualLeaveTaken += appliedDays;
        }

        employee.leave_id.push(newLeave._id);
        await employee.save();

        res.status(201).json({ message: 'Leave applied', data: newLeave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const leaveManagementId = req.params.leaveManagementId.trim();
        const { status } = req.body;

        const leaveRequest = await LeaveManagement.findById(leaveManagementId);
        if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });

        const employee = await Employee.findById(leaveRequest.empId);
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

exports.getLeaveBalance = async (req, res) => {
    try {
        const empId = req.params.empId.trim();
        const empObjectId = new mongoose.Types.ObjectId(empId);

        const employee = await Employee.findById(empObjectId);
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
