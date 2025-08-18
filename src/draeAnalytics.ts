/**
 * 🚀 DRAE ANALYTICS - Ultimate Visitor Tracking System
 * 
 * Features:
 * - 🔐 Visitor fingerprinting & friendly labeling
 * - 🏷️ Auto-tagging all DOM elements with drae-data-*
 * - 🖱️ Click tracking with Discord webhooks
 * - ⌨️ Input tracking (what users type, excluding passwords)
 * - 🕵️ Incognito mode detection
 * - 😴 User inactivity monitoring
 * - 📱🧭🦊 Emoji-based browser and device detection
 * - 💻 Device type classification
 * - 🔒 No 3rd-party dependencies, TypeScript only
 * - 💬 Discord webhook integration only
 * - 🏷️ Device label widget with one-time edit capability
 * 
 * Usage: Import this file once in main.tsx
 * import { initAnalytics } from './analytics/draeAnalytics';
 * initAnalytics('YOUR_DISCORD_WEBHOOK_URL');
 */

// =============================================================================
// 📋 TYPE DEFINITIONS
// =============================================================================

interface VisitorInfo {
  hash: string;
  label: string;
  visitCount: number;
  firstSeen: string;
  isIncognito: boolean;
  visitorType: 'new' | 'returning' | 'bot';
  browserEmoji: string;
  deviceType: string;
}

interface ClickEventData {
  elementTag: string;
  elementText: string;
  elementId: string;
  elementClass: string;
  elementType: string;
  href?: string;
  src?: string;
  draeData: Record<string, string>;
  timestamp: string;
  url: string;
  visitorLabel: string;
}

interface InputEventData {
  elementTag: string;
  elementId: string;
  elementClass: string;
  elementType: string;
  inputValue: string;
  placeholder: string;
  label?: string;
  fieldName: string;
  timestamp: string;
  url: string;
  visitorLabel: string;
  interactionTime: number; // How long they spent typing
}

interface DiscordPayload {
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    timestamp: string;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  }>;
}

// =============================================================================
// 🔧 CONFIGURATION
// =============================================================================

class DraeAnalyticsConfig {
  public DISCORD_WEBHOOK_URL: string = '';
  public readonly CLICK_RATE_LIMIT = 500; // milliseconds between click events
  public readonly INPUT_RATE_LIMIT = 2000; // milliseconds between input events
  public readonly INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds
  public readonly LOCAL_STORAGE_PREFIX = 'drae_';
  public readonly MAX_LABEL_CHANGES = 1; // how many times users can change their username
  public readonly MAX_LABEL_CHARACTERS = 25; // maximum characters allowed in username
  public readonly MIN_LABEL_CHARACTERS = 3; // minimum characters required for username
  public readonly INCOGNITO_STORAGE_THRESHOLD = 120000000; // storage quota threshold for incognito detection
  public readonly MAX_SANITIZED_TEXT_LENGTH = 100; // maximum length for sanitized text
  public readonly LABEL_NUMBER_MAX = 999; // maximum random number for label generation
  public readonly WIDGET_Z_INDEX = 9999; // z-index for the widget
  public readonly MODAL_Z_INDEX = 10000; // z-index for the modal
  public readonly CHAR_COUNTER_ERROR_OFFSET = 2; // characters before max to show error
  public readonly CHAR_COUNTER_WARNING_OFFSET = 7; // characters before max to show warning
  public readonly ANIMATION_DURATION_FAST = 0.2; // fast animation duration in seconds
  public readonly ANIMATION_DURATION_NORMAL = 0.3; // normal animation duration in seconds
  public readonly COLORS = {
    VISITOR_NEW: 0x00ff88,      // Bright green
    VISITOR_RETURNING: 0x3498db, // Blue  
    VISITOR_BOT: 0xe74c3c,      // Red
    CLICK_IMPORTANT: 0xf39c12,   // Orange for buttons/links
    CLICK_NORMAL: 0x95a5a6,      // Gray for regular clicks
    INPUT_TEXT: 0x3498db,        // Blue for text inputs
    INPUT_EMAIL: 0x9b59b6,       // Purple for email inputs
    INPUT_SEARCH: 0x1abc9c,      // Teal for search inputs
    INPUT_TEXTAREA: 0xf39c12,    // Orange for textareas
    INPUT_OTHER: 0x95a5a6,       // Gray for other inputs
    SESSION_START: 0x9b59b6,     // Purple
    SESSION_END: 0x34495e,       // Dark blue
    ERROR: 0xe74c3c,             // Red
    SUCCESS: 0x27ae60,           // Green
    INACTIVE: 0xf39c12,          // Orange for inactivity
    ROUTE_CHANGE: 0x8e44ad,      // Purple for navigation
    PAGE_EXIT: 0x34495e,         // Dark blue for exits
    LABEL_CHANGE: 0xf39c12       // Orange for label changes
  };
  public readonly PRIORITY = {
    HIGH: ['visitor', 'session_start', 'page_exit', 'input_important'],
    MEDIUM: ['route_change', 'click_important', 'input_normal'],
    LOW: ['click_normal', 'inactivity']
  };

  constructor(webhookUrl: string) {
    this.DISCORD_WEBHOOK_URL = webhookUrl;
  }
}

// =============================================================================
// 🎯 GLOBAL STATE
// =============================================================================

let CONFIG: DraeAnalyticsConfig;
let lastClickTime = 0;
let lastInputTime = 0;
let inactivityTimer: NodeJS.Timeout | null = null;
let isUserActive = true;
let mutationObserver: MutationObserver | null = null;
let sessionStartTime = Date.now();
let currentRoute = window.location.pathname;
let userJourney: string[] = [];
let eventQueue: Array<{payload: DiscordPayload, priority: 'HIGH' | 'MEDIUM' | 'LOW', timestamp: number}> = [];

// Device label widget state
let deviceLabelWidget: HTMLElement | null = null;
let labelEditModal: HTMLElement | null = null;

// Track input focus times for calculating interaction duration
let inputFocusTimes: Map<Element, number> = new Map();

// Random word lists for generating friendly labels
const ADJECTIVES = [
  'Mighty', 'Swift', 'Calm', 'Bright', 'Clever', 'Bold', 'Silent', 'Wise', 'Free', 'Wild',
  'Cool', 'Sharp', 'Quick', 'Brave', 'Smart', 'Strong', 'Fast', 'Pure', 'Royal', 'Noble',
  'Sleek', 'Smooth', 'Fierce', 'Gentle', 'Loyal', 'Mystic', 'Cosmic', 'Steel', 'Golden', 'Silver'
];

const ANIMALS = [
  'Tiger', 'Eagle', 'Wolf', 'Bear', 'Lion', 'Fox', 'Hawk', 'Shark', 'Panther', 'Falcon',
  'Dragon', 'Phoenix', 'Raven', 'Owl', 'Lynx', 'Jaguar', 'Leopard', 'Cobra', 'Viper', 'Stallion',
  'Cheetah', 'Rhino', 'Elephant', 'Whale', 'Dolphin', 'Octopus', 'Kraken', 'Griffin', 'Unicorn', 'Pegasus'
];

// =============================================================================
// 🏷️ DEVICE LABEL WIDGET UI
// =============================================================================

/**
 * Check if user has reached their maximum label changes
 */
function hasLabelBeenChanged(): boolean {
  const changes = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`) || '0');
  return changes >= CONFIG.MAX_LABEL_CHANGES;
}

/**
 * Mark label as changed and increment counter
 */
function markLabelAsChanged(): void {
  const changes = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`) || '0');
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`, (changes + 1).toString());
  // Keep legacy flag for backward compatibility
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changed`, 'true');
}

/**
 * Send label change notification to Discord
 */
async function sendLabelChangeToDiscord(oldLabel: string, newLabel: string): Promise<void> {
  const payload: DiscordPayload = {
    embeds: [{
      title: '🏷️ Device Label Changed',
      description: `**${oldLabel}** changed their username to **${newLabel}**`,
      color: CONFIG.COLORS.LABEL_CHANGE,
      timestamp: new Date().toISOString(),
      fields: [
        { name: '📜 Old Label', value: oldLabel, inline: true },
        { name: '🆕 New Label', value: newLabel, inline: true },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };

  await sendToDiscord(payload);
}

// Track if toast was shown to prevent duplicates
let toastShown = false;
let toastTimeout: NodeJS.Timeout | null = null;

/**
 * Show toast notification for label change (only once per session)
 */
function showLabelChangeToast(newLabel: string): void {
  if (toastShown) return; // Prevent duplicate toasts
  
  try {
    // Try to use the app's toast system
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'success',
        title: `Welcome ${newLabel}! 👋`,
        message: 'Come back tomorrow to keep your streak going! 🔥'
      });
    } else {
      // Fallback: try to dispatch a custom event for the app to handle
      window.dispatchEvent(new CustomEvent('draeToast', {
        detail: {
          type: 'success',
          title: `Welcome ${newLabel}! 👋`,
          message: 'Come back tomorrow to keep your streak going! 🔥'
        }
      }));
    }
    
    toastShown = true;
    
    // Reset toast flag after 3 seconds + fade out time
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastShown = false;
    }, 3500); // 3 seconds + 0.5s for fade out
    
  } catch (error) {
    console.log('Toast notification not available:', error);
  }
}

/**
 * Format label: replace spaces with dashes, capitalize first letter and after dashes
 */
function formatLabel(value: string): string {
  return value
    .replace(/\s+/g, '-')
    .replace(/^([a-z])/, (match) => match.toUpperCase())
    .replace(/-([a-z])/g, (match, letter) => `-${letter.toUpperCase()}`);
}

/**
 * Create and inject CSS styles for the widget
 */
function injectWidgetStyles(): void {
  if (document.getElementById('drae-widget-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'drae-widget-styles';
  style.textContent = `
    .drae-widget-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: ${CONFIG.WIDGET_Z_INDEX - 1};
      pointer-events: auto;
    }
    
    .drae-content-blur {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: ${CONFIG.WIDGET_Z_INDEX - 2};
      pointer-events: auto;
    }
    
    .drae-widget {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${CONFIG.WIDGET_Z_INDEX};
      background: #000000;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(12px);
      border: 2px solid #333333;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      min-width: 200px;
      pointer-events: auto;
      cursor: text;
    }
    
    .drae-label-input {
      background: transparent;
      border: none;
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.025em;
      flex: 1;
      min-width: 0;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      padding: 4px;
      border-radius: 4px;
    }
    
    .drae-label-input:focus {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #10b981;
    }
    
    .drae-modal input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #333;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
      box-sizing: border-box;
      background: #000000;
      color: #ffffff;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .drae-modal input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    
    .drae-modal input::placeholder {
      color: #6b7280;
    }
    
    .drae-char-counter {
      text-align: right;
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 20px;
      margin-top: -16px;
    }
    
    .drae-char-counter.warning {
      color: #f59e0b;
    }
    
    .drae-char-counter.error {
      color: #ef4444;
    }
    
    .drae-modal-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .drae-modal-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .drae-modal-btn.primary {
      background: #10b981;
      color: #ffffff;
    }
    
    .drae-modal-btn.primary:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .drae-modal-btn.primary:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }
    
    .drae-modal-btn.secondary {
      background: #374151;
      color: #ffffff;
      border: 1px solid #4b5563;
    }
    
    .drae-modal-btn.secondary:hover {
      background: #4b5563;
      transform: translateY(-1px);
    }
    
    .drae-warning {
      background: #1f2937;
      border: 1px solid #374151;
      color: #f59e0b;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .drae-helper-text {
      font-size: 11px;
      color: #9ca3af;
      font-weight: 400;
      opacity: 0.8;
      white-space: nowrap;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Create the device label widget UI
 */
function createDeviceLabelWidget(): void {
  if (deviceLabelWidget) return;
  
  // Only hide widget if label has been changed
  const hasChanged = hasLabelBeenChanged();
  if (hasChanged) return;
  
  injectWidgetStyles();
  
  // Create blur layer first
  const blurDiv = document.createElement('div');
  blurDiv.className = 'drae-content-blur';
  document.body.appendChild(blurDiv);
  
  // Create backdrop second
  const backdrop = document.createElement('div');
  backdrop.className = 'drae-widget-backdrop';
  document.body.appendChild(backdrop);
  
  const currentLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  deviceLabelWidget = document.createElement('div');
  deviceLabelWidget.className = 'drae-widget';
  deviceLabelWidget.innerHTML = `
    <div class="drae-helper-text">👋 Click to edit your username</div>
    <input class="drae-label-input" value="${currentLabel}" maxlength="${CONFIG.MAX_LABEL_CHARACTERS}" placeholder="e.g. Saging-Vs-Bisaya, Iglesia-NI-Chris-Brown">
  `;
  
  const input = deviceLabelWidget.querySelector('.drae-label-input') as HTMLInputElement;
  if (input && !hasChanged) {
    // Focus and select text when widget is clicked
    deviceLabelWidget.addEventListener('click', () => {
      input.focus();
      input.select();
    });
    
    // Real-time formatting as user types
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      let value = target.value;
      
      // Replace spaces with dashes and format in real-time
      value = formatLabel(value);
      target.value = value;
    });
    
    // Handle input changes and submit
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await saveDirectLabel();
      }
    });
    
    input.addEventListener('blur', async () => {
      await saveDirectLabel();
    });
  }
  
  document.body.appendChild(deviceLabelWidget);
  
  // Store backdrop and blur references for cleanup
  (deviceLabelWidget as any).backdrop = backdrop;
  (deviceLabelWidget as any).blurDiv = blurDiv;
}

/**
 * Save the new label directly from widget input
 */
async function saveDirectLabel(): Promise<void> {
  if (!deviceLabelWidget || hasLabelBeenChanged()) return;
  
  const input = deviceLabelWidget.querySelector('.drae-label-input') as HTMLInputElement;
  let newLabel = input.value.trim();
  
  if (!newLabel || newLabel.length < 3) {
    return; // Don't save if too short
  }
  
  if (newLabel.length > 25) {
    return; // Don't save if too long
  }
  
  // Format the label
  newLabel = formatLabel(newLabel);
  // Capitalize first letter of the entire string and first letter after each dash
  newLabel = newLabel.charAt(0).toUpperCase() + newLabel.slice(1).replace(/-(.)/g, (match, letter) => '-' + letter.toUpperCase());
  
  const oldLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  if (newLabel === oldLabel) {
    return; // No change needed
  }
  
  // Update localStorage
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, newLabel);
  markLabelAsChanged();
  
  // Send notification to Discord
  await sendLabelChangeToDiscord(oldLabel, newLabel);
  
  // Show welcome toast notification
  showLabelChangeToast(newLabel);
  
  // Remove the widget immediately without animations
  removeWidgetImmediately();
}

/**
 * Remove the widget immediately without animations
 */
function removeWidgetImmediately(): void {
  if (!deviceLabelWidget) return;
  
  // Remove blur div
  const blurDiv = (deviceLabelWidget as any).blurDiv;
  if (blurDiv && blurDiv.parentNode) {
    blurDiv.parentNode.removeChild(blurDiv);
  }
  
  // Remove backdrop
  const backdrop = (deviceLabelWidget as any).backdrop;
  if (backdrop && backdrop.parentNode) {
    backdrop.parentNode.removeChild(backdrop);
  }
  
  // Remove widget
  if (deviceLabelWidget.parentNode) {
    deviceLabelWidget.parentNode.removeChild(deviceLabelWidget);
  }
  
  deviceLabelWidget = null;
}

// Modal code removed - widget is now directly editable

// =============================================================================
// 🔐 VISITOR FINGERPRINTING & LABELING
// =============================================================================

/**
 * Generate a unique hash based on browser/device characteristics
 */
async function generateVisitorHash(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Create a unique canvas fingerprint
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('DRAE Analytics Fingerprint', 2, 2);
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    canvasFingerprint: canvas.toDataURL()
  };

  const fingerprintString = JSON.stringify(fingerprint);
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Generate or retrieve a friendly visitor label like "MightyTiger-381"
 */
function getOrCreateLabel(hash: string): string {
  const stored = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`);
  if (stored) return stored;

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * CONFIG.LABEL_NUMBER_MAX) + 1;
  const label = `${adjective}${animal}-${number}`;
  
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, label);
  return label;
}

/**
 * Detect if this is a new, returning, or bot visitor
 */
function detectVisitorType(): 'new' | 'returning' | 'bot' {
  // Check for bot indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const botIndicators = ['bot', 'crawl', 'spider', 'scrape', 'headless', 'phantom'];
  if (botIndicators.some(indicator => userAgent.includes(indicator))) {
    return 'bot';
  }

  // Check if we have previous visit data
  const visitCount = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_count`) || '0');
  return visitCount > 0 ? 'returning' : 'new';
}

/**
 * Store visitor information in localStorage
 */
function storeVisitorInfo(info: VisitorInfo): void {
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_hash`, info.hash);
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, info.label);
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_count`, info.visitCount.toString());
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}first_seen`, info.firstSeen);
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}incognito`, info.isIncognito.toString());
}

// =============================================================================
// 🕵️ INCOGNITO MODE DETECTION
// =============================================================================

/**
 * Attempt to detect if the user is in incognito/private mode
 */
async function isIncognito(): Promise<boolean> {
  try {
    // Method 1: Storage quota estimation
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      // Incognito mode typically has very limited quota
      if (estimate.quota && estimate.quota < CONFIG.INCOGNITO_STORAGE_THRESHOLD) { // Less than ~120MB
        return true;
      }
    }

    // Method 2: IndexedDB detection
    return new Promise((resolve) => {
      const db = indexedDB.open('test');
      db.onerror = () => resolve(true); // Might be incognito
      db.onsuccess = () => {
        indexedDB.deleteDatabase('test');
        resolve(false);
      };
    });
  } catch {
    return false; // Assume not incognito if detection fails
  }
}

// =============================================================================
// 💻 DEVICE & BROWSER DETECTION
// =============================================================================

/**
 * Get browser emoji based on user agent
 */
function getBrowserEmoji(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return '🦊';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return '🧭';
  if (userAgent.includes('edge')) return '📘';
  if (userAgent.includes('opera')) return '🎭';
  if (userAgent.includes('chrome')) return '🌐';
  
  return '🌍'; // Default browser
}

/**
 * Detect device type with emoji
 */
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad/.test(userAgent)) return '📟 Tablet';
  if (/mobile|android|iphone/.test(userAgent)) return '📱 Mobile';
  
  return '💻 Desktop';
}

// =============================================================================
// 😴 USER INACTIVITY TRACKING
// =============================================================================

/**
 * Start or reset the inactivity timer
 */
function startInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  isUserActive = true;
  
  inactivityTimer = setTimeout(() => {
    if (isUserActive) {
      isUserActive = false;
      sendInactivityToDiscord();
    }
  }, CONFIG.INACTIVITY_TIMEOUT);
}

/**
 * Reset inactivity timer on user activity
 */
function resetInactivityTimer(): void {
  startInactivityTimer();
}

/**
 * Send inactivity notification to Discord
 */
async function sendInactivityToDiscord(): Promise<void> {
  const visitorLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  const payload: DiscordPayload = {
    embeds: [{
      title: '💤 User Inactive',
      description: `**${visitorLabel}** has been idle for 1+ minute`,
      color: CONFIG.COLORS.INACTIVE,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '🌐 Page',
          value: `[${document.title}](${window.location.href})`,
          inline: false
        }
      ]
    }]
  };

  await sendToDiscord(payload);
}

// =============================================================================
// 🏷️ DOM AUTO-TAGGING SYSTEM
// =============================================================================

/**
 * Check if element already has DRAE tagging
 */
function hasDraeTag(element: Element): boolean {
  return element.hasAttribute('drae-data-tag');
}

/**
 * Sanitize text content for tagging
 */
function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').substring(0, CONFIG.MAX_SANITIZED_TEXT_LENGTH);
}

/**
 * Tag a single element with drae-data-* attributes
 */
function tagElement(element: Element): void {
  if (hasDraeTag(element)) return;
  
  const tagName = element.tagName.toLowerCase();
  
  // Skip certain elements
  if (['script', 'style', 'meta', 'link', 'title', 'head'].includes(tagName)) {
    return;
  }
  
  // Basic tagging
  element.setAttribute('drae-data-tag', tagName);
  
  // Text content
  const textContent = element.textContent || '';
  if (textContent) {
    element.setAttribute('drae-data-text', sanitizeText(textContent));
  }
  
  // ID and classes
  if (element.id) {
    element.setAttribute('drae-data-id', element.id);
  }
  
  if (element.className && typeof element.className === 'string') {
    element.setAttribute('drae-data-class', element.className);
  }
  
  // Special attributes based on element type
  if (element instanceof HTMLAnchorElement && element.href) {
    element.setAttribute('drae-data-href', element.href);
  }
  
  if (element instanceof HTMLImageElement && element.src) {
    element.setAttribute('drae-data-src', element.src);
    element.setAttribute('drae-data-alt', element.alt || '');
  }
  
  if (element instanceof HTMLInputElement) {
    element.setAttribute('drae-data-type', element.type);
    element.setAttribute('drae-data-placeholder', element.placeholder || '');
  }
  
  if (element instanceof HTMLButtonElement) {
    element.setAttribute('drae-data-type', 'button');
  }
}

/**
 * Tag all elements in the current DOM
 */
function tagAllElements(): void {
  const allElements = document.querySelectorAll('*');
  allElements.forEach(tagElement);
}

/**
 * Set up MutationObserver to tag new elements
 */
function observeDOM(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
  
  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          tagElement(element);
          // Tag children too
          element.querySelectorAll('*').forEach(tagElement);
        }
      });
    });
  });
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// =============================================================================
// ⌨️ INPUT TRACKING SYSTEM
// =============================================================================

/**
 * Get field label from associated label element or nearby text
 */
function getFieldLabel(element: HTMLInputElement | HTMLTextAreaElement): string {
  // Try to find associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent) {
      return sanitizeText(label.textContent);
    }
  }
  
  // Try to find parent label
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent) {
    return sanitizeText(parentLabel.textContent);
  }
  
  // Try to find nearby text (previous sibling, parent, etc.)
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.textContent && sibling.textContent.trim()) {
      return sanitizeText(sibling.textContent);
    }
    sibling = sibling.previousElementSibling;
  }
  
  // Try parent's previous text
  const parent = element.parentElement;
  if (parent) {
    const parentSibling = parent.previousElementSibling;
    if (parentSibling && parentSibling.textContent) {
      return sanitizeText(parentSibling.textContent);
    }
  }
  
  return element.placeholder || element.name || 'Unlabeled Field';
}

/**
 * Get color for input type
 */
function getInputColor(inputType: string): number {
  switch (inputType.toLowerCase()) {
    case 'email':
      return CONFIG.COLORS.INPUT_EMAIL;
    case 'search':
      return CONFIG.COLORS.INPUT_SEARCH;
    case 'text':
    case 'tel':
    case 'url':
      return CONFIG.COLORS.INPUT_TEXT;
    default:
      return CONFIG.COLORS.INPUT_OTHER;
  }
}

/**
 * Create Discord embed for input event
 */
function createInputDiscordEmbed(data: InputEventData): DiscordPayload {
  const isTextArea = data.elementTag === 'textarea';
  const color = isTextArea ? CONFIG.COLORS.INPUT_TEXTAREA : getInputColor(data.elementType);
  
  const fields = [
    { name: '🏷️ Type', value: isTextArea ? 'Textarea' : data.elementType || 'text', inline: true },
    { name: '📝 Field', value: data.fieldName, inline: true },
    { name: '⏱️ Time Spent', value: `${(data.interactionTime / 1000).toFixed(1)}s`, inline: true }
  ];
  
  if (data.elementId) {
    fields.push({ name: '🆔 ID', value: data.elementId, inline: true });
  }
  
  if (data.placeholder) {
    fields.push({ name: '💭 Placeholder', value: data.placeholder.substring(0, 100), inline: true });
  }
  
  // Add input value (truncated for privacy and readability)
  const truncatedValue = data.inputValue.length > 200 ? 
    data.inputValue.substring(0, 200) + '...' : 
    data.inputValue;
  
  if (truncatedValue) {
    fields.push({ 
      name: '📄 Input Content', 
      value: `\`\`\`\n${truncatedValue}\n\`\`\``, 
      inline: false 
    });
  } else {
    fields.push({ 
      name: '📄 Input Content', 
      value: '*Empty field*', 
      inline: false 
    });
  }
  
  // Always add page info at the end
  fields.push({ name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false });
  
  return {
    embeds: [{
      title: `⌨️ User Input: ${data.fieldName}`,
      description: `**${data.visitorLabel}** entered text in ${isTextArea ? 'textarea' : data.elementType + ' field'}`,
      color: color,
      timestamp: data.timestamp,
      fields
    }]
  };
}

/**
 * Send input event to Discord with rate limiting
 */
async function sendInputToDiscord(data: InputEventData): Promise<void> {
  const now = Date.now();
  if (now - lastInputTime < CONFIG.INPUT_RATE_LIMIT) {
    return; // Rate limited
  }
  lastInputTime = now;
  
  const payload = createInputDiscordEmbed(data);
  await sendToDiscord(payload);
}

/**
 * Set up input tracking for text fields (excluding passwords)
 */
function trackInputs(): void {
  // Track focus events to measure interaction time
  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (isTrackableInput(target)) {
      inputFocusTimes.set(target, Date.now());
      resetInactivityTimer();
    }
  }, true);
  
  // Track blur events to capture final input values
  document.addEventListener('focusout', (event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!isTrackableInput(target)) return;
    
    resetInactivityTimer();
    
    const focusTime = inputFocusTimes.get(target) || Date.now();
    const interactionTime = Date.now() - focusTime;
    inputFocusTimes.delete(target);
    
    // Only track if they actually typed something or spent meaningful time
    if (target.value.trim() || interactionTime > 1000) {
      const visitorLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
      
      const inputData: InputEventData = {
        elementTag: target.tagName.toLowerCase(),
        elementId: target.id || '',
        elementClass: target.className?.toString() || '',
        elementType: target.type || 'text',
        inputValue: target.value,
        placeholder: target.placeholder || '',
        label: getFieldLabel(target),
        fieldName: getFieldLabel(target),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        visitorLabel,
        interactionTime
      };
      
      sendInputToDiscord(inputData);
    }
  }, true);
}

/**
 * Check if element is a trackable input (not password, hidden, etc.)
 */
function isTrackableInput(element: EventTarget | null): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) return false;
  
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    // Track most input types except passwords and hidden fields
    const allowedTypes = [
      'text', 'email', 'search', 'tel', 'url', 'number', 
      'date', 'datetime-local', 'month', 'time', 'week'
    ];
    return allowedTypes.includes(type);
  }
  
  return false;
}

// =============================================================================
// 🖱️ CLICK TRACKING & DISCORD REPORTING
// =============================================================================

/**
 * Extract all drae-data-* attributes from an element
 */
function extractAllDraeData(element: Element): Record<string, string> {
  const draeData: Record<string, string> = {};
  
  for (const attr of element.attributes) {
    if (attr.name.startsWith('drae-data-')) {
      const key = attr.name.replace('drae-data-', '');
      draeData[key] = attr.value;
    }
  }
  
  return draeData;
}

/**
 * Determine if click is important (buttons, links, forms)
 */
function isImportantClick(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  const isButton = tag === 'button' || (tag === 'input' && element.getAttribute('type') === 'button');
  const isLink = tag === 'a' && !!element.getAttribute('href');
  const isForm = ['input', 'select', 'textarea'].includes(tag);
  
  return isButton || isLink || isForm;
}

/**
 * Create Discord embed payload for click event
 */
function createDiscordEmbed(data: ClickEventData): DiscordPayload {
  const isImportant = isImportantClick(document.querySelector(`[drae-data-tag="${data.elementTag}"]`) || document.createElement('div'));
  const color = isImportant ? CONFIG.COLORS.CLICK_IMPORTANT : CONFIG.COLORS.CLICK_NORMAL;
  
  const fields = [
    { name: '🏷️ Tag', value: data.elementTag, inline: true },
    { name: '🆔 ID', value: data.elementId || 'None', inline: true },
    { name: '📝 Class', value: data.elementClass || 'None', inline: true }
  ];
  
  if (data.elementText) {
    fields.push({ name: '📄 Text', value: data.elementText.substring(0, 100), inline: false });
  }
  
  if (data.href) {
    fields.push({ name: '🔗 Link', value: data.href, inline: false });
  }
  
  if (data.src) {
    fields.push({ name: '🖼️ Source', value: data.src, inline: false });
  }
  
  if (data.elementType) {
    fields.push({ name: '⚙️ Type', value: data.elementType, inline: true });
  }
  
  // Always add page info at the end
  fields.push({ name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false });
  
  return {
    embeds: [{
      title: isImportant ? '🔥 Important Click' : '🖱️ Element Clicked',
      description: `**${data.visitorLabel}** clicked on ${data.elementTag}`,
      color: color,
      timestamp: data.timestamp,
      fields
    }]
  };
}

/**
 * Send click event to Discord with rate limiting
 */
async function sendClickToDiscord(data: ClickEventData): Promise<void> {
  const now = Date.now();
  if (now - lastClickTime < CONFIG.CLICK_RATE_LIMIT) {
    return; // Rate limited
  }
  lastClickTime = now;
  
  const payload = createDiscordEmbed(data);
  await sendToDiscord(payload);
}

/**
 * Set up click tracking on the document
 */
function trackClicks(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!target) return;
    
    // Reset inactivity timer
    resetInactivityTimer();
    
    const draeData = extractAllDraeData(target);
    const visitorLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
    
    const clickData: ClickEventData = {
      elementTag: target.tagName.toLowerCase(),
      elementText: sanitizeText(target.textContent || ''),
      elementId: target.id || '',
      elementClass: target.className?.toString() || '',
      elementType: target.getAttribute('type') || '',
      href: target instanceof HTMLAnchorElement ? target.href : undefined,
      src: target instanceof HTMLImageElement ? target.src : undefined,
      draeData,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      visitorLabel
    };
    
    sendClickToDiscord(clickData);
  }, true);
}

// =============================================================================
// 🕒 DATE FORMATTING UTILITIES
// =============================================================================

/**
 * Format date to human readable format with timezone and relative time
 */
function formatHumanDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Get timezone abbreviation (PHT, EST, etc.)
  const timezone = Intl.DateTimeFormat('en', {timeZoneName: 'short'}).formatToParts(date)
    .find(part => part.type === 'timeZoneName')?.value || 'Local';
  
  // Format the date
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Calculate relative time
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  let relativeTime = '';
  if (diffSeconds < 60) {
    relativeTime = 'Just now';
  } else if (diffMinutes < 60) {
    relativeTime = `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    relativeTime = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    relativeTime = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    relativeTime = `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    relativeTime = `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
  
  return `${formattedDate}, ${formattedTime} (${timezone}) (${relativeTime})`;
}

// =============================================================================
// 📤 VISITOR INFO DISCORD REPORTING
// =============================================================================

/**
 * Send visitor information to Discord
 */
async function sendVisitorInfoToDiscord(info: VisitorInfo): Promise<void> {
  const typeEmoji = info.visitorType === 'new' ? '🆕' : info.visitorType === 'returning' ? '🔄' : '🤖';
  const incognitoText = info.isIncognito ? '✅ Yes' : '❌ No';
  
  const visitorColor = info.visitorType === 'new' ? CONFIG.COLORS.VISITOR_NEW : 
                    info.visitorType === 'returning' ? CONFIG.COLORS.VISITOR_RETURNING : 
                    CONFIG.COLORS.VISITOR_BOT;
  
  const payload: DiscordPayload = {
    embeds: [{
      title: `${typeEmoji} ${info.visitorType.charAt(0).toUpperCase() + info.visitorType.slice(1)} Visitor: \`${info.label}\``,
      description: `A ${info.visitorType} visitor has arrived!`,
      color: visitorColor,
      timestamp: new Date().toISOString(),
      fields: [
        { name: '🧠 Type', value: info.visitorType, inline: true },
        { name: '🌍 Device', value: info.deviceType, inline: true },
        { name: '🖥️ Browser', value: info.browserEmoji, inline: true },
        { name: '👁️ Incognito', value: incognitoText, inline: true },
        { name: '🔁 Visits', value: info.visitCount.toString(), inline: true },
        { name: '🕒 First Seen', value: info.visitCount === 1 ? 'Just now' : formatHumanDate(info.firstSeen), inline: true },
        { name: '🌐 URL', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };
  
  await sendToDiscord(payload);
}

// =============================================================================
// 🌐 DISCORD WEBHOOK UTILITY
// =============================================================================

/**
 * Send payload to Discord webhook
 */
async function sendToDiscord(payload: DiscordPayload): Promise<void> {
  try {
    const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('Failed to send to Discord:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('Failed to send to Discord:', error);
  }
}

// =============================================================================
// 🚀 INITIALIZATION FLOW
// =============================================================================

/**
 * Complete fingerprinting process
 */
async function fingerprintUser(): Promise<VisitorInfo> {
  const hash = await generateVisitorHash();
  const label = getOrCreateLabel(hash);
  const visitorType = detectVisitorType();
  const isIncognitoMode = await isIncognito();
  const browserEmoji = getBrowserEmoji();
  const deviceType = getDeviceType();
  
  // Update visit count
  const currentCount = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_count`) || '0');
  const visitCount = currentCount + 1;
  
  // Get or set first seen date
  let firstSeen = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}first_seen`);
  if (!firstSeen) {
    firstSeen = new Date().toISOString();
  }
  
  const info: VisitorInfo = {
    hash,
    label,
    visitCount,
    firstSeen,
    isIncognito: isIncognitoMode,
    visitorType,
    browserEmoji,
    deviceType
  };
  
  storeVisitorInfo(info);
  await sendVisitorInfoToDiscord(info);
  
  return info;
}

/**
 * Initialize the complete analytics system
 */
export async function initAnalytics(webhookUrl: string): Promise<void> {
  try {
    console.log('🚀 DRAE Analytics initializing...');
    
    // Initialize config
    CONFIG = new DraeAnalyticsConfig(webhookUrl);
    
    // Step 1: Fingerprint and identify the user
    await fingerprintUser();
    
    // Step 2: Create device label widget
    createDeviceLabelWidget();
    
    // Step 3: Tag all existing elements
    tagAllElements();
    
    // Step 4: Set up dynamic content observer
    observeDOM();
    
    // Step 5: Start click tracking
    trackClicks();
    
    // Step 6: Start input tracking
    trackInputs();
    
    // Step 7: Start inactivity monitoring
    startInactivityTimer();
    
    // Step 8: Set up activity listeners
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    console.log('✅ DRAE Analytics initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize DRAE Analytics:', error);
  }
}

// Export types for external use
export type { VisitorInfo, ClickEventData, InputEventData, DiscordPayload };

console.log('📊 DRAE Analytics loaded and ready!');