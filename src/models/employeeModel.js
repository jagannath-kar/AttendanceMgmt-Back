const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    empId: {
        type: mongoose.Schema.Types.ObjectId, required: true, index: true,
        required: [true, 'Employee ID is required.'],
        unique: true,
        min: [1, 'Employee ID must be a positive number.']
    },
    empName: {
        type: String,
        required: [true, 'Employee name is required.'],
        trim: true,
        minlength: [3, 'Employee name must be at least 3 characters long.']
    },
    isManager: {
        type: Boolean,
        default: false
    },
    managerName: {
        type: String,
        trim: true,
        required: [
            function () { return !this.isManager; },
            'Manager name is required for non-managerial employees.'
        ]
    },
    totalSickLeaveTaken: {
        type: Number,
        default: 0,
        min: [0, 'Sick leave taken cannot be negative.']
    },
    totalCasualLeaveTaken: {
        type: Number,
        default: 0,
        min: [0, 'Casual leave taken cannot be negative.']
    },
    attendance_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'attendance'
    }],
    leave_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leaveManagement'
    }]
},
    {
        timestamps: true
    });

module.exports = mongoose.model('employee', employeeSchema, 'employee');
