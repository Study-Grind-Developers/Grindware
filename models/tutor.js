const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true }
});

module.exports = mongoose.model('Tutor', tutorSchema);
