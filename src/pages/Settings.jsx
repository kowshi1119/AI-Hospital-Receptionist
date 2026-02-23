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
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    siteSettingsAPI.get()
      .then((res) => {
        setSiteName(res.data.site_name || 'WeHealth');
        setLogoPreview(res.data.logo_url || null);
        setBannerPreview(res.data.banner_url || null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('site_name', siteName);
    if (logoFile) formData.append('logo', logoFile);
    if (bannerFile) formData.append('banner', bannerFile);
    try {
      await siteSettingsAPI.update(formData);
      toast.success('Settings saved. Logo and banner updated.');
      setLogoFile(null);
      setBannerFile(null);
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
          Change site logo, banner and name. These appear across the application.
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
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
