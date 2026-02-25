import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import CallLogs from './pages/CallLogs';
import UserManagement from './pages/UserManagement';
import DoctorManagement from './pages/DoctorManagement';
import AdminUserRegistration from './pages/AdminUserRegistration';
import Profile from './pages/Profile';
import Availability from './pages/Availability';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Landing from './pages/Landing';
import News from './pages/News';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0ea5a4',
    },
    secondary: {
      main: '#ff6b35',
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Appointments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/availability"
            element={
              <ProtectedRoute roles={['Admin', 'Doctor']}>
                <Layout>
                  <Availability />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/call-logs"
            element={
              <ProtectedRoute>
                <Layout>
                  <CallLogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-user"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <AdminUserRegistration />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Layout>
                  <DoctorManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <Layout>
                  <News />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <Chat />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </ThemeProvider>
  );
}