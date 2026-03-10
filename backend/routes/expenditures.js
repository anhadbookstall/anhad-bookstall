// routes/expenditures.js
const express = require('express');
const router = express.Router();
const { getExpenditures, addExpenditure } = require('../controllers/expenditureController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getExpenditures);
router.post('/', protect, adminOnly, addExpenditure);

module.exports = router;
