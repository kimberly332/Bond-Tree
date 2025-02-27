// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sample users
    window.initializeSampleUsers();
  
    // Initialize authentication manager
    const authManager = new window.AuthManager();
  
    // DOM Elements
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
    showSignupLink.addEventListener('click', () => {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      loginError.style.display = 'none';
    });
  
    showLoginLink.addEventListener('click', () => {
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
      signupError.style.display = 'none';
    });
  
    // Login functionality
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
  
    // Signup functionality
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
  
    // Logout functionality
    logoutBtn.addEventListener('click', () => {
      authManager.logout();
      dashboardForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  
    // Create Mood functionality
    createMoodBtn.addEventListener('click', () => {
      if (window.currentUser) {
        // Redirect to the mood ball page
        window.location.href = 'mood-ball.html';
      }
    });
  
    // Add Friend functionality
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
  
    // View Friends functionality
    viewFriendsBtn.addEventListener('click', () => {
      const friends = authManager.getFriends();
      if (friends.length > 0) {
        alert('Your friends:\n' + friends.join('\n'));
      } else {
        alert('You have no friends added yet.');
      }
    });
  });