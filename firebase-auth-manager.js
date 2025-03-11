/**
 * Firebase Authentication Manager
 * 
 * A comprehensive module for handling authentication operations including:
 * - User signup, login, and logout
 * - Email verification and password reset
 * - Session management and persistence
 * - User profile updates
 * - Authentication state monitoring
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase instances for other modules
export { auth, db };

/**
 * FirebaseAuthManager Class
 * Manages all authentication-related operations
 */
class FirebaseAuthManager {
  constructor() {
    this.currentUser = null;
    this.userDataCache = null;
    this.authStateListeners = [];
    
    // Set up auth state listener
    this.unsubscribeFromAuth = onAuthStateChanged(auth, this.handleAuthStateChange.bind(this));
    
    // Set default persistence to local (survive browser restart)
    this.setPersistence('local');
  }
  
  /**
   * Handle authentication state changes
   * @param {Object} user - Firebase user object
   * @private
   */
  async handleAuthStateChange(user) {
    if (user) {
      console.log("Auth state changed: User signed in", user.email);
      this.currentUser = user;
      
      // Load user document from Firestore
      try {
        await this.loadUserData();
      } catch (error) {
        console.error("Error loading user data:", error);
      }
      
      // Notify listeners
      this._notifyListeners({
        type: 'sign-in',
        user: this.currentUser,
        userData: this.userDataCache
      });
    } else {
      console.log("Auth state changed: User signed out");
      this.currentUser = null;
      this.userDataCache = null;
      
      // Notify listeners
      this._notifyListeners({
        type: 'sign-out'
      });
    }
  }
  
  /**
   * Load user data from Firestore
   * @private
   */
  async loadUserData() {
    if (!this.currentUser) return null;
    
    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        this.userDataCache = {
          ...userDoc.data(),
          id: this.currentUser.uid
        };
        return this.userDataCache;
      } else {
        console.warn("User document doesn't exist. Creating a new document.");
        
        // Create user document if it doesn't exist
        const userData = {
          username: null,
          email: this.currentUser.email,
          name: this.currentUser.displayName || '',
          friends: [],
          savedMoods: [],
          friendRequests: [],
          sentFriendRequests: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, userData);
        
        this.userDataCache = {
          ...userData,
          id: this.currentUser.uid
        };
        
        return this.userDataCache;
      }
    } catch (error) {
      console.error("Detailed error loading user data:", {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      // Provide more specific error handling
      if (error.code === 'permission-denied') {
        console.warn('Permission denied. Check Firestore security rules.');
        
        // Optional: Attempt to create user document if it doesn't exist
        try {
          const userData = {
            username: null,
            email: this.currentUser.email,
            name: this.currentUser.displayName || '',
            friends: [],
            savedMoods: [],
            friendRequests: [],
            sentFriendRequests: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(doc(db, 'users', this.currentUser.uid), userData);
          console.log('User document created successfully');
        } catch (createError) {
          console.error('Failed to create user document:', createError);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Add auth state change listener
   * @param {Function} listener - Callback function for auth state changes
   * @returns {Function} Function to remove the listener
   */
  addAuthStateListener(listener) {
    this.authStateListeners.push(listener);
    
    // Return function to remove this listener
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify auth state listeners
   * @param {Object} event - Auth state event object
   * @private
   */
  _notifyListeners(event) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in auth state listener:", error);
      }
    });
  }
  
  /**
   * Set authentication persistence
   * @param {string} persistenceType - 'local' or 'session'
   */
  async setPersistence(persistenceType) {
    try {
      const persistence = persistenceType === 'session' 
        ? browserSessionPersistence 
        : browserLocalPersistence;
      
      await setPersistence(auth, persistence);
      console.log(`Auth persistence set to: ${persistenceType}`);
    } catch (error) {
      console.error("Error setting auth persistence:", error);
      throw error;
    }
  }
  
  /**
   * Sign up a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} username - User's desired username
   * @param {string} displayName - User's display name
   * @param {boolean} sendVerification - Whether to send verification email
   * @returns {Promise<Object>} Result object with success status and user data
   */
  async signUp(email, password, username, displayName, sendVerification = true) {
    try {
      // Validate inputs
      if (!email || !password || !username) {
        return {
          success: false,
          error: "Missing required fields: email, password, and username are required"
        };
      }
      
      // Check username format
      if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        return {
          success: false,
          error: "Username must be 3-15 characters and contain only letters, numbers, and underscores"
        };
      }
      
      // Check if username is available
      const isAvailable = await this.checkUsernameAvailability(username);
      if (!isAvailable) {
        return {
          success: false,
          error: "Username is already taken"
        };
      }
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName || username
      });
      
      // Send verification email if requested
      if (sendVerification) {
        await sendEmailVerification(user);
      }
      
      // Create user document in Firestore
      const userData = {
        email: email,
        username: username,
        displayName: displayName || username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        friends: [],
        savedMoods: [],
        friendRequests: [],
        sentFriendRequests: []
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Update cache
      this.userDataCache = {
        ...userData,
        id: user.uid
      };
      
      return {
        success: true,
        user: user,
        userData: this.userDataCache
      };
    } catch (error) {
      console.error("Error signing up:", error);
      
      return {
        success: false,
        error: this._getAuthErrorMessage(error)
      };
    }
  }
  
  /**
   * Sign in an existing user
   * @param {string} identifier - Email or username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Result object with success status and user data
   */
  async signIn(identifier, password) {
    try {
      let email = identifier;
      
      // Check if identifier is a username
      if (!identifier.includes('@')) {
        // Query Firestore to find user by username
        const emailFromUsername = await this._getEmailFromUsername(identifier);
        if (!emailFromUsername) {
          return {
            success: false,
            error: "No user found with this username"
          };
        }
        email = emailFromUsername;
      }
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Load user data
      await this.loadUserData();
      
      return {
        success: true,
        user: user,
        userData: this.userDataCache
      };
    } catch (error) {
      console.error("Error signing in:", error);
      
      return {
        success: false,
        error: this._getAuthErrorMessage(error)
      };
    }
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<Object>} Result object with success status
   */
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send password reset email
   * @param {string} email - User's email
   * @returns {Promise<Object>} Result object with success status
   */
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Error sending password reset:", error);
      
      return {
        success: false,
        error: this._getAuthErrorMessage(error)
      };
    }
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Result object with success status and updated user data
   */
  async updateUserProfile(profileData) {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        return {
          success: false,
          error: "No authenticated user"
        };
      }
      
      // Update Firebase Auth profile if display name or photo URL is provided
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(user, {
          displayName: profileData.displayName || user.displayName,
          photoURL: profileData.photoURL || user.photoURL
        });
      }
      
      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      
      // Only include valid fields to update
      const updateData = {};
      const allowedFields = ['displayName', 'bio', 'phoneNumber', 'location', 'preferences'];
      
      for (const field of allowedFields) {
        if (field in profileData) {
          updateData[field] = profileData[field];
        }
      }
      
      // Add timestamp
      updateData.updatedAt = new Date().toISOString();
      
      // Update document
      await updateDoc(userDocRef, updateData);
      
      // Refresh user data cache
      await this.loadUserData();
      
      return {
        success: true,
        userData: this.userDataCache
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if a username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} Whether the username is available
   */
  async checkUsernameAvailability(username) {
    try {
      // Query Firestore for users with this username
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('username', '==', username))
      );
      
      return snapshot.empty;
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  }
  
  /**
   * Get email address from username
   * @param {string} username - Username to look up
   * @returns {Promise<string|null>} Email address or null if not found
   * @private
   */
  async _getEmailFromUsername(username) {
    try {
      // Query Firestore for user with this username
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('username', '==', username))
      );
      
      if (snapshot.empty) {
        return null;
      }
      
      // Get the first matching document
      const userDoc = snapshot.docs[0];
      return userDoc.data().email;
    } catch (error) {
      console.error("Error getting email from username:", error);
      throw error;
    }
  }
  
  /**
   * Get user-friendly error message for auth errors
   * @param {Error} error - Firebase auth error
   * @returns {string} User-friendly error message
   * @private
   */
  _getAuthErrorMessage(error) {
    const errorMap = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/operation-not-allowed': 'This operation is not allowed.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid login credentials.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.'
    };
    
    return errorMap[error.code] || error.message || 'An unknown error occurred.';
  }
  
  /**
   * Get current user's data
   * @returns {Object|null} User data or null if not authenticated
   */
  getUserData() {
    return this.userDataCache;
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether a user is currently authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }
  
  /**
   * Refresh user data from Firestore
   * @returns {Promise<Object|null>} Updated user data or null if not authenticated
   */
  async refreshUserData() {
    return await this.loadUserData();
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.unsubscribeFromAuth) {
      this.unsubscribeFromAuth();
      this.unsubscribeFromAuth = null;
    }
    
    this.currentUser = null;
    this.userDataCache = null;
    this.authStateListeners = [];
  }
}

// Create and export a singleton instance
const firebaseAuthManager = new FirebaseAuthManager();
export default firebaseAuthManager;