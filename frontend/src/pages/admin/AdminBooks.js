// src/pages/admin/AdminBooks.js
// Admin can view, add, edit, and delete books from the catalog
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Tooltip,
  InputAdornment, Autocomplete, Tabs, Tab, Collapse, Grid, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning, ExpandMore, ExpandLess, UploadFile, CheckCircle } from '@mui/icons-material';
import { getBooks, addBook, updateBook, deleteBook, getInventoryHistory, updateInventory, parseInvoice, confirmInvoice, getBookInventoryHistory } from '../../services/api';
import { toast } from 'react-toastify';

const LANGUAGES = ['Hindi', 'English', 'Bangla', 'Odiya'];
const PUBLICATIONS = ['PAF', 'Penguin', 'HarperCollins', 'Jaico', 'Rajpal & Sons', 'Prabhat Prakashan', 'Other'];

const emptyForm = { title: '', language: 'Hindi', unitCost: '', subjects: '', publication: 'PAF' };

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [mainTab, setMainTab] = useState(0); // 0 = Book Titles, 1 = Inventory

  // Inventory tab state
  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [invTab, setInvTab] = useState(0);
  const [expandedBook, setExpandedBook] = useState(null);
  const [bookTransactions, setBookTransactions] = useState({});
  const [transLoading, setTransLoading] = useState(null);

  // Inventory form state (same as old AdminInventory)
  const [items, setItems] = useState([{ bookId: '', quantity: 1 }]);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceParsing, setInvoiceParsing] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);

  const fetchBooks = async () => {
    const res = await getBooks({ search });
    setBooks(res.data);
  };

  useEffect(() => { fetchBooks(); }, [search]);

  const resetInvDialog = () => {
    setItems([{ bookId: '', quantity: 1 }]);
    setNotes('');
    setInvoiceFile(null);
    setInvoicePreview(null);
    setPreviewItems([]);
    setInvTab(0);
    setDateReceived(new Date().toISOString().split('T')[0]);
  };

  const handleExpandBook = async (bookId) => {
    if (expandedBook === bookId) { setExpandedBook(null); return; }
    setExpandedBook(bookId);
    if (!bookTransactions[bookId]) {
      setTransLoading(bookId);
      try {
        console.log('Fetching inventory history for bookId:', bookId);
        const res = await getBookInventoryHistory(bookId);
        console.log('Response:', res.data);
        setBookTransactions((prev) => ({ ...prev, [bookId]: res.data }));
      } catch (err) {
        console.error('Error fetching book history:', err.response?.data || err.message);
      }
      finally { setTransLoading(null); }
    }
  };

  const addItem = () => setItems([...items, { bookId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const handleManualSubmit = async () => {
    const filledItems = items.filter((it) => it.bookId && it.quantity && it.quantity > 0);
    if (filledItems.length === 0) return toast.error('Please add at least one book with quantity');
    setLoading(true);
    try {
      await updateInventory({ items: filledItems, dateReceived, notes });
      toast.success('Inventory updated successfully!');
      setInvDialogOpen(false);
      resetInvDialog();
      fetchBooks(); // Refresh stock numbers
      setBookTransactions({}); // Clear cached transactions
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating inventory');
    } finally { setLoading(false); }
  };

  const handleParseInvoice = async () => {
    if (!invoiceFile) return toast.error('Please select an invoice PDF first');
    setInvoiceParsing(true);
    setInvoicePreview(null);
    setPreviewItems([]);
    try {
      const fd = new FormData();
      fd.append('invoice', invoiceFile);
      const res = await parseInvoice(fd);
      setInvoicePreview(res.data);
      setPreviewItems(res.data.matched.map((item) => ({ ...item })));
      toast.success(`Parsed ${res.data.totalParsed} book entries from invoice`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error parsing invoice');
    } finally { setInvoiceParsing(false); }
  };

  const updatePreviewQty = (i, qty) => {
    const updated = [...previewItems];
    updated[i] = { ...updated[i], quantity: parseInt(qty) || 1 };
    setPreviewItems(updated);
  };

  const handleConfirmInvoice = async () => {
    if (previewItems.length === 0) return toast.error('No matched books to save');
    setLoading(true);
    try {
      await confirmInvoice({
        items: previewItems,
        dateReceived,
        notes: notes || 'Updated via invoice upload',
        invoiceFileUrl: invoicePreview.invoiceFileUrl,
        invoicePublicId: invoicePreview.invoicePublicId,
      });
      toast.success(`Stock updated for ${previewItems.length} book(s)! ✅`);
      setInvDialogOpen(false);
      resetInvDialog();
      fetchBooks();
      setBookTransactions({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving inventory');
    } finally { setLoading(false); }
  };

  const openAdd = () => { setEditBook(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (book) => {
    setEditBook(book);
    setForm({ ...book, subjects: book.subjects?.join(', ') || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.unitCost) return toast.error('Title and cost are required');
    setLoading(true);
    try {
      if (editBook) {
        await updateBook(editBook._id, form);
        toast.success('Book updated!');
      } else {
        await addBook(form);
        toast.success('Book added!');
      }
      setDialogOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this book from catalog?')) return;
    await deleteBook(id);
    toast.success('Book removed');
    fetchBooks();
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Books</Typography>

      {/* Main Tabs */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="View / Add Book Title" />
        <Tab label="View / Update Inventory" />
      </Tabs>

      {/* ---- TAB 0: Book Titles ---- */}
      {mainTab === 0 && (
      <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Books Catalog</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small" placeholder="Search books..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Book</Button>
        </Box>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Title', 'Language', 'Publication', 'Unit Cost', 'Subjects', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book._id} hover>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.language}</TableCell>
                <TableCell>{book.publication}</TableCell>
                <TableCell>₹{book.unitCost}</TableCell>
                <TableCell>
                  {book.subjects?.map((s) => <Chip key={s} label={s} size="small" sx={{ mr: 0.5 }} />)}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(book)} color="primary"><Edit /></IconButton></Tooltip>
                  <Tooltip title="Remove"><IconButton size="small" onClick={() => handleDelete(book._id)} color="error"><Delete /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {books.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No books found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      </Box>
      )} {/* End Tab 0 */}

      {/* ---- TAB 1: Inventory ---- */}
      {mainTab === 1 && (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Inventory</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setInvDialogOpen(true)}>
            Update Inventory
          </Button>
        </Box>

        <TableContainer component={Card}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                {['Title', 'Language', 'Publication', 'Unit Cost', 'Stock', ''].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <>
                  <TableRow key={book._id} hover>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.language}</TableCell>
                    <TableCell>{book.publication}</TableCell>
                    <TableCell>₹{book.unitCost}</TableCell>
                    <TableCell>
                      <Chip
                        label={book.currentStock}
                        color={book.currentStock < 3 ? 'error' : 'success'}
                        size="small"
                        icon={book.currentStock < 3 ? <Warning /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={expandedBook === book._id ? 'Hide transactions' : 'Show last 5 transactions'}>
                        <IconButton size="small" onClick={() => handleExpandBook(book._id)}>
                          {expandedBook === book._id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${book._id}-expand`}>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <Collapse in={expandedBook === book._id}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          {transLoading === book._id && <CircularProgress size={20} />}
                          {!transLoading && bookTransactions[book._id]?.length === 0 && (
                            <Typography variant="caption" color="text.secondary">No transactions yet</Typography>
                          )}
                          {!transLoading && bookTransactions[book._id]?.length > 0 && (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Qty Added</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {bookTransactions[book._id].map((t, i) => (
                                  <TableRow key={i}>
                                    <TableCell>{new Date(t.dateReceived).toLocaleDateString('en-IN')}</TableCell>
                                    <TableCell>+{t.quantity}</TableCell>
                                    <TableCell>{t.notes || '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
              {books.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No books found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Update Inventory Dialog */}
        <Dialog open={invDialogOpen} onClose={() => { setInvDialogOpen(false); resetInvDialog(); }} maxWidth="md" fullWidth>
          <DialogTitle>Update Inventory</DialogTitle>
          <DialogContent>
            <Tabs value={invTab} onChange={(_, v) => { setInvTab(v); setInvoicePreview(null); setPreviewItems([]); }} sx={{ mb: 3 }}>
              <Tab label="Fill Form Manually" />
              <Tab label="Upload Invoice PDF" />
            </Tabs>
            <TextField fullWidth type="date" label="Date Received" value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)} margin="normal"
              InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />

            {invTab === 0 && (
              <Box>
                {items.map((item, i) => (
                  <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={7}>
                      <Autocomplete
                        options={books}
                        getOptionLabel={(b) => `${b.title} (Stock: ${b.currentStock})`}
                        value={books.find((b) => b._id === item.bookId) || null}
                        onChange={(_, val) => updateItem(i, 'bookId', val?._id || '')}
                        renderInput={(params) => <TextField {...params} label="Book" />}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField fullWidth type="number" label="Qty" value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }} />
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton color="error" onClick={() => removeItem(i)} disabled={items.length === 1}>
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button startIcon={<Add />} onClick={addItem} sx={{ mt: 1 }}>Add Another Book</Button>
                <TextField fullWidth label="Notes (optional)" value={notes}
                  onChange={(e) => setNotes(e.target.value)} margin="normal" multiline rows={2} />
              </Box>
            )}

            {invTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadFile />}>
                    {invoiceFile ? invoiceFile.name : 'Select Invoice PDF'}
                    <input type="file" accept=".pdf" hidden onChange={(e) => {
                      setInvoiceFile(e.target.files[0]);
                      setInvoicePreview(null);
                      setPreviewItems([]);
                    }} />
                  </Button>
                  {invoiceFile && !invoicePreview && (
                    <Button variant="contained" onClick={handleParseInvoice} disabled={invoiceParsing}>
                      {invoiceParsing ? <><CircularProgress size={18} sx={{ mr: 1 }} color="inherit" />Reading...</> : 'Read Invoice'}
                    </Button>
                  )}
                </Box>

                {invoicePreview && (
                  <Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" mb={1}>Preview — {invoicePreview.totalParsed} entries found</Typography>
                    {previewItems.length > 0 && (
                      <Box mb={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckCircle color="success" fontSize="small" />
                          <Typography variant="subtitle1" fontWeight={600} color="success.main">
                            Matched Books ({previewItems.length}) — stock will be updated
                          </Typography>
                        </Box>
                        <TableContainer component={Card} variant="outlined">
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'success.light' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Book Title</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Current Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Qty from Invoice</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>New Stock After Save</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {previewItems.map((item, i) => (
                                <TableRow key={i}>
                                  <TableCell>{item.title}</TableCell>
                                  <TableCell>{item.currentStock}</TableCell>
                                  <TableCell>
                                    <TextField type="number" size="small" value={item.quantity}
                                      onChange={(e) => updatePreviewQty(i, e.target.value)}
                                      inputProps={{ min: 1, style: { width: 70 } }} />
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={item.currentStock + item.quantity} color="success" size="small" />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                    {invoicePreview.unmatched?.length > 0 && (
                      <Box mb={2}>
                        <Alert severity="warning">
                          {invoicePreview.unmatched.length} unmatched book(s) from invoice not in catalog:
                          {invoicePreview.unmatched.map((u) => ` "${u.rawTitle}"`).join(',')}
                        </Alert>
                      </Box>
                    )}
                    <TextField fullWidth label="Notes (optional)" value={notes}
                      onChange={(e) => setNotes(e.target.value)} margin="normal" multiline rows={2} />
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setInvDialogOpen(false); resetInvDialog(); }}>Cancel</Button>
            {invTab === 0 && (
              <Button variant="contained" onClick={handleManualSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
              </Button>
            )}
            {invTab === 1 && invoicePreview && previewItems.length > 0 && (
              <Button variant="contained" color="success" startIcon={<CheckCircle />}
                onClick={handleConfirmInvoice} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : `Confirm & Update Stock (${previewItems.length} books)`}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
      )} {/* End Tab 1 */}

      {/* ---- Add/Edit Book Dialog ---- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Book Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="normal" required />
          <Autocomplete
            options={LANGUAGES}
            value={form.language}
            onChange={(_, val) => setForm({ ...form, language: val || '' })}
            renderInput={(params) => <TextField {...params} label="Language" margin="normal" fullWidth />}
          />
          <Autocomplete
            options={PUBLICATIONS}
            value={form.publication}
            onChange={(_, val) => setForm({ ...form, publication: val || '' })}
            renderInput={(params) => <TextField {...params} label="Publication" margin="normal" fullWidth />}
          />
          <TextField fullWidth label="Unit Cost (₹)" type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Subjects (comma-separated)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} margin="normal" helperText="e.g. Philosophy, Self-Help, Spirituality" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {editBook ? 'Update' : 'Add Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBooks;
