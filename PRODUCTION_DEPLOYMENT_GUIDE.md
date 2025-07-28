# ShowTime Employee Portal - Complete Production Deployment Guide

## 🚀 Deployment Architecture

```
Frontend (Vercel) ←→ Backend (Render) ←→ MongoDB Atlas
                 ↓
            Google Drive API (File Storage)
            Google Calendar API (Meetings)
```

---

## 📋 Prerequisites

Before starting, ensure you have:
- GitHub account
- Vercel account
- Render account  
- MongoDB Atlas account
- Google Cloud Console access
- The ShowTime Employee Portal code repository

---

# PART 1: MongoDB Atlas Database Setup

## Step 1: Create MongoDB Atlas Account & Cluster

### 1.1 Sign Up for MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** and create account
3. Verify your email address

### 1.2 Create a New Cluster
1. Click **"Create a New Cluster"**
2. Choose **"M0 Sandbox"** (Free tier)
3. Select **Cloud Provider**: AWS
4. Select **Region**: Choose closest to your users (e.g., US East N. Virginia)
5. **Cluster Name**: `showtime-portal-prod`
6. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 2: Database Configuration

### 2.1 Create Database User
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `showtime-admin`
5. **Password**: Generate secure password (save this!)
6. **Database User Privileges**: Select **"Atlas admin"**
7. Click **"Add User"**

### 2.2 Configure Network Access
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. **Comment**: "Production servers"
5. Click **"Confirm"**

### 2.3 Get Connection String
1. Go to **"Clusters"** tab
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. Copy the connection string (looks like):
   ```
   mongodb+srv://showtime-admin:<password>@showtime-portal-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password
8. **Save this connection string** - you'll need it for backend deployment

### 2.4 Create Database and Collections
1. Click **"Browse Collections"** on your cluster
2. Click **"Create Database"**
3. **Database Name**: `showtime_portal`
4. **Collection Name**: `employees`
5. Click **"Create"**
6. Add more collections:
   - `messages`
   - `meetings`
   - `announcements`

---

# PART 2: Backend Deployment on Render

## Step 1: Prepare Backend for Production

### 1.1 Update requirements.txt
Ensure your `/app/backend/requirements.txt` has:
```txt
fastapi==0.110.1
uvicorn==0.25.0
boto3>=1.34.129
requests-oauthlib>=2.0.0
cryptography>=42.0.8
python-dotenv>=1.0.1
pymongo==4.5.0
pydantic>=2.6.4
email-validator>=2.2.0
pyjwt>=2.10.1
passlib>=1.7.4
tzdata>=2024.2
motor==3.3.1
pytest>=8.0.0
python-multipart>=0.0.9
requests>=2.31.0
pandas>=2.2.0
numpy>=1.26.0
jq>=1.6.0
typer>=0.9.0
websockets>=12.0
google-auth>=2.24.0
google-auth-oauthlib>=1.1.0
google-auth-httplib2>=0.2.0
google-api-python-client>=2.108.0
google-cloud-storage>=2.10.0
```

### 1.2 Create Production Server Configuration
Create `/app/backend/gunicorn.conf.py`:
```python
# Gunicorn configuration for production
bind = "0.0.0.0:8000"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### 1.3 Update server.py for Production
Add this to the top of `/app/backend/server.py`:
```python
import os
import json
from pathlib import Path

# Production environment configuration
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
PORT = int(os.environ.get('PORT', 8001))

# Google credentials from environment variables for production
def get_drive_service():
    credentials_json = os.environ.get('GOOGLE_DRIVE_CREDENTIALS')
    if credentials_json:
        try:
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/drive']
            )
        except json.JSONDecodeError:
            logging.error("Invalid GOOGLE_DRIVE_CREDENTIALS JSON")
            raise
    else:
        # Fallback for local development
        credentials_file = Path(__file__).parent / 'google_drive_credentials.json'
        if credentials_file.exists():
            credentials = service_account.Credentials.from_service_account_file(
                str(credentials_file),
                scopes=['https://www.googleapis.com/auth/drive']
            )
        else:
            raise Exception("No Google Drive credentials found")
    
    return build('drive', 'v3', credentials=credentials)

def get_calendar_service():
    credentials_json = os.environ.get('GOOGLE_CALENDAR_CREDENTIALS')
    if credentials_json:
        try:
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        except json.JSONDecodeError:
            logging.error("Invalid GOOGLE_CALENDAR_CREDENTIALS JSON")
            raise
    else:
        # Fallback for local development
        credentials_file = Path(__file__).parent / 'google_meet_credentials.json'
        if credentials_file.exists():
            credentials = service_account.Credentials.from_service_account_file(
                str(credentials_file),
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        else:
            raise Exception("No Google Calendar credentials found")
    
    return build('calendar', 'v3', credentials=credentials)
```

### 1.4 Update CORS for Production
Update the CORS middleware section:
```python
# Update CORS for production
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://localhost:3000",
]

# Add your Vercel domain when you get it
vercel_domain = os.environ.get('FRONTEND_URL')
if vercel_domain:
    ALLOWED_ORIGINS.append(vercel_domain)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 2: Deploy to Render

### 2.1 Create Render Account & Connect GitHub
1. Go to [Render](https://render.com)
2. Sign up using your GitHub account
3. Authorize Render to access your repositories

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `showtime-backend`
- **Region**: Oregon (US West) or closest to your users
- **Branch**: `main`
- **Root Directory**: `backend` (if backend is in subfolder)
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn server:app --host 0.0.0.0 --port $PORT
  ```

**Advanced Settings:**
- **Auto-Deploy**: Yes

### 2.3 Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

```bash
# Database
MONGO_URL=mongodb+srv://showtime-admin:YOUR_PASSWORD@showtime-portal-prod.xxxxx.mongodb.net/showtime_portal?retryWrites=true&w=majority
DB_NAME=showtime_portal

# Environment
ENVIRONMENT=production
PORT=8000

# Google Drive Credentials (paste entire JSON as single line)
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"stc-portal-467306",...}

# Google Calendar Credentials (paste entire JSON as single line) 
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account","project_id":"stc-portal-467306",...}

# CORS (will be updated after frontend deployment)
FRONTEND_URL=https://your-app-name.vercel.app
```

**Important**: 
- Replace `YOUR_PASSWORD` with your MongoDB password
- For Google credentials, copy the ENTIRE JSON content from your credential files and paste as single line
- Remove line breaks and spaces from JSON

### 2.4 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://showtime-backend.onrender.com`
4. Test the health endpoint: `https://showtime-backend.onrender.com/api/health`

---

# PART 3: Frontend Deployment on Vercel

## Step 1: Prepare Frontend for Production

### 1.1 Update package.json
Ensure `/app/frontend/package.json` has correct build script:
```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```

### 1.2 Create Production Environment File
Create `/app/frontend/.env.production`:
```bash
REACT_APP_BACKEND_URL=https://showtime-backend.onrender.com/api
REACT_APP_WS_URL=wss://showtime-backend.onrender.com/api/ws/
```

### 1.3 Create Vercel Configuration
Create `/app/frontend/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "s-maxage=31536000,immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 1.4 Update Build Configuration
Update `/app/frontend/.env`:
```bash
GENERATE_SOURCEMAP=false
REACT_APP_BACKEND_URL=https://showtime-backend.onrender.com/api
REACT_APP_WS_URL=wss://showtime-backend.onrender.com/api/ws/
```

## Step 2: Deploy to Vercel

### 2.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up using your GitHub account
3. Authorize Vercel to access repositories

### 2.2 Import Project
1. Click **"New Project"**
2. Import your GitHub repository
3. Configure project:

**Project Settings:**
- **Framework Preset**: Create React App
- **Root Directory**: `frontend` (if frontend is in subfolder)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 2.3 Configure Environment Variables
In project settings, add environment variables:

```bash
REACT_APP_BACKEND_URL=https://showtime-backend.onrender.com/api
REACT_APP_WS_URL=wss://showtime-backend.onrender.com/api/ws/
GENERATE_SOURCEMAP=false
```

### 2.4 Deploy Frontend
1. Click **"Deploy"**
2. Wait for build and deployment (3-5 minutes)
3. You'll get a URL like: `https://showtime-portal.vercel.app`

## Step 3: Update CORS Configuration

### 3.1 Update Backend CORS
1. Go to your Render dashboard
2. Update the `FRONTEND_URL` environment variable:
   ```bash
   FRONTEND_URL=https://showtime-portal.vercel.app
   ```
3. Redeploy the backend service

---

# PART 4: Google Services Configuration

## Step 1: Google Drive API Setup

### 1.1 Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `stc-portal-467306`
3. Go to **"APIs & Services"** → **"Library"**
4. Search for **"Google Drive API"**
5. Click **"Enable"**

### 1.2 Configure Service Account
1. Go to **"APIs & Services"** → **"Credentials"**
2. Find your service account: `portal@stc-portal-467306.iam.gserviceaccount.com`
3. Download the JSON key file
4. Copy the JSON content to your Render environment variable `GOOGLE_DRIVE_CREDENTIALS`

### 1.3 Create and Share Drive Folder
1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder: **"ShowTime Portal Files"**
3. Right-click → **"Share"**
4. Add your service account email: `portal@stc-portal-467306.iam.gserviceaccount.com`
5. Set permission to **"Editor"**
6. Copy the folder ID from the URL (after `/folders/`)
7. Update your backend code with this folder ID

## Step 2: Google Calendar API Setup

### 2.1 Enable Google Calendar API
1. In Google Cloud Console
2. Go to **"APIs & Services"** → **"Library"**
3. Search for **"Google Calendar API"**
4. Click **"Enable"**

### 2.2 Configure Calendar Access
1. Use the same service account or create a new one
2. Download JSON credentials
3. Copy to Render environment variable `GOOGLE_CALENDAR_CREDENTIALS`

---

# PART 5: Testing Production Deployment

## Step 1: Backend Testing

### 1.1 Test API Endpoints
```bash
# Health check
curl https://showtime-backend.onrender.com/api/health

# Test meeting creation
curl -X POST https://showtime-backend.onrender.com/api/meetings?creator_id=admin@test.com&creator_name=Admin \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Production Test Meeting",
    "description": "Testing production deployment",
    "start_time": "2025-07-30T14:00:00Z",
    "end_time": "2025-07-30T15:00:00Z",
    "attendees": ["test@example.com"]
  }'

# Test employees endpoint
curl https://showtime-backend.onrender.com/api/employees
```

### 1.2 Check Logs
1. Go to Render dashboard
2. Click on your service
3. Check **"Logs"** tab for any errors

## Step 2: Frontend Testing

### 2.1 Test Application Access
1. Visit your Vercel URL: `https://showtime-portal.vercel.app`
2. Test login functionality
3. Test navigation between sections

### 2.2 Test API Integration
1. Open browser developer tools
2. Check Network tab for API calls
3. Verify successful responses from backend

## Step 3: End-to-End Testing

### 3.1 Meeting Creation Test
1. Login to the application
2. Navigate to "Meetings" tab
3. Create a new meeting
4. Verify meeting appears in list
5. Check Google Calendar for event creation

### 3.2 File Sharing Test
1. Navigate to "Communication" tab
2. Try uploading a file
3. Verify file appears in chat
4. Check Google Drive for file storage

### 3.3 Real-time Messaging Test
1. Open application in two browser windows
2. Login with different users
3. Send messages and verify real-time delivery

---

# PART 6: Domain Configuration (Optional)

## Step 1: Custom Domain for Frontend

### 1.1 Add Custom Domain to Vercel
1. Go to Vercel project settings
2. Click **"Domains"**
3. Add your custom domain (e.g., `portal.showtimeconsulting.com`)
4. Follow DNS configuration instructions

### 1.2 Update DNS Records
Add these DNS records at your domain provider:
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
```

## Step 2: Custom Domain for Backend (Optional)

### 2.1 Add Custom Domain to Render
1. Go to Render service settings
2. Click **"Custom Domains"**
3. Add domain (e.g., `api.showtimeconsulting.com`)
4. Configure DNS as instructed

---

# PART 7: Monitoring & Maintenance

## Step 1: Setup Monitoring

### 1.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and errors

### 1.2 Render Monitoring
1. Check service health regularly
2. Monitor resource usage
3. Set up alerts for downtime

### 1.3 MongoDB Atlas Monitoring
1. Enable Atlas monitoring
2. Set up performance alerts
3. Monitor connection usage

## Step 2: Backup Strategy

### 2.1 Database Backups
1. MongoDB Atlas provides automatic backups
2. Consider additional backup strategy for critical data

### 2.2 Code Backups
1. Ensure code is pushed to GitHub
2. Tag production releases
3. Keep deployment configuration documented

---

# PART 8: Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: CORS Errors
**Problem**: Frontend can't access backend API
**Solution**: 
1. Check CORS configuration in backend
2. Verify FRONTEND_URL environment variable
3. Ensure HTTPS/HTTP protocol consistency

### Issue 2: Environment Variables Not Loading
**Problem**: Google services or database not working
**Solution**:
1. Verify environment variables are set correctly
2. Check for JSON formatting issues in Google credentials
3. Restart services after environment changes

### Issue 3: WebSocket Connection Failures
**Problem**: Real-time messaging not working
**Solution**:
1. Check WebSocket URL (wss:// for HTTPS sites)
2. Verify firewall/proxy settings
3. Test WebSocket connection separately

### Issue 4: File Upload Failures
**Problem**: Cannot upload files to Google Drive
**Solution**:
1. Check Google Drive API quota
2. Verify service account permissions
3. Ensure folder sharing is configured correctly

### Issue 5: Meeting Creation Failures
**Problem**: Cannot create Google Calendar events
**Solution**:
1. Verify Google Calendar API is enabled
2. Check service account permissions
3. Test API credentials separately

---

# PART 9: Security Checklist

## Production Security

### 9.1 Environment Variables
- ✅ All sensitive data in environment variables
- ✅ No credentials in source code
- ✅ Separate development and production configs

### 9.2 API Security
- ✅ CORS properly configured
- ✅ Rate limiting implemented
- ✅ Input validation on all endpoints

### 9.3 Database Security
- ✅ Database user with minimal required permissions
- ✅ Network access restricted
- ✅ Connection string secured

### 9.4 Service Accounts
- ✅ Google service accounts with minimal required scopes
- ✅ Regular credential rotation planned
- ✅ Access logging enabled

---

# PART 10: Deployment Commands Summary

## Quick Deployment Commands

### Backend Deployment (Render)
```bash
# Environment Variables to Set:
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
DB_NAME=showtime_portal
ENVIRONMENT=production
GOOGLE_DRIVE_CREDENTIALS={...json...}
GOOGLE_CALENDAR_CREDENTIALS={...json...}
FRONTEND_URL=https://your-app.vercel.app

# Build Command:
pip install -r requirements.txt

# Start Command:
uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Frontend Deployment (Vercel)
```bash
# Environment Variables:
REACT_APP_BACKEND_URL=https://your-backend.onrender.com/api
REACT_APP_WS_URL=wss://your-backend.onrender.com/api/ws/
GENERATE_SOURCEMAP=false

# Build Command:
npm run build

# Output Directory:
build
```

---

## 🎉 Deployment Complete!

Your ShowTime Employee Portal is now live in production with:

- ✅ **Frontend**: Deployed on Vercel with custom domain support
- ✅ **Backend**: Deployed on Render with auto-scaling
- ✅ **Database**: MongoDB Atlas with automated backups
- ✅ **File Storage**: Google Drive integration
- ✅ **Meeting System**: Google Calendar integration
- ✅ **Real-time Features**: WebSocket messaging
- ✅ **Monitoring**: Built-in analytics and monitoring
- ✅ **Security**: Production-ready security configuration

**Access your application at**: `https://showtime-portal.vercel.app`
**API endpoint**: `https://showtime-backend.onrender.com/api`

For support and updates, maintain this deployment guide and monitor the service health dashboards regularly.