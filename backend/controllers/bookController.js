// controllers/bookController.js - CRUD for books catalog
const Book = require('../models/Book');
const Notification = require('../models/Notification');

// GET /api/books - Get all active books
const getBooks = async (req, res) => {
  const { subject, language, search } = req.query;
  const filter = { isActive: true };

  if (language) filter.language = language;
  if (subject) filter.subjects = { $in: [new RegExp(subject, 'i')] };
  if (search) filter.title = { $regex: search, $options: 'i' };

  const books = await Book.find(filter).sort('title');
  res.json(books);
};

// GET /api/books/low-stock - Books with less than 3 copies
const getLowStockBooks = async (req, res) => {
  const books = await Book.find({ isActive: true, currentStock: { $lt: 3 } }).sort('title');
  res.json(books);
};

// POST /api/books - Add new book (admin only)
const addBook = async (req, res) => {
  const { title, language, unitCost, subjects, publication } = req.body;

  // Parse subjects if sent as comma-separated string
  const subjectsArray = typeof subjects === 'string'
    ? subjects.split(',').map((s) => s.trim()).filter(Boolean)
    : subjects || [];

  const book = await Book.create({
    title,
    language,
    unitCost,
    subjects: subjectsArray,
    publication,
  });

  res.status(201).json(book);
};

// PUT /api/books/:id - Update book (admin only)
const updateBook = async (req, res) => {
  const { subjects, ...rest } = req.body;

  const subjectsArray = subjects && typeof subjects === 'string'
    ? subjects.split(',').map((s) => s.trim()).filter(Boolean)
    : subjects;

  const update = subjectsArray ? { ...rest, subjects: subjectsArray } : rest;

  const book = await Book.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });

  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
};

// DELETE /api/books/:id - Soft delete (admin only)
const deleteBook = async (req, res) => {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json({ message: 'Book removed from catalog' });
};

module.exports = { getBooks, getLowStockBooks, addBook, updateBook, deleteBook };
