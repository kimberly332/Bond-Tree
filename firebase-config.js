// Add to firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjeCUIj0xGoztxqLsWQ83XLHiPodp3fDU",
  authDomain: "tree-bond.firebaseapp.com",
  projectId: "tree-bond",
  storageBucket: "tree-bond.firebasestorage.app",
  messagingSenderId: "432958508988",
  appId: "1:432958508988:web:14e8472cb51f63ce1825b9",
  measurementId: "G-LKY5BJ10B5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize App Check (get your reCAPTCHA site key from Firebase console)
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdxyucqAAAAADpzRfHZEixTTiqxKzaYJRHQiQsN'),
  isTokenAutoRefreshEnabled: true,
  debug: {
    showUi: true,  // Shows a debug UI
    showInConsole: true  // Logs debug info to console
  }
});

export { auth, db };