// Authentication Manager Class
class AuthManager {
    constructor() {
      // Initialize users array from localStorage if available
      this.loadFromStorage();
    }
  
    // Helper to load data from localStorage
    loadFromStorage() {
      try {
        // Load users array
        const storedUsers = localStorage.getItem('bondTreeUsers');
        window.bondTreeUsers = storedUsers ? JSON.parse(storedUsers) : [];
        
        // Load current user session
        const storedUser = localStorage.getItem('currentUser');
        window.currentUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        window.bondTreeUsers = [];
        window.currentUser = null;
      }
    }
  
    // Helper to save data to localStorage  
    saveToStorage() {
      try {
        localStorage.setItem('bondTreeUsers', JSON.stringify(window.bondTreeUsers));
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  
    signup(name, email, password) {
      // Make sure data is loaded from storage
      this.loadFromStorage();
      
      // Check if user already exists
      if (window.bondTreeUsers.some(user => user.email === email)) {
        return false;
      }
  
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        friends: [],
        savedMoods: []
      };
  
      window.bondTreeUsers.push(newUser);
      this.saveToStorage();
      return true;
    }
  
    login(email, password) {
      // Make sure data is loaded from storage
      this.loadFromStorage();
      
      const user = window.bondTreeUsers.find(
        u => u.email === email && u.password === password
      );
      
      if (user) {
        // Create a deep copy of the user to avoid direct reference issues
        window.currentUser = JSON.parse(JSON.stringify(user));
        this.saveToStorage();
        return true;
      }
      return false;
    }
  
    logout() {
      window.currentUser = null;
      localStorage.removeItem('currentUser');
    }
  
    addFriend(friendEmail) {
      if (!window.currentUser) return false;
  
      // Ensure data is fresh
      this.loadFromStorage();
  
      // Check if friend exists and is not already added
      const friendUser = window.bondTreeUsers.find(u => u.email === friendEmail);
      if (!friendUser || window.currentUser.friends.includes(friendEmail)) {
        return false;
      }
  
      window.currentUser.friends.push(friendEmail);
      
      // Update users array
      const userIndex = window.bondTreeUsers.findIndex(u => u.id === window.currentUser.id);
      if (userIndex !== -1) {
        window.bondTreeUsers[userIndex].friends = [...window.currentUser.friends];
      }
  
      this.saveToStorage();
      return true;
    }
  
    getFriends() {
      if (!window.currentUser) return [];
      // Ensure data is fresh
      this.loadFromStorage();
      return window.currentUser.friends || [];
    }
  
    // Save mood with synchronization to users array
    // Support both old and new method signatures for backward compatibility
    saveMood(moods, notes = '') {
      if (!window.currentUser) return false;
  
      try {
        // Ensure data is fresh
        this.loadFromStorage();
  
        const now = new Date();
        
        // Format the date as MM/DD
        const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;
        
        // Format the time as HH:MM
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert to 12-hour format
        const formattedTime = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  
        // Add mood to current user's saved moods with timestamp and notes
        window.currentUser.savedMoods = window.currentUser.savedMoods || [];
        window.currentUser.savedMoods.push({
          date: formattedDate,
          time: formattedTime,
          timestamp: now.getTime(), // Store timestamp for sorting
          moods: [...moods],
          notes: notes.trim() // Store notes if provided
        });
  
        // Update users array
        const userIndex = window.bondTreeUsers.findIndex(u => u.id === window.currentUser.id);
        if (userIndex !== -1) {
          window.bondTreeUsers[userIndex].savedMoods = [...window.currentUser.savedMoods];
        }
  
        this.saveToStorage();
        
        // Refresh friends data
        const friendsData = this.getFriendsData();
        window.currentUser.friends = friendsData.map(friend => friend.email);
        this.saveToStorage();
        
        return true;
      } catch (error) {
        console.error("Error saving mood:", error);
        return false;
      }
    }
  
    // Get saved moods
    getSavedMoods() {
      if (!window.currentUser) return [];
      // Ensure data is fresh
      this.loadFromStorage();
      return window.currentUser.savedMoods || [];
    }
    
    /**
     * Get all friends' data including their moods
     * @returns {Array} Array of friend objects with safe data
     */
    getFriendsData() {
      if (!window.currentUser) return [];
      
      // Ensure data is fresh
      this.loadFromStorage();
      
      const friendsData = [];
      
      // Get friends emails from current user
      const friendEmails = window.currentUser.friends || [];
      
      // Loop through each friend email and get their data
      for (const friendEmail of friendEmails) {
        // Find the friend in the users array
        const friendUser = window.bondTreeUsers.find(u => u.email === friendEmail);
        
        if (friendUser) {
          // Create a safe copy without password
          const safeFriendData = {
            id: friendUser.id,
            name: friendUser.name, 
            email: friendUser.email,
            savedMoods: friendUser.savedMoods || []
          };
          
          friendsData.push(safeFriendData);
        }
      }
      
      return friendsData;
    }
  }
  
  // Pre-populate with some sample users function
  function initializeSampleUsers() {
    // Create an instance of AuthManager
    const authManager = new AuthManager();
    
    // Only add sample users if no users exist
    if (!window.bondTreeUsers || window.bondTreeUsers.length === 0) {
      authManager.signup('John Doe', 'john@example.com', 'password123');
      authManager.signup('Jane Smith', 'jane@example.com', 'password456');
    }
  }
  
  // Attach to window to make globally accessible
  window.AuthManager = AuthManager;
  window.initializeSampleUsers = initializeSampleUsers;
  
  // Call initialization immediately
  initializeSampleUsers();