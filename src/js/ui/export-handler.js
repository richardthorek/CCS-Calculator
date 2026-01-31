/**
 * Export Handler Module
 * Handles print, PDF export, and shareable link generation
 */

/**
 * Print the current page
 * Uses native browser print dialog which allows saving as PDF
 */
export function printPage() {
  // Ensure all charts are visible before printing
  const chartsContainer = document.getElementById('charts-container');
  if (chartsContainer && chartsContainer.classList.contains('hidden')) {
    // Temporarily show charts for printing
    const wasHidden = true;
    chartsContainer.classList.remove('hidden');
    
    // Print
    window.print();
    
    // Restore original state after a delay
    setTimeout(() => {
      if (wasHidden) {
        chartsContainer.classList.add('hidden');
      }
    }, 100);
  } else {
    window.print();
  }
}

/**
 * Generate shareable URL with form data encoded in query parameters
 * @param {Object} formData - Form data to encode
 * @returns {string} Shareable URL
 */
export function generateShareableURL(formData) {
  if (!formData) {
    console.warn('No form data provided for shareable URL');
    return window.location.href.split('?')[0];
  }
  
  const params = new URLSearchParams();
  
  // Parent 1 data
  if (formData.parent1) {
    params.set('p1_income', formData.parent1.income || 0);
    params.set('p1_hours', formData.parent1.hours || 0);
    params.set('p1_days', formData.parent1.workDays?.length || 0);
  }
  
  // Parent 2 data
  if (formData.parent2) {
    params.set('p2_income', formData.parent2.income || 0);
    params.set('p2_hours', formData.parent2.hours || 0);
    params.set('p2_days', formData.parent2.workDays?.length || 0);
  }
  
  // Children data (encoded as JSON for simplicity)
  if (formData.children && formData.children.length > 0) {
    const childrenData = formData.children.map(child => ({
      age: child.age,
      careType: child.careType,
      hourlyFee: child.hourlyFee,
      sessionsPerWeek: child.sessionsPerWeek
    }));
    params.set('children', JSON.stringify(childrenData));
  }
  
  // Check URL length (browser limit is ~2000 characters)
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  
  if (url.length > 2000) {
    console.warn('Generated URL is too long. Some browsers may truncate it.');
  }
  
  return url;
}

/**
 * Populate form from URL parameters
 * @returns {Object|null} Decoded form data or null if no params
 */
export function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // Check if there are any relevant parameters
  if (!params.has('p1_income') && !params.has('children')) {
    return null;
  }
  
  const formData = {
    parent1: {},
    parent2: {},
    children: []
  };
  
  // Parent 1
  if (params.has('p1_income')) {
    formData.parent1.income = parseFloat(params.get('p1_income')) || 0;
    formData.parent1.hours = parseFloat(params.get('p1_hours')) || 0;
    formData.parent1.workDays = parseInt(params.get('p1_days')) || 0;
  }
  
  // Parent 2
  if (params.has('p2_income')) {
    formData.parent2.income = parseFloat(params.get('p2_income')) || 0;
    formData.parent2.hours = parseFloat(params.get('p2_hours')) || 0;
    formData.parent2.workDays = parseInt(params.get('p2_days')) || 0;
  }
  
  // Children
  if (params.has('children')) {
    try {
      const childrenData = JSON.parse(params.get('children'));
      formData.children = childrenData;
    } catch (e) {
      console.error('Error parsing children data from URL:', e);
    }
  }
  
  return formData;
}

/**
 * Copy shareable link to clipboard and show feedback
 * @param {string} url - URL to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyShareableLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    
    // Fallback: use textarea method
    try {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackErr) {
      console.error('Fallback copy method also failed:', fallbackErr);
      return false;
    }
  }
}

/**
 * Show temporary notification message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function showNotification(message, type = 'success') {
  // Remove any existing notification
  const existing = document.querySelector('.notification-toast');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Initialize export handlers
 */
export function initializeExportHandlers() {
  // Print button
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printPage();
    });
  }
  
  // Share link button
  const shareLinkBtn = document.getElementById('share-link-btn');
  if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', async () => {
      // Get current form data from a custom event
      const event = new CustomEvent('requestFormData');
      document.dispatchEvent(event);
      
      // Wait for form data to be set
      setTimeout(async () => {
        const formDataElement = document.getElementById('current-form-data');
        if (!formDataElement || !formDataElement.dataset.formData) {
          showNotification('Please calculate results first before sharing', 'error');
          return;
        }
        
        const formData = JSON.parse(formDataElement.dataset.formData);
        const url = generateShareableURL(formData);
        const success = await copyShareableLink(url);
        
        if (success) {
          showNotification('✓ Link copied to clipboard!', 'success');
        } else {
          showNotification('Failed to copy link. Please copy manually.', 'error');
          // Show the URL in a prompt as fallback
          prompt('Copy this link:', url);
        }
      }, 100);
    });
  }
}
