// routes/inventory.js
const express = require('express');
const router = express.Router();
const { updateInventory, getInventoryHistory } = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Invoice PDF upload storage
const invoiceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookstall/invoices',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});
const uploadInvoice = multer({ storage: invoiceStorage });

router.get('/', protect, adminOnly, getInventoryHistory);
router.post('/', protect, adminOnly, uploadInvoice.single('invoice'), updateInventory);

module.exports = router;
