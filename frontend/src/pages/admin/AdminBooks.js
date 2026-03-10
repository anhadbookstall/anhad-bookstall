// src/pages/admin/AdminBooks.js
// Admin can view, add, edit, and delete books from the catalog
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Tooltip,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning } from '@mui/icons-material';
import { getBooks, addBook, updateBook, deleteBook } from '../../services/api';
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

  const fetchBooks = async () => {
    const res = await getBooks({ search });
    setBooks(res.data);
  };

  useEffect(() => { fetchBooks(); }, [search]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Books Catalog</Typography>
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
              {['Title', 'Language', 'Publication', 'Unit Cost', 'Stock', 'Subjects', 'Actions'].map((h) => (
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
                  <Chip
                    label={book.currentStock}
                    color={book.currentStock < 3 ? 'error' : 'success'}
                    size="small"
                    icon={book.currentStock < 3 ? <Warning /> : undefined}
                  />
                </TableCell>
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
              <TableRow><TableCell colSpan={7} align="center">No books found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Book Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="normal" required />
          <TextField select fullWidth label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} margin="normal">
            {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Publication" value={form.publication} onChange={(e) => setForm({ ...form, publication: e.target.value })} margin="normal">
            {PUBLICATIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
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
