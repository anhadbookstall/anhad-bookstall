// routes/books.js
const express = require('express');
const router = express.Router();
const { getBooks, getLowStockBooks, addBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');

router.get('/', protect, authenticated, getBooks);
router.get('/low-stock', protect, adminOnly, getLowStockBooks);
router.post('/', protect, adminOnly, addBook);
router.put('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
