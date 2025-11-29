@echo off
REM Quick test script for local Stripe webhook testing

echo.
echo ========================================
echo   Tech4Loop Stripe Webhook Test
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Error: .env.local not found
    pause
    exit /b 1
)

REM Run the webhook test
echo Testing payment_intent.succeeded webhook...
echo.
node scripts/test-stripe-webhook.js payment_intent.succeeded

echo.
pause
