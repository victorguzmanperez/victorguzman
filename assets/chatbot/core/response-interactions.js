import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_QUICK_REPLY_KIND,
} from "./response-contract.js";

import {
  INTENT_IDS,
} from "./nlu.js";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";


/* ============================================================
 * RESPONSE INTERACTIONS
 * 1.11.22.10
 *
 * Capa declarativa común para:
 *
 * - Quick Replies
 * - Actions
 * - presets reutilizables
 *
 * IMPORTANTE:
 *
 * Este módulo NO ejecuta acciones.
 *
 * La ejecución pertenece al futuro:
 *
 * Dialogue Manager
 *      ↓
 * Action Router
 *      ↓
 * UI / integrations
 * ============================================================
 */


/* ============================================================
 * CANONICAL TARGETS
 * ============================================================
 */

export const RESPONSE_INTERACTION_TARGET =
  Object.freeze({
    CONTACT:
      "contact-victor-portfolio",

    DIAGNOSTIC:
      "diagnostic-portfolio-initial",

    BOOKING:
      "booking-calendly-initial-meeting",
  });


export const RESPONSE_INTERACTION_PRESET =
  Object.freeze({
    FALLBACK_CATEGORIES:
      "fallback-categories",
  });


/* ============================================================
 * CONTRACT LIMITS
 *
 * Deben permanecer alineados con response-contract.js.
 * ============================================================
 */

const QUICK_REPLY_LIMITS =
  Object.freeze({
    ID: 80,
    LABEL: 60,
    VALUE: 150,
  });


const ACTION_LIMITS =
  Object.freeze({
    ID: 80,
    LABEL: 80,
    TARGET: 150,
  });


/*
 * Una quick reply ACTION solo puede transportar:
 *
 * kind + value
 *
 * No dispone de target.
 *
 * Por eso NAVIGATE no se permite aquí:
 * una navegación necesita además conocer su destino.
 */
const ACTION_QUICK_REPLY_TYPES =
  Object.freeze([
    RESPONSE_ACTION_TYPE
      .OPEN_CONTACT,

    RESPONSE_ACTION_TYPE
      .START_DIAGNOSTIC,

    RESPONSE_ACTION_TYPE
      .OPEN_CALENDLY,

    RESPONSE_ACTION_TYPE
      .OFFER_FEEDBACK,
  ]);


/* ============================================================
 * HELPERS
 * ============================================================
 */

function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function fitsLimit(
  value,
  maxLength,
) {
  return (
    Boolean(value) &&
    value.length <= maxLength
  );
}


function isCanonicalIntent(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      INTENT_IDS,
    ).includes(
      value,
    )
  );
}


function isCanonicalActionType(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      RESPONSE_ACTION_TYPE,
    ).includes(
      value,
    )
  );
}


function isCanonicalActionPriority(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      RESPONSE_ACTION_PRIORITY,
    ).includes(
      value,
    )
  );
}


/* ============================================================
 * QUICK REPLY FACTORY
 * ============================================================
 */

function createQuickReply(
  {
    id,
    label,
    kind,
    value,
  } = {},
) {
  const normalizedId =
    safeString(id);

  const normalizedLabel =
    safeString(label);

  const normalizedValue =
    safeString(value);


  if (
    !fitsLimit(
      normalizedId,
      QUICK_REPLY_LIMITS.ID,
    ) ||
    !fitsLimit(
      normalizedLabel,
      QUICK_REPLY_LIMITS.LABEL,
    ) ||
    !fitsLimit(
      normalizedValue,
      QUICK_REPLY_LIMITS.VALUE,
    ) ||
    !Object.values(
      RESPONSE_QUICK_REPLY_KIND,
    ).includes(kind)
  ) {
    return null;
  }


  return Object.freeze({
    id:
      normalizedId,

    label:
      normalizedLabel,

    kind,

    value:
      normalizedValue,
  });
}


/* ============================================================
 * QUICK REPLY — INTENT
 * ============================================================
 */

export function createIntentQuickReply(
  {
    id,
    label,
    intent,
  } = {},
) {
  if (
    !isCanonicalIntent(
      intent,
    )
  ) {
    return null;
  }


  return createQuickReply({
    id,
    label,

    kind:
      RESPONSE_QUICK_REPLY_KIND
        .INTENT,

    value:
      intent,
  });
}


/* ============================================================
 * QUICK REPLY — ANSWER
 *
 * Simula una respuesta/pregunta natural del usuario.
 * ============================================================
 */

export function createAnswerQuickReply(
  {
    id,
    label,
    answer,
  } = {},
) {
  return createQuickReply({
    id,
    label,

    kind:
      RESPONSE_QUICK_REPLY_KIND
        .ANSWER,

    value:
      answer,
  });
}


/* ============================================================
 * QUICK REPLY — ACTION
 *
 * El value contiene el ACTION_TYPE.
 *
 * El futuro Action Router será quien decida cómo ejecutarlo.
 * ============================================================
 */

export function createActionQuickReply(
  {
    id,
    label,
    actionType,
  } = {},
) {
  if (
    !ACTION_QUICK_REPLY_TYPES
      .includes(
        actionType,
      )
  ) {
    return null;
  }


  return createQuickReply({
    id,
    label,

    kind:
      RESPONSE_QUICK_REPLY_KIND
        .ACTION,

    value:
      actionType,
  });
}


/* ============================================================
 * BASE ACTION FACTORY
 * ============================================================
 */

function createAction(
  {
    id,
    type,
    label,
    priority,
    target = null,
    requiresConfirmation = false,
  } = {},
) {
  const normalizedId =
    safeString(id);

  const normalizedLabel =
    safeString(label);

  const normalizedTarget =
    target === null
      ? null
      : safeString(target);


  if (
    !fitsLimit(
      normalizedId,
      ACTION_LIMITS.ID,
    ) ||
    !fitsLimit(
      normalizedLabel,
      ACTION_LIMITS.LABEL,
    ) ||
    !isCanonicalActionType(
      type,
    ) ||
    !isCanonicalActionPriority(
      priority,
    ) ||
    (
      normalizedTarget !== null &&
      !fitsLimit(
        normalizedTarget,
        ACTION_LIMITS.TARGET,
      )
    ) ||
    typeof requiresConfirmation !==
      "boolean"
  ) {
    return null;
  }


  return Object.freeze({
    id:
      normalizedId,

    type,

    label:
      normalizedLabel,

    priority,

    target:
      normalizedTarget,

    requiresConfirmation,
  });
}


/* ============================================================
 * KNOWLEDGE TARGET VALIDATION
 * ============================================================
 */

function canonicalKnowledgeTarget(
  knowledgeId,
  knowledgeType,
) {
  const item =
    getKnowledgeById(
      knowledgeId,
    );


  return (
    item?.type === knowledgeType
      ? item.id
      : null
  );
}


/* ============================================================
 * CONTACT ACTION
 * ============================================================
 */

export function createContactAction(
  {
    id =
      "action-contact",

    label =
      "Contactar con Víctor",

    priority =
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,

    requiresConfirmation =
      false,
  } = {},
) {
  const target =
    canonicalKnowledgeTarget(
      RESPONSE_INTERACTION_TARGET
        .CONTACT,

      KNOWLEDGE_TYPE.CONTACT,
    );


  if (!target) {
    return null;
  }


  return createAction({
    id,

    type:
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,

    label,
    priority,
    target,
    requiresConfirmation,
  });
}


/* ============================================================
 * DIAGNOSTIC ACTION
 * ============================================================
 */

export function createDiagnosticAction(
  {
    id =
      "action-diagnostic",

    label =
      "Iniciar diagnóstico",

    priority =
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,

    requiresConfirmation =
      false,
  } = {},
) {
  const target =
    canonicalKnowledgeTarget(
      RESPONSE_INTERACTION_TARGET
        .DIAGNOSTIC,

      KNOWLEDGE_TYPE.DIAGNOSTIC,
    );


  if (!target) {
    return null;
  }


  return createAction({
    id,

    type:
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,

    label,
    priority,
    target,
    requiresConfirmation,
  });
}


/* ============================================================
 * CALENDLY ACTION
 * ============================================================
 */

export function createCalendlyAction(
  {
    id =
      "action-calendly",

    label =
      "Ver horarios en Calendly",

    priority =
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,

    requiresConfirmation =
      false,
  } = {},
) {
  const target =
    canonicalKnowledgeTarget(
      RESPONSE_INTERACTION_TARGET
        .BOOKING,

      KNOWLEDGE_TYPE.BOOKING,
    );


  if (!target) {
    return null;
  }


  return createAction({
    id,

    type:
      RESPONSE_ACTION_TYPE
        .OPEN_CALENDLY,

    label,
    priority,
    target,
    requiresConfirmation,
  });
}


/* ============================================================
 * FEEDBACK ACTION
 *
 * La regla de cuándo puede mostrarse sigue perteneciendo
 * al Response Contract / Social Response Composer.
 * ============================================================
 */

export function createFeedbackAction(
  {
    id =
      "action-feedback",

    label =
      "Valorar conversación",

    priority =
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,

    requiresConfirmation =
      false,
  } = {},
) {
  return createAction({
    id,

    type:
      RESPONSE_ACTION_TYPE
        .OFFER_FEEDBACK,

    label,
    priority,

    target:
      null,

    requiresConfirmation,
  });
}


/* ============================================================
 * SAFE NAVIGATION
 *
 * V1:
 * - solo rutas internas;
 * - no protocolos;
 * - no URLs externas;
 * - no javascript:;
 * - no //host.
 * ============================================================
 */

function isSafeNavigationTarget(
  value,
) {
  const target =
    safeString(
      value,
    );


  if (!target) {
    return false;
  }


  if (
    target.startsWith(
      "//",
    ) ||
    /^[a-z][a-z0-9+.-]*:/i
      .test(
        target,
      )
  ) {
    return false;
  }


  return (
    /^\/?[a-z0-9][a-z0-9._/-]*(?:#[a-z0-9._-]+)?$/i
      .test(
        target,
      ) &&
    target.length <=
      ACTION_LIMITS.TARGET
  );
}


export function createNavigationAction(
  {
    id,
    label,
    target,

    priority =
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,

    requiresConfirmation =
      false,
  } = {},
) {
  if (
    !isSafeNavigationTarget(
      target,
    )
  ) {
    return null;
  }


  return createAction({
    id,

    type:
      RESPONSE_ACTION_TYPE
        .NAVIGATE,

    label,
    priority,

    target:
      safeString(
        target,
      ),

    requiresConfirmation,
  });
}


/* ============================================================
 * FALLBACK CATEGORY PRESET
 *
 * Máximo cuatro opciones.
 *
 * TECHNOLOGIES:
 *
 * todavía no existe como INTENT_IDS canónico en NLU V1,
 * por lo que se expresa como ANSWER natural.
 * ============================================================
 */

export function createFallbackCategoryQuickReplies() {
  const replies = [
    createIntentQuickReply({
      id:
        "qr-fallback-experience",

      label:
        "Experiencia",

      intent:
        INTENT_IDS.EXPERIENCE,
    }),

    createAnswerQuickReply({
      id:
        "qr-fallback-technologies",

      label:
        "Tecnologías",

      answer:
        "¿Qué tecnologías conoce Víctor?",
    }),

    createIntentQuickReply({
      id:
        "qr-fallback-projects",

      label:
        "Proyectos",

      intent:
        INTENT_IDS.PROJECTS,
    }),

    createIntentQuickReply({
      id:
        "qr-fallback-services",

      label:
        "Servicios",

      intent:
        INTENT_IDS.SERVICES,
    }),
  ];


  /*
   * Fail closed si en el futuro desaparece
   * alguno de los intents canónicos.
   */
  if (
    replies.some(
      (reply) =>
        !reply,
    )
  ) {
    return Object.freeze([]);
  }


  return Object.freeze(
    replies,
  );
}


/* ============================================================
 * INTERACTION SET VALIDATION
 * ============================================================
 */

function isValidQuickReplyShape(
  item,
) {
  return (
    item &&
    typeof item === "object" &&

    fitsLimit(
      safeString(
        item.id,
      ),
      QUICK_REPLY_LIMITS.ID,
    ) &&

    fitsLimit(
      safeString(
        item.label,
      ),
      QUICK_REPLY_LIMITS.LABEL,
    ) &&

    Object.values(
      RESPONSE_QUICK_REPLY_KIND,
    ).includes(
      item.kind,
    ) &&

    fitsLimit(
      safeString(
        item.value,
      ),
      QUICK_REPLY_LIMITS.VALUE,
    )
  );
}


function isValidActionShape(
  item,
) {
  return (
    item &&
    typeof item === "object" &&

    fitsLimit(
      safeString(
        item.id,
      ),
      ACTION_LIMITS.ID,
    ) &&

    isCanonicalActionType(
      item.type,
    ) &&

    fitsLimit(
      safeString(
        item.label,
      ),
      ACTION_LIMITS.LABEL,
    ) &&

    isCanonicalActionPriority(
      item.priority,
    ) &&

    (
      item.target === null ||
      fitsLimit(
        safeString(
          item.target,
        ),
        ACTION_LIMITS.TARGET,
      )
    ) &&

    typeof item
      .requiresConfirmation ===
      "boolean"
  );
}


/* ============================================================
 * INTERACTION SET
 *
 * Refuerza las invariantes antes de entrar al Response Contract.
 * ============================================================
 */

export function createInteractionSet(
  {
    quickReplies = [],
    actions = [],
  } = {},
) {
  if (
    !Array.isArray(
      quickReplies,
    ) ||
    !Array.isArray(
      actions,
    ) ||

    quickReplies.length > 4 ||
    actions.length > 2 ||

    quickReplies.some(
      (item) =>
        !isValidQuickReplyShape(
          item,
        ),
    ) ||

    actions.some(
      (item) =>
        !isValidActionShape(
          item,
        ),
    )
  ) {
    return null;
  }


  const ids = [
    ...quickReplies.map(
      (item) =>
        item.id,
    ),

    ...actions.map(
      (item) =>
        item.id,
    ),
  ];


  if (
    new Set(
      ids,
    ).size !==
      ids.length
  ) {
    return null;
  }


  const primaryActions =
    actions.filter(
      (action) =>
        action.priority ===
          RESPONSE_ACTION_PRIORITY
            .PRIMARY,
    );


  if (
    primaryActions.length > 1
  ) {
    return null;
  }


  return Object.freeze({
    quickReplies:
      Object.freeze([
        ...quickReplies,
      ]),

    actions:
      Object.freeze([
        ...actions,
      ]),
  });
}