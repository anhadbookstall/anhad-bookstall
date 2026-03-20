// src/App.js - Main app with all routes defined
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminVolunteers from './pages/admin/AdminVolunteers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCities from './pages/admin/AdminCities';
import AdminExpenditures from './pages/admin/AdminExpenditures';
import AdminReports from './pages/admin/AdminReports';

import VolunteerHome from './pages/volunteer/VolunteerHome';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';
import ActiveBookstall from './pages/volunteer/ActiveBookstall';
import ReflectionsFeed from './pages/volunteer/ReflectionsFeed';

import Layout from './components/common/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Material UI theme customization
const theme = createTheme({
  palette: {
    primary: { main: '#1a237e' },    // Deep indigo - reflects spirituality
    secondary: { main: '#ff6f00' },  // Warm amber - energy and warmth
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
  },
});

// Protected route - redirects to login if not authenticated
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/volunteer" replace />;
  return children;
};

// Redirect if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/volunteer'} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
      <Route index element={<AdminDashboard />} />
      <Route path="books" element={<AdminBooks />} />
      <Route path="volunteers" element={<AdminVolunteers />} />
      <Route path="inventory" element={<AdminInventory />} />
      <Route path="cities" element={<AdminCities />} />
      <Route path="expenditures" element={<AdminExpenditures />} />
      <Route path="reports" element={<AdminReports />} />
    </Route>

    {/* Volunteer Routes */}
    <Route path="/volunteer" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<VolunteerHome />} />
      <Route path="profile" element={<VolunteerProfile />} />
      <Route path="bookstall" element={<ActiveBookstall />} />
            <Route path="reflections" element={<ReflectionsFeed />} />
    </Route>

    {/* Catch-all redirect */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;