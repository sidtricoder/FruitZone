#!/bin/bash
# This script is used by Render to build the project

# Install dependencies for the main project
npm install

# Install frontend dependencies
cd frontend
npm install

# Build frontend
npm run build

# Go back to the root
cd ..

# Install backend dependencies
cd backend
npm install

# Build backend
npm run build

# Go back to the root
cd ..

# Done!
echo "Build completed successfully!"
