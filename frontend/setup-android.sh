#!/bin/bash

echo "🚀 Setting up SkillLink for Android deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "⚠️  Java is not installed. Please install Java JDK 11+ for Android development."
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building web app..."
npm run build

echo "📱 Initializing Capacitor..."
npx cap init SkillLink com.skilllink.app dist --web-dir=dist

echo "🤖 Adding Android platform..."
npx cap add android

echo "🔄 Syncing web assets to Android..."
npx cap sync

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Android Studio if you haven't already"
echo "2. Open Android Studio"
echo "3. Run: npm run android (or npx cap open android)"
echo "4. Configure your backend API URL in .env.production"
echo ""
echo "For detailed instructions, see ANDROID_DEPLOYMENT.md"

