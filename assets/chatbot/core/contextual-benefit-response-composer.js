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
  resolveTechnologyMentions,
} from "./technology-entities.js";

import {
  EXPERIENCE_EVIDENCE,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
  getKnowledgeFact,
} from "../data/knowledge.js";


/* ============================================================
 * NAT-H2.2 / H2.3 — CONTEXTUAL BENEFIT BRIDGES
 *
 * Convierte preguntas como:
 *   - ¿Y esto cómo me puede ayudar?
 *   - ¿Para qué me serviría AWS?
 *   - ¿Y en mi caso?
 *
 * en una respuesta orientada a utilidad, sin repetir simplemente
 * la evidencia de experiencia de la tecnología anterior.
 * ============================================================
 */

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

const BENEFIT_BRIDGE_PATTERNS = Object.freeze([
  /\b(?:esto|eso|esta tecnologia|esa tecnologia)\b.*\b(?:ayuda|ayudar|servir|sirve|serviria|encaja|aportaria)\b/,
  /\b(?:para que|como|en que)\b.*\b(?:me|nos)\b.*\b(?:sirve|serviria|ayuda|ayudaria|puede ayudar)\b/,
  /\b(?:para que|como)\b.*\b(?:sirve|serviria|ayuda|ayudaria)\b/,
  /^(?:y )?en mi caso$/,
  /^(?:y )?en nuestro caso$/,
]);

const BENEFIT_PROFILES = Object.freeze({
  "technology-aws": Object.freeze({
    benefit:
      "AWS puede tener sentido si necesitas llevar procesos o datos a la nube, conectar servicios o escalar una solución cuando una infraestructura local se queda corta.",
    question:
      "¿Qué estás intentando resolver: mover datos o procesos a la nube, conectar sistemas o simplemente explorar opciones?",
    replies: Object.freeze([
      ["Mover datos/procesos", "Quiero mover datos o procesos a la nube y reducir trabajo manual."],
      ["Conectar sistemas", "Necesito conectar varios sistemas o fuentes de datos."],
      ["Estoy explorando", "Todavía no tengo un caso concreto; quiero saber si AWS tendría sentido."],
    ]),
  }),

  "technology-power-bi": Object.freeze({
    benefit:
      "Power BI puede ayudarte a convertir datos dispersos en informes y cuadros de mando que se actualicen con menos trabajo manual y sean más fáciles de seguir.",
    question:
      "¿Dónde está ahora el mayor problema: preparar los datos, actualizar el informe o visualizar bien la información?",
    replies: Object.freeze([
      ["Preparar datos", "Pierdo mucho tiempo preparando y transformando los datos antes del informe."],
      ["Actualizar informes", "Actualizo informes o dashboards manualmente cada semana o cada mes."],
      ["Visualizar mejor", "Tengo los datos, pero necesito un dashboard más claro para tomar decisiones."],
    ]),
  }),

  "technology-excel": Object.freeze({
    benefit:
      "Excel puede seguir siendo una buena herramienta si el problema es ordenar un modelo, consolidar archivos o quitar pasos manuales; no siempre hace falta sustituirlo por otra plataforma.",
    question:
      "¿Qué te pesa más ahora: juntar archivos, copiar y pegar datos o mantener un Excel demasiado complejo?",
    replies: Object.freeze([
      ["Juntar archivos", "Trabajo con varios Excel o datos que tengo que consolidar manualmente."],
      ["Copiar y pegar", "Tengo un proceso repetitivo con mucho copiar y pegar entre Excel."],
      ["Modelo complejo", "Tengo un Excel complejo y cada vez es más difícil de mantener."],
    ]),
  }),

  "technology-power-automate": Object.freeze({
    benefit:
      "Power Automate puede servir para quitar pasos repetitivos entre herramientas de Microsoft, lanzar avisos, mover información o encadenar tareas que hoy dependen de hacerlo todo a mano.",
    question:
      "¿Qué tarea repites con más frecuencia y te gustaría dejar automatizada?",
    replies: Object.freeze([
      ["Mover información", "Copio o muevo información manualmente entre varias herramientas."],
      ["Avisos / seguimiento", "Necesito automatizar avisos y seguimientos que ahora hago a mano."],
      ["Proceso repetitivo", "Tengo un proceso repetitivo con varios pasos manuales."],
    ]),
  }),

  "technology-ai": Object.freeze({
    benefit:
      "La IA puede aportar valor cuando hay una tarea concreta que requiere clasificar, resumir, extraer información, asistir una decisión o reducir trabajo repetitivo. Meter IA sin un problema claro suele añadir complejidad, no valor.",
    question:
      "¿Qué te gustaría mejorar con IA: documentos, atención y seguimiento, análisis de datos o todavía no lo tienes claro?",
    replies: Object.freeze([
      ["Documentos", "Quiero usar IA para leer, clasificar o extraer información de documentos."],
      ["Seguimiento", "Quiero automatizar atención, seguimiento o respuestas con IA."],
      ["Datos", "Quiero usar IA para analizar datos o ayudar a detectar información útil."],
      ["No lo sé aún", "Quiero aplicar IA, pero no sé dónde tendría sentido."],
    ]),
  }),

  "technology-power-query": Object.freeze({
    benefit:
      "Power Query es especialmente útil para repetir siempre las mismas transformaciones: importar, limpiar, combinar y preparar datos sin rehacer los pasos manualmente cada vez.",
    question:
      "¿Tu problema está más en unir archivos, limpiar datos o preparar una fuente para un informe?",
    replies: Object.freeze([
      ["Unir archivos", "Necesito unir varios archivos o fuentes de datos de forma repetible."],
      ["Limpiar datos", "Pierdo tiempo limpiando y transformando datos manualmente."],
      ["Preparar informes", "Necesito preparar datos de forma automática antes de actualizar un informe."],
    ]),
  }),

  "technology-python": Object.freeze({
    benefit:
      "Python puede ser útil cuando necesitas automatizar procesos, transformar muchos datos o documentos, conectar fuentes y construir lógica que se queda corta en una herramienta más cerrada.",
    question:
      "¿Qué necesitas automatizar o procesar que ahora te está consumiendo tiempo?",
    replies: Object.freeze([
      ["Datos", "Necesito automatizar la preparación o transformación de datos."],
      ["Documentos", "Necesito procesar muchos documentos o PDF automáticamente."],
      ["Proceso", "Tengo un proceso repetitivo que quiero automatizar de principio a fin."],
    ]),
  }),
});

function semanticTechnology(context) {
  const semantic = context?.semanticContext ?? null;

  if (
    semantic?.subjectType !== "technology" ||
    !safeString(semantic?.subjectId)
  ) {
    return null;
  }

  const item = getKnowledgeById(semantic.subjectId);
  return item?.type === KNOWLEDGE_TYPE.TECHNOLOGY ? item : null;
}

function explicitTechnology(userText) {
  const mentions = resolveTechnologyMentions(userText);
  return mentions.length === 1 ? mentions[0] : null;
}

export function detectContextualBenefitRequest({
  userText,
  context = {},
} = {}) {
  const text = normalizeText(userText);

  if (!text) {
    return null;
  }

  const explicit = explicitTechnology(userText);
  const semantic = semanticTechnology(context);
  const subject = explicit ?? semantic;

  if (!subject) {
    return null;
  }

  // "¿Cómo me puede ayudar Víctor?" pertenece a NAT-H1, no a una
  // tecnología previa, salvo que el propio mensaje nombre esa tecnología.
  if (/\bvictor\b/.test(text) && !explicit) {
    return null;
  }

  if (!BENEFIT_BRIDGE_PATTERNS.some((pattern) => pattern.test(text))) {
    return null;
  }

  return Object.freeze({
    knowledgeId: subject.id,
    source: explicit ? "explicit" : "semantic",
  });
}

function evidenceCategories(item) {
  const value = getKnowledgeFact(item, "experience-evidence")?.value;
  return Array.isArray(value) ? value : [];
}

function booleanFact(item, key) {
  return getKnowledgeFact(item, key)?.value === true;
}

function evidenceSentence(item) {
  const categories = evidenceCategories(item);

  if (categories.includes(EXPERIENCE_EVIDENCE.NO_EVIDENCE)) {
    return (
      `Con ${item.title} prefiero no exagerar: ` +
      "no hay base suficiente para decir que Víctor tenga experiencia profesional o formación relevante."
    );
  }

  if (booleanFact(item, "professional-current")) {
    return `Con ${item.title} sí trabaja actualmente a nivel profesional.`;
  }

  if (booleanFact(item, "professional-historical")) {
    return (
      `Con ${item.title} sí tiene experiencia profesional histórica, ` +
      "aunque no consta como una tecnología de trabajo actual."
    );
  }

  if (categories.includes(EXPERIENCE_EVIDENCE.FORMAL_TRAINING)) {
    return (
      `Con ${item.title} conviene matizar: Víctor tiene formación o exposición, ` +
      "pero no experiencia profesional demostrada con esa tecnología."
    );
  }

  if (categories.includes(EXPERIENCE_EVIDENCE.PROJECT_APPLIED)) {
    return `Víctor tiene aplicación práctica documentada de ${item.title} en proyectos.`;
  }

  if (categories.includes(EXPERIENCE_EVIDENCE.SELF_LEARNING)) {
    return (
      `Víctor tiene aprendizaje y práctica personal documentada con ${item.title}, ` +
      "no experiencia profesional consolidada."
    );
  }

  return (
    `Puedo explicarte para qué suele ser útil ${item.title}, ` +
    "pero no voy a asumir un nivel de experiencia que no esté documentado."
  );
}

function defaultProfile(item) {
  return {
    benefit:
      `${item.title} puede ser útil como herramienta, pero el valor depende de qué problema quieras resolver. ` +
      "Antes de elegir tecnología, conviene aclarar el resultado que buscas.",
    question:
      "¿Qué quieres conseguir exactamente: ahorrar tiempo, trabajar mejor con datos, automatizar un proceso o algo distinto?",
    replies: [
      ["Ahorrar tiempo", "Tengo tareas manuales que me consumen demasiado tiempo."],
      ["Trabajar con datos", "Tengo datos dispersos y necesito organizarlos o analizarlos mejor."],
      ["Automatizar", "Tengo un proceso repetitivo que quiero automatizar."],
    ],
  };
}

function quickRepliesFor(item, profile) {
  return (profile.replies ?? []).map(
    ([label, answer], index) =>
      createAnswerQuickReply({
        id: `qr-benefit-${item.id}-${index + 1}`,
        label,
        answer,
      }),
  ).filter(Boolean);
}

function evidenceFactIds(item) {
  return [
    "experience-evidence",
    "professional-current",
    "professional-historical",
    "evidence-summary",
  ]
    .map((key) => getKnowledgeFact(item, key)?.id)
    .filter(Boolean);
}

export function composeContextualBenefitResponse({
  userText,
  request = null,
  intent = null,
  context = {},
} = {}) {
  const detected = request ?? detectContextualBenefitRequest({ userText, context });

  if (!detected?.knowledgeId) {
    return null;
  }

  const item = getKnowledgeById(detected.knowledgeId);

  if (!item || item.type !== KNOWLEDGE_TYPE.TECHNOLOGY) {
    return null;
  }

  const profile = BENEFIT_PROFILES[item.id] ?? defaultProfile(item);

  return createResponseEnvelope({
    id: `response-contextual-benefit-${item.id}`,
    kind: RESPONSE_KIND.DISCOVERY,
    outcome: RESPONSE_OUTCOME.QUALIFIED,
    intent,
    messages: [
      {
        id: `msg-contextual-benefit-${item.id}-benefit`,
        purpose: RESPONSE_MESSAGE_PURPOSE.EXPLANATION,
        text: profile.benefit,
      },
      {
        id: `msg-contextual-benefit-${item.id}-evidence`,
        purpose: RESPONSE_MESSAGE_PURPOSE.EXPLANATION,
        text: evidenceSentence(item),
      },
      {
        id: `msg-contextual-benefit-${item.id}-question`,
        purpose: RESPONSE_MESSAGE_PURPOSE.QUESTION,
        text: profile.question,
      },
    ],
    quickReplies: quickRepliesFor(item, profile),
    presentation: {
      depth: RESPONSE_DEPTH.SHORT,
      splitBubbles: true,
      variationFamily: "contextual-benefit",
      avoidRecentVariants: 2,
    },
    evidence: {
      mode: RESPONSE_EVIDENCE_MODE.REQUIRED,
      knowledgeIds: [item.id],
      factIds: evidenceFactIds(item),
      qualificationReasons: ["contextual-benefit-qualified"],
    },
    safety: {
      mustQualify: true,
      commercialRedirect: false,
      allowInference: false,
      forbiddenClaims: [
        "guaranteed-technology-fit",
        "guaranteed-result",
        "undocumented-professional-experience",
      ],
    },
    conversation: {
      stage: RESPONSE_STAGE.ACTIVE,
      continuity: RESPONSE_CONTINUITY.CONTINUING,
      acknowledgeUser: true,
      suppressRepeatedCTA: true,
    },
    stateEffects: {
      resetFallbacks: true,
    },
    analytics: {
      eventName: "chat_contextual_benefit",
      intent,
      outcome: RESPONSE_OUTCOME.QUALIFIED,
      responseKind: RESPONSE_KIND.DISCOVERY,
      confidenceBucket: null,
    },
    trace: {
      responseTemplateId: `contextual-benefit-${item.id}-${detected.source}`,
    },
  });
}
