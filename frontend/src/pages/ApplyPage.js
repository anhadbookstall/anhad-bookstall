// src/pages/ApplyPage.js
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Alert, FormControlLabel, Radio,
  RadioGroup, FormLabel,
} from '@mui/material';
import { applyGitaMembership } from '../services/api';
import { toast } from 'react-toastify';

const ApplyPage = () => {
  const [form, setForm] = useState({
    name: '', gmailId: '', geetaProfileLink: '',
    contactNumber: '', sameAsWhatsApp: true,
    whatsappNumber: '', currentCity: '', whyJoin: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.gmailId || !form.whyJoin) {
      return setError('Name, Gmail and reason for joining are required');
    }
    setLoading(true);
    setError('');
    try {
      await applyGitaMembership(form);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 500, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" color="primary" fontWeight={700}>
              📚 Anhad Bookstall
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Acharya Prashant Book Distribution
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              Volunteer Application
            </Typography>
          </Box>

          {submitted ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography fontWeight={600}>Application Submitted!</Typography>
              Your application has been received. Admin will review and approve your request.
              You will be able to login once approved.
            </Alert>
          ) : (
            <Box>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField fullWidth label="Full Name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
              <TextField fullWidth label="Gmail ID *" type="email" value={form.gmailId}
                onChange={(e) => setForm({ ...form, gmailId: e.target.value })} margin="normal"
                helperText="This Gmail will be used for login" />
              <TextField fullWidth label="Geeta Profile Link" value={form.geetaProfileLink}
                onChange={(e) => setForm({ ...form, geetaProfileLink: e.target.value })} margin="normal"
                helperText="Your profile link from Geeta community app" />
              <TextField fullWidth label="Contact Number" value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} margin="normal" />
              <FormLabel sx={{ mt: 1, display: 'block' }}>WhatsApp Number</FormLabel>
              <RadioGroup row value={form.sameAsWhatsApp ? 'same' : 'diff'}
                onChange={(e) => setForm({ ...form, sameAsWhatsApp: e.target.value === 'same' })}>
                <FormControlLabel value="same" control={<Radio />} label="Same as Contact" />
                <FormControlLabel value="diff" control={<Radio />} label="Different" />
              </RadioGroup>
              {!form.sameAsWhatsApp && (
                <TextField fullWidth label="WhatsApp Number" value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} margin="normal" />
              )}
              <TextField fullWidth label="Current City" value={form.currentCity}
                onChange={(e) => setForm({ ...form, currentCity: e.target.value })} margin="normal" />
              <TextField fullWidth multiline rows={3}
                label="Why do you want to join Anhad Bookstall? *"
                value={form.whyJoin}
                onChange={(e) => setForm({ ...form, whyJoin: e.target.value })}
                margin="normal"
                helperText="Tell us about your motivation to volunteer" />

              <Button variant="contained" fullWidth size="large"
                onClick={handleSubmit} disabled={loading} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
              </Button>

              <Typography variant="caption" color="text.secondary"
                sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Already approved? <a href="/login">Login here</a>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplyPage;