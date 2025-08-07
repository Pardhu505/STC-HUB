#!/bin/bash

# Exit on any error
set -e

# Kill any process using port 8000
if lsof -i :8000 -t >/dev/null; then
    echo "Killing process on port 8000"
    kill $(lsof -i :8000 -t)
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r backend/requirements.txt

# Start the server in the background
echo "Starting server..."
uvicorn backend.server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &

echo "Deployment successful. Server is running in the background."
echo "You can check the logs with: tail -f server.log"
echo "You can check the server status with: curl http://localhost:8000/api/health"
