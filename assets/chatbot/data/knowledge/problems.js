import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  FACT_VALUE_TYPE,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
  TEMPORAL_STATUS,
} from "./constants.js";


/* ============================================================
 * HELPERS
 * ============================================================
 */

function freezeFact(fact) {
  return Object.freeze({
    ...fact,

    evidence: Object.freeze(
      fact.evidence.map(
        (evidence) =>
          Object.freeze({
            ...evidence,

            sourceIds: Object.freeze([
              ...evidence.sourceIds,
            ]),
          }),
      ),
    ),

    sources: Object.freeze([
      ...fact.sources,
    ]),

    temporal: Object.freeze({
      ...fact.temporal,
    }),
  });
}


function freezeItem(item) {
  return Object.freeze({
    ...item,

    aliases: Object.freeze([
      ...item.aliases,
    ]),

    facts: Object.freeze(
      item.facts.map(
        freezeFact,
      ),
    ),

    relationships:
      Object.freeze([]),

    sources:
      Object.freeze([
        ...item.sources,
      ]),

    temporal:
      Object.freeze({
        ...item.temporal,
      }),

    coverage:
      Object.freeze({
        ...item.coverage,
      }),

    answerPolicy:
      Object.freeze({
        ...item.answerPolicy,

        forbiddenClaims:
          Object.freeze([
            ...item.answerPolicy
              .forbiddenClaims,
          ]),
      }),

    limitations:
      Object.freeze(
        item.limitations.map(
          (limitation) =>
            Object.freeze({
              ...limitation,
            }),
        ),
      ),

    metadata:
      Object.freeze({
        ...item.metadata,
      }),
  });
}


function createProblem({
  id,
  title,
  aliases,
  summary,
  symptoms,
  signals,
  capabilitiesNeeded,
  objectives,
  clarificationQuestions = [],
  sources,
  limitations = [],
}) {
  function fact(
    suffix,
    key,
    value,
  ) {
    return {
      id:
        `${id}-fact-${suffix}`,

      key,

      value,

      valueType:
        FACT_VALUE_TYPE.STRING_LIST,

      status:
        CLAIM_STATUS.DERIVED,

      derivedFrom:
        [
          `${id}-fact-base`,
        ],

      evidence: [
        {
          strength:
            EVIDENCE_STRENGTH.MODERATE,

          type:
            "problem-pattern",

          sourceIds:
            sources,

          note:
            "Patrón de problema derivado de capacidades y casos documentados.",
        },
      ],

      sources: [],

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom: null,
        validTo: null,
      },
    };
  }

  const baseFact = {
    id:
      `${id}-fact-base`,

    key:
      "problem-definition",

    value:
      summary,

    valueType:
      FACT_VALUE_TYPE.STRING,

    status:
      CLAIM_STATUS.DERIVED,

    derivedFrom: [
      `${id}-source-pattern`,
    ],

    evidence: [
      {
        strength:
          EVIDENCE_STRENGTH.MODERATE,

        type:
          "problem-pattern",

        sourceIds:
          sources,

        note:
          "Problema modelado a partir de experiencia, proyectos y necesidades recurrentes cubiertas por el portfolio.",
      },
    ],

    sources: [],

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        TEMPORAL_STATUS.CURRENT,

      validFrom: null,
      validTo: null,
    },
  };

  /*
   * El identificador `${id}-source-pattern` no representa una entidad
   * externa. La integridad semántica de derivedFrom se endurecerá en K8.
   * Para evitar una referencia artificial, sustituimos el status del
   * fact base por USER_CONFIRMED.
   */
  baseFact.status =
    CLAIM_STATUS.USER_CONFIRMED;

  delete baseFact.derivedFrom;

  baseFact.sources = [
    ...sources,
  ];

  return freezeItem({
    id,

    type:
      KNOWLEDGE_TYPE.PROBLEM,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      baseFact,

      fact(
        "symptoms",
        "symptoms",
        symptoms,
      ),

      fact(
        "signals",
        "signals",
        signals,
      ),

      fact(
        "capabilities-needed",
        "capabilities-needed",
        capabilitiesNeeded,
      ),

      fact(
        "objectives",
        "objectives",
        objectives,
      ),

      fact(
        "clarification-questions",
        "clarification-questions",
        clarificationQuestions,
      ),
    ],

    relationships: [],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        TEMPORAL_STATUS.CURRENT,

      validFrom: null,
      validTo: null,
    },

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,

      canRecommend: true,

      canProvideEvidence: true,

      canNavigate: false,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 2,

      allowInference: true,

      allowRecommendation: true,

      preferredDepth:
        ANSWER_DEPTH.MEDIUM,

      forbiddenClaims: [
        "guaranteed-solution",
        "guaranteed-roi",
        "guaranteed-feasibility",
        "automatic-price",
        "automatic-deadline",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.QUALIFICATION,

        claim:
          "Detectar un patrón de problema no demuestra por sí solo la viabilidad técnica o comercial de una solución.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "problem",
    },
  });
}


/* ============================================================
 * PROBLEMS
 * ============================================================
 */

export const problemKnowledge =
  Object.freeze([

    createProblem({
      id:
        "problem-manual-data-consolidation",

      title:
        "Consolidación manual de datos",

      aliases: [
        "consolidar datos manualmente",
        "unir datos a mano",
        "juntar información manualmente",
        "junto excel manualmente",
        "juntar excel manualmente",
        "juntar varios excel",
        "consolidar varios excel",
      ],

      summary:
        "Información distribuida que debe combinarse manualmente antes de poder analizarla o reportarla.",

      symptoms: [
        "copiar y pegar datos",
        "unir archivos manualmente",
        "consolidar información cada semana",
        "combinar múltiples fuentes",
      ],

      signals: [
        "muchos excel",
        "varios archivos",
        "copiar pegar",
        "consolidar",
        "unir datos",
      ],

      capabilitiesNeeded: [
        "capability-data-consolidation",
        "capability-data-transformation",
        "capability-process-automation",
      ],

      objectives: [
        "reduce-manual-work",
        "single-data-source",
        "repeatable-process",
      ],

      sources: [
        "source-project-business-cost-intelligence",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-multiple-excel-files",

      title:
        "Demasiados archivos Excel",

      aliases: [
        "muchos excel",
        "muchos archivos excel",
        "varios excel",
      ],

      summary:
        "Proceso basado en múltiples libros Excel cuya combinación y mantenimiento genera tiempo, errores o fragilidad.",

      symptoms: [
        "decenas de archivos excel",
        "hojas separadas",
        "copiar datos entre libros",
        "versiones diferentes",
      ],

      signals: [
        "excel",
        "xlsx",
        "varios excel",
        "muchos excel",
        "hojas",
      ],

      capabilitiesNeeded: [
        "capability-data-consolidation",
        "capability-data-quality",
        "capability-process-automation",
      ],

      objectives: [
        "simplify-process",
        "reduce-errors",
        "centralize-data",
      ],

      sources: [
        "source-project-digital-competency-evaluation",
        "source-portfolio-solutions",
      ],
    }),


    createProblem({
      id:
        "problem-repetitive-reporting",

      title:
        "Reporting repetitivo",

      aliases: [
        "informes repetitivos",
        "reporting manual",
        "rehacer informes",
        "actualizar informes a mano",
        "actualizo informes a mano",
        "actualizar dashboards a mano",
        "actualizo dashboards a mano",
      ],

      summary:
        "Informes que requieren repetir periódicamente los mismos pasos de preparación, cálculo o actualización.",

      symptoms: [
        "rehacer informe cada semana",
        "rehacer informe cada mes",
        "actualización manual",
        "mismos pasos repetidos",
      ],

      signals: [
        "informe",
        "reporting",
        "cada semana",
        "cada mes",
        "actualizar",
      ],

      capabilitiesNeeded: [
        "capability-reporting-automation",
        "capability-data-transformation",
        "capability-dashboarding",
      ],

      objectives: [
        "automate-reporting",
        "reduce-time",
        "repeatable-refresh",
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
      ],
    }),


    createProblem({
      id:
        "problem-manual-dashboard-refresh",

      title:
        "Actualización manual de dashboards",

      aliases: [
        "actualizar dashboard manualmente",
        "actualizar power bi a mano",
        "refresh manual",
      ],

      summary:
        "Cuadros de mando cuya actualización depende de tareas manuales repetitivas.",

      symptoms: [
        "actualizar power bi manualmente",
        "preparar datos antes del dashboard",
        "refrescar informes a mano",
      ],

      signals: [
        "power bi",
        "dashboard",
        "refresh",
        "actualizar a mano",
      ],

      capabilitiesNeeded: [
        "capability-reporting-automation",
        "capability-data-transformation",
        "capability-business-intelligence",
      ],

      objectives: [
        "automate-refresh",
        "reduce-manual-work",
        "improve-reporting",
      ],

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-solutions",
      ],
    }),


    createProblem({
      id:
        "problem-fragile-excel-model",

      title:
        "Modelo Excel complejo o frágil",

      aliases: [
        "excel complejo",
        "excel frágil",
        "excel difícil de mantener",
      ],

      summary:
        "Libro Excel con demasiada lógica, dependencias o reglas difíciles de mantener, validar o explicar.",

      symptoms: [
        "fórmulas difíciles de mantener",
        "errores al cambiar datos",
        "muchas reglas",
        "modelo difícil de entender",
      ],

      signals: [
        "excel complejo",
        "muchas formulas",
        "reglas",
        "pesos",
        "errores excel",
      ],

      capabilitiesNeeded: [
        "capability-scoring-and-rules",
        "capability-hierarchical-modeling",
        "capability-testing",
        "capability-data-quality",
      ],

      objectives: [
        "make-model-robust",
        "improve-traceability",
        "reduce-errors",
      ],

      sources: [
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-scoring-rules",

      title:
        "Reglas y scoring manual",

      aliases: [
        "reglas de scoring",
        "puntuación manual",
        "criterios de evaluación",
      ],

      summary:
        "Evaluación basada en criterios, reglas o puntuaciones que necesita convertirse en lógica reproducible.",

      symptoms: [
        "calcular puntuaciones manualmente",
        "muchos criterios",
        "reglas condicionales",
        "evaluación subjetiva o difícil de repetir",
      ],

      signals: [
        "scoring",
        "puntuacion",
        "criterios",
        "reglas",
        "evaluacion",
      ],

      capabilitiesNeeded: [
        "capability-scoring-and-rules",
        "capability-testing",
        "capability-data-quality",
      ],

      objectives: [
        "automate-scoring",
        "make-rules-reproducible",
        "validate-results",
      ],

      sources: [
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-complex-weighted-evaluation",

      title:
        "Evaluación jerárquica con pesos",

      aliases: [
        "evaluación con pesos",
        "modelo jerárquico",
        "criterios ponderados",
      ],

      summary:
        "Evaluación con categorías, subcategorías, indicadores y pesos que requiere agregación jerárquica controlada.",

      symptoms: [
        "criterios con distintos pesos",
        "subcompetencias",
        "categorías jerárquicas",
        "agregación ponderada",
      ],

      signals: [
        "pesos",
        "ponderacion",
        "jerarquia",
        "subcompetencias",
        "indicadores",
      ],

      capabilitiesNeeded: [
        "capability-hierarchical-modeling",
        "capability-scoring-and-rules",
        "capability-testing",
      ],

      objectives: [
        "weighted-evaluation",
        "hierarchical-scoring",
        "traceable-results",
      ],

      sources: [
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-manual-pdf-extraction",

      title:
        "Extracción manual de datos de PDF",

      aliases: [
        "extraer datos de pdf",
        "leer facturas pdf",
        "copiar datos de facturas",
      ],

      summary:
        "Datos contenidos en documentos PDF que actualmente se transcriben o procesan manualmente.",

      symptoms: [
        "leer facturas una a una",
        "copiar importes desde pdf",
        "extraer campos manualmente",
        "muchos documentos mensuales",
      ],

      signals: [
        "pdf",
        "facturas",
        "documentos",
        "extraer campos",
      ],

      capabilitiesNeeded: [
        "capability-document-data-extraction",
        "capability-data-transformation",
        "capability-process-automation",
      ],

      objectives: [
        "extract-structured-data",
        "reduce-manual-entry",
        "prepare-analysis",
      ],

      clarificationQuestions: [
        "¿Los PDF contienen texto digital o son documentos escaneados?",
        "¿Los documentos mantienen formatos similares?",
        "¿Qué campos necesitas extraer?",
      ],

      sources: [
        "source-project-business-cost-intelligence",
      ],
    }),


    createProblem({
      id:
        "problem-unstructured-documents",

      title:
        "Documentos difíciles de estructurar",

      aliases: [
        "documentos no estructurados",
        "muchos documentos diferentes",
        "analizar documentos",
      ],

      summary:
        "Información relevante distribuida en documentos heterogéneos cuyo contenido no está preparado para análisis directo.",

      symptoms: [
        "formatos diferentes",
        "documentos largos",
        "contenido variable",
        "información difícil de localizar",
      ],

      signals: [
        "documentos",
        "contratos",
        "pdf",
        "formatos distintos",
      ],

      capabilitiesNeeded: [
        "capability-document-data-extraction",
        "capability-ai-assisted-analysis",
      ],

      objectives: [
        "structure-information",
        "reduce-document-review",
      ],

      clarificationQuestions: [
        "¿Necesitas extraer campos concretos o interpretar el significado del documento?",
        "¿Qué tipo de documentos son?",
      ],

      sources: [
        "source-project-business-cost-intelligence",
        "source-project-auditoria-digital",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Extracción estructurada de datos y comprensión semántica profunda de documentos son problemas distintos.",
        },
      ],
    }),


    createProblem({
      id:
        "problem-data-quality",

      title:
        "Problemas de calidad de datos",

      aliases: [
        "datos incorrectos",
        "datos inconsistentes",
        "problemas de calidad",
      ],

      summary:
        "Información con inconsistencias, errores o falta de validaciones que reduce la confianza en los resultados.",

      symptoms: [
        "datos que no cuadran",
        "errores de formato",
        "duplicados",
        "resultados inconsistentes",
      ],

      signals: [
        "calidad",
        "errores",
        "duplicados",
        "inconsistencias",
      ],

      capabilitiesNeeded: [
        "capability-data-quality",
        "capability-testing",
        "capability-data-transformation",
      ],

      objectives: [
        "improve-reliability",
        "detect-errors",
        "validate-data",
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-no-data-traceability",

      title:
        "Falta de trazabilidad",

      aliases: [
        "sin trazabilidad",
        "no sé de dónde salen los datos",
        "no sabemos cómo se calcula",
      ],

      summary:
        "Resultados o indicadores cuyo origen y transformación no pueden explicarse fácilmente.",

      symptoms: [
        "no se sabe de dónde sale un dato",
        "cálculos difíciles de seguir",
        "no se puede reproducir el resultado",
      ],

      signals: [
        "trazabilidad",
        "origen del dato",
        "explicar calculo",
        "auditoria",
      ],

      capabilitiesNeeded: [
        "capability-data-traceability",
        "capability-data-quality",
        "capability-testing",
      ],

      objectives: [
        "explain-results",
        "improve-control",
        "make-process-auditable",
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createProblem({
      id:
        "problem-web-data-collection",

      title:
        "Recopilación manual de datos web",

      aliases: [
        "recoger datos de webs",
        "scraping",
        "revisar cientos de webs",
      ],

      summary:
        "Necesidad de revisar numerosas páginas web y recopilar indicadores o información de forma repetitiva.",

      symptoms: [
        "revisar webs una a una",
        "copiar información pública",
        "analizar cientos de páginas",
      ],

      signals: [
        "webs",
        "paginas web",
        "scraping",
        "sitios web",
      ],

      capabilitiesNeeded: [
        "capability-web-data-collection",
        "capability-data-transformation",
        "capability-process-automation",
      ],

      objectives: [
        "automate-web-collection",
        "structure-public-data",
        "reduce-manual-review",
      ],

      clarificationQuestions: [
        "¿La información es pública y accesible sin credenciales?",
        "¿Qué indicadores necesitas obtener?",
      ],

      sources: [
        "source-project-auditoria-digital",
      ],
    }),


    createProblem({
      id:
        "problem-web-scoring-audit",

      title:
        "Auditoría o scoring de muchas webs",

      aliases: [
        "auditar webs",
        "puntuar webs",
        "evaluar paginas web",
      ],

      summary:
        "Necesidad de recopilar indicadores de muchas páginas web y transformarlos en una evaluación o scoring comparable.",

      symptoms: [
        "revisar cientos de webs",
        "medir indicadores",
        "asignar puntuaciones",
        "comparar establecimientos o empresas",
      ],

      signals: [
        "auditoria web",
        "scoring web",
        "indicadores web",
        "madurez digital",
      ],

      capabilitiesNeeded: [
        "capability-web-data-collection",
        "capability-scoring-and-rules",
        "capability-data-analysis",
        "capability-dashboarding",
      ],

      objectives: [
        "automated-audit",
        "comparable-scoring",
        "decision-support",
      ],

      sources: [
        "source-project-auditoria-digital",
      ],
    }),


    createProblem({
      id:
        "problem-financial-analysis",

      title:
        "Análisis de datos financieros",

      aliases: [
        "analizar inversiones",
        "análisis financiero",
        "analizar dividendos",
        "riesgo y valoración",
      ],

      summary:
        "Necesidad de estructurar y analizar información financiera para seguimiento, comparación o apoyo a decisiones.",

      symptoms: [
        "comparar activos",
        "analizar dividendos",
        "medir riesgo",
        "evaluar valoración",
        "hacer backtesting",
      ],

      signals: [
        "acciones",
        "dividendos",
        "riesgo",
        "valoracion",
        "backtesting",
      ],

      capabilitiesNeeded: [
        "capability-financial-analysis",
        "capability-data-analysis",
        "capability-dashboarding",
      ],

      objectives: [
        "financial-monitoring",
        "decision-support",
        "risk-analysis",
      ],

      sources: [
        "source-project-investment-dashboard",
        "source-user-confirmed-career",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "Este problema puede analizarse desde datos y herramientas, pero no debe derivar en recomendaciones personalizadas de compra o venta.",
        },
      ],
    }),


    createProblem({
      id:
        "problem-ai-process-opportunity",

      title:
        "No saber dónde aplicar IA",

      aliases: [
          "quiero usar ia",
          "quiero incorporar inteligencia artificial",
          "incorporar inteligencia artificial",
          "dónde aplicar ia",
      ],

      summary:
        "Interés por incorporar IA sin haber identificado todavía un proceso, problema, dato u objetivo suficientemente concreto.",

      symptoms: [
        "queremos usar ia pero no sabemos dónde",
        "buscar casos de uso",
        "automatizar algo con ia",
      ],

      signals: [
        "ia",
        "inteligencia artificial",
        "copilot",
        "agente",
        "ai",
      ],

      capabilitiesNeeded: [
        "capability-requirements-analysis",
        "capability-ai-assisted-analysis",
        "capability-process-automation",
      ],

      objectives: [
        "identify-ai-use-case",
        "evaluate-feasibility",
      ],

      clarificationQuestions: [
        "¿Qué proceso te consume más tiempo?",
        "¿Qué información entra y qué resultado necesitas obtener?",
        "¿Dónde existe hoy más trabajo manual o repetitivo?",
      ],

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-auditoria-digital",
      ],
    }),


    createProblem({
      id:
        "problem-repetitive-copy-paste",

      title:
        "Copiar y pegar información repetidamente",

      aliases: [
        "copiar y pegar",
        "copy paste",
        "copio datos todos los días",
      ],

      summary:
        "Proceso donde una persona mueve repetidamente información entre archivos, aplicaciones o informes.",

      symptoms: [
        "copiar datos entre archivos",
        "pegar información en otra herramienta",
        "repetir los mismos pasos",
      ],

      signals: [
        "copiar",
        "pegar",
        "copy paste",
        "manual",
        "repetitivo",
      ],

      capabilitiesNeeded: [
        "capability-process-automation",
        "capability-data-transformation",
        "capability-data-consolidation",
      ],

      objectives: [
        "reduce-manual-work",
        "reduce-errors",
        "automate-process",
      ],

      sources: [
        "source-portfolio-solutions",
        "source-project-business-cost-intelligence",
      ],
    }),


    createProblem({
      id:
        "problem-manual-data-transformation",

      title:
        "Transformación manual de datos",

      aliases: [
        "limpiar datos a mano",
        "transformar datos manualmente",
        "preparar datos manualmente",
      ],

      summary:
        "Datos que necesitan limpiezas y transformaciones repetidas antes de cada análisis o informe.",

      symptoms: [
        "cambiar formatos manualmente",
        "eliminar columnas cada vez",
        "repetir limpiezas",
        "preparar datos desde cero",
      ],

      signals: [
        "limpiar datos",
        "transformar",
        "power query",
        "preparar datos",
      ],

      capabilitiesNeeded: [
        "capability-data-transformation",
        "capability-process-automation",
        "capability-data-quality",
      ],

      objectives: [
        "repeatable-transformation",
        "reduce-errors",
        "automate-data-preparation",
      ],

      sources: [
        "source-dataverso-power-query-intro",
        "source-user-confirmed-career",
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const problemKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      problemKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getProblemById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    problemKnowledgeById[id] ??
    null
  );
}


export function getProblemFact(
  problem,
  key,
) {
  if (
    !problem ||
    !Array.isArray(
      problem.facts,
    )
  ) {
    return null;
  }

  return (
    problem.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}


export function getProblemCapabilities(
  problemId,
) {
  const problem =
    getProblemById(
      problemId,
    );

  if (!problem) {
    return [];
  }

  return (
    getProblemFact(
      problem,
      "capabilities-needed",
    )?.value ?? []
  );
}