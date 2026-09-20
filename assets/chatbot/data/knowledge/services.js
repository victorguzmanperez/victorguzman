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
  RELATION_TYPE,
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

      forbiddenClaims:
        Object.freeze([
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


function createService({
  id,
  title,
  aliases,
  summary,
  solutionsSupported,
  capabilities,
  technologies,
  objectives,
  businessAreas,
  fitConditions,
  discoveryQuestions,
  supportedBy = [],
  exemplifiedBy = [],
  sources,
  limitations = [],
  canNavigate = true,
}) {
  const temporal = {
    status:
      TEMPORAL_STATUS.CURRENT,

    validFrom: null,
    validTo: null,
  };

  const baseFactId =
    `${id}-fact-definition`;

  const createEvidence = (
    type,
    strength,
    note,
  ) => [
    {
      strength,
      type,
      sourceIds: sources,
      note,
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
      createEvidence(
        "service-derived-dimension",
        EVIDENCE_STRENGTH.MODERATE,
        "Dimensión derivada del servicio publicado y del conocimiento autorizado asociado.",
      ),

    sources: [],

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal,
  });

  const evidenceRelationship = (
    type,
    item,
    defaultStrength,
  ) => ({
    type,

    target:
      item.target,

    strength:
      item.strength ??
      defaultStrength,

    sources:
      item.sources ?? sources,
  });

  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.SERVICE,

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
          "service-definition",

        value:
          summary,

        valueType:
          FACT_VALUE_TYPE.STRING,

        status:
          CLAIM_STATUS.VERIFIED,

        evidence:
          createEvidence(
            "published-service",
            EVIDENCE_STRENGTH.STRONG,
            "Servicio publicado explícitamente en el portfolio profesional.",
          ),

        sources,

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal,
      },

      derivedFact(
        "solutions-supported",
        "solutions-supported",
        solutionsSupported,
      ),

      derivedFact(
        "capabilities",
        "capabilities",
        capabilities,
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
        "fit-conditions",
        "fit-conditions",
        fitConditions,
      ),

      derivedFact(
        "discovery-questions",
        "discovery-questions",
        discoveryQuestions,
      ),
    ],

    relationships: [
      ...supportedBy.map(
        (item) =>
          evidenceRelationship(
            RELATION_TYPE.SUPPORTED_BY,
            item,
            EVIDENCE_STRENGTH.MODERATE,
          ),
      ),

      ...exemplifiedBy.map(
        (item) =>
          evidenceRelationship(
            RELATION_TYPE.EXEMPLIFIED_BY,
            item,
            EVIDENCE_STRENGTH.MODERATE,
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

      /*
       * Los cuatro servicios disponen de una
       * sección pública real:
       *
       * index.html#servicios
       */
      canNavigate,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 3,

      /*
       * Un servicio comercial nunca se inventa
       * a partir de capacidades o tecnologías.
       */
      allowInference: false,

      allowRecommendation: true,

      preferredDepth:
        ANSWER_DEPTH.MEDIUM,

      forbiddenClaims: [
        "invented-service",
        "automatic-service-fit",
        "guaranteed-acceptance",
        "guaranteed-feasibility",
        "guaranteed-result",
        "guaranteed-roi",
        "automatic-price",
        "automatic-deadline",
        "automatic-availability",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.COMMERCIAL,

        claim:
          "La existencia de este servicio no implica disponibilidad inmediata, aceptación automática del proyecto, precio ni plazo determinados.",
      },

      {
        type:
          LIMITATION_TYPE.QUALIFICATION,

        claim:
          "El encaje del servicio con un caso concreto requiere comprender previamente el problema, alcance, datos, herramientas y restricciones.",
      },

      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "Las capacidades, tecnologías, soluciones o proyectos relacionados no deben utilizarse para ampliar automáticamente el alcance del servicio.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "service",
    },
  });
}


/* ============================================================
 * SERVICES
 * ============================================================
 */

export const serviceKnowledge =
  Object.freeze([

    /* ========================================================
     * 01 — DASHBOARDS / BUSINESS INTELLIGENCE
     * ========================================================
     */

    createService({
      id:
        "service-business-intelligence-dashboards",

      title:
        "Dashboards y Business Intelligence",

      aliases: [
        "dashboards",
        "business intelligence",
        "cuadros de mando",
        "power bi",
        "informes power bi",
        "kpis",
      ],

      summary:
        "Diseño de cuadros de mando orientados a negocio, con KPIs útiles, modelos semánticos sólidos, transformación de datos y una experiencia visual que facilite el análisis y la toma de decisiones.",

      solutionsSupported: [
        "solution-reporting-dashboard-automation",
      ],

      capabilities: [
        "capability-business-intelligence",
        "capability-dashboarding",
        "capability-data-transformation",
        "capability-reporting-automation",
      ],

      technologies: [
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
      ],

      objectives: [
        "improve-reporting",
        "decision-support",
        "define-useful-kpis",
        "structure-reporting-model",
        "improve-data-visualization",
      ],

      businessAreas: [
        "business-intelligence",
        "reporting",
        "analytics",
        "decision-support",
      ],

      fitConditions: [
        "business-question-identifiable",
        "data-sources-identifiable",
        "kpis-definable",
        "target-audience-identifiable",
        "technical-feasibility-to-be-assessed",
      ],

      discoveryQuestions: [
        "¿Qué necesitas controlar o decidir con el cuadro de mando?",
        "¿Qué indicadores utilizáis actualmente?",
        "¿De qué fuentes proceden los datos?",
        "¿Quién utilizará el informe y con qué frecuencia?",
        "¿Qué parte del reporting actual requiere trabajo manual?",
      ],

      sources: [
        "source-portfolio-home",
      ],

      supportedBy: [
        {
          target:
            "experience-banco-sabadell-2023-current",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      exemplifiedBy: [
        {
          target:
            "project-business-cost-intelligence",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-project-business-cost-intelligence",
          ],
        },

        {
          target:
            "project-auditoria-digital-cv",

          strength:
            EVIDENCE_STRENGTH.MODERATE,

          sources: [
            "source-project-auditoria-digital",
          ],
        },
      ],

    }),


    /* ========================================================
     * 02 — EXCEL AVANZADO / MODELOS DE NEGOCIO
     * ========================================================
     */

    createService({
      id:
        "service-excel-business-models",

      title:
        "Excel avanzado y modelos de negocio",

      aliases: [
        "excel avanzado",
        "modelos de negocio en excel",
        "modelo excel",
        "herramientas de evaluación",
        "modelos de evaluación",
        "testing excel",
      ],

      summary:
        "Construcción de herramientas de evaluación y análisis en Excel mediante modelos estructurados, reglas de cálculo, automatización, controles, testing y documentación.",

      solutionsSupported: [
        "solution-evaluation-scoring-model",
        "solution-data-quality-traceability",
      ],

      capabilities: [
        "capability-hierarchical-modeling",
        "capability-scoring-and-rules",
        "capability-testing",
        "capability-data-quality",
        "capability-data-traceability",
      ],

      technologies: [
        "technology-excel",
        "technology-access",
        "technology-vba",
      ],

      objectives: [
        "build-evaluation-tools",
        "model-business-rules",
        "automate-calculations",
        "validate-results",
        "traceable-results",
        "document-model",
      ],

      businessAreas: [
        "evaluation",
        "business-modeling",
        "data-quality",
        "testing",
      ],

      fitConditions: [
        "rules-identifiable",
        "calculation-logic-definable",
        "expected-results-testable",
        "excel-is-appropriate-tool",
        "requirements-to-be-assessed",
      ],

      discoveryQuestions: [
        "¿Qué debe calcular o evaluar actualmente el Excel?",
        "¿Qué reglas, criterios o pesos intervienen?",
        "¿Existen distintos niveles o jerarquías en el modelo?",
        "¿Cómo comprobáis hoy que los resultados sean correctos?",
        "¿Necesitas que el modelo sea trazable y documentado?",
      ],

      sources: [
        "source-portfolio-home",
        "source-user-confirmed-career",
      ],
      supportedBy: [
        {
          target:
            "experience-banco-sabadell-2023-current",

          strength:
            EVIDENCE_STRENGTH.MODERATE,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      exemplifiedBy: [
        {
          target:
            "project-digital-competency-evaluation",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-project-digital-competency-evaluation",
          ],
        },
      ],
    }),


    /* ========================================================
     * 03 — AUTOMATIZACIÓN DE PROCESOS Y DATOS
     * ========================================================
     */

    createService({
      id:
        "service-data-process-automation",

      title:
        "Automatización de procesos y datos",

      aliases: [
        "automatización de procesos",
        "automatización de datos",
        "automatizar tareas",
        "etl",
        "integración de datos",
        "procesos repetitivos",
      ],

      summary:
        "Transformación de tareas manuales y repetitivas en procesos estructurados mediante automatización, transformación, validación, tratamiento de archivos e integración de datos.",

      solutionsSupported: [
        "solution-data-consolidation-automation",
        "solution-document-data-extraction",
        "solution-data-quality-traceability",
      ],

      capabilities: [
        "capability-process-automation",
        "capability-data-consolidation",
        "capability-data-transformation",
        "capability-data-quality",
        "capability-document-data-extraction",
      ],

      technologies: [
          "technology-python",
          "technology-power-query",
          "technology-excel",
          "technology-access",
          "technology-vba",
          "technology-vbs",
          "technology-odbc",
          "technology-power-automate",
      ],

      objectives: [
        "reduce-manual-work",
        "reduce-errors",
        "repeatable-process",
        "automate-data-preparation",
        "integrate-data",
        "structure-process",
      ],

      businessAreas: [
        "data",
        "automation",
        "integration",
        "process-improvement",
      ],

      fitConditions: [
        "process-understood",
        "inputs-identifiable",
        "expected-output-identifiable",
        "repetitive-work-identifiable",
        "technical-feasibility-to-be-assessed",
      ],

      discoveryQuestions: [
        "¿Qué proceso realizáis actualmente de forma manual?",
        "¿Qué datos, archivos o aplicaciones intervienen?",
        "¿Con qué frecuencia se ejecuta?",
        "¿Qué pasos se repiten siempre de la misma forma?",
        "¿Qué resultado debe producir el proceso?",
      ],

      sources: [
        "source-portfolio-home",
        "source-user-confirmed-career",
      ],
      supportedBy: [
        {
          target:
            "experience-banco-sabadell-2023-current",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      exemplifiedBy: [
        {
          target:
            "project-business-cost-intelligence",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-project-business-cost-intelligence",
          ],
        },

        {
          target:
            "project-auditoria-digital-cv",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-project-auditoria-digital",
          ],
        },
      ],
    }),


    /* ========================================================
     * 04 — IA APLICADA A PROCESOS Y ANÁLISIS
     * ========================================================
     */

    createService({
      id:
        "service-ai-process-analysis",

      title:
        "IA aplicada a procesos y análisis",

      aliases: [
        "inteligencia artificial",
        "ia aplicada",
        "automatización con ia",
        "análisis con ia",
        "clasificación con ia",
        "extracción con ia",
      ],

      summary:
        "Aplicación de inteligencia artificial como apoyo para analizar información, extraer o clasificar datos, documentar procesos y plantear soluciones que ayuden a trabajar y decidir mejor.",

      solutionsSupported: [
        "solution-ai-opportunity-assessment",
        "solution-document-data-extraction",
      ],

      capabilities: [
        "capability-ai-assisted-analysis",
        "capability-requirements-analysis",
        "capability-process-automation",
        "capability-document-data-extraction",
      ],

      technologies: [
        "technology-ai",
        "technology-copilot",
      ],

      objectives: [
        "identify-ai-use-case",
        "analyze-information",
        "extract-information",
        "classify-information",
        "document-processes",
        "improve-decision-support",
      ],

      businessAreas: [
        "artificial-intelligence",
        "automation",
        "analysis",
        "process-improvement",
      ],

      fitConditions: [
        "process-understood",
        "information-sources-identifiable",
        "expected-output-identifiable",
        "ai-value-to-be-assessed",
        "privacy-security-to-be-assessed",
      ],

      discoveryQuestions: [
        "¿Qué proceso o tarea quieres mejorar con IA?",
        "¿Qué información entra actualmente en ese proceso?",
        "¿Qué resultado necesitas obtener?",
        "¿Qué parte requiere análisis, extracción, clasificación o documentación?",
        "¿Por qué crees que la IA podría aportar valor en este caso?",
      ],

      sources: [
        "source-portfolio-home",
        "source-user-confirmed-career",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "La existencia de una oportunidad potencial de IA no implica que la IA sea necesariamente la mejor solución; deben evaluarse también alternativas más simples y deterministas.",
        },

        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "El uso de IA debe evaluarse considerando privacidad, seguridad, calidad de los datos, supervisión humana y riesgos asociados al caso concreto.",
        },
      ],
      supportedBy: [
        {
          target:
            "experience-banco-sabadell-2023-current",

          strength:
            EVIDENCE_STRENGTH.MODERATE,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      exemplifiedBy: [
        {
          target:
            "project-auditoria-digital-cv",

          strength:
            EVIDENCE_STRENGTH.MODERATE,

          sources: [
            "source-project-auditoria-digital",
          ],
        },
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const serviceKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      serviceKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getServiceById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    serviceKnowledgeById[id] ??
    null
  );
}


export function getServiceFact(
  service,
  key,
) {
  if (
    !service ||
    !Array.isArray(
      service.facts,
    )
  ) {
    return null;
  }

  return (
    service.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}


function getServicesByFactValue(
  key,
  value,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return [];
  }

  return serviceKnowledge.filter(
    (service) => {
      const fact =
        getServiceFact(
          service,
          key,
        );

      return (
        Array.isArray(fact?.value) &&
        fact.value.includes(value)
      );
    },
  );
}


export function getServicesBySolutionId(
  solutionId,
) {
  return getServicesByFactValue(
    "solutions-supported",
    solutionId,
  );
}


export function getServicesByCapabilityId(
  capabilityId,
) {
  return getServicesByFactValue(
    "capabilities",
    capabilityId,
  );
}


export function getServicesByTechnologyId(
  technologyId,
) {
  return getServicesByFactValue(
    "technologies",
    technologyId,
  );
}