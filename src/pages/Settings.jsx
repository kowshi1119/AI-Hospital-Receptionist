/**
 * Site Settings - Admin only: logo, banner, site name
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { siteSettingsAPI } from '../services/api';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function Settings() {
  const [siteName, setSiteName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [servicesText, setServicesText] = useState('');
  const [visionText, setVisionText] = useState('');
  const [missionText, setMissionText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    siteSettingsAPI.get()
      .then((res) => {
        setSiteName(res.data.site_name || 'WeHealth');
        setLogoPreview(res.data.logo_url || null);
        setBannerPreview(res.data.banner_url || null);
        setHeroPreview(res.data.hero_image_url || null);
        setServicesText(res.data.services_text || '');
        setVisionText(res.data.vision_text || '');
        setMissionText(res.data.mission_text || '');
        setFooterText(res.data.footer_text || '');
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoadingData(false));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('site_name', siteName);
    formData.append('services_text', servicesText);
    formData.append('vision_text', visionText);
    formData.append('mission_text', missionText);
    formData.append('footer_text', footerText);
    if (logoFile) formData.append('logo', logoFile);
    if (bannerFile) formData.append('banner', bannerFile);
    if (heroFile) formData.append('hero_image', heroFile);
    try {
      await siteSettingsAPI.update(formData);
      toast.success('Settings saved. Logo and banner updated.');
      setLogoFile(null);
      setBannerFile(null);
      setHeroFile(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <Box p={4}>Loading...</Box>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Page Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Change site logo, banner, hero image and texts for landing/login pages. These appear across the application.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Site Name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Logo (shown in corner of all pages)
            </Typography>
            {logoPreview && (
              <Box sx={{ mb: 1 }}>
                <Box
                  component="img"
                  src={logoPreview}
                  alt="Logo"
                  sx={{ width: 120, height: 120, objectFit: 'contain', border: 1, borderRadius: 1 }}
                />
              </Box>
            )}
            <Button variant="outlined" component="label">
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
              <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
            </Button>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Banner (background image for login/welcome)
            </Typography>
            {bannerPreview && (
              <Box sx={{ mb: 1 }}>
                <Box
                  component="img"
                  src={bannerPreview}
                  alt="Banner"
                  sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: 1, borderRadius: 1 }}
                />
              </Box>
            )}
            <Button variant="outlined" component="label">
              {bannerPreview ? 'Change Banner' : 'Upload Banner'}
              <input type="file" hidden accept="image/*" onChange={handleBannerChange} />
            </Button>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Hero Image (front page doctors/team)
            </Typography>
            {heroPreview && (
              <Box sx={{ mb: 1 }}>
                <Box
                  component="img"
                  src={heroPreview}
                  alt="Hero"
                  sx={{ maxWidth: '100%', maxHeight: 240, objectFit: 'cover', border: 1, borderRadius: 1 }}
                />
              </Box>
            )}
            <Button variant="outlined" component="label">
              {heroPreview ? 'Change Hero Image' : 'Upload Hero Image'}
              <input type="file" hidden accept="image/*" onChange={handleHeroChange} />
            </Button>
          </Box>
          <TextField
            fullWidth
            label="Our Services"
            multiline
            minRows={3}
            value={servicesText}
            onChange={(e) => setServicesText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Our Vision"
            multiline
            minRows={3}
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Our Mission"
            multiline
            minRows={3}
            value={missionText}
            onChange={(e) => setMissionText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Footer Text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            helperText="You can use {year} placeholder for current year"
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
