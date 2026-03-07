const express      = require('express');
const router       = express.Router();
const UserProgress = require('../models/UserProgress');

// GET /api/progress/:userId
router.get('/:userId', async (req, res) => {
  const p = await UserProgress.findOne({ user_id: req.params.userId });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// PUT /api/progress/:userId  — full state sync from frontend
router.put('/:userId', async (req, res) => {
  const { globalDayCounter, studyStartDate, lastStudyDate, todayCompleted, modeProgress, dailyHistory } = req.body;

  const p = await UserProgress.findOneAndUpdate(
    { user_id: req.params.userId },
    { globalDayCounter, studyStartDate, lastStudyDate, todayCompleted, modeProgress, dailyHistory },
    { new: true, upsert: true }
  );
  res.json(p);
});

module.exports = router;
