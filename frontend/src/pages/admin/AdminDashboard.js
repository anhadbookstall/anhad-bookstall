// src/pages/admin/AdminDashboard.js
// Real-time analytics dashboard with KPI cards and Chart.js graphs
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  MenuItem, Select, FormControl, InputLabel, Button, TextField,
  IconButton, Chip, Divider,
} from '@mui/material';
import {
  MenuBook, People, Store, TrendingUp, Warning, AccountBalance, Inventory, Delete,
} from '@mui/icons-material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import {
  getDashboardSummary, getBookSalesChart, getGenderAgeChart, getSalesTrend,
  getAllThemes, setMonthlyTheme, deleteTheme,
} from '../../services/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// KPI Card component
const KpiCard = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight={700} color={color || 'text.primary'}>
            {value ?? <CircularProgress size={24} />}
          </Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ bgcolor: `${color || 'primary'}.light`, p: 1.5, borderRadius: 2, color: color || 'primary.main' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [bookSales, setBookSales] = useState([]);
  const [genderAge, setGenderAge] = useState({});
  const [salesTrend, setSalesTrend] = useState([]);
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState([]);
  const [themeForm, setThemeForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, theme: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, b, ga, t] = await Promise.all([
        getDashboardSummary(),
        getBookSalesChart(),
        getGenderAgeChart(),
        getSalesTrend({ days: trendDays }),
      ]);
      setSummary(s.data);
      setBookSales(b.data);
      setGenderAge(ga.data);
      setSalesTrend(t.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [trendDays]);

  useEffect(() => {
    getAllThemes().then((r) => setThemes(r.data)).catch(() => {});
  }, []);

  const handleSetTheme = async () => {
    if (!themeForm.theme.trim()) return;
    try {
      await setMonthlyTheme(themeForm);
      const res = await getAllThemes();
      setThemes(res.data);
      setThemeForm((f) => ({ ...f, theme: '' }));
      toast.success('Theme set successfully!');
    } catch {
      toast.error('Error setting theme');
    }
  };

  const handleDeleteTheme = async (id) => {
    await deleteTheme(id);
    setThemes((prev) => prev.filter((t) => t._id !== id));
    toast.success('Theme deleted');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" onClick={fetchData}>Refresh</Button>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Total Books Sold" value={summary?.totalBooksSold} icon={<MenuBook />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Revenue" icon={<TrendingUp />} color="success"
            value={summary ? `₹${summary.totalRevenue?.toLocaleString()}` : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Active Volunteers" value={summary?.activeVolunteers} icon={<People />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Low Stock Books" value={summary?.lowStockBooks} icon={<Warning />} color="warning"
            subtitle="Books with < 3 copies"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Total Bookstalls" value={summary?.totalBookstalls} icon={<Store />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Expenditure" icon={<AccountBalance />} color="error"
            value={summary ? `₹${summary.totalExpenditure?.toLocaleString()}` : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Inventory Cost" icon={<Inventory />} color="secondary"
            value={summary ? `₹${summary.totalInventoryCost?.toLocaleString()}` : null}
          />
        </Grid>
      </Grid>

      {/* Monthly Theme Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>🌿 Monthly Theme</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} md={2}>
              <TextField
                select fullWidth label="Year" size="small"
                value={themeForm.year}
                onChange={(e) => setThemeForm({ ...themeForm, year: parseInt(e.target.value) })}
              >
                {[2024, 2025, 2026, 2027].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select fullWidth label="Month" size="small"
                value={themeForm.month}
                onChange={(e) => setThemeForm({ ...themeForm, month: parseInt(e.target.value) })}
              >
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Theme (e.g. #ClimateAwarenessMonth)" size="small"
                value={themeForm.theme}
                onChange={(e) => setThemeForm({ ...themeForm, theme: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" fullWidth onClick={handleSetTheme}>
                Set Theme
              </Button>
            </Grid>
          </Grid>

          {themes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" mb={1}>Past & Current Themes:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {themes.map((t) => (
                  <Chip
                    key={t._id}
                    label={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t.month - 1]} ${t.year}: ${t.theme}`}
                    onDelete={() => handleDeleteTheme(t._id)}
                    color={t.month === new Date().getMonth() + 1 && t.year === new Date().getFullYear() ? 'success' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Sales Trend Line Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Sales Trend</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={trendDays} onChange={(e) => setTrendDays(e.target.value)}>
                    <MenuItem value={7}>Last 7 days</MenuItem>
                    <MenuItem value={30}>Last 30 days</MenuItem>
                    <MenuItem value={90}>Last 90 days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {salesTrend.length > 0 ? (
                <Line
                  data={{
                    labels: salesTrend.map((d) => d.date),
                    datasets: [
                      {
                        label: 'Books Sold',
                        data: salesTrend.map((d) => d.totalQuantity),
                        borderColor: '#1a237e',
                        backgroundColor: 'rgba(26,35,126,0.1)',
                        fill: true, tension: 0.4,
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                />
              ) : <Typography color="text.secondary" textAlign="center" py={4}>No sales data yet</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Gender Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Gender Distribution</Typography>
              {genderAge.genderData?.length > 0 ? (
                <Doughnut
                  data={{
                    labels: genderAge.genderData?.map((d) => d.gender),
                    datasets: [{
                      data: genderAge.genderData?.map((d) => d.count),
                      backgroundColor: ['#1a237e', '#ff6f00', '#2e7d32'],
                    }],
                  }}
                  options={{ responsive: true }}
                />
              ) : <Typography color="text.secondary" textAlign="center" py={4}>No data yet</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Books Bar Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Top Selling Books</Typography>
              {bookSales.length > 0 ? (
                <Bar
                  data={{
                    labels: bookSales.slice(0, 10).map((b) => b.bookTitle),
                    datasets: [{
                      label: 'Copies Sold',
                      data: bookSales.slice(0, 10).map((b) => b.totalQuantity),
                      backgroundColor: '#1a237e',
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                />
              ) : <Typography color="text.secondary" textAlign="center" py={4}>No data yet</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
