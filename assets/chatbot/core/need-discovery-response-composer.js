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
  createAnswerQuickReply,
} from "./response-interactions.js";

import {
  CONVERSATION_TONE,
} from "./tone-analyzer.js";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";


/* ============================================================
 * NAT-H1 — NEED DISCOVERY / CONVERSATIONAL ORIENTATION
 *
 * Objetivo:
 * - responder a la necesidad real antes que al catálogo;
 * - no exigir que el visitante conozca la solución técnica;
 * - usar tono y contexto solo para adaptar la forma;
 * - mantener hechos y encaje comercial cualificados;
 * - ofrecer caminos de avance que vuelven por NLU.
 * ============================================================
 */


export const NEED_DISCOVERY_KIND =
  Object.freeze({
    GENERAL:
      "general",

    WHAT_VICTOR_DOES:
      "what_victor_does",

    CONTEXTUAL:
      "contextual",
  });


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
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:"“”()[\]{}<>/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function hasAny(text, patterns) {
  return patterns.some(
    (pattern) =>
      pattern.test(text),
  );
}


const CATALOG_ONLY_PATTERNS =
  Object.freeze([
    /^que servicios ofrece victor$/,
    /^que servicios ofrece$/,
    /^cuales son sus servicios$/,
    /^muestrame (?:los )?servicios$/,
    /^lista (?:de )?servicios$/,
  ]);


const NEED_DISCOVERY_PATTERNS =
  Object.freeze([
    /^(?:no se|no tengo claro) por donde empezar$/,
    /^(?:tengo|tenemos) (?:un )?problema(?: y no se por donde empezar)?$/,
    /^(?:necesito|necesitamos) ayuda(?: y no se por donde empezar)?$/,
    /\bno se (?:muy bien )?(?:si|como) victor (?:me|nos) puede ayudar\b/,
    /\bno se (?:muy bien )?que hace victor.*\b(?:ayudar|servir|encajar)\b/,
    /\b(?:en que|como) (?:me|nos) puede ayudar victor\b/,
    /\bque puede hacer victor (?:por|para) (?:mi|nosotros|mi empresa|nuestra empresa)\b/,
    /\bno se (?:muy bien )?que necesito\b/,
    /\bno tengo claro (?:que necesito|por donde empezar|como puede ayudarme)\b/,
    /\bno se por donde empezar.*\b(?:victor|portfolio|ayuda|ayudar)\b/,
    /\b(?:estoy|me siento) (?:un poco )?(?:perdido|perdida|confundido|confundida).*\b(?:victor|ayuda|ayudar)\b/,
    /\bpuede victor ayudarme\b/,
    /\bcrees que victor (?:me|nos) puede ayudar\b/,
  ]);


const CONTEXTUAL_HELP_PATTERNS =
  Object.freeze([
    /^(?:y )?esto (?:como|en que) (?:me|nos) (?:ayuda|puede ayudar)$/,
    /^(?:y )?esto para que (?:me|nos) sirve$/,
    /^(?:y )?esto (?:me|nos) puede servir$/,
    /^como (?:me|nos) ayuda esto$/,
  ]);


function asksWhatVictorDoes(text) {
  return hasAny(
    text,
    [
      /\bque hace victor\b/,
      /\ba que se dedica victor\b/,
      /\bque puede hacer victor\b/,
    ],
  );
}


function hasTechnologySemanticContext(context) {
  const semantic =
    context?.semanticContext ??
    null;

  return (
    semantic?.subjectType ===
      "technology" &&
    typeof semantic?.subjectId ===
      "string" &&
    semantic.subjectId.trim()
  );
}


export function detectNeedDiscoveryRequest(
  {
    userText,
    analysis = null,
    context = {},
  } = {},
) {
  const text =
    normalizeText(userText);

  if (!text) {
    return null;
  }

  if (
    hasAny(
      text,
      CATALOG_ONLY_PATTERNS,
    )
  ) {
    return null;
  }

  if (
    hasTechnologySemanticContext(context) &&
    hasAny(
      text,
      CONTEXTUAL_HELP_PATTERNS,
    )
  ) {
    return NEED_DISCOVERY_KIND.CONTEXTUAL;
  }

  if (
    hasAny(
      text,
      NEED_DISCOVERY_PATTERNS,
    )
  ) {
    return (
      asksWhatVictorDoes(text)
        ? NEED_DISCOVERY_KIND.WHAT_VICTOR_DOES
        : NEED_DISCOVERY_KIND.GENERAL
    );
  }

  const tone =
    analysis?.tone?.tone ??
    null;

  const intent =
    analysis?.primaryIntent ??
    null;

  /*
   * Complemento controlado para frases inciertas que el NLU
   * ya ha relacionado con servicios/perfil, sin convertir una
   * emoción aislada en intención comercial.
   */
  if (
    tone ===
      CONVERSATION_TONE.UNCERTAIN &&
    [
      "services",
      "portfolio",
    ].includes(intent) &&
    /\b(?:ayudar|victor|portfolio|empezar|necesito)\b/
      .test(text)
  ) {
    return NEED_DISCOVERY_KIND.GENERAL;
  }

  return null;
}


function quickReplies() {
  return [
    createAnswerQuickReply({
      id:
        "qr-need-excel-data",
      label:
        "Excel / datos manuales",
      answer:
        "Trabajo con varios Excel o datos que tengo que consolidar manualmente.",
    }),

    createAnswerQuickReply({
      id:
        "qr-need-reporting",
      label:
        "Informes / Power BI",
      answer:
        "Actualizo a mano informes o dashboards cada semana.",
    }),

    createAnswerQuickReply({
      id:
        "qr-need-repetitive-process",
      label:
        "Procesos repetitivos",
      answer:
        "Tengo un proceso repetitivo con mucho copiar y pegar.",
    }),

    createAnswerQuickReply({
      id:
        "qr-need-ai-opportunity",
      label:
        "IA / no sé dónde aplicarla",
      answer:
        "Quiero aplicar IA, pero no sé dónde tendría sentido.",
    }),
  ];
}


function openingForTone(tone) {
  switch (tone) {
    case CONVERSATION_TONE.FRUSTRATED:
      return (
        "Vamos a hacerlo sencillo: no hace falta elegir una tecnología o un servicio ahora. " +
        "Cuéntame qué parte del trabajo te está dando más guerra."
      );

    case CONVERSATION_TONE.NEGATIVE:
      return (
        "Podemos ir a lo concreto: no necesitas saber qué solución pedir. " +
        "Dime qué tarea, informe o proceso te está costando más de lo que debería."
      );

    case CONVERSATION_TONE.UNCERTAIN:
      return (
        "Claro. Si ahora mismo no lo tienes claro, no necesitas saber qué tecnología o servicio pedir. " +
        "Empecemos por lo que te gustaría mejorar; para empezar, basta con identificar la situación más parecida a la tuya."
      );

    default:
      return (
        "Sí, podría haber encaje. Pero antes de hablar de servicios, prefiero entender qué te gustaría mejorar. " +
        "Así puedo orientarte con lo que realmente está documentado en el portfolio."
      );
  }
}


function shortVictorContext(kind) {
  if (
    kind !==
      NEED_DISCOVERY_KIND.WHAT_VICTOR_DOES
  ) {
    return "";
  }

  return (
    "En pocas palabras, Víctor trabaja sobre todo con datos, Business Intelligence, " +
    "automatización e IA aplicada. Si me cuentas tu situación, puedo orientarte sobre qué parte de su experiencia encaja mejor y con qué límites."
  );
}


function semanticContextSentence(context) {
  const semantic =
    context?.semanticContext ??
    null;

  if (
    semantic?.subjectType !==
      "technology" ||
    !safeString(
      semantic?.subjectId,
    )
  ) {
    return "";
  }

  const item =
    getKnowledgeById(
      semantic.subjectId,
    );

  if (
    !item ||
    item.type !==
      KNOWLEDGE_TYPE.TECHNOLOGY
  ) {
    return "";
  }

  return (
    `Y si vienes de hablar de ${item.title}, no hace falta asumir que esa tecnología sea la solución: ` +
    "primero aclaremos qué quieres conseguir."
  );
}


export function composeNeedDiscoveryResponse(
  {
    userText,
    kind = null,
    analysis = null,
    intent = null,
    context = {},
  } = {},
) {
  const detectedKind =
    kind ??
    detectNeedDiscoveryRequest({
      userText,
      analysis,
      context,
    });

  if (!detectedKind) {
    return null;
  }

  const tone =
    analysis?.tone?.tone ??
    CONVERSATION_TONE.NEUTRAL;

  const firstParts = [
    openingForTone(tone),
    shortVictorContext(
      detectedKind,
    ),
    semanticContextSentence(
      context,
    ),
  ].filter(Boolean);

  const profile =
    getKnowledgeById(
      "profile-victor",
    );

  return createResponseEnvelope({
    id:
      `response-need-discovery-${detectedKind}`,

    kind:
      RESPONSE_KIND.DISCOVERY,

    outcome:
      RESPONSE_OUTCOME.NEEDS_CLARIFICATION,

    intent,

    messages: [
      {
        id:
          `msg-need-discovery-${detectedKind}-orientation`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE.EXPLANATION,

        text:
          firstParts.join(" "),
      },
      {
        id:
          `msg-need-discovery-${detectedKind}-question`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE.QUESTION,

        text:
          "¿Cuál de estas situaciones se parece más a la tuya?",
      },
    ],

    quickReplies:
      quickReplies(),

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        true,

      variationFamily:
        "need-discovery-natural",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE.WHEN_USEFUL,

      knowledgeIds:
        profile
          ? [profile.id]
          : [],

      factIds: [],

      qualificationReasons: [
        "needs-user-context-before-fit",
      ],
    },

    safety: {
      mustQualify:
        true,

      commercialRedirect:
        false,

      allowInference:
        false,

      forbiddenClaims: [
        "guaranteed-service-fit",
        "guaranteed-solution",
        "guaranteed-result",
      ],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY.CONTINUE,

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
        "chat_need_discovery",

      intent,

      outcome:
        RESPONSE_OUTCOME.NEEDS_CLARIFICATION,

      responseKind:
        RESPONSE_KIND.DISCOVERY,

      confidenceBucket:
        analysis?.confidenceBucket ??
        null,
    },

    trace: {
      responseTemplateId:
        `need-discovery-${detectedKind}`,
    },
  });
}
