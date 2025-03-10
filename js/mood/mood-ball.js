/**
 * Bond Tree - Mood Ball Management
 * 
 * This file handles all mood ball functionality including:
 * - Rendering the mood ball visualization
 * - Managing selected moods
 * - Saving moods to Firebase
 * - Displaying saved mood history
 */

import { auth } from '../firebase-config.js';
import AuthManager from './auth-manager.js';
import { getMoodEmoji } from './mood-emoji-utils.js';

// Constants and configuration
const MAX_MOODS = 3;
const MAX_NOTES_LENGTH = 200;
const AUTH_CHECK_ATTEMPTS = 10;
const AUTH_CHECK_INTERVAL = 300;

// Mood emoji mapping
const MOOD_EMOJIS = {
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

// Cache DOM elements to avoid repeated lookups
let elements = {
  loginWarning: null,
  mainContent: null,
  header: null,
  footer: null,
  backButton: null,
  moodBall: null,
  colorOptions: null,
  saveButton: null,
  savedMoodsContainer: null,
  selectionInfo: null,
  moodNotes: null,
  charsCount: null,
  statusAnnouncer: null
};

// App state
let appState = {
  selectedMoods: [],
  savedMoods: [],
  authManager: null,
  authCheckAttempts: 0,
  isSaving: false
};

// Add this near the top of mood-ball.js, after initializing appState
window.appState = appState;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initialize the application
 */
function initApp() {
  console.log("DOM loaded - initializing mood-ball.js");
  
  // Cache DOM elements
  cacheElements();
  
  // Initialize the AuthManager
  appState.authManager = new AuthManager();
  
  // Set up keyboard accessibility
  setupKeyboardAccessibility();
  
  // Add touch event handlers for mobile
  setupTouchInteractions();
  
  // Check authentication state with Firebase
  auth.onAuthStateChanged(handleAuthStateChange);
}

function setupTouchInteractions() {
  // Make saved moods container scrollable on touch devices
  if (elements.savedMoodsContainer) {
    elements.savedMoodsContainer.style.webkitOverflowScrolling = 'touch';
    
    // Prevent body scrolling when touching the horizontal scroll area
    elements.savedMoodsContainer.addEventListener('touchmove', function(e) {
      e.stopPropagation();
    }, { passive: true });
  }
  
  // Ensure modals can be closed by tapping outside on mobile
  document.addEventListener('click', function(e) {
    const noteModal = document.querySelector('.note-modal');
    if (noteModal && e.target === noteModal) {
      document.body.removeChild(noteModal);
    }
  });
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements = {
    loginWarning: document.getElementById('login-warning'),
    mainContent: document.querySelector('.container'),
    header: document.querySelector('header'),
    footer: document.querySelector('footer'),
    backButton: document.getElementById('back-to-dashboard'),
    moodBall: document.getElementById('current-mood-ball'),
    colorOptions: document.querySelectorAll('.color-option'),
    saveButton: document.getElementById('save-button'),
    savedMoodsContainer: document.getElementById('saved-moods-container'),
    selectionInfo: document.getElementById('selection-info'),
    moodNotes: document.getElementById('mood-notes'),
    charsCount: document.getElementById('chars-count'),
    statusAnnouncer: document.getElementById('status-announcer')
  };
  
  console.log("DOM elements cached:", {
    loginWarning: !!elements.loginWarning,
    mainContent: !!elements.mainContent,
    colorOptions: elements.colorOptions?.length,
    moodBall: !!elements.moodBall
  });
}

/**
 * Set up keyboard accessibility for interactive elements
 */
function setupKeyboardAccessibility() {
  // Make color options accessible via keyboard
  if (elements.colorOptions) {
    elements.colorOptions.forEach(option => {
      option.addEventListener('keydown', (e) => {
        // Handle Enter or Space key
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleColorSelection(option);
        }
      });
    });
  }
}

/**
 * Handle Firebase auth state changes
 * @param {Object} user - Firebase user object
 */
async function handleAuthStateChange(user) {
  try {
    if (!user) {
      showLoginWarning();
      return;
    }
    
    console.log("User logged in:", user.email);
    hideLoginWarning();
    
    // Wait for AuthManager to load user data from Firestore
    waitForUserData();
  } catch (error) {
    console.error("Error in auth state change handler:", error);
    showErrorState(error);
  }
}

// Add this function to handle deleting a saved mood
async function handleDeleteMood(mood) {
  try {
    if (confirm("Are you sure you want to delete this mood?")) {
      const result = await appState.authManager.deleteMood(mood);

      if (result.success) {
        console.log("Mood deleted successfully");
        updateSavedMoods(); // Refresh the saved moods display
      } else {
        console.error("Failed to delete mood:", result.message);
        alert(`Sorry, there was a problem deleting your mood: ${result.message}`);
      }
    }
  } catch (error) {
    console.error("Error in delete mood handler:", error);
    alert("Sorry, something went wrong. Please try again.");
  }
}

/**
 * Show login warning when user is not authenticated
 */
function showLoginWarning() {
  console.log("No user logged in, showing warning");
  if (!elements.loginWarning) return;
  
  elements.loginWarning.style.display = 'block';
  elements.mainContent.style.display = 'none';
  elements.header.style.display = 'none';
  elements.footer.style.display = 'none';
  elements.backButton.style.display = 'none';
}

/**
 * Hide login warning when user is authenticated
 */
function hideLoginWarning() {
  if (!elements.loginWarning) return;
  
  elements.loginWarning.style.display = 'none';
  elements.mainContent.style.display = 'block';
  elements.header.style.display = 'block';
  elements.footer.style.display = 'block';
  elements.backButton.style.display = 'block';
}

/**
 * Show error state when something goes wrong
 * @param {Error} error - The error that occurred
 */
function showErrorState(error) {
  if (!elements.loginWarning) return;
  
  elements.loginWarning.style.display = 'block';
  elements.loginWarning.innerHTML = `
    <div class="login-warning__content">
      <h3>Something went wrong</h3>
      <p>There was an error loading your profile: ${error.message || 'Unknown error'}</p>
      <a href="index.html" class="login-warning__button">Back to Login</a>
    </div>
  `;
  
  elements.mainContent.style.display = 'none';
  elements.header.style.display = 'none';
  elements.footer.style.display = 'none';
  elements.backButton.style.display = 'none';
}

/**
 * Wait for user data to be loaded from Firestore
 */
function waitForUserData() {
  if (appState.authManager.currentUser) {
    initializeMoodBallPage();
    return;
  }
  
  if (appState.authCheckAttempts < AUTH_CHECK_ATTEMPTS) {
    appState.authCheckAttempts++;
    console.log(`Waiting for user data... (${appState.authCheckAttempts}/${AUTH_CHECK_ATTEMPTS})`);
    setTimeout(waitForUserData, AUTH_CHECK_INTERVAL);
  } else {
    console.error("Failed to load user data after multiple attempts");
    const error = new Error("Failed to load user data");
    showErrorState(error);
  }
}

/**
 * Main initialization function for the mood ball page
 */
function initializeMoodBallPage() {
  // Reset state
  appState.selectedMoods = [];
  
  // Try to get saved moods from Firebase
  try {
    appState.savedMoods = appState.authManager.getSavedMoods();
    console.log("Retrieved saved moods:", appState.savedMoods.length);
  } catch (error) {
    console.error("Error getting saved moods:", error);
    appState.savedMoods = [];
  }
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Initialize UI
  updateMoodBall();
  updateSelectionInfo();
  updateSavedMoods();
  
  // Announce for screen readers
  announceToScreenReader('Mood tracker loaded successfully');

  // Initialize custom mood feature if available
  if (typeof window.initCustomMoodFeature === 'function') {
    window.initCustomMoodFeature();
  } else {
    console.log("Custom mood feature not available");
    
    // Try to load it dynamically
    import('./custom-mood-functionality.js')
      .then(module => {
        if (module.initCustomMoodFeature) {
          module.initCustomMoodFeature();
        }
      })
      .catch(err => console.log("Could not load custom mood feature:", err));
  }
}

/**
 * Set up all event listeners
 */
function initializeEventListeners() {
  // Back button
  if (elements.backButton) {
    elements.backButton.addEventListener('click', handleBackButtonClick);
  }
  
  // Character counter for mood notes
  if (elements.moodNotes && elements.charsCount) {
    elements.moodNotes.addEventListener('input', handleNotesInput);
  }
  
  // Color options
  if (elements.colorOptions) {
    elements.colorOptions.forEach(option => {
      option.addEventListener('click', () => handleColorSelection(option));
    });
  }
  
  // Save button
  if (elements.saveButton) {
    elements.saveButton.addEventListener('click', handleSaveMood);
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
 * Handle notes input for character count
 */
function handleNotesInput() {
  const count = elements.moodNotes.value.length;
  elements.charsCount.textContent = count;
  
  // Add visual feedback for character limit
  if (count > 180) {
    elements.charsCount.style.color = '#e67e22'; // Orange when approaching limit
  } else if (count > 195) {
    elements.charsCount.style.color = '#e74c3c'; // Red when very close to limit
  } else {
    elements.charsCount.style.color = '#999'; // Default color
  }
}

/**
 * Handle color/mood selection
 * @param {Element} option - The selected color option element
 */
function handleColorSelection(option) {
  const color = option.getAttribute('data-color');
  const name = option.getAttribute('data-name');
  const isCustom = option.getAttribute('data-custom') === 'true';
  const customId = option.getAttribute('data-id');
  
  // Check if already selected
  const existingIndex = appState.selectedMoods.findIndex(mood => mood.name === name);

  window.handleColorSelection = handleColorSelection;
  
  if (existingIndex >= 0) {
    // Remove if already selected
    appState.selectedMoods.splice(existingIndex, 1);
    option.classList.remove('color-option--selected');
    option.setAttribute('aria-pressed', 'false');
  } else {
    // Add if not selected (max 3)
    if (appState.selectedMoods.length < MAX_MOODS) {
      const moodObj = { color, name };
      
      // Add custom mood properties if applicable
      if (isCustom && customId) {
        moodObj.isCustom = true;
        moodObj.customId = customId;
      }
      
      appState.selectedMoods.push(moodObj);
      option.classList.add('color-option--selected');
      option.setAttribute('aria-pressed', 'true');
    } else {
      // Replace the first one if already have max moods
      const oldOption = Array.from(elements.colorOptions).find(opt => 
        opt.getAttribute('data-name') === appState.selectedMoods[0].name
      );
      
      if (oldOption) {
        oldOption.classList.remove('color-option--selected');
        oldOption.setAttribute('aria-pressed', 'false');
      }
      
      appState.selectedMoods.shift();
      
      const moodObj = { color, name };
      
      // Add custom mood properties if applicable
      if (isCustom && customId) {
        moodObj.isCustom = true;
        moodObj.customId = customId;
      }
      
      appState.selectedMoods.push(moodObj);
      option.classList.add('color-option--selected');
      option.setAttribute('aria-pressed', 'true');
    }
  }
  
  updateMoodBall();
  updateSelectionInfo();
  
  // Announce selection for screen readers
  if (appState.selectedMoods.length > 0) {
    const moodNames = appState.selectedMoods.map(mood => mood.name).join(", ");
    announceToScreenReader(`Selected moods: ${moodNames}`);
  } else {
    announceToScreenReader('All moods cleared');
  }
}

/**
 * Handle save mood button click
 */
async function handleSaveMood() {
  try {
    if (appState.isSaving) return; // Prevent double submissions
    appState.isSaving = true;
    
    console.log("Save button clicked. Selected moods:", appState.selectedMoods);
    
    if (appState.selectedMoods.length === 0) {
      alert("Please select at least one mood before saving.");
      appState.isSaving = false;
      return;
    }
    
    // Get notes from the textarea if it exists
    const notes = elements.moodNotes ? elements.moodNotes.value : '';
    
    // Sanitize notes (basic XSS protection)
    const sanitizedNotes = notes
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    console.log("Attempting to save mood with notes:", sanitizedNotes);
    
    // Disable button during saving
    elements.saveButton.disabled = true;
    elements.saveButton.textContent = "Saving...";
    
    // Save to Firebase
    const saveResult = await appState.authManager.saveMood(appState.selectedMoods, sanitizedNotes);
    
    if (saveResult.success) {
      console.log("Mood saved successfully");
      
      // Clear the notes field after saving
      if (elements.moodNotes) {
        elements.moodNotes.value = '';
        if (elements.charsCount) elements.charsCount.textContent = '0';
      }
      
      // Update saved moods display
      updateSavedMoods();
      
      // Reset mood selection
      resetMoodSelection();
      
      // Show saved confirmation
      elements.saveButton.textContent = "Saved!";
      
      // Announce success for screen readers
      announceToScreenReader('Your mood has been saved successfully');
      
      setTimeout(() => {
        elements.saveButton.textContent = "Save Today's Mood";
        elements.saveButton.disabled = false;
        appState.isSaving = false;
      }, 1500);
    } else {
      console.error("Failed to save mood:", saveResult.message);
      alert(`Sorry, there was a problem saving your mood: ${saveResult.message || 'Unknown error'}`);
      elements.saveButton.textContent = "Save Today's Mood";
      elements.saveButton.disabled = false;
      appState.isSaving = false;
    }
  } catch (error) {
    console.error("Error in save button handler:", error);
    alert("Sorry, something went wrong. Please try again or refresh the page.");
    elements.saveButton.textContent = "Save Today's Mood";
    elements.saveButton.disabled = false;
    appState.isSaving = false;
  }
}

/**
 * Reset mood selection after saving
 */
function resetMoodSelection() {
  appState.selectedMoods = [];
  
  // Reset UI states
  elements.colorOptions.forEach(option => {
    option.classList.remove('color-option--selected');
    option.setAttribute('aria-pressed', 'false');
  });
  
  updateMoodBall();
  updateSelectionInfo();
}

/**
 * Update the selection info text
 */
function updateSelectionInfo() {
  if (!elements.selectionInfo) return;
  
  if (appState.selectedMoods.length === 0) {
    elements.selectionInfo.textContent = "Select up to 3 emotions";
  } else {
    const moodNames = appState.selectedMoods.map(mood => mood.name).join(", ");
    elements.selectionInfo.textContent = `Selected: ${moodNames}`;
  }
}

/**
 * Update the mood ball display
 */
function updateMoodBall() {
  if (!elements.moodBall) return;
  
  // Clear existing content
  elements.moodBall.innerHTML = '';
  
  // Update aria-label for screen readers
  if (appState.selectedMoods.length === 0) {
    elements.moodBall.setAttribute('aria-label', 'Empty mood ball. Select emotions to visualize them.');
  } else {
    const moodNames = appState.selectedMoods.map(mood => mood.name).join(", ");
    elements.moodBall.setAttribute('aria-label', `Mood ball showing: ${moodNames}`);
  }
  
  if (appState.selectedMoods.length === 0) {
    // Empty state
    elements.moodBall.style.backgroundColor = '#FFFFFF';
    return;
  }
  
  // Create sections for each mood
  const sectionHeight = 100 / appState.selectedMoods.length;
  
  appState.selectedMoods.forEach((mood, index) => {
    const section = document.createElement('div');
    section.className = 'mood-section';
    section.style.backgroundColor = mood.color;
    section.style.top = `${index * sectionHeight}%`;
    section.style.height = `${sectionHeight}%`;
    
    // Add corresponding emoji - UPDATED to handle custom moods
const emoji = document.createElement('div');
emoji.className = 'mood-emoji';

// Get emoji based on mood name (works for both standard and custom moods)
emoji.textContent = getMoodEmoji(mood.name);

emoji.setAttribute('aria-hidden', 'true'); // Hide from screen readers
section.appendChild(emoji);
    
    elements.moodBall.appendChild(section);
  });
}

/**
 * Show note modal when clicking on a note
 * @param {Object} moodData - The mood data object
 */

function showNoteModal(moodData) {
  // Remove any existing modals
  const existingModal = document.querySelector('.note-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'note-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'note-modal-title');
  
  const modalContent = document.createElement('div');
  modalContent.className = 'note-modal-content';
  
  const header = document.createElement('div');
  header.className = 'note-header';
  
  const date = document.createElement('div');
  date.className = 'note-date';
  date.id = 'note-modal-title';
  date.textContent = `${moodData.date} at ${moodData.time || ''}`;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  header.appendChild(date);
  header.appendChild(closeBtn);
  
  const body = document.createElement('div');
  body.className = 'note-body';
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
  
  // Add to document
  document.body.appendChild(modal);
  
  // Focus the close button for keyboard accessibility
  setTimeout(() => closeBtn.focus(), 100);
}

/**
 * Update saved moods display
 */
function updateSavedMoods() {
  if (!elements.savedMoodsContainer) return;
  
  try {
    // Get the latest saved moods
    appState.savedMoods = appState.authManager.getSavedMoods();
    console.log("Fetched saved moods for display:", appState.savedMoods.length);
    
    elements.savedMoodsContainer.innerHTML = '';
    
    if (!appState.savedMoods || appState.savedMoods.length === 0) {
      showEmptySavedMoods();
      return;
    }
    
    // Already sorted in auth-manager.js - no need to sort again
    appState.savedMoods.forEach(createSavedMoodElement);
    
    // Announce for screen readers
    announceToScreenReader(`Displaying ${appState.savedMoods.length} saved moods`);
  } catch (error) {
    console.error("Error updating saved moods:", error);
    elements.savedMoodsContainer.innerHTML = '<p style="color: red; text-align: center;">Error loading saved moods. Please refresh the page.</p>';
  }
}

/**
 * Show empty state for saved moods
 */
function showEmptySavedMoods() {
  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = "No saved moods yet. Save your first mood!";
  emptyMessage.style.textAlign = "center";
  emptyMessage.style.color = "#666";
  emptyMessage.style.padding = "20px 0";
  elements.savedMoodsContainer.appendChild(emptyMessage);
}

/**
 * Create a saved mood element
 * @param {Object} saved - The saved mood data
 */
function createSavedMoodElement(saved) {
  const savedMoodElement = document.createElement('div');
  savedMoodElement.className = 'saved-mood';
  savedMoodElement.setAttribute('aria-label', `Mood from ${saved.date}: ${saved.moods.map(m => m.name).join(', ')}`);
  
  const savedBall = document.createElement('div');
  savedBall.className = 'saved-mood-ball';
  savedBall.setAttribute('role', 'img');
  savedBall.setAttribute('aria-hidden', 'true'); // Already described in parent
  
  // Create sections for the saved mood
  const sectionHeight = 100 / saved.moods.length;

  const moodEmojisForCard = saved.moods
    .map(m => getMoodEmoji(m.name))
    .join(' ');
  
  saved.moods.forEach((mood, index) => {
    const section = document.createElement('div');
    section.className = 'mood-section';
    section.style.backgroundColor = mood.color;
    section.style.top = `${index * sectionHeight}%`;
    section.style.height = `${sectionHeight}%`;
    
    savedBall.appendChild(section);
  });
  
  const dateContainer = document.createElement('div');
  dateContainer.className = 'mood-date-container';
  
  const dateElement = document.createElement('div');
  dateElement.className = 'date';
  dateElement.textContent = saved.date;
  dateContainer.appendChild(dateElement);
  
  // Add time if available
  if (saved.time) {
    const timeElement = document.createElement('div');
    timeElement.className = 'time';
    timeElement.textContent = saved.time;
      // Add mood names
  const moodNames = document.createElement('div');
  moodNames.className = 'mood-names';
  moodNames.textContent = saved.moods.map(mood => mood.name).join(', ');
  
  dateContainer.appendChild(moodNames);
  }
  
  savedMoodElement.appendChild(savedBall);
  savedMoodElement.appendChild(dateContainer);
  
  // Add note preview if there are notes
  if (saved.notes) {
    addNotePreview(savedMoodElement, saved);
  }
  
  // Add delete button
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'btn btn-danger btn-sm';
  deleteButton.addEventListener('click', () => handleDeleteMood(saved));
  
    // Center the delete button
  const deleteButtonContainer = document.createElement('div');
  deleteButtonContainer.style.textAlign = 'center';
  deleteButtonContainer.appendChild(deleteButton);
  
  savedMoodElement.appendChild(deleteButtonContainer);
  
  elements.savedMoodsContainer.appendChild(savedMoodElement);
}

/**
 * Add note preview to saved mood
 * @param {Element} savedMoodElement - The saved mood DOM element
 * @param {Object} saved - The saved mood data
 */
function addNotePreview(savedMoodElement, saved) {
  const notePreview = document.createElement('div');
  notePreview.className = 'saved-mood-details';
  
  const noteText = document.createElement('div');
  noteText.className = 'mood-note-preview';
  noteText.setAttribute('tabindex', '0');
  noteText.setAttribute('role', 'button');
  noteText.setAttribute('aria-label', `View note from ${saved.date}`);
  
  noteText.innerHTML = '<span class="mood-note-icon" aria-hidden="true">📝</span>' + 
                      (saved.notes.length > 20 ? 
                       saved.notes.substring(0, 20) + '...' : 
                       saved.notes);
  
  // Add click handler to show the full note
  noteText.addEventListener('click', () => {
    showNoteModal(saved);
  });
  
  // Add keyboard handler for accessibility
  noteText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showNoteModal(saved);
    }
  });
  
  notePreview.appendChild(noteText);
  savedMoodElement.appendChild(notePreview);
}

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 */
function announceToScreenReader(message) {
  if (!elements.statusAnnouncer) return;
  
  elements.statusAnnouncer.textContent = message;
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - The user input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export functions for testing (if needed)
export {
  initApp,
  handleColorSelection,
  updateMoodBall,
  updateSavedMoods,
  showNoteModal
};

// Properly expose the initCustomMoodFeature function
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Try to import the custom mood functionality module
    const module = await import('./custom-mood-functionality.js');
    
    // Make it available globally
    window.initCustomMoodFeature = module.initCustomMoodFeature;
    
    // Initialize if the document is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      window.initCustomMoodFeature();
    }
    
    console.log('Custom mood feature loaded successfully');
  } catch (error) {
    console.error('Error loading custom mood feature:', error);
  }
});