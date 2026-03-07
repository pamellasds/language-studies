const { connectDB, models } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { Mode, Category, Verb, SentenceSet } = models();

  const [modes, categories, verbs, sentence_sets] = await Promise.all([
    Mode.find({}, '-_id -__v -createdAt -updatedAt').lean(),
    Category.find({}, '-_id -__v -createdAt -updatedAt').lean(),
    Verb.find({}, '-_id -__v -createdAt -updatedAt').lean(),
    SentenceSet.find({}, '-_id -__v -createdAt -updatedAt -source -llm_model -reviewed').lean(),
  ]);

  res.json({ modes, categories, verbs, sentence_sets });
};
