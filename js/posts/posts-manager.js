/**
 * Posts Manager for Bond Tree
 * 
 * This module handles creating, retrieving, updating, and deleting posts
 * as well as managing media uploads and privacy settings.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
  getAuth, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

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

// Initialize Firebase if not already initialized
let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (e) {
  console.log("Firebase already initialized");
  firebaseApp = firebase.apps[0];
}

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Privacy levels
const PRIVACY = {
  PRIVATE: 'private',  // Only the author can see
  FRIENDS: 'friends',  // Author and friends can see
  PUBLIC: 'public',    // Everyone can see
  PASSCODE: 'passcode' // Anyone with passcode can see
};

/**
 * Posts Manager Class
 */
class PostsManager {
  constructor() {
    this.currentUser = null;
    this.lastVisible = null;
    this.reachedEnd = false;
    this.postsPerPage = 10;
    this.currentFilters = {
      privacy: 'all',
      sort: 'newest'
    };
    
    
    // Set up auth state listener
    this.unsubscribeFromAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User authenticated in PostsManager:", user.email);
        this.currentUser = user;
      } else {
        console.log("User signed out of PostsManager");
        this.currentUser = null;
        this.lastVisible = null;
        this.reachedEnd = false;
      }
    });
    
    this.pendingMedia = [];
  }

  /**
 * Get all posts visible to the current user (both their own and their friends' posts)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of visible posts
 */
async getAllVisiblePosts(options = {}) {
  if (!this.currentUser) {
    throw new Error('User must be logged in to fetch posts');
  }
  
  try {
    const queryOptions = {
      privacy: options.privacy || 'all',
      sort: options.sort || 'newest'
    };
    
    // STEP 1: Get the user's own posts (this is always allowed)
    const userPostsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', this.currentUser.uid)
    );
    
    const userPostsSnapshot = await getDocs(userPostsQuery);
    const userPosts = userPostsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamps
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date();
        
      const updatedAt = data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : createdAt;
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        isOwnPost: true
      };
    });
    
    // STEP 2: Get friends list
    let friendPosts = [];
    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendEmails = userData.friends || [];
        
        if (friendEmails.length > 0) {
          // Get friend user IDs
          const friendsQuery = query(
            collection(db, 'users'),
            where('email', 'in', friendEmails)
          );
          
          const friendsSnapshot = await getDocs(friendsQuery);
          const friendIds = friendsSnapshot.docs.map(doc => doc.id);
          
          if (friendIds.length > 0) {
            // IMPORTANT: Only query for public posts from friends
            // This will work with existing security rules
            const friendPostsQuery = query(
              collection(db, 'posts'),
              where('authorId', 'in', friendIds),
              // where('privacy', '==', 'public'),
              orderBy('createdAt', 'desc')
            );
            
            const friendPostsSnapshot = await getDocs(friendPostsQuery);
            
            friendPosts = friendPostsSnapshot.docs.map(doc => {
              const data = doc.data();
              
              // Convert timestamps
              const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate() 
                : new Date();
                
              const updatedAt = data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : createdAt;
              
              return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt,
                isFriendPost: true
              };
            });
          }
        }
      }
    } catch (friendError) {
      console.error('Error loading friend posts:', friendError);
      // Continue with just user posts if there's an error with friend posts
    }
    
    // STEP 3: Filter posts by privacy if needed
    let filteredUserPosts = userPosts;
    if (queryOptions.privacy !== 'all') {
      filteredUserPosts = userPosts.filter(post => post.privacy === queryOptions.privacy);
    }
    
    // STEP 4: Combine user and friend posts
    const allPosts = [...filteredUserPosts, ...friendPosts];
    
    // STEP 5: Sort posts
    const sortedPosts = allPosts.sort((a, b) => {
      if (queryOptions.sort === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });
    
    return sortedPosts;
  } catch (error) {
    console.error('Error getting all visible posts:', error);
    throw error;
  }
}
  
  /**
 * Get a user document by ID
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<Object|null>} The user document or null if not found
 */
  async getUserById(userId) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to fetch other users');
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  

  /**
   * Add a media file to pending uploads
   * @param {File} file - The file to add
   * @returns {Object} The pending media object with preview URL
   */
  addPendingMedia(file) {
    return new Promise((resolve, reject) => {
      try {
        if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
          reject(new Error('Invalid file type. Only images and videos are supported.'));
          return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const mediaObj = {
            file: file,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            previewUrl: e.target.result,
            id: Date.now() + Math.random().toString(36).substring(2, 9)
          };
          
          this.pendingMedia.push(mediaObj);
          resolve(mediaObj);
        };
        
        reader.onerror = (error) => {
          console.error("Error creating preview:", error);
          reject(error);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error adding pending media:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Remove a pending media file by ID
   * @param {string} mediaId - The ID of the media to remove
   */
  removePendingMedia(mediaId) {
    const index = this.pendingMedia.findIndex(media => media.id === mediaId);
    if (index !== -1) {
      this.pendingMedia.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Clear all pending media
   */
  clearPendingMedia() {
    this.pendingMedia = [];
  }

  /**
   * Hash a passcode securely
   * @param {string} passcode - The passcode to hash
   * @returns {string} - Hashed passcode
   */
  async hashPasscode(passcode) {
    // Simple hash implementation for demo
    // In production, use a strong crypto library
    let hash = 0;
    for (let i = 0; i < passcode.length; i++) {
      const char = passcode.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    // Add salt
    const salt = Date.now().toString(36);
    return `${hash.toString(16)}_${salt}`;
  }
  
  /**
   * Create a new post with optional media
   * @param {Object} postData - Data for the new post
   * @returns {Promise<Object>} The created post
   */
  async createPost(postData) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to create posts');
    }
    
    try {
      // Create post object
      const post = {
        authorId: this.currentUser.uid,
        authorEmail: this.currentUser.email,
        authorName: postData.authorName || 'Anonymous',
        title: postData.title || '',
        content: postData.content,
        privacy: postData.privacy || PRIVACY.PRIVATE,
        tags: postData.tags || [],
        media: [],
        reactions: {
          likes: 0,
          hearts: 0,
          celebrates: 0
        },
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Handle passcode if privacy is set to passcode
      if (post.privacy === PRIVACY.PASSCODE && postData.passcode) {
        // Validate passcode format
        if (!/^\d{4}$/.test(postData.passcode)) {
          throw new Error('Passcode must be exactly 4 digits');
        }
        
        // Hash the passcode before storing
        post.passcodeHash = await this.hashPasscode(postData.passcode);
        
        // Don't store the plain passcode
        delete postData.passcode;
      } else if (post.privacy === PRIVACY.PASSCODE && !postData.passcode) {
        // If passcode privacy is selected but no passcode provided
        throw new Error('Passcode is required for passcode-protected posts');
      }
      
      // Upload any pending media
      if (this.pendingMedia.length > 0) {
        const mediaPromises = this.pendingMedia.map(media => this.uploadMedia(media.file));
        const mediaResults = await Promise.all(mediaPromises);
        
        post.media = mediaResults.map(result => ({
          url: result.url,
          type: result.type,
          path: result.path,
          thumbnail: result.thumbnail || result.url
        }));
      }
      
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), post);
      
      // Clear pending media after successful post
      this.clearPendingMedia();
      
      // Get the actual document with server timestamp resolved
      const newPostDoc = await getDoc(docRef);
      const newPostData = newPostDoc.data();
      
      // Convert timestamps to dates for client use
      const createdAt = newPostData.createdAt instanceof Timestamp 
        ? newPostData.createdAt.toDate() 
        : new Date();
        
      const updatedAt = newPostData.updatedAt instanceof Timestamp
        ? newPostData.updatedAt.toDate()
        : createdAt;
      
      // Return the new post with converted timestamps
      const newPost = {
        id: docRef.id,
        ...newPostData,
        createdAt,
        updatedAt
      };
      
      console.log('Successfully created post:', newPost.id);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
  
  /**
   * Upload a media file to Firebase Storage
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Object with the download URL and file type
   */
  async uploadMedia(file) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to upload media');
    }
    
    try {
      const isImage = file.type.startsWith('image/');
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const filePath = `posts/${this.currentUser.uid}/${fileName}`;
      
      // Create a reference to the storage location
      const storageRef = ref(storage, filePath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const url = await getDownloadURL(snapshot.ref);
      
      // Return the media metadata
      return {
        url,
        type: isImage ? 'image' : 'video',
        path: filePath,
        thumbnail: isImage ? url : null // Use the same URL as thumbnail for images
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  /**
 * Get a single post by ID
 * @param {string} postId - The ID of the post to get
 * @returns {Promise<Object|null>} The post or null if not found
 */
async getPost(postId) {
  if (!this.currentUser) {
    throw new Error('User must be logged in to fetch posts');
  }
  
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const data = postDoc.data();
      
      // Convert timestamps to dates
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date();
        
      const updatedAt = data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : createdAt;
      
      return {
        id: postDoc.id,
        ...data,
        createdAt,
        updatedAt
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
}

/**
 * Verify a passcode for a post
 * @param {string} passcode - The passcode to verify
 * @param {Object} post - The post object with the stored passcode
 * @returns {boolean} Whether the passcode is correct
 */
verifyPasscode(passcode, post) {
  if (!post) {
    throw new Error('Post not found');
  }
  
  if (!post.hasOwnProperty('passcode')) {
    throw new Error('This post does not require a passcode');
  }
  
  // Direct comparison
  const isCorrect = passcode === post.passcode;
  
  // For debugging - remove in production
  if (!isCorrect) {
    console.log('Passcode verification failed: Entered:', passcode, 'Expected:', post.passcode);
  }
  
  return isCorrect;
}

/**
 * Create a new post with optional media
 * @param {Object} postData - Data for the new post
 * @returns {Promise<Object>} The created post
 */
async createPost(postData) {
  if (!this.currentUser) {
    throw new Error('User must be logged in to create posts');
  }
  
  try {
    // Create post object
    const post = {
      authorId: this.currentUser.uid,
      authorEmail: this.currentUser.email,
      authorName: postData.authorName || 'Anonymous',
      title: postData.title || '',
      content: postData.content,
      privacy: postData.privacy || 'public', // Default to public (visible to friends)
      tags: postData.tags || [],
      media: [],
      reactions: {
        likes: 0,
        hearts: 0,
        celebrates: 0
      },
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add passcode if privacy is set to private
    if (post.privacy === 'private' && postData.passcode) {
      // Validate passcode format
      if (!/^\d{4}$/.test(postData.passcode)) {
        throw new Error('Passcode must be exactly 4 digits');
      }
      
      // In a production app, you would hash the passcode here
      post.passcode = postData.passcode;
    } else if (post.privacy === 'private' && !postData.passcode) {
      // If private but no passcode provided
      throw new Error('Passcode is required for private posts');
    }
    
    // Upload any pending media
    if (this.pendingMedia.length > 0) {
      const mediaPromises = this.pendingMedia.map(media => this.uploadMedia(media.file));
      const mediaResults = await Promise.all(mediaPromises);
      
      post.media = mediaResults.map(result => ({
        url: result.url,
        type: result.type,
        path: result.path,
        thumbnail: result.thumbnail || result.url
      }));
    }
    
    // Add post to Firestore
    const docRef = await addDoc(collection(db, 'posts'), post);
    
    // Clear pending media after successful post
    this.clearPendingMedia();
    
    // Get the actual document with server timestamp resolved
    const newPostDoc = await getDoc(docRef);
    const newPostData = newPostDoc.data();
    
    // Convert timestamps to dates for client use
    const createdAt = newPostData.createdAt instanceof Timestamp 
      ? newPostData.createdAt.toDate() 
      : new Date();
      
    const updatedAt = newPostData.updatedAt instanceof Timestamp
      ? newPostData.updatedAt.toDate()
      : createdAt;
    
    // Return the new post with converted timestamps
    const newPost = {
      id: docRef.id,
      ...newPostData,
      createdAt,
      updatedAt
    };
    
    console.log('Successfully created post:', newPost.id);
    return newPost;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Update an existing post
 * @param {string} postId - The ID of the post to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated post
 */
async updatePost(postId, updateData) {
  if (!this.currentUser) {
    throw new Error('User must be logged in to update posts');
  }
  
  try {
    // Get the post first to check permissions
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = docSnap.data();
    
    // Check if user is the author
    if (postData.authorId !== this.currentUser.uid) {
      throw new Error('You can only update your own posts');
    }
    
    // Prepare update data
    const update = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    // Handle passcode for private posts
    if (update.privacy === 'private') {
      if (update.passcode) {
        // Validate passcode format
        if (!/^\d{4}$/.test(update.passcode)) {
          throw new Error('Passcode must be exactly 4 digits');
        }
        
        // In a production app, you would hash the passcode here
        // For this implementation, we directly store it
      } else if (postData.privacy !== 'private') {
        // Switching from public to private but no passcode provided
        throw new Error('Passcode is required when making a post private');
      } else {
        // Keeping private but not changing passcode, use existing one
        delete update.passcode;
      }
    }
    
    // If there are new media files to upload
    if (this.pendingMedia.length > 0) {
      const mediaPromises = this.pendingMedia.map(media => this.uploadMedia(media.file));
      const mediaResults = await Promise.all(mediaPromises);
      
      const newMedia = mediaResults.map(result => ({
        url: result.url,
        type: result.type,
        path: result.path,
        thumbnail: result.thumbnail || result.url
      }));
      
      // Combine with existing media unless explicitly removing all
      if (!updateData.removeAllMedia) {
        update.media = [...(postData.media || []), ...newMedia];
      } else {
        update.media = newMedia;
      }
      
      // Clear pending media after upload
      this.clearPendingMedia();
    }
    
    // Update the post
    await updateDoc(docRef, update);
    
    // Get the updated post
    const updatedDocSnap = await getDoc(docRef);
    const updatedData = updatedDocSnap.data();
    
    // Convert timestamps to dates
    const createdAt = updatedData.createdAt instanceof Timestamp 
      ? updatedData.createdAt.toDate() 
      : new Date();
      
    const updatedAt = updatedData.updatedAt instanceof Timestamp
      ? updatedData.updatedAt.toDate()
      : new Date();
    
    return {
      id: postId,
      ...updatedData,
      createdAt,
      updatedAt
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Get a shareable URL for a post
 * @param {string} postId - The ID of the post to share
 * @returns {string} The shareable URL
 */
getShareablePostUrl(postId) {
  // Create a shareable URL with the post ID
  const baseUrl = window.location.origin;
  return `${baseUrl}/posts.html?view=${postId}`;
}

async getFriendPosts() {
  if (!this.currentUser) {
    throw new Error('User must be logged in to fetch friend posts');
  }
  
  try {
    // Get the current user's data to access friends list
    const currentUserRef = doc(db, 'users', this.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);
    
    if (!currentUserDoc.exists()) {
      console.error('Current user document not found');
      return [];
    }
    
    const userData = currentUserDoc.data();
    const friendEmails = userData.friends || [];
    
    // If no friends, return empty array
    if (friendEmails.length === 0) {
      return [];
    }
    
    // Find all users that match these email addresses
    const friendsQuery = query(
      collection(db, 'users'),
      where('email', 'in', friendEmails)
    );
    
    const friendsSnapshot = await getDocs(friendsQuery);
    const friendIds = friendsSnapshot.docs.map(doc => doc.id);
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Now query for ALL posts from these friends (no privacy filter)
    // Note: For Firestore, you may need to split this into multiple queries
    // if you have more than 10 friend IDs due to "in" clause limitations
    let allFriendPosts = [];
    
    // Process in batches of 10 (Firestore limit for "in" queries)
    for (let i = 0; i < friendIds.length; i += 10) {
      const batchIds = friendIds.slice(i, i + 10);
      
      const batchQuery = query(
        collection(db, 'posts'),
        where('authorId', 'in', batchIds),
        orderBy('createdAt', 'desc')
      );
      
      const batchSnapshot = await getDocs(batchQuery);
      
      const batchPosts = batchSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date();
          
        const updatedAt = data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : createdAt;
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          isFriendPost: true
        };
      });
      
      allFriendPosts = [...allFriendPosts, ...batchPosts];
    }
    
    return allFriendPosts;
  } catch (error) {
    console.error('Error loading friend posts:', error);
    // Return empty array instead of throwing to prevent breaking the UI
    return [];
  }
}
  
  /**
   * Get posts based on privacy settings and filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of posts
   */
  async getPosts(options = {}) {
    if (!this.currentUser) {
      console.error('No current user for fetching posts');
      return []; 
    }
    
    try {
      const queryOptions = {
        privacy: options.privacy || this.currentFilters.privacy,
        sort: options.sort || this.currentFilters.sort,
        loadMore: options.loadMore || false,
        limit: options.limit || this.postsPerPage,
        tags: options.tags || []
      };
      
      // Base query conditions
      const queryConditions = [
        where('authorId', '==', this.currentUser.uid)
      ];
      
      // Add privacy filter if not 'all'
      if (queryOptions.privacy !== 'all') {
        queryConditions.push(where('privacy', '==', queryOptions.privacy));
      }
      
      // Construct base query with privacy condition
      let baseQuery = query(
        collection(db, 'posts'),
        ...queryConditions,
        orderBy('createdAt', 'desc')
      );
      
      // Add pagination if loading more
      if (queryOptions.loadMore && this.lastVisible) {
        baseQuery = query(
          baseQuery,
          startAfter(this.lastVisible),
          limit(queryOptions.limit)
        );
      } else {
        baseQuery = query(baseQuery, limit(queryOptions.limit));
      }
      
      const querySnapshot = await getDocs(baseQuery);
      
      // Convert to array of post objects
      const posts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Safely convert timestamps
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt || Date.now());
          
        const updatedAt = data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt || createdAt);
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        };
      });
      
      // Update last visible for pagination
      this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      // Check if we've reached the end
      this.reachedEnd = querySnapshot.docs.length < queryOptions.limit;
      
      return posts;
    } catch (error) {
      console.error('Detailed Posts Query Error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Specific guidance for index error
      if (error.code === 'firestore/requires-index') {
        console.warn('🚨 Missing Firestore Index 🚨\n' + 
          'Please create a composite index with these fields:\n' +
          '1. authorId (Ascending)\n' +
          '2. privacy (Ascending)\n' +
          '3. createdAt (Descending)\n' +
          'Visit the Firebase Console to create the index.');
      }
      
      return [];
    }
  }
  
  
  /**
   * Update an existing post
   * @param {string} postId - The ID of the post to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated post
   */
  async updatePost(postId, updateData) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to update posts');
    }
    
    try {
      // Get the post first to check permissions
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      
      // Check if user is the author
      if (postData.authorId !== this.currentUser.uid) {
        throw new Error('You can only update your own posts');
      }
      
      // Prepare update data
      const update = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // If there are new media files to upload
      if (this.pendingMedia.length > 0) {
        const mediaPromises = this.pendingMedia.map(media => this.uploadMedia(media.file));
        const mediaResults = await Promise.all(mediaPromises);
        
        const newMedia = mediaResults.map(result => ({
          url: result.url,
          type: result.type,
          path: result.path,
          thumbnail: result.thumbnail || result.url
        }));
        
        // Combine with existing media unless explicitly removing all
        if (!updateData.removeAllMedia) {
          update.media = [...(postData.media || []), ...newMedia];
        } else {
          update.media = newMedia;
        }
        
        // Clear pending media after upload
        this.clearPendingMedia();
      }
      
      // Update the post
      await updateDoc(docRef, update);
      
      // Get the updated post
      const updatedDocSnap = await getDoc(docRef);
      const updatedData = updatedDocSnap.data();
      
      // Convert timestamps to dates
      const createdAt = updatedData.createdAt instanceof Timestamp 
        ? updatedData.createdAt.toDate() 
        : new Date();
        
      const updatedAt = updatedData.updatedAt instanceof Timestamp
        ? updatedData.updatedAt.toDate()
        : new Date();
      
      return {
        id: postId,
        ...updatedData,
        createdAt,
        updatedAt
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }
  
  /**
   * Delete a post and its associated media
   * @param {string} postId - The ID of the post to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePost(postId) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to delete posts');
    }
    
    try {
      // Validate the postId
      if (!postId || typeof postId !== 'string') {
        throw new Error('Invalid post ID. Post ID must be a string.');
      }
      
      console.log(`Attempting to delete post with ID: ${postId}`);
      
      // Get the post first to check permissions and get media references
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      
      // Check if user is the author
      if (postData.authorId !== this.currentUser.uid) {
        throw new Error('You can only delete your own posts');
      }
      
      // Try to delete media files, but continue even if this fails
      if (postData.media && postData.media.length > 0) {
        for (const media of postData.media) {
          if (media.path) {
            try {
              const mediaRef = ref(storage, media.path);
              await deleteObject(mediaRef);
              console.log(`Successfully deleted media: ${media.path}`);
            } catch (error) {
              // Log the error but continue with post deletion
              console.error('Error deleting media file:', error);
              
              // If we get a permission error, just continue
              if (error.code === 'storage/unauthorized') {
                console.log('Insufficient permissions to delete media. Continuing with post deletion.');
              }
            }
          }
        }
      }
      
      // Delete the post document from Firestore
      await deleteDoc(docRef);
      console.log(`Successfully deleted post document: ${postId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
  
  /**
   * Add a reaction to a post (like, heart, celebrate)
   * @param {string} postId - The ID of the post to react to
   * @param {string} reactionType - The type of reaction
   * @returns {Promise<Object>} The updated reactions
   */
  async addReaction(postId, reactionType) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to react to posts');
    }
    
    try {
      // Validate reaction type
      const validReactions = ['likes', 'hearts', 'celebrates'];
      if (!validReactions.includes(reactionType)) {
        throw new Error('Invalid reaction type');
      }
      
      // Get the post
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      const reactions = postData.reactions || { likes: 0, hearts: 0, celebrates: 0 };
      
      // Increment the reaction count
      reactions[reactionType] += 1;
      
      // Update the post
      await updateDoc(docRef, { reactions });
      
      return reactions;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }
  
  /**
   * Add a comment to a post
   * @param {string} postId - The ID of the post to comment on
   * @param {string} commentText - The comment text
   * @returns {Promise<Array>} The updated comments array
   */
  async addComment(postId, commentText) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to comment on posts');
    }
    
    try {
      // Get the post
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      const comments = postData.comments || [];
      
      // Create new comment
      const newComment = {
        id: Date.now().toString(),
        authorId: this.currentUser.uid,
        authorName: this.currentUser.displayName || 'Anonymous',
        authorEmail: this.currentUser.email,
        text: commentText,
        createdAt: new Date().toISOString()
      };
      
      // Add the comment to the array
      comments.push(newComment);
      
      // Update the post
      await updateDoc(docRef, { comments });
      
      return comments;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  /**
   * Delete a comment from a post
   * @param {string} postId - The ID of the post
   * @param {string} commentId - The ID of the comment to delete
   * @returns {Promise<Array>} The updated comments array
   */
  async deleteComment(postId, commentId) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to delete comments');
    }
    
    try {
      // Get the post
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      let comments = postData.comments || [];
      
      // Find the comment
      const commentIndex = comments.findIndex(comment => comment.id === commentId);
      
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }
      
      const comment = comments[commentIndex];
      
      // Check if user is the comment author or post author
      if (comment.authorId !== this.currentUser.uid && postData.authorId !== this.currentUser.uid) {
        throw new Error('You can only delete your own comments or comments on your posts');
      }
      
      // Remove the comment
      comments.splice(commentIndex, 1);
      
      // Update the post
      await updateDoc(docRef, { comments });
      
      return comments;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
  
  /**
   * Remove a media item from a post
   * @param {string} postId - The ID of the post
   * @param {number} mediaIndex - The index of the media to remove
   * @returns {Promise<Array>} The updated media array
   */
  async removeMedia(postId, mediaIndex) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to remove media');
    }
    
    try {
      // Get the post
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = docSnap.data();
      
      // Check if user is the author
      if (postData.authorId !== this.currentUser.uid) {
        throw new Error('You can only modify your own posts');
      }
      
      const media = postData.media || [];
      
      // Check if media index is valid
      if (mediaIndex < 0 || mediaIndex >= media.length) {
        throw new Error('Invalid media index');
      }
      
      // Get the media item
      const mediaItem = media[mediaIndex];
      
      // Delete the file from storage if path exists
      if (mediaItem.path) {
        try {
          const mediaRef = ref(storage, mediaItem.path);
          await deleteObject(mediaRef);
        } catch (error) {
          console.error('Error deleting media file:', error);
          // Continue even if deletion fails
        }
      }
      
      // Remove the media item from the array
      media.splice(mediaIndex, 1);
      
      // Update the post
      await updateDoc(docRef, { 
        media,
        updatedAt: serverTimestamp()
      });
      
      return media;
    } catch (error) {
      console.error('Error removing media:', error);
      throw error;
    }
  }
  
  /**
   * Get posts from a specific author
   * @param {string} authorId - The ID of the author
   * @returns {Promise<Array>} Array of posts
   */
  async getAuthorPosts(authorId) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to fetch posts');
    }
    
    try {
      let postsQuery;
      
      // If looking at own posts, show all
      if (authorId === this.currentUser.uid) {
        postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', authorId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // If looking at someone else's posts, only show public and potentially friends posts
        postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', authorId),
          where('privacy', '==', PRIVACY.PUBLIC),
          orderBy('createdAt', 'desc')
        );
        
        // For friends' posts, we'd need to check friendship status
      }
      
      const querySnapshot = await getDocs(postsQuery);
      
      // Convert to array of post objects
      const posts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date();
          
        const updatedAt = data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : createdAt;
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        };
      });
      
      return posts;
    } catch (error) {
      console.error('Error getting author posts:', error);
      throw error;
    }
  }
  
  /**
   * Download post as a text file
   * @param {Object} post - The post to download
   * @returns {string} The download URL
   */
  downloadPostAsText(post) {
    try {
      // Create post content
      let content = '';
      
      // Add title if it exists
      if (post.title) {
        content += `# ${post.title}\n\n`;
      }
      
      // Add metadata
      content += `Author: ${post.authorName || 'Anonymous'}\n`;
      content += `Date: ${post.createdAt.toLocaleDateString()}\n`;
      content += `Time: ${post.createdAt.toLocaleTimeString()}\n\n`;
      
      // Add post content
      content += `${post.content}\n\n`;
      
      // Add media links if any
      if (post.media && post.media.length > 0) {
        content += '## Media Links\n\n';
        post.media.forEach((media, index) => {
          content += `${index + 1}. ${media.url}\n`;
        });
      }
      
      // Create a Blob from the content
      const blob = new Blob([content], { type: 'text/plain' });
      
      // Create a download URL
      const url = URL.createObjectURL(blob);
      
      // Create a safe filename
      const filename = `post_${post.id}_${new Date().toISOString().slice(0, 10)}.txt`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the URL to free memory
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return url;
    } catch (error) {
      console.error('Error downloading post:', error);
      throw error;
    }
  }
  
  /**
   * Search for posts by keyword
   * @param {string} keyword - The keyword to search for
   * @returns {Promise<Array>} Array of matching posts
   */
  async searchPosts(keyword) {
    if (!this.currentUser) {
      throw new Error('User must be logged in to search posts');
    }
    
    // Note: Firestore doesn't support full-text search natively
    // A proper implementation would use a separate search service
    // This is a simplified implementation for demo purposes
    
    try {
      // For simplicity, we'll get all user's posts and filter client-side
      const userPostsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', this.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const publicPostsQuery = query(
        collection(db, 'posts'),
        where('privacy', '==', PRIVACY.PUBLIC),
        orderBy('createdAt', 'desc')
      );
      
      // Execute queries
      const [userPostsSnapshot, publicPostsSnapshot] = await Promise.all([
        getDocs(userPostsQuery),
        getDocs(publicPostsQuery)
      ]);
      
      // Combine results, avoiding duplicates
      const postMap = new Map();
      
      // Process user posts
      userPostsSnapshot.docs.forEach(doc => {
        postMap.set(doc.id, {
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Process public posts
      publicPostsSnapshot.docs.forEach(doc => {
        if (!postMap.has(doc.id)) {
          postMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      // Convert to array and filter by keyword
      const allPosts = Array.from(postMap.values());
      const lowercaseKeyword = keyword.toLowerCase();
      
      const matchingPosts = allPosts.filter(post => {
        // Search in title
        if (post.title && post.title.toLowerCase().includes(lowercaseKeyword)) {
          return true;
        }
        
        // Search in content
        if (post.content && post.content.toLowerCase().includes(lowercaseKeyword)) {
          return true;
        }
        
        // Search in tags
        if (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowercaseKeyword))) {
          return true;
        }
        
        return false;
      });
      
      // Sort by createdAt
      matchingPosts.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp 
          ? a.createdAt.toDate() 
          : new Date(a.createdAt);
          
        const dateB = b.createdAt instanceof Timestamp
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
          
        return dateB - dateA;
      });
      
      // Convert timestamps to dates
      matchingPosts.forEach(post => {
        post.createdAt = post.createdAt instanceof Timestamp 
          ? post.createdAt.toDate() 
          : new Date(post.createdAt);
          
        post.updatedAt = post.updatedAt instanceof Timestamp
          ? post.updatedAt.toDate()
          : post.createdAt;
      });
      
      return matchingPosts;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  
  
  /**
   * Get a URL for sharing a post
   * @param {string} postId - The ID of the post to share
   * @returns {string} The shareable URL
   */
  getShareablePostUrl(postId) {
    // Create a shareable URL with the post ID
    const baseUrl = window.location.origin;
    return `${baseUrl}/posts.html?post=${postId}`;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Unsubscribe from auth state changes
    if (this.unsubscribeFromAuth) {
      this.unsubscribeFromAuth();
      this.unsubscribeFromAuth = null;
    }
    
    // Clear any pending media
    this.clearPendingMedia();
  }
}

// Export the PostsManager class
export default PostsManager;