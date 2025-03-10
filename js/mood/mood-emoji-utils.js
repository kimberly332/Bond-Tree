/**
 * Mood Emoji Utilities for Bond Tree
 * 
 * This file contains shared utility functions for handling mood emojis
 * across the Bond Tree application.
 */

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
  
  /**
   * Get emoji for a mood (standard or custom)
   * @param {string} moodName - The name of the mood
   * @param {Array} customMoods - Optional array of custom moods
   * @returns {string} The emoji for the mood
   */
// In mood-emoji-utils.js
export function getMoodEmoji(moodName, customMoods = []) {
    // Check if it's a custom mood
    if (customMoods && customMoods.length > 0) {
      const customMood = customMoods.find(mood => mood.name === moodName);
      if (customMood) {
        return customMood.emoji;
      }
    }
    
    // Return from standard mood emoji mapping
    return STANDARD_MOOD_EMOJIS[moodName] || '😐';
  }
  
  // Export the emoji mapping as well
  export { STANDARD_MOOD_EMOJIS };