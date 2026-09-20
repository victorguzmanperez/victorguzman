/**
 * Integration registry.
 *
 * This is documentation-as-code for external boundaries. It does not contain
 * credentials or duplicate integration logic.
 */
export const CHATBOT_INTEGRATIONS = Object.freeze({
  analytics: Object.freeze({
    provider: "GA4",
    implementation: "core/analytics.js",
    consentRequired: true,
  }),
  diagnostic: Object.freeze({
    provider: "Formspree + portfolio diagnostic page",
    implementation: "diagnostico.html + core/actions.js",
    consentRequired: true,
  }),
  booking: Object.freeze({
    provider: "Calendly",
    implementation: "core/actions.js + diagnostico.html",
    consentRequired: false,
  }),
});
