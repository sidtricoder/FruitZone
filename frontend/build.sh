#!/bin/bash
# This script is used by Render to build the frontend only

echo "Building FruitZone Frontend..."

# Install dependencies
npm install

# Build the frontend
npm run build

echo "Frontend build completed successfully!"
