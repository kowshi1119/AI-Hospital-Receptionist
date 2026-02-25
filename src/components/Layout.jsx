/**
 * Main Layout Component with Sidebar - Logo from site settings (corner, bigger)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CalendarToday,
  People,
  LocalHospital,
  Phone,
  AccountCircle,
  Logout,
  Settings,
  NewReleases,
  AccessTime,
  Chat,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { siteSettingsAPI } from '../services/api';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
  { text: 'Appointments', icon: <CalendarToday />, path: '/appointments', roles: ['Admin', 'Doctor', 'Receptionist'] },
  { text: 'Availability', icon: <AccessTime />, path: '/availability', roles: ['Admin', 'Doctor'] },
  { text: 'Chat', icon: <Chat />, path: '/chat', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
  { text: 'Doctors', icon: <LocalHospital />, path: '/doctors', roles: ['Admin', 'Receptionist'] },
  { text: 'Users', icon: <People />, path: '/users', roles: ['Admin'] },
  { text: 'News', icon: <NewReleases />, path: '/news', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
  { text: 'Call Logs', icon: <Phone />, path: '/call-logs', roles: ['Admin', 'Receptionist'] },
  { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['Admin'] },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WeHealth', logo_url: null, banner_url: null });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    siteSettingsAPI.get()
      .then((res) => setSiteSettings(res.data))
      .catch(() => {});
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'linear-gradient(180deg, #051937 0%, #002a5c 40%, #0ea5a4 100%)',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64 }, color: 'common.white' }}>
        {siteSettings.logo_url ? (
          <Box
            component="img"
            src={siteSettings.logo_url}
            alt="Logo"
            sx={{
              width: 88,
              height: 88,
              objectFit: 'contain',
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 0.5,
              width: 88,
              height: 88,
              flexShrink: 0,
            }}
          >
            <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
            <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
            <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
            <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
          </Box>
        )}
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          {siteSettings.site_name || 'WeHealth'}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mt: 1 }} />
      <List sx={{ color: 'rgba(255,255,255,0.9)', flexGrow: 1, py: 1 }}>
        {filteredMenuItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.16)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: selected ? 'secondary.main' : 'rgba(255,255,255,0.7)',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.9)',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            {siteSettings.site_name || 'WeHealth'} Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.full_name}
            </Typography>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                src={user?.profile_picture_url || user?.profile_picture || undefined}
                sx={{ bgcolor: 'secondary.main' }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background:
                'linear-gradient(180deg, #051937 0%, #002a5c 40%, #0ea5a4 100%)',
              color: 'common.white',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background:
                'linear-gradient(180deg, #051937 0%, #002a5c 40%, #0ea5a4 100%)',
              color: 'common.white',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
