/**
 * Format Input Module
 * Formats numeric input fields with thousand separators while keeping raw value available
 */

/**
 * Format a number string with commas as thousand separators
 * @param {string} value - The raw numeric value (may already be formatted)
 * @returns {string} Formatted value
 */
export function formatWithCommas(value) {
  // Remove all non-digit characters (including existing commas)
  const raw = String(value).replace(/\D/g, '');
  if (!raw) return '';
  return new Intl.NumberFormat('en-AU', { useGrouping: true }).format(Number(raw));
}

/**
 * Remove thousand separators to get raw numeric value
 * @param {string} value - Formatted value (e.g., "250,000")
 * @returns {string} Raw digits (e.g., "250000")
 */
export function stripCommas(value) {
  return String(value).replace(/,/g, '');
}

/**
 * Setup an input element to format its value with thousand separators
 * as the user types, while preserving caret position.
 * @param {HTMLInputElement} input - The input element
 */
export function setupFormattedInput(input) {
  if (!input) return;

  // Convert existing value on load
  if (input.value) {
    input.value = formatWithCommas(input.value);
  }

  input.addEventListener('input', (e) => {
    const target = e.target;
    const rawVal = stripCommas(target.value);

    // If the field is cleared, leave empty
    if (!rawVal) {
      target.value = '';
      return;
    }

    const formatted = formatWithCommas(rawVal);

    // Calculate how far the cursor was from the end before formatting
    const oldLen = target.value.length;
    const posFromEnd = oldLen - (target.selectionEnd || 0);

    target.value = formatted;

    // Position the caret relative to the end (accounting for added/removed commas)
    const newPos = Math.max(0, formatted.length - posFromEnd);
    target.setSelectionRange(newPos, newPos);
  });
}

/**
 * Initialize formatted inputs for all income fields
 */
export function initFormattedIncomeInputs() {
  const incomeInputs = [
    document.getElementById('parent1-income'),
    document.getElementById('parent2-income')
  ];

  incomeInputs.forEach((input) => {
    if (input) {
      // Convert native number inputs to text so we can show commas
      input.type = 'text';
      input.inputMode = 'numeric';
      input.pattern = '[0-9,]*';
      setupFormattedInput(input);
    }
  });
}
