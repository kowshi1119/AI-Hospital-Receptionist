/**
 * Hospital News - List for all; Admin can add/delete and send email to all
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { hospitalNewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function News() {
  const [news, setNews] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendEmailToAll, setSendEmailToAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadNews = () => {
    hospitalNewsAPI.list()
      .then((res) => setNews(res.data))
      .catch(() => toast.error('Failed to load news'));
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Enter a title');
      return;
    }
    setLoading(true);
    try {
      await hospitalNewsAPI.create({ title: title.trim(), content: content.trim(), send_email_to_all: sendEmailToAll });
      toast.success(sendEmailToAll ? 'News posted and email sent to all users.' : 'News posted.');
      setOpen(false);
      setTitle('');
      setContent('');
      setSendEmailToAll(false);
      loadNews();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post news');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this news?')) return;
    try {
      await hospitalNewsAPI.delete(id);
      toast.success('News deleted');
      loadNews();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Hospital News
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Post News
          </Button>
        )}
      </Box>
      <Paper>
        <List>
          {news.length === 0 && (
            <ListItem>
              <ListItemText primary="No news yet." />
            </ListItem>
          )}
          {news.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={item.title}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {item.content}
                    </Typography>
                    <Typography variant="caption" display="block">
                      By {item.posted_by_name} on {new Date(item.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
              {isAdmin && (
                <ListItemSecondaryAction>
                  <IconButton edge="end" color="error" onClick={() => handleDelete(item.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post News</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmailToAll}
              onChange={(e) => setSendEmailToAll(e.target.checked)}
            />
            <label htmlFor="sendEmail">Send this news by email to all users</label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
