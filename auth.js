// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sample users
    window.initializeSampleUsers();
  
    // Initialize authentication manager
    const authManager = new window.AuthManager();
  
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
      loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
  
        if (authManager.login(email, password)) {
          // Show dashboard
          loginForm.style.display = 'none';
          signupForm.style.display = 'none';
          dashboardForm.style.display = 'block';
          userNameSpan.textContent = window.currentUser.name;
          loginError.style.display = 'none';
        } else {
          loginError.textContent = 'Invalid email or password';
          loginError.style.display = 'block';
        }
      });
    }
  
    // Signup functionality
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
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
  
        // Attempt to sign up
        if (authManager.signup(name, email, password)) {
          // Automatically log in the new user
          const loginSuccess = authManager.login(email, password);
          
          if (loginSuccess) {
            // Show dashboard
            loginForm.style.display = 'none';
            signupForm.style.display = 'none';
            dashboardForm.style.display = 'block';
            userNameSpan.textContent = name;
            signupError.style.display = 'none';
          } else {
            signupError.textContent = 'Signup successful, but login failed';
            signupError.style.display = 'block';
          }
        } else {
          signupError.textContent = 'Email already exists';
          signupError.style.display = 'block';
        }
      });
    }
  
    // Logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authManager.logout();
        dashboardForm.style.display = 'none';
        loginForm.style.display = 'block';
      });
    }
  
    // Create Mood functionality
    if (createMoodBtn) {
      createMoodBtn.addEventListener('click', () => {
        if (window.currentUser) {
          // Redirect to the mood ball page
          window.location.href = 'mood-ball.html';
        }
      });
    }
  
    // Add Friend functionality
    if (addFriendBtn) {
      addFriendBtn.addEventListener('click', () => {
        const friendEmail = prompt('Enter your friend\'s email:');
        if (friendEmail) {
          if (authManager.addFriend(friendEmail)) {
            alert('Friend added successfully!');
          } else {
            alert('Could not add friend. They may not exist or are already in your list.');
          }
        }
      });
    }
  
    // View Friends functionality with cleaner UI
    if (viewFriendsBtn) {
      viewFriendsBtn.addEventListener('click', () => {
        showFriendsModal(authManager);
      });
    }
  });
  
  // Function to create and show the friends modal
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
          <h2 class="modal-title">Friends List</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="friends-list">
            <!-- Friends will be added here -->
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
    
    // Get the friends list element
    const friendsList = modalOverlay.querySelector('.friends-list');
    
    // Get friends data
    const friendsData = authManager.getFriendsData ? 
                       authManager.getFriendsData() : 
                       getFriendsDataFallback(authManager);
    
    // Display empty state if no friends
    if (!friendsData || friendsData.length === 0) {
      friendsList.innerHTML = `
        <div class="empty-message">
          <p>You have no friends added yet. Use the "Add Friend" button to connect with others.</p>
        </div>
      `;
      return;
    }
    
    // Display each friend
    let friendsHTML = '';
    
    friendsData.forEach(friend => {
      const moodsHTML = generateMoodsHTML(friend.savedMoods || []);
      
      friendsHTML += `
        <div class="friend-card">
          <div class="friend-info">
            <h3 class="friend-name">${friend.name}</h3>
            <p class="friend-email">${friend.email}</p>
          </div>
          
          <h4 class="moods-title">Recent Moods</h4>
          ${moodsHTML}
        </div>
      `;
    });
    
    friendsList.innerHTML = friendsHTML;
    
    // Now add the mood sections dynamically (this can't be done in innerHTML)
    const moodBalls = modalOverlay.querySelectorAll('.mood-ball');
    moodBalls.forEach(ball => {
      const moodsData = JSON.parse(ball.getAttribute('data-moods'));
      const sectionHeight = 100 / moodsData.length;
      
      moodsData.forEach((mood, index) => {
        const section = document.createElement('div');
        section.className = 'mood-section';
        section.style.backgroundColor = mood.color;
        section.style.height = `${sectionHeight}%`;
        section.style.top = `${index * sectionHeight}%`;
        ball.appendChild(section);
      });
    });
  }
  
  // Generate HTML for mood items
  function generateMoodsHTML(moods) {
    if (!moods || moods.length === 0) {
      return `<div class="no-moods">No moods shared yet.</div>`;
    }
    
    // Only show the 5 most recent moods
    const recentMoods = moods.slice(-5).reverse();
    
    let moodsHTML = `<div class="moods-container">`;
    
    recentMoods.forEach(mood => {
      // Store the mood data as a JSON string in the data attribute
      const moodsData = JSON.stringify(mood.moods);
      const moodNames = mood.moods.map(m => m.name).join(', ');
      
      moodsHTML += `
        <div class="mood-item">
          <div class="mood-ball" data-moods='${moodsData}'></div>
          <span class="mood-date">${mood.date}</span>
          <span class="mood-names" title="${moodNames}">${moodNames}</span>
        </div>
      `;
    });
    
    moodsHTML += `</div>`;
    return moodsHTML;
  }
  
  // Fallback method to get friends data if the enhanced AuthManager method isn't available
  function getFriendsDataFallback(authManager) {
    if (!window.currentUser) return [];
    
    const friendEmails = authManager.getFriends();
    const friendsData = [];
    
    friendEmails.forEach(email => {
      // Find the user in bondTreeUsers
      const user = window.bondTreeUsers.find(u => u.email === email);
      if (user) {
        // Create a safe copy without the password
        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          savedMoods: user.savedMoods || []
        };
        friendsData.push(safeUser);
      }
    });
    
    return friendsData;
  }