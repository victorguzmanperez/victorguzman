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
  RELATION_TYPE,
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
      (fact.evidence ?? []).map(
        (evidence) =>
          Object.freeze({
            ...evidence,
            sourceIds: Object.freeze([
              ...(evidence.sourceIds ?? []),
            ]),
          }),
      ),
    ),

    sources: Object.freeze([
      ...(fact.sources ?? []),
    ]),

    derivedFrom:
      fact.derivedFrom === undefined
        ? undefined
        : Object.freeze([
            ...fact.derivedFrom,
          ]),

    temporal:
      fact.temporal
        ? Object.freeze({
            ...fact.temporal,
          })
        : undefined,
  });
}


function freezeRelationship(
  relationship,
) {
  return Object.freeze({
    ...relationship,
    sources: Object.freeze([
      ...(relationship.sources ?? []),
    ]),
  });
}


function freezeKnowledgeItem(item) {
  return Object.freeze({
    ...item,

    aliases: Object.freeze([
      ...(item.aliases ?? []),
    ]),

    facts: Object.freeze(
      (item.facts ?? []).map(
        freezeFact,
      ),
    ),

    relationships: Object.freeze(
      (item.relationships ?? []).map(
        freezeRelationship,
      ),
    ),

    sources: Object.freeze([
      ...(item.sources ?? []),
    ]),

    temporal: Object.freeze({
      ...item.temporal,
    }),

    coverage: Object.freeze({
      ...item.coverage,
    }),

    answerPolicy: Object.freeze({
      ...item.answerPolicy,
      forbiddenClaims: Object.freeze([
        ...(
          item.answerPolicy
            ?.forbiddenClaims ?? []
        ),
      ]),
    }),

    limitations: Object.freeze(
      (item.limitations ?? []).map(
        (limitation) =>
          Object.freeze({
            ...limitation,
          }),
      ),
    ),

    metadata: Object.freeze({
      ...(item.metadata ?? {}),
    }),
  });
}


function createSolution({
  id,
  title,
  aliases,
  summary,
  problemsAddressed,
  capabilitiesRequired,
  technologies,
  objectives,
  businessAreas,
  processCharacteristics,
  clarificationQuestions,
  services = [],
  sources,
  limitations = [],
}) {
  const temporal = {
    status:
      TEMPORAL_STATUS.CURRENT,
    validFrom: null,
    validTo: null,
  };

  const baseFactId =
    `${id}-fact-definition`;

  const evidence = (
    type,
    strength =
      EVIDENCE_STRENGTH.MODERATE,
  ) => [
    {
      strength,
      type,
      sourceIds: sources,
      note:
        "Patrón de solución modelado a partir de conocimiento autorizado, capacidades respaldadas y casos documentados del portfolio.",
    },
  ];

  const derivedFact = (
    suffix,
    key,
    value,
  ) => ({
    id:
      `${id}-fact-${suffix}`,
    key,
    value,
    valueType:
      FACT_VALUE_TYPE.STRING_LIST,
    status:
      CLAIM_STATUS.DERIVED,
    derivedFrom: [
      baseFactId,
    ],
    evidence:
      evidence(
        "solution-pattern",
      ),
    sources: [],
    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,
    temporal,
  });

  const relationship = (
    type,
    target,
    strength,
    relationSources = sources,
  ) => ({
    type,
    target,
    strength,
    sources: relationSources,
  });

  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.SOLUTION,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      {
        id:
          baseFactId,
        key:
          "solution-definition",
        value:
          summary,
        valueType:
          FACT_VALUE_TYPE.STRING,
        status:
          CLAIM_STATUS.USER_CONFIRMED,
        evidence:
          evidence(
            "solution-definition",
          ),
        sources,
        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,
        temporal,
      },

      derivedFact(
        "problems-addressed",
        "problems-addressed",
        problemsAddressed,
      ),

      derivedFact(
        "capabilities-required",
        "capabilities-required",
        capabilitiesRequired,
      ),

      derivedFact(
        "technologies",
        "technologies",
        technologies,
      ),

      derivedFact(
        "objectives",
        "objectives",
        objectives,
      ),

      derivedFact(
        "business-areas",
        "business-areas",
        businessAreas,
      ),

      derivedFact(
        "process-characteristics",
        "process-characteristics",
        processCharacteristics,
      ),

      derivedFact(
        "clarification-questions",
        "clarification-questions",
        clarificationQuestions,
      ),
    ],

    relationships: [
      ...problemsAddressed.map(
        (problemId) =>
          relationship(
            RELATION_TYPE.ADDRESSES,
            problemId,
            EVIDENCE_STRENGTH.STRONG,
          ),
      ),

      ...capabilitiesRequired.map(
        (capabilityId) =>
          relationship(
            RELATION_TYPE.REQUIRES,
            capabilityId,
            EVIDENCE_STRENGTH.STRONG,
          ),
      ),

      ...technologies.map(
        (technologyId) =>
          relationship(
            RELATION_TYPE.USES,
            technologyId,
            EVIDENCE_STRENGTH.MODERATE,
          ),
      ),
      ...services.map(
        (serviceId) =>
          relationship(
            RELATION_TYPE.IMPLEMENTED_BY,
            serviceId,
            EVIDENCE_STRENGTH.STRONG,
            [
              "source-portfolio-home",
            ],
          ),
      ),


    ],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal,

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
        "guaranteed-feasibility",
        "guaranteed-result",
        "guaranteed-roi",
        "automatic-price",
        "automatic-deadline",
        "automatic-service-fit",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.QUALIFICATION,
        claim:
          "Una solución relacionada con el problema no demuestra por sí sola que sea técnicamente viable para el caso concreto.",
      },
      {
        type:
          LIMITATION_TYPE.COMMERCIAL,
        claim:
          "La recomendación de una solución no implica presupuesto, plazo, disponibilidad ni compromiso de prestación.",
      },
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,
        claim:
          "Las tecnologías relacionadas representan opciones respaldadas para el patrón de solución, no una arquitectura obligatoria para todos los casos.",
      },
      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "solution",
    },
  });
}


/* ============================================================
 * SOLUTIONS
 * ============================================================
 */

export const solutionKnowledge =
  Object.freeze([
    createSolution({
      id:
        "solution-data-consolidation-automation",
      title:
        "Consolidación y automatización de datos",
      aliases: [
        "automatizar consolidación de datos",
        "unificar archivos",
        "centralizar datos",
        "automatizar excel",
      ],
      summary:
        "Centralización, transformación y automatización de información procedente de múltiples archivos o fuentes para reducir trabajo manual, errores y tareas repetitivas.",
      problemsAddressed: [
        "problem-manual-data-consolidation",
        "problem-multiple-excel-files",
        "problem-repetitive-copy-paste",
        "problem-manual-data-transformation",
      ],
      capabilitiesRequired: [
        "capability-data-consolidation",
        "capability-data-transformation",
        "capability-process-automation",
        "capability-data-quality",
      ],
      technologies: [
        "technology-power-query",
        "technology-excel",
        "technology-python",
        "technology-power-automate",
      ],
      objectives: [
        "reduce-manual-work",
        "centralize-data",
        "reduce-errors",
        "repeatable-process",
        "automate-process",
        "automate-data-preparation",
      ],
      businessAreas: [
        "data",
        "automation",
        "reporting",
      ],
      processCharacteristics: [
        "manual",
        "repetitive",
        "multi-source",
        "data-transformation",
      ],
      clarificationQuestions: [
        "¿Cuántos archivos o fuentes intervienen?",
        "¿Con qué frecuencia se realiza el proceso?",
        "¿Las fuentes mantienen una estructura estable?",
        "¿Qué resultado necesitas obtener al final del proceso?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-project-business-cost-intelligence",
        "source-project-digital-competency-evaluation",
        "source-user-confirmed-career",
        "source-dataverso-power-query-intro",
      ],
      services: [
        "service-data-process-automation",
      ],
    }),

    createSolution({
      id:
        "solution-reporting-dashboard-automation",
      title:
        "Automatización de reporting y dashboards",
      aliases: [
        "automatizar informes",
        "automatizar reporting",
        "automatizar power bi",
        "mejorar dashboards",
      ],
      summary:
        "Estructuración y automatización de la preparación, transformación y actualización de datos para reducir tareas manuales recurrentes en informes y cuadros de mando.",
      problemsAddressed: [
        "problem-repetitive-reporting",
        "problem-manual-dashboard-refresh",
      ],
      capabilitiesRequired: [
        "capability-reporting-automation",
        "capability-data-transformation",
        "capability-dashboarding",
        "capability-business-intelligence",
      ],
      technologies: [
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
        "technology-excel",
      ],
      objectives: [
        "automate-reporting",
        "reduce-time",
        "repeatable-refresh",
        "automate-refresh",
        "reduce-manual-work",
        "improve-reporting",
      ],
      businessAreas: [
        "reporting",
        "business-intelligence",
        "analytics",
      ],
      processCharacteristics: [
        "repetitive",
        "recurring",
        "reporting",
        "dashboard-refresh",
        "data-transformation",
      ],
      clarificationQuestions: [
        "¿Con qué frecuencia se prepara o actualiza el informe?",
        "¿Qué pasos se realizan hoy de forma manual?",
        "¿De qué fuentes proceden los datos?",
        "¿Quién utiliza el resultado y para qué decisión?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
        "source-dataverso-power-bi-guide",
        "source-dataverso-power-query-intro",
      ],
      services: [
        "service-business-intelligence-dashboards",
      ],
    }),

    createSolution({
      id:
        "solution-evaluation-scoring-model",
      title:
        "Modelos de evaluación y scoring trazables",
      aliases: [
        "modelo de evaluación",
        "modelo de scoring",
        "evaluación con pesos",
        "reglas de puntuación",
      ],
      summary:
        "Conversión de criterios, reglas, jerarquías y pesos en modelos de evaluación reproducibles, testeables y trazables.",
      problemsAddressed: [
        "problem-fragile-excel-model",
        "problem-scoring-rules",
        "problem-complex-weighted-evaluation",
      ],
      capabilitiesRequired: [
        "capability-scoring-and-rules",
        "capability-hierarchical-modeling",
        "capability-testing",
        "capability-data-quality",
        "capability-data-traceability",
      ],
      technologies: [
        "technology-excel",
        "technology-power-query",
      ],
      objectives: [
        "make-model-robust",
        "automate-scoring",
        "make-rules-reproducible",
        "weighted-evaluation",
        "hierarchical-scoring",
        "validate-results",
        "traceable-results",
      ],
      businessAreas: [
        "evaluation",
        "skills-assessment",
        "analytics",
      ],
      processCharacteristics: [
        "rule-based",
        "hierarchical",
        "weighted-model",
        "test-heavy",
        "excel-centric",
      ],
      clarificationQuestions: [
        "¿Qué niveles o jerarquías componen la evaluación?",
        "¿Qué criterios, reglas y pesos deben aplicarse?",
        "¿Cómo se valida actualmente que el resultado sea correcto?",
        "¿Necesitas poder explicar el origen de cada puntuación?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-project-digital-competency-evaluation",
      ],
      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,
          claim:
            "Los criterios, reglas y pesos deben estar suficientemente definidos para construir un modelo reproducible y validable.",
        },
      ],
      services: [
        "service-excel-business-models",
      ],
    }),

    createSolution({
      id:
        "solution-document-data-extraction",
      title:
        "Extracción estructurada de datos de documentos",
      aliases: [
        "extraer datos de pdf",
        "automatizar lectura de facturas",
        "estructurar documentos",
        "procesar documentos",
      ],
      summary:
        "Extracción, estructuración y preparación de información contenida en documentos digitales para reducir transcripción manual y facilitar su análisis posterior.",
      problemsAddressed: [
        "problem-manual-pdf-extraction",
        "problem-unstructured-documents",
      ],
      capabilitiesRequired: [
        "capability-document-data-extraction",
        "capability-data-transformation",
        "capability-process-automation",
        "capability-ai-assisted-analysis",
      ],
      technologies: [
        "technology-python",
        "technology-pandas",
      ],
      objectives: [
        "extract-structured-data",
        "reduce-manual-entry",
        "prepare-analysis",
        "structure-information",
        "reduce-document-review",
      ],
      businessAreas: [
        "documents",
        "data",
        "automation",
      ],
      processCharacteristics: [
        "document-heavy",
        "manual",
        "repetitive",
        "unstructured-input",
        "data-transformation",
      ],
      clarificationQuestions: [
        "¿Qué tipos de documentos necesitas procesar?",
        "¿Son documentos digitales o imágenes escaneadas?",
        "¿Mantienen una estructura parecida entre sí?",
        "¿Qué campos concretos necesitas extraer?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-project-business-cost-intelligence",
      ],
      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,
          claim:
            "La extracción estructurada depende del formato y consistencia de los documentos y no implica soporte universal para OCR o cualquier tipo documental.",
        },
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,
          claim:
            "Extraer campos de documentos y realizar comprensión semántica profunda son necesidades distintas y deben evaluarse por separado.",
        },
      ],
      services: [
        "service-data-process-automation",
        "service-ai-process-analysis",
      ],
    }),

    createSolution({
      id:
        "solution-data-quality-traceability",
      title:
        "Calidad, validación y trazabilidad de datos",
      aliases: [
        "mejorar calidad de datos",
        "validar datos",
        "trazabilidad de datos",
        "control de datos",
      ],
      summary:
        "Introducción de controles, validaciones y trazabilidad para detectar inconsistencias, explicar resultados y aumentar la confianza en los datos y modelos.",
      problemsAddressed: [
        "problem-data-quality",
        "problem-no-data-traceability",
      ],
      capabilitiesRequired: [
        "capability-data-quality",
        "capability-data-traceability",
        "capability-testing",
        "capability-data-transformation",
      ],
      technologies: [
        "technology-power-query",
        "technology-excel",
        "technology-python",
      ],
      objectives: [
        "improve-reliability",
        "detect-errors",
        "validate-data",
        "explain-results",
        "improve-control",
        "make-process-auditable",
      ],
      businessAreas: [
        "data",
        "quality-assurance",
        "analytics",
      ],
      processCharacteristics: [
        "validation-heavy",
        "traceability",
        "control",
        "data-transformation",
      ],
      clarificationQuestions: [
        "¿Qué errores o inconsistencias aparecen actualmente?",
        "¿En qué punto del proceso se detectan?",
        "¿Qué controles existen hoy?",
        "¿Necesitas explicar el origen y transformación de cada resultado?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
        "source-project-business-cost-intelligence",
      ],
      services: [
        "service-excel-business-models",
        "service-data-process-automation",
      ],
    }),

    createSolution({
      id:
        "solution-web-audit-scoring-automation",
      title:
        "Automatización de auditoría y scoring web",
      aliases: [
        "auditoría web automática",
        "scoring de webs",
        "recopilar datos web",
        "evaluar páginas web",
      ],
      summary:
        "Recopilación automatizada de información pública de múltiples webs, aplicación de reglas de scoring y presentación de resultados comparables para análisis y decisión.",
      problemsAddressed: [
        "problem-web-data-collection",
        "problem-web-scoring-audit",
        "problem-scoring-rules",
      ],
      capabilitiesRequired: [
        "capability-web-data-collection",
        "capability-scoring-and-rules",
        "capability-data-analysis",
        "capability-process-automation",
        "capability-dashboarding",
      ],
      technologies: [
        "technology-python",
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
        "technology-ai",
      ],
      objectives: [
        "automate-web-collection",
        "structure-public-data",
        "reduce-manual-review",
        "automated-audit",
        "comparable-scoring",
        "decision-support",
        "automate-scoring",
      ],
      businessAreas: [
        "digital-audit",
        "marketing",
        "analytics",
      ],
      processCharacteristics: [
        "web-scale",
        "repetitive",
        "rule-based",
        "public-data",
        "scoring",
        "web-scraping",
      ],
      clarificationQuestions: [
        "¿Cuántas webs necesitas revisar?",
        "¿La información necesaria es públicamente accesible?",
        "¿Qué indicadores deben recopilarse?",
        "¿Cómo deben calcularse o compararse las puntuaciones?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-project-auditoria-digital",
      ],
      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,
          claim:
            "La automatización depende de que la información sea accesible, de las condiciones de uso de las webs y de la estabilidad de su estructura.",
        },
      ],
      services: [],
    }),

    createSolution({
      id:
        "solution-financial-analysis-monitoring",
      title:
        "Análisis y monitorización de datos financieros",
      aliases: [
        "dashboard financiero",
        "análisis financiero con datos",
        "monitorización financiera",
        "análisis cuantitativo",
      ],
      summary:
        "Estructuración y análisis de datos financieros para seguimiento, comparación, riesgo y apoyo informativo a decisiones mediante modelos y cuadros de mando.",
      problemsAddressed: [
        "problem-financial-analysis",
      ],
      capabilitiesRequired: [
        "capability-financial-analysis",
        "capability-data-analysis",
        "capability-data-transformation",
        "capability-dashboarding",
        "capability-ai-assisted-analysis",
      ],
      technologies: [
        "technology-python",
        "technology-pandas",
        "technology-power-bi",
        "technology-ai",
      ],
      objectives: [
        "financial-monitoring",
        "risk-analysis",
        "decision-support",
        "portfolio-analysis",
      ],
      businessAreas: [
        "finance",
        "financial-markets",
        "investment",
      ],
      processCharacteristics: [
        "financial",
        "recurring",
        "multi-source",
        "model-driven",
        "quantitative-analysis",
      ],
      clarificationQuestions: [
        "¿Qué datos financieros necesitas analizar?",
        "¿Qué indicadores o riesgos quieres seguir?",
        "¿Con qué frecuencia deben actualizarse los datos?",
        "¿Qué decisión o seguimiento debe apoyar el resultado?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-project-investment-dashboard",
        "source-user-confirmed-career",
      ],
      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,
          claim:
            "Esta solución se limita al análisis, monitorización y apoyo informativo; no debe convertirse en asesoramiento financiero personalizado ni recomendaciones de compra o venta.",
        },
        {
          type:
            LIMITATION_TYPE.TEMPORAL,
          claim:
            "Parte de la evidencia de portfolio asociada a esta solución procede de un proyecto actualmente en desarrollo.",
        },
      ],
      services: [],
    }),

    createSolution({
      id:
        "solution-ai-opportunity-assessment",
      title:
        "Identificación y evaluación de oportunidades con IA",
      aliases: [
        "dónde aplicar ia",
        "casos de uso de ia",
        "evaluar oportunidad de ia",
        "incorporar ia a un proceso",
      ],
      summary:
        "Análisis del proceso, problema, datos y objetivo para identificar usos de IA con sentido y evaluar su encaje antes de proponer una automatización o implementación concreta.",
      problemsAddressed: [
        "problem-ai-process-opportunity",
      ],
      capabilitiesRequired: [
        "capability-requirements-analysis",
        "capability-ai-assisted-analysis",
        "capability-process-automation",
        "capability-business-technology-bridge",
      ],
      technologies: [
        "technology-ai",
        "technology-copilot",
      ],
      objectives: [
        "identify-ai-use-case",
        "evaluate-feasibility",
      ],
      businessAreas: [
        "artificial-intelligence",
        "automation",
        "process-analysis",
      ],
      processCharacteristics: [
        "discovery",
        "requirements-analysis",
        "feasibility-assessment",
        "process-oriented",
      ],
      clarificationQuestions: [
        "¿Qué proceso te consume más tiempo o genera más fricción?",
        "¿Qué información entra y qué resultado necesitas obtener?",
        "¿Qué parte del proceso es manual, repetitiva o difícil de escalar?",
        "¿Qué datos y herramientas están disponibles actualmente?",
      ],
      sources: [
        "source-portfolio-solutions",
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-auditoria-digital",
      ],
      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,
          claim:
            "El interés por utilizar IA no demuestra que la IA sea la mejor solución; primero debe evaluarse el proceso, los datos, las restricciones y alternativas más simples.",
        },
      ],
      services: [
        "service-ai-process-analysis",
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const solutionKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      solutionKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getSolutionById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    solutionKnowledgeById[id] ??
    null
  );
}


export function getSolutionFact(
  solution,
  key,
) {
  if (
    !solution ||
    !Array.isArray(
      solution.facts,
    )
  ) {
    return null;
  }

  return (
    solution.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}

/* ============================================================
 * RELATION INVERSE INDEXES
 * ============================================================
 */

function buildSolutionKnowledgeByRelationshipTarget(
  relationType,
) {
  const index = {};

  for (
    const solution
    of solutionKnowledge
  ) {
    const relationships =
      solution.relationships.filter(
        (relationship) =>
          relationship.type ===
          relationType,
      );

    for (
      const relationship
      of relationships
    ) {
      const targetId =
        relationship.target;

      if (
        !Array.isArray(
          index[targetId],
        )
      ) {
        index[targetId] = [];
      }

      index[targetId].push(
        solution,
      );
    }
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(
        index,
      ).map(
        ([
          targetId,
          solutions,
        ]) => [
          targetId,

          Object.freeze([
            ...solutions,
          ]),
        ],
      ),
    ),
  );
}


/* ============================================================
 * PROBLEM → SOLUTION
 * ============================================================
 */

export const solutionKnowledgeByProblemId =
  buildSolutionKnowledgeByRelationshipTarget(
    RELATION_TYPE.ADDRESSES,
  );


export function getSolutionsByProblemId(
  problemId,
) {
  if (
    typeof problemId !==
      "string" ||
    !problemId.trim()
  ) {
    return [];
  }

  return (
    solutionKnowledgeByProblemId[
      problemId
    ] ?? []
  );
}


/* ============================================================
 * CAPABILITY → SOLUTION
 * ============================================================
 */

export const solutionKnowledgeByCapabilityId =
  buildSolutionKnowledgeByRelationshipTarget(
    RELATION_TYPE.REQUIRES,
  );


export function getSolutionsByCapabilityId(
  capabilityId,
) {
  if (
    typeof capabilityId !==
      "string" ||
    !capabilityId.trim()
  ) {
    return [];
  }

  return (
    solutionKnowledgeByCapabilityId[
      capabilityId
    ] ?? []
  );
}


/* ============================================================
 * TECHNOLOGY → SOLUTION
 * ============================================================
 */

export const solutionKnowledgeByTechnologyId =
  buildSolutionKnowledgeByRelationshipTarget(
    RELATION_TYPE.USES,
  );


export function getSolutionsByTechnologyId(
  technologyId,
) {
  if (
    typeof technologyId !==
      "string" ||
    !technologyId.trim()
  ) {
    return [];
  }

  return (
    solutionKnowledgeByTechnologyId[
      technologyId
    ] ?? []
  );
}
/* ============================================================
 * SERVICE → SOLUTION
 * ============================================================
 */

export const solutionKnowledgeByServiceId =
  buildSolutionKnowledgeByRelationshipTarget(
    RELATION_TYPE.IMPLEMENTED_BY,
  );


export function getSolutionsByServiceId(
  serviceId,
) {
  if (
    typeof serviceId !==
      "string" ||
    !serviceId.trim()
  ) {
    return [];
  }

  return (
    solutionKnowledgeByServiceId[
      serviceId
    ] ?? []
  );
}