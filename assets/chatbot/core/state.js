import { isConversationV2 } from './conversational-state-v2.js';
/**
 * Asistente de Víctor
 * Estado central de la aplicación.
 *
 * PREPROD.1.11.7 — Modelo de estado
 * HITO I0 — Shell funcional
 *
 * Este módulo mantiene el estado operativo del asistente.
 * El estado debe ser siempre serializable mediante JSON.
 */

import {
  CHATBOT_VERSION,
  STATE_SCHEMA_VERSION,
  chatbotConfig,
  debugLog,
} from "./config.js";

/**
 * Estado técnico del bootstrap.
 */
export const BOOTSTRAP_STATUS = Object.freeze({
  INITIALIZING: "initializing",
  READY: "ready",
  FAILED: "failed",
});

/**
 * Estado general de la conversación.
 */
export const CONVERSATION_STATUS = Object.freeze({
  IDLE: "idle",
  ACTIVE: "active",
  DIAGNOSTIC: "diagnostic",
  HANDOFF: "handoff",
  ENDED: "ended",
});

/**
 * Estado del diagnóstico conversacional.
 */
export const DIAGNOSTIC_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  COLLECTING: "collecting",
  READY: "ready",
  PREFILLED: "prefilled",
  COMPLETED: "completed",
});

/**
 * Estado de la integración de reserva.
 *
 * Solo Calendly podrá llevar el estado hasta SCHEDULED.
 */
export const BOOKING_STATUS = Object.freeze({
  IDLE: "idle",
  OFFERED: "offered",
  OPENED: "opened",
  TIME_SELECTED: "time_selected",
  SCHEDULED: "scheduled",
});

/**
 * Estados funcionales del avatar.
 *
 * Algunas animaciones efímeras, como un frame concreto de parpadeo,
 * podrán gestionarse directamente desde avatar.js sin persistirse.
 */
export const AVATAR_STATUS = Object.freeze({
  IDLE: "idle",
  BLINK: "blink",
  HOVER: "hover",
  THINKING: "thinking",
  SPEAKING: "speaking",
  NOTIFICATION: "notification",
});

/**
 * Nivel de confianza del análisis NLU.
 */
export const CONFIDENCE_BUCKET = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
});
/**
 * Relaciones semánticas seguras para continuidad entre turnos.
 *
 * No almacenamos el texto libre de la pregunta anterior: solo
 * la relación y una referencia canónica al sujeto en Knowledge.
 */
export const SEMANTIC_RELATION = Object.freeze({
  EXPERIENCE_WITH: "experience_with",
  TRAINING_IN: "training_in",
  WORKS_WITH: "works_with",
});

export const SEMANTIC_SUBJECT_TYPE = Object.freeze({
  TECHNOLOGY: "technology",
});

/**
 * Roles admitidos para los mensajes.
 */
export const MESSAGE_ROLE = Object.freeze({
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
});

/**
 * Tipos estructurados de mensaje.
 *
 * Nunca almacenaremos HTML libre dentro de un mensaje.
 */
export const MESSAGE_TYPE = Object.freeze({
  TEXT: "text",
  PROJECT_CARD: "project_card",
  SOLUTION_CARD: "solution_card",
  DIAGNOSTIC_CARD: "diagnostic_card",
  BOOKING_CARD: "booking_card",
  NOTICE: "notice",
});

/**
 * Número máximo de mensajes que podrá conservar
 * el estado persistible de la V1.
 */
export const MAX_STORED_MESSAGES =
  chatbotConfig.storage.maxStoredMessages;

/**
 * Valores estructurales exportados para que otros módulos
 * no tengan que importar config.js únicamente para consultarlos.
 */
export {
  CHATBOT_VERSION,
  STATE_SCHEMA_VERSION,
};

/**
 * Comprobación de desarrollo.
 */
debugLog("state.js constants loaded", {
  chatbotVersion: CHATBOT_VERSION,
  schemaVersion: STATE_SCHEMA_VERSION,
  maxStoredMessages: MAX_STORED_MESSAGES,
});
/**
 * Genera un identificador anónimo.
 *
 * Preferimos crypto.randomUUID() cuando está disponible.
 * El fallback existe para mantener compatibilidad defensiva.
 */
function createAnonymousId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
  ].join("-");
}

/**
 * Devuelve el estado inicial completo del asistente.
 *
 * Cada llamada debe producir un objeto nuevo e independiente.
 * El resultado debe poder serializarse completamente mediante JSON.
 */
export function createInitialState() {
  const now = new Date().toISOString();

  return {
    meta: {
      schemaVersion: STATE_SCHEMA_VERSION,
      chatbotVersion: CHATBOT_VERSION,

      sessionId: createAnonymousId(),

      createdAt: now,
      updatedAt: now,
    },

    bootstrap: {
      status: BOOTSTRAP_STATUS.INITIALIZING,

      shellMounted: false,

      coreLoaded: false,
      coreLoading: false,

      restoredFromSession: false,
    },

    page: {
      current: {
        path: null,
        pageId: null,
        pageType: null,
        section: null,
        locale: "es",
        title: null,

        projectId: null,
        solutionId: null,
        serviceId: null,
      },

      previous: null,
    },

    ui: {
      isOpen: chatbotConfig.ui.initialOpen,

      typing: false,

      avatarState: AVATAR_STATUS.IDLE,

      activeQuickReplies: [],

      unreadCount: 0,

      reducedMotion: false,
    },

    conversation: {
      id: null,

      status: CONVERSATION_STATUS.IDLE,

      started: false,

      startedAt: null,
      lastActivityAt: null,

      turnCount: 0,

      messages: [],

      lastQuestionId: null,
      askedQuestionIds: [],

      lastAction: null,

      consecutiveFallbacks: 0,
      totalFallbacks: 0,
    },

    understanding: {
      conversationalState: null,
      primaryIntent: null,
      secondaryIntents: [],

      confidence: null,
      confidenceBucket: null,

      concepts: [],

      currentTopic: null,

      semanticContext: {
        relation: null,
        subjectType: null,
        subjectId: null,
      },

      lastAnalysis: null,

      pendingConfirmation: null,
    },

    entities: {
      contact: {
        name: null,
        company: null,
        email: null,
        phone: null,
      },

      case: {
        needs: [],
        tools: [],

        currentProcess: null,

        frequency: null,

        users: null,

        volume: {
          files: null,
          records: null,
          sources: null,
          other: null,
        },

        objective: null,

        timeframe: null,

        businessArea: null,
      },
    },

    diagnostic: {
      status: DIAGNOSTIC_STATUS.NOT_STARTED,

      startedAt: null,
      completedAt: null,

      fields: {
        name: null,
        company: null,
        email: null,
        phone: null,

        needs: [],

        currentProcess: null,

        users: null,

        timeframe: null,

        objective: null,

        additionalInfo: null,
      },

      missingFields: [],

      completionRatio: 0,

      summary: null,
    },

    recommendations: {
      projects: [],
      solutions: [],
      services: [],

      lastRecommendationType: null,
      lastRecommendationId: null,
    },

    booking: {
      status: BOOKING_STATUS.IDLE,

      source: null,

      offeredAt: null,
      openedAt: null,
      timeSelectedAt: null,
      scheduledAt: null,

      prefill: {
        name: null,
        email: null,
      },
    },

    analytics: {
      chatStartSent: false,

      diagnosticStartedSent: false,
      diagnosticCompletedSent: false,

      generateLeadSent: false,

      bookingScheduledSent: false,
    },

    errors: {
      count: 0,

      lastError: null,
    },
  };
}
/**
 * Estado central vivo del chatbot.
 *
 * Nunca debe exportarse directamente para evitar
 * modificaciones arbitrarias desde otros módulos.
 */
let state = createInitialState();

/**
 * Módulos suscritos a cambios de estado.
 *
 * Set evita registrar accidentalmente
 * el mismo listener más de una vez.
 */
const subscribers = new Set();

/**
 * Genera una copia independiente de un valor serializable.
 *
 * structuredClone() es la opción preferida.
 * El fallback JSON es seguro porque nuestro state
 * está diseñado expresamente para ser serializable.
 */
function cloneSerializable(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Devuelve una fotografía independiente del estado actual.
 *
 * El consumidor puede leer o modificar esta copia
 * sin alterar el estado interno real.
 */
export function getState() {
  return cloneSerializable(state);
}

/**
 * Notifica un cambio de estado a todos los suscriptores.
 *
 * El fallo de un listener no debe impedir que los demás
 * reciban la notificación.
 */
function notifySubscribers(change = {}) {
  const snapshot = getState();

  for (const listener of subscribers) {
    try {
      listener(snapshot, change);
    } catch (error) {
      debugLog("state subscriber failed", error);
    }
  }
}

/**
 * Actualiza el estado de forma controlada.
 *
 * La modificación se realiza sobre una copia.
 * Solo si el updater termina correctamente esa copia
 * sustituye al estado real.
 *
 * Esto evita dejar el estado parcialmente modificado
 * si una operación falla a mitad.
 */
export function updateState(
  updater,
  { source = "unknown" } = {},
) {
  if (typeof updater !== "function") {
    throw new TypeError(
      "updateState() requires an updater function",
    );
  }

  /**
   * Trabajamos siempre sobre una copia.
   *
   * El state real no se toca hasta que
   * la mutación haya sido validada.
   */
  const nextState =
    cloneSerializable(state);

  updater(nextState);

  nextState.meta.updatedAt =
    new Date().toISOString();

  /**
   * Validación transaccional.
   *
   * Si falla:
   * - no hacemos commit;
   * - no notificamos subscribers;
   * - el state anterior permanece intacto.
   */
  const validation =
    validateState(nextState);

  if (!validation.valid) {
    debugLog(
      "state update rejected",
      {
        source,
        errors:
          validation.errors,
      },
    );

    const error = new Error(
      `State update rejected from "${source}"`,
    );

    error.name =
      "StateValidationError";

    error.validationErrors =
      validation.errors;

    throw error;
  }

  state = nextState;

  debugLog(
    "state updated",
    {
      source,
      updatedAt:
        state.meta.updatedAt,
    },
  );

  notifySubscribers({
    type: "state_updated",
    source,
    updatedAt:
      state.meta.updatedAt,
  });

  return getState();
}

/**
 * Registra un listener para cambios de estado.
 *
 * Devuelve una función unsubscribe para que el módulo
 * pueda eliminar limpiamente su suscripción.
 */
export function subscribe(listener) {
  if (typeof listener !== "function") {
    throw new TypeError(
      "subscribe() requires a listener function",
    );
  }

  subscribers.add(listener);

  debugLog("state subscriber added", {
    subscribers: subscribers.size,
  });

  return function unsubscribe() {
    subscribers.delete(listener);

    debugLog("state subscriber removed", {
      subscribers: subscribers.size,
    });
  };
}
/**
 * Comprueba si un valor pertenece a uno de nuestros
 * catálogos de estados permitidos.
 */
function isAllowedStateValue(catalog, value) {
  return Object.values(catalog).includes(value);
}

/**
 * Abre o cierra funcionalmente la ventana del asistente.
 */
export function setUiOpen(isOpen) {
  if (typeof isOpen !== "boolean") {
    throw new TypeError(
      "setUiOpen() requires a boolean",
    );
  }

  return updateState(
    (draft) => {
      draft.ui.isOpen = isOpen;
    },
    {
      source: "ui:set_open",
    },
  );
}

/**
 * Marca si el asistente está mostrando el indicador de escritura.
 * Es estado UI efímero y no se persiste.
 */
export function setUiTyping(isTyping) {
  if (typeof isTyping !== "boolean") {
    throw new TypeError(
      "setUiTyping() requires a boolean",
    );
  }

  return updateState(
    (draft) => {
      draft.ui.typing = isTyping;
    },
    {
      source: "ui:set_typing",
    },
  );
}

/**
 * Sincroniza el estado semántico/visual del avatar.
 * El controller UI decide cómo representarlo.
 */
export function setUiAvatarState(avatarState) {
  if (
    !isAllowedStateValue(
      AVATAR_STATUS,
      avatarState,
    )
  ) {
    throw new RangeError(
      `Invalid avatar state: ${avatarState}`,
    );
  }

  return updateState(
    (draft) => {
      draft.ui.avatarState =
        avatarState;
    },
    {
      source: "ui:set_avatar_state",
    },
  );
}

/**
 * Cambia el estado general de la conversación.
 */
export function setConversationStatus(status) {
  if (
    !isAllowedStateValue(
      CONVERSATION_STATUS,
      status,
    )
  ) {
    throw new RangeError(
      `Invalid conversation status: ${status}`,
    );
  }

  return updateState(
    (draft) => {
      draft.conversation.status = status;
    },
    {
      source: "conversation:set_status",
    },
  );
}

/**
 * Inicia una conversación real.
 *
 * Abrir el widget no inicia por sí mismo una conversación.
 * Esta función deberá ejecutarse con la primera interacción
 * real del visitante.
 *
 * Es idempotente:
 * si la conversación ya ha comenzado, no genera un nuevo
 * conversation.id ni modifica startedAt.
 */
export function startConversation() {
  return updateState(
    (draft) => {
      const now = new Date().toISOString();

      if (draft.conversation.started) {
        draft.conversation.lastActivityAt = now;
        return;
      }

      if (draft.conversation.id === null) {
        draft.conversation.id =
          createAnonymousId();
      }

      draft.conversation.started = true;

      draft.conversation.status =
        CONVERSATION_STATUS.ACTIVE;

      draft.conversation.startedAt = now;
      draft.conversation.lastActivityAt = now;
    },
    {
      source: "conversation:start",
    },
  );
}
/**
 * Añade un mensaje estructurado a la conversación.
 *
 * Nunca almacenamos HTML libre.
 * El contenido introducido por el visitante se conserva
 * únicamente como texto y posteriormente deberá renderizarse
 * mediante textContent.
 *
 * Un primer mensaje del usuario inicia automáticamente
 * la conversación real.
 */
export function appendMessage(message) {
  if (
    !message ||
    typeof message !== "object" ||
    Array.isArray(message)
  ) {
    throw new TypeError(
      "appendMessage() requires a message object",
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      message,
      "html",
    )
  ) {
    throw new TypeError(
      "Messages cannot contain an html property",
    );
  }

  const {
    role,
    type = MESSAGE_TYPE.TEXT,
    text = null,
    responseId = null,
    projectId = null,
    solutionId = null,
  } = message;

  if (
    !isAllowedStateValue(
      MESSAGE_ROLE,
      role,
    )
  ) {
    throw new RangeError(
      `Invalid message role: ${role}`,
    );
  }

  if (
    !isAllowedStateValue(
      MESSAGE_TYPE,
      type,
    )
  ) {
    throw new RangeError(
      `Invalid message type: ${type}`,
    );
  }

  /**
   * Los mensajes text y notice necesitan texto real.
   */
  if (
    (
      type === MESSAGE_TYPE.TEXT ||
      type === MESSAGE_TYPE.NOTICE
    ) &&
    (
      typeof text !== "string" ||
      text.trim() === ""
    )
  ) {
    throw new TypeError(
      `${type} messages require non-empty text`,
    );
  }

  /**
   * Las tarjetas se almacenan mediante identificadores,
   * no copiando toda la información del proyecto/solución.
   */
  if (
    type === MESSAGE_TYPE.PROJECT_CARD &&
    (
      typeof projectId !== "string" ||
      projectId.trim() === ""
    )
  ) {
    throw new TypeError(
      "project_card messages require projectId",
    );
  }

  if (
    type === MESSAGE_TYPE.SOLUTION_CARD &&
    (
      typeof solutionId !== "string" ||
      solutionId.trim() === ""
    )
  ) {
    throw new TypeError(
      "solution_card messages require solutionId",
    );
  }

  const now = new Date().toISOString();

  const structuredMessage = {
    id: `msg_${createAnonymousId()}`,
    role,
    type,
    createdAt: now,
  };

  if (typeof text === "string") {
    structuredMessage.text = text;
  }

  if (
    typeof responseId === "string" &&
    responseId.trim() !== ""
  ) {
    structuredMessage.responseId =
      responseId.trim();
  }

  if (
    typeof projectId === "string" &&
    projectId.trim() !== ""
  ) {
    structuredMessage.projectId =
      projectId.trim();
  }

  if (
    typeof solutionId === "string" &&
    solutionId.trim() !== ""
  ) {
    structuredMessage.solutionId =
      solutionId.trim();
  }

  return updateState(
    (draft) => {
      /**
       * El primer mensaje real del visitante inicia
       * automáticamente la conversación.
       */
      if (
        role === MESSAGE_ROLE.USER &&
        !draft.conversation.started
      ) {
        if (draft.conversation.id === null) {
          draft.conversation.id =
            createAnonymousId();
        }

        draft.conversation.started = true;

        draft.conversation.status =
          CONVERSATION_STATUS.ACTIVE;

        draft.conversation.startedAt = now;
      }

      /**
       * turnCount cuenta turnos del visitante,
       * no respuestas del asistente.
       */
      if (role === MESSAGE_ROLE.USER) {
        draft.conversation.turnCount += 1;
      }

      draft.conversation.lastActivityAt = now;

      draft.conversation.messages.push(
        structuredMessage,
      );

      /**
       * Impedimos que el buffer crezca indefinidamente.
       */
      if (
        draft.conversation.messages.length >
        MAX_STORED_MESSAGES
      ) {
        draft.conversation.messages =
          draft.conversation.messages.slice(
            -MAX_STORED_MESSAGES,
          );
      }
    },
    {
      source: "conversation:append_message",
    },
  );
}
/**
 * Normaliza y valida un identificador de pregunta.
 */
function normalizeQuestionId(questionId) {
  if (
    typeof questionId !== "string" ||
    questionId.trim() === ""
  ) {
    throw new TypeError(
      "questionId must be a non-empty string",
    );
  }

  return questionId.trim();
}

/**
 * Comprueba si una pregunta ya ha sido realizada
 * durante la conversación actual.
 */
export function hasAskedQuestion(questionId) {
  const normalizedQuestionId =
    normalizeQuestionId(questionId);

  return state.conversation.askedQuestionIds.includes(
    normalizedQuestionId,
  );
}

/**
 * Registra una pregunta como realizada.
 *
 * Es idempotente:
 * registrar dos veces el mismo questionId
 * no genera duplicados.
 */
export function markQuestionAsked(questionId) {
  const normalizedQuestionId =
    normalizeQuestionId(questionId);

  if (hasAskedQuestion(normalizedQuestionId)) {
    return getState();
  }

  return updateState(
    (draft) => {
      draft.conversation.askedQuestionIds.push(
        normalizedQuestionId,
      );

      draft.conversation.lastQuestionId =
        normalizedQuestionId;
    },
    {
      source: "conversation:mark_question_asked",
    },
  );
}
/**
 * Normaliza un identificador opcional.
 *
 * null significa ausencia deliberada de valor.
 */
function normalizeOptionalIdentifier(
  value,
  fieldName,
) {
  if (value === null) {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      `${fieldName} must be null or a non-empty string`,
    );
  }

  return value.trim();
}

/**
 * Normaliza una lista de identificadores/textos:
 * - obliga a utilizar array;
 * - elimina espacios;
 * - rechaza valores inválidos;
 * - elimina duplicados;
 * - devuelve un array nuevo.
 */
function normalizeStringList(
  values,
  fieldName,
) {
  if (!Array.isArray(values)) {
    throw new TypeError(
      `${fieldName} must be an array`,
    );
  }

  const normalizedValues = values.map(
    (value) => {
      if (
        typeof value !== "string" ||
        value.trim() === ""
      ) {
        throw new TypeError(
          `${fieldName} can only contain non-empty strings`,
        );
      }

      return value.trim();
    },
  );

  return [...new Set(normalizedValues)];
}

/**
 * Valida el nivel numérico de confianza.
 */
function normalizeConfidence(confidence) {
  if (confidence === null) {
    return null;
  }

  if (
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new RangeError(
      "confidence must be null or a number between 0 and 1",
    );
  }

  return confidence;
}
/**
 * Guarda el último resultado útil del futuro motor NLU.
 *
 * No interpreta el mensaje.
 * Únicamente almacena de forma estructurada
 * lo que nlu.js haya determinado.
 */
export function setIntentResult({
  primaryIntent = null,
  secondaryIntents = [],
  confidence = null,
  confidenceBucket = null,
  concepts = [],
  lastAnalysis = null,
} = {}) {
  const normalizedPrimaryIntent =
    normalizeOptionalIdentifier(
      primaryIntent,
      "primaryIntent",
    );

  const normalizedSecondaryIntents =
    normalizeStringList(
      secondaryIntents,
      "secondaryIntents",
    ).filter(
      (intentId) =>
        intentId !== normalizedPrimaryIntent,
    );

  const normalizedConfidence =
    normalizeConfidence(confidence);

  if (
    confidenceBucket !== null &&
    !isAllowedStateValue(
      CONFIDENCE_BUCKET,
      confidenceBucket,
    )
  ) {
    throw new RangeError(
      `Invalid confidence bucket: ${confidenceBucket}`,
    );
  }

  const normalizedConcepts =
    normalizeStringList(
      concepts,
      "concepts",
    );

  if (
    lastAnalysis !== null &&
    (
      typeof lastAnalysis !== "object" ||
      Array.isArray(lastAnalysis)
    )
  ) {
    throw new TypeError(
      "lastAnalysis must be null or an object",
    );
  }

  const safeLastAnalysis =
    lastAnalysis === null
      ? null
      : cloneSerializable(lastAnalysis);

  return updateState(
    (draft) => {
      draft.understanding.primaryIntent =
        normalizedPrimaryIntent;

      draft.understanding.secondaryIntents =
        [...normalizedSecondaryIntents];

      draft.understanding.confidence =
        normalizedConfidence;

      draft.understanding.confidenceBucket =
        confidenceBucket;

      draft.understanding.concepts =
        [...normalizedConcepts];

      draft.understanding.lastAnalysis =
        safeLastAnalysis;
    },
    {
      source: "understanding:set_intent_result",
    },
  );
}
/**
 * Define el tema conversacional actualmente activo.
 *
 * currentTopic no es necesariamente igual
 * al último intent detectado.
 *
 * Ejemplo:
 * topic = automation
 * último mensaje = "sí"
 */
export function setCurrentTopic(topic) {
  const normalizedTopic =
    normalizeOptionalIdentifier(
      topic,
      "currentTopic",
    );

  return updateState(
    (draft) => {
      draft.understanding.currentTopic =
        normalizedTopic;
    },
    {
      source: "understanding:set_current_topic",
    },
  );
}

/**
 * Guarda el contexto semántico mínimo necesario para
 * resolver follow-ups entre turnos sin persistir texto libre.
 */
export function setSemanticContext({
  relation,
  subjectType,
  subjectId,
} = {}) {
  if (
    !isAllowedStateValue(
      SEMANTIC_RELATION,
      relation,
    )
  ) {
    throw new RangeError(
      `Invalid semantic relation: ${relation}`,
    );
  }

  if (
    !isAllowedStateValue(
      SEMANTIC_SUBJECT_TYPE,
      subjectType,
    )
  ) {
    throw new RangeError(
      `Invalid semantic subject type: ${subjectType}`,
    );
  }

  const normalizedSubjectId =
    normalizeOptionalIdentifier(
      subjectId,
      "semanticContext.subjectId",
    );

  if (normalizedSubjectId === null) {
    throw new TypeError(
      "semanticContext.subjectId must be a non-empty string",
    );
  }

  return updateState(
    (draft) => {
      draft.understanding.semanticContext = {
        relation,
        subjectType,
        subjectId: normalizedSubjectId,
      };
    },
    {
      source: "understanding:set_semantic_context",
    },
  );
}

/**
 * Limpia el contexto semántico heredable.
 */
export function clearSemanticContext() {
  return updateState(
    (draft) => {
      draft.understanding.semanticContext = {
        relation: null,
        subjectType: null,
        subjectId: null,
      };
    },
    {
      source: "understanding:clear_semantic_context",
    },
  );
}


/**
 * Guarda o elimina una confirmación pendiente.
 *
 * Ejemplo futuro:
 * {
 *   type: "intent",
 *   candidate: "automation",
 *   promptId: "confirm.automation"
 * }
 */
export function setPendingConfirmation(
  confirmation,
) {
  if (confirmation === null) {
    return updateState(
      (draft) => {
        draft.understanding.pendingConfirmation =
          null;
      },
      {
        source:
          "understanding:clear_pending_confirmation",
      },
    );
  }

  if (
    typeof confirmation !== "object" ||
    Array.isArray(confirmation)
  ) {
    throw new TypeError(
      "pendingConfirmation must be null or an object",
    );
  }

  const safeConfirmation =
    cloneSerializable(confirmation);

  return updateState(
    (draft) => {
      draft.understanding.pendingConfirmation =
        safeConfirmation;
    },
    {
      source:
        "understanding:set_pending_confirmation",
    },
  );
}
/**
 * Normaliza un texto opcional.
 *
 * null permite borrar deliberadamente un valor conocido.
 */
function normalizeOptionalText(
  value,
  fieldName,
) {
  if (value === null) {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      `${fieldName} must be null or a non-empty string`,
    );
  }

  return value.trim();
}

/**
 * Normaliza cantidades estructuradas.
 *
 * En V1 usamos enteros >= 0 para:
 * usuarios, archivos, registros y fuentes.
 */
function normalizeOptionalCount(
  value,
  fieldName,
) {
  if (value === null) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new RangeError(
      `${fieldName} must be null or an integer >= 0`,
    );
  }

  return value;
}

/**
 * Fusiona entidades conversacionales conocidas.
 *
 * Solo modifica los campos expresamente recibidos.
 * Los datos anteriores no mencionados se conservan.
 *
 * Una corrección posterior sustituye al valor anterior.
 */
export function mergeEntities({
  contact = undefined,
  case: caseEntities = undefined,
} = {}) {
  if (
    contact !== undefined &&
    (
      contact === null ||
      typeof contact !== "object" ||
      Array.isArray(contact)
    )
  ) {
    throw new TypeError(
      "contact entities must be an object",
    );
  }

  if (
    caseEntities !== undefined &&
    (
      caseEntities === null ||
      typeof caseEntities !== "object" ||
      Array.isArray(caseEntities)
    )
  ) {
    throw new TypeError(
      "case entities must be an object",
    );
  }

  const normalizedContact = {};

  if (contact !== undefined) {
    for (const fieldName of [
      "name",
      "company",
      "email",
      "phone",
    ]) {
      if (
        Object.prototype.hasOwnProperty.call(
          contact,
          fieldName,
        )
      ) {
        normalizedContact[fieldName] =
          normalizeOptionalText(
            contact[fieldName],
            `contact.${fieldName}`,
          );
      }
    }
  }

  const normalizedCase = {};

  if (caseEntities !== undefined) {
    if (
      Object.prototype.hasOwnProperty.call(
        caseEntities,
        "needs",
      )
    ) {
      normalizedCase.needs =
        normalizeStringList(
          caseEntities.needs,
          "entities.case.needs",
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        caseEntities,
        "tools",
      )
    ) {
      normalizedCase.tools =
        normalizeStringList(
          caseEntities.tools,
          "entities.case.tools",
        );
    }

    for (const fieldName of [
      "currentProcess",
      "frequency",
      "objective",
      "timeframe",
      "businessArea",
    ]) {
      if (
        Object.prototype.hasOwnProperty.call(
          caseEntities,
          fieldName,
        )
      ) {
        normalizedCase[fieldName] =
          normalizeOptionalText(
            caseEntities[fieldName],
            `entities.case.${fieldName}`,
          );
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        caseEntities,
        "users",
      )
    ) {
      normalizedCase.users =
        normalizeOptionalCount(
          caseEntities.users,
          "entities.case.users",
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        caseEntities,
        "volume",
      )
    ) {
      const volume = caseEntities.volume;

      if (
        volume === null ||
        typeof volume !== "object" ||
        Array.isArray(volume)
      ) {
        throw new TypeError(
          "entities.case.volume must be an object",
        );
      }

      normalizedCase.volume = {};

      for (const fieldName of [
        "files",
        "records",
        "sources",
      ]) {
        if (
          Object.prototype.hasOwnProperty.call(
            volume,
            fieldName,
          )
        ) {
          normalizedCase.volume[fieldName] =
            normalizeOptionalCount(
              volume[fieldName],
              `entities.case.volume.${fieldName}`,
            );
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(
          volume,
          "other",
        )
      ) {
        normalizedCase.volume.other =
          normalizeOptionalText(
            volume.other,
            "entities.case.volume.other",
          );
      }
    }
  }

  const hasContactChanges =
    Object.keys(normalizedContact).length > 0;

  const hasCaseChanges =
    Object.keys(normalizedCase).length > 0;

  if (
    !hasContactChanges &&
    !hasCaseChanges
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      if (hasContactChanges) {
        Object.assign(
          draft.entities.contact,
          normalizedContact,
        );
      }

      if (hasCaseChanges) {
        const {
          volume,
          ...caseFields
        } = normalizedCase;

        Object.assign(
          draft.entities.case,
          caseFields,
        );

        if (volume !== undefined) {
          Object.assign(
            draft.entities.case.volume,
            volume,
          );
        }
      }
    },
    {
      source: "entities:merge",
    },
  );
}
/**
 * Campos permitidos dentro del diagnóstico V1.
 *
 * Tener esta lista centralizada evita que un typo
 * cree propiedades arbitrarias en diagnostic.fields.
 */
const DIAGNOSTIC_FIELD_NAMES = Object.freeze([
  "name",
  "company",
  "email",
  "phone",
  "needs",
  "currentProcess",
  "users",
  "timeframe",
  "objective",
  "additionalInfo",
]);

/**
 * Cambia el estado funcional del diagnóstico.
 *
 * El diagnóstico mantiene su ciclo de vida independiente
 * del estado general de la conversación.
 */

export function setDiagnosticStatus(status) {
  if (
    !isAllowedStateValue(
      DIAGNOSTIC_STATUS,
      status,
    )
  ) {
    throw new RangeError(
      `Invalid diagnostic status: ${status}`,
    );
  }

  return updateState(
    (draft) => {
      const now = new Date().toISOString();

      draft.diagnostic.status =
        status;

      if (
        status ===
        DIAGNOSTIC_STATUS.NOT_STARTED
      ) {
        draft.diagnostic.startedAt =
          null;

        draft.diagnostic.completedAt =
          null;

        return;
      }

      if (
        draft.diagnostic.startedAt ===
        null
      ) {
        draft.diagnostic.startedAt =
          now;
      }

      if (
        status ===
        DIAGNOSTIC_STATUS.COMPLETED
      ) {
        draft.diagnostic.completedAt =
          now;
      } else {
        draft.diagnostic.completedAt =
          null;
      }
    },
    {
      source: "diagnostic:set_status",
    },
  );
}

/**
 * Actualiza parcialmente los campos del diagnóstico.
 *
 * Solo modifica los campos expresamente recibidos.
 * Los demás se conservan.
 *
 * entities y diagnostic.fields siguen siendo
 * fuentes distintas:
 *
 * entities = lo entendido durante la conversación
 * diagnostic.fields = información preparada/revisada
 * para el flujo de diagnóstico.
 */
export function updateDiagnosticFields(fields) {
  if (
    !fields ||
    typeof fields !== "object" ||
    Array.isArray(fields)
  ) {
    throw new TypeError(
      "updateDiagnosticFields() requires an object",
    );
  }

  const unknownFields =
    Object.keys(fields).filter(
      (fieldName) =>
        !DIAGNOSTIC_FIELD_NAMES.includes(
          fieldName,
        ),
    );

  if (unknownFields.length > 0) {
    throw new RangeError(
      `Unknown diagnostic fields: ${unknownFields.join(", ")}`,
    );
  }

  const normalizedFields = {};

  for (const fieldName of [
    "name",
    "company",
    "email",
    "phone",
    "currentProcess",
    "timeframe",
    "objective",
    "additionalInfo",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        fields,
        fieldName,
      )
    ) {
      normalizedFields[fieldName] =
        normalizeOptionalText(
          fields[fieldName],
          `diagnostic.fields.${fieldName}`,
        );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      fields,
      "needs",
    )
  ) {
    normalizedFields.needs =
      normalizeStringList(
        fields.needs,
        "diagnostic.fields.needs",
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      fields,
      "users",
    )
  ) {
    normalizedFields.users =
      normalizeOptionalCount(
        fields.users,
        "diagnostic.fields.users",
      );
  }

  if (Object.keys(normalizedFields).length === 0) {
    return getState();
  }

  return updateState(
    (draft) => {
      Object.assign(
        draft.diagnostic.fields,
        normalizedFields,
      );
    },
    {
      source: "diagnostic:update_fields",
    },
  );
}
/**
 * Actualiza la evaluación interna del diagnóstico:
 *
 * - campos que todavía faltan;
 * - progreso orientativo;
 * - resumen estructurado.
 *
 * No determina automáticamente qué campos son obligatorios.
 * Esa decisión corresponde a la lógica de diagnóstico.
 */
export function updateDiagnosticAssessment({
  missingFields = undefined,
  completionRatio = undefined,
  summary = undefined,
} = {}) {
  const normalizedAssessment = {};

  if (missingFields !== undefined) {
    const normalizedMissingFields =
      normalizeStringList(
        missingFields,
        "diagnostic.missingFields",
      );

    const unknownFields =
      normalizedMissingFields.filter(
        (fieldName) =>
          !DIAGNOSTIC_FIELD_NAMES.includes(
            fieldName,
          ),
      );

    if (unknownFields.length > 0) {
      throw new RangeError(
        `Unknown missing diagnostic fields: ${unknownFields.join(", ")}`,
      );
    }

    normalizedAssessment.missingFields =
      normalizedMissingFields;
  }

  if (completionRatio !== undefined) {
    if (
      typeof completionRatio !== "number" ||
      !Number.isFinite(completionRatio) ||
      completionRatio < 0 ||
      completionRatio > 1
    ) {
      throw new RangeError(
        "diagnostic.completionRatio must be a number between 0 and 1",
      );
    }

    normalizedAssessment.completionRatio =
      completionRatio;
  }

  if (summary !== undefined) {
    if (
      summary !== null &&
      (
        typeof summary !== "object" ||
        Array.isArray(summary)
      )
    ) {
      throw new TypeError(
        "diagnostic.summary must be null or an object",
      );
    }

    normalizedAssessment.summary =
      summary === null
        ? null
        : cloneSerializable(summary);
  }

  if (
    Object.keys(normalizedAssessment).length === 0
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      if (
        Object.prototype.hasOwnProperty.call(
          normalizedAssessment,
          "missingFields",
        )
      ) {
        draft.diagnostic.missingFields =
          [...normalizedAssessment.missingFields];
      }

      if (
        Object.prototype.hasOwnProperty.call(
          normalizedAssessment,
          "completionRatio",
        )
      ) {
        draft.diagnostic.completionRatio =
          normalizedAssessment.completionRatio;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          normalizedAssessment,
          "summary",
        )
      ) {
        draft.diagnostic.summary =
          normalizedAssessment.summary;
      }
    },
    {
      source: "diagnostic:update_assessment",
    },
  );
}
/**
 * Tipos de recomendación admitidos por el estado.
 */
export const RECOMMENDATION_TYPE = Object.freeze({
  PROJECT: "project",
  SOLUTION: "solution",
  SERVICE: "service",
});

/**
 * Relaciona el tipo singular utilizado por la API
 * con el array correspondiente del state.
 */
const RECOMMENDATION_COLLECTION = Object.freeze({
  [RECOMMENDATION_TYPE.PROJECT]: "projects",
  [RECOMMENDATION_TYPE.SOLUTION]: "solutions",
  [RECOMMENDATION_TYPE.SERVICE]: "services",
});

/**
 * Normaliza y valida un tipo de recomendación.
 */
function normalizeRecommendationType(type) {
  if (
    !isAllowedStateValue(
      RECOMMENDATION_TYPE,
      type,
    )
  ) {
    throw new RangeError(
      `Invalid recommendation type: ${type}`,
    );
  }

  return type;
}

/**
 * Comprueba si una recomendación ya está registrada.
 */
export function hasRecommendation(
  type,
  id,
) {
  const normalizedType =
    normalizeRecommendationType(type);

  const normalizedId =
    normalizeOptionalIdentifier(
      id,
      "recommendation.id",
    );

  const collectionName =
    RECOMMENDATION_COLLECTION[
      normalizedType
    ];

  return state.recommendations[
    collectionName
  ].some(
    (recommendation) =>
      recommendation.id === normalizedId,
  );
}

/**
 * Añade o actualiza una recomendación.
 *
 * Guardamos únicamente:
 * - id;
 * - reasonCode;
 * - shown.
 *
 * Nunca copiamos la ficha completa del proyecto,
 * solución o servicio dentro del state.
 */
export function addRecommendation({
  type,
  id,
  reasonCode,
  shown = false,
} = {}) {
  const normalizedType =
    normalizeRecommendationType(type);

  const normalizedId =
    normalizeOptionalIdentifier(
      id,
      "recommendation.id",
    );

  const normalizedReasonCode =
    normalizeOptionalIdentifier(
      reasonCode,
      "recommendation.reasonCode",
    );

  if (typeof shown !== "boolean") {
    throw new TypeError(
      "recommendation.shown must be a boolean",
    );
  }

  const collectionName =
    RECOMMENDATION_COLLECTION[
      normalizedType
    ];

  const currentRecommendation =
    state.recommendations[
      collectionName
    ].find(
      (recommendation) =>
        recommendation.id === normalizedId,
    );

  /**
   * Si ya existe exactamente con los mismos valores,
   * evitamos generar una actualización artificial.
   */
  if (
    currentRecommendation &&
    currentRecommendation.reasonCode ===
      normalizedReasonCode &&
    currentRecommendation.shown === shown &&
    state.recommendations
      .lastRecommendationType ===
      normalizedType &&
    state.recommendations
      .lastRecommendationId ===
      normalizedId
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      const collection =
        draft.recommendations[
          collectionName
        ];

      const existingIndex =
        collection.findIndex(
          (recommendation) =>
            recommendation.id ===
            normalizedId,
        );

      const recommendation = {
        id: normalizedId,
        reasonCode:
          normalizedReasonCode,
        shown,
      };

      if (existingIndex >= 0) {
        collection[existingIndex] =
          recommendation;
      } else {
        collection.push(
          recommendation,
        );
      }

      draft.recommendations
        .lastRecommendationType =
        normalizedType;

      draft.recommendations
        .lastRecommendationId =
        normalizedId;
    },
    {
      source: "recommendations:add",
    },
  );
}
/**
 * Actualiza el estado previo a la confirmación real
 * de una reserva.
 *
 * SCHEDULED está deliberadamente prohibido aquí.
 * Solo confirmBookingScheduledFromCalendly()
 * puede alcanzar ese estado.
 */
export function setBookingStatus(
  status,
  {
    source = undefined,
  } = {},
) {
  if (
    !isAllowedStateValue(
      BOOKING_STATUS,
      status,
    )
  ) {
    throw new RangeError(
      `Invalid booking status: ${status}`,
    );
  }

  if (
    state.booking.status ===
      BOOKING_STATUS.SCHEDULED
  ) {
    throw new RangeError(
      "A scheduled booking is terminal and cannot be downgraded",
    );
  }

  if (
    status === BOOKING_STATUS.SCHEDULED
  ) {
    throw new RangeError(
      "scheduled can only be confirmed by Calendly",
    );
  }

  let normalizedSource;

  if (source !== undefined) {
    normalizedSource =
      normalizeOptionalIdentifier(
        source,
        "booking.source",
      );
  }

  const currentBooking = state.booking;

  /**
   * Si no cambia ni status ni source,
   * evitamos una actualización artificial.
   */
  if (
    currentBooking.status === status &&
    (
      source === undefined ||
      currentBooking.source === normalizedSource
    )
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      const now = new Date().toISOString();

      draft.booking.status = status;

      if (source !== undefined) {
        draft.booking.source =
          normalizedSource;
      }

      if (
        status === BOOKING_STATUS.OFFERED &&
        draft.booking.offeredAt === null
      ) {
        draft.booking.offeredAt = now;
      }

      if (
        status === BOOKING_STATUS.OPENED &&
        draft.booking.openedAt === null
      ) {
        draft.booking.openedAt = now;
      }

      if (
        status === BOOKING_STATUS.TIME_SELECTED &&
        draft.booking.timeSelectedAt === null
      ) {
        draft.booking.timeSelectedAt = now;
      }
    },
    {
      source: "booking:set_status",
    },
  );
}

/**
 * Confirma una reserva completada.
 *
 * Esta función deberá ser invocada únicamente
 * por integrations/calendly.js como respuesta
 * a un evento real de Calendly.
 *
 * Es idempotente para evitar duplicados.
 */
export function confirmBookingScheduledFromCalendly({
  source = undefined,
} = {}) {
  let normalizedSource;

  if (source !== undefined) {
    normalizedSource =
      normalizeOptionalIdentifier(
        source,
        "booking.source",
      );
  }

  if (
    state.booking.status ===
      BOOKING_STATUS.SCHEDULED &&
    (
      source === undefined ||
      state.booking.source ===
        normalizedSource
    )
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      const now = new Date().toISOString();

      draft.booking.status =
        BOOKING_STATUS.SCHEDULED;

      if (source !== undefined) {
        draft.booking.source =
          normalizedSource;
      }

      if (
        draft.booking.scheduledAt === null
      ) {
        draft.booking.scheduledAt = now;
      }
    },
    {
      source:
        "booking:calendly_scheduled",
    },
  );
}

/**
 * Actualiza los datos mínimos permitidos
 * para el prefill de Calendly.
 *
 * La aceptación legal o cualquier consentimiento
 * nunca forman parte de este prefill.
 */
export function setBookingPrefill({
  name = undefined,
  email = undefined,
} = {}) {
  const normalizedPrefill = {};

  if (name !== undefined) {
    normalizedPrefill.name =
      normalizeOptionalText(
        name,
        "booking.prefill.name",
      );
  }

  if (email !== undefined) {
    normalizedPrefill.email =
      normalizeOptionalText(
        email,
        "booking.prefill.email",
      );
  }

  if (
    Object.keys(normalizedPrefill).length === 0
  ) {
    return getState();
  }

  const noChanges =
    Object.entries(
      normalizedPrefill,
    ).every(
      ([fieldName, value]) =>
        state.booking.prefill[fieldName] ===
        value,
    );

  if (noChanges) {
    return getState();
  }

  return updateState(
    (draft) => {
      Object.assign(
        draft.booking.prefill,
        normalizedPrefill,
      );
    },
    {
      source: "booking:set_prefill",
    },
  );
}
/**
 * Registra un fallo de comprensión.
 *
 * totalFallbacks:
 * número total durante la conversación.
 *
 * consecutiveFallbacks:
 * número de fallos consecutivos desde la
 * última comprensión satisfactoria.
 */
export function incrementFallback() {
  return updateState(
    (draft) => {
      draft.conversation.totalFallbacks += 1;

      draft.conversation.consecutiveFallbacks += 1;
    },
    {
      source: "conversation:increment_fallback",
    },
  );
}

/**
 * Reinicia únicamente la racha consecutiva
 * después de una comprensión satisfactoria.
 *
 * totalFallbacks se conserva como histórico
 * de la conversación actual.
 */
export function resetConsecutiveFallbacks() {
  if (
    state.conversation.consecutiveFallbacks === 0
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      draft.conversation.consecutiveFallbacks = 0;
    },
    {
      source:
        "conversation:reset_consecutive_fallbacks",
    },
  );
}

/**
 * Flags permitidos para evitar duplicar
 * eventos importantes de Analytics.
 *
 * Nunca almacenamos aquí PII ni texto libre.
 */
export const ANALYTICS_FLAG = Object.freeze({
  CHAT_START_SENT: "chatStartSent",
  DIAGNOSTIC_STARTED_SENT:
    "diagnosticStartedSent",
  DIAGNOSTIC_COMPLETED_SENT:
    "diagnosticCompletedSent",
  GENERATE_LEAD_SENT:
    "generateLeadSent",
  BOOKING_SCHEDULED_SENT:
    "bookingScheduledSent",
});

/**
 * Comprueba si un flag de Analytics
 * ya ha sido marcado como enviado.
 */
export function hasAnalyticsFlagBeenSent(
  flagName,
) {
  if (
    !isAllowedStateValue(
      ANALYTICS_FLAG,
      flagName,
    )
  ) {
    throw new RangeError(
      `Invalid analytics flag: ${flagName}`,
    );
  }

  return state.analytics[flagName] === true;
}

/**
 * Marca un evento importante como ya enviado.
 *
 * Es idempotente:
 * marcar dos veces el mismo evento no modifica
 * de nuevo updatedAt.
 *
 * Los flags solo avanzan de false → true.
 */
export function markAnalyticsFlagSent(
  flagName,
) {
  if (
    !isAllowedStateValue(
      ANALYTICS_FLAG,
      flagName,
    )
  ) {
    throw new RangeError(
      `Invalid analytics flag: ${flagName}`,
    );
  }

  if (state.analytics[flagName] === true) {
    return getState();
  }

  return updateState(
    (draft) => {
      draft.analytics[flagName] = true;
    },
    {
      source: "analytics:mark_sent",
    },
  );
}

/**
 * Guarda la última acción funcional relevante
 * realizada por el asistente.
 *
 * Ejemplos futuros:
 * - show_project
 * - ask_frequency
 * - open_diagnostic
 * - offer_booking
 *
 * null permite limpiar deliberadamente la acción.
 */
export function setLastAction(actionId) {
  const normalizedActionId =
    normalizeOptionalIdentifier(
      actionId,
      "conversation.lastAction",
    );

  if (
    state.conversation.lastAction ===
    normalizedActionId
  ) {
    return getState();
  }

  return updateState(
    (draft) => {
      draft.conversation.lastAction =
        normalizedActionId;
    },
    {
      source: "conversation:set_last_action",
    },
  );
}
/**
 * Reinicia únicamente la conversación funcional.
 *
 * Mantiene:
 * - meta.sessionId;
 * - contexto de página;
 * - bootstrap;
 * - preferencias UI técnicas como reducedMotion;
 * - flags Analytics de la sesión.
 *
 * Elimina:
 * - mensajes;
 * - contexto NLU;
 * - entidades y PII conversacional;
 * - diagnóstico;
 * - recomendaciones;
 * - booking;
 * - preguntas y acciones;
 * - fallbacks.
 */
export function resetConversation() {
  const freshState = createInitialState();

  return updateState(
    (draft) => {
      /**
       * Conversación nueva dentro de la misma
       * sesión del navegador.
       */
      draft.conversation = {
        ...freshState.conversation,

        id: createAnonymousId(),
      };

      draft.understanding =
        freshState.understanding;

      draft.entities =
        freshState.entities;

      draft.diagnostic =
        freshState.diagnostic;

      draft.recommendations =
        freshState.recommendations;

      draft.booking =
        freshState.booking;

      /**
       * Limpiamos únicamente estado UI efímero
       * relacionado con la conversación.
       *
       * isOpen y reducedMotion se conservan.
       */
      draft.ui.typing = false;

      draft.ui.avatarState =
        AVATAR_STATUS.IDLE;

      draft.ui.activeQuickReplies = [];

      draft.ui.unreadCount = 0;
    },
    {
      source: "conversation:reset",
    },
  );
}
/**
 * Reinicia completamente el estado en memoria.
 *
 * Uso previsto:
 * - tests;
 * - recuperación ante estado corrupto;
 * - cambios incompatibles de schema/version.
 *
 * A diferencia de resetConversation():
 * - genera un nuevo sessionId;
 * - reinicia page;
 * - reinicia UI;
 * - reinicia bootstrap;
 * - reinicia analytics;
 * - reinicia errores;
 * - conversation.id vuelve a null.
 *
 * El borrado de sessionStorage corresponde
 * a storage.js, no a este módulo.
 */
export function resetState() {
  const freshState = createInitialState();

  return updateState(
    (draft) => {
      Object.assign(
        draft,
        freshState,
      );
    },
    {
      source: "state:reset",
    },
  );
}

const PAGE_CONTEXT_FIELDS = Object.freeze([
  "path",
  "pageId",
  "pageType",
  "section",
  "locale",
  "title",
  "projectId",
  "solutionId",
  "serviceId",
]);

/**
 * Normaliza un contexto completo de página.
 *
 * page.current representa siempre la página real,
 * por lo que sustituimos el contexto completo
 * en lugar de hacer un merge parcial.
 */
function normalizePageContext(pageContext) {
  if (
    !pageContext ||
    typeof pageContext !== "object" ||
    Array.isArray(pageContext)
  ) {
    throw new TypeError(
      "setPageContext() requires a page context object",
    );
  }

  const unknownFields =
    Object.keys(pageContext).filter(
      (fieldName) =>
        !PAGE_CONTEXT_FIELDS.includes(
          fieldName,
        ),
    );

  if (unknownFields.length > 0) {
    throw new RangeError(
      `Unknown page context fields: ${unknownFields.join(", ")}`,
    );
  }

  const normalized = {
    path: null,
    pageId: null,
    pageType: null,
    section: null,
    locale: "es",
    title: null,
    projectId: null,
    solutionId: null,
    serviceId: null,
  };

  for (const fieldName of [
    "path",
    "pageId",
    "pageType",
    "section",
    "title",
    "projectId",
    "solutionId",
    "serviceId",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        pageContext,
        fieldName,
      )
    ) {
      normalized[fieldName] =
        normalizeOptionalText(
          pageContext[fieldName],
          `page.current.${fieldName}`,
        );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      pageContext,
      "locale",
    )
  ) {
    normalized.locale =
      normalizeOptionalIdentifier(
        pageContext.locale,
        "page.current.locale",
      );
  }

  return normalized;
}

/**
 * Actualiza el contexto real de navegación.
 *
 * Cuando cambia la ruta:
 * current anterior → previous
 * nueva página     → current
 *
 * En la primera carga previous permanece null.
 */
export function setPageContext(pageContext) {
  const normalizedPageContext =
    normalizePageContext(pageContext);

  const currentSerialized =
    JSON.stringify(state.page.current);

  const nextSerialized =
    JSON.stringify(normalizedPageContext);

  if (currentSerialized === nextSerialized) {
    return getState();
  }

  return updateState(
    (draft) => {
      const previousCurrent =
        cloneSerializable(
          draft.page.current,
        );

      const hasPreviousRealPage =
        typeof previousCurrent.path ===
          "string" &&
        previousCurrent.path.trim() !== "";

      const routeChanged =
        previousCurrent.path !==
          normalizedPageContext.path;

      if (
          hasPreviousRealPage &&
          routeChanged
        ) {
          /**
           * Navegación dentro del mismo runtime.
           */
          draft.page.previous =
            previousCurrent;
        } else if (
          !hasPreviousRealPage &&
          draft.page.previous?.path ===
            normalizedPageContext.path
        ) {
          /**
           * Refresh de la misma página.
           *
           * El documento anterior guardó su current como
           * candidato a previous, pero si seguimos exactamente
           * en la misma ruta no existe una navegación real
           * A → B.
           */
          draft.page.previous =
            null;
        }

        draft.page.current =
          normalizedPageContext;
    },
    {
      source: "page:set_context",
    },
  );
}
/**
 * ============================================================
 * STATE VALIDATION
 * ============================================================
 *
 * El state debe cumplir siempre dos condiciones:
 *
 * 1. Tener la estructura V1 esperada.
 * 2. Cumplir las invariantes funcionales.
 *
 * validateState() NO modifica el estado.
 *
 * Puede utilizarse:
 * - internamente antes de hacer commit;
 * - desde storage.js al restaurar sessionStorage;
 * - desde tests;
 * - durante recuperación de estado corrupto.
 */

const STATE_ROOT_KEYS = Object.freeze([
  "meta",
  "bootstrap",
  "page",
  "ui",
  "conversation",
  "understanding",
  "entities",
  "diagnostic",
  "recommendations",
  "booking",
  "analytics",
  "errors",
]);

const META_KEYS = Object.freeze([
  "schemaVersion",
  "chatbotVersion",
  "sessionId",
  "createdAt",
  "updatedAt",
]);

const BOOTSTRAP_KEYS = Object.freeze([
  "status",
  "shellMounted",
  "coreLoaded",
  "coreLoading",
  "restoredFromSession",
]);

const PAGE_KEYS = Object.freeze([
  "current",
  "previous",
]);

const PAGE_STATE_FIELDS = Object.freeze([
  "path",
  "pageId",
  "pageType",
  "section",
  "locale",
  "title",
  "projectId",
  "solutionId",
  "serviceId",
]);

const UI_KEYS = Object.freeze([
  "isOpen",
  "typing",
  "avatarState",
  "activeQuickReplies",
  "unreadCount",
  "reducedMotion",
]);

const CONVERSATION_KEYS = Object.freeze([
  "id",
  "status",
  "started",
  "startedAt",
  "lastActivityAt",
  "turnCount",
  "messages",
  "lastQuestionId",
  "askedQuestionIds",
  "lastAction",
  "consecutiveFallbacks",
  "totalFallbacks",
]);

const UNDERSTANDING_KEYS = Object.freeze([
  "conversationalState",
  "primaryIntent",
  "secondaryIntents",
  "confidence",
  "confidenceBucket",
  "concepts",
  "currentTopic",
  "semanticContext",
  "lastAnalysis",
  "pendingConfirmation",
]);

const SEMANTIC_CONTEXT_KEYS = Object.freeze([
  "relation",
  "subjectType",
  "subjectId",
]);

const ENTITY_CONTACT_KEYS = Object.freeze([
  "name",
  "company",
  "email",
  "phone",
]);

const ENTITY_CASE_KEYS = Object.freeze([
  "needs",
  "tools",
  "currentProcess",
  "frequency",
  "users",
  "volume",
  "objective",
  "timeframe",
  "businessArea",
]);

const ENTITY_VOLUME_KEYS = Object.freeze([
  "files",
  "records",
  "sources",
  "other",
]);

const DIAGNOSTIC_KEYS = Object.freeze([
  "status",
  "startedAt",
  "completedAt",
  "fields",
  "missingFields",
  "completionRatio",
  "summary",
]);

const RECOMMENDATIONS_KEYS = Object.freeze([
  "projects",
  "solutions",
  "services",
  "lastRecommendationType",
  "lastRecommendationId",
]);

const BOOKING_KEYS = Object.freeze([
  "status",
  "source",
  "offeredAt",
  "openedAt",
  "timeSelectedAt",
  "scheduledAt",
  "prefill",
]);

const BOOKING_PREFILL_KEYS = Object.freeze([
  "name",
  "email",
]);

const ANALYTICS_KEYS = Object.freeze([
  "chatStartSent",
  "diagnosticStartedSent",
  "diagnosticCompletedSent",
  "generateLeadSent",
  "bookingScheduledSent",
]);

const ERROR_KEYS = Object.freeze([
  "count",
  "lastError",
]);

const LAST_ERROR_KEYS = Object.freeze([
  "code",
  "occurredAt",
]);

/**
 * Determina si un valor es un objeto plano.
 *
 * Rechazamos:
 * - Date
 * - Map
 * - Set
 * - clases
 * - nodos DOM
 * - etc.
 */
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

function addValidationError(
  errors,
  path,
  message,
) {
  errors.push({
    path,
    message,
  });
}

function validateExactKeys(
  value,
  allowedKeys,
  path,
  errors,
) {
  if (!isPlainObject(value)) {
    addValidationError(
      errors,
      path,
      "must be a plain object",
    );

    return false;
  }

  const actualKeys =
    Object.keys(value);

  for (const requiredKey of allowedKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(
        value,
        requiredKey,
      )
    ) {
      addValidationError(
        errors,
        `${path}.${requiredKey}`,
        "required field is missing",
      );
    }
  }

  for (const actualKey of actualKeys) {
    if (!allowedKeys.includes(actualKey)) {
      addValidationError(
        errors,
        `${path}.${actualKey}`,
        "unknown field",
      );
    }
  }

  return true;
}

function isValidIsoDateString(value) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return false;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(timestamp);
}

function validateIsoDateOrNull(
  value,
  path,
  errors,
) {
  if (value === null) {
    return;
  }

  if (!isValidIsoDateString(value)) {
    addValidationError(
      errors,
      path,
      "must be null or a valid date string",
    );
  }
}

function validateNonEmptyString(
  value,
  path,
  errors,
) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    addValidationError(
      errors,
      path,
      "must be a non-empty string",
    );
  }
}

function validateNullableString(
  value,
  path,
  errors,
) {
  if (value === null) {
    return;
  }

  validateNonEmptyString(
    value,
    path,
    errors,
  );
}

function validateBoolean(
  value,
  path,
  errors,
) {
  if (typeof value !== "boolean") {
    addValidationError(
      errors,
      path,
      "must be a boolean",
    );
  }
}

function validateNonNegativeInteger(
  value,
  path,
  errors,
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    addValidationError(
      errors,
      path,
      "must be an integer >= 0",
    );
  }
}

function validateNullableCount(
  value,
  path,
  errors,
) {
  if (value === null) {
    return;
  }

  validateNonNegativeInteger(
    value,
    path,
    errors,
  );
}

function validateStringArray(
  value,
  path,
  errors,
  {
    unique = false,
  } = {},
) {
  if (!Array.isArray(value)) {
    addValidationError(
      errors,
      path,
      "must be an array",
    );

    return;
  }

  const normalizedValues = [];

  value.forEach(
    (item, index) => {
      if (
        typeof item !== "string" ||
        item.trim() === ""
      ) {
        addValidationError(
          errors,
          `${path}[${index}]`,
          "must be a non-empty string",
        );

        return;
      }

      normalizedValues.push(
        item.trim(),
      );
    },
  );

  if (
    unique &&
    new Set(normalizedValues).size !==
      normalizedValues.length
  ) {
    addValidationError(
      errors,
      path,
      "must not contain duplicates",
    );
  }
}

/**
 * Garantiza que todo el estado sea JSON-safe.
 *
 * JSON.stringify por sí solo no basta porque
 * silenciosamente ignoraría funciones/undefined
 * en determinados lugares.
 */
function validateJsonSafeValue(
  value,
  path,
  errors,
  stack = new WeakSet(),
) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      addValidationError(
        errors,
        path,
        "number must be finite",
      );
    }

    return;
  }

  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    addValidationError(
      errors,
      path,
      `unsupported state value: ${typeof value}`,
    );

    return;
  }

  if (typeof value !== "object") {
    addValidationError(
      errors,
      path,
      "unsupported state value",
    );

    return;
  }

  if (stack.has(value)) {
    addValidationError(
      errors,
      path,
      "circular reference detected",
    );

    return;
  }

  stack.add(value);

  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        validateJsonSafeValue(
          item,
          `${path}[${index}]`,
          errors,
          stack,
        );
      },
    );

    stack.delete(value);

    return;
  }

  if (!isPlainObject(value)) {
    addValidationError(
      errors,
      path,
      "state may only contain plain objects and arrays",
    );

    stack.delete(value);

    return;
  }

  for (
    const [key, childValue]
    of Object.entries(value)
  ) {
    validateJsonSafeValue(
      childValue,
      `${path}.${key}`,
      errors,
      stack,
    );
  }

  stack.delete(value);
}

function validatePageState(
  pageState,
  path,
  errors,
) {
  if (
    !validateExactKeys(
      pageState,
      PAGE_STATE_FIELDS,
      path,
      errors,
    )
  ) {
    return;
  }

  for (const fieldName of [
    "path",
    "pageId",
    "pageType",
    "section",
    "title",
    "projectId",
    "solutionId",
    "serviceId",
  ]) {
    validateNullableString(
      pageState[fieldName],
      `${path}.${fieldName}`,
      errors,
    );
  }

  validateNonEmptyString(
    pageState.locale,
    `${path}.locale`,
    errors,
  );
}

function validateMessage(
  message,
  index,
  errors,
) {
  const path =
    `state.conversation.messages[${index}]`;

  if (!isPlainObject(message)) {
    addValidationError(
      errors,
      path,
      "must be a plain object",
    );

    return;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      message,
      "html",
    )
  ) {
    addValidationError(
      errors,
      `${path}.html`,
      "arbitrary HTML is forbidden",
    );
  }

  validateNonEmptyString(
    message.id,
    `${path}.id`,
    errors,
  );

  if (
    !isAllowedStateValue(
      MESSAGE_ROLE,
      message.role,
    )
  ) {
    addValidationError(
      errors,
      `${path}.role`,
      "invalid message role",
    );
  }

  if (
    !isAllowedStateValue(
      MESSAGE_TYPE,
      message.type,
    )
  ) {
    addValidationError(
      errors,
      `${path}.type`,
      "invalid message type",
    );
  }

  if (
    !isValidIsoDateString(
      message.createdAt,
    )
  ) {
    addValidationError(
      errors,
      `${path}.createdAt`,
      "must be a valid date string",
    );
  }

  if (
    (
      message.type === MESSAGE_TYPE.TEXT ||
      message.type === MESSAGE_TYPE.NOTICE
    ) &&
    (
      typeof message.text !== "string" ||
      message.text.trim() === ""
    )
  ) {
    addValidationError(
      errors,
      `${path}.text`,
      `${message.type} requires non-empty text`,
    );
  }

  if (
    message.type ===
      MESSAGE_TYPE.PROJECT_CARD
  ) {
    validateNonEmptyString(
      message.projectId,
      `${path}.projectId`,
      errors,
    );
  }

  if (
    message.type ===
      MESSAGE_TYPE.SOLUTION_CARD
  ) {
    validateNonEmptyString(
      message.solutionId,
      `${path}.solutionId`,
      errors,
    );
  }

  for (const optionalField of [
    "responseId",
    "projectId",
    "solutionId",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        message,
        optionalField,
      )
    ) {
      validateNonEmptyString(
        message[optionalField],
        `${path}.${optionalField}`,
        errors,
      );
    }
  }
}

function validateRecommendationCollection(
  collection,
  path,
  errors,
) {
  if (!Array.isArray(collection)) {
    addValidationError(
      errors,
      path,
      "must be an array",
    );

    return;
  }

  const ids = [];

  collection.forEach(
    (recommendation, index) => {
      const itemPath =
        `${path}[${index}]`;

      if (!isPlainObject(recommendation)) {
        addValidationError(
          errors,
          itemPath,
          "must be a plain object",
        );

        return;
      }

      validateExactKeys(
        recommendation,
        [
          "id",
          "reasonCode",
          "shown",
        ],
        itemPath,
        errors,
      );

      validateNonEmptyString(
        recommendation.id,
        `${itemPath}.id`,
        errors,
      );

      validateNonEmptyString(
        recommendation.reasonCode,
        `${itemPath}.reasonCode`,
        errors,
      );

      validateBoolean(
        recommendation.shown,
        `${itemPath}.shown`,
        errors,
      );

      if (
        typeof recommendation.id ===
          "string"
      ) {
        ids.push(
          recommendation.id,
        );
      }
    },
  );

  if (
    new Set(ids).size !== ids.length
  ) {
    addValidationError(
      errors,
      path,
      "recommendation IDs must be unique",
    );
  }
}

/**
 * Valida un state completo.
 *
 * Por defecto devuelve:
 *
 * {
 *   valid: true|false,
 *   errors: [...]
 * }
 *
 * Con throwOnError:
 * lanza StateValidationError.
 */
export function validateState(
  candidate = state,
  {
    throwOnError = false,
  } = {},
) {
  const errors = [];

  if (!isPlainObject(candidate)) {
    addValidationError(
      errors,
      "state",
      "must be a plain object",
    );
  } else {
    validateExactKeys(
      candidate,
      STATE_ROOT_KEYS,
      "state",
      errors,
    );

    /**
     * META
     */
    if (
      validateExactKeys(
        candidate.meta,
        META_KEYS,
        "state.meta",
        errors,
      )
    ) {
      if (
        candidate.meta.schemaVersion !==
          STATE_SCHEMA_VERSION
      ) {
        addValidationError(
          errors,
          "state.meta.schemaVersion",
          `expected schemaVersion ${STATE_SCHEMA_VERSION}`,
        );
      }

      validateNonEmptyString(
        candidate.meta.chatbotVersion,
        "state.meta.chatbotVersion",
        errors,
      );

      validateNonEmptyString(
        candidate.meta.sessionId,
        "state.meta.sessionId",
        errors,
      );

      if (
        !isValidIsoDateString(
          candidate.meta.createdAt,
        )
      ) {
        addValidationError(
          errors,
          "state.meta.createdAt",
          "must be a valid date string",
        );
      }

      if (
        !isValidIsoDateString(
          candidate.meta.updatedAt,
        )
      ) {
        addValidationError(
          errors,
          "state.meta.updatedAt",
          "must be a valid date string",
        );
      }
    }

    /**
     * BOOTSTRAP
     */
    if (
      validateExactKeys(
        candidate.bootstrap,
        BOOTSTRAP_KEYS,
        "state.bootstrap",
        errors,
      )
    ) {
      if (
        !isAllowedStateValue(
          BOOTSTRAP_STATUS,
          candidate.bootstrap.status,
        )
      ) {
        addValidationError(
          errors,
          "state.bootstrap.status",
          "invalid bootstrap status",
        );
      }

      for (const fieldName of [
        "shellMounted",
        "coreLoaded",
        "coreLoading",
        "restoredFromSession",
      ]) {
        validateBoolean(
          candidate.bootstrap[fieldName],
          `state.bootstrap.${fieldName}`,
          errors,
        );
      }

      if (
        candidate.bootstrap.coreLoaded ===
          true &&
        candidate.bootstrap.coreLoading ===
          true
      ) {
        addValidationError(
          errors,
          "state.bootstrap",
          "coreLoaded and coreLoading cannot both be true",
        );
      }
    }

    /**
     * PAGE
     */
    if (
      validateExactKeys(
        candidate.page,
        PAGE_KEYS,
        "state.page",
        errors,
      )
    ) {
      validatePageState(
        candidate.page.current,
        "state.page.current",
        errors,
      );

      if (candidate.page.previous !== null) {
        validatePageState(
          candidate.page.previous,
          "state.page.previous",
          errors,
        );
      }
    }

    /**
     * UI
     */
    if (
      validateExactKeys(
        candidate.ui,
        UI_KEYS,
        "state.ui",
        errors,
      )
    ) {
      validateBoolean(
        candidate.ui.isOpen,
        "state.ui.isOpen",
        errors,
      );

      validateBoolean(
        candidate.ui.typing,
        "state.ui.typing",
        errors,
      );

      if (
        !isAllowedStateValue(
          AVATAR_STATUS,
          candidate.ui.avatarState,
        )
      ) {
        addValidationError(
          errors,
          "state.ui.avatarState",
          "invalid avatar state",
        );
      }

      validateStringArray(
        candidate.ui.activeQuickReplies,
        "state.ui.activeQuickReplies",
        errors,
        {
          unique: true,
        },
      );

      validateNonNegativeInteger(
        candidate.ui.unreadCount,
        "state.ui.unreadCount",
        errors,
      );

      validateBoolean(
        candidate.ui.reducedMotion,
        "state.ui.reducedMotion",
        errors,
      );
    }

    /**
     * CONVERSATION
     */
    if (
      validateExactKeys(
        candidate.conversation,
        CONVERSATION_KEYS,
        "state.conversation",
        errors,
      )
    ) {
      validateNullableString(
        candidate.conversation.id,
        "state.conversation.id",
        errors,
      );

      if (
        !isAllowedStateValue(
          CONVERSATION_STATUS,
          candidate.conversation.status,
        )
      ) {
        addValidationError(
          errors,
          "state.conversation.status",
          "invalid conversation status",
        );
      }

      validateBoolean(
        candidate.conversation.started,
        "state.conversation.started",
        errors,
      );

      validateIsoDateOrNull(
        candidate.conversation.startedAt,
        "state.conversation.startedAt",
        errors,
      );

      validateIsoDateOrNull(
        candidate.conversation.lastActivityAt,
        "state.conversation.lastActivityAt",
        errors,
      );

      validateNonNegativeInteger(
        candidate.conversation.turnCount,
        "state.conversation.turnCount",
        errors,
      );

      if (
        !Array.isArray(
          candidate.conversation.messages,
        )
      ) {
        addValidationError(
          errors,
          "state.conversation.messages",
          "must be an array",
        );
      } else {
        if (
          candidate.conversation.messages
            .length > MAX_STORED_MESSAGES
        ) {
          addValidationError(
            errors,
            "state.conversation.messages",
            `cannot contain more than ${MAX_STORED_MESSAGES} messages`,
          );
        }

        candidate.conversation.messages
          .forEach(
            (message, index) => {
              validateMessage(
                message,
                index,
                errors,
              );
            },
          );

        const messageIds =
          candidate.conversation.messages
            .map(
              (message) =>
                isPlainObject(message)
                  ? message.id
                  : null,
            )
            .filter(
              (id) =>
                typeof id === "string",
            );

        if (
          new Set(messageIds).size !==
            messageIds.length
        ) {
          addValidationError(
            errors,
            "state.conversation.messages",
            "message IDs must be unique",
          );
        }
      }

      validateNullableString(
        candidate.conversation.lastQuestionId,
        "state.conversation.lastQuestionId",
        errors,
      );

      validateStringArray(
        candidate.conversation.askedQuestionIds,
        "state.conversation.askedQuestionIds",
        errors,
        {
          unique: true,
        },
      );

      validateNullableString(
        candidate.conversation.lastAction,
        "state.conversation.lastAction",
        errors,
      );

      validateNonNegativeInteger(
        candidate.conversation
          .consecutiveFallbacks,
        "state.conversation.consecutiveFallbacks",
        errors,
      );

      validateNonNegativeInteger(
        candidate.conversation.totalFallbacks,
        "state.conversation.totalFallbacks",
        errors,
      );

      /**
       * Invariantes conversacionales.
       */
      if (
        candidate.conversation.started ===
          false &&
        candidate.conversation.startedAt !==
          null
      ) {
        addValidationError(
          errors,
          "state.conversation.startedAt",
          "must be null when conversation.started is false",
        );
      }

      if (
        candidate.conversation.started ===
        true
      ) {
        if (
          candidate.conversation.id === null
        ) {
          addValidationError(
            errors,
            "state.conversation.id",
            "started conversation requires an id",
          );
        }

        if (
          candidate.conversation.startedAt ===
          null
        ) {
          addValidationError(
            errors,
            "state.conversation.startedAt",
            "started conversation requires startedAt",
          );
        }
      }

      if (
        Number.isInteger(
          candidate.conversation
            .consecutiveFallbacks,
        ) &&
        Number.isInteger(
          candidate.conversation
            .totalFallbacks,
        ) &&
        candidate.conversation
          .consecutiveFallbacks >
          candidate.conversation
            .totalFallbacks
      ) {
        addValidationError(
          errors,
          "state.conversation.consecutiveFallbacks",
          "cannot exceed totalFallbacks",
        );
      }
    }

    /**
     * UNDERSTANDING
     */
    if (
      validateExactKeys(
        candidate.understanding,
        UNDERSTANDING_KEYS,
        "state.understanding",
        errors,
      )
    ) {
      if (!isConversationV2(candidate.understanding.conversationalState)) addValidationError(errors, "state.understanding.conversationalState", "invalid factual conversation projection");
      validateNullableString(
        candidate.understanding.primaryIntent,
        "state.understanding.primaryIntent",
        errors,
      );

      validateStringArray(
        candidate.understanding.secondaryIntents,
        "state.understanding.secondaryIntents",
        errors,
        {
          unique: true,
        },
      );

      if (
        candidate.understanding.confidence !==
          null &&
        (
          typeof candidate.understanding
            .confidence !== "number" ||
          !Number.isFinite(
            candidate.understanding
              .confidence,
          ) ||
          candidate.understanding
            .confidence < 0 ||
          candidate.understanding
            .confidence > 1
        )
      ) {
        addValidationError(
          errors,
          "state.understanding.confidence",
          "must be null or a number between 0 and 1",
        );
      }

      if (
        candidate.understanding
          .confidenceBucket !== null &&
        !isAllowedStateValue(
          CONFIDENCE_BUCKET,
          candidate.understanding
            .confidenceBucket,
        )
      ) {
        addValidationError(
          errors,
          "state.understanding.confidenceBucket",
          "invalid confidence bucket",
        );
      }

      validateStringArray(
        candidate.understanding.concepts,
        "state.understanding.concepts",
        errors,
        {
          unique: true,
        },
      );

      validateNullableString(
        candidate.understanding.currentTopic,
        "state.understanding.currentTopic",
        errors,
      );

      if (
        validateExactKeys(
          candidate.understanding.semanticContext,
          SEMANTIC_CONTEXT_KEYS,
          "state.understanding.semanticContext",
          errors,
        )
      ) {
        const semanticContext =
          candidate.understanding.semanticContext;

        if (
          semanticContext.relation !== null &&
          !isAllowedStateValue(
            SEMANTIC_RELATION,
            semanticContext.relation,
          )
        ) {
          addValidationError(
            errors,
            "state.understanding.semanticContext.relation",
            "invalid semantic relation",
          );
        }

        if (
          semanticContext.subjectType !== null &&
          !isAllowedStateValue(
            SEMANTIC_SUBJECT_TYPE,
            semanticContext.subjectType,
          )
        ) {
          addValidationError(
            errors,
            "state.understanding.semanticContext.subjectType",
            "invalid semantic subject type",
          );
        }

        validateNullableString(
          semanticContext.subjectId,
          "state.understanding.semanticContext.subjectId",
          errors,
        );

        const populatedFields = [
          semanticContext.relation,
          semanticContext.subjectType,
          semanticContext.subjectId,
        ].filter(
          (value) => value !== null,
        ).length;

        if (
          populatedFields !== 0 &&
          populatedFields !== 3
        ) {
          addValidationError(
            errors,
            "state.understanding.semanticContext",
            "must be either empty or complete",
          );
        }
      }

      for (const fieldName of [
        "lastAnalysis",
        "pendingConfirmation",
      ]) {
        const value =
          candidate.understanding[
            fieldName
          ];

        if (
          value !== null &&
          !isPlainObject(value)
        ) {
          addValidationError(
            errors,
            `state.understanding.${fieldName}`,
            "must be null or a plain object",
          );
        }
      }
    }

    /**
     * ENTITIES
     */
    if (
      !isPlainObject(candidate.entities)
    ) {
      addValidationError(
        errors,
        "state.entities",
        "must be a plain object",
      );
    } else {
      validateExactKeys(
        candidate.entities,
        [
          "contact",
          "case",
        ],
        "state.entities",
        errors,
      );

      if (
        validateExactKeys(
          candidate.entities.contact,
          ENTITY_CONTACT_KEYS,
          "state.entities.contact",
          errors,
        )
      ) {
        for (
          const fieldName
          of ENTITY_CONTACT_KEYS
        ) {
          validateNullableString(
            candidate.entities.contact[
              fieldName
            ],
            `state.entities.contact.${fieldName}`,
            errors,
          );
        }
      }

      if (
        validateExactKeys(
          candidate.entities.case,
          ENTITY_CASE_KEYS,
          "state.entities.case",
          errors,
        )
      ) {
        validateStringArray(
          candidate.entities.case.needs,
          "state.entities.case.needs",
          errors,
          {
            unique: true,
          },
        );

        validateStringArray(
          candidate.entities.case.tools,
          "state.entities.case.tools",
          errors,
          {
            unique: true,
          },
        );

        for (const fieldName of [
          "currentProcess",
          "frequency",
          "objective",
          "timeframe",
          "businessArea",
        ]) {
          validateNullableString(
            candidate.entities.case[
              fieldName
            ],
            `state.entities.case.${fieldName}`,
            errors,
          );
        }

        validateNullableCount(
          candidate.entities.case.users,
          "state.entities.case.users",
          errors,
        );

        if (
          validateExactKeys(
            candidate.entities.case.volume,
            ENTITY_VOLUME_KEYS,
            "state.entities.case.volume",
            errors,
          )
        ) {
          for (const fieldName of [
            "files",
            "records",
            "sources",
          ]) {
            validateNullableCount(
              candidate.entities.case.volume[
                fieldName
              ],
              `state.entities.case.volume.${fieldName}`,
              errors,
            );
          }

          validateNullableString(
            candidate.entities.case.volume
              .other,
            "state.entities.case.volume.other",
            errors,
          );
        }
      }
    }

    /**
     * DIAGNOSTIC
     */
    if (
      validateExactKeys(
        candidate.diagnostic,
        DIAGNOSTIC_KEYS,
        "state.diagnostic",
        errors,
      )
    ) {
      if (
        !isAllowedStateValue(
          DIAGNOSTIC_STATUS,
          candidate.diagnostic.status,
        )
      ) {
        addValidationError(
          errors,
          "state.diagnostic.status",
          "invalid diagnostic status",
        );
      }

      validateIsoDateOrNull(
        candidate.diagnostic.startedAt,
        "state.diagnostic.startedAt",
        errors,
      );

      validateIsoDateOrNull(
        candidate.diagnostic.completedAt,
        "state.diagnostic.completedAt",
        errors,
      );

      if (
        validateExactKeys(
          candidate.diagnostic.fields,
          DIAGNOSTIC_FIELD_NAMES,
          "state.diagnostic.fields",
          errors,
        )
      ) {
        for (const fieldName of [
          "name",
          "company",
          "email",
          "phone",
          "currentProcess",
          "timeframe",
          "objective",
          "additionalInfo",
        ]) {
          validateNullableString(
            candidate.diagnostic.fields[
              fieldName
            ],
            `state.diagnostic.fields.${fieldName}`,
            errors,
          );
        }

        validateStringArray(
          candidate.diagnostic.fields.needs,
          "state.diagnostic.fields.needs",
          errors,
          {
            unique: true,
          },
        );

        validateNullableCount(
          candidate.diagnostic.fields.users,
          "state.diagnostic.fields.users",
          errors,
        );
      }

      validateStringArray(
        candidate.diagnostic.missingFields,
        "state.diagnostic.missingFields",
        errors,
        {
          unique: true,
        },
      );

      if (
        Array.isArray(
          candidate.diagnostic.missingFields,
        )
      ) {
        candidate.diagnostic.missingFields
          .forEach(
            (fieldName, index) => {
              if (
                typeof fieldName ===
                  "string" &&
                !DIAGNOSTIC_FIELD_NAMES
                  .includes(fieldName)
              ) {
                addValidationError(
                  errors,
                  `state.diagnostic.missingFields[${index}]`,
                  "unknown diagnostic field",
                );
              }
            },
          );
      }

      if (
        typeof candidate.diagnostic
          .completionRatio !== "number" ||
        !Number.isFinite(
          candidate.diagnostic
            .completionRatio,
        ) ||
        candidate.diagnostic
          .completionRatio < 0 ||
        candidate.diagnostic
          .completionRatio > 1
      ) {
        addValidationError(
          errors,
          "state.diagnostic.completionRatio",
          "must be a number between 0 and 1",
        );
      }

      if (
        candidate.diagnostic.summary !==
          null &&
        !isPlainObject(
          candidate.diagnostic.summary,
        )
      ) {
        addValidationError(
          errors,
          "state.diagnostic.summary",
          "must be null or a plain object",
        );
      }

      /**
       * Invariantes del diagnóstico.
       */
      if (
        candidate.diagnostic.status !==
          DIAGNOSTIC_STATUS.NOT_STARTED &&
        candidate.diagnostic.startedAt ===
          null
      ) {
        addValidationError(
          errors,
          "state.diagnostic.startedAt",
          "started diagnostic requires startedAt",
        );
      }

      if (
        candidate.diagnostic.status ===
          DIAGNOSTIC_STATUS.COMPLETED &&
        candidate.diagnostic.completedAt ===
          null
      ) {
        addValidationError(
          errors,
          "state.diagnostic.completedAt",
          "completed diagnostic requires completedAt",
        );
      }
    }

    /**
     * RECOMMENDATIONS
     */
    if (
      validateExactKeys(
        candidate.recommendations,
        RECOMMENDATIONS_KEYS,
        "state.recommendations",
        errors,
      )
    ) {
      validateRecommendationCollection(
        candidate.recommendations.projects,
        "state.recommendations.projects",
        errors,
      );

      validateRecommendationCollection(
        candidate.recommendations.solutions,
        "state.recommendations.solutions",
        errors,
      );

      validateRecommendationCollection(
        candidate.recommendations.services,
        "state.recommendations.services",
        errors,
      );

      if (
        candidate.recommendations
          .lastRecommendationType !== null &&
        !isAllowedStateValue(
          RECOMMENDATION_TYPE,
          candidate.recommendations
            .lastRecommendationType,
        )
      ) {
        addValidationError(
          errors,
          "state.recommendations.lastRecommendationType",
          "invalid recommendation type",
        );
      }

      validateNullableString(
        candidate.recommendations
          .lastRecommendationId,
        "state.recommendations.lastRecommendationId",
        errors,
      );

      const lastType =
        candidate.recommendations
          .lastRecommendationType;

      const lastId =
        candidate.recommendations
          .lastRecommendationId;

      if (
        (lastType === null) !==
        (lastId === null)
      ) {
        addValidationError(
          errors,
          "state.recommendations",
          "lastRecommendationType and lastRecommendationId must both be null or both be populated",
        );
      }

      if (
        lastType !== null &&
        lastId !== null &&
        isAllowedStateValue(
          RECOMMENDATION_TYPE,
          lastType,
        )
      ) {
        const collectionName =
          RECOMMENDATION_COLLECTION[
            lastType
          ];

        const exists =
          Array.isArray(
            candidate.recommendations[
              collectionName
            ],
          ) &&
          candidate.recommendations[
            collectionName
          ].some(
            (recommendation) =>
              isPlainObject(
                recommendation,
              ) &&
              recommendation.id === lastId,
          );

        if (!exists) {
          addValidationError(
            errors,
            "state.recommendations.lastRecommendationId",
            "must reference an existing recommendation",
          );
        }
      }
    }

    /**
     * BOOKING
     */
    if (
      validateExactKeys(
        candidate.booking,
        BOOKING_KEYS,
        "state.booking",
        errors,
      )
    ) {
      if (
        !isAllowedStateValue(
          BOOKING_STATUS,
          candidate.booking.status,
        )
      ) {
        addValidationError(
          errors,
          "state.booking.status",
          "invalid booking status",
        );
      }

      validateNullableString(
        candidate.booking.source,
        "state.booking.source",
        errors,
      );

      for (const fieldName of [
        "offeredAt",
        "openedAt",
        "timeSelectedAt",
        "scheduledAt",
      ]) {
        validateIsoDateOrNull(
          candidate.booking[fieldName],
          `state.booking.${fieldName}`,
          errors,
        );
      }

      if (
        validateExactKeys(
          candidate.booking.prefill,
          BOOKING_PREFILL_KEYS,
          "state.booking.prefill",
          errors,
        )
      ) {
        validateNullableString(
          candidate.booking.prefill.name,
          "state.booking.prefill.name",
          errors,
        );

        validateNullableString(
          candidate.booking.prefill.email,
          "state.booking.prefill.email",
          errors,
        );
      }

      if (
        candidate.booking.status ===
          BOOKING_STATUS.SCHEDULED &&
        candidate.booking.scheduledAt ===
          null
      ) {
        addValidationError(
          errors,
          "state.booking.scheduledAt",
          "scheduled booking requires scheduledAt",
        );
      }

      /**
       * Si tenemos varios timestamps,
       * su orden temporal debe ser coherente.
       */
      const bookingTimeline = [
        [
          "offeredAt",
          candidate.booking.offeredAt,
        ],
        [
          "openedAt",
          candidate.booking.openedAt,
        ],
        [
          "timeSelectedAt",
          candidate.booking.timeSelectedAt,
        ],
        [
          "scheduledAt",
          candidate.booking.scheduledAt,
        ],
      ].filter(
        ([, value]) =>
          isValidIsoDateString(value),
      );

      for (
        let index = 1;
        index < bookingTimeline.length;
        index += 1
      ) {
        const [
          previousName,
          previousValue,
        ] = bookingTimeline[index - 1];

        const [
          currentName,
          currentValue,
        ] = bookingTimeline[index];

        if (
          Date.parse(currentValue) <
          Date.parse(previousValue)
        ) {
          addValidationError(
            errors,
            `state.booking.${currentName}`,
            `${currentName} cannot be earlier than ${previousName}`,
          );
        }
      }
    }

    /**
     * ANALYTICS
     *
     * Exact keys = defensa adicional contra
     * meter accidentalmente email/name/text.
     */
    if (
      validateExactKeys(
        candidate.analytics,
        ANALYTICS_KEYS,
        "state.analytics",
        errors,
      )
    ) {
      for (
        const fieldName
        of ANALYTICS_KEYS
      ) {
        validateBoolean(
          candidate.analytics[fieldName],
          `state.analytics.${fieldName}`,
          errors,
        );
      }
    }

    /**
     * ERRORS
     */
    if (
      validateExactKeys(
        candidate.errors,
        ERROR_KEYS,
        "state.errors",
        errors,
      )
    ) {
      validateNonNegativeInteger(
        candidate.errors.count,
        "state.errors.count",
        errors,
      );

      if (
        candidate.errors.lastError !==
          null
      ) {
        if (
          validateExactKeys(
            candidate.errors.lastError,
            LAST_ERROR_KEYS,
            "state.errors.lastError",
            errors,
          )
        ) {
          validateNonEmptyString(
            candidate.errors.lastError.code,
            "state.errors.lastError.code",
            errors,
          );

          if (
            !isValidIsoDateString(
              candidate.errors.lastError
                .occurredAt,
            )
          ) {
            addValidationError(
              errors,
              "state.errors.lastError.occurredAt",
              "must be a valid date string",
            );
          }
        }
      }
    }

    /**
     * Regla global:
     * todo el state debe ser JSON-safe.
     */
    validateJsonSafeValue(
      candidate,
      "state",
      errors,
    );
  }

  const result = {
    valid: errors.length === 0,
    errors,
  };

  if (
    !result.valid &&
    throwOnError
  ) {
    const error = new Error(
      `Invalid chatbot state: ${errors
        .map(
          ({ path, message }) =>
            `${path}: ${message}`,
        )
        .join(" | ")}`,
    );

    error.name =
      "StateValidationError";

    error.validationErrors =
      cloneSerializable(errors);

    throw error;
  }

  return result;
}
/**
 * Restaura exclusivamente el estado persistible
 * de una sesión anterior.
 *
 * No restaura estado técnico/efímero como:
 * - bootstrap;
 * - page.current;
 * - typing;
 * - avatarState;
 * - activeQuickReplies;
 * - reducedMotion;
 * - errors;
 * - understanding.lastAnalysis.
 *
 * storage.js debe validar previamente el payload,
 * pero esta función sigue pasando por updateState()
 * y por validateState().
 */
export function restorePersistedState(
  persistedState,
) {
  if (
    !persistedState ||
    typeof persistedState !== "object" ||
    Array.isArray(persistedState)
  ) {
    throw new TypeError(
      "restorePersistedState() requires an object",
    );
  }

  return updateState(
    (draft) => {
      /**
       * META
       *
       * Conservamos sessionId y createdAt originales.
       * updatedAt será actualizado automáticamente
       * por updateState().
       */
      if (
        persistedState.meta &&
        typeof persistedState.meta === "object"
      ) {
        if (
          typeof persistedState.meta.sessionId ===
            "string" &&
          persistedState.meta.sessionId.trim() !== ""
        ) {
          draft.meta.sessionId =
            persistedState.meta.sessionId;
        }

        if (
          typeof persistedState.meta.createdAt ===
            "string"
        ) {
          draft.meta.createdAt =
            persistedState.meta.createdAt;
        }
      }

      /**
       * UI persistible.
       */
      if (
        persistedState.ui &&
        typeof persistedState.ui === "object"
      ) {
        if (
          typeof persistedState.ui.isOpen ===
            "boolean"
        ) {
          draft.ui.isOpen =
            persistedState.ui.isOpen;
        }

        if (
          Number.isInteger(
            persistedState.ui.unreadCount,
          ) &&
          persistedState.ui.unreadCount >= 0
        ) {
          draft.ui.unreadCount =
            persistedState.ui.unreadCount;
        }
      }

      /**
       * PAGE
       *
       * page.current NO se restaura.
       * Se recalculará desde la página real.
       *
       * Solo recuperamos historial previous.
       */
      if (
        persistedState.page &&
        typeof persistedState.page === "object" &&
        persistedState.page.previous !== undefined
      ) {
        draft.page.previous =
          persistedState.page.previous;
      }

      /**
       * Bloques funcionales completos.
       */
      for (const blockName of [
        "conversation",
        "entities",
        "diagnostic",
        "recommendations",
        "booking",
        "analytics",
      ]) {
        if (
          persistedState[blockName] &&
          typeof persistedState[blockName] ===
            "object"
        ) {
          draft[blockName] =
            persistedState[blockName];
        }
      }

      /**
       * UNDERSTANDING:
       * restauramos contexto útil pero nunca
       * lastAnalysis completo.
       */
      if (
        persistedState.understanding &&
        typeof persistedState.understanding ===
          "object"
      ) {
        const {
          lastAnalysis: _ignored,
          ...persistedUnderstanding
        } =
          persistedState.understanding;

        Object.assign(
          draft.understanding,
          persistedUnderstanding,
        );

        draft.understanding.lastAnalysis =
          null;
      }

      /**
       * Todo estado técnico se recalcula.
       */
      draft.bootstrap.status =
        BOOTSTRAP_STATUS.INITIALIZING;

      draft.bootstrap.shellMounted =
        false;

      draft.bootstrap.coreLoaded =
        false;

      draft.bootstrap.coreLoading =
        false;

      draft.bootstrap.restoredFromSession =
        true;

      draft.ui.typing = false;

      draft.ui.avatarState =
        AVATAR_STATUS.IDLE;

      draft.ui.activeQuickReplies = [];

      draft.ui.reducedMotion = false;

      draft.errors = {
        count: 0,
        lastError: null,
      };
    },
    {
      source: "state:restore_persisted",
    },
  );
}