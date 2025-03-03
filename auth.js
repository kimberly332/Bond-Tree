// Import AuthManager and auth from the optimized auth-manager.js
import AuthManager, { auth } from './auth-manager.js';
import { showNoteModal } from './mood-ball.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add viewport height fix for mobile browsers
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Update on resize
  window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });

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
  const sendFriendRequestBtn = document.getElementById('send-friend-request-btn');
  const viewFriendsBtn = document.getElementById('view-friends-btn');
  const createMoodBtn = document.getElementById('create-mood-btn');
  const friendRequestsBtn = document.getElementById('friend-requests-btn');

  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');

  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  const userNameSpan = document.getElementById('user-name');

  // Username availability checking
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
      const identifier = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      // Disable the button during login
      loginBtn.disabled = true;
      
      try {
        const result = await authManager.login(identifier, password);
        
        if (result.success) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = authManager.currentUser.name;
          loginError.style.display = 'none';
        } else {
          loginError.textContent = result.message || 'Invalid username/email or password';
          loginError.style.display = 'block';
        }
      } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = `Error: ${error.message || 'Invalid username/email or password'}`;
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
      const friendIdentifier = prompt('Enter your friend\'s username or email:');
      
      if (friendIdentifier) {
        try {
          const result = await authManager.sendFriendRequest(friendIdentifier);
          if (result.success) {
            alert('Friend request sent successfully!');
          } else {
            alert(result.message || 'Could not send friend request. They may not exist or a request is already pending.');
          }
        } catch (error) {
          console.error('Add friend error:', error);
          alert('Error sending friend request: ' + error.message);
        }
      }
    });
  }

  // Send Friend Request functionality
  if (sendFriendRequestBtn) {
    sendFriendRequestBtn.addEventListener('click', async () => {
      const friendIdentifierPrompt = prompt('Enter your friend\'s username or email:');
      
      if (friendIdentifierPrompt) {
        try {
          const result = await authManager.sendFriendRequest(friendIdentifierPrompt);
          if (result.success) {
            alert('Friend request sent successfully!');
          } else {
            alert(result.message || 'Could not send friend request. Please check the username or email and try again.');
          }
        } catch (error) {
          console.error('Send friend request error:', error);
          alert('Error sending friend request: ' + error.message);
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

  // Friend Requests Button functionality
  if (friendRequestsBtn) {
    friendRequestsBtn.addEventListener('click', () => {
      showFriendRequestsModal(authManager);
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
            
            // Update friend requests badge
            updateFriendRequestsBadge(authManager);
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

// Helper functions and constants defined outside document ready
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

// Create a function to show the Friend Requests modal
async function showFriendRequestsModal(authManager) {
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
        <h2 class="modal-title">Friend Requests</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div id="friend-requests-container">
          <div class="loading-indicator" style="text-align: center; padding: 20px;">
            Loading friend requests...
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
  
  // Get the requests container
  const requestsContainer = modalOverlay.querySelector('#friend-requests-container');
  
  try {
    // Get pending friend requests from the AuthManager
    const friendRequests = authManager.getFriendRequests();
    
    // Remove loading indicator
    const loadingIndicator = requestsContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // Display empty state if no friend requests
    if (!friendRequests || friendRequests.length === 0) {
      requestsContainer.innerHTML = `
        <div class="empty-message">
          <p>You have no pending friend requests.</p>
        </div>
      `;
      return;
    }
    
    // Create the friend requests list
    const requestsListHTML = `
      <div class="friend-requests-list">
        ${friendRequests.map(request => `
          <div class="friend-request-card">
            <div class="friend-request-info">
              <h3>${request.fromName}</h3>
              <p>${request.from}</p>
            </div>
            <div class="friend-request-actions">
              <button class="accept-request" data-email="${request.from}">Accept</button>
              <button class="reject-request" data-email="${request.from}">Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    requestsContainer.innerHTML = requestsListHTML;
    
    // Set up event listeners for accept and reject buttons
    const acceptButtons = requestsContainer.querySelectorAll('.accept-request');
    const rejectButtons = requestsContainer.querySelectorAll('.reject-request');
    
    acceptButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const email = button.getAttribute('data-email');
        button.disabled = true;
        button.textContent = 'Accepting...';
        
        try {
          const result = await authManager.acceptFriendRequest(email);
          if (result.success) {
            // Remove this request card
            const requestCard = button.closest('.friend-request-card');
            requestCard.classList.add('accepted');
            requestCard.innerHTML = `
              <div class="friend-request-info">
                <h3>${requestCard.querySelector('h3').textContent}</h3>
                <p>${email}</p>
                <p style="color: #4CAF50; margin-top: 5px; font-weight: bold;">Friend request accepted!</p>
              </div>
            `;
            
            // Update the badge count
            setTimeout(() => {
              updateFriendRequestsBadge(authManager);
            }, 1000);
            
            // Check if there are any requests left
            setTimeout(() => {
              const remainingRequests = requestsContainer.querySelectorAll('.friend-request-card:not(.accepted):not(.rejected)');
              if (remainingRequests.length === 0) {
                // Reload the modal to show empty state
                document.body.removeChild(modalOverlay);
                showFriendRequestsModal(authManager);
              }
            }, 1500);
          } else {
            alert(result.message || 'Could not accept friend request.');
            button.disabled = false;
            button.textContent = 'Accept';
          }
        } catch (error) {
          console.error('Error accepting friend request:', error);
          alert('Error accepting friend request: ' + error.message);
          button.disabled = false;
          button.textContent = 'Accept';
        }
      });
    });
    
    rejectButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const email = button.getAttribute('data-email');
        button.disabled = true;
        button.textContent = 'Rejecting...';
        
        try {
          const result = await authManager.rejectFriendRequest(email);
          if (result.success) {
            // Remove this request card
            const requestCard = button.closest('.friend-request-card');
            requestCard.classList.add('rejected');
            requestCard.innerHTML = `
              <div class="friend-request-info">
                <h3>${requestCard.querySelector('h3').textContent}</h3>
                <p>${email}</p>
                <p style="color: #f44336; margin-top: 5px; font-weight: bold;">Friend request rejected</p>
              </div>
            `;
            
            // Update the badge count
            setTimeout(() => {
              updateFriendRequestsBadge(authManager);
            }, 1000);
            
            // Check if there are any requests left
            setTimeout(() => {
              const remainingRequests = requestsContainer.querySelectorAll('.friend-request-card:not(.accepted):not(.rejected)');
              if (remainingRequests.length === 0) {
                // Reload the modal to show empty state
                document.body.removeChild(modalOverlay);
                showFriendRequestsModal(authManager);
              }
            }, 1500);
          } else {
            alert(result.message || 'Could not reject friend request.');
            button.disabled = false;
            button.textContent = 'Reject';
          }
        } catch (error) {
          console.error('Error rejecting friend request:', error);
          alert('Error rejecting friend request: ' + error.message);
          button.disabled = false;
          button.textContent = 'Reject';
        }
      });
    });
    
  } catch (error) {
    console.error('Error showing friend requests modal:', error);
    requestsContainer.innerHTML = `
      <div class="empty-message">
        <p>Error loading friend requests. Please try again later.</p>
        <p style="color: red; font-size: 0.8rem;">${error.message}</p>
      </div>
    `;
  }
}

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
      <button class="delete-friend-btn" data-email="${mood.userEmail}">
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

// Add this function to handle the note click - FIXED VERSION
function handleNoteClick(event) {
  event.stopPropagation(); // Prevent event bubbling
  
  const indicator = event.currentTarget;
  const notes = decodeURIComponent(indicator.getAttribute('data-notes'));
  const date = indicator.getAttribute('data-date');
  const time = indicator.getAttribute('data-time');
  
  console.log("Note clicked:", { notes, date, time });
  
  // Create and show custom note modal
  showCustomNoteModal({
    notes: notes,
    date: date,
    time: time || ''
  });
}

// Custom modal function specifically for notes in the friends view
function showCustomNoteModal(moodData) {
  // Remove any existing note modals to prevent stacking
  const existingModals = document.querySelectorAll('.note-modal');
  existingModals.forEach(modal => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });
  
  // Create a modal that overlays everything
  const modal = document.createElement('div');
  modal.className = 'note-modal friend-note-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  
  // Add content using the mood-ball page's structure
  modal.innerHTML = `
    <div class="note-modal-content friend-note-modal-content">
      <div class="note-header friend-note-header">
        <div class="note-date friend-note-date">${moodData.date} at ${moodData.time}</div>
        <button class="note-close friend-note-close" aria-label="Close">&times;</button>
      </div>
      <div class="note-body friend-note-body">${moodData.notes}</div>
    </div>
  `;
  
  // Add close functionality
  const closeBtn = modal.querySelector('.note-close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close when clicking outside the content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Close with Escape key
  const closeOnEscape = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  document.addEventListener('keydown', closeOnEscape);
  
  // Append to body
  document.body.appendChild(modal);
  
  // Focus the close button for accessibility
  setTimeout(() => closeBtn.focus(), 100);
}

// Setup note indicators function - FIXED VERSION
function setupNoteIndicators() {
  const noteIndicators = document.querySelectorAll('.mood-note-indicator');
  console.log(`Setting up ${noteIndicators.length} note indicators`);
  
  noteIndicators.forEach(indicator => {
    // Remove any existing event listeners to prevent duplicates
    indicator.removeEventListener('click', handleNoteClick);
    // Add the click event listener
    indicator.addEventListener('click', handleNoteClick);
    console.log("Added click listener to note indicator");
  });
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

// Helper function to get bondship status text
function getBondshipStatus(health) {
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

// Tree SVG generator
function generateTreeSvg(health) {
  // Calculate stage (1-10)
  const stage = Math.max(1, Math.min(10, Math.ceil(health / 10)));
  
  // Opacity variations based on health
  const opacity = Math.max(0.3, stage / 10);

  return `<img src="bond-tree-logo.svg" alt="">`;
}

// Updated function to show Friends Modal
function showFriendsModal(authManager) {
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
    // First check the friends array directly from the auth manager
    console.log("Current user's friends array:", authManager.getFriends());
    
    // Get friends data asynchronously with more detailed logging
    authManager.getFriendsData().then(friendsData => {
      console.log("Retrieved friend data:", friendsData);
      
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
      
      // Calculate bondship health based on friends data
      const health = getBondshipHealth(friendsData);
      
      // Create the tree and status section
      const treeHTML = `
        <div class="bondship-tree">
          <div class="tree-container">
            <div class="tree-icon">
              ${generateTreeSvg(health)}
            </div>
          </div>
        </div>
        <div class="bondship-status">
          <h3>${getBondshipStatus(health)}</h3>
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
      console.log("Current user moods:", currentUserMoods.length);
      
      const latestUserMood = currentUserMoods.length > 0 ? 
        currentUserMoods.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
      
      if (latestUserMood) {
        const userCard = createFriendCard('Me', latestUserMood, true);
        cardsContainer.appendChild(userCard);
      }
      
      // Add friend cards with added debugging
      friendsData.forEach(friend => {
        console.log(`Processing friend: ${friend.name}`, friend);
        const latestMood = friend.savedMoods && friend.savedMoods.length > 0 ? 
          friend.savedMoods.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
        
        console.log(`Latest mood for ${friend.name}:`, latestMood);
        
        if (latestMood) {
          // Add the user's email to the mood object
          latestMood.userEmail = friend.email;
          
          const friendCard = createFriendCard(friend.name, latestMood, false);
          cardsContainer.appendChild(friendCard);
        } else {
          // Create a card even if the friend has no moods
          console.log(`${friend.name} has no moods, creating empty card`);
          const emptyMood = {
            date: "No mood yet",
            userEmail: friend.email,
            moods: []
          };
          const friendCard = createFriendCard(friend.name, emptyMood, false);
          cardsContainer.appendChild(friendCard);
        }
      });

      // IMPORTANT: Set up note indicators AFTER all cards are added to the DOM
      setupNoteIndicators();
      
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
    }).catch(error => {
      console.error('Error showing friends modal:', error);
      bondshipContainer.innerHTML = `
        <div class="empty-message">
          <p>Error loading friends data. Please try again later.</p>
          <p style="color: red; font-size: 0.8rem;">${error.message}</p>
        </div>
      `;
    });
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

// Helper function to update the notification badge
function updateFriendRequestsBadge(authManager) {
  const friendRequestsBtn = document.getElementById('friend-requests-btn');
  if (!friendRequestsBtn) return;
  
  const requestCount = authManager.getFriendRequests().length;
  
  // Remove any existing badge
  const existingBadge = friendRequestsBtn.querySelector('.request-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // Add badge if there are requests
  if (requestCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'request-badge';
    badge.textContent = requestCount;
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
    `;
    
    // Make the button position relative if it's not already
    if (window.getComputedStyle(friendRequestsBtn).position === 'static') {
      friendRequestsBtn.style.position = 'relative';
    }
    
    friendRequestsBtn.appendChild(badge);
    
    // Add a subtle animation to draw attention
    friendRequestsBtn.style.animation = 'pulse 2s infinite';
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(styleSheet);
  } else {
    // Remove any animation
    friendRequestsBtn.style.animation = '';
  }
}