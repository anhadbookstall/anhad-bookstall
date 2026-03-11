// routes/inventory.js
const express = require('express');
const router = express.Router();
const {
  updateInventory,
  getInventoryHistory,
  parseInvoice,
  confirmInvoice,
} = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Cloudinary storage for invoice PDFs
const invoiceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookstall/invoices',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});
const uploadInvoice = multer({ storage: invoiceStorage });

// Manual form update
router.get('/', protect, adminOnly, getInventoryHistory);
router.post('/', protect, adminOnly, updateInventory);

// Invoice PDF routes
// Step 1: Upload PDF and get preview (does NOT update stock)
router.post('/parse-invoice', protect, adminOnly, uploadInvoice.single('invoice'), parseInvoice);
// Step 2: Admin confirmed preview, now update stock
router.post('/confirm-invoice', protect, adminOnly, confirmInvoice);

module.exports = router;
