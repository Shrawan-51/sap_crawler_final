@echo off
title SAP Unit and API Tests
echo ==================================================================
echo   SAP Unit Tests and API Test Runner (Maven)
echo ==================================================================
echo.

:: 1. Resolve Maven Command
set "MVN_CMD=mvn"
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.3.2\plugins\maven\lib\maven3\bin\mvn.cmd" (
        set "MVN_CMD=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.3.2\plugins\maven\lib\maven3\bin\mvn.cmd"
    ) else (
        echo [ERROR] Maven not found in PATH or IntelliJ directory.
        pause
        exit /b 1
    )
)

:: 2. Choose Mode
if "%~1"=="runner" (
    echo Running Unified Real-Time API Test Runner (MainApiTestRunner)...
    echo.
    call "%MVN_CMD%" exec:java "-Dexec.mainClass=projectsap.sap.MainApiTestRunner" "-Dexec.classpathScope=test"
) else (
    echo Running all JUnit 5 and Mockito Unit Tests...
    echo.
    call "%MVN_CMD%" test
)

echo.
pause
