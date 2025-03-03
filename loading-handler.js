// loading-handler.js - All loading functionality combined in one external file

// Failsafe for loading issues
window.addEventListener('load', function() {
    setTimeout(function() {
      var loadingContainer = document.getElementById('loading-container');
      var authContainer = document.querySelector('.auth-container');
      
      if (loadingContainer && loadingContainer.style.display !== 'none') {
        console.log("Window load timeout - forcing display of auth container");
        loadingContainer.style.display = 'none';
        if (authContainer) {
          authContainer.style.display = 'block';
        }
      }
    }, 5000); // 5 seconds timeout after window load
  });
  
  // Show retry button after 10 seconds
  setTimeout(function() {
    var retryButton = document.getElementById('retry-button');
    var loadingMessage = document.getElementById('loading-message');
    
    if (retryButton && retryButton.style.display === 'none') {
      retryButton.style.display = 'inline-block';
      if (loadingMessage) {
        loadingMessage.textContent = 'Taking longer than expected...';
      }
    }
  }, 10000);
  
  // Add retry functionality
  document.addEventListener('DOMContentLoaded', function() {
    var retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', function() {
        location.reload();
      });
    }
  
    // Additional helper to force-display auth container if loading takes too long
    setTimeout(function() {
      var loadingContainer = document.getElementById('loading-container');
      var authContainer = document.querySelector('.auth-container');
      
      if (loadingContainer && loadingContainer.style.display !== 'none') {
        console.log("DOMContentLoaded timeout - forcing display of auth container");
        loadingContainer.style.display = 'none';
        if (authContainer) {
          authContainer.style.display = 'block';
        }
      }
    }, 8000);
  });
  
  // Check for Firebase auth state periodically as a final backup
  let checkCount = 0;
  const maxChecks = 5;
  
  function checkAuthState() {
    if (checkCount >= maxChecks) return;
    
    checkCount++;
    
    setTimeout(function() {
      var loadingContainer = document.getElementById('loading-container');
      var authContainer = document.querySelector('.auth-container');
      
      if (loadingContainer && loadingContainer.style.display !== 'none') {
        console.log("Auth check timeout #" + checkCount + " - forcing display of auth container");
        loadingContainer.style.display = 'none';
        if (authContainer) {
          authContainer.style.display = 'block';
        }
      } else {
        // Stop checking if loading container is already hidden
        return;
      }
      
      // Continue checking if not yet at max
      if (checkCount < maxChecks) {
        checkAuthState();
      }
    }, 3000); // Check every 3 seconds
  }
  
  // Start auth state checks after a delay
  setTimeout(checkAuthState, 5000);