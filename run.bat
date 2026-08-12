echo   SAP Bill Dashboard — One-Command Launcher

:: ── Step 1: Check Docker ──────────────────────────────────
echo [1/5] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo         Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo       Docker is running. ✓
echo.

:: ── Step 2: Start PostgreSQL ──────────────────────────────
echo [2/5] Starting PostgreSQL via Docker Compose...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers!
    pause
    exit /b 1
)
echo       PostgreSQL container started. ✓
echo.

:: ── Step 3: Wait for PostgreSQL ───────────────────────────
echo [3/5] Waiting for PostgreSQL to be ready...
set /a retries=0
:wait_pg
set /a retries+=1
if %retries% gtr 15 (
    echo [ERROR] PostgreSQL did not become ready in time.
    pause
    exit /b 1
)
docker exec sap_postgres pg_isready -U sapuser -d sap_bills >nul 2>&1
if %errorlevel% neq 0 (
    echo       Waiting... attempt %retries%/15
    timeout /t 2 /nobreak >nul
    goto wait_pg
)
echo       PostgreSQL is ready. ✓
echo.

:: ── Step 4: Download JDBC Driver (if needed) ──────────────
echo [4/5] Checking PostgreSQL JDBC driver...
if not exist "tools\postgresql-jdbc.jar" (
    echo       Downloading PostgreSQL JDBC driver...
    powershell -Command "Invoke-WebRequest -Uri 'https://jdbc.postgresql.org/download/postgresql-42.7.3.jar' -OutFile 'tools\postgresql-jdbc.jar'" 2>nul
    if not exist "tools\postgresql-jdbc.jar" (
        echo [ERROR] Failed to download JDBC driver.
        echo         Please download manually from https://jdbc.postgresql.org/download/
        echo         Save as tools\postgresql-jdbc.jar
        pause
        exit /b 1
    )
    echo       JDBC driver downloaded. ✓
) else (
    echo       JDBC driver found. ✓
)
echo.

:: ── Step 5: Compile and Run ───────────────────────────────
echo [5/5] Compiling Java sources...

:: Create output directory
if not exist "newone\out" mkdir "newone\out"

:: Compile all Java sources
javac -cp "newone\src\main\java;tools\*" -d "newone\out" ^
    newone\src\main\java\projectsap\sap\bill\model\*.java ^
    newone\src\main\java\projectsap\sap\bill\main\*.java

if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    pause
    exit /b 1
)
echo       Compilation successful. ✓
echo.

:: ── Launch Server ─────────────────────────────────────────
echo   Starting SAP Bill Dashboard Server...

:: Open browser after 3 seconds
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8080"

:: Run the server
java -cp "newone\out;tools\jackson-databind.jar;tools\jackson-core.jar;tools\jackson-annotations.jar;tools\jackson-jsr310.jar;tools\javax-annotation.jar;tools\jackson-nullable.jar;tools\jsr305.jar;tools\postgresql-jdbc.jar" projectsap.sap.bill.main.BillServer

pause
