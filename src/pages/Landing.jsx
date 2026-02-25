import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { siteSettingsAPI } from '../services/api';

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    siteSettingsAPI
      .getPublic()
      .then((res) => setSettings(res.data))
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();
  const footerText =
    settings?.footer_text?.replace('{year}', year.toString()) ||
    `© ${year} Team Northern Knights – Application built by Team Northern Knights.`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top nav */}
      <Box
        component="header"
        sx={{
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'white',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {settings?.logo_url && (
              <Box
                component="img"
                src={settings.logo_url}
                alt="Logo"
                sx={{ width: 64, height: 64, objectFit: 'contain' }}
              />
            )}
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {settings?.site_name || 'WeHealth'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/signup')}>
              Register
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box sx={{ flexGrow: 1, py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                Meet The Best Experts
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Every day is a new opportunity for you to do something for your health.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
                  Get Started
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {settings?.services_text ||
                  'Smart hospital management, appointment scheduling and patient communication in one modern platform.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={4}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  minHeight: 260,
                  backgroundColor: '#e2f4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {settings?.hero_image_url ? (
                  <Box
                    component="img"
                    src={settings.hero_image_url}
                    alt="Healthcare team"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ p: 4, textAlign: 'center' }}
                  >
                    Upload a hero image from Admin &gt; Settings to showcase your hospital
                    team here.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Services / Vision / Mission */}
          <Grid container spacing={3} sx={{ mt: 6 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Our Services
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.services_text ||
                    'Outpatient and online consultancy, appointment tracking, and patient record management.'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Our Vision
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.vision_text ||
                    'To make quality healthcare accessible, organised and data-driven for every hospital.'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Our Mission
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.mission_text ||
                    'Empowering medical teams with intuitive tools so they can focus on patients, not paperwork.'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'white',
          textAlign: 'center',
          fontSize: 12,
          color: 'text.secondary',
        }}
      >
        {footerText}
      </Box>
    </Box>
  );
}

