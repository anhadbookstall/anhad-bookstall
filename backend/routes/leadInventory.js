// routes/leadInventory.js
const express = require('express');
const router = express.Router();
const {
  getMyInventory, getLeadInventory, getBookLeadDistribution,
  allocateToLead, deallocateFromLead,
} = require('../controllers/leadInventoryController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');

router.get('/my', protect, authenticated, getMyInventory);
router.get('/lead/:leadId', protect, adminOnly, getLeadInventory);
router.get('/book/:bookId', protect, adminOnly, getBookLeadDistribution);
router.post('/allocate', protect, adminOnly, allocateToLead);
router.post('/deallocate', protect, adminOnly, deallocateFromLead);

module.exports = router;