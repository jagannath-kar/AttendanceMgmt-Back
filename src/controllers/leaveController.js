const { v4: uuidv4 } = require('uuid');
const LeaveManagement = require('../models/leaveManagementModel');

function calculateDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

async function applyLeave(req, res) {
  const { empid, empname, startdate, enddate, leavetype } = req.body;

  if (!empid || !empname || !startdate || !enddate || !leavetype) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedLeaveType = leavetype.toLowerCase();
  if (!['sick', 'casual'].includes(normalizedLeaveType)) {
    return res.status(400).json({ error: 'Invalid leave type' });
  }

  const number_of_days = calculateDays(startdate, enddate);

  try {
    const newLeave = new LeaveManagement({
      leaveManagementId: uuidv4(),
      empId: empid,
      empName: empname,
      startDate: startdate,
      endDate: enddate,
      leaveRefId: uuidv4(),
      leaveType: normalizedLeaveType,
      appliedDays: number_of_days
    });

    await newLeave.save();
    res.status(201).json({
      message: 'Leave applied successfully',
      leave_id: newLeave.leaveManagementId
    });
  } catch (err) {
    console.error('Error applying leave:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeaveStatusByEmpId(req, res) {
  const { empid } = req.params;

  try {
    const records = await LeaveManagement.find({ empId: empid });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No leave records found for this employee' });
    }

    const statusSummary = records.map(record => ({
      leave_id: record.leaveManagementId,
      leavetype: record.leaveType,
      startdate: record.startDate,
      enddate: record.endDate,
      status: record.status
    }));

    res.json({
      employee_id: empid,
      leave_status: statusSummary
    });
  } catch (err) {
    console.error('Error fetching leave status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeaveStatusForManager(req, res) {
  try {
    const data = await LeaveManagement.find();

    if (data.length === 0) {
      return res.status(404).json({ message: 'No leave records found' });
    }

    res.json({
      viewed_by: 'Manager',
      leave_records: data
    });
  } catch (err) {
    console.error('Error fetching manager leave status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
async function updateLeaveStatusByManager(req, res) {
  const { leaveId } = req.params;
  const { status } = req.body;

  // Validate status input
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value. Must be "accepted" or "rejected".' });
  }

  try {
    // Find the leave record by MongoDB's default _id
    const leaveRecord = await LeaveManagement.findById(leaveId);

    if (!leaveRecord) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    // Update the status
    leaveRecord.status = status;
    await leaveRecord.save();

    res.status(200).json({
      message: `Leave status updated to "${status}"`,
      updated_leave: {
        leave_id: leaveRecord._id,
        employee_id: leaveRecord.empId,
        employee_name: leaveRecord.empName,
        leave_type: leaveRecord.leaveType,
        start_date: leaveRecord.startDate,
        end_date: leaveRecord.endDate,
        status: leaveRecord.status
      }
    });
  } catch (error) {
    console.error(`Error updating leave status for leaveId ${leaveId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  applyLeave,
  getLeaveStatusByEmpId,
  getLeaveStatusForManager,
  updateLeaveStatusByManager
};
