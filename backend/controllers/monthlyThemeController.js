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
  const { year, month, theme } = req.body;
  if (!year || !month || !theme) {
    return res.status(400).json({ message: 'Year, month and theme are required' });
  }
  const existing = await MonthlyTheme.findOneAndUpdate(
    { year, month },
    { theme },
    { upsert: true, new: true }
  );
  res.json(existing);
};

const deleteTheme = async (req, res) => {
  await MonthlyTheme.findByIdAndDelete(req.params.id);
  res.json({ message: 'Theme deleted' });
};

module.exports = { getCurrentTheme, getAllThemes, setTheme, deleteTheme };