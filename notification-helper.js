// notification-helper.js
// This module helps with showing notifications and managing friend request updates

import { db } from './firebase-config.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

class NotificationHelper {
  constructor() {
    this.listeners = new Map();
    this.unsubscribers = new Map();
    this._previousRequestCounts = {};
  }
  
  // Start listening for changes to a user's document
  startUserListener(userId, callback) {
    if (!userId) return null;
    
    // Don't create duplicate listeners
    if (this.unsubscribers.has(userId)) {
      return;
    }
    
    console.log(`Starting listener for user ${userId}`);
    
    // Set up the real-time listener with snapshot metadata
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        userData.id = userId; // Ensure ID is included in the data
        const isLocalUpdate = docSnapshot.metadata.hasPendingWrites;
        
        // Log changes for debugging
        console.log(`User data updated. Local change: ${isLocalUpdate}`);
        console.log('Friend requests:', userData.friendRequests?.length || 0);
        
        // Only process server updates for friend requests
        if (!isLocalUpdate) {
          // Call the callback with the updated user data
          if (typeof callback === 'function') {
            callback(userData);
          }
          
          // Check for new friend requests
          this.checkForNewFriendRequests(userData);
          
          // Notify all registered listeners
          if (this.listeners.has(userId)) {
            const listeners = this.listeners.get(userId);
            listeners.forEach(listener => {
              try {
                listener(userData);
              } catch (error) {
                console.error('Error in user data listener:', error);
              }
            });
          }
        }
      }
    }, (error) => {
      console.error('Error listening to user document:', error);
    });
    
    // Store the unsubscribe function for cleanup
    this.unsubscribers.set(userId, unsubscribe);
    
    return unsubscribe;
  }
  
  // Stop listening to a user's document
  stopUserListener(userId) {
    if (this.unsubscribers.has(userId)) {
      console.log(`Stopping listener for user ${userId}`);
      const unsubscribe = this.unsubscribers.get(userId);
      unsubscribe();
      this.unsubscribers.delete(userId);
    }
  }
  
  // Add a listener for user data changes
  addUserDataListener(userId, listenerFn) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    
    const userListeners = this.listeners.get(userId);
    userListeners.add(listenerFn);
    
    // Start a listener if not already started
    this.startUserListener(userId);
    
    return listenerFn;
  }
  
  // Remove a listener
  removeUserDataListener(userId, listenerFn) {
    if (this.listeners.has(userId)) {
      const userListeners = this.listeners.get(userId);
      userListeners.delete(listenerFn);
      
      // If no more listeners, stop the real-time updates
      if (userListeners.size === 0) {
        this.stopUserListener(userId);
        this.listeners.delete(userId);
      }
    }
  }
  
  // Check for new friend requests
  checkForNewFriendRequests(userData) {
    // Get only pending requests
    const pendingRequests = (userData.friendRequests || [])
      .filter(req => req.status === 'pending');
    
    // Compare with stored previous count
    const userId = userData.id;
    const prevCount = this._previousRequestCounts[userId] || 0;
    const currentCount = pendingRequests.length;
    
    console.log(`Previous request count: ${prevCount}, Current count: ${currentCount}`);
    
    if (currentCount > prevCount) {
      // New request(s) arrived!
      const newCount = currentCount - prevCount;
      const message = newCount === 1 
        ? 'You have a new friend request!'
        : `You have ${newCount} new friend requests!`;
      
      // Show browser notification
      this.showNotification('Bond Tree', {
        body: message,
        icon: 'bond-tree-logo.svg'
      });
      
      // Update UI badge
      this.updateFriendRequestBadge(currentCount);
    } else if (currentCount !== prevCount) {
      // Count changed (probably decreased)
      this.updateFriendRequestBadge(currentCount);
    }
    
    // Update stored count for this user
    this._previousRequestCounts[userId] = currentCount;
  }
  
  // Show a browser notification (if permitted)
  async showNotification(title, options = {}) {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    } 
    // Otherwise, request permission
    else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        return new Notification(title, options);
      }
    }
  }
  
  // Update UI to show friend request badge
  updateFriendRequestBadge(count, buttonId = 'friend-requests-btn') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    // Remove any existing badge
    const existingBadge = button.querySelector('.request-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    // Add badge if there are requests
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'request-badge';
      badge.textContent = count;
      badge.style.cssText = `
        background-color: #f44336;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.75rem;
        position: absolute;
        top: -5px;
        right: -5px;
        font-weight: bold;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      `;
      
      // Make the button position relative if it's not already
      if (window.getComputedStyle(button).position === 'static') {
        button.style.position = 'relative';
      }
      
      button.appendChild(badge);
      
      // Add a subtle animation to draw attention
      button.style.animation = 'pulse 2s infinite';
    } else {
      // Remove any animation
      button.style.animation = '';
    }
  }
  
  // Clean up all listeners (call this when logging out)
  cleanup() {
    for (const userId of this.unsubscribers.keys()) {
      this.stopUserListener(userId);
    }
    
    this.listeners.clear();
    this.unsubscribers.clear();
    this._previousRequestCounts = {};
  }
}

// Create and export a singleton instance
const notificationHelper = new NotificationHelper();
export default notificationHelper;