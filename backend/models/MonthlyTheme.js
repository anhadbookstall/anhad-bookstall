const mongoose = require('mongoose');

const monthlyThemeSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  theme: { type: String, required: true, trim: true },
}, { timestamps: true });

monthlyThemeSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyTheme', monthlyThemeSchema);