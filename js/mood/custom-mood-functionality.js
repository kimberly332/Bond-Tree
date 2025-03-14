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
    try {
      const selectedMoods = getCurrentSelectedMoods();
      updateSelectionIndicators(selectedMoods);
    } catch (error) {
      console.error("Error updating selections:", error);
    }
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
    const selectionInfo = document.getElementById('selection-info');
    
    if (moodBall) {
      // Use a MutationObserver to detect when mood ball changes
      const observer = new MutationObserver(() => {
        // Use a debounced update to avoid excessive function calls
        clearTimeout(window.updateSelectionsTimeout);
        window.updateSelectionsTimeout = setTimeout(updateExistingSelections, 50);
      });
      
      // Only observe the specific elements we care about
      observer.observe(moodBall, { childList: true, subtree: true });
      
      if (selectionInfo) {
        observer.observe(selectionInfo, { childList: true, characterData: true });
      }
    }
    
    // Initial update of selections (important for page reloads)
    setTimeout(updateExistingSelections, 100);
  }

  function discoverMoodBallFunctions() {
    // Check if it's available in window
    if (typeof window.handleColorSelection === 'function') {
      handleColorSelectionFn = window.handleColorSelection;
      console.log('Found handleColorSelection in window scope');
    } else {
      console.log('Setting up safe fallback for handleColorSelection');
      
      // Safe fallback that won't cause infinite recursion
      handleColorSelectionFn = function(element) {
        // Get data attributes
        const name = element.getAttribute('data-name');
        const color = element.getAttribute('data-color');
        const isCustom = element.getAttribute('data-custom') === 'true';
        const customId = element.getAttribute('data-id');
        
        if (!name || !color) return;
        
        console.log('Fallback handling mood selection:', name, color);
        
        // Get current selected moods from selection info
        const selectionInfo = document.getElementById('selection-info');
        if (!selectionInfo) return;
        
        // Check if currently selected
        const isCurrentlySelected = element.classList.contains('selected');
        
        // If already selected, just remove it
        if (isCurrentlySelected) {
          // Remove selection
          element.classList.remove('selected');
          
          // Update selection info text
          const currentText = selectionInfo.textContent || '';
          if (currentText.includes(':')) {
            const parts = currentText.split(':');
            const selectedNames = parts[1].split(',')
                                  .map(n => n.trim())
                                  .filter(n => n !== name);
            
            selectionInfo.textContent = selectedNames.length ? 
              `Selected: ${selectedNames.join(', ')}` : 
              'Select up to 3 emotions';
          }
        } else {
          // Get current selected moods
          const currentText = selectionInfo.textContent || '';
          let selectedMoods = [];
          
          if (currentText.includes(':')) {
            const parts = currentText.split(':');
            selectedMoods = parts[1].split(',')
                            .map(n => n.trim())
                            .filter(n => n.length > 0);
          }
          
          // Check if we already have 3 selections
          if (selectedMoods.length >= 3) {
            // Remove the first (oldest) selection
            const oldestMood = selectedMoods.shift();
            
            // Find and deselect the corresponding element
            const oldElement = Array.from(document.querySelectorAll('.color-option')).find(
              opt => opt.getAttribute('data-name') === oldestMood
            );
            
            if (oldElement) {
              oldElement.classList.remove('selected');
            }
          }
          
          // Add the new selection
          selectedMoods.push(name);
          element.classList.add('selected');
          
          // Update selection info text
          selectionInfo.textContent = `Selected: ${selectedMoods.join(', ')}`;
        }
        
        // Update the mood ball visualization and indicators
        updateMoodBallVisualization();
        updateExistingSelections();
        
        // Sync with appState to ensure save works correctly
        if (typeof syncSelectionsWithAppState === 'function') {
          syncSelectionsWithAppState();
        } else {
          // Inline implementation if function not defined elsewhere
          try {
            if (window.appState && window.appState.selectedMoods) {
              // Clear existing selections
              window.appState.selectedMoods = [];
              
              // Get all selected mood options
              const selectedElements = document.querySelectorAll('.color-option.selected');
              
              // Add each selected mood to appState
              selectedElements.forEach(opt => {
                const moodName = opt.getAttribute('data-name');
                const moodColor = opt.getAttribute('data-color');
                const isMoodCustom = opt.getAttribute('data-custom') === 'true';
                const moodCustomId = opt.getAttribute('data-id');
                
                if (moodName && moodColor) {
                  const moodObject = { color: moodColor, name: moodName };
                  
                  if (isMoodCustom && moodCustomId) {
                    moodObject.isCustom = true;
                    moodObject.customId = moodCustomId;
                  }
                  
                  window.appState.selectedMoods.push(moodObject);
                }
              });
              
              console.log('Inline synced selections with appState:', window.appState.selectedMoods);
            }
          } catch (syncError) {
            console.error('Error syncing with appState:', syncError);
          }
        }
      };
    }
  }
  
  // In updateMoodBallVisualization function
function updateMoodBallVisualization() {
    const selectionInfo = document.getElementById('selection-info');
    const moodBall = document.getElementById('current-mood-ball');
    
    if (!selectionInfo || !moodBall) return;
    
    // Get selected moods from selection info
    const currentText = selectionInfo.textContent || '';
    if (!currentText.includes(':')) return;
    
    // Extract mood names
    const parts = currentText.split(':');
    const selectedMoodNames = parts[1].split(',').map(n => n.trim()).filter(n => n.length > 0);
    
    // Clear mood ball
    moodBall.innerHTML = '';
    
    // If no moods selected, reset and return
    if (selectedMoodNames.length === 0) {
      moodBall.style.backgroundColor = '#FFFFFF';
      return;
    }
    
    // Get all custom moods for emoji lookup
    const customMoods = customMoodManager.getAllCustomMoods();
    
    // Get colors for each selected mood
    const selectedMoods = [];
    selectedMoodNames.forEach(name => {
      // Try to find the element with this name
      const element = document.querySelector(`.color-option[data-name="${name}"]`);
      if (element) {
        const color = element.getAttribute('data-color');
        if (color) {
          selectedMoods.push({ name, color });
        }
      }
    });
    
    // Create sections in the mood ball (similar to how the original function does it)
    const sectionHeight = 100 / selectedMoods.length;
    
    selectedMoods.forEach((mood, index) => {
      const section = document.createElement('div');
      section.className = 'mood-section';
      section.style.backgroundColor = mood.color;
      section.style.top = `${index * sectionHeight}%`;
      section.style.height = `${sectionHeight}%`;
      
      // Add corresponding emoji - PASS CUSTOM MOODS HERE
      const emoji = document.createElement('div');
      emoji.className = 'mood-emoji';
      emoji.textContent = getMoodEmoji(mood.name, customMoods);
      emoji.setAttribute('aria-hidden', 'true');
      
      section.appendChild(emoji);
      moodBall.appendChild(section);
    });
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
    
    // We need to override the standard mood option clicks as well
    const allMoodOptions = document.querySelectorAll('.color-option');
    
    // Attach our custom handler to ALL mood options
    allMoodOptions.forEach(option => {
      // Skip the "add" button
      if (option.classList.contains('add-custom-mood-button')) return;
      
      // First remove any existing click handlers to avoid duplicates
      const newOption = option.cloneNode(true);
      if (option.parentNode) {
        option.parentNode.replaceChild(newOption, option);
      }
      
      // Add our custom click handler that will preserve selection state
      newOption.addEventListener('click', () => {
        // Use our same custom selection handler for all moods
        handleCustomMoodSelection(newOption);
      });
    });
    syncSelectionsWithAppState();
  }

/**
 * Clean up duplicate custom moods in storage
 */
function cleanupDuplicateCustomMoods() {
    const allMoods = customMoodManager.getAllCustomMoods();
    const uniqueMoods = [];
    const usedNames = new Set();
    
    // Keep only the first instance of each mood name
    allMoods.forEach(mood => {
      if (!usedNames.has(mood.name.toLowerCase())) {
        usedNames.add(mood.name.toLowerCase());
        uniqueMoods.push(mood);
      }
    });
    
    // If we found duplicates, update the storage
    if (uniqueMoods.length < allMoods.length) {
      console.log(`Removed ${allMoods.length - uniqueMoods.length} duplicate moods`);
      
      // Update local storage directly
      try {
        localStorage.setItem('bondTree_customMoods', JSON.stringify(uniqueMoods));
        console.log('Storage updated with deduplicated moods');
      } catch (error) {
        console.error('Error updating storage:', error);
      }
    }
  }

// Add this function near the top of your file
function syncSelectionsWithAppState() {
    try {
      // Access the appState from the parent window
      if (window.appState && window.appState.selectedMoods) {
        // Clear existing selections
        window.appState.selectedMoods = [];
        
        // Get all selected mood options
        const selectedOptions = document.querySelectorAll('.color-option.selected');
        
        // Add each selected mood to appState
        selectedOptions.forEach(option => {
          const name = option.getAttribute('data-name');
          const color = option.getAttribute('data-color');
          const isCustom = option.getAttribute('data-custom') === 'true';
          const customId = option.getAttribute('data-id');
          
          if (name && color) {
            const moodObj = { color, name };
            
            // Add custom mood properties if applicable
            if (isCustom && customId) {
              moodObj.isCustom = true;
              moodObj.customId = customId;
            }
            
            window.appState.selectedMoods.push(moodObj);
          }
        });
        
        console.log('Synced selections with appState:', window.appState.selectedMoods);
      }
    } catch (error) {
      console.error('Error syncing selections with appState:', error);
    }
  }

// Add this variable at the top of your file
let isInitialized = false;

export function initCustomMoodFeature() {
  // Only initialize once
  if (isInitialized) {
    console.log('Custom mood feature already initialized, skipping');
    return;
  }
  
  console.log('Initializing custom mood feature');
  
  // Clean up any duplicate moods
  cleanupDuplicateCustomMoods();
  
  // Rest of your existing code...
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeWithRetry();
    });
  } else {
    initializeWithRetry();
  }
  
  isInitialized = true;
}

  function initializeWithRetry(attempts = 0) {
    // Create the manage custom moods button which creates the grid
    createManageCustomMoodsButton();
    
    // Wait a brief moment to ensure DOM elements are created
    setTimeout(() => {
      // Re-cache elements after creation
      cacheElements();
      
      // If key elements are missing and we haven't tried too many times, retry
      if (!elements.customMoodsGrid && attempts < 3) {
        console.log(`Retrying initialization (attempt ${attempts + 1})`);
        initializeWithRetry(attempts + 1);
        return;
      }
      
      // Set up event listeners
      setupEventListeners();
      
      // Finally render custom moods
      renderCustomMoodsInSelector();
      
      // Initialize selection indicators
      initMoodSelectionIndicators();
      
      // Attach selection handlers
      attachMoodSelectionHandlers();
    }, 100 * (attempts + 1)); // Increase timeout with each retry
  }

  function cacheElements() {
    try {
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
      
      // Log status of key elements
      console.log('Custom mood elements cached:', {
        modalFound: !!elements.customMoodModal,
        formFound: !!elements.customMoodForm,
        moodColorsFound: !!elements.moodColorsContainer,
        customMoodsGridFound: !!elements.customMoodsGrid
      });
    } catch (error) {
      console.error('Error caching custom mood elements:', error);
    }
  }

  function setupEventListeners() {
    // Track which elements already have listeners
    const listenersAdded = new Set();
  
    // Color picker change event
    if (elements.customMoodColor && !listenersAdded.has('colorChange')) {
      elements.customMoodColor.addEventListener('input', (e) => {
        if (elements.colorPreview) {
          elements.colorPreview.style.backgroundColor = e.target.value;
        }
      });
      
      // Initialize color preview
      if (elements.colorPreview) {
        elements.colorPreview.style.backgroundColor = elements.customMoodColor.value;
      }
      
      listenersAdded.add('colorChange');
    }
    
    // Emoji selection
    const emojiOptions = document.querySelectorAll('.emoji-option');
    if (emojiOptions.length > 0 && !listenersAdded.has('emojiSelection')) {
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
      
      listenersAdded.add('emojiSelection');
    }
    
    // Custom mood form submission
    if (elements.customMoodForm && !listenersAdded.has('formSubmission')) {
      elements.customMoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomMood();
      });
      
      listenersAdded.add('formSubmission');
    }
    
    // Close custom mood modal
    if (elements.closeCustomMoodModal && !listenersAdded.has('closeModal')) {
      elements.closeCustomMoodModal.addEventListener('click', () => {
        if (elements.customMoodModal) {
          elements.customMoodModal.style.display = 'none';
        }
      });
      
      listenersAdded.add('closeModal');
    }
    
    // Delete custom mood
    if (elements.deleteCustomMoodBtn && !listenersAdded.has('deleteButton')) {
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
      
      listenersAdded.add('deleteButton');
    }
    
    // Add new custom mood button
    if (elements.addNewCustomMoodBtn && !listenersAdded.has('addNewMood')) {
      elements.addNewCustomMoodBtn.addEventListener('click', () => {
        openCreateCustomMoodModal();
        elements.manageCustomMoodsModal.style.display = 'none';
      });
      
      listenersAdded.add('addNewMood');
    }
    
    // Close manage moods modal
    if (elements.closeManageMoodsModal && !listenersAdded.has('closeManageModal')) {
      elements.closeManageMoodsModal.addEventListener('click', () => {
        if (elements.manageCustomMoodsModal) {
          elements.manageCustomMoodsModal.style.display = 'none';
        }
      });
      
      listenersAdded.add('closeManageModal');
    }
    
    // Click outside to close modals
    if (!listenersAdded.has('clickOutside')) {
      window.addEventListener('click', (e) => {
        if (e.target === elements.customMoodModal) {
          elements.customMoodModal.style.display = 'none';
        }
        if (e.target === elements.manageCustomMoodsModal) {
          elements.manageCustomMoodsModal.style.display = 'none';
        }
      });
      
      listenersAdded.add('clickOutside');
    }
    
    // Create the "Manage Custom Moods" button if it doesn't exist
    if (!listenersAdded.has('createManageButton')) {
      createManageCustomMoodsButton();
      listenersAdded.add('createManageButton');
    }
    
    // Create and set up the "Add Custom Mood" button
    if (!listenersAdded.has('setupAddButton')) {
      setupAddCustomMoodButton();
      listenersAdded.add('setupAddButton');
    }
  }

// Add a flag to prevent duplicate submissions
let isSavingMood = false;

function saveCustomMood() {
    // Prevent concurrent saves or duplicate form submissions
    if (isSavingMood) {
        console.log('Save already in progress, ignoring duplicate call');
        return;
    }
    
    try {
        isSavingMood = true;
        
        const moodName = elements.customMoodName.value.trim();
        const moodColor = elements.customMoodColor.value;
        const moodEmoji = elements.customMoodEmoji.value;
        
        if (!moodName) {
            alert('Please enter a name for your custom mood.');
            isSavingMood = false;
            return;
        }
        
        // Check if a mood with this name already exists
        const existingMoods = customMoodManager.getAllCustomMoods();
        
        // Get all mood names (case insensitive) BEFORE we save the new one
        const existingNames = new Set(
            existingMoods.map(mood => mood.name.toLowerCase())
        );
        
        // If editing, remove the current mood name from the set
        if (editingMoodId) {
            const currentMood = existingMoods.find(mood => mood.id === editingMoodId);
            if (currentMood) {
                existingNames.delete(currentMood.name.toLowerCase());
            }
        }
        
        // Check if name exists (now properly excluding the editing mood)
        if (existingNames.has(moodName.toLowerCase())) {
            alert('A mood with this name already exists. Please use a different name.');
            isSavingMood = false;
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
        
        // Close the modal - use a timeout to ensure UI updates properly
        setTimeout(() => {
            if (elements.customMoodModal) {
                elements.customMoodModal.style.display = 'none';
            }
            
            // Refresh the UI after a short delay
            setTimeout(() => {
                renderCustomMoodsInSelector();
                isSavingMood = false;  // Reset flag after all operations complete
            }, 100);
        }, 100);
        
    } catch (error) {
        console.error('Error saving custom mood:', error);
        alert('Error saving custom mood: ' + error.message);
        isSavingMood = false;
    }
}

function openCreateCustomMoodModal() {
    if (!elements.customMoodModal) {
      console.error('Custom mood modal not found');
      // Try to get it again
      elements.customMoodModal = document.getElementById('custom-mood-modal');
      
      if (!elements.customMoodModal) {
        alert('Could not open the custom mood creator. Please refresh the page and try again.');
        return;
      }
    }
    
    try {
      // Reset form
      if (elements.customMoodForm) elements.customMoodForm.reset();
      if (elements.customMoodId) elements.customMoodId.value = '';
      if (elements.customMoodName) elements.customMoodName.value = '';
      if (elements.customMoodColor) elements.customMoodColor.value = '#4a90e2';
      if (elements.customMoodEmoji) elements.customMoodEmoji.value = '😊';
      if (elements.colorPreview) elements.colorPreview.style.backgroundColor = '#4a90e2';
      
      // Update modal title
      const titleElement = document.getElementById('custom-mood-title');
      if (titleElement) titleElement.textContent = 'Create Custom Mood';
      
      // Hide delete button
      if (elements.deleteCustomMoodBtn) elements.deleteCustomMoodBtn.style.display = 'none';
      
      // Reset emoji selection
      const emojiOptions = document.querySelectorAll('.emoji-option');
      if (emojiOptions) {
        emojiOptions.forEach(emoji => emoji.classList.remove('selected'));
        
        const defaultEmoji = document.querySelector('.emoji-option[data-emoji="😊"]');
        if (defaultEmoji) {
          defaultEmoji.classList.add('selected');
        }
      }
      
      // Reset state
      editingMoodId = null;
      
      // Show modal
      elements.customMoodModal.style.display = 'flex';
    } catch (error) {
      console.error('Error opening custom mood modal:', error);
      alert('There was an error opening the custom mood creator. Please try again.');
    }
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
    
    // Deduplicate moods based on name
    const uniqueMoods = [];
    const usedNames = new Set();
    
    customMoods.forEach(mood => {
      if (!usedNames.has(mood.name.toLowerCase())) {
        usedNames.add(mood.name.toLowerCase());
        uniqueMoods.push(mood);
      } else {
        console.warn(`Duplicate mood found: ${mood.name}. Only showing one instance.`);
      }
    });
    
    // Add each custom mood to the grid
    uniqueMoods.forEach(mood => {
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
    
    // Add "Create New" button if it doesn't exist
    let addButton = elements.customMoodsGrid.querySelector('.add-custom-mood-button');
    if (!addButton) {
      setupAddCustomMoodButton();
    }
    
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