@echo off
TITLE SVKM Crazy Canteen - Full Stack Platform
echo ==========================================================
echo       🔥 SVKM CRAZY CANTEEN - FULL STACK LAUNCHER 🔥
echo ==========================================================
echo Starting Backend API Server on http://localhost:5000...
start cmd /k "set PATH=C:\Users\larai\nodejs\node-v20.18.0-win-x64;%PATH% && cd backend && node src/index.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Web App on http://localhost:5173...
start cmd /k "set PATH=C:\Users\larai\nodejs\node-v20.18.0-win-x64;%PATH% && cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo ==========================================================
