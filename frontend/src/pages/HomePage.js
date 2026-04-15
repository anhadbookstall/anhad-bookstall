// src/pages/HomePage.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, IconButton,
  Drawer, FormControlLabel, Radio, RadioGroup, FormLabel, Divider,
} from '@mui/material';
import { Close, Lock } from '@mui/icons-material';
import { adminLogin, volunteerGoogleLogin, applyGitaMembership } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Fetch active bookstalls without auth
const fetchActiveBookstalls = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/bookstalls?status=ongoing`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch { return []; }
};

const HomePage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [activeBookstalls, setActiveBookstalls] = useState([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [applyDrawerOpen, setApplyDrawerOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const [applyForm, setApplyForm] = useState({
    name: '', gmailId: '', geetaProfileLink: '',
    contactNumber: '', sameAsWhatsApp: true,
    whatsappNumber: '', currentCity: '', whyJoin: '',
  });

  // Fetch active bookstalls on mount
  useEffect(() => {
    fetchActiveBookstalls().then(setActiveBookstalls);
    const interval = setInterval(() => {
      fetchActiveBookstalls().then(setActiveBookstalls);
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Load Google Sign-In
  useEffect(() => {
    const loadGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large', width: 300, text: 'signin_with',
        });
      }
    };

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      loadGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = loadGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const res = await volunteerGoogleLogin(response.credential);
      login(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate('/volunteer');
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Login failed. Contact admin.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword) return setAdminError('Password is required');
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await adminLogin({ username: process.env.REACT_APP_ADMIN_USERNAME || 'Admin', password: adminPassword });
      login(res.data.token, res.data.user);
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid password');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.gmailId || !applyForm.whyJoin) {
      return setApplyError('Name, Gmail and reason for joining are required');
    }
    setApplyLoading(true);
    setApplyError('');
    try {
      await applyGitaMembership(applyForm);
      setApplySuccess(true);
      toast.success('Application submitted!');
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Error submitting application');
    } finally {
      setApplyLoading(false);
    }
  };

  // Map center - India
  const mapCenter = [22.5, 80.0];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0e27 0%, #1a237e 40%, #0d1547 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Crimson Pro", "Georgia", serif',
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,111,0,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(100,150,255,0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Top Navigation */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 3, md: 6 }, py: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,14,39,0.7)',
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff6f00, #ff8f00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 15px rgba(255,111,0,0.4)',
          }}>📚</Box>
          <Box>
            <Typography sx={{
              color: 'white', fontWeight: 700, fontSize: '1.2rem',
              letterSpacing: '0.5px', lineHeight: 1,
              fontFamily: '"Playfair Display", "Georgia", serif',
            }}>
              AP Bookstall
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Anhad Foundation
            </Typography>
          </Box>
        </Box>

        {/* Admin Login Button */}
        <Button
          startIcon={<Lock sx={{ fontSize: 16 }} />}
          onClick={() => setAdminDialogOpen(true)}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            px: 2.5, py: 1,
            fontSize: '0.85rem',
            fontFamily: '"Segoe UI", sans-serif',
            transition: 'all 0.2s',
            '&:hover': {
              color: 'white',
              border: '1px solid rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.05)',
            },
          }}
        >
          Admin Login
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: 'calc(100vh - 73px)',
        px: { xs: 3, md: 6 },
        py: { xs: 4, md: 0 },
        gap: { xs: 4, md: 0 },
      }}>

        {/* LEFT PANEL */}
        <Box sx={{
          flex: { xs: 'none', md: '0 0 45%' },
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          pr: { xs: 0, md: 6 },
          py: { md: 6 },
        }}>
          {/* Active indicator */}
          {activeBookstalls.length > 0 && (
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              mb: 3, px: 2, py: 0.8,
              background: 'rgba(76,175,80,0.15)',
              border: '1px solid rgba(76,175,80,0.3)',
              borderRadius: '20px', width: 'fit-content',
            }}>
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%',
                bgcolor: '#4caf50',
                boxShadow: '0 0 8px #4caf50',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }} />
              <Typography sx={{ color: '#81c784', fontSize: '0.8rem', fontFamily: 'sans-serif' }}>
                {activeBookstalls.length} bookstall{activeBookstalls.length > 1 ? 's' : ''} active right now
              </Typography>
            </Box>
          )}

          {/* Main Headline */}
          <Typography sx={{
            fontSize: { xs: '2.4rem', md: '3.2rem' },
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.2,
            mb: 2,
            fontFamily: '"Playfair Display", "Georgia", serif',
          }}>
            Want to spread<br />
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #ff6f00, #ffa726)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              the mission?
            </Box>
          </Typography>

          <Typography sx={{
            fontSize: '1.2rem',
            color: 'rgba(255,255,255,0.6)',
            mb: 4, lineHeight: 1.7,
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontStyle: 'italic',
          }}>
            Why don't you join us? Help distribute Acharya Prashant's books and be part of a movement that transforms lives.
          </Typography>

          {/* Apply CTA */}
          <Button
            variant="contained"
            onClick={() => setApplyDrawerOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #ff6f00, #ff8f00)',
              color: 'white',
              px: 4, py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: '"Segoe UI", sans-serif',
              borderRadius: '10px',
              boxShadow: '0 8px 25px rgba(255,111,0,0.4)',
              width: 'fit-content',
              mb: 5,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(255,111,0,0.5)',
                background: 'linear-gradient(135deg, #e65100, #ff6f00)',
              },
            }}
          >
            Apply to Volunteer →
          </Button>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'sans-serif', letterSpacing: '2px' }}>
              OR
            </Typography>
            <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
          </Box>

          {/* Volunteer Login */}
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 2, fontFamily: 'sans-serif' }}>
            Already a volunteer or Gita Member?
          </Typography>

          {googleError && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>{googleError}</Alert>
          )}

          {googleLoading ? (
            <CircularProgress size={32} sx={{ color: 'white' }} />
          ) : (
            <Box ref={googleBtnRef} sx={{ display: 'flex' }} />
          )}
        </Box>

        {/* RIGHT PANEL — Map */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: { md: 4 },
        }}>
          <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            height: { xs: '320px', md: '520px' },
            position: 'relative',
          }}>
            {/* Map header overlay */}
            <Box sx={{
              position: 'absolute', top: 12, left: 12, zIndex: 1000,
              background: 'rgba(10,14,39,0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              px: 2, py: 1,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Typography sx={{ color: 'white', fontSize: '0.8rem', fontFamily: 'sans-serif', fontWeight: 600 }}>
                🗺️ Live Bookstall Map
              </Typography>
            </Box>

            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {activeBookstalls.map((bs) => {
                if (!bs.coordinates?.latitude || !bs.coordinates?.longitude) return null;
                return (
                  <CircleMarker
                    key={bs._id}
                    center={[bs.coordinates.latitude, bs.coordinates.longitude]}
                    radius={12}
                    pathOptions={{
                      color: '#4caf50',
                      fillColor: '#4caf50',
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <MapTooltip permanent={false} direction="top">
                      <Box sx={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary">
                          📍 {bs.city?.name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {bs.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Active since {new Date(bs.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {bs.lead?.name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Lead: {bs.lead.name}
                          </Typography>
                        )}
                      </Box>
                    </MapTooltip>
                  </CircleMarker>
                );
              })}

              {/* No active bookstalls message */}
              {activeBookstalls.length === 0 && (
                <Box sx={{
                  position: 'absolute', bottom: 16, left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  background: 'rgba(10,14,39,0.85)',
                  borderRadius: '8px',
                  px: 2, py: 1,
                  border: '1px solid rgba(255,255,255,0.1)',
                  whiteSpace: 'nowrap',
                }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                    No active bookstalls right now
                  </Typography>
                </Box>
              )}
            </MapContainer>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, pl: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
              Active bookstall — hover to see details
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ---- Admin Login Dialog ---- */}
      <Dialog
        open={adminDialogOpen}
        onClose={() => { setAdminDialogOpen(false); setAdminPassword(''); setAdminError(''); }}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, background: '#0d1547', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'white', fontFamily: '"Playfair Display", serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Admin Access
          <IconButton onClick={() => setAdminDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {adminError && <Alert severity="error" sx={{ mb: 2 }}>{adminError}</Alert>}
          <TextField
            fullWidth label="Password" type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#ff6f00' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained" fullWidth onClick={handleAdminLogin}
            disabled={adminLoading}
            sx={{ background: 'linear-gradient(135deg, #ff6f00, #ff8f00)', py: 1.2, borderRadius: 2, fontFamily: 'sans-serif' }}
          >
            {adminLoading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Apply Drawer ---- */}
      <Drawer
        anchor="right"
        open={applyDrawerOpen}
        onClose={() => { setApplyDrawerOpen(false); setApplySuccess(false); setApplyError(''); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, background: '#0a0e27', borderLeft: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: 'white', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>
              Volunteer Application
            </Typography>
            <IconButton onClick={() => { setApplyDrawerOpen(false); setApplySuccess(false); }} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <Close />
            </IconButton>
          </Box>

          {applySuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography fontWeight={600} mb={0.5}>Application Submitted!</Typography>
              Your application has been received. Admin will review and contact you once approved.
            </Alert>
          ) : (
            <Box>
              {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}

              {[
                { label: 'Full Name *', key: 'name', type: 'text' },
                { label: 'Gmail ID *', key: 'gmailId', type: 'email', helper: 'Used for login after approval' },
                { label: 'Geeta Profile Link', key: 'geetaProfileLink', type: 'text', helper: 'Your profile link from Geeta community app' },
                { label: 'Contact Number', key: 'contactNumber', type: 'text' },
                { label: 'Current City', key: 'currentCity', type: 'text' },
              ].map(({ label, key, type, helper }) => (
                <TextField
                  key={key} fullWidth label={label} type={type}
                  value={applyForm[key]}
                  onChange={(e) => setApplyForm({ ...applyForm, [key]: e.target.value })}
                  helperText={helper}
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff6f00' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.3)' },
                  }}
                />
              ))}

              <FormLabel sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block', fontSize: '0.85rem' }}>
                WhatsApp Number
              </FormLabel>
              <RadioGroup row value={applyForm.sameAsWhatsApp ? 'same' : 'diff'}
                onChange={(e) => setApplyForm({ ...applyForm, sameAsWhatsApp: e.target.value === 'same' })}
                sx={{ mb: 1 }}
              >
                <FormControlLabel value="same" control={<Radio sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#ff6f00' } }} />}
                  label={<Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Same as Contact</Typography>} />
                <FormControlLabel value="diff" control={<Radio sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#ff6f00' } }} />}
                  label={<Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Different</Typography>} />
              </RadioGroup>

              {!applyForm.sameAsWhatsApp && (
                <TextField fullWidth label="WhatsApp Number"
                  value={applyForm.whatsappNumber}
                  onChange={(e) => setApplyForm({ ...applyForm, whatsappNumber: e.target.value })}
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#ff6f00' } },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              )}

              <TextField fullWidth multiline rows={4}
                label="Why do you want to join Anhad Bookstall? *"
                value={applyForm.whyJoin}
                onChange={(e) => setApplyForm({ ...applyForm, whyJoin: e.target.value })}
                margin="normal"
                helperText="Tell us about your motivation to volunteer"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#ff6f00' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.3)' },
                }}
              />

              <Button variant="contained" fullWidth size="large"
                onClick={handleApply} disabled={applyLoading}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #ff6f00, #ff8f00)',
                  py: 1.5, borderRadius: 2,
                  fontFamily: 'sans-serif', fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(255,111,0,0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #e65100, #ff6f00)' },
                }}
              >
                {applyLoading ? <CircularProgress size={22} color="inherit" /> : 'Submit Application'}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default HomePage;