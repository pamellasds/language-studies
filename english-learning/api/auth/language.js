const { connectDB, models } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { User } = models();
  const { userId, language } = req.body;
  await User.findByIdAndUpdate(userId, { language });
  res.json({ ok: true });
};
