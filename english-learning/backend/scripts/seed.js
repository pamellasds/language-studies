/**
 * SEED SCRIPT
 * Populates MongoDB Atlas with data from src/data/db.json
 * Run: npm run seed (from backend/)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const db_data = require(path.join(__dirname, '../../src/data/db.json'));
const Mode        = require('../models/Mode');
const Category    = require('../models/Category');
const Verb        = require('../models/Verb');
const SentenceSet = require('../models/SentenceSet');

async function seed() {
  console.log('🌱 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected:', mongoose.connection.host);

  // ── Modes ─────────────────────────────────────────────────────────────────
  console.log('\n📝 Seeding modes...');
  let modesInserted = 0;
  for (const item of db_data.modes) {
    await Mode.updateOne({ id: item.id }, item, { upsert: true });
    modesInserted++;
  }
  console.log(`   ✔ ${modesInserted} modes upserted`);

  // ── Categories ────────────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  let catsInserted = 0;
  for (const item of db_data.categories) {
    await Category.updateOne({ id: item.id }, item, { upsert: true });
    catsInserted++;
  }
  console.log(`   ✔ ${catsInserted} categories upserted`);

  // ── Verbs ─────────────────────────────────────────────────────────────────
  console.log('🔤 Seeding verbs...');
  let verbsInserted = 0;
  for (const item of db_data.verbs) {
    await Verb.updateOne({ id: item.id }, item, { upsert: true });
    verbsInserted++;
  }
  console.log(`   ✔ ${verbsInserted} verbs upserted`);

  // ── Sentence Sets ─────────────────────────────────────────────────────────
  console.log('💬 Seeding sentence sets...');
  let setsInserted = 0;
  for (const item of db_data.sentence_sets) {
    const doc = { ...item, source: 'import', reviewed: true };
    await SentenceSet.updateOne({ id: item.id }, doc, { upsert: true });
    setsInserted++;
  }
  console.log(`   ✔ ${setsInserted} sentence sets upserted`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!');
  console.log(`   Modes:         ${modesInserted}`);
  console.log(`   Categories:    ${catsInserted}`);
  console.log(`   Verbs:         ${verbsInserted}`);
  console.log(`   Sentence Sets: ${setsInserted}`);

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB Atlas');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
