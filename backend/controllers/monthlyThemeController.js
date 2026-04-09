const MonthlyTheme = require('../models/MonthlyTheme');

const getCurrentTheme = async (req, res) => {
  const now = new Date();
  const theme = await MonthlyTheme.findOne({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  res.json(theme || null);
};

const getAllThemes = async (req, res) => {
  const themes = await MonthlyTheme.find().sort('-year -month');
  res.json(themes);
};

const setTheme = async (req, res) => {
  const { year, month, theme, targetBooksSold, targetBookstalls } = req.body;
  if (!year || !month) {
    return res.status(400).json({ message: 'Year and month are required' });
  }
  const update = {};
  if (theme !== undefined && theme !== '') update.theme = theme;
  if (targetBooksSold !== undefined) update.targetBooksSold = parseInt(targetBooksSold) || 0;
  if (targetBookstalls !== undefined) update.targetBookstalls = parseInt(targetBookstalls) || 0;

  const existing = await MonthlyTheme.findOneAndUpdate(
    { year, month },
    update,
    { upsert: true, new: true }
  );
  res.json(existing);
};

const deleteTheme = async (req, res) => {
  await MonthlyTheme.findByIdAndDelete(req.params.id);
  res.json({ message: 'Theme deleted' });
};

// GET /api/themes/check-target - Check if current month target is set
const checkMonthlyTarget = async (req, res) => {
  const now = new Date();
  const theme = await MonthlyTheme.findOne({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const isSet = theme && (theme.targetBooksSold > 0 || theme.targetBookstalls > 0);
  res.json({ isSet: !!isSet, theme: theme || null });
};

module.exports = { getCurrentTheme, getAllThemes, setTheme, deleteTheme, checkMonthlyTarget };