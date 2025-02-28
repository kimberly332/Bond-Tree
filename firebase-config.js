// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDjeCUIj0xGoztxqLsWQ83XLHiPodp3fDU",
    authDomain: "kimberly332.github.io",
    projectId: "tree-bond",
    storageBucket: "tree-bond.firebasestorage.app",
    messagingSenderId: "432958508988",
    appId: "1:432958508988:web:14e8472cb51f63ce1825b9",
    measurementId: "G-LKY5BJ10B5"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);