# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Backup Firestore
./scripts/backup-firestore.sh fellowgix
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ProtectedRoute.tsx   # Route protection wrapper
│   └── ErrorBoundary.tsx    # Error boundary wrapper
├── config/              # Configuration files
│   └── firebase-config.ts   # Firebase setup
├── context/             # React context for state management
│   ├── AuthContext.tsx      # Auth provider
│   └── useAuth.ts           # Auth hook
├── pages/               # Page components (one per route)
├── services/            # Business logic & API calls
│   ├── firebase/            # Firebase services
│   ├── qrcode/              # QR code generation
│   ├── ecard/               # E-card generation
│   ├── logger.ts            # Logging service
│   └── index.ts             # Barrel exports
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── api-response.ts      # API validation
│   ├── constants.ts         # App constants
│   ├── validators.ts        # Validation functions
│   └── index.ts             # Barrel exports
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Code Standards

### Imports

Use barrel imports for cleaner code:

```typescript
// ✅ Good
import { logger } from "@services";
import { isValidEmail } from "@utils";

// ❌ Avoid
import { logger } from "@services/logger";
import { isValidEmail } from "@utils/validators";
```

### Error Handling

Use the centralized logger:

```typescript
// ✅ Good
import { logger } from "@services";
try {
  await someOperation();
} catch (error) {
  logger.error("Operation failed", error);
}

// ❌ Avoid
console.error("Operation failed", error);
```

### Validation

Use validator utilities:

```typescript
// ✅ Good
import { isValidEmail, isValidPassword } from "@utils";
if (isValidEmail(email) && isValidPassword(password)) {
  // proceed
}

// ❌ Avoid
if (email.includes("@") && password.length > 5) {
  // proceed
}
```

### Constants

Use constants file instead of magic strings:

```typescript
// ✅ Good
import { ADMIN_ROLES, ERROR_MESSAGES } from "@utils";
const allowedRoles = ADMIN_ROLES;

// ❌ Avoid
const allowedRoles = ["super_admin", "club_admin"];
```

### Type Safety

Always export and use types from the types barrel:

```typescript
// ✅ Good
import { Admin, Event, Attendance } from "@types";

// ❌ Avoid
import { Admin } from "@services/firebase/auth-service";
```

## Common Tasks

### Adding a New Service

1. Create service file in `src/services/`
2. Export from `src/services/index.ts`
3. Use logger for debugging
4. Add type definitions in `src/types/`

```typescript
// src/services/example-service.ts
import { logger } from "./logger";

export const exampleService = {
  async getData() {
    try {
      const data = await fetchSomething();
      logger.info("Data fetched successfully");
      return data;
    } catch (error) {
      logger.error("Failed to fetch data", error);
      throw error;
    }
  },
};
```

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add TypeScript types
4. Use protected route if needed

```typescript
// src/pages/NewPage.tsx
import { useAuth } from '@context/useAuth';
import { logger } from '@services';
import React from 'react';

const NewPage: React.FC = () => {
  const { currentAdmin } = useAuth();

  React.useEffect(() => {
    logger.info('NewPage mounted', { adminId: currentAdmin?.id });
  }, [currentAdmin]);

  return <div>Your content</div>;
};

export default NewPage;
```

### Adding Form Validation

```typescript
import { isValidEmail, isValidPassword } from "@utils";
import { ERROR_MESSAGES } from "@utils";

const validateForm = (email: string, password: string): string | null => {
  if (!isValidEmail(email)) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }
  if (!isValidPassword(password)) {
    return "Password must be at least 6 characters";
  }
  return null;
};
```

## Testing

### Running Tests

```bash
npm test
```

### Creating Tests

1. Create `.test.ts` or `.test.tsx` files
2. Use your preferred testing framework
3. Test utilities thoroughly (validators, API handlers)
4. Test component behaviors

### Testing Logger

```typescript
import { logger } from "@services";

logger.info("Test message");
const logs = logger.getLogs();
console.log(logs); // View all logs
logger.clearLogs();
```

## Performance Tips

1. **Lazy Load Components**: Heavy pages are already lazy loaded
2. **Use Constants**: Reduces object recreation
3. **Memoize Expensive Calculations**: Use `React.useMemo`
4. **Lazy Load Routes**: Use `React.lazy()` with `Suspense`

## Debugging

### View Application Logs

```typescript
// In browser console
import { logger } from "@services";
logger.getLogs();
```

### View Error Details

- Error Boundary shows detailed error info in development
- Check browser DevTools console for color-coded logs
- Use `logger.error()` for better error tracking

## Environment Variables

Required variables in `.env.local`:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_USE_EMULATOR=false # Set to true for local testing
```

## Useful Links

- [React Documentation](https://react.dev)
- [Firebase Web SDK](https://firebase.google.com/docs/web)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Issues

```bash
# Verify env file exists
ls -la .env.local

# Check env variables are loaded
# In browser console: console.log(import.meta.env)
```

### Type Errors

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Check for unused variables
npm run lint
```
