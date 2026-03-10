// controllers/expenditureController.js
const Expenditure = require('../models/Expenditure');

const getExpenditures = async (req, res) => {
  const { type, from, to } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (from || to) {
    filter.dateOfExpenditure = {};
    if (from) filter.dateOfExpenditure.$gte = new Date(from);
    if (to) filter.dateOfExpenditure.$lte = new Date(to);
  }
  const expenditures = await Expenditure.find(filter).sort('-dateOfExpenditure');
  res.json(expenditures);
};

const addExpenditure = async (req, res) => {
  const { detail, type, cost, dateOfExpenditure, bookstallId } = req.body;
  const exp = await Expenditure.create({
    detail, type, cost,
    dateOfExpenditure: dateOfExpenditure || new Date(),
    bookstall: bookstallId,
  });
  res.status(201).json(exp);
};

module.exports = { getExpenditures, addExpenditure };
