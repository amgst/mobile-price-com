#!/bin/bash

# Production deployment script
echo "Starting production deployment..."

# Build the application
echo "Building frontend and backend..."
npm run build

# Start the production server
echo "Starting production server..."
npm run start