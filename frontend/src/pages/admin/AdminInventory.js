// src/pages/admin/AdminInventory.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Typography, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress,
} from '@mui/material';
import { Add, Delete, UploadFile } from '@mui/icons-material';
import { getBooks, getInventoryHistory, updateInventory } from '../../services/api';
import { toast } from 'react-toastify';

const AdminInventory = () => {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState([{ bookId: '', quantity: 1 }]);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBooks().then((r) => setBooks(r.data));
    getInventoryHistory().then((r) => setHistory(r.data));
  }, []);

  const addItem = () => setItems([...items, { bookId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (items.some((it) => !it.bookId || !it.quantity)) {
      return toast.error('Please fill all book and quantity fields');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('items', JSON.stringify(items));
      fd.append('dateReceived', dateReceived);
      fd.append('notes', notes);
      if (invoiceFile) fd.append('invoice', invoiceFile);

      await updateInventory(fd);
      toast.success('Inventory updated successfully!');
      setDialogOpen(false);
      setItems([{ bookId: '', quantity: 1 }]);
      getInventoryHistory().then((r) => setHistory(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating inventory');
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

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Date Received', 'Books', 'Notes', 'Invoice'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((inv) => (
              <TableRow key={inv._id} hover>
                <TableCell>{new Date(inv.dateReceived).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  {inv.items.map((it) => (
                    <div key={it._id}>{it.book?.title} × {it.quantity}</div>
                  ))}
                </TableCell>
                <TableCell>{inv.notes}</TableCell>
                <TableCell>
                  {inv.invoiceFile?.url && (
                    <Button size="small" href={inv.invoiceFile.url} target="_blank">View PDF</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Inventory (Books Received)</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="date" label="Date Received" value={dateReceived}
            onChange={(e) => setDateReceived(e.target.value)} margin="normal" InputLabelProps={{ shrink: true }} />

          {items.map((item, i) => (
            <Grid container spacing={2} key={i} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={7}>
                <TextField select fullWidth label="Book" value={item.bookId}
                  onChange={(e) => updateItem(i, 'bookId', e.target.value)}>
                  {books.map((b) => <MenuItem key={b._id} value={b._id}>{b.title} (Stock: {b.currentStock})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth type="number" label="Quantity" value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))} inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={2}>
                <IconButton color="error" onClick={() => removeItem(i)} disabled={items.length === 1}><Delete /></IconButton>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<Add />} onClick={addItem} sx={{ mt: 2 }}>Add Another Book</Button>

          <TextField fullWidth label="Notes (optional)" value={notes}
            onChange={(e) => setNotes(e.target.value)} margin="normal" multiline rows={2} />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>Attach Invoice PDF (optional)</Typography>
            <Button variant="outlined" component="label" startIcon={<UploadFile />}>
              {invoiceFile ? invoiceFile.name : 'Upload Invoice'}
              <input type="file" accept=".pdf" hidden onChange={(e) => setInvoiceFile(e.target.files[0])} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventory;
