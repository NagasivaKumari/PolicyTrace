@echo off
echo ==============================================
echo        Starting BLOCKD Full Stack
echo ==============================================
echo.
echo Starting all services via Docker Compose...
docker-compose up --build -d

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo Opening Frontend in your browser...
start http://localhost:3000

echo.
echo ==============================================
echo All services are running in the background!
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000/docs
echo.
echo To stop everything, run: docker-compose down
echo ==============================================
pause
