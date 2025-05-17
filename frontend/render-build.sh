#!/bin/bash
# Build script for Render that avoids TypeScript errors with vite.config.ts

echo "Building FruitZone frontend for Render..."

# Install dependencies
npm install

# Run vite build directly without the TypeScript compile step
echo "Running direct Vite build..."
npx vite build --config vite.config.render.js

echo "Build completed!"
