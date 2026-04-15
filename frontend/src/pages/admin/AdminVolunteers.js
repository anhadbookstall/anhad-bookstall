// src/pages/admin/AdminVolunteers.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Tabs, Tab,
  FormControlLabel, Radio, RadioGroup, FormLabel, Avatar, Tooltip,
  Collapse, Grid, CircularProgress, Badge,
} from '@mui/material';
import { Add, Block, CheckCircle, Delete, PersonAdd, Star, StarBorder, ExpandMore, ExpandLess, QueryStats, ArrowUpward } from '@mui/icons-material';
import { useSort } from '../../utils/useSort';
import SortableTableCell from '../../components/common/SortableTableCell';
import {
  getVolunteers, addVolunteer, suspendVolunteer, revokeSupension,
  removeVolunteer, toggleBookstallLead, getVolunteerMatrix,
  getGitaMembers, approveGitaMember, rejectGitaMember,
  promoteToVolunteer, removeGitaMember, getPendingGitaCount,
} from '../../services/api';
import { toast } from 'react-toastify';

const emptyForm = {
  name: '', gmailId: '', contactNumber: '', sameAsWhatsApp: true,
  whatsappNumber: '', currentCity: '', geetaProfileLink: '',
};

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [mainTab, setMainTab] = useState(0); // 0=Volunteers, 1=Gita Members
  const [tab, setTab] = useState(0); // 0=active, 1=suspended, 2=removed
  const [gitaMembers, setGitaMembers] = useState([]);
  const [gitaTab, setGitaTab] = useState(0); // 0=pending, 1=active, 2=rejected
  const [pendingCount, setPendingCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const statusMap = ['active', 'suspended', 'removed'];
  const gitaStatusMap = ['pending', 'active', 'rejected'];
  const { sorted, sortField, sortDir, handleSort } = useSort(volunteers);

  const fetchGitaMembers = async () => {
    const res = await getGitaMembers({ status: gitaStatusMap[gitaTab] });
    setGitaMembers(res.data);
  };

  const fetchPendingCount = async () => {
    const res = await getPendingGitaCount();
    setPendingCount(res.data.count);
  };
  const [expandedVol, setExpandedVol] = useState(null);
  const [matrixData, setMatrixData] = useState({});
  const [matrixLoading, setMatrixLoading] = useState(null);

  const handleExpandVol = async (volId) => {
    if (expandedVol === volId) { setExpandedVol(null); return; }
    setExpandedVol(volId);
    if (!matrixData[volId]) {
      setMatrixLoading(volId);
      try {
        const res = await getVolunteerMatrix(volId);
        setMatrixData((prev) => ({ ...prev, [volId]: res.data }));
      } catch {
        toast.error('Error loading matrix');
      } finally {
        setMatrixLoading(null);
      }
    }
  };

  const fetchVols = async () => {
    const res = await getVolunteers({ status: statusMap[tab] });
    setVolunteers(res.data);
  };

  useEffect(() => { fetchVols(); }, [tab]);
  useEffect(() => { fetchGitaMembers(); }, [gitaTab]);
  useEffect(() => { fetchPendingCount(); }, []);

  const handleApprove = async (id) => {
    await approveGitaMember(id);
    toast.success('Member approved');
    fetchGitaMembers();
    fetchPendingCount();
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    await rejectGitaMember(id);
    toast.success('Application rejected');
    fetchGitaMembers();
    fetchPendingCount();
  };

  const handlePromote = async (member) => {
    if (!window.confirm(`Promote ${member.name} to full Volunteer?`)) return;
    try {
      await promoteToVolunteer(member._id);
      toast.success(`${member.name} is now a Volunteer!`);
      fetchGitaMembers();
      fetchVols();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error promoting member');
    }
  };

  const handleRemoveGita = async (id) => {
    if (!window.confirm('Remove this member?')) return;
    await removeGitaMember(id);
    toast.success('Member removed');
    fetchGitaMembers();
  };

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

  const handleToggleLead = async (vol) => {
    const action = vol.isBookstallLead ? 'remove Bookstall Lead tag from' : 'give Bookstall Lead tag to';
    if (!window.confirm(`Are you sure you want to ${action} ${vol.name}?`)) return;
    try {
      const res = await toggleBookstallLead(vol._id);
      toast.success(res.data.message);
      fetchVols();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating lead status');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Volunteers</Typography>
        {mainTab === 0 && (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setDialogOpen(true)}>
            Add Volunteer
          </Button>
        )}
      </Box>

      {/* Main tabs - Volunteers vs Gita Members */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Volunteers" />
        <Tab label={
          <Badge badgeContent={pendingCount} color="error">
            Gita Members&nbsp;&nbsp;
          </Badge>
        } />
      </Tabs>

      {/* ---- Volunteers Tab ---- */}
      {mainTab === 0 && (
      <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Active (${tab === 0 ? volunteers.length : '...'})`} />
        <Tab label="Suspended" />
        <Tab label="Removed" />
      </Tabs>

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <SortableTableCell label="" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="Gmail" field="gmailId" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="Contact" field="contactNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="City" field="currentCity" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="Joined" field="dateOfInclusion" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableTableCell label="Actions" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Matrix</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((vol) => (
              <React.Fragment key={vol._id}>
              <TableRow hover>
                <TableCell>
                  <Avatar src={vol.profilePhoto?.url} sx={{ width: 36, height: 36 }}>
                    {vol.name[0]}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {vol.name}
                    {vol.isBookstallLead && (
                      <Chip
                        label="Bookstall Lead"
                        size="small"
                        color="warning"
                        icon={<Star sx={{ fontSize: 14 }} />}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{vol.gmailId}</TableCell>
                <TableCell>{vol.contactNumber}</TableCell>
                <TableCell>{vol.currentCity}</TableCell>
                <TableCell>{new Date(vol.dateOfInclusion).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  <Tooltip title={expandedVol === vol._id ? 'Hide Matrix' : 'View Matrix'}>
                    <IconButton size="small" color="info" onClick={() => handleExpandVol(vol._id)}>
                      {expandedVol === vol._id ? <ExpandLess /> : <QueryStats />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {/* Bookstall Lead toggle - only for active volunteers */}
                  {vol.status === 'active' && (
                    <Tooltip title={vol.isBookstallLead ? 'Remove Bookstall Lead' : 'Make Bookstall Lead'}>
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleToggleLead(vol)}
                      >
                        {vol.isBookstallLead ? <Star /> : <StarBorder />}
                      </IconButton>
                    </Tooltip>
                  )}

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
              {/* Matrix Row */}
              <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                  <Collapse in={expandedVol === vol._id}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      {matrixLoading === vol._id && (
                        <CircularProgress size={24} />
                      )}
                      {matrixData[vol._id] && (
                        <Grid container spacing={2}>
                          {[
                            { label: 'Total Bookstalls Attended', value: matrixData[vol._id].totalBookstallAttended, color: 'primary.main' },
                            { label: 'Total Hours Spent', value: `${matrixData[vol._id].totalBookstallHours} hrs`, color: 'success.main' },
                            { label: 'Volunteer Efficiency', value: `${matrixData[vol._id].volunteerEfficiency} books/hr`, color: 'warning.main' },
                            { label: 'Total Reflections', value: matrixData[vol._id].totalReflections, color: 'info.main' },
                          ].map((stat) => (
                            <Grid item xs={6} md={3} key={stat.label}>
                              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                                <Typography variant="h5" fontWeight={700} color={stat.color}>
                                  {stat.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {stat.label}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
              </React.Fragment>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">No volunteers in this category</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      </Box>
      )} {/* End Volunteers Tab */}

      {/* ---- Gita Members Tab ---- */}
      {mainTab === 1 && (
      <Box>
        <Tabs value={gitaTab} onChange={(_, v) => setGitaTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Pending (${gitaTab === 0 ? gitaMembers.length : '...'})`} />
          <Tab label="Active Members" />
          <Tab label="Rejected" />
        </Tabs>

        <TableContainer component={Card}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                {['Name', 'Gmail', 'Contact', 'City', 'Applied', 'Why Join', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {gitaMembers.map((member) => (
                <TableRow key={member._id} hover>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.gmailId}</TableCell>
                  <TableCell>{member.contactNumber}</TableCell>
                  <TableCell>{member.currentCity}</TableCell>
                  <TableCell>{new Date(member.appliedAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {member.whyJoin}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {member.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton size="small" color="success" onClick={() => handleApprove(member._id)}>
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton size="small" color="error" onClick={() => handleReject(member._id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {member.status === 'active' && (
                      <>
                        <Tooltip title="Promote to Volunteer">
                          <IconButton size="small" color="primary" onClick={() => handlePromote(member)}>
                            <ArrowUpward />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error" onClick={() => handleRemoveGita(member._id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {member.status === 'rejected' && (
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => handleRemoveGita(member._id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {gitaMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {gitaTab === 0 ? 'No pending applications' : gitaTab === 1 ? 'No active Gita Members' : 'No rejected applications'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      )} {/* End Gita Members Tab */}

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