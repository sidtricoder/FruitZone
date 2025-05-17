:: This script helps to run the frontend independently
@echo off
echo Running FruitZone Frontend

:: Change to the frontend directory
cd %~dp0

:: Install dependencies
echo Installing dependencies...
call npm install

:: Build the application
echo Building the application...
call npm run build

:: Preview the built application
echo Starting preview server...
call npm run preview

pause
