/**
 * Bond Tree - Posts UI Interactions
 * 
 * This file handles all UI interactions for the posts/journal feature, including:
 * - Creating, editing, and deleting posts
 * - Viewing and commenting on posts
 * - Managing media uploads
 * - Handling post privacy settings
 */

import { auth } from './firebase-config.js';
import AuthManager from './auth-manager.js';
import PostsManager from './posts-manager.js';

// Initialize managers
const authManager = new AuthManager();
const postsManager = new PostsManager();

// Cache DOM elements to avoid repeated lookups
const elements = {
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
  closeMediaViewer: document.getElementById('close-media-viewer')
};

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
  
  // Check authentication state with Firebase
  auth.onAuthStateChanged(handleAuthStateChange);
  
  // Add event listeners
  addEventListeners();
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
async function loadPosts() {
  try {
    // Show loading state
    showLoading();
    
    // Get posts from Firebase
    const posts = await postsManager.getPosts({
      privacy: appState.currentFilters.privacy,
      sort: appState.currentFilters.sort,
      loadMore: false
    });
    
    // Clear existing posts
    elements.postsContainer.innerHTML = '';
    
    // Show posts or empty state
    if (posts.length === 0) {
      elements.noPostsMessage.style.display = 'block';
      elements.loadMoreContainer.style.display = 'none';
    } else {
      elements.noPostsMessage.style.display = 'none';
      
      // Render posts
      posts.forEach(post => {
        const postElement = createPostElement(post);
        elements.postsContainer.appendChild(postElement);
      });
      
      // Show load more button if there are enough posts
      elements.loadMoreContainer.style.display = posts.length >= postsManager.postsPerPage ? 'block' : 'none';
    }
    
    // Hide loading state
    hideLoading();
  } catch (error) {
    console.error('Error loading posts:', error);
    showError('Failed to load posts. Please try again.');
    hideLoading();
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
    // Validate form
    const title = elements.postTitle.value.trim();
    const content = elements.postContent.value.trim();
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    let privacy = 'private'; // Default to private
    
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
    
    // Disable submit button to prevent double submission
    elements.publishButton.disabled = true;
    elements.publishButton.textContent = 'Publishing...';
    
    // Create post data
    const postData = {
      title,
      content,
      privacy,
      authorName: authManager.currentUser?.name || 'Anonymous'
    };
    
    // Create post
    const newPost = await postsManager.createPost(postData);
    
    // Reset form
    elements.postForm.reset();
    elements.mediaPreview.innerHTML = '';
    elements.charsCount.textContent = '0';
    
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
    
    showError('Failed to publish post. Please try again.');
  }
}

/**
 * Create a post element for display
 * @param {Object} post - Post data
 * @returns {HTMLElement} Post element
 */
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.id = post.id;
    
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
      case 'private':
        privacyIcon = '<i class="fas fa-lock"></i>';
        privacyText = 'Only Me';
        break;
      case 'friends':
        privacyIcon = '<i class="fas fa-user-friends"></i>';
        privacyText = 'My Bonds';
        break;
      case 'public':
        privacyIcon = '<i class="fas fa-globe"></i>';
        privacyText = 'Everyone';
        break;
      default:
        privacyIcon = '<i class="fas fa-lock"></i>';
        privacyText = 'Only Me';
    }
    
    // Create truncated content
    let contentText = post.content || '';
    const isTruncated = contentText.length > TRUNCATE_LENGTH;
    
    if (isTruncated) {
      contentText = contentText.substring(0, TRUNCATE_LENGTH) + '...';
    }
    
    // Create HTML structure
    let mediaHTML = '';
    
    // Add media previews if available
    if (post.media && post.media.length > 0) {
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
      ${isTruncated ? '<a class="read-more" href="#" aria-label="Read more of this post">Read more</a>' : ''}
      ${mediaHTML}
      <div class="post-actions">
        <button class="action-btn view-btn" aria-label="View post">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="action-btn edit-btn" aria-label="Edit post">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="action-btn share-btn" aria-label="Share post">
          <i class="fas fa-share"></i> Share
        </button>
        <button class="action-btn delete-btn" aria-label="Delete post">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    // Add event listeners as in the original function
    // ...
  
    return postElement;
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
 * Open the view modal for a post
 * @param {Object} post - Post data
 */
function openViewModal(post) {
  // Save current post to app state
  appState.currentPost = post;
  
  // Set modal content
  elements.viewPostTitle.textContent = post.title || 'Untitled Post';
  elements.viewPostAuthor.textContent = post.authorName || 'Anonymous';
  
  // Format date
  const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
  const formattedDate = postDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  elements.viewPostDate.textContent = formattedDate;
  
  // Set privacy icon and text
  let privacyIcon = '';
  let privacyText = '';
  
  switch (post.privacy) {
    case 'private':
      privacyIcon = '<i class="fas fa-lock"></i>';
      privacyText = 'Only Me';
      break;
    case 'friends':
      privacyIcon = '<i class="fas fa-user-friends"></i>';
      privacyText = 'My Bonds';
      break;
    case 'public':
      privacyIcon = '<i class="fas fa-globe"></i>';
      privacyText = 'Everyone';
      break;
    default:
      privacyIcon = '<i class="fas fa-lock"></i>';
      privacyText = 'Only Me';
  }
  
  elements.viewPostPrivacyIcon.innerHTML = privacyIcon;
  elements.viewPostPrivacyText.textContent = privacyText;
  
  // Set post content
  elements.viewPostContent.textContent = post.content || '';
  
  // Display media
  elements.viewMediaContainer.innerHTML = '';
  
  if (post.media && post.media.length > 0) {
    post.media.forEach((media, index) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.dataset.index = index;
      
      // Create appropriate media element based on type
      if (media.type === 'image') {
        const img = document.createElement('img');
        img.src = media.url;
        img.alt = 'Image';
        galleryItem.appendChild(img);
      } else {
        const video = document.createElement('video');
        video.src = media.url;
        video.setAttribute('muted', 'true');
        video.setAttribute('controls', 'true');
        galleryItem.appendChild(video);
      }
      
      // Add click handler to open media viewer
      galleryItem.addEventListener('click', () => {
        openMediaViewer(post, index);
      });
      
      elements.viewMediaContainer.appendChild(galleryItem);
    });
  } else {
    elements.viewMediaContainer.style.display = 'none';
  }
  
  // Show/hide edit button based on ownership
  if (post.authorId === appState.currentUser?.uid) {
    elements.editPostBtn.style.display = 'inline-flex';
  } else {
    elements.editPostBtn.style.display = 'none';
  }
  
  // Show/hide share button based on privacy
  if (post.privacy !== 'private') {
    elements.sharePostBtn.style.display = 'inline-flex';
  } else {
    elements.sharePostBtn.style.display = 'none';
  }
  
  // Show modal
  elements.viewPostModal.style.display = 'flex';
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
    let privacy = 'private'; // Default to private
    
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
    showError('Failed to update post. Please try again.');
  }
}

/**
 * Confirm post deletion
 * @param {Object} post - Post data
 */
function confirmDeletePost(post) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    handleDeletePost(post.id);
  }
}

/**
 * Handle post deletion
 * @param {string} postId - ID of the post to delete
 */
async function handleDeletePost(postId) {
  try {
    // Get post ID from form or parameter
    const id = postId || elements.editPostId.value;
    
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
 * Share a post
 * @param {Object} post - Post data
 */
function sharePost(post) {
  // Cannot share private posts
  if (post.privacy === 'private') {
    showError('Private posts cannot be shared.');
    return;
  }
  
  try {
    // Get shareable URL
    const shareUrl = postsManager.getShareablePostUrl(post.id);
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out my post on Bond Tree',
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: shareUrl
      }).catch(error => {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    showError('Failed to share post. Please try again.');
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess('Link copied to clipboard!');
    }).catch(error => {
      console.error('Error copying to clipboard:', error);
      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showSuccess('Link copied to clipboard!');
    });
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showError('Failed to copy link.');
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
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
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
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
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

// Update the media upload button handler to trigger the file input
document.addEventListener('DOMContentLoaded', function() {
    const mediaUploadBtn = document.getElementById('media-upload-btn');
    const postMediaInput = document.getElementById('post-media');
    
    if (mediaUploadBtn && postMediaInput) {
      mediaUploadBtn.addEventListener('click', function() {
        postMediaInput.click();
      });
    }
  });