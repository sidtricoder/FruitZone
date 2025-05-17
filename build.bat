::///////////////////////////////////////
:: Build script for Windows environments
::///////////////////////////////////////
@echo off
echo Building FruitZone project...

:: Install dependencies for the main project
echo Installing root dependencies...
call npm install

:: Install and build frontend
echo Installing frontend dependencies...
cd frontend
call npm install

echo Building frontend...
call npm run build

:: Go back to the root
cd ..

:: Install and build backend
echo Installing backend dependencies...
cd backend
call npm install

echo Building backend...
call npm run build

:: Go back to the root
cd ..

:: Done!
echo Build completed successfully!
exit /b 0
