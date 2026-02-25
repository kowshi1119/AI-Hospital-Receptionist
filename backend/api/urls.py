"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet,
    UserViewSet,
    DoctorViewSet,
    DoctorAvailabilityViewSet,
    PatientViewSet,
    AppointmentViewSet,
    ChatMessageViewSet,
    dashboard_stats,
    call_logs,
    notifications,
    send_hospital_news,
    site_settings_public,
    site_settings_get,
    site_settings_update,
    hospital_news_list,
    hospital_news_create,
    hospital_news_delete,
    send_message_to_user,
    chat_user_search,
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'availability', DoctorAvailabilityViewSet, basename='availability')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'chat-messages', ChatMessageViewSet, basename='chat-message')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard'),
    path('call-logs/', call_logs, name='call-logs'),
    path('notifications/', notifications, name='notifications'),
    path('hospital-news/', send_hospital_news, name='hospital-news-broadcast'),
    path('hospital-news/list/', hospital_news_list, name='hospital-news-list'),
    path('hospital-news/create/', hospital_news_create, name='hospital-news-create'),
    path('hospital-news/<uuid:pk>/delete/', hospital_news_delete, name='hospital-news-delete'),
    path('site-settings/', site_settings_get, name='site-settings-get'),
    path('site-settings/public/', site_settings_public, name='site-settings-public'),
    path('site-settings/update/', site_settings_update, name='site-settings-update'),
    path('send-message/', send_message_to_user, name='send-message'),
    path('chat-users/', chat_user_search, name='chat-users'),
]
