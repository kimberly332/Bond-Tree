// Import AuthManager and auth from the optimized auth-manager.js
// Remove the reference to initializeSampleUsers since it's not used
import AuthManager, { auth } from './auth-manager.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded - initializing auth.js with Firebase");

  // Check for dashboard parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const showDashboard = urlParams.get('showDashboard');

  if (showDashboard === 'true') {
    // Hide login form and show dashboard immediately 
    // (the auth state listener will verify if user is actually logged in)
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const dashboardForm = document.getElementById('dashboard');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'none';
    if (dashboardForm) dashboardForm.style.display = 'block';
  }

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

  // Add this to the DOMContentLoaded event handler
const usernameInput = document.getElementById('signup-username');
const usernameStatus = document.getElementById('username-status');
let usernameTimer;

if (usernameInput) {
  usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim();
    
    // Clear previous timer
    clearTimeout(usernameTimer);
    
    // Reset status
    usernameStatus.textContent = '';
    usernameStatus.style.color = '';
    
    // Basic format validation
    if (username.length > 0) {
      if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        usernameStatus.textContent = 'Username must be 3-15 characters with only letters, numbers, and underscores';
        usernameStatus.style.color = '#e74c3c';
        return;
      }
      
      // Show checking message
      usernameStatus.textContent = 'Checking availability...';
      usernameStatus.style.color = '#3498db';
      
      // Set a small delay to avoid too many requests while typing
      usernameTimer = setTimeout(async () => {
        const isAvailable = await authManager.checkUsernameAvailability(username);
        
        if (isAvailable) {
          usernameStatus.textContent = 'Username is available!';
          usernameStatus.style.color = '#2ecc71';
        } else {
          usernameStatus.textContent = 'Username is already taken';
          usernameStatus.style.color = '#e74c3c';
        }
      }, 500); // Wait 500ms after the user stops typing
    }
  });
}

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
        const result = await authManager.login(email, password);
        
        if (result.success) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = authManager.currentUser.name;
          loginError.style.display = 'none';
        } else {
          loginError.textContent = result.message || 'Invalid email or password';
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
      const username = document.getElementById('signup-username').value;
        
      // Validate inputs
    if (!name || !email || !password || !username) {
        signupError.textContent = 'Please fill in all fields';
        signupError.style.display = 'block';
        return;
      }

      // Check if username is valid
    if (usernameStatus.style.color !== 'rgb(46, 204, 113)') { // The green color hex #2ecc71
        signupError.textContent = 'Please choose a valid and available username';
        signupError.style.display = 'block';
        return;
      }

      // Check password strength
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters long';
        signupError.style.display = 'block';
        return;
      }

      // Validate username format
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        signupError.textContent = 'Username must be 3-15 characters and contain only letters, numbers, and underscores';
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

      // Add this line to change the text:
      signupBtn.textContent = "Creating Account...";
      
      try {
        // Attempt to sign up
        const result = await authManager.signup(name, email, password, username);
        
        if (result.success) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = name;
          signupError.style.display = 'none';
        } else {
          // Show the specific error message
          signupError.textContent = result.message;
          signupError.style.display = 'block';
        }
      } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = 'An unexpected error occurred. Please try again.';
        signupError.style.display = 'block';
      } finally {
        signupBtn.disabled = false;
        // Add this line to reset the text:
        signupBtn.textContent = "Create Account";
      }
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const result = await authManager.logout();
        if (result.success) {
          dashboardForm.style.display = 'none';
          loginForm.style.display = 'block';
        } else {
          alert('Error logging out: ' + result.message);
        }
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
      // This is the line that needs to be changed
      const friendIdentifier = prompt('Enter your friend\'s username or email:');
      
      if (friendIdentifier) {
        try {
          const result = await authManager.addFriend(friendIdentifier);
          if (result.success) {
            alert('Friend added successfully!');
          } else {
            alert(result.message || 'Could not add friend. They may not exist or are already in your list.');
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
    // Hide the loading screen
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  
    // Show the auth container
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.style.display = 'block';
    }
    
    // Check if we're returning from mood-ball page
    const returnToDashboard = sessionStorage.getItem('returnToDashboard');
    
    if (user) {
      // User is logged in, show dashboard
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'none';
      if (dashboardForm) {
        dashboardForm.style.display = 'block';
        
        const updateUserInfo = () => {
            if (authManager.currentUser) {
              // Update the user name
              if (userNameSpan) {
                userNameSpan.textContent = authManager.currentUser.name;
              }
              
              // Display the username
              const usernameSpan = document.getElementById('user-username');
              if (usernameSpan) {
                // Check if username exists in the user data
                if (authManager.currentUser.username) {
                  usernameSpan.textContent = authManager.currentUser.username;
                } else {
                  usernameSpan.textContent = "No username set";
                }
                
                // For debugging - log what we're seeing
                console.log("Current user data:", authManager.currentUser);
              } else {
                console.error("Username span element not found!");
              }
              
              // Clear the flag after using it
              if (returnToDashboard) {
                sessionStorage.removeItem('returnToDashboard');
              }
            } else {
              // If currentUser isn't available yet, wait a short time and try again
              setTimeout(updateUserInfo, 100);
            }
          };
        
        // Start trying to update the user info
        updateUserInfo();
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
      // Add the user's email to the mood object
      latestMood.userEmail = friend.email;
      
      const friendCard = createFriendCard(friend.name, latestMood, false);
      cardsContainer.appendChild(friendCard);
    }
  });
    
    // Add the tree icon SVG
    const treeIconElement = bondshipContainer.querySelector('.tree-icon');
    treeIconElement.innerHTML = generateTreeSvg(getBondshipHealth(friendsData));

    if (treeIconElement) {
        const health = getBondshipHealth(friendsData);
        const svgContent = generateTreeSvg(health);
        console.log('SVG Health:', health);
        console.log('SVG Content:', svgContent);
        treeIconElement.innerHTML = svgContent;
      } else {
        console.error('Tree icon element not found');
      }
    
    // Set up note indicators for viewing notes
// Add this at the end of the try block in showFriendsModal
// Add event listeners to delete friend buttons
const deleteButtons = cardsContainer.querySelectorAll('.delete-friend-btn');
deleteButtons.forEach(button => {
  button.addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent modal from closing
    
    const email = button.getAttribute('data-email');
    const friendName = button.closest('.friend-card').querySelector('.friend-name').textContent;
    
    // Confirm deletion
    if (confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) {
      button.disabled = true;
      button.textContent = 'Removing...';
      
      try {
        const result = await authManager.deleteFriend(email);
        if (result.success) {
          // Remove the friend card from the UI
          button.closest('.friend-card').remove();
          
          // Check if there are any friends left
          if (cardsContainer.children.length <= 1) { // Only current user left
            // Reload the modal to show empty state
            document.body.removeChild(modalOverlay);
            showFriendsModal(authManager);
          }
        } else {
          alert(result.message || 'Could not remove friend.');
          button.disabled = false;
          button.textContent = 'Unfriend';
        }
      } catch (error) {
        console.error('Error removing friend:', error);
        alert('Error removing friend: ' + error.message);
        button.disabled = false;
        button.textContent = 'Unfriend';
      }
    }
  });
});

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
    
    // Add date and time information
    const dateTimeInfo = `${mood.date} at ${mood.time || ''}`;
    
    // Create card HTML - add delete button only for friends (not for current user)
    let cardHTML = `
        <div class="friend-name">${name}</div>
        <div class="friend-mood-circle" style="background: ${moodColors}"></div>
        <div class="friend-mood-name">${moodDisplayName}</div>
        <div class="mood-date-time" style="font-size: 0.75rem; color: #666; margin-top: 5px; margin-bottom: 8px;">${dateTimeInfo}</div>
        <div class="mood-emojis">${moodEmojisForCard}</div>
    `;
    
    // Add delete button only if it's not the current user's card
    if (!isCurrentUser) {
      cardHTML += `
        <button class="delete-friend-btn" data-email="${mood.userEmail}" 
            style="background-color: #f44336; color: white; border: none; 
                   padding: 5px 10px; border-radius: 4px; margin-top: 10px; 
                   cursor: pointer; font-size: 0.8rem; font-family: 'Nunito', sans-serif; font-weight: 600;">
      Unfriend
    </button>
      `;
    }
    
    card.innerHTML = cardHTML;
    
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
    
    // For multiple moods, create a compound name with all moods
    return moods.map(mood => mood.name).join(' & ');
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
    console.log('Friends Data:', friendsData);
    
    if (!friendsData || friendsData.length === 0) {
      console.log('No friends, health is 0');
      return 0;
    }
    
    const friendCount = friendsData.length;
    const totalMoodEntries = friendsData.reduce((sum, friend) => 
      sum + (friend.savedMoods ? friend.savedMoods.length : 0), 0);
    
    console.log('Friend Count:', friendCount);
    console.log('Total Mood Entries:', totalMoodEntries);
    
    let health = 20; // Base health
    
    // Add points for friends
    health += Math.min(40, friendCount * 10);
    
    // Add points for engagement (mood entries)
    health += Math.min(40, totalMoodEntries * 2);
    
    const finalHealth = Math.min(100, health);
    console.log('Calculated Health:', finalHealth);
    
    return finalHealth;
  }

// Helper function to generate tree SVG
function generateTreeSvg(health) {
    console.log('Generating Tree SVG with health:', health);

    // Calculate stage (1-10)
    const stage = Math.max(1, Math.min(10, Math.ceil(health / 10)));

    // Dynamic color palette based on health stages
    const colorStages = [
        { max: 2, leafColor: '#E8F5E9', trunkColor: '#A1887F' },     // Very light green
        { max: 4, leafColor: '#A5D6A7', trunkColor: '#795548' },     // Light green
        { max: 6, leafColor: '#66BB6A', trunkColor: '#6D4C41' },     // Medium green
        { max: 8, leafColor: '#4CAF50', trunkColor: '#3E2723' },     // Dark green
        { max: 10, leafColor: '#2E7D32', trunkColor: '#212121' }     // Deep green
      ];
  
    // Find the appropriate color stage
    const colorStage = colorStages.find(s => stage <= s.max) || colorStages[colorStages.length - 1];

  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <!-- Tree trunk -->
    <path d="M50 100 Q45 80 55 60 Q60 50 50 30 Q45 25 50 20" 
           stroke="${colorStage.trunkColor}" stroke-width="8" fill="none"/>
    
    <!-- Tree branches -->
    <path d="M50 60 Q35 55 30 65" stroke="${colorStage.trunkColor}" stroke-width="5" fill="none"/>
    <path d="M53 50 Q70 45 75 55" stroke="${colorStage.trunkColor}" stroke-width="5" fill="none"/>
   
    <!-- Tree leaves -->
    <ellipse cx="30" cy="55" rx="15" ry="10" fill="${colorStage.leafColor}"/>
    <ellipse cx="50" cy="30" rx="20" ry="15" fill="${colorStage.leafColor}"/>
    <ellipse cx="75" cy="45" rx="15" ry="10" fill="${colorStage.leafColor}"/>
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