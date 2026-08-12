echo   Stopping SAP Bill Dashboard

echo [1/2] Stopping Java server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo       Server process stopped. ✓
)
echo.

echo [2/2] Stopping Docker containers...
docker compose down
echo       Containers stopped. ✓

echo Done!

