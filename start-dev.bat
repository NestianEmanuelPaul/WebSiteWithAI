@echo off
echo Starting development environment...

:: Start the backend server in a new window
start "Backend Server" cmd /k "cd app && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start the frontend in a new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Development environment started!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173
echo - API Docs: http://localhost:8000/docs

:: Keep the window open
pause
