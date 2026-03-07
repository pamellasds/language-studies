const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  language:      { type: String, enum: ['en', 'es'], default: 'en' },
}, { timestamps: true });

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compareSync(plain, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
