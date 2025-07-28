# 🚀 Quick Deployment Checklist

## Pre-Deployment Checklist

### ✅ MongoDB Atlas Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created (M0 Sandbox free tier)
- [ ] Database user created with admin privileges
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Database `showtime_portal` created
- [ ] Collections created: `employees`, `messages`, `meetings`, `announcements`

### ✅ Google Services Setup
- [ ] Google Cloud Console project created
- [ ] Google Drive API enabled
- [ ] Google Calendar API enabled
- [ ] Service account credentials downloaded
- [ ] Google Drive folder created and shared with service account
- [ ] Credentials JSON files ready for environment variables

### ✅ Backend Deployment (Render)
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service created with correct settings:
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables configured:
  - [ ] `MONGO_URL`
  - [ ] `DB_NAME`
  - [ ] `ENVIRONMENT=production`
  - [ ] `GOOGLE_DRIVE_CREDENTIALS`
  - [ ] `GOOGLE_CALENDAR_CREDENTIALS`
  - [ ] `FRONTEND_URL` (will update after frontend deployment)
- [ ] Service deployed successfully
- [ ] Health check endpoint working: `/api/health`

### ✅ Frontend Deployment (Vercel)
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported with settings:
  - [ ] Framework: Create React App
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Environment variables configured:
  - [ ] `REACT_APP_BACKEND_URL`
  - [ ] `REACT_APP_WS_URL`
  - [ ] `GENERATE_SOURCEMAP=false`
- [ ] vercel.json configuration file added
- [ ] Frontend deployed successfully

### ✅ Cross-Service Configuration
- [ ] Backend CORS updated with frontend URL
- [ ] Frontend environment variables point to backend
- [ ] WebSocket URLs configured correctly

### ✅ Testing
- [ ] Backend API endpoints responding
- [ ] Frontend loads without errors
- [ ] Authentication working
- [ ] Meeting creation functional
- [ ] File upload working
- [ ] Real-time messaging operational

---

## Quick Setup Commands

### 1. MongoDB Atlas Connection String Format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/showtime_portal?retryWrites=true&w=majority
```

### 2. Render Environment Variables (copy-paste ready):
```
MONGO_URL=mongodb+srv://your-connection-string
DB_NAME=showtime_portal
ENVIRONMENT=production
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"stc-portal-467306",...}
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account","project_id":"stc-portal-467306",...}
FRONTEND_URL=https://your-app.vercel.app
```

### 3. Vercel Environment Variables:
```
REACT_APP_BACKEND_URL=https://your-render-app.onrender.com/api
REACT_APP_WS_URL=wss://your-render-app.onrender.com/api/ws/
GENERATE_SOURCEMAP=false
```

---

## Deployment Order

1. **First**: Deploy Backend to Render
2. **Second**: Deploy Frontend to Vercel  
3. **Third**: Update Backend CORS with Frontend URL
4. **Fourth**: Test full integration

---

## URLs You'll Get

After deployment, you'll have:
- **Backend API**: `https://your-render-service.onrender.com/api`
- **Frontend App**: `https://your-vercel-app.vercel.app`
- **Health Check**: `https://your-render-service.onrender.com/api/health`

---

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Ensure FRONTEND_URL in Render matches your Vercel URL exactly

### Issue: Environment Variables Not Loading
**Solution**: Verify JSON formatting, no line breaks in Google credentials

### Issue: MongoDB Connection Failed
**Solution**: Check connection string format and network access settings

### Issue: Google APIs Not Working
**Solution**: Verify APIs are enabled in Google Cloud Console

---

## Support Resources

- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Google Cloud**: https://cloud.google.com/docs

Ready for deployment! 🚀