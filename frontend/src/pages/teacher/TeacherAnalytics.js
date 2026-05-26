import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, alpha, useTheme
} from '@mui/material';
import {
  BarChart, Assessment, TrendingUp, People, School, Star, Download
} from '@mui/icons-material';

export default function TeacherAnalytics() {
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Performance Analytics</Typography>
        <Button variant="outlined" startIcon={<Download />} size="small"
          sx={{ borderRadius: 2, textTransform: 'none' }}>
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              <TrendingUp sx={{ verticalAlign: 'middle', mr: 1, color: PRIMARY }} />
              Class Performance Trend
            </Typography>
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PRIMARY, 0.03), borderRadius: 3 }}>
              <Typography color="text.secondary">Chart: Monthly performance trend</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              <Star sx={{ verticalAlign: 'middle', mr: 1, color: '#f59e0b' }} />
              Subject-wise Analysis
            </Typography>
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha('#f59e0b', 0.03), borderRadius: 3 }}>
              <Typography color="text.secondary">Chart: Subject-wise comparison</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              <People sx={{ verticalAlign: 'middle', mr: 1, color: PRIMARY }} />
              Student Performance List
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PRIMARY, 0.03), borderRadius: 3 }}>
              <Typography color="text.secondary">Detailed student-wise performance table with filters</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
