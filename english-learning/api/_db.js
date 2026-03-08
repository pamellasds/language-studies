// Shared MongoDB connection for Vercel serverless (connection reuse)
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongooseConn;

async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');
  if (cached && mongoose.connection.readyState >= 1) return;
  cached = await mongoose.connect(MONGODB_URI);
  global._mongooseConn = cached;
}

// ── Inline models (avoid cross-file issues in serverless) ─────────────────
const modeSchema = new mongoose.Schema({
  id: String, name: { en: String, es: String }, definition: { en: String, es: String },
});
const categorySchema = new mongoose.Schema({ id: String, name: { en: String, es: String } });
const verbSchema = new mongoose.Schema({
  id: String, word: { en: String, es: String }, definition: { en: String, es: String },
});
const sentenceSetSchema = new mongoose.Schema({
  id: String, mode_id: String, category_id: String, verb_id: String,
  examples: mongoose.Schema.Types.Mixed,
  bible_reference: mongoose.Schema.Types.Mixed,
  source: String, llm_model: String, reviewed: Boolean,
});
const userSchema = new mongoose.Schema({
  username: String, password_hash: String, language: { type: String, default: 'en' },
});
const userProgressSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  language: { type: String, default: 'en' },
  globalDayCounter: { type: Number, default: 1 },
  studyStartDate: String, lastStudyDate: String,
  todayCompleted: [String],
  modeProgress: mongoose.Schema.Types.Mixed,
  dailyHistory:  mongoose.Schema.Types.Mixed,
});

const models = () => ({
  Mode:         mongoose.models.Mode         || mongoose.model('Mode',         modeSchema),
  Category:     mongoose.models.Category     || mongoose.model('Category',     categorySchema),
  Verb:         mongoose.models.Verb         || mongoose.model('Verb',         verbSchema),
  SentenceSet:  mongoose.models.SentenceSet  || mongoose.model('SentenceSet',  sentenceSetSchema),
  User:         mongoose.models.User         || mongoose.model('User',         userSchema),
  UserProgress: mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema),
});

module.exports = { connectDB, models };
