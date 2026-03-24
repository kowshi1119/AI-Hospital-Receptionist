"""
Django management command to create a default admin user
Usage: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Creates a default admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for admin user (default: admin)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@hospital.com',
            help='Email for admin user (default: admin@hospital.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password for admin user (default: admin123)',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Check if admin already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user "{username}" already exists!')
            )
            return

        # Create admin user
        from datetime import date
        admin = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            full_name='System Administrator',
            date_of_birth=date(1990, 1, 1),  # Default date of birth
            phone_number='+1234567890',
            address='Hospital Admin Office',
            role='Admin',
            status='Approved',
        )

        # Ensure admin is fully active and approved even if defaults change.
        admin.is_active = True
        admin.status = 'Approved'
        admin.role = 'Admin'
        admin.full_name = admin.full_name or 'System Administrator'
        admin.save(update_fields=['is_active', 'status', 'role', 'full_name'])

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created admin user!\n'
                f'Username: {username}\n'
                f'Email: {email}\n'
                f'Password: {password}\n'
                f'\nIMPORTANT: Change the password after first login!'
            )
        )
