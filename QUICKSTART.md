# Rotaract Attendance System - Firestore Database Quick Start

## 🚀 Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# From project root
bash scripts/setup-firestore.sh
```

This script will:

1. ✓ Verify Firebase CLI is installed
2. ✓ Verify Firebase project configuration
3. ✓ Deploy Firestore security rules
4. ✓ Display next steps

### Option 2: Manual Setup

#### Step 1: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This deploys the security rules that control who can read/write data.

#### Step 2: Create First Admin User

**Option A: Via Application UI**

1. Start the development server: `npm run dev`
2. Navigate to `/admin-init` (if route is configured)
3. Fill in admin details and click "Create Admin"

**Option B: Via Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `fellowgix`
3. Go to **Firestore Database** → **Collections**
4. Click **+ Start collection**
5. Create collection: `admins`
6. Add first document with:
   ```json
   {
     "email": "your@email.com",
     "name": "Your Name",
     "role": "super_admin",
     "isActive": true,
     "createdAt": "2026-03-26T00:00:00Z"
   }
   ```

#### Step 3: Test Login

1. Navigate to [https://fellowgix.web.app/login](https://fellowgix.web.app/login)
2. Enter admin email and create account
3. You should be redirected to dashboard

---

## 📊 Database Schema

### Collections Overview

```
fellowgix (Firestore Database)
├── admins/                    # Admin users (read protected)
│   └── {uid}
│       ├── email: string
│       ├── name: string
│       ├── role: super_admin | admin
│       └── isActive: boolean
│
├── members/                   # Rotaract members (public read)
│   └── {doc_id}
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── memberId: string
│       ├── club: string
│       └── isActive: boolean
│
├── events/                    # Events (public read)
│   └── {doc_id}
│       ├── title: string
│       ├── description: string
│       ├── date: timestamp
│       ├── location: string
│       ├── qrCode: string (data URL)
│       ├── status: upcoming | active | completed
│       └── createdBy: string (admin uid)
│
├── attendance/                # Attendance records (public write)
│   └── {doc_id}
│       ├── eventId: string
│       ├── memberId: string (optional)
│       ├── memberEmail: string
│       ├── memberName: string
│       ├── checkInTime: timestamp
│       └── checkInType: member | guest
│
└── guests/                    # Guest attendees (public write)
    └── {doc_id}
        ├── eventId: string
        ├── name: string
        ├── email: string
        ├── phone: string
        ├── guestType: rotarian | rotaractor | non_rotaractor
        └── visitCount: number
```

---

## 🔐 Security Rules Summary

| Operation | Members  | Events   | Attendance | Guests   | Admins   |
| --------- | -------- | -------- | ---------- | -------- | -------- |
| Read      | ✓ Public | ✓ Public | ✓ Public   | ✓ Public | 🔒 Admin |
| Create    | 🔒 Admin | 🔒 Admin | ✓ Public   | ✓ Public | 🔒 Admin |
| Update    | 🔒 Admin | 🔒 Admin | 🔒 Admin   | 🔒 Admin | 🔒 Admin |
| Delete    | 🔒 Admin | 🔒 Admin | 🔒 Admin   | 🔒 Admin | 🔒 Admin |

**Legend:** ✓ = Allowed, 🔒 = Admin Only

---

## 📝 Common Tasks

### Add a Member

**Via Admin Dashboard:**

1. Login as admin
2. Navigate to dashboard or events page
3. Look for member management section
4. Click "Add Member"
5. Fill in details and submit

**Via Code:**

```typescript
import { MemberService } from "@services/firebase/member-service";

const service = new MemberService();
await service.createMember({
  name: "John Doe",
  email: "john@example.com",
  phone: "555-1234",
  memberId: "R12345",
  club: "Rotaract Club Name",
});
```

### Create an Event

**Via Admin Dashboard:**

1. Login as admin
2. Navigate to `/events`
3. Click "Create Event"
4. Fill in event details
5. Submit (QR code auto-generated)

### Check In a Member (QR Code)

1. Generate QR code from event details
2. Open `/scan` page
3. Allow camera access
4. Scan QR code
5. Select "Member" and search for member
6. Confirm check-in

### View Analytics

**Via Admin Dashboard:**

1. Login as admin
2. Go to `/events`
3. Click "Analytics" on an event
4. View attendance stats and member breakdown

---

## 🐛 Troubleshooting

### "Permission denied" Error

**Cause:** Firestore rules not deployed or authentication failed

**Solution:**

```bash
# Redeploy rules
firebase deploy --only firestore:rules

# Check authentication
# Ensure admin user exists in 'admins' collection
```

### Collections Not Visible in Console

**Cause:** Collections only appear after first document is created

**Solution:** Create first document via application or console

### Slow Queries

**Cause:** Missing database indexes

**Solution:**

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

Firestore will also suggest indexes in the console.

### Can't Create Admin User

**Issue:** "Missing or insufficient permissions"

**Solution:**

1. Go to Firebase Console
2. Go to **Firestore Database** → **Rules**
3. Temporarily relax rules for testing:
   ```
   match /{document=**} {
     allow read, write: if true;
   }
   ```
4. Create user
5. Restore security rules from `firestore.rules`
6. Redeploy: `firebase deploy --only firestore:rules`

---

## 💾 Backing Up Data

### Export Firestore Data

```bash
# Export all collections to JSON
firebase firestore:export ./backups --token $(firebase login:ci)
```

### Restore from Backup

```bash
# Restore from backup (use with caution)
firebase firestore:restore ./backups/2026-03-26T00:00:00_12345
```

---

## 📱 Testing Locally

### Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:5173`

### Test QR Code Flow

1. Create event with admin account
2. Open QR code from event details
3. Use `/scan` page to scan QR code
4. Complete check-in process

### Test Admin Features

1. Login as admin
2. Navigate to dashboard
3. Create event
4. View analytics
5. Download attendance CSV

---

## 🚀 Deploying to Production

### 1. Ensure All Setup Complete

```bash
# Verify Firestore rules are deployed
firebase deploy --only firestore:rules
```

### 2. Rebuild Application

```bash
npm run build
```

### 3. Deploy to Hosting

```bash
firebase deploy
```

This deploys both the web app and any updates to Firestore rules.

---

## 📚 Additional Resources

- [Firestore Setup Documentation](./FIRESTORE_SETUP.md)
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## ✅ Setup Checklist

- [ ] Run `bash scripts/setup-firestore.sh` OR deploy rules manually
- [ ] Create first admin user (Firebase Console or App)
- [ ] Test login at `fellowgix.web.app/login`
- [ ] Add test member
- [ ] Create test event
- [ ] Test QR code scan and check-in
- [ ] View analytics
- [ ] Download attendance report

---

**You're all set!** Your Firestore database is ready to accept data from the Rotaract Attendance System. 🎉
