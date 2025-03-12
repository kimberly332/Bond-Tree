/**
 * Bond Tree - Posts UI Interactions
 * 
 * This file handles all UI interactions for the posts/journal feature, including:
 * - Creating, editing, and deleting posts
 * - Viewing and commenting on posts
 * - Managing media uploads
 * - Handling post privacy settings (public to friends, private with passcode)
 */

import { auth } from '../firebase-config.js';
import AuthManager from '../auth/auth-manager.js';
import PostsManager from './posts-manager.js';

// Initialize managers
const authManager = new AuthManager();
const postsManager = new PostsManager();

// Declare elements outside of the function to make it global
let elements = {};

// App state
const appState = {
  currentUser: null,
  isLoading: false,
  currentFilters: {
    privacy: 'all',
    sort: 'newest'
  },
  currentPost: null,
  currentMediaIndex: 0,
  mediaItems: []
};

// Constants
const MAX_CONTENT_LENGTH = 1000;
const TRUNCATE_LENGTH = 300;

// Privacy types
const PRIVACY = {
  PUBLIC: 'public',     // Visible to friends only
  PRIVATE: 'private'    // Visible to friends with passcode
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initialize the application
 */
function initApp() {
  console.log("DOM loaded - initializing posts.js");
  
  // Set up keyboard accessibility
  setupKeyboardAccessibility();
  
  // Add viewport height fix for mobile browsers
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Update on resize
  window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });
  
  // Cache DOM elements
  cacheElements();

  // Add event listeners
  addEventListeners();

  // Setup passcode field
  setupPasscodeField();

  // Check authentication state with Firebase
  auth.onAuthStateChanged(handleAuthStateChange);
}

// Cache DOM elements to avoid repeated lookups
function cacheElements() {
  elements = {
    // Main containers
    loginWarning: document.getElementById('login-warning'),
    mainContent: document.querySelector('.container'),
    header: document.querySelector('header'),
    footer: document.querySelector('footer'),
    backButton: document.getElementById('back-to-dashboard'),
    
    // New post form
    postForm: document.getElementById('post-form'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postMedia: document.getElementById('post-media'),
    mediaPreview: document.getElementById('media-preview'),
    publishButton: document.getElementById('publish-button'),
    charsCount: document.getElementById('chars-count'),
    
    // Posts container
    postsContainer: document.getElementById('posts-container'),
    noPostsMessage: document.getElementById('no-posts-message'),
    loadMoreContainer: document.getElementById('load-more-container'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    
    // Filters
    privacyFilter: document.getElementById('privacy-filter'),
    sortFilter: document.getElementById('sort-filter'),
    
    // Edit post modal
    editPostModal: document.getElementById('edit-post-modal'),
    editPostForm: document.getElementById('edit-post-form'),
    editPostId: document.getElementById('edit-post-id'),
    editPostTitle: document.getElementById('edit-post-title'),
    editPostContent: document.getElementById('edit-post-content'),
    editMediaPreview: document.getElementById('edit-media-preview'),
    deletePostBtn: document.getElementById('delete-post-btn'),
    closeEditModal: document.getElementById('close-edit-modal'),
    editCharsCount: document.getElementById('edit-chars-count'),
    
    // View post modal
    viewPostModal: document.getElementById('view-post-modal'),
    viewPostTitle: document.getElementById('view-post-title'),
    viewPostAuthor: document.getElementById('view-post-author'),
    viewPostDate: document.getElementById('view-post-date'),
    viewPostPrivacyIcon: document.getElementById('view-post-privacy-icon'),
    viewPostPrivacyText: document.getElementById('view-post-privacy-text'),
    viewPostContent: document.getElementById('view-post-content'),
    viewMediaContainer: document.getElementById('view-media-container'),
    viewPostActions: document.getElementById('view-post-actions'),
    editPostBtn: document.getElementById('edit-post-btn'),
    sharePostBtn: document.getElementById('share-post-btn'),
    downloadPostBtn: document.getElementById('download-post-btn'),
    closeViewModal: document.getElementById('close-view-modal'),
    
    // Media viewer modal
    mediaViewerModal: document.getElementById('media-viewer-modal'),
    mediaViewerContainer: document.getElementById('media-viewer-container'),
    prevMediaBtn: document.getElementById('prev-media'),
    nextMediaBtn: document.getElementById('next-media'),
    mediaCounter: document.getElementById('media-counter'),
    closeMediaViewer: document.getElementById('close-media-viewer'),
    
    // Passcode modal elements
    passcodeModal: document.getElementById('passcode-modal'),
    passcodeInput1: document.getElementById('passcode-input-1'),
    passcodeInput2: document.getElementById('passcode-input-2'),
    passcodeInput3: document.getElementById('passcode-input-3'),
    passcodeInput4: document.getElementById('passcode-input-4'),
    passcodeError: document.getElementById('passcode-error'),
    submitPasscodeBtn: document.getElementById('submit-passcode'),
    closePasscodeModal: document.getElementById('close-passcode-modal'),
    
    // Passcode form fields
    passcodeField: document.getElementById('passcode-field'),
    postPasscode: document.getElementById('post-passcode'),
    editPasscodeField: document.getElementById('edit-passcode-field'),
    editPostPasscode: document.getElementById('edit-post-passcode')
  };
  
  console.log("DOM elements cached");
}

/**
 * Set up keyboard accessibility for interactive elements
 */
function setupKeyboardAccessibility() {
  // Make modal close buttons accessible
  const closeButtons = document.querySelectorAll('.modal-close');
  closeButtons.forEach(button => {
    button.setAttribute('aria-label', 'Close');
    
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
  
  // Add escape key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals
      closeAllModals();
    }
  });
}

/**
 * Handle Firebase auth state changes
 * @param {Object} user - Firebase user object
 */
function handleAuthStateChange(user) {
  appState.currentUser = user;
  
  if (user) {
    console.log("User logged in:", user.email);
    hideLoginWarning();
    loadPosts();
  } else {
    console.log("No user logged in");
    showLoginWarning();
  }
}

/**
 * Add event listeners for UI interactions
 */
function addEventListeners() {
  // Back button
  if (elements.backButton) {
    elements.backButton.addEventListener('click', handleBackButtonClick);
  }
  
  // Post form submission
  if (elements.postForm) {
    elements.postForm.addEventListener('submit', handleCreatePost);
  }
  
  // Character counter for post content
  if (elements.postContent && elements.charsCount) {
    elements.postContent.addEventListener('input', () => {
      const count = elements.postContent.value.length;
      elements.charsCount.textContent = count;
      updateCharCounter(count, elements.charsCount);
    });
  }
  
  // Edit form character counter
  if (elements.editPostContent && elements.editCharsCount) {
    elements.editPostContent.addEventListener('input', () => {
      const count = elements.editPostContent.value.length;
      elements.editCharsCount.textContent = count;
      updateCharCounter(count, elements.editCharsCount);
    });
  }
  
  // Media upload
  if (elements.postMedia) {
    elements.postMedia.addEventListener('change', handleMediaUpload);
  }
  
  // Filters
  if (elements.privacyFilter) {
    elements.privacyFilter.addEventListener('change', handleFilterChange);
  }
  
  if (elements.sortFilter) {
    elements.sortFilter.addEventListener('change', handleFilterChange);
  }
  
  // Load more button
  if (elements.loadMoreBtn) {
    elements.loadMoreBtn.addEventListener('click', handleLoadMore);
  }
  
  // Edit post form submission
  if (elements.editPostForm) {
    elements.editPostForm.addEventListener('submit', handleUpdatePost);
  }
  
  // Delete post button
  if (elements.deletePostBtn) {
    elements.deletePostBtn.addEventListener('click', handleDeletePost);
  }
  
  // Close edit modal
  if (elements.closeEditModal) {
    elements.closeEditModal.addEventListener('click', () => {
      elements.editPostModal.style.display = 'none';
    });
  }
  
  // Close view modal
  if (elements.closeViewModal) {
    elements.closeViewModal.addEventListener('click', () => {
      elements.viewPostModal.style.display = 'none';
    });
  }
  
  // Edit button in view modal
  if (elements.editPostBtn) {
    elements.editPostBtn.addEventListener('click', () => {
      if (appState.currentPost) {
        openEditModal(appState.currentPost);
        elements.viewPostModal.style.display = 'none';
      }
    });
  }
  
  // Share button in view modal
  if (elements.sharePostBtn) {
    elements.sharePostBtn.addEventListener('click', () => {
      if (appState.currentPost) {
        sharePost(appState.currentPost);
      }
    });
  }
  
  // Download button in view modal
  if (elements.downloadPostBtn) {
    elements.downloadPostBtn.addEventListener('click', () => {
      if (appState.currentPost) {
        downloadPost(appState.currentPost);
      }
    });
  }
  
  // Media viewer navigation
  if (elements.prevMediaBtn) {
    elements.prevMediaBtn.addEventListener('click', showPreviousMedia);
  }
  
  if (elements.nextMediaBtn) {
    elements.nextMediaBtn.addEventListener('click', showNextMedia);
  }
  
  // Close media viewer
  if (elements.closeMediaViewer) {
    elements.closeMediaViewer.addEventListener('click', () => {
      elements.mediaViewerModal.style.display = 'none';
    });
  }
  
  // Click outside to close modals
  window.addEventListener('click', (e) => {
    if (e.target === elements.editPostModal) {
      elements.editPostModal.style.display = 'none';
    }
    
    if (e.target === elements.viewPostModal) {
      elements.viewPostModal.style.display = 'none';
    }
    
    if (e.target === elements.mediaViewerModal) {
      elements.mediaViewerModal.style.display = 'none';
    }
    
    if (e.target === elements.passcodeModal) {
      elements.passcodeModal.style.display = 'none';
    }
  });
}

/**
 * Setup the passcode field visibility based on privacy selection
 */
function setupPasscodeField() {
  const privacyRadios = document.querySelectorAll('input[name="privacy"]');
  const passcodeField = document.getElementById('passcode-field');
  
  privacyRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'private') {
        passcodeField.style.display = 'block';
      } else {
        passcodeField.style.display = 'none';
      }
    });
  });

  // Same for edit form
  const editPrivacyRadios = document.querySelectorAll('input[name="edit-privacy"]');
  const editPasscodeField = document.getElementById('edit-passcode-field');
  
  editPrivacyRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'private') {
        editPasscodeField.style.display = 'block';
      } else {
        editPasscodeField.style.display = 'none';
      }
    });
  });
}

/**
 * Update character counter styling based on length
 * @param {number} count - Current character count
 * @param {Element} element - The counter element to update
 */
function updateCharCounter(count, element) {
  if (count > MAX_CONTENT_LENGTH * 0.9) {
    element.style.color = '#e74c3c'; // Red when very close to limit
  } else if (count > MAX_CONTENT_LENGTH * 0.8) {
    element.style.color = '#e67e22'; // Orange when approaching limit
  } else {
    element.style.color = '#999'; // Default color
  }
}

/**
 * Show login warning when user is not authenticated
 */
function showLoginWarning() {
  if (elements.loginWarning) {
    elements.loginWarning.style.display = 'block';
  }
  
  if (elements.mainContent) {
    elements.mainContent.style.display = 'none';
  }
  
  if (elements.header) {
    elements.header.style.display = 'none';
  }
  
  if (elements.footer) {
    elements.footer.style.display = 'none';
  }
  
  if (elements.backButton) {
    elements.backButton.style.display = 'none';
  }
}

/**
 * Hide login warning when user is authenticated
 */
function hideLoginWarning() {
  if (elements.loginWarning) {
    elements.loginWarning.style.display = 'none';
  }
  
  if (elements.mainContent) {
    elements.mainContent.style.display = 'block';
  }
  
  if (elements.header) {
    elements.header.style.display = 'block';
  }
  
  if (elements.footer) {
    elements.footer.style.display = 'block';
  }
  
  if (elements.backButton) {
    elements.backButton.style.display = 'block';
  }
}

/**
 * Handle back button click
 * @param {Event} e - Click event
 */
function handleBackButtonClick(e) {
  e.preventDefault();
  sessionStorage.setItem('returnToDashboard', 'true');
  window.location.href = 'index.html';
}

/**
 * Load posts based on current filters
 */
/**
 * Load posts based on current filters
 */
async function loadPosts() {
  try {
    // Show loading state
    showLoading();
    
    // Get all visible posts
    const posts = await postsManager.getAllVisiblePosts({
      privacy: appState.currentFilters.privacy,
      sort: appState.currentFilters.sort
    });
    
    // Process the posts based on privacy settings
    const processedPosts = posts.map(post => {
      // If it's the user's own post, show it
      if (post.authorId === appState.currentUser.uid) {
        return { ...post, isOwnPost: true };
      }
      
      // If it's a friend's post
      if (post.isFriendPost) {
        // If public, show it as is
        if (post.privacy === 'public') {
          return post;
        }
        
        // If private, only show limited info in the list but require passcode to view details
        if (post.privacy === 'private') {
          // Create a copy with limited content
          return {
            ...post,
            requiresPasscode: true,
            originalContent: post.content, // Save original content
            content: "This post is protected with a passcode. Click to enter passcode and view.", // Replace with message
            isPrivateFriendPost: true
          };
        }
      }
      
      return post;
    });
    
    // Filter posts based on privacy setting if needed
    let displayPosts = processedPosts;
    
    if (appState.currentFilters.privacy !== 'all') {
      displayPosts = processedPosts.filter(post => {
        // For own posts, filter by exact privacy match
        if (post.isOwnPost) {
          return post.privacy === appState.currentFilters.privacy;
        }
        
        // For friend posts, handle differently
        if (post.isFriendPost) {
          if (appState.currentFilters.privacy === 'public') {
            // Only show public friend posts
            return post.privacy === 'public';
          } else if (appState.currentFilters.privacy === 'private') {
            // Only show private friend posts
            return post.isPrivateFriendPost;
          }
        }
        
        return true;
      });
    }
    
    // Sort the filtered posts
    if (appState.currentFilters.sort === 'newest') {
      displayPosts.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      displayPosts.sort((a, b) => a.createdAt - b.createdAt);
    }
    
    // Log posts for debugging
    console.log('Loaded posts:', displayPosts.length);
    
    // Clear existing posts
    elements.postsContainer.innerHTML = '';
    
    // Show posts or empty state
    if (displayPosts.length === 0) {
      elements.noPostsMessage.style.display = 'block';
      elements.loadMoreContainer.style.display = 'none';
    } else {
      elements.noPostsMessage.style.display = 'none';
      
      // Render posts
      displayPosts.forEach(post => {
        try {
          const postElement = createPostElement(post);
          elements.postsContainer.appendChild(postElement);
        } catch (elementError) {
          console.error('Error creating post element:', elementError, post);
        }
      });
      
      // Show load more button if not filtered view and we have enough posts
      if (displayPosts.length >= postsManager.postsPerPage && !postsManager.reachedEnd) {
        elements.loadMoreContainer.style.display = 'block';
      } else {
        elements.loadMoreContainer.style.display = 'none';
      }
    }
    
    // Hide loading state
    hideLoading();
  } catch (error) {
    console.error('Error loading posts:', error);
    
    // Show error message
    showError('Failed to load posts. Please try again.');
    
    // Hide loading state
    hideLoading();
    
    // Show empty state
    elements.noPostsMessage.style.display = 'block';
    elements.loadMoreContainer.style.display = 'none';
  }
}


/**
 * Handle load more button click
 */
async function handleLoadMore() {
  try {
    // Disable button while loading
    elements.loadMoreBtn.disabled = true;
    elements.loadMoreBtn.textContent = 'Loading...';
    
    // Get more posts
    const posts = await postsManager.getPosts({
      privacy: appState.currentFilters.privacy,
      sort: appState.currentFilters.sort,
      loadMore: true
    });
    
    // Add posts to container
    posts.forEach(post => {
      const postElement = createPostElement(post);
      elements.postsContainer.appendChild(postElement);
    });
    
    // Update load more button state
    elements.loadMoreBtn.disabled = false;
    elements.loadMoreBtn.textContent = 'Load More';
    
    // Hide load more button if we've reached the end
    if (posts.length < postsManager.postsPerPage || postsManager.reachedEnd) {
      elements.loadMoreContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading more posts:', error);
    elements.loadMoreBtn.disabled = false;
    elements.loadMoreBtn.textContent = 'Load More';
    showError('Failed to load more posts. Please try again.');
  }
}

/**
 * Handle filter change
 */
function handleFilterChange() {
  // Update current filters
  appState.currentFilters.privacy = elements.privacyFilter.value;
  appState.currentFilters.sort = elements.sortFilter.value;
  
  // Reset pagination
  postsManager.lastVisible = null;
  postsManager.reachedEnd = false;
  
  // Load posts with new filters
  loadPosts();
}

/**
 * Handle media upload
 * @param {Event} e - Change event
 */
async function handleMediaUpload(e) {
  try {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Process each file
    for (const file of fileArray) {
      // Check file type and size
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        showError('Only images and videos are supported.');
        continue;
      }
      
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        showError('File size must be less than 20MB.');
        continue;
      }
      
      // Add to pending media
      const mediaObj = await postsManager.addPendingMedia(file);
      
      // Create preview element
      const mediaElement = createMediaPreviewElement(mediaObj);
      elements.mediaPreview.appendChild(mediaElement);
    }
    
    // Clear the file input
    e.target.value = '';
  } catch (error) {
    console.error('Error handling media upload:', error);
    showError('Failed to process media. Please try again.');
  }
}

/**
 * Create a media preview element
 * @param {Object} media - Media object
 * @returns {HTMLElement} The media preview element
 */
function createMediaPreviewElement(media) {
  const mediaItem = document.createElement('div');
  mediaItem.className = 'media-item';
  mediaItem.dataset.id = media.id;
  
  // Create appropriate media element based on type
  if (media.type === 'image') {
    const img = document.createElement('img');
    img.src = media.previewUrl;
    img.alt = 'Image preview';
    mediaItem.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = media.previewUrl;
    video.setAttribute('muted', 'true');
    video.setAttribute('controls', 'true');
    mediaItem.appendChild(video);
  }
  
  // Add type icon
  const typeIcon = document.createElement('div');
  typeIcon.className = 'media-type-icon';
  typeIcon.innerHTML = media.type === 'image' ? '<i class="fas fa-image"></i>' : '<i class="fas fa-video"></i>';
  mediaItem.appendChild(typeIcon);
  
  // Add remove button
  const removeBtn = document.createElement('div');
  removeBtn.className = 'remove-media';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.setAttribute('aria-label', 'Remove media');
  removeBtn.setAttribute('tabindex', '0');
  
  // Add click handler for remove button
  removeBtn.addEventListener('click', () => {
    postsManager.removePendingMedia(media.id);
    mediaItem.remove();
  });
  
  // Add keyboard handler for accessibility
  removeBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      postsManager.removePendingMedia(media.id);
      mediaItem.remove();
    }
  });
  
  mediaItem.appendChild(removeBtn);
  
  return mediaItem;
}

/**
 * Handle create post form submission
 * @param {Event} e - Submit event
 */
async function handleCreatePost(e) {
  e.preventDefault();
  
  try {
    // Get form values
    const title = elements.postTitle.value.trim();
    const content = elements.postContent.value.trim();
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    let privacy = PRIVACY.PUBLIC; // Default to public (visible to friends)
    
    // Get selected privacy
    for (const radio of privacyRadios) {
      if (radio.checked) {
        privacy = radio.value;
        break;
      }
    }
    
    // Validate content
    if (!content) {
      showError('Please enter some content for your post.');
      return;
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      showError(`Content is too long. Maximum length is ${MAX_CONTENT_LENGTH} characters.`);
      return;
    }
    
    // Create post data
    const postData = {
      title,
      content,
      privacy,
      authorName: authManager.currentUser?.name || 'Anonymous'
    };
    
    // Add passcode if private post
    if (privacy === PRIVACY.PRIVATE) {
      const passcodeInput = document.getElementById('post-passcode');
      const passcode = passcodeInput.value.trim();
      
      if (!passcode || !/^\d{4}$/.test(passcode)) {
        showError('Please enter a valid 4-digit passcode for your private post.');
        return;
      }
      
      postData.passcode = passcode;
    }
    
    // Disable submit button to prevent double submission
    elements.publishButton.disabled = true;
    elements.publishButton.textContent = 'Publishing...';
    
    // Create post
    const newPost = await postsManager.createPost(postData);
    
    // Reset form
    elements.postForm.reset();
    elements.mediaPreview.innerHTML = '';
    elements.charsCount.textContent = '0';
    document.getElementById('passcode-field').style.display = 'none';
    
    // Re-enable submit button
    elements.publishButton.disabled = false;
    elements.publishButton.textContent = 'Publish Post';
    
    // Show success message
    showSuccess('Post published successfully!');
    
    // Reload posts
    loadPosts();
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Re-enable submit button
    elements.publishButton.disabled = false;
    elements.publishButton.textContent = 'Publish Post';
    
    showError(error.message || 'Failed to publish post. Please try again.');
  }
}

/**
 * Create a post element for display in the posts list
 * @param {Object} post - Post data
 * @returns {HTMLElement} The post element
 */
function createPostElement(post) {
  if (!post) {
    console.error('Attempted to create post element with null/undefined post');
    return document.createElement('div');
  }
  
  const postElement = document.createElement('div');
  postElement.className = 'post-card';
  postElement.dataset.id = post.id;
  
  // Add 'private-friend-post' class for styling if it's a private post from a friend
  if (post.isFriendPost && post.privacy === 'private') {
    postElement.classList.add('private-friend-post');
  }
  
  // Format date
  const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
  const formattedDate = postDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get privacy icon and text
  let privacyIcon = '';
  let privacyText = '';
  
  switch (post.privacy) {
    case 'public':
      privacyIcon = '<i class="fas fa-user-friends"></i>';
      privacyText = 'Visible to Friends';
      break;
    case 'private':
      privacyIcon = '<i class="fas fa-key"></i>';
      privacyText = 'Friends with Passcode';
      break;
    default:
      privacyIcon = '<i class="fas fa-user-friends"></i>';
      privacyText = 'Visible to Friends';
  }
  
  // Create truncated content
  let contentText = post.content || '';
  let isTruncated = contentText.length > TRUNCATE_LENGTH;
  
  // Special handling for private friend posts
  const isPrivateFriendPost = post.isFriendPost && post.privacy === 'private';
  if (isPrivateFriendPost) {
    contentText = "This post is protected with a passcode. Click to view.";
    isTruncated = false;
  } else if (isTruncated) {
    contentText = contentText.substring(0, TRUNCATE_LENGTH) + '...';
  }
  
  // Create media HTML
  let mediaHTML = '';
  
  // Add media previews if available (and not private friend post)
  if (post.media && post.media.length > 0 && !isPrivateFriendPost) {
    if (post.media.length > 4) {
      // Show first 3 and a count for the rest
      mediaHTML = `
        <div class="post-media">
          ${post.media.slice(0, 3).map((media, index) => `
            <div class="post-media-item" data-index="${index}" data-id="${post.id}">
              ${media.type === 'image' 
                ? `<img src="${media.url}" alt="Post image ${index + 1}">`
                : `<video src="${media.url}" muted></video>`
              }
              <div class="media-type-icon">
                <i class="fas fa-${media.type === 'image' ? 'image' : 'video'}"></i>
              </div>
            </div>
          `).join('')}
          <div class="post-media-item post-media-count" data-id="${post.id}">
            +${post.media.length - 3}
          </div>
        </div>
      `;
    } else {
      // Show all media
      mediaHTML = `
        <div class="post-media">
          ${post.media.map((media, index) => `
            <div class="post-media-item" data-index="${index}" data-id="${post.id}">
              ${media.type === 'image' 
                ? `<img src="${media.url}" alt="Post image ${index + 1}">`
                : `<video src="${media.url}" muted></video>`
              }
              <div class="media-type-icon">
                <i class="fas fa-${media.type === 'image' ? 'image' : 'video'}"></i>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // Create the HTML for the post
  postElement.innerHTML = `
    <div class="post-header">
      <div>
        <h3 class="post-title">${post.title || 'Untitled Post'}</h3>
        <div class="post-date">${formattedDate}</div>
      </div>
      <div class="post-privacy-badge">
        ${privacyIcon} ${privacyText}
      </div>
    </div>
    <div class="post-content ${isTruncated ? 'truncated' : ''}">
      ${contentText}
    </div>
    ${(!isPrivateFriendPost && isTruncated) ? '<a class="read-more" href="#" aria-label="Read more of this post">Read more</a>' : ''}
    ${mediaHTML}
    <div class="post-actions">
      <button class="action-btn view-btn" aria-label="View post">
        <i class="fas fa-eye"></i> ${isPrivateFriendPost ? 'Enter Passcode' : 'View'}
      </button>
      ${post.isOwnPost ? `
        <button class="action-btn edit-btn" aria-label="Edit post">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="action-btn share-btn" aria-label="Share post">
          <i class="fas fa-share"></i> Share
        </button>
        <button class="action-btn delete-btn" aria-label="Delete post">
          <i class="fas fa-trash"></i> Delete
        </button>
      ` : `
        <button class="action-btn share-btn" aria-label="Share post">
          <i class="fas fa-share"></i> Share
        </button>
      `}
    </div>
  `;
  
  // Add event listeners for buttons
  // 1. View button
  const viewButton = postElement.querySelector('.view-btn');
  if (viewButton) {
    viewButton.addEventListener('click', () => {
      openViewModal(post);
    });
  }
  
  // 2. Edit button (only for own posts)
  const editButton = postElement.querySelector('.edit-btn');
  if (editButton) {
    editButton.addEventListener('click', () => {
      openEditModal(post);
    });
  }
  
  // 3. Share button
  const shareButton = postElement.querySelector('.share-btn');
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      sharePost(post);
    });
  }
  
  // 4. Delete button (only for own posts)
  const deleteButton = postElement.querySelector('.delete-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      confirmDeletePost(post);
    });
  }
  
  // 5. Read more link (for truncated content)
  const readMoreLink = postElement.querySelector('.read-more');
  if (readMoreLink) {
    readMoreLink.addEventListener('click', (e) => {
      e.preventDefault();
      openViewModal(post);
    });
  }
  
  // 6. Media items
  const mediaItems = postElement.querySelectorAll('.post-media-item');
  mediaItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openMediaViewer(post, index);
    });
  });
  
  return postElement;
}

/**
 * Check if current user is a friend of the post author
 * @param {string} authorId - The ID of the post author
 * @returns {Promise<boolean>} Whether the current user is a friend
 */
async function checkIfUserIsFriend(authorId) {
  try {
    // If current user is the author, return true
    if (authorId === this.currentUser?.uid) {
      return true;
    }
    
    // First ensure we have a current user
    if (!this.currentUser) {
      return false;
    }
    
    // Get current user's document to access friends list
    const currentUserRef = doc(db, 'users', this.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);
    
    if (!currentUserDoc.exists()) {
      return false;
    }
    
    const userData = currentUserDoc.data();
    const friendEmails = userData.friends || [];
    
    // If the friends list is empty, can't be friends
    if (friendEmails.length === 0) {
      return false;
    }
    
    // Get the target user's email
    const authorRef = doc(db, 'users', authorId);
    const authorDoc = await getDoc(authorRef);
    
    if (!authorDoc.exists()) {
      return false;
    }
    
    const authorData = authorDoc.data();
    const authorEmail = authorData.email;
    
    // Check if the author's email is in the current user's friends list
    return friendEmails.includes(authorEmail);
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return false; // Default to not friends in case of error
  }
}

async function loadAllVisiblePosts(options = {}) {
  try {
    // Show loading state
    showLoading();
    
    // Get user's own posts
    const userPosts = await postsManager.getPosts({
      privacy: appState.currentFilters.privacy,
      sort: appState.currentFilters.sort,
      loadMore: false
    });
    
    // Get friends' public posts
    const friendPosts = await postsManager.getFriendPosts();
    
    // Combine and sort posts
    let allPosts = [...userPosts];
    
    // Only add friend posts if we're not filtering by privacy
    // or if we're specifically looking for public posts
    if (appState.currentFilters.privacy === 'all' || 
        appState.currentFilters.privacy === 'public') {
      allPosts = [...allPosts, ...friendPosts];
    }
    
    // Sort posts based on current sort filter
    allPosts.sort((a, b) => {
      if (appState.currentFilters.sort === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });
    
    // Log posts for debugging
    console.log('All visible posts:', allPosts);
    
    // Clear existing posts
    elements.postsContainer.innerHTML = '';
    
    // Show posts or empty state
    if (allPosts.length === 0) {
      elements.noPostsMessage.style.display = 'block';
      elements.loadMoreContainer.style.display = 'none';
    } else {
      elements.noPostsMessage.style.display = 'none';
      
      // Render posts
      allPosts.forEach(post => {
        try {
          const postElement = createPostElement(post);
          elements.postsContainer.appendChild(postElement);
        } catch (elementError) {
          console.error('Error creating post element:', elementError, post);
        }
      });
      
      // Hide load more button for combined view
      elements.loadMoreContainer.style.display = 'none';
    }
    
    // Hide loading state
    hideLoading();
  } catch (error) {
    console.error('Error loading all visible posts:', error);
    
    // Show error message
    showError('Failed to load posts. Please try again.');
    
    // Hide loading state
    hideLoading();
    
    // Show empty state
    elements.noPostsMessage.style.display = 'block';
    elements.loadMoreContainer.style.display = 'none';
  }
}


function openViewModal(post) {
  // Store the current post
  appState.currentPost = post;
  
  // If it's a private friend post, show passcode modal
  if (post.isFriendPost && post.privacy === 'private') {
    showPasscodeModal(post.id);
    return;
  }
  
  // Otherwise show post content directly
  showPostContent(post);
}

/**
 * Show the passcode modal for a protected post
 * @param {string} postId - The ID of the passcode-protected post
 */
function showPasscodeModal(postId) {
  // Reset passcode inputs
  const passcodeInputs = [
    elements.passcodeInput1,
    elements.passcodeInput2,
    elements.passcodeInput3,
    elements.passcodeInput4
  ];
  
  passcodeInputs.forEach(input => {
    input.value = '';
    input.classList.remove('error');
  });
  
  // Store the current post ID
  appState.currentPasscodePostId = postId;
  
  // Clear any previous error
  if (elements.passcodeError) {
    elements.passcodeError.textContent = '';
  }
  
  // Set up passcode input navigation
  passcodeInputs.forEach((input, index) => {
    input.addEventListener('input', function() {
      // Only allow numeric input
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Auto-move to next input when filled
      if (this.value.length === 1 && index < passcodeInputs.length - 1) {
        passcodeInputs[index + 1].focus();
      }
    });
    
    // Allow backspace to move to previous input
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
        passcodeInputs[index - 1].focus();
      }
    });
  });
  
  // Set up submit button
  if (elements.submitPasscodeBtn) {
    elements.submitPasscodeBtn.onclick = verifyPasscode;
  }
  
  // Show the passcode modal
  elements.passcodeModal.style.display = 'flex';
}

/**
 * Verify the entered passcode
 */
async function verifyPasscode() {
  // Collect passcode
  const passcodeInputs = [
    elements.passcodeInput1,
    elements.passcodeInput2,
    elements.passcodeInput3,
    elements.passcodeInput4
  ];
  
  const passcode = passcodeInputs.map(input => input.value).join('');
  
  // Validate passcode format
  if (!/^\d{4}$/.test(passcode)) {
    if (elements.passcodeError) {
      elements.passcodeError.textContent = 'Please enter a 4-digit passcode';
    }
    passcodeInputs.forEach(input => input.classList.add('error'));
    return;
  }
  
  try {
    // Get the post
    const post = await postsManager.getPost(appState.currentPasscodePostId);
    
    // Verify passcode
    const isValid = postsManager.verifyPasscode(passcode, post);
    
    if (isValid) {
      // Close passcode modal
      elements.passcodeModal.style.display = 'none';
      
      // Show the post
      showPostContent(post);
    } else {
      // Show error
      if (elements.passcodeError) {
        elements.passcodeError.textContent = 'Incorrect passcode';
      }
      passcodeInputs.forEach(input => input.classList.add('error'));
    }
  } catch (error) {
    console.error('Error verifying passcode:', error);
    if (elements.passcodeError) {
      elements.passcodeError.textContent = 'Failed to verify passcode. Please try again.';
    }
  }
}

/**
 * Show the full content of a post in the view modal
 * @param {Object} post - The post to display
 */
function showPostContent(post) {
  // Validate post object
  if (!post) {
    showError('Post not found');
    return;
  }

  // Update current post in app state
  appState.currentPost = post;

  // Set post title
  elements.viewPostTitle.textContent = post.title || 'Untitled Post';

  // Set author name (fallback to email or 'Anonymous')
  elements.viewPostAuthor.textContent = post.authorName || post.authorEmail || 'Anonymous';

  // Set date
  const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
  elements.viewPostDate.textContent = postDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Set privacy icon and text
  let privacyIcon = '';
  let privacyText = '';

  switch (post.privacy) {
    case PRIVACY.PUBLIC:
      privacyIcon = '<i class="fas fa-user-friends"></i>';
      privacyText = 'Visible to Friends';
      break;
    case PRIVACY.PRIVATE:
      privacyIcon = '<i class="fas fa-key"></i>';
      privacyText = 'Friends with Passcode';
      break;
    default:
      privacyIcon = '<i class="fas fa-user-friends"></i>';
      privacyText = 'Visible to Friends';
  }

  elements.viewPostPrivacyIcon.innerHTML = privacyIcon;
  elements.viewPostPrivacyText.textContent = privacyText;

  // Set post content
  elements.viewPostContent.textContent = post.content || '';
  elements.viewPostContent.style.whiteSpace = 'pre-wrap';

  // Handle media
  elements.viewMediaContainer.innerHTML = '';
  if (post.media && post.media.length > 0) {
    const mediaGallery = document.createElement('div');
    mediaGallery.className = 'media-gallery';

    post.media.forEach((media, index) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'gallery-item';
      mediaItem.dataset.index = index;

      if (media.type === 'image') {
        const img = document.createElement('img');
        img.src = media.url;
        img.alt = `Post image ${index + 1}`;
        mediaItem.appendChild(img);
      } else if (media.type === 'video') {
        const video = document.createElement('video');
        video.src = media.url;
        video.setAttribute('muted', 'true');
        video.setAttribute('controls', 'true');
        mediaItem.appendChild(video);
      }

      mediaItem.addEventListener('click', () => {
        openMediaViewer(post, index);
      });

      mediaGallery.appendChild(mediaItem);
    });

    elements.viewMediaContainer.appendChild(mediaGallery);
  }

  // Update post action buttons visibility
  if (elements.viewPostActions) {
    // Only show edit/delete buttons if user is the author
    const isAuthor = post.authorId === appState.currentUser?.uid;
    
    const editBtn = elements.editPostBtn;
    const deleteBtn = elements.viewPostActions.querySelector('.delete-btn');
    const shareBtn = elements.sharePostBtn;
    
    if (editBtn) {
      editBtn.style.display = isAuthor ? 'inline-flex' : 'none';
    }
    
    if (deleteBtn) {
      deleteBtn.style.display = isAuthor ? 'inline-flex' : 'none';
    }

    // Allow sharing for any post visible to the user
    if (shareBtn) {
      shareBtn.style.display = 'inline-flex';
    }
  }

  // Show the modal
  elements.viewPostModal.style.display = 'flex';
}

/**
 * Open the edit modal for a post
 * @param {Object} post - Post data
 */
function openEditModal(post) {
  // Set form values
  elements.editPostId.value = post.id;
  elements.editPostTitle.value = post.title || '';
  elements.editPostContent.value = post.content || '';
  
  // Set character count
  elements.editCharsCount.textContent = post.content?.length || 0;
  updateCharCounter(post.content?.length || 0, elements.editCharsCount);
  
  // Set privacy radios
  const privacyRadios = document.querySelectorAll('input[name="edit-privacy"]');
  privacyRadios.forEach(radio => {
    radio.checked = radio.value === post.privacy;
  });
  
  // Show/hide passcode field based on privacy
  const editPasscodeField = document.getElementById('edit-passcode-field');
  if (post.privacy === PRIVACY.PRIVATE) {
    editPasscodeField.style.display = 'block';
  } else {
    editPasscodeField.style.display = 'none';
  }
  
  // Display media preview
  elements.editMediaPreview.innerHTML = '';
  
  if (post.media && post.media.length > 0) {
    post.media.forEach((media, index) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'media-item';
      mediaItem.dataset.index = index;
      
      // Create appropriate media element based on type
      if (media.type === 'image') {
        const img = document.createElement('img');
        img.src = media.url;
        img.alt = 'Image';
        mediaItem.appendChild(img);
      } else {
        const video = document.createElement('video');
        video.src = media.url;
        video.setAttribute('muted', 'true');
        video.setAttribute('controls', 'true');
        mediaItem.appendChild(video);
      }
      
      // Add type icon
      const typeIcon = document.createElement('div');
      typeIcon.className = 'media-type-icon';
      typeIcon.innerHTML = media.type === 'image' ? '<i class="fas fa-image"></i>' : '<i class="fas fa-video"></i>';
      mediaItem.appendChild(typeIcon);
      
      // Add remove button
      const removeBtn = document.createElement('div');
      removeBtn.className = 'remove-media';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.setAttribute('aria-label', 'Remove media');
      
      // Add click handler for remove button
      removeBtn.addEventListener('click', async () => {
        try {
          await postsManager.removeMedia(post.id, index);
          // Reload the post to get updated media array
          const updatedPost = await postsManager.getPost(post.id);
          // Reopen the modal with updated post
          openEditModal(updatedPost);
        } catch (error) {
          console.error('Error removing media:', error);
          showError('Failed to remove media. Please try again.');
        }
      });
      
      mediaItem.appendChild(removeBtn);
      elements.editMediaPreview.appendChild(mediaItem);
    });
  }
  
  // Show modal
  elements.editPostModal.style.display = 'flex';
}

/**
 * Open the media viewer modal
 * @param {Object} post - Post data
 * @param {number} index - Index of the media to show
 */
function openMediaViewer(post, index = 0) {
  // Save media items to app state
  appState.mediaItems = post.media || [];
  appState.currentMediaIndex = index;
  
  // Clear previous content
  elements.mediaViewerContainer.innerHTML = '';
  
  // Update media counter
  updateMediaCounter();
  
  // Check if media exists at the index
  if (appState.mediaItems.length === 0 || index >= appState.mediaItems.length) {
    // No media to show
    return;
  }
  
  const media = appState.mediaItems[index];
  
  // Create appropriate media element based on type
  if (media.type === 'image') {
    const img = document.createElement('img');
    img.src = media.url;
    img.alt = 'Image';
    elements.mediaViewerContainer.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = media.url;
    video.setAttribute('controls', 'true');
    video.setAttribute('autoplay', 'true');
    elements.mediaViewerContainer.appendChild(video);
  }
  
  // Update navigation buttons
  updateMediaNavigation();
  
  // Show modal
  elements.mediaViewerModal.style.display = 'flex';
}

/**
 * Update media counter in the media viewer
 */
function updateMediaCounter() {
  if (appState.mediaItems.length === 0) return;
  
  elements.mediaCounter.textContent = `${appState.currentMediaIndex + 1} / ${appState.mediaItems.length}`;
}

/**
 * Update media navigation buttons visibility
 */
function updateMediaNavigation() {
  // Hide/show previous button
  if (appState.currentMediaIndex === 0) {
    elements.prevMediaBtn.style.display = 'none';
  } else {
    elements.prevMediaBtn.style.display = 'flex';
  }
  
  // Hide/show next button
  if (appState.currentMediaIndex >= appState.mediaItems.length - 1) {
    elements.nextMediaBtn.style.display = 'none';
  } else {
    elements.nextMediaBtn.style.display = 'flex';
  }
}

/**
 * Show the previous media in the viewer
 */
function showPreviousMedia() {
  if (appState.currentMediaIndex > 0) {
    appState.currentMediaIndex--;
    openMediaViewer({ media: appState.mediaItems }, appState.currentMediaIndex);
  }
}

/**
 * Show the next media in the viewer
 */
function showNextMedia() {
  if (appState.currentMediaIndex < appState.mediaItems.length - 1) {
    appState.currentMediaIndex++;
    openMediaViewer({ media: appState.mediaItems }, appState.currentMediaIndex);
  }
}

/**
 * Handle update post form submission
 * @param {Event} e - Submit event
 */
async function handleUpdatePost(e) {
  e.preventDefault();
  
  try {
    // Get form values
    const postId = elements.editPostId.value;
    const title = elements.editPostTitle.value.trim();
    const content = elements.editPostContent.value.trim();
    const privacyRadios = document.querySelectorAll('input[name="edit-privacy"]');
    let privacy = PRIVACY.PUBLIC; // Default to public (visible to friends)
    
    // Get selected privacy
    for (const radio of privacyRadios) {
      if (radio.checked) {
        privacy = radio.value;
        break;
      }
    }
    
    // Validate content
    if (!content) {
      showError('Please enter some content for your post.');
      return;
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      showError(`Content is too long. Maximum length is ${MAX_CONTENT_LENGTH} characters.`);
      return;
    }
    
    // Create update data
    const updateData = {
      title,
      content,
      privacy
    };
    
    // Add passcode if private post
    if (privacy === PRIVACY.PRIVATE) {
      const passcodeInput = document.getElementById('edit-post-passcode');
      const passcode = passcodeInput.value.trim();
      
      // If changing to private or changing existing passcode
      if (passcode) {
        if (!/^\d{4}$/.test(passcode)) {
          showError('Please enter a valid 4-digit passcode.');
          return;
        }
        
        updateData.passcode = passcode;
      } else {
        // Check if this was already a private post
        const post = await postsManager.getPost(postId);
        if (post.privacy !== PRIVACY.PRIVATE) {
          // Switching to private but no passcode provided
          showError('Please enter a passcode for your private post.');
          return;
        }
        // Otherwise, we're keeping the same passcode
      }
    }
    
    // Update post
    await postsManager.updatePost(postId, updateData);
    
    // Close modal
    elements.editPostModal.style.display = 'none';
    
    // Show success message
    showSuccess('Post updated successfully!');
    
    // Reload posts
    loadPosts();
  } catch (error) {
    console.error('Error updating post:', error);
    showError(error.message || 'Failed to update post. Please try again.');
  }
}

/**
 * Confirm post deletion
 * @param {Object} post - Post data
 */
function confirmDeletePost(post) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    // Make sure we're passing the ID string, not the whole post object
    handleDeletePost(post.id);
  }
}

/**
 * Handle post deletion
 * @param {string|Object} postIdOrPost - ID of the post to delete or post object
 */
async function handleDeletePost(postIdOrPost) {
  try {
    // Get post ID from parameter (which could be an ID string or post object)
    let id;
    
    if (typeof postIdOrPost === 'string') {
      // If it's already a string, use it
      id = postIdOrPost;
    } else if (postIdOrPost && postIdOrPost.id) {
      // If it's a post object, get the ID
      id = postIdOrPost.id;
    } else if (elements.editPostId && elements.editPostId.value) {
      // Fall back to the edit form if available
      id = elements.editPostId.value;
    } else {
      throw new Error('Invalid post ID for deletion');
    }
    
    // Ensure we have a valid string ID
    if (!id || typeof id !== 'string') {
      throw new Error('Post ID must be a valid string');
    }
    
    // Delete post
    await postsManager.deletePost(id);
    
    // Close modals
    closeAllModals();
    
    // Show success message
    showSuccess('Post deleted successfully!');
    
    // Reload posts
    loadPosts();
  } catch (error) {
    console.error('Error deleting post:', error);
    showError('Failed to delete post. Please try again.');
  }
}

/**
 * Share a post - only shares posts that are visible to the user
 * @param {Object} post - Post data
 */
function sharePost(post) {
  try {
    // Get shareable URL
    const shareUrl = postsManager.getShareablePostUrl(post.id);
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out this Bond Tree post',
        text: (post.content || '').substring(0, 100) + ((post.content || '').length > 100 ? '...' : ''),
        url: shareUrl
      })
      .then(() => {
        showSuccess('Post shared successfully!');
      })
      .catch((error) => {
        // Only show error for non-abort errors
        if (error.name !== 'AbortError') {
          fallbackShare(shareUrl);
        }
      });
    } else {
      // Fallback for browsers without Web Share API
      fallbackShare(shareUrl);
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    showError('Failed to share post. Please try again.');
  }
}

/**
 * Fallback sharing method using clipboard
 * @param {string} shareUrl - URL to share
 */
function fallbackShare(shareUrl) {
  try {
    // Create a temporary textarea to copy from
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = shareUrl;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.left = '-9999px';
    document.body.appendChild(tempTextArea);
    
    // Select and copy
    tempTextArea.select();
    document.execCommand('copy');
    
    // Remove temporary element
    document.body.removeChild(tempTextArea);
    
    // Show success message
    showSuccess('Post link copied to clipboard!');
  } catch (clipboardError) {
    console.error('Clipboard copy error:', clipboardError);
    
    // Show manual share prompt
    showManualSharePrompt(shareUrl);
  }
}

/**
 * Download a post
 * @param {Object} post - Post data
 */
function downloadPost(post) {
  try {
    postsManager.downloadPostAsText(post);
  } catch (error) {
    console.error('Error downloading post:', error);
    showError('Failed to download post. Please try again.');
  }
}

/**
 * Close all open modals
 */
function closeAllModals() {
  if (elements.editPostModal) {
    elements.editPostModal.style.display = 'none';
  }
  
  if (elements.viewPostModal) {
    elements.viewPostModal.style.display = 'none';
  }
  
  if (elements.mediaViewerModal) {
    elements.mediaViewerModal.style.display = 'none';
  }
  
  if (elements.passcodeModal) {
    elements.passcodeModal.style.display = 'none';
  }
}

/**
 * Show loading state
 */
function showLoading() {
  appState.isLoading = true;
  
  // Create or update loading indicator
  let loadingIndicator = elements.postsContainer.querySelector('.loading-indicator');
  
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading your posts...</p>
    `;
    elements.postsContainer.innerHTML = '';
    elements.postsContainer.appendChild(loadingIndicator);
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  appState.isLoading = false;
  
  // Remove loading indicator
  const loadingIndicator = elements.postsContainer.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

/**
 * Show manual share prompt for fallback sharing
 * @param {string} shareUrl - URL to share
 */
function showManualSharePrompt(shareUrl) {
  // Create a modal with the shareable URL
  const shareModal = document.createElement('div');
  shareModal.className = 'share-modal';
  shareModal.innerHTML = `
    <div class="share-modal-content">
      <h3>Share Post</h3>
      <p>Copy the link below to share:</p>
      <input type="text" value="${shareUrl}" readonly>
      <div class="share-modal-actions">
        <button id="copy-share-link">Copy Link</button>
        <button id="close-share-modal">Close</button>
      </div>
    </div>
  `;
  
  // Style the modal
  shareModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  // Add to document
  document.body.appendChild(shareModal);
  
  // Get elements
  const copyButton = shareModal.querySelector('#copy-share-link');
  const closeButton = shareModal.querySelector('#close-share-modal');
  const inputField = shareModal.querySelector('input');
  
  // Copy button handler
  copyButton.addEventListener('click', () => {
    inputField.select();
    document.execCommand('copy');
    showSuccess('Link copied to clipboard!');
    document.body.removeChild(shareModal);
  });
  
  // Close button handler
  closeButton.addEventListener('click', () => {
    document.body.removeChild(shareModal);
  });
  
  // Select input text when modal opens
  inputField.select();
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}