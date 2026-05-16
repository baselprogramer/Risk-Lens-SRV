#!/bin/bash

# Define paths as variables for easier maintenance
FRONTEND_PATH="/var/www/risk-lens/blacklist-ui/blacklist-ui"
STATIC_PATH="/var/www/risk-lens/src/main/resources/static"

echo "🚀 Starting the deployment process..."

# 1. Navigate to the Frontend directory
cd "$FRONTEND_PATH" || { echo "❌ Error: Directory $FRONTEND_PATH not found"; exit 1; }

# 2. Remove the old dist folder to ensure a clean build
echo "📦 Cleaning up old dist folder and building Frontend..."
sudo rm -rf dist

# 3. Build the project
sudo npm run build

# Check if the build command was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: npm run build failed. Script execution stopped."
    exit 1
fi

# 4. Clean the Java static resources directory (removes old cached assets)
echo "🧹 Cleaning up old static files in Java path..."
sudo rm -rf "$STATIC_PATH"/*

# 5. Ensure the target directory exists
mkdir -p "$STATIC_PATH"

# 6. Copy the new build files to the static folder
echo "🚚 Copying build files to $STATIC_PATH..."
sudo cp -r dist/* "$STATIC_PATH/"

echo "✅ Success! Frontend files have been deployed to Java static resources."
