/**
 * 🚀 DRAE ANALYTICS - Ultimate Visitor Tracking System (JavaScript Version)
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
 * - 🔒 No 3rd-party dependencies, JavaScript only
 * - 💬 Discord webhook integration only
 * - 🏷️ Device label widget with one-time edit capability
 * 
 * Usage: Import this file once in your main script
 * import { initAnalytics } from './analytics/draeAnalytics.js';
 * initAnalytics('YOUR_DISCORD_WEBHOOK_URL');
 */

// =============================================================================
// 🔧 CONFIGURATION
// =============================================================================

class DraeAnalyticsConfig {
  constructor(webhookUrl) {
    this.DISCORD_WEBHOOK_URL = webhookUrl;
    this.CLICK_RATE_LIMIT = 500; // milliseconds between click events
    this.INPUT_RATE_LIMIT = 2000; // milliseconds between input events
    this.INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds
    this.LOCAL_STORAGE_PREFIX = 'drae_';
    this.MAX_LABEL_CHANGES = 1; // how many times users can change their username
    this.MAX_LABEL_CHARACTERS = 25; // maximum characters allowed in username
    this.MIN_LABEL_CHARACTERS = 3; // minimum characters required for username
    this.INCOGNITO_STORAGE_THRESHOLD = 120000000; // storage quota threshold for incognito detection
    this.MAX_SANITIZED_TEXT_LENGTH = 100; // maximum length for sanitized text
    this.LABEL_NUMBER_MAX = 999; // maximum random number for label generation
    this.WIDGET_Z_INDEX = 9999; // z-index for the widget
    this.MODAL_Z_INDEX = 10000; // z-index for the modal
    this.CHAR_COUNTER_ERROR_OFFSET = 2; // characters before max to show error
    this.CHAR_COUNTER_WARNING_OFFSET = 7; // characters before max to show warning
    this.ANIMATION_DURATION_FAST = 0.2; // fast animation duration in seconds
    this.ANIMATION_DURATION_NORMAL = 0.3; // normal animation duration in seconds
    this.COLORS = {
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
    this.PRIORITY = {
      HIGH: ['visitor', 'session_start', 'page_exit', 'input_important'],
      MEDIUM: ['route_change', 'click_important', 'input_normal'],
      LOW: ['click_normal', 'inactivity']
    };
  }
}

// =============================================================================
// 🎯 GLOBAL STATE
// =============================================================================

let CONFIG;
let lastClickTime = 0;
let lastInputTime = 0;
let inactivityTimer = null;
let isUserActive = true;
let mutationObserver = null;
let sessionStartTime = Date.now();
let currentRoute = window.location.pathname;
let userJourney = [];
let eventQueue = [];

// Device label widget state
let deviceLabelWidget = null;
let labelEditModal = null;

// Track input focus times for calculating interaction duration
let inputFocusTimes = new Map();

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
function hasLabelBeenChanged() {
  const changes = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`) || '0');
  return changes >= CONFIG.MAX_LABEL_CHANGES;
}

/**
 * Mark label as changed and increment counter
 */
function markLabelAsChanged() {
  const changes = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`) || '0');
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changes`, (changes + 1).toString());
  // Keep legacy flag for backward compatibility
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}label_changed`, 'true');
}

/**
 * Send label change notification to Discord
 */
async function sendLabelChangeToDiscord(oldLabel, newLabel) {
  const payload = {
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
function injectWidgetStyles() {
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
      animation: fadeInBackdrop 0.3s ease-out;
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
      animation: fadeInBlur 0.3s ease-out;
    }
    
    @keyframes fadeInBackdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInBlur {
      from { backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
      to { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    }
    
    .drae-arrow-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${CONFIG.WIDGET_Z_INDEX + 1};
      pointer-events: none;
      width: 0;
      height: 0;
    }
    
    .drae-arrow {
      position: absolute;
      font-size: 28px;
      color: #10b981;
      animation: elegantOrbit 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
      filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4));
      will-change: transform, opacity;
    }
    
    @keyframes elegantOrbit {
      0% { 
        transform: translate(0, -80px) rotate(0deg) scale(0.8);
        opacity: 0.4;
      }
      15% { 
        transform: translate(40px, -60px) rotate(45deg) scale(1);
        opacity: 0.8;
      }
      25% { 
        transform: translate(80px, 0) rotate(90deg) scale(1.1);
        opacity: 1;
      }
      35% { 
        transform: translate(60px, 40px) rotate(135deg) scale(1);
        opacity: 0.8;
      }
      50% { 
        transform: translate(0, 80px) rotate(180deg) scale(0.8);
        opacity: 0.4;
      }
      65% { 
        transform: translate(-40px, 60px) rotate(225deg) scale(1);
        opacity: 0.8;
      }
      75% { 
        transform: translate(-80px, 0) rotate(270deg) scale(1.1);
        opacity: 1;
      }
      85% { 
        transform: translate(-60px, -40px) rotate(315deg) scale(1);
        opacity: 0.8;
      }
      100% { 
        transform: translate(0, -80px) rotate(360deg) scale(0.8);
        opacity: 0.4;
      }
    }
    
    .drae-arrow:nth-child(1) {
      animation-delay: 0s;
      color: #10b981;
    }
    
    .drae-arrow:nth-child(2) {
      animation-delay: 1s;
      color: #3b82f6;
    }
    
    .drae-arrow:nth-child(3) {
      animation-delay: 2s;
      color: #8b5cf6;
    }
    
    .drae-arrow:nth-child(4) {
      animation-delay: 3s;
      color: #f59e0b;
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
      animation: pulseWidget 2s infinite;
      pointer-events: auto;
    }
    
    .drae-widget.with-arrows {
      animation: pulseWidget 2s infinite, breathe 3s ease-in-out infinite;
    }
    
    @keyframes breathe {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
    }
    
    @keyframes pulseWidget {
      0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 0 rgba(16, 185, 129, 0.7); }
      50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(16, 185, 129, 0); }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Format date to human readable format with timezone and relative time
 */
function formatHumanDate(dateString) {
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

/**
 * Send to Discord with error handling
 */
async function sendToDiscord(payload) {
  try {
    const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Failed to send to Discord:', error);
  }
}

/**
 * Create a simple visitor hash
 */
function createVisitorHash() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a friendly visitor label
 */
function generateFriendlyLabel() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * CONFIG.LABEL_NUMBER_MAX) + 1;
  return `${adjective}${animal}-${number}`;
}

/**
 * Initialize visitor tracking
 */
function initializeVisitor() {
  const hash = createVisitorHash();
  const storageKey = `${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`;
  const visitCountKey = `${CONFIG.LOCAL_STORAGE_PREFIX}visit_count`;
  const firstSeenKey = `${CONFIG.LOCAL_STORAGE_PREFIX}first_seen`;
  
  let label = localStorage.getItem(storageKey);
  let visitCount = parseInt(localStorage.getItem(visitCountKey) || '0');
  let firstSeen = localStorage.getItem(firstSeenKey);
  
  const isFirstVisit = !label;
  
  if (isFirstVisit) {
    label = generateFriendlyLabel();
    localStorage.setItem(storageKey, label);
    localStorage.setItem(firstSeenKey, new Date().toISOString());
    visitCount = 1;
  } else {
    visitCount++;
  }
  
  localStorage.setItem(visitCountKey, visitCount.toString());
  
  const isIncognito = detectIncognito();
  const visitorType = isFirstVisit ? 'new' : 'returning';
  const browserEmoji = getBrowserEmoji();
  const deviceType = getDeviceType();
  
  const visitorInfo = {
    hash,
    label,
    visitCount,
    firstSeen: firstSeen || new Date().toISOString(),
    isIncognito,
    visitorType,
    browserEmoji,
    deviceType
  };
  
  // Send visitor info to Discord
  sendVisitorInfoToDiscord(visitorInfo);
  
  return visitorInfo;
}

/**
 * Detect incognito mode
 */
function detectIncognito() {
  try {
    // Simple incognito detection
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({quota}) => {
        return quota < CONFIG.INCOGNITO_STORAGE_THRESHOLD;
      });
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get browser emoji
 */
function getBrowserEmoji() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return '🦊';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return '🧭';
  if (userAgent.includes('edge')) return '📘';
  if (userAgent.includes('opera')) return '🎭';
  if (userAgent.includes('chrome')) return '🌐';
  
  return '🌍';
}

/**
 * Get device type
 */
function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad/.test(userAgent)) return '📟 Tablet';
  if (/mobile|android|iphone/.test(userAgent)) return '📱 Mobile';
  
  return '💻 Desktop';
}

/**
 * Send visitor info to Discord
 */
async function sendVisitorInfoToDiscord(info) {
  const typeEmoji = info.visitorType === 'new' ? '🆕' : '🔄';
  const incognitoText = info.isIncognito ? '✅ Yes' : '❌ No';
  
  const visitorColor = info.visitorType === 'new' ? 
    CONFIG.COLORS.VISITOR_NEW : 
    CONFIG.COLORS.VISITOR_RETURNING;
  
  const payload = {
    embeds: [{
      title: `${typeEmoji} ${info.visitorType.charAt(0).toUpperCase() + info.visitorType.slice(1)} Visitor: \\\`${info.label}\\\``,
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

/**
 * Create device label widget
 */
function createDeviceLabelWidget() {
  if (deviceLabelWidget) return;
  
  const hasChanged = hasLabelBeenChanged();
  if (hasChanged) return;
  
  injectWidgetStyles();
  
  // Create blur layer
  const blurDiv = document.createElement('div');
  blurDiv.className = 'drae-content-blur';
  document.body.appendChild(blurDiv);
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'drae-widget-backdrop';
  document.body.appendChild(backdrop);
  
  // Create arrow container with varied arrows
  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'drae-arrow-container';
  arrowContainer.innerHTML = `
    <div class="drae-arrow">➤</div>
    <div class="drae-arrow">▲</div>
    <div class="drae-arrow">●</div>
    <div class="drae-arrow">✦</div>
  `;
  document.body.appendChild(arrowContainer);
  
  const currentLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`) || 'Unknown';
  
  deviceLabelWidget = document.createElement('div');
  deviceLabelWidget.className = 'drae-widget with-arrows';
  deviceLabelWidget.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
      <div style="color: #9ca3af;">🏷️</div>
      <div style="display: flex; flex-direction: column; flex: 1;">
        <span style="color: #ffffff; font-weight: 600;">${currentLabel}</span>
        <span style="font-size: 10px; color: #6b7280;">Edit this to remove widget</span>
      </div>
      <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);"></div>
    </div>
    <button onclick="window.draeOpenModal()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 6px; border-radius: 6px;">
      ✏️
    </button>
  `;
  
  document.body.appendChild(deviceLabelWidget);
  
  deviceLabelWidget.backdrop = backdrop;
  deviceLabelWidget.blurDiv = blurDiv;
  deviceLabelWidget.arrowContainer = arrowContainer;
}

/**
 * Initialize the analytics system
 */
function initAnalytics(webhookUrl) {
  if (!webhookUrl) {
    console.error('DRAE Analytics: Discord webhook URL is required');
    return;
  }
  
  CONFIG = new DraeAnalyticsConfig(webhookUrl);
  
  // Initialize visitor tracking
  const visitorInfo = initializeVisitor();
  
  // Create device label widget
  createDeviceLabelWidget();
  
  // Set up global functions
  window.draeOpenModal = function() {
    // Simple modal implementation would go here
    const newLabel = prompt('Enter new label (3-25 characters):');
    if (newLabel && newLabel.length >= 3 && newLabel.length <= 25) {
      const oldLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`);
      localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, newLabel);
      markLabelAsChanged();
      sendLabelChangeToDiscord(oldLabel, newLabel);
      
      // Remove widget
      if (deviceLabelWidget) {
        deviceLabelWidget.remove();
        deviceLabelWidget.backdrop?.remove();
        deviceLabelWidget.blurDiv?.remove();
        deviceLabelWidget.arrowContainer?.remove();
        deviceLabelWidget = null;
      }
    }
  };
  
  console.log('🚀 DRAE Analytics initialized successfully!');
  console.log(`👤 Visitor: ${visitorInfo.label}`);
  console.log(`📊 Visit #${visitorInfo.visitCount}`);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initAnalytics };
} else if (typeof window !== 'undefined') {
  window.draeAnalytics = { initAnalytics };
}
