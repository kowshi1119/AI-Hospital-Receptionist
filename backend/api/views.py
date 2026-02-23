"""
API Views
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import User, Doctor, Staff, Receptionist, DoctorAvailability, Patient, Appointment, SiteSettings, HospitalNews
from .serializers import (
    UserRegistrationSerializer, UserSerializer, DoctorSerializer,
    DoctorAvailabilitySerializer, PatientSerializer, AppointmentSerializer,
    AppointmentCreateSerializer, LoginSerializer, UserApprovalSerializer,
    SiteSettingsSerializer, HospitalNewsSerializer, SendMessageSerializer
)
from .services import AppointmentService, NotificationService
from .mongodb_service import MongoDBService
from .permissions import IsAdmin, IsAdminOrReceptionist, IsDoctorOrAdminOrReceptionist


class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints"""
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """User registration"""
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Save notification (optional - don't fail if MongoDB is down)
                try:
                    MongoDBService.save_notification(
                        user_id=str(user.id),
                        notification_type='registration',
                        title='Registration Successful',
                        message='Your registration is pending admin approval.',
                        metadata={'role': user.role}
                    )
                except Exception as e:
                    # Log but don't fail registration
                    import logging
                    logging.error(f"MongoDB notification failed: {str(e)}")
                
                return Response({
                    'message': 'Registration successful. Waiting for admin approval.',
                    'user_id': str(user.id)
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error_msg = str(e)
            if 'relation "users" does not exist' in error_msg or 'no such table' in error_msg.lower():
                return Response(
                    {'error': 'Database not initialized. Please run: python manage.py migrate'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            return Response(
                {'error': f'Registration failed: {error_msg}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def register_by_admin(self, request):
        """Admin registers a new user directly (approved automatically)"""
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                # Auto-approve users registered by admin
                user.status = 'Approved'
                user.is_active = True
                user.save()
                
                # Save notification
                try:
                    MongoDBService.save_notification(
                        user_id=str(user.id),
                        notification_type='registration',
                        title='Account Created by Admin',
                        message='Your account has been created and approved.',
                        metadata={'role': user.role, 'created_by': 'admin'}
                    )
                except Exception as e:
                    import logging
                    logging.error(f"MongoDB notification failed: {str(e)}")
                
                return Response({
                    'message': 'User registered successfully by admin',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error_msg = str(e)
            if 'relation "users" does not exist' in error_msg or 'no such table' in error_msg.lower():
                return Response(
                    {'error': 'Database not initialized. Please run: python manage.py migrate'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            return Response(
                {'error': f'Registration failed: {error_msg}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """User login"""
        try:
            serializer = LoginSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user is None:
                return Response(
                    {'error': 'Invalid username or password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if user.status != 'Approved':
                return Response(
                    {'error': f'Account status: {user.status}. Please wait for admin approval.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not user.is_active:
                return Response(
                    {'error': 'Account is disabled'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            user_serializer = UserSerializer(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            error_msg = str(e)
            if 'relation "users" does not exist' in error_msg or 'no such table' in error_msg.lower():
                return Response(
                    {'error': 'Database not initialized. Please run: python manage.py migrate'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            return Response(
                {'error': 'Login failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserViewSet(viewsets.ModelViewSet):
    """User management - list, retrieve, update, delete; admin can view all details including ID photos"""
    queryset = User.objects.select_related(
        'doctor_profile', 'staff_profile', 'receptionist_profile'
    ).all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You cannot remove your own account.')
        instance.delete()
    
    def perform_update(self, serializer):
        serializer.save()
        instance = serializer.instance
        instance.is_active = (instance.status == 'Approved')
        instance.save(update_fields=['is_active'])
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve/reject/disable user"""
        user = self.get_object()
        serializer = UserApprovalSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action_type = serializer.validated_data['action']
        
        try:
            if action_type == 'approve':
                user.status = 'Approved'
                user.is_active = True
                
                # Send notification (don't fail if notification services error)
                try:
                    NotificationService.send_email(
                        to_email=user.email,
                        subject='Account Approved',
                        message=f'Your account has been approved. You can now login to the system.'
                    )
                except Exception as e:
                    import logging
                    logging.error(f"Email notification failed: {str(e)}")
                
                try:
                    MongoDBService.save_notification(
                        user_id=str(user.id),
                        notification_type='account_approved',
                        title='Account Approved',
                        message='Your account has been approved by admin.'
                    )
                except Exception as e:
                    import logging
                    logging.error(f"MongoDB notification failed: {str(e)}")
            
            elif action_type == 'reject':
                user.status = 'Rejected'
                user.is_active = False
                
                try:
                    MongoDBService.save_notification(
                        user_id=str(user.id),
                        notification_type='account_rejected',
                        title='Account Rejected',
                        message='Your account registration has been rejected.'
                    )
                except Exception as e:
                    import logging
                    logging.error(f"MongoDB notification failed: {str(e)}")
            
            elif action_type == 'disable':
                user.status = 'Disabled'
                user.is_active = False
                
                try:
                    MongoDBService.save_notification(
                        user_id=str(user.id),
                        notification_type='account_disabled',
                        title='Account Disabled',
                        message='Your account has been disabled by admin.'
                    )
                except Exception as e:
                    import logging
                    logging.error(f"MongoDB notification failed: {str(e)}")
            
            # Save user status change (this is the most important part)
            user.save()
            
            return Response({
                'message': f'User {action_type}d successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            import logging
            logging.error(f"User approval failed: {str(e)}")
            return Response(
                {'error': f'Failed to process request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending users"""
        pending_users = User.objects.filter(status='Pending')
        serializer = self.get_serializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorViewSet(viewsets.ModelViewSet):
    """Doctor management"""
    queryset = Doctor.objects.select_related('user').all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['specialization']
    search_fields = ['user__full_name', 'specialization']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role != 'Admin':
            # Non-admins can only see approved doctors
            queryset = queryset.filter(user__status='Approved')
        return queryset


class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    """Doctor availability management"""
    queryset = DoctorAvailability.objects.select_related('doctor__user').all()
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['doctor', 'day_of_week', 'is_available']


class PatientViewSet(viewsets.ModelViewSet):
    """Patient management"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'phone_number', 'email']


class AppointmentViewSet(viewsets.ModelViewSet):
    """Appointment management"""
    queryset = Appointment.objects.select_related('doctor__user', 'created_by').all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['doctor', 'status', 'appointment_date']
    search_fields = ['patient_name', 'contact_number']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Role-based filtering
        if user.role == 'Doctor':
            queryset = queryset.filter(doctor__user=user)
        elif user.role == 'Staff':
            # Staff can only view, not manage
            queryset = queryset.none()
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create appointment"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check permissions
            if request.user.role not in ['Admin', 'Receptionist']:
                return Response(
                    {'error': 'Only Admin and Receptionist can create appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check doctor availability
            doctor = serializer.validated_data['doctor']
            appointment_date = serializer.validated_data['appointment_date']
            appointment_time = serializer.validated_data['appointment_time']
            
            is_available, message = AppointmentService.check_doctor_availability(
                doctor, appointment_date, appointment_time
            )
            
            if not is_available:
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            appointment = serializer.save(created_by=request.user)
            
            return Response(
                AppointmentSerializer(appointment).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update appointment"""
        appointment = self.get_object()
        
        # Check edit permissions
        can_edit = (
            request.user.role == 'Admin' or
            request.user.role == 'Receptionist' or
            (request.user.role == 'Doctor' and appointment.doctor.user == request.user)
        )
        
        if not can_edit:
            return Response(
                {'error': 'You do not have permission to edit this appointment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if can edit (before one day)
        if not AppointmentService.can_edit_appointment(appointment):
            return Response(
                {'error': 'Appointment cannot be edited. Only allowed before one day of appointment date.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_date = appointment.appointment_date
        old_time = appointment.appointment_time
        
        serializer = self.get_serializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            # Check availability if date/time changed
            if 'appointment_date' in serializer.validated_data or 'appointment_time' in serializer.validated_data:
                new_date = serializer.validated_data.get('appointment_date', appointment.appointment_date)
                new_time = serializer.validated_data.get('appointment_time', appointment.appointment_time)
                
                is_available, message = AppointmentService.check_doctor_availability(
                    appointment.doctor, new_date, new_time
                )
                
                if not is_available:
                    return Response(
                        {'error': message},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer.save()
            
            # Send notification if date/time changed
            if old_date != appointment.appointment_date or old_time != appointment.appointment_time:
                NotificationService.notify_appointment_changed(
                    appointment, old_date, old_time
                )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Doctor accepts appointment"""
        appointment = self.get_object()
        
        if request.user.role != 'Doctor' or appointment.doctor.user != request.user:
            return Response(
                {'error': 'Only the assigned doctor can accept this appointment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointment = AppointmentService.accept_appointment(appointment)
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Doctor rejects appointment"""
        appointment = self.get_object()
        
        if request.user.role != 'Doctor' or appointment.doctor.user != request.user:
            return Response(
                {'error': 'Only the assigned doctor can reject this appointment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointment.status = 'Cancelled'
        appointment.save()
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics"""
    user = request.user
    
    stats = {}
    
    if user.role == 'Admin':
        stats = {
            'total_doctors': Doctor.objects.filter(user__status='Approved').count(),
            'total_patients': Patient.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'today_appointments': Appointment.objects.filter(
                appointment_date=timezone.now().date()
            ).count(),
            'pending_users': User.objects.filter(status='Pending').count(),
        }
    elif user.role == 'Doctor':
        doctor = Doctor.objects.get(user=user)
        stats = {
            'total_appointments': Appointment.objects.filter(doctor=doctor).count(),
            'today_appointments': Appointment.objects.filter(
                doctor=doctor,
                appointment_date=timezone.now().date()
            ).count(),
            'pending_appointments': Appointment.objects.filter(
                doctor=doctor,
                status='Pending'
            ).count(),
        }
    elif user.role == 'Receptionist':
        stats = {
            'total_appointments': Appointment.objects.count(),
            'today_appointments': Appointment.objects.filter(
                appointment_date=timezone.now().date()
            ).count(),
            'pending_appointments': Appointment.objects.filter(status='Pending').count(),
        }
    
    # Get recent call logs from MongoDB
    try:
        recent_calls = MongoDBService.get_call_logs(limit=10)
        stats['recent_calls'] = recent_calls
    except Exception as e:
        stats['recent_calls'] = []
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def call_logs(request):
    """Get call logs from MongoDB"""
    limit = int(request.query_params.get('limit', 100))
    skip = int(request.query_params.get('skip', 0))
    
    try:
        logs = MongoDBService.get_call_logs(limit=limit, skip=skip)
        return Response({'logs': logs})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notifications(request):
    """Get user notifications"""
    limit = int(request.query_params.get('limit', 50))
    skip = int(request.query_params.get('skip', 0))
    unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
    
    try:
        notifications = MongoDBService.get_notifications(
            user_id=str(request.user.id),
            limit=limit,
            skip=skip,
            unread_only=unread_only
        )
        return Response({'notifications': notifications})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def send_hospital_news(request):
    """Send hospital news to all users (email broadcast)"""
    title = request.data.get('title')
    message = request.data.get('message')
    
    if not title or not message:
        return Response(
            {'error': 'Title and message are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    users = User.objects.filter(status='Approved').values_list('id', flat=True)
    NotificationService.notify_hospital_news(list(users), title, message)
    
    return Response({'message': 'News sent to all users'})


# --- Site Settings (logo, banner) ---
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def site_settings_public(request):
    """Get site settings for login/public pages (no auth required)"""
    settings_obj = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings_obj, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def site_settings_get(request):
    """Get site settings (logo, banner, site name) - any authenticated user"""
    settings_obj = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings_obj, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def site_settings_update(request):
    """Update site settings - Admin only"""
    settings_obj = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings_obj, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Hospital News (CRUD) ---
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def hospital_news_list(request):
    """List all news - all authenticated users"""
    news = HospitalNews.objects.all()[:50]
    serializer = HospitalNewsSerializer(news, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def hospital_news_create(request):
    """Create news - Admin only; optionally send email to all users"""
    serializer = HospitalNewsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(posted_by=request.user)
        # Optionally broadcast email
        send_to_all = request.data.get('send_email_to_all', False)
        if send_to_all:
            users = User.objects.filter(status='Approved').values_list('id', flat=True)
            NotificationService.notify_hospital_news(list(users), serializer.validated_data['title'], serializer.validated_data['content'])
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def hospital_news_delete(request, pk):
    """Delete news - Admin only"""
    try:
        news = HospitalNews.objects.get(pk=pk)
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except HospitalNews.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# --- Send message to specific user (staff/doctor) by email ---
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def send_message_to_user(request):
    """Send email to a specific user (by user_id or email) - Admin only"""
    serializer = SendMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    to_email = None
    if data.get('user_id'):
        try:
            user = User.objects.get(id=data['user_id'])
            to_email = user.email
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        to_email = data['email']
    
    success = NotificationService.send_email(to_email, data['subject'], data['message'])
    if success:
        try:
            MongoDBService.save_notification(
                user_id=str(User.objects.get(email=to_email).id) if data.get('user_id') else None,
                notification_type='admin_message',
                title=data['subject'],
                message=data['message']
            )
        except Exception:
            pass
        return Response({'message': f'Message sent to {to_email}'})
    return Response({'error': 'Failed to send email. Check SendGrid configuration.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
