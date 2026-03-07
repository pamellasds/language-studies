module.exports = (req, res) => {
  res.json({
    ok: true,
    hasMongoUri: !!process.env.MONGODB_URI,
    node: process.version,
  });
};
