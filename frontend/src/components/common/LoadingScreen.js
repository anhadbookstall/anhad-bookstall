// src/components/common/LoadingScreen.js
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography color="text.secondary">Loading...</Typography>
  </Box>
);

export default LoadingScreen;
