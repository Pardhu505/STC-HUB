# ShowTime Employee Portal - Production Deployment Guide

## Overview
This guide covers deploying the ShowTime Employee Portal with:
- **Frontend**: Vercel (React application)
- **Backend**: Render (FastAPI application)
- **Database**: MongoDB Atlas (Cloud MongoDB)

## Architecture
```
Frontend (Vercel) → Backend (Render) → MongoDB Atlas
                 ↓
            Google Drive API (File Storage)
            Google Calendar API (Meetings)
```

---

## 1. MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or sign in
3. Create a new cluster (Free tier M0 is sufficient for testing)

### Step 2: Configure Database
1. **Create Database**: `showtime_portal`
2. **Create Collections**:
   - `employees`
   - `messages`
   - `meetings`
   - `announcements`

### Step 3: Setup Database User
1. Go to "Database Access"
2. Add new database user
3. Set username/password (save these for later)
4. Grant "Atlas admin" privileges

### Step 4: Configure Network Access
1. Go to "Network Access"
2. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
3. Or add specific IPs for better security

### Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (MongoDB URI)
4. Replace `<password>` with your database user password

**Example MongoDB URI:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/showtime_portal?retryWrites=true&w=majority
```

---

## 2. Backend Deployment on Render

### Step 1: Prepare Backend for Deployment

#### Create `requirements.txt`
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
black>=24.1.1
isort>=5.13.2
flake8>=7.0.0
mypy>=1.8.0
python-jose>=3.3.0
requests>=2.31.0
pandas>=2.2.0
numpy>=1.26.0
python-multipart>=0.0.9
jq>=1.6.0
typer>=0.9.0
websockets>=12.0
google-auth>=2.24.0
google-auth-oauthlib>=1.1.0
google-auth-httplib2>=0.2.0
google-api-python-client>=2.108.0
google-cloud-storage>=2.10.0
```

#### Create `render.yaml` (Optional)
```yaml
services:
  - type: web
    name: showtime-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

### Step 2: Deploy to Render

1. **Connect GitHub Repository**:
   - Go to [Render](https://render.com)
   - Sign up/Sign in
   - Connect your GitHub account
   - Select your repository

2. **Create Web Service**:
   - Choose "Web Service"
   - Select your repository
   - Configure service:
     - **Name**: `showtime-backend`
     - **Environment**: `Python 3`
     - **Region**: Choose closest to your users
     - **Branch**: `main`
     - **Root Directory**: `/backend` (if backend is in subfolder)
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**:
   - `MONGO_URL`: Your MongoDB Atlas connection string
   - `DB_NAME`: `showtime_portal`
   - `GOOGLE_DRIVE_CREDENTIALS`: Paste entire Google Drive credentials JSON
   - `GOOGLE_MEET_CREDENTIALS`: Paste entire Google Meet credentials JSON

4. **Deploy**: Click "Create Web Service"

### Step 3: Update Backend for Production

#### Update `server.py` for Environment Variables
```python
import os
import json
from google.oauth2 import service_account

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'showtime_portal')]

# Google credentials from environment variables
def get_drive_service():
    credentials_json = os.environ.get('GOOGLE_DRIVE_CREDENTIALS')
    if credentials_json:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/drive']
        )
    else:
        # Fallback to file-based credentials for local development
        credentials = service_account.Credentials.from_service_account_file(
            'google_drive_credentials.json',
            scopes=['https://www.googleapis.com/auth/drive']
        )
    return build('drive', 'v3', credentials=credentials)

def get_calendar_service():
    credentials_json = os.environ.get('GOOGLE_MEET_CREDENTIALS')
    if credentials_json:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
    else:
        # Fallback to file-based credentials for local development
        credentials = service_account.Credentials.from_service_account_file(
            'google_meet_credentials.json',
            scopes=['https://www.googleapis.com/auth/calendar']
        )
    return build('calendar', 'v3', credentials=credentials)
```

#### Update CORS for Production
```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://your-vercel-app.vercel.app",  # Your Vercel domain
        "http://localhost:3000",  # For local development
        "https://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 3. Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Deployment

#### Update `package.json`
Ensure your package.json has the build script:
```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

#### Create `.env.production` in frontend folder
```env
REACT_APP_BACKEND_URL=https://your-render-app.onrender.com
REACT_APP_WS_URL=wss://your-render-app.onrender.com/ws/
```

#### Update `vercel.json` (Create if doesn't exist)
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

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (Optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub** (Recommended):
   - Go to [Vercel](https://vercel.com)
   - Sign up/Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Configure project:
     - **Framework Preset**: Create React App
     - **Root Directory**: `/frontend` (if frontend is in subfolder)
     - **Build Command**: `yarn build` or `npm run build`
     - **Output Directory**: `build`

3. **Set Environment Variables**:
   - `REACT_APP_BACKEND_URL`: Your Render backend URL
   - `REACT_APP_WS_URL`: Your Render WebSocket URL

4. **Deploy**: Click "Deploy"

### Step 3: Configure Custom Domain (Optional)
1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## 4. Google Services Configuration

### Google Drive API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable Google Drive API
4. Create service account credentials
5. Download credentials JSON
6. Share your Google Drive folder with the service account email

### Google Calendar API Setup
1. In the same Google Cloud project
2. Enable Google Calendar API
3. Create service account credentials (or use the same one)
4. Download credentials JSON
5. Grant calendar permissions to the service account

---

## 5. Environment Variables Summary

### Backend (Render)
```env
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/showtime_portal?retryWrites=true&w=majority
DB_NAME=showtime_portal
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...}
GOOGLE_MEET_CREDENTIALS={"type":"service_account",...}
```

### Frontend (Vercel)
```env
REACT_APP_BACKEND_URL=https://your-render-app.onrender.com
REACT_APP_WS_URL=wss://your-render-app.onrender.com/ws/
```

---

## 6. Testing Production Deployment

### Backend Testing
```bash
# Test health endpoint
curl https://your-render-app.onrender.com/api/health

# Test with authentication
curl -X POST https://your-render-app.onrender.com/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","designation":"Engineer","department":"IT"}'
```

### Frontend Testing
1. Visit your Vercel URL
2. Test login functionality
3. Test file upload in Communication
4. Test meeting creation
5. Verify WebSocket connections work

---

## 7. Monitoring and Maintenance

### Render Monitoring
- Check service logs in Render dashboard
- Monitor response times and errors
- Set up health check endpoints

### Vercel Monitoring
- Check function logs in Vercel dashboard
- Monitor build times and deployment status
- Set up domain monitoring

### MongoDB Atlas Monitoring
- Monitor database performance
- Set up alerts for connection issues
- Regular backups configuration

---

## 8. Security Considerations

### API Security
1. **Rate Limiting**: Implement rate limits on API endpoints
2. **Authentication**: Add JWT token authentication
3. **CORS**: Restrict CORS origins to your domains
4. **Environment Variables**: Never commit credentials to Git

### Frontend Security
1. **Environment Variables**: Only use REACT_APP_ prefix for public variables
2. **HTTPS**: Ensure all connections use HTTPS
3. **Content Security Policy**: Implement CSP headers

### Database Security
1. **Network Access**: Restrict MongoDB Atlas network access
2. **User Permissions**: Use least-privilege database users
3. **Encryption**: Enable encryption at rest and in transit

---

## 9. Troubleshooting

### Common Issues

#### Backend Issues
- **MongoDB Connection**: Check connection string and network access
- **Google API Errors**: Verify service account permissions
- **CORS Errors**: Update allowed origins
- **Port Issues**: Render uses $PORT environment variable

#### Frontend Issues
- **Build Failures**: Check dependencies and build commands
- **API Connection**: Verify backend URL in environment variables
- **WebSocket Issues**: Check WSS protocol for HTTPS sites

#### Database Issues
- **Connection Timeout**: Check network access rules
- **Authentication Failed**: Verify username/password
- **Permission Denied**: Check user privileges

### Debugging Steps
1. Check service logs in respective dashboards
2. Test API endpoints individually
3. Verify environment variables
4. Check network connectivity
5. Review Google API quotas and limits

---

## 10. Scaling Considerations

### Backend Scaling
- Render automatically scales web services
- Consider upgrading to paid plans for better performance
- Implement caching (Redis) for better performance

### Frontend Scaling
- Vercel automatically handles CDN and scaling
- Optimize bundle size and loading times
- Implement proper caching strategies

### Database Scaling
- MongoDB Atlas provides automatic scaling
- Monitor connection limits and performance
- Consider read replicas for high-traffic applications

---

This deployment guide provides a complete setup for production deployment of the ShowTime Employee Portal. Make sure to test thoroughly in a staging environment before deploying to production.