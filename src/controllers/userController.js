const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const mongoose = require('mongoose');

const calculateWorkHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut || clockOut <= clockIn) {
        return 0;
    }
    const diffMs = clockOut.getTime() - clockIn.getTime();
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

// exports.getAllEmployees = async (req, res, next) => {
//     try {
//         const employees = await Employee.find({})
//             .select('-attendance_id -leave_id'); 

//         if (!employees || employees.length === 0) {
//             return res.status(404).json({ message: 'No employees found' });
//         }

//         res.status(200).json(employees);
//     } catch (error) {
//         next(error);
//     }
// };
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find({}).select('-attendance_id -leave_id');
    // console.log('Fetched employees:', employees); 

    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: 'No employees found' });
    }

    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeWithAllAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Employee ID format' });
        }

        const employee = await Employee.findById(id)
            .populate({
                path: 'attendance_id',
                model: 'attendance',
                options: { sort: { date: -1 } } 
            })
            .exec();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        next(error);
    }
};

exports.getLastFourDaysAttendance = async (req, res, next) => {
    try {
        const { id } = req.params; 

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Employee ID format' });
        }

        const employee = await Employee.findById(id)
            .select('attendance_id')
            .populate({
                path: 'attendance_id',
                model: 'attendance',
                options: { 
                    sort: { date: -1 }, 
                    limit: 4            
                }
            })
            .exec();

        if (!employee || !employee.attendance_id || employee.attendance_id.length === 0) {
            return res.status(404).json({ message: 'No recent attendance records found for this employee' });
        }

        res.status(200).json({
            employee_id: id,
            most_recent_records: employee.attendance_id
        });
    } catch (error) {
        next(error);
    }
};

exports.clockIn = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const { date, clock_in } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Employee ID format' });
        }
        if (!date || !clock_in) {
            return res.status(400).json({ message: 'Missing required fields: date, clock_in' });
        }

        const recordDate = new Date(date);
        
        // Find existing record via population matching the date
        const employee = await Employee.findById(id)
            .populate({
                path: 'attendance_id',
                model: 'attendance', 
                match: { date: recordDate } 
            });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.attendance_id.length > 0) {
            return res.status(409).json({ message: `Employee is already clocked in for this date.` });
        }

        // 1. Create and save the new Attendance record
        const newRecord = new Attendance({
            date: recordDate,
            clock_in: new Date(clock_in),
            // No ref_id set
        });
        await newRecord.save();

        // 2. UPDATE Employee document: Push the new Attendance record ID into the array
        await Employee.findByIdAndUpdate(id, {
            $push: { attendance_id: newRecord._id }
        }, { new: true, runValidators: true }); 

        res.status(201).json({
            message: 'Clock-in recorded successfully. Employee reference updated.',
            record: newRecord
        });
    } catch (error) {
        next(error);
    }
};

exports.editClockOutTime = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const { date, clock_out } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Employee ID format' });
        }
        if (!date || !clock_out) {
            return res.status(400).json({ message: 'Missing required fields: date, clock_out' });
        }

        const recordDate = new Date(date);
        const newClockOut = new Date(clock_out);

        // Use population to find the specific attendance record
        const employee = await Employee.findById(id)
            .populate({
                path: 'attendance_id',
                model: 'attendance', 
                match: { date: recordDate } 
            });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        const existingRecord = employee.attendance_id[0];

        if (!existingRecord) {
            return res.status(404).json({ message: `Attendance record not found for employee ${id} on ${date}.` });
        }

        const calculatedHours = calculateWorkHours(existingRecord.clock_in, newClockOut);

        if (calculatedHours <= 0) {
            return res.status(400).json({ message: 'Clock-out time must be after the recorded clock-in time.' });
        }

        // Update the Attendance record directly using its _id
        const updatedRecord = await Attendance.findOneAndUpdate(
            { _id: existingRecord._id },
            {
                $set: {
                    clock_out: newClockOut,
                    total_work_hours: calculatedHours
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Clock-out time and total work hours updated successfully.',
            record: updatedRecord
        });
    } catch (error) {
        next(error);
    }
};