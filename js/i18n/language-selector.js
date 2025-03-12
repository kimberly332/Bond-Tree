/**
 * Language Selector Component for Bond Tree
 * 
 * Creates and manages a language selection dropdown that can be inserted
 * into any page of the application.
 */

import languageManager from './language-manager.js';

/**
 * Initialize the language selector
 * @param {string} containerId - ID of the container element to append the selector to
 * @param {Object} options - Configuration options
 */
export function initLanguageSelector(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Language selector container #${containerId} not found`);
    return;
  }
  
  const defaultOptions = {
    buttonClass: 'language-selector-btn',
    dropdownClass: 'language-dropdown',
    activeClass: 'active',
    languages: Object.keys(languageManager.getLanguages()),
    position: 'fixed',  // 'fixed' or 'relative'
    top: '10px',
    right: '10px',
    showText: true,
    showIcon: true
  };
  
  const settings = { ...defaultOptions, ...options };
  
  // Create language selector container
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'language-selector-container';
  selectorContainer.style.position = settings.position;
  
  if (settings.position === 'fixed') {
    selectorContainer.style.top = settings.top;
    selectorContainer.style.right = settings.right;
    selectorContainer.style.zIndex = '1000';
  }
  
  // Create button
  const button = document.createElement('button');
  button.className = settings.buttonClass;
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  
  // Add icon if requested
  if (settings.showIcon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'language-icon';
    iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>';
    button.appendChild(iconSpan);
  }
  
  // Add text if requested
  if (settings.showText) {
    const textSpan = document.createElement('span');
    textSpan.className = 'language-text';
    textSpan.setAttribute('data-i18n', 'language.languageSelection');
    textSpan.textContent = languageManager.translate('language.languageSelection');
    button.appendChild(textSpan);
  }
  
  // Create dropdown
  const dropdown = document.createElement('ul');
  dropdown.className = settings.dropdownClass;
  dropdown.setAttribute('role', 'menu');
  dropdown.style.display = 'none';
  
  // Add language options
  const languages = languageManager.getLanguages();
  const currentLang = languageManager.getCurrentLanguage();
  
  settings.languages.forEach(langCode => {
    const language = languages[langCode];
    if (!language) return;
    
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'menuitem');
    
    const langButton = document.createElement('button');
    langButton.className = 'language-option';
    langButton.dataset.lang = langCode;
    if (langCode === currentLang) {
      langButton.classList.add(settings.activeClass);
    }
    
    // Create language name element
    const langName = document.createElement('span');
    langName.textContent = language.name;
    langButton.appendChild(langName);
    
    // Add click handler
    langButton.addEventListener('click', () => {
      // Change language
      languageManager.changeLanguage(langCode);
      
      // Update active state
      dropdown.querySelectorAll('.language-option').forEach(btn => {
        btn.classList.remove(settings.activeClass);
      });
      langButton.classList.add(settings.activeClass);
      
      // Close dropdown
      dropdown.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    });
    
    listItem.appendChild(langButton);
    dropdown.appendChild(listItem);
  });
  
  // Toggle dropdown on button click
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', (!isExpanded).toString());
    dropdown.style.display = isExpanded ? 'none' : 'block';
    
    // Close dropdown when clicking outside
    if (!isExpanded) {
      const closeDropdown = (e) => {
        if (!selectorContainer.contains(e.target)) {
          dropdown.style.display = 'none';
          button.setAttribute('aria-expanded', 'false');
          document.removeEventListener('click', closeDropdown);
        }
      };
      
      // Use setTimeout to avoid immediate trigger
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 0);
    }
  });
  
  // Assemble the selector
  selectorContainer.appendChild(button);
  selectorContainer.appendChild(dropdown);
  container.appendChild(selectorContainer);
  
  // Watch for language changes
  languageManager.addObserver(() => {
    if (settings.showText) {
      const textSpan = button.querySelector('.language-text');
      if (textSpan) {
        textSpan.textContent = languageManager.translate('language.languageSelection');
      }
    }
  });
  
  return selectorContainer;
}