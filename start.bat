@echo off
REM Identity Risk Dashboard Startup Script for Windows
REM This script starts both backend and frontend servers

cd /d "%~dp0"

echo 🔐 Identity Risk Dashboard - Starting...
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found!
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo ❌ Frontend directory not found!
    exit /b 1
)

REM Check if risk_scored_users.csv exists
if not exist "backend\risk_scored_users.csv" (
    echo ⚠️  Risk data not found. Generating...
    cd backend
    
    REM Check if venv exists
    if not exist "venv" (
        echo 📦 Creating Python virtual environment...
        python -m venv venv
    )
    
    REM Activate venv and run risk scorer
    call venv\Scripts\activate.bat
    echo 🔄 Installing dependencies...
    pip install -q -r requirements.txt
    echo 📊 Running risk scorer...
    python risk_scorer.py
    cd ..
)

REM Start backend
echo.
echo 🚀 Starting Backend API (Port 5000)...
cd backend

REM Activate venv if exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Check and install dependencies
pip install -q flask flask-cors pandas scikit-learn >nul 2>&1

REM Start backend in new window
start "Identity Risk Dashboard - Backend" cmd /k python app.py

REM Wait for backend to start
timeout /t 2 /nobreak

cd ..

REM Start frontend
echo.
echo 🚀 Starting Frontend Dev Server (Port 5173)...
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
start "Identity Risk Dashboard - Frontend" cmd /k npm run dev

cd ..

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Dashboard is starting!
echo ════════════════════════════════════════════════════════════
echo.
echo 📊 Dashboard URL: http://localhost:5173
echo 📡 API Server: http://localhost:5000
echo.
echo ⏳ Waiting for servers to start (30 seconds)...
timeout /t 30 /nobreak

REM Open browser
start http://localhost:5173

echo.
echo ✅ Dashboard should now be open in your browser!
echo.
