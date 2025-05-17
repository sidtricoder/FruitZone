# This script helps to run the frontend in development mode independently
Write-Host "Running FruitZone Frontend Development Server" -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start development server
Write-Host "Starting development server..." -ForegroundColor Yellow
npm run dev
