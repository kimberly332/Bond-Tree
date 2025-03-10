/**
 * Bond Tree - Dashboard Button Handlers
 * 
 * This file adds event handlers for dashboard buttons,
 * including the new journal feature button
 */

document.addEventListener('DOMContentLoaded', function() {
    // Journal Button
    const journalBtn = document.getElementById('journal-btn');
    if (journalBtn) {
      journalBtn.addEventListener('click', function() {
        window.location.href = 'posts.html';
      });
    }
    
    // You can add handlers for other dashboard buttons here
  });