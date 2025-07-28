#!/bin/bash

# ShowTime Employee Portal - Deployment Preparation Script
# This script prepares your files for production deployment

echo "🚀 ShowTime Employee Portal - Deployment Preparation"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/server.py" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking project structure...${NC}"

# Check backend files
echo "Backend files:"
if [ -f "backend/server.py" ]; then
    echo -e "  ✅ server.py"
else
    echo -e "  ❌ server.py"
fi

if [ -f "backend/requirements.txt" ]; then
    echo -e "  ✅ requirements.txt"
else
    echo -e "  ❌ requirements.txt"
fi

if [ -f "backend/google_drive_credentials.json" ]; then
    echo -e "  ✅ google_drive_credentials.json"
else
    echo -e "  ❌ google_drive_credentials.json"
fi

if [ -f "backend/google_meet_credentials.json" ]; then
    echo -e "  ✅ google_meet_credentials.json"
else
    echo -e "  ❌ google_meet_credentials.json"
fi

# Check frontend files
echo "Frontend files:"
if [ -f "frontend/package.json" ]; then
    echo -e "  ✅ package.json"
else
    echo -e "  ❌ package.json"
fi

if [ -f "frontend/vercel.json" ]; then
    echo -e "  ✅ vercel.json"
else
    echo -e "  ❌ vercel.json"
fi

if [ -f "frontend/.env.production" ]; then
    echo -e "  ✅ .env.production"
else
    echo -e "  ❌ .env.production"
fi

# Check documentation
echo "Documentation:"
if [ -f "PRODUCTION_DEPLOYMENT_GUIDE.md" ]; then
    echo -e "  ✅ PRODUCTION_DEPLOYMENT_GUIDE.md"
else
    echo -e "  ❌ PRODUCTION_DEPLOYMENT_GUIDE.md"
fi

if [ -f "DEPLOYMENT_CHECKLIST.md" ]; then
    echo -e "  ✅ DEPLOYMENT_CHECKLIST.md"
else
    echo -e "  ❌ DEPLOYMENT_CHECKLIST.md"
fi

if [ -f "test_deployment.py" ]; then
    echo -e "  ✅ test_deployment.py"
else
    echo -e "  ❌ test_deployment.py"
fi

echo ""
echo -e "${GREEN}✅ File structure check complete!${NC}"
echo ""

# Display next steps
echo -e "${BLUE}📝 Next Steps for Deployment:${NC}"
echo ""
echo "1. 🗄️  Set up MongoDB Atlas:"
echo "   - Sign up at https://www.mongodb.com/cloud/atlas"
echo "   - Create free M0 cluster"
echo "   - Create database user and get connection string"
echo ""
echo "2. 🖥️  Deploy Backend to Render:"
echo "   - Sign up at https://render.com"
echo "   - Connect GitHub repository"
echo "   - Use settings from backend/render-config.txt"
echo ""
echo "3. 🌐 Deploy Frontend to Vercel:"
echo "   - Sign up at https://vercel.com"
echo "   - Import repository, set root to 'frontend'"
echo "   - Use environment variables from frontend/.env.production"
echo ""
echo "4. 🧪 Test deployment:"
echo "   - Run: python test_deployment.py"
echo "   - Enter your deployed URLs"
echo ""

# Offer to show environment variables
echo -e "${YELLOW}Would you like to see the environment variables you'll need? (y/n)${NC}"
read -r show_env

if [ "$show_env" = "y" ] || [ "$show_env" = "Y" ]; then
    echo ""
    echo -e "${BLUE}🔧 Environment Variables Needed:${NC}"
    echo ""
    echo "For Render (Backend):"
    echo "MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/showtime_portal"
    echo "DB_NAME=showtime_portal"
    echo "ENVIRONMENT=production"
    echo "GOOGLE_DRIVE_CREDENTIALS={...copy from google_drive_credentials.json...}"
    echo "GOOGLE_CALENDAR_CREDENTIALS={...copy from google_meet_credentials.json...}"
    echo "FRONTEND_URL=https://your-vercel-app.vercel.app"
    echo ""
    echo "For Vercel (Frontend):"
    echo "REACT_APP_BACKEND_URL=https://your-render-app.onrender.com/api"
    echo "REACT_APP_WS_URL=wss://your-render-app.onrender.com/api/ws/"
    echo "GENERATE_SOURCEMAP=false"
    echo ""
fi

echo -e "${GREEN}🎉 Your ShowTime Employee Portal is ready for deployment!${NC}"
echo -e "${BLUE}📖 Check PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions${NC}"

exit 0