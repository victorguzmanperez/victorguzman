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


function freezeItem(item) {
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


function createEducation({
  id,
  title,
  aliases,
  institution,
  program,
  period,
  validFrom,
  validTo,
  topics,
  grade = null,
  sources = [
    "source-user-confirmed-learning",
    "source-linkedin-victor",
  ],
}) {
  const fact = (
    suffix,
    key,
    value,
    valueType,
  ) => ({
    id:
      `${id}-fact-${suffix}`,

    key,

    value,

    valueType,

    status:
      CLAIM_STATUS.USER_CONFIRMED,

    evidence: [
      {
        strength:
          EVIDENCE_STRENGTH.STRONG,

        type:
          "formal-education",

        sourceIds:
          sources,

        note:
          "Formación confirmada por Víctor.",
      },
    ],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        TEMPORAL_STATUS.HISTORICAL,

      validFrom,
      validTo,
    },
  });

  const facts = [
    fact(
      "institution",
      "institution",
      institution,
      FACT_VALUE_TYPE.STRING,
    ),

    fact(
      "program",
      "program",
      program,
      FACT_VALUE_TYPE.STRING,
    ),

    fact(
      "period",
      "period",
      period,
      FACT_VALUE_TYPE.STRING,
    ),

    fact(
      "topics",
      "topics",
      topics,
      FACT_VALUE_TYPE.STRING_LIST,
    ),
  ];

  if (grade !== null) {
    facts.push(
      fact(
        "grade",
        "grade",
        grade,
        FACT_VALUE_TYPE.STRING,
      ),
    );
  }

  return freezeItem({
    id,

    type:
      KNOWLEDGE_TYPE.EDUCATION,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      `${program} — ${institution}.`,

    aliases,

    facts,

    relationships: [],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        TEMPORAL_STATUS.HISTORICAL,

      validFrom,
      validTo,
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

      maxEvidenceItems: 2,

      allowInference: false,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.SHORT,

      forbiddenClaims: [
        "professional-experience-from-training",
        "invented-certification",
        "invented-grade",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.QUALIFICATION,

        claim:
          "La formación acredita aprendizaje, pero no debe convertirse automáticamente en experiencia profesional.",
      },
    ],

    metadata: {
      version: 1,
      category: "education",
    },
  });
}


export const educationKnowledge =
  Object.freeze([

    createEducation({
      id:
        "education-dai-2001-2003",

      title:
        "CFGS Desarrollo de Aplicaciones Informáticas",

      aliases: [
        "DAI",
        "desarrollo aplicaciones informáticas",
        "Severo Ochoa",
      ],

      institution:
        "Instituto Severo Ochoa (Elche)",

      program:
        "CFGS Desarrollo de Aplicaciones Informáticas",

      period:
        "2001 – 2003",

      validFrom:
        "2001-09-01",

      validTo:
        "2003-06-30",

      topics: [
        "c",
        "cpp",
        "delphi",
        "paradox",
        "software-development",
      ],
    }),


    createEducation({
      id:
        "education-ai-big-data-2021-2022",

      title:
        "Especialización en Inteligencia Artificial y Big Data",

      aliases: [
        "IA y Big Data",
        "especialización IA",
      ],

      institution:
        "Instituto Severo Ochoa",

      program:
        "Especialización en Inteligencia Artificial y Big Data",

      period:
        "Sep 2021 – Jun 2022",

      validFrom:
        "2021-09-01",

      validTo:
        "2022-06-30",

      grade:
        "9.60",

      topics: [
        "aws",
        "parquet",
        "big-data",
        "artificial-intelligence",
        "algorithms",
        "r",
        "power-bi",
        "python",
      ],
    }),


    createEducation({
      id:
        "education-data-scientist-2022",

      title:
        "Data Scientist",

      aliases: [
        "Data Scientist 2022",
        "Indice Consultoría",
      ],

      institution:
        "Indice Consultoría y Formación",

      program:
        "Data Scientist",

      period:
        "May – Ago 2022",

      validFrom:
        "2022-05-01",

      validTo:
        "2022-08-31",

      grade:
        "9.5",

      topics: [
        "data-science",
        "python",
        "machine-learning",
        "data-analysis",
      ],
    }),


    createEducation({
      id:
        "education-power-bi-2022",

      title:
        "Business Intelligence con Power BI",

      aliases: [
        "Power BI Grupo IOE",
      ],

      institution:
        "Grupo IOE",

      program:
        "Business Intelligence con Power BI",

      period:
        "Oct 2022",

      validFrom:
        "2022-10-01",

      validTo:
        "2022-10-31",

      grade:
        "7",

      topics: [
        "power-bi",
        "business-intelligence",
      ],
    }),


    createEducation({
      id:
        "education-ai-business-2022-2023",

      title:
        "Inteligencia Artificial aplicada a la empresa",

      aliases: [
        "IA aplicada empresa",
        "Educatic IA",
      ],

      institution:
        "Educatic",

      program:
        "Inteligencia Artificial aplicada a la empresa",

      period:
        "Nov 2022 – Feb 2023",

      validFrom:
        "2022-11-01",

      validTo:
        "2023-02-28",

      topics: [
        "machine-learning",
        "supervised-learning",
        "unsupervised-learning",
        "reinforcement-learning",
        "deep-learning",
        "weka",
        "orange",
        "business-ai",
      ],
    }),


    createEducation({
      id:
        "education-marketing-online-2023",

      title:
        "Marketing y Reputación Online",

      aliases: [
        "marketing online Femxa",
      ],

      institution:
        "Grupo Femxa",

      program:
        "Marketing y Reputación Online",

      period:
        "Feb – May 2023",

      validFrom:
        "2023-02-01",

      validTo:
        "2023-05-31",

      topics: [
        "marketing",
        "online-reputation",
        "digital-marketing",
      ],
    }),


    createEducation({
      id:
        "education-power-bi-ibm-2024",

      title:
        "Power BI — IBM SkillsBuild",

      aliases: [
        "Datahack Power BI",
        "IBM SkillsBuild Power BI",
      ],

      institution:
        "Datahack / IBM SkillsBuild",

      program:
        "Power BI",

      period:
        "Abr – Jul 2024",

      validFrom:
        "2024-04-01",

      validTo:
        "2024-07-31",

      topics: [
        "power-bi",
        "data-modeling",
        "dax",
        "visualization",
      ],
    }),


    createEducation({
      id:
        "education-pl300-2024",

      title:
        "Formación PL-300",

      aliases: [
        "curso PL-300",
        "PUE PL-300",
      ],

      institution:
        "PUE",

      program:
        "Formación basada en la ruta oficial Microsoft PL-300",

      period:
        "Oct – Nov 2024",

      validFrom:
        "2024-10-01",

      validTo:
        "2024-11-30",

      topics: [
        "power-bi",
        "power-query",
        "dax",
        "data-modeling",
        "visualization",
        "pl-300",
      ],
    }),


    createEducation({
      id:
        "education-sql-2024",

      title:
        "SQL — IBM SkillsBuild",

      aliases: [
        "Datahack SQL",
        "IBM SkillsBuild SQL",
      ],

      institution:
        "Datahack / IBM SkillsBuild",

      program:
        "SQL",

      period:
        "Oct – Dic 2024",

      validFrom:
        "2024-10-01",

      validTo:
        "2024-12-31",

      topics: [
        "sql",
        "sql-server",
        "ssms",
        "constraints",
        "functions",
        "stored-procedures",
        "ddl",
        "transactions",
        "joins",
        "unions",
        "temporary-tables",
        "views",
        "triggers",
        "backups",
        "jobs",
      ],
    }),


    createEducation({
      id:
        "education-python-2024",

      title:
        "Introducción a Python — IBM SkillsBuild",

      aliases: [
        "BeJob Python",
        "IBM SkillsBuild Python",
      ],

      institution:
        "BeJob / IBM SkillsBuild",

      program:
        "Introducción a Python",

      period:
        "Oct – Dic 2024",

      validFrom:
        "2024-10-01",

      validTo:
        "2024-12-31",

      topics: [
        "python",
        "programming",
      ],
    }),


    createEducation({
      id:
        "education-financial-markets-2025",

      title:
        "Mercados Financieros Internacionales",

      aliases: [
        "Tecnofor Mercados Financieros",
      ],

      institution:
        "Tecnofor",

      program:
        "Mercados Financieros Internacionales",

      period:
        "Sep – Oct 2025",

      validFrom:
        "2025-09-01",

      validTo:
        "2025-10-31",

      topics: [
        "financial-markets",
        "international-markets",
      ],
    }),


    createEducation({
      id:
        "education-wealth-management-2025",

      title:
        "Gestión de Patrimonio",

      aliases: [
        "INTERPROS Gestión Patrimonio",
      ],

      institution:
        "INTERPROS",

      program:
        "Gestión de Patrimonio",

      period:
        "Oct – Dic 2025",

      validFrom:
        "2025-10-01",

      validTo:
        "2025-12-31",

      topics: [
        "wealth-management",
        "investment",
        "finance",
      ],
    }),


    createEducation({
      id:
        "education-entrepreneurship-2025",

      title:
        "Formación en emprendimiento",

      aliases: [
        "FUNDAE emprendimiento",
      ],

      institution:
        "FUNDAE",

      program:
        "Formación en emprendimiento",

      period:
        "Sep – Dic 2025",

      validFrom:
        "2025-09-01",

      validTo:
        "2025-12-31",

      topics: [
        "market-analysis",
        "ideation",
        "prototyping",
        "business-models",
        "mvp",
        "pilot",
        "scaling",
        "pitch",
        "finance",
        "legal-basics",
      ],
    }),
  ]);


export const educationKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      educationKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getEducationById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    educationKnowledgeById[id] ??
    null
  );
}


export function getEducationByTopic(
  topic,
) {
  if (
    typeof topic !== "string" ||
    !topic.trim()
  ) {
    return [];
  }

  const normalized =
    topic.trim().toLowerCase();

  return educationKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "topics",
        );

      return (
        fact?.value?.includes(
          normalized,
        ) ?? false
      );
    },
  );
}