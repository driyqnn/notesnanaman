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
 * - 💬 Discord webhook integration with dynamic payloads
 * - 🎓 Academic survey modal for device labeling
 * - 🎯 Smart rate limiting with queue management
 * - 🧹 Memory leak prevention with proper cleanup
 * - 🎨 Real-time user journey visualization
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

interface FileClickEventData {
  fileName: string;
  fileExtension: string;
  elementText: string;
  elementId: string;
  elementClass: string;
  timestamp: string;
  url: string;
  visitorLabel: string;
}

interface TabEventData {
  eventType: 'tab_switch' | 'browser_exit' | 'page_focus' | 'page_blur';
  timestamp: string;
  url: string;
  visitorLabel: string;
  timeOnPage?: number;
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
    footer?: {
      text: string;
      icon_url?: string;
    };
    thumbnail?: {
      url: string;
    };
    author?: {
      name: string;
      icon_url?: string;
    };
  }>;
}

interface SessionSummaryData {
  sessionId: string;
  sessionDuration: number;
  totalTimeAllVisits: number;
  totalVisits: number;
  referrerSource: string;
  weeklyVisitCount: number;
  monthlyVisitCount: number;
  isEndOfMonth: boolean;
  daysSinceLastVisit: number;
  lastVisitTimestamp: string | null;
  currentVisitTimestamp: string;
  firstVisitTimestamp: string;
}

interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalClicks: number;
  totalInputs: number;
  pagesVisited: string[];
  timeSpentPerPage: Record<string, number>;
  scrollDepth: Record<string, number>;
  batteryLevel?: number;
  connectionType?: string;
  screenResolution: string;
  viewport: string;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  timezone: string;
  language: string;
  userAgent: string;
  referrer: string;
  performanceMetrics: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
}

// =============================================================================
// 🔧 CONFIGURATION
// =============================================================================

class DraeAnalyticsConfig {
  public DISCORD_WEBHOOK_URL: string = '';
  public DEBUG_MODE: boolean = false; // Enable debug logging
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
    LABEL_CHANGE: 0xf39c12,      // Orange for label changes
    FILE_CLICK: 0x2ecc71,        // Green for file interactions
    TAB_SWITCH: 0xe67e22,        // Orange for tab switches
    BROWSER_EXIT: 0x95a5a6       // Gray for browser exits
  };
  public readonly PRIORITY = {
    HIGH: ['visitor', 'session_start', 'page_exit', 'input_important'],
    MEDIUM: ['route_change', 'click_important', 'input_normal'],
    LOW: ['click_normal', 'inactivity']
  };

  constructor(webhookUrl: string, debugMode: boolean = false) {
    this.DISCORD_WEBHOOK_URL = webhookUrl;
    this.DEBUG_MODE = debugMode;
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
let retryQueue: Array<{payload: DiscordPayload, retryCount: number}> = [];
let cleanupFunctions: Array<() => void> = [];

// Tab/Page visibility tracking
let pageLoadTime = Date.now();
let isPageVisible = !document.hidden;

// Survey modal state
let surveyModal: HTMLElement | null = null;

// Track input focus times for calculating interaction duration
let inputFocusTimes: Map<Element, number> = new Map();

// Session Analytics Tracking
let sessionAnalytics: SessionAnalytics = {
  sessionId: generateSessionId(),
  startTime: Date.now(),
  totalClicks: 0,
  totalInputs: 0,
  pagesVisited: [],
  timeSpentPerPage: {},
  scrollDepth: {},
  screenResolution: `${screen.width}x${screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  userAgent: navigator.userAgent,
  referrer: document.referrer,
  performanceMetrics: {
    loadTime: 0,
    domContentLoaded: 0
  }
};

// Track blur activities for session end logic
let blurActivityCount = 0;

let maxScrollDepth = 0;
let pageStartTime = Date.now();
let activityLog: Array<{type: string, timestamp: string, details: string}> = [];

// Dashboard update interval
let dashboardUpdateInterval: NodeJS.Timeout | null = null;

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
// 🎓 ACADEMIC SURVEY MODAL
// =============================================================================

// Academic programs mapping
const ACADEMIC_PROGRAMS = {
  'civil': 'BSCE',
  'mechanical': 'BSME', 
  'electrical': 'BSEE',
  'architecture': 'BSARCH'
};

// Year levels mapping
const YEAR_LEVELS = {
  'first': '1ST YEAR',
  'second': '2ND YEAR',
  'third': '3RD YEAR',
  'fourth': '4TH YEAR',
  'fifth': '5TH YEAR'
};

/**
 * Debug logging utility - controls ALL console output based on debug mode
 */
function debugLog(message: string, data?: any): void {
  if (CONFIG?.DEBUG_MODE) {
    console.log(`[DRAE DEBUG] ${message}`, data || '');
  }
}

/**
 * Info logging utility - completely controlled by debug mode
 */
function infoLog(message: string, data?: any): void {
  if (CONFIG?.DEBUG_MODE) {
    console.info(`[DRAE INFO] ${message}`, data || '');
  }
}

/**
 * Warning logging utility - completely controlled by debug mode
 */
function warnLog(message: string, data?: any): void {
  if (CONFIG?.DEBUG_MODE) {
    console.warn(`[DRAE WARN] ${message}`, data || '');
  }
}

/**
 * Error logging utility - completely controlled by debug mode
 */
function errorLog(message: string, data?: any): void {
  if (CONFIG?.DEBUG_MODE) {
    console.error(`[DRAE ERROR] ${message}`, data || '');
  }
}

/**
 * Format timestamp to ISO 8601 format for Discord (with Philippine timezone info)
 */
function formatToDiscordTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format timestamp to Philippine timezone for display only
 */
function formatToPhilippineTime(date: Date = new Date()): string {
  const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for PH timezone
  return phTime.toISOString().replace('T', ' ').substring(0, 19) + ' PHT';
}

/**
 * Format date to "Sep 06, 2025 at 6:21:11 PM" format
 */
function formatToReadableDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date).replace(/,/g, ' at').replace(/  /g, ' ');
}

/**
 * Generate a unique session ID with max 7 characters
 */
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if current date is end of month
 */
function isEndOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return today.getMonth() !== tomorrow.getMonth();
}

/**
 * Get visit counts for time periods
 */
function getVisitCounts(): { weekly: number; monthly: number } {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const visitHistory = JSON.parse(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_history`) || '[]');
  
  const weeklyCount = visitHistory.filter((timestamp: string) => new Date(timestamp) >= weekAgo).length;
  const monthlyCount = visitHistory.filter((timestamp: string) => new Date(timestamp) >= monthAgo).length;
  
  return { weekly: weeklyCount, monthly: monthlyCount };
}

/**
 * Update visit history in localStorage
 */
function updateVisitHistory(): void {
  const now = new Date().toISOString();
  const visitHistory = JSON.parse(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_history`) || '[]');
  visitHistory.push(now);
  
  // Keep only last 90 days of visits
  const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
  const filteredHistory = visitHistory.filter((timestamp: string) => new Date(timestamp) >= ninetyDaysAgo);
  
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visit_history`, JSON.stringify(filteredHistory));
}

/**
 * Send session summary to Discord webhook
 */
async function sendSessionSummaryToDiscord(summaryData: SessionSummaryData): Promise<void> {
  const deviceLabel = getDeviceLabel();
  
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTotalTime = (ms: number): string => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const payload: DiscordPayload = {
    embeds: [{
      title: '📊 Session Summary',
      description: `**${deviceLabel}** session ended`,
      color: CONFIG.COLORS.SESSION_END,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '🆔 Session ID', value: summaryData.sessionId, inline: true },
        { name: '⏱️ Session Duration', value: formatDuration(summaryData.sessionDuration), inline: true },
        { name: '🕐 Total Time (All Visits)', value: formatTotalTime(summaryData.totalTimeAllVisits), inline: true },
        { name: '🔢 Total Visits', value: summaryData.totalVisits.toString(), inline: true },
        { name: '📅 Weekly Visits', value: summaryData.weeklyVisitCount.toString(), inline: true },
        { name: '📅 Monthly Visits', value: summaryData.monthlyVisitCount.toString(), inline: true },
        { name: '🌐 Referrer', value: summaryData.referrerSource || 'Direct', inline: true },
        { name: '📊 Days Since Last Visit', value: summaryData.daysSinceLastVisit.toString(), inline: true },
        { name: '🗓️ End of Month?', value: summaryData.isEndOfMonth ? 'Yes' : 'No', inline: true },
        { name: '⏮️ Last Visit', value: summaryData.lastVisitTimestamp ? formatToReadableDate(new Date(summaryData.lastVisitTimestamp)) : 'First visit', inline: false },
        { name: '⏭️ Current Visit', value: formatToReadableDate(new Date(summaryData.currentVisitTimestamp)), inline: false },
        { name: '🏁 First Visit', value: formatToReadableDate(new Date(summaryData.firstVisitTimestamp)), inline: false }
      ]
    }]
  };

  await sendToDiscord(payload);
}

/**
 * End current session and send summary
 */
async function endSession(): Promise<void> {
  const endTime = Date.now();
  const sessionDuration = endTime - sessionAnalytics.startTime;
  
  // Get stored data
  const existingInfo = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_info`);
  const lastVisit = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}last_visit`);
  const totalSessionTime = parseInt(localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}total_session_time`) || '0');
  
  if (!existingInfo) return;
  
  const visitorInfo = JSON.parse(existingInfo);
  const visitCounts = getVisitCounts();
  const currentVisit = new Date().toISOString();
  
  let daysSinceLastVisit = 0;
  if (lastVisit) {
    daysSinceLastVisit = daysBetween(new Date(lastVisit), new Date(currentVisit));
  }

  const summaryData: SessionSummaryData = {
    sessionId: sessionAnalytics.sessionId,
    sessionDuration,
    totalTimeAllVisits: totalSessionTime + sessionDuration,
    totalVisits: visitorInfo.visitCount,
    referrerSource: sessionAnalytics.referrer,
    weeklyVisitCount: visitCounts.weekly,
    monthlyVisitCount: visitCounts.monthly,
    isEndOfMonth: isEndOfMonth(),
    daysSinceLastVisit,
    lastVisitTimestamp: lastVisit,
    currentVisitTimestamp: currentVisit,
    firstVisitTimestamp: visitorInfo.firstSeen
  };

  await sendSessionSummaryToDiscord(summaryData);
  
  // Update total session time in localStorage
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}total_session_time`, (totalSessionTime + sessionDuration).toString());
}

/**
 * Check if user has completed the survey
 */
function hasSurveyBeenCompleted(): boolean {
  debugLog('Checking if survey has been completed');
  const completed = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}survey_completed`) === 'true';
  debugLog('Survey completion check result', { completed });
  return completed;
}

/**
 * Mark survey as completed
 */
function markSurveyAsCompleted(): void {
  debugLog('Marking survey as completed');
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}survey_completed`, 'true');
  debugLog('Survey marked as completed successfully');
}

/**
 * Send survey completion notification to Discord
 */
async function sendSurveyCompletionToDiscord(program: string, yearLevel: string, deviceLabel: string): Promise<void> {
  debugLog('Starting sendSurveyCompletionToDiscord function', { program, yearLevel, deviceLabel });
  
  const payload: DiscordPayload = {
    embeds: [{
      title: '🎓 Academic Survey Completed',
      description: `New student **${deviceLabel}** has completed the academic survey`,
      color: CONFIG.COLORS.SUCCESS,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '📚 Program', value: program, inline: true },
        { name: '📅 Year Level', value: yearLevel, inline: true },
        { name: '🏷️ Device Label', value: deviceLabel, inline: true },
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
 * Show toast notification for survey completion (only once per session)
 */
function showSurveyCompletionToast(deviceLabel: string): void {
  if (toastShown) return; // Prevent duplicate toasts
  
  try {
    // Try to use the app's toast system
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'success',
        title: `Welcome ${deviceLabel}! 👋`,
        message: 'Come back tomorrow to keep your streak going! 🔥'
      });
    } else {
      // Fallback: try to dispatch a custom event for the app to handle
      window.dispatchEvent(new CustomEvent('draeToast', {
        detail: {
          type: 'success',
          title: `Welcome ${deviceLabel}! 👋`,
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
        debugLog('Toast notification not available', error);
      }
}

/**
 * Generate device label from nickname, program and year level
 */
function generateDeviceLabel(nickname: string, program: string, yearLevel: string): string {
  const programCode = ACADEMIC_PROGRAMS[program as keyof typeof ACADEMIC_PROGRAMS];
  const yearText = YEAR_LEVELS[yearLevel as keyof typeof YEAR_LEVELS];
  const label = `${nickname}, ${programCode} - ${yearText}`;
  debugLog('Generated device label', { nickname, program, yearLevel, label });
  return label;
}

/**
 * Create and inject CSS styles for the survey modal
 */
function injectSurveyStyles(): void {
  debugLog('Injecting survey modal styles');
  if (document.getElementById('drae-survey-styles')) {
    debugLog('Survey styles already exist, skipping injection');
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'drae-survey-styles';
  style.textContent = `
    .drae-survey-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: ${CONFIG.MODAL_Z_INDEX - 1};
      pointer-events: auto;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    .drae-survey-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${CONFIG.MODAL_Z_INDEX};
      background: #000000;
      color: #ffffff;
      padding: 32px;
      border-radius: 16px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      border: 1px solid #333333;
      transition: transform 0.3s ease;
    }
    
    .drae-survey-shake {
      animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translate(-50%, -50%) translateX(0); }
      25% { transform: translate(-50%, -50%) translateX(-5px); }
      75% { transform: translate(-50%, -50%) translateX(5px); }
    }
    
    .drae-survey-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #ffffff;
      text-align: center;
    }
    
    .drae-survey-subtitle {
      font-size: 14px;
      color: #888888;
      margin-bottom: 32px;
      text-align: center;
      line-height: 1.5;
    }
    
    .drae-survey-field {
      margin-bottom: 24px;
    }
    
    .drae-survey-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
    }
    
    .drae-survey-select {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #333333;
      border-radius: 8px;
      background: #111111;
      color: #ffffff;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    
    .drae-survey-select:not(select) {
      cursor: text;
    }
    
    .drae-survey-select:is(select) {
      cursor: pointer;
    }
    
    .drae-survey-select:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    
    .drae-survey-select option {
      background: #111111;
      color: #ffffff;
      padding: 8px;
    }
    
    .drae-survey-button {
      width: 100%;
      padding: 16px;
      background: #10b981;
      color: #000000;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    .drae-survey-button:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    
    .drae-survey-button:disabled {
      background: #333333;
      color: #666666;
      cursor: not-allowed;
      transform: none;
    }
  `;
  
  document.head.appendChild(style);
  debugLog('Survey modal styles injected successfully');
}

/**
 * Create the academic survey modal
 */
function createSurveyModal(): void {
  debugLog('Creating survey modal');
  if (surveyModal) {
    debugLog('Survey modal already exists, skipping creation');
    return;
  }
  
  // Check if survey already completed
  if (hasSurveyBeenCompleted()) {
    debugLog('Survey already completed, not creating modal');
    return;
  }
  
  injectSurveyStyles();
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'drae-survey-backdrop';
  
  // Create modal
  surveyModal = document.createElement('div');
  surveyModal.className = 'drae-survey-modal';
  
  surveyModal.innerHTML = `
    <div class="drae-survey-title">Academic Survey</div>
    <div class="drae-survey-subtitle">
      Please provide your academic details to personalize your experience.<br>
      <strong style="color: #ff6b6b;">This information is required to continue.</strong>
    </div>
    
    <div class="drae-survey-field">
      <label class="drae-survey-label">What's your nickname?</label>
      <input type="text" class="drae-survey-select" id="drae-nickname-input" placeholder="Enter your nickname" maxlength="20" autocomplete="off">
    </div>
    
    <div class="drae-survey-field">
      <label class="drae-survey-label">What year level are you?</label>
      <select class="drae-survey-select" id="drae-year-select">
        <option value="">Select your year level</option>
        <option value="first">First Year</option>
        <option value="second">Second Year</option>
        <option value="third">Third Year</option>
        <option value="fourth">Fourth Year</option>
        <option value="fifth">Fifth Year</option>
      </select>
    </div>
    
    <div class="drae-survey-field">
      <label class="drae-survey-label">What is your program?</label>
      <select class="drae-survey-select" id="drae-program-select">
        <option value="">Select your program</option>
        <option value="civil">Civil Engineering</option>
        <option value="mechanical">Mechanical Engineering</option>
        <option value="electrical">Electrical Engineering</option>
        <option value="architecture">Architecture</option>
      </select>
    </div>
    
    <button class="drae-survey-button" id="drae-survey-submit" disabled>
      Complete Survey
    </button>
  `;
  
  // Add event listeners
  const nicknameInput = surveyModal.querySelector('#drae-nickname-input') as HTMLInputElement;
  const yearSelect = surveyModal.querySelector('#drae-year-select') as HTMLSelectElement;
  const programSelect = surveyModal.querySelector('#drae-program-select') as HTMLSelectElement;
  const submitButton = surveyModal.querySelector('#drae-survey-submit') as HTMLButtonElement;
  
  function checkFormValidity() {
    const isValid = nicknameInput.value.trim() && yearSelect.value && programSelect.value;
    submitButton.disabled = !isValid;
  }
  
  nicknameInput.addEventListener('input', checkFormValidity);
  yearSelect.addEventListener('change', checkFormValidity);
  programSelect.addEventListener('change', checkFormValidity);
  
  submitButton.addEventListener('click', async () => {
    if (nicknameInput.value.trim() && yearSelect.value && programSelect.value) {
      const nickname = nicknameInput.value.trim();
      const deviceLabel = generateDeviceLabel(nickname, programSelect.value, yearSelect.value);
      
      // Store unified visitor label (replaces temporary label)
      localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, deviceLabel);
      
      // Mark survey as completed
      markSurveyAsCompleted();
      
      // Send to Discord
      const programName = programSelect.options[programSelect.selectedIndex].text;
      const yearName = yearSelect.options[yearSelect.selectedIndex].text;
      await sendSurveyCompletionToDiscord(programName, yearName, deviceLabel);
      
      // Show success toast
      showSurveyCompletionToast(deviceLabel);
      
      // Remove modal
      backdrop.remove();
      surveyModal = null;
      
      debugLog('Survey completed successfully', { deviceLabel, nickname, program: programName, year: yearName });
    }
  });
  
  // Prevent clicking outside to close - PERSISTENT until completed
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      e.preventDefault();
      e.stopPropagation();
      // Add visual feedback that modal cannot be dismissed
      surveyModal?.classList.add('drae-survey-shake');
      setTimeout(() => {
        surveyModal?.classList.remove('drae-survey-shake');
      }, 500);
    }
  });
  
  // Append to document
  document.body.appendChild(backdrop);
  backdrop.appendChild(surveyModal);
  
  debugLog('Survey modal created successfully');
}

/**
 * Show survey modal if needed - persistent until completed
 */
function showSurveyModalIfNeeded(): void {
  debugLog('Checking if survey modal should be shown');
  
  // Check if survey already completed
  if (hasSurveyBeenCompleted()) {
    debugLog('Survey already completed, not showing modal');
    return;
  }
  
  // Check if user already has academic program label
  const existingLabel = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`);
  if (existingLabel && (existingLabel.includes('BSCE') || existingLabel.includes('BSME') || existingLabel.includes('BSEE') || existingLabel.includes('BSARCH'))) {
    debugLog('User already has academic label, marking survey as completed');
    markSurveyAsCompleted();
    return;
  }
  
  // Show survey modal for new users - PERSISTENT until completion
  setTimeout(() => {
    createSurveyModal();
    // Check every 3 seconds if modal was closed without completion
    const persistenceCheck = setInterval(() => {
      if (!hasSurveyBeenCompleted() && !surveyModal) {
        debugLog('Survey not completed but modal was closed, reshowing...');
        createSurveyModal();
      } else if (hasSurveyBeenCompleted()) {
        debugLog('Survey completed, stopping persistence check');
        clearInterval(persistenceCheck);
      }
    }, 3000);
  }, 2000); // Show after 2 seconds to let page load
}

// =============================================================================
// 🌟 VISITOR FINGERPRINTING & ANALYTICS
// =============================================================================

/**
 * Create unique visitor hash based on browser characteristics
 */
function createVisitorHash(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('DRAE Analytics fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    sessionAnalytics.screenResolution,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Generate temporary label for new users
 */
function generateTemporaryLabel(): string {
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4 digit number 1000-9999
  return `${randomNum} - NEW USER`;
}

/**
 * Get unified visitor label (survey label is the permanent label)
 */
// Helper to detect if a label is a finalized survey label
function isSurveyLabel(label: string): boolean {
  return /(BSCE|BSME|BSEE|BSARCH)/.test(label);
}

function getDeviceLabel(): string {
  const key = `${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`;
  const existingLabel = localStorage.getItem(key);

  if (existingLabel) {
    // Normalize legacy temporary format: "NEW USER - 1234" -> "1234 - NEW USER"
    const oldTempMatch = existingLabel.match(/^NEW USER - (\d{4})$/i);
    if (oldTempMatch) {
      const normalized = `${oldTempMatch[1]} - NEW USER`;
      localStorage.setItem(key, normalized);
      return normalized;
    }

    // If correct temporary format or a finalized survey label, keep it
    if (/^\d{4} - NEW USER$/.test(existingLabel) || isSurveyLabel(existingLabel)) {
      return existingLabel;
    }

    // Otherwise, replace any legacy/friendly label with a temporary one
    const temp = generateTemporaryLabel();
    localStorage.setItem(key, temp);
    return temp;
  }

  // No label stored yet: create a temporary one
  const temp = generateTemporaryLabel();
  localStorage.setItem(key, temp);
  return temp;
}

/**
 * Get browser emoji based on user agent
 */
function getBrowserEmoji(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('firefox')) return '🦊';
  if (ua.includes('chrome')) return '🌐';
  if (ua.includes('safari')) return '🧭';
  if (ua.includes('edge')) return '⚡';
  if (ua.includes('opera')) return '🎭';
  return '🌐';
}

/**
 * Get device type from user agent
 */
function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return '📱 Tablet';
  if (/mobile|android|iphone/.test(ua)) return '📱 Mobile';
  return '💻 Desktop';
}

/**
 * Detect incognito/private browsing mode
 */
async function detectIncognitoMode(): Promise<boolean> {
  try {
    // Test storage quota method
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota && estimate.quota < CONFIG.INCOGNITO_STORAGE_THRESHOLD;
    }
    
    // Fallback detection methods
    const fs = (window as any).webkitRequestFileSystem || (window as any).mozRequestFileSystem;
    if (fs) {
      return new Promise((resolve) => {
        fs(0, 0, () => resolve(false), () => resolve(true));
      });
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get relative time string from date
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Store visitor information in localStorage with unified label storage
 */
function storeVisitorInfo(info: VisitorInfo): void {
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_info`, JSON.stringify(info));
  localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_label`, info.label);
}

/**
 * Send visitor information to Discord webhook with last/new visit context
 */
async function sendVisitorInfoToDiscord(
  info: VisitorInfo,
  previousLastVisitIso: string | null,
  newVisitIso: string
): Promise<void> {
  const visitTypeEmoji = info.visitorType === 'new' ? '🆕' :
                        info.visitorType === 'returning' ? '🔄' : '🤖';

  const isFirstVisit = !previousLastVisitIso;
  const lastVisitField = isFirstVisit
    ? { name: '⏰ First Visit', value: formatToReadableDate(new Date(newVisitIso)), inline: true }
    : { name: '⏮️ Last Visit', value: formatToReadableDate(new Date(previousLastVisitIso!)), inline: true };

  const newVisitField = isFirstVisit
    ? null
    : { name: '⏭️ New Visit', value: formatToReadableDate(new Date(newVisitIso)), inline: true };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: '🏷️ Label', value: info.label, inline: true },
    { name: '🔢 Visit Count', value: info.visitCount.toString(), inline: true },
    { name: info.browserEmoji + ' Browser', value: info.deviceType, inline: true },
    { name: '🕵️ Incognito', value: info.isIncognito ? 'Yes' : 'No', inline: true },
    { name: '📅 First Seen', value: getRelativeTime(new Date(info.firstSeen)), inline: true },
    lastVisitField,
    ...(newVisitField ? [newVisitField] : []),
    { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
  ].filter(Boolean) as Array<{ name: string; value: string; inline?: boolean }>;

  const payload: DiscordPayload = {
    embeds: [{
      title: isFirstVisit
        ? `${visitTypeEmoji} First Visit`
        : `${visitTypeEmoji} Returning Visit`,
      description: isFirstVisit
        ? `First visit recorded for **${info.label}**`
        : `**${info.label}** has returned`,
      color: CONFIG.COLORS[`VISITOR_${info.visitorType.toUpperCase()}` as keyof typeof CONFIG.COLORS] as number,
      timestamp: formatToDiscordTimestamp(),
      fields
    }]
  };

  await sendToDiscord(payload);
}

/**
 * Core visitor fingerprinting function
 */
async function fingerprintUser(): Promise<VisitorInfo> {
  const hash = createVisitorHash();
  const existingInfo = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}visitor_info`);
  const isIncognitoMode = await detectIncognitoMode();
  const browserEmoji = getBrowserEmoji();
  const deviceType = getDeviceType();
  
  let info: VisitorInfo;
  
if (existingInfo) {
    // Returning visitor
    info = JSON.parse(existingInfo);
    info.visitCount += 1;
    info.visitorType = 'returning';
    info.isIncognito = isIncognitoMode;
    // Always sync label with unified storage (survey label or normalized temp)
    info.label = getDeviceLabel();
  } else {
    // New visitor
    const label = getDeviceLabel();
    info = {
      hash,
      label,
      visitCount: 1,
      firstSeen: new Date().toISOString(),
      isIncognito: isIncognitoMode,
      visitorType: 'new',
      browserEmoji,
      deviceType
    };
  }
  
const previousLastVisitIso = localStorage.getItem(`${CONFIG.LOCAL_STORAGE_PREFIX}last_visit`);
const newVisitIso = new Date().toISOString();
storeVisitorInfo(info);
await sendVisitorInfoToDiscord(info, previousLastVisitIso, newVisitIso);
// After sending, update the stored last visit time
localStorage.setItem(`${CONFIG.LOCAL_STORAGE_PREFIX}last_visit`, newVisitIso);

// Update visit history for analytics
updateVisitHistory();

return info;
}

// =============================================================================
// 🌐 DISCORD WEBHOOK SYSTEM
// =============================================================================

/**
 * Send payload to Discord webhook with error handling and retry logic
 */
async function sendToDiscord(payload: DiscordPayload): Promise<void> {
  try {
    debugLog('Attempting to send Discord webhook', {
      url: CONFIG.DISCORD_WEBHOOK_URL.substring(0, 50) + '...',
      payload
    });

    const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    debugLog('Sending validated payload to Discord', payload.embeds[0]);

    if (!response.ok) {
      const responseText = await response.text();
      debugLog('Discord webhook failed', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });
      
      warnLog('Failed to send to Discord', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });
      
      // Add to retry queue
      retryQueue.push({ payload, retryCount: 0 });
      return;
    }

    debugLog('Discord webhook sent successfully');
  } catch (error) {
    errorLog('Error sending to Discord', error);
    // Add to retry queue
    retryQueue.push({ payload, retryCount: 0 });
  }
}

// =============================================================================
// 🖱️ CLICK TRACKING SYSTEM
// =============================================================================

/**
 * Get DRAE data attributes from element
 */
function getDraeData(element: Element): Record<string, string> {
  const draeData: Record<string, string> = {};
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('drae-data-')) {
      const key = attr.name.replace('drae-data-', '');
      draeData[key] = attr.value;
    }
  });
  return draeData;
}

/**
 * Send click event to Discord
 */
async function sendClickToDiscord(eventData: ClickEventData): Promise<void> {
  const deviceLabel = getDeviceLabel();
  
  // Determine click importance
  const isImportant = ['button', 'a', 'input'].includes(eventData.elementTag.toLowerCase()) ||
                     eventData.elementType === 'submit' ||
                     eventData.href ||
                     eventData.elementClass.includes('btn') ||
                     eventData.elementClass.includes('button');
  
  const color = isImportant ? CONFIG.COLORS.CLICK_IMPORTANT : CONFIG.COLORS.CLICK_NORMAL;
  
  const payload: DiscordPayload = {
    embeds: [{
      title: '🖱️ Element Clicked',
      description: `**${deviceLabel}** clicked on ${eventData.elementTag}`,
      color,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '🏷️ Tag', value: eventData.elementTag, inline: true },
        { name: '🆔 ID', value: eventData.elementId || 'None', inline: true },
        { name: '📝 Class', value: eventData.elementClass || 'None', inline: true },
        { name: '📄 Text', value: eventData.elementText.substring(0, 100) || 'None', inline: false },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };

  if (eventData.href) {
    payload.embeds[0].fields?.push({ name: '🔗 Link', value: eventData.href, inline: false });
  }

  await sendToDiscord(payload);
}

/**
 * Handle click events with rate limiting
 */
function handleClick(event: Event): void {
  const now = Date.now();
  if (now - lastClickTime < CONFIG.CLICK_RATE_LIMIT) return;
  lastClickTime = now;
  
  const target = event.target as Element;
  if (!target) return;
  
  sessionAnalytics.totalClicks++;
  resetInactivityTimer();
  
  const elementText = (target.textContent || '').trim();
  const fileInfo = isFileElement(target, elementText);
  
  // If it's a file, send file click event
  if (fileInfo.isFile && fileInfo.fileName && fileInfo.fileExtension) {
    const fileClickData: FileClickEventData = {
      fileName: fileInfo.fileName,
      fileExtension: fileInfo.fileExtension,
      elementText: elementText.substring(0, CONFIG.MAX_SANITIZED_TEXT_LENGTH),
      elementId: target.id || '',
      elementClass: target.className || '',
      timestamp: formatToDiscordTimestamp(),
      url: window.location.href,
      visitorLabel: getDeviceLabel()
    };
    
    sendFileClickToDiscord(fileClickData);
  }
  
  // Also send regular click tracking
  const clickData: ClickEventData = {
    elementTag: target.tagName.toLowerCase(),
    elementText: elementText.substring(0, CONFIG.MAX_SANITIZED_TEXT_LENGTH),
    elementId: target.id || '',
    elementClass: target.className || '',
    elementType: (target as HTMLInputElement).type || '',
    href: (target as HTMLAnchorElement).href || '',
    src: (target as HTMLImageElement).src || '',
    draeData: getDraeData(target),
    timestamp: formatToDiscordTimestamp(),
    url: window.location.href,
    visitorLabel: getDeviceLabel()
  };
  
  sendClickToDiscord(clickData);
}

/**
 * Start click tracking
 */
function trackClicks(): void {
  document.addEventListener('click', handleClick, true);
  cleanupFunctions.push(() => {
    document.removeEventListener('click', handleClick, true);
  });
}

// =============================================================================
// ⌨️ INPUT TRACKING SYSTEM
// =============================================================================

/**
 * Send input event to Discord
 */
async function sendInputToDiscord(eventData: InputEventData): Promise<void> {
  const inputTypeColors: Record<string, number> = {
    'email': CONFIG.COLORS.INPUT_EMAIL,
    'search': CONFIG.COLORS.INPUT_SEARCH,
    'textarea': CONFIG.COLORS.INPUT_TEXTAREA,
    'text': CONFIG.COLORS.INPUT_TEXT
  };
  
  const color = inputTypeColors[eventData.elementType] || CONFIG.COLORS.INPUT_OTHER;
  
  const payload: DiscordPayload = {
    embeds: [{
      title: '⌨️ Input Activity',
      description: `**${eventData.visitorLabel}** typed in ${eventData.elementTag}`,
      color,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '🏷️ Field Type', value: eventData.elementType || 'text', inline: true },
        { name: '🆔 Field ID', value: eventData.elementId || 'None', inline: true },
        { name: '⏱️ Duration', value: `${eventData.interactionTime}s`, inline: true },
        { name: '📝 Placeholder', value: eventData.placeholder || 'None', inline: true },
        { name: '🏷️ Label', value: eventData.label || 'None', inline: true },
        { name: '📊 Length', value: `${eventData.inputValue.length} chars`, inline: true },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };

  await sendToDiscord(payload);
}

/**
 * Handle input events with rate limiting
 */
function handleInput(event: Event): void {
  const now = Date.now();
  if (now - lastInputTime < CONFIG.INPUT_RATE_LIMIT) return;
  lastInputTime = now;
  
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target || target.type === 'password') return;
  
  sessionAnalytics.totalInputs++;
  resetInactivityTimer();
  
  // Calculate interaction time
  const focusTime = inputFocusTimes.get(target) || now;
  const interactionTime = Math.round((now - focusTime) / 1000);
  
  const inputData: InputEventData = {
    elementTag: target.tagName.toLowerCase(),
    elementId: target.id || '',
    elementClass: target.className || '',
    elementType: target.type || 'text',
    inputValue: target.value.substring(0, 50), // Limit for privacy
    placeholder: target.placeholder || '',
    fieldName: target.name || '',
    timestamp: formatToDiscordTimestamp(),
    url: window.location.href,
    visitorLabel: getDeviceLabel(),
    interactionTime
  };
  
  sendInputToDiscord(inputData);
}

/**
 * Track input focus times
 */
function handleFocus(event: Event): void {
  const target = event.target as Element;
  inputFocusTimes.set(target, Date.now());
}

/**
 * Start input tracking
 */
function trackInputs(): void {
  document.addEventListener('input', handleInput, true);
  document.addEventListener('focus', handleFocus, true);
  
  cleanupFunctions.push(() => {
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('focus', handleFocus, true);
  });
}

// =============================================================================
// 😴 INACTIVITY MONITORING
// =============================================================================

/**
 * Start inactivity timer
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
  const deviceLabel = getDeviceLabel();
  
  const payload: DiscordPayload = {
    embeds: [{
      title: '💤 User Inactive',
      description: `**${deviceLabel}** has been idle for 1+ minute`,
      color: CONFIG.COLORS.INACTIVE,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '💻 Device', value: deviceLabel, inline: true },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false },
        { name: '⏱️ Time', value: formatToPhilippineTime(), inline: true }
      ]
    }]
  };

  await sendToDiscord(payload);
  
  // End session when user becomes inactive (only if less than 3 blur activities)
  if (blurActivityCount < 3) {
    endSession();
  }
}

// =============================================================================
// 📁 FILE CLICK DETECTION
// =============================================================================

/**
 * Check if clicked element appears to be a file-related element
 */
function isFileElement(element: Element, elementText: string): { isFile: boolean; fileName?: string; fileExtension?: string } {
  // Check for file-like text patterns
  const filePattern = /^(.+?)\.([a-zA-Z0-9]{1,6})$/;
  const textMatch = elementText.match(filePattern);
  
  if (textMatch) {
    return {
      isFile: true,
      fileName: textMatch[1],
      fileExtension: textMatch[2]
    };
  }
  
  // Check for elements with file-related classes
  const fileClasses = ['file', 'document', 'attachment', 'download'];
  const className = element.className.toLowerCase();
  const hasFileClass = fileClasses.some(cls => className.includes(cls));
  
  if (hasFileClass) {
    return {
      isFile: true,
      fileName: elementText || 'File',
      fileExtension: 'unknown'
    };
  }
  
  return { isFile: false };
}

/**
 * Send file click event to Discord
 */
async function sendFileClickToDiscord(eventData: FileClickEventData): Promise<void> {
  const payload: DiscordPayload = {
    embeds: [{
      title: '📁 File Clicked',
      description: `**${eventData.visitorLabel}** clicked on file: **${eventData.fileName}**`,
      color: CONFIG.COLORS.FILE_CLICK,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '📄 File Name', value: eventData.fileName, inline: true },
        { name: '📋 Extension', value: eventData.fileExtension.toUpperCase(), inline: true },
        { name: '🆔 Element ID', value: eventData.elementId || 'None', inline: true },
        { name: '📝 Element Class', value: eventData.elementClass || 'None', inline: false },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };

  await sendToDiscord(payload);
}

// =============================================================================
// 👁️ TAB SWITCH & BROWSER EXIT DETECTION
// =============================================================================

/**
 * Send tab/visibility event to Discord
 */
async function sendTabEventToDiscord(eventData: TabEventData): Promise<void> {
  const eventEmojis = {
    'tab_switch': '🔄',
    'browser_exit': '🚪',
    'page_focus': '👁️',
    'page_blur': '😴'
  };
  
  const eventNames = {
    'tab_switch': 'Tab Switch',
    'browser_exit': 'Browser Exit',
    'page_focus': 'Page Focused',
    'page_blur': 'Page Blurred'
  };
  
  const color = eventData.eventType === 'browser_exit' ? CONFIG.COLORS.BROWSER_EXIT : CONFIG.COLORS.TAB_SWITCH;
  
  const payload: DiscordPayload = {
    embeds: [{
      title: `${eventEmojis[eventData.eventType]} ${eventNames[eventData.eventType]}`,
      description: `**${eventData.visitorLabel}** ${eventData.eventType.replace('_', ' ')} detected`,
      color,
      timestamp: formatToDiscordTimestamp(),
      fields: [
        { name: '⚡ Event Type', value: eventNames[eventData.eventType], inline: true },
        { name: '⏱️ Time on Page', value: eventData.timeOnPage ? `${Math.round(eventData.timeOnPage / 1000)}s` : 'N/A', inline: true },
        { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
      ]
    }]
  };

  await sendToDiscord(payload);
}

/**
 * Handle visibility change events (tab switch detection)
 */
function handleVisibilityChange(): void {
  const now = Date.now();
  const timeOnPage = now - pageLoadTime;
  const deviceLabel = getDeviceLabel();
  
  if (document.hidden && isPageVisible) {
    // Page became hidden (user switched tab or minimized)
    isPageVisible = false;
    blurActivityCount++;
    
    const tabEventData: TabEventData = {
      eventType: 'page_blur',
      timestamp: formatToDiscordTimestamp(),
      url: window.location.href,
      visitorLabel: deviceLabel,
      timeOnPage
    };
    
    sendTabEventToDiscord(tabEventData);
    
    // End session when page is blurred (only if 3 or more blur activities)
    if (blurActivityCount >= 3) {
      endSession();
    }
    
  } else if (!document.hidden && !isPageVisible) {
    // Page became visible (user returned to tab)
    isPageVisible = true;
    pageLoadTime = now; // Reset timer
    
    const tabEventData: TabEventData = {
      eventType: 'page_focus',
      timestamp: formatToDiscordTimestamp(),
      url: window.location.href,
      visitorLabel: deviceLabel
    };
    
    sendTabEventToDiscord(tabEventData);
  }
}

/**
 * Handle before unload events (browser exit detection)
 */
function handleBeforeUnload(): void {
  const now = Date.now();
  const timeOnPage = now - pageLoadTime;
  const deviceLabel = getDeviceLabel();
  
  const tabEventData: TabEventData = {
    eventType: 'browser_exit',
    timestamp: formatToDiscordTimestamp(),
    url: window.location.href,
    visitorLabel: deviceLabel,
    timeOnPage
  };
  
  // Use sendBeacon for reliability during page unload
  try {
    const payload = {
      embeds: [{
        title: '🚪 Browser Exit',
        description: `**${deviceLabel}** exited the browser/page`,
        color: CONFIG.COLORS.BROWSER_EXIT,
        timestamp: formatToDiscordTimestamp(),
        fields: [
          { name: '⚡ Event Type', value: 'Browser Exit', inline: true },
          { name: '⏱️ Time on Page', value: `${Math.round(timeOnPage / 1000)}s`, inline: true },
          { name: '🌐 Page', value: `[${document.title}](${window.location.href})`, inline: false }
        ]
      }]
    };
    
    navigator.sendBeacon(CONFIG.DISCORD_WEBHOOK_URL, JSON.stringify(payload));
  } catch (error) {
    debugLog('Failed to send browser exit beacon', error);
  }
}

/**
 * Start tab/visibility tracking
 */
function trackTabEvents(): void {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
  
  cleanupFunctions.push(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handleBeforeUnload);
  });
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
// 🚀 MAIN INITIALIZATION
// =============================================================================

/**
 * Initialize the complete analytics system
 */
export async function initAnalytics(webhookUrl: string, debugMode: boolean = false): Promise<void> {
  try {
    infoLog('🚀 DRAE Analytics initializing...');
    
    // Initialize config
    CONFIG = new DraeAnalyticsConfig(webhookUrl, debugMode);
    
    debugLog('Analytics initialization started', { webhookUrl: webhookUrl.substring(0, 50) + '...', debugMode });
    
    // Step 1: Fingerprint and identify the user
    await fingerprintUser();
    
    // Step 2: Show survey modal if needed
    showSurveyModalIfNeeded();
    
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
    
    // Step 8: Start tab/visibility tracking
    trackTabEvents();
    
    // Step 9: Set up activity listeners
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Step 10: Set up session end tracking
    window.addEventListener('beforeunload', async () => {
      await endSession();
    });
    
    // Set up idle session end (after 30 minutes of inactivity)
    let idleTimer: NodeJS.Timeout | null = null;
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        await endSession();
      }, 30 * 60 * 1000); // 30 minutes
    };
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
    
    resetIdleTimer(); // Start the idle timer
    
    infoLog('✅ DRAE Analytics initialized successfully');
    
  } catch (error) {
    errorLog('Failed to initialize DRAE Analytics', error);
    throw error;
  }
}

/**
 * Cleanup function to remove all event listeners and observers
 */
export function cleanup(): void {
  debugLog('Cleaning up DRAE Analytics');
  
  // Run all cleanup functions
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  
  // Clear timers
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  
  if (dashboardUpdateInterval) {
    clearInterval(dashboardUpdateInterval);
    dashboardUpdateInterval = null;
  }
  
  // Disconnect observers
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  
  // Remove survey modal if it exists
  if (surveyModal && surveyModal.parentNode) {
    const backdrop = surveyModal.parentNode.parentNode as HTMLElement;
    if (backdrop && backdrop.remove) {
      backdrop.remove();
    }
    surveyModal = null;
  }
  
  debugLog('DRAE Analytics cleanup completed');
}

// Export for external access if needed
export { CONFIG, sessionAnalytics };