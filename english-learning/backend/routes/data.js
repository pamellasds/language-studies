/**
 * GET /api/data
 * Returns all modes, categories, verbs and sentence_sets in one call
 * (same shape as the local db.json so the frontend is a drop-in swap)
 */
const express  = require('express');
const router   = express.Router();
const Mode        = require('../models/Mode');
const Category    = require('../models/Category');
const Verb        = require('../models/Verb');
const SentenceSet = require('../models/SentenceSet');

router.get('/', async (req, res) => {
  try {
    const [modes, categories, verbs, sentence_sets] = await Promise.all([
      Mode.find({}, '-_id -__v -createdAt -updatedAt').lean(),
      Category.find({}, '-_id -__v -createdAt -updatedAt').lean(),
      Verb.find({}, '-_id -__v -createdAt -updatedAt').lean(),
      SentenceSet.find({}, '-_id -__v -createdAt -updatedAt -source -llm_model -llm_prompt_version -reviewed').lean(),
    ]);
    res.json({ modes, categories, verbs, sentence_sets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Individual endpoints
router.get('/modes',         async (_req, res) => {
  const data = await Mode.find({}, '-_id -__v -createdAt -updatedAt').lean();
  res.json(data);
});

router.get('/categories',    async (_req, res) => {
  const data = await Category.find({}, '-_id -__v -createdAt -updatedAt').lean();
  res.json(data);
});

router.get('/verbs',         async (_req, res) => {
  const data = await Verb.find({}, '-_id -__v -createdAt -updatedAt').lean();
  res.json(data);
});

router.get('/sentence-sets', async (req, res) => {
  const filter = {};
  if (req.query.mode_id)     filter.mode_id     = req.query.mode_id;
  if (req.query.category_id) filter.category_id = req.query.category_id;
  const data = await SentenceSet.find(filter, '-_id -__v -createdAt -updatedAt -source -llm_model -llm_prompt_version -reviewed').lean();
  res.json(data);
});

module.exports = router;
