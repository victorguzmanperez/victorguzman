import { conversationStateFromMessages, interpretConversationTurn, updateConversationV2 } from './conversational-state-v2.js?v=conv-h3.22.2';
import { finalizeConversationResponse } from './conversation-quality-gate.js?v=conv-h3.22.2';
import { resolveConversationContinuation, deduplicateEvidence } from "./dialogue-continuation.js?v=final-qa.3";
import { planConversation } from './conversation-planner.js?v=conv-h3.22.2';
import { resolveTechnologyMentions } from "./technology-entities.js";
import { createAnswerQuickReply } from "./response-interactions.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
  analyzeMessage,
  toStateIntentResult,
} from "./nlu.js";

import {
  RESPONSE_CONTINUITY,
  RESPONSE_DEPTH,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_FOLLOW_UP_KIND,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  createResponseEnvelope,
} from "./response-contract.js";

import {
  SOCIAL_RESPONSE_INTENT,
  composeSocialResponse,
} from "./social-response-composer.js?v=conv-h3.25.1";

import {
  SOCIAL_CUE,
} from "./tone-analyzer.js";

import {
  CONVERSATION_CONTROL,
  SUPPORT_OFFER_MARKER,
  detectConversationControl,
  enhanceConversationalResponse,
} from "./conversation-lifecycle.js?v=conv-h3.25.1";

import {
  detectPrivacyIntent,
  composePrivacyResponse,
} from "./privacy-response-composer.js";

import {
  detectCommercialClaim,
  composeCommercialResponse,
} from "./commercial-response-composer.js";

import {
  detectOperationalIntent,
  composeOperationalResponse,
} from "./operational-response-composer.js";

import {
  detectKnowledgeOverviewTopic,
  composeKnowledgeOverviewResponse,
} from "./knowledge-overview-response-composer.js";

import {
  resolveProblemSolutionServiceFlow,
  composeProblemSolutionServiceResponse,
} from "./problem-solution-service-response-composer.js?v=final-qa.3";

import {
  detectNeedDiscoveryRequest,
  composeNeedDiscoveryResponse,
} from "./need-discovery-response-composer.js";

import {
  detectContextualBenefitRequest,
  composeContextualBenefitResponse,
} from "./contextual-benefit-response-composer.js";

import {
  composeKnowledgeListResponse,
  composeKnowledgeSummaryResponse,
} from "./knowledge-response-composer.js";

import {
  composeQualifiedResponse,
} from "./qualified-response-composer.js";

import {
  composeFallbackResponse,
} from "./fallback-response-composer.js";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
  getKnowledgeByType,
  normalizeKnowledgeAlias,
  resolveKnowledgeAlias,
} from "../data/knowledge.js";

import {
  MESSAGE_ROLE,
  MESSAGE_TYPE,
  SEMANTIC_RELATION,
  SEMANTIC_SUBJECT_TYPE,
  updateState,
  appendMessage,
  clearSemanticContext,
  getState,
  incrementFallback,
  markQuestionAsked,
  mergeEntities,
  resetConsecutiveFallbacks,
  setCurrentTopic,
  setIntentResult,
  setLastAction,
  setPendingConfirmation,
  setSemanticContext,
} from "./state.js";


/* ============================================================
 * DIALOGUE MANAGER
 * 1.11.23.1 → 1.11.23.9
 *
 * Responsabilidades cerradas en esta versión:
 *
 * .23.1 contrato de decisión;
 * .23.2 catálogo/rutas finales de intents;
 * .23.3 prioridades de routing;
 * .23.4 MEDIUM / needsConfirmation / ambiguity;
 * .23.5 dispatcher → Response Composers;
 * .23.6 aplicación central de stateEffects soportados;
 * .23.7 fallback orchestration;
 * .23.8 contexto básico entre turnos;
 * .23.9 contrato de orquestación multi-turn preparado para QA final.
 *
 * TODAVÍA NO:
 *
 * .23.10 integración mínima con chatbot.js;
 * 1.11.24 ejecución de actions.
 * ============================================================
 */


/* ============================================================
 * DECISION KINDS
 * ============================================================
 */

export const DIALOGUE_DECISION_KIND =
  Object.freeze({
    ROUTE:
      "route",

    CONFIRM:
      "confirm",

    FALLBACK:
      "fallback",

    NONE:
      "none",
  });


/* ============================================================
 * ROUTES
 * ============================================================
 */

export const DIALOGUE_ROUTE =
  Object.freeze({
    PRIVACY:
      "privacy",

    COMMERCIAL:
      "commercial",

    OPERATIONAL:
      "operational",

    KNOWLEDGE_OVERVIEW:
      "knowledge_overview",

    CONTEXTUAL_BENEFIT:
      "contextual_benefit",

    KNOWLEDGE_DIRECT:
      "knowledge_direct",

    PROBLEM_FLOW:
      "problem_flow",

    NEED_DISCOVERY:
      "need_discovery",

    SOCIAL:
      "social",

    CONFIRMATION:
      "confirmation",

    FALLBACK:
      "fallback",

    UNSUPPORTED:
      "unsupported",
  });


/* ============================================================
 * ROUTING PRIORITY
 * ============================================================
 */

export const DIALOGUE_ROUTE_PRIORITY =
  Object.freeze({
    PRIVACY:
      1000,

    COMMERCIAL:
      900,

    OPERATIONAL:
      800,

    KNOWLEDGE_OVERVIEW:
      700,

    CONTEXTUAL_BENEFIT:
      750,

    PROBLEM_FLOW:
      650,

    NEED_DISCOVERY:
      625,

    KNOWLEDGE_DIRECT:
      600,

    SOCIAL:
      500,

    CONFIRMATION:
      400,

    FALLBACK:
      100,

    UNSUPPORTED:
      0,
  });


/* ============================================================
 * CONFIRMATION
 * ============================================================
 */

export const DIALOGUE_CONFIRMATION_REASON =
  Object.freeze({
    MEDIUM_CONFIDENCE:
      "medium_confidence",

    AMBIGUOUS:
      "ambiguous",
  });


/* ============================================================
 * BASIC MULTI-TURN STATE MARKERS
 * ============================================================
 */

export const DIALOGUE_STATE_MARKER =
  Object.freeze({
    NAME_ASKED:
      "social-name-asked",

    FEEDBACK_OFFERED:
      "social-feedback-offered",
  });


export const DIALOGUE_CONTEXT_REPLY =
  Object.freeze({
    POSITIVE:
      "positive",

    NEGATIVE:
      "negative",
  });


/* ============================================================
 * SOCIAL NLU INTENTS
 * ============================================================
 */

const SOCIAL_INTENT_IDS =
  Object.freeze([
    INTENT_IDS.GREETING,
    INTENT_IDS.THANKS,
    INTENT_IDS.GOODBYE,
  ]);

  /*
 * Intents informativos seguros que pueden responderse
 * directamente cuando el intent está claro aunque el
 * confidence bucket sea MEDIUM.
 *
 * Una ambigüedad real SIEMPRE conserva la confirmación.
 *
 * No incluimos aquí intents técnicos como POWER_BI:
 * "¿Sabe DAX?" debe seguir requiriendo confirmación.
 */
const MEDIUM_CONFIRMATION_BYPASS_INTENTS =
  Object.freeze([
    INTENT_IDS.PORTFOLIO,
    INTENT_IDS.EXPERIENCE,
    INTENT_IDS.PROJECTS,
    INTENT_IDS.SERVICES,
  ]);

/* ============================================================
 * FINAL INTENT → ROUTE MAP
 * ============================================================
 */

export const DIALOGUE_INTENT_ROUTE =
  Object.freeze({
    [INTENT_IDS.GREETING]:
      DIALOGUE_ROUTE.SOCIAL,

    [INTENT_IDS.THANKS]:
      DIALOGUE_ROUTE.SOCIAL,

    [INTENT_IDS.GOODBYE]:
      DIALOGUE_ROUTE.SOCIAL,

    [INTENT_IDS.PORTFOLIO]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.EXPERIENCE]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.PROJECTS]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.SERVICES]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.EDUCATION]:
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,

    [INTENT_IDS.CAPABILITIES]:
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,

    [INTENT_IDS.TECHNOLOGIES]:
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,

    [INTENT_IDS.POWER_BI]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.POWER_PLATFORM]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.AI]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.PYTHON]:
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

    [INTENT_IDS.AUTOMATION]:
      DIALOGUE_ROUTE.PROBLEM_FLOW,

    [INTENT_IDS.EXCEL_PROBLEM]:
      DIALOGUE_ROUTE.PROBLEM_FLOW,

    [INTENT_IDS.REPORTING_PROBLEM]:
      DIALOGUE_ROUTE.PROBLEM_FLOW,

    [INTENT_IDS.DIAGNOSTIC]:
      DIALOGUE_ROUTE.OPERATIONAL,

    [INTENT_IDS.CONTACT]:
      DIALOGUE_ROUTE.OPERATIONAL,

    [INTENT_IDS.BOOKING]:
      DIALOGUE_ROUTE.OPERATIONAL,

    [INTENT_IDS.PRICING]:
      DIALOGUE_ROUTE.COMMERCIAL,

    [INTENT_IDS.TIMELINE]:
      DIALOGUE_ROUTE.COMMERCIAL,
  });


/* ============================================================
 * HUMAN LABELS
 * ============================================================
 */

export const DIALOGUE_INTENT_LABEL =
  Object.freeze({
    [INTENT_IDS.GREETING]:
      "un saludo",

    [INTENT_IDS.THANKS]:
      "un agradecimiento",

    [INTENT_IDS.GOODBYE]:
      "una despedida",

    [INTENT_IDS.PORTFOLIO]:
      "el perfil de Víctor",

    [INTENT_IDS.EXPERIENCE]:
      "la experiencia de Víctor",

    [INTENT_IDS.PROJECTS]:
      "los proyectos de Víctor",

    [INTENT_IDS.SERVICES]:
      "los servicios de Víctor",

    [INTENT_IDS.EDUCATION]:
      "la formación de Víctor",

    [INTENT_IDS.CAPABILITIES]:
      "las capacidades de Víctor",

    [INTENT_IDS.TECHNOLOGIES]:
      "las tecnologías de Víctor",

    [INTENT_IDS.POWER_BI]:
      "Power BI, DAX o Power Query",

    [INTENT_IDS.POWER_PLATFORM]:
      "Power Platform",

    [INTENT_IDS.AI]:
      "inteligencia artificial",

    [INTENT_IDS.PYTHON]:
      "Python",

    [INTENT_IDS.AUTOMATION]:
      "automatización de procesos",

    [INTENT_IDS.EXCEL_PROBLEM]:
      "un problema con Excel",

    [INTENT_IDS.REPORTING_PROBLEM]:
      "reporting o dashboards",

    [INTENT_IDS.DIAGNOSTIC]:
      "analizar tu caso",

    [INTENT_IDS.CONTACT]:
      "contactar con Víctor",

    [INTENT_IDS.BOOKING]:
      "reservar una reunión",

    [INTENT_IDS.PRICING]:
      "precio o presupuesto",

    [INTENT_IDS.TIMELINE]:
      "plazo del proyecto",
  });


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


function isSocialIntent(
  intentId,
) {
  return (
    SOCIAL_INTENT_IDS.includes(
      intentId,
    )
  );
}


function explicitNameProvided(
  userText,
  analysis,
) {
  const name =
    safeString(
      analysis
        ?.entities
        ?.contact
        ?.name,
    );


  if (!name) {
    return null;
  }


  if (
    !/\b(?:me\s+llamo|mi\s+nombre\s+es)\b/i
      .test(
        userText,
      )
  ) {
    return null;
  }


  return name;
}


function substantiveCandidates(
  analysis,
) {
  return (
    analysis?.candidates ??
    []
  ).filter(
    (candidate) =>
      !isSocialIntent(
        candidate.id,
      ),
  );
}


function effectiveIntent(
  analysis,
) {
  if (!analysis) {
    return null;
  }


  if (
    analysis.primaryIntent &&
    !isSocialIntent(
      analysis.primaryIntent,
    )
  ) {
    return (
      analysis.primaryIntent
    );
  }


  return (
    substantiveCandidates(
      analysis,
    )[0]?.id ??
    analysis.primaryIntent ??
    null
  );
}


function labelForIntent(
  intentId,
) {
  return (
    DIALOGUE_INTENT_LABEL[
      intentId
    ] ??
    "esa opción"
  );
}


function contextForComposer(
  context,
) {
  return {
    ...(context ?? {}),

    continuing:
      context?.continuing === true,

    suppressRepeatedCTA:
      context
        ?.suppressRepeatedCTA !==
      false,
  };
}


function inferGreetingType(
  userText,
) {
  const text =
    safeString(
      userText,
    ).toLowerCase();


  if (
    /\bbuenos\s+d[ií]as\b/i
      .test(
        text,
      )
  ) {
    return "morning";
  }


  if (
    /\bbuenas\s+tardes\b/i
      .test(
        text,
      )
  ) {
    return "afternoon";
  }


  if (
    /\bbuenas\s+noches\b/i
      .test(
        text,
      )
  ) {
    return "evening";
  }


  return "generic";
}


function socialComposerIntent(
  intent,
) {
  switch (
    intent
  ) {
    case INTENT_IDS.GREETING:
      return (
        SOCIAL_RESPONSE_INTENT
          .GREETING
      );


    case INTENT_IDS.THANKS:
      return (
        SOCIAL_RESPONSE_INTENT
          .THANKS
      );


    case INTENT_IDS.GOODBYE:
      return (
        SOCIAL_RESPONSE_INTENT
          .GOODBYE
      );


    case SOCIAL_RESPONSE_INTENT
      .NAME_PROVIDED:
      return (
        SOCIAL_RESPONSE_INTENT
          .NAME_PROVIDED
      );


    case SOCIAL_RESPONSE_INTENT
      .CHECK_IN:
      return (
        SOCIAL_RESPONSE_INTENT
          .CHECK_IN
      );


    case SOCIAL_RESPONSE_INTENT
      .USER_STATE:
      return (
        SOCIAL_RESPONSE_INTENT
          .USER_STATE
      );


    case SOCIAL_RESPONSE_INTENT
      .CONTINUE:
      return (
        SOCIAL_RESPONSE_INTENT
          .CONTINUE
      );


    case SOCIAL_RESPONSE_INTENT
      .FEEDBACK_RATING:
      return (
        SOCIAL_RESPONSE_INTENT
          .FEEDBACK_RATING
      );


    default:
      return null;
  }
}


function socialToneIntentFromAnalysis(
  analysis,
) {
  const socialCue =
    analysis?.tone
      ?.socialCue ??
    null;

  switch (socialCue) {
    case SOCIAL_CUE
      .ASSISTANT_CHECK_IN:
      return (
        SOCIAL_RESPONSE_INTENT
          .CHECK_IN
      );

    case SOCIAL_CUE
      .USER_STATE:
      return (
        SOCIAL_RESPONSE_INTENT
          .USER_STATE
      );

    default:
      return null;
  }
}


function itemsOfType(
  type,
) {
  return (
    getKnowledgeByType(
      type,
    ) ??
    []
  );
}


function idsOfType(
  type,
) {
  return (
    itemsOfType(
      type,
    )
      .map(
        (item) =>
          item.id,
      )
  );
}


function explicitKnowledgeMention(
  userText,
  types,
) {
  const normalizedText =
    normalizeKnowledgeAlias(
      userText,
    );


  if (!normalizedText) {
    return null;
  }


  let best = null;


  for (
    const type
    of types
  ) {
    for (
      const item
      of itemsOfType(
        type,
      )
    ) {
      const candidates = [
        item.title,
        ...(
          item.aliases ??
          []
        ),
      ];


      for (
        const candidate
        of candidates
      ) {
        const normalizedCandidate =
          normalizeKnowledgeAlias(
            candidate,
          );


        if (
          !normalizedCandidate ||
          normalizedCandidate.length <
            3 ||
          !normalizedText.includes(
            normalizedCandidate,
          )
        ) {
          continue;
        }


        if (
          !best ||
          normalizedCandidate.length >
            best.matchLength
        ) {
          best = {
            item,

            matchLength:
              normalizedCandidate
                .length,
          };
        }
      }
    }
  }


  return (
    best?.item ??
    null
  );
}


function technologyFromAnalysis(
  userText,
  analysis,
) {
  const mentions = resolveTechnologyMentions(userText);
  return mentions.length === 1 ? mentions[0] : null;
}

function normalizeSemanticText(
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
      /[¿?¡!.,;:]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


function detectSemanticRelation(
  userText,
) {
  const text =
    normalizeSemanticText(
      userText,
    );

  if (!text) {
    return null;
  }

  if (
    /\b(?:formacion|formado|formada|estudiado|estudiada|curso|aprendido|aprendizaje)\b/
      .test(text)
  ) {
    return (
      SEMANTIC_RELATION
        .TRAINING_IN
    );
  }

  if (
    /\b(?:trabaja|usa|utiliza|emplea|maneja)\b/
      .test(text)
  ) {
    return (
      SEMANTIC_RELATION
        .WORKS_WITH
    );
  }

  if (
    /\b(?:experiencia|ha trabajado|trabajado|sabe|conoce|domina)\b/
      .test(text)
  ) {
    return (
      SEMANTIC_RELATION
        .EXPERIENCE_WITH
    );
  }

  return null;
}


function isTemporalSemanticFollowUp(
  userText,
) {
  const text =
    normalizeSemanticText(
      userText,
    );

  return (
    /^(?:y\s+)?(?:actualmente|ahora|hoy|en la actualidad|a dia de hoy)(?:\s+.*)?$/
      .test(text)
  );
}


function isSubjectSemanticFollowUp(
  userText,
) {
  const text =
    normalizeSemanticText(
      userText,
    );

  return (
    /^(?:y\s+)?con\s+\S+/
      .test(text) ||
    /^y\s+\S+/
      .test(text)
  );
}


function semanticQueryFor(
  {
    relation,
    technology,
    temporal = false,
  },
) {
  if (!technology?.title) {
    return null;
  }

  if (temporal) {
    if (
      relation ===
        SEMANTIC_RELATION
          .TRAINING_IN
    ) {
      return (
        `¿Tiene formación actualmente en ${technology.title}?`
      );
    }

    if (
      relation ===
        SEMANTIC_RELATION
          .EXPERIENCE_WITH
    ) {
      return (
        `¿Tiene experiencia actualmente con ${technology.title}?`
      );
    }

    return (
      `¿Trabaja actualmente con ${technology.title}?`
    );
  }

  switch (relation) {
    case SEMANTIC_RELATION
      .TRAINING_IN:
      return (
        `¿Tiene formación en ${technology.title}?`
      );

    case SEMANTIC_RELATION
      .WORKS_WITH:
      return (
        `¿Trabaja actualmente con ${technology.title}?`
      );

    case SEMANTIC_RELATION
      .EXPERIENCE_WITH:

    default:
      return (
        `¿Tiene experiencia con ${technology.title}?`
      );
  }
}


function resolveSemanticTechnologyFollowUp(
  userText,
  context,
) {
  const semanticContext =
    context?.semanticContext ??
    null;

  if (
    !semanticContext ||
    semanticContext.subjectType !==
      SEMANTIC_SUBJECT_TYPE
        .TECHNOLOGY ||
    !semanticContext.subjectId ||
    !semanticContext.relation
  ) {
    return null;
  }

  const explicitRelation =
    detectSemanticRelation(
      userText,
    );

  const mentions =
    resolveTechnologyMentions(
      userText,
    );

  /*
   * Ejemplo:
   *
   * ¿Tiene experiencia con AWS?
   * ¿Y con Qlik Sense?
   *
   * Qlik cambia.
   * experience_with se hereda.
   */
  if (
    mentions.length === 1 &&
    !explicitRelation &&
    isSubjectSemanticFollowUp(
      userText,
    )
  ) {
    const technology =
      mentions[0];

    return {
      relation:
        semanticContext.relation,

      technology,

      temporal:
        false,

      effectiveText:
        semanticQueryFor({
          relation:
            semanticContext.relation,

          technology,
        }),
    };
  }

  /*
   * Ejemplo:
   *
   * ¿Ha trabajado con COBOL?
   * ¿Y actualmente?
   *
   * technology-cobol y la relación anterior
   * se reutilizan sin almacenar texto libre.
   */
  if (
    mentions.length === 0 &&
    !explicitRelation &&
    isTemporalSemanticFollowUp(
      userText,
    )
  ) {
    const technology =
      getKnowledgeById(
        semanticContext.subjectId,
      );

    if (
      technology?.type !==
        KNOWLEDGE_TYPE
          .TECHNOLOGY
    ) {
      return null;
    }

    return {
      relation:
        semanticContext.relation,

      technology,

      temporal:
        true,

      effectiveText:
        semanticQueryFor({
          relation:
            semanticContext.relation,

          technology,

          temporal:
            true,
        }),
    };
  }

  return null;
}


function semanticContextCandidate(
  {
    userText,
    effectiveText,
    decision,
    followUp,
  },
) {
  if (
    !decision ||
    decision.route !==
      DIALOGUE_ROUTE
        .KNOWLEDGE_DIRECT
  ) {
    return null;
  }

  const technology =
    followUp?.technology ??
    technologyFromAnalysis(
      effectiveText,
      decision.analysis,
    ) ??
    (() => {
      const knowledgeId =
        safeString(
          decision.metadata
            ?.knowledgeId,
        );

      const item =
        knowledgeId
          ? getKnowledgeById(
              knowledgeId,
            )
          : null;

      return (
        item?.type ===
          KNOWLEDGE_TYPE
            .TECHNOLOGY
          ? item
          : null
      );
    })();

  if (!technology) {
    return null;
  }

  const relation =
    followUp?.relation ??
    detectSemanticRelation(
      userText,
    ) ??
    detectSemanticRelation(
      effectiveText,
    );

  if (!relation) {
    return null;
  }

  return {
    relation,

    subjectType:
      SEMANTIC_SUBJECT_TYPE
        .TECHNOLOGY,

    subjectId:
      technology.id,
  };
}


function applySemanticContextAfterTurn(
  {
    userText,
    effectiveText,
    decision,
    followUp,
  },
) {
  const candidate =
    semanticContextCandidate({
      userText,
      effectiveText,
      decision,
      followUp,
    });

  if (candidate) {
    setSemanticContext(
      candidate,
    );

    return;
  }

  /*
   * Un saludo o una confirmación no destruyen
   * por sí solos el contexto anterior.
   */
  if (
    decision?.route ===
      DIALOGUE_ROUTE
        .SOCIAL ||
    decision?.route ===
      DIALOGUE_ROUTE
        .CONFIRMATION ||
    decision?.route ===
      DIALOGUE_ROUTE
        .CONTEXTUAL_BENEFIT
  ) {
    return;
  }

  /*
   * Si el visitante intenta continuar con una
   * tecnología desconocida, no dejamos contexto
   * antiguo que pudiera contaminar el siguiente turno.
   */
  if (
    decision?.route ===
      DIALOGUE_ROUTE
        .FALLBACK
  ) {
    if (
      isSubjectSemanticFollowUp(
        userText,
      )
    ) {
      clearSemanticContext();
    }

    return;
  }

  /*
   * Cambio sustantivo de tema:
   * proyectos, contacto, diagnóstico, etc.
   */
  clearSemanticContext();
}

function shouldUseQualifiedResponse(
  userText,
  item,
) {
  if (!item) {
    return false;
  }


  if (
    item.type ===
      KNOWLEDGE_TYPE
        .CERTIFICATION
  ) {
    return true;
  }


  const text =
    safeString(
      userText,
    );


  return (
    /\b(?:experiencia|trabaja|trabajando|trabajado|usa|usando|utiliza|utilizando|actualmente|sabe|conoce|domina|certificaci[oó]n|certificado|terminado|finalizado|acabado|liderar|migraci[oó]n|podr[ií]a|encajar)\b/i
      .test(
        text,
      )
  );
}

function shouldRequestDialogueConfirmation(
  analysis,
  intentId,
) {
  if (
    !analysis?.needsConfirmation ||
    analysis.fallbackLevel !==
      FALLBACK_LEVEL.NONE
  ) {
    return false;
  }


  /*
   * Una ambigüedad real siempre se confirma,
   * incluso si el intent pertenece al grupo
   * informativo seguro.
   */
  if (
    analysis
      .ambiguity
      ?.ambiguous === true
  ) {
    return true;
  }


  /*
   * Portfolio / experiencia / proyectos / servicios
   * son respuestas informativas y reversibles.
   *
   * Si el intent está claro no obligamos al visitante
   * a confirmar una pregunta natural.
   */
  if (
    MEDIUM_CONFIRMATION_BYPASS_INTENTS
      .includes(
        intentId,
      )
  ) {
    return false;
  }


  return true;
}

/* ============================================================
 * .23.8 — BASIC MULTI-TURN CONTEXT
 * ============================================================
 */

function findLastUserMessage(
  messages,
) {
  if (!Array.isArray(messages)) {
    return null;
  }

  for (
    let index =
      messages.length - 1;
    index >= 0;
    index -= 1
  ) {
    const message =
      messages[index];

    if (
      message?.role ===
        MESSAGE_ROLE.USER &&
      typeof message.text ===
        "string" &&
      message.text.trim()
    ) {
      return message;
    }
  }

  return null;
}


function hasMeaningfulAssistantResponse(
  messages,
) {
  if (!Array.isArray(messages)) {
    return false;
  }

  return messages.some(
    (message) => {
      if (
        message?.role !==
          MESSAGE_ROLE.ASSISTANT
      ) {
        return false;
      }

      const responseId =
        safeString(
          message.responseId,
        );

      if (!responseId) {
        return false;
      }

      return (
        !responseId.startsWith(
          "response-social-",
        ) &&
        !responseId.startsWith(
          "response-dialogue-confirm-",
        ) &&
        !responseId.startsWith(
          "response-dialogue-reject-",
        )
      );
    },
  );
}


export function buildDialogueContext(
  {
    state =
      getState(),

    overrides = {},
  } = {},
) {
  const conversation =
    state?.conversation ??
    {};

  const understanding =
    state?.understanding ??
    {};

  const entities =
    state?.entities ??
    {};

  const messages =
    Array.isArray(
      conversation.messages,
    )
      ? conversation.messages
      : [];

  const askedQuestionIds =
    Array.isArray(
      conversation
        .askedQuestionIds,
    )
      ? conversation
          .askedQuestionIds
      : [];

  const lastUserMessage =
    findLastUserMessage(
      messages,
    );

  const assistantIntroduced =
    messages.some(
      (message) =>
        message?.role ===
          MESSAGE_ROLE.ASSISTANT,
    );

  return {
    previousIntent:
      understanding
        .primaryIntent ??
      understanding
        .currentTopic ??
      null,

    currentTopic:
      understanding
        .currentTopic ??
      null,

    semanticContext:
      understanding
        .semanticContext ??
      null,

    consecutiveFallbacks:
      Number.isInteger(
        conversation
          .consecutiveFallbacks,
      )
        ? conversation
            .consecutiveFallbacks
        : 0,

    pendingConfirmation:
      understanding
        .pendingConfirmation ??
      null,

    visitorName:
      safeString(
        entities
          ?.contact
          ?.name,
      ) ||
      null,

    nameAlreadyAsked:
      askedQuestionIds.includes(
        DIALOGUE_STATE_MARKER
          .NAME_ASKED,
      ),

    feedbackAlreadyOffered:
      askedQuestionIds.includes(
        DIALOGUE_STATE_MARKER
          .FEEDBACK_OFFERED,
      ),

    supportAlreadyOffered:
      askedQuestionIds.includes(
        SUPPORT_OFFER_MARKER,
      ),

    conversationalState: understanding?.conversationalState ?? null,
    recentMessages: messages,
    assistantIntroduced,

    meaningfulConversation:
      hasMeaningfulAssistantResponse(
        messages,
      ),

    turnIndex:
      Number.isInteger(
        conversation.turnCount,
      )
        ? conversation.turnCount
        : 0,

    continuing:
      Boolean(
        conversation.started &&
        assistantIntroduced,
      ),

    suppressRepeatedCTA:
      true,

    lastUserText:
      safeString(
        lastUserMessage
          ?.text,
      ) ||
      null,

    ...(
      overrides ??
      {}
    ),
  };
}


function resolveShortContextReply(
  userText,
) {
  const normalized =
    safeString(
      userText,
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[¿?¡!.,;:]+/g,
        "",
      )
      .trim();

  if (
    /^(?:si|vale|de acuerdo|correcto|exacto)$/
      .test(
        normalized,
      )
  ) {
    return (
      DIALOGUE_CONTEXT_REPLY
        .POSITIVE
    );
  }

  if (
    /^(?:no|nope|negativo|para nada)$/
      .test(
        normalized,
      )
  ) {
    return (
      DIALOGUE_CONTEXT_REPLY
        .NEGATIVE
    );
  }

  return null;
}


function pendingCandidates(
  pendingConfirmation,
) {
  if (
    !pendingConfirmation ||
    typeof pendingConfirmation !==
      "object"
  ) {
    return [];
  }

  const candidates =
    pendingConfirmation
      .candidates;

  return (
    Array.isArray(candidates)
      ? candidates.filter(
          (candidate) =>
            typeof candidate ===
              "string" &&
            candidate.trim(),
        )
      : []
  );
}


function priorityForRoute(
  route,
) {
  const priorityKey =
    Object.keys(
      DIALOGUE_ROUTE,
    )
      .find(
        (key) =>
          DIALOGUE_ROUTE[key] ===
            route,
      );

  return (
    DIALOGUE_ROUTE_PRIORITY[
      priorityKey
    ] ??
    0
  );
}


function buildConfirmedDecision(
  {
    intent,
    sourceText,
    context,
  },
) {
  const route =
    DIALOGUE_INTENT_ROUTE[
      intent
    ] ??
    null;

  if (!route) {
    return null;
  }

  const sourceAnalysis =
    analyzeMessage(
      sourceText,
      {
        ...context,

        previousIntent:
          null,

        consecutiveFallbacks:
          0,
      },
    );

  return freezeDecision({
    kind:
      DIALOGUE_DECISION_KIND
        .ROUTE,

    route,

    priority:
      priorityForRoute(
        route,
      ),

    intent,

    reason:
      "pending_confirmation_accepted",

    analysis:
      sourceAnalysis,

    metadata: {
      confirmed:
        true,
    },
  });
}


function composeRejectedConfirmationResponse(
  pendingConfirmation,
) {
  const promptId =
    safeString(
      pendingConfirmation
        ?.promptId,
    ) ||
    "confirmation";

  const text =
    "De acuerdo. Cuéntamelo de otra forma o indícame exactamente qué quieres saber y lo reviso desde ahí.";

  return createResponseEnvelope({
    id:
      `response-dialogue-reject-${promptId}`,

    kind:
      RESPONSE_KIND
        .DISCOVERY,

    outcome:
      RESPONSE_OUTCOME
        .NEEDS_CLARIFICATION,

    intent:
      "clarification",

    messages: [
      {
        id:
          `msg-dialogue-reject-${promptId}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .EXPLANATION,

        text,
      },
    ],

    followUp: {
      kind:
        RESPONSE_FOLLOW_UP_KIND
          .CLARIFICATION,

      text,

      required:
        true,

      key:
        "rephrase",
    },

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        "dialogue-confirmation-rejected",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE
          .NONE,

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

      forbiddenClaims: [],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .REPAIR,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    analytics: {
      eventName:
        "chat_dialogue_confirmation_rejected",

      intent:
        "clarification",

      outcome:
        RESPONSE_OUTCOME
          .NEEDS_CLARIFICATION,

      responseKind:
        RESPONSE_KIND
          .DISCOVERY,
    },

    trace: {
      responseTemplateId:
        "dialogue-confirmation-rejected",
    },
  });
}


function commitAnalysisToState(
  analysis,
) {
  if (
    !analysis ||
    typeof analysis !==
      "object"
  ) {
    return;
  }

  setIntentResult(
    toStateIntentResult(
      analysis,
    ),
  );

  if (
    analysis.entities &&
    typeof analysis.entities ===
      "object"
  ) {
    mergeEntities(
      analysis.entities,
    );
  }
}


function topicForDecision(
  decision,
) {
  if (!decision) {
    return null;
  }

  if (
    decision.route ===
      DIALOGUE_ROUTE.FALLBACK ||
    decision.route ===
      DIALOGUE_ROUTE.SOCIAL
  ) {
    return null;
  }

  if (
    typeof decision.intent ===
      "string" &&
    decision.intent.trim()
  ) {
    return decision.intent;
  }

  return (
    safeString(
      decision.metadata
        ?.overviewTopic,
    ) ||
    null
  );
}


function appendAssistantResponseToState(
  response,
) {
  if (!response) {
    return;
  }

  const visibleTexts =
    new Set();

  for (
    const message
    of response.messages ??
      []
  ) {
    const text =
      safeString(
        message?.text,
      );

    if (!text) {
      continue;
    }

    visibleTexts.add(
      text,
    );

    appendMessage({
      role:
        MESSAGE_ROLE
          .ASSISTANT,

      type:
        MESSAGE_TYPE.TEXT,

      text,

      responseId:
        response.id,
    });
  }

  const followUpText =
    safeString(
      response
        .followUp
        ?.text,
    );

  if (
    followUpText &&
    !visibleTexts.has(
      followUpText,
    )
  ) {
    appendMessage({
      role:
        MESSAGE_ROLE
          .ASSISTANT,

      type:
        MESSAGE_TYPE.TEXT,

      text:
        followUpText,

      responseId:
        response.id,
    });
  }
}


/* ============================================================
 * CONFIRMATION BUILDER
 * ============================================================
 */

export function buildDialogueConfirmation(
  analysis,
  intentId = null,
) {
  if (
    !analysis
      ?.needsConfirmation
  ) {
    return null;
  }


  const effective =
    intentId ??
    effectiveIntent(
      analysis,
    );


  const ambiguityCandidates =
    (
      analysis
        .ambiguity
        ?.ambiguous === true
        ? analysis
            .ambiguity
            ?.candidates ??
          []
        : []
    )
      .filter(
        (candidate) =>
          !isSocialIntent(
            candidate,
          ),
      );


  if (
    ambiguityCandidates.length >=
      2
  ) {
    const [
      first,
      second,
    ] =
      ambiguityCandidates;


    return Object.freeze({
      required:
        true,

      reason:
        DIALOGUE_CONFIRMATION_REASON
          .AMBIGUOUS,

      candidateIntents:
        Object.freeze([
          first,
          second,
        ]),

      text:
        `Para asegurarme de entenderte bien, ¿te refieres a ${labelForIntent(first)} o a ${labelForIntent(second)}?`,
    });
  }


  if (!effective) {
    return null;
  }


  return Object.freeze({
    required:
      true,

    reason:
      DIALOGUE_CONFIRMATION_REASON
        .MEDIUM_CONFIDENCE,

    candidateIntents:
      Object.freeze([
        effective,
      ]),

    text:
      `Creo que te refieres a ${labelForIntent(effective)}. ¿Es correcto?`,
  });
}


/* ============================================================
 * DECISION CONTRACT
 * ============================================================
 */

function freezeDecision(
  input,
) {
  return Object.freeze({
    kind:
      input.kind,

    route:
      input.route,

    priority:
      input.priority,

    intent:
      input.intent ??
      null,

    reason:
      input.reason ??
      null,

    analysis:
      input.analysis ??
      null,

    metadata:
      Object.freeze({
        ...(
          input.metadata ??
          {}
        ),
      }),

    confirmation:
      input.confirmation ??
      null,
  });
}


/* ============================================================
 * MAIN ROUTER
 * ============================================================
 */

export function resolveDialogueDecision(
  {
    userText,
    context = {},
    analysis = null,
  } = {},
) {
  const text =
    safeString(
      userText,
    );


  if (!text) {
    return null;
  }


  const nluAnalysis =
    analysis ??
    analyzeMessage(
      text,
      context,
    );


  /* ========================================================
   * 1. PRIVACY
   * ========================================================
   */

  const privacyIntent =
    detectPrivacyIntent(
      text,
    );


  if (privacyIntent) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .PRIVACY,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .PRIVACY,

      intent:
        privacyIntent,

      reason:
        "privacy_detector",

      analysis:
        nluAnalysis,
    });
  }


  /* ========================================================
   * 2. COMMERCIAL
   * ========================================================
   */

  const commercialClaim =
    detectCommercialClaim(
      text,
    );


  if (commercialClaim) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .COMMERCIAL,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .COMMERCIAL,

      intent:
        effectiveIntent(
          nluAnalysis,
        ),

      reason:
        "commercial_detector",

      analysis:
        nluAnalysis,

      metadata: {
        commercialClaim,
      },
    });
  }


  /* ========================================================
   * CONV-H3.24 — FEEDBACK CONTEXT HAS PRIORITY
   *
   * “Más o menos” es ambiguo durante una conversación normal,
   * pero deja de serlo cuando la pregunta de feedback ya está
   * abierta. Lo resolvemos antes del planner para que no vuelva
   * accidentalmente al discovery de problemas.
   * ========================================================
   */
  const feedbackControl =
    context.feedbackAlreadyOffered === true
      ? detectConversationControl(text)
      : null;

  const contextualFeedbackRating =
    feedbackControl === CONVERSATION_CONTROL.FEEDBACK_POSITIVE
      ? "positive"
      : feedbackControl === CONVERSATION_CONTROL.FEEDBACK_NEUTRAL
        ? "neutral"
        : feedbackControl === CONVERSATION_CONTROL.FEEDBACK_NEGATIVE
          ? "negative"
          : null;

  if (contextualFeedbackRating) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND.ROUTE,
      route:
        DIALOGUE_ROUTE.SOCIAL,
      priority:
        DIALOGUE_ROUTE_PRIORITY.SOCIAL,
      intent:
        SOCIAL_RESPONSE_INTENT.FEEDBACK_RATING,
      reason:
        "contextual_feedback_control",
      analysis:
        nluAnalysis,
      metadata: {
        conversationControl:
          feedbackControl,
        feedbackRating:
          contextualFeedbackRating,
      },
    });
  }

  /* ========================================================
   * CONV-H3.25 — EXPLICIT CLOSING HAS PRIORITY
   *
   * A visitor may close naturally while a discovery/diagnostic
   * question is still pending ("Ok, muchas gracias",
   * "Ya no necesito nada", etc.). These exact closing phrases
   * must end the active flow before the planner can interpret
   * them as another answer to the pending business question.
   * ========================================================
   */
  const earlyConversationControl =
    detectConversationControl(text);

  if (
    earlyConversationControl ===
      CONVERSATION_CONTROL.CLOSE
  ) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND.ROUTE,
      route:
        DIALOGUE_ROUTE.SOCIAL,
      priority:
        DIALOGUE_ROUTE_PRIORITY.SOCIAL,
      intent:
        SOCIAL_RESPONSE_INTENT.GOODBYE,
      reason:
        "explicit_closing_control",
      analysis:
        nluAnalysis,
      metadata: {
        conversationControl:
          earlyConversationControl,
        feedbackRating:
          null,
      },
    });
  }

  const planned = planConversation(text, context);
  if (planned) return freezeDecision({kind:DIALOGUE_DECISION_KIND.ROUTE,
    route:planned.route==='knowledge'?DIALOGUE_ROUTE.KNOWLEDGE_DIRECT:DIALOGUE_ROUTE.PROBLEM_FLOW,
    priority:DIALOGUE_ROUTE_PRIORITY.PROBLEM_FLOW,intent:effectiveIntent(nluAnalysis),
    reason:'conversation_planner',analysis:nluAnalysis,
    metadata:{preparedResponse:planned.response, conversationalState:planned.state ?? null, conversationPlan:planned.plan ?? null}});

  const continuation = resolveConversationContinuation(text, context);
  if (continuation) {
    return freezeDecision({ kind: DIALOGUE_DECISION_KIND.ROUTE,
      route: continuation.route, priority: DIALOGUE_ROUTE_PRIORITY.PROBLEM_FLOW,
      intent: continuation.intent ?? effectiveIntent(nluAnalysis), reason: "conversation_continuation",
      analysis: nluAnalysis, metadata: { preparedResponse: continuation.response, feedbackRating: continuation.feedbackRating ?? null, knowledgeId: continuation.response?.evidence?.knowledgeIds?.find(id => id.startsWith("technology-")) ?? null } });
  }

  /* ========================================================
   * 3. OPERATIONAL
   * ========================================================
   */

  const operationalIntent =
    detectOperationalIntent(
      text,
    );


  if (operationalIntent) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .OPERATIONAL,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .OPERATIONAL,

      intent:
        operationalIntent,

      reason:
        "operational_detector",

      analysis:
        nluAnalysis,
    });
  }


  /* ========================================================
   * NAT-H2 — CONTEXTUAL BENEFIT BRIDGE
   *
   * "¿Y esto cómo me ayuda?" no vuelve a preguntar por el nivel
   * de experiencia: traduce la tecnología anterior a utilidad.
   * Debe ganar a Entity-first cuando la intención de beneficio es clara.
   * ========================================================
   */

  const contextualBenefit =
    detectContextualBenefitRequest({
      userText:
        text,

      context,
    });

  if (contextualBenefit) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND.ROUTE,

      route:
        DIALOGUE_ROUTE.CONTEXTUAL_BENEFIT,

      priority:
        DIALOGUE_ROUTE_PRIORITY.CONTEXTUAL_BENEFIT,

      intent:
        effectiveIntent(nluAnalysis),

      reason:
        "contextual_benefit_bridge",

      analysis:
        nluAnalysis,

      metadata: {
        contextualBenefit,
      },
    });
  }


  /* ========================================================
   * 4. KNOWLEDGE OVERVIEW
   * ========================================================
   */

  // A panoramic request is explicit user intent and must remain broad even
  // when its wording mentions a canonical technology such as IA.
  // Entity-first still wins for specific technology qualification questions.
  const overviewTopic =
    detectKnowledgeOverviewTopic(
      text,
    );

  const technology =
    technologyFromAnalysis(
      text,
      nluAnalysis,
    );

  const certification =
    explicitKnowledgeMention(
      text,
      [KNOWLEDGE_TYPE.CERTIFICATION],
    );

  if (
    certification &&
    !overviewTopic
  ) {
    return freezeDecision({
      kind: DIALOGUE_DECISION_KIND.ROUTE,
      route: DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
      priority: DIALOGUE_ROUTE_PRIORITY.KNOWLEDGE_DIRECT,
      intent: effectiveIntent(nluAnalysis) ?? INTENT_IDS.EDUCATION,
      reason: "certification_entity_first",
      analysis: nluAnalysis,
      metadata: { knowledgeId: certification.id },
    });
  }

  if (
    technology &&
    !overviewTopic &&
    shouldUseQualifiedResponse(
      text,
      technology,
    )
  ) {
    const intent = effectiveIntent(nluAnalysis) ?? INTENT_IDS.TECHNOLOGIES;
    const confirmation = shouldRequestDialogueConfirmation(nluAnalysis, intent)
      ? buildDialogueConfirmation(nluAnalysis, intent) : null;
    return freezeDecision({
      kind: confirmation ? DIALOGUE_DECISION_KIND.CONFIRM : DIALOGUE_DECISION_KIND.ROUTE,
      route: confirmation ? DIALOGUE_ROUTE.CONFIRMATION : DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
      priority: confirmation ? DIALOGUE_ROUTE_PRIORITY.CONFIRMATION : DIALOGUE_ROUTE_PRIORITY.KNOWLEDGE_DIRECT,
      intent,
      reason: confirmation ? confirmation.reason : "technology_entity_first",
      analysis: nluAnalysis,
      metadata: { knowledgeId: technology.id },
      confirmation,
    });
  }

  if (overviewTopic) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .KNOWLEDGE_OVERVIEW,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .KNOWLEDGE_OVERVIEW,

      intent:
        effectiveIntent(
          nluAnalysis,
        ),

      reason:
        "knowledge_overview_detector",

      analysis:
        nluAnalysis,

      metadata: {
        overviewTopic,
      },
    });
  }


  /* ========================================================
   * 5. PROBLEM → SOLUTION → SERVICE
   * ========================================================
   */

  const problemFlow =
    resolveProblemSolutionServiceFlow({
      userText:
        text,
    });


  if (problemFlow) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .PROBLEM_FLOW,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .PROBLEM_FLOW,

      intent:
        effectiveIntent(
          nluAnalysis,
        ),

      reason:
        "problem_match",

      analysis:
        nluAnalysis,

      metadata: {
        problemId:
          problemFlow
            .problem
            ?.id ??
          problemFlow
            .problemId ??
          null,
      },
    });
  }


  /* ========================================================
   * CONV-H1 — CONVERSATION CONTROL
   * ========================================================
   */

  const conversationControl =
    detectConversationControl(
      text,
    );

  if (conversationControl) {
    const rating =
      conversationControl ===
        CONVERSATION_CONTROL.FEEDBACK_POSITIVE
        ? "positive"
        : conversationControl ===
            CONVERSATION_CONTROL.FEEDBACK_NEGATIVE
          ? "negative"
          : conversationControl ===
              CONVERSATION_CONTROL.FEEDBACK_NEUTRAL
            ? "neutral"
            : null;

    const intent =
      conversationControl ===
        CONVERSATION_CONTROL.CONTINUE
        ? SOCIAL_RESPONSE_INTENT.CONTINUE
        : rating
          ? SOCIAL_RESPONSE_INTENT.FEEDBACK_RATING
          : SOCIAL_RESPONSE_INTENT.GOODBYE;

    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND.ROUTE,
      route:
        DIALOGUE_ROUTE.SOCIAL,
      priority:
        DIALOGUE_ROUTE_PRIORITY.SOCIAL,
      intent,
      reason:
        "conversation_control",
      analysis:
        nluAnalysis,
      metadata: {
        conversationControl,
        feedbackRating:
          rating,
      },
    });
  }


  /* ========================================================
   * NAT-H1 — NEED DISCOVERY
   *
   * Si todavía no existe un problema concreto, una petición
   * amplia de ayuda debe orientar antes de listar servicios.
   * Problem Flow conserva prioridad cuando ya hay señales
   * suficientes para identificar una necesidad real.
   * ========================================================
   */

  const needDiscoveryKind =
    detectNeedDiscoveryRequest({
      userText:
        text,

      analysis:
        nluAnalysis,

      context,
    });


  if (needDiscoveryKind) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .NEED_DISCOVERY,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .NEED_DISCOVERY,

      intent:
        effectiveIntent(
          nluAnalysis,
        ),

      reason:
        "need_discovery_detector",

      analysis:
        nluAnalysis,

      metadata: {
        needDiscoveryKind,
      },
    });
  }


  /* ========================================================
   * 5B. SOCIAL TONE / SMALL TALK
   *
   * Solo entra aquí después de privacidad, comercial,
   * operacional, Knowledge y problem flow. El tono nunca
   * roba una intención sustantiva.
   * ========================================================
   */

  const effective =
    effectiveIntent(
      nluAnalysis,
    );


  const socialToneIntent =
    socialToneIntentFromAnalysis(
      nluAnalysis,
    );

  if (
    socialToneIntent &&
    (
      !effective ||
      isSocialIntent(
        effective,
      )
    )
  ) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .SOCIAL,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .SOCIAL,

      intent:
        socialToneIntent,

      reason:
        "social_tone_cue",

      analysis:
        nluAnalysis,
    });
  }


  /* ========================================================
  * 6. MEDIUM / AMBIGUITY
  *
  * REGLA CRÍTICA:
  *
  * - MEDIUM claro e informativo puede continuar
  *   cuando pertenece al bypass seguro.
  *
  * - MEDIUM técnico / sensible que necesita
  *   confirmación NO se convierte en fallback.
  *
  * - Una ambigüedad real siempre se confirma.
  * ========================================================
  */

  if (
    shouldRequestDialogueConfirmation(
      nluAnalysis,
      effective,
    )
  ) {
    const confirmation =
      buildDialogueConfirmation(
        nluAnalysis,
        effective,
      );


    if (confirmation) {
      return freezeDecision({
        kind:
          DIALOGUE_DECISION_KIND
            .CONFIRM,

        route:
          DIALOGUE_ROUTE
            .CONFIRMATION,

        priority:
          DIALOGUE_ROUTE_PRIORITY
            .CONFIRMATION,

        intent:
          effective,

        reason:
          confirmation.reason,

        analysis:
          nluAnalysis,

        confirmation,
      });
    }
  }


  /* ========================================================
   * 7. EXPLICIT NAME
   * ========================================================
   */

  const providedName =
    explicitNameProvided(
      text,
      nluAnalysis,
    );


  if (
    providedName &&
    !effective
  ) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .SOCIAL,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .SOCIAL,

      intent:
        SOCIAL_RESPONSE_INTENT
          .NAME_PROVIDED,

      reason:
        "explicit_name",

      analysis:
        nluAnalysis,

      metadata: {
        providedName,
      },
    });
  }


  /* ========================================================
   * 8. CANONICAL INTENT ROUTING
   * ========================================================
   */

  if (effective) {
    const route =
      DIALOGUE_INTENT_ROUTE[
        effective
      ];


    if (route) {
      const priorityKey =
        Object.keys(
          DIALOGUE_ROUTE,
        )
          .find(
            (key) =>
              DIALOGUE_ROUTE[
                key
              ] === route,
          );


      return freezeDecision({
        kind:
          DIALOGUE_DECISION_KIND
            .ROUTE,

        route,

        priority:
          DIALOGUE_ROUTE_PRIORITY[
            priorityKey
          ] ??
          0,

        intent:
          effective,

        reason:
          "intent_route",

        analysis:
          nluAnalysis,
      });
    }
  }


  /* ========================================================
   * 9. PURE SOCIAL
   * ========================================================
   */

  if (
    isSocialIntent(
      nluAnalysis
        .primaryIntent,
    )
  ) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .ROUTE,

      route:
        DIALOGUE_ROUTE
          .SOCIAL,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .SOCIAL,

      intent:
        nluAnalysis
          .primaryIntent,

      reason:
        "social_intent",

      analysis:
        nluAnalysis,
    });
  }


  /* ========================================================
   * 10. FALLBACK
   * ========================================================
   */

  if (
    nluAnalysis
      .fallbackLevel !==
        FALLBACK_LEVEL.NONE
  ) {
    return freezeDecision({
      kind:
        DIALOGUE_DECISION_KIND
          .FALLBACK,

      route:
        DIALOGUE_ROUTE
          .FALLBACK,

      priority:
        DIALOGUE_ROUTE_PRIORITY
          .FALLBACK,

      intent:
        effective,

      reason:
        "nlu_fallback",

      analysis:
        nluAnalysis,

      metadata: {
        fallbackLevel:
          nluAnalysis
            .fallbackLevel,
      },
    });
  }


  /* ========================================================
   * 11. UNSUPPORTED
   * ========================================================
   */

  return freezeDecision({
    kind:
      DIALOGUE_DECISION_KIND
        .NONE,

    route:
      DIALOGUE_ROUTE
        .UNSUPPORTED,

    priority:
      DIALOGUE_ROUTE_PRIORITY
        .UNSUPPORTED,

    intent:
      effective,

    reason:
      "unsupported",

    analysis:
      nluAnalysis,
  });
}


/* ============================================================
 * .23.5 — DIRECT KNOWLEDGE DISPATCH
 * ============================================================
 */

function composeDirectKnowledgeForDecision(
  {
    userText,
    decision,
    context,
  },
) {
  const intent =
    decision.intent;


  const technology = technologyFromAnalysis(userText, decision.analysis);
  if (technology && shouldUseQualifiedResponse(userText, technology)) {
    return composeQualifiedResponse({ userText, knowledgeId: technology.id, intent, context });
  }

  /* ========================================================
   * PROFILE
   * ========================================================
   */

  if (
    intent ===
      INTENT_IDS.PORTFOLIO
  ) {
    const profile =
      itemsOfType(
        KNOWLEDGE_TYPE.PROFILE,
      )[0];


    return (
      profile
        ? composeKnowledgeSummaryResponse({
            knowledgeId:
              profile.id,

            intent,

            context,
          })
        : null
    );
  }


  /* ========================================================
   * EXPERIENCE
   * ========================================================
   */

  if (
    intent ===
      INTENT_IDS.EXPERIENCE
  ) {
    return composeKnowledgeListResponse({
      knowledgeIds:
        idsOfType(
          KNOWLEDGE_TYPE
            .EXPERIENCE,
        ),

      intent,

      intro:
        "La experiencia profesional documentada de Víctor incluye",

      context,
    });
  }


  /* ========================================================
   * PROJECTS
   * ========================================================
   */

  if (
    intent ===
      INTENT_IDS.PROJECTS
  ) {
    const explicitProject =
      explicitKnowledgeMention(
        userText,
        [
          KNOWLEDGE_TYPE
            .PROJECT,
        ],
      );


    if (explicitProject) {
      if (
        shouldUseQualifiedResponse(
          userText,
          explicitProject,
        )
      ) {
        const qualified =
          composeQualifiedResponse({
            userText,

            knowledgeId:
              explicitProject.id,

            intent,

            context,
          });


        if (qualified) {
          return qualified;
        }
      }


      return composeKnowledgeSummaryResponse({
        knowledgeId:
          explicitProject.id,

        intent,

        context,
      });
    }


    return composeKnowledgeListResponse({
      knowledgeIds:
        idsOfType(
          KNOWLEDGE_TYPE
            .PROJECT,
        ),

      intent,

      intro:
        "En el portfolio aparecen",

      context,
    });
  }


  /* ========================================================
   * SERVICES
   * ========================================================
   */

  if (
    intent ===
      INTENT_IDS.SERVICES
  ) {
    return composeKnowledgeListResponse({
      knowledgeIds:
        idsOfType(
          KNOWLEDGE_TYPE
            .SERVICE,
        ),

      intent,

      intro:
        "Los servicios publicados son",

      context,
    });
  }


  /* ========================================================
   * EXPLICIT TECHNOLOGY / CERTIFICATION / PROJECT
   * ========================================================
   */

  const explicitItem =
    technologyFromAnalysis(
      userText,
      decision.analysis,
    ) ??
    explicitKnowledgeMention(
      userText,
      [
        KNOWLEDGE_TYPE
          .CERTIFICATION,

        KNOWLEDGE_TYPE
          .PROJECT,
      ],
    );


  if (explicitItem) {
    if (
      shouldUseQualifiedResponse(
        userText,
        explicitItem,
      )
    ) {
      const qualified =
        composeQualifiedResponse({
          userText,

          knowledgeId:
            explicitItem.id,

          intent,

          context,
        });


      if (qualified) {
        return qualified;
      }
    }


    return composeKnowledgeSummaryResponse({
      knowledgeId:
        explicitItem.id,

      intent,

      context,
    });
  }


  /* ========================================================
   * GENERIC POWER PLATFORM
   * ========================================================
   */

  if (
    intent ===
      INTENT_IDS
        .POWER_PLATFORM
  ) {
    const ids = [
      "power automate",
      "power apps",
      "copilot",
    ]
      .map(
        (alias) =>
          resolveKnowledgeAlias(
            alias,
            KNOWLEDGE_TYPE
              .TECHNOLOGY,
          ),
      )
      .filter(Boolean)
      .map(
        (item) =>
          item.id,
      );


    if (
      ids.length >
      0
    ) {
      return composeKnowledgeListResponse({
        knowledgeIds:
          ids,

        intent,

        intro:
          "Dentro de Power Platform y herramientas relacionadas, constan",

        context,
      });
    }
  }


  return null;
}


/* ============================================================
 * .23.5 — CONFIRMATION RESPONSE
 * ============================================================
 */

function composeDialogueConfirmationResponse(
  decision,
) {
  const confirmation =
    decision
      ?.confirmation;


  if (
    !confirmation ||
    !safeString(
      confirmation.text,
    )
  ) {
    return null;
  }


  const candidates =
    confirmation
      .candidateIntents ??
    [];


  const options =
    candidates.length >=
      2
      ? candidates
          .slice(
            0,
            4,
          )
          .map(
            (intentId) => ({
              id:
                `confirm-${intentId}`,

              label:
                labelForIntent(
                  intentId,
                ),

              value:
                intentId,
            }),
          )
      : [
          {
            id:
              "confirm-yes",

            label:
              "Sí",

            value:
              candidates[0] ??
              decision.intent ??
              "yes",
          },

          {
            id:
              "confirm-no",

            label:
              "No",

            value:
              "clarify",
          },
        ];


  return createResponseEnvelope({
    id:
      `response-dialogue-confirm-${decision.intent ?? "intent"}`,

    kind:
      RESPONSE_KIND
        .DISCOVERY,

    outcome:
      RESPONSE_OUTCOME
        .NEEDS_CLARIFICATION,

    intent:
      decision.intent ??
      "unknown",

    messages: [
      {
        id:
          `msg-dialogue-confirm-${decision.intent ?? "intent"}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .EXPLANATION,

        text:
          confirmation.text,
      },
    ],

    quickReplies:
      candidates.length === 1
        ? [
            createAnswerQuickReply({
              id: "confirm-yes",
              label: "Sí",
              answer: "Sí",
            }),
            createAnswerQuickReply({
              id: "confirm-no",
              label: "No",
              answer: "No",
            }),
          ]
        : [],

    followUp: {
      kind:
        RESPONSE_FOLLOW_UP_KIND
          .CLARIFICATION,

      text:
        confirmation.text,

      required:
        true,

      key:
        `confirm-${decision.intent ?? "intent"}`,

      options,
    },

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        "dialogue-confirmation",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE
          .NONE,

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

      forbiddenClaims: [],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .REPAIR,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,

      markQuestionAsked:
        `confirm-${decision.intent ?? "intent"}`,
    },

    analytics: {
      eventName:
        "chat_dialogue_confirmation",

      intent:
        decision.intent ??
        null,

      outcome:
        RESPONSE_OUTCOME
          .NEEDS_CLARIFICATION,

      responseKind:
        RESPONSE_KIND
          .DISCOVERY,

      confidenceBucket:
        decision.analysis
          ?.confidenceBucket ??
        null,
    },

    trace: {
      responseTemplateId:
        "dialogue-confirmation",
    },
  });
}


/* ============================================================
 * .23.5 + .23.7 — RESPONSE DISPATCHER
 * ============================================================
 */

export function dispatchDialogueResponse(
  {
    userText,
    decision,
    context = {},
  } = {},
) {
  const text =
    safeString(
      userText,
    );


  if (
    !text ||
    !decision
  ) {
    return null;
  }


  if (decision.metadata?.preparedResponse) return decision.metadata.preparedResponse;

  const composerContext =
    contextForComposer(
      context,
    );


  switch (
    decision.route
  ) {
    /* ======================================================
     * PRIVACY
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .PRIVACY:
      return composePrivacyResponse({
        userText:
          text,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * COMMERCIAL
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .COMMERCIAL:
      return composeCommercialResponse({
        userText:
          text,

        claim:
          decision.metadata
            .commercialClaim ??
          null,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * OPERATIONAL
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .OPERATIONAL:
      return composeOperationalResponse({
        userText:
          text,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * KNOWLEDGE OVERVIEW
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .KNOWLEDGE_OVERVIEW:
      return composeKnowledgeOverviewResponse({
        userText:
          text,

        topic:
          decision.metadata
            .overviewTopic ??
          null,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * NAT-H2 — CONTEXTUAL BENEFIT
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .CONTEXTUAL_BENEFIT:
      return composeContextualBenefitResponse({
        userText:
          text,

        request:
          decision.metadata
            .contextualBenefit ??
          null,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * NAT-H1 — NEED DISCOVERY
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .NEED_DISCOVERY:
      return composeNeedDiscoveryResponse({
        userText:
          text,

        kind:
          decision.metadata
            .needDiscoveryKind ??
          null,

        analysis:
          decision.analysis,

        intent:
          decision.intent,

        context:
          composerContext,
      });


    /* ======================================================
     * PROBLEM FLOW
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .PROBLEM_FLOW:
      return (
        composeProblemSolutionServiceResponse({
          userText:
            text,

          analysis:
            decision.analysis,

          intent:
            decision.intent,

          context:
            composerContext,
        })
      );


    /* ======================================================
     * KNOWLEDGE DIRECT
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .KNOWLEDGE_DIRECT:
      return (
        composeDirectKnowledgeForDecision({
          userText:
            text,

          decision,

          context:
            composerContext,
        })
      );


    /* ======================================================
     * SOCIAL
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .SOCIAL: {
      const socialIntent =
        socialComposerIntent(
          decision.intent,
        );


      if (!socialIntent) {
        return null;
      }


      return composeSocialResponse({
        intent:
          socialIntent,

        greetingType:
          inferGreetingType(
            text,
          ),

        name:
          decision.metadata
            .providedName ??
          null,

        toneAnalysis:
          decision.analysis
            ?.tone ??
          null,

        feedbackRating:
          decision.metadata
            ?.feedbackRating ??
          null,

        context:
          composerContext,
      });
    }


    /* ======================================================
     * CONFIRMATION
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .CONFIRMATION:
      return (
        composeDialogueConfirmationResponse(
          decision,
        )
      );


    /* ======================================================
     * FALLBACK
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .FALLBACK:
      return composeFallbackResponse({
        userText:
          text,

        fallbackLevel:
          decision.metadata
            .fallbackLevel ??
          null,

        analysis:
          decision.analysis,

        intent:
          decision.intent,

        confidenceBucket:
          decision.analysis
            ?.confidenceBucket ??
          null,
      });


    /* ======================================================
     * UNSUPPORTED
     * ======================================================
     */

    case DIALOGUE_ROUTE
      .UNSUPPORTED:

    default:
      return null;
  }
}


/* ============================================================
 * .23.6 — CENTRAL STATE EFFECT APPLICATION
 *
 * El modelo actual de state.js soporta directamente:
 *
 * - resetFallbacks;
 * - incrementFallbacks;
 * - markQuestionAsked;
 * - setLastAction.
 *
 * markNameAsked y markFeedbackOffered se registran mediante
 * marcadores canónicos dentro de conversation.askedQuestionIds,
 * evitando ampliar innecesariamente el schema de state.js.
 * ============================================================
 */

export function applyDialogueStateEffects(
  response,
) {
  const effects =
    response
      ?.stateEffects;


  if (!effects) {
    return Object.freeze({
      applied:
        Object.freeze([]),

      deferred:
        Object.freeze([]),

      state:
        getState(),
    });
  }


  const applied = [];

  const deferred = [];


  if (
    effects.resetFallbacks ===
      true
  ) {
    resetConsecutiveFallbacks();

    applied.push(
      "resetFallbacks",
    );
  }


  if (
    effects.incrementFallbacks ===
      true
  ) {
    incrementFallback();

    applied.push(
      "incrementFallbacks",
    );
  }


  if (
    safeString(
      effects
        .markQuestionAsked,
    )
  ) {
    markQuestionAsked(
      effects
        .markQuestionAsked,
    );

    applied.push(
      "markQuestionAsked",
    );
  }


  if (
    safeString(
      effects
        .setLastAction,
    )
  ) {
    setLastAction(
      effects
        .setLastAction,
    );

    applied.push(
      "setLastAction",
    );
  }


  if (
    effects.markNameAsked ===
      true
  ) {
    markQuestionAsked(
      DIALOGUE_STATE_MARKER
        .NAME_ASKED,
    );

    applied.push(
      "markNameAsked",
    );
  }


  if (
    effects.markFeedbackOffered ===
      true
  ) {
    markQuestionAsked(
      DIALOGUE_STATE_MARKER
        .FEEDBACK_OFFERED,
    );

    applied.push(
      "markFeedbackOffered",
    );
  }


  return Object.freeze({
    applied:
      Object.freeze([
        ...applied,
      ]),

    deferred:
      Object.freeze([
        ...deferred,
      ]),

    state:
      getState(),
  });
}


/* ============================================================
 * CONFIRMATION STATE
 * ============================================================
 */

function applyConfirmationState(
  decision,
) {
  if (
    decision?.route !==
      DIALOGUE_ROUTE
        .CONFIRMATION ||
    !decision.confirmation
  ) {
    return;
  }


  setPendingConfirmation({
    type:
      "intent",

    reason:
      decision.confirmation
        .reason,

    candidates: [
      ...(
        decision.confirmation
          .candidateIntents ??
        []
      ),
    ],

    promptId:
      `confirm-${decision.intent ?? "intent"}`,
  });
}


/* ============================================================
 * TURN RESULT CONTRACT
 * ============================================================
 */

function freezeTurnResult(
  {
    decision,
    response,
    stateApplication,
  },
) {
  return Object.freeze({
    decision,

    response,

    stateApplication,
  });
}


/* ============================================================
 * .23.5 → .23.9
 * ONE-TURN + BASIC MULTI-TURN ORCHESTRATION
 *
 * API de alto nivel consumida por chatbot.js.
 *
 * Responsabilidades:
 * - construir contexto desde state;
 * - interpretar sí/no contra pendingConfirmation;
 * - ejecutar NLU y routing;
 * - despachar al Composer;
 * - aplicar stateEffects;
 * - persistir mensajes estructurados;
 * - mantener currentTopic y entidades.
 *
 * NO ejecuta actions. Eso pertenece a 1.11.24.
 * ============================================================
 */

export function processDialogueTurn(
  {
    userText,
    context = {},
    analysis = null,
    applyState = true,
  } = {},
) {
  const text =
    safeString(
      userText,
    );

  if (!text) {
    return null;
  }

  /*
   * Con applyState=false mantenemos el comportamiento puro
   * utilizado por los tests de routing/dispatch.
   *
   * Con applyState=true el state central pasa a ser la fuente
   * de contexto conversacional.
   */
  const dialogueContext =
    applyState
      ? buildDialogueContext({
          state:
            getState(),

          overrides:
            context,
        })
      : {
          ...(context ?? {}),
        };

  const pendingConfirmation =
    dialogueContext
      .pendingConfirmation ??
    null;

  const contextualReply =
    resolveShortContextReply(
      text,
    );

  /*
   * Guardamos el turno del visitante solamente cuando
   * trabajamos contra state real.
   */
  if (applyState) {
    const before = dialogueContext.conversationalState ?? conversationStateFromMessages(dialogueContext.recentMessages);
    const projection = updateConversationV2(before, interpretConversationTurn(text, before));
    updateState(draft => { draft.understanding.conversationalState = projection; }, { source: "conversation:v2" });
    appendMessage({
      role:
        MESSAGE_ROLE.USER,

      type:
        MESSAGE_TYPE.TEXT,

      text,
    });
  }

  /*
   * ========================================================
   * PENDING CONFIRMATION
   * ========================================================
   */

  if (
    pendingConfirmation &&
    contextualReply ===
      DIALOGUE_CONTEXT_REPLY
        .NEGATIVE
  ) {
    if (applyState) {
      setPendingConfirmation(
        null,
      );

      resetConsecutiveFallbacks();
    }

    const response = finalizeConversationResponse(composeRejectedConfirmationResponse(pendingConfirmation), text, dialogueContext);

    if (applyState) {
      appendAssistantResponseToState(
        response,
      );
    }

    return freezeTurnResult({
      decision:
        freezeDecision({
          kind:
            DIALOGUE_DECISION_KIND
              .CONFIRM,

          route:
            DIALOGUE_ROUTE
              .CONFIRMATION,

          priority:
            DIALOGUE_ROUTE_PRIORITY
              .CONFIRMATION,

          intent:
            null,

          reason:
            "pending_confirmation_rejected",

          analysis:
            null,

          metadata: {
            rejected:
              true,
          },

          confirmation:
            null,
        }),

      response,

      stateApplication:
        applyState
          ? Object.freeze({
              applied:
                Object.freeze([
                  "clearPendingConfirmation",
                  "resetFallbacks",
                ]),

              deferred:
                Object.freeze([]),

              state:
                getState(),
            })
          : null,
    });
  }


  if (
    pendingConfirmation &&
    contextualReply ===
      DIALOGUE_CONTEXT_REPLY
        .POSITIVE
  ) {
    const candidates =
      pendingCandidates(
        pendingConfirmation,
      );

    /*
     * Un "sí" solo puede resolver automáticamente una
     * confirmación con un único candidato.
     */
    if (
      candidates.length ===
        1 &&
      safeString(
        dialogueContext
          .lastUserText,
      )
    ) {
      const confirmedIntent =
        candidates[0];

      const sourceText =
        dialogueContext
          .lastUserText;

      const decision =
        buildConfirmedDecision({
          intent:
            confirmedIntent,

          sourceText,

          context:
            dialogueContext,
        });

      if (decision) {
        let response =
          dispatchDialogueResponse({
            userText:
              sourceText,

            decision,

            context:
              {
                ...dialogueContext,

                continuing:
                  true,
              },
          });

        response = finalizeConversationResponse(response, text, dialogueContext);
        if (response) {
          if (applyState) {
            setPendingConfirmation(
              null,
            );

            commitAnalysisToState(
              decision.analysis,
            );

            const topic =
              topicForDecision(
                decision,
              );

            if (topic) {
              setCurrentTopic(
                topic,
              );
            }


            applySemanticContextAfterTurn({
              userText:
                sourceText,

              effectiveText:
                sourceText,

              decision,

              followUp:
                null,
            });

            const stateApplication =
              applyDialogueStateEffects(
                response,
              );


            appendAssistantResponseToState(
              response,
            );

            return freezeTurnResult({
              decision,

              response,

              stateApplication,
            });
          }

          return freezeTurnResult({
            decision,

            response,

            stateApplication:
              null,
          });
        }
      }
    }

    /*
     * Confirmación ambigua con más de un candidato:
     * mantenemos la confirmación pendiente y pedimos elegir.
     */
    const repeatDecision =
      freezeDecision({
        kind:
          DIALOGUE_DECISION_KIND
            .CONFIRM,

        route:
          DIALOGUE_ROUTE
            .CONFIRMATION,

        priority:
          DIALOGUE_ROUTE_PRIORITY
            .CONFIRMATION,

        intent:
          candidates[0] ??
          null,

        reason:
          DIALOGUE_CONFIRMATION_REASON
            .AMBIGUOUS,

        analysis:
          null,

        confirmation: {
          required:
            true,

          reason:
            DIALOGUE_CONFIRMATION_REASON
              .AMBIGUOUS,

          candidateIntents:
            Object.freeze([
              ...candidates,
            ]),

          text:
            candidates.length >= 2
              ? `Necesito que elijas entre ${labelForIntent(candidates[0])} o ${labelForIntent(candidates[1])}.`
              : "Necesito un poco más de detalle para continuar.",
        },
      });

    let repeatResponse =
      dispatchDialogueResponse({
        userText:
          text,

        decision:
          repeatDecision,

        context:
          dialogueContext,
      });

    repeatResponse = finalizeConversationResponse(repeatResponse, text, dialogueContext);
    if (
      applyState &&
      repeatResponse
    ) {
      appendAssistantResponseToState(
        repeatResponse,
      );
    }

    return freezeTurnResult({
      decision:
        repeatDecision,

      response:
        repeatResponse,

      stateApplication:
        null,
    });
  }


  /*
   * Si había confirmación pendiente pero el usuario formula
   * una nueva pregunta sustantiva, abandonamos la pendiente.
   */
  if (
    pendingConfirmation &&
    contextualReply ===
      null &&
    applyState
  ) {
    setPendingConfirmation(
      null,
    );
  }


  const semanticFollowUp =
    String(dialogueContext.recentMessages?.filter(m => m.role === 'assistant').at(-1)?.responseId ?? '').startsWith('response-dataverso-') ? null : resolveSemanticTechnologyFollowUp(
      text,
      dialogueContext,
    );

  const effectiveText =
    semanticFollowUp
      ?.effectiveText ??
    text;

  const nluAnalysis =
    semanticFollowUp
      ? analyzeMessage(
          effectiveText,
          dialogueContext,
        )
      : analysis ??
        analyzeMessage(
          effectiveText,
          dialogueContext,
        );


  const decision =
    resolveDialogueDecision({
      userText:
        effectiveText,

      context:
        dialogueContext,

      analysis:
        nluAnalysis,
    });


  if (!decision) {
    return null;
  }


  let response =
    dispatchDialogueResponse({
      userText:
        effectiveText,

      decision,

      context:
        dialogueContext,
    });

  response = deduplicateEvidence(response, dialogueContext);

  response =
    enhanceConversationalResponse({
      response,
      userText:
        text,
      context:
        dialogueContext,
      decision,
    });


  /*
   * Fail closed.
   */
  if (!response && applyState) {
    response = createResponseEnvelope({ id: "response-repair-empty", kind: "fallback", outcome: "fallback",
      messages: [{id: "msg-repair-empty", text: "No he entendido del todo ese detalle. ¿Puedes contarme qué necesitas resolver o reformular la pregunta?"}],
      stateEffects: { incrementFallbacks: true }, analytics: {fallbackLevel: 1} });
  }
  if (!response) {
    if (applyState) {
      commitAnalysisToState(
        nluAnalysis,
      );
    }

    return freezeTurnResult({
      decision,

      response:
        null,

      stateApplication:
        null,
    });
  }


  response = finalizeConversationResponse(response, text, dialogueContext);

  /*
   * Tests puros: no mutamos state.
   */
  if (!applyState) {
    return freezeTurnResult({
      decision,

      response,

      stateApplication:
        null,
    });
  }


  /*
   * Persistimos el análisis estructurado sin duplicar
   * el texto libre dentro de understanding.lastAnalysis.
   */
  if (decision.metadata?.conversationalState) updateState(draft => { draft.understanding.conversationalState = decision.metadata.conversationalState; }, { source: "conversation:v2-plan" });
  commitAnalysisToState(
    nluAnalysis,
  );


  const nextTopic =
    topicForDecision(
      decision,
    );


  if (nextTopic) {
    setCurrentTopic(
      nextTopic,
    );
  }


  /*
   * La confirmación pendiente pertenece al Dialogue Manager.
   */
  if (
    decision.route ===
      DIALOGUE_ROUTE
        .CONFIRMATION
  ) {
    applyConfirmationState(
      decision,
    );
  }


  const stateApplication =
    applyDialogueStateEffects(
      response,
    );

  applySemanticContextAfterTurn({
    userText:
      text,

    effectiveText,

    decision,

    followUp:
      semanticFollowUp,
  });

  appendAssistantResponseToState(
    response,
  );


  return freezeTurnResult({
    decision,

    response,

    stateApplication,
  });
}
