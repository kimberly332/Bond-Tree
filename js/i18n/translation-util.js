/**
 * Translation Utility for Bond Tree
 * 
 * This utility script helps migrate existing HTML pages to 
 * support internationalization by adding data-i18n attributes.
 */

// Map of English text to translation keys
// This helps automate the process of adding data-i18n attributes
const TEXT_TO_KEY_MAP = {
    // Common elements
    'Bond Tree': 'common.appName',
    "Let's grow your bondship": 'common.tagline',
    'Loading...': 'common.loading',
    'Save': 'common.save',
    'Cancel': 'common.cancel',
    'Delete': 'common.delete',
    'Edit': 'common.edit',
    'Share': 'common.share',
    'View': 'common.view',
    'Create': 'common.create',
    'Update': 'common.update',
    'Close': 'common.close',
    'Submit': 'common.submit',
    'Success!': 'common.success',
    'Error': 'common.error',
    'Warning': 'common.warning',
    'Back': 'common.back',
    'Next': 'common.next',
    'Previous': 'common.previous',
    'Yes': 'common.yes',
    'No': 'common.no',
    'Load More': 'common.loadMore',
    'Search': 'common.search',
    'Filter': 'common.filter',
    'Sort': 'common.sort',
    'All': 'common.all',
    'Confirm': 'common.confirm',
  
    // Auth related
    'Login': 'auth.login',
    'Log In': 'auth.login',
    'Sign Up': 'auth.signup',
    'Logout': 'auth.logout',
    'Log Out': 'auth.logout',
    'Email': 'auth.email',
    'Email or Username': 'auth.email',
    'Password': 'auth.password',
    'Confirm Password': 'auth.confirmPassword',
    'Forgot Password?': 'auth.forgotPassword',
    'Reset Password': 'auth.resetPassword',
    'Full Name': 'auth.fullName',
    'Username': 'auth.username',
    'Create Account': 'auth.createAccount',
    'Already have an account?': 'auth.alreadyHaveAccount',
    "Don't have an account?": 'auth.dontHaveAccount',
    'Your Username': 'auth.yourUsername',
    'Authentication Required': 'auth.authRequired',
    'Please sign in to access this feature and continue your Bond Tree journey.': 'auth.authRequiredMsg',
    'Go to Login': 'auth.goToLogin',
  
    // Dashboard
    'Create Mood': 'dashboard.createMood',
    'Add Bond': 'dashboard.addBond',
    'Bonding Requests': 'dashboard.bondingRequests',
    'View Bondships': 'dashboard.viewBondships',
    'My Journal': 'dashboard.myJournal',
  
    // Mood related
    "Let's create your mood ball!": 'mood.createMoodBall',
    'Choose your feelings': 'mood.chooseFeelings',
    'How are you feeling?': 'mood.howAreYouFeeling',
    'Select up to 3 emotions': 'mood.selectEmotions',
    "Save Today's Mood": 'mood.saveTodaysMood',
    'Your Mood History': 'mood.moodHistory',
    'No saved moods yet. Save your first mood!': 'mood.noSavedMoods',
    'Mood saved successfully!': 'mood.moodSaved',
    'Mood deleted successfully!': 'mood.moodDeleted',
    'Are you sure you want to delete this mood?': 'mood.confirmDelete',
    'Please select at least one mood before saving.': 'mood.selectAtLeastOne',
  
    // Standard moods
    'Calm': 'mood.calm',
    'Sad': 'mood.sad',
    'Tired': 'mood.tired',
    'Anxious': 'mood.anxious',
    'Happy': 'mood.happy',
    'Angry': 'mood.angry',
    'Peaceful': 'mood.peaceful',
    'Grateful': 'mood.grateful',
    'Energetic': 'mood.energetic',
    'Bored': 'mood.bored',
    'Nostalgic': 'mood.nostalgic',
    'Confused': 'mood.confused',
    'Loved': 'mood.loved',
    'Creative': 'mood.creative',
    'Hopeful': 'mood.hopeful',
    'Relaxed': 'mood.relaxed',
    'Melancholy': 'mood.melancholy',
    'Proud': 'mood.proud',
    
    // Custom moods
    'Your Custom Moods': 'mood.customMoods',
    'Create Custom Mood': 'mood.createCustomMood',
    'Edit Custom Mood': 'mood.editCustomMood',
    'Manage Custom Moods': 'mood.manageCustomMoods',
    'Add New Custom Mood': 'mood.addNewCustomMood',
    'Mood Name': 'mood.moodName',
    'Mood Color': 'mood.moodColor',
    'Choose Emoji': 'mood.chooseEmoji',
    'Save Custom Mood': 'mood.saveCustomMood',
    "You haven't created any custom moods yet.": 'mood.noCustomMoods',
    'Create New': 'mood.createNew',
  
    // Posts/Journal
    'My Journal': 'posts.myJournal',
    'Create New Post': 'posts.createNewPost',
    'Title (optional)': 'posts.title',
    "What's on your mind today?": 'posts.content',
    'Add Photos/Videos': 'posts.addMedia',
    'Who can see this?': 'posts.privacySettings',
    'Visible to Friends': 'posts.visibleToFriends',
    'Friends with Passcode': 'posts.passcodeProtected',
    '4-Digit Passcode': 'posts.passcode',
    'Friends will need this passcode to view your post': 'posts.passcodeHint',
    'Publish Post': 'posts.publishPost',
    "You haven't created any posts yet. Start by sharing your thoughts above!": 'posts.noPosts',
    'Enter Passcode': 'posts.enterPasscode',
  
    // Sorting/filtering
    'All Posts': 'posts.allPosts',
    'Friend-Visible Posts': 'posts.friendVisiblePosts',
    'Passcode-Protected Posts': 'posts.passcodeProtectedPosts',
    'Newest First': 'posts.newestFirst',
    'Oldest First': 'posts.oldestFirst',
  
    // Friends
    'Friend': 'friends.friend',
    'Friends': 'friends.friends',
    'Friend Requests': 'friends.friendRequests',
    'Accept': 'friends.acceptFriendRequest',
    'Reject': 'friends.rejectFriendRequest',
    "You have no pending friend requests.": 'friends.noFriendRequests',
    "You have no friends added yet. Use the \"Add Friend\" button to connect with others.": 'friends.noFriendsYet',
    "Friend's Mood": 'friends.friendsMood',
  };
  
  // Function to add data-i18n attributes to elements based on their text content
  function addI18nAttributes() {
    // Process all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
  
    // Store nodes to modify (to avoid modifying during traversal)
    const nodesToModify = [];
  
    // First collect all text nodes
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      
      // Skip nodes in script and style elements
      if (
        parent.tagName === 'SCRIPT' ||
        parent.tagName === 'STYLE' ||
        parent.hasAttribute('data-i18n') ||
        parent.getAttribute('data-no-i18n') === 'true'
      ) {
        continue;
      }
  
      const text = node.textContent.trim();
      
      // Skip empty text
      if (!text) continue;
  
      // Check if this text maps to a key
      if (TEXT_TO_KEY_MAP[text]) {
        nodesToModify.push({
          node: node,
          parent: parent,
          text: text,
          key: TEXT_TO_KEY_MAP[text]
        });
      }
    }
  
    // Now modify the nodes
    nodesToModify.forEach(item => {
      const { parent, key } = item;
      
      // Skip if the parent already has a translation key
      if (parent.hasAttribute('data-i18n')) {
        return;
      }
      
      // Add the data-i18n attribute to the parent element
      parent.setAttribute('data-i18n', key);
      console.log(`Added data-i18n="${key}" to:`, parent);
    });
  
    // Handle other common attributes
    // Placeholders
    document.querySelectorAll('input[placeholder]').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (TEXT_TO_KEY_MAP[placeholder] && !input.hasAttribute('data-i18n-placeholder')) {
        input.setAttribute('data-i18n-placeholder', TEXT_TO_KEY_MAP[placeholder]);
      }
    });
  
    // Handle hardcoded welcome message with username
    const welcomeElements = Array.from(document.querySelectorAll('h2')).filter(el => 
      el.textContent.includes('Welcome,') && !el.hasAttribute('data-i18n')
    );
    
    welcomeElements.forEach(el => {
      el.setAttribute('data-i18n', 'dashboard.welcome');
      el.setAttribute('data-i18n-params', '{"name": "{{name}}"}');
    });
  }
  
  // Run this function when the document is fully loaded
  document.addEventListener('DOMContentLoaded', addI18nAttributes);