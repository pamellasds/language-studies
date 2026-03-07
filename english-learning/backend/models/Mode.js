const mongoose = require('mongoose');

const modeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: {
    en: { type: String, required: true },
    es: { type: String, required: true },
  },
  definition: {
    en: { type: String, required: true },
    es: { type: String, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Mode', modeSchema);
