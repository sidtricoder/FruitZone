#!/usr/bin/env powershell
# test-backend.ps1 - Test backend API connectivity

Write-Host "🧪 Testing backend connectivity..." -ForegroundColor Cyan

# Get the backend URL from .env file
$envContent = Get-Content .\.env -Raw
$backendUrl = $envContent -match "VITE_BACKEND_URL= `"(.*)`"" | ForEach-Object { $matches[1] }

if (-not $backendUrl) {
    Write-Host "❌ Could not find backend URL in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Testing backend URL: $backendUrl" -ForegroundColor Yellow

# Test endpoints
$endpoints = @(
    "/",
    "/api",
    "/api/health",
    "/api/diagnostics",
    "/api/diagnostics/database"
)

foreach ($endpoint in $endpoints) {
    $url = "$backendUrl$endpoint"
    Write-Host "`nTesting endpoint: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction SilentlyContinue
        
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)`n"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
