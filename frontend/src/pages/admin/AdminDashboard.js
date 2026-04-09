// src/pages/admin/AdminDashboard.js
// Real-time analytics dashboard with KPI cards and Chart.js graphs
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  MenuItem, Select, FormControl, InputLabel, Button, TextField,
  IconButton, Chip, Divider, Alert, LinearProgress,
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
  getAllThemes, setMonthlyTheme, deleteTheme, checkMonthlyTarget,
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
  const [themeForm, setThemeForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    theme: '',
    targetBooksSold: '',
    targetBookstalls: '',
  });
  const [targetNotSet, setTargetNotSet] = useState(false);
  const [currentMonthData, setCurrentMonthData] = useState(null);

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
    checkMonthlyTarget().then((r) => {
      setTargetNotSet(!r.data.isSet);
      setCurrentMonthData(r.data.theme);
    }).catch(() => {});
  }, []);

  const handleSetTheme = async () => {
    if (!themeForm.theme.trim() && !themeForm.targetBooksSold && !themeForm.targetBookstalls) {
      return toast.error('Please fill at least one field');
    }
    try {
      await setMonthlyTheme(themeForm);
      const res = await getAllThemes();
      setThemes(res.data);
      // Refresh target check
      const targetRes = await checkMonthlyTarget();
      setTargetNotSet(!targetRes.data.isSet);
      setCurrentMonthData(targetRes.data.theme);
      setThemeForm((f) => ({ ...f, theme: '', targetBooksSold: '', targetBookstalls: '' }));
      toast.success('Saved successfully!');
    } catch {
      toast.error('Error saving');
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

      {/* Target not set notification */}
      {targetNotSet && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => document.getElementById('monthly-target-section').scrollIntoView({ behavior: 'smooth' })}>
            Set Now
          </Button>
        }>
          ⚠️ Monthly target for {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date().getMonth()]} {new Date().getFullYear()} is not set yet!
        </Alert>
      )}

      {/* Monthly Theme & Target Management */}
      <Card sx={{ mb: 3 }} id="monthly-target-section">
        <CardContent>
          <Typography variant="h6" mb={2}>🌿 Monthly Theme & Target</Typography>
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Theme (e.g. #ClimateAwarenessMonth)" size="small"
                value={themeForm.theme}
                onChange={(e) => setThemeForm({ ...themeForm, theme: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth label="Target Books" size="small" type="number"
                value={themeForm.targetBooksSold}
                onChange={(e) => setThemeForm({ ...themeForm, targetBooksSold: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth label="Target Bookstalls" size="small" type="number"
                value={themeForm.targetBookstalls}
                onChange={(e) => setThemeForm({ ...themeForm, targetBookstalls: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" fullWidth onClick={handleSetTheme}>
                Save
              </Button>
            </Grid>
          </Grid>

          {/* Current Month Target Progress */}
          {currentMonthData && (currentMonthData.targetBooksSold > 0 || currentMonthData.targetBookstalls > 0) && (() => {
            const now = new Date();
            const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysPassed = now.getDate();
            const daysRemaining = totalDays - daysPassed;
            const daysPassedPct = Math.round((daysPassed / totalDays) * 100);
            const daysRemainingPct = Math.round((daysRemaining / totalDays) * 100);

            const booksSold = summary?.totalBooksSoldThisMonth || 0;
            const bookstallsDone = summary?.totalBookstallsThisMonth || 0;

            const booksTarget = currentMonthData.targetBooksSold || 0;
            const bookstallsTarget = currentMonthData.targetBookstalls || 0;

            const booksBehind = Math.max(0, booksTarget - booksSold);
            const bookstallsBehind = Math.max(0, bookstallsTarget - bookstallsDone);

            const booksPct = booksTarget > 0 ? Math.round((booksSold / booksTarget) * 100) : 0;
            const bookstallsPct = bookstallsTarget > 0 ? Math.round((bookstallsDone / bookstallsTarget) * 100) : 0;

            return (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  📈 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} {now.getFullYear()} — Target Progress
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Day {daysPassed} of {totalDays} — {daysRemaining} days remaining ({daysRemainingPct}% of month left)
                </Typography>

                <Grid container spacing={2}>
                  {booksTarget > 0 && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>📚 Books Sold</Typography>
                          <Typography variant="body2">{booksSold} / {booksTarget}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={Math.min(booksPct, 100)}
                          color={booksPct >= daysPassedPct ? 'success' : 'warning'}
                          sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color={booksBehind > 0 ? 'error.main' : 'success.main'}>
                            {booksBehind > 0 ? `${booksBehind} books behind target` : '✅ On track!'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booksPct}% achieved vs {daysPassedPct}% days passed
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {bookstallsTarget > 0 && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>🏪 Bookstalls Conducted</Typography>
                          <Typography variant="body2">{bookstallsDone} / {bookstallsTarget}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={Math.min(bookstallsPct, 100)}
                          color={bookstallsPct >= daysPassedPct ? 'success' : 'warning'}
                          sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color={bookstallsBehind > 0 ? 'error.main' : 'success.main'}>
                            {bookstallsBehind > 0 ? `${bookstallsBehind} bookstalls behind target` : '✅ On track!'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bookstallsPct}% achieved vs {daysPassedPct}% days passed
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            );
          })()}

          {themes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" mb={1}>Past & Current Themes & Targets:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {themes.map((t) => (
                  <Chip
                    key={t._id}
                    label={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t.month - 1]} ${t.year}${t.theme ? ': ' + t.theme : ''}${t.targetBooksSold ? ' | 📚' + t.targetBooksSold : ''}${t.targetBookstalls ? ' | 🏪' + t.targetBookstalls : ''}`}
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
