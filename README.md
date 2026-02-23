# 🏥 AI Hospital Receptionist System - Complete Project

A comprehensive, production-ready Hospital Management System with AI-powered features, multi-role user management, and appointment scheduling. Built with Django REST Framework backend and React.js frontend.

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Deployment](#deployment)

## 🔧 Technology Stack

### Backend
- **Framework**: Django 4.2.7 + Django REST Framework
- **Database**: PostgreSQL (core data) + MongoDB (logs & AI interactions)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local file system (media uploads)

### Frontend
- **Framework**: React.js 18
- **UI Library**: Material UI (MUI) 5
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6

### External Services
- **SMS**: Twilio
- **Email**: SendGrid
- **Telephony**: Twilio, Asterisk (for future AI integration)

## ✨ Features

### 🔐 Authentication & Authorization
- User registration with role-based fields
- JWT-based authentication
- Admin approval system for new users
- Role-based access control (Admin, Doctor, Receptionist, Staff)

### 👥 User Management
- Multi-role registration (Doctor, Staff, Receptionist, Admin)
- Profile picture upload
- Role-specific ID card uploads
- Admin approval/rejection system
- User status management (Pending, Approved, Rejected, Disabled)

### 👨‍⚕️ Doctor Management
- Doctor profiles with specialization
- Availability schedule management
- Time slot management
- Doctor ID card upload

### 📅 Appointment Management
- Create, view, edit, and cancel appointments
- Doctor availability validation
- Prevent double booking
- Appointment status tracking (Pending, Confirmed, Cancelled, Completed)
- Edit restrictions (only before one day of appointment)
- Automatic SMS notifications

### 📞 Call Logs & AI Integration
- Store call logs in MongoDB
- AI interaction logs
- Call history tracking
- Intent detection and response logging

### 📊 Dashboard Analytics
- Role-based dashboard views
- Statistics (doctors, patients, appointments)
- Today's appointments
- Recent call logs
- Pending approvals (Admin)

### 📧 Notifications
- SMS notifications via Twilio
- Email notifications via SendGrid
- In-app notifications stored in MongoDB
- Hospital news broadcast to all users

### 🎨 Admin Page & Branding
- **Site Settings** (Admin only): Change site name, upload logo (shown in corner of all pages, larger size), upload banner image for login/welcome pages. Stored in database (PostgreSQL) and media files.
- **Hospital News**: Admin can post news; optionally send email to all users. All roles can view news. Admin can delete news.
- **Send message to user**: Admin can send an email to a specific staff or doctor (select user, subject, message). Uses SendGrid.
- **User control**: Admin can approve, reject, or disable users (disable stops login; user is not deleted).

## 📁 Project Structure

```
AI Project For Hospital/
├── backend/                          # Django Backend
│   ├── api/                          # Main API app
│   │   ├── models.py                 # PostgreSQL models
│   │   ├── serializers.py            # DRF serializers
│   │   ├── views.py                  # API views
│   │   ├── urls.py                   # URL routing
│   │   ├── services.py              # Business logic
│   │   ├── permissions.py            # Custom permissions
│   │   └── mongodb_service.py        # MongoDB operations
│   ├── hospital_system/              # Django project settings
│   │   ├── settings.py               # Django configuration
│   │   ├── urls.py                   # Root URL config
│   │   └── wsgi.py                   # WSGI config
│   ├── manage.py                      # Django management script
│   ├── requirements.txt              # Python dependencies
│   └── .env                           # Environment variables
│
├── src/                              # React Frontend
│   ├── components/                   # Reusable components
│   │   └── Layout.jsx                # Main layout with sidebar
│   ├── pages/                        # Page components
│   │   ├── Login.jsx                 # Login page
│   │   ├── Signup.jsx                # Registration page
│   │   ├── Dashboard.jsx             # Dashboard
│   │   ├── Appointments.jsx         # Appointment management
│   │   ├── UserManagement.jsx       # User management (Admin)
│   │   ├── DoctorManagement.jsx      # Doctor list
│   │   ├── CallLogs.jsx              # Call logs view
│   │   ├── Settings.jsx              # Site settings - logo, banner (Admin)
│   │   ├── News.jsx                  # Hospital news (all view; Admin add/delete)
│   │   └── Profile.jsx               # User profile
│   ├── services/                     # API services
│   │   └── api.js                    # Axios API client
│   ├── context/                      # React Context
│   │   └── AuthContext.jsx           # Authentication context
│   ├── routes/                       # Route components
│   │   └── ProtectedRoute.jsx        # Protected route wrapper
│   ├── App.jsx                       # Main app component
│   └── main.jsx                      # Entry point
│
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite configuration
├── .env                              # Frontend environment variables
└── README.md                         # This file
```

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **MongoDB** (Atlas or local instance)
- **Git**

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "AI Project For Hospital"
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3 Configure Environment File

The `.env` file is already created in `backend/` directory. Update it with your credentials:

```env
# Update MongoDB password
MONGODB_URI=mongodb+srv://UserName:PASSWORD@rakavan.v2vzewk.mongodb.net/

# Update PostgreSQL credentials if different
DB_PASSWORD=your_postgres_password
```

#### 2.4 Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### 2.5 Create Superuser (Admin)

**Option 1: Using Management Command (Recommended)**

```bash
python manage.py create_admin
```

This will create a default admin user with:
- **Username**: `admin`
- **Email**: `admin@hospital.com`
- **Password**: `admin123`

You can customize these values:
```bash
python manage.py create_admin --username myadmin --email myadmin@hospital.com --password mypassword
```

**Option 2: Using Django's createsuperuser**

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

**⚠️ Important**: Change the default password after first login!

### Step 3: Frontend Setup

#### 3.1 Install Dependencies

```bash
# From project root
npm install
```

#### 3.2 Environment File

The `.env` file is already created in the root directory with:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Step 4: Database Setup

#### PostgreSQL Setup

1. **Install PostgreSQL** (if not installed)
   - Download from: https://www.postgresql.org/download/
   - Install with default settings
   - Remember the postgres user password

2. **Create Database**

   **Option A: Using PowerShell Script (Easiest)**
   ```powershell
   cd backend
   .\setup_database.ps1
   ```

   **Option B: Using SQL File**
   ```powershell
   cd backend
   psql -U postgres -f create_database.sql
   ```
   (Enter password when prompted: `1234` based on your .env file)

   **Option C: Manual SQL Command**
   ```sql
   -- Connect to PostgreSQL
   psql -U postgres
   -- (Enter password: 1234)

   -- Create database
   CREATE DATABASE hospital_db;
   \q
   ```

   **Option D: One-line Command**
   ```powershell
   $env:PGPASSWORD='1234'; psql -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   **Note**: Replace `1234` with your actual PostgreSQL password if different.

3. **Update .env file** in `backend/` directory:

   ```env
   DB_NAME=hospital_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

#### MongoDB Setup

1. **Option A: MongoDB Atlas (Cloud)** - Recommended

   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Create a database user
   - Get connection string
   - Update `backend/.env`:

   ```env
   MONGODB_URI=mongodb+srv://Username:YOUR_PASSWORD@rakavan.v2vzewk.mongodb.net/
   MONGODB_DB_NAME=hospital_ai_logs
   ```

   Replace `YOUR_PASSWORD` with your actual MongoDB password.

2. **Option B: MongoDB Compass (Local)**

   - Download MongoDB Compass: https://www.mongodb.com/try/download/compass
   - Install and open MongoDB Compass
   - Connect to local MongoDB instance (default: `mongodb://localhost:27017`)
   - Create database: `hospital_ai_logs`
   - Update `backend/.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DB_NAME=hospital_ai_logs
   ```

## ⚙️ Configuration

### Backend `.env` File

Located at: `backend/.env`

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# MongoDB Connection
MONGODB_URI=mongodb+srv://Username:<db_password>@rakavan.v2vzewk.mongodb.net/
MONGODB_DB_NAME=hospital_ai_logs

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Twilio SMS Settings (Optional - for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email Settings - SendGrid (Optional - for email notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@hospital.com
EMAIL_FROM_NAME=Hospital System

# File Upload Settings
MEDIA_ROOT=media
MAX_UPLOAD_SIZE=5242880
```

### Frontend `.env` File

Located at: `.env` (project root)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
python manage.py runserver
```

Backend will run on: `http://localhost:8000`

### Start Frontend Server

```bash
# From project root
npm run dev
```

Frontend will run on: `http://localhost:5173` (or similar port)

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

## 🔑 Default Admin Credentials

If you used the `create_admin` management command, use these credentials:

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@hospital.com`

**⚠️ Security Note**: These are default credentials. Please change the password immediately after first login!

### Login Locations:
1. **Frontend Login**: http://localhost:5173/login
2. **Django Admin Panel**: http://localhost:8000/admin

### Troubleshooting Login Issues:

If you can't login:
1. Make sure you've run migrations: `python manage.py migrate`
2. Verify the admin user exists: `python manage.py create_admin`
3. Check PostgreSQL connection (see Database Setup section)
4. Ensure the user status is "Approved" in the database

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register/
Content-Type: multipart/form-data

Body:
- username: string
- email: string
- password: string
- confirm_password: string
- full_name: string
- date_of_birth: date (YYYY-MM-DD)
- phone_number: string
- address: string
- profile_picture: file (optional)
- about_yourself: string (optional)
- role: string (Doctor, Staff, Receptionist, Admin)
- specialization: string (if role=Doctor)
- doctor_id_card: file (if role=Doctor)
- staff_id_card: file (if role=Staff)
- receptionist_id_card: file (if role=Receptionist)
```

#### Login
```
POST /api/auth/login/

Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "access": "jwt_token",
  "refresh": "refresh_token",
  "user": { ... }
}
```

### User Management Endpoints

#### Get All Users (Admin only)
```
GET /api/users/
Authorization: Bearer <token>
```

#### Get Pending Users
```
GET /api/users/pending/
Authorization: Bearer <token>
```

#### Approve/Reject User
```
POST /api/users/{user_id}/approve/
Authorization: Bearer <token>

Body:
{
  "action": "approve" | "reject" | "disable"
}
```

### Appointment Endpoints

#### Create Appointment
```
POST /api/appointments/
Authorization: Bearer <token>

Body:
{
  "patient_name": "string",
  "patient_age": integer,
  "patient_disease": "string",
  "contact_number": "string",
  "address": "string",
  "doctor": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM:SS"
}
```

#### Get Appointments
```
GET /api/appointments/
Authorization: Bearer <token>
```

#### Accept Appointment (Doctor only)
```
POST /api/appointments/{id}/accept/
Authorization: Bearer <token>
```

### Dashboard Endpoint

```
GET /api/dashboard/
Authorization: Bearer <token>

Response:
{
  "total_doctors": integer,
  "total_patients": integer,
  "total_appointments": integer,
  "today_appointments": integer,
  "pending_users": integer,
  "recent_calls": [...]
}
```

### Call Logs Endpoint

```
GET /api/call-logs/
Authorization: Bearer <token>
Query Params: limit, skip
```

### Site Settings (Logo, Banner)

```
GET /api/site-settings/
Authorization: Bearer <token>
Returns: { site_name, logo_url, banner_url, ... }

PATCH /api/site-settings/update/
Authorization: Bearer <token> (Admin only)
Content-Type: multipart/form-data
Body: site_name (optional), logo (file), banner (file)
```

### Hospital News

```
GET /api/hospital-news/list/
Authorization: Bearer <token>

POST /api/hospital-news/create/
Authorization: Bearer <token> (Admin only)
Body: { title, content, send_email_to_all?: boolean }

DELETE /api/hospital-news/<uuid>/delete/
Authorization: Bearer <token> (Admin only)
```

### Send Message to User (Email)

```
POST /api/send-message/
Authorization: Bearer <token> (Admin only)
Body: { user_id: uuid, subject: string, message: string }
Or: { email: string, subject: string, message: string }
```

## 👥 User Roles & Permissions

### Admin
- Full system access
- Approve/reject user registrations
- Manage all users
- Create and manage appointments
- View all call logs
- Send hospital news to all users
- View dashboard statistics

### Doctor
- View own appointments
- Accept or reject appointments
- Update availability schedule
- View own profile
- Cannot create appointments

### Receptionist
- Create appointments
- Edit appointments (before one day)
- View all appointments
- View call logs
- View doctors and patients
- Cannot approve users

### Staff / Nurse
- View own profile
- View hospital news
- Limited access (read-only for most features)

## 🗄️ Database Schema

### PostgreSQL Tables

#### users
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `email` (String, Unique)
- `password` (Hashed)
- `full_name` (String)
- `date_of_birth` (Date)
- `phone_number` (String)
- `address` (Text)
- `profile_picture` (Image)
- `about_yourself` (Text)
- `role` (String: Admin, Doctor, Staff, Receptionist)
- `status` (String: Pending, Approved, Rejected, Disabled)
- `date_joined` (DateTime)
- `updated_at` (DateTime)

#### doctors
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `doctor_id_card` (Image)
- `specialization` (String)

#### appointments
- `id` (UUID, Primary Key)
- `patient_name` (String)
- `patient_age` (Integer)
- `patient_disease` (Text)
- `contact_number` (String)
- `address` (Text)
- `doctor_id` (Foreign Key → doctors)
- `appointment_date` (Date)
- `appointment_time` (Time)
- `booking_time` (DateTime)
- `status` (String: Pending, Confirmed, Cancelled, Completed)
- `created_by` (Foreign Key → users)

### MongoDB Collections

#### call_logs
```json
{
  "caller_number": "string",
  "intent": "string",
  "response": "string",
  "duration": "number",
  "status": "string",
  "timestamp": "datetime"
}
```

#### notifications
```json
{
  "user_id": "string",
  "notification_type": "string",
  "title": "string",
  "message": "string",
  "metadata": "object",
  "read": "boolean",
  "timestamp": "datetime"
}
```

#### ai_interactions
```json
{
  "user_id": "string",
  "interaction_type": "string",
  "input_data": "object",
  "output_data": "object",
  "metadata": "object",
  "timestamp": "datetime"
}
```

## 🚀 Deployment

### Backend Deployment

1. **Set Environment Variables**
   - Set `DEBUG=False`
   - Update `ALLOWED_HOSTS` with your domain
   - Use production database credentials
   - Set secure `SECRET_KEY`

2. **Collect Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **Deploy to platforms like:**
   - Heroku
   - AWS Elastic Beanstalk
   - DigitalOcean App Platform
   - Railway

### Frontend Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy to:**
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages

3. **Update API URL**
   - Update `VITE_API_BASE_URL` in production environment

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Enable HTTPS in production
- Regularly update dependencies
- Use environment variables for all secrets
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

## 📝 Sample API Requests

### Register a Doctor

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -F "username=drjohn" \
  -F "email=drjohn@hospital.com" \
  -F "password=SecurePass123" \
  -F "confirm_password=SecurePass123" \
  -F "full_name=Dr. John Smith" \
  -F "date_of_birth=1980-01-15" \
  -F "phone_number=+1234567890" \
  -F "address=123 Medical St" \
  -F "role=Doctor" \
  -F "specialization=Cardiology" \
  -F "doctor_id_card=@/path/to/id_card.jpg" \
  -F "profile_picture=@/path/to/profile.jpg"
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "drjohn",
    "password": "SecurePass123"
  }'
```

### Create Appointment

```bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Jane Doe",
    "patient_age": 35,
    "patient_disease": "Regular checkup",
    "contact_number": "+1234567890",
    "address": "456 Patient Ave",
    "doctor": "<doctor_uuid>",
    "appointment_date": "2024-02-25",
    "appointment_time": "10:00:00"
  }'
```

## 🐛 Troubleshooting

### ⚠️ CRITICAL: Database Migration Issues

**If you see errors like:**
- `relation "users" does not exist`
- `null value in column "name" of relation "django_content_type"`
- `No migrations to apply` but tables don't exist

**This means the database is corrupted. RESET IT:**

#### Quick Fix (pgAdmin - Recommended):

1. **Open pgAdmin**
2. **Right-click `hospital_db`** → **Delete/Drop** (check "Cascade")
3. **Right-click "Databases"** → **Create** → **Database**
4. **Name**: `hospital_db` → **Save**
5. **Run migrations**:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py create_admin
   ```

#### Alternative Fix (Python Script):

```bash
cd backend
python fix_migrations.py
# Type 'yes' when prompted
python manage.py migrate
python manage.py create_admin
```

**See `backend/QUICK_FIX.md` for detailed instructions.**

---

### Backend Issues

1. **PostgreSQL Database Does Not Exist**

   **Error**: `django.db.utils.OperationalError: database "hospital_db" does not exist`

   **Quick Fix - Use pgAdmin (Easiest)**:
   1. Open **pgAdmin** (installed with PostgreSQL)
   2. Connect to PostgreSQL server (password: check your `.env` file, default might be `1234`)
   3. Right-click **"Databases"** → **Create** → **Database**
   4. Name: `hospital_db`
   5. Click **Save**

   **Alternative - Command Line**:
   ```powershell
   # If psql is in PATH
   $env:PGPASSWORD='1234'  # Use your actual password
   psql -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   **Or find psql.exe** (usually in `C:\Program Files\PostgreSQL\<version>\bin\`):
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   See `backend/CREATE_DATABASE_GUIDE.md` for detailed instructions.

2. **PostgreSQL Connection Error - "password authentication failed"**

   **Error**: `psycopg2.OperationalError: password authentication failed for user "postgres"`

   **Solutions**:
   
   **Option A: Update .env with correct password**
   ```bash
   # Edit backend/.env file
   DB_PASSWORD=your_actual_postgres_password
   ```
   
   **Option B: Reset PostgreSQL password**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Change password
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```
   
   **Option C: Create a new PostgreSQL user**
   ```sql
   CREATE USER hospital_user WITH PASSWORD 'your_password';
   CREATE DATABASE hospital_db OWNER hospital_user;
   GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;
   ```
   
   Then update `backend/.env`:
   ```env
   DB_USER=hospital_user
   DB_PASSWORD=your_password
   ```

2. **Database Connection Error**
   - Check PostgreSQL is running: `pg_isready` or check Windows Services
   - Verify database credentials in `.env`
   - Ensure database exists: `psql -U postgres -l` (list databases)
   - Check PostgreSQL is listening on port 5432

3. **MongoDB Connection Error**
   - Verify MongoDB URI in `.env`
   - Replace `<db_password>` with actual password
   - Check network connectivity (for Atlas)
   - Ensure database user has proper permissions
   - Test connection: `mongosh "your_connection_string"`

4. **Migration Errors**
   - Delete migration files and recreate: `python manage.py makemigrations`
   - Reset database if needed (development only)
   - Ensure PostgreSQL is running before migrations

5. **Admin User Creation Issues**
   - Run: `python manage.py create_admin`
   - If user exists, delete and recreate: `python manage.py shell` then `User.objects.filter(username='admin').delete()`
   - Check user status is "Approved" in database

### Frontend Issues

1. **API Connection Error**
   - Verify backend is running on http://localhost:8000
   - Check `VITE_API_BASE_URL` in `.env`
   - Check CORS settings in backend
   - Check browser console for CORS errors

2. **Login Page Issues**
   - "Forgot Password" and "Can't access your account?" links are now removed (not implemented)
   - Use "Sign Up Here" link to register new accounts
   - Admin must approve new registrations before login

3. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version (18+)
   - Delete `package-lock.json` and reinstall if needed

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check Django and React logs

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for modern healthcare management**
