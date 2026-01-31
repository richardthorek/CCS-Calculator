/**
 * Debounce Utility Module
 * Provides debouncing functionality for performance optimization
 * Pure vanilla JavaScript implementation
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 300ms)
 * @param {boolean} immediate - If true, trigger function on leading edge instead of trailing
 * @returns {Function} The debounced function
 * 
 * @example
 * const debouncedCalculate = debounce(() => calculate(), 300);
 * input.addEventListener('input', debouncedCalculate);
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified time period
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The minimum time between function invocations in milliseconds
 * @returns {Function} The throttled function
 * 
 * @example
 * const throttledUpdate = throttle(() => updateUI(), 100);
 * window.addEventListener('scroll', throttledUpdate);
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
