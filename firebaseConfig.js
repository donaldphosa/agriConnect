// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbQNK81a4dg6px9AIK44owxZwX8bx14dQ",
  authDomain: "agriconnect-170dd.firebaseapp.com",
  projectId: "agriconnect-170dd",
  storageBucket: "agriconnect-170dd.appspot.com", // fixed typo: .firebasestorage.app -> .appspot.com
  messagingSenderId: "644514727662",
  appId: "1:644514727662:web:a30e79ccea70a96c5e15ff",
  measurementId: "G-QSDNZM8GHM"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// Initialize Firebase services
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);

export default app;
