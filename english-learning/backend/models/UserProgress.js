const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  globalDayCounter: { type: Number, default: 1 },
  studyStartDate:   { type: String },
  lastStudyDate:    { type: String, default: null },
  todayCompleted:   { type: [String], default: [] },
  modeProgress:     { type: mongoose.Schema.Types.Mixed, default: {} },
  dailyHistory:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
