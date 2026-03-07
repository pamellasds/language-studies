require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/data',     require('./routes/data'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/progress', require('./routes/progress'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Start ─────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log('   POST /api/auth/login         → login');
    console.log('   GET  /api/auth/me/:userId    → validate session');
    console.log('   GET  /api/progress/:userId   → load progress');
    console.log('   PUT  /api/progress/:userId   → save progress');
    console.log('   GET  /api/data               → all content\n');
  });
}

start().catch(err => {
  console.error('❌ Failed to start:', err.message);
  process.exit(1);
});
