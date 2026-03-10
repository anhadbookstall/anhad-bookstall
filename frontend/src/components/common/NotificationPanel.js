// src/components/common/NotificationPanel.js
import React, { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, List, ListItem, ListItemText,
  IconButton, Divider, Button, Chip,
} from '@mui/material';
import { Close, DoneAll } from '@mui/icons-material';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ open, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.isRead).length;
      onUnreadCountChange(unread);
    } catch {}
  };

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    fetchNotifications();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Notifications</Typography>
          <Box>
            <Button size="small" startIcon={<DoneAll />} onClick={handleMarkAllRead}>
              Mark all read
            </Button>
            <IconButton onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>
        <Divider />
        <List>
          {notifications.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No notifications
            </Typography>
          )}
          {notifications.map((n) => (
            <ListItem
              key={n._id}
              sx={{
                bgcolor: n.isRead ? 'transparent' : 'primary.50',
                borderRadius: 1, mb: 0.5,
                cursor: 'pointer',
                border: n.isRead ? 'none' : '1px solid',
                borderColor: 'primary.light',
              }}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{n.title}</Typography>
                    {!n.isRead && <Chip label="New" size="small" color="primary" sx={{ height: 18 }} />}
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2">{n.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;
