/**
 * Translations Initializer for Bond Tree
 * 
 * This file initializes translations on page load and provides
 * utility functions for working with translations.
 */

import languageManager from './language-manager.js';
import { initLanguageSelector } from './language-selector.js';

/**
 * Initialize translations for the current page
 * @param {Object} options - Options for initialization
 */
export function initTranslations(options = {}) {
  const defaultOptions = {
    translatePage: true,
    translateImages: true,
    addLanguageSelector: true,
    selectorContainerId: 'header',
    selectorOptions: {}
  };
  
  const settings = { ...defaultOptions, ...options };
  
  // Add data-i18n attributes based on text content if missing
  if (settings.addMissingAttributes) {
    addMissingTranslationAttributes();
  }
  
  // Translate the page
  if (settings.translatePage) {
    languageManager.translatePage(settings.translateImages);
  }
  
  // Add language selector
  if (settings.addLanguageSelector) {
    try {
      initLanguageSelector(settings.selectorContainerId, settings.selectorOptions);
    } catch (error) {
      console.error('Error initializing language selector:', error);
    }
  }
  
  // Add observer for language changes to auto-translate the page
  languageManager.addObserver(() => {
    if (settings.translatePage) {
      languageManager.translatePage(settings.translateImages);
    }
  });
  
  return languageManager;
}

/**
 * Create a translation helper to allow inline access to translations
 * @returns {Function} Translation function
 */
export function createTranslator() {
  return (key, params = {}) => languageManager.translate(key, params);
}

/**
 * Add data-i18n attributes to elements based on text content
 * This helps automate the initial migration to i18n
 */
function addMissingTranslationAttributes() {
  // This is used during initial setup to automate adding data-i18n attributes
  // For heading and paragraph elements
  document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, label, button, a').forEach(element => {
    // Skip if already has translation attribute
    if (element.hasAttribute('data-i18n')) return;
    
    // Skip if empty or contains only HTML
    const text = element.textContent.trim();
    if (!text || element.children.length > 0) return;
    
    // Generate a key based on element type and text
    // This is just a helper for development - actual keys should be organized in the translation files
    const type = element.tagName.toLowerCase();
    const key = `auto.${type}.${text.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}`;
    
    // Add the attribute
    element.setAttribute('data-i18n', key);
    
    console.log(`Added data-i18n attribute to element: ${key}`);
  });
}

/**
 * Export directly usable translator
 */
export const t = createTranslator();

// Auto-initialize if this script is included with a specific parameter
if (document.currentScript?.getAttribute('data-auto-init') === 'true') {
  document.addEventListener('DOMContentLoaded', () => {
    initTranslations();
  });
}