/**
 * Custom Mood Manager
 * 
 * This module handles creating, storing, editing, and deleting custom moods
 * for the Bond Tree mood tracking system.
 */

class CustomMoodManager {
    constructor() {
      this.customMoods = [];
      this.loadFromLocalStorage();
    }
  
    /**
     * Load custom moods from localStorage
     */
    loadFromLocalStorage() {
      try {
        const storedMoods = localStorage.getItem('bondTree_customMoods');
        if (storedMoods) {
          this.customMoods = JSON.parse(storedMoods);
          console.log('Loaded custom moods:', this.customMoods);
        }
      } catch (error) {
        console.error('Error loading custom moods from localStorage:', error);
        this.customMoods = [];
      }
    }
  
    /**
     * Save custom moods to localStorage
     */
    saveToLocalStorage() {
      try {
        localStorage.setItem('bondTree_customMoods', JSON.stringify(this.customMoods));
      } catch (error) {
        console.error('Error saving custom moods to localStorage:', error);
      }
    }
  
    /**
     * Get all custom moods
     * @returns {Array} Array of custom mood objects
     */
    getAllCustomMoods() {
      return this.customMoods;
    }
  
    /**
     * Add a new custom mood
     * @param {Object} mood - The mood object with name, color, emoji
     * @returns {Object} The created mood with ID
     */
    addCustomMood(mood) {
      // Validate mood data
      if (!mood.name || !mood.color) {
        throw new Error('Mood must have a name and color');
      }
  
      // Create mood with unique ID
      const newMood = {
        id: Date.now().toString(),
        name: mood.name,
        color: mood.color,
        emoji: mood.emoji || '😊',
        createdAt: new Date().toISOString()
      };
  
      this.customMoods.push(newMood);
      this.saveToLocalStorage();
      return newMood;
    }
  
    /**
     * Update an existing custom mood
     * @param {string} id - The ID of the mood to update
     * @param {Object} updatedData - The updated mood data
     * @returns {Object|null} The updated mood or null if not found
     */
    updateCustomMood(id, updatedData) {
      const moodIndex = this.customMoods.findIndex(mood => mood.id === id);
      
      if (moodIndex === -1) {
        return null;
      }
  
      // Update only the provided fields
      this.customMoods[moodIndex] = {
        ...this.customMoods[moodIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
  
      this.saveToLocalStorage();
      return this.customMoods[moodIndex];
    }
  
    /**
     * Delete a custom mood
     * @param {string} id - The ID of the mood to delete
     * @returns {boolean} Success status
     */
    deleteCustomMood(id) {
      const initialLength = this.customMoods.length;
      this.customMoods = this.customMoods.filter(mood => mood.id !== id);
      
      const deleted = initialLength > this.customMoods.length;
      
      if (deleted) {
        this.saveToLocalStorage();
      }
      
      return deleted;
    }
  
    /**
     * Find a custom mood by ID
     * @param {string} id - The ID of the mood to find
     * @returns {Object|null} The mood or null if not found
     */
    findMoodById(id) {
      return this.customMoods.find(mood => mood.id === id) || null;
    }
  }
  
  // Export as default
  export default CustomMoodManager;