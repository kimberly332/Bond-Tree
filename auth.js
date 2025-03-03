// Import AuthManager and auth from the optimized auth-manager.js
import AuthManager, { auth } from './auth-manager.js';

// Wait for the DOM to be fully loaded

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded - initializing auth.js with Firebase");

  // Add a timeout to prevent infinite loading screen
  const loadingTimeout = setTimeout(() => {
    const loadingContainer = document.getElementById('loading-container');
  const authContainer = document.querySelector('.auth-container');
    
  if (loadingContainer && loadingContainer.style.display !== 'none') {
    console.log("Loading timeout triggered - forcing display of auth container");
    loadingContainer.style.display = 'none';
    if (authContainer) {
      authContainer.style.display = 'block';
    }
  }
  }, 8000); // 8 seconds timeout

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
  try {
    const authManager = new AuthManager();
    console.log("AuthManager initialized successfully");
    
    // Your existing code continues here...
    // (Rest of the auth.js code remains unchanged)
    
  } catch (error) {
    console.error("Error initializing AuthManager:", error);
  // If AuthManager fails to initialize, show the login screen
  const loadingContainer = document.getElementById('loading-container');
  const authContainer = document.querySelector('.auth-container');
  
  if (loadingContainer) loadingContainer.style.display = 'none';
  if (authContainer) authContainer.style.display = 'block';
  
  // Display error to user
  const loginError = document.getElementById('login-error');
  if (loginError) {
    loginError.textContent = "There was a problem loading the application. Please try again.";
    loginError.style.display = 'block';
  }
  }
});

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
        <button class="modal-close btn btn-icon">&times;</button>
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
              <button class="accept-request btn btn-primary" data-email="${request.from}">Accept</button>
              <button class="reject-reques btn btn-danger" data-email="${request.from}">Reject</button>
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
      <button class="delete-friend-btn btn btn-danger" data-email="${mood.userEmail}" 
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

// Placeholder for tree SVG (removed)
function generateTreeSvg(health) {
  // Calculate stage (1-10)
  const stage = Math.max(1, Math.min(10, Math.ceil(health / 10)));
  
  // Opacity variations based on health
  const opacity = Math.max(0.3, stage / 10);

  return `<img src="bond-tree-logo.svg" alt="">`;
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

// Updated function to show Friends Modal with proper tree SVG
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
    // Get friends data asynchronously
    authManager.getFriendsData().then(friendsData => {
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