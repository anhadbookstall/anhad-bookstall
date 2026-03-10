// src/pages/volunteer/VolunteerHome.js
// Shows upcoming bookstalls for the volunteer and status of current session
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, Alert,
} from '@mui/material';
import { CalendarMonth, PlayArrow, Store } from '@mui/icons-material';
import { getSchedules, getActiveBookstall } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VolunteerHome = () => {
  const [schedules, setSchedules] = useState([]);
  const [activeBookstall, setActiveBookstall] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSchedules().then((r) => setSchedules(r.data));
    getActiveBookstall().then((r) => setActiveBookstall(r.data));
  }, []);

  const isLead = (schedule) => schedule.assignedLead?._id === user?.id || schedule.assignedLead === user?.id;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Welcome, {user?.name}! 👋</Typography>

      {/* Active Bookstall Alert */}
      {activeBookstall && (
        <Alert severity="success" sx={{ mb: 3 }}
          action={<Button color="inherit" onClick={() => navigate('/volunteer/bookstall')}>Go to Bookstall →</Button>}>
          Active bookstall ongoing at <strong>{activeBookstall.location}</strong>
        </Alert>
      )}

      <Typography variant="h5" mb={2}><CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} />Upcoming Bookstalls</Typography>

      {schedules.length === 0 && (
        <Card><CardContent><Typography color="text.secondary">No upcoming bookstalls scheduled</Typography></CardContent></Card>
      )}

      <Grid container spacing={2}>
        {schedules.map((s) => (
          <Grid item xs={12} md={6} key={s._id}>
            <Card sx={{ border: isLead(s) ? '2px solid' : 'none', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{s.city?.name}</Typography>
                  {isLead(s) && <Chip label="You are Lead" color="primary" size="small" />}
                </Box>
                <Typography variant="body1">📍 {s.location}</Typography>
                <Typography variant="body2" color="text.secondary">
                  📅 {new Date(s.scheduledDate).toLocaleDateString('en-IN')} at {s.startTime}
                </Typography>
                {s.assignedLead && (
                  <Typography variant="body2">👤 Lead: {s.assignedLead.name}</Typography>
                )}

                {/* Only assigned lead can start the bookstall */}
                {isLead(s) && s.status === 'scheduled' && !activeBookstall && (
                  <Button
                    variant="contained" color="success" startIcon={<PlayArrow />}
                    sx={{ mt: 2 }} onClick={() => navigate('/volunteer/bookstall', { state: { scheduleId: s._id } })}
                  >
                    Start Bookstall
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VolunteerHome;
