const bcrypt = require('bcryptjs');
const { connectDB, models } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await connectDB();
    const { User, UserProgress } = models();
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const lang = user.language || 'en';
    let progress = await UserProgress.findOne({ user_id: user._id, language: lang });
    if (!progress) {
      progress = await UserProgress.create({
        user_id: user._id,
        language: lang,
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
  } catch (err) {
    console.error('api/auth/login error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
