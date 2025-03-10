/**
 * Auth Manager Module
 * 
 * This module handles user authentication, friend management, and mood tracking
 * for the Bond Tree application.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  collection, 
  where, 
  getDocs,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// =========================================================================
// Configuration and Initialization
// =========================================================================

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

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase instances
export { auth, db };

// =========================================================================
// Helper Classes
// =========================================================================

/**
 * Rate Limiter for API calls
 * Prevents abuse of API endpoints by limiting requests per user
 */
class RateLimiter {
  /**
   * @param {number} limit - Maximum number of requests allowed
   * @param {number} interval - Time interval in milliseconds
   */
  constructor(limit = 10, interval = 60000) {
    this.timestamps = {};
    this.limit = limit;
    this.interval = interval;
  }
  
  /**
   * Checks if a request is allowed for the given user
   * @param {string} userId - User identifier
   * @returns {boolean} Whether the request is allowed
   */
  isAllowed(userId) {
    const now = Date.now();
    
    // Initialize if first request
    if (!this.timestamps[userId]) {
      this.timestamps[userId] = [now];
      return true;
    }
    
    // Filter out old timestamps
    this.timestamps[userId] = this.timestamps[userId].filter(
      timestamp => now - timestamp < this.interval
    );
    
    // Check if under limit
    if (this.timestamps[userId].length < this.limit) {
      this.timestamps[userId].push(now);
      return true;
    }
    
    return false;
  }
}

// =========================================================================
// Utility Functions
// =========================================================================

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') return '';
  
  // Basic XSS protection
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Standardized error handling
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message
 * @returns {Object} Error response object
 */
function handleError(error, userMessage) {
  // Log the detailed error for developers
  console.error('Error:', error);
  
  // Return a user-friendly error message
  return {
    success: false,
    code: error.code || 'unknown-error',
    message: userMessage || 'An error occurred. Please try again.'
  };
}

/**
 * Generate CSRF token for security
 * @returns {string} The generated token
 */
function generateCsrfToken() {
  const token = Math.random().toString(36).substring(2) + 
                Math.random().toString(36).substring(2);
  sessionStorage.setItem('csrfToken', token);
  return token;
}

// =========================================================================
// Sample Data Initialization (Development Only)
// =========================================================================

/**
 * Initialize sample users for development environment
 * Should be removed in production
 */
export async function initializeSampleUsers() {
  try {
    // Check if there are any users in the database
    const usersQuery = await getDocs(collection(db, 'users'));
    
    if (usersQuery.empty) {
      const authManager = new AuthManager();
      
      // Create sample users
      await authManager.signup('John Doe', 'john@example.com', 'password123', 'johndoe');
      await authManager.signup('Jane Smith', 'jane@example.com', 'password456', 'janesmith');
      
      console.log('Sample users created successfully');
    }
  } catch (error) {
    console.error('Error initializing sample users:', error);
  }
}

// =========================================================================
// Main Auth Manager Class
// =========================================================================

/**
 * AuthManager handles all authentication and user-related operations
 */
export default class AuthManager {
  /**
   * Initialize the auth manager
   */
  constructor() {
    // Set up auth state listener
    this.currentUser = null;
    this.sessionHeartbeatInterval = null;
    
    // Create rate limiter instance
    this.apiRateLimiter = new RateLimiter(5, 10000); // 5 requests per 10 seconds
    
    // Initialize CSRF token if not exists
    if (!sessionStorage.getItem('csrfToken')) {
      generateCsrfToken();
    }
    
    // Set up Firebase auth state listener
    this.unsubscribeFromAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user document from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            this.currentUser = {
              ...userDoc.data(),
              id: user.uid,
              lastFetched: Date.now()
            };
            
            // Start tracking user session
            this.trackUserSession();
          } else {
            console.error("User document not found");
            this.currentUser = null;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          this.currentUser = null;
        }
      } else {
        // Cleanup on sign out
        this.clearSessionHeartbeat();
        this.currentUser = null;
      }
    });
  }
  
  // =========================================================================
  // Authentication Methods
  // =========================================================================
  
  /**
   * Verify user's authentication token
   * @returns {Promise<boolean>} Token validity status
   */
  async verifyIdToken() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      // Force token refresh if it's close to expiration
      const tokenResult = await currentUser.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      const currentTime = Date.now();
      
      // If token expires in less than 5 minutes, refresh it
      if (expirationTime - currentTime < 5 * 60 * 1000) {
        await currentUser.getIdToken(true);
      }
      
      return true;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }
  
  /**
   * Create a new user account
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} username - User's chosen username
   * @returns {Promise<Object>} Result object with success status and message
   */
  async signup(name, email, password, username) {
    try {
      // Validate inputs
      if (!name || !email || !password || !username) {
        return { 
          success: false, 
          message: 'Please fill in all required fields'
        };
      }
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        return { 
          success: false, 
          message: 'Username must be 3-15 characters and contain only letters, numbers, and underscores'
        };
      }
      
      // Verify that username is available
      const usernameAvailable = await this.checkUsernameAvailability(username);
      if (!usernameAvailable) {
        return { 
          success: false, 
          message: 'This username is already taken'
        };
      }
      
      // Create the Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      try {
        // Create the user document
        const userData = {
          id: user.uid,
          username: username,
          name: name,
          email: email,
          friends: [],
          savedMoods: [],
          friendRequests: [],
          createdAt: Date.now()
        };
    
        await setDoc(doc(db, 'users', user.uid), userData);
    
        // Set current user locally
        this.currentUser = userData;
        
        return { 
          success: true,
          message: 'Account created successfully'
        };
      } catch (error) {
        // If something went wrong after creating the auth user, delete it
        try {
          await user.delete();
        } catch (deleteError) {
          console.error("Error deleting user after failed signup:", deleteError);
        }
        
        console.error("Error creating user document:", error);
        
        return { 
          success: false, 
          message: 'Error creating user profile. Please try again.'
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Return user-friendly error message based on error code
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) 
      };
    }
  }
  
  /**
   * Get user-friendly error messages for authentication errors
   * @param {string} errorCode - Firebase error code
   * @returns {string} User-friendly error message
   */
  getErrorMessage(errorCode) {
    switch(errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Please provide a valid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/operation-not-allowed':
        return 'Account creation is currently disabled';
      default:
        return 'An error occurred during signup. Please try again.';
    }
  }
  
  /**
   * Log in an existing user with email or username
   * @param {string} identifier - Email or username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Result object with success status and message
   */
  async login(identifier, password) {
    try {
      // Apply rate limiting
      if (!this.apiRateLimiter.isAllowed('login')) {
        return { 
          success: false, 
          message: 'Too many login attempts. Please try again later.'
        };
      }
      
      // Determine if the identifier is an email by checking for @ symbol
      const isEmail = identifier.includes('@');
      let userEmail = identifier;
      
      // If the identifier is a username, we need to find the associated email
      if (!isEmail) {
        // Query Firestore to find the user with this username
        const usernameQuery = await getDocs(
          query(collection(db, 'users'), where('username', '==', identifier))
        );
        
        if (usernameQuery.empty) {
          return { 
            success: false, 
            message: 'Invalid username or password'
          };
        }
        
        // Get the email from the user document
        userEmail = usernameQuery.docs[0].data().email;
      }
      
      // Now sign in with the email
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;

      // Fetch user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        this.currentUser = {
          ...userDoc.data(),
          id: user.uid,
          lastFetched: Date.now()
        };
        
        // Start tracking user session
        this.trackUserSession();
        
        return { success: true };
      } else {
        console.error("User document not found");
        return { 
          success: false, 
          message: 'User data not found. Please contact support.'
        };
      }
    } catch (error) {
      return handleError(
        error,
        error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' 
          ? 'Invalid ' + (identifier.includes('@') ? 'email' : 'username') + ' or password' 
          : 'Login failed. Please try again.'
      );
    }
  }
  
  /**
   * Log out the current user
   * @returns {Promise<Object>} Result object with success status
   */
  async logout() {
    try {
      // Clear the session heartbeat
      this.clearSessionHeartbeat();
      
      // Clear session ID from storage
      localStorage.removeItem('sessionId');
      
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return handleError(error, 'Error logging out');
    }
  }

  // =========================================================================
  // User Profile Methods
  // =========================================================================
  
  /**
   * Check if a username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} Availability status
   */
  async checkUsernameAvailability(username) {
    try {
      const usernameQuery = await getDocs(
        query(
          collection(db, 'users'), 
          where('username', '==', username)
        )
      );
      
      return usernameQuery.empty;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  }

  // =========================================================================
  // Friend Management Methods
  // =========================================================================
  
  /**
   * Send a friend request
   * @param {string} friendIdentifier - Email or username of friend
   * @returns {Promise<Object>} Result object with success status and message
   */
  async sendFriendRequest(friendIdentifier) {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to send friend requests' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      // Apply rate limiting
      if (!this.apiRateLimiter.isAllowed(this.currentUser.id)) {
        return { success: false, message: 'Please wait before sending another friend request' };
      }
      
      // Sanitize input
      const sanitizedIdentifier = sanitizeUserInput(friendIdentifier);
      
      // Check if the input is an email or a username
      const isEmail = sanitizedIdentifier.includes('@');
      
      // Create the appropriate query based on the input type
      let friendQuery;
      if (isEmail) {
        // Search by email
        friendQuery = await getDocs(
          query(collection(db, 'users'), where('email', '==', sanitizedIdentifier))
        );
      } else {
        // Search by username
        friendQuery = await getDocs(
          query(collection(db, 'users'), where('username', '==', sanitizedIdentifier))
        );
      }
      
      if (friendQuery.empty) {
        return { 
          success: false, 
          message: 'No user found with this email or username'
        };
      }
      
      // Get the first matching user (assuming emails and usernames are unique)
      const friendDoc = friendQuery.docs[0];
      const friendData = friendDoc.data();
      const friendId = friendDoc.id;
      const friendEmail = friendData.email;
      
      // Cannot send friend request to yourself
      if (friendEmail === this.currentUser.email) {
        return { 
          success: false, 
          message: 'You cannot send a friend request to yourself'
        };
      }
      
      // Check if already a friend
      if (this.currentUser.friends && this.currentUser.friends.includes(friendEmail)) {
        return { 
          success: false, 
          message: 'This user is already in your friends list'
        };
      }
      
      // Check if a request is already pending FROM the current user
      const friendFriendRequests = friendData.friendRequests || [];
      if (friendFriendRequests.some(req => req.from === this.currentUser.email && req.status === 'pending')) {
        return { 
          success: false, 
          message: 'You already have a pending friend request to this user'
        };
      }
      
      // Check if a request is already pending TO the current user
      // This allows accepting the request instead of sending a new one
      const myFriendRequests = this.currentUser.friendRequests || [];
      const pendingRequestFromFriend = myFriendRequests.find(
        req => req.from === friendEmail && req.status === 'pending'
      );
      
      if (pendingRequestFromFriend) {
        // Auto-accept the pending request instead of sending a new one
        return await this.acceptFriendRequest(friendEmail);
      }
      
      // Create friend request object
      const friendRequest = {
        from: this.currentUser.email,
        fromName: this.currentUser.name || this.currentUser.username,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      // Add friend request to recipient's document
      const recipientRef = doc(db, 'users', friendId);
      await updateDoc(recipientRef, {
        friendRequests: arrayUnion(friendRequest)
      });
      
      // Also track the sent request in the sender's document
      const userRef = doc(db, 'users', this.currentUser.id);
      const sentRequest = {
        to: friendEmail,
        toName: friendData.name || friendData.username,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await updateDoc(userRef, {
        sentFriendRequests: arrayUnion(sentRequest)
      });
      
      // Update local user data
      if (!this.currentUser.sentFriendRequests) {
        this.currentUser.sentFriendRequests = [];
      }
      this.currentUser.sentFriendRequests.push(sentRequest);
      
      return { 
        success: true, 
        message: 'Friend request sent successfully' 
      };
    } catch (error) {
      return handleError(error, 'Error sending friend request');
    }
  }
  
  /**
   * Accept a friend request
   * @param {string} senderEmail - Email of the friend request sender
   * @returns {Promise<Object>} Result object with success status and message
   */
  async acceptFriendRequest(senderEmail) {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to accept friend requests' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      const userRef = doc(db, 'users', this.currentUser.id);
      
      // Find the specific friend request in the current user's requests
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        return { success: false, message: 'User document not found' };
      }
      
      const userData = userDoc.data();
      const friendRequests = userData.friendRequests || [];
      
      const requestIndex = friendRequests.findIndex(req => 
        req.from === senderEmail && req.status === 'pending'
      );
      
      if (requestIndex === -1) {
        return { success: false, message: 'Friend request not found' };
      }
      
      // Find the sender's document
      const senderQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', senderEmail))
      );
      
      if (senderQuery.empty) {
        return { success: false, message: 'Sender not found' };
      }
      
      const senderDoc = senderQuery.docs[0];
      const senderId = senderDoc.id;
      const senderData = senderDoc.data();
      const senderRef = doc(db, 'users', senderId);
      
      // Batch update to ensure atomicity
      const batch = writeBatch(db);
      
      // 1. Add to current user's friends list
      if (!userData.friends) {
        userData.friends = [];
      }
      if (!userData.friends.includes(senderEmail)) {
        userData.friends.push(senderEmail);
      }
      
      // 2. Update the request status to 'accepted'
      friendRequests[requestIndex].status = 'accepted';
      
      // 3. Update the current user's document
      batch.update(userRef, {
        friends: userData.friends,
        friendRequests: friendRequests
      });
      
      // 4. Add current user to sender's friends list
      if (!senderData.friends) {
        senderData.friends = [];
      }
      if (!senderData.friends.includes(this.currentUser.email)) {
        senderData.friends.push(this.currentUser.email);
      }
      
      // 5. Update the sender's sent request status if it exists
      const sentRequests = senderData.sentFriendRequests || [];
      const sentRequestIndex = sentRequests.findIndex(req => 
        req.to === this.currentUser.email && req.status === 'pending'
      );
      
      if (sentRequestIndex !== -1) {
        sentRequests[sentRequestIndex].status = 'accepted';
        batch.update(senderRef, {
          friends: senderData.friends,
          sentFriendRequests: sentRequests
        });
      } else {
        // If no sent request found, just update the friends list
        batch.update(senderRef, {
          friends: senderData.friends
        });
      }
      
      // Commit all changes atomically
      await batch.commit();
      
      // Refresh current user data
      const refreshedUserDoc = await getDoc(userRef);
      if (refreshedUserDoc.exists()) {
        this.currentUser = {
          ...refreshedUserDoc.data(),
          id: userRef.id,
          lastFetched: Date.now()
        };
      }
      
      return { 
        success: true, 
        message: 'Friend request accepted successfully' 
      };
    } catch (error) {
      console.error("Error in acceptFriendRequest:", error);
      return handleError(error, 'Error accepting friend request');
    }
  }
  
  /**
   * Reject a friend request
   * @param {string} senderEmail - Email of the friend request sender
   * @returns {Promise<Object>} Result object with success status and message
   */
  async rejectFriendRequest(senderEmail) {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to reject friend requests' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      const userRef = doc(db, 'users', this.currentUser.id);
      
      // Find the specific friend request
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const friendRequests = userData.friendRequests || [];
      
      const requestIndex = friendRequests.findIndex(req => 
        req.from === senderEmail && req.status === 'pending'
      );
      
      if (requestIndex === -1) {
        return { 
          success: false, 
          message: 'Friend request not found' 
        };
      }
      
      // Make a copy of the array to modify it
      const updatedFriendRequests = [...friendRequests];
      
      // Remove the request from current user's friendRequests
      updatedFriendRequests.splice(requestIndex, 1);
      
      // Update user's document
      await updateDoc(userRef, {
        friendRequests: updatedFriendRequests
      });
      
      // Update the sender's sent request status if it exists
      const senderQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', senderEmail))
      );
      
      if (!senderQuery.empty) {
        const senderDoc = senderQuery.docs[0];
        const senderData = senderDoc.data();
        const sentRequests = senderData.sentFriendRequests || [];
        
        const sentRequestIndex = sentRequests.findIndex(req => 
          req.to === this.currentUser.email && req.status === 'pending'
        );
        
        if (sentRequestIndex !== -1) {
          // Make a copy and remove the request
          const updatedSentRequests = [...sentRequests];
          updatedSentRequests.splice(sentRequestIndex, 1);
          
          await updateDoc(doc(db, 'users', senderDoc.id), {
            sentFriendRequests: updatedSentRequests
          });
        }
      }
      
      // Update local user data
      this.currentUser.friendRequests = updatedFriendRequests;
      
      return { 
        success: true, 
        message: 'Friend request rejected' 
      };
    } catch (error) {
      return handleError(error, 'Error rejecting friend request');
    }
  }
  
  /**
   * Delete a friend
   * @param {string} friendEmail - Email of the friend to delete
   * @returns {Promise<Object>} Result object with success status and message
   */
  async deleteFriend(friendEmail) {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to remove friends' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      // Sanitize input
      const sanitizedEmail = sanitizeUserInput(friendEmail);
      
      // Check if the user has this friend
      if (!this.currentUser.friends || !this.currentUser.friends.includes(sanitizedEmail)) {
        return { success: false, message: "This person is not in your friends list" };
      }
      
      // Update the current user's document using arrayRemove for atomic operation
      const userRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userRef, {
        friends: arrayRemove(sanitizedEmail)
      });
      
      // Update local state
      this.currentUser.friends = this.currentUser.friends.filter(email => email !== sanitizedEmail);
      
      // Also remove the current user from the friend's list (for reciprocal friendship)
      const friendQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', sanitizedEmail))
      );
      
      if (!friendQuery.empty) {
        const friendDoc = friendQuery.docs[0];
        
        // Update the friend's document using arrayRemove
        await updateDoc(doc(db, 'users', friendDoc.id), {
          friends: arrayRemove(this.currentUser.email)
        });
      }
      
      return { success: true, message: "Friend removed successfully" };
    } catch (error) {
      return handleError(error, "Error removing friend");
    }
  }
  
  /**
   * Get received friend requests
   * @returns {Array} List of friend requests
   */
  getFriendRequests() {
    if (!this.currentUser) return [];
    
    const requests = (this.currentUser.friendRequests || [])
      .filter(request => request.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return requests;
  }
  
  /**
   * Get sent friend requests
   * @returns {Promise<Array>} List of sent friend requests
   */
  async getSentFriendRequests() {
    if (!this.currentUser) return [];
    
    // If we have a sentFriendRequests array in the current user, use that
    if (this.currentUser.sentFriendRequests) {
      return this.currentUser.sentFriendRequests
        .filter(request => request.status === 'pending')
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // Otherwise, query the database for users who have received requests from the current user
    try {
      const userQuerySnapshot = await getDocs(collection(db, 'users'));
      const sentRequests = [];
      
      userQuerySnapshot.forEach(doc => {
        const userData = doc.data();
        const friendRequests = userData.friendRequests || [];
        
        // Find requests sent by the current user
        const requestsFromCurrentUser = friendRequests.filter(
          req => req.from === this.currentUser.email && req.status === 'pending'
        );
        
        if (requestsFromCurrentUser.length > 0) {
          requestsFromCurrentUser.forEach(req => {
            sentRequests.push({
              to: userData.email,
              toName: userData.name,
              timestamp: req.timestamp,
              status: req.status
            });
          });
        }
      });
      
      return sentRequests.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error fetching sent friend requests:", error);
      return [];
    }
  }
  
  /**
   * Get all friends
   * @returns {Array} List of friend emails
   */
  getFriends() {
    if (!this.currentUser) return [];
    return this.currentUser.friends || [];
  }
  
  /**
   * Fetch friends data with enhanced error handling
   * @returns {Promise<Array>} Array of friend data objects
   */
  async getFriendsData() {
    try {
      // Verify authentication
      if (!this.currentUser) {
        console.error("getFriendsData: No current user");
        return [];
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        console.error("getFriendsData: Invalid token");
        return [];
      }
      
      const friendEmails = this.currentUser.friends || [];
      
      if (friendEmails.length === 0) {
        return [];
      }
      
      // Use Promise.all for parallel fetching (performance optimization)
      const friendPromises = friendEmails.map(async (friendEmail) => {
        try {
          const friendQuery = await getDocs(
            query(collection(db, 'users'), where('email', '==', friendEmail))
          );
          
          if (!friendQuery.empty) {
            const friendDoc = friendQuery.docs[0];
            const friendData = friendDoc.data();
            
            // Create a safe copy without sensitive information
            return {
              id: friendDoc.id,
              name: friendData.name || friendEmail, // Fallback to email if name is missing
              username: friendData.username,
              email: friendData.email,
              savedMoods: friendData.savedMoods || []
            };
          } else {
            // Return a minimal object so the UI can still show this friend
            return {
              name: friendEmail,
              email: friendEmail,
              savedMoods: []
            };
          }
        } catch (error) {
          console.error(`Error fetching friend data for ${friendEmail}:`, error);
          // Return a minimal object so the UI can still show this friend
          return {
            name: friendEmail,
            email: friendEmail,
            savedMoods: [],
            errorLoading: true
          };
        }
      });
      
      // Wait for all friend data to be fetched
      const results = await Promise.all(friendPromises);
      
      // Filter out any failed fetches (nulls)
      return results.filter(friend => friend !== null);
    } catch (error) {
      console.error("Error getting friends data:", error);
      return [];
    }
  }
  
  // =========================================================================
  // Mood Tracking Methods
  // =========================================================================
  
  /**
   * Save a mood entry
   * @param {Array} moods - Array of mood objects
   * @param {string} notes - Optional notes about the mood
   * @returns {Promise<Object>} Result object with success status
   */
  async saveMood(moods, notes = '') {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to save moods' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      // Apply rate limiting
      if (!this.apiRateLimiter.isAllowed(this.currentUser.id)) {
        return { success: false, message: 'Please wait before saving another mood' };
      }
      
      // Sanitize notes input
      const sanitizedNotes = sanitizeUserInput(notes);
      
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
        moods: [...moods], // Copy the moods array
        notes: sanitizedNotes
      };
      
      // Update user document
      const userRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userRef, {
        savedMoods: arrayUnion(moodEntry)
      });
      
      // Refresh current user data
      const updatedUserDoc = await getDoc(userRef);
      
      if (updatedUserDoc.exists()) {
        this.currentUser = {
          ...updatedUserDoc.data(),
          id: userRef.id,
          lastFetched: Date.now()
        };
      }
      
      return { success: true };
    } catch (error) {
      return handleError(error, 'Error saving your mood');
    }
  }
  
  /**
   * Get saved moods (sorted by timestamp)
   * @returns {Array} Array of saved mood objects
   */
  getSavedMoods() {
    if (!this.currentUser) return [];
    
    // Return a sorted copy (newest first)
    const moods = [...(this.currentUser.savedMoods || [])];
    return moods.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }
  
  /**
   * Delete a saved mood
   * @param {Object} mood - The mood object to delete
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteMood(mood) {
    try {
      // Verify authentication 
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to delete moods' };
      }

      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' }; 
      }

      // Find the index of the mood in the user's savedMoods array
      const moodIndex = this.currentUser.savedMoods.findIndex(
        (savedMood) =>
          savedMood.date === mood.date &&
          savedMood.time === mood.time &&
          savedMood.timestamp === mood.timestamp
      );

      if (moodIndex === -1) {
        return { success: false, message: 'Mood not found' };
      }

      // Update user document
      const userRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userRef, {
        savedMoods: arrayRemove(mood)
      });

      // Refresh current user data
      const updatedUserDoc = await getDoc(userRef);

      if (updatedUserDoc.exists()) {
        this.currentUser = {
          ...updatedUserDoc.data(),
          id: userRef.id
        };
      }

      return { success: true };
    } catch (error) {
      return handleError(error, 'Error deleting your mood');
    }
  }
  
  // =========================================================================
  // Session Management Methods
  // =========================================================================
  
  /**
   * Track and manage user sessions
   * @returns {Promise<void>}
   */
  async trackUserSession() {
    if (!auth.currentUser) return;
    
    const sessionId = this.generateSessionId();
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    try {
      // Track the session
      await updateDoc(userRef, {
        sessions: arrayUnion({
          id: sessionId,
          startTime: Date.now(),
          device: navigator.userAgent,
          lastActive: Date.now()
        })
      });
      
      // Store the session ID locally
      localStorage.setItem('sessionId', sessionId);
      
      // Clear any existing heartbeat
      this.clearSessionHeartbeat();
      
      // Set up session heartbeat (update last active time)
      this.sessionHeartbeatInterval = setInterval(async () => {
        if (!auth.currentUser) {
          this.clearSessionHeartbeat();
          return;
        }
        
        try {
          // Query for the specific session
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) return;
          
          const userData = userDoc.data();
          const sessions = userData.sessions || [];
          const sessionIndex = sessions.findIndex(s => s.id === sessionId);
          
          if (sessionIndex >= 0) {
            // Update the session's lastActive time
            sessions[sessionIndex].lastActive = Date.now();
            
            await updateDoc(userRef, {
              sessions: sessions
            });
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  }
  
  /**
   * Generate a unique session ID
   * @returns {string} A unique session ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Clear session heartbeat
   */
  clearSessionHeartbeat() {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
      this.sessionHeartbeatInterval = null;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Clear the session heartbeat
    this.clearSessionHeartbeat();
    
    // Unsubscribe from auth state changes
    if (this.unsubscribeFromAuth) {
      this.unsubscribeFromAuth();
      this.unsubscribeFromAuth = null;
    }
    
    // Clear local storage items
    localStorage.removeItem('sessionId');
  }
}