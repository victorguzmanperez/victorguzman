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
  getKnowledgeById,
} from "../data/knowledge.js";


/* ============================================================
 * CONV-H3.27 — ASSISTANT SELF-KNOWLEDGE
 *
 * Responde preguntas sobre el propio asistente del portfolio sin
 * confundirlo con:
 *   - el portfolio/proyectos en general;
 *   - la tecnología IA de Víctor;
 *   - agentes autónomos o generativos.
 *
 * La detección es deliberadamente estrecha: “agente(s)” NO es un
 * alias de la capability determinista.
 * ============================================================
 */

export const ASSISTANT_KNOWLEDGE_REQUEST = Object.freeze({
  ABOUT: "about",
  HOW_IT_WORKS: "how_it_works",
  USES_AI: "uses_ai",
  USES_LLM: "uses_llm",
  IS_AI_AGENT: "is_ai_agent",
  CHATBOT_EXPERIENCE: "chatbot_experience",
  PRELOADED_QA: "preloaded_qa",
  AI_AGENT_EXPERIENCE: "ai_agent_experience",
});

const CAPABILITY_ID = "capability-deterministic-conversational-systems";
const AI_ID = "technology-ai";

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

function mentionsAssistant(text) {
  return (
    /\b(?:asistente|chatbot)\b/.test(text) &&
    !/\b(?:quiero|necesito|busco|montar|crear|construir)\b.*\b(?:asistente|chatbot)\b/.test(text)
  );
}

function mentionsPortfolioAssistant(text) {
  return (
    /\b(?:asistente|chatbot)\b.*\bportfolio\b/.test(text) ||
    /\bportfolio\b.*\b(?:asistente|chatbot)\b/.test(text) ||
    /\b(?:este|el)\s+(?:asistente|chatbot)\b/.test(text)
  );
}

function asksVictorAiAgentExperience(text) {
  const mentionsAgents = /\bagentes?\b.*\b(?:ia|inteligencia artificial)\b/.test(text);
  const experienceLanguage = /\b(?:victor|experiencia|hace|ha hecho|desarrolla|ha desarrollado|desarrollado|construye|ha construido|trabaja con|sabe hacer)\b/.test(text);
  const selfIdentity = /\b(?:es|eres)\b.*\bagentes?\b/.test(text);
  return mentionsAgents && experienceLanguage && !selfIdentity;
}

export function detectAssistantKnowledgeRequest(userText) {
  const text = normalizeText(userText);

  if (!text) {
    return null;
  }

  if (asksVictorAiAgentExperience(text)) {
    return ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE;
  }

  const implicitSelfAgentQuestion =
    /^(?:es|eres)\s+(?:un\s+)?agente(?:\s+autonomo)?(?:\s+de)?\s+(?:ia|inteligencia artificial)$/.test(text);

  const selfReference =
    mentionsPortfolioAssistant(text) ||
    implicitSelfAgentQuestion;

  if (
    selfReference &&
    /\b(?:llm|modelo de lenguaje|modelo grande de lenguaje|gpt|chatgpt)\b/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.USES_LLM;
  }

  if (
    selfReference &&
    (
      /\b(?:es|eres)\b.*\bagentes?\b/.test(text) ||
      /\bagentes?\b.*\b(?:autonomo|ia|inteligencia artificial)\b/.test(text)
    )
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.IS_AI_AGENT;
  }

  if (
    selfReference &&
    (
      /\b(?:usa|utiliza|lleva|funciona con|depende de)\b.*\b(?:ia|inteligencia artificial|ia generativa|generativa)\b/.test(text) ||
      /\b(?:es|eres)\b.*\bgenerativ\w*/.test(text)
    )
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.USES_AI;
  }

  if (
    /\bpreguntas? y respuestas?\b.*\b(?:predefinidas|precargadas|fijas)\b/.test(text) ||
    /\b(?:q ?& ?a|qa)\b.*\b(?:predefinid|precargad|fij)\w*/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.PRELOADED_QA;
  }

  if (
    /\b(?:ha hecho|hizo|ha creado|creo|ha construido|construyo|ha desarrollado|desarrollo|experiencia)\b.*\bchatbots?\b/.test(text) ||
    /\bchatbots?\b.*\b(?:experiencia|hecho|creado|construido|desarrollado)\b/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.CHATBOT_EXPERIENCE;
  }

  if (
    selfReference &&
    /\b(?:como funciona|como esta hecho|como esta construido|arquitectura|que hay detras|como trabaja|como responde)\b/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.HOW_IT_WORKS;
  }

  if (
    selfReference &&
    /\b(?:que es|que hace|para que sirve|explicame)\b/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.ABOUT;
  }

  // “chatbot” aislado no se convierte en una entidad global. Solo lo
  // resolvemos si la propia frase pregunta por experiencia demostrada.
  if (
    mentionsAssistant(text) &&
    /\b(?:victor|experiencia)\b/.test(text) &&
    /\bchatbots?\b/.test(text)
  ) {
    return ASSISTANT_KNOWLEDGE_REQUEST.CHATBOT_EXPERIENCE;
  }

  return null;
}

function responseText(request) {
  switch (request) {
    case ASSISTANT_KNOWLEDGE_REQUEST.ABOUT:
      return (
        "La versión pública actual es un asistente guiado determinista construido para este portfolio. " +
        "Navega mediante opciones predefinidas dentro de un Conversation Graph, conserva estado estructurado de la sesión y puede derivar a acciones o formularios; " +
        "no depende de un LLM ni de un agente autónomo en tiempo de ejecución."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.HOW_IT_WORKS:
      return (
        "La versión pública funciona con un Conversation Graph determinista: opciones predefinidas, multiselección, estado estructurado, navegación y reglas de transición. " +
        "Puede resumir el caso y preparar un diagnóstico, pero no interpreta texto libre en producción. " +
        "No necesita un LLM en tiempo de ejecución para mantener ese recorrido."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.USES_AI:
      return (
        "No funciona como un chatbot de IA generativa en tiempo de ejecución. " +
        "La versión pública sigue un Conversation Graph con opciones y reglas predefinidas, manteniendo únicamente el estado estructurado necesario para el recorrido; " +
        "por eso no conviene confundir este asistente con la experiencia general de Víctor en IA aplicada."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.USES_LLM:
      return (
        "No. La versión pública actual no depende de un LLM en tiempo de ejecución. " +
        "El visitante navega por opciones predefinidas y el sistema aplica estado y reglas deterministas dentro de un Conversation Graph."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.IS_AI_AGENT:
      return (
        "No es un agente autónomo de IA ni un agente generativo. " +
        "Es un asistente guiado determinista: trabaja con un Conversation Graph, opciones predefinidas, reglas y estado estructurado de la sesión."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.CHATBOT_EXPERIENCE:
      return (
        "Sí hay experiencia aplicada demostrable en este proyecto: Víctor ha diseñado e implementado el asistente guiado de este portfolio con un Conversation Graph, opciones predefinidas, multiselección, estado estructurado, navegación y handoff a formularios o acciones, sin depender de un LLM en tiempo de ejecución. " +
        "La evidencia es de proyecto aplicado, no una afirmación genérica de experiencia profesional con todo tipo de chatbots."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.PRELOADED_QA:
      return (
        "“Preguntas y respuestas precargadas” describe solo una parte de la idea. " +
        "La versión pública usa un grafo de conversación: ofrece opciones predefinidas, permite seleccionar varias respuestas, conserva estado estructurado y aplica reglas para decidir el siguiente nodo, resumen o acción. " +
        "No interpreta texto libre en producción."
      );

    case ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE:
      return (
        "El portfolio documenta experiencia actual de Víctor con IA aplicada, pero no aporta evidencia suficiente para afirmar experiencia desarrollando agentes autónomos de IA. " +
        "El asistente público actual es distinto: es un sistema guiado determinista basado en un Conversation Graph, opciones predefinidas y estado estructurado, sin depender de un LLM en tiempo de ejecución."
      );

    default:
      return "";
  }
}

function evidenceIds(request) {
  if (request === ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE) {
    // La capability determinista se usa solo para aclarar la diferencia,
    // nunca como evidencia de experiencia con agentes de IA.
    return [AI_ID];
  }

  return [CAPABILITY_ID];
}

export function composeAssistantKnowledgeResponse({
  request,
  intent = null,
  context = {},
} = {}) {
  if (!Object.values(ASSISTANT_KNOWLEDGE_REQUEST).includes(request)) {
    return null;
  }

  const capability = getKnowledgeById(CAPABILITY_ID);
  if (!capability) {
    return null;
  }

  const text = responseText(request);
  if (!text) {
    return null;
  }

  const continuing = context?.continuing === true;
  const qualified = [
    ASSISTANT_KNOWLEDGE_REQUEST.CHATBOT_EXPERIENCE,
    ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE,
  ].includes(request);

  return createResponseEnvelope({
    id: `response-assistant-knowledge-${request}`,
    kind: RESPONSE_KIND.KNOWLEDGE,
    outcome: qualified ? RESPONSE_OUTCOME.QUALIFIED : RESPONSE_OUTCOME.ANSWERED,
    intent,
    messages: [
      {
        id: `msg-assistant-knowledge-${request}`,
        purpose: qualified
          ? RESPONSE_MESSAGE_PURPOSE.QUALIFICATION
          : RESPONSE_MESSAGE_PURPOSE.ANSWER,
        text,
      },
    ],
    presentation: {
      depth: request === ASSISTANT_KNOWLEDGE_REQUEST.HOW_IT_WORKS
        ? RESPONSE_DEPTH.MEDIUM
        : RESPONSE_DEPTH.SHORT,
      splitBubbles: false,
      variationFamily: "assistant-self-knowledge",
      avoidRecentVariants: 2,
    },
    evidence: {
      mode: RESPONSE_EVIDENCE_MODE.REQUIRED,
      knowledgeIds: evidenceIds(request),
    },
    safety: {
      mustQualify: qualified,
      allowInference: false,
      forbiddenClaims: capability.answerPolicy?.forbiddenClaims ?? [],
    },
    conversation: {
      stage: RESPONSE_STAGE.ACTIVE,
      continuity: continuing
        ? RESPONSE_CONTINUITY.CONTINUING
        : RESPONSE_CONTINUITY.NEW,
      acknowledgeUser: true,
      suppressRepeatedCTA: context?.suppressRepeatedCTA === true,
    },
    stateEffects: {
      resetFallbacks: true,
    },
    trace: {
      responseTemplateId: `assistant-self-knowledge-${request}`,
    },
  });
}
