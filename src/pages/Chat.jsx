import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = async (query) => {
    setLoadingUsers(true);
    try {
      const res = await chatAPI.searchUsers(query);
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMessages = async (otherUser) => {
    if (!otherUser) return;
    setLoadingMessages(true);
    try {
      const res = await chatAPI.getMessages(otherUser.id);
      const data = res.data;
      const list = Array.isArray(data) ? data : data?.results || [];
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadUsers('');
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    loadMessages(selectedUser);
  }, [selectedUser?.id]);

  const handleSend = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    setSending(true);
    try {
      await chatAPI.sendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
      loadMessages(selectedUser);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message just for you?')) return;
    setDeletingId(msg.id);
    try {
      await chatAPI.deleteMessage(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {
      // silently ignore; backend already enforces permissions
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Messages
      </Typography>
      <Paper
        sx={{
          display: 'flex',
          height: '70vh',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Users list */}
        <Box
          sx={{
            width: 320,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                loadUsers(val);
              }}
            />
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {loadingUsers ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading users...
                </Typography>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No users found.
                </Typography>
              </Box>
            ) : (
              <List dense>
                {users.map((u) => (
                  <ListItem
                    key={u.id}
                    button
                    selected={selectedUser?.id === u.id}
                    onClick={() => setSelectedUser(u)}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.profile_picture_url || undefined}>
                        {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.full_name}
                      secondary={u.email}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Chat area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {selectedUser ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar src={selectedUser.profile_picture_url || undefined}>
                    {selectedUser.full_name?.charAt(0) ||
                      selectedUser.email?.charAt(0) ||
                      'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {selectedUser.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedUser.email}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a user to start chatting.
              </Typography>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f7fb' }}>
            {loadingMessages && selectedUser ? (
              <Typography variant="body2" color="text.secondary">
                Loading messages...
              </Typography>
            ) : !selectedUser ? null : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No messages yet. Say hello to start the conversation.
              </Typography>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?.id === user?.id;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: isMe ? 'primary.main' : 'grey.200',
                        color: isMe ? 'primary.contrastText' : 'text.primary',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                          {msg.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      {isMe && (
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={() => handleDelete(msg)}
                          disabled={deletingId === msg.id}
                          sx={{ opacity: 0.8 }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              placeholder={
                selectedUser ? 'Type your message…' : 'Select a user to start chatting'
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              disabled={!selectedUser}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!selectedUser || !newMessage.trim() || sending}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

