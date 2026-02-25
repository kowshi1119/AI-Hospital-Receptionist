/**
 * Profile Page
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
} from '@mui/material';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data);
      setEditData(response.data);
      setProfilePreview(
        response.data.profile_picture_url || response.data.profile_picture || null
      );
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      const editableFields = [
        'full_name',
        'email',
        'phone_number',
        'address',
        'about_yourself',
      ];
      editableFields.forEach((key) => {
        const value = editData?.[key];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      if (profileFile) {
        formData.append('profile_picture', profileFile);
      }

      const response = await userAPI.updateProfile(formData);
      setUser(response.data);
      // keep auth context in sync so avatar updates everywhere
      setAuthUser(response.data);
      setIsEditing(false);
      setProfileFile(null);
      setProfilePreview(
        response.data.profile_picture_url || response.data.profile_picture || null
      );
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message =
        error.response?.data &&
        typeof error.response.data === 'object' &&
        Object.values(error.response.data)[0]?.[0];
      toast.error(message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(user);
    setProfileFile(null);
    setProfilePreview(user?.profile_picture_url || user?.profile_picture || null);
    setIsEditing(false);
  };

  const handleProfileFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  // Check if user is admin (can edit their own profile)
  const canEdit = authUser?.role === 'Admin' || authUser?.id === user?.id;

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        My Profile
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={profilePreview || user?.profile_picture_url || user?.profile_picture}
            sx={{ width: 100, height: 100, mr: 3, boxShadow: 3 }}
          >
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5">{user?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role} | {user?.email}
            </Typography>
          </Box>
          {canEdit && (
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ ml: 2 }}
            >
              {profileFile || isEditing ? 'Change Picture' : 'Edit Picture'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleProfileFileChange}
              />
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Full Name"
            name="full_name"
            value={editData?.full_name || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            value={editData?.email || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            fullWidth
          />
          <TextField
            label="Phone Number"
            name="phone_number"
            value={editData?.phone_number || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            fullWidth
          />
          <TextField
            label="Address"
            name="address"
            value={editData?.address || ''}
            onChange={handleInputChange}
            multiline
            rows={2}
            disabled={!isEditing}
            fullWidth
          />
          <TextField
            label="About Yourself"
            name="about_yourself"
            value={editData?.about_yourself || ''}
            onChange={handleInputChange}
            multiline
            rows={3}
            disabled={!isEditing}
            fullWidth
          />
          <TextField
            label="Role"
            value={user?.role || ''}
            disabled
            fullWidth
          />
          <TextField
            label="Status"
            value={user?.status || ''}
            disabled
            fullWidth
          />
        </Box>

        {canEdit && (
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            {!isEditing ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
