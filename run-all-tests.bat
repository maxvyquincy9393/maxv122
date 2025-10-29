@echo off
REM MAXVY Bot - Run All Tests Script (Windows)
REM Version: 3.1.2

echo.
echo ====================================================
echo    MAXVY Bot - Running All Automated Tests
echo ====================================================
echo.

set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

echo [90m[%TIME%][0m Starting test suite...
echo.

REM Test 1: Intent Detection
echo.
echo ================================================
echo [96m Running: Intent Detection Test[0m
echo ================================================
if exist test-intent.js (
    node test-intent.js
    if %ERRORLEVEL% EQU 0 (
        echo [92m PASSED: Intent Detection Test[0m
        set /a PASSED_TESTS+=1
    ) else (
        echo [91m FAILED: Intent Detection Test[0m
        set /a FAILED_TESTS+=1
    )
    set /a TOTAL_TESTS+=1
) else (
    echo [93m SKIPPED: test-intent.js not found[0m
)

REM Test 2: Reminder Parser
echo.
echo ================================================
echo [96m Running: Reminder Parser Test[0m
echo ================================================
if exist test-reminder-parser.js (
    node test-reminder-parser.js
    if %ERRORLEVEL% EQU 0 (
        echo [92m PASSED: Reminder Parser Test[0m
        set /a PASSED_TESTS+=1
    ) else (
        echo [91m FAILED: Reminder Parser Test[0m
        set /a FAILED_TESTS+=1
    )
    set /a TOTAL_TESTS+=1
) else (
    echo [93m SKIPPED: test-reminder-parser.js not found[0m
)

REM Test 3: Edge Cases
echo.
echo ================================================
echo [96m Running: Edge Cases Test[0m
echo ================================================
if exist test-edge-cases.js (
    node test-edge-cases.js
    if %ERRORLEVEL% EQU 0 (
        echo [92m PASSED: Edge Cases Test[0m
        set /a PASSED_TESTS+=1
    ) else (
        echo [91m FAILED: Edge Cases Test[0m
        set /a FAILED_TESTS+=1
    )
    set /a TOTAL_TESTS+=1
) else (
    echo [93m SKIPPED: test-edge-cases.js not found[0m
)

REM Summary
echo.
echo ====================================================
echo    TEST SUMMARY
echo ====================================================
echo.
echo Total Tests Run: %TOTAL_TESTS%
echo [92mPassed: %PASSED_TESTS%[0m
echo [91mFailed: %FAILED_TESTS%[0m
echo.

if %FAILED_TESTS% EQU 0 (
    if %TOTAL_TESTS% GTR 0 (
        echo [92m====================================================
        echo    ALL TESTS PASSED! Bot is ready for production!
        echo ====================================================[0m
        echo.
        exit /b 0
    ) else (
        echo [93mNo tests were run. Please check test files exist.[0m
        exit /b 1
    )
) else (
    echo [91m====================================================
    echo    Some tests failed. Please review the results.
    echo ====================================================[0m
    echo.
    exit /b 1
)
