#!/bin/bash

# Identity Risk Dashboard Startup Script
# This script starts both backend and frontend servers

set -e

echo "🔐 Identity Risk Dashboard - Starting..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if backend directory exists
if [ ! -d "$SCRIPT_DIR/backend" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$SCRIPT_DIR/frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found!${NC}"
    exit 1
fi

# Check if risk_scored_users.csv exists
if [ ! -f "$SCRIPT_DIR/backend/risk_scored_users.csv" ]; then
    echo -e "${YELLOW}⚠️  Risk data not found. Generating...${NC}"
    cd "$SCRIPT_DIR/backend"
    
    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo -e "${BLUE}📦 Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate venv and run risk scorer
    source venv/bin/activate
    echo -e "${BLUE}🔄 Installing dependencies...${NC}"
    pip install -q -r requirements.txt
    echo -e "${BLUE}📊 Running risk scorer...${NC}"
    python risk_scorer.py
    cd "$SCRIPT_DIR"
fi

# Start backend
echo ""
echo -e "${BLUE}🚀 Starting Backend API (Port 8000)...${NC}"
cd "$SCRIPT_DIR/backend"

# Activate venv if not already activated
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Check dependencies
pip install -q flask flask-cors pandas scikit-learn > /dev/null 2>&1 || true

# Start backend in background
python app.py &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 2

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start!${NC}"
    exit 1
fi

# Start frontend
echo ""
echo -e "${BLUE}🚀 Starting Frontend Dev Server (Port 5173)...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to start
sleep 3

echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Dashboard is ready!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Dashboard URL:${NC} http://localhost:5173"
echo -e "${BLUE}📡 API Server:${NC} http://localhost:8000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Trap Ctrl+C and call cleanup
trap cleanup EXIT INT TERM

# Wait for all background processes
wait
