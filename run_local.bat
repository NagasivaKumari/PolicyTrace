@echo off
echo ==============================================
echo        Starting BLOCKD Locally (No Docker)
echo ==============================================
echo.

:: Start Backend in a new window
echo [1/2] Launching Backend API...
start cmd /k "cd projects/blockd-backend && .venv\Scripts\activate && set RATE_LIMIT_USE_REDIS=false && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Start Frontend in a new window
echo [2/2] Launching Frontend Dashboard...
start cmd /k "cd projects/blockd-frontend && npm run dev -- --port 3000"

echo.
echo ==============================================
echo Both services are starting in separate windows!
echo - API Docs: http://localhost:8000/docs
echo - Dashboard: http://localhost:3000
echo ==============================================
echo.
echo Note: Backend is running with Redis disabled to avoid local connectivity errors.
pause
