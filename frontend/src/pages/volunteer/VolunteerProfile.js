// src/pages/volunteer/VolunteerProfile.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Avatar, Autocomplete, Chip, Grid, CircularProgress,
} from '@mui/material';
import { CameraAlt, Save } from '@mui/icons-material';
import { getVolunteer, updateVolunteer, uploadVolunteerPhoto, getBooks, getCities } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const VolunteerProfile = () => {
  const { user } = useAuth();
  const [vol, setVol] = useState(null);
  const [books, setBooks] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ profession: '', booksReadRecommendedByAP: '', willingCities: [], booksReadByAP: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getVolunteer(user.id).then((r) => {
        setVol(r.data);
        setForm({
          profession: r.data.profession || '',
          booksReadRecommendedByAP: r.data.booksReadRecommendedByAP || '',
          willingCities: r.data.willingCities || [],
          booksReadByAP: r.data.booksReadByAP || [],
        });
      });
      getBooks().then((r) => setBooks(r.data));
      getCities().then((r) => setCities(r.data));
    }
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await uploadVolunteerPhoto(user.id, fd);
      toast.success('Profile photo updated!');
      getVolunteer(user.id).then((r) => setVol(r.data));
    } catch { toast.error('Photo upload failed'); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateVolunteer(user.id, {
        profession: form.profession,
        booksReadRecommendedByAP: form.booksReadRecommendedByAP,
        willingCities: form.willingCities.map((c) => c._id || c),
        booksReadByAP: form.booksReadByAP.map((b) => b._id || b),
      });
      toast.success('Profile updated!');
    } catch { toast.error('Error saving profile'); }
    finally { setLoading(false); }
  };

  if (!vol) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box maxWidth={700}>
      <Typography variant="h4" mb={3}>My Profile</Typography>
      <Card>
        <CardContent>
          {/* Profile Photo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar src={vol.profilePhoto?.url} sx={{ width: 100, height: 100, fontSize: 40 }}>
                {vol.name?.[0]}
              </Avatar>
              <Button
                component="label" size="small" variant="contained"
                sx={{ position: 'absolute', bottom: -8, right: -8, minWidth: 'auto', p: 0.5, borderRadius: '50%' }}
              >
                <CameraAlt fontSize="small" />
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Button>
            </Box>
            <Box>
              <Typography variant="h5">{vol.name}</Typography>
              <Typography color="text.secondary">{vol.gmailId}</Typography>
              <Typography color="text.secondary">{vol.contactNumber}</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Profession" value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple options={cities}
                getOptionLabel={(c) => c.name}
                value={form.willingCities}
                onChange={(_, val) => setForm({ ...form, willingCities: val })}
                isOptionEqualToValue={(opt, val) => opt._id === (val._id || val)}
                renderInput={(params) => <TextField {...params} label="Cities I Can Volunteer In" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple options={books}
                getOptionLabel={(b) => `${b.title} (${b.language})`}
                value={form.booksReadByAP}
                onChange={(_, val) => setForm({ ...form, booksReadByAP: val })}
                isOptionEqualToValue={(opt, val) => opt._id === (val._id || val)}
                renderInput={(params) => <TextField {...params} label="Books by Acharya Prashant I've Read" />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Books Recommended by AP I've Read (comma separated)"
                value={form.booksReadRecommendedByAP}
                onChange={(e) => setForm({ ...form, booksReadRecommendedByAP: e.target.value })}
                helperText="e.g. Bhagavad Gita, Upanishads, Ashtavakra Gita" />
            </Grid>
          </Grid>

          <Button variant="contained" size="large" startIcon={<Save />} onClick={handleSave}
            disabled={loading} sx={{ mt: 3 }}>
            {loading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VolunteerProfile;
