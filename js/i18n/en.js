/**
 * English (en) translations for Bond Tree
 */

export const en = {
    // Common elements
    common: {
      appName: "Bond Tree",
      tagline: "Let's grow your bondship",
      footer: "Bond Tree - Connect with your emotions and share with friends",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      share: "Share",
      view: "View",
      create: "Create",
      update: "Update",
      close: "Close",
      submit: "Submit",
      success: "Success!",
      error: "Error",
      warning: "Warning",
      back: "Back",
      next: "Next",
      previous: "Previous",
      yes: "Yes",
      no: "No",
      loadMore: "Load More",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      all: "All",
      confirm: "Confirm",
      download: "Download"
    },
    
    // Authentication related
    auth: {
      login: "Log In",
      signup: "Sign Up",
      logout: "Log Out",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      fullName: "Full Name",
      username: "Username",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      loginWith: "Log in with {{provider}}",
      signupWith: "Sign up with {{provider}}",
      or: "Or",
      welcomeBack: "Welcome, {{name}}!",
      yourUsername: "Your Username",
      usernameAvailable: "Username is available!",
      usernameTaken: "Username is already taken",
      usernameChecking: "Checking availability...",
      usernameRequirements: "Username must be 3-15 characters with only letters, numbers, and underscores",
      minPasswordLength: "Password must be at least 6 characters long",
      passwordsDontMatch: "Passwords do not match",
      requiredField: "Please fill in all fields",
      authRequired: "Authentication Required",
      authRequiredMsg: "Please sign in to access this feature and continue your Bond Tree journey.",
      goToLogin: "Go to Login"
    },
    
    // Dashboard
    dashboard: {
      dashboard: "Dashboard",
      welcome: "Welcome, {{name}}!",
      createMood: "Create Mood",
      addBond: "Add Bond",
      bondingRequests: "Bonding Requests",
      viewBondships: "View Bondships",
      myJournal: "My Journal"
    },
    
    // Mood Ball
    mood: {
      createMoodBall: "Let's create your mood ball!",
      chooseFeelings: "Choose your feelings",
      howAreYouFeeling: "How are you feeling?",
      selectEmotions: "Select up to 3 emotions",
      notesPlaceholder: "Share a little about how you're feeling today... (optional)",
      saveTodaysMood: "Save Today's Mood",
      moodHistory: "Your Mood History",
      noSavedMoods: "No saved moods yet. Save your first mood!",
      moodSaved: "Mood saved successfully!",
      moodDeleted: "Mood deleted successfully!",
      confirmDelete: "Are you sure you want to delete this mood?",
      selectAtLeastOne: "Please select at least one mood before saving.",
      
      // Standard moods
      calm: "Calm",
      sad: "Sad",
      tired: "Tired",
      anxious: "Anxious",
      happy: "Happy",
      angry: "Angry",
      peaceful: "Peaceful",
      grateful: "Grateful",
      energetic: "Energetic",
      bored: "Bored",
      nostalgic: "Nostalgic",
      confused: "Confused",
      loved: "Loved",
      creative: "Creative",
      hopeful: "Hopeful",
      relaxed: "Relaxed",
      melancholy: "Melancholy",
      proud: "Proud",
      
      // Custom moods
      customMoods: "Your Custom Moods",
      createCustomMood: "Create Custom Mood",
      editCustomMood: "Edit Custom Mood",
      manageCustomMoods: "Manage Custom Moods",
      addNewCustomMood: "Add New Custom Mood",
      moodName: "Mood Name",
      moodColor: "Mood Color",
      chooseEmoji: "Choose Emoji",
      saveCustomMood: "Save Custom Mood",
      noCustomMoods: "You haven't created any custom moods yet.",
      moodMustHaveName: "Mood must have a name and color",
      moodNameExists: "A mood with this name already exists. Please use a different name.",
      customMoodCreated: "Custom mood created successfully!",
      customMoodUpdated: "Custom mood updated successfully!",
      createNew: "Create New"
    },
    
    // Posts/Journal
    posts: {
      myJournal: "My Journal",
      createNewPost: "Create New Post",
      title: "Title (optional)",
      content: "What's on your mind today?",
      addMedia: "Add Photos/Videos",
      privacySettings: "Who can see this?",
      visibleToFriends: "Visible to Friends",
      passcodeProtected: "Friends with Passcode",
      passcode: "4-Digit Passcode",
      passcodeHint: "Friends will need this passcode to view your post",
      passcodeRequired: "Please enter a valid 4-digit passcode for your private post.",
      publishPost: "Publish Post",
      noPosts: "You haven't created any posts yet. Start by sharing your thoughts above!",
      postPublished: "Post published successfully!",
      postUpdated: "Post updated successfully!",
      postDeleted: "Post deleted successfully!",
      confirmDeletePost: "Are you sure you want to delete this post? This action cannot be undone.",
      failedPublish: "Failed to publish post. Please try again.",
      failedUpdate: "Failed to update post. Please try again.",
      failedDelete: "Failed to delete post. Please try again.",
      failedLoad: "Failed to load posts. Please try again.",
      untitledPost: "Untitled Post",
      enterPasscode: "Enter Passcode",
      passcodeProtectedPost: "This post requires a 4-digit passcode to view.",
      incorrectPasscode: "Incorrect passcode. Please try again.",
      emptyContent: "Please enter some content for your post.",
      contentTooLong: "Content is too long. Maximum length is {{maxLength}} characters.",
      linkCopied: "Post link copied to clipboard!",
      sharePost: "Share Post",
      copyLink: "Copy Link",
      shareVia: "Share via",
      
      // Post sorting/filtering
      allPosts: "All Posts",
      friendVisiblePosts: "Friend-Visible Posts",
      passcodeProtectedPosts: "Passcode-Protected Posts",
      newestFirst: "Newest First",
      oldestFirst: "Oldest First"
    },
    
    // Friends/Bonds
    friends: {
      friend: "Friend",
      friends: "Friends",
      addFriend: "Add Friend",
      removeFriend: "Remove Friend",
      friendRequests: "Friend Requests",
      sendFriendRequest: "Send Friend Request",
      acceptFriendRequest: "Accept",
      rejectFriendRequest: "Reject",
      friendAdded: "Friend added successfully!",
      friendRemoved: "Friend removed successfully!",
      requestSent: "Friend request sent successfully!",
      requestAccepted: "Friend request accepted!",
      requestRejected: "Friend request rejected.",
      noFriendRequests: "You have no pending friend requests.",
      enterFriendIdentifier: "Enter your friend's username or email:",
      confirmRemoveFriend: "Are you sure you want to remove {{name}} from your friends list?",
      noFriendsYet: "You have no friends added yet. Use the \"Add Friend\" button to connect with others.",
      
      // Bondship Tree
      blossomingBondship: "Blossoming Bondship!",
      healthyBondship: "A Healthy Bondship!",
      growingBondship: "Growing Bondship!",
      newBondship: "New Bondship!",
      plantYourBondship: "Plant Your Bondship!",
      friendsMood: "Friend's Mood"
    },
    
    // Language selection
    language: {
      languageSelection: "Language",
      selectLanguage: "Select Language",
      english: "English",
      traditionalChinese: "Traditional Chinese"
    }
  };