/**
 * Appointments Management Page
 */
import React, { useEffect, useState } from 'react';
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';
import { Edit, Delete, Check, Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { appointmentAPI, availabilityAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_disease: '',
    contact_number: '',
    address: '',
    doctor: '',
    appointment_date: dayjs(),
    appointment_time: dayjs(),
  });

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, []);

  useEffect(() => {
    const { doctor, appointment_date } = formData;
    if (!doctor || !appointment_date) {
      setAvailability([]);
      return;
    }

    const loadAvailability = async () => {
      try {
        const res = await availabilityAPI.getAll({ doctor });
        const allSlots = res.data.results || res.data || [];
        const selectedDayName = appointment_date.format('dddd'); // e.g. "Monday"
        const daySlots = allSlots.filter(
          (slot) => slot.is_available && slot.day_display === selectedDayName
        );
        setAvailability(daySlots);
      } catch {
        setAvailability([]);
      }
    };

    loadAvailability();
  }, [formData.doctor, formData.appointment_date]);

  const loadAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await doctorAPI.getAll();
      setDoctors(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  const handleOpen = (appointment = null) => {
    if (appointment) {
      setEditing(appointment);
      setFormData({
        patient_name: appointment.patient_name,
        patient_age: appointment.patient_age,
        patient_disease: appointment.patient_disease,
        contact_number: appointment.contact_number,
        address: appointment.address,
        doctor: appointment.doctor,
        appointment_date: dayjs(appointment.appointment_date),
        appointment_time: dayjs(`${appointment.appointment_date}T${appointment.appointment_time}`),
      });
    } else {
      setEditing(null);
      setFormData({
        patient_name: '',
        patient_age: '',
        patient_disease: '',
        contact_number: '',
        address: '',
        doctor: '',
        appointment_date: dayjs(),
        appointment_time: dayjs(),
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      if (!availability.length) {
        toast.error(
          'Selected doctor has no available slots for this day. Please choose another day or doctor.'
        );
        return;
      }

      const selectedTime = formData.appointment_time.format('HH:mm:ss');
      const isWithinSlot = availability.some((slot) => {
        const start = slot.start_time;
        const end = slot.end_time;
        return selectedTime >= start && selectedTime <= end;
      });

      if (!isWithinSlot) {
        toast.error(
          'Selected time is outside the doctor’s available hours. Please choose a time within their availability.'
        );
        return;
      }

      const data = {
        ...formData,
        appointment_date: formData.appointment_date.format('YYYY-MM-DD'),
        appointment_time: formData.appointment_time.format('HH:mm:ss'),
      };

      if (editing) {
        await appointmentAPI.update(editing.id, data);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentAPI.create(data);
        toast.success('Appointment created successfully');
      }
      handleClose();
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save appointment');
    }
  };

  const handleAccept = async (id) => {
    try {
      await appointmentAPI.accept(id);
      toast.success('Appointment accepted');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to accept appointment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentAPI.delete(id);
        toast.success('Appointment deleted');
        loadAppointments();
      } catch (error) {
        toast.error('Failed to delete appointment');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const canEdit = (appointment) => {
    if (user?.role === 'Admin' || user?.role === 'Receptionist') return true;
    if (user?.role === 'Doctor' && appointment.doctor === user.id) return true;
    return false;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Appointments
        </Typography>
        {(user?.role === 'Admin' || user?.role === 'Receptionist') && (
          <Button variant="contained" onClick={() => handleOpen()}>
            Create Appointment
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Disease</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{appointment.patient_name}</TableCell>
                <TableCell>{appointment.patient_age}</TableCell>
                <TableCell>{appointment.patient_disease}</TableCell>
                <TableCell>{appointment.doctor_name}</TableCell>
                <TableCell>{appointment.appointment_date}</TableCell>
                <TableCell>{appointment.appointment_time}</TableCell>
                <TableCell>
                  <Chip
                    label={appointment.status}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user?.role === 'Doctor' && appointment.status === 'Pending' && (
                    <>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleAccept(appointment.id)}
                      >
                        <Check />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Close />
                      </IconButton>
                    </>
                  )}
                  {canEdit(appointment) && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(appointment)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editing ? 'Edit Appointment' : 'Create Appointment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Patient Name"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Age"
              type="number"
              value={formData.patient_age}
              onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Disease/Problem"
              multiline
              rows={3}
              value={formData.patient_disease}
              onChange={(e) => setFormData({ ...formData, patient_disease: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Contact Number"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Doctor"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              fullWidth
              required
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.user?.full_name} - {doctor.specialization}
                </MenuItem>
              ))}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Appointment Date"
                value={formData.appointment_date}
                onChange={(newValue) => setFormData({ ...formData, appointment_date: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
              <TimePicker
                label="Appointment Time"
                value={formData.appointment_time}
                onChange={(newValue) => setFormData({ ...formData, appointment_time: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
