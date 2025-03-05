/**
 * Custom Mood Functionality - Enhanced with Emoji and Selection Indicators
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
 * Attach event handlers to all mood options (standard and custom)
 * This ensures consistent behavior for mood selection
 */
function attachMoodSelectionHandlers() {
  // Get all mood options (both standard and custom)
  const allMoodOptions = document.querySelectorAll('.color-option:not(.add-custom-mood-button)');
  
  // Try to find the main mood selection handler
  const moodBallScript = document.querySelector('script[src*="mood-ball.js"]');
  
  if (moodBallScript) {
    console.log('Found mood-ball.js script reference');
    
    // Attach click event to each mood option that dispatches a custom event
    allMoodOptions.forEach(option => {
      // Remove any existing click listeners to avoid duplicates
      const newOption = option.cloneNode(true);
      option.parentNode.replaceChild(newOption, option);
      
      // Add our custom click handler that fires a custom event
      newOption.addEventListener('click', () => {
        // Create and dispatch a custom event for the mood selection
        const moodSelectEvent = new CustomEvent('mood-selected', {
          detail: {
            element: newOption
          },
          bubbles: true
        });
        
        newOption.dispatchEvent(moodSelectEvent);
      });
    });
    
    // Add a global event listener for our custom event
    document.addEventListener('mood-selected', (e) => {
      // This will be intercepted by our handler in the inline script
      console.log('Custom mood selected event captured:', e.detail.element.getAttribute('data-name'));
    });
    
    // Inject our bridge script
    const bridgeScript = document.createElement('script');
    bridgeScript.textContent = `
      // Bridge between custom moods and standard mood selection
      document.addEventListener('mood-selected', function(e) {
        // Access the element from the event
        const element = e.detail.element;
        
        // Call the handleColorSelection function from mood-ball.js
        if (window.handleColorSelection) {
          window.handleColorSelection(element);
          
          // Update selection indicators after a short delay
          setTimeout(() => {
            if (window.updateExistingSelections) {
              window.updateExistingSelections();
            }
          }, 50);
        } else {
          console.error('handleColorSelection function not found in the global scope');
          
          // Fallback implementation if we can't find the original function
          const MAX_MOODS = 3;
          const appState = window.appState || { selectedMoods: [] };
          
          const color = element.getAttribute('data-color');
          const name = element.getAttribute('data-name');
          const isCustom = element.getAttribute('data-custom') === 'true';
          const customId = element.getAttribute('data-id');
          
          // Check if already selected
          const existingIndex = appState.selectedMoods.findIndex(mood => mood.name === name);
          
          if (existingIndex >= 0) {
            // Remove if already selected
            appState.selectedMoods.splice(existingIndex, 1);
            element.classList.remove('selected');
            element.setAttribute('aria-pressed', 'false');
            
            // Clear selection indicator
            const indicator = element.querySelector('.mood-selection-indicator');
            if (indicator) {
              indicator.style.display = 'none';
              indicator.textContent = '';
            }
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
              element.classList.add('selected');
              element.setAttribute('aria-pressed', 'true');
              
              // Update selection indicator
              const indicator = element.querySelector('.mood-selection-indicator');
              if (indicator) {
                indicator.textContent = appState.selectedMoods.length;
                indicator.style.display = 'flex';
              }
            } else {
              // Replace the first one if already have max moods
              const oldOption = Array.from(document.querySelectorAll('.color-option')).find(opt => 
                opt.getAttribute('data-name') === appState.selectedMoods[0].name
              );
              
              if (oldOption) {
                oldOption.classList.remove('selected');
                oldOption.setAttribute('aria-pressed', 'false');
                
                // Clear selection indicator on removed mood
                const oldIndicator = oldOption.querySelector('.mood-selection-indicator');
                if (oldIndicator) {
                  oldIndicator.style.display = 'none';
                  oldIndicator.textContent = '';
                }
              }
              
              appState.selectedMoods.shift();
              
              const moodObj = { color, name };
              
              // Add custom mood properties if applicable
              if (isCustom && customId) {
                moodObj.isCustom = true;
                moodObj.customId = customId;
              }
              
              appState.selectedMoods.push(moodObj);
              element.classList.add('selected');
              element.setAttribute('aria-pressed', 'true');
              
              // Update all selection indicators to show the correct numbers
              if (window.updateSelectionIndicators) {
                window.updateSelectionIndicators(appState.selectedMoods);
              } else {
                // Update indicators manually if function isn't available
                appState.selectedMoods.forEach((mood, index) => {
                  const moodElement = Array.from(document.querySelectorAll('.color-option')).find(
                    opt => opt.getAttribute('data-name') === mood.name
                  );
                  
                  if (moodElement) {
                    const indicator = moodElement.querySelector('.mood-selection-indicator');
                    if (indicator) {
                      indicator.textContent = index + 1;
                      indicator.style.display = 'flex';
                    }
                    moodElement.classList.add('selected');
                  }
                });
              }
            }
          }
          
          // Update UI (basic fallback)
          const moodBall = document.getElementById('current-mood-ball');
          if (moodBall) {
            moodBall.innerHTML = '';
            
            if (appState.selectedMoods.length === 0) {
              moodBall.style.backgroundColor = '#FFFFFF';
            } else {
              // Create sections for each mood
              const sectionHeight = 100 / appState.selectedMoods.length;
              
              appState.selectedMoods.forEach((mood, index) => {
                const section = document.createElement('div');
                section.className = 'mood-section';
                section.style.backgroundColor = mood.color;
                section.style.top = \`\${index * sectionHeight}%\`;
                section.style.height = \`\${sectionHeight}%\`;
                
                // Add emoji to each section
                const emoji = document.createElement('div');
                emoji.className = 'mood-emoji';
                emoji.textContent = window.getCustomMoodEmoji ? 
                                    window.getCustomMoodEmoji(mood.name) : 
                                    window.getMoodEmoji ? 
                                    window.getMoodEmoji(mood.name) : 
                                    '😊';
                emoji.setAttribute('aria-hidden', 'true');
                section.appendChild(emoji);
                
                moodBall.appendChild(section);
              });
            }
          }
          
          // Update selection info
          const selectionInfo = document.getElementById('selection-info');
          if (selectionInfo) {
            if (appState.selectedMoods.length === 0) {
              selectionInfo.textContent = "Select up to 3 emotions";
            } else {
              const moodNames = appState.selectedMoods.map(mood => mood.name).join(", ");
              selectionInfo.textContent = \`Selected: \${moodNames}\`;
            }
          }
        }
      });
    `;
    
    document.head.appendChild(bridgeScript);
  }
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