/**
 * Custom Mood Functionality
 * 
 * This file contains JavaScript functionality for managing custom moods
 * in the Bond Tree mood ball application.
 */

import CustomMoodManager from './custom-mood-manager.js';

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

/**
 * Initialize the custom mood functionality
 */
export function initCustomMoodFeature() {
  console.log('Initializing custom mood feature');
  
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load custom moods to the UI
  renderCustomMoodsInSelector();
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
  if (elements.moodColorsContainer) {
    elements.moodColorsContainer.appendChild(addCustomMoodBtn);
  }
  
  // Save reference
  elements.addCustomMoodBtn = addCustomMoodBtn;
}

/**
 * Render custom moods in the mood selector
 */
function renderCustomMoodsInSelector() {
  if (!elements.customMoodsGrid) {
    console.error('Custom moods grid not found');
    // Try to re-cache the element
    elements.customMoodsGrid = document.querySelector('.custom-moods-grid');
    
    if (!elements.customMoodsGrid) {
      console.error('Still unable to find custom moods grid');
      return;
    }
  }
  
  // Clear the custom moods grid
  elements.customMoodsGrid.innerHTML = '';
  
  // Get all custom moods
  const customMoods = customMoodManager.getAllCustomMoods();
  
  if (customMoods.length === 0) {
    elements.customMoodsGrid.innerHTML = `
      <p style="text-align: center; color: #777; font-style: italic; padding: 15px; grid-column: 1 / -1;">
        No custom moods yet. Create your first one!
      </p>
    `;
    return;
  }
  
  // Create a color option for each custom mood
  customMoods.forEach(mood => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.setAttribute('data-color', mood.color);
    colorOption.setAttribute('data-name', mood.name);
    colorOption.setAttribute('data-custom', 'true');
    colorOption.setAttribute('data-id', mood.id);
    colorOption.setAttribute('tabindex', '0');
    colorOption.setAttribute('role', 'button');
    colorOption.setAttribute('aria-pressed', 'false');
    
    colorOption.innerHTML = `
      <div class="color-sample" style="position: relative;">
        <div style="background-color: ${mood.color}; width: 100%; height: 100%;"></div>
        <div class="custom-mood-emoji-small">${mood.emoji}</div>
      </div>
      <span class="color-name">${mood.name}</span>
    `;
    
    // Add to the grid
    elements.customMoodsGrid.appendChild(colorOption);
    
    // Add edit button with stopPropagation
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-custom-mood-btn';
    editBtn.innerHTML = '✏️';
    editBtn.setAttribute('aria-label', `Edit ${mood.name} mood`);
    editBtn.style.position = 'absolute';
    editBtn.style.top = '5px';
    editBtn.style.right = '5px';
    editBtn.style.background = 'white';
    editBtn.style.border = 'none';
    editBtn.style.borderRadius = '50%';
    editBtn.style.width = '24px';
    editBtn.style.height = '24px';
    editBtn.style.padding = '0';
    editBtn.style.cursor = 'pointer';
    editBtn.style.fontSize = '12px';
    editBtn.style.opacity = '0';
    editBtn.style.transition = 'opacity 0.2s';
    editBtn.style.zIndex = '10';
    
    const colorSample = colorOption.querySelector('.color-sample');
    colorSample.style.position = 'relative';
    colorSample.appendChild(editBtn);
    
    // Show edit button on hover
    colorOption.addEventListener('mouseenter', () => {
      editBtn.style.opacity = '1';
    });
    
    colorOption.addEventListener('mouseleave', () => {
      editBtn.style.opacity = '0';
    });
    
    // Edit button click
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditCustomMoodModal(mood.id);
    });
  });
}

/**
 * Get emoji for a mood (including custom moods)
 * @param {string} moodName - The name of the mood
 * @returns {string} The emoji for the mood
 */
export function getMoodEmoji(moodName) {
  // First check if it's a custom mood
  const customMoods = customMoodManager.getAllCustomMoods();
  const customMood = customMoods.find(mood => mood.name === moodName);
  
  if (customMood) {
    return customMood.emoji;
  }
  
  // If not a custom mood, use the standard emoji mapping
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
  
  return MOOD_EMOJIS[moodName] || '😐';
}