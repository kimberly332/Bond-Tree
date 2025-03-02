// auth-manager.js - Complete optimized version with security enhancements
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
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
  writeBatch, 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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

// Rate Limiter for API calls
class RateLimiter {
  constructor(limit = 10, interval = 60000) {
    this.timestamps = {};
    this.limit = limit;
    this.interval = interval;
  }
  
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

// Input sanitization to prevent XSS
function sanitizeUserInput(input) {
  if (typeof input !== 'string') return '';
  
  // Basic XSS protection
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Central error handling
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

// CSRF token generation
function generateCsrfToken() {
  const token = Math.random().toString(36).substring(2) + 
                Math.random().toString(36).substring(2);
  sessionStorage.setItem('csrfToken', token);
  return token;
}

// Initialize sample users (for development)
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

export default class AuthManager {
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
          // Try to get data from IndexedDB cache first (if implemented)
          // ...
          
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
  
  // Verify user's authentication token
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
  
   // Create a new user account
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
      
      // Handle specific Firebase authentication errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          return { 
            success: false, 
            message: 'This email is already registered'
          };
        case 'auth/invalid-email':
          return { 
            success: false, 
            message: 'Invalid email address'
          };
        case 'auth/weak-password':
          return { 
            success: false, 
            message: 'Password is too weak. Please use a stronger password.'
          };
        default:
          return { 
            success: false, 
            message: 'Signup failed. Please try again.'
          };
      }
    }
  }// Rate Limiter Class
  
  // Helper method to get user-friendly error messages
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
  
  // Log in an existing user
  async login(email, password) {
    try {
      // Apply rate limiting
      if (!this.apiRateLimiter.isAllowed('login')) {
        return { 
          success: false, 
          message: 'Too many login attempts. Please try again later.'
        };
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
          ? 'Invalid email or password' 
          : 'Login failed. Please try again.'
      );
    }
  }
  
  // Check username availability
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
  
  // Log out the current user
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

  async sendFriendRequest(friendIdentifier) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'You must be logged in to send friend requests' };
      }
  
      // Determine if the identifier is an email or username
      const isEmail = friendIdentifier.includes('@');
      
      // Query to find the recipient
      const usersRef = collection(db, 'users');
      const q = isEmail 
        ? query(usersRef, where('email', '==', friendIdentifier))
        : query(usersRef, where('username', '==', friendIdentifier));
      
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return { success: false, error: 'User not found' };
      }
  
      // Get the recipient's data
      const friendDoc = querySnapshot.docs[0];
      const friendData = friendDoc.data();
      const friendId = friendDoc.id;
      const friendEmail = friendData.email;
  
      // Check if trying to add self
      if (friendEmail === this.currentUser.email) {
        return { success: false, error: 'You cannot send a friend request to yourself' };
      }
  
      // Check if already friends
      const existingFriends = this.currentUser.friends || [];
      if (existingFriends.some(friend => friend === friendEmail)) {
        return { success: false, error: 'You are already friends with this user' };
      }
  
      // Check if already sent a request
      const sentRequests = this.currentUser.sentFriendRequests || [];
      if (sentRequests.some(request => request.to === friendEmail && request.status === 'pending')) {
        return { success: false, error: 'You have already sent a friend request to this user' };
      }
  
      // Check if recipient already sent a request (auto-accept scenario)
      const recipientDoc = await getDoc(doc(db, 'users', friendId));
      if (recipientDoc.exists()) {
        const recipientData = recipientDoc.data();
        const recipientSentRequests = recipientData.sentFriendRequests || [];
        
        if (recipientSentRequests.some(request => 
          request.to === this.currentUser.email && request.status === 'pending')) {
          // Auto-accept the request
          return await this.acceptFriendRequest(friendEmail);
        }
      }
  
      // Create the friend request object
      const friendRequest = {
        from: this.currentUser.email,
        fromName: this.currentUser.name || this.currentUser.username,
        timestamp: Date.now(),
        status: 'pending'
      };
  
      // Create the sent request object
      const sentRequest = {
        to: friendEmail,
        toName: friendData.name || friendData.username,
        timestamp: Date.now(),
        status: 'pending'
      };
  
      // Batch write to ensure atomicity
      const batch = writeBatch(db);
      
      // Add request to recipient's document
      const recipientRef = doc(db, 'users', friendId);
      batch.update(recipientRef, {
        friendRequests: arrayUnion(friendRequest)
      });
      
      // Record sent request in sender's document
      const senderRef = doc(db, 'users', this.currentUser.id);
      batch.update(senderRef, {
        sentFriendRequests: arrayUnion(sentRequest)
      });
      
      // Commit the batch
      await batch.commit();
      
      // Update local state
      if (!this.currentUser.sentFriendRequests) {
        this.currentUser.sentFriendRequests = [];
      }
      this.currentUser.sentFriendRequests.push(sentRequest);
      
      // Refresh user data in the background
      this.refreshUserData();
  
      return { success: true, message: 'Friend request sent successfully' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  async sendFriendRequest(friendEmail) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'You must be logged in to send friend requests' };
      }
  
      // Normalize email addresses for comparison
      friendEmail = friendEmail.toLowerCase().trim();
      const currentUserEmail = this.currentUser.email.toLowerCase().trim();
  
      // Check if trying to add self
      if (friendEmail === currentUserEmail) {
        return { success: false, error: 'You cannot send a friend request to yourself' };
      }
  
      // Check if already friends
      const existingFriends = this.currentUser.friends || [];
      if (existingFriends.some(friend => friend.email.toLowerCase() === friendEmail)) {
        return { success: false, error: 'You are already friends with this user' };
      }
  
      // Check if already sent a request
      const existingRequests = this.currentUser.sentFriendRequests || [];
      if (existingRequests.some(request => request.to.toLowerCase() === friendEmail && request.status === 'pending')) {
        return { success: false, error: 'You have already sent a friend request to this user' };
      }
  
      // Look up the friend's user document
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', friendEmail));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return { success: false, error: 'User not found' };
      }
  
      // Get the friend's data
      const friendDoc = querySnapshot.docs[0];
      const friendData = friendDoc.data();
      const friendId = friendDoc.id;
  
      // Check if friend already sent a request to current user
      const friendRequests = this.currentUser.friendRequests || [];
      if (friendRequests.some(request => request.from.toLowerCase() === friendEmail && request.status === 'pending')) {
        // Auto-accept the request instead of sending a new one
        return await this.acceptFriendRequest(friendEmail);
      }
  
      // Create the friend request
      const friendRequest = {
        from: this.currentUser.email,
        fromName: this.currentUser.name || this.currentUser.username,
        timestamp: Date.now(),
        status: 'pending'
      };
  
      // Add the request to the recipient's document
      const recipientRef = doc(db, 'users', friendId);
      await updateDoc(recipientRef, {
        friendRequests: arrayUnion(friendRequest)
      });
  
      // ADDED CODE: Record the sent request in the current user's document
      try {
        // Optionally, also record the sent request in the current user's document
        // This makes it easier to track sent requests
        await updateDoc(doc(db, 'users', this.currentUser.id), {
          sentFriendRequests: arrayUnion({
            to: friendEmail,
            toName: friendData.name || friendData.username,
            timestamp: Date.now(),
            status: 'pending'
          })
        });
      } catch (sentError) {
        console.error("Non-critical error recording sent request:", sentError);
        // We don't return an error here since the main operation succeeded
      }
  
      return { success: true, message: 'Friend request sent successfully' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  // Accept a friend request
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
      
      // Update the specific request's status
      friendRequests[requestIndex].status = 'accepted';
      
      // Find the sender's document
      const senderQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', senderEmail))
      );
      
      if (senderQuery.empty) {
        return { 
          success: false, 
          message: 'Sender not found'
        };
      }
      
      const senderDoc = senderQuery.docs[0];
      const senderId = senderDoc.id;
      
      // Update both users' friends lists
      await updateDoc(userRef, {
        friendRequests: friendRequests,
        friends: arrayUnion(senderEmail)
      });
      
      await updateDoc(doc(db, 'users', senderId), {
        friends: arrayUnion(this.currentUser.email)
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
      
      return { 
        success: true, 
        message: 'Friend request accepted successfully' 
      };
    } catch (error) {
      return handleError(error, 'Error accepting friend request');
    }
  }

  // Reject a friend request
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
      
      // Remove or mark the request as rejected
      friendRequests[requestIndex].status = 'rejected';
      
      // Update user's friend requests
      await updateDoc(userRef, {
        friendRequests: friendRequests
      });
      
      return { 
        success: true, 
        message: 'Friend request rejected' 
      };
    } catch (error) {
      return handleError(error, 'Error rejecting friend request');
    }
  }

 // Get friend requests received
 getFriendRequests() {
  if (!this.currentUser) return [];
  
  const requests = (this.currentUser.friendRequests || [])
    .filter(request => request.status === 'pending')
    .sort((a, b) => b.timestamp - a.timestamp);
  
  console.log("Found received friend requests:", requests.length, requests);
  return requests;
}

// Get friend requests sent
async getSentFriendRequests() {
  if (!this.currentUser) return [];
  
  // If we have a sentFriendRequests array in the current user, use that
  if (this.currentUser.sentFriendRequests) {
    const requests = this.currentUser.sentFriendRequests
      .filter(request => request.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log("Found sent friend requests (from local):", requests.length, requests);
    return requests;
  }
  
  // Otherwise, query the database for users who have received requests from the current user
  try {
    console.log("Querying database for sent friend requests...");
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
        console.log(`Found ${requestsFromCurrentUser.length} requests sent to ${userData.email}`);
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
    
    console.log("Found sent friend requests (from query):", sentRequests.length, sentRequests);
    return sentRequests.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching sent friend requests:", error);
    return [];
  }
}

// Get friend requests sent
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

// Get friend requests sent
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
  
  // Get friend requests sent
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
  
  // Add a friend by email or username
  async addFriend(friendIdentifier) {
    try {
      // Verify authentication
      if (!this.currentUser) {
        return { success: false, message: 'You must be logged in to add friends' };
      }
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) {
        return { success: false, message: 'Authentication error. Please sign in again.' };
      }
      
      // Apply rate limiting
      if (!this.apiRateLimiter.isAllowed(this.currentUser.id)) {
        return { success: false, message: 'Please wait before adding more friends' };
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
      const friendEmail = friendData.email;
      
      // Cannot add yourself as a friend
      if (friendEmail === this.currentUser.email) {
        return { 
          success: false, 
          message: 'You cannot add yourself as a friend'
        };
      }
      
      // Check if already a friend
      if (this.currentUser.friends && this.currentUser.friends.includes(friendEmail)) {
        return { 
          success: false, 
          message: 'This user is already in your friends list'
        };
      }
      
      // Update current user's friends
      const userRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userRef, {
        friends: arrayUnion(friendEmail)
      });
      
      // Update local state
      this.currentUser.friends = this.currentUser.friends || [];
      this.currentUser.friends.push(friendEmail);
      
      return { success: true };
    } catch (error) {
      return handleError(error, 'Error adding friend');
    }
  }
  
  // Remove a friend
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
      
      return { success: true };
    } catch (error) {
      return handleError(error, "Error removing friend");
    }
  }
  
  // Get all friends
  getFriends() {
    if (!this.currentUser) return [];
    return this.currentUser.friends || [];
  }
  
  // Save a mood entry
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
        moods: [...moods], // Assuming moods is an array of objects
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
  
  // Get saved moods (sorted by timestamp)
  getSavedMoods() {
    if (!this.currentUser) return [];
    
    // Return a sorted copy (newest first)
    const moods = [...(this.currentUser.savedMoods || [])];
    return moods.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }
  
  // Fetch friends data
  async getFriendsData() {
    try {
      // Verify authentication
      if (!this.currentUser) return [];
      
      // Verify token
      const isTokenValid = await this.verifyIdToken();
      if (!isTokenValid) return [];
      
      const friendEmails = this.currentUser.friends || [];
      
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
              name: friendData.name,
              username: friendData.username,
              email: friendData.email,
              savedMoods: friendData.savedMoods || []
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching friend data for ${friendEmail}:`, error);
          return null;
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
  
  // Track and manage user sessions
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
  
  // Generate a unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  // Clear session heartbeat
  clearSessionHeartbeat() {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
      this.sessionHeartbeatInterval = null;
    }
  }
  
  // Clean up resources
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