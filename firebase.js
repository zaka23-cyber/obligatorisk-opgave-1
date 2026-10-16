import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDCdPYVJfz5lhOL2xZ8vPGxlBbZlIwu0js',
  authDomain: 'min-nye-app.firebaseapp.com',
  projectId: 'min-nye-app',
  storageBucket: 'min-nye-app.firebasestorage.app',
  messagingSenderId: '386308679754',
  appId: '1:386308679754:web:5adbfb6bc0961984e35eb3',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Projektet er på Spark. Storage kan aktiveres, når det er sat op i Firebase.
export const billederAktiveret = false;
