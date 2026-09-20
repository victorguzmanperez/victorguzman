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

function freezeFact(
  fact,
) {
  return Object.freeze({
    ...fact,

    evidence:
      Object.freeze(
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


function freezeBusinessArea(
  item,
) {
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


function createBusinessArea({
  id,
  key,
  title,
  aliases,
  summary,
  temporalStatus,
  sources,
}) {
  const temporal = {
    status:
      temporalStatus,

    validFrom: null,
    validTo: null,
  };


  function fact({
    suffix,
    factKey,
    value,
  }) {
    return {
      id:
        `${id}-fact-${suffix}`,

      key:
        factKey,

      value,

      valueType:
        FACT_VALUE_TYPE.STRING,

      status:
        CLAIM_STATUS.USER_CONFIRMED,

      evidence: [
        {
          strength:
            EVIDENCE_STRENGTH.STRONG,

          type:
            "professional-business-context",

          sourceIds:
            sources,

          note:
            "Área de negocio respaldada por la trayectoria profesional autorizada.",
        },
      ],

      sources,

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal,
    };
  }


  return freezeBusinessArea({
    id,

    type:
      KNOWLEDGE_TYPE.BUSINESS_AREA,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      fact({
        suffix:
          "key",

        factKey:
          "business-area-key",

        value:
          key,
      }),

      fact({
        suffix:
          "summary",

        factKey:
          "business-area-summary",

        value:
          summary,
      }),
    ],

    relationships: [],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal,

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,

      /*
       * El área clasifica contexto.
       * No constituye por sí sola una
       * recomendación comercial.
       */
      canRecommend: false,

      /*
       * La evidencia debe proceder de
       * Experience/Profile, no del área
       * circularmente.
       */
      canProvideEvidence: false,

      canNavigate: false,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.NEVER,

      maxEvidenceItems: 0,

      allowInference: false,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.SHORT,

      forbiddenClaims: [
        "invented-business-area",
        "invented-current-experience",
        "invented-expertise",
        "automatic-service-fit",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "La presencia de un área de negocio clasifica experiencia respaldada por otras entidades Knowledge; no implica por sí sola experiencia actual, continua, nivel experto ni oferta comercial.",
      },

      {
        type:
          LIMITATION_TYPE.TEMPORAL,

        claim:
          "La actualidad concreta de la experiencia debe obtenerse de los registros Experience relacionados y no inferirse únicamente desde Business Area.",
      },
    ],

    metadata: {
      version: 1,
      category: "business-area",
      canonicalKey: key,
    },
  });
}


/* ============================================================
 * BUSINESS AREAS
 * ============================================================
 */

export const businessAreaKnowledge =
  Object.freeze([

    createBusinessArea({
      id:
        "business-area-banking",

      key:
        "banking",

      title:
        "Banca",

      aliases: [
        "banca",
        "banco",
        "banking",
        "sector bancario",
      ],

      summary:
        "Contexto profesional relacionado con sistemas, procesos y datos del sector bancario.",

      temporalStatus:
        TEMPORAL_STATUS.CURRENT,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createBusinessArea({
      id:
        "business-area-financial-markets",

      key:
        "financial-markets",

      title:
        "Mercados financieros",

      aliases: [
        "mercados financieros",
        "financial markets",
        "mercados",
      ],

      summary:
        "Contexto profesional relacionado con mercados financieros, información, procesos y herramientas de apoyo al negocio.",

      temporalStatus:
        TEMPORAL_STATUS.CURRENT,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createBusinessArea({
      id:
        "business-area-loans",

      key:
        "loans",

      title:
        "Préstamos",

      aliases: [
        "préstamos",
        "prestamos",
        "loans",
        "lending",
      ],

      summary:
        "Contexto profesional histórico relacionado con sistemas y procesos bancarios de préstamos.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-career",
      ],
    }),


    createBusinessArea({
      id:
        "business-area-capital-markets",

      key:
        "capital-markets",

      title:
        "Mercados de capitales",

      aliases: [
        "mercados de capitales",
        "capital markets",
      ],

      summary:
        "Contexto profesional histórico relacionado con proyectos y procesos tecnológicos en mercados de capitales.",

      temporalStatus:
        TEMPORAL_STATUS.HISTORICAL,

      sources: [
        "source-user-confirmed-career",
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const businessAreaKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      businessAreaKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export const businessAreaKnowledgeByKey =
  Object.freeze(
    Object.fromEntries(
      businessAreaKnowledge.map(
        (item) => [
          item.metadata
            .canonicalKey,

          item,
        ],
      ),
    ),
  );


export function getBusinessAreaById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    businessAreaKnowledgeById[
      id
    ] ?? null
  );
}


export function getBusinessAreaByKey(
  key,
) {
  if (
    typeof key !== "string" ||
    !key.trim()
  ) {
    return null;
  }

  return (
    businessAreaKnowledgeByKey[
      key
        .trim()
        .toLowerCase()
    ] ?? null
  );
}


export function getBusinessAreaFact(
  businessArea,
  key,
) {
  if (
    !businessArea ||
    !Array.isArray(
      businessArea.facts,
    )
  ) {
    return null;
  }

  return (
    businessArea.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}