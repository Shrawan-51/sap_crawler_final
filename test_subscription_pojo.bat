@echo off
title Test SAP Subscription Auto POJO Conversion
echo ==================================================================
echo   Running SAP Subscription Auto POJO Deserialization Test
echo ==================================================================
echo.

:: Resolve Maven Command
set "MVN_CMD=mvn"
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.3.2\plugins\maven\lib\maven3\bin\mvn.cmd" (
        set "MVN_CMD=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.3.2\plugins\maven\lib\maven3\bin\mvn.cmd"
    ) else (
        echo [ERROR] Maven not found.
        pause
        exit /b 1
    )
)

:: DB Configuration (loaded from .env if present)
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="DB_USER" if "%DB_USER%"=="" set "DB_USER=%%b"
        if "%%a"=="DB_PASS" if "%DB_PASS%"=="" set "DB_PASS=%%b"
        if "%%a"=="DB_NAME" if "%DB_NAME%"=="" set "DB_NAME=%%b"
    )
)
if "%DB_USER%"=="" set "DB_USER=postgres"
if "%DB_PASS%"=="" set "DB_PASS="
if "%DB_NAME%"=="" set "DB_NAME=sap_bills"

call "%MVN_CMD%" test-compile exec:java -Dexec.mainClass="projectsap.sap.subscription.TestSubscriptionAutoPojo" -Dexec.classpathScope="test" "-Ddb.user=%DB_USER%" "-Ddb.pass=%DB_PASS%" "-Ddb.name=%DB_NAME%"

pause
