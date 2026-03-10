// controllers/inventoryController.js
const InventoryUpdate = require('../models/Inventory');
const Book = require('../models/Book');

// POST /api/inventory - Update inventory (add books received)
const updateInventory = async (req, res) => {
  const { items, dateReceived, notes } = req.body;
  // items = [{ bookId, quantity }, ...]

  const processedItems = await Promise.all(
    items.map(async (item) => {
      const book = await Book.findById(item.bookId);
      return {
        book: item.bookId,
        quantity: item.quantity,
        unitCostAtTime: book?.unitCost,
      };
    })
  );

  const inventoryUpdate = await InventoryUpdate.create({
    items: processedItems,
    dateReceived: dateReceived || new Date(),
    notes,
    // Invoice PDF if uploaded
    invoiceFile: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
  });

  // post('save') hook handles Book.currentStock increment
  res.status(201).json(inventoryUpdate);
};

// GET /api/inventory - Inventory history
const getInventoryHistory = async (req, res) => {
  const history = await InventoryUpdate.find()
    .populate('items.book', 'title language')
    .sort('-dateReceived')
    .limit(50);
  res.json(history);
};

module.exports = { updateInventory, getInventoryHistory };
