// src/pages/volunteer/ActiveBookstall.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, FormControlLabel, Checkbox, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Alert, Autocomplete, Chip, Avatar,
} from '@mui/material';
import {
  ExpandMore, PlayArrow, Stop, ExitToApp, ReplayCircleFilled,
  CameraAlt, CalendarMonth, Store,
} from '@mui/icons-material';
import {
  getActiveBookstall, startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addSale, addReflection, getBooks, getCities,
  getVolunteers, getSchedules,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
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

// Helper: safely compare two MongoDB IDs regardless of type
const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

const ActiveBookstall = () => {
  const { user } = useAuth();
  const routeState = useLocation().state || {};

  const [bookstall, setBookstall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [cities, setCities] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [reflection, setReflection] = useState('');

  const [startForm, setStartForm] = useState({
    scheduleId: routeState.scheduleId || '',
    cityId: '',
    location: '',
    presentVolunteerIds: [],
    specialOccasion: '',
  });

  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [salePhoto, setSalePhoto] = useState(null);
  const [saleLoading, setSaleLoading] = useState(false);

  const isActiveLead = bookstall && isSameId(bookstall.lead?._id || bookstall.lead, user?.id);
  const myAttendance = bookstall?.attendance?.find((a) =>
    isSameId(a.volunteer?._id || a.volunteer, user?.id)
  );
  const isPresent = isActiveLead || myAttendance?.isPresent;

  useEffect(() => {
    fetchBookstall();
    getBooks().then((r) => setBooks(r.data)).catch(() => {});
    getCities().then((r) => setCities(r.data)).catch(() => {});
    getVolunteers({ status: 'active' }).then((r) => setVolunteers(r.data)).catch(() => {});
    getSchedules().then((r) => setSchedules(r.data)).catch(() => {});
  }, []);

  const fetchBookstall = async () => {
    try {
      const res = await getActiveBookstall();
      setBookstall(res.data);
    } catch (err) {
      console.log('Bookstall fetch:', err.response?.data?.message);
      setBookstall(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (scheduleId) => {
    const selected = schedules.find((s) => s._id === scheduleId);
    setStartForm((f) => ({
      ...f,
      scheduleId,
      cityId: selected?.city?._id || f.cityId,
      location: selected?.location || f.location,
    }));
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording sale');
    } finally {
      setSaleLoading(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close the bookstall? This will end the session for everyone.')) return;
    try {
      await closeBookstall(bookstall._id);
      toast.success('Bookstall closed successfully');
      setBookstall(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error closing bookstall');
    }
  };

  const handleReflection = async () => {
    if (!reflection.trim()) return;
    try {
      await addReflection(bookstall._id, reflection);
      toast.success('Reflection saved! ✅');
      setReflection('');
    } catch {
      toast.error('Error saving reflection');
    }
  };

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
    const myLeadSchedules = schedules.filter((s) =>
      isSameId(s.assignedLead?._id || s.assignedLead, user?.id)
    );

    return (
      <Box>
        <Alert severity="info" icon={<Store />} sx={{ mb: 4, fontSize: '1rem' }}>
          There is no active bookstall at present.
        </Alert>

        {/* Start Bookstall Button */}
        {!showStartForm && (
          <Box sx={{ mb: 4 }}>
            <Button
              variant="contained" color="success" size="large"
              startIcon={<PlayArrow />}
              onClick={() => setShowStartForm(true)}
            >
              Start a Bookstall
            </Button>
            {myLeadSchedules.length === 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Note: Only the assigned lead should start the bookstall
              </Typography>
            )}
          </Box>
        )}

        {/* Start Form */}
        {showStartForm && (
          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="h6" mb={2} color="success.main">
                Start Bookstall
              </Typography>

              {myLeadSchedules.length > 0 && (
                <TextField
                  select fullWidth label="Select Scheduled Bookstall (optional)"
                  value={startForm.scheduleId}
                  onChange={(e) => handleScheduleSelect(e.target.value)}
                  margin="normal"
                  helperText="Selecting a schedule will auto-fill city and location"
                >
                  <MenuItem value="">-- Start without schedule --</MenuItem>
                  {myLeadSchedules.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.city?.name} — {s.location} ({new Date(s.scheduledDate).toLocaleDateString('en-IN')})
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                select fullWidth label="City *" value={startForm.cityId}
                onChange={(e) => setStartForm({ ...startForm, cityId: e.target.value })}
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
                margin="normal" placeholder="e.g. Book Fair, Puja Celebration"
              />

              <Autocomplete
                multiple
                options={volunteers.filter((v) => !isSameId(v._id, user?.id))}
                getOptionLabel={(v) => v.name}
                value={volunteers.filter((v) => startForm.presentVolunteerIds.includes(v._id))}
                onChange={(_, val) => setStartForm({ ...startForm, presentVolunteerIds: val.map((v) => v._id) })}
                renderInput={(params) => (
                  <TextField {...params} label="Mark Present Volunteers" margin="normal" />
                )}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                📍 GPS coordinates will be captured automatically when you start.
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => setShowStartForm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained" color="success" size="large"
                  startIcon={<PlayArrow />} fullWidth
                  onClick={handleStart} disabled={loading}
                >
                  Confirm Start
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Schedules */}
        <Typography variant="h5" mb={2}>
          <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} />
          Upcoming Bookstalls
        </Typography>

        {schedules.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                No upcoming bookstalls scheduled at the moment.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {schedules.map((s) => {
              const isMySchedule = isSameId(s.assignedLead?._id || s.assignedLead, user?.id);
              return (
                <Grid item xs={12} md={6} key={s._id}>
                  <Card sx={{ border: isMySchedule ? '2px solid' : 'none', borderColor: 'primary.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{s.city?.name}</Typography>
                        {isMySchedule && <Chip label="You are Lead" color="primary" size="small" />}
                      </Box>
                      <Typography variant="body1">📍 {s.location}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        📅 {new Date(s.scheduledDate).toLocaleDateString('en-IN')} at {s.startTime}
                      </Typography>
                      {s.assignedLead?.name && (
                        <Typography variant="body2" mt={0.5}>
                          👤 Lead: {s.assignedLead.name}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  }

  // ---- ACTIVE BOOKSTALL ----
  return (
    <Box>
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isActiveLead && isPresent && (
            <Button variant="outlined" color="warning" startIcon={<ExitToApp />}
              onClick={async () => { await exitBookstall(bookstall._id); fetchBookstall(); toast.success('You have exited the bookstall'); }}>
              Exit
            </Button>
          )}
          {!isActiveLead && !isPresent && myAttendance && (
            <Button variant="outlined" color="success" startIcon={<ReplayCircleFilled />}
              onClick={async () => { await rejoinBookstall(bookstall._id); fetchBookstall(); toast.success('You have rejoined the bookstall'); }}>
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

      {/* Attendance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Attendance</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              avatar={<Avatar src={bookstall.lead?.profilePhoto?.url}>{bookstall.lead?.name?.[0]}</Avatar>}
              label={`${bookstall.lead?.name} (Lead)`} color="primary"
            />
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

      {/* Book Sale Form */}
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