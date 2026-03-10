// src/pages/admin/AdminExpenditures.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { getExpenditures, addExpenditure } from '../../services/api';
import { toast } from 'react-toastify';

const EXPENDITURE_TYPES = [
  'Fuel', 'Food & Refreshments', 'Free Book Gifting',
  'Table', 'Book Stand', 'Table Cloth', 'Stationery', 'Other',
];

const AdminExpenditures = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    detail: '', type: 'recurring', cost: '',
    dateOfExpenditure: new Date().toISOString().split('T')[0],
  });
  const [totalRecurring, setTotalRecurring] = useState(0);
  const [totalOneTime, setTotalOneTime] = useState(0);

  const fetch = async () => {
    const res = await getExpenditures();
    setExpenditures(res.data);
    setTotalRecurring(res.data.filter((e) => e.type === 'recurring').reduce((s, e) => s + e.cost, 0));
    setTotalOneTime(res.data.filter((e) => e.type === 'one-time').reduce((s, e) => s + e.cost, 0));
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!form.detail || !form.cost) return toast.error('Detail and cost required');
    await addExpenditure({ ...form, cost: parseFloat(form.cost) });
    toast.success('Expenditure recorded');
    setDialogOpen(false);
    setForm({ detail: '', type: 'recurring', cost: '', dateOfExpenditure: new Date().toISOString().split('T')[0] });
    fetch();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Expenditures</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Expenditure</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary">Recurring Total</Typography>
          <Typography variant="h5" color="warning.main" fontWeight={700}>₹{totalRecurring.toLocaleString()}</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary">One-time Total</Typography>
          <Typography variant="h5" color="error.main" fontWeight={700}>₹{totalOneTime.toLocaleString()}</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary">Grand Total</Typography>
          <Typography variant="h5" fontWeight={700}>₹{(totalRecurring + totalOneTime).toLocaleString()}</Typography>
        </Card>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Date', 'Detail', 'Type', 'Cost'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {expenditures.map((e) => (
              <TableRow key={e._id} hover>
                <TableCell>{new Date(e.dateOfExpenditure).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{e.detail}</TableCell>
                <TableCell><Chip label={e.type} color={e.type === 'recurring' ? 'warning' : 'default'} size="small" /></TableCell>
                <TableCell>₹{e.cost.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Expenditure</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Expenditure Type" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} margin="normal">
            {EXPENDITURE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="If Other, specify detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} margin="normal" />
          <TextField select fullWidth label="Category" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} margin="normal">
            <MenuItem value="recurring">Recurring (fuel, food, free books)</MenuItem>
            <MenuItem value="one-time">One-time (table, stand, cloth)</MenuItem>
          </TextField>
          <TextField fullWidth type="number" label="Cost (₹)" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} margin="normal" />
          <TextField fullWidth type="date" label="Date" value={form.dateOfExpenditure} onChange={(e) => setForm({ ...form, dateOfExpenditure: e.target.value })} margin="normal" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminExpenditures;
