import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth, getReactNativePersistence, signInAnonymously } from 'firebase/auth';
import { app } from './firebase';

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  if (error.code !== 'auth/already-initialized') throw error;
  auth = getAuth(app);
}

// Telefonen husker gæsten, så de samme noter hentes efter genstart.
export async function hentGaest() {
  await auth.authStateReady();
  return auth.currentUser || (await signInAnonymously(auth)).user;
}
