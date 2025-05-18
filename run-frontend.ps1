# This script helps to run the frontend independently
Write-Host "Running FruitZone Frontend" -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
npm run build

# Preview the built application
Write-Host "Starting preview server..." -ForegroundColor Yellow
npm run preview
