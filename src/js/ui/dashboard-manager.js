/**
 * Dashboard Manager
 *
 * Manages the "My Scenarios" dashboard page.
 * Handles listing, opening, renaming, and deleting user scenarios.
 * Requires the user to be signed in (via Azure SWA auth).
 */

import { authManager } from '../auth/auth-manager.js';
import { storageManager } from '../storage/storage-manager.js';

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {string|null} ID of the scenario pending rename */
let pendingRenameId = null;
/** @type {string|null} ID of the scenario pending deletion */
let pendingDeleteId = null;

// ─── Initialisation ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  initializeTheme();
  wireLoginButtons();
  wireModalHandlers();

  const user = await authManager.checkAuth();
  if (!user) {
    showAuthRequired();
    return;
  }

  showDashboardContent(user);

  await storageManager.initialize();
  await loadAndRenderScenarios();

  wireDashboardNewButton();
});

// ─── Theme ────────────────────────────────────────────────────────────────────

function initializeTheme() {
  const saved = localStorage.getItem('ccs-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ─── Auth display ─────────────────────────────────────────────────────────────

function showAuthRequired() {
  const authEl = document.getElementById('dashboard-auth-required');
  if (authEl) authEl.hidden = false;
}

function showDashboardContent(user) {
  const contentEl = document.getElementById('dashboard-content');
  if (contentEl) contentEl.hidden = false;

  const greetingEl = document.getElementById('dashboard-user-greeting');
  if (greetingEl) {
    const name = user.email || user.id || 'you';
    greetingEl.textContent = `Signed in as ${name}`;
  }
}

function wireLoginButtons() {
  document.querySelectorAll('.btn-auth[data-provider]').forEach(btn => {
    btn.addEventListener('click', () => {
      authManager.login(btn.dataset.provider, window.location.href);
    });
  });
}

// ─── Scenarios list ───────────────────────────────────────────────────────────

async function loadAndRenderScenarios() {
  const loadingEl = document.getElementById('scenarios-loading');
  const errorEl = document.getElementById('scenarios-error');
  const emptyEl = document.getElementById('scenarios-empty');
  const listEl = document.getElementById('scenarios-list');

  if (loadingEl) loadingEl.hidden = false;
  if (errorEl) errorEl.hidden = true;
  if (emptyEl) emptyEl.hidden = true;
  if (listEl) { listEl.hidden = true; listEl.innerHTML = ''; }

  if (!storageManager.cloudStorageAvailable) {
    console.warn('[Dashboard] Cloud storage not available — storageManager.initialize() may not have completed auth resolution. Ensure the user is signed in.');
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) errorEl.hidden = false;
    return;
  }

  let scenarios = [];
  let loadError = false;
  try {
    scenarios = await storageManager.listScenarios();
    if (!scenarios) {
      console.error('[Dashboard] listScenarios() returned null/undefined unexpectedly.');
      loadError = true;
      scenarios = [];
    }
  } catch (err) {
    console.error('[Dashboard] Failed to load scenarios:', err);
    loadError = true;
    scenarios = [];
  }

  if (loadingEl) loadingEl.hidden = true;

  if (loadError) {
    if (errorEl) errorEl.hidden = false;
    return;
  }

  if (!scenarios || scenarios.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (listEl) {
    listEl.hidden = false;
    // Sort newest first
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
 * Build a scenario card element.
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
      ${buildKeyInputs(ki)}
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
    openRenameModal(scenario.id, scenario.name || '');
  });

  card.querySelector('.btn-scenario-delete').addEventListener('click', () => {
    openDeleteModal(scenario.id, scenario.name || 'this scenario');
  });

  return card;
}

/**
 * Build the key-inputs summary HTML for a scenario card.
 * @param {object} ki - keyInputs object
 * @returns {string} HTML string
 */
function buildKeyInputs(ki) {
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

// ─── New scenario ─────────────────────────────────────────────────────────────

function wireDashboardNewButton() {
  const btn = document.getElementById('dashboard-new-scenario-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Reuse the rename modal as a "name your new scenario" dialog
    openNewScenarioModal();
  });
}

/** @type {boolean} Whether the rename modal is being used for a new scenario */
let _isNewScenarioMode = false;

function openNewScenarioModal() {
  _isNewScenarioMode = true;
  pendingRenameId = null;
  const modal = document.getElementById('rename-modal');
  const titleEl = document.getElementById('rename-modal-title');
  const input = document.getElementById('rename-input');
  const confirmBtn = document.getElementById('rename-confirm-btn');
  const errorEl = document.getElementById('rename-error');
  if (!modal || !input) return;

  if (titleEl) titleEl.textContent = 'New Scenario';
  if (confirmBtn) confirmBtn.textContent = 'Create';
  input.value = 'New Scenario';
  if (errorEl) errorEl.hidden = true;
  modal.hidden = false;
  input.focus();
  input.select();
}

// ─── Rename modal ─────────────────────────────────────────────────────────────

function openRenameModal(scenarioId, currentName) {
  _isNewScenarioMode = false;
  pendingRenameId = scenarioId;
  const modal = document.getElementById('rename-modal');
  const titleEl = document.getElementById('rename-modal-title');
  const input = document.getElementById('rename-input');
  const confirmBtn = document.getElementById('rename-confirm-btn');
  const errorEl = document.getElementById('rename-error');
  if (!modal || !input) return;

  if (titleEl) titleEl.textContent = 'Rename Scenario';
  if (confirmBtn) confirmBtn.textContent = 'Rename';
  input.value = currentName;
  if (errorEl) errorEl.hidden = true;
  modal.hidden = false;
  input.focus();
  input.select();
}

function closeRenameModal() {
  const modal = document.getElementById('rename-modal');
  if (modal) modal.hidden = true;
  pendingRenameId = null;
  _isNewScenarioMode = false;
  // Restore default button text
  const confirmBtn = document.getElementById('rename-confirm-btn');
  if (confirmBtn) confirmBtn.textContent = 'Rename';
  const titleEl = document.getElementById('rename-modal-title');
  if (titleEl) titleEl.textContent = 'Rename Scenario';
}

async function confirmRename() {
  const input = document.getElementById('rename-input');
  const errorEl = document.getElementById('rename-error');
  const newName = input ? input.value.trim() : '';

  if (!newName) {
    if (errorEl) { errorEl.textContent = 'Name cannot be empty.'; errorEl.hidden = false; }
    return;
  }
  if (newName.length > 200) {
    if (errorEl) { errorEl.textContent = 'Name must be 200 characters or fewer.'; errorEl.hidden = false; }
    return;
  }

  const confirmBtn = document.getElementById('rename-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    if (_isNewScenarioMode) {
      // Creating a new scenario
      const scenario = await storageManager.createNewScenario(newName);
      if (scenario) {
        closeRenameModal();
        window.location.href = `/?scenarioId=${encodeURIComponent(scenario.id)}`;
      } else {
        if (errorEl) { errorEl.textContent = 'Could not create scenario. Please try again.'; errorEl.hidden = false; }
      }
    } else {
      // Renaming an existing scenario
      if (!pendingRenameId) {
        if (errorEl) { errorEl.textContent = 'No scenario selected for rename.'; errorEl.hidden = false; }
        return;
      }
      const ok = await storageManager.renameScenario(pendingRenameId, newName);
      if (ok) {
        const card = document.querySelector(`[data-scenario-id="${CSS.escape(pendingRenameId)}"]`);
        if (card) {
          const nameEl = card.querySelector('.scenario-card-name');
          if (nameEl) nameEl.textContent = newName;
        }
        closeRenameModal();
      } else {
        if (errorEl) { errorEl.textContent = 'Rename failed. Please try again.'; errorEl.hidden = false; }
      }
    }
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function openDeleteModal(scenarioId, scenarioName) {
  pendingDeleteId = scenarioId;
  const modal = document.getElementById('delete-modal');
  const nameEl = document.getElementById('delete-scenario-name');
  if (!modal) return;
  // Use textContent (not innerHTML) so no HTML escaping is needed
  if (nameEl) nameEl.textContent = scenarioName;
  modal.hidden = false;
  document.getElementById('delete-confirm-btn')?.focus();
}

function closeDeleteModal() {
  const modal = document.getElementById('delete-modal');
  if (modal) modal.hidden = true;
  pendingDeleteId = null;
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const confirmBtn = document.getElementById('delete-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    const ok = await storageManager.deleteScenario(pendingDeleteId);
    if (ok) {
      const card = document.querySelector(`[data-scenario-id="${CSS.escape(pendingDeleteId)}"]`);
      if (card) card.remove();

      // Show empty state if no cards left
      const listEl = document.getElementById('scenarios-list');
      if (listEl && listEl.querySelectorAll('.scenario-card').length === 0) {
        listEl.hidden = true;
        const emptyEl = document.getElementById('scenarios-empty');
        if (emptyEl) emptyEl.hidden = false;
      }
      closeDeleteModal();
    } else {
      // Show inline error in the modal instead of alert()
      const warningEl = document.querySelector('#delete-modal .modal-warning');
      if (warningEl) {
        warningEl.textContent = 'Could not delete scenario. Please try again.';
        warningEl.style.color = 'var(--color-error, #dc2626)';
      }
    }
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

// ─── Modal wiring ─────────────────────────────────────────────────────────────

function wireModalHandlers() {
  // Rename modal buttons
  document.getElementById('rename-cancel-btn')?.addEventListener('click', closeRenameModal);
  document.getElementById('rename-confirm-btn')?.addEventListener('click', confirmRename);

  // Allow Enter key to confirm rename
  document.getElementById('rename-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') closeRenameModal();
  });

  // Delete modal buttons
  document.getElementById('delete-cancel-btn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm-btn')?.addEventListener('click', confirmDelete);

  // Close modals on overlay click
  document.getElementById('rename-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeRenameModal();
  });
  document.getElementById('delete-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRenameModal();
      closeDeleteModal();
    }
  });
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
