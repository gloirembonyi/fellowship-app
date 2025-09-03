#!/bin/bash

# Quick script to copy fellowship-app to live server
# Run this from your local fellowship-app directory

echo "🚀 Copying fellowship-app to live server..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Temporary directory: $TEMP_DIR"

# Copy all necessary files
echo "📦 Preparing files..."
cp -r app/ "$TEMP_DIR/"
cp -r lib/ "$TEMP_DIR/"
cp -r components/ "$TEMP_DIR/"
cp -r public/ "$TEMP_DIR/"
cp -r prisma/ "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp next.config.js "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp middleware.ts "$TEMP_DIR/"

echo "📤 Uploading files to server..."
scp -P 5645 -r "$TEMP_DIR"/* gloire@197.243.28.38:~/fellowship-new/

echo "✅ Files uploaded successfully!"
echo ""
echo "🔧 Next steps on the server:"
echo "1. SSH to server: ssh -p 5645 gloire@197.243.28.38"
echo "2. Follow the MANUAL_LIVE_REPLACEMENT.md guide"
echo "3. Or run the deployment commands in the server"
echo ""
echo "📁 Files are now in ~/fellowship-new/ on the server"

# Clean up
rm -rf "$TEMP_DIR"
