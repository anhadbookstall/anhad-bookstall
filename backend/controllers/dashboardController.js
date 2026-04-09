// controllers/dashboardController.js
// Provides aggregated analytics data for charts and reports
const Sale = require('../models/Sale');
const Book = require('../models/Book');
const Bookstall = require('../models/Bookstall');
const Volunteer = require('../models/Volunteer');
const Expenditure = require('../models/Expenditure');
const InventoryUpdate = require('../models/Inventory');

// GET /api/dashboard/summary - High-level KPIs
const getSummary = async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  const saleFilter = Object.keys(dateFilter).length ? { saleDate: dateFilter } : {};

  // Current month date range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalSales,
    totalRevenue,
    totalBookstalls,
    activeVolunteers,
    lowStockBooks,
    totalExpenditure,
    totalInventoryCost,
    thisMonthSales,
    thisMonthBookstalls,
  ] = await Promise.all([
    Sale.aggregate([
      { $match: saleFilter },
      { $group: { _id: null, count: { $sum: '$quantity' }, revenue: { $sum: { $multiply: ['$soldPrice', '$quantity'] } } } },
    ]),
    Sale.aggregate([{ $match: saleFilter }, { $group: { _id: null, total: { $sum: { $multiply: ['$soldPrice', '$quantity'] } } } }]),
    Bookstall.countDocuments(saleFilter.saleDate ? { startedAt: dateFilter } : {}),
    Volunteer.countDocuments({ status: 'active' }),
    Book.countDocuments({ isActive: true, currentStock: { $lt: 3 } }),
    Expenditure.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]),
    InventoryUpdate.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'books', localField: 'items.book', foreignField: '_id', as: 'bookData' } },
      { $unwind: '$bookData' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.quantity', '$bookData.unitCost'] } } } },
    ]),
    // This month's books sold
    Sale.aggregate([
      { $match: { saleDate: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, count: { $sum: '$quantity' } } },
    ]),
    // This month's bookstalls conducted
    Bookstall.countDocuments({
      status: 'closed',
      startedAt: { $gte: monthStart, $lte: monthEnd },
    }),
  ]);

  res.json({
    totalBooksSold: totalSales[0]?.count || 0,
    totalRevenue: totalSales[0]?.revenue || 0,
    totalBookstalls,
    activeVolunteers,
    lowStockBooks,
    totalExpenditure: totalExpenditure[0]?.total || 0,
    totalInventoryCost: totalInventoryCost[0]?.total || 0,
    totalBooksSoldThisMonth: thisMonthSales[0]?.count || 0,
    totalBookstallsThisMonth: thisMonthBookstalls || 0,
  });
};

// GET /api/dashboard/books-sales - Sales breakdown by book
const getBookSalesChart = async (req, res) => {
  const { from, to } = req.query;
  const matchFilter = {};
  if (from || to) {
    matchFilter.saleDate = {};
    if (from) matchFilter.saleDate.$gte = new Date(from);
    if (to) matchFilter.saleDate.$lte = new Date(to);
  }

  const data = await Sale.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$book', totalQuantity: { $sum: '$quantity' }, totalRevenue: { $sum: { $multiply: ['$soldPrice', '$quantity'] } } } },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $project: { _id: 0, bookTitle: '$book.title', language: '$book.language', totalQuantity: 1, totalRevenue: 1 } },
    { $sort: { totalQuantity: -1 } },
    { $limit: 20 },
  ]);

  res.json(data);
};

// GET /api/dashboard/gender-age - Gender and age category breakdown
const getGenderAgeChart = async (req, res) => {
  const genderData = await Sale.aggregate([
    { $group: { _id: '$gender', count: { $sum: '$quantity' } } },
    { $project: { _id: 0, gender: '$_id', count: 1 } },
  ]);

  const ageData = await Sale.aggregate([
    { $group: { _id: '$ageCategory', count: { $sum: '$quantity' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, ageCategory: '$_id', count: 1 } },
  ]);

  const apAwarenessData = await Sale.aggregate([
    { $group: {
      _id: null,
      knowsAP: { $sum: { $cond: ['$knowsAcharyaPrashant', '$quantity', 0] } },
      doesntKnow: { $sum: { $cond: ['$knowsAcharyaPrashant', 0, '$quantity'] } },
      joinedGita: { $sum: { $cond: ['$joinedGitaCommunity', '$quantity', 0] } },
    }},
  ]);

  res.json({ genderData, ageData, apAwarenessData: apAwarenessData[0] || {} });
};

// GET /api/dashboard/volunteer-efficiency - Volunteer performance
const getVolunteerEfficiency = async (req, res) => {
  const { from, to } = req.query;
  const matchFilter = {};
  if (from || to) {
    matchFilter.saleDate = {};
    if (from) matchFilter.saleDate.$gte = new Date(from);
    if (to) matchFilter.saleDate.$lte = new Date(to);
  }

  const data = await Sale.aggregate([
    { $match: matchFilter },
    { $group: {
      _id: '$soldBy',
      totalSold: { $sum: '$quantity' },
      totalRevenue: { $sum: { $multiply: ['$soldPrice', '$quantity'] } },
      salesCount: { $sum: 1 },
    }},
    { $lookup: { from: 'volunteers', localField: '_id', foreignField: '_id', as: 'volunteer' } },
    { $unwind: '$volunteer' },
    { $project: { _id: 0, volunteerName: '$volunteer.name', totalSold: 1, totalRevenue: 1, salesCount: 1 } },
    { $sort: { totalSold: -1 } },
  ]);

  res.json(data);
};

// GET /api/dashboard/sales-trend - Daily sales trend
const getSalesTrend = async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const data = await Sale.aggregate([
    { $match: { saleDate: { $gte: startDate } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
      totalQuantity: { $sum: '$quantity' },
      totalRevenue: { $sum: { $multiply: ['$soldPrice', '$quantity'] } },
    }},
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', totalQuantity: 1, totalRevenue: 1 } },
  ]);

  res.json(data);
};

module.exports = { getSummary, getBookSalesChart, getGenderAgeChart, getVolunteerEfficiency, getSalesTrend };
