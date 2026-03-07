const { connectDB, models } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { UserProgress } = models();
  const { userId } = req.query;

  if (req.method === 'GET') {
    const p = await UserProgress.findOne({ user_id: userId });
    if (!p) return res.status(404).json({ error: 'Not found' });
    return res.json(p);
  }

  if (req.method === 'PUT') {
    const { globalDayCounter, studyStartDate, lastStudyDate, todayCompleted, modeProgress, dailyHistory } = req.body;
    const p = await UserProgress.findOneAndUpdate(
      { user_id: userId },
      { globalDayCounter, studyStartDate, lastStudyDate, todayCompleted, modeProgress, dailyHistory },
      { new: true, upsert: true }
    );
    return res.json(p);
  }

  res.status(405).end();
};
