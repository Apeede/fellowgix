#!/bin/bash

# Rotaract Attendance System - Firebase Firestore Setup Script
# This script helps deploy Firestore security rules and initialize the database

set -e

echo "================================"
echo "Firestore Database Setup Script"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✓ Firebase CLI found"
echo ""

# Check if firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo "❌ .firebaserc not found. Firebase project not initialized."
    echo "Run: firebase init"
    exit 1
fi

echo "✓ Firebase project configured"
echo ""

# Check if firestore.rules exists
if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules not found. Please check your project structure."
    exit 1
fi

echo "✓ Firestore rules found"
echo ""

# Deploy Firestore security rules
echo "Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✓ Security rules deployed successfully"
else
    echo "❌ Failed to deploy security rules"
    exit 1
fi

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Create your first admin user"
echo "   - Navigate to the application initialization page"
echo "   - Or create manually in Firebase Console"
echo ""
echo "2. Add members to the database"
echo "   - Use the admin dashboard after login"
echo "   - Or import from a CSV file"
echo ""
echo "3. Create your first event"
echo "   - Use the event creation form"
echo "   - QR code will be auto-generated"
echo ""
echo "For detailed documentation, see: FIRESTORE_SETUP.md"
echo ""
