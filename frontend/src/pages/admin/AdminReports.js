// src/pages/admin/AdminReports.js
// Downloadable analytics reports - CSV export
import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { getSales, getExpenditures, getVolunteerEfficiency } from '../../services/api';
import { toast } from 'react-toastify';

// Helper: Convert array of objects to CSV string
const toCSV = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

// Trigger CSV download in browser
const downloadCSV = (data, filename) => {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState('');

  const exportSales = async () => {
    setLoading('sales');
    try {
      const res = await getSales({ from, to });
      const rows = res.data.map((s) => ({
        Date: new Date(s.saleDate).toLocaleDateString('en-IN'),
        Book: s.book?.title,
        Language: s.book?.language,
        Quantity: s.quantity,
        'Sold Price (₹)': s.soldPrice,
        Gender: s.gender,
        'Age Category': s.ageCategory,
        'Knows AP': s.knowsAcharyaPrashant ? 'Yes' : 'No',
        'Joined Gita Community': s.joinedGitaCommunity ? 'Yes' : s.knowsAcharyaPrashant ? 'No' : 'N/A',
        'Sold By': s.soldBy?.name,
        Location: s.bookstall?.location,
      }));
      downloadCSV(rows, `sales-report-${from || 'all'}.csv`);
      toast.success(`Exported ${rows.length} sales records`);
    } catch { toast.error('Export failed'); }
    finally { setLoading(''); }
  };

  const exportExpenditures = async () => {
    setLoading('exp');
    try {
      const res = await getExpenditures({ from, to });
      const rows = res.data.map((e) => ({
        Date: new Date(e.dateOfExpenditure).toLocaleDateString('en-IN'),
        Detail: e.detail,
        Type: e.type,
        'Cost (₹)': e.cost,
      }));
      downloadCSV(rows, `expenditures-${from || 'all'}.csv`);
      toast.success(`Exported ${rows.length} expenditure records`);
    } catch { toast.error('Export failed'); }
    finally { setLoading(''); }
  };

  const exportVolunteerEfficiency = async () => {
    setLoading('vol');
    try {
      const res = await getVolunteerEfficiency({ from, to });
      downloadCSV(res.data, `volunteer-efficiency-${from || 'all'}.csv`);
      toast.success('Exported volunteer efficiency report');
    } catch { toast.error('Export failed'); }
    finally { setLoading(''); }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Reports & Export</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Date Range Filter</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sales Report</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                All book sales with buyer demographics, volunteer info, and location.
              </Typography>
              <Button variant="contained" fullWidth startIcon={<Download />}
                onClick={exportSales} disabled={loading === 'sales'}>
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Expenditure Report</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                All recurring and one-time expenditures in the selected period.
              </Typography>
              <Button variant="contained" fullWidth startIcon={<Download />}
                onClick={exportExpenditures} disabled={loading === 'exp'}>
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Volunteer Efficiency</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Books sold per volunteer and total revenue generated.
              </Typography>
              <Button variant="contained" fullWidth startIcon={<Download />}
                onClick={exportVolunteerEfficiency} disabled={loading === 'vol'}>
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminReports;
