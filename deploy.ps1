#!/usr/bin/env powershell
# deploy.ps1 - Script to deploy both frontend and backend

Write-Host "🚀 Starting deployment process for FruitZone" -ForegroundColor Green

# Step 1: Deploy the backend first
Write-Host "`n📦 Deploying backend to Vercel..." -ForegroundColor Cyan
cd backend

# Ensure environment variables are set
Write-Host "Setting environment variables..."
vercel env add SUPABASE_DB_URL "postgresql://postgres:MCiuDua8s1wrGjVj@db.nuxlqxfbsocgmszwktwt.supabase.co:5432/postgres" --scope sidtricoders-projects --yes
vercel env add JWT_SECRET "FPisgEdPYGalU7OGCwDnXywEHx3t7zqUPFU2idX5fCdZsuwWJyKtYf2nE4UyhvE8rNwtfK2cdLb3dq1ZxAEe2Q==" --scope sidtricoders-projects --yes
vercel env add NODE_ENV "production" --scope sidtricoders-projects --yes

# Deploy the backend
$backendDeployment = vercel --prod
$backendUrl = $backendDeployment -match "Production: (https://.*)" | ForEach-Object { $matches[1] }

Write-Host "Backend deployed to: $backendUrl" -ForegroundColor Green

# Step 2: Update frontend config with the new backend URL
Write-Host "`n✏️ Updating frontend configuration..." -ForegroundColor Cyan

# Update frontend/lib/config.ts
$configPath = "..\frontend\lib\config.ts"
$configContent = Get-Content $configPath -Raw
$updatedConfig = $configContent -replace "return '(https://[^']*)'", "return '$backendUrl'"
Set-Content -Path $configPath -Value $updatedConfig

# Update .env
$envPath = "..\.env"
(Get-Content $envPath) -replace "VITE_BACKEND_URL= `".*`"", "VITE_BACKEND_URL= `"$backendUrl`"" | Set-Content $envPath

# Update vercel.json in root directory
$vercelJsonPath = "..\vercel.json"
$vercelJson = Get-Content $vercelJsonPath | ConvertFrom-Json
$vercelJson.rewrites[0].destination = "$backendUrl/api/`$1"
$vercelJson | ConvertTo-Json -Depth 10 | Set-Content $vercelJsonPath

# Step 3: Deploy the frontend
Write-Host "`n📦 Deploying frontend to Render or Vercel..." -ForegroundColor Cyan

cd ..\frontend
vercel --prod

Write-Host "`n✅ Deployment complete! Your FruitZone application should now be running correctly." -ForegroundColor Green
