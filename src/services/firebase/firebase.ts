import { connectAuthEmulator, browserLocalPersistence, browserSessionPersistence, getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase-config';

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const authReady = (async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      await setPersistence(auth, inMemoryPersistence);
    }
  }
})();

// Connect to emulators in development (optional)
if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulators already connected
  }
}

export default app;
