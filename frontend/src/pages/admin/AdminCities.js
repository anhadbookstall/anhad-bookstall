// src/pages/admin/AdminCities.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { getCities, addCity, deleteCity } from '../../services/api';
import { toast } from 'react-toastify';

const AdminCities = () => {
  const [cities, setCities] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pinCode: '', dateOfInclusion: new Date().toISOString().split('T')[0] });

  const fetch = () => getCities().then((r) => setCities(r.data));
  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.pinCode) return toast.error('Name and PIN code required');
    if (!/^\d{6}$/.test(form.pinCode)) return toast.error('PIN code must be 6 digits');
    await addCity(form);
    toast.success('City added!');
    setDialogOpen(false);
    setForm({ name: '', pinCode: '', dateOfInclusion: new Date().toISOString().split('T')[0] });
    fetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this city? This will also remove it from all volunteer preferences.')) return;
    await deleteCity(id);
    toast.success('City deleted');
    fetch();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Approved Cities</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add City</Button>
      </Box>
      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['City Name', 'PIN Code', 'Date Added', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cities.map((c) => (
              <TableRow key={c._id} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.pinCode}</TableCell>
                <TableCell>{new Date(c.dateOfInclusion).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  <Tooltip title="Delete City">
                    <IconButton size="small" color="error" onClick={() => handleDelete(c._id)}><Delete /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Approved City</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="City Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <TextField fullWidth label="PIN Code *" value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} margin="normal" inputProps={{ maxLength: 6 }} />
          <TextField fullWidth type="date" label="Date of Inclusion" value={form.dateOfInclusion} onChange={(e) => setForm({ ...form, dateOfInclusion: e.target.value })} margin="normal" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add City</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCities;
