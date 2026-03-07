/**
 * ADMIN ROUTES — for LLM-generated content via REST API
 *
 * POST /api/admin/content
 *   Body: { verbs[], categories[], sentence_sets[], llm_model, llm_prompt_version, reviewed }
 *   → Same schema as llm-add.js NEW_CONTENT object
 *
 * GET  /api/admin/sentence-sets?reviewed=false
 *   → List pending review items
 *
 * PATCH /api/admin/sentence-sets/:id/review
 *   Body: { reviewed: true }
 *   → Mark a set as reviewed
 *
 * DELETE /api/admin/sentence-sets/:id
 *   → Remove a rejected set
 */
const express  = require('express');
const router   = express.Router();
const Mode        = require('../models/Mode');
const Category    = require('../models/Category');
const Verb        = require('../models/Verb');
const SentenceSet = require('../models/SentenceSet');

// ── POST /api/admin/content ───────────────────────────────────────────────
router.post('/content', async (req, res) => {
  const { verbs = [], categories = [], sentence_sets = [], llm_model, llm_prompt_version, reviewed = false } = req.body;

  const meta = { source: 'llm', llm_model, llm_prompt_version, reviewed };
  const results = { categories: 0, verbs: 0, sets: 0, errors: [] };

  try {
    // Validate mode ids
    const modeIds = (await Mode.find({}, 'id')).map(m => m.id);

    // Categories
    for (const cat of categories) {
      if (!cat.id || !cat.name?.en) { results.errors.push(`Category missing id or name.en`); continue; }
      await Category.updateOne({ id: cat.id }, cat, { upsert: true });
      results.categories++;
    }

    // Verbs
    for (const verb of verbs) {
      if (!verb.id || !verb.word?.en) { results.errors.push(`Verb missing id or word.en`); continue; }
      await Verb.updateOne({ id: verb.id }, verb, { upsert: true });
      results.verbs++;
    }

    // Sentence sets
    const existingVerbIds = (await Verb.find({}, 'id')).map(v => v.id);
    const existingCatIds  = (await Category.find({}, 'id')).map(c => c.id);

    for (const set of sentence_sets) {
      if (!set.id || !set.mode_id || !set.category_id || !set.verb_id) {
        results.errors.push(`Set ${set.id || '?'}: missing required field`);
        continue;
      }
      if (!modeIds.includes(set.mode_id)) {
        results.errors.push(`Set ${set.id}: unknown mode_id "${set.mode_id}"`);
        continue;
      }
      if (!existingCatIds.includes(set.category_id)) {
        results.errors.push(`Set ${set.id}: unknown category_id "${set.category_id}"`);
        continue;
      }
      if (!existingVerbIds.includes(set.verb_id)) {
        results.errors.push(`Set ${set.id}: unknown verb_id "${set.verb_id}"`);
        continue;
      }
      await SentenceSet.updateOne({ id: set.id }, { ...set, ...meta }, { upsert: true });
      results.sets++;
    }

    res.status(201).json({
      message: 'Content uploaded successfully',
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/sentence-sets ──────────────────────────────────────────
router.get('/sentence-sets', async (req, res) => {
  const filter = {};
  if (req.query.reviewed !== undefined) filter.reviewed = req.query.reviewed === 'true';
  if (req.query.source)   filter.source   = req.query.source;

  const data = await SentenceSet.find(filter, '-__v').lean();
  res.json(data);
});

// ── PATCH /api/admin/sentence-sets/:id/review ─────────────────────────────
router.patch('/sentence-sets/:id/review', async (req, res) => {
  const { reviewed } = req.body;
  const doc = await SentenceSet.findOneAndUpdate(
    { id: req.params.id },
    { reviewed },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc.id, reviewed: doc.reviewed });
});

// ── DELETE /api/admin/sentence-sets/:id ───────────────────────────────────
router.delete('/sentence-sets/:id', async (req, res) => {
  const doc = await SentenceSet.findOneAndDelete({ id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
