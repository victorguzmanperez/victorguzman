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
  RELATION_TYPE,
} from "../data/knowledge/constants.js";

import {
  createAnswerQuickReply,
} from "./response-interactions.js";

import {
  CONVERSATION_TONE,
} from "./tone-analyzer.js";

import {
  getKnowledgeById,
  getKnowledgeFact,
} from "../data/knowledge.js";

import {
  matchProblemsByText,
} from "../data/knowledge/problem-matcher.js";

import {
  getSolutionsByProblemId,
} from "../data/knowledge/solutions.js";

import {
  getServicesBySolutionId,
} from "../data/knowledge/services.js";


/* ============================================================
 * PROBLEM → SOLUTION → SERVICE RESPONSE COMPOSER
 * 1.11.22.6
 *
 * USER MESSAGE
 *      ↓
 * Problem Matcher
 *      ↓
 * PROBLEM
 *      ↓
 * getSolutionsByProblemId()
 *      ↓
 * SOLUTION
 *      ↓
 * getServicesBySolutionId()
 *      ↓
 * SERVICE explícito, si existe
 *      ↓
 * PROJECT / EVIDENCE relacionado
 *      ↓
 * respuesta conversacional cualificada
 *
 * Reglas:
 *
 * - Problem ≠ Solution
 * - Solution ≠ Service
 * - Project ≠ Service
 * - Service solo se menciona si existe vínculo explícito
 * - Solution-only permanece Solution-only
 * - nunca se garantiza viabilidad
 * - nunca se garantiza encaje comercial
 * - nunca se inventa precio/plazo/disponibilidad/resultado
 * ============================================================
 */


/* ============================================================
 * CONSTANTS
 * ============================================================
 */

export const PROBLEM_FLOW_MIN_SCORE =
  4;


export const PROBLEM_FLOW_MODE =
  Object.freeze({
    SERVICE:
      "problem_solution_service",

    SOLUTION_ONLY:
      "problem_solution_only",
  });


export const PROBLEM_FLOW_TARGET =
  Object.freeze({
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


function uniqueKnowledgeItems(
  items,
) {
  const byId =
    new Map();


  for (
    const item
    of items ?? []
  ) {
    if (
      !item ||
      typeof item.id !==
        "string"
    ) {
      continue;
    }


    if (
      !byId.has(
        item.id,
      )
    ) {
      byId.set(
        item.id,
        item,
      );
    }
  }


  return [
    ...byId.values(),
  ];
}


function lowercaseInitial(
  value,
) {
  const text =
    safeString(
      value,
    );


  if (!text) {
    return "";
  }


  const firstWord =
    text.split(
      /\s+/,
    )[0];


  /*
   * No tocamos acrónimos:
   *
   * IA
   * BI
   * PDF
   */
  if (
    firstWord.length > 1 &&
    firstWord ===
      firstWord.toUpperCase()
  ) {
    return text;
  }


  return (
    text.charAt(0)
      .toLowerCase() +
    text.slice(1)
  );
}


function stripTerminalPunctuation(
  value,
) {
  return safeString(
    value,
  ).replace(
    /[.!?]+$/,
    "",
  );
}


function ensurePeriod(
  value,
) {
  const text =
    safeString(
      value,
    );


  if (!text) {
    return "";
  }


  if (
    /[.!?]$/.test(
      text,
    )
  ) {
    return text;
  }


  return `${text}.`;
}


function joinNatural(
  values,
) {
  const items =
    values
      .map(
        safeString,
      )
      .filter(Boolean);


  if (
    items.length === 0
  ) {
    return "";
  }


  if (
    items.length === 1
  ) {
    return items[0];
  }


  if (
    items.length === 2
  ) {
    return (
      `${items[0]} y ${items[1]}`
    );
  }


  return (
    `${items
      .slice(
        0,
        -1,
      )
      .join(", ")} y ${
        items[
          items.length - 1
        ]
      }`
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
 * PROJECT EXAMPLES
 *
 * Únicamente desde relaciones explícitas Service → EXEMPLIFIED_BY
 * ============================================================
 */

function getProjectExamplesForServices(
  services,
  {
    limit = 2,
  } = {},
) {
  const projectIds = [];


  for (
    const service
    of services ?? []
  ) {
    for (
      const relationship
      of service.relationships ??
        []
    ) {
      if (
        relationship.type !==
          RELATION_TYPE
            .EXEMPLIFIED_BY
      ) {
        continue;
      }


      projectIds.push(
        relationship.target,
      );
    }
  }


  const projects =
    uniqueStrings(
      projectIds,
    )
      .map(
        (projectId) =>
          getKnowledgeById(
            projectId,
          ),
      )
      .filter(
        (project) =>
          project?.type ===
          KNOWLEDGE_TYPE.PROJECT,
      );


  return projects.slice(
    0,
    Math.max(
      0,
      limit,
    ),
  );
}


/* ============================================================
 * FACT IDS
 * ============================================================
 */

function collectRelevantFactIds(
  solutions,
  services,
) {
  const factIds = [];


  for (
    const solution
    of solutions ?? []
  ) {
    const fact =
      getKnowledgeFact(
        solution,
        "solution-definition",
      );


    if (fact?.id) {
      factIds.push(
        fact.id,
      );
    }
  }


  for (
    const service
    of services ?? []
  ) {
    const fact =
      getKnowledgeFact(
        service,
        "service-definition",
      );


    if (fact?.id) {
      factIds.push(
        fact.id,
      );
    }
  }


  return uniqueStrings(
    factIds,
  );
}


/* ============================================================
 * SAFETY
 * ============================================================
 */

function collectForbiddenClaims(
  solutions,
  services,
) {
  const claims = [];


  for (
    const item
    of [
      ...(solutions ?? []),
      ...(services ?? []),
    ]
  ) {
    claims.push(
      ...(
        item.answerPolicy
          ?.forbiddenClaims ??
        []
      ),
    );
  }


  /*
   * Defensa adicional del Response Engine.
   *
   * No sustituye las policies de Knowledge.
   */
  claims.push(
    "guaranteed-solution",
    "guaranteed-feasibility",
    "automatic-service-fit",
    "guaranteed-result",
    "guaranteed-roi",
    "automatic-price",
    "automatic-deadline",
    "automatic-availability",
  );


  return uniqueStrings(
    claims,
  );
}


/* ============================================================
 * FLOW RESOLUTION
 * ============================================================
 */

export function resolveProblemSolutionServiceFlow(
  {
    userText,
    minScore =
      PROBLEM_FLOW_MIN_SCORE,
  } = {},
) {
  const text =
    safeString(
      userText,
    );


  if (!text) {
    return null;
  }


  const matches =
    matchProblemsByText(
      text,
      {
        limit:
          2,

        minScore,
      },
    );


  if (
    !Array.isArray(
      matches,
    ) ||
    matches.length === 0
  ) {
    return null;
  }


  const bestMatch =
    matches[0];


  const problem =
    getKnowledgeById(
      bestMatch.problemId,
    );


  if (
    !problem ||
    problem.type !==
      KNOWLEDGE_TYPE.PROBLEM
  ) {
    return null;
  }


  const solutions =
    uniqueKnowledgeItems(
      getSolutionsByProblemId(
        problem.id,
      ),
    ).filter(
      (solution) =>
        solution?.type ===
        KNOWLEDGE_TYPE.SOLUTION,
    );


  /*
   * Todo Problem canónico debería tener Solution,
   * pero si el grafo se rompe fallamos de forma segura.
   */
  if (
    solutions.length === 0
  ) {
    return null;
  }


  const services =
    uniqueKnowledgeItems(
      solutions.flatMap(
        (solution) =>
          getServicesBySolutionId(
            solution.id,
          ),
      ),
    ).filter(
      (service) =>
        service?.type ===
        KNOWLEDGE_TYPE.SERVICE,
    );


  const projectExamples =
    getProjectExamplesForServices(
      services,
      {
        limit:
          2,
      },
    );


  const mode =
    services.length > 0
      ? PROBLEM_FLOW_MODE
          .SERVICE
      : PROBLEM_FLOW_MODE
          .SOLUTION_ONLY;


  return Object.freeze({
    mode,

    match:
      Object.freeze({
        problemId:
          bestMatch.problemId,

        score:
          bestMatch.score,

        matchedAliases:
          Object.freeze([
            ...(
              bestMatch
                .matchedAliases ??
              []
            ),
          ]),

        matchedSymptoms:
          Object.freeze([
            ...(
              bestMatch
                .matchedSymptoms ??
              []
            ),
          ]),

        matchedSignals:
          Object.freeze([
            ...(
              bestMatch
                .matchedSignals ??
              []
            ),
          ]),
      }),

    problem,

    solutions:
      Object.freeze([
        ...solutions,
      ]),

    services:
      Object.freeze([
        ...services,
      ]),

    projectExamples:
      Object.freeze([
        ...projectExamples,
      ]),
  });
}


/* ============================================================
 * NATURAL LANGUAGE — SOLUTIONS
 * ============================================================
 */

function composeSolutionSentence(
  solutions,
) {
  if (
    !Array.isArray(
      solutions,
    ) ||
    solutions.length === 0
  ) {
    return "";
  }


  if (
    solutions.length === 1
  ) {
    return (
      "Por lo que describes, una línea de solución relacionada " +
      `estaría centrada en ${lowercaseInitial(
        solutions[0].title,
      )}.`
    );
  }


  const titles =
    solutions.map(
      (solution) =>
        lowercaseInitial(
          solution.title,
        ),
    );


  return (
    "Por lo que describes, hay varias líneas de solución relacionadas, " +
    `entre ellas ${joinNatural(
      titles,
    )}.`
  );
}

function composeSolutionExplanation(
  solution,
) {
  const description =
    stripTerminalPunctuation(
      solution
        ?.shortDescription,
    );


  if (!description) {
    return "";
  }


  return ensurePeriod(
    description,
  );
}


/* ============================================================
 * NATURAL LANGUAGE — SERVICES
 * ============================================================
 */

function composeServiceSentence(
  services,
) {
  if (
    !Array.isArray(
      services,
    ) ||
    services.length === 0
  ) {
    return (
      "Víctor no tiene actualmente un servicio publicado específico " +
      "para esta línea, así que no sería correcto presentarla como " +
      "un servicio ya definido."
    );
  }


  if (
    services.length === 1
  ) {
    return (
      "En el portfolio de Víctor, este tipo de necesidad se relaciona " +
      `con el servicio ${services[0].title}.`
    );
  }


  return (
    "En el portfolio de Víctor, este tipo de necesidad se relaciona " +
    `con los servicios ${joinNatural(
      services.map(
        (service) =>
          service.title,
      ),
    )}.`
  );
}


/* ============================================================
 * NATURAL LANGUAGE — PROJECT EVIDENCE
 * ============================================================
 */

function composeProjectExampleSentence(
  projects,
) {
  if (
    !Array.isArray(
      projects,
    ) ||
    projects.length === 0
  ) {
    return "";
  }


  if (
    projects.length === 1
  ) {
    return (
      "Como referencia, hay un proyecto del portfolio relacionado: " +
      `${projects[0].title}.`
    );
  }


  return (
    "Como referencia, hay proyectos del portfolio relacionados, como " +
    `${joinNatural(
      projects.map(
        (project) =>
          project.title,
      ),
    )}.`
  );
}


/* ============================================================
 * NATURAL LANGUAGE — QUALIFICATION
 * ============================================================
 */

function composeQualificationSentence(
  flow,
) {
  if (
    flow.mode ===
      PROBLEM_FLOW_MODE
        .SOLUTION_ONLY
  ) {
    return (
      "Si quieres valorar el caso, habría que revisar el alcance, " +
      "los datos y el objetivo antes de plantear un enfoque concreto."
    );
  }


  return (
    "Para confirmar si encaja en tu caso concreto, habría que revisar " +
    "el proceso, los datos y el resultado que necesitas."
  );
}


/* ============================================================
 * NAT-H2 — CONVERSATIONAL VOICE PROFILES
 *
 * La respuesta visible prioriza:
 * 1) reconocer el problema en lenguaje humano;
 * 2) explicar el beneficio antes que la tecnología;
 * 3) aportar una evidencia breve;
 * 4) terminar con UNA pregunta útil.
 * ============================================================
 */


const NAT_H2_PROBLEM_PROFILES =
  Object.freeze({
    "problem-repetitive-copy-paste":
      Object.freeze({
        opening:
          "Sí, aquí el cuello de botella está en mover información manualmente entre herramientas.",
        benefit:
          "La mejora sería eliminar el copiar y pegar repetitivo y dejar un flujo controlado, con validaciones antes de mover o transformar los datos.",
        question:
          "¿Entre qué herramientas se mueve la información?",
        replies:
          Object.freeze([
            [
              "Excel y sistema",
              "Copiamos datos entre Excel y otro sistema de forma recurrente.",
            ],
            [
              "Entre sistemas",
              "Copiamos datos entre dos aplicaciones o sistemas.",
            ],
            [
              "Correo y Excel",
              "Recibimos información por correo y después la pasamos manualmente a Excel.",
            ],
          ]),
      }),
  });

const NAT_H2_SOLUTION_PROFILES =
  Object.freeze({
    "solution-data-consolidation-automation":
      Object.freeze({
        opening:
          "Sí, aquí hay bastante margen para quitar trabajo manual.",
        benefit:
          "La idea sería que los archivos y datos se junten y preparen de forma repetible, en vez de copiar, pegar y rehacer los mismos pasos cada vez.",
        question:
          "¿Qué te lleva más tiempo ahora: juntar los archivos, limpiar los datos o preparar el resultado final?",
        replies:
          Object.freeze([
            [
              "Juntar archivos",
              "Lo que más tiempo me lleva es juntar varios Excel o fuentes y consolidarlos manualmente.",
            ],
            [
              "Limpiar datos",
              "Lo que más tiempo me lleva es limpiar y transformar los datos antes de poder usarlos.",
            ],
            [
              "Preparar el informe",
              "Lo que más tiempo me lleva es preparar el informe final después de consolidar los datos.",
            ],
          ]),
      }),

    "solution-reporting-dashboard-automation":
      Object.freeze({
        opening:
          "Sí, este tipo de reporting suele poder simplificarse bastante.",
        benefit:
          "El objetivo sería dejar automatizada la preparación y actualización de los datos para que el informe no dependa de repetir los mismos pasos cada semana o cada mes.",
        question:
          "¿Dónde tienes ahora más trabajo manual: preparando los datos o actualizando el dashboard?",
        replies:
          Object.freeze([
            [
              "Preparar datos",
              "Pierdo más tiempo preparando y transformando los datos antes de actualizar el informe.",
            ],
            [
              "Actualizar dashboard",
              "Pierdo más tiempo actualizando manualmente el dashboard o informe.",
            ],
          ]),
      }),

    "solution-evaluation-scoring-model":
      Object.freeze({
        opening:
          "Sí, aquí el problema parece estar menos en Excel y más en cómo convertir las reglas en un modelo que sea fácil de comprobar.",
        benefit:
          "La mejora estaría en hacer que criterios, pesos y cálculos sean reproducibles, trazables y testeables, para que un cambio no rompa el resultado sin darte cuenta.",
        question:
          "¿Qué te cuesta más ahora: definir las reglas, manejar los pesos o validar que el resultado sea correcto?",
        replies:
          Object.freeze([
            [
              "Reglas",
              "Lo más difícil es convertir muchos criterios y reglas en una lógica clara y mantenible.",
            ],
            [
              "Pesos",
              "Lo más difícil es gestionar categorías, subcategorías y pesos sin perder el control del cálculo.",
            ],
            [
              "Validación",
              "Lo más difícil es comprobar que los resultados son correctos cuando cambian datos o reglas.",
            ],
          ]),
      }),

    "solution-document-data-extraction":
      Object.freeze({
        opening:
          "Sí, aquí el ahorro puede venir de dejar de leer y copiar documentos uno a uno.",
        benefit:
          "La idea sería extraer la información útil de los documentos y dejarla preparada como datos estructurados para revisarla, analizarla o enviarla al siguiente paso del proceso.",
        question:
          "¿Tus documentos son PDF con texto, escaneados o una mezcla de formatos?",
        replies:
          Object.freeze([
            [
              "PDF con texto",
              "La mayoría son PDF digitales con texto y necesito extraer campos concretos.",
            ],
            [
              "Escaneados",
              "La mayoría son documentos escaneados y necesito extraer información de ellos.",
            ],
            [
              "Formatos variados",
              "Tengo documentos de varios formatos y estructuras diferentes.",
            ],
          ]),
      }),

    "solution-data-quality-traceability":
      Object.freeze({
        opening:
          "Sí, si no puedes confiar en los datos, automatizar más cosas solo movería el problema de sitio.",
        benefit:
          "Primero habría que introducir controles para detectar errores, entender de dónde sale cada dato y poder explicar por qué un resultado cambia.",
        question:
          "¿Qué te preocupa más: datos incorrectos, duplicados o no poder seguir el origen de la información?",
        replies:
          Object.freeze([
            [
              "Errores",
              "El problema principal son datos incorrectos o inconsistentes que detectamos demasiado tarde.",
            ],
            [
              "Duplicados",
              "El problema principal son duplicados y versiones distintas de la misma información.",
            ],
            [
              "Trazabilidad",
              "El problema principal es no poder explicar de dónde sale un dato o un resultado.",
            ],
          ]),
      }),

    "solution-web-audit-scoring-automation":
      Object.freeze({
        opening:
          "Sí, aquí el reto está en convertir una revisión manual de muchas webs en un proceso repetible.",
        benefit:
          "Se puede plantear una recogida estructurada de información pública, aplicar reglas de evaluación y comparar resultados sin revisar cada web desde cero.",
        question:
          "¿Qué necesitas obtener de esas webs: datos concretos, una puntuación o ambas cosas?",
        replies:
          Object.freeze([
            [
              "Datos concretos",
              "Necesito recopilar automáticamente datos concretos de muchas webs.",
            ],
            [
              "Scoring",
              "Necesito evaluar muchas webs con criterios y obtener una puntuación comparable.",
            ],
            [
              "Ambas",
              "Necesito recopilar datos de muchas webs y después aplicar un scoring.",
            ],
          ]),
      }),

    "solution-financial-analysis-monitoring":
      Object.freeze({
        opening:
          "Sí, se puede trabajar la parte de datos y seguimiento sin convertirlo en asesoramiento financiero.",
        benefit:
          "El valor estaría en ordenar las fuentes, comparar métricas y visualizar cambios de forma consistente para facilitar tu propio análisis.",
        question:
          "¿Qué necesitas principalmente: seguimiento, comparación entre activos o un dashboard de control?",
        replies:
          Object.freeze([
            [
              "Seguimiento",
              "Quiero hacer seguimiento periódico de métricas financieras y cambios relevantes.",
            ],
            [
              "Comparar activos",
              "Quiero comparar activos con métricas homogéneas sin recibir una recomendación de inversión.",
            ],
            [
              "Dashboard",
              "Quiero un dashboard para visualizar y controlar datos financieros.",
            ],
          ]),
      }),

    "solution-ai-opportunity-assessment":
      Object.freeze({
        opening:
          "Sí, pero aquí empezaría por el proceso, no por la IA.",
        benefit:
          "Primero conviene localizar una tarea concreta donde la IA pueda ahorrar tiempo, clasificar información, resumir, extraer datos o asistir una decisión; después se valora si realmente compensa usarla.",
        question:
          "¿Dónde te gustaría probar IA: documentos, atención y seguimiento, análisis de datos o todavía no lo tienes claro?",
        replies:
          Object.freeze([
            [
              "Documentos",
              "Quiero usar IA para leer, clasificar o extraer información de documentos.",
            ],
            [
              "Seguimiento",
              "Quiero automatizar atención, respuestas o seguimiento con IA.",
            ],
            [
              "Datos",
              "Quiero aplicar IA al análisis de datos para encontrar información útil.",
            ],
            [
              "No lo sé aún",
              "Quiero aplicar IA, pero no sé dónde tendría sentido.",
            ],
          ]),
      }),
  });


function toneLead(tone) {
  switch (tone) {
    case CONVERSATION_TONE.FRUSTRATED:
      return "Aquí ya tenemos algo concreto que atacar.";

    case CONVERSATION_TONE.UNCERTAIN:
      return "Aquí ya podemos bajar a un problema concreto.";

    default:
      return "";
  }
}


function problemProfile(flow) {
  const problemId =
    flow?.problem?.id ??
    null;

  const solutionId =
    flow?.solutions?.[0]?.id ??
    null;

  return (
    NAT_H2_PROBLEM_PROFILES[problemId] ??
    NAT_H2_SOLUTION_PROFILES[solutionId] ??
    Object.freeze({
      opening:
        `Por lo que cuentas, el problema parece estar en ${lowercaseInitial(flow.problem.title)}.`,
      benefit:
        "Antes de elegir una herramienta, conviene separar qué parte es repetitiva, qué información entra y qué resultado necesitas obtener.",
      question:
        getKnowledgeFact(
          flow.problem,
          "clarification-questions",
        )?.value?.[0] ??
        "¿Qué paso del proceso te consume más tiempo ahora?",
      replies:
        Object.freeze([]),
    })
  );
}


function conciseEvidenceSentence(flow) {
  const project =
    flow?.projectExamples?.[0] ??
    null;

  if (project) {
    return (
      `Hay un proyecto del portfolio que comparte parte de este problema: ${project.title}. ` +
      "No significa que tu situación sea idéntica, pero sí que Víctor ha trabajado con problemas relacionados."
    );
  }

  if (flow?.services?.length > 0) {
    return (
      "Este tipo de trabajo sí está dentro de los servicios publicados de Víctor, " +
      "pero el enfoque concreto depende de tus datos y del proceso real."
    );
  }

  return "";
}


function problemQuickReplies(flow, profile) {
  return (profile.replies ?? [])
    .map(
      ([label, answer], index) =>
        createAnswerQuickReply({
          id:
            `qr-problem-${flow.problem.id}-${index + 1}`,
          label,
          answer,
        }),
    )
    .filter(Boolean);
}


export function composeProblemConversationParts(
  flow,
  analysis = null,
) {
  if (!flow?.problem) {
    return null;
  }

  const profile =
    problemProfile(flow);

  const lead =
    toneLead(
      analysis?.tone?.tone ??
      null,
    );

  const opening =
    [lead, profile.opening]
      .filter(Boolean)
      .join(" ");

  return Object.freeze({
    opening,
    benefit:
      profile.benefit,
    evidence:
      conciseEvidenceSentence(flow),
    question:
      profile.question,
    quickReplies:
      Object.freeze(
        problemQuickReplies(
          flow,
          profile,
        ),
      ),
  });
}


/* ============================================================
 * NATURAL RESPONSE
 * ============================================================
 */

export function composeProblemSolutionServiceNaturalText(
  flow,
  analysis = null,
) {
  const parts =
    composeProblemConversationParts(
      flow,
      analysis,
    );

  if (!parts) {
    return "";
  }

  return [
    parts.opening,
    parts.benefit,
    parts.evidence,
    parts.question,
  ]
    .filter(Boolean)
    .join(" " );
}



/* ============================================================
 * DIAGNOSTIC ACTION
 * ============================================================
 */

function buildDiagnosticAction() {
  const diagnostic =
    getKnowledgeById(
      PROBLEM_FLOW_TARGET
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
      "action-problem-flow-diagnostic",

    type:
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,

    label:
      "Analizar mi caso",

    target:
      PROBLEM_FLOW_TARGET
        .DIAGNOSTIC,

    priority:
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,
  };
}


/* ============================================================
 * EVIDENCE TRACE
 * ============================================================
 */

function buildKnowledgeIds(
  flow,
) {
  return uniqueStrings([
    flow.problem.id,

    ...flow.solutions.map(
      (solution) =>
        solution.id,
    ),

    ...flow.services.map(
      (service) =>
        service.id,
    ),

    ...flow.projectExamples.map(
      (project) =>
        project.id,
    ),
  ]);
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeProblemSolutionServiceResponse(
  {
    userText,
    analysis = null,
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


  const flow =
    resolveProblemSolutionServiceFlow({
      userText:
        text,
    });


  if (!flow) {
    return null;
  }


  const conversationParts =
    composeProblemConversationParts(
      flow,
      analysis,
    );


  if (!conversationParts) {
    return null;
  }


  const action =
    buildDiagnosticAction();


  if (!action) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  const solutionIds =
    flow.solutions.map(
      (solution) =>
        solution.id,
    );


  const serviceIds =
    flow.services.map(
      (service) =>
        service.id,
    );


  return createResponseEnvelope({
    id:
      `response-problem-flow-${flow.problem.id}`,

    kind:
      RESPONSE_KIND.DISCOVERY,

    outcome:
      RESPONSE_OUTCOME.QUALIFIED,

    intent,

    messages: [
      {
        id:
          `msg-problem-flow-${flow.problem.id}-opening`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE.EXPLANATION,

        text:
          [
            conversationParts.opening,
            conversationParts.benefit,
          ]
            .filter(Boolean)
            .join(" "),
      },
      ...(
        conversationParts.evidence
          ? [{
              id:
                `msg-problem-flow-${flow.problem.id}-evidence`,

              purpose:
                RESPONSE_MESSAGE_PURPOSE.EXPLANATION,

              text:
                conversationParts.evidence,
            }]
          : []
      ),
      {
        id:
          `msg-problem-flow-${flow.problem.id}-question`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE.QUESTION,

        text:
          conversationParts.question,
      },
    ],

    quickReplies:
      conversationParts.quickReplies,

    actions: [
      action,
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        true,

      variationFamily:
        flow.mode,

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE.REQUIRED,

      knowledgeIds:
        buildKnowledgeIds(
          flow,
        ),

      factIds:
        collectRelevantFactIds(
          flow.solutions,
          flow.services,
        ),

      qualificationReasons: [
        flow.mode,
      ],
    },

    safety: {
      mustQualify:
        true,

      commercialRedirect:
        false,

      allowInference:
        false,

      forbiddenClaims:
        collectForbiddenClaims(
          flow.solutions,
          flow.services,
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

      problemId:
        flow.problem.id,

      solutionIds,

      serviceIds,

      responseTemplateId:
        flow.mode,
    },
  });
}