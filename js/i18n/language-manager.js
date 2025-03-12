/**
 * Language Manager for Bond Tree
 * 
 * Handles language selection, storage, and translation functionality
 * for the Bond Tree application.
 */

// Import language data files
import { en } from './en.js';
import { zh_TW } from './zh_TW.js';

// Supported languages
const LANGUAGES = {
  en: {
    name: 'English',
    code: 'en',
    translations: en
  },
  zh_TW: {
    name: '繁體中文',
    code: 'zh_TW',
    translations: zh_TW
  }
};

// Default language
const DEFAULT_LANGUAGE = 'en';

/**
 * Language Manager Class
 */
class LanguageManager {
  constructor() {
    this.currentLanguage = this.getSavedLanguage() || DEFAULT_LANGUAGE;
    this.translations = LANGUAGES[this.currentLanguage].translations;
    this.observers = [];
  }

  /**
   * Get user's saved language preference
   * @returns {string|null} Language code or null if not set
   */
  getSavedLanguage() {
    return localStorage.getItem('bondTree_language');
  }

  /**
   * Save language preference to localStorage
   * @param {string} languageCode - Language code to save
   */
  saveLanguage(languageCode) {
    if (LANGUAGES[languageCode]) {
      localStorage.setItem('bondTree_language', languageCode);
    }
  }

  /**
   * Get current language code
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get list of supported languages
   * @returns {Object} Supported languages
   */
  getLanguages() {
    return LANGUAGES;
  }

  /**
   * Get a translation string by key
   * @param {string} key - Translation key
   * @param {Object} params - Optional parameters to replace in the string
   * @returns {string} Translated string
   */
  translate(key, params = {}) {
    // Get the translated string
    let translatedString = this.getNestedTranslation(this.translations, key);
    
    // If translation not found, try with default language
    if (!translatedString && this.currentLanguage !== DEFAULT_LANGUAGE) {
      translatedString = this.getNestedTranslation(LANGUAGES[DEFAULT_LANGUAGE].translations, key);
    }
    
    // If still not found, return the key itself
    if (!translatedString) {
      return key;
    }
    
    // Replace any parameters in the string
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(param => {
        translatedString = translatedString.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }
    
    return translatedString;
  }

  /**
   * Get a nested translation from an object using dot notation
   * @param {Object} obj - Translation object
   * @param {string} path - Dot-separated path to the translation
   * @returns {string|null} Translation or null if not found
   */
  getNestedTranslation(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Change the current language
   * @param {string} languageCode - Language code to change to
   * @returns {boolean} Success status
   */
  changeLanguage(languageCode) {
    if (!LANGUAGES[languageCode]) {
      console.error(`Language ${languageCode} is not supported`);
      return false;
    }
    
    this.currentLanguage = languageCode;
    this.translations = LANGUAGES[languageCode].translations;
    this.saveLanguage(languageCode);
    
    // Notify all observers about the language change
    this.notifyObservers();
    
    return true;
  }

  /**
   * Add observer for language changes
   * @param {Function} callback - Function to call when language changes
   * @returns {Function} Function to remove the observer
   */
  addObserver(callback) {
    this.observers.push(callback);
    
    // Return function to remove this observer
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all observers about language change
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change observer:', error);
      }
    });
  }

  /**
   * Initialize page translations
   * @param {boolean} translateImages - Whether to also translate image alt attributes
   */
  translatePage(translateImages = true) {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translated = this.translate(key);
      
      if (translated) {
        element.textContent = translated;
      }
    });

    // Translate elements with data-i18n-placeholder attribute (for input placeholders)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translated = this.translate(key);
      
      if (translated) {
        element.setAttribute('placeholder', translated);
      }
    });

    // Translate elements with data-i18n-title attribute (for tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translated = this.translate(key);
      
      if (translated) {
        element.setAttribute('title', translated);
      }
    });

    // Translate image alt texts if requested
    if (translateImages) {
      document.querySelectorAll('img[data-i18n-alt]').forEach(img => {
        const key = img.getAttribute('data-i18n-alt');
        const translated = this.translate(key);
        
        if (translated) {
          img.setAttribute('alt', translated);
        }
      });
    }

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      const translated = this.translate(key);
      
      if (translated) {
        element.setAttribute('aria-label', translated);
      }
    });
  }
}

// Create and export a singleton instance
const languageManager = new LanguageManager();
export default languageManager;