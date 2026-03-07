const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: {
    en: { type: String, required: true },
    es: { type: String, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
