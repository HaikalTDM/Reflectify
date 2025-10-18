# Reflectify Development Server Starter
# Optimized for memory management with NativeWind 4.x

Write-Host "🌙 Starting Reflectify Development Server..." -ForegroundColor Cyan
Write-Host ""

# Set Node memory limit to 4GB to prevent out-of-memory crashes
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Disable CI mode for better interactivity
$env:CI=$null

Write-Host "✅ Memory limit set to 4GB" -ForegroundColor Green
Write-Host "✅ Metro workers limited to 2 (configured in metro.config.js)" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Starting Expo with tunnel..." -ForegroundColor Yellow
Write-Host ""

# Start Expo with clear cache and tunnel
npx expo start --clear --tunnel

