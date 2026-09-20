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
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
  getKnowledgeFact,
} from "../data/knowledge.js";


/* ============================================================
 * PRIVACY RESPONSE COMPOSER
 * 1.11.22.8
 *
 * Responde preguntas sobre:
 *
 * - privacidad general
 * - almacenamiento temporal
 * - TTL
 * - Analytics / GA4
 * - PII y texto libre
 * - terceros operativos
 * - feedback
 * - reinicio de conversación
 *
 * La verdad vive en:
 *
 * - POLICY Knowledge
 * - decisiones de persistencia V1
 * - contratos operativos existentes
 *
 * Este módulo no inventa políticas legales nuevas.
 * ============================================================
 */


/* ============================================================
 * POLICY IDS
 * ============================================================
 */

export const PRIVACY_POLICY_ID =
  Object.freeze({
    SESSION:
      "policy-chatbot-session-data",

    ANALYTICS:
      "policy-chatbot-analytics-privacy",

    FEEDBACK:
      "policy-chatbot-improvement-feedback",
  });


/* ============================================================
 * PRIVACY INTENTS
 * ============================================================
 */

export const PRIVACY_RESPONSE_INTENT =
  Object.freeze({
    GENERAL:
      "privacy_general",

    SESSION:
      "privacy_session",

    ANALYTICS:
      "privacy_analytics",

    FEEDBACK:
      "privacy_feedback",

    THIRD_PARTIES:
      "privacy_third_parties",

    RESET:
      "privacy_reset",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function safeString(value) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function normalizeText(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[¿?¡!.,;:()[\]{}"'`]/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


function uniqueStrings(values) {
  return [
    ...new Set(
      values.filter(
        (value) =>
          typeof value ===
            "string" &&
          value.trim(),
      ),
    ),
  ];
}


function getFactValue(
  item,
  key,
) {
  return (
    getKnowledgeFact(
      item,
      key,
    )?.value ??
    null
  );
}


function getFactId(
  item,
  key,
) {
  return (
    getKnowledgeFact(
      item,
      key,
    )?.id ??
    null
  );
}


function contextFromInput(
  context = {},
) {
  return {
    continuing:
      context.continuing ===
      true,

    suppressRepeatedCTA:
      context
        .suppressRepeatedCTA !==
      false,
  };
}


function isCanonicalPrivacyIntent(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      PRIVACY_RESPONSE_INTENT,
    ).includes(
      value,
    )
  );
}


/* ============================================================
 * POLICY GETTERS
 * ============================================================
 */

function getPolicy(
  policyId,
) {
  const policy =
    getKnowledgeById(
      policyId,
    );


  if (
    !policy ||
    policy.type !==
      KNOWLEDGE_TYPE.POLICY
  ) {
    return null;
  }


  return policy;
}


/* ============================================================
 * INTENT DETECTION
 * ============================================================
 */

const PRIVACY_PATTERNS =
  Object.freeze({
    [PRIVACY_RESPONSE_INTENT.RESET]:
      Object.freeze([
        "borrar la conversacion",
        "borrar conversacion",
        "eliminar la conversacion",
        "eliminar conversacion",
        "borrar el chat",
        "eliminar el chat",
        "reiniciar la conversacion",
        "reiniciar conversacion",
        "reiniciar el chat",
        "borrar mis datos del chat",
        "olvidar lo que he dicho",
      ]),

    [PRIVACY_RESPONSE_INTENT.ANALYTICS]:
      Object.freeze([
        "google analytics",
        "analytics",
        "ga4",
        "enviais mis datos a google",
        "envias mis datos a google",
        "tracking",
        "seguimiento analytics",
        "datos de analitica",
        "datos de analítica",
      ]),

    [PRIVACY_RESPONSE_INTENT.FEEDBACK]:
      Object.freeze([
        "usas mis preguntas para mejorar",
        "usais mis preguntas para mejorar",
        "guardais mis preguntas para mejorar",
        "guardas mis preguntas para mejorar",
        "feedback",
        "pregunta exacta",
        "guardar mi pregunta",
        "recopilais conversaciones para mejorar",
      ]),

    [PRIVACY_RESPONSE_INTENT.THIRD_PARTIES]:
      Object.freeze([
        "formspree",
        "calendly",
        "terceros",
        "servicios externos",
        "a donde se envian mis datos",
        "donde se envian mis datos",
        "quien recibe mis datos",
        "compartis mis datos",
        "compartes mis datos",
      ]),

    [PRIVACY_RESPONSE_INTENT.SESSION]:
      Object.freeze([
        "se guarda la conversacion",
        "se guarda mi conversacion",
        "se guarda el chat",
        "se guarda mi chat",

        "guardais la conversacion",
        "guardais mi conversacion",
        "guardas la conversacion",
        "guardas mi conversacion",

        "guardais el chat",
        "guardais mi chat",
        "guardas el chat",
        "guardas mi chat",

        "donde se guarda la conversacion",
        "donde se guarda mi conversacion",
        "donde se guarda esta conversacion",
        "donde se guarda el chat",
        "donde se guarda este chat",
        "donde se guarda mi chat",

        "donde guardais la conversacion",
        "donde guardais mi conversacion",
        "donde guardais el chat",
        "donde guardais mi chat",

        "donde guardas la conversacion",
        "donde guardas mi conversacion",
        "donde guardas el chat",
        "donde guardas mi chat",

        "sessionstorage",

        "cuanto tiempo se guarda",
        "cuanto tiempo guardais",
        "durante cuanto tiempo",

        "8 horas",
      ]),

    [PRIVACY_RESPONSE_INTENT.GENERAL]:
      Object.freeze([
        "privacidad",
        "mis datos",
        "datos personales",
        "que haceis con mis datos",
        "que haces con mis datos",
        "como tratais mis datos",
        "como tratas mis datos",
      ]),
  });


export function detectPrivacyIntent(
  userText,
) {
  const text =
    normalizeText(
      userText,
    );


  if (!text) {
    return null;
  }


  const priority = [
    PRIVACY_RESPONSE_INTENT.RESET,
    PRIVACY_RESPONSE_INTENT.ANALYTICS,
    PRIVACY_RESPONSE_INTENT.FEEDBACK,
    PRIVACY_RESPONSE_INTENT.THIRD_PARTIES,
    PRIVACY_RESPONSE_INTENT.SESSION,
    PRIVACY_RESPONSE_INTENT.GENERAL,
  ];


  for (
    const intent
    of priority
  ) {
    const patterns =
      PRIVACY_PATTERNS[
        intent
      ] ?? [];


    if (
      patterns.some(
        (pattern) =>
          text.includes(
            normalizeText(
              pattern,
            ),
          ),
      )
    ) {
      return intent;
    }
  }


  return null;
}


export function resolvePrivacyIntent(
  {
    userText,
    intent = null,
  } = {},
) {
  if (
    isCanonicalPrivacyIntent(
      intent,
    )
  ) {
    return intent;
  }


  return detectPrivacyIntent(
    userText,
  );
}


/* ============================================================
 * NATURAL LANGUAGE — SESSION
 * ============================================================
 */

function composeSessionPrivacyText(
  sessionPolicy,
) {
  const storage =
    safeString(
      getFactValue(
        sessionPolicy,
        "conversation-storage",
      ),
    );


  const ttlHours =
    getFactValue(
      sessionPolicy,
      "conversation-ttl-hours",
    );


  const centralTranscript =
    getFactValue(
      sessionPolicy,
      "automatic-central-transcript-storage",
    );


  let text =
    "La conversación se mantiene temporalmente en esta sesión";


  if (storage) {
    text +=
      ` mediante ${storage}`;
  }


  if (
    typeof ttlHours ===
      "number" &&
    Number.isFinite(
      ttlHours,
    )
  ) {
    text +=
      `, con un límite de ${ttlHours} horas de inactividad`;
  }


  text += ".";


  if (
    centralTranscript ===
      false
  ) {
    text +=
      " No se guarda automáticamente una transcripción central de la conversación.";
  }


  return text;
}


/* ============================================================
 * NATURAL LANGUAGE — ANALYTICS
 * ============================================================
 */

function composeAnalyticsPrivacyText(
  analyticsPolicy,
) {
  const forbidden =
    getFactValue(
      analyticsPolicy,
      "analytics-forbidden-data",
    );


  const protectedValues =
    new Set(
      Array.isArray(
        forbidden,
      )
        ? forbidden
        : [],
    );


  const protectsPii =
    [
      "name",
      "email",
      "phone",
    ].every(
      (key) =>
        protectedValues.has(
          key,
        ),
    );


  const protectsConversation =
    [
      "conversation",
      "raw-message",
      "free-text",
      "diagnostic-summary",
    ].every(
      (key) =>
        protectedValues.has(
          key,
        ),
    );


  let text =
    "La analítica del asistente está limitada a señales estructuradas de uso.";


  if (protectsPii) {
    text +=
      " No se envían a Analytics tu nombre, email ni teléfono.";
  }


  if (
    protectsConversation
  ) {
    text +=
      " Tampoco se envían la conversación, la pregunta literal, texto libre ni el resumen del diagnóstico.";
  }


  return text;
}


/* ============================================================
 * NATURAL LANGUAGE — FEEDBACK
 * ============================================================
 */

function composeFeedbackPrivacyText(
  feedbackPolicy,
) {
  const automaticCollection =
    getFactValue(
      feedbackPolicy,
      "automatic-transcript-collection",
    );


  const exactQuestionFeedback =
    safeString(
      getFactValue(
        feedbackPolicy,
        "exact-question-feedback",
      ),
    );


  const userReview =
    getFactValue(
      feedbackPolicy,
      "feedback-user-review",
    );


  let text = "";


  if (
    automaticCollection ===
      false
  ) {
    text +=
      "No se recopila automáticamente la transcripción para usarla como feedback.";
  }


  if (
    exactQuestionFeedback ===
      "optional-explicit-user-consent"
  ) {
    text +=
      (
        text
          ? " "
          : ""
      ) +
      "Compartir una pregunta exacta como feedback es opcional y requiere tu consentimiento explícito.";
  }


  if (
    userReview ===
      true
  ) {
    text +=
      " Además, podrás revisar lo que se vaya a compartir.";
  }


  return text;
}


/* ============================================================
 * NATURAL LANGUAGE — THIRD PARTIES
 * ============================================================
 */

function composeThirdPartiesText() {
  return (
    "La conversación no se envía automáticamente como una transcripción a un servicio externo. " +
    "Si decides enviar el formulario de diagnóstico, se utiliza Formspree para ese envío. " +
    "Si decides reservar una reunión, se utiliza Calendly. " +
    "Esos pasos se producen únicamente cuando tú los inicias."
  );
}


/* ============================================================
 * NATURAL LANGUAGE — RESET
 * ============================================================
 */

function composeResetPrivacyText() {
  return (
    "Puedes reiniciar la conversación para eliminar los datos conversacionales de la sesión actual. " +
    "El asistente puede empezar después una conversación nueva sin conservar el contexto anterior."
  );
}


/* ============================================================
 * NATURAL LANGUAGE — GENERAL
 * ============================================================
 */

function composeGeneralPrivacyText(
  sessionPolicy,
  analyticsPolicy,
) {
  const sessionText =
    composeSessionPrivacyText(
      sessionPolicy,
    );


  const analyticsText =
    composeAnalyticsPrivacyText(
      analyticsPolicy,
    );


  return (
    `${sessionText} ${analyticsText} ` +
    "Los datos de diagnóstico o reserva solo se transmiten cuando tú decides utilizar esos flujos, " +
    "y puedes reiniciar la conversación cuando quieras."
  );
}


/* ============================================================
 * EVIDENCE / FACT TRACE
 * ============================================================
 */

function privacyKnowledgeIdsForIntent(
  intent,
) {
  switch (intent) {
    case PRIVACY_RESPONSE_INTENT
      .SESSION:
      return [
        PRIVACY_POLICY_ID.SESSION,
      ];


    case PRIVACY_RESPONSE_INTENT
      .ANALYTICS:
      return [
        PRIVACY_POLICY_ID.ANALYTICS,
      ];


    case PRIVACY_RESPONSE_INTENT
      .FEEDBACK:
      return [
        PRIVACY_POLICY_ID.FEEDBACK,
      ];


    case PRIVACY_RESPONSE_INTENT
      .GENERAL:
      return [
        PRIVACY_POLICY_ID.SESSION,
        PRIVACY_POLICY_ID.ANALYTICS,
      ];


    case PRIVACY_RESPONSE_INTENT
      .THIRD_PARTIES:
    case PRIVACY_RESPONSE_INTENT
      .RESET:
    default:
      return [];
  }
}


function privacyFactIdsForIntent(
  intent,
  {
    sessionPolicy,
    analyticsPolicy,
    feedbackPolicy,
  },
) {
  switch (intent) {
    case PRIVACY_RESPONSE_INTENT
      .SESSION:
      return uniqueStrings([
        getFactId(
          sessionPolicy,
          "conversation-storage",
        ),

        getFactId(
          sessionPolicy,
          "conversation-ttl-hours",
        ),

        getFactId(
          sessionPolicy,
          "automatic-central-transcript-storage",
        ),
      ]);


    case PRIVACY_RESPONSE_INTENT
      .ANALYTICS:
      return uniqueStrings([
        getFactId(
          analyticsPolicy,
          "analytics-forbidden-data",
        ),
      ]);


    case PRIVACY_RESPONSE_INTENT
      .FEEDBACK:
      return uniqueStrings([
        getFactId(
          feedbackPolicy,
          "automatic-transcript-collection",
        ),

        getFactId(
          feedbackPolicy,
          "exact-question-feedback",
        ),

        getFactId(
          feedbackPolicy,
          "feedback-user-review",
        ),
      ]);


    case PRIVACY_RESPONSE_INTENT
      .GENERAL:
      return uniqueStrings([
        getFactId(
          sessionPolicy,
          "conversation-storage",
        ),

        getFactId(
          sessionPolicy,
          "conversation-ttl-hours",
        ),

        getFactId(
          sessionPolicy,
          "automatic-central-transcript-storage",
        ),

        getFactId(
          analyticsPolicy,
          "analytics-forbidden-data",
        ),
      ]);


    default:
      return [];
  }
}


/* ============================================================
 * FORBIDDEN CLAIMS
 * ============================================================
 */

function collectPrivacyForbiddenClaims(
  policies,
) {
  return uniqueStrings(
    policies.flatMap(
      (policy) =>
        policy?.answerPolicy
          ?.forbiddenClaims ??
        [],
    ),
  );
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composePrivacyResponse(
  {
    userText,
    intent = null,
    context = {},
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


  const resolvedIntent =
    resolvePrivacyIntent({
      userText:
        text,

      intent,
    });


  if (!resolvedIntent) {
    return null;
  }


  const sessionPolicy =
    getPolicy(
      PRIVACY_POLICY_ID
        .SESSION,
    );


  const analyticsPolicy =
    getPolicy(
      PRIVACY_POLICY_ID
        .ANALYTICS,
    );


  const feedbackPolicy =
    getPolicy(
      PRIVACY_POLICY_ID
        .FEEDBACK,
    );


  if (
    !sessionPolicy ||
    !analyticsPolicy ||
    !feedbackPolicy
  ) {
    return null;
  }


  let answerText = "";


  switch (
    resolvedIntent
  ) {
    case PRIVACY_RESPONSE_INTENT
      .SESSION:
      answerText =
        composeSessionPrivacyText(
          sessionPolicy,
        );
      break;


    case PRIVACY_RESPONSE_INTENT
      .ANALYTICS:
      answerText =
        composeAnalyticsPrivacyText(
          analyticsPolicy,
        );
      break;


    case PRIVACY_RESPONSE_INTENT
      .FEEDBACK:
      answerText =
        composeFeedbackPrivacyText(
          feedbackPolicy,
        );
      break;


    case PRIVACY_RESPONSE_INTENT
      .THIRD_PARTIES:
      answerText =
        composeThirdPartiesText();
      break;


    case PRIVACY_RESPONSE_INTENT
      .RESET:
      answerText =
        composeResetPrivacyText();
      break;


    case PRIVACY_RESPONSE_INTENT
      .GENERAL:
      answerText =
        composeGeneralPrivacyText(
          sessionPolicy,
          analyticsPolicy,
        );
      break;


    default:
      return null;
  }


  if (!answerText) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  const knowledgeIds =
    privacyKnowledgeIdsForIntent(
      resolvedIntent,
    );


  const factIds =
    privacyFactIdsForIntent(
      resolvedIntent,
      {
        sessionPolicy,
        analyticsPolicy,
        feedbackPolicy,
      },
    );


  return createResponseEnvelope({
    id:
      `response-privacy-${resolvedIntent}`,

    kind:
      RESPONSE_KIND.PRIVACY,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent:
      resolvedIntent,

    messages: [
      {
        id:
          `msg-privacy-${resolvedIntent}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text:
          answerText,
      },
    ],

    presentation: {
      depth:
        resolvedIntent ===
          PRIVACY_RESPONSE_INTENT
            .GENERAL
          ? RESPONSE_DEPTH.MEDIUM
          : RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        `privacy-${resolvedIntent}`,

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        knowledgeIds.length > 0
          ? RESPONSE_EVIDENCE_MODE
              .WHEN_USEFUL
          : RESPONSE_EVIDENCE_MODE
              .NONE,

      knowledgeIds,

      factIds,

      qualificationReasons: [],
    },

    safety: {
      mustQualify:
        false,

      commercialRedirect:
        false,

      allowInference:
        false,

      forbiddenClaims:
        collectPrivacyForbiddenClaims([
          sessionPolicy,
          analyticsPolicy,
          feedbackPolicy,
        ]),
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalizedContext
          .continuing
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        `privacy-${resolvedIntent}`,
    },
  });
}