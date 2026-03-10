// src/pages/volunteer/ActiveBookstall.js
// Core bookstall operation screen for volunteers
// Lead can start/close bookstall, mark attendance, add sales, write reflection
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, FormControlLabel, Checkbox, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Avatar, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Alert, Autocomplete,
} from '@mui/material';
import { ExpandMore, PlayArrow, Stop, ExitToApp, ReplayCircleFilled, CameraAlt } from '@mui/icons-material';
import {
  getActiveBookstall, startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addSale, addReflection, getBooks, getCities, getVolunteers,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const AGE_CATEGORIES = ['0-5','6-10','11-15','16-20','21-25','26-30','31-35','36-40','41-45','46-50','51-55','56-60','61-65','66-70','71 & above'];

const emptySaleForm = {
  bookId: '', quantity: 1, soldPrice: '', gender: '',
  ageCategory: '', knowsAcharyaPrashant: false,
  joinedGitaCommunity: false, photoConsent: false,
};

const ActiveBookstall = () => {
  const { user } = useAuth();
  const routeState = useLocation().state || {};

  const [bookstall, setBookstall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [cities, setCities] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  // Start form state
  const [startForm, setStartForm] = useState({
    cityId: '', location: '', presentVolunteerIds: [], specialOccasion: '',
  });

  // Sale form state
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [salePhoto, setSalePhoto] = useState(null);
  const [saleLoading, setSaleLoading] = useState(false);

  // Reflection state
  const [reflection, setReflection] = useState('');

  const isLead = bookstall?.lead?._id === user?.id || bookstall?.lead === user?.id;
  const myAttendance = bookstall?.attendance?.find((a) => a.volunteer?._id === user?.id || a.volunteer === user?.id);
  const isPresent = isLead || myAttendance?.isPresent;

  useEffect(() => {
    fetchBookstall();
    getBooks().then((r) => setBooks(r.data));
    getCities().then((r) => setCities(r.data));
    getVolunteers({ status: 'active' }).then((r) => setVolunteers(r.data));
    if (routeState.scheduleId) {
      setStartForm((f) => ({ ...f, scheduleId: routeState.scheduleId }));
    }
  }, []);

  const fetchBookstall = async () => {
    try {
      const res = await getActiveBookstall();
      setBookstall(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  // --- Start Bookstall ---
  const handleStart = async () => {
    if (!startForm.cityId || !startForm.location) return toast.error('City and location required');
    setLoading(true);
    try {
      // Get GPS coordinates
      const coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null)
        );
      });
      const res = await startBookstall({ ...startForm, coordinates: coords });
      setBookstall(res.data);
      toast.success('Bookstall started! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting bookstall');
    } finally { setLoading(false); }
  };

  // --- Submit Sale ---
  const handleSale = async () => {
    if (!saleForm.bookId || !saleForm.soldPrice || !saleForm.gender || !saleForm.ageCategory) {
      return toast.error('Please fill all required sale fields');
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
      setSaleForm(emptySaleForm); // Clear form for next entry
      setSalePhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording sale');
    } finally { setSaleLoading(false); }
  };

  // --- Close Bookstall ---
  const handleClose = async () => {
    if (!window.confirm('Close the bookstall? This will end the session for everyone.')) return;
    await closeBookstall(bookstall._id);
    toast.success('Bookstall closed');
    setBookstall(null);
  };

  // --- Reflection ---
  const handleReflection = async () => {
    if (!reflection.trim()) return;
    await addReflection(bookstall._id, reflection);
    toast.success('Reflection saved!');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  // === NO ACTIVE BOOKSTALL - Show Start Form ===
  if (!bookstall) {
    return (
      <Box maxWidth={600}>
        <Typography variant="h4" mb={3}>Start Bookstall</Typography>
        <Card>
          <CardContent>
            <TextField select fullWidth label="City *" value={startForm.cityId}
              onChange={(e) => setStartForm({ ...startForm, cityId: e.target.value })} margin="normal">
              {cities.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Exact Location *" value={startForm.location}
              onChange={(e) => setStartForm({ ...startForm, location: e.target.value })}
              margin="normal" placeholder="e.g. Near Main Gate, Sector 62" />
            <TextField fullWidth label="Special Occasion / Event (optional)" value={startForm.specialOccasion}
              onChange={(e) => setStartForm({ ...startForm, specialOccasion: e.target.value })}
              margin="normal" placeholder="e.g. Book Fair, Puja Celebration" />
            <Autocomplete
              multiple options={volunteers.filter((v) => v._id !== user?.id)}
              getOptionLabel={(v) => v.name}
              value={volunteers.filter((v) => startForm.presentVolunteerIds.includes(v._id))}
              onChange={(_, val) => setStartForm({ ...startForm, presentVolunteerIds: val.map((v) => v._id) })}
              renderInput={(params) => <TextField {...params} label="Mark Present Volunteers" margin="normal" />}
            />
            <Alert severity="info" sx={{ mt: 2 }}>GPS coordinates will be captured automatically when you start.</Alert>
            <Button variant="contained" color="success" size="large" startIcon={<PlayArrow />}
              fullWidth sx={{ mt: 2 }} onClick={handleStart} disabled={loading}>
              Start Bookstall
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // === ACTIVE BOOKSTALL ===
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">📚 Active Bookstall</Typography>
          <Typography variant="body1" color="text.secondary">
            {bookstall.city?.name} | 📍 {bookstall.location}
            {bookstall.specialOccasion && <Chip label={bookstall.specialOccasion} size="small" sx={{ ml: 1 }} color="secondary" />}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isLead && isPresent && (
            <Button variant="outlined" color="warning" startIcon={<ExitToApp />}
              onClick={async () => { await exitBookstall(bookstall._id); fetchBookstall(); }}>
              Exit
            </Button>
          )}
          {!isLead && !isPresent && myAttendance && (
            <Button variant="outlined" color="success" startIcon={<ReplayCircleFilled />}
              onClick={async () => { await rejoinBookstall(bookstall._id); fetchBookstall(); }}>
              Rejoin
            </Button>
          )}
          {isLead && (
            <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleClose}>
              Close Bookstall
            </Button>
          )}
        </Box>
      </Box>

      {/* Attendance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Attendance</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip avatar={<Avatar src={bookstall.lead?.profilePhoto?.url}>{bookstall.lead?.name?.[0]}</Avatar>}
              label={`${bookstall.lead?.name} (Lead)`} color="primary" />
            {bookstall.attendance?.map((a) => (
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

      {/* BOOK SALE FORM */}
      {isPresent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">➕ Add Book Sale</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={books}
                  getOptionLabel={(b) => `${b.title} (Stock: ${b.currentStock})`}
                  value={books.find((b) => b._id === saleForm.bookId) || null}
                  onChange={(_, val) => setSaleForm({ ...saleForm, bookId: val?._id || '', soldPrice: val?.unitCost || '' })}
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
                  <FormControlLabel control={<Checkbox checked={saleForm.knowsAcharyaPrashant}
                    onChange={(e) => setSaleForm({ ...saleForm, knowsAcharyaPrashant: e.target.checked })} />}
                    label="Knows Acharya Prashant?" />
                  {saleForm.knowsAcharyaPrashant && (
                    <FormControlLabel control={<Checkbox checked={saleForm.joinedGitaCommunity}
                      onChange={(e) => setSaleForm({ ...saleForm, joinedGitaCommunity: e.target.checked })} />}
                      label="Joined Gita Community (AP App)?" />
                  )}
                </Box>
              </Grid>

              {/* Optional photo */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>Purchaser Photo (Optional)</Typography>
                <Button variant="outlined" component="label" startIcon={<CameraAlt />} size="small">
                  {salePhoto ? salePhoto.name : 'Take/Upload Photo'}
                  <input type="file" accept="image/*" capture="environment" hidden
                    onChange={(e) => setSalePhoto(e.target.files[0])} />
                </Button>
                {salePhoto && (
                  <FormControlLabel sx={{ ml: 2 }}
                    control={<Checkbox checked={saleForm.photoConsent} onChange={(e) => setSaleForm({ ...saleForm, photoConsent: e.target.checked })} />}
                    label="Purchaser has given consent to be photographed *" />
                )}
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" size="large" onClick={handleSale} disabled={saleLoading}>
                  {saleLoading ? <CircularProgress size={20} /> : 'Save Sale & Add Next'}
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Reflection */}
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
