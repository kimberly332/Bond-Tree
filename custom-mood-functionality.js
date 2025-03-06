/**
 * Custom Mood Functionality - Enhanced with Emoji and Selection Indicators
 * CSP-Compatible Version
 * 
 * This file contains JavaScript functionality for managing custom moods
 * in the Bond Tree mood ball application with improved emoji integration
 * and selection indicators.
 */

import CustomMoodManager from './custom-mood-manager.js';
import { getMoodEmoji } from './mood-emoji-utils.js';

// Initialize the custom mood manager
const customMoodManager = new CustomMoodManager();

// DOM Elements
let elements = {
  // Custom Mood Modal
  customMoodModal: null,
  customMoodForm: null,
  customMoodId: null,
  customMoodName: null,
  customMoodColor: null,
  customMoodEmoji: null,
  saveCustomMoodBtn: null,
  deleteCustomMoodBtn: null,
  closeCustomMoodModal: null,
  colorPreview: null,
  
  // Manage Custom Moods Modal
  manageCustomMoodsModal: null,
  customMoodsList: null,
  emptyCustomMoods: null,
  addNewCustomMoodBtn: null,
  closeManageMoodsModal: null,
  
  // Main UI
  moodColorsContainer: null,
  customMoodsGrid: null,
  addCustomMoodBtn: null
};

// State
let currentEmojiSelection = '😊';
let editingMoodId = null;

// Try to get access to the mood-ball.js handleColorSelection function
let handleColorSelectionFn = null;

/**
 * Update standard mood options to include emojis
 * This adds the emoji display to the standard mood options
 */
function updateStandardMoodOptions() {
  const moodColorsContainer = document.querySelector('.mood-colors');
  if (!moodColorsContainer) return;
  
  // Standard mood emoji mapping
  const STANDARD_MOOD_EMOJIS = {
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
  
  // Find all standard mood options
  const standardMoodOptions = moodColorsContainer.querySelectorAll('.color-option:not(.add-custom-mood-button)');
  
  standardMoodOptions.forEach(option => {
    const moodName = option.getAttribute('data-name');
    if (!moodName) return;
    
    // Get emoji for this mood
    const emoji = STANDARD_MOOD_EMOJIS[moodName] || '😐';
    
    // Check if this option already has the emoji div
    let emojiDiv = option.querySelector('.custom-mood-emoji-small');
    
    if (!emojiDiv) {
      // Get the color sample div
      const colorSample = option.querySelector('.color-sample');
      
      if (colorSample) {
        // Create and add the emoji div
        emojiDiv = document.createElement('div');
        emojiDiv.className = 'custom-mood-emoji-small';
        emojiDiv.textContent = emoji;
        
        colorSample.appendChild(emojiDiv);
      }
    } else {
      // Update existing emoji
      emojiDiv.textContent = emoji;
    }
    
    // Add selection indicator if it doesn't exist
    if (!option.querySelector('.mood-selection-indicator')) {
      const selectionIndicator = document.createElement('div');
      selectionIndicator.className = 'mood-selection-indicator';
      selectionIndicator.textContent = '';
      selectionIndicator.style.display = 'none';
      option.appendChild(selectionIndicator);
    }
  });
}

/**
 * Add selection indicators to custom mood options
 */
function addSelectionIndicatorsToCustomMoods() {
  // Find all custom mood options
  const customMoodsGrid = document.querySelector('.custom-moods-grid');
  if (!customMoodsGrid) return;
  
  const customMoodOptions = customMoodsGrid.querySelectorAll('.color-option');
  
  customMoodOptions.forEach(option => {
    // Add selection indicator if it doesn't exist
    if (!option.querySelector('.mood-selection-indicator')) {
      const selectionIndicator = document.createElement('div');
      selectionIndicator.className = 'mood-selection-indicator';
      selectionIndicator.textContent = '';
      selectionIndicator.style.display = 'none';
      option.appendChild(selectionIndicator);
    }
  });
}

/**
 * Update selection indicators for mood options
 * @param {Array} selectedMoods - Array of selected mood objects
 */
function updateSelectionIndicators(selectedMoods) {
  if (!selectedMoods || !Array.isArray(selectedMoods)) return;
  
  // First reset all indicators and remove selected class from all options
  document.querySelectorAll('.mood-selection-indicator').forEach(indicator => {
    indicator.style.display = 'none';
    indicator.textContent = '';
  });
  
  document.querySelectorAll('.color-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Then update only the selected ones with their position
  selectedMoods.forEach((mood, index) => {
    if (!mood || !mood.name) return;
    
    const moodOption = Array.from(document.querySelectorAll('.color-option')).find(
      option => option.getAttribute('data-name') === mood.name
    );
    
    if (moodOption) {
      const indicator = moodOption.querySelector('.mood-selection-indicator');
      if (indicator) {
        indicator.textContent = (index + 1);
        indicator.style.display = 'flex';
      }
      
      // Add selected class only to selected moods
      moodOption.classList.add('selected');
    }
  });
}

/**
 * Get current selected moods from the selection info text
 * @returns {Array} Array of selected mood objects
 */
function getCurrentSelectedMoods() {
  const selectionInfo = document.getElementById('selection-info');
  if (selectionInfo) {
    if (selectionInfo.textContent.includes(':')) {
      const selectedText = selectionInfo.textContent.split(':')[1].trim();
      if (selectedText) {
        const moodNames = selectedText.split(',').map(name => name.trim());
        return moodNames.map(name => ({ name }));
      }
    }
  }
  return [];
}

/**
 * Update existing selections when page loads or moods change
 */
function updateExistingSelections() {
  const selectedMoods = getCurrentSelectedMoods();
  updateSelectionIndicators(selectedMoods);
}

/**
 * Initialize mood selection indicators
 */
function initMoodSelectionIndicators() {
  // Update standard mood options first
  updateStandardMoodOptions();
  
  // Add selection indicators to custom moods
  addSelectionIndicatorsToCustomMoods();
  
  // Add global listener for mood selection changes
  const moodBall = document.getElementById('current-mood-ball');
  if (moodBall) {
    // Use a MutationObserver to detect when mood ball changes
    const observer = new MutationObserver(mutations => {
      updateExistingSelections();
    });
    
    // Start observing the mood ball for changes
    observer.observe(moodBall, { childList: true, subtree: true });
  }
  
  // Also hook into color option clicks
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Give the selection time to update
      setTimeout(() => {
        updateExistingSelections();
      }, 50);
    });
  });
  
  // Initial update of selections (important for page reloads)
  setTimeout(updateExistingSelections, 100);
}

/**
 * Try to find the handleColorSelection function from the window scope
 * and save it for later use
 */
function discoverMoodBallFunctions() {
  // Check if it's available in window
  if (typeof window.handleColorSelection === 'function') {
    handleColorSelectionFn = window.handleColorSelection;
    console.log('Found handleColorSelection in window scope');
  } else {
    // Attempt to find it via module exports if visible
    console.log('Attempting to discover handleColorSelection from mood-ball.js');
    
    // Set up a fallback implementation
    handleColorSelectionFn = function(element) {
      console.log('Using fallback implementation for handleColorSelection');
      // Dispatch a click event on the element which should trigger the original handlers
      element.click();
    };
  }
}

/**
 * Handle mood selection for custom moods
 * @param {Element} element - The color option element that was clicked
 */
function handleCustomMoodSelection(element) {
  // If we have access to the original function, use it
  if (handleColorSelectionFn) {
    handleColorSelectionFn(element);
    
    // Update selection indicators after a short delay
    setTimeout(() => {
      updateExistingSelections();
    }, 50);
    return;
  }
  
  // Otherwise use our fallback implementation
  // The click event should trigger any bound handlers
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  
  element.dispatchEvent(clickEvent);
  
  // Update selection indicators after a short delay
  setTimeout(() => {
    updateExistingSelections();
  }, 50);
}

/**
 * Attach event handlers to all mood options (standard and custom)
 * This ensures consistent behavior for mood selection
 */
function attachMoodSelectionHandlers() {
  // Try to discover the handleColorSelection function
  discoverMoodBallFunctions();
  
  // Find all custom mood options (excluding the "add" button)
  const customMoodOptions = document.querySelectorAll('.custom-moods-grid .color-option:not(.add-custom-mood-button)');
  
  // Attach click handlers to custom mood options
  customMoodOptions.forEach(option => {
    // First remove any existing click handlers to avoid duplicates
    const newOption = option.cloneNode(true);
    if (option.parentNode) {
      option.parentNode.replaceChild(newOption, option);
    }
    
    // Add our custom click handler
    newOption.addEventListener('click', () => {
      handleCustomMoodSelection(newOption);
    });
  });
}

/**
 * Initialize the custom mood functionality
 */
export function initCustomMoodFeature() {
  console.log('Initializing custom mood feature');
  
  // First create the manage custom moods button which creates the grid
  createManageCustomMoodsButton();
  
  // Wait a brief moment to ensure DOM elements are created
  setTimeout(() => {
    // Re-cache elements after creation
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Finally render custom moods
    renderCustomMoodsInSelector();
    
    // Initialize selection indicators
    initMoodSelectionIndicators();
    
    // Attach selection handlers
    attachMoodSelectionHandlers();
  }, 100);
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements = {
    // Custom Mood Modal
    customMoodModal: document.getElementById('custom-mood-modal'),
    customMoodForm: document.getElementById('custom-mood-form'),
    customMoodId: document.getElementById('custom-mood-id'),
    customMoodName: document.getElementById('custom-mood-name'),
    customMoodColor: document.getElementById('custom-mood-color'),
    customMoodEmoji: document.getElementById('custom-mood-emoji'),
    saveCustomMoodBtn: document.getElementById('save-custom-mood'),
    deleteCustomMoodBtn: document.getElementById('delete-custom-mood'),
    closeCustomMoodModal: document.getElementById('close-custom-mood-modal'),
    colorPreview: document.getElementById('color-preview'),
    
    // Manage Custom Moods Modal
    manageCustomMoodsModal: document.getElementById('manage-custom-moods-modal'),
    customMoodsList: document.getElementById('custom-moods-list'),
    emptyCustomMoods: document.getElementById('empty-custom-moods'),
    addNewCustomMoodBtn: document.getElementById('add-new-custom-mood'),
    closeManageMoodsModal: document.getElementById('close-manage-moods-modal'),
    
    // Main UI
    moodColorsContainer: document.querySelector('.mood-colors'),
    customMoodsGrid: document.querySelector('.custom-moods-grid')
  };
  
  console.log('Custom mood elements cached:', elements);
}

/**
 * Set up event listeners for custom mood functionality
 */
function setupEventListeners() {
  // Color picker change event
  if (elements.customMoodColor) {
    elements.customMoodColor.addEventListener('input', (e) => {
      if (elements.colorPreview) {
        elements.colorPreview.style.backgroundColor = e.target.value;
      }
    });
    
    // Initialize color preview
    if (elements.colorPreview) {
      elements.colorPreview.style.backgroundColor = elements.customMoodColor.value;
    }
  }
  
  // Emoji selection
  const emojiOptions = document.querySelectorAll('.emoji-option');
  emojiOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      emojiOptions.forEach(emoji => emoji.classList.remove('selected'));
      
      // Add selected class to the clicked option
      option.classList.add('selected');
      
      // Update hidden input value
      currentEmojiSelection = option.getAttribute('data-emoji');
      if (elements.customMoodEmoji) {
        elements.customMoodEmoji.value = currentEmojiSelection;
      }
    });
  });
  
  // Custom mood form submission
  if (elements.customMoodForm) {
    elements.customMoodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCustomMood();
    });
  }
  
  // Close custom mood modal
  if (elements.closeCustomMoodModal) {
    elements.closeCustomMoodModal.addEventListener('click', () => {
      if (elements.customMoodModal) {
        elements.customMoodModal.style.display = 'none';
      }
    });
  }
  
  // Delete custom mood
  if (elements.deleteCustomMoodBtn) {
    elements.deleteCustomMoodBtn.addEventListener('click', () => {
      if (editingMoodId) {
        const confirmed = confirm('Are you sure you want to delete this custom mood?');
        if (confirmed) {
          customMoodManager.deleteCustomMood(editingMoodId);
          elements.customMoodModal.style.display = 'none';
          
          // Refresh UI
          renderCustomMoodsInSelector();
          
          // Show confirmation
          alert('Custom mood deleted successfully!');
        }
      }
    });
  }
  
  // Add new custom mood button
  if (elements.addNewCustomMoodBtn) {
    elements.addNewCustomMoodBtn.addEventListener('click', () => {
      openCreateCustomMoodModal();
      elements.manageCustomMoodsModal.style.display = 'none';
    });
  }
  
  // Close manage moods modal
  if (elements.closeManageMoodsModal) {
    elements.closeManageMoodsModal.addEventListener('click', () => {
      if (elements.manageCustomMoodsModal) {
        elements.manageCustomMoodsModal.style.display = 'none';
      }
    });
  }
  
  // Click outside to close modals
  window.addEventListener('click', (e) => {
    if (e.target === elements.customMoodModal) {
      elements.customMoodModal.style.display = 'none';
    }
    if (e.target === elements.manageCustomMoodsModal) {
      elements.manageCustomMoodsModal.style.display = 'none';
    }
  });
  
  // Create the "Manage Custom Moods" button if it doesn't exist
  createManageCustomMoodsButton();
  
  // Create and set up the "Add Custom Mood" button
  setupAddCustomMoodButton();
}

/**
 * Save a custom mood from the form
 */
function saveCustomMood() {
  try {
    const moodName = elements.customMoodName.value.trim();
    const moodColor = elements.customMoodColor.value;
    const moodEmoji = elements.customMoodEmoji.value;
    
    if (!moodName) {
      alert('Please enter a name for your custom mood.');
      return;
    }
    
    const moodData = {
      name: moodName,
      color: moodColor,
      emoji: moodEmoji
    };
    
    // Check if we're editing or creating
    if (editingMoodId) {
      customMoodManager.updateCustomMood(editingMoodId, moodData);
      alert('Custom mood updated successfully!');
    } else {
      customMoodManager.addCustomMood(moodData);
      alert('Custom mood created successfully!');
    }
    
    // Close the modal
    elements.customMoodModal.style.display = 'none';
    
    // Refresh the UI
    renderCustomMoodsInSelector();
    
  } catch (error) {
    console.error('Error saving custom mood:', error);
    alert('Error saving custom mood: ' + error.message);
  }
}

/**
 * Open the modal to create a new custom mood
 */
function openCreateCustomMoodModal() {
  if (!elements.customMoodModal) {
    console.error('Custom mood modal not found');
    return;
  }
  
  // Reset form
  elements.customMoodForm.reset();
  elements.customMoodId.value = '';
  elements.customMoodName.value = '';
  elements.customMoodColor.value = '#4a90e2';
  elements.customMoodEmoji.value = '😊';
  elements.colorPreview.style.backgroundColor = '#4a90e2';
  
  // Update modal title
  document.getElementById('custom-mood-title').textContent = 'Create Custom Mood';
  
  // Hide delete button
  elements.deleteCustomMoodBtn.style.display = 'none';
  
  // Reset emoji selection
  const emojiOptions = document.querySelectorAll('.emoji-option');
  emojiOptions.forEach(emoji => emoji.classList.remove('selected'));
  
  const defaultEmoji = document.querySelector('.emoji-option[data-emoji="😊"]');
  if (defaultEmoji) {
    defaultEmoji.classList.add('selected');
  }
  
  // Reset state
  editingMoodId = null;
  
  // Show modal
  elements.customMoodModal.style.display = 'flex';
}

/**
 * Open the modal to edit an existing custom mood
 * @param {string} moodId - The ID of the mood to edit
 */
function openEditCustomMoodModal(moodId) {
  // Get the mood data
  const mood = customMoodManager.findMoodById(moodId);
  if (!mood) {
    console.error('Mood not found:', moodId);
    return;
  }
  
  // Set form values
  elements.customMoodId.value = mood.id;
  elements.customMoodName.value = mood.name;
  elements.customMoodColor.value = mood.color;
  elements.customMoodEmoji.value = mood.emoji;
  elements.colorPreview.style.backgroundColor = mood.color;
  
  // Update modal title
  document.getElementById('custom-mood-title').textContent = 'Edit Custom Mood';
  
  // Show delete button
  elements.deleteCustomMoodBtn.style.display = 'inline-block';
  
  // Update emoji selection
  const emojiOptions = document.querySelectorAll('.emoji-option');
  emojiOptions.forEach(emoji => emoji.classList.remove('selected'));
  
  // Find and select the matching emoji
  const matchingEmoji = document.querySelector(`.emoji-option[data-emoji="${mood.emoji}"]`);
  if (matchingEmoji) {
    matchingEmoji.classList.add('selected');
  }
  
  // Set state
  editingMoodId = mood.id;
  
  // Show modal
  elements.customMoodModal.style.display = 'flex';
}

/**
 * Open the manage custom moods modal
 */
function openManageCustomMoodsModal() {
  // Populate the list
  renderCustomMoodsList();
  
  // Show modal
  elements.manageCustomMoodsModal.style.display = 'flex';
}

/**
 * Render the list of custom moods in the manage moods modal
 */
function renderCustomMoodsList() {
  const customMoods = customMoodManager.getAllCustomMoods();
  
  // Clear the list
  elements.customMoodsList.innerHTML = '';
  
  // Show/hide empty message
  if (customMoods.length === 0) {
    elements.emptyCustomMoods.style.display = 'block';
  } else {
    elements.emptyCustomMoods.style.display = 'none';
    
    // Add each mood to the list
    customMoods.forEach(mood => {
      const moodItem = document.createElement('div');
      moodItem.className = 'custom-mood-item';
      moodItem.setAttribute('data-id', mood.id);
      
      moodItem.innerHTML = `
        <div class="custom-mood-color" style="background-color: ${mood.color}"></div>
        <div class="custom-mood-info">
          <div class="custom-mood-name">${mood.name}</div>
        </div>
        <div class="custom-mood-emoji">${mood.emoji}</div>
      `;
      
      // Add click event to edit
      moodItem.addEventListener('click', () => {
        openEditCustomMoodModal(mood.id);
        elements.manageCustomMoodsModal.style.display = 'none';
      });
      
      elements.customMoodsList.appendChild(moodItem);
    });
  }
}

/**
 * Create a button to manage custom moods in the mood selection area
 */
function createManageCustomMoodsButton() {
  if (!elements.moodColorsContainer) return;
  
  // Check if the container already exists
  let customMoodsContainer = document.querySelector('.custom-moods-container');
  
  if (!customMoodsContainer) {
    // Add a visual separator before the custom moods section
    const separator = document.createElement('div');
    separator.className = 'section-separator';
    elements.moodColorsContainer.parentNode.insertBefore(separator, elements.moodColorsContainer.nextSibling);
    
    // Create a container for custom moods section
    customMoodsContainer = document.createElement('div');
    customMoodsContainer.className = 'custom-moods-container';
    customMoodsContainer.innerHTML = `
      <h3 class="section-title">Your Custom Moods</h3>
      <div class="custom-moods-grid"></div>
      <div class="manage-custom-moods-btn-container">
        <button id="manage-custom-moods" class="btn btn-primary btn-sm">
          Manage Custom Moods
        </button>
      </div>
    `;
    
    // Add custom moods section after the separator
    elements.moodColorsContainer.parentNode.insertBefore(customMoodsContainer, separator.nextSibling);
    
    // Update reference to custom moods grid
    elements.customMoodsGrid = document.querySelector('.custom-moods-grid');
    
    // Set up the manage custom moods button
    const manageBtn = document.getElementById('manage-custom-moods');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        openManageCustomMoodsModal();
      });
    }
  }
}

/**
 * Render custom moods in the mood selector grid
 */
function renderCustomMoodsInSelector() {
  if (!elements.customMoodsGrid) {
    console.error('Custom moods grid not found');
    return;
  }
  
  // Clear the grid
  elements.customMoodsGrid.innerHTML = '';
  
  // Get all custom moods
  const customMoods = customMoodManager.getAllCustomMoods();
  
  // Add each custom mood to the grid
  customMoods.forEach(mood => {
    const moodOption = document.createElement('div');
    moodOption.className = 'color-option';
    moodOption.setAttribute('data-color', mood.color);
    moodOption.setAttribute('data-name', mood.name);
    moodOption.setAttribute('data-custom', 'true');
    moodOption.setAttribute('data-id', mood.id);
    moodOption.setAttribute('tabindex', '0');
    moodOption.setAttribute('role', 'button');
    moodOption.setAttribute('aria-pressed', 'false');
    
    moodOption.innerHTML = `
      <div class="color-sample">
        <div style="background-color: ${mood.color}; width: 100%; height: 100%;"></div>
        <div class="custom-mood-emoji-small">${mood.emoji}</div>
      </div>
      <span class="color-name">${mood.name}</span>
      <div class="mood-selection-indicator" style="display: none;"></div>
    `;
    
    elements.customMoodsGrid.appendChild(moodOption);
  });
  
  // Add selection indicators to custom moods
  addSelectionIndicatorsToCustomMoods();
  
  // Update selection states
  updateExistingSelections();
  
  // Reattach event handlers
  attachMoodSelectionHandlers();
}

/**
 * Create and set up the "Add Custom Mood" button
 */
function setupAddCustomMoodButton() {
  // Check if button already exists
  const existingBtn = document.querySelector('.add-custom-mood-button');
  if (existingBtn) {
    existingBtn.addEventListener('click', openCreateCustomMoodModal);
    return;
  }
  
  // Create "Add Custom Mood" button to add to the mood colors
  const addCustomMoodBtn = document.createElement('div');
  addCustomMoodBtn.className = 'color-option add-custom-mood-button';
  addCustomMoodBtn.setAttribute('tabindex', '0');
  addCustomMoodBtn.setAttribute('role', 'button');
  addCustomMoodBtn.setAttribute('aria-label', 'Create new custom mood');
  
  addCustomMoodBtn.innerHTML = `
    <div class="color-sample">
      <div>+</div>
    </div>
    <span class="color-name">Create New</span>
  `;
  
  // Add click handler
  addCustomMoodBtn.addEventListener('click', openCreateCustomMoodModal);
  
  // Add keyboard handler for accessibility
  addCustomMoodBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCreateCustomMoodModal();
    }
  });
  
  // Add to the mood colors container
  if (elements.customMoodsGrid) {
    elements.customMoodsGrid.appendChild(addCustomMoodBtn);
  }
  
  // Save reference
  elements.addCustomMoodBtn = addCustomMoodBtn;
}