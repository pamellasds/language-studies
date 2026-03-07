const mongoose = require('mongoose');

const verbSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  word: {
    en: { type: String, required: true },
    es: { type: String, required: true },
  },
  definition: {
    en: { type: String, required: true },
    es: { type: String, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Verb', verbSchema);
