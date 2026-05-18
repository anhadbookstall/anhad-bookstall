// src/pages/admin/AdminCities.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Collapse, Avatar, Chip, CircularProgress,
} from '@mui/material';
import { Add, Delete, ExpandMore, ExpandLess, People } from '@mui/icons-material';
import { getCities, addCity, deleteCity, getCityVolunteers } from '../../services/api';
import { toast } from 'react-toastify';

const AdminCities = () => {
  const [cities, setCities] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pinCode: '', dateOfInclusion: new Date().toISOString().split('T')[0] });
  const [expandedCity, setExpandedCity] = useState(null);
  const [cityVolunteers, setCityVolunteers] = useState({});
  const [volLoading, setVolLoading] = useState(null);

  const handleExpandCity = async (cityId) => {
    if (expandedCity === cityId) { setExpandedCity(null); return; }
    setExpandedCity(cityId);
    if (!cityVolunteers[cityId]) {
      setVolLoading(cityId);
      try {
        const res = await getCityVolunteers(cityId);
        setCityVolunteers((prev) => ({ ...prev, [cityId]: res.data }));
      } catch (err) {
        toast.error('Error loading volunteers');
        console.error('City volunteers error:', err.response?.data || err.message);
      } finally {
        setVolLoading(null);
      }
    }
  };

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
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>City Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>PIN Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date Added</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Volunteers</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cities.map((c) => (
              <React.Fragment key={c._id}>
                <TableRow hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.pinCode}</TableCell>
                  <TableCell>{new Date(c.dateOfInclusion).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <Tooltip title={expandedCity === c._id ? 'Hide Volunteers' : 'Show Volunteers'}>
                      <IconButton size="small" color="primary" onClick={() => handleExpandCity(c._id)}>
                        {expandedCity === c._id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete City">
                      <IconButton size="small" color="error" onClick={() => handleDelete(c._id)}><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                {/* Expanded volunteer list */}
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedCity === c._id}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {volLoading === c._id && <CircularProgress size={20} />}
                        {!volLoading && cityVolunteers[c._id] && (
                          <>
                            {/* Volunteers */}
                            {cityVolunteers[c._id].volunteers?.length > 0 && (
                              <Box mb={1}>
                                <Typography variant="caption" fontWeight={700} color="primary.main" display="block" mb={1}>
                                  Volunteers ({cityVolunteers[c._id].volunteers.length})
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {cityVolunteers[c._id].volunteers.map((v) => (
                                    <Chip
                                      key={v._id}
                                      avatar={<Avatar src={v.profilePhoto?.url}>{v.name?.[0]}</Avatar>}
                                      label={`${v.name}${v.isBookstallLead ? ' ⭐' : ''}`}
                                      size="small"
                                      color={v.isBookstallLead ? 'warning' : 'default'}
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {/* Gita Members */}
                            {cityVolunteers[c._id].gitaMembers?.length > 0 && (
                              <Box mt={1}>
                                <Typography variant="caption" fontWeight={700} color="success.main" display="block" mb={1}>
                                  Gita Members ({cityVolunteers[c._id].gitaMembers.length})
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {cityVolunteers[c._id].gitaMembers.map((m) => (
                                    <Chip
                                      key={m._id}
                                      label={m.name}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {cityVolunteers[c._id].volunteers?.length === 0 &&
                              cityVolunteers[c._id].gitaMembers?.length === 0 && (
                              <Typography variant="caption" color="text.secondary">
                                No volunteers or members have opted for this city yet.
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
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
