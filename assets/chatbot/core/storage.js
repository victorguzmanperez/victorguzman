/**
 * Asistente de Víctor
 * Persistencia segura de estado.
 *
 * PREPROD.1.11.8 — Persistencia
 * HITO I0 — Shell funcional
 *
 * V1:
 * - sessionStorage únicamente;
 * - sin localStorage;
 * - sin IndexedDB;
 * - sin cookies;
 * - fallback en memoria;
 * - TTL;
 * - schemaVersion;
 * - whitelist explícita;
 * - debounce;
 * - restauración defensiva.
 */

import {
  chatbotConfig,
  debugLog,
} from "./config.js";

import {
  CHATBOT_VERSION,
  STATE_SCHEMA_VERSION,
  createInitialState,
  getState,
  restorePersistedState,
  subscribe,
  validateState,
} from "./state.js";

/**
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 *
 * Utilizamos config.js cuando contiene los valores.
 * Los fallbacks representan exactamente la decisión V1.
 */

export const STORAGE_KEY =
  chatbotConfig?.storage?.key ??
  "vg_portfolio_chatbot_state_v2";

export const STORAGE_TTL_MS =
  Number.isFinite(
    chatbotConfig?.storage?.ttlMs,
  )
    ? chatbotConfig.storage.ttlMs
    : Number.isFinite(
          chatbotConfig?.storage?.ttlHours,
        )
      ? chatbotConfig.storage.ttlHours *
        60 *
        60 *
        1000
      : 8 * 60 * 60 * 1000;

export const STORAGE_DEBOUNCE_MS =
  Number.isFinite(
    chatbotConfig?.storage?.debounceMs,
  )
    ? chatbotConfig.storage.debounceMs
    : Number.isFinite(
          chatbotConfig?.storage
            ?.saveDebounceMs,
        )
      ? chatbotConfig.storage
          .saveDebounceMs
      : 100;

const STORAGE_PROBE_PREFIX =
  `${STORAGE_KEY}__probe__`;

/**
 * ============================================================
 * RUNTIME INTERNO
 * ============================================================
 */

let storageInitialized = false;

let activeStorage = null;

let persistentStorageAvailable = false;

/**
 * Fallback de memoria.
 *
 * No sobrevive a una navegación real.
 * Su misión es únicamente que un fallo de
 * sessionStorage no rompa el chatbot.
 */
let memoryStorageValue = null;

/**
 * Última representación guardada.
 * Permite evitar escrituras idénticas.
 */
let lastSerializedValue = null;

/**
 * Temporizador del debounce.
 *
 * Nunca entra en chatbotState.
 */
let pendingSaveTimer = null;

/**
 * Último snapshot pendiente.
 */
let pendingSnapshot = null;

/**
 * Unsubscribe de state.js.
 */
let unsubscribeState = null;

/**
 * Handler de pagehide.
 */
let pagehideHandler = null;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cloneSerializable(value) {
  if (
    typeof globalThis.structuredClone ===
    "function"
  ) {
    return globalThis.structuredClone(
      value,
    );
  }

  return JSON.parse(
    JSON.stringify(value),
  );
}

function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

function createStorageResult(
  overrides = {},
) {
  return {
    key: STORAGE_KEY,
    mode:
      persistentStorageAvailable
        ? "sessionStorage"
        : "memory",
    persistent:
      persistentStorageAvailable,
    ...overrides,
  };
}

function isValidDateString(value) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(
      Date.parse(value),
    )
  );
}

function validateExactKeys(
  value,
  expectedKeys,
  path,
  errors,
) {
  if (!isPlainObject(value)) {
    errors.push({
      path,
      message:
        "must be a plain object",
    });

    return false;
  }

  const actualKeys =
    Object.keys(value);

  for (
    const expectedKey of expectedKeys
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        value,
        expectedKey,
      )
    ) {
      errors.push({
        path:
          `${path}.${expectedKey}`,
        message:
          "required field is missing",
      });
    }
  }

  for (const actualKey of actualKeys) {
    if (
      !expectedKeys.includes(
        actualKey,
      )
    ) {
      errors.push({
        path:
          `${path}.${actualKey}`,
        message: "unknown field",
      });
    }
  }

  return true;
}

/**
 * ============================================================
 * DISPONIBILIDAD DE SESSIONSTORAGE
 * ============================================================
 */

function resolveBrowserSessionStorage() {
  try {
    if (
      typeof globalThis
        .sessionStorage === "undefined"
    ) {
      return null;
    }

    return globalThis.sessionStorage;
  } catch (error) {
    debugLog(
      "sessionStorage access failed",
      error,
    );

    return null;
  }
}

function probeStorage(storage) {
  if (
    !storage ||
    typeof storage.setItem !==
      "function" ||
    typeof storage.getItem !==
      "function" ||
    typeof storage.removeItem !==
      "function"
  ) {
    return false;
  }

  const probeKey =
    `${STORAGE_PROBE_PREFIX}${Date.now()}`;

  try {
    storage.setItem(
      probeKey,
      "1",
    );

    storage.removeItem(
      probeKey,
    );

    return true;
  } catch (error) {
    debugLog(
      "sessionStorage probe failed",
      error,
    );

    return false;
  }
}

/**
 * Inicializa el backend.
 *
 * En producción:
 *
 * initStorage()
 *
 * En tests puede inyectarse un backend:
 *
 * initStorage({ storage: fakeStorage })
 */
export function initStorage({
  storage = undefined,
  autoSync = false,
  bindPagehide = true,
} = {}) {
  /**
   * Una inyección explícita significa que
   * queremos reinicializar el runtime.
   */
  if (storage !== undefined) {
    stopStorageSync({
      flush: false,
    });

    activeStorage = storage;

    persistentStorageAvailable =
      probeStorage(storage);

    memoryStorageValue = null;
    lastSerializedValue = null;
    pendingSnapshot = null;

    storageInitialized = true;
  } else if (!storageInitialized) {
    activeStorage =
      resolveBrowserSessionStorage();

    persistentStorageAvailable =
      probeStorage(activeStorage);

    storageInitialized = true;
  }

  if (autoSync) {
    startStorageSync({
      bindPagehide,
    });
  }

  const status =
    getStorageStatus();

  debugLog(
    "storage initialized",
    status,
  );

  return status;
}

/**
 * Estado técnico del módulo.
 *
 * No forma parte de chatbotState.
 */
export function getStorageStatus() {
  return {
    initialized:
      storageInitialized,

    key: STORAGE_KEY,

    ttlMs:
      STORAGE_TTL_MS,

    debounceMs:
      STORAGE_DEBOUNCE_MS,

    mode:
      persistentStorageAvailable
        ? "sessionStorage"
        : "memory",

    persistent:
      persistentStorageAvailable,

    syncActive:
      typeof unsubscribeState ===
      "function",

    pendingSave:
      pendingSaveTimer !== null,
  };
}

function ensureStorageInitialized() {
  if (!storageInitialized) {
    initStorage();
  }
}

/**
 * ============================================================
 * WHITELIST PERSISTIBLE
 * ============================================================
 */

export function buildPersistedState(
  snapshot = getState(),
) {
  /**
   * Nunca persistimos un state inválido.
   */
  validateState(
    snapshot,
    {
      throwOnError: true,
    },
  );

  return {
    meta: {
      schemaVersion:
        snapshot.meta.schemaVersion,

      chatbotVersion:
        snapshot.meta.chatbotVersion,

      sessionId:
        snapshot.meta.sessionId,

      createdAt:
        snapshot.meta.createdAt,

      updatedAt:
        snapshot.meta.updatedAt,
    },

    ui: {
      isOpen:
        snapshot.ui.isOpen,

      unreadCount:
        snapshot.ui.unreadCount,
    },

    /**
     * page.current se detectará otra vez
     * desde el documento real.
     */
    /**
     * page.current nunca se restaurará como current.
     *
     * Pero la página actual de este documento sí debe
     * convertirse en page.previous cuando se cargue
     * el siguiente documento.
     */
    page: {
      previous:
        cloneSerializable(
          snapshot.page.current?.path
            ? snapshot.page.current
            : snapshot.page.previous,
        ),
    },

    conversation:
      cloneSerializable(
        snapshot.conversation,
      ),

    /**
     * NLU útil para continuidad.
     *
     * NO persistimos:
     * - confidence numérica;
     * - lastAnalysis.
     */
    understanding: {
      conversationalState: cloneSerializable(snapshot.understanding.conversationalState ?? null),
      primaryIntent:
        snapshot.understanding
          .primaryIntent,

      secondaryIntents:
        cloneSerializable(
          snapshot.understanding
            .secondaryIntents,
        ),

      confidenceBucket:
        snapshot.understanding
          .confidenceBucket,

      concepts:
        cloneSerializable(
          snapshot.understanding
            .concepts,
        ),

      currentTopic:
        snapshot.understanding
          .currentTopic,

      semanticContext:
        cloneSerializable(
          snapshot.understanding
            .semanticContext,
        ),

      pendingConfirmation:
        cloneSerializable(
          snapshot.understanding
            .pendingConfirmation,
        ),
    },

    entities:
      cloneSerializable(
        snapshot.entities,
      ),

    diagnostic:
      cloneSerializable(
        snapshot.diagnostic,
      ),

    recommendations:
      cloneSerializable(
        snapshot.recommendations,
      ),

    booking:
      cloneSerializable(
        snapshot.booking,
      ),

    analytics:
      cloneSerializable(
        snapshot.analytics,
      ),
  };
}

/**
 * ============================================================
 * VALIDACIÓN DEL PAYLOAD PERSISTIDO
 * ============================================================
 */

const PERSISTED_ROOT_KEYS =
  Object.freeze([
    "meta",
    "ui",
    "page",
    "conversation",
    "understanding",
    "entities",
    "diagnostic",
    "recommendations",
    "booking",
    "analytics",
  ]);

const PERSISTED_META_KEYS =
  Object.freeze([
    "schemaVersion",
    "chatbotVersion",
    "sessionId",
    "createdAt",
    "updatedAt",
  ]);

const PERSISTED_UI_KEYS =
  Object.freeze([
    "isOpen",
    "unreadCount",
  ]);

const PERSISTED_PAGE_KEYS =
  Object.freeze([
    "previous",
  ]);

const PERSISTED_UNDERSTANDING_KEYS =
  Object.freeze([
    "conversationalState",
    "primaryIntent",
    "secondaryIntents",
    "confidenceBucket",
    "concepts",
    "currentTopic",
    "semanticContext",
    "pendingConfirmation",
  ]);

/**
 * Construye un state V1 completo únicamente
 * para comprobar que el payload persistido
 * podría restaurarse sin romper invariantes.
 */
function createValidationCandidate(
  persisted,
) {
  const candidate =
    createInitialState();

  candidate.meta.schemaVersion =
    persisted.meta.schemaVersion;

  candidate.meta.chatbotVersion =
    persisted.meta.chatbotVersion;

  candidate.meta.sessionId =
    persisted.meta.sessionId;

  candidate.meta.createdAt =
    persisted.meta.createdAt;

  candidate.meta.updatedAt =
    persisted.meta.updatedAt;

  candidate.ui.isOpen =
    persisted.ui.isOpen;

  candidate.ui.unreadCount =
    persisted.ui.unreadCount;

  candidate.page.previous =
    cloneSerializable(
      persisted.page.previous,
    );

  candidate.conversation =
    cloneSerializable(
      persisted.conversation,
    );

  candidate.understanding = {
    ...candidate.understanding,
    conversationalState: cloneSerializable(persisted.understanding.conversationalState ?? null),

    primaryIntent:
      persisted.understanding
        .primaryIntent,

    secondaryIntents:
      cloneSerializable(
        persisted.understanding
          .secondaryIntents,
      ),

    confidence:
      null,

    confidenceBucket:
      persisted.understanding
        .confidenceBucket,

    concepts:
      cloneSerializable(
        persisted.understanding
          .concepts,
      ),

    currentTopic:
      persisted.understanding
        .currentTopic,

    semanticContext:
      cloneSerializable(
        persisted.understanding
          .semanticContext,
      ),

    lastAnalysis:
      null,

    pendingConfirmation:
      cloneSerializable(
        persisted.understanding
          .pendingConfirmation,
      ),
  };

  candidate.entities =
    cloneSerializable(
      persisted.entities,
    );

  candidate.diagnostic =
    cloneSerializable(
      persisted.diagnostic,
    );

  candidate.recommendations =
    cloneSerializable(
      persisted.recommendations,
    );

  candidate.booking =
    cloneSerializable(
      persisted.booking,
    );

  candidate.analytics =
    cloneSerializable(
      persisted.analytics,
    );

  return candidate;
}

export function validatePersistedState(
  persisted,
) {
  // Backward compatible with sessions saved before H3.16.
  if (isPlainObject(persisted?.understanding) && !("conversationalState" in persisted.understanding)) persisted = { ...persisted, understanding: { ...persisted.understanding, conversationalState: null } };
  const errors = [];

  if (
    !validateExactKeys(
      persisted,
      PERSISTED_ROOT_KEYS,
      "persisted",
      errors,
    )
  ) {
    return {
      valid: false,
      errors,
    };
  }

  validateExactKeys(
    persisted.meta,
    PERSISTED_META_KEYS,
    "persisted.meta",
    errors,
  );

  validateExactKeys(
    persisted.ui,
    PERSISTED_UI_KEYS,
    "persisted.ui",
    errors,
  );

  validateExactKeys(
    persisted.page,
    PERSISTED_PAGE_KEYS,
    "persisted.page",
    errors,
  );

  validateExactKeys(
    persisted.understanding,
    PERSISTED_UNDERSTANDING_KEYS,
    "persisted.understanding",
    errors,
  );

  /**
   * Antes de construir el candidato,
   * comprobamos que los bloques necesarios
   * son objetos válidos.
   */
  for (const blockName of [
    "meta",
    "ui",
    "page",
    "conversation",
    "understanding",
    "entities",
    "diagnostic",
    "recommendations",
    "booking",
    "analytics",
  ]) {
    if (
      !isPlainObject(
        persisted[blockName],
      )
    ) {
      if (
        !errors.some(
          (error) =>
            error.path ===
            `persisted.${blockName}`,
        )
      ) {
        errors.push({
          path:
            `persisted.${blockName}`,
          message:
            "must be a plain object",
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  if (
    persisted.meta.schemaVersion !==
      STATE_SCHEMA_VERSION
  ) {
    errors.push({
      path:
        "persisted.meta.schemaVersion",

      message:
        `expected schemaVersion ${STATE_SCHEMA_VERSION}`,
    });
  }

  if (
    typeof persisted.meta
      .chatbotVersion !== "string" ||
    persisted.meta.chatbotVersion
      .trim() === ""
  ) {
    errors.push({
      path:
        "persisted.meta.chatbotVersion",

      message:
        "must be a non-empty string",
    });
  }

  if (
    typeof persisted.meta.sessionId !==
      "string" ||
    persisted.meta.sessionId
      .trim() === ""
  ) {
    errors.push({
      path:
        "persisted.meta.sessionId",

      message:
        "must be a non-empty string",
    });
  }

  for (const fieldName of [
    "createdAt",
    "updatedAt",
  ]) {
    if (
      !isValidDateString(
        persisted.meta[fieldName],
      )
    ) {
      errors.push({
        path:
          `persisted.meta.${fieldName}`,

        message:
          "must be a valid date string",
      });
    }
  }

  if (
    typeof persisted.ui.isOpen !==
      "boolean"
  ) {
    errors.push({
      path:
        "persisted.ui.isOpen",

      message:
        "must be a boolean",
    });
  }

  if (
    !Number.isInteger(
      persisted.ui.unreadCount,
    ) ||
    persisted.ui.unreadCount < 0
  ) {
    errors.push({
      path:
        "persisted.ui.unreadCount",

      message:
        "must be an integer >= 0",
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  /**
   * Validamos las invariantes completas
   * reutilizando state.js.
   */
  try {
    const candidate =
      createValidationCandidate(
        persisted,
      );

    const stateValidation =
      validateState(candidate);

    if (!stateValidation.valid) {
      for (
        const error
        of stateValidation.errors
      ) {
        errors.push({
          path:
            error.path.replace(
              /^state/,
              "persisted",
            ),

          message:
            error.message,
        });
      }
    }
  } catch (error) {
    errors.push({
      path: "persisted",
      message:
        error instanceof Error
          ? error.message
          : "unknown validation error",
    });
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

/**
 * ============================================================
 * TTL
 * ============================================================
 */

export function isPersistedStateExpired(
  persisted,
  {
    now = Date.now(),
  } = {},
) {
  if (
    !persisted ||
    !persisted.meta ||
    !isValidDateString(
      persisted.meta.updatedAt,
    )
  ) {
    return true;
  }

  const updatedAt =
    Date.parse(
      persisted.meta.updatedAt,
    );

  const ageMs =
    now - updatedAt;

  /**
   * Un pequeño desfase de reloj futuro
   * no convierte la sesión en expirada.
   */
  if (ageMs < 0) {
    return false;
  }

  return ageMs > STORAGE_TTL_MS;
}

/**
 * ============================================================
 * LECTURA / ESCRITURA LOW-LEVEL
 * ============================================================
 */

function writeRaw(serialized) {
  ensureStorageInitialized();

  /**
   * Mantenemos siempre una copia en memoria.
   */
  memoryStorageValue =
    serialized;

  if (
    persistentStorageAvailable &&
    activeStorage
  ) {
    try {
      activeStorage.setItem(
        STORAGE_KEY,
        serialized,
      );

      return "sessionStorage";
    } catch (error) {
      /**
       * QuotaExceededError,
       * SecurityError, etc.
       *
       * Desde este momento degradamos
       * a memoria.
       */
      persistentStorageAvailable =
        false;

      debugLog(
        "sessionStorage write failed; falling back to memory",
        error,
      );
    }
  }

  return "memory";
}

function readRaw() {
  ensureStorageInitialized();

  if (
    persistentStorageAvailable &&
    activeStorage
  ) {
    try {
      const value =
        activeStorage.getItem(
          STORAGE_KEY,
        );

      if (
        typeof value === "string"
      ) {
        memoryStorageValue =
          value;
      }

      return value;
    } catch (error) {
      persistentStorageAvailable =
        false;

      debugLog(
        "sessionStorage read failed; falling back to memory",
        error,
      );
    }
  }

  return memoryStorageValue;
}

function removeRaw() {
  ensureStorageInitialized();

  memoryStorageValue = null;

  if (
    persistentStorageAvailable &&
    activeStorage
  ) {
    try {
      activeStorage.removeItem(
        STORAGE_KEY,
      );
    } catch (error) {
      persistentStorageAvailable =
        false;

      debugLog(
        "sessionStorage remove failed",
        error,
      );
    }
  }
}

/**
 * ============================================================
 * SAVE
 * ============================================================
 */

export function saveState(
  snapshot = getState(),
) {
  ensureStorageInitialized();

  const persisted =
    buildPersistedState(snapshot);

  const serialized =
    JSON.stringify(persisted);

  if (
    serialized ===
    lastSerializedValue
  ) {
    return createStorageResult({
      saved: false,
      reason: "unchanged",
      bytes:
        serialized.length,
    });
  }

  const mode =
    writeRaw(serialized);

  lastSerializedValue =
    serialized;

  debugLog(
    "chatbot state saved",
    {
      mode,
      bytes:
        serialized.length,
    },
  );

  return createStorageResult({
    saved: true,
    reason: "saved",
    mode,
    persistent:
      mode === "sessionStorage",
    bytes:
      serialized.length,
  });
}

/**
 * ============================================================
 * DEBOUNCE
 * ============================================================
 */

export function scheduleStateSave(
  snapshot = getState(),
) {
  ensureStorageInitialized();

  pendingSnapshot =
    cloneSerializable(snapshot);

  if (
    pendingSaveTimer !== null
  ) {
    clearTimeout(
      pendingSaveTimer,
    );
  }

  pendingSaveTimer =
    setTimeout(
      () => {
        const snapshotToSave =
          pendingSnapshot;

        pendingSnapshot = null;
        pendingSaveTimer = null;

        try {
          saveState(
            snapshotToSave ??
              getState(),
          );
        } catch (error) {
          /**
           * Un fallo de persistencia jamás
           * debe tumbar la aplicación.
           */
          debugLog(
            "scheduled state save failed",
            error,
          );
        }
      },
      STORAGE_DEBOUNCE_MS,
    );

  return createStorageResult({
    scheduled: true,
  });
}

/**
 * Fuerza el guardado inmediatamente.
 *
 * Muy útil antes de abandonar una página.
 */
export function flushStateSave() {
  ensureStorageInitialized();

  if (
    pendingSaveTimer !== null
  ) {
    clearTimeout(
      pendingSaveTimer,
    );

    pendingSaveTimer = null;
  }

  const snapshot =
    pendingSnapshot ??
    getState();

  pendingSnapshot = null;

  return saveState(snapshot);
}

/**
 * ============================================================
 * CLEAR
 * ============================================================
 */

export function clearState() {
  ensureStorageInitialized();

  if (
    pendingSaveTimer !== null
  ) {
    clearTimeout(
      pendingSaveTimer,
    );

    pendingSaveTimer = null;
  }

  pendingSnapshot = null;

  removeRaw();

  lastSerializedValue = null;

  debugLog(
    "persisted chatbot state cleared",
    {
      key: STORAGE_KEY,
    },
  );

  return createStorageResult({
    cleared: true,
  });
}

/**
 * ============================================================
 * LOAD / RESTORE
 * ============================================================
 */

export function loadState({
  now = Date.now(),
  clearInvalid = true,
} = {}) {
  ensureStorageInitialized();

  const raw = readRaw();

  if (
    typeof raw !== "string" ||
    raw.trim() === ""
  ) {
    return createStorageResult({
      restored: false,
      reason: "missing",
    });
  }

  let persisted;

  try {
    persisted =
      JSON.parse(raw);
  } catch (error) {
    debugLog(
      "persisted state JSON parse failed",
      error,
    );

    if (clearInvalid) {
      clearState();
    }

    return createStorageResult({
      restored: false,
      reason: "invalid_json",
    });
  }

  /**
   * Schema incompatible:
   * no intentamos migración automática V1.
   */
  if (
    isPlainObject(persisted) &&
    isPlainObject(
      persisted.meta,
    ) &&
    persisted.meta.schemaVersion !==
      STATE_SCHEMA_VERSION
  ) {
    if (clearInvalid) {
      clearState();
    }

    return createStorageResult({
      restored: false,
      reason:
        "incompatible_schema",
    });
  }

  const validation =
    validatePersistedState(
      persisted,
    );

  if (!validation.valid) {
    debugLog(
      "persisted state validation failed",
      validation.errors,
    );

    if (clearInvalid) {
      clearState();
    }

    return createStorageResult({
      restored: false,
      reason: "invalid_state",
      errors:
        validation.errors,
    });
  }

  if (
    isPersistedStateExpired(
      persisted,
      {
        now,
      },
    )
  ) {
    if (clearInvalid) {
      clearState();
    }

    return createStorageResult({
      restored: false,
      reason: "expired",
    });
  }

  try {
    const restoredState =
      restorePersistedState(
        persisted,
      );

    /**
     * Conservamos la serialización original
     * como referencia anti-escritura duplicada.
     */
    lastSerializedValue = raw;

    debugLog(
      "chatbot state restored",
      {
        sessionId:
          restoredState.meta.sessionId,
      },
    );

    return createStorageResult({
      restored: true,
      reason: "restored",
      state:
        restoredState,
    });
  } catch (error) {
    debugLog(
      "persisted state restore failed",
      error,
    );

    if (clearInvalid) {
      clearState();
    }

    return createStorageResult({
      restored: false,
      reason: "restore_failed",
    });
  }
}

/**
 * ============================================================
 * SINCRONIZACIÓN AUTOMÁTICA
 * ============================================================
 */

export function startStorageSync({
  bindPagehide = true,
} = {}) {
  ensureStorageInitialized();

  if (
    typeof unsubscribeState ===
    "function"
  ) {
    return getStorageStatus();
  }

  unsubscribeState =
    subscribe(
      (snapshot) => {
        scheduleStateSave(
          snapshot,
        );
      },
    );

  /**
   * pagehide es mejor que depender únicamente
   * de beforeunload:
   *
   * - navegación normal;
   * - back/forward cache;
   * - cambio de página.
   */
  if (
    bindPagehide &&
    typeof globalThis
      .addEventListener === "function"
  ) {
    pagehideHandler =
      () => {
        try {
          flushStateSave();
        } catch (error) {
          debugLog(
            "pagehide state flush failed",
            error,
          );
        }
      };

    globalThis.addEventListener(
      "pagehide",
      pagehideHandler,
    );
  }

  debugLog(
    "storage synchronization started",
  );

  return getStorageStatus();
}

export function stopStorageSync({
  flush = false,
} = {}) {
  if (
    flush &&
    storageInitialized
  ) {
    try {
      flushStateSave();
    } catch (error) {
      debugLog(
        "storage flush during stop failed",
        error,
      );
    }
  } else {
    if (
      pendingSaveTimer !== null
    ) {
      clearTimeout(
        pendingSaveTimer,
      );
    }

    pendingSaveTimer = null;
    pendingSnapshot = null;
  }

  if (
    typeof unsubscribeState ===
    "function"
  ) {
    unsubscribeState();

    unsubscribeState = null;
  }

  if (
    pagehideHandler &&
    typeof globalThis
      .removeEventListener ===
      "function"
  ) {
    globalThis.removeEventListener(
      "pagehide",
      pagehideHandler,
    );
  }

  pagehideHandler = null;

  return getStorageStatus();
}

/**
 * ============================================================
 * DEBUG / DIAGNÓSTICO
 * ============================================================
 */

/**
 * No devuelve el contenido persistido,
 * solo metadatos seguros.
 */
export function getPersistedStateInfo() {
  const raw = readRaw();

  if (
    typeof raw !== "string"
  ) {
    return {
      exists: false,
      bytes: 0,
      schemaVersion: null,
      updatedAt: null,
    };
  }

  try {
    const parsed =
      JSON.parse(raw);

    return {
      exists: true,
      bytes:
        raw.length,

      schemaVersion:
        parsed?.meta
          ?.schemaVersion ??
        null,

      updatedAt:
        parsed?.meta
          ?.updatedAt ??
        null,
    };
  } catch {
    return {
      exists: true,
      bytes:
        raw.length,

      schemaVersion: null,
      updatedAt: null,

      corrupted: true,
    };
  }
}