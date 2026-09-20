import {
  RESPONSE_CONTINUITY,
  RESPONSE_DEPTH,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  createResponseEnvelope,
} from "./response-contract.js";

import {
  FALLBACK_LEVEL,
} from "./nlu.js";

import {
  RESPONSE_INTERACTION_TARGET,
  createContactAction,
  createFallbackCategoryQuickReplies,
} from "./response-interactions.js";


/* ============================================================
 * FALLBACK RESPONSE COMPOSER
 * 1.11.22.9 + integración 1.11.22.10
 *
 * Consume el fallbackLevel calculado por NLU:
 *
 * CLARIFY
 *   → pedir reformulación/contexto
 *
 * CATEGORIES
 *   → orientar por categorías
 *   → ofrecer quick replies declarativas
 *
 * ESCALATE
 *   → dejar de repetir
 *   → ofrecer contacto humano
 *
 * Este módulo:
 *
 * - no vuelve a clasificar el mensaje;
 * - no modifica state directamente;
 * - no inventa una respuesta;
 * - no trata MEDIUM como fallback;
 * - no ejecuta quick replies ni actions;
 * - delega la creación declarativa de interacciones
 *   en response-interactions.js.
 * ============================================================
 */


/* ============================================================
 * TARGETS
 * ============================================================
 */

export const FALLBACK_RESPONSE_TARGET =
  Object.freeze({
    CONTACT:
      RESPONSE_INTERACTION_TARGET
        .CONTACT,
  });


/* ============================================================
 * RESPONSE TEMPLATES
 * ============================================================
 */

export const FALLBACK_RESPONSE_TEMPLATE =
  Object.freeze({
    CLARIFY:
      "fallback-clarify",

    CATEGORIES:
      "fallback-categories",

    ESCALATE:
      "fallback-escalate",
  });


/* ============================================================
 * LAST ACTION
 * ============================================================
 */

export const FALLBACK_LAST_ACTION =
  Object.freeze({
    OFFER_CONTACT:
      "offer_contact",
  });


/* ============================================================
 * SAFETY
 * ============================================================
 */

export const FALLBACK_FORBIDDEN_CLAIMS =
  Object.freeze([
    "invented-fact",
    "invented-experience",
    "invented-project",
    "invented-service",
  ]);


/* ============================================================
 * INTERNAL HELPERS
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


/* ============================================================
 * FALLBACK LEVEL CONTRACT
 * ============================================================
 */

export function isCanonicalFallbackLevel(
  value,
) {
  return (
    value ===
      FALLBACK_LEVEL.CLARIFY ||
    value ===
      FALLBACK_LEVEL.CATEGORIES ||
    value ===
      FALLBACK_LEVEL.ESCALATE
  );
}


export function resolveFallbackLevel(
  {
    fallbackLevel = null,
    analysis = null,
  } = {},
) {
  /*
   * Si llega un nivel explícito,
   * tiene prioridad.
   *
   * Si es inválido:
   * fail closed.
   *
   * No caemos silenciosamente al valor
   * procedente de analysis.
   */
  if (
    fallbackLevel !== null &&
    fallbackLevel !== undefined
  ) {
    return (
      isCanonicalFallbackLevel(
        fallbackLevel,
      )
        ? fallbackLevel
        : null
    );
  }


  const analysisLevel =
    analysis?.fallbackLevel;


  return (
    isCanonicalFallbackLevel(
      analysisLevel,
    )
      ? analysisLevel
      : null
  );
}


/* ============================================================
 * TEMPLATE RESOLUTION
 * ============================================================
 */

function templateForLevel(
  fallbackLevel,
) {
  switch (
    fallbackLevel
  ) {
    case FALLBACK_LEVEL.CLARIFY:
      return (
        FALLBACK_RESPONSE_TEMPLATE
          .CLARIFY
      );


    case FALLBACK_LEVEL.CATEGORIES:
      return (
        FALLBACK_RESPONSE_TEMPLATE
          .CATEGORIES
      );


    case FALLBACK_LEVEL.ESCALATE:
      return (
        FALLBACK_RESPONSE_TEMPLATE
          .ESCALATE
      );


    default:
      return null;
  }
}


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

export function composeFallbackNaturalText(
  fallbackLevel,
) {
  switch (
    fallbackLevel
  ) {
    case FALLBACK_LEVEL.CLARIFY:
      return (
        "No he conseguido identificar con suficiente claridad lo que necesitas. " +
        "¿Puedes contármelo de otra forma o darme un poco más de contexto?"
      );


    case FALLBACK_LEVEL.CATEGORIES:
      return (
        "Todavía no consigo identificar bien qué necesitas. " +
        "Puedo ayudarte, por ejemplo, con la experiencia de Víctor, sus tecnologías, " +
        "proyectos y servicios, o con problemas relacionados con datos y automatización."
      );


    case FALLBACK_LEVEL.ESCALATE:
      return (
        "No quiero seguir haciéndote repetir lo mismo. " +
        "Si lo prefieres, puedes contactar directamente con Víctor y explicarle tu caso."
      );


    default:
      return "";
  }
}


/* ============================================================
 * ACTIONS
 * ============================================================
 */

function buildContactAction() {
  return createContactAction({
    id:
      "action-fallback-contact",

    label:
      "Contactar con Víctor",
  });
}


function actionsForLevel(
  fallbackLevel,
) {
  if (
    fallbackLevel !==
      FALLBACK_LEVEL.ESCALATE
  ) {
    return [];
  }


  const action =
    buildContactAction();


  return (
    action
      ? [action]
      : []
  );
}


/* ============================================================
 * QUICK REPLIES
 * ============================================================
 */

function quickRepliesForLevel(
  fallbackLevel,
) {
  if (
    fallbackLevel !==
      FALLBACK_LEVEL.CATEGORIES
  ) {
    return [];
  }


  return (
    createFallbackCategoryQuickReplies()
  );
}


/* ============================================================
 * STATE EFFECTS
 * ============================================================
 */

function stateEffectsForLevel(
  fallbackLevel,
  hasContactAction,
) {
  return {
    /*
     * Un fallback visible siempre incrementa
     * la secuencia.
     */
    resetFallbacks:
      false,

    incrementFallbacks:
      true,

    /*
     * Solo CLARIFY formula explícitamente
     * una pregunta de reparación.
     */
    markQuestionAsked:
      fallbackLevel ===
        FALLBACK_LEVEL.CLARIFY
        ? FALLBACK_RESPONSE_TEMPLATE
            .CLARIFY
        : null,

    /*
     * ESCALATE deja constancia de que ya
     * ofrecimos contacto.
     */
    setLastAction:
      fallbackLevel ===
          FALLBACK_LEVEL.ESCALATE &&
        hasContactAction
        ? FALLBACK_LAST_ACTION
            .OFFER_CONTACT
        : null,
  };
}


/* ============================================================
 * ANALYTICS HELPERS
 * ============================================================
 */

function resolveIntent(
  intent,
  analysis,
) {
  return (
    safeString(
      intent,
    ) ||
    safeString(
      analysis?.primaryIntent,
    ) ||
    "unknown"
  );
}


function resolveConfidenceBucket(
  confidenceBucket,
  analysis,
) {
  return (
    safeString(
      confidenceBucket,
    ) ||
    safeString(
      analysis?.confidenceBucket,
    ) ||
    null
  );
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeFallbackResponse(
  {
    userText,
    fallbackLevel = null,
    analysis = null,
    intent = null,
    confidenceBucket = null,
    faqId = null,
    answerQaId = null,
  } = {},
) {
  const text =
    safeString(
      userText,
    );


  if (!text) {
    return null;
  }


  const resolvedLevel =
    resolveFallbackLevel({
      fallbackLevel,
      analysis,
    });


  if (!resolvedLevel) {
    return null;
  }


  const templateId =
    templateForLevel(
      resolvedLevel,
    );


  const answerText =
    composeFallbackNaturalText(
      resolvedLevel,
    );


  if (
    !templateId ||
    !answerText
  ) {
    return null;
  }


  const actions =
    actionsForLevel(
      resolvedLevel,
    );


  const quickReplies =
    quickRepliesForLevel(
      resolvedLevel,
    );


  /*
   * ESCALATE necesita un target de contacto
   * real y canónico.
   *
   * Si no puede construirse:
   * fail closed.
   */
  if (
    resolvedLevel ===
      FALLBACK_LEVEL.ESCALATE &&
    actions.length === 0
  ) {
    return null;
  }


  /*
   * CATEGORIES necesita sus cuatro opciones.
   *
   * Si el preset deja de ser válido en el futuro,
   * no mostramos un fallback de categorías incompleto.
   */
  if (
    resolvedLevel ===
      FALLBACK_LEVEL.CATEGORIES &&
    quickReplies.length === 0
  ) {
    return null;
  }


  const resolvedIntent =
    resolveIntent(
      intent,
      analysis,
    );


  const resolvedConfidenceBucket =
    resolveConfidenceBucket(
      confidenceBucket,
      analysis,
    );


  return createResponseEnvelope({
    id:
      `response-${templateId}`,

    kind:
      RESPONSE_KIND.FALLBACK,

    outcome:
      RESPONSE_OUTCOME.FALLBACK,

    intent:
      resolvedIntent,

    messages: [
      {
        id:
          `msg-${templateId}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .EXPLANATION,

        text:
          answerText,
      },
    ],

    quickReplies,

    actions,

    presentation: {
      depth:
        resolvedLevel ===
          FALLBACK_LEVEL.CATEGORIES
          ? RESPONSE_DEPTH.MEDIUM
          : RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        templateId,

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE.NONE,

      knowledgeIds: [],

      factIds: [],

      qualificationReasons: [],
    },

    safety: {
      mustQualify:
        false,

      commercialRedirect:
        false,

      allowInference:
        false,

      forbiddenClaims: [
        ...FALLBACK_FORBIDDEN_CLAIMS,
      ],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY.REPAIR,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects:
      stateEffectsForLevel(
        resolvedLevel,
        actions.length > 0,
      ),

    analytics: {
      eventName:
        "chat_fallback_response",

      intent:
        resolvedIntent,

      outcome:
        RESPONSE_OUTCOME.FALLBACK,

      responseKind:
        RESPONSE_KIND.FALLBACK,

      confidenceBucket:
        resolvedConfidenceBucket,

      fallbackLevel:
        resolvedLevel,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        templateId,
    },
  });
}