# Firestore Database Setup Guide

## Overview

This guide explains how to set up and manage the Firebase Firestore database for the Rotaract Attendance System.

## Database Collections

The application uses the following Firestore collections:

### 1. **admins** - Administrator Users

Stores admin user accounts who can manage events and members.

**Schema:**

```typescript
{
  id: string;                    // Firebase UID
  email: string;                 // Admin email
  name: string;                  // Admin name
  role: 'super_admin' | 'admin'; // Admin role
  createdAt: Timestamp;          // Account creation date
  lastLogin?: Timestamp;         // Last login timestamp
  isActive: boolean;             // Account status
}
```

**Permissions:**

- Read: Admins only
- Write: Super admins only
- Create: During registration

---

### 2. **members** - Rotaract Members

Stores information about active Rotaract members.

**Schema:**

```typescript
{
  id: string; // Auto-generated document ID
  name: string; // Member full name
  email: string; // Member email
  phone: string; // Contact phone
  memberId: string; // Rotaract membership ID
  club: string; // Rotaract club name
  joinDate: Timestamp; // Date member joined
  isActive: boolean; // Account status
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Permissions:**

- Read: Public (for check-in)
- Create: Admins only
- Update: Admins only
- Delete: Super admins only

---

### 3. **events** - Rotaract Events

Stores event information and QR codes for attendance tracking.

**Schema:**

```typescript
{
  id: string;          // Auto-generated document ID
  title: string;       // Event title
  description: string; // Event description
  date: Timestamp;     // Event date/time
  location: string;    // Event location
  qrCode: string;      // QR code data URL
  status: 'upcoming' | 'active' | 'completed';
  maxAttendees?: number;
  createdBy: string;   // Admin UID who created event
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Permissions:**

- Read: Public
- Create: Admins only
- Update: Admins only
- Delete: Super admins only

---

### 4. **attendance** - Attendance Records

Tracks members and guests checking into events.

**Schema:**

```typescript
{
  id: string;           // Auto-generated document ID
  eventId: string;      // Reference to event
  memberId?: string;    // Reference to member (if member check-in)
  memberEmail: string;  // Email of attendee
  memberName: string;   // Name of attendee
  checkInTime: Timestamp;
  checkInType: 'member' | 'guest';
  ipAddress?: string;
  createdAt: Timestamp;
}
```

**Permissions:**

- Read: Public (admins can view analytics)
- Create: Public (anyone can check in via QR code)
- Update: Admins only
- Delete: Super admins only

---

### 5. **guests** - Guest Attendees

Tracks guest attendees who are not members.

**Schema:**

```typescript
{
  id: string; // Auto-generated document ID
  eventId: string; // Reference to event
  name: string; // Guest name
  email: string; // Guest email
  phone: string; // Guest phone
  guestType: "rotarian" | "rotaractor" | "non_rotaractor";
  checkInTime: Timestamp;
  isReturning: boolean; // Is this a returning guest?
  visitCount: number; // Number of visits
  createdAt: Timestamp;
}
```

**Permissions:**

- Read: Public
- Create: Public (during check-in)
- Update: Admins only
- Delete: Super admins only

---

## Setup Instructions

### Step 1: Deploy Firestore Security Rules

From the project root, run:

```bash
firebase deploy --only firestore:rules
```

This deploys the security rules defined in `firestore.rules`.

### Step 2: Initialize Collections (Optional)

The collections are created automatically when documents are added. However, you can initialize them with sample data using the `FirestoreInitService`:

```typescript
import FirestoreInitService from "@services/firebase/firestore-init-service";

// Initialize database with empty collections
await FirestoreInitService.initializeSampleData();

// Get database statistics
const stats = await FirestoreInitService.getDatabaseStats();
console.log(stats);
```

### Step 3: Create Your First Admin User

**Via Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (fellowgix)
3. Navigate to **Firestore Database** → **Collections**
4. Create a new collection: `admins`
5. Add the first admin document manually:

```json
{
  "email": "your-email@example.com",
  "name": "Your Name",
  "role": "super_admin",
  "createdAt": "2026-03-26T00:00:00Z",
  "isActive": true
}
```

**Via Application:**
Use the registration flow to create admin accounts if already set up.

### Step 4: Add Members

Members can be added via the admin dashboard:

1. Navigate to `/events` (requires admin login)
2. Use the member management interface
3. Or use the `MemberService`:

```typescript
import { MemberService } from "@services/firebase/member-service";

const memberService = new MemberService();
await memberService.createMember({
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  memberId: "R12345",
  club: "Rotaract Club Name",
});
```

### Step 5: Create Your First Event

1. Login as admin
2. Navigate to `/events/create`
3. Fill in event details and submit
4. The system will auto-generate a QR code

---

## Firestore Indexes

Firestore may need indexes for queries with multiple conditions. The system will suggest creating indexes automatically if needed. Check the Firebase Console under **Firestore** → **Indexes** to see any pending index creation messages.

### Suggested Indexes:

**For member search queries:**

- Collection: `members`
- Fields: `name` (Ascending), `isActive` (Ascending)
- Fields: `email` (Ascending), `isActive` (Ascending)

**For attendance analytics:**

- Collection: `attendance`
- Fields: `eventId` (Ascending), `checkInTime` (Descending)

**For guest tracking:**

- Collection: `guests`
- Fields: `email` (Ascending), `visitCount` (Descending)

---

## Security Rules Explanation

The `firestore.rules` file defines access control:

### Key Principles:

1. **Public Read Access**: Everyone can read member, event, attendance, and guest data
   - Allows check-in via QR code without authentication
   - Enables public event discovery

2. **Admin-Only Write Access**: Only authenticated admins can create/update/delete events and members
   - Prevents unauthorized data modification
   - Maintains data integrity

3. **Public Check-In**: Anyone can create attendance and guest records
   - Enables QR code scanning without login
   - Automatic record creation on check-in

4. **Default Deny**: All other access is denied
   - Secure by default
   - Only explicitly allowed operations are permitted

---

## Firestore Costs

⚠️ **Important:** Firestore pricing is based on:

- **Read operations**: Each document read
- **Write operations**: Each document write/update
- **Delete operations**: Each document delete
- **Storage**: Data stored in database

**Daily Limits (Free Tier):**

- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

Optimize queries to minimize reads. For high-traffic applications, consider implementing:

- Query caching
- Pagination
- Limiting document fields in queries

---

## Troubleshooting

### Collections Not Appearing in Console

**Solution:** Collections only appear in the Firebase Console after the first document is added. They are created dynamically.

### "Missing or insufficient permissions" Error

**Solution:** Review the security rules in `firestore.rules`. Ensure:

1. You're authenticated if required
2. Admin credentials are properly verified
3. The rule allows the attempted operation

### Slow Queries

**Solution:** Check if Firestore is suggesting index creation. Create indexes as prompted in the Console under **Firestore** → **Indexes**.

---

## Database Utilities

### Get Database Statistics

```typescript
import FirestoreInitService from "@services/firebase/firestore-init-service";

const stats = await FirestoreInitService.getDatabaseStats();
console.log(stats);
// Output:
// {
//   timestamp: Date,
//   collections: [
//     { name: 'admins', documentCount: 2, description: '...' },
//     { name: 'members', documentCount: 45, description: '...' },
//     ...
//   ],
//   totalDocuments: 150
// }
```

### Check if Collection Exists

```typescript
const exists = await FirestoreInitService.collectionExists("members");
console.log(exists); // true or false
```

### Get Schema Information

```typescript
const schema = FirestoreInitService.getSchema("members");
console.log(schema);
// {
//   name: 'members',
//   description: '...',
//   example: { ... }
// }
```

---

## Next Steps

1. ✅ Deploy security rules: `firebase deploy --only firestore:rules`
2. ✅ Create initial admin user via Firebase Console
3. ✅ Add members via admin dashboard
4. ✅ Create first event and test QR code check-in
5. ✅ Monitor Firestore usage in Firebase Console

For more information, visit:

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
