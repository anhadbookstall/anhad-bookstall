// routes/sales.js
const express = require('express');
const router = express.Router();
const { addSale, getSales } = require('../controllers/saleController');
const { protect, volunteerOnly, authenticated } = require('../middleware/auth');
const { uploadPurchaserPhoto } = require('../config/cloudinary');

router.get('/', protect, authenticated, getSales);
router.post('/', protect, volunteerOnly, uploadPurchaserPhoto.single('photo'), addSale);

module.exports = router;
