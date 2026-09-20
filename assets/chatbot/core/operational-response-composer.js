import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
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
 * OPERATIONAL RESPONSE COMPOSER
 * 1.11.22.7
 *
 * Gestiona:
 *
 * - diagnóstico
 * - contacto
 * - booking / Calendly
 * - confirmación real de booking
 *
 * No gestiona aquí:
 *
 * - privacidad general → 1.11.22.8
 * - fallbacks → 1.11.22.9
 * - quick replies → 1.11.22.10
 *
 * Reglas:
 *
 * DIAGNOSTIC
 * - solo prefill de valores proporcionados por el usuario
 * - nunca prefill de consentimiento
 * - nunca submit automático
 *
 * CONTACT
 * - solo canales públicos Knowledge
 *
 * BOOKING
 * - Calendly es autoridad de disponibilidad
 * - name/email son los únicos prefill permitidos
 * - fecha/hora expresada por usuario = preferencia
 * - nunca booking automático
 * - solo calendly.event_scheduled confirma reserva
 * ============================================================
 */


/* ============================================================
 * IDS
 * ============================================================
 */

export const OPERATIONAL_RESPONSE_TARGET =
  Object.freeze({
    DIAGNOSTIC:
      "diagnostic-portfolio-initial",

    CONTACT:
      "contact-victor-portfolio",

    BOOKING:
      "booking-calendly-initial-meeting",
  });


/* ============================================================
 * INTENTS
 * ============================================================
 */

export const OPERATIONAL_RESPONSE_INTENT =
  Object.freeze({
    DIAGNOSTIC:
      "diagnostic",

    CONTACT:
      "contact",

    BOOKING:
      "booking",
  });


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


function normalizeText(
  value,
) {
  return safeString(
    value,
  )
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


function uniqueStrings(
  values,
) {
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


function isCanonicalOperationalIntent(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      OPERATIONAL_RESPONSE_INTENT,
    ).includes(
      value,
    )
  );
}


/* ============================================================
 * INTENT DETECTION
 *
 * El futuro Dialogue Manager podrá proporcionar intent explícito.
 * Esta detección local permite además funcionamiento determinista
 * y tests aislados.
 * ============================================================
 */

const OPERATIONAL_PATTERNS =
  Object.freeze({
    [OPERATIONAL_RESPONSE_INTENT.BOOKING]:
      Object.freeze([
        "reservar una reunion",
        "reservar reunion",
        "reservar una llamada",
        "agendar una reunion",
        "agendar reunion",
        "agendar una llamada",
        "concertar una reunion",
        "pedir una reunion",
        "pedir cita",
        "calendly",
        "ver horarios",
        "reservar hora",
        "reservar cita",
      ]),

    [OPERATIONAL_RESPONSE_INTENT.CONTACT]:
      Object.freeze([
        "contactar con victor",
        "como contacto con el",
        "como puedo contactar",
        "como contacto con victor",
        "como contacto con el",
        "contacto con victor",
        "conectar con victor",
        "conectar con el",
        "como puedo conectar con victor",
        "como puedo conectar con el",
        "contactar a victor",
        "ponerme en contacto con victor",
        "ponme en contacto con victor",
        "me puedes poner en contacto con victor",
        "puedes ponerme en contacto con victor",
        "hablar con victor",
        "hablar con el",
        "escribir a victor",
        "escribirle",
        "como puedo contactar",
        "como puedo hablar",
        "como puedo escribir",
        "correo de victor",
        "email de victor",
        "linkedin de victor",
        "datos de contacto",
      ]),

    [OPERATIONAL_RESPONSE_INTENT.DIAGNOSTIC]:
      Object.freeze([
        "hacer un diagnostico",
        "iniciar diagnostico",
        "empezar diagnostico",
        "analizar mi caso",
        "revisar mi caso",
        "explicarte mi problema",
        "explicar mi problema",
        "contarte mi problema",
        "quiero orientacion",
        "diagnostico",
      ]),
  });


export function detectOperationalIntent(
  userText,
) {
  const text =
    normalizeText(
      userText,
    );


  if (!text) {
    return null;
  }


  /*
   * Booking antes que Contact:
   *
   * "Quiero contactar con Víctor para reservar una reunión"
   *
   * debe llegar a booking.
   */
  const priority = [
    OPERATIONAL_RESPONSE_INTENT
      .BOOKING,

    OPERATIONAL_RESPONSE_INTENT
      .CONTACT,

    OPERATIONAL_RESPONSE_INTENT
      .DIAGNOSTIC,
  ];


  for (
    const intent
    of priority
  ) {
    const patterns =
      OPERATIONAL_PATTERNS[
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


export function resolveOperationalIntent(
  {
    userText,
    intent = null,
  } = {},
) {
  if (
    isCanonicalOperationalIntent(
      intent,
    )
  ) {
    return intent;
  }


  return detectOperationalIntent(
    userText,
  );
}


/* ============================================================
 * SAFE USER VALUES
 * ============================================================
 */

function normalizeUserProvidedValue(
  value,
) {
  if (
    typeof value === "string"
  ) {
    const text =
      value.trim();


    return (
      text
        ? text
        : null
    );
  }


  if (
    typeof value === "number" &&
    Number.isFinite(
      value,
    )
  ) {
    return value;
  }


  if (
    typeof value === "boolean"
  ) {
    return value;
  }


  return null;
}


function copyAllowedUserValues(
  source,
  allowedKeys,
  forbiddenKeys = [],
) {
  if (
    !source ||
    typeof source !==
      "object" ||
    Array.isArray(
      source,
    )
  ) {
    return Object.freeze({});
  }


  const allowed =
    new Set(
      Array.isArray(
        allowedKeys,
      )
        ? allowedKeys
        : [],
    );


  const forbidden =
    new Set(
      Array.isArray(
        forbiddenKeys,
      )
        ? forbiddenKeys
        : [],
    );


  const result = {};


  for (
    const key
    of allowed
  ) {
    if (
      forbidden.has(
        key,
      )
    ) {
      continue;
    }


    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          source,
          key,
        )
    ) {
      continue;
    }


    const value =
      normalizeUserProvidedValue(
        source[key],
      );


    if (
      value === null
    ) {
      continue;
    }


    result[key] =
      value;
  }


  return Object.freeze({
    ...result,
  });
}


/* ============================================================
 * DIAGNOSTIC PREFILL
 * ============================================================
 */

export function buildDiagnosticPrefill(
  userValues = {},
) {
  const diagnostic =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .DIAGNOSTIC,
    );


  if (
    !diagnostic ||
    diagnostic.type !==
      KNOWLEDGE_TYPE.DIAGNOSTIC
  ) {
    return Object.freeze({});
  }


  const prefillableFields =
    getFactValue(
      diagnostic,
      "prefillable-fields",
    );


  const neverPrefillFields =
    getFactValue(
      diagnostic,
      "never-prefill-fields",
    );


  return copyAllowedUserValues(
    userValues,
    prefillableFields,
    neverPrefillFields,
  );
}


/* ============================================================
 * BOOKING PREFILL
 *
 * Calendly solo permite aquí name + email.
 * ============================================================
 */

export function buildBookingPrefill(
  userValues = {},
) {
  const booking =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );


  if (
    !booking ||
    booking.type !==
      KNOWLEDGE_TYPE.BOOKING
  ) {
    return Object.freeze({});
  }


  const allowedFields =
    getFactValue(
      booking,
      "booking-prefill-fields",
    );


  return copyAllowedUserValues(
    userValues,
    allowedFields,
  );
}


/* ============================================================
 * BOOKING PREFERENCES
 *
 * Estas preferencias NO significan disponibilidad confirmada.
 *
 * Ejemplo:
 *
 * preferred-date = "martes"
 *
 * significa:
 *
 * "el usuario prefiere martes"
 *
 * NO:
 *
 * "martes está disponible"
 * ============================================================
 */

export function buildBookingPreferences(
  userValues = {},
) {
  const booking =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );


  if (
    !booking ||
    booking.type !==
      KNOWLEDGE_TYPE.BOOKING
  ) {
    return Object.freeze({});
  }


  const allowedFields =
    getFactValue(
      booking,
      "booking-preference-fields",
    );


  return copyAllowedUserValues(
    userValues,
    allowedFields,
  );
}


/* ============================================================
 * ACTION BUILDERS
 * ============================================================
 */

function buildDiagnosticAction() {
  const diagnostic =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .DIAGNOSTIC,
    );


  if (
    !diagnostic ||
    diagnostic.type !==
      KNOWLEDGE_TYPE.DIAGNOSTIC
  ) {
    return null;
  }


  return {
    id:
      "action-operational-diagnostic",

    type:
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,

    label:
      "Iniciar diagnóstico",

    target:
      diagnostic.id,

    priority:
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,
  };
}


function buildContactAction() {
  const contact =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .CONTACT,
    );


  if (
    !contact ||
    contact.type !==
      KNOWLEDGE_TYPE.CONTACT
  ) {
    return null;
  }


  return {
    id:
      "action-operational-contact",

    type:
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,

    label:
      "Contactar con Víctor",

    target:
      contact.id,

    priority:
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,
  };
}


function buildBookingAction(
  priority =
    RESPONSE_ACTION_PRIORITY
      .PRIMARY,
) {
  const booking =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );


  if (
    !booking ||
    booking.type !==
      KNOWLEDGE_TYPE.BOOKING
  ) {
    return null;
  }


  return {
    id:
      "action-operational-booking",

    type:
      RESPONSE_ACTION_TYPE
        .OPEN_CALENDLY,

    label:
      "Ver horarios en Calendly",

    target:
      booking.id,

    priority,
  };
}


/* ============================================================
 * NATURAL LANGUAGE — DIAGNOSTIC
 * ============================================================
 */

function composeDiagnosticText(
  diagnostic,
) {
  const automaticSubmit =
    getFactValue(
      diagnostic,
      "automatic-submit",
    );


  const neverPrefill =
    getFactValue(
      diagnostic,
      "never-prefill-fields",
    );


  const protectsConsent =
    Array.isArray(
      neverPrefill,
    ) &&
    neverPrefill.includes(
      "acepta_privacidad",
    );


  let text =
    "Podemos hacer un diagnóstico breve para ordenar tu caso " +
    "y preparar la información necesaria antes de que decidas enviarla.";


  if (
    protectsConsent
  ) {
    text +=
      " Para el prellenado solo se usarán datos que tú hayas proporcionado, " +
      "y el consentimiento de privacidad siempre tendrás que marcarlo tú.";
  }


  if (
    automaticSubmit ===
      false
  ) {
    text +=
      " El formulario tampoco se enviará automáticamente.";
  }


  return text;
}


/* ============================================================
 * NATURAL LANGUAGE — CONTACT
 * ============================================================
 */

function composeContactText(
  contact,
) {
  const email =
    safeString(
      getFactValue(
        contact,
        "contact-email",
      ),
    );


  const channels =
    getFactValue(
      contact,
      "contact-channels",
    );


  const hasLinkedIn =
    Array.isArray(
      channels,
    ) &&
    channels.includes(
      "linkedin",
    );


  const parts = [
    "Claro. Puedes escribirle directamente a Víctor",
  ];


  if (
    email &&
    hasLinkedIn
  ) {
    parts.push(
      `por email (${email}) o LinkedIn`,
    );
  }
  else if (email) {
    parts.push(
      `por email (${email})`,
    );
  }
  else if (hasLinkedIn) {
    parts.push(
      "por LinkedIn",
    );
  }


  let text =
    `${parts.join(" ")}.`;


  if (
    Array.isArray(
      channels,
    ) &&
    channels.includes(
      "diagnostic",
    )
  ) {
    text +=
      " Si antes quieres ordenar un poco tu caso, también puedes usar el diagnóstico.";
  }


  text +=
    " Y si prefieres hablarlo directamente, puedes reservar una reunión inicial de 30 minutos.";


  return text;
}


/* ============================================================
 * NATURAL LANGUAGE — BOOKING
 * ============================================================
 */

function composeBookingText(
  booking,
) {
  const provider =
    safeString(
      getFactValue(
        booking,
        "booking-provider",
      ),
    );


  const duration =
    getFactValue(
      booking,
      "meeting-duration-minutes",
    );


  let text =
    "Puedes reservar una reunión inicial";


  if (
    typeof duration === "number" &&
    Number.isFinite(
      duration,
    )
  ) {
    text +=
      ` de ${duration} minutos`;
  }


  text +=
    " con Víctor";


  if (provider) {
    text +=
      ` mediante ${
        provider === "calendly"
          ? "Calendly"
          : provider
      }`;
  }


  text +=
    ". Allí podrás consultar la disponibilidad y elegir el horario que te encaje.";


  return text;
}


/* ============================================================
 * FORBIDDEN CLAIMS
 * ============================================================
 */

function getOperationalForbiddenClaims(
  item,
) {
  return uniqueStrings(
    item?.answerPolicy
      ?.forbiddenClaims ??
      [],
  );
}


/* ============================================================
 * RESPONSE BUILDER
 * ============================================================
 */

function createOperationalActionResponse(
  {
    item,
    operationalIntent,
    text,
    action,
    secondaryAction = null,
    context = {},
    faqId = null,
    answerQaId = null,
  },
) {
  if (
    !item ||
    !safeString(
      text,
    ) ||
    !action
  ) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  return createResponseEnvelope({
    id:
      `response-operational-${operationalIntent}`,

    kind:
      RESPONSE_KIND.ACTION,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent:
      operationalIntent,

    messages: [
      {
        id:
          `msg-operational-${operationalIntent}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text,
      },
    ],

    actions: [
      action,
      secondaryAction,
    ].filter(Boolean),

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        `operational-${operationalIntent}`,

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

      forbiddenClaims:
        getOperationalForbiddenClaims(
          item,
        ),
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
        normalizedContext
          .suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        `operational-${operationalIntent}`,
    },
  });
}


/* ============================================================
 * MAIN OPERATIONAL COMPOSER
 * ============================================================
 */

export function composeOperationalResponse(
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
    resolveOperationalIntent({
      userText:
        text,

      intent,
    });


  if (!resolvedIntent) {
    return null;
  }


  switch (
    resolvedIntent
  ) {
    case OPERATIONAL_RESPONSE_INTENT
      .DIAGNOSTIC: {
      const diagnostic =
        getKnowledgeById(
          OPERATIONAL_RESPONSE_TARGET
            .DIAGNOSTIC,
        );


      if (
        !diagnostic ||
        diagnostic.type !==
          KNOWLEDGE_TYPE.DIAGNOSTIC
      ) {
        return null;
      }


      return createOperationalActionResponse({
        item:
          diagnostic,

        operationalIntent:
          resolvedIntent,

        text:
          composeDiagnosticText(
            diagnostic,
          ),

        action:
          buildDiagnosticAction(),

        context,

        faqId,

        answerQaId,
      });
    }


    case OPERATIONAL_RESPONSE_INTENT
      .CONTACT: {
      const contact =
        getKnowledgeById(
          OPERATIONAL_RESPONSE_TARGET
            .CONTACT,
        );


      if (
        !contact ||
        contact.type !==
          KNOWLEDGE_TYPE.CONTACT
      ) {
        return null;
      }


      return createOperationalActionResponse({
        item:
          contact,

        operationalIntent:
          resolvedIntent,

        text:
          composeContactText(
            contact,
          ),

        action:
          buildContactAction(),

        secondaryAction:
          buildBookingAction(
            RESPONSE_ACTION_PRIORITY
              .SECONDARY,
          ),

        context,

        faqId,

        answerQaId,
      });
    }


    case OPERATIONAL_RESPONSE_INTENT
      .BOOKING: {
      const booking =
        getKnowledgeById(
          OPERATIONAL_RESPONSE_TARGET
            .BOOKING,
        );


      if (
        !booking ||
        booking.type !==
          KNOWLEDGE_TYPE.BOOKING
      ) {
        return null;
      }


      return createOperationalActionResponse({
        item:
          booking,

        operationalIntent:
          resolvedIntent,

        text:
          composeBookingText(
            booking,
          ),

        action:
          buildBookingAction(),

        context,

        faqId,

        answerQaId,
      });
    }


    default:
      return null;
  }
}


/* ============================================================
 * BOOKING EVENT CONFIRMATION
 *
 * IMPORTANTE:
 *
 * event_type_viewed
 *        ≠
 * booking
 *
 * date_and_time_selected
 *        ≠
 * booking confirmed
 *
 * event_scheduled
 *        =
 * booking confirmed
 * ============================================================
 */

export function isBookingConfirmationEvent(
  eventName,
) {
  const booking =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );


  if (
    !booking ||
    booking.type !==
      KNOWLEDGE_TYPE.BOOKING
  ) {
    return false;
  }


  const confirmationEvent =
    safeString(
      getFactValue(
        booking,
        "booking-confirmation-event",
      ),
    );


  return (
    Boolean(
      confirmationEvent,
    ) &&
    safeString(
      eventName,
    ) ===
      confirmationEvent
  );
}


export function composeBookingEventResponse(
  {
    eventName,
    context = {},
    faqId = null,
    answerQaId = null,
  } = {},
) {
  if (
    !isBookingConfirmationEvent(
      eventName,
    )
  ) {
    return null;
  }


  const booking =
    getKnowledgeById(
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );


  if (!booking) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  return createResponseEnvelope({
    id:
      "response-booking-confirmed",

    kind:
      RESPONSE_KIND.ACTION,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent:
      OPERATIONAL_RESPONSE_INTENT
        .BOOKING,

    messages: [
      {
        id:
          "msg-booking-confirmed",

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ACKNOWLEDGEMENT,

        text:
          "Perfecto. La reunión ha quedado reservada en Calendly.",
      },
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.MICRO,

      splitBubbles:
        false,

      variationFamily:
        "booking-confirmed",

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

      forbiddenClaims:
        getOperationalForbiddenClaims(
          booking,
        ),
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
        "booking-confirmed",
    },
  });
}