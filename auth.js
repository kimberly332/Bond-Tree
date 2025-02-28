import AuthManager, { initializeSampleUsers, auth } from './auth-manager.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded - initializing auth.js with Firebase");
  
  // Initialize sample users if needed (uncomment if you want to add sample users)
  // initializeSampleUsers();

  // Initialize authentication manager
  const authManager = new AuthManager();

  // DOM Elements for auth
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const dashboardForm = document.getElementById('dashboard');

  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addFriendBtn = document.getElementById('add-friend-btn');
  const viewFriendsBtn = document.getElementById('view-friends-btn');
  const createMoodBtn = document.getElementById('create-mood-btn');

  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');

  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  const userNameSpan = document.getElementById('user-name');

  console.log("DOM elements initialized");

  // Toggle between login and signup forms
  if (showSignupLink) {
    showSignupLink.addEventListener('click', () => {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      loginError.style.display = 'none';
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', () => {
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
      signupError.style.display = 'none';
    });
  }

  // Login functionality
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      // Disable the button during login
      loginBtn.disabled = true;
      
      try {
        const success = await authManager.login(email, password);
        
        if (success) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = authManager.currentUser.name;
          loginError.style.display = 'none';
        } else {
          loginError.textContent = 'Invalid email or password';
          loginError.style.display = 'block';
        }
      } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = `Error: ${error.message || 'Invalid email or password'}`;
        loginError.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
      }
    });
  }

  // Signup functionality
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      // Validate inputs
      if (!name || !email || !password) {
        signupError.textContent = 'Please fill in all fields';
        signupError.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        signupError.style.display = 'block';
        return;
      }

      // Disable button during signup
      signupBtn.disabled = true;
      
      try {
        // Attempt to sign up
        const success = await authManager.signup(name, email, password);
        
        if (success) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = name;
          signupError.style.display = 'none';
        } else {
          signupError.textContent = 'Email already exists or signup failed';
          signupError.style.display = 'block';
        }
      } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = `Error: ${error.message || 'Signup failed'}`;
        signupError.style.display = 'block';
      } finally {
        signupBtn.disabled = false;
      }
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await authManager.logout();
        dashboardForm.style.display = 'none';
        loginForm.style.display = 'block';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
      }
    });
  }

  // Create Mood functionality
  if (createMoodBtn) {
    createMoodBtn.addEventListener('click', () => {
      if (authManager.currentUser) {
        // Redirect to the mood ball page
        window.location.href = 'mood-ball.html';
      }
    });
  }

  // Add Friend functionality
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', async () => {
      const friendEmail = prompt('Enter your friend\'s email:');
      if (friendEmail) {
        try {
          const success = await authManager.addFriend(friendEmail);
          if (success) {
            alert('Friend added successfully!');
          } else {
            alert('Could not add friend. They may not exist or are already in your list.');
          }
        } catch (error) {
          console.error('Add friend error:', error);
          alert('Error adding friend: ' + error.message);
        }
      }
    });
  }

  // View Friends functionality
  if (viewFriendsBtn) {
    viewFriendsBtn.addEventListener('click', () => {
      showFriendsModal(authManager);
    });
  }

  // Set up Firebase auth state listener for UI updates
  auth.onAuthStateChanged(user => {
    if (user && authManager.currentUser) {
      // User is logged in, show dashboard
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'none';
      if (dashboardForm) {
        dashboardForm.style.display = 'block';
        if (userNameSpan && authManager.currentUser) {
          userNameSpan.textContent = authManager.currentUser.name;
        }
      }
    } else {
      // User is logged out, show login form
      if (dashboardForm) dashboardForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
    }
  });
});

// Show Friends Modal function
async function showFriendsModal(authManager) {
  // Remove any existing modal first
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // Create the modal structure
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  const modalHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Friend's Mood</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bondship-container">
          <!-- Tree and status will be added dynamically -->
          <div class="loading-indicator" style="text-align: center; padding: 20px;">
            Loading friends data...
          </div>
        </div>
      </div>
    </div>
  `;
  
  modalOverlay.innerHTML = modalHTML;
  document.body.appendChild(modalOverlay);
  
  // Add close button functionality
  const closeButton = modalOverlay.querySelector('.modal-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  // Click outside to close
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  });
  
  // Get the bondship container
  const bondshipContainer = modalOverlay.querySelector('.bondship-container');
  
  try {
    // Get friends data asynchronously
    const friendsData = await authManager.getFriendsData();
    
    // Remove loading indicator
    const loadingIndicator = modalOverlay.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // Display empty state if no friends
    if (!friendsData || friendsData.length === 0) {
      bondshipContainer.innerHTML = `
        <div class="empty-message">
          <p>You have no friends added yet. Use the "Add Friend" button to connect with others.</p>
        </div>
      `;
      return;
    }
    
    // Create the tree and status section
    const treeHTML = `
      <div class="bondship-tree">
        <div class="tree-container">
          <div class="tree-icon">
            <!-- SVG tree can be added here -->
          </div>
          <div class="tree-pot"></div>
        </div>
      </div>
      <div class="bondship-status">
        <h3>${getBondshipStatus(friendsData)}</h3>
      </div>
      <div class="friend-cards-container">
        <!-- Friend cards will be added here -->
      </div>
    `;
    
    bondshipContainer.innerHTML = treeHTML;
    
    // Get the cards container
    const cardsContainer = bondshipContainer.querySelector('.friend-cards-container');
    
    // Add current user card first
    const currentUserMoods = authManager.currentUser.savedMoods || [];
    const latestUserMood = currentUserMoods.length > 0 ? 
      currentUserMoods.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
    
    if (latestUserMood) {
      const userCard = createFriendCard('Me', latestUserMood, true);
      cardsContainer.appendChild(userCard);
    }
    
    // Add friend cards
    friendsData.forEach(friend => {
      const latestMood = friend.savedMoods && friend.savedMoods.length > 0 ? 
        friend.savedMoods.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
      
      if (latestMood) {
        const friendCard = createFriendCard(friend.name, latestMood, false);
        cardsContainer.appendChild(friendCard);
      }
    });
    
    // Add the tree icon SVG
    const treeIconElement = bondshipContainer.querySelector('.tree-icon');
    treeIconElement.innerHTML = generateTreeSvg(getBondshipHealth(friendsData));
    
    // Set up note indicators for viewing notes
    setupNoteIndicators();
  } catch (error) {
    console.error('Error showing friends modal:', error);
    bondshipContainer.innerHTML = `
      <div class="empty-message">
        <p>Error loading friends data. Please try again later.</p>
        <p style="color: red; font-size: 0.8rem;">${error.message}</p>
      </div>
    `;
  }
}

// Helper functions - Keeping the same implementations
// Mood to Emoji Mapping
const moodEmojis = {
  Calm: '😌',
  Sad: '😢',
  Tired: '😴',
  Anxious: '😰',
  Happy: '😊',
  Angry: '😠',
  Peaceful: '🙂',
  Grateful: '🙏',
  Energetic: '⚡',
  Bored: '😒',
  Nostalgic: '🌇',
  Confused: '🤔',
  Loved: '❤️',
  Creative: '🎨',
  Hopeful: '🌟',
  Relaxed: '😎',
  Melancholy: '😔',
  Proud: '😌'
};

// Helper function to create a friend card
function createFriendCard(name, mood, isCurrentUser) {
  const card = document.createElement('div');
  card.className = 'friend-card';
  
  // Create mood gradient
  const moodColors = getMoodGradient(mood.moods);
  
  // Get mood names for display and emojis
  const moodDisplayName = getMoodName(mood.moods);
  
  // Get emojis for the moods
  const moodEmojisForCard = mood.moods
      .map(m => moodEmojis[m.name] || '😐') // Default to neutral face if no emoji found
      .join(' ');
  
  // Create card HTML
  card.innerHTML = `
      <div class="friend-name">${name}</div>
      <div class="friend-mood-circle" style="background: ${moodColors}"></div>
      <div class="friend-mood-name">${moodDisplayName}</div>
      <div class="mood-emojis">${moodEmojisForCard}</div>
  `;
  
  // Add note indicator if there are notes
  if (mood.notes) {
      const moodName = card.querySelector('.friend-mood-name');
      const noteIndicator = document.createElement('div');
      noteIndicator.className = 'mood-note-indicator';
      noteIndicator.setAttribute('data-notes', encodeURIComponent(mood.notes));
      noteIndicator.setAttribute('data-date', mood.date);
      noteIndicator.setAttribute('data-time', mood.time || '');
      noteIndicator.textContent = '📝';
      noteIndicator.style.marginLeft = '5px';
      noteIndicator.style.cursor = 'pointer';
      moodName.appendChild(noteIndicator);
  }
  
  return card;
}

// Helper function to generate mood gradient
function getMoodGradient(moods) {
  if (!moods || moods.length === 0) {
      return 'linear-gradient(to bottom, #f0f0f0, #d0d0d0)';
  }
  
  if (moods.length === 1) {
      return moods[0].color || '#f0f0f0';
  }
  
  // For two or more moods, create a gradient
  const colorStops = moods.map((mood, index) => {
      const color = mood.color || '#f0f0f0';
      const percent = (index * 100) / (moods.length - 1);
      return `${color} ${percent}%`;
  }).join(', ');
  
  return `linear-gradient(to bottom, ${colorStops})`;
}

// Helper function to get mood name
function getMoodName(moods) {
  if (!moods || moods.length === 0) {
      return 'No Mood';
  }
  
  if (moods.length === 1) {
      return moods[0].name || 'Unknown Mood';
  }
  
  // For multiple moods, create a compound name
  if (moods.length === 2) {
      return `${moods[0].name} & ${moods[1].name}`;
  }
  
  return `${moods[0].name} & more`;
}

// Helper function to get bondship status text
function getBondshipStatus(friendsData) {
  const health = getBondshipHealth(friendsData);
  
  if (health >= 80) {
    return 'Blossoming Bondship!';
  } else if (health >= 60) {
    return 'A Healthy Bondship!';
  } else if (health >= 40) {
    return 'Growing Bondship!';
  } else if (health >= 20) {
    return 'New Bondship!';
  } else {
    return 'Plant Your Bondship!';
  }
}

// Helper function to calculate bondship health (0-100)
function getBondshipHealth(friendsData) {
  if (!friendsData || friendsData.length === 0) {
    return 0;
  }
  
  // Simple health calculation based on number of friends and mood entries
  const friendCount = friendsData.length;
  const totalMoodEntries = friendsData.reduce((sum, friend) => 
    sum + (friend.savedMoods ? friend.savedMoods.length : 0), 0);
  
  // Calculate health (customize this logic as needed)
  let health = 20; // Base health
  
  // Add points for friends
  health += Math.min(40, friendCount * 10);
  
  // Add points for engagement (mood entries)
  health += Math.min(40, totalMoodEntries * 2);
  
  return Math.min(100, health);
}

// Helper function to generate tree SVG
function generateTreeSvg(health) {
  // Choose color based on health
  let leafColor;
  
  if (health >= 80) {
    leafColor = '#FF80AB'; // Pink for blossoming
  } else if (health >= 50) {
    leafColor = '#8BC34A'; // Green for healthy
  } else if (health >= 30) {
    leafColor = '#AED581'; // Light green for growing
  } else {
    leafColor = '#C5E1A5'; // Very light green for new
  }
  
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <!-- Tree trunk -->
    <path d="M50 100 Q45 80 55 60 Q60 50 50 30 Q45 25 50 20" stroke="#8B4513" stroke-width="8" fill="none"/>
    
    <!-- Tree branches -->
    <path d="M50 60 Q35 55 30 65" stroke="#8B4513" stroke-width="5" fill="none"/>
    <path d="M53 50 Q70 45 75 55" stroke="#8B4513" stroke-width="5" fill="none"/>
   
    <!-- Tree leaves -->
    <ellipse cx="30" cy="55" rx="15" ry="10" fill="${leafColor}"/>
    <ellipse cx="50" cy="30" rx="20" ry="15" fill="${leafColor}"/>
    <ellipse cx="75" cy="45" rx="15" ry="10" fill="${leafColor}"/>
  </svg>`;
}

// Setup note indicators function
function setupNoteIndicators() {
  const noteIndicators = document.querySelectorAll('.mood-note-indicator');
  noteIndicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const notes = decodeURIComponent(indicator.getAttribute('data-notes'));
      const date = indicator.getAttribute('data-date');
      const time = indicator.getAttribute('data-time');
      showNoteModal({ notes, date, time });
    });
  });
}

// Helper function to show the note modal
function showNoteModal(moodData) {
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'friend-note-modal';
  const modalContent = document.createElement('div');
  modalContent.className = 'friend-note-modal-content';
  const header = document.createElement('div');
  header.className = 'friend-note-header';
  const date = document.createElement('div');
  date.className = 'friend-note-date';
  date.textContent = `${moodData.date} at ${moodData.time || ''}`;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'friend-note-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
  });
  header.appendChild(date);
  header.appendChild(closeBtn);
  const body = document.createElement('div');
  body.className = 'friend-note-body';
  body.textContent = moodData.notes;
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modal.appendChild(modalContent);
  // Add click handler to close when clicking outside
  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          document.body.removeChild(modal);
      }
  });
  // Add keyboard handling for accessibility
  modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
          document.body.removeChild(modal);
      }
  });
  // Make modal focusable for keyboard accessibility
  modal.tabIndex = -1;
  // Add to document
  document.body.appendChild(modal);
  // Focus the close button for keyboard accessibility
  setTimeout(() => closeBtn.focus(), 100);
}