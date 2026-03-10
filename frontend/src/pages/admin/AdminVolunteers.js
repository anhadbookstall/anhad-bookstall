// src/pages/admin/AdminVolunteers.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Tabs, Tab,
  FormControlLabel, Radio, RadioGroup, FormLabel, Avatar, Tooltip,
} from '@mui/material';
import { Add, Block, CheckCircle, Delete, PersonAdd } from '@mui/icons-material';
import {
  getVolunteers, addVolunteer, suspendVolunteer, revokeSupension, removeVolunteer,
} from '../../services/api';
import { toast } from 'react-toastify';

const emptyForm = {
  name: '', gmailId: '', contactNumber: '', sameAsWhatsApp: true,
  whatsappNumber: '', currentCity: '', geetaProfileLink: '',
};

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [tab, setTab] = useState(0); // 0=active, 1=suspended, 2=removed
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const statusMap = ['active', 'suspended', 'removed'];

  const fetchVols = async () => {
    const res = await getVolunteers({ status: statusMap[tab] });
    setVolunteers(res.data);
  };

  useEffect(() => { fetchVols(); }, [tab]);

  const handleAdd = async () => {
    if (!form.name || !form.gmailId) return toast.error('Name and Gmail are required');
    setLoading(true);
    try {
      await addVolunteer(form);
      toast.success('Volunteer added! They can now login with their Gmail.');
      setDialogOpen(false);
      setForm(emptyForm);
      fetchVols();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this volunteer?')) return;
    await suspendVolunteer(id);
    toast.success('Volunteer suspended');
    fetchVols();
  };

  const handleRevoke = async (id) => {
    await revokeSupension(id);
    toast.success('Suspension revoked');
    fetchVols();
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Permanently remove this volunteer?')) return;
    await removeVolunteer(id);
    toast.success('Volunteer removed');
    fetchVols();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Volunteers</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setDialogOpen(true)}>
          Add Volunteer
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Active (${tab === 0 ? volunteers.length : '...'})`} />
        <Tab label="Suspended" />
        <Tab label="Removed" />
      </Tabs>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['', 'Name', 'Gmail', 'Contact', 'City', 'Joined', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers.map((vol) => (
              <TableRow key={vol._id} hover>
                <TableCell><Avatar src={vol.profilePhoto?.url} sx={{ width: 36, height: 36 }}>{vol.name[0]}</Avatar></TableCell>
                <TableCell>{vol.name}</TableCell>
                <TableCell>{vol.gmailId}</TableCell>
                <TableCell>{vol.contactNumber}</TableCell>
                <TableCell>{vol.currentCity}</TableCell>
                <TableCell>{new Date(vol.dateOfInclusion).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  {vol.status === 'active' && (
                    <Tooltip title="Suspend">
                      <IconButton size="small" color="warning" onClick={() => handleSuspend(vol._id)}>
                        <Block />
                      </IconButton>
                    </Tooltip>
                  )}
                  {vol.status === 'suspended' && (
                    <Tooltip title="Revoke Suspension">
                      <IconButton size="small" color="success" onClick={() => handleRevoke(vol._id)}>
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Remove">
                    <IconButton size="small" color="error" onClick={() => handleRemove(vol._id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {volunteers.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No volunteers in this category</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Volunteer Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Volunteer</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <TextField fullWidth label="Gmail ID *" type="email" value={form.gmailId} onChange={(e) => setForm({ ...form, gmailId: e.target.value })} margin="normal" helperText="This Gmail will be used for login" />
          <TextField fullWidth label="Geeta Profile Link" value={form.geetaProfileLink} onChange={(e) => setForm({ ...form, geetaProfileLink: e.target.value })} margin="normal" />
          <TextField fullWidth label="Contact Number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} margin="normal" />
          <FormLabel>WhatsApp Number</FormLabel>
          <RadioGroup row value={form.sameAsWhatsApp ? 'same' : 'diff'} onChange={(e) => setForm({ ...form, sameAsWhatsApp: e.target.value === 'same' })}>
            <FormControlLabel value="same" control={<Radio />} label="Same as Contact" />
            <FormControlLabel value="diff" control={<Radio />} label="Different" />
          </RadioGroup>
          {!form.sameAsWhatsApp && (
            <TextField fullWidth label="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} margin="normal" />
          )}
          <TextField fullWidth label="Current City" value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={loading}>Add Volunteer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVolunteers;
