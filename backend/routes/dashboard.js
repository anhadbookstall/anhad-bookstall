// routes/dashboard.js
const express = require('express');
const router = express.Router();
const {
  getSummary, getBookSalesChart, getGenderAgeChart,
  getVolunteerEfficiency, getSalesTrend,
} = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/summary', protect, adminOnly, getSummary);
router.get('/books-sales', protect, adminOnly, getBookSalesChart);
router.get('/gender-age', protect, adminOnly, getGenderAgeChart);
router.get('/volunteer-efficiency', protect, adminOnly, getVolunteerEfficiency);
router.get('/sales-trend', protect, adminOnly, getSalesTrend);

module.exports = router;
