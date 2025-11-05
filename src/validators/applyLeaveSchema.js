const { checkSchema } = require('express-validator');

const applyLeaveSchema = checkSchema({
  empid: {
    in: ['body'],
    exists: {
      errorMessage: 'Employee ID (empid) is required.',
    },
    isString: {
      errorMessage: 'Employee ID must be a string.',
    },
    trim: true,
  },
  empname: {
    in: ['body'],
    exists: {
      errorMessage: 'Employee name (empname) is required.',
    },
    isString: {
      errorMessage: 'Employee name must be a string.',
    },
    trim: true,
  },
  leaveManagementId: {
    in: ['body'],
    exists: {
      errorMessage: 'Leave Management ID is required.',
    },
    isString: {
      errorMessage: 'Leave Management ID must be a string.',
    },
    trim: true,
  },
  leaveRefId: {
    in: ['body'],
    exists: {
      errorMessage: 'Leave Reference ID is required.',
    },
    isString: {
      errorMessage: 'Leave Reference ID must be a string.',
    },
    trim: true,
  },
  startdate: {
    in: ['body'],
    exists: {
      errorMessage: 'Start date is required.',
    },
    isISO8601: {
      errorMessage: 'Start date must be a valid ISO date (YYYY-MM-DD).',
    },
    trim: true,
  },
  enddate: {
    in: ['body'],
    exists: {
      errorMessage: 'End date is required.',
    },
    isISO8601: {
      errorMessage: 'End date must be a valid ISO date (YYYY-MM-DD).',
    },
    trim: true,
    custom: {
      options: (value, { req }) => {
        const start = new Date(req.body.startdate);
        const end = new Date(value);
        if (start >= end) {
          throw new Error('End date must be after start date.');
        }
        return true;
      }
    }
  },
  leavetype: {
  in: ['body'],
  exists: {
    errorMessage: 'Leave type is required.',
  },
  isIn: {
    options: [['sick', 'casual']],
    errorMessage: 'Leave type must be one of: sick, casual',
  },
  trim: true,
},
  status: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['pending', 'approved', 'rejected']],
      errorMessage: 'Status must be one of: pending, approved, rejected',
    },
    trim: true,
  },
  appliedDays: {
    in: ['body'],
    exists: {
      errorMessage: 'Applied days is required.',
    },
    isInt: {
      options: { min: 0 },
      errorMessage: 'Applied days must be a non-negative integer.',
    }
  },
  ref_id: {
    in: ['body'],
    exists: {
      errorMessage: 'Reference ID (ref_id) is required.',
    },
    isMongoId: {
      errorMessage: 'Reference ID must be a valid MongoDB ObjectId.',
    }
  }
});

module.exports = {
  applyLeaveSchema,
};
