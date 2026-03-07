const { connectDB, models } = require('../../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { User, UserProgress } = models();
  const { userId } = req.query;

  const user = await User.findById(userId).catch(() => null);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const progress = await UserProgress.findOne({ user_id: user._id });
  res.json({
    user: { id: user._id, username: user.username, language: user.language },
    progress: progress || {},
  });
};
