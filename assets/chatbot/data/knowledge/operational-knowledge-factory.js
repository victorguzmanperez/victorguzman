import {
  CLAIM_STATUS,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  KNOWLEDGE_STATUS,
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


function freezeKnowledgeItem(item) {
  return Object.freeze({
    ...item,

    aliases:
      Object.freeze([
        ...(item.aliases ?? []),
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
            ...(
              item.answerPolicy
                .forbiddenClaims ??
              []
            ),
          ]),
      }),

    limitations:
      Object.freeze(
        (item.limitations ?? [])
          .map(
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


export function createOperationalKnowledgeItem({
  id,
  type,
  title,
  aliases,
  summary,
  facts,
  sources,
  disclosure =
    DISCLOSURE.PUBLIC_SUMMARY_ONLY,
  coverage,
  answerPolicy,
  limitations = [],
  metadata = {},
}) {
  const temporal = {
    status:
      TEMPORAL_STATUS.CURRENT,

    validFrom: null,
    validTo: null,
  };


  const normalizedFacts =
    facts.map(
      ({
        suffix,
        key,
        value,
        valueType,
        status =
          CLAIM_STATUS.VERIFIED,
        strength =
          EVIDENCE_STRENGTH.STRONG,
        evidenceType =
          `${type}-fact`,
        note =
          "Hecho operativo autorizado para el asistente.",
        sources:
          factSources = sources,
      }) => ({
        id:
          `${id}-fact-${suffix}`,

        key,

        value,

        valueType,

        status,

        evidence: [
          {
            strength,

            type:
              evidenceType,

            sourceIds:
              factSources,

            note,
          },
        ],

        sources:
          factSources,

        disclosure,

        temporal,
      }),
    );


  return freezeKnowledgeItem({
    id,

    type,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts:
      normalizedFacts,

    relationships: [],

    sources,

    disclosure,

    temporal,

    coverage,

    answerPolicy,

    limitations,

    metadata: {
      version: 1,
      ...metadata,
    },
  });
}