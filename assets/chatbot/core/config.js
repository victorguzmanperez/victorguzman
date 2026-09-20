/**
 * Asistente de Víctor
 * Configuración técnica global del chatbot.
 *
 * PREPROD.1.11
 * HITO I0 — Shell funcional
 *
 * Este archivo contiene configuración.
 * No debe contener lógica conversacional,
 * intents, conocimiento ni manipulación del DOM.
 */

const CHATBOT_BASE_URL = new URL("../", import.meta.url);
const AVATAR_BASE_URL = new URL("../avatar/", import.meta.url);

export const CHATBOT_VERSION = "1.0.0";
export const STATE_SCHEMA_VERSION = 2;

export const chatbotConfig = Object.freeze({
  identity: {
    name: "Asistente de Víctor",
    description: "Asistente digital del portfolio de Víctor",
  },

  version: CHATBOT_VERSION,
  schemaVersion: STATE_SCHEMA_VERSION,

  /**
   * Durante el desarrollo lo dejamos activado.
   * Antes de producción deberá pasar a false.
   */
  debug: false,

  dom: {
    rootId: "victor-chatbot-root",
    launcherId: "victor-chatbot-launcher",
    windowId: "victor-chatbot-window",

    cssNamespace: "vg-chatbot",
  },

  storage: {
    type: "sessionStorage",

    /**
     * Cambiar el sufijo cuando exista una
     * migración incompatible del estado.
     */
    key: "vg_portfolio_chatbot_state_v2",

    /**
     * Caducidad por inactividad.
     * 8 horas.
     */
    ttlMs: 8 * 60 * 60 * 1000,

    /**
     * Evita escribir continuamente en sessionStorage.
     */
    debounceMs: 100,

    /**
     * Límite del buffer conversacional persistido.
     */
    maxStoredMessages: 50,
  },

  ui: {
    /**
     * Nunca abrir automáticamente en una visita nueva.
     */
    initialOpen: false,

    /**
     * El cerebro completo se cargará cuando
     * el visitante abra el asistente.
     */
    lazyLoadCore: true,
  },

  avatar: {
    assets: {
      default: "victor-assistant-default.webp",

      /**
       * Assets previstos.
       * Todavía no tienen que existir físicamente.
       */
      blink: "victor-assistant-blink.webp",
      thinking: "victor-assistant-thinking.webp",
      speaking1: "victor-assistant-speaking-1.webp",
      speaking2: "victor-assistant-speaking-2.webp",
      fallback: "victor-assistant-fallback.svg",
    },

    /**
     * Intervalo futuro de parpadeo.
     */
    blinkMinDelayMs: 4000,
    blinkMaxDelayMs: 8000,

    /**
     * Duración aproximada del parpadeo.
     */
    blinkDurationMs: 140,
  },

  analytics: {
    /**
     * OBS-H1: instrumentación GA4 del chatbot.
     * La capa core/analytics.js aplica consentimiento explícito,
     * allowlist de eventos/parámetros y exclusión de PII/texto libre.
     */
    enabled: true,
  },
});

/**
 * Resuelve cualquier recurso relativo al directorio:
 *
 * assets/chatbot/
 *
 * No depende de que GitHub Pages esté desplegado
 * en dominio raíz o dentro de un subdirectorio.
 */
export function resolveChatbotAsset(relativePath) {
  const normalizedPath = String(relativePath).replace(/^\/+/, "");

  return new URL(normalizedPath, CHATBOT_BASE_URL).href;
}

/**
 * Resuelve específicamente un recurso del avatar:
 *
 * assets/chatbot/avatar/
 */
export function resolveAvatarAsset(filename) {
  const normalizedFilename = String(filename).replace(/^\/+/, "");

  return new URL(normalizedFilename, AVATAR_BASE_URL).href;
}

/**
 * Logging centralizado de desarrollo.
 *
 * Evita repartir comprobaciones de debug
 * por toda la aplicación.
 */
export function debugLog(...args) {
  if (!chatbotConfig.debug) {
    return;
  }

  console.log("[VG Chatbot]", ...args);
}