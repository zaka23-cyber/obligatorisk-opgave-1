import { getAuth, signInAnonymously } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

export async function hentGaest() {
  await auth.authStateReady();
  return auth.currentUser || (await signInAnonymously(auth)).user;
}
