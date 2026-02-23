"""
Serializers for API endpoints
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from PIL import Image
from io import BytesIO
from .models import User, Doctor, Staff, Receptionist, DoctorAvailability, Patient, Appointment, SiteSettings, HospitalNews


def validate_image_file(image_file):
    """Validate that uploaded file is a valid image"""
    if not image_file:
        return
    
    if image_file.size > 5 * 1024 * 1024:  # 5MB limit
        raise serializers.ValidationError("Image file size must be less than 5MB")
    
    # Check file extension
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
    file_name = image_file.name.lower()
    file_ext = file_name.split('.')[-1]
    
    if file_ext not in allowed_extensions:
        raise serializers.ValidationError(
            f"Upload a valid image. The file you uploaded was either not an image or a corrupted image. Allowed formats: {', '.join(allowed_extensions)}"
        )
    
    # Verify it's actually an image
    try:
        img = Image.open(image_file)
        img.verify()
        image_file.seek(0)  # Reset file pointer
    except Exception:
        raise serializers.ValidationError("Upload a valid image. The file you uploaded was either not an image or a corrupted image.")


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    # Role-specific fields
    doctor_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    specialization = serializers.CharField(write_only=True, required=False, allow_blank=True)
    staff_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    receptionist_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password',
            'full_name', 'date_of_birth', 'phone_number', 'address',
            'profile_picture', 'about_yourself', 'role',
            'doctor_id_card', 'specialization',
            'staff_id_card', 'receptionist_id_card'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'password': {'write_only': True, 'required': True},
            'full_name': {'required': True},
            'date_of_birth': {'required': True},
            'phone_number': {'required': True},
            'address': {'required': True},
            'role': {'required': True},
            'profile_picture': {'required': False, 'allow_null': True},
            'about_yourself': {'required': False, 'allow_blank': True},
        }
    
    def validate_profile_picture(self, value):
        """Validate profile picture is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_doctor_id_card(self, value):
        """Validate doctor ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_staff_id_card(self, value):
        """Validate staff ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_receptionist_id_card(self, value):
        """Validate receptionist ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove role-specific fields
        doctor_id_card = validated_data.pop('doctor_id_card', None)
        specialization = validated_data.pop('specialization', None)
        staff_id_card = validated_data.pop('staff_id_card', None)
        receptionist_id_card = validated_data.pop('receptionist_id_card', None)
        confirm_password = validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Create role-specific profile
        role = validated_data.get('role')
        if role == 'Doctor' and specialization:
            Doctor.objects.create(
                user=user,
                doctor_id_card=doctor_id_card,
                specialization=specialization
            )
        elif role == 'Staff':
            Staff.objects.create(
                user=user,
                staff_id_card=staff_id_card
            )
        elif role == 'Receptionist':
            Receptionist.objects.create(
                user=user,
                receptionist_id_card=receptionist_id_card
            )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details - includes profile and ID card URLs for admin verification"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    id_card_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'date_of_birth',
            'phone_number', 'address', 'profile_picture', 'profile_picture_url',
            'about_yourself', 'role', 'role_display', 'specialization',
            'status', 'status_display', 'id_card_url',
            'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']
    
    def _absolute_uri(self, file_field):
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        return file_field.url
    
    def get_profile_picture_url(self, obj):
        return self._absolute_uri(obj.profile_picture)
    
    def get_specialization(self, obj):
        if hasattr(obj, 'doctor_profile'):
            return getattr(obj.doctor_profile, 'specialization', None)
        return None
    
    def get_id_card_url(self, obj):
        if hasattr(obj, 'doctor_profile') and obj.doctor_profile.doctor_id_card:
            return self._absolute_uri(obj.doctor_profile.doctor_id_card)
        if hasattr(obj, 'staff_profile') and obj.staff_profile.staff_id_card:
            return self._absolute_uri(obj.staff_profile.staff_id_card)
        if hasattr(obj, 'receptionist_profile') and obj.receptionist_profile.receptionist_id_card:
            return self._absolute_uri(obj.receptionist_profile.receptionist_id_card)
        return None


class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for doctor details"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_id', 'doctor_id_card', 'specialization', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for doctor availability"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor', 'doctor_name', 'day_of_week', 'day_display',
            'start_time', 'end_time', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for patient"""
    class Meta:
        model = Patient
        fields = ['id', 'name', 'age', 'phone_number', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for appointment"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_name', 'patient_age', 'patient_disease',
            'contact_number', 'address', 'doctor', 'doctor_name', 'doctor_specialization',
            'appointment_date', 'appointment_time', 'booking_time',
            'status', 'status_display', 'created_by', 'created_by_name', 'updated_at'
        ]
        read_only_fields = ['id', 'booking_time', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointment"""
    class Meta:
        model = Appointment
        fields = [
            'patient_name', 'patient_age', 'patient_disease',
            'contact_number', 'address', 'doctor',
            'appointment_date', 'appointment_time', 'status'
        ]


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserApprovalSerializer(serializers.Serializer):
    """Serializer for user approval"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'disable'])


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for site settings (logo, banner, site name)"""
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteSettings
        fields = ['id', 'site_name', 'logo', 'banner', 'logo_url', 'banner_url', 'updated_at']
        read_only_fields = ['id', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_banner_url(self, obj):
        if obj.banner:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner.url)
            return obj.banner.url
        return None


class HospitalNewsSerializer(serializers.ModelSerializer):
    """Serializer for hospital news"""
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)
    
    class Meta:
        model = HospitalNews
        fields = ['id', 'title', 'content', 'posted_by', 'posted_by_name', 'created_at']
        read_only_fields = ['id', 'posted_by', 'created_at']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending message to a user by email"""
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    
    def validate(self, attrs):
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Provide either user_id or email.')
        return attrs
