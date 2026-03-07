/**
 * LLM CONTENT GENERATOR — MongoDB Atlas Uploader
 * ─────────────────────────────────────────────────────────────────────────
 * PURPOSE:
 *   This script is meant to be called by an LLM (e.g. Claude) after
 *   generating new sentence sets, verbs, or categories.
 *
 * HOW THE LLM SHOULD USE THIS:
 *   1. Generate content following the schema below.
 *   2. Place the new data in the `NEW_CONTENT` object below.
 *   3. Run:  node scripts/llm-add.js
 *
 * VALID mode_id values (from the existing db):
 *   simple_present, present_continuous, simple_past, past_continuous,
 *   present_perfect, present_perfect_continuous, past_perfect,
 *   past_perfect_continuous, future_simple, future_continuous,
 *   future_perfect, future_perfect_continuous, zero_conditional,
 *   first_conditional, second_conditional, third_conditional,
 *   modal_can, modal_could, modal_should, modal_would, modal_might,
 *   modal_must, passive_present_simple, passive_past_simple,
 *   passive_present_perfect, passive_modal
 *
 * EXISTING category_ids (add new ones in categories array if needed):
 *   kitchen, living_room, bathroom, bedroom, garage, garden, home_office,
 *   research, technology, education, health, blockchain, software_dev,
 *   academic_writing, environment, society, culture, business, innovation,
 *   workplace, science, work, travel, career, media, security, history,
 *   law, ethics, communication, psychology, ai_technology, politics,
 *   economics, leadership, globalization, art, bible
 * ─────────────────────────────────────────────────────────────────────────
 *
 * SCHEMA REFERENCE:
 *
 * verb: {
 *   id: "unique_snake_case_id",
 *   word: { en: "english word", es: "spanish word" },
 *   definition: { en: "definition in English", es: "definición en español" }
 * }
 *
 * category (only if new): {
 *   id: "unique_snake_case_id",
 *   name: { en: "English name", es: "Nombre en español" }
 * }
 *
 * sentence_set: {
 *   id: "set_XXX",          ← must be unique (suggest set_101, set_102, ...)
 *   mode_id: "simple_present",
 *   category_id: "kitchen",
 *   verb_id: "slice",       ← must match an existing or new verb
 *   examples: {
 *     en: {
 *       affirmative:   "Affirmative sentence in English.",
 *       negative:      "Negative sentence in English.",
 *       interrogative: "Interrogative sentence in English?"
 *     },
 *     es: {
 *       affirmative:   "Oración afirmativa en español.",
 *       negative:      "Oración negativa en español.",
 *       interrogative: "¿Oración interrogativa en español?"
 *     }
 *   },
 *   bible_reference: null   ← or { book, chapter, verse, version_en, version_es }
 * }
 * ─────────────────────────────────────────────────────────────────────────
 * LLM: EDIT ONLY THE `NEW_CONTENT` OBJECT BELOW
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mode        = require('../models/Mode');
const Category    = require('../models/Category');
const Verb        = require('../models/Verb');
const SentenceSet = require('../models/SentenceSet');

// ════════════════════════════════════════════════════════════════════════════
// LLM: FILL IN THIS OBJECT WITH THE NEW CONTENT YOU GENERATED
// ════════════════════════════════════════════════════════════════════════════
const NEW_CONTENT = {

  // New verbs to add (leave empty [] if none)
  verbs: [
    {
      id: "negotiate_business",
      word: { en: "negotiate", es: "negociar" },
      definition: {
        en: "to discuss terms in order to reach a mutually beneficial agreement",
        es: "discutir condiciones para llegar a un acuerdo mutuamente beneficioso"
      }
    }
  ],

  // New categories to add (leave empty [] if none)
  categories: [
    // Example:
    // { id: "sports", name: { en: "Sports", es: "Deportes" } }
  ],

  // New sentence sets to add
  sentence_sets: [
    {
      id: "set_101",
      mode_id: "future_perfect",
      category_id: "business",
      verb_id: "negotiate_business",
      examples: {
        en: {
          affirmative: "By the end of Q4, both teams will have negotiated a landmark partnership agreement.",
          negative:    "They won't have negotiated the licensing terms before the investor meeting.",
          interrogative: "Will the lawyers have negotiated all clauses before the signing ceremony?"
        },
        es: {
          affirmative: "Para finales del cuarto trimestre, ambos equipos habrán negociado un acuerdo de asociación histórico.",
          negative:    "No habrán negociado los términos de la licencia antes de la reunión con inversores.",
          interrogative: "¿Habrán negociado los abogados todas las cláusulas antes de la ceremonia de firma?"
        }
      },
      bible_reference: null
    }
  ],

  // Metadata about this generation (fill in)
  llm_model: "claude-sonnet-4-6",          // which model generated this
  llm_prompt_version: "v1.0",               // optional version tag
  reviewed: false,                          // set to true after human review
};
// ════════════════════════════════════════════════════════════════════════════


async function addContent() {
  console.log('🤖 LLM Content Uploader — MongoDB Atlas');
  console.log('──────────────────────────────────────────');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  const meta = {
    source: 'llm',
    llm_model: NEW_CONTENT.llm_model || 'unknown',
    llm_prompt_version: NEW_CONTENT.llm_prompt_version || null,
    reviewed: NEW_CONTENT.reviewed || false,
  };

  let results = { categories: 0, verbs: 0, sets: 0, errors: [] };

  // ── Validate modes exist ─────────────────────────────────────────────────
  const modeIds = (await Mode.find({}, 'id')).map(m => m.id);

  // ── Insert categories ────────────────────────────────────────────────────
  if (NEW_CONTENT.categories?.length) {
    console.log(`📂 Adding ${NEW_CONTENT.categories.length} category(ies)...`);
    for (const cat of NEW_CONTENT.categories) {
      await Category.updateOne({ id: cat.id }, cat, { upsert: true });
      results.categories++;
      console.log(`   ✔ Category: ${cat.id}`);
    }
  }

  // ── Insert verbs ─────────────────────────────────────────────────────────
  if (NEW_CONTENT.verbs?.length) {
    console.log(`🔤 Adding ${NEW_CONTENT.verbs.length} verb(s)...`);
    for (const verb of NEW_CONTENT.verbs) {
      await Verb.updateOne({ id: verb.id }, verb, { upsert: true });
      results.verbs++;
      console.log(`   ✔ Verb: ${verb.word.en} (${verb.id})`);
    }
  }

  // ── Insert sentence sets ─────────────────────────────────────────────────
  if (NEW_CONTENT.sentence_sets?.length) {
    console.log(`💬 Adding ${NEW_CONTENT.sentence_sets.length} sentence set(s)...`);

    const existingVerbIds = (await Verb.find({}, 'id')).map(v => v.id);
    const existingCatIds  = (await Category.find({}, 'id')).map(c => c.id);

    for (const set of NEW_CONTENT.sentence_sets) {
      // Validate references
      if (!modeIds.includes(set.mode_id)) {
        results.errors.push(`${set.id}: unknown mode_id "${set.mode_id}"`);
        console.warn(`   ⚠ Skipped ${set.id}: mode_id "${set.mode_id}" not found`);
        continue;
      }
      if (!existingCatIds.includes(set.category_id)) {
        results.errors.push(`${set.id}: unknown category_id "${set.category_id}"`);
        console.warn(`   ⚠ Skipped ${set.id}: category_id "${set.category_id}" not found`);
        continue;
      }
      if (!existingVerbIds.includes(set.verb_id)) {
        results.errors.push(`${set.id}: unknown verb_id "${set.verb_id}"`);
        console.warn(`   ⚠ Skipped ${set.id}: verb_id "${set.verb_id}" not found`);
        continue;
      }

      const doc = { ...set, ...meta };
      await SentenceSet.updateOne({ id: set.id }, doc, { upsert: true });
      results.sets++;
      console.log(`   ✔ Set: ${set.id} (${set.mode_id} / ${set.category_id})`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Upload complete!');
  console.log(`   Categories added:    ${results.categories}`);
  console.log(`   Verbs added:         ${results.verbs}`);
  console.log(`   Sentence sets added: ${results.sets}`);
  if (results.errors.length) {
    console.log(`   Errors (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`     - ${e}`));
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

addContent().catch(err => {
  console.error('❌ Upload failed:', err.message);
  process.exit(1);
});
