import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { availabilityAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

export default function Availability() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [applyToWeekdays, setApplyToWeekdays] = useState(false);
  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  });

  const isAdmin = user?.role === 'Admin';
  const isDoctor = user?.role === 'Doctor';

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadAvailability(selectedDoctor);
    } else {
      setSlots([]);
    }
  }, [selectedDoctor]);

  const loadDoctors = async () => {
    try {
      const res = await doctorAPI.getAll();
      const list = res.data.results || res.data || [];
      setDoctors(list);

      if (isDoctor) {
        const selfDoctor = list.find((d) => d.user?.id === user.id) || list[0];
        if (selfDoctor) {
          setSelectedDoctor(selfDoctor.id);
        }
      } else if (isAdmin && list.length > 0) {
        setSelectedDoctor(list[0].id);
      }
    } catch (e) {
      toast.error('Failed to load doctors for availability');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (doctorId) => {
    try {
      const res = await availabilityAPI.getAll({ doctor: doctorId });
      setSlots(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load doctor availability');
    }
  };

  const handleChange = (field) => (event) => {
    const value =
      field === 'is_available' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDoctor) {
      toast.error('Select a doctor first');
      return;
    }

    const { start_time, end_time } = form;
    if (start_time >= end_time) {
      toast.error('End time must be after start time');
      return;
    }

    setSaving(true);

    const basePayload = {
      doctor: selectedDoctor,
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
      is_available: form.is_available,
    };

    try {
      if (editing) {
        // When editing, only update the selected slot
        await availabilityAPI.update(editing.id, {
          ...basePayload,
          day_of_week: form.day_of_week,
        });
        toast.success('Availability updated');
      } else if (applyToWeekdays) {
        // Create the same slot for all weekdays (Mon–Fri)
        const weekdayValues = DAYS_OF_WEEK.filter((d) => d.value <= 4).map(
          (d) => d.value
        );

        await Promise.all(
          weekdayValues.map((day) =>
            availabilityAPI.create({
              ...basePayload,
              day_of_week: day,
            })
          )
        );
        toast.success('Availability created for all weekdays');
      } else {
        await availabilityAPI.create({
          ...basePayload,
          day_of_week: form.day_of_week,
        });
        toast.success('Availability created');
      }

      setEditing(null);
      resetForm();
      loadAvailability(selectedDoctor);
    } catch (e) {
      toast.error(
        e.response?.data?.detail ||
          e.response?.data?.error ||
          'Failed to save availability'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    });
    setApplyToWeekdays(false);
  };

  const handleEdit = (slot) => {
    setEditing(slot);
    setForm({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time?.slice(0, 5) || '09:00',
      end_time: slot.end_time?.slice(0, 5) || '17:00',
      is_available: slot.is_available,
    });
  };

  const handleDelete = async (slot) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await availabilityAPI.delete(slot.id);
      toast.success('Availability deleted');
      loadAvailability(selectedDoctor);
    } catch {
      toast.error('Failed to delete availability');
    }
  };

  const doctorOptions = useMemo(
    () =>
      doctors.map((d) => ({
        id: d.id,
        name: d.user?.full_name || 'Unnamed Doctor',
        specialization: d.specialization,
      })),
    [doctors]
  );

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Doctor Availability
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure weekly slots. Appointments can only be booked inside these
          times.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
              }}
            >
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="doctor-select-label">Doctor</InputLabel>
                <Select
                  labelId="doctor-select-label"
                  label="Doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={!isAdmin && !isDoctor}
                >
                  {doctorOptions.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                      {d.specialization ? ` - ${d.specialization}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="day-select-label">Day of Week</InputLabel>
                <Select
                  labelId="day-select-label"
                  label="Day of Week"
                  value={form.day_of_week}
                  onChange={handleChange('day_of_week')}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Start Time"
                type="time"
                value={form.start_time}
                onChange={handleChange('start_time')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 900 }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="End Time"
                type="time"
                value={form.end_time}
                onChange={handleChange('end_time')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 900 }}
                sx={{ minWidth: 150 }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                mt: 1,
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_available}
                      onChange={handleChange('is_available')}
                    />
                  }
                  label="Available"
                />
                {!editing && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={applyToWeekdays}
                        onChange={(e) =>
                          setApplyToWeekdays(e.target.checked)
                        }
                      />
                    }
                    label="Repeat for all weekdays"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editing && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditing(null);
                      resetForm();
                    }}
                    disabled={saving}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !selectedDoctor}
                >
                  {saving
                    ? 'Saving...'
                    : editing
                    ? 'Update Slot'
                    : 'Add Slot'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Weekly Availability
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No availability configured yet.
                    </TableCell>
                  </TableRow>
                )}
                {slots
                  .slice()
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>{slot.day_display}</TableCell>
                      <TableCell>
                        {slot.start_time?.slice(0, 5)} -{' '}
                        {slot.end_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={slot.is_available ? 'success' : 'default'}
                          label={slot.is_available ? 'Available' : 'Not Available'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(slot)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(slot)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
}

