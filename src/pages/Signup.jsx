/**
 * Signup/Registration Page - uses site logo and banner from settings
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI, siteSettingsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Signup() {
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WeHealth', logo_url: null, banner_url: null });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    date_of_birth: '',
    phone_number: '',
    address: '',
    about_yourself: '',
    role: '',
    specialization: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    siteSettingsAPI.getPublic().then((res) => setSiteSettings(res.data)).catch(() => {});
  }, []);

  const validateImageFile = (file) => {
    // Validate that the file is a valid image
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Check file size
    if (file.size > maxSize) {
      throw new Error('Image file size must be less than 10MB');
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop();
    
    if (!allowedExtensions.includes(fileExt)) {
      throw new Error(
        `Upload a valid image. Allowed formats: ${allowedExtensions.join(', ')}`
      );
    }
    
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      if (type === 'profile') {
        setProfilePicture(file);
      } else {
        setIdCard(file);
      }
    } catch (error) {
      toast.error(error.message);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all required fields
    if (!formData.full_name?.trim()) {
      toast.error('Full Name is required');
      setLoading(false);
      return;
    }
    if (!formData.date_of_birth) {
      toast.error('Date of Birth is required');
      setLoading(false);
      return;
    }
    if (!formData.email?.trim()) {
      toast.error('Email is required');
      setLoading(false);
      return;
    }
    if (!formData.phone_number?.trim()) {
      toast.error('Phone Number is required');
      setLoading(false);
      return;
    }
    if (!formData.address?.trim()) {
      toast.error('Address is required');
      setLoading(false);
      return;
    }
    if (!formData.username?.trim()) {
      toast.error('Username is required');
      setLoading(false);
      return;
    }
    if (!formData.role) {
      toast.error('Please select a role');
      setLoading(false);
      return;
    }

    // Validate role-specific required fields
    if (formData.role === 'Doctor' && !formData.specialization?.trim()) {
      toast.error('Specialization is required for Doctors');
      setLoading(false);
      return;
    }

    // Validate passwords
    if (!formData.password || !formData.confirm_password) {
      toast.error('Password and Confirm Password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Create FormData - append all fields properly
    const data = new FormData();
    
    // Append all form fields
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('confirm_password', formData.confirm_password);
    data.append('full_name', formData.full_name);
    data.append('date_of_birth', formData.date_of_birth);
    data.append('phone_number', formData.phone_number);
    data.append('address', formData.address);
    data.append('role', formData.role);
    
    // Append optional fields
    if (formData.about_yourself) {
      data.append('about_yourself', formData.about_yourself);
    }
    
    if (profilePicture) {
      data.append('profile_picture', profilePicture);
    }

    // Add role-specific fields
    if (formData.role === 'Doctor') {
      data.append('specialization', formData.specialization || '');
      if (idCard) {
        data.append('doctor_id_card', idCard);
      }
    } else if (formData.role === 'Staff' && idCard) {
      data.append('staff_id_card', idCard);
    } else if (formData.role === 'Receptionist' && idCard) {
      data.append('receptionist_id_card', idCard);
    }

    // Log FormData contents for debugging
    console.log('FormData contents:');
    for (let [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: "${value}"`);
      }
    }
    try {
      const response = await authAPI.register(data);
      toast.success('Registration successful! Waiting for admin approval.');
      navigate('/login');
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        if (status === 503) {
          errorMsg = 'Database not initialized. Please contact administrator.';
        } else if (status === 400) {
          // Check for specific field errors first
          const errorKeys = Object.keys(responseData || {});
          
          if (responseData?.username) {
            errorMsg = `Username: ${Array.isArray(responseData.username) ? responseData.username[0] : responseData.username}`;
          } else if (responseData?.email) {
            errorMsg = `Email: ${Array.isArray(responseData.email) ? responseData.email[0] : responseData.email}`;
          } else if (responseData?.password) {
            errorMsg = `Password: ${Array.isArray(responseData.password) ? responseData.password[0] : responseData.password}`;
          } else if (responseData?.phone_number) {
            errorMsg = `Phone: ${Array.isArray(responseData.phone_number) ? responseData.phone_number[0] : responseData.phone_number}`;
          } else if (responseData?.full_name) {
            errorMsg = `Full Name: ${Array.isArray(responseData.full_name) ? responseData.full_name[0] : responseData.full_name}`;
          } else if (responseData?.date_of_birth) {
            errorMsg = `DOB: ${Array.isArray(responseData.date_of_birth) ? responseData.date_of_birth[0] : responseData.date_of_birth}`;
          } else if (responseData?.address) {
            errorMsg = `Address: ${Array.isArray(responseData.address) ? responseData.address[0] : responseData.address}`;
          } else if (responseData?.non_field_errors) {
            errorMsg = Array.isArray(responseData.non_field_errors) ? responseData.non_field_errors[0] : responseData.non_field_errors;
          } else if (responseData?.error) {
            errorMsg = responseData.error;
          } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
            errorMsg = Object.entries(responseData)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
              .join(', ');
          }
        } else if (responseData?.error) {
          errorMsg = responseData.error;
        } else if (responseData?.message) {
          errorMsg = responseData.message;
        }
      } else if (error.message) {
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          errorMsg = 'Cannot connect to server. Please check if backend is running.';
        } else {
          errorMsg = error.message;
        }
      }
      
      console.error('Registration error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const roleSpecificFields = () => {
    if (formData.role === 'Doctor') {
      return (
        <>
          <TextField
            fullWidth
            label="Specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Upload Doctor ID Card
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'idCard')}
            />
          </Button>
          {idCard && (
            <Typography variant="body2" sx={{ mb: 2, color: 'success.main' }}>
              Selected: {idCard.name}
            </Typography>
          )}
        </>
      );
    } else if (formData.role === 'Staff') {
      return (
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          Upload Staff ID Card
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'idCard')}
          />
        </Button>
      );
    } else if (formData.role === 'Receptionist') {
      return (
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          Upload Receptionist ID Card
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'idCard')}
          />
        </Button>
      );
    }
    return null;
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
      <Container maxWidth="md">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
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
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {siteSettings.site_name || 'WeHealth'} – Registration
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                >
                  Upload Profile Picture
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profile')}
                  />
                </Button>
                {profilePicture && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    Selected: {profilePicture.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="About Yourself"
                  name="about_yourself"
                  multiline
                  rows={3}
                  value={formData.about_yourself}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Doctor">Doctor</MenuItem>
                  <MenuItem value="Staff">Staff / Nurse</MenuItem>
                  <MenuItem value="Receptionist">Receptionist</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </TextField>
              </Grid>
              {roleSpecificFields()}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
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
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, mt: 2 }}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                  Already have an account?{' '}
                  <Link to="/login" component={Link}>
                    Sign In
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
