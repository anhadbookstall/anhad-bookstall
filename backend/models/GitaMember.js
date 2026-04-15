// models/GitaMember.js
const mongoose = require('mongoose');

const gitaMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gmailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
  googleId: { type: String, unique: true, sparse: true },
  geetaProfileLink: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  sameAsWhatsApp: { type: Boolean, default: true },
  whatsappNumber: { type: String, trim: true },
  currentCity: { type: String, trim: true },
  whyJoin: { type: String, trim: true },
  profilePhoto: { url: String, publicId: String },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'removed'],
    default: 'pending',
  },
  appliedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('GitaMember', gitaMemberSchema);