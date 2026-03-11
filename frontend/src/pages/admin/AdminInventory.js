// src/pages/admin/AdminInventory.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Typography, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress, Alert, Tabs, Tab, Chip, Divider,
} from '@mui/material';
import { Add, Delete, UploadFile, CheckCircle, Warning } from '@mui/icons-material';
import { getBooks, getInventoryHistory, updateInventory, parseInvoice, confirmInvoice } from '../../services/api';
import { toast } from 'react-toastify';

const AdminInventory = () => {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = manual form, 1 = invoice upload

  // Manual form state
  const [items, setItems] = useState([{ bookId: '', quantity: 1 }]);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Invoice upload state
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceParsing, setInvoiceParsing] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(null); // parsed result from backend
  const [previewItems, setPreviewItems] = useState([]); // editable preview rows

  useEffect(() => {
    getBooks().then((r) => setBooks(r.data));
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    getInventoryHistory().then((r) => setHistory(r.data));
  };

  const resetDialog = () => {
    setItems([{ bookId: '', quantity: 1 }]);
    setNotes('');
    setInvoiceFile(null);
    setInvoicePreview(null);
    setPreviewItems([]);
    setActiveTab(0);
    setDateReceived(new Date().toISOString().split('T')[0]);
  };

  // ---- Manual Form ----
  const addItem = () => setItems([...items, { bookId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const handleManualSubmit = async () => {
    const filledItems = items.filter((it) => it.bookId && it.quantity);
    if (filledItems.length === 0) {
      return toast.error('Please add at least one book with quantity');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('items', JSON.stringify(filledItems));
      fd.append('dateReceived', dateReceived);
      fd.append('notes', notes);
      await updateInventory(fd);
      toast.success('Inventory updated successfully!');
      setDialogOpen(false);
      resetDialog();
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating inventory');
    } finally {
      setLoading(false);
    }
  };

  // ---- Invoice Upload: Step 1 - Parse ----
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
      // Set editable preview rows from matched items
      setPreviewItems(res.data.matched.map((item) => ({ ...item })));
      toast.success(`Parsed ${res.data.totalParsed} book entries from invoice`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error parsing invoice');
    } finally {
      setInvoiceParsing(false);
    }
  };

  // Update quantity in preview (admin can correct before confirming)
  const updatePreviewQty = (i, qty) => {
    const updated = [...previewItems];
    updated[i] = { ...updated[i], quantity: parseInt(qty) || 1 };
    setPreviewItems(updated);
  };

  // ---- Invoice Upload: Step 2 - Confirm & Save ----
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
      setDialogOpen(false);
      resetDialog();
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Update Inventory
        </Button>
      </Box>

      {/* History Table */}
      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Date Received', 'Books & Quantities', 'Notes', 'Invoice'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((inv) => (
              <TableRow key={inv._id} hover>
                <TableCell>{new Date(inv.dateReceived).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  {inv.items.map((it, i) => (
                    <div key={i}>{it.book?.title || 'Unknown'} × {it.quantity}</div>
                  ))}
                  {inv.items.length === 0 && <Typography variant="caption" color="text.secondary">Invoice only</Typography>}
                </TableCell>
                <TableCell>{inv.notes}</TableCell>
                <TableCell>
                  {inv.invoiceFile?.url && (
                    <Button size="small" href={inv.invoiceFile.url} target="_blank" variant="outlined">
                      View PDF
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No inventory updates yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Inventory Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetDialog(); }} maxWidth="md" fullWidth>
        <DialogTitle>Update Inventory</DialogTitle>
        <DialogContent>
          {/* Tab switcher */}
          <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setInvoicePreview(null); setPreviewItems([]); }} sx={{ mb: 3 }}>
            <Tab label="Fill Form Manually" />
            <Tab label="Upload Invoice PDF" />
          </Tabs>

          {/* Common date field */}
          <TextField
            fullWidth type="date" label="Date Received"
            value={dateReceived}
            onChange={(e) => setDateReceived(e.target.value)}
            margin="normal" InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          {/* ---- TAB 0: Manual Form ---- */}
          {activeTab === 0 && (
            <Box>
              {items.map((item, i) => (
                <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={7}>
                    <TextField
                      select fullWidth label="Book" value={item.bookId}
                      onChange={(e) => updateItem(i, 'bookId', e.target.value)}
                    >
                      {books.map((b) => (
                        <MenuItem key={b._id} value={b._id}>
                          {b.title} (Current stock: {b.currentStock})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth type="number" label="Qty" value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton color="error" onClick={() => removeItem(i)} disabled={items.length === 1}>
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button startIcon={<Add />} onClick={addItem} sx={{ mt: 1 }}>
                Add Another Book
              </Button>
              <TextField
                fullWidth label="Notes (optional)" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal" multiline rows={2}
              />
            </Box>
          )}

          {/* ---- TAB 1: Invoice Upload ---- */}
          {activeTab === 1 && (
            <Box>
              {/* File picker + parse button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button variant="outlined" component="label" startIcon={<UploadFile />}>
                  {invoiceFile ? invoiceFile.name : 'Select Invoice PDF'}
                  <input
                    type="file" accept=".pdf" hidden
                    onChange={(e) => {
                      setInvoiceFile(e.target.files[0]);
                      setInvoicePreview(null);
                      setPreviewItems([]);
                    }}
                  />
                </Button>
                {invoiceFile && !invoicePreview && (
                  <Button
                    variant="contained" onClick={handleParseInvoice}
                    disabled={invoiceParsing}
                  >
                    {invoiceParsing
                      ? <><CircularProgress size={18} sx={{ mr: 1 }} color="inherit" /> Reading Invoice...</>
                      : 'Read Invoice'}
                  </Button>
                )}
              </Box>

              {/* Preview - shown after parsing */}
              {invoicePreview && (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" mb={1}>
                    Preview — {invoicePreview.totalParsed} entries found in invoice
                  </Typography>

                  {/* Matched books */}
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
                                  {/* Admin can edit quantity before confirming */}
                                  <TextField
                                    type="number" size="small" value={item.quantity}
                                    onChange={(e) => updatePreviewQty(i, e.target.value)}
                                    inputProps={{ min: 1, style: { width: 70 } }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.currentStock + item.quantity}
                                    color="success" size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Unmatched books */}
                  {invoicePreview.unmatched?.length > 0 && (
                    <Box mb={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color="warning" fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                          Unmatched Books ({invoicePreview.unmatched.length}) — NOT in your catalog
                        </Typography>
                      </Box>
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        These titles from the invoice do not exactly match any book in your catalog.
                        Please add them to the Books catalog first, then re-upload the invoice.
                      </Alert>
                      <TableContainer component={Card} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'warning.light' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Title in Invoice</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Qty in Invoice</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoicePreview.unmatched.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>{item.rawTitle}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  <TextField
                    fullWidth label="Notes (optional)" value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    margin="normal" multiline rows={2}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); resetDialog(); }}>Cancel</Button>

          {/* Manual form save button */}
          {activeTab === 0 && (
            <Button variant="contained" onClick={handleManualSubmit} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          )}

          {/* Invoice confirm button - only shown after preview is ready */}
          {activeTab === 1 && invoicePreview && previewItems.length > 0 && (
            <Button
              variant="contained" color="success"
              startIcon={<CheckCircle />}
              onClick={handleConfirmInvoice} disabled={loading}
            >
              {loading
                ? <CircularProgress size={20} color="inherit" />
                : `Confirm & Update Stock (${previewItems.length} books)`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventory;
