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
  getKnowledgeByType,
} from "../data/knowledge.js";

import {
  COMMERCIAL_CLAIM,
  COMMERCIAL_DECISION,
  assessCommercialClaim,
} from "../data/knowledge/commercial-policy.js";


/* ============================================================
 * COMMERCIAL RESPONSE COMPOSER
 * 1.11.22.5
 *
 * La política comercial NO vive aquí.
 *
 * Este módulo:
 *
 * user text
 *    ↓
 * commercial claim
 *    ↓
 * commercial-policy.js
 *    ↓
 * decision
 *    ↓
 * natural response + safe action
 *
 * Nunca inventa:
 *
 * - precios
 * - presupuestos
 * - tarifas
 * - rangos
 * - plazos
 * - fechas de entrega
 * - disponibilidad
 * - aceptación del proyecto
 * - viabilidad garantizada
 * - resultados garantizados
 * - ROI garantizado
 * ============================================================
 */


/* ============================================================
 * TARGETS
 * ============================================================
 */

export const COMMERCIAL_RESPONSE_TARGET =
  Object.freeze({
    CONTACT:
      "contact-victor-portfolio",

    DIAGNOSTIC:
      "diagnostic-portfolio-initial",
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


function unique(
  values,
) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}


function isCanonicalCommercialClaim(
  value,
) {
  return (
    typeof value === "string" &&
    Object.values(
      COMMERCIAL_CLAIM,
    ).includes(
      value,
    )
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


/* ============================================================
 * COMMERCIAL CLAIM DETECTION
 *
 * Esto no sustituye al NLU.
 *
 * Sirve como capa determinista adicional y permite que el futuro
 * Dialogue Manager entregue también un claim explícito.
 * ============================================================
 */

const COMMERCIAL_PATTERNS =
  Object.freeze({
    [COMMERCIAL_CLAIM.PRICE]:
      Object.freeze([
        "cuanto cobra",
        "cuanto cuesta",
        "cuanto costaria",
        "que precio",
        "precio tendría",
        "precio tendria",
        "presupuesto",
        "tarifa",
        "coste",
        "costo",
        "rango de precio",
        "rango aproximado",
        "precio aproximado",
        "cuanto me costaria",
        "cuanto saldria",
      ]),

    [COMMERCIAL_CLAIM.TIMELINE]:
      Object.freeze([
        "cuanto tardaria",
        "cuanto tardaría",
        "cuanto tarda",
        "cuanto tiempo",
        "que plazo",
        "plazo tendría",
        "plazo tendria",
        "fecha de entrega",
        "cuando estaria listo",
        "cuando estaría listo",
        "cuando estaria terminado",
        "cuando estaría terminado",
        "duracion estimada",
        "duración estimada",
      ]),

    [COMMERCIAL_CLAIM.AVAILABILITY]:
      Object.freeze([
        "esta disponible",
        "está disponible",
        "tiene disponibilidad",
        "tiene hueco",
        "puede empezar",
        "podria empezar",
        "podría empezar",
        "empezar mañana",
        "empezar manana",
        "cuando puede empezar",
        "cuando podria empezar",
        "cuando podría empezar",
      ]),

    [COMMERCIAL_CLAIM.ACCEPTANCE]:
      Object.freeze([
        "aceptaria el proyecto",
        "aceptaría el proyecto",
        "puede aceptar el proyecto",
        "aceptaria mi proyecto",
        "aceptaría mi proyecto",
        "cogeria el proyecto",
        "cogería el proyecto",
        "aceptaria este trabajo",
        "aceptaría este trabajo",
      ]),

    [COMMERCIAL_CLAIM.ROI]:
      Object.freeze([
        "roi",
        "retorno de la inversion",
        "retorno de inversión",
        "retorno economico",
        "retorno económico",
        "retorno me garantiza",
        "retorno economico me garantiza",
        "retorno económico me garantiza",


        "cuanto ahorrare",
        "cuanto ahorraré",

        "cuanto me ahorrare",
        "cuanto me ahorraré",

        "cuanto me ahorraria",
        "cuanto me ahorraría",

        "cuanto ahorro",
        "cuanto me ahorro",

        "ahorro conseguire",
        "ahorro conseguiré",

        "que ahorro conseguire",
        "qué ahorro conseguiré",

        "recuperar la inversion",
        "recuperar la inversión",

        "amortizar la inversion",
        "amortizar la inversión",
      ]),

    [COMMERCIAL_CLAIM.RESULT]:
      Object.freeze([
        "que resultado",
        "qué resultado",
        "que mejora conseguire",
        "qué mejora conseguiré",
        "que mejora obtendre",
        "qué mejora obtendré",
        "funcionara",
        "funcionará",
        "garantiza el resultado",
        "garantizar el resultado",
        "garantizas",
        "garantia de resultado",
        "garantía de resultado",
        "resultado garantizado",
      ]),

    [COMMERCIAL_CLAIM.SERVICE_FIT]:
      Object.freeze([
        "encaja con sus servicios",
        "encajaria con sus servicios",
        "encajaría con sus servicios",
        "este servicio encaja",
        "servicio adecuado",
        "entra en sus servicios",
        "es un servicio que ofrece",
        "puede ayudarme con este caso",
      ]),

    [COMMERCIAL_CLAIM.FEASIBILITY]:
      Object.freeze([
        "es viable",
        "seria viable",
        "sería viable",
        "viabilidad",
        "se puede hacer",
        "puede hacerlo",
        "podria hacerlo",
        "podría hacerlo",
        "se puede automatizar",
        "es posible automatizar",
        "tecnicamente posible",
        "técnicamente posible",
      ]),
  });


export function detectCommercialClaim(
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
   * El orden importa.
   *
   * "¿Puede empezar mañana?"
   * debe ser AVAILABILITY y no FEASIBILITY.
   *
   * "¿Aceptaría el proyecto?"
   * debe ser ACCEPTANCE.
   */
  const priority = [
    COMMERCIAL_CLAIM.PRICE,
    COMMERCIAL_CLAIM.TIMELINE,
    COMMERCIAL_CLAIM.AVAILABILITY,
    COMMERCIAL_CLAIM.ACCEPTANCE,
    COMMERCIAL_CLAIM.ROI,
    COMMERCIAL_CLAIM.RESULT,
    COMMERCIAL_CLAIM.SERVICE_FIT,
    COMMERCIAL_CLAIM.FEASIBILITY,
  ];


  for (
    const claim
    of priority
  ) {
    const patterns =
      COMMERCIAL_PATTERNS[
        claim
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
      return claim;
    }
  }


  return null;
}


/* ============================================================
 * CLAIM RESOLUTION
 *
 * Un claim explícito del Dialogue Manager tiene prioridad.
 * ============================================================
 */

export function resolveCommercialClaim(
  {
    userText,
    claim = null,
  } = {},
) {
  if (
    isCanonicalCommercialClaim(
      claim,
    )
  ) {
    return claim;
  }


  return detectCommercialClaim(
    userText,
  );
}


/* ============================================================
 * POLICY RESOLUTION
 *
 * Si conocemos Service:
 *   → evaluamos ese Service.
 *
 * Si no conocemos Service:
 *   → evaluamos todos los Services.
 *
 * Solo aceptamos una política global si todos coinciden.
 *
 * Así NO duplicamos las reglas de commercial-policy.js.
 * ============================================================
 */

function normalizeAssessment(
  assessment,
  serviceIds,
  scope,
) {
  if (
    !assessment ||
    typeof assessment !==
      "object"
  ) {
    return null;
  }


  return Object.freeze({
    allowed:
      assessment.allowed ===
      true,

    decision:
      assessment.decision ??
      null,

    reason:
      assessment.reason ??
      null,

    action:
      assessment.action ??
      null,

    serviceIds:
      Object.freeze([
        ...serviceIds,
      ]),

    scope,
  });
}


function sameCommercialDecision(
  left,
  right,
) {
  return (
    left?.allowed ===
      right?.allowed &&
    left?.decision ===
      right?.decision &&
    left?.reason ===
      right?.reason &&
    left?.action ===
      right?.action
  );
}


export function resolveCommercialAssessment(
  {
    serviceId = null,
    claim,
  } = {},
) {
  if (
    !isCanonicalCommercialClaim(
      claim,
    )
  ) {
    return null;
  }


  if (
    safeString(
      serviceId,
    )
  ) {
    const service =
      getKnowledgeById(
        serviceId,
      );


    if (
      !service ||
      service.type !==
        KNOWLEDGE_TYPE.SERVICE
    ) {
      return null;
    }


    const assessment =
      assessCommercialClaim(
        service.id,
        claim,
      );


    return normalizeAssessment(
      assessment,
      [
        service.id,
      ],
      "service",
    );
  }


  const services =
    getKnowledgeByType(
      KNOWLEDGE_TYPE.SERVICE,
    );


  if (
    !Array.isArray(
      services,
    ) ||
    services.length === 0
  ) {
    return null;
  }


  const assessments =
    services.map(
      (service) => ({
        service,
        assessment:
          assessCommercialClaim(
            service.id,
            claim,
          ),
      }),
    );


  const first =
    assessments[0]
      ?.assessment;


  if (!first) {
    return null;
  }


  const consensus =
    assessments.every(
      ({ assessment }) =>
        sameCommercialDecision(
          first,
          assessment,
        ),
    );


  /*
   * Fail closed:
   *
   * si en el futuro dos Services tienen políticas distintas,
   * no inventamos una política global.
   */
  if (!consensus) {
    return null;
  }


  return normalizeAssessment(
    first,
    assessments.map(
      ({ service }) =>
        service.id,
    ),
    "all_services",
  );
}


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

export function composeCommercialNaturalText(
  {
    claim,
    assessment,
  } = {},
) {
  if (
    !isCanonicalCommercialClaim(
      claim,
    ) ||
    !assessment
  ) {
    return "";
  }


  switch (claim) {
    case COMMERCIAL_CLAIM.PRICE:
      return (
        "El precio depende del alcance y de lo que necesite el proyecto, " +
        "así que no sería fiable darte una cifra desde aquí. " +
        "Víctor puede valorarlo contigo directamente."
      );


    case COMMERCIAL_CLAIM.TIMELINE:
      return (
        "El plazo depende del alcance, de los datos y de la complejidad del caso. " +
        "Víctor tendría que revisarlo antes de darte una estimación fiable."
      );


    case COMMERCIAL_CLAIM.AVAILABILITY:
      return (
        "No puedo confirmar la disponibilidad de Víctor desde aquí. " +
        "Lo mejor es consultárselo directamente."
      );


    case COMMERCIAL_CLAIM.ACCEPTANCE:
      return (
        "No puedo confirmar que Víctor vaya a aceptar un proyecto " +
        "sin que antes revise el caso. Lo mejor es consultárselo directamente."
      );


    case COMMERCIAL_CLAIM.SERVICE_FIT:
      return (
        "Para saber si el caso encaja con alguno de los servicios de Víctor, " +
        "primero habría que entender mejor el problema, el alcance y las necesidades concretas. " +
        "Podemos hacer un diagnóstico breve para revisarlo."
      );


    case COMMERCIAL_CLAIM.FEASIBILITY:
      return (
        "Para confirmar si el caso es viable habría que revisar primero " +
        "el proceso, los datos, las herramientas y las restricciones concretas. " +
        "Podemos hacer un diagnóstico breve antes de darlo por viable."
      );


    case COMMERCIAL_CLAIM.RESULT:
      return (
        "No sería fiable prometer un resultado concreto sin revisar el caso " +
        "y definir antes qué objetivo se quiere conseguir y cómo se mediría. " +
        "Podemos analizarlo mediante un diagnóstico breve."
      );


    case COMMERCIAL_CLAIM.ROI:
      return (
        "No puedo prometer un ahorro o retorno concreto sin analizar " +
        "el punto de partida, el alcance y cómo se mediría el resultado. " +
        "Podemos revisar esos datos en un diagnóstico breve."
      );


    default:
      return "";
  }
}


/* ============================================================
 * SAFE ACTION
 * ============================================================
 */

function buildCommercialAction(
  assessment,
  claim,
) {
  if (!assessment) {
    return null;
  }


  if (
    assessment.action ===
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT
  ) {
    const target =
      getKnowledgeById(
        COMMERCIAL_RESPONSE_TARGET
          .CONTACT,
      );


    if (
      !target ||
      target.type !==
        KNOWLEDGE_TYPE.CONTACT
    ) {
      return null;
    }


    return {
      id:
        `action-commercial-contact-${claim}`,

      type:
        RESPONSE_ACTION_TYPE
          .OPEN_CONTACT,

      label:
        "Contactar con Víctor",

      target:
        COMMERCIAL_RESPONSE_TARGET
          .CONTACT,

      priority:
        RESPONSE_ACTION_PRIORITY
          .PRIMARY,
    };
  }


  if (
    assessment.action ===
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC
  ) {
    const target =
      getKnowledgeById(
        COMMERCIAL_RESPONSE_TARGET
          .DIAGNOSTIC,
      );


    if (
      !target ||
      target.type !==
        KNOWLEDGE_TYPE.DIAGNOSTIC
    ) {
      return null;
    }


    return {
      id:
        `action-commercial-diagnostic-${claim}`,

      type:
        RESPONSE_ACTION_TYPE
          .START_DIAGNOSTIC,

      label:
        "Analizar mi caso",

      target:
        COMMERCIAL_RESPONSE_TARGET
          .DIAGNOSTIC,

      priority:
        RESPONSE_ACTION_PRIORITY
          .PRIMARY,
    };
  }


  return null;
}


/* ============================================================
 * FORBIDDEN CLAIMS
 * ============================================================
 */

function commercialForbiddenClaims(
  assessment,
) {
  const claims = [
    assessment?.reason,
  ];


  for (
    const serviceId
    of assessment?.serviceIds ??
      []
  ) {
    const service =
      getKnowledgeById(
        serviceId,
      );


    claims.push(
      ...(
        service?.answerPolicy
          ?.forbiddenClaims ??
        []
      ),
    );
  }


  return unique(
    claims,
  );
}


/* ============================================================
 * RESPONSE METADATA
 * ============================================================
 */

function responseKindForDecision(
  decision,
) {
  if (
    decision ===
      COMMERCIAL_DECISION
        .REDIRECT
  ) {
    return (
      RESPONSE_KIND
        .COMMERCIAL_REDIRECT
    );
  }


  if (
    decision ===
      COMMERCIAL_DECISION
        .QUALIFY
  ) {
    return (
      RESPONSE_KIND
        .DISCOVERY
    );
  }


  return null;
}


function responseOutcomeForDecision(
  decision,
) {
  if (
    decision ===
      COMMERCIAL_DECISION
        .REDIRECT
  ) {
    return (
      RESPONSE_OUTCOME
        .REDIRECTED
    );
  }


  if (
    decision ===
      COMMERCIAL_DECISION
        .QUALIFY
  ) {
    return (
      RESPONSE_OUTCOME
        .QUALIFIED
    );
  }


  return null;
}


function responsePurposeForDecision(
  decision,
) {
  return (
    decision ===
      COMMERCIAL_DECISION
        .QUALIFY
      ? RESPONSE_MESSAGE_PURPOSE
          .QUALIFICATION
      : RESPONSE_MESSAGE_PURPOSE
          .ANSWER
  );
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeCommercialResponse(
  {
    userText,
    claim = null,
    serviceId = null,
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


  const resolvedClaim =
    resolveCommercialClaim({
      userText:
        text,

      claim,
    });


  if (!resolvedClaim) {
    return null;
  }


  const assessment =
    resolveCommercialAssessment({
      serviceId,

      claim:
        resolvedClaim,
    });


  if (
    !assessment ||
    assessment.allowed === true
  ) {
    return null;
  }


  const kind =
    responseKindForDecision(
      assessment.decision,
    );


  const outcome =
    responseOutcomeForDecision(
      assessment.decision,
    );


  if (
    !kind ||
    !outcome
  ) {
    /*
     * COMMERCIAL_DECISION.BLOCK no se utiliza actualmente
     * en los ocho claims V1.
     *
     * Fail closed en lugar de inventar comportamiento.
     */
    return null;
  }


  const action =
    buildCommercialAction(
      assessment,
      resolvedClaim,
    );


  if (!action) {
    return null;
  }


  const answerText =
    composeCommercialNaturalText({
      claim:
        resolvedClaim,

      assessment,
    });


  if (!answerText) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  const isRedirect =
    assessment.decision ===
      COMMERCIAL_DECISION
        .REDIRECT;


  return createResponseEnvelope({
    id:
      `response-commercial-${resolvedClaim}`,

    kind,

    outcome,

    intent,

    messages: [
      {
        id:
          `msg-commercial-${resolvedClaim}`,

        purpose:
          responsePurposeForDecision(
            assessment.decision,
          ),

        text:
          answerText,
      },
    ],

    actions: [
      action,
    ],

    presentation: {
      depth:
        isRedirect
          ? RESPONSE_DEPTH.SHORT
          : RESPONSE_DEPTH.MEDIUM,

      splitBubbles:
        false,

      variationFamily:
        `commercial-${resolvedClaim}`,

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
        true,

      commercialRedirect:
        isRedirect,

      allowInference:
        false,

      forbiddenClaims:
        commercialForbiddenClaims(
          assessment,
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
        `commercial-${resolvedClaim}`,
    },
  });
}