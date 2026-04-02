// controllers/inventoryController.js
const InventoryUpdate = require('../models/Inventory');
const Book = require('../models/Book');
const PDFParser = require('pdf2json');
const axios = require('axios');

// ----------------------------------------------------------------
// Helper: Download PDF from Cloudinary URL into a buffer
// ----------------------------------------------------------------
const downloadFileAsBuffer = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};

// ----------------------------------------------------------------
// Helper: Extract text from PDF buffer using pdf2json
// ----------------------------------------------------------------
const extractTextFromPDF = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataError', (err) => {
      reject(new Error(err.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      // getRawTextContent() returns all text from the PDF as a single string
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
};

// ----------------------------------------------------------------
// POST /api/inventory/parse-invoice
// Step 1: Parse the uploaded PDF - return preview, do NOT update stock
// ----------------------------------------------------------------
const parseInvoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No invoice file uploaded' });
  }

  try {
    let pdfBuffer;

    if (req.file.path && req.file.path.startsWith('http')) {
      pdfBuffer = await downloadFileAsBuffer(req.file.path);
    } else {
      const fs = require('fs');
      pdfBuffer = fs.readFileSync(req.file.path);
    }

    const extractedText = await extractTextFromPDF(pdfBuffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        message: 'Could not extract text from this PDF. Please ensure it is a digital PDF, not a scanned image.',
      });
    }

    console.log('FULL TEXT:\n' + extractedText);

    const parsedItems = parseInvoiceText(extractedText);

    if (parsedItems.length === 0) {
      return res.status(400).json({
        message: 'No book entries found in the invoice. Ensure the invoice follows the standard AP Books format.',
        textPreview: extractedText.substring(0, 500),
      });
    }

    const { matched, unmatched } = await matchBooksFromDB(parsedItems);

    res.json({
      matched,
      unmatched,
      totalParsed: parsedItems.length,
      invoiceFileUrl: req.file.path,
      invoicePublicId: req.file.filename,
    });
  } catch (err) {
    console.error('Invoice parse error:', err);
    res.status(500).json({ message: 'Error reading invoice: ' + err.message });
  }
};

// ----------------------------------------------------------------
// Helper: Parse invoice text into { rawTitle, quantity } pairs
//
// AP Books invoice format (based on sample invoice):
//   ज्वाला (Jwala) - Book Cover Type: Paperback   2   120.00   240.00
//   Ego - Book Cover Type: Paperback               2   125.00   250.00
//
// The marker "- Book Cover Type:" is consistent across all AP invoices
// ----------------------------------------------------------------
const parseInvoiceText = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Normalize multiple spaces to single space before checking
    const normalized = line.replace(/\s+/g, ' ');

    // Only process book item lines - now matches regardless of extra spaces
    if (!normalized.includes('Book Cover Type:')) continue;

    // Extract English title from brackets e.g. "(Jwala)"
    // For English-only books e.g. "Ego - Book Cover Type:"
    let extractedTitle = null;

    const bracketMatch = normalized.match(/\(([^)]+)\)\s*-\s*Book Cover Type:/);
    if (bracketMatch) {
      // Hindi book - use English name inside brackets
      extractedTitle = bracketMatch[1].trim();
    } else {
      // English only book - everything before " - Book Cover Type:"
      const englishMatch = normalized.match(/^([A-Za-z0-9\s\*\,\.\/\-\'\:]+?)\s*-\s*Book Cover Type:/);
      if (englishMatch) {
        extractedTitle = englishMatch[1].trim();
      }
    }

    if (!extractedTitle) continue;

    // Quantity is on the line after SKU line
    // Line i   = "...Book Cover Type: Paperback"
    // Line i+1 = "SKU: Jwala"
    // Line i+2 = "2    120.00    240.00"
    let qtyLine = '';
    if (i + 1 < lines.length && lines[i + 1].startsWith('SKU:')) {
      qtyLine = lines[i + 2] || '';
    } else {
      qtyLine = lines[i + 1] || '';
    }

    // Quantity is the first number on the qty line
    const qtyMatch = qtyLine.trim().match(/^(\d+)/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : null;

    if (extractedTitle && quantity) {
      parsed.push({ rawTitle: extractedTitle, quantity });
    }
  }

  return parsed;
};

// ----------------------------------------------------------------
// Helper: Match parsed titles against DB books exactly
// ----------------------------------------------------------------
const matchBooksFromDB = async (parsedItems) => {
  const allBooks = await Book.find({ isActive: true }).select('title _id unitCost currentStock');

  const matched = [];
  const unmatched = [];

  for (const item of parsedItems) {
    // Simple case-insensitive exact match
    // Works because:
    //   - Hindi books: we extracted English name from brackets e.g. "Jwala"
    //   - English books: we extracted title directly e.g. "Ego"
    // Admin adds books to catalog using same names as invoice
    const book = allBooks.find(
      (b) => b.title.trim().toLowerCase() === item.rawTitle.trim().toLowerCase()
    );

    if (book) {
      matched.push({
        bookId: book._id,
        title: book.title,
        quantity: item.quantity,
        unitCost: book.unitCost,
        currentStock: book.currentStock,
      });
    } else {
      unmatched.push({
        rawTitle: item.rawTitle,
        quantity: item.quantity,
      });
    }
  }

  return { matched, unmatched };
};

// ----------------------------------------------------------------
// POST /api/inventory/confirm-invoice
// Step 2: Admin confirmed preview - now update stock
// ----------------------------------------------------------------
const confirmInvoice = async (req, res) => {
  const { items, dateReceived, notes, invoiceFileUrl, invoicePublicId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items to save' });
  }

  const processedItems = items.map((item) => ({
    book: item.bookId,
    quantity: parseInt(item.quantity),
    unitCostAtTime: item.unitCost,
  }));

  const inventoryUpdate = await InventoryUpdate.create({
    items: processedItems,
    dateReceived: dateReceived || new Date(),
    notes: notes || 'Updated via invoice upload',
    invoiceFile: invoiceFileUrl
      ? { url: invoiceFileUrl, publicId: invoicePublicId }
      : undefined,
  });

  // post('save') hook on InventoryUpdate model auto-increments Book.currentStock

  res.status(201).json({
    message: `Stock updated for ${items.length} book(s)`,
    inventoryUpdate,
  });
};

// ----------------------------------------------------------------
// POST /api/inventory - Manual form update (unchanged)
// ----------------------------------------------------------------
const updateInventory = async (req, res) => {
  const { dateReceived, notes } = req.body;
  console.log('updateInventory req.body:', req.body);

  let items = [];
  if (req.body.items) {
    try {
      items = typeof req.body.items === 'string'
        ? JSON.parse(req.body.items)
        : req.body.items;
    } catch {
      return res.status(400).json({ message: 'Invalid items format' });
    }
  }

  if (items.length === 0) {
    return res.status(400).json({ message: 'Please add at least one book' });
  }

  const processedItems = await Promise.all(
    items.map(async (item) => {
      const book = await Book.findById(item.bookId);
      return {
        book: item.bookId,
        quantity: parseInt(item.quantity),
        unitCostAtTime: book?.unitCost,
      };
    })
  );

  const inventoryUpdate = await InventoryUpdate.create({
    items: processedItems,
    dateReceived: dateReceived || new Date(),
    notes,
  });

  res.status(201).json(inventoryUpdate);
};

// ----------------------------------------------------------------
// GET /api/inventory - History (unchanged)
// ----------------------------------------------------------------
const getInventoryHistory = async (req, res) => {
  const history = await InventoryUpdate.find()
    .populate('items.book', 'title language')
    .sort('-dateReceived')
    .limit(50);
  res.json(history);
};

// GET /api/inventory/book/:bookId - Last 5 transactions for a specific book
const getBookInventoryHistory = async (req, res) => {
  const updates = await InventoryUpdate.find({ 'items.book': req.params.bookId })
    .sort('-dateReceived')
    .limit(5)
    .select('items dateReceived notes');

  // Filter items to only show the relevant book
  console.log('bookId param:', req.params.bookId);
  console.log('updates found:', updates.length);
  if (updates.length > 0) {
    console.log('first item book:', updates[0].items[0]?.book?.toString());
  }

  const result = updates.map((u) => ({
    dateReceived: u.dateReceived,
    notes: u.notes,
    quantity: u.items.find((it) => it.book?.toString() === req.params.bookId)?.quantity || 0,
  }));

  res.json(result);
};

module.exports = {
  updateInventory,
  getInventoryHistory,
  parseInvoice,
  confirmInvoice,
  getBookInventoryHistory,
};
