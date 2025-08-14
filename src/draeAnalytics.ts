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

/**
 * Create and inject CSS styles for the widget
 */
function injectWidgetStyles(): void {
  if (document.getElementById('drae-widget-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'drae-widget-styles';
  style.textContent = `
    .drae-widget {
      position: fixed;
      top: 0;
      right: 0;
      z-index: ${CONFIG.WIDGET_Z_INDEX};
      background: #000000;
      color: #ffffff;
      padding: 6px 8px;
      border-radius: 0 0 0 8px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(12px);
      border: 1px solid #333333;
      border-top: none;
      border-right: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      min-width: 120px;
    }
    
    .drae-label-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    
    .drae-tag-icon {
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .drae-label-text {
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.025em;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .drae-status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.3s ease;
    }
    
    .drae-status-indicator.editable {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
    
    .drae-status-indicator.locked {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    }
    
    .drae-edit-btn {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .drae-edit-btn:hover:not(:disabled) {
      background: rgba(156, 163, 175, 0.1);
      color: #ffffff;
      transform: scale(1.05);
    }
    
    .drae-edit-btn:disabled {
      color: #4b5563;
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    .drae-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${CONFIG.MODAL_Z_INDEX};
      animation: fadeIn ${CONFIG.ANIMATION_DURATION_FAST}s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .drae-modal-content {
      background: #1a1a1a;
      padding: 32px;
      border-radius: 16px;
      border: 1px solid #333;
      max-width: 450px;
      width: 90%;
      color: #ffffff;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    }
    
    .drae-modal h3 {
      margin: 0 0 24px 0;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .drae-modal-icon {
      width: 24px;
      height: 24px;
      color: #10b981;
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
  `;
  
  document.head.appendChild(style);
}

/**
 * Create the device label widget UI
 */
function createDeviceLabelWidget(): void {
  if (deviceLabelWidget) return;
  
  // Check if widget has been permanently hidden
  const isWidgetHidden = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}widget_hidden`) === 'true';
  if (isWidgetHidden) return;
  
  injectWidgetStyles();
  
  const currentLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  const hasChanged = hasLabelBeenChanged();
  
  deviceLabelWidget = document.createElement('div');
  deviceLabelWidget.className = 'drae-widget';
  deviceLabelWidget.innerHTML = `
    <div class="drae-label-container">
      <div class="drae-tag-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path fill="currentColor" d="M19.459,1.572 C20.208,1.744 20.966,2.025 21.471,2.529 C21.975,3.034 22.256,3.792 22.428,4.54 C22.605,5.314 22.693,6.199 22.729,7.069 C22.801,8.812 22.672,10.592 22.588,11.502 C22.536,12.07 22.303,12.595 21.941,13.017 C19.231,16.169 16.423,19.039 13.356,21.785 C11.953,23.041 9.858,23.054 8.397,21.923 C5.987,20.057 3.943,18.013 2.077,15.603 C0.946,14.142 0.959,12.047 2.215,10.644 C4.961,7.577 7.831,4.769 10.983,2.059 C11.405,1.696 11.93,1.464 12.498,1.412 C13.408,1.328 15.188,1.199 16.931,1.271 C17.801,1.307 18.686,1.394 19.459,1.572 Z M16.869,2.77 C15.224,2.702 13.521,2.824 12.635,2.906 C12.391,2.928 12.157,3.028 11.961,3.197 C8.857,5.864 6.034,8.627 3.333,11.644 C2.583,12.482 2.553,13.767 3.263,14.684 C5.051,16.994 7.006,18.949 9.315,20.737 C10.233,21.447 11.518,21.417 12.356,20.667 C15.373,17.965 18.136,15.143 20.803,12.039 C20.972,11.843 21.072,11.609 21.094,11.365 C21.176,10.479 21.298,8.776 21.23,7.131 C21.196,6.308 21.115,5.524 20.966,4.876 C20.811,4.204 20.608,3.788 20.41,3.59 C20.212,3.392 19.796,3.188 19.124,3.034 C18.476,2.885 17.692,2.804 16.869,2.77 Z M15.25,6.5 C15.25,5.258 16.257,4.25 17.5,4.25 C18.743,4.25 19.75,5.258 19.75,6.5 C19.75,7.743 18.743,8.75 17.5,8.75 C16.257,8.75 15.25,7.743 15.25,6.5 Z M7.53,13.47 L10.53,16.47 C10.823,16.763 10.823,17.238 10.53,17.531 C10.237,17.823 9.763,17.823 9.47,17.531 L6.47,14.531 C6.177,14.238 6.177,13.763 6.47,13.47 C6.763,13.177 7.237,13.177 7.53,13.47 Z M17.5,7.25 C17.914,7.25 18.25,6.914 18.25,6.5 C18.25,6.086 17.914,5.75 17.5,5.75 C17.086,5.75 16.75,6.086 16.75,6.5 C16.75,6.914 17.086,7.25 17.5,7.25 Z" />
        </svg>
      </div>
      <span class="drae-label-text">${currentLabel}</span>
      <div class="drae-status-indicator ${hasChanged ? 'locked' : 'editable'}"></div>
    </div>
    ${!hasChanged ? `<button class="drae-edit-btn" title="Edit label">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.34244 21.7411H3.00244C2.59244 21.7411 2.25244 21.4011 2.25244 20.9911V18.6511C2.25244 17.7611 2.25244 17.2711 2.46244 16.7711C2.67244 16.2711 3.01244 15.931 3.63244 15.311L13.9134 5.0301C13.9315 5.00702 13.9512 4.9848 13.9724 4.96359C13.9936 4.94239 14.0158 4.92273 14.0389 4.90463L15.4124 3.53109C15.9424 3.00109 16.2324 2.72109 16.6224 2.53109C17.3724 2.15109 18.2924 2.15109 19.0524 2.53109C19.4324 2.71109 19.7224 3.00108 20.2524 3.53107L20.2524 3.53109L20.3524 3.63107C20.9524 4.23107 21.2624 4.55101 21.4624 4.94101C21.8424 5.71101 21.8424 6.62108 21.4624 7.39108C21.2524 7.80108 20.9224 8.14102 20.3524 8.70102L19.0593 9.99529C19.0506 10.0049 19.0416 10.0144 19.0324 10.0237C19.023 10.0331 19.0134 10.0422 19.0036 10.051L8.70244 20.361L8.64488 20.4186L8.64487 20.4186C8.05127 21.0125 7.71669 21.3473 7.22244 21.5411C6.72253 21.7511 6.23262 21.7511 5.34292 21.7511H5.34244V21.7411ZM17.4461 9.4974L7.64244 19.3011L7.58935 19.3532C7.09614 19.8373 6.86496 20.0641 6.65244 20.1511C6.43253 20.2411 6.11268 20.2411 5.34332 20.2411H5.34244H3.76244V18.6711V18.671C3.76244 17.9011 3.76244 17.581 3.85244 17.361C3.93917 17.1587 4.16519 16.9285 4.65579 16.4288L4.6558 16.4288L4.71244 16.3711L14.5161 6.56738L17.4461 9.4974ZM18.5062 8.43737L19.3024 7.64108C19.7524 7.19108 20.0324 6.91104 20.1224 6.72104C20.2924 6.38103 20.2924 5.96105 20.1224 5.61105C20.0324 5.44105 19.7724 5.17105 19.3324 4.73105L19.2024 4.60104C19.146 4.54601 19.0924 4.49349 19.0416 4.4437L19.0413 4.44336C18.7418 4.14957 18.5392 3.95092 18.4024 3.89108C18.0424 3.71108 17.6324 3.71108 17.2824 3.89108C17.1124 3.97108 16.8524 4.22105 16.4724 4.61105L15.5761 5.50735L18.5062 8.43737ZM18.0024 21.7422H12.0024C11.5924 21.7422 11.2524 21.4022 11.2524 20.9922C11.2524 20.5822 11.5924 20.2422 12.0024 20.2422H18.0024C18.4124 20.2422 18.7524 20.5822 18.7524 20.9922C18.7524 21.4022 18.4124 21.7422 18.0024 21.7422Z" fill="currentColor" />
      </svg>
    </button>` : ''}
  `;
  
  const editBtn = deviceLabelWidget.querySelector('.drae-edit-btn') as HTMLButtonElement;
  if (editBtn && !hasChanged) {
    editBtn.addEventListener('click', openLabelEditModal);
  }
  
  document.body.appendChild(deviceLabelWidget);
  
  // Auto-hide widget after 10 seconds and mark as permanently hidden
  setTimeout(() => {
    if (deviceLabelWidget) {
      deviceLabelWidget.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      deviceLabelWidget.style.opacity = '0';
      deviceLabelWidget.style.transform = 'translateY(-100%)';
      
      setTimeout(() => {
        if (deviceLabelWidget && deviceLabelWidget.parentNode) {
          deviceLabelWidget.parentNode.removeChild(deviceLabelWidget);
          deviceLabelWidget = null;
        }
        // Mark widget as permanently hidden
        localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}widget_hidden`, 'true');
      }, 500);
    }
  }, 10000);
}

/**
 * Update the widget display with new label
 */
function updateWidgetLabel(newLabel: string): void {
  if (!deviceLabelWidget) return;
  
  const span = deviceLabelWidget.querySelector('span');
  const editBtn = deviceLabelWidget.querySelector('.drae-edit-btn') as HTMLButtonElement;
  
  if (span) {
    span.textContent = newLabel;
  }
  
  // Remove edit button completely
  if (editBtn) {
    editBtn.remove();
  }
  
  // Update status indicator
  const statusIndicator = deviceLabelWidget.querySelector('.drae-status-indicator');
  if (statusIndicator) {
    statusIndicator.className = 'drae-status-indicator locked';
  }
  
  // Gradually fade out and remove the widget after label change
  setTimeout(() => {
    if (deviceLabelWidget) {
      deviceLabelWidget.style.transition = 'opacity 2s ease-out, transform 2s ease-out';
      deviceLabelWidget.style.opacity = '0';
      deviceLabelWidget.style.transform = 'translateX(100%)';
      
      // Remove widget completely after fade out
      setTimeout(() => {
        if (deviceLabelWidget && deviceLabelWidget.parentNode) {
          deviceLabelWidget.parentNode.removeChild(deviceLabelWidget);
          deviceLabelWidget = null;
        }
      }, 2000);
    }
  }, 3000); // Wait 3 seconds before starting fade out
}

/**
 * Open the label edit modal
 */
function openLabelEditModal(): void {
  if (labelEditModal || hasLabelBeenChanged()) return;
  
  const currentLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  labelEditModal = document.createElement('div');
  labelEditModal.className = 'drae-modal';
  labelEditModal.innerHTML = `
    <div class="drae-modal-content">
      <h3>
        <svg class="drae-modal-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5.34244 21.7411H3.00244C2.59244 21.7411 2.25244 21.4011 2.25244 20.9911V18.6511C2.25244 17.7611 2.25244 17.2711 2.46244 16.7711C2.67244 16.2711 3.01244 15.931 3.63244 15.311L13.9134 5.0301C13.9315 5.00702 13.9512 4.9848 13.9724 4.96359C13.9936 4.94239 14.0158 4.92273 14.0389 4.90463L15.4124 3.53109C15.9424 3.00109 16.2324 2.72109 16.6224 2.53109C17.3724 2.15109 18.2924 2.15109 19.0524 2.53109C19.4324 2.71109 19.7224 3.00108 20.2524 3.53107L20.2524 3.53109L20.3524 3.63107C20.9524 4.23107 21.2624 4.55101 21.4624 4.94101C21.8424 5.71101 21.8424 6.62108 21.4624 7.39108C21.2524 7.80108 20.9224 8.14102 20.3524 8.70102L19.0593 9.99529C19.0506 10.0049 19.0416 10.0144 19.0324 10.0237C19.023 10.0331 19.0134 10.0422 19.0036 10.051L8.70244 20.361L8.64488 20.4186L8.64487 20.4186C8.05127 21.0125 7.71669 21.3473 7.22244 21.5411C6.72253 21.7511 6.23262 21.7511 5.34292 21.7511H5.34244V21.7411ZM17.4461 9.4974L7.64244 19.3011L7.58935 19.3532C7.09614 19.8373 6.86496 20.0641 6.65244 20.1511C6.43253 20.2411 6.11268 20.2411 5.34332 20.2411H5.34244H3.76244V18.6711V18.671C3.76244 17.9011 3.76244 17.581 3.85244 17.361C3.93917 17.1587 4.16519 16.9285 4.65579 16.4288L4.6558 16.4288L4.71244 16.3711L14.5161 6.56738L17.4461 9.4974ZM18.5062 8.43737L19.3024 7.64108C19.7524 7.19108 20.0324 6.91104 20.1224 6.72104C20.2924 6.38103 20.2924 5.96105 20.1224 5.61105C20.0324 5.44105 19.7724 5.17105 19.3324 4.73105L19.2024 4.60104C19.146 4.54601 19.0924 4.49349 19.0416 4.4437L19.0413 4.44336C18.7418 4.14957 18.5392 3.95092 18.4024 3.89108C18.0424 3.71108 17.6324 3.71108 17.2824 3.89108C17.1124 3.97108 16.8524 4.22105 16.4724 4.61105L15.5761 5.50735L18.5062 8.43737ZM18.0024 21.7422H12.0024C11.5924 21.7422 11.2524 21.4022 11.2524 20.9922C11.2524 20.5822 11.5924 20.2422 12.0024 20.2422H18.0024C18.4124 20.2422 18.7524 20.5822 18.7524 20.9922C18.7524 21.4022 18.4124 21.7422 18.0024 21.7422Z" fill="currentColor" />
        </svg>
        Edit Device Label
      </h3>
      <div class="drae-warning">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        You can only change your label ${CONFIG.MAX_LABEL_CHANGES} time${CONFIG.MAX_LABEL_CHANGES > 1 ? 's' : ''}! Choose wisely.
      </div>
      <div class="drae-suggestions">
        <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 13px;">💡 <strong>Ideas for your username:</strong> Your Instagram handle, class codename, nickname, surname, gaming tag, or anything that represents you!</p>
      </div>
      <input type="text" id="drae-new-label" value="${currentLabel}" maxlength="${CONFIG.MAX_LABEL_CHARACTERS}" placeholder="Enter new label...">
      <div class="drae-char-counter">
        <span id="drae-char-count">0</span>/${CONFIG.MAX_LABEL_CHARACTERS} characters
      </div>
      <div class="drae-modal-buttons">
        <button class="drae-modal-btn secondary" onclick="window.draeCloseLabelModal()">Cancel</button>
        <button class="drae-modal-btn primary" id="drae-save-btn" onclick="window.draeSaveLabel()">Save Label</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(labelEditModal);
  
  // Focus the input
  const input = labelEditModal.querySelector('#drae-new-label') as HTMLInputElement;
  const charCounter = labelEditModal.querySelector('#drae-char-count') as HTMLSpanElement;
  const saveBtn = labelEditModal.querySelector('#drae-save-btn') as HTMLButtonElement;
  
  input.focus();
  input.select();
  
  // Update character counter
  const updateCharCounter = () => {
    const count = input.value.length;
    charCounter.textContent = count.toString();
    
    const counterElement = charCounter.parentElement!;
    counterElement.className = 'drae-char-counter';
    
    if (count >= CONFIG.MAX_LABEL_CHARACTERS - CONFIG.CHAR_COUNTER_ERROR_OFFSET) {
      counterElement.classList.add('error');
    } else if (count >= CONFIG.MAX_LABEL_CHARACTERS - CONFIG.CHAR_COUNTER_WARNING_OFFSET) {
      counterElement.classList.add('warning');
    }
    
    // Disable save button if too long or too short
    saveBtn.disabled = count < CONFIG.MIN_LABEL_CHARACTERS || count > CONFIG.MAX_LABEL_CHARACTERS;
  };
  
  // Initial counter update
  updateCharCounter();
  
  // Handle input changes
  input.addEventListener('input', updateCharCounter);
  
  // Handle Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !saveBtn.disabled) {
      window.draeSaveLabel();
    }
  });
  
  // Handle Escape key
  document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Handle escape key to close modal
 */
function handleEscapeKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && labelEditModal) {
    window.draeCloseLabelModal();
  }
}

/**
 * Close the label edit modal
 */
function closeLabelModal(): void {
  if (labelEditModal) {
    document.removeEventListener('keydown', handleEscapeKey);
    document.body.removeChild(labelEditModal);
    labelEditModal = null;
  }
}

/**
 * Save the new label
 */
async function saveNewLabel(): Promise<void> {
  if (!labelEditModal || hasLabelBeenChanged()) return;
  
  const input = labelEditModal.querySelector('#drae-new-label') as HTMLInputElement;
  const newLabel = input.value.trim();
  
  if (!newLabel || newLabel.length < 3) {
    alert('Label must be at least 3 characters long');
    return;
  }
  
  if (newLabel.length > 25) {
    alert('Label must be 25 characters or less');
    return;
  }
  
  const oldLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  if (newLabel === oldLabel) {
    closeLabelModal();
    return;
  }
  
  // Update localStorage
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, newLabel);
  markLabelAsChanged();
  
  // Update UI
  updateWidgetLabel(newLabel);
  closeLabelModal();
  
  // Send notification to Discord
  await sendLabelChangeToDiscord(oldLabel, newLabel);
}

// Make functions globally available for onclick handlers
declare global {
  interface Window {
    draeCloseLabelModal: () => void;
    draeSaveLabel: () => Promise<void>;
  }
}

window.draeCloseLabelModal = closeLabelModal;
window.draeSaveLabel = saveNewLabel;

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
        { name: '🕒 First Seen', value: info.visitCount === 1 ? 'Just now' : info.firstSeen, inline: true },
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