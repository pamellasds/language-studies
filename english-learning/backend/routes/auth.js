const express      = require('express');
const router       = express.Router();
const User         = require('../models/User');
const UserProgress = require('../models/UserProgress');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !user.checkPassword(password))
    return res.status(401).json({ error: 'Invalid credentials' });

  // Get or create progress
  let progress = await UserProgress.findOne({ user_id: user._id });
  if (!progress) {
    progress = await UserProgress.create({
      user_id: user._id,
      studyStartDate: new Date().toISOString().split('T')[0],
    });
  }

  res.json({
    user: { id: user._id, username: user.username, language: user.language },
    progress: {
      globalDayCounter: progress.globalDayCounter,
      studyStartDate:   progress.studyStartDate,
      lastStudyDate:    progress.lastStudyDate,
      todayCompleted:   progress.todayCompleted,
      modeProgress:     progress.modeProgress,
      dailyHistory:     progress.dailyHistory,
    },
  });
});

// GET /api/auth/me  — validate session (token = user id stored client-side)
router.get('/me/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).catch(() => null);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const progress = await UserProgress.findOne({ user_id: user._id });
  res.json({
    user: { id: user._id, username: user.username, language: user.language },
    progress: progress || {},
  });
});

// PUT /api/auth/language
router.put('/language', async (req, res) => {
  const { userId, language } = req.body;
  await User.findByIdAndUpdate(userId, { language });
  res.json({ ok: true });
});

module.exports = router;
