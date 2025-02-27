// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
  
    // Back to dashboard functionality
    backButton.addEventListener('click', () => {
      // Redirect back to the main authentication page
      window.location.href = 'index.html';
    });
  
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
    saveButton.addEventListener('click', () => {
      if (selectedMoods.length > 0) {
        console.log("Saving mood:", selectedMoods);
        
        // Use the AuthManager to save the mood
        if (authManager.saveMood(selectedMoods)) {
          console.log("Mood saved successfully");
          
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
          console.error("Failed to save mood");
        }
      }
    });
  
    // Update the selection info text
    function updateSelectionInfo() {
      if (selectedMoods.length === 0) {
        selectionInfo.textContent = "Select up to 3 emotions";
      } else {
        const moodNames = selectedMoods.map(mood => mood.name).join(", ");
        selectionInfo.textContent = `Selected: ${moodNames}`;
      }
    }
  
    // Update the mood ball display
    function updateMoodBall() {
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
          
          moodBall.appendChild(section);
        });
      }
    }
  
    // Update saved moods display
    function updateSavedMoods() {
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
      
      savedMoods.forEach(saved => {
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
        
        const dateElement = document.createElement('div');
        dateElement.className = 'date';
        dateElement.textContent = saved.date;
        
        savedMoodElement.appendChild(savedBall);
        savedMoodElement.appendChild(dateElement);
        
        savedMoodsContainer.appendChild(savedMoodElement);
      });
    }
  
    // Initialize the page
    updateMoodBall();
    updateSelectionInfo();
    updateSavedMoods();
  });