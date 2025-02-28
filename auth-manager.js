import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
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
const auth = getAuth(app);
const db = getFirestore(app);

class AuthManager {
  constructor() {
    // Set up auth state listener
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their data
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            window.currentUser = userDoc.data();
            window.currentUser.id = user.uid;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // User is signed out
        window.currentUser = null;
      }
    });
  }

  async signup(name, email, password) {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData = {
        id: user.uid,
        name,
        email,
        friends: [],
        savedMoods: []
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Set current user
      window.currentUser = userData;

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        console.log("Email already in use");
      }
      
      return false;
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        window.currentUser = userDoc.data();
        window.currentUser.id = user.uid;
        return true;
      } else {
        console.error("User document not found");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        console.log("Incorrect password");
      } else if (error.code === 'auth/user-not-found') {
        console.log("No user found with this email");
      }
      
      return false;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      window.currentUser = null;
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }

  async addFriend(friendEmail) {
    if (!window.currentUser) return false;

    try {
      // Find friend's user document
      const friendQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', friendEmail))
      );

      if (friendQuery.empty) {
        console.log("No user found with this email");
        return false;
      }

      // Get the first matching user (assuming emails are unique)
      const friendDoc = friendQuery.docs[0];
      
      // Check if already a friend
      if (window.currentUser.friends.includes(friendEmail)) {
        console.log("User is already a friend");
        return false;
      }

      // Update current user's friends
      const userRef = doc(db, 'users', window.currentUser.id);
      await updateDoc(userRef, {
        friends: arrayUnion(friendEmail)
      });

      // Refresh current user data
      const updatedUserDoc = await getDoc(userRef);
      window.currentUser = updatedUserDoc.data();
      window.currentUser.id = userRef.id;

      return true;
    } catch (error) {
      console.error("Add friend error:", error);
      return false;
    }
  }

  getFriends() {
    if (!window.currentUser) return [];
    return window.currentUser.friends || [];
  }

  async saveMood(moods, notes = '') {
    if (!window.currentUser) return false;

    try {
      const now = new Date();
      
      // Format the date as MM/DD
      const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;
      
      // Format the time as HH:MM AM/PM
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedTime = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

      // Create mood entry
      const moodEntry = {
        date: formattedDate,
        time: formattedTime,
        timestamp: now.getTime(),
        moods: [...moods],
        notes: notes.trim()
      };

      // Update user document
      const userRef = doc(db, 'users', window.currentUser.id);
      await updateDoc(userRef, {
        savedMoods: arrayUnion(moodEntry)
      });

      // Refresh current user data
      const updatedUserDoc = await getDoc(userRef);
      window.currentUser = updatedUserDoc.data();
      window.currentUser.id = userRef.id;

      return true;
    } catch (error) {
      console.error("Error saving mood:", error);
      return false;
    }
  }

  getSavedMoods() {
    if (!window.currentUser) return [];
    return window.currentUser.savedMoods || [];
  }

  async getFriendsData() {
    if (!window.currentUser) return [];

    try {
      const friendEmails = window.currentUser.friends || [];
      const friendsData = [];

      // Fetch data for each friend
      for (const friendEmail of friendEmails) {
        const friendQuery = await getDocs(
          query(collection(db, 'users'), where('email', '==', friendEmail))
        );

        if (!friendQuery.empty) {
          const friendDoc = friendQuery.docs[0];
          const friendData = friendDoc.data();

          // Create a safe copy without sensitive information
          const safeFriendData = {
            id: friendDoc.id,
            name: friendData.name,
            email: friendData.email,
            savedMoods: friendData.savedMoods || []
          };

          friendsData.push(safeFriendData);
        }
      }

      return friendsData;
    } catch (error) {
      console.error("Error getting friends data:", error);
      return [];
    }
  }
}

// Expose the class and initialize sample users function
window.AuthManager = AuthManager;

// Sample users initialization (optional, as Firebase handles user creation)
function initializeSampleUsers() {
  const authManager = new AuthManager();
  
  // This is just a placeholder. In Firebase, users are created through signup
  console.log("Sample users initialization is handled by Firebase Authentication");
}

window.initializeSampleUsers = initializeSampleUsers;

// Call initialization
initializeSampleUsers();

export default AuthManager;