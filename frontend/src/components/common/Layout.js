// src/components/common/Layout.js
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemIcon, ListItemText, IconButton, Badge, Avatar,
  Divider, useMediaQuery, useTheme, Tooltip,
} from '@mui/material';
import {
  Dashboard, MenuBook, People,
  LocationCity, AccountBalance, Analytics, Notifications,
  Menu, Logout, Person, Store, Home, AutoStories,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

const DRAWER_WIDTH = 240;

const adminNavItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { label: 'Books', icon: <MenuBook />, path: '/admin/books' },
  { label: 'Volunteers', icon: <People />, path: '/admin/volunteers' },
  { label: 'Cities', icon: <LocationCity />, path: '/admin/cities' },
  { label: 'Expenditures', icon: <AccountBalance />, path: '/admin/expenditures' },
  { label: 'Reports', icon: <Analytics />, path: '/admin/reports' },
];

const volunteerNavItems = [
  { label: 'Home', icon: <Home />, path: '/volunteer' },
  { label: 'Active Bookstall', icon: <Store />, path: '/volunteer/bookstall' },
  { label: 'Reflections', icon: <AutoStories />, path: '/volunteer/reflections' },
  { label: 'My Profile', icon: <Person />, path: '/volunteer/profile' },
];

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = isAdmin ? adminNavItems : volunteerNavItems;

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary" fontWeight={700} noWrap>
          📚 Anhad Bookstall
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            button key={item.path}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 1, mx: 1, mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={logout} sx={{ borderRadius: 1, mx: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><Logout color="error" /></ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'primary.main' }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
              <Menu />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {isAdmin ? 'Admin Panel' : `Welcome, ${user?.name || 'Volunteer'}`}
          </Typography>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => setNotifOpen(true)}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Avatar
            src={user?.profilePhoto?.url}
            sx={{ ml: 1, cursor: 'pointer', width: 36, height: 36 }}
            onClick={() => !isAdmin && navigate('/volunteer/profile')}
          >
            {user?.name?.[0] || 'A'}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </Box>
  );
};

export default Layout;