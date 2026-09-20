/**
 * Response architecture manifest.
 *
 * Early versions of the chatbot reserved this file for static response copy.
 * The production design no longer stores a second catalogue here: responses
 * are composed from canonical Knowledge by the modules in core/.
 *
 * Keeping this manifest avoids a dead/empty lazy-loaded module while making
 * the ownership of each response family explicit without duplicating copy.
 */
export const RESPONSE_ARCHITECTURE = Object.freeze({
  social: "core/social-response-composer.js",
  knowledge: "core/knowledge-response-composer.js",
  qualifiedKnowledge: "core/qualified-response-composer.js",
  problemFlow: "core/problem-solution-service-response-composer.js",
  operational: "core/operational-response-composer.js",
  privacy: "core/privacy-response-composer.js",
  commercial: "core/commercial-response-composer.js",
  fallback: "core/fallback-response-composer.js",
  continuation: "core/dialogue-continuation.js",
});
