// controllers/leadInventoryController.js
const LeadInventory = require('../models/LeadInventory');
const Book = require('../models/Book');
const Volunteer = require('../models/Volunteer');

// GET /api/lead-inventory/my - Lead sees their own stock
const getMyInventory = async (req, res) => {
  const items = await LeadInventory.find({ lead: req.user.id, quantity: { $gt: 0 } })
    .populate('book', 'title language unitCost currentStock');
  res.json(items);
};

// GET /api/lead-inventory/lead/:leadId - Admin sees a specific lead's stock
const getLeadInventory = async (req, res) => {
  const items = await LeadInventory.find({ lead: req.params.leadId })
    .populate('book', 'title language unitCost currentStock')
    .populate('lead', 'name');
  res.json(items);
};

// GET /api/lead-inventory/book/:bookId - Admin sees all leads holding a specific book
const getBookLeadDistribution = async (req, res) => {
  const items = await LeadInventory.find({ book: req.params.bookId, quantity: { $gt: 0 } })
    .populate('lead', 'name profilePhoto')
    .populate('book', 'title');
  res.json(items);
};

// POST /api/lead-inventory/allocate - Admin allocates books to a lead
const allocateToLead = async (req, res) => {
  const { leadId, bookId, quantity } = req.body;

  if (!leadId || !bookId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'leadId, bookId and quantity are required' });
  }

  // Verify lead exists and is a Bookstall Lead
  const lead = await Volunteer.findById(leadId);
  if (!lead || !lead.isBookstallLead) {
    return res.status(400).json({ message: 'Volunteer is not a Bookstall Lead' });
  }

  // Check buffer stock
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.currentStock < quantity) {
    return res.status(400).json({
      message: `Insufficient buffer stock. Available: ${book.currentStock}`,
    });
  }

  // Reduce buffer stock
  book.currentStock -= quantity;
  await book.save();

  // Increase lead's personal stock
  const leadItem = await LeadInventory.findOneAndUpdate(
    { lead: leadId, book: bookId },
    { $inc: { quantity } },
    { upsert: true, new: true }
  );

  await leadItem.populate('book', 'title language unitCost currentStock');
  await leadItem.populate('lead', 'name');

  res.json({
    message: `${quantity} copies of "${book.title}" allocated to ${lead.name}`,
    leadItem,
    newBufferStock: book.currentStock,
  });
};

// POST /api/lead-inventory/deallocate - Admin takes books back from a lead
const deallocateFromLead = async (req, res) => {
  const { leadId, bookId, quantity } = req.body;

  if (!leadId || !bookId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'leadId, bookId and quantity are required' });
  }

  const leadItem = await LeadInventory.findOne({ lead: leadId, book: bookId });
  if (!leadItem || leadItem.quantity < quantity) {
    return res.status(400).json({
      message: `Lead only has ${leadItem?.quantity || 0} copies of this book`,
    });
  }

  // Reduce lead's stock
  leadItem.quantity -= quantity;
  await leadItem.save();

  // Return to buffer stock
  const book = await Book.findById(bookId);
  book.currentStock += quantity;
  await book.save();

  res.json({
    message: `${quantity} copies returned to buffer stock`,
    leadItem,
    newBufferStock: book.currentStock,
  });
};

module.exports = {
  getMyInventory, getLeadInventory, getBookLeadDistribution,
  allocateToLead, deallocateFromLead,
};