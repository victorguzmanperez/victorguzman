/**
 * Analytics integration facade.
 * Canonical implementation: core/analytics.js.
 */
export {
  CHATBOT_ANALYTICS_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  sanitizeAnalyticsParams,
  hasAnalyticsConsent,
  sendChatbotAnalyticsEvent,
  createChatbotAnalyticsObserver,
} from "../core/analytics.js";
