const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
  empRefId: {
    type: Number, 
    required: true,
    unique: true
    
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'employee',
    required: true
  },
  password: {
    type: String,
    required: true
  }
}, { collection: 'login' });
//inverse

module.exports = mongoose.model('Login', loginSchema);
