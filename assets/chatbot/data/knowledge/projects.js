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


function freezeFact(fact) {
  return Object.freeze({
    ...fact,

    evidence: Object.freeze(
      fact.evidence.map(
        (evidence) =>
          Object.freeze({
            ...evidence,

            sourceIds:
              Object.freeze([
                ...evidence.sourceIds,
              ]),
          }),
      ),
    ),

    sources:
      Object.freeze([
        ...fact.sources,
      ]),

    temporal:
      Object.freeze({
        ...fact.temporal,
      }),
  });
}


function freezeProject(item) {
  return Object.freeze({
    ...item,

    aliases:
      Object.freeze([
        ...item.aliases,
      ]),

    facts:
      Object.freeze(
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


function createProject({
  id,
  title,
  summary,
  aliases,
  projectStatus,
  problems,
  capabilities,
  technologies,
  businessAreas,
  objectives,
  processCharacteristics,
  constraints,
  sourceId,
  limitations = [],
}) {
  function listFact(
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
        CLAIM_STATUS.USER_CONFIRMED,

      evidence: [
        {
          strength:
            EVIDENCE_STRENGTH.STRONG,

          type:
            "portfolio-project",

          sourceIds: [
            sourceId,
          ],

          note:
            "Información respaldada por el proyecto publicado o documentado.",
        },
      ],

      sources: [
        sourceId,
      ],

      disclosure:
        DISCLOSURE.PUBLIC,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom: null,
        validTo: null,
      },
    };
  }


  return freezeProject({
    id,

    type:
      KNOWLEDGE_TYPE.PROJECT,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      {
        id:
          `${id}-fact-project-status`,

        key:
          "project-status",

        value:
          projectStatus,

        valueType:
          FACT_VALUE_TYPE.STRING,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "portfolio-project",

            sourceIds: [
              sourceId,
            ],

            note:
              "Estado actual del proyecto.",
          },
        ],

        sources: [
          sourceId,
        ],

        disclosure:
          DISCLOSURE.PUBLIC,

        temporal: {
          status:
            TEMPORAL_STATUS.CURRENT,

          validFrom: null,
          validTo: null,
        },
      },

      listFact(
        "problems",
        "problems",
        problems,
      ),

      listFact(
        "capabilities",
        "capabilities",
        capabilities,
      ),

      listFact(
        "technologies",
        "technologies",
        technologies,
      ),

      listFact(
        "business-areas",
        "business-areas",
        businessAreas,
      ),

      listFact(
        "objectives",
        "objectives",
        objectives,
      ),

      listFact(
        "process-characteristics",
        "process-characteristics",
        processCharacteristics,
      ),

      listFact(
        "constraints",
        "constraints",
        constraints,
      ),
    ],

    relationships: [],

    sources: [
      sourceId,
    ],

    disclosure:
      DISCLOSURE.PUBLIC,

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
      canRecommend: false,
      canProvideEvidence: true,
      canNavigate: true,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.ALWAYS,

      maxEvidenceItems: 3,

      allowInference: false,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.MEDIUM,

      forbiddenClaims: [
        "guaranteed-similarity",
        "guaranteed-feasibility",
        "guaranteed-result",
        "automatic-price",
        "automatic-deadline",
        "automatic-availability",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.QUALIFICATION,

        claim:
          "Un proyecto similar demuestra evidencia relevante, pero no garantiza que otro caso pueda resolverse exactamente igual.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "portfolio-project",
      projectStatus,
    },
  });
}


export const projectKnowledge =
  Object.freeze([

    createProject({
      id:
        "project-business-cost-intelligence",

      title:
        "Business Cost Intelligence",

      summary:
        "Automatización de extracción, transformación y análisis de información económica contenida en documentos, conectándola con Power BI para mejorar visibilidad, trazabilidad y análisis de costes.",

      aliases: [
        "Business Cost Intelligence",
        "cost intelligence",
        "costes",
        "extracción PDF",
      ],

      projectStatus:
        "published",

      problems: [
        "problem-manual-pdf-extraction",
        "problem-unstructured-documents",
        "problem-manual-data-consolidation",
        "problem-manual-data-transformation",
        "problem-repetitive-reporting",
      ],

      capabilities: [
        "capability-document-data-extraction",
        "capability-data-transformation",
        "capability-data-consolidation",
        "capability-process-automation",
        "capability-business-intelligence",
        "capability-dashboarding",
        "capability-data-traceability",
      ],

      technologies: [
        "technology-python",
        "technology-pandas",
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
      ],

      businessAreas: [
        "finance",
        "cost-control",
        "management-control",
      ],

      objectives: [
        "extract-structured-data",
        "reduce-manual-work",
        "single-data-source",
        "decision-support",
        "improve-traceability",
      ],

      processCharacteristics: [
        "document-heavy",
        "repetitive",
        "multi-source",
        "data-transformation",
        "reporting",
      ],

      constraints: [
        "format-dependency",
        "digital-or-semistructured-documents",
      ],

      sourceId:
        "source-project-business-cost-intelligence",

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "La viabilidad de extracción depende de la estructura, calidad y consistencia de los documentos.",
        },
      ],
    }),


    createProject({
      id:
        "project-auditoria-digital-cv",

      title:
        "Auditoría Digital Automatizada",

      summary:
        "Proyecto de recopilación automatizada de información pública web, evaluación mediante indicadores y scoring, análisis geográfico y visualización para estudiar madurez digital.",

      aliases: [
        "Auditoría Digital",
        "auditoría digital CV",
        "madurez digital",
        "scoring web",
      ],

      projectStatus:
        "published",

      problems: [
        "problem-web-data-collection",
        "problem-web-scoring-audit",
        "problem-scoring-rules",
      ],

      capabilities: [
        "capability-web-data-collection",
        "capability-scoring-and-rules",
        "capability-data-analysis",
        "capability-process-automation",
        "capability-dashboarding",
        "capability-ai-assisted-analysis",
      ],

      technologies: [
        "technology-python",
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
        "technology-ai",
      ],

      businessAreas: [
        "digital-audit",
        "marketing",
        "analytics",
      ],

      objectives: [
        "automated-audit",
        "automate-web-collection",
        "comparable-scoring",
        "decision-support",
        "reduce-manual-review",
      ],

      processCharacteristics: [
        "web-scale",
        "repetitive",
        "rule-based",
        "public-data",
        "scoring",
        "web-scraping",
      ],

      constraints: [
        "public-access-required",
        "website-change-risk",
        "terms-and-access-dependency",
      ],

      sourceId:
        "source-project-auditoria-digital",

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "La recopilación automatizada depende de que la información pueda obtenerse legítima y técnicamente.",
        },

        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "El scoring es orientativo y depende de los criterios definidos.",
        },
      ],
    }),


    createProject({
      id:
        "project-investment-dashboard-ai",

      title:
        "Investment Dashboard con IA",

      summary:
        "Plataforma en desarrollo para recopilar y analizar información de inversión, dividendos, riesgo, valoración, noticias y señales cuantitativas mediante Python, Power BI e IA.",

      aliases: [
        "Investment Dashboard",
        "dashboard de inversión",
        "investment dashboard ai",
        "proyecto inversión",
      ],

      projectStatus:
        "in_development",

      problems: [
        "problem-financial-analysis",
      ],

      capabilities: [
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

      businessAreas: [
        "finance",
        "financial-markets",
        "investment",
      ],

      objectives: [
        "financial-monitoring",
        "risk-analysis",
        "decision-support",
        "portfolio-analysis",
      ],

      processCharacteristics: [
        "financial",
        "recurring",
        "multi-source",
        "model-driven",
        "quantitative-analysis",
      ],

      constraints: [
        "not-financial-advice",
        "data-source-dependency",
        "in-development",
      ],

      sourceId:
        "source-project-investment-dashboard",

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "El proyecto no debe presentarse como asesoramiento financiero personalizado.",
        },

        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "El proyecto continúa en desarrollo y no debe presentarse como producto final cerrado.",
        },
      ],
    }),


    createProject({
      id:
        "project-digital-competency-evaluation",

      title:
        "Modelo de Evaluación de Competencias Digitales",

      summary:
        "Modelo avanzado en Excel y Power Query para representar jerarquías, reglas de negocio, ponderaciones, scoring, testing, validación y documentación de un sistema de evaluación.",

      aliases: [
        "Competencias Digitales",
        "modelo evaluación competencias",
        "Excel de competencias",
        "modelo jerárquico Excel",
      ],

      projectStatus:
        "published",

      problems: [
        "problem-fragile-excel-model",
        "problem-scoring-rules",
        "problem-complex-weighted-evaluation",
        "problem-data-quality",
        "problem-no-data-traceability",
      ],

      capabilities: [
        "capability-scoring-and-rules",
        "capability-hierarchical-modeling",
        "capability-testing",
        "capability-data-quality",
        "capability-data-traceability",
        "capability-data-transformation",
      ],

      technologies: [
        "technology-excel",
        "technology-power-query",
      ],

      businessAreas: [
        "evaluation",
        "skills-assessment",
        "analytics",
      ],

      objectives: [
        "weighted-evaluation",
        "hierarchical-scoring",
        "validate-results",
        "traceable-results",
        "make-model-robust",
      ],

      processCharacteristics: [
        "rule-based",
        "hierarchical",
        "test-heavy",
        "excel-centric",
        "weighted-model",
      ],

      constraints: [
        "rules-must-be-explicit",
        "weight-consistency-required",
      ],

      sourceId:
        "source-project-digital-competency-evaluation",
    }),
  ]);


export const projectKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      projectKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getProjectById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    projectKnowledgeById[id] ??
    null
  );
}


export function getProjectFact(
  project,
  key,
) {
  if (!project) {
    return null;
  }

  return (
    project.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}


export function getProjectsByStatus(
  status,
) {
  if (
    typeof status !== "string" ||
    !status.trim()
  ) {
    return [];
  }

  return projectKnowledge.filter(
    (project) =>
      getProjectFact(
        project,
        "project-status",
      )?.value === status,
  );
}