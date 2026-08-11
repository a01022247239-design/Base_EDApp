import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAtxb5PAmj5fiHxwe6HvyYPNO7Vhw7aGX8",
  authDomain: "h2uworks-924a0.firebaseapp.com",
  databaseURL: "https://h2uworks-924a0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "h2uworks-924a0",
  storageBucket: "h2uworks-924a0.firebasestorage.app",
  messagingSenderId: "1015505187433",
  appId: "1:1015505187433:web:f123762305614f85cee8f8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Helpers for syncing data with Firebase Realtime Database
export const syncWithFirebase = (path: string, data: any) => {
  try {
    const dbRef = ref(db, path);
    return set(dbRef, data);
  } catch (e) {
    console.error('Firebase save error:', e);
  }
};

export const subscribeToFirebase = (path: string, callback: (data: any) => void) => {
  try {
    const dbRef = ref(db, path);
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  } catch (e) {
    console.error('Firebase read error:', e);
  }
};
