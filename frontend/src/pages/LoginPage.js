// src/pages/LoginPage.js
// Two login methods:
//   1. Admin: Username + Password form
//   2. Volunteer: Google Sign-In button (OAuth 2.0)
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Tabs, Tab, TextField, Button,
  Typography, CircularProgress, Alert,
} from '@mui/material';
import { adminLogin, volunteerGoogleLogin } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [tab, setTab] = useState(0); // 0 = Admin, 1 = Volunteer
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Load Google Sign-In script after component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Google Identity Services
      window.google?.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      // Render the Google Sign-In button
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: 320, text: 'signin_with' }
      );
    };

    return () => document.body.removeChild(script);
  }, [tab]); // Re-render button when tab changes

  // Called by Google when user selects their account
  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await volunteerGoogleLogin(response.credential);
      login(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Contact admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(form);
      login(res.data.token, res.data.user);
      toast.success('Welcome, Admin!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* App Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" color="primary" fontWeight={700}>
              📚 Anhad Bookstall
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acharya Prashant Book Distribution
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setError(''); }}
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="Admin Login" />
            <Tab label="Volunteer Login" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Admin Login Form */}
          {tab === 0 && (
            <Box component="form" onSubmit={handleAdminLogin}>
              <TextField
                fullWidth label="Username" margin="normal"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required autoFocus
              />
              <TextField
                fullWidth label="Password" type="password" margin="normal"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                sx={{ mt: 2 }} disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </Box>
          )}

          {/* Volunteer Google OAuth */}
          {tab === 1 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sign in with your registered Gmail account
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : (
                <Box id="google-signin-btn" sx={{ display: 'flex', justifyContent: 'center' }} />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Only pre-registered volunteers can access this app.
                Contact admin if you cannot log in.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
