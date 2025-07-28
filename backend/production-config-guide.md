# Production Server Configuration Updates
# Instructions to update your server.py for production deployment

## 1. Environment Variables Configuration
Add these lines near the top of server.py after imports:

```python
# Production environment configuration
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
PORT = int(os.environ.get('PORT', 8001))

# MongoDB connection with production support
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'showtime_portal')
```

## 2. Update Google Services Functions
Replace your existing get_drive_service and get_calendar_service functions:

```python
def get_drive_service():
    credentials_json = os.environ.get('GOOGLE_DRIVE_CREDENTIALS')
    if credentials_json:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/drive']
        )
    else:
        # Fallback for local development
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_DRIVE_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/drive']
        )
    return build('drive', 'v3', credentials=credentials)

def get_calendar_service():
    credentials_json = os.environ.get('GOOGLE_CALENDAR_CREDENTIALS')
    if credentials_json:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
    else:
        # Fallback for local development
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_MEET_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
    return build('calendar', 'v3', credentials=credentials)
```

## 3. Update CORS Configuration
Replace your CORS middleware configuration:

```python
# Production CORS configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://localhost:3000",
]

# Add production frontend URL
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 4. Add Production Health Check
Add this endpoint for production monitoring:

```python
@api_router.get("/health/detailed")
async def detailed_health_check():
    health_status = {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "services": {}
    }
    
    try:
        await client.admin.command('ping')
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status
```

## 5. Environment Variables for Render
Set these in your Render dashboard:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/showtime_portal
DB_NAME=showtime_portal
ENVIRONMENT=production
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...}
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account",...}
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 6. Build Commands for Render
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`