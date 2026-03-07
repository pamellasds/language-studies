require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

const USERS = [
  { username: 'pamella', password: 'Pamella@2026', language: 'en' },
  { username: 'guest',   password: 'Guest@2026',   language: 'en' },
];

async function seedUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    await User.updateOne(
      { username: u.username },
      { username: u.username, password_hash: hash, language: u.language },
      { upsert: true }
    );
    console.log(`✔ User created: ${u.username} / ${u.password}`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Done');
}

seedUsers().catch(e => { console.error(e); process.exit(1); });
