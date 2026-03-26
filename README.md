# Rotaract Attendance System - QR Based

A production-ready web application for managing QR-code based attendance at Rotaract events.

## Features Overview

### Phase 1: Project Setup ✅

- React + TypeScript + Vite
- Firebase Integration (Auth, Firestore)
- Tailwind CSS
- Admin Authentication (Login/Register)
- Protected Routes

### Phase 2: Coming Next

- Event Management (Create, Edit, QR Generation)
- QR Code Scanning
- Member Check-In
- Guest Check-In
- E-Card Generation

## Tech Stack

**Frontend:**

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router DOM (routing)
- Lucide React (icons)
- React Hot Toast (notifications)

**Backend:**

- Firebase Firestore (database)
- Firebase Authentication
- Firebase Functions (email service)
- Firebase Storage (images)

**QR Scanning:**

- html5-qrcode library

## Project Structure

```
/src
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── services/           # Business logic & API calls
│   └── firebase/
│       ├── firebase.ts
│       ├── firebase-config.ts
│       └── auth-service.ts
├── context/            # React Context (state management)
│   └── AuthContext.tsx
├── types/              # TypeScript interfaces
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── index.css           # Global styles & Tailwind
├── App.tsx             # Main App component
└── main.tsx            # Entry point

/public                 # Static assets

Configuration Files:
- vite.config.ts        # Vite configuration
- tailwind.config.js    # Tailwind CSS configuration
- postcss.config.js     # PostCSS configuration
- tsconfig.json         # TypeScript configuration
- .env.example          # Environment variables template
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Firebase Project (create at https://firebase.google.com)

### Step 1: Clone & Install

```bash
cd fellowgix
npm install
```

### Step 2: Configure Firebase

1. Create a Firebase project at https://firebase.google.com/console
2. Go to Project Settings → General
3. Copy the Firebase config object values
4. Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

5. Fill in your Firebase credentials in `.env.local`:

```
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value
```

### Step 3: Enable Firebase Services

In Firebase Console:

1. **Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password

2. **Firestore Database:**
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Database name: `(default)`

### Step 4: Create Test Admin Account

In Firebase Console → Firestore:

1. Create collection `admins`
2. Create a document with this structure:

```json
{
  "id": "user_id_from_auth",
  "email": "admin@example.com",
  "name": "Admin Name",
  "role": "admin",
  "createdAt": "2024-03-26",
  "isActive": true
}
```

Or use the app's registration flow after setting up auth.

### Step 5: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Default Routes

- `/` → Redirects to `/dashboard`
- `/login` → Admin login page (public)
- `/dashboard` → Admin dashboard (protected)

## Current Credentials (After Setup)

```
Email: admin@example.com
Password: (set during registration or directly in Firebase Console)
```

## Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

All Firebase credentials should be stored in `.env.local`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_USE_EMULATOR (optional, for local Firebase Emulator)
```

## Database Schema (Future Implementation)

### Collections:

- `users` - System accounts
- `admins` - Admin users
- `members` - Rotaract members
- `guests` - Event guests
- `events` - Event details
- `attendance` - Attendance records

## Next Steps

**Step 2: Event Management**

- Event creation form
- Event editing
- Event deletion
- Unique QR code generation per event
- Event listing and filtering

Wait for confirmation before proceeding to next step.

## Troubleshooting

### Port 5173 already in use:

```bash
npm run dev -- --port 3000
```

### Firebase credentials not loading:

- Check `.env.local` file exists
- Verify all required variables are set
- Restart dev server after adding env vars

### Authentication issues:

- Ensure Email/Password auth is enabled in Firebase Console
- Check that admins collection exists in Firestore
- Verify user document has correct `isActive` field

## Contact & Support

For issues or questions, refer to:

- Firebase Documentation: https://firebase.google.com/docs
- React Documentation: https://react.dev
- Vite Documentation: https://vitejs.dev

---

**Last Updated:** March 26, 2024
**Phase:** 1 - Project Setup
