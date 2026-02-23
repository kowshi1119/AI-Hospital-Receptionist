/**
 * Login Page - Uses site logo and optional banner from Settings
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { siteSettingsAPI } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WeHealth', logo_url: null, banner_url: null });

  useEffect(() => {
    siteSettingsAPI.getPublic()
      .then((res) => setSiteSettings(res.data))
      .catch(() => {});
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error('Please enter both username and password');
      setLoading(false);
      return;
    }

    const result = await login(username, password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed. Please check your credentials.');
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: siteSettings.banner_url
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${siteSettings.banner_url}) center/cover`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ minHeight: '90vh' }}>
          {/* Left Side - Login Form */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%' }}>
              {/* Logo - large, from site settings */}
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                {siteSettings.logo_url ? (
                  <Box component="img" src={siteSettings.logo_url} alt="Logo" sx={{ width: 88, height: 88, objectFit: 'contain' }} />
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, width: 88, height: 88 }}>
                    <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
                  </Box>
                )}
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {siteSettings.site_name || 'WeHealth'}
                </Typography>
              </Box>

              {/* Login Card */}
              <Paper
                elevation={10}
                sx={{
                  p: 4,
                  background: 'linear-gradient(180deg, #4a90e2 0%, #357abd 100%)',
                  borderRadius: 3,
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                  Sign In
                </Typography>

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Username"
                    variant="filled"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                        required
                    sx={{
                      mb: 2,
                      '& .MuiFilledInput-root': {
                        bgcolor: 'white',
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                        required
                    sx={{
                      mb: 2,
                      '& .MuiFilledInput-root': {
                        bgcolor: 'white',
                        borderRadius: 2,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          sx={{ color: 'white' }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: 'white' }}>Remember me</Typography>}
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      bgcolor: 'white',
                      color: '#357abd',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#f0f0f0',
                      },
                    }}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                      Don't have an account?
                    </Typography>
                    <Link
                      component="button"
                      onClick={() => navigate('/signup')}
                      sx={{
                        color: 'white',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#f0f0f0',
                        },
                      }}
                    >
                      Sign Up Here
                    </Link>
                  </Box>
                </form>
              </Paper>
            </Box>
          </Grid>

          {/* Right Side - Promotional Visual */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Decorative shapes */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  top: -100,
                  right: -100,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  bgcolor: 'rgba(255, 107, 53, 0.2)',
                  borderRadius: '50%',
                  bottom: -50,
                  left: -50,
                }}
              />

              {/* Content */}
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  Welcome to WeHealth
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                  }}
                >
                  Your trusted healthcare management system
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mt: 4 }}>
                  <Grid item xs={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#357abd', fontWeight: 'bold' }}>
                        50k+ Customers
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Connect with a Doctor
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
