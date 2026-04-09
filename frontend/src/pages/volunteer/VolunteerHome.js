// src/pages/volunteer/VolunteerHome.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import { Store } from '@mui/icons-material';
import { getActiveBookstall, getCurrentTheme, getDashboardSummary } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VolunteerHome = () => {
  const [activeBookstall, setActiveBookstall] = useState(null);
  const [theme, setTheme] = useState(null);
  const [summary, setSummary] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getActiveBookstall().then((r) => setActiveBookstall(r.data)).catch(() => {});
    getCurrentTheme().then((r) => setTheme(r.data)).catch(() => {});
    getDashboardSummary().then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Welcome, {user?.name}! 👋</Typography>

      {/* Monthly Theme Banner */}
      {theme && (
        <Alert severity="success" icon="🌿" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
          This Month's Theme: <strong>{theme.theme}</strong>
        </Alert>
      )}

      {/* Monthly Target Progress */}
      {theme && (theme.targetBooksSold > 0 || theme.targetBookstalls > 0) && summary && (() => {
        const now = new Date();
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        const daysRemaining = totalDays - daysPassed;
        const daysPassedPct = Math.round((daysPassed / totalDays) * 100);
        const daysRemainingPct = Math.round((daysRemaining / totalDays) * 100);

        const booksSold = summary.totalBooksSoldThisMonth || 0;
        const bookstallsDone = summary.totalBookstallsThisMonth || 0;
        const booksTarget = theme.targetBooksSold || 0;
        const bookstallsTarget = theme.targetBookstalls || 0;
        const booksPct = booksTarget > 0 ? Math.round((booksSold / booksTarget) * 100) : 0;
        const bookstallsPct = bookstallsTarget > 0 ? Math.round((bookstallsDone / bookstallsTarget) * 100) : 0;

        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                📈 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} {now.getFullYear()} — Monthly Target
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Day {daysPassed} of {totalDays} — {daysRemaining} days remaining ({daysRemainingPct}% of month left)
              </Typography>
              <Grid container spacing={2}>
                {booksTarget > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>📚 Books Sold</Typography>
                        <Typography variant="body2">{booksSold} / {booksTarget}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate" value={Math.min(booksPct, 100)}
                        color={booksPct >= daysPassedPct ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 5, mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={booksSold >= booksTarget ? 'success.main' : 'error.main'}>
                          {booksSold >= booksTarget ? '✅ Target achieved!' : `${booksTarget - booksSold} books behind`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booksPct}% done vs {daysPassedPct}% days passed
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {bookstallsTarget > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>🏪 Bookstalls</Typography>
                        <Typography variant="body2">{bookstallsDone} / {bookstallsTarget}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate" value={Math.min(bookstallsPct, 100)}
                        color={bookstallsPct >= daysPassedPct ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 5, mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={bookstallsDone >= bookstallsTarget ? 'success.main' : 'error.main'}>
                          {bookstallsDone >= bookstallsTarget ? '✅ Target achieved!' : `${bookstallsTarget - bookstallsDone} bookstalls behind`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bookstallsPct}% done vs {daysPassedPct}% days passed
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );
      })()}

      {activeBookstall ? (
        <Alert severity="success" sx={{ mb: 3 }}
          action={
            <Button color="inherit" onClick={() => navigate('/volunteer/bookstall')}>
              Go to Bookstall →
            </Button>
          }>
          Active bookstall ongoing at <strong>{activeBookstall.location}</strong>
        </Alert>
      ) : (
        <Alert severity="info" icon={<Store />} sx={{ mb: 3 }}>
          No active bookstall at present.
          {user?.isBookstallLead && (
            <Button color="inherit" sx={{ ml: 2 }} onClick={() => navigate('/volunteer/bookstall')}>
              Start one →
            </Button>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default VolunteerHome;