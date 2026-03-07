const mongoose = require('mongoose');

const examplesLangSchema = new mongoose.Schema({
  affirmative: { type: String, required: true },
  negative:    { type: String, required: true },
  interrogative:{ type: String, required: true },
}, { _id: false });

const bibleRefSchema = new mongoose.Schema({
  book:       { type: String },
  chapter:    { type: Number },
  verse:      { type: Number },
  version_en: { type: String, default: 'KJV' },
  version_es: { type: String, default: 'RVR' },
}, { _id: false });

const sentenceSetSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  mode_id:     { type: String, required: true, index: true },
  category_id: { type: String, required: true, index: true },
  verb_id:     { type: String, required: true },
  examples: {
    en: { type: examplesLangSchema, required: true },
    es: { type: examplesLangSchema },
  },
  bible_reference: { type: bibleRefSchema, default: null },

  // Metadata for LLM-generated content
  source: {
    type: String,
    enum: ['manual', 'llm', 'import'],
    default: 'import',
  },
  llm_model: { type: String, default: null }, // e.g. 'claude-sonnet-4-6'
  llm_prompt_version: { type: String, default: null },
  reviewed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SentenceSet', sentenceSetSchema);
