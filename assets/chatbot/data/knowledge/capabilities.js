import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  EXPERIENCE_EVIDENCE,
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

    temporal: fact.temporal
      ? Object.freeze({
          ...fact.temporal,
        })
      : undefined,
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

    relationships: Object.freeze([]),

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


function createCapability({
  id,
  title,
  aliases,
  summary,
  domains,
  evidenceTypes,
  sources,
  current = true,
  limitations = [],
}) {
  const temporalStatus =
    current
      ? TEMPORAL_STATUS.CURRENT
      : TEMPORAL_STATUS.HISTORICAL;

  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.CAPABILITY,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      {
        id:
          `${id}-fact-domains`,

        key:
          "domains",

        value:
          domains,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "capability-domain",

            sourceIds:
              sources,

            note:
              "Áreas en las que esta capacidad está respaldada por experiencia, proyectos o formación.",
          },
        ],

        sources,

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal: {
          status:
            temporalStatus,

          validFrom: null,
          validTo: null,
        },
      },

      {
        id:
          `${id}-fact-evidence-types`,

        key:
          "evidence-types",

        value:
          evidenceTypes,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "capability-evidence",

            sourceIds:
              sources,

            note:
              "Tipos de evidencia que respaldan esta capacidad.",
          },
        ],

        sources,

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal: {
          status:
            temporalStatus,

          validFrom: null,
          validTo: null,
        },
      },

      {
        id:
          `${id}-fact-summary`,

        key:
          "capability-summary",

        value:
          summary,

        valueType:
          FACT_VALUE_TYPE.STRING,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "capability-summary",

            sourceIds:
              sources,

            note:
              "Resumen público y cualificado de la capacidad.",
          },
        ],

        sources,

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal: {
          status:
            temporalStatus,

          validFrom: null,
          validTo: null,
        },
      },
    ],

    relationships: [],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        temporalStatus,

      validFrom: null,
      validTo: null,
    },

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,
      canRecommend: false,
      canProvideEvidence: true,
      canNavigate: false,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 3,

      allowInference: false,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.SHORT,

      forbiddenClaims: [
        "invented-capability",
        "invented-expertise",
        "guaranteed-result",
        "automatic-service-fit",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "Una capacidad respaldada por experiencia o proyectos no implica que cualquier proyecto relacionado pueda aceptarse o resolverse sin diagnóstico previo.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "capability",
    },
  });
}


/* ============================================================
 * CAPABILITIES
 * ============================================================
 */

export const capabilityKnowledge =
  Object.freeze([

    createCapability({
      id:
        "capability-business-intelligence",

      title:
        "Business Intelligence",

      aliases: [
        "business intelligence",
        "bi",
        "inteligencia de negocio",
      ],

      summary:
        "Transformación de datos en información útil para seguimiento, análisis y toma de decisiones.",

      domains: [
        "data",
        "reporting",
        "dashboards",
        "decision-support",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,

        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-home",
        "source-dataverso-home",
      ],
    }),


    createCapability({
      id:
        "capability-data-analysis",

      title:
        "Análisis de datos",

      aliases: [
        "data analysis",
        "análisis de datos",
        "analizar datos",
      ],

      summary:
        "Exploración, transformación e interpretación de datos para responder preguntas de negocio.",

      domains: [
        "data",
        "analytics",
        "decision-support",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-investment-dashboard",
      ],
    }),


    createCapability({
      id:
        "capability-data-transformation",

      title:
        "Transformación de datos",

      aliases: [
        "data transformation",
        "transformación de datos",
        "limpieza de datos",
        "preparación de datos",
      ],

      summary:
        "Preparación, limpieza, normalización y transformación de datos para análisis o automatización.",

      domains: [
        "data",
        "etl",
        "power-query",
        "python",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
        "source-dataverso-power-query-intro",
      ],
    }),


    createCapability({
      id:
        "capability-data-consolidation",

      title:
        "Consolidación de datos",

      aliases: [
        "data consolidation",
        "consolidación de datos",
        "unificar datos",
        "combinar archivos",
      ],

      summary:
        "Unificación de información procedente de múltiples archivos o fuentes en una estructura común y reutilizable.",

      domains: [
        "data",
        "excel",
        "automation",
        "reporting",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-dashboarding",

      title:
        "Dashboards y cuadros de mando",

      aliases: [
        "dashboarding",
        "dashboards",
        "cuadros de mando",
        "paneles de control",
      ],

      summary:
        "Diseño y construcción de cuadros de mando orientados a seguimiento, análisis y decisión.",

      domains: [
        "business-intelligence",
        "power-bi",
        "reporting",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-home",
        "source-dataverso-power-bi-guide",
      ],
    }),


    createCapability({
      id:
        "capability-reporting-automation",

      title:
        "Automatización de reporting",

      aliases: [
        "reporting automation",
        "automatización de informes",
        "automatizar reporting",
      ],

      summary:
        "Reducción de tareas manuales repetitivas asociadas a preparación y actualización de informes.",

      domains: [
        "reporting",
        "automation",
        "power-bi",
        "excel",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
      ],
    }),


    createCapability({
      id:
        "capability-process-automation",

      title:
        "Automatización de procesos",

      aliases: [
        "process automation",
        "automatización de procesos",
        "automatizar procesos",
        "reducir tareas manuales",
      ],

      summary:
        "Identificación y automatización de tareas repetitivas basadas en datos, documentos o reglas.",

      domains: [
        "automation",
        "data",
        "python",
        "power-platform",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
        "source-project-auditoria-digital",
      ],
    }),


    createCapability({
      id:
        "capability-document-data-extraction",

      title:
        "Extracción de datos de documentos",

      aliases: [
        "document data extraction",
        "extracción de documentos",
        "extraer datos de pdf",
        "extraer datos de facturas",
      ],

      summary:
        "Extracción estructurada de información contenida en documentos digitales cuando el formato y contenido permiten automatización fiable.",

      domains: [
        "documents",
        "pdf",
        "python",
        "automation",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-project-business-cost-intelligence",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "La evidencia actual se centra en documentos digitales estructurados o semiestructurados; no implica soporte universal para OCR o cualquier documento.",
        },
      ],
    }),


    createCapability({
      id:
        "capability-data-quality",

      title:
        "Calidad de datos",

      aliases: [
        "data quality",
        "calidad de datos",
        "validación de datos",
      ],

      summary:
        "Controles y validaciones para detectar inconsistencias y mejorar la fiabilidad del dato.",

      domains: [
        "data",
        "validation",
        "quality",
        "governance",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-data-traceability",

      title:
        "Trazabilidad del dato",

      aliases: [
        "data traceability",
        "trazabilidad",
        "trazabilidad del dato",
      ],

      summary:
        "Seguimiento del origen, transformación y utilización de datos para facilitar control y explicación.",

      domains: [
        "data",
        "governance",
        "control",
        "audit",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-functional-analysis",

      title:
        "Análisis funcional",

      aliases: [
        "functional analysis",
        "análisis funcional",
      ],

      summary:
        "Traducción de necesidades funcionales y de negocio en requisitos y diseños comprensibles para equipos técnicos.",

      domains: [
        "requirements",
        "business",
        "technology",
        "banking",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    createCapability({
      id:
        "capability-requirements-analysis",

      title:
        "Análisis de requisitos",

      aliases: [
        "requirements analysis",
        "análisis de requisitos",
        "toma de requisitos",
      ],

      summary:
        "Identificación, estructuración y validación de necesidades antes de diseñar una solución.",

      domains: [
        "requirements",
        "business",
        "projects",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,

        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-business-technology-bridge",

      title:
        "Puente negocio-tecnología",

      aliases: [
        "business technology bridge",
        "puente negocio tecnología",
        "perfil técnico funcional",
      ],

      summary:
        "Capacidad para entender necesidades de negocio y conectarlas con datos, tecnología y ejecución.",

      domains: [
        "business",
        "technology",
        "requirements",
        "projects",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    createCapability({
      id:
        "capability-project-management",

      title:
        "Gestión de proyectos",

      aliases: [
        "project management",
        "gestión de proyectos",
        "dirección de proyectos",
      ],

      summary:
        "Planificación, coordinación, seguimiento y despliegue de proyectos tecnológicos y de datos.",

      domains: [
        "projects",
        "planning",
        "coordination",
        "delivery",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    createCapability({
      id:
        "capability-testing",

      title:
        "Testing y validación",

      aliases: [
        "testing",
        "pruebas",
        "validación",
        "quality assurance",
      ],

      summary:
        "Diseño y ejecución sistemática de pruebas para comprobar comportamiento, reglas y casos de error.",

      domains: [
        "testing",
        "quality",
        "software",
        "data",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-uat",

      title:
        "UAT",

      aliases: [
        "uat",
        "user acceptance testing",
        "pruebas de usuario",
      ],

      summary:
        "Coordinación y validación de pruebas de aceptación antes de la implantación.",

      domains: [
        "testing",
        "projects",
        "deployment",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-production-support",

      title:
        "Soporte de producción",

      aliases: [
        "production support",
        "soporte producción",
        "incidencias producción",
      ],

      summary:
        "Análisis y resolución de incidencias en sistemas productivos y procesos críticos.",

      domains: [
        "production",
        "banking",
        "support",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-technical-leadership",

      title:
        "Liderazgo técnico",

      aliases: [
        "technical leadership",
        "liderazgo técnico",
        "coordinación técnica",
      ],

      summary:
        "Coordinación, formación y apoyo a equipos técnicos en entornos de alta responsabilidad.",

      domains: [
        "leadership",
        "teams",
        "technology",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-scoring-and-rules",

      title:
        "Motores de reglas y scoring",

      aliases: [
        "scoring",
        "business rules",
        "reglas de negocio",
        "motor de reglas",
        "puntuación automática",
      ],

      summary:
        "Conversión de criterios y reglas de negocio en lógica matemática reproducible y evaluable.",

      domains: [
        "rules",
        "scoring",
        "excel",
        "evaluation",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-hierarchical-modeling",

      title:
        "Modelado jerárquico",

      aliases: [
        "hierarchical modeling",
        "modelado jerárquico",
        "modelo jerárquico",
        "pesos jerárquicos",
      ],

      summary:
        "Diseño de estructuras jerárquicas de categorías, subcategorías, indicadores y pesos.",

      domains: [
        "data-modeling",
        "evaluation",
        "excel",
        "hierarchies",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-project-digital-competency-evaluation",
      ],
    }),


    createCapability({
      id:
        "capability-financial-analysis",

      title:
        "Análisis financiero",

      aliases: [
        "financial analysis",
        "análisis financiero",
        "análisis de mercados",
      ],

      summary:
        "Análisis de información financiera y de mercados para apoyar seguimiento y decisión, sin constituir asesoramiento financiero personalizado.",

      domains: [
        "finance",
        "financial-markets",
        "analytics",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-investment-dashboard",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "El análisis financiero del portfolio no debe convertirse en recomendaciones personalizadas de compra o venta de valores.",
        },
      ],
    }),


    createCapability({
      id:
        "capability-ai-assisted-analysis",

      title:
        "Análisis asistido por IA",

      aliases: [
        "ai assisted analysis",
        "análisis con ia",
        "análisis asistido por inteligencia artificial",
      ],

      summary:
        "Uso de IA como apoyo para analizar, clasificar o enriquecer información dentro de flujos controlados.",

      domains: [
        "ai",
        "analysis",
        "automation",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-auditoria-digital",
        "source-project-investment-dashboard",
      ],
    }),


    createCapability({
      id:
        "capability-web-data-collection",

      title:
        "Recopilación de datos web",

      aliases: [
        "web data collection",
        "recopilar datos web",
        "web scraping",
        "scraping",
      ],

      summary:
        "Extracción y estructuración automatizada de información pública disponible en páginas web cuando el acceso y uso son adecuados.",

      domains: [
        "web",
        "scraping",
        "automation",
        "data",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],

      sources: [
        "source-project-auditoria-digital",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "La recopilación web debe respetar disponibilidad, autorización, términos aplicables y limitaciones técnicas.",
        },
      ],
    }),


    createCapability({
      id:
        "capability-performance-optimization",

      title:
        "Optimización de rendimiento",

      aliases: [
        "performance optimization",
        "optimización de rendimiento",
        "cuellos de botella",
      ],

      summary:
        "Análisis de procesos y transacciones para identificar cuellos de botella y mejorar rendimiento.",

      domains: [
        "performance",
        "software",
        "batch",
        "production",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      current: false,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-data-migration",

      title:
        "Migración de datos y sistemas",

      aliases: [
        "data migration",
        "migración de datos",
        "migración de sistemas",
      ],

      summary:
        "Participación en migraciones bancarias y transformación de información entre plataformas y modelos.",

      domains: [
        "migration",
        "banking",
        "data",
        "systems",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      current: false,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createCapability({
      id:
        "capability-stakeholder-coordination",

      title:
        "Coordinación con negocio y equipos",

      aliases: [
        "stakeholder coordination",
        "stakeholder management",
        "coordinación de equipos",
        "coordinación con negocio",
      ],

      summary:
        "Coordinación entre negocio, usuarios y equipos técnicos durante análisis, desarrollo, pruebas y despliegue.",

      domains: [
        "projects",
        "business",
        "teams",
        "communication",
      ],

      evidenceTypes: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,

        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      sources: [
        "source-user-confirmed-career",
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const capabilityKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      capabilityKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getCapabilityById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    capabilityKnowledgeById[
      id
    ] ?? null
  );
}


export function getCapabilitiesByDomain(
  domain,
) {
  if (
    typeof domain !== "string" ||
    !domain.trim()
  ) {
    return [];
  }

  const normalized =
    domain.trim().toLowerCase();

  return capabilityKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "domains",
        );

      return (
        fact?.value?.includes(
          normalized,
        ) ?? false
      );
    },
  );
}


export function getCapabilitiesByEvidence(
  evidenceType,
) {
  if (
    typeof evidenceType !==
      "string" ||
    !evidenceType.trim()
  ) {
    return [];
  }

  return capabilityKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "evidence-types",
        );

      return (
        fact?.value?.includes(
          evidenceType,
        ) ?? false
      );
    },
  );
}