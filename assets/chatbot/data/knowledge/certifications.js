import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CERTIFICATION_STATUS,
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


const PL300_SOURCES =
  Object.freeze([
    "source-user-confirmed-pl300-status",
    "source-user-confirmed-learning",
  ]);


export const certificationKnowledge =
  Object.freeze([
    freezeItem({
      id:
        "certification-pl300",

      type:
        KNOWLEDGE_TYPE.CERTIFICATION,

      status:
        KNOWLEDGE_STATUS.ACTIVE,

      title:
        "Microsoft PL-300",

      shortDescription:
        "Víctor está preparando actualmente la certificación Microsoft PL-300. Ha completado formación específica, pero la certificación oficial todavía no está obtenida.",

      aliases: [
        "PL-300",
        "PL300",
        "Microsoft Power BI Data Analyst",
        "certificación Power BI",
      ],

      facts: [
        {
          id:
            "fact-pl300-status",

          key:
            "certification-status",

          value:
            CERTIFICATION_STATUS.PREPARING,

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "certification-status",

              sourceIds:
                PL300_SOURCES,

              note:
                "Estado actual confirmado directamente por Víctor.",
            },
          ],

          sources:
            PL300_SOURCES,

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
            "fact-pl300-training-completed",

          key:
            "training-completed",

          value: true,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "formal-training",

              sourceIds:
                PL300_SOURCES,

              note:
                "Formación específica basada en la ruta oficial PL-300 completada.",
            },
          ],

          sources:
            PL300_SOURCES,

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2024-10-01",

            validTo:
              "2024-11-30",
          },
        },

        {
          id:
            "fact-pl300-official-earned",

          key:
            "official-certification-earned",

          value: false,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "certification-status",

              sourceIds: [
                "source-user-confirmed-pl300-status",
              ],

              note:
                "Víctor ha confirmado que la certificación oficial aún no está obtenida.",
            },
          ],

          sources: [
            "source-user-confirmed-pl300-status",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom: null,
            validTo: null,
          },
        },
      ],

      relationships: [],

      sources:
        PL300_SOURCES,

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
        canRecommend: false,
        canProvideEvidence: true,
        canNavigate: false,
      },

      answerPolicy: {
        directAnswer: true,

        mentionEvidence:
          ANSWER_EVIDENCE_MODE.ALWAYS,

        maxEvidenceItems: 2,

        allowInference: false,

        allowRecommendation: false,

        preferredDepth:
          ANSWER_DEPTH.SHORT,

        forbiddenClaims: [
          "pl300-earned",
          "microsoft-certified-power-bi-data-analyst",
          "pl300-earned-date",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Debe decirse que Víctor está preparando PL-300, no que ya está certificado.",
        },

        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "Haber completado formación PL-300 no equivale a haber aprobado el examen oficial.",
        },
      ],

      metadata: {
        version: 1,
        category: "certification",
        provider: "Microsoft",
      },
    }),
  ]);


export const certificationKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      certificationKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getCertificationById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    certificationKnowledgeById[
      id
    ] ?? null
  );
}


export function getEarnedCertifications() {
  return certificationKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "official-certification-earned",
        );

      return fact?.value === true;
    },
  );
}


export function getPreparingCertifications() {
  return certificationKnowledge.filter(
    (item) => {
      const fact =
        item.facts.find(
          (candidate) =>
            candidate.key ===
            "certification-status",
        );

      return (
        fact?.value ===
        CERTIFICATION_STATUS.PREPARING
      );
    },
  );
}