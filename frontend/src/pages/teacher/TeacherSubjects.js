import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Chip, Button, alpha, useTheme
} from '@mui/material';
import { Book, School, People, Schedule, ArrowForwardIos } from '@mui/icons-material';

export default function TeacherSubjects() {
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  const subjects = [
    { id: 1, name: 'Science', class: 'Class 10-A', periods: 6, students: 42, code: 'SCI101' },
    { id: 2, name: 'Science', class: 'Class 10-B', periods: 5, students: 38, code: 'SCI102' },
    { id: 3, name: 'Biology', class: 'Class 9-A', periods: 4, students: 40, code: 'BIO201' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Subjects</Typography>
      <Grid container spacing={2.5}>
        {subjects.map(subj => (
          <Grid item xs={12} sm={6} md={4} key={subj.id}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer',
              transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
              onClick={() => navigate('/teacher/classes')}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                    <Book />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{subj.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{subj.code}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<School sx={{ fontSize: 14 }} />} label={subj.class} size="small"
                    sx={{ height: 24, fontSize: '0.7rem' }} />
                  <Chip icon={<People sx={{ fontSize: 14 }} />} label={`${subj.students} students`} size="small"
                    sx={{ height: 24, fontSize: '0.7rem' }} />
                  <Chip icon={<Schedule sx={{ fontSize: 14 }} />} label={`${subj.periods} periods/wk`} size="small"
                    sx={{ height: 24, fontSize: '0.7rem' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
