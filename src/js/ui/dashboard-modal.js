/**
 * Dashboard Modal
 *
 * Manages the "My Scenarios" modal overlay within the main SPA (index.html).
 * Handles listing, opening, renaming, and deleting user scenarios
 * without leaving the calculator page.
 *
 * This module mirrors the functionality of dashboard-manager.js but is
 * designed to operate as an in-page overlay rather than a standalone page.
 */

import { storageManager } from '../storage/storage-manager.js';

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {string|null} ID of the scenario pending rename/new inside the dashboard modal */
let _pendingRenameId = null;
/** @type {string|null} ID of the scenario pending deletion */
let _pendingDeleteId = null;
/** @type {boolean} Whether the inner rename modal is being used for a new scenario */
let _isNewScenarioMode = false;
/** @type {HTMLElement|null} Element to return focus to when the dashboard modal closes */
let _returnFocusTarget = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Open the "My Scenarios" dashboard modal and load scenarios.
 * Initialises the storage manager if needed.
 * @param {HTMLElement} [returnFocus] - Element to restore focus to when closed
 */
export async function openDashboardModal(returnFocus) {
  const modal = document.getElementById('dashboard-modal');
  if (!modal) {
    console.error('[DashboardModal] #dashboard-modal element not found. Ensure it is present in the DOM.');
    return;
  }

  _returnFocusTarget = returnFocus || document.activeElement;

  // Ensure storage manager is ready before trying to list scenarios
  if (!storageManager.cloudStorageAvailable) {
    console.log('[DashboardModal] Storage manager not yet initialised — calling initialize().');
    await storageManager.initialize();
  }

  modal.hidden = false;
  document.body.style.overflow = 'hidden'; // Prevent background scroll

  // Focus first interactive element in the modal
  const firstFocusable = modal.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) firstFocusable.focus();

  await loadAndRenderScenarios();
}

/**
 * Close the "My Scenarios" dashboard modal and restore focus.
 */
export function closeDashboardModal() {
  const modal = document.getElementById('dashboard-modal');
  if (modal) modal.hidden = true;
  document.body.style.overflow = '';

  if (_returnFocusTarget && typeof _returnFocusTarget.focus === 'function') {
    _returnFocusTarget.focus();
  }
}

/**
 * Wire all event handlers for the dashboard modal and its child modals.
 * Should be called once after DOMContentLoaded.
 */
export function wireDashboardModalHandlers() {
  // ── Dashboard modal ───────────────────────────────────────────────────────

  // Close button
  document.getElementById('dm-modal-close')?.addEventListener('click', closeDashboardModal);

  // Overlay backdrop click to close
  document.getElementById('dashboard-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDashboardModal();
  });

  // Retry button in error state
  document.getElementById('dm-retry-btn')?.addEventListener('click', async () => {
    await loadAndRenderScenarios();
  });

  // New Scenario button inside the dashboard modal
  document.getElementById('dm-new-scenario-btn')?.addEventListener('click', () => {
    openDmNewScenarioModal();
  });

  // ── Inner Rename modal ────────────────────────────────────────────────────

  document.getElementById('dm-rename-cancel-btn')?.addEventListener('click', closeDmRenameModal);
  document.getElementById('dm-rename-confirm-btn')?.addEventListener('click', confirmDmRename);
  document.getElementById('dm-rename-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmDmRename();
    if (e.key === 'Escape') closeDmRenameModal();
  });
  document.getElementById('dm-rename-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDmRenameModal();
  });

  // ── Inner Delete modal ────────────────────────────────────────────────────

  document.getElementById('dm-delete-cancel-btn')?.addEventListener('click', closeDmDeleteModal);
  document.getElementById('dm-delete-confirm-btn')?.addEventListener('click', confirmDmDelete);
  document.getElementById('dm-delete-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDmDeleteModal();
  });

  // ── Escape key: close innermost visible modal first ───────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const renameModal = document.getElementById('dm-rename-modal');
    if (renameModal && !renameModal.hidden) {
      closeDmRenameModal();
      return;
    }

    const deleteModal = document.getElementById('dm-delete-modal');
    if (deleteModal && !deleteModal.hidden) {
      closeDmDeleteModal();
      return;
    }

    const dashboardModal = document.getElementById('dashboard-modal');
    if (dashboardModal && !dashboardModal.hidden) {
      closeDashboardModal();
    }
  });
}

// ─── Scenarios list ───────────────────────────────────────────────────────────

async function loadAndRenderScenarios() {
  const loadingEl = document.getElementById('dm-scenarios-loading');
  const errorEl = document.getElementById('dm-scenarios-error');
  const emptyEl = document.getElementById('dm-scenarios-empty');
  const listEl = document.getElementById('dm-scenarios-list');

  if (loadingEl) loadingEl.hidden = false;
  if (errorEl) errorEl.hidden = true;
  if (emptyEl) emptyEl.hidden = true;
  if (listEl) { listEl.hidden = true; listEl.innerHTML = ''; }

  if (!storageManager.cloudStorageAvailable) {
    console.warn('[DashboardModal] Cloud storage not available — user may not be authenticated.');
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      const msgEl = errorEl.querySelector('.dm-error-message');
      if (msgEl) msgEl.textContent = 'Could not load scenarios. Please sign in and try again.';
    }
    return;
  }

  let scenarios = [];
  let loadError = false;
  try {
    scenarios = await storageManager.listScenarios();
    if (!scenarios) {
      console.error('[DashboardModal] listScenarios() returned null/undefined.');
      loadError = true;
      scenarios = [];
    }
  } catch (err) {
    console.error('[DashboardModal] Failed to load scenarios:', err);
    loadError = true;
    scenarios = [];
  }

  if (loadingEl) loadingEl.hidden = true;

  if (loadError) {
    if (errorEl) errorEl.hidden = false;
    return;
  }

  if (!scenarios.length) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (listEl) {
    listEl.hidden = false;
    scenarios.sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
    scenarios.forEach(scenario => {
      listEl.appendChild(buildScenarioCard(scenario));
    });
  }
}

// ─── Scenario card ────────────────────────────────────────────────────────────

/**
 * Build a scenario card element for the dashboard modal.
 * @param {object} scenario - Scenario summary from the API
 * @returns {HTMLElement}
 */
function buildScenarioCard(scenario) {
  const card = document.createElement('article');
  card.className = `scenario-card${scenario.isActive ? ' scenario-card--active' : ''}`;
  card.setAttribute('role', 'listitem');
  card.dataset.scenarioId = scenario.id;

  const updatedLabel = formatRelativeTime(scenario.updatedAt || scenario.createdAt);
  const ki = scenario.keyInputs || {};

  card.innerHTML = `
    <div class="scenario-card-header">
      <h3 class="scenario-card-name">${escapeHtml(scenario.name || 'Unnamed Scenario')}</h3>
      ${scenario.isActive ? '<span class="scenario-active-badge" aria-label="Currently active">Active</span>' : ''}
    </div>
    <div class="scenario-card-meta">
      <span class="scenario-card-updated">Updated ${updatedLabel}</span>
    </div>
    <div class="scenario-card-details">
      ${buildKeyInputsHtml(ki)}
    </div>
    <div class="scenario-card-footer">
      <a href="/?scenarioId=${encodeURIComponent(scenario.id)}"
         class="btn-scenario-open"
         aria-label="Open scenario ${escapeHtml(scenario.name || '')}">
        Open
      </a>
      <button type="button" class="btn-scenario-rename" aria-label="Rename scenario ${escapeHtml(scenario.name || '')}">
        ✏️ Rename
      </button>
      <button type="button" class="btn-scenario-delete" aria-label="Delete scenario ${escapeHtml(scenario.name || '')}">
        🗑️ Delete
      </button>
    </div>
  `;

  card.querySelector('.btn-scenario-rename').addEventListener('click', () => {
    openDmRenameModal(scenario.id, scenario.name || '');
  });

  card.querySelector('.btn-scenario-delete').addEventListener('click', () => {
    openDmDeleteModal(scenario.id, scenario.name || 'this scenario');
  });

  return card;
}

/**
 * Build the key-inputs summary HTML for a scenario card.
 * @param {object} ki - keyInputs object
 * @returns {string} HTML string
 */
function buildKeyInputsHtml(ki) {
  const rows = [];

  if (ki.parent1Income != null && ki.parent1Income > 0) {
    rows.push(`<div class="scenario-detail-row">
      <span class="scenario-detail-label">Parent 1 income</span>
      <span class="scenario-detail-value">${formatCurrency(ki.parent1Income)}/yr</span>
    </div>`);
  }
  if (ki.parent2Income != null && ki.parent2Income > 0) {
    rows.push(`<div class="scenario-detail-row">
      <span class="scenario-detail-label">Parent 2 income</span>
      <span class="scenario-detail-value">${formatCurrency(ki.parent2Income)}/yr</span>
    </div>`);
  }
  if (ki.childrenCount != null && ki.childrenCount > 0) {
    rows.push(`<div class="scenario-detail-row">
      <span class="scenario-detail-label">Children</span>
      <span class="scenario-detail-value">${ki.childrenCount}</span>
    </div>`);
  }
  if (ki.workDaysCount != null && ki.workDaysCount > 0) {
    rows.push(`<div class="scenario-detail-row">
      <span class="scenario-detail-label">Work days / week</span>
      <span class="scenario-detail-value">${ki.workDaysCount}</span>
    </div>`);
  }
  if (ki.weeklyOutOfPocket != null) {
    rows.push(`<div class="scenario-detail-row scenario-detail-headline">
      <span class="scenario-detail-label">Weekly out-of-pocket</span>
      <span class="scenario-detail-value scenario-detail-headline-value">${formatCurrency(ki.weeklyOutOfPocket)}</span>
    </div>`);
  }

  if (rows.length === 0) {
    return '<p class="scenario-detail-empty">No details saved yet. Open this scenario to add inputs.</p>';
  }
  return rows.join('');
}

// ─── Inner rename modal ────────────────────────────────────────────────────────

function openDmNewScenarioModal() {
  _isNewScenarioMode = true;
  _pendingRenameId = null;
  const modal = document.getElementById('dm-rename-modal');
  const titleEl = document.getElementById('dm-rename-modal-title');
  const input = document.getElementById('dm-rename-input');
  const confirmBtn = document.getElementById('dm-rename-confirm-btn');
  const errorEl = document.getElementById('dm-rename-error');
  if (!modal || !input) return;

  if (titleEl) titleEl.textContent = 'New Scenario';
  if (confirmBtn) confirmBtn.textContent = 'Create';
  input.value = 'New Scenario';
  if (errorEl) errorEl.hidden = true;
  modal.hidden = false;
  input.focus();
  input.select();
}

function openDmRenameModal(scenarioId, currentName) {
  _isNewScenarioMode = false;
  _pendingRenameId = scenarioId;
  const modal = document.getElementById('dm-rename-modal');
  const titleEl = document.getElementById('dm-rename-modal-title');
  const input = document.getElementById('dm-rename-input');
  const confirmBtn = document.getElementById('dm-rename-confirm-btn');
  const errorEl = document.getElementById('dm-rename-error');
  if (!modal || !input) return;

  if (titleEl) titleEl.textContent = 'Rename Scenario';
  if (confirmBtn) confirmBtn.textContent = 'Rename';
  input.value = currentName;
  if (errorEl) errorEl.hidden = true;
  modal.hidden = false;
  input.focus();
  input.select();
}

function closeDmRenameModal() {
  const modal = document.getElementById('dm-rename-modal');
  if (modal) modal.hidden = true;
  _pendingRenameId = null;
  _isNewScenarioMode = false;
  const confirmBtn = document.getElementById('dm-rename-confirm-btn');
  if (confirmBtn) confirmBtn.textContent = 'Rename';
  const titleEl = document.getElementById('dm-rename-modal-title');
  if (titleEl) titleEl.textContent = 'Rename Scenario';
}

async function confirmDmRename() {
  const input = document.getElementById('dm-rename-input');
  const errorEl = document.getElementById('dm-rename-error');
  const newName = input ? input.value.trim() : '';

  if (!newName) {
    if (errorEl) { errorEl.textContent = 'Name cannot be empty.'; errorEl.hidden = false; }
    return;
  }
  if (newName.length > 200) {
    if (errorEl) { errorEl.textContent = 'Name must be 200 characters or fewer.'; errorEl.hidden = false; }
    return;
  }

  const confirmBtn = document.getElementById('dm-rename-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    if (_isNewScenarioMode) {
      const scenario = await storageManager.createNewScenario(newName);
      if (scenario) {
        closeDmRenameModal();
        closeDashboardModal();
        window.location.href = `/?scenarioId=${encodeURIComponent(scenario.id)}`;
      } else {
        if (errorEl) { errorEl.textContent = 'Could not create scenario. Please try again.'; errorEl.hidden = false; }
      }
    } else {
      if (!_pendingRenameId) {
        if (errorEl) { errorEl.textContent = 'No scenario selected for rename.'; errorEl.hidden = false; }
        return;
      }
      const ok = await storageManager.renameScenario(_pendingRenameId, newName);
      if (ok) {
        const card = document.querySelector(`#dm-scenarios-list [data-scenario-id="${CSS.escape(_pendingRenameId)}"]`);
        if (card) {
          const nameEl = card.querySelector('.scenario-card-name');
          if (nameEl) nameEl.textContent = newName;
          // Update aria-labels on action buttons (setAttribute takes raw text, no HTML escaping)
          card.querySelector('.btn-scenario-rename')?.setAttribute('aria-label', `Rename scenario ${newName}`);
          card.querySelector('.btn-scenario-delete')?.setAttribute('aria-label', `Delete scenario ${newName}`);
          card.querySelector('.btn-scenario-open')?.setAttribute('aria-label', `Open scenario ${newName}`);
        }
        closeDmRenameModal();
      } else {
        if (errorEl) { errorEl.textContent = 'Rename failed. Please try again.'; errorEl.hidden = false; }
      }
    }
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// ─── Inner delete modal ────────────────────────────────────────────────────────

function openDmDeleteModal(scenarioId, scenarioName) {
  _pendingDeleteId = scenarioId;
  const modal = document.getElementById('dm-delete-modal');
  const nameEl = document.getElementById('dm-delete-scenario-name');
  if (!modal) return;
  // Use textContent — no HTML rendering needed here
  if (nameEl) nameEl.textContent = scenarioName;
  modal.hidden = false;
  document.getElementById('dm-delete-confirm-btn')?.focus();
}

function closeDmDeleteModal() {
  const modal = document.getElementById('dm-delete-modal');
  if (modal) modal.hidden = true;
  _pendingDeleteId = null;
}

async function confirmDmDelete() {
  if (!_pendingDeleteId) return;
  const confirmBtn = document.getElementById('dm-delete-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    const ok = await storageManager.deleteScenario(_pendingDeleteId);
    if (ok) {
      const card = document.querySelector(`#dm-scenarios-list [data-scenario-id="${CSS.escape(_pendingDeleteId)}"]`);
      if (card) card.remove();

      // Show empty state if no cards remain
      const listEl = document.getElementById('dm-scenarios-list');
      if (listEl && listEl.querySelectorAll('.scenario-card').length === 0) {
        listEl.hidden = true;
        const emptyEl = document.getElementById('dm-scenarios-empty');
        if (emptyEl) emptyEl.hidden = false;
      }
      closeDmDeleteModal();
    } else {
      const warningEl = document.querySelector('#dm-delete-modal .modal-warning');
      if (warningEl) {
        warningEl.textContent = 'Could not delete scenario. Please try again.';
        warningEl.style.color = 'var(--color-error, #dc2626)';
      }
    }
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a currency value as AUD.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a date as a human-readable relative time string.
 * @param {string|null} dateStr
 * @returns {string}
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'unknown';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
