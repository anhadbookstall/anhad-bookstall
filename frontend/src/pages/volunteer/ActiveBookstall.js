// src/pages/volunteer/ActiveBookstall.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, FormControlLabel, Checkbox, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Alert, Autocomplete, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableHead, TableRow, Divider,
} from '@mui/material';
import {
  ExpandMore, PlayArrow, Stop, ExitToApp, ReplayCircleFilled,
  CameraAlt, Store, BarChart, AccessTime, MenuBook, Speed,
} from '@mui/icons-material';
import {
  getActiveBookstall, startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addSale, getBooks, getCities,
  getVolunteers, getBookstallSummary, createReflectionPost,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getMe } from '../../services/api';
import { toast } from 'react-toastify';
const AGE_CATEGORIES = [
  '0-5','6-10','11-15','16-20','21-25','26-30',
  '31-35','36-40','41-45','46-50','51-55','56-60',
  '61-65','66-70','71 & above',
];

const emptySaleForm = {
  bookId: '', quantity: 1, soldPrice: '', gender: '',
  ageCategory: '', knowsAcharyaPrashant: false,
  joinedGitaCommunity: false, photoConsent: false,
};

const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

// ---- Summary Dialog Component ----
const SummaryDialog = ({ bookstallId, open, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && bookstallId) {
      setLoading(true);
      getBookstallSummary(bookstallId)
        .then((r) => setSummary(r.data))
        .catch(() => toast.error('Error loading summary'))
        .finally(() => setLoading(false));
    }
  }, [open, bookstallId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart color="primary" />
          Bookstall Summary
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />}
        {summary && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              📍 {summary.city} — {summary.location} | {new Date(summary.startedAt).toLocaleDateString('en-IN')}
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} mb={2}>
              {[
                { icon: <AccessTime />, label: 'Total Hours', value: summary.totalHours, color: 'primary.main' },
                { icon: <MenuBook />, label: 'Books Sold', value: summary.totalBooksSold, color: 'success.main' },
                { icon: <Speed />, label: 'Bookstall Efficiency', value: summary.bookstallEfficiency, color: 'warning.main' },
                { icon: <Speed />, label: 'Volunteer Efficiency', value: summary.volunteerEfficiency, color: 'info.main' },
              ].map((stat) => (
                <Grid item xs={6} key={stat.label}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    <Typography variant="h5" fontWeight={700} color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Books Breakdown */}
            {Object.keys(summary.bookBreakdown).length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Books Sold Breakdown</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell>Book</TableCell>
                      <TableCell align="right">Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(summary.bookBreakdown).map(([title, qty]) => (
                      <TableRow key={title}>
                        <TableCell>{title}</TableCell>
                        <TableCell align="right">{qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Volunteer Hours */}
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Volunteer Presence</Typography>
            {summary.volunteerHours.map((v, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">{v.name}</Typography>
                <Typography variant="body2" fontWeight={600}>{v.hours} hrs</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={600}>Total Presence Hours</Typography>
              <Typography variant="body2" fontWeight={600}>{summary.totalPresenceHours} hrs</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---- Main Component ----
const ActiveBookstall = () => {
  const { user } = useAuth();

  const [bookstall, setBookstall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [cities, setCities] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [reflection, setReflection] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryBookstallId, setSummaryBookstallId] = useState(null);
  const [isLead, setIsLead] = useState(user?.isBookstallLead || false);

  const [startForm, setStartForm] = useState({
    cityId: '', location: '', presentVolunteerIds: [], specialOccasion: '',
  });

  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [salePhoto, setSalePhoto] = useState(null);
  const [saleLoading, setSaleLoading] = useState(false);

  const isActiveLead = bookstall && (
    isSameId(bookstall.lead?._id, user?.id) ||
    isSameId(bookstall.lead, user?.id)
  );

  // Fix 1: Only check attendance array for non-lead presence (lead shown separately)
  const myAttendance = bookstall?.attendance?.find((a) =>
    isSameId(a.volunteer?._id || a.volunteer, user?.id)
  );
  const isPresent = isActiveLead || myAttendance?.isPresent;

  const fetchBooks = () => {
    getBooks().then((r) => setBooks(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchBookstall();
    fetchBooks();
    getCities().then((r) => setCities(r.data)).catch(() => {});
    getVolunteers({ status: 'active' }).then((r) => {
      setVolunteers(r.data.filter((v) => !isSameId(v._id, user?.id)));
    }).catch(() => {});
    // Fetch fresh user data to get latest isBookstallLead value
    getMe().then((r) => setIsLead(r.data.isBookstallLead || false)).catch(() => {});
  }, []);

  const fetchBookstall = async () => {
    try {
      const res = await getActiveBookstall();
      setBookstall(res.data);
    } catch {
      setBookstall(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!startForm.cityId || !startForm.location) {
      return toast.error('City and location are required');
    }
    setLoading(true);
    try {
      const coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
      const res = await startBookstall({ ...startForm, coordinates: coords });
      setBookstall(res.data);
      setShowStartForm(false);
      toast.success('Bookstall started! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting bookstall');
    } finally {
      setLoading(false);
    }
  };

  // Fix 2: Refresh books immediately after sale saved
  const handleSale = async () => {
    if (!saleForm.bookId || !saleForm.soldPrice || !saleForm.gender || !saleForm.ageCategory) {
      return toast.error('Please fill all required sale fields');
    }
    if (salePhoto && !saleForm.photoConsent) {
      return toast.error('Please tick the consent checkbox before saving photo');
    }
    setSaleLoading(true);
    try {
      const fd = new FormData();
      fd.append('bookstallId', bookstall._id);
      fd.append('bookId', saleForm.bookId);
      fd.append('quantity', saleForm.quantity);
      fd.append('soldPrice', saleForm.soldPrice);
      fd.append('gender', saleForm.gender);
      fd.append('ageCategory', saleForm.ageCategory);
      fd.append('knowsAcharyaPrashant', saleForm.knowsAcharyaPrashant);
      fd.append('joinedGitaCommunity', saleForm.joinedGitaCommunity);
      fd.append('photoConsent', saleForm.photoConsent);
      if (salePhoto) fd.append('photo', salePhoto);
      await addSale(fd);
      toast.success('Sale recorded! ✅');
      setSaleForm(emptySaleForm);
      setSalePhoto(null);
      fetchBooks(); // Fix 2: Immediately refresh book stock after sale
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording sale');
    } finally {
      setSaleLoading(false);
    }
  };

  // Fix 3: Show summary before actually closing
  const handleClose = async () => {
    if (!window.confirm('Close the bookstall? This will end the session for everyone.')) return;
    try {
      await closeBookstall(bookstall._id);
      toast.success('Bookstall closed successfully');
      setSummaryBookstallId(bookstall._id);
      setSummaryOpen(true);
      setBookstall(null);
      // Reset start form and reload volunteers fresh (excluding lead)
      setStartForm({ cityId: '', location: '', presentVolunteerIds: [], specialOccasion: '' });
      getVolunteers({ status: 'active' }).then((r) => {
        setVolunteers(r.data.filter((v) => !isSameId(v._id, user?.id)));
      }).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error closing bookstall');
    }
  };

  const handleReflection = async () => {
    if (!reflection.trim()) return;
    try {
      const fd = new FormData();
      fd.append('text', reflection.trim());
      fd.append('bookstallId', bookstall._id);
      fd.append('bookstallCity', bookstall.city?.name || '');
      fd.append('bookstallLocation', bookstall.location || '');
      await createReflectionPost(fd);
      toast.success('Reflection posted to feed! ✅');
      setReflection('');
    } catch {
      toast.error('Error saving reflection');
    }
  };

  const cityVolunteers = startForm.cityId
    ? volunteers.filter((v) =>
        v.willingCities?.some((c) => isSameId(c._id || c, startForm.cityId))
      )
    : [];

  // ---- LOADING ----
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ---- NO ACTIVE BOOKSTALL ----
  if (!bookstall) {
    return (
      <Box>
        <SummaryDialog
          bookstallId={summaryBookstallId}
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
        />

        <Alert severity="info" icon={<Store />} sx={{ mb: 4, fontSize: '1rem' }}>
          There is no active bookstall at present.
        </Alert>

        {isLead && !showStartForm && (
          <Button
            variant="contained" color="success" size="large"
            startIcon={<PlayArrow />} onClick={() => setShowStartForm(true)} sx={{ mb: 4 }}
          >
            Start a Bookstall
          </Button>
        )}

        {isLead && showStartForm && (
          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="h6" mb={2} color="success.main">Start Bookstall</Typography>

              <TextField
                select fullWidth label="City *" value={startForm.cityId}
                onChange={(e) => setStartForm({ ...startForm, cityId: e.target.value, presentVolunteerIds: [] })}
                margin="normal"
              >
                {cities.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField>

              <TextField
                fullWidth label="Exact Location *" value={startForm.location}
                onChange={(e) => setStartForm({ ...startForm, location: e.target.value })}
                margin="normal" placeholder="e.g. Near Main Gate, Sector 62"
              />

              <TextField
                fullWidth label="Special Occasion / Event (optional)"
                value={startForm.specialOccasion}
                onChange={(e) => setStartForm({ ...startForm, specialOccasion: e.target.value })}
                margin="normal"
              />

              <Autocomplete
                multiple
                options={cityVolunteers}
                getOptionLabel={(v) => v.name}
                value={volunteers.filter((v) => startForm.presentVolunteerIds.includes(v._id))}
                onChange={(_, val) => setStartForm({ ...startForm, presentVolunteerIds: val.map((v) => v._id) })}
                noOptionsText={!startForm.cityId ? 'Select a city first' : 'No volunteers willing for this city'}
                renderInput={(params) => (
                  <TextField {...params} label="Mark Present Volunteers" margin="normal"
                    helperText="Only volunteers willing to serve in selected city are shown" />
                )}
              />

              <Alert severity="info" sx={{ mt: 2 }}>📍 GPS coordinates will be captured automatically.</Alert>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => setShowStartForm(false)}>Cancel</Button>
                <Button variant="contained" color="success" size="large"
                  startIcon={<PlayArrow />} fullWidth onClick={handleStart} disabled={loading}>
                  Confirm Start
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {!isLead && (
          <Typography variant="body2" color="text.secondary">
            You will be notified when a bookstall is started by a Bookstall Lead.
          </Typography>
        )}
      </Box>
    );
  }

  // ---- ACTIVE BOOKSTALL ----
  return (
    <Box>
      <SummaryDialog
        bookstallId={bookstall._id}
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">📚 Active Bookstall</Typography>
          <Typography variant="body1" color="text.secondary">
            {bookstall.city?.name} | 📍 {bookstall.location}
            {bookstall.specialOccasion && (
              <Chip label={bookstall.specialOccasion} size="small" sx={{ ml: 1 }} color="secondary" />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Started at {new Date(bookstall.startedAt).toLocaleTimeString('en-IN')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Fix 3: Summary button visible during active bookstall */}
          <Button
            variant="outlined" color="info" startIcon={<BarChart />}
            onClick={() => setSummaryOpen(true)}
          >
            Summary
          </Button>

          {!isActiveLead && isPresent && (
            <Button variant="outlined" color="warning" startIcon={<ExitToApp />}
              onClick={async () => { await exitBookstall(bookstall._id); fetchBookstall(); toast.success('You have exited'); }}>
              Exit
            </Button>
          )}
          {!isActiveLead && !isPresent && myAttendance && (
            <Button variant="outlined" color="success" startIcon={<ReplayCircleFilled />}
              onClick={async () => { await rejoinBookstall(bookstall._id); fetchBookstall(); toast.success('You have rejoined'); }}>
              Rejoin
            </Button>
          )}
          {isActiveLead && (
            <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleClose}>
              Close Bookstall
            </Button>
          )}
        </Box>
      </Box>

      {/* Fix 1: Attendance - lead shown once with (Lead) chip, attendance array filtered to exclude lead */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Attendance</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Lead shown once explicitly */}
            <Chip
              avatar={<Avatar src={bookstall.lead?.profilePhoto?.url}>{bookstall.lead?.name?.[0]}</Avatar>}
              label={`${bookstall.lead?.name} (Lead)`} color="primary"
            />
            {/* Attendance array - skip the lead to avoid duplicate */}
            {bookstall.attendance
              ?.filter((a) => !isSameId(a.volunteer?._id || a.volunteer, bookstall.lead?._id || bookstall.lead))
              .map((a) => (
                <Chip key={a._id}
                  avatar={<Avatar src={a.volunteer?.profilePhoto?.url}>{a.volunteer?.name?.[0]}</Avatar>}
                  label={a.volunteer?.name}
                  color={a.isPresent ? 'success' : 'default'}
                  variant={a.isPresent ? 'filled' : 'outlined'}
                />
              ))}
          </Box>
        </CardContent>
      </Card>

      {/* Book Sale Form */}
      {isPresent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">➕ Add Book Sale</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                {/* Fix 2: Books list is refreshed after each sale so stock is up to date */}
                <Autocomplete
                  options={books.filter((b) => b.currentStock > 0)} // Only show books with stock > 0
                  getOptionLabel={(b) => `${b.title} (Stock: ${b.currentStock})`}
                  value={books.find((b) => b._id === saleForm.bookId) || null}
                  onChange={(_, val) => setSaleForm({ ...saleForm, bookId: val?._id || '', soldPrice: val?.unitCost || '' })}
                  noOptionsText="No books available in stock"
                  renderInput={(params) => <TextField {...params} label="Book Title *" />}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth type="number" label="Quantity *" value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })} inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth type="number" label="Sold Price (₹) *" value={saleForm.soldPrice}
                  onChange={(e) => setSaleForm({ ...saleForm, soldPrice: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Gender *" value={saleForm.gender}
                  onChange={(e) => setSaleForm({ ...saleForm, gender: e.target.value })}>
                  {['Male', 'Female', 'Third Gender'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Age Category *" value={saleForm.ageCategory}
                  onChange={(e) => setSaleForm({ ...saleForm, ageCategory: e.target.value })}>
                  {AGE_CATEGORIES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <FormControlLabel
                    control={<Checkbox checked={saleForm.knowsAcharyaPrashant}
                      onChange={(e) => setSaleForm({ ...saleForm, knowsAcharyaPrashant: e.target.checked })} />}
                    label="Knows Acharya Prashant?"
                  />
                  {saleForm.knowsAcharyaPrashant && (
                    <FormControlLabel
                      control={<Checkbox checked={saleForm.joinedGitaCommunity}
                        onChange={(e) => setSaleForm({ ...saleForm, joinedGitaCommunity: e.target.checked })} />}
                      label="Joined Gita Community (AP App)?"
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>Purchaser Photo (Optional)</Typography>
                <Button variant="outlined" component="label" startIcon={<CameraAlt />} size="small">
                  {salePhoto ? salePhoto.name : 'Take / Upload Photo'}
                  <input type="file" accept="image/*" capture="environment" hidden
                    onChange={(e) => setSalePhoto(e.target.files[0])} />
                </Button>
                {salePhoto && (
                  <FormControlLabel sx={{ ml: 2 }}
                    control={<Checkbox checked={saleForm.photoConsent}
                      onChange={(e) => setSaleForm({ ...saleForm, photoConsent: e.target.checked })} />}
                    label="Purchaser has given consent to be photographed *"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" size="large" onClick={handleSale} disabled={saleLoading}>
                  {saleLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Sale & Add Next'}
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {!isPresent && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You are not marked as present. Ask the lead to mark you present, or rejoin if you exited earlier.
        </Alert>
      )}

      {/* Fix 4: Reflection form */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">✍️ Write Reflection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline rows={4} label="Share your thoughts and experience..."
            value={reflection} onChange={(e) => setReflection(e.target.value)} />
          <Button variant="contained" sx={{ mt: 1 }} onClick={handleReflection} disabled={!reflection.trim()}>
            Submit Reflection
          </Button>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ActiveBookstall;