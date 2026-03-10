// src/pages/admin/AdminSchedules.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, IconButton, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { getSchedules, addSchedule, deleteSchedule, getCities, getVolunteers } from '../../services/api';
import { toast } from 'react-toastify';

const statusColors = { scheduled: 'primary', ongoing: 'success', completed: 'default', cancelled: 'error' };

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [cities, setCities] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ cityId: '', location: '', scheduledDate: '', startTime: '', assignedLeadId: '' });

  useEffect(() => {
    getSchedules({ status: '' }).then((r) => setSchedules(r.data));
    getCities().then((r) => setCities(r.data));
    getVolunteers({ status: 'active' }).then((r) => setVolunteers(r.data));
  }, []);

  const handleAdd = async () => {
    if (!form.cityId || !form.location || !form.scheduledDate || !form.startTime) {
      return toast.error('Please fill all required fields');
    }
    await addSchedule(form);
    toast.success('Schedule added!');
    setDialogOpen(false);
    getSchedules({ status: '' }).then((r) => setSchedules(r.data));
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this schedule?')) return;
    await deleteSchedule(id);
    toast.success('Schedule cancelled');
    getSchedules({ status: '' }).then((r) => setSchedules(r.data));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Bookstall Schedules</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Schedule</Button>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Date', 'City', 'Location', 'Time', 'Assigned Lead', 'Status', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s._id} hover>
                <TableCell>{new Date(s.scheduledDate).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{s.city?.name}</TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell>{s.startTime}</TableCell>
                <TableCell>{s.assignedLead?.name || <Chip label="Unassigned" size="small" />}</TableCell>
                <TableCell><Chip label={s.status} color={statusColors[s.status]} size="small" /></TableCell>
                <TableCell>
                  {s.status === 'scheduled' && (
                    <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={() => handleCancel(s._id)}><Delete /></IconButton></Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Bookstall Schedule</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="City *" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} margin="normal">
            {cities.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Exact Location *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} margin="normal" helperText="e.g. Near Gate 3, Science City" />
          <TextField fullWidth type="date" label="Date *" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} margin="normal" InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Start Time *" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} margin="normal" placeholder="e.g. 10:00 AM" />
          <TextField select fullWidth label="Assign Lead Volunteer" value={form.assignedLeadId} onChange={(e) => setForm({ ...form, assignedLeadId: e.target.value })} margin="normal">
            <MenuItem value="">-- Select Later --</MenuItem>
            {volunteers.map((v) => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSchedules;
