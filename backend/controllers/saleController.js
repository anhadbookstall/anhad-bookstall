// controllers/saleController.js
const Sale = require('../models/Sale');
const Book = require('../models/Book');
const Bookstall = require('../models/Bookstall');
const Notification = require('../models/Notification');

// POST /api/sales - Record a book sale
const addSale = async (req, res) => {
  const {
    bookstallId, bookId, quantity, soldPrice,
    gender, ageCategory, knowsAcharyaPrashant,
    joinedGitaCommunity, photoConsent,
  } = req.body;

  // Verify bookstall is ongoing
  const bookstall = await Bookstall.findById(bookstallId);
  if (!bookstall || bookstall.status !== 'ongoing') {
    return res.status(400).json({ message: 'No active bookstall found' });
  }

  // Verify volunteer is present at this bookstall
  const isPresent =
    bookstall.lead.toString() === req.user.id ||
    bookstall.attendance.some(
      (a) => a.volunteer.toString() === req.user.id && a.isPresent
    );

  if (!isPresent) {
    return res.status(403).json({ message: 'You must be present at the bookstall to add sales' });
  }

  // Check stock availability
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.currentStock < quantity) {
    return res.status(400).json({
      message: `Insufficient stock. Only ${book.currentStock} copies available.`,
    });
  }

  // Build sale object
  const saleData = {
    bookstall: bookstallId,
    soldBy: req.user.id,
    book: bookId,
    quantity: parseInt(quantity),
    soldPrice: parseFloat(soldPrice),
    gender,
    ageCategory,
    knowsAcharyaPrashant,
    joinedGitaCommunity: knowsAcharyaPrashant ? joinedGitaCommunity : undefined,
  };

  // If photo was uploaded (via multer + cloudinary)
  if (req.file) {
    saleData.purchaserPhoto = {
      url: req.file.path,
      publicId: req.file.filename,
      consent: photoConsent === 'true',
    };
  }

  const sale = await Sale.create(saleData);
  // Sale.post('save') hook auto-decrements stock

  // Check if stock dropped below 3 and notify admin
  const updatedBook = await Book.findById(bookId);
  if (updatedBook.currentStock < 3) {
    await Notification.create({
      isForAdmin: true,
      title: 'Low Stock Alert',
      message: `"${updatedBook.title}" has only ${updatedBook.currentStock} copies remaining.`,
      type: 'low_stock',
    });
  }

  await sale.populate([
    { path: 'book', select: 'title language' },
    { path: 'soldBy', select: 'name' },
  ]);

  res.status(201).json(sale);
};

// GET /api/sales - Get sales (filtered)
const getSales = async (req, res) => {
  const { bookstallId, bookId, from, to } = req.query;
  const filter = {};

  if (bookstallId) filter.bookstall = bookstallId;
  if (bookId) filter.book = bookId;
  if (from || to) {
    filter.saleDate = {};
    if (from) filter.saleDate.$gte = new Date(from);
    if (to) filter.saleDate.$lte = new Date(to);
  }

  const sales = await Sale.find(filter)
    .populate('book', 'title language')
    .populate('soldBy', 'name')
    .populate('bookstall', 'location startedAt')
    .sort('-saleDate');

  res.json(sales);
};

module.exports = { addSale, getSales };
