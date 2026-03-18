// src/pages/volunteer/VolunteerHome.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Store } from '@mui/icons-material';
import { getActiveBookstall } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VolunteerHome = () => {
  const [activeBookstall, setActiveBookstall] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getActiveBookstall().then((r) => setActiveBookstall(r.data)).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Welcome, {user?.name}! 👋</Typography>

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