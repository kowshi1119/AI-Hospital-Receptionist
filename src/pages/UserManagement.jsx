/**
 * User Management Page (Admin only) - View details (incl. ID photos), Edit, Remove, Register user, Approve/Disable, Send message
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  MenuItem,
  Tooltip,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Check, Close, Block, Email, Visibility, Edit, Delete, PersonAdd } from '@mui/icons-material';
import { userAPI, messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageUser, setMessageUser] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone_number: '', address: '', about_yourself: '', status: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(false);
  const [removeUser, setRemoveUser] = useState(null);
  const [removeDeleting, setRemoveDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await userAPI.getPendingUsers();
      setPendingUsers(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load pending users');
    }
  };

  const handleApprove = async (userId, action) => {
    try {
      await userAPI.approveUser(userId, action);
      toast.success(`User ${action}d successfully`);
      setActionDialog(false);
      setSelectedUser(null);
      loadUsers();
      loadPendingUsers();
    } catch (error) {
      const err = error.response?.data;
      const errorMsg = err?.error || err?.detail || err?.message || (error.response?.status === 403 ? 'Permission denied' : 'Failed to process');
      toast.error(errorMsg);
    }
  };

  const handleSendMessage = async () => {
    if (!messageUser || !messageSubject.trim() || !messageBody.trim()) {
      toast.error('Select user, subject and message');
      return;
    }
    setSending(true);
    try {
      await messageAPI.sendToUser({
        user_id: messageUser,
        subject: messageSubject.trim(),
        message: messageBody.trim(),
      });
      toast.success('Message sent to user email');
      setMessageDialog(false);
      setMessageUser('');
      setMessageSubject('');
      setMessageBody('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const openView = async (u) => {
    setViewUser(null);
    setViewDialog(true);
    setViewLoading(true);
    try {
      const res = await userAPI.getById(u.id);
      setViewUser(res.data);
    } catch {
      toast.error('Failed to load user details');
      setViewDialog(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    setEditForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone_number: u.phone_number || '',
      address: u.address || '',
      about_yourself: u.about_yourself || '',
      status: u.status || 'Approved',
    });
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser?.id) return;
    setEditSaving(true);
    try {
      await userAPI.updateUser(selectedUser.id, editForm);
      toast.success('User updated');
      setEditDialog(false);
      setSelectedUser(null);
      loadUsers();
      loadPendingUsers();
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.error || Object.values(err.response?.data || {}).flat().find(Boolean) || 'Failed to update';
      toast.error(typeof msg === 'string' ? msg : 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const openRemove = (u) => {
    setRemoveUser(u);
    setRemoveDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!removeUser?.id) return;
    setRemoveDeleting(true);
    try {
      await userAPI.deleteUser(removeUser.id);
      toast.success('User removed');
      setRemoveDialog(false);
      setRemoveUser(null);
      loadUsers();
      loadPendingUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to remove user');
    } finally {
      setRemoveDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      case 'Disabled':
        return 'default';
      default:
        return 'default';
    }
  };

  const approvedUsers = users.filter((u) => u.status === 'Approved');

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => navigate('/register-user')}>
            Register user
          </Button>
          <Button variant="outlined" startIcon={<Email />} onClick={() => setMessageDialog(true)}>
            Send message to user
          </Button>
        </Box>
      </Box>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pending Approvals
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionDialog(true);
                          }}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => handleApprove(user.id, 'reject')}>
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* All Users */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Tooltip title="View full details and ID photos">
                    <IconButton size="small" onClick={() => openView(user)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit user">
                    <IconButton size="small" onClick={() => openEdit(user)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  {user.status === 'Approved' && (
                    <Tooltip title="Disable user (stops login)">
                      <IconButton size="small" color="warning" onClick={() => handleApprove(user.id, 'disable')}>
                        <Block />
                      </IconButton>
                    </Tooltip>
                  )}
                  {currentUser?.id !== user.id && (
                    <Tooltip title="Remove user permanently">
                      <IconButton size="small" color="error" onClick={() => openRemove(user)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={actionDialog} onClose={() => setActionDialog(false)}>
        <DialogTitle>Approve User</DialogTitle>
        <DialogContent>
          <Typography>
            Approve {selectedUser?.full_name} ({selectedUser?.role})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => handleApprove(selectedUser?.id, 'approve')}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send message to user (by email)</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Select user"
            value={messageUser}
            onChange={(e) => setMessageUser(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {approvedUsers.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.full_name} ({u.email}) - {u.role}
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Subject" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Message" multiline rows={4} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage} disabled={sending}>
            {sending ? 'Sending...' : 'Send email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View user details - all registered details including ID photos for verification */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewUser ? (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {viewUser.profile_picture_url && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Profile photo</Typography>
                      <Box component="img" src={viewUser.profile_picture_url} alt="Profile" sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }} />
                    </Box>
                  )}
                  {viewUser.id_card_url && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>ID card (verification)</Typography>
                      <Box component="img" src={viewUser.id_card_url} alt="ID" sx={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 1, border: 1, borderColor: 'divider' }} />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Name</Typography><Typography>{viewUser.full_name}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Username</Typography><Typography>{viewUser.username}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Email</Typography><Typography>{viewUser.email}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Phone</Typography><Typography>{viewUser.phone_number}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Role</Typography><Typography>{viewUser.role}{viewUser.specialization ? ` – ${viewUser.specialization}` : ''}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Status</Typography><Chip label={viewUser.status} color={getStatusColor(viewUser.status)} size="small" /></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Date of birth</Typography><Typography>{viewUser.date_of_birth}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Joined</Typography><Typography>{viewUser.date_joined ? new Date(viewUser.date_joined).toLocaleDateString() : '-'}</Typography></Grid>
                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Address</Typography><Typography>{viewUser.address || '-'}</Typography></Grid>
                {viewUser.about_yourself && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">About</Typography><Typography>{viewUser.about_yourself}</Typography></Grid>}
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit user */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full name" value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone" value={editForm.phone_number} onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Address" multiline rows={2} value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="About" multiline rows={2} value={editForm.about_yourself} onChange={(e) => setEditForm((f) => ({ ...f, about_yourself: e.target.value }))} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Status" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Disabled">Disabled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Remove user confirmation */}
      <Dialog open={removeDialog} onClose={() => !removeDeleting && setRemoveDialog(false)}>
        <DialogTitle>Remove user</DialogTitle>
        <DialogContent>
          <Typography>Remove user <strong>{removeUser?.full_name}</strong> ({removeUser?.email})? This cannot be undone and will delete all their data.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialog(false)} disabled={removeDeleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRemoveConfirm} disabled={removeDeleting}>{removeDeleting ? 'Removing...' : 'Remove'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
