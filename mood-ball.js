// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - initializing mood-ball.js");
    
    // Initialize the AuthManager to ensure data is loaded from storage
    const authManager = new window.AuthManager();
    
    // Check authentication immediately
    const loginWarning = document.getElementById('login-warning');
    const mainContent = document.querySelector('.container');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const backButton = document.getElementById('back-to-dashboard');
  
    // Ensure the current user is available
    if (!window.currentUser) {
      console.log("No user logged in, showing warning");
      loginWarning.style.display = 'block';
      mainContent.style.display = 'none';
      header.style.display = 'none';
      footer.style.display = 'none';
      backButton.style.display = 'none';
      return; // Exit early
    } else {
      console.log("User logged in:", window.currentUser.name);
      loginWarning.style.display = 'none';
      mainContent.style.display = 'block';
      header.style.display = 'block';
      footer.style.display = 'block';
      backButton.style.display = 'block';
    }
  
    // Selected moods array
    let selectedMoods = [];
    let savedMoods = window.currentUser.savedMoods || [];
  
    // DOM elements
    const moodBall = document.getElementById('current-mood-ball');
    const colorOptions = document.querySelectorAll('.color-option');
    const saveButton = document.getElementById('save-button');
    const savedMoodsContainer = document.getElementById('saved-moods-container');
    const selectionInfo = document.getElementById('selection-info');
    const moodNotes = document.getElementById('mood-notes');
    const charsCount = document.getElementById('chars-count');

    // Map mood names to corresponding emojis
    const moodEmojis = {
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
  
    console.log("DOM elements initialized:", {
      moodBall: !!moodBall,
      colorOptions: colorOptions.length,
      saveButton: !!saveButton,
      savedMoodsContainer: !!savedMoodsContainer,
      selectionInfo: !!selectionInfo,
      moodNotes: !!moodNotes,
      charsCount: !!charsCount
    });
  
    // Character counter for mood notes
    if (moodNotes && charsCount) {
      moodNotes.addEventListener('input', () => {
        const count = moodNotes.value.length;
        charsCount.textContent = count;
        
        // Add visual feedback for character limit
        if (count > 180) {
          charsCount.style.color = '#e67e22'; // Orange when approaching limit
        } else if (count > 195) {
          charsCount.style.color = '#e74c3c'; // Red when very close to limit
        } else {
          charsCount.style.color = '#999'; // Default color
        }
      });
    }
  
    // Back to dashboard functionality
    if (backButton) {
      backButton.addEventListener('click', () => {
        // Redirect back to the main authentication page
        window.location.href = 'index.html';
      });
    }
  
    // Add event listeners to color options
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        const color = option.getAttribute('data-color');
        const name = option.getAttribute('data-name');
        
        // Check if already selected
        const existingIndex = selectedMoods.findIndex(mood => mood.name === name);
        
        if (existingIndex >= 0) {
          // Remove if already selected
          selectedMoods.splice(existingIndex, 1);
          option.classList.remove('selected');
        } else {
          // Add if not selected (max 3)
          if (selectedMoods.length < 3) {
            selectedMoods.push({ color, name });
            option.classList.add('selected');
          } else {
            // Replace the first one if already have 3
            const oldOption = Array.from(colorOptions).find(opt => 
              opt.getAttribute('data-name') === selectedMoods[0].name
            );
            if (oldOption) {
              oldOption.classList.remove('selected');
            }
            
            selectedMoods.shift();
            selectedMoods.push({ color, name });
            option.classList.add('selected');
          }
        }
        
        updateMoodBall();
        updateSelectionInfo();
      });
    });
  
    // Save button click handler
    if (saveButton) {
      saveButton.addEventListener('click', function() {
        console.log("Save button clicked. Selected moods:", selectedMoods);
        
        if (selectedMoods.length > 0) {
          try {
            // Get notes from the textarea if it exists
            const notes = moodNotes ? moodNotes.value : '';
            
            console.log("Attempting to save mood with notes:", notes);
            
            // Use the old method signature if the new one fails
            let saveResult = false;
            
            try {
              // Try with notes parameter
              saveResult = authManager.saveMood(selectedMoods, notes);
            } catch (e) {
              console.error("Error saving with notes parameter:", e);
              // Fall back to original method
              saveResult = authManager.saveMood(selectedMoods);
            }
            
            if (saveResult) {
              console.log("Mood saved successfully");
              
              // Clear the notes field after saving
              if (moodNotes) {
                moodNotes.value = '';
                if (charsCount) charsCount.textContent = '0';
              }
              
              // Update saved moods display
              updateSavedMoods();
              
              // Show saved confirmation
              saveButton.textContent = "Saved!";
              saveButton.disabled = true;
              
              setTimeout(() => {
                saveButton.textContent = "Save Today's Mood";
                saveButton.disabled = false;
              }, 1500);
            } else {
              console.error("Failed to save mood - authManager returned false");
              alert("Sorry, there was a problem saving your mood. Please try again.");
            }
          } catch (error) {
            console.error("Error in save button handler:", error);
            alert("Sorry, something went wrong. Please try again or refresh the page.");
          }
        } else {
          // Remind user to select at least one mood
          alert("Please select at least one mood before saving.");
        }
      });
    }
  
    // Update the selection info text
    function updateSelectionInfo() {
      if (!selectionInfo) return;
      
      if (selectedMoods.length === 0) {
        selectionInfo.textContent = "Select up to 3 emotions";
      } else {
        const moodNames = selectedMoods.map(mood => mood.name).join(", ");
        selectionInfo.textContent = `Selected: ${moodNames}`;
      }
    }
  
    
// Update the mood ball display
function updateMoodBall() {
    if (!moodBall) return;
    
    // Clear existing content
    moodBall.innerHTML = '';
    
    if (selectedMoods.length === 0) {
      // Empty state
      moodBall.style.backgroundColor = '#FFFFFF';
    } else {
      // Create sections for each mood
      const sectionHeight = 100 / selectedMoods.length;
      
      selectedMoods.forEach((mood, index) => {
        const section = document.createElement('div');
        section.className = 'mood-section';
        section.style.backgroundColor = mood.color;
        section.style.top = `${index * sectionHeight}%`;
        section.style.height = `${sectionHeight}%`;
        
        // Add corresponding emoji
        const emoji = document.createElement('div');
        emoji.className = 'mood-emoji';
        emoji.textContent = moodEmojis[mood.name] || ''; // Use empty string if emoji not found
        section.appendChild(emoji);
        
        moodBall.appendChild(section);
      });
      }
    }
  
    // Show note modal
    function showNoteModal(moodData) {
      try {
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'note-modal-content';
        
        const header = document.createElement('div');
        header.className = 'note-header';
        
        const date = document.createElement('div');
        date.className = 'note-date';
        date.textContent = `${moodData.date} at ${moodData.time || ''}`;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'note-close';
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
      } catch (e) {
        console.error("Error showing note modal:", e);
        alert(`Note from ${moodData.date}: ${moodData.notes}`);
      }
    }
  
    // Update saved moods display
    function updateSavedMoods() {
      if (!savedMoodsContainer) return;
      
      try {
        // Get the latest saved moods from the auth manager
        savedMoods = authManager.getSavedMoods();
        console.log("Saved moods:", savedMoods);
        
        savedMoodsContainer.innerHTML = '';
        
        if (!savedMoods || savedMoods.length === 0) {
          const emptyMessage = document.createElement('p');
          emptyMessage.textContent = "No saved moods yet. Save your first mood!";
          emptyMessage.style.textAlign = "center";
          emptyMessage.style.color = "#666";
          emptyMessage.style.padding = "20px 0";
          savedMoodsContainer.appendChild(emptyMessage);
          return;
        }
        
        // Sort moods by timestamp if available, otherwise keep original order
        const sortedMoods = [...savedMoods].sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp; // Newest first
          }
          return 0; // Keep original order if no timestamp
        });
        
        sortedMoods.forEach(saved => {
          const savedMoodElement = document.createElement('div');
          savedMoodElement.className = 'saved-mood';
          
          const savedBall = document.createElement('div');
          savedBall.className = 'saved-mood-ball';
          
          // Create sections for the saved mood
          const sectionHeight = 100 / saved.moods.length;
          
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
            dateContainer.appendChild(timeElement);
          }
          
          savedMoodElement.appendChild(savedBall);
          savedMoodElement.appendChild(dateContainer);
          
          // Add note preview if there are notes
          if (saved.notes) {
            const notePreview = document.createElement('div');
            notePreview.className = 'saved-mood-details';
            
            const noteText = document.createElement('div');
            noteText.className = 'mood-note-preview';
            noteText.innerHTML = '<span class="mood-note-icon">📝</span>' + 
                                (saved.notes.length > 20 ? 
                                 saved.notes.substring(0, 20) + '...' : 
                                 saved.notes);
            
            // Add click handler to show the full note
            noteText.addEventListener('click', () => {
              showNoteModal(saved);
            });
            
            notePreview.appendChild(noteText);
            savedMoodElement.appendChild(notePreview);
          }
          
          savedMoodsContainer.appendChild(savedMoodElement);
        });
      } catch (error) {
        console.error("Error updating saved moods:", error);
        savedMoodsContainer.innerHTML = '<p style="color: red; text-align: center;">Error loading saved moods. Please refresh the page.</p>';
      }
    }
  
    // Initialize the page
    updateMoodBall();
    updateSelectionInfo();
    updateSavedMoods();
  });