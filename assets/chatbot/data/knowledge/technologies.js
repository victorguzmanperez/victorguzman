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


function createTechnologyItem({
  id,
  name,
  aliases,
  evidenceCategories,
  evidenceSummary,
  currentProfessional = false,
  historicalProfessional = false,
  sources,
  temporalStatus =
    TEMPORAL_STATUS.CURRENT,
  relationships = [],
  limitations = [],
}) {
  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.TECHNOLOGY,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title: name,

    shortDescription:
      evidenceSummary,

    aliases,

    facts: [
      {
        id:
          `${id}-fact-evidence-categories`,

        key:
          "experience-evidence",

        value:
          evidenceCategories,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              evidenceCategories.includes(
                EXPERIENCE_EVIDENCE.NO_EVIDENCE,
              )
                ? EVIDENCE_STRENGTH.MODERATE
                : EVIDENCE_STRENGTH.STRONG,

            type:
              "technology-evidence-classification",

            sourceIds:
              sources,

            note:
              "Clasificación del tipo de evidencia disponible para esta tecnología.",
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
          `${id}-fact-current-professional`,

        key:
          "professional-current",

        value:
          currentProfessional,

        valueType:
          FACT_VALUE_TYPE.BOOLEAN,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "technology-current-status",

            sourceIds:
              sources,

            note:
              "Indica si existe evidencia de uso profesional actual.",
          },
        ],

        sources,

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal: {
          status:
            TEMPORAL_STATUS.CURRENT,

          validFrom: null,
          validTo: null,
        },
      },

      {
        id:
          `${id}-fact-historical-professional`,

        key:
          "professional-historical",

        value:
          historicalProfessional,

        valueType:
          FACT_VALUE_TYPE.BOOLEAN,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "technology-historical-status",

            sourceIds:
              sources,

            note:
              "Indica si existe experiencia profesional histórica documentada.",
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
          `${id}-fact-evidence-summary`,

        key:
          "evidence-summary",

        value:
          evidenceSummary,

        valueType:
          FACT_VALUE_TYPE.STRING,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "technology-evidence-summary",

            sourceIds:
              sources,

            note:
              "Resumen cualificado de la evidencia disponible.",
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

    relationships,

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
        "invented-professional-experience",
        "invented-expertise",
        "invented-certification",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.QUALIFICATION,

        claim:
          "La evidencia debe describirse según su categoría real: experiencia profesional, proyecto, formación, autoaprendizaje o publicación.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "technology",
      canonicalName: name,
    },
  });
}


/* ============================================================
 * TECHNOLOGIES
 * ============================================================
 */

export const technologyKnowledge =
  Object.freeze([

    createTechnologyItem({
      id:
        "technology-cobol",

      name:
        "COBOL",

      aliases: [
        "cobol",
        "mainframe cobol",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      evidenceSummary:
        "Experiencia profesional histórica muy sólida en COBOL dentro de sistemas bancarios, procesos batch, online, migraciones y producción.",

      historicalProfessional: true,

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-power-bi",

      name:
        "Power BI",

      aliases: [
        "power bi",
        "powerbi",
        "pbi",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,

        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ],

      evidenceSummary:
        "Tecnología de uso profesional actual, aplicada también en proyectos de portfolio, formación específica y publicaciones en DataVerso.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
        "source-portfolio-home",
        "source-dataverso-home",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.PUBLISHED_ABOUT,

          target:
            "publication-dataverso-power-bi",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-dataverso-home",
          ],
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-power-query",

      name:
        "Power Query",

      aliases: [
        "power query",
        "powerquery",
        "pq",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,

        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ],

      evidenceSummary:
        "Uso actual y aplicado en transformación de datos, proyectos de portfolio y contenidos publicados en DataVerso.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-home",
        "source-dataverso-power-query-intro",
        "source-dataverso-power-query-home",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-dax",

      name:
        "DAX",

      aliases: [
        "dax",
        "data analysis expressions",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,

        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ],

      evidenceSummary:
        "DAX forma parte del trabajo con Power BI, proyectos del portfolio, formación específica y contenidos publicados.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-home",
        "source-dataverso-power-bi-guide",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-excel",

      name:
        "Excel",

      aliases: [
        "excel",
        "microsoft excel",
        "xlsx",
        "xls",
        "exel",
        "hoja de cálculo",
        "hojas de cálculo",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Herramienta de uso profesional actual y aplicada en modelado, análisis, automatización y proyectos avanzados de evaluación.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-portfolio-home",
        "source-project-digital-competency-evaluation",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-python",

      name:
        "Python",

      aliases: [
        "python",
        "py",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Python cuenta con formación formal, aplicación práctica en varios proyectos de portfolio y uso/evolución reciente en el contexto profesional actual.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-learning",
        "source-user-confirmed-career",
        "source-project-business-cost-intelligence",
        "source-project-auditoria-digital",
        "source-project-investment-dashboard",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Python no debe presentarse como equivalente a la profundidad histórica acumulada en COBOL.",
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-pandas",

      name:
        "Pandas",

      aliases: [
        "pandas",
        "python pandas",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Aplicado en proyectos Python de análisis y transformación de datos y respaldado por formación en Python/Data Science.",

      sources: [
        "source-user-confirmed-learning",
        "source-project-business-cost-intelligence",
        "source-project-investment-dashboard",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-oracle",

      name:
        "Oracle",

      aliases: [
        "oracle",
        "oracle database",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      evidenceSummary:
        "Oracle aparece tanto en experiencias históricas de migración bancaria como en el contexto profesional actual de explotación de datos.",

      currentProfessional: true,
      historicalProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-sql",

      name:
        "SQL",

      aliases: [
        "sql",
        "structured query language",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "SQL está respaldado por trabajo con bases de datos y formación específica en SQL Server y lenguaje SQL.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-sql-server",

      name:
        "SQL Server",

      aliases: [
        "sql server",
        "microsoft sql server",
        "ssms",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Experiencia respaldada principalmente por formación práctica específica, no presentada como especialización profesional histórica.",

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-sas",

      name:
        "SAS",

      aliases: [
        "sas",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Herramienta utilizada profesionalmente en el contexto actual para tratamiento y automatización de datos.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-access",

      name:
        "Microsoft Access",

      aliases: [
        "access",
        "microsoft access",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso profesional actual en procesos de datos y automatización.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-vba",

      name:
        "VBA",

      aliases: [
        "vba",
        "visual basic for applications",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso profesional actual para automatización asociada a herramientas Microsoft y procesos de datos.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-vbs",

      name:
        "VBS",

      aliases: [
        "vbs",
        "vbscript",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso profesional actual en automatizaciones y procesos de tratamiento de datos.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-microstrategy",

      name:
        "MicroStrategy",

      aliases: [
        "microstrategy",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso profesional actual en el contexto de datamarts y explotación de información.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-odbc",

      name:
        "ODBC",

      aliases: [
        "odbc",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso profesional actual como mecanismo de acceso e integración de fuentes de datos.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-control-m",

      name:
        "Control-M",

      aliases: [
        "control-m",
        "control m",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      evidenceSummary:
        "Experiencia profesional histórica en planificación y monitorización de procesos batch bancarios.",

      historicalProfessional: true,

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-xml",

      name:
        "XML",

      aliases: [
        "xml",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],

      evidenceSummary:
        "Utilizado profesionalmente en proyectos históricos de migración e integración bancaria.",

      historicalProfessional: true,

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-r",

      name:
        "R",

      aliases: [
        "r",
        "lenguaje r",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Conocimiento respaldado por formación en IA, Big Data y Data Science, sin presentarlo como experiencia profesional consolidada.",

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-aws",

      name:
        "AWS",

      aliases: [
        "aws",
        "amazon web services",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Exposición y formación en AWS dentro de estudios de IA y Big Data; no existe base para presentarlo como experto profesional AWS.",

      sources: [
        "source-user-confirmed-learning",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "La formación en AWS no equivale a experiencia profesional especializada en arquitectura cloud.",
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-java",

      name:
        "Java",

      aliases: [
        "java",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .SELF_LEARNING,
      ],

      evidenceSummary:
        "Conocimiento procedente de autoaprendizaje y práctica personal, no de experiencia profesional documentada.",

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-android",

      name:
        "Android",

      aliases: [
        "android",
        "android development",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .SELF_LEARNING,
      ],

      evidenceSummary:
        "Experiencia de aprendizaje y proyectos personales, no experiencia profesional consolidada.",

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-c",

      name:
        "C",

      aliases: [
        "c",
        "lenguaje c",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Tecnología aprendida durante la formación reglada inicial en desarrollo de aplicaciones.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-cpp",

      name:
        "C++",

      aliases: [
        "c++",
        "cpp",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Tecnología aprendida durante la formación reglada inicial en desarrollo de aplicaciones.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-delphi",

      name:
        "Delphi",

      aliases: [
        "delphi",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Tecnología utilizada durante la formación inicial en desarrollo de aplicaciones.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-paradox",

      name:
        "Paradox",

      aliases: [
        "paradox",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Tecnología utilizada durante la formación inicial en desarrollo de aplicaciones.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-learning",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-copilot",

      name:
        "Microsoft Copilot",

      aliases: [
        "copilot",
        "microsoft copilot",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ],

      evidenceSummary:
        "Uso y aprendizaje aplicado actual de Copilot en contexto profesional.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Copilot debe describirse como una tecnología actual y en evolución, sin atribuir una antigüedad o especialización no documentada.",
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-power-automate",

      name:
        "Power Automate",

      aliases: [
        "power automate",
        "powerautomate",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Área actual de aprendizaje y aplicación dentro del ecosistema Microsoft, todavía reciente frente a tecnologías más consolidadas.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "No debe presentarse como una especialización profesional de muchos años.",
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-power-apps",

      name:
        "Power Apps",

      aliases: [
        "power apps",
        "powerapps",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "Área actual de aprendizaje y aplicación dentro de Power Platform, con experiencia reciente.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "No debe presentarse como una tecnología con años de experiencia profesional consolidada.",
        },
      ],
    }),


    createTechnologyItem({
      id:
        "technology-ai",

      name:
        "Inteligencia Artificial",

      aliases: [
        "ai",
        "ia",
        "inteligencia artificial",
        "artificial intelligence",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,

        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],

      evidenceSummary:
        "IA respaldada por formación formal, proyectos aplicados y evolución profesional actual; no se presenta como investigación académica ni décadas de experiencia.",

      currentProfessional: true,

      sources: [
        "source-user-confirmed-career",
        "source-user-confirmed-learning",
        "source-project-auditoria-digital",
        "source-project-investment-dashboard",
      ],
    }),


    createTechnologyItem({
      id:
        "technology-qlik",

      name:
        "Qlik",

      aliases: [
        "qlik",
        "qlikview",
        "qlik sense",
        "nprinting",
      ],

      evidenceCategories: [
        EXPERIENCE_EVIDENCE
          .NO_EVIDENCE,
      ],

      evidenceSummary:
        "No existe actualmente experiencia profesional ni formación confirmada en QlikView, Qlik Sense o NPrinting.",

      sources: [
        "source-user-confirmed-learning",
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "No debe atribuirse experiencia con QlikView, Qlik Sense o NPrinting.",
        },
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const technologyKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      technologyKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getTechnologyById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    technologyKnowledgeById[id] ??
    null
  );
}


export function getTechnologiesByEvidence(
  evidenceCategory,
) {
  if (
    typeof evidenceCategory !==
      "string" ||
    !evidenceCategory.trim()
  ) {
    return [];
  }

  return technologyKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "experience-evidence",
        );

      return (
        fact?.value?.includes(
          evidenceCategory,
        ) ?? false
      );
    },
  );
}


export function getCurrentProfessionalTechnologies() {
  return technologyKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "professional-current",
        );

      return fact?.value === true;
    },
  );
}


export function getHistoricalProfessionalTechnologies() {
  return technologyKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "professional-historical",
        );

      return fact?.value === true;
    },
  );
}
