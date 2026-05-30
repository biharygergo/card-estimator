import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import {
  Analytics,
  initializeAnalytics,
  isSupported,
} from 'firebase/analytics';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
export const firestore = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
});
export const functions = getFunctions(firebaseApp, 'europe-west1');
export const storage = getStorage(firebaseApp);

let _analytics: Analytics | null = null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (_analytics) {
    return _analytics;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  if (!(await isSupported())) {
    return null;
  }
  _analytics = initializeAnalytics(firebaseApp, {
    config: { cookie_flags: 'SameSite=None;Secure' },
  });
  return _analytics;
}

if (environment.useEmulators) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', {
    disableWarnings: true,
  });
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
