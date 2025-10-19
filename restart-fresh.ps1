# Restart Expo with Fresh Environment
# This ensures environment variables are properly loaded

Write-Host "🧹 Cleaning caches..." -ForegroundColor Yellow

# Stop any running Expo processes (user should do this manually with Ctrl+C)
Write-Host "⚠️  Please press Ctrl+C in your Expo terminal first!" -ForegroundColor Red
Write-Host "Then run this script again." -ForegroundColor Red
Read-Host "Press Enter after stopping Expo"

# Remove .expo cache
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
    Write-Host "✅ Removed .expo cache" -ForegroundColor Green
}

# Remove metro cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ Removed metro cache" -ForegroundColor Green
}

Write-Host "`n🚀 Starting Expo with clean cache..." -ForegroundColor Cyan
Write-Host "Watch the console output for Supabase connection status!`n" -ForegroundColor Cyan

# Start Expo with clean cache
npx expo start --clear

Write-Host "`n📋 What to look for:" -ForegroundColor Yellow
Write-Host "  ✅ Should see: 'Supabase configured successfully!'" -ForegroundColor Green
Write-Host "  ❌ If you see: 'Supabase credentials not configured!'" -ForegroundColor Red
Write-Host "     Then environment variables are not loading properly." -ForegroundColor Red

