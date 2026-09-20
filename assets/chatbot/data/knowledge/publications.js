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


function createPublication({
  id,
  title,
  aliases,
  summary,
  publicationKind,
  publicationStatus,
  publishedAt,
  technologies,
  sources,
  limitations = [],
}) {
  const temporal = {
    status:
      TEMPORAL_STATUS.CURRENT,

    validFrom:
      publishedAt,

    validTo: null,
  };


  function fact({
    suffix,
    key,
    value,
    valueType,
    evidenceType,
    note,
  }) {
    return {
      id:
        `${id}-fact-${suffix}`,

      key,

      value,

      valueType,

      status:
        CLAIM_STATUS.VERIFIED,

      evidence: [
        {
          strength:
            EVIDENCE_STRENGTH.STRONG,

          type:
            evidenceType,

          sourceIds:
            sources,

          note,
        },
      ],

      sources,

      disclosure:
        DISCLOSURE.PUBLIC,

      temporal,
    };
  }


  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.PUBLICATION,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription:
      summary,

    aliases,

    facts: [
      fact({
        suffix:
          "definition",

        key:
          "publication-definition",

        value:
          summary,

        valueType:
          FACT_VALUE_TYPE.STRING,

        evidenceType:
          "published-content",

        note:
          "Contenido publicado y accesible públicamente en DataVerso.",
      }),

      fact({
        suffix:
          "kind",

        key:
          "publication-kind",

        value:
          publicationKind,

        valueType:
          FACT_VALUE_TYPE.STRING,

        evidenceType:
          "publication-classification",

        note:
          "Clasificación del formato de publicación.",
      }),

      fact({
        suffix:
          "status",

        key:
          "publication-status",

        value:
          publicationStatus,

        valueType:
          FACT_VALUE_TYPE.STRING,

        evidenceType:
          "publication-status",

        note:
          "Estado público de la publicación.",
      }),

      fact({
        suffix:
          "published-at",

        key:
          "published-at",

        value:
          publishedAt,

        valueType:
          FACT_VALUE_TYPE.STRING,

        evidenceType:
          "publication-date",

        note:
          "Fecha pública de publicación.",
      }),

      fact({
        suffix:
          "technologies",

        key:
          "technologies-covered",

        value:
          technologies,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        evidenceType:
          "publication-topics",

        note:
          "Tecnologías tratadas explícitamente por la publicación o serie.",
      }),
    ],

    relationships: [
      ...technologies.map(
        (technologyId) => ({
          type:
            RELATION_TYPE.PUBLISHED_ABOUT,

          target:
            technologyId,

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources,
        }),
      ),
    ],

    sources,

    disclosure:
      DISCLOSURE.PUBLIC,

    temporal,

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,

      canRecommend: false,

      canProvideEvidence: true,

      /*
       * La publicación dispone de una
       * fuente web pública navegable.
       */
      canNavigate: true,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 2,

      /*
       * Nunca inferir publicaciones que
       * no estén materializadas.
       */
      allowInference: false,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.SHORT,

      forbiddenClaims: [
        "invented-publication",
        "invented-publication-content",
        "invented-publication-date",
        "automatic-expertise",
        "automatic-service-fit",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "Una publicación demuestra conocimiento público sobre el tema tratado, pero no debe utilizarse por sí sola para inferir experiencia profesional, nivel experto o capacidad comercial.",
      },

      {
        type:
          LIMITATION_TYPE.TEMPORAL,

        claim:
          "El catálogo de publicaciones es una selección curada. Las nuevas publicaciones deben incorporarse explícitamente a Knowledge antes de que el asistente pueda presentarlas como publicadas.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "publication",
      platform: "dataverso-substack",
    },
  });
}


/* ============================================================
 * PUBLICATIONS
 * ============================================================
 */

export const publicationKnowledge =
  Object.freeze([

    /* ========================================================
     * 01 — POWER BI DESDE CERO
     * ========================================================
     */

    createPublication({
      id:
        "publication-dataverso-power-bi",

      title:
        "Guía completa: Power BI desde cero",

      aliases: [
        "power bi desde cero",
        "guía power bi",
        "guia power bi",
        "guía completa power bi",
        "serie power bi",
        "curso power bi desde cero",
      ],

      summary:
        "Serie y guía progresiva de DataVerso para aprender Power BI desde los fundamentos, avanzando por conexión y transformación de datos, modelado, Power Query, DAX y visualización.",

      publicationKind:
        "series-guide",

      publicationStatus:
        "published-ongoing",

      publishedAt:
        "2026-03-09",

      technologies: [
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
      ],

      sources: [
        "source-dataverso-power-bi-guide",
        "source-dataverso-home",
      ],
    }),


    /* ========================================================
     * 02 — POWER QUERY: INTRODUCCIÓN
     * ========================================================
     */

    createPublication({
      id:
        "publication-dataverso-power-query-intro",

      title:
        "Transformación de datos con Power Query",

      aliases: [
        "qué es power query",
        "que es power query",
        "power query introducción",
        "power query introduccion",
        "introducción a power query",
        "power query desde cero",
        "transformación de datos con power query",
      ],

      summary:
        "Artículo introductorio de DataVerso sobre el papel de Power Query en la preparación y transformación de datos dentro de Power BI y punto de partida de la serie dedicada a esta herramienta.",

      publicationKind:
        "article",

      publicationStatus:
        "published",

      publishedAt:
        "2026-06-21",

      technologies: [
        "technology-power-query",
        "technology-power-bi",
      ],

      sources: [
        "source-dataverso-power-query-intro",
      ],
    }),


    /* ========================================================
     * 03 — POWER QUERY: MENÚ INICIO
     * ========================================================
     */

    createPublication({
      id:
        "publication-dataverso-power-query-home",

      title:
        "Power Query: Explorando el menú Inicio",

      aliases: [
        "power query menú inicio",
        "power query menu inicio",
        "menú inicio power query",
        "menu inicio power query",
        "explorando power query",
      ],

      summary:
        "Artículo práctico de DataVerso dedicado al menú Inicio del Editor de Power Query, sus principales opciones y su uso para conectar, organizar, preparar y transformar datos.",

      publicationKind:
        "article",

      publicationStatus:
        "published",

      publishedAt:
        "2026-06-28",

      technologies: [
        "technology-power-query",
        "technology-power-bi",
      ],

      sources: [
        "source-dataverso-power-query-home",
      ],
    }),
  ]);


/* ============================================================
 * INDEXES / QUERIES
 * ============================================================
 */

export const publicationKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      publicationKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getPublicationById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    publicationKnowledgeById[id] ??
    null
  );
}


export function getPublicationFact(
  publication,
  key,
) {
  if (
    !publication ||
    !Array.isArray(
      publication.facts,
    )
  ) {
    return null;
  }

  return (
    publication.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}


/* ============================================================
 * TECHNOLOGY → PUBLICATION
 * ============================================================
 */

function buildPublicationKnowledgeByTechnologyId() {
  const index = {};

  for (
    const publication
    of publicationKnowledge
  ) {
    const technologyIds =
      publication.relationships
        .filter(
          (relationship) =>
            relationship.type ===
            RELATION_TYPE.PUBLISHED_ABOUT,
        )
        .map(
          (relationship) =>
            relationship.target,
        );

    for (
      const technologyId
      of technologyIds
    ) {
      if (
        !Array.isArray(
          index[technologyId],
        )
      ) {
        index[technologyId] = [];
      }

      index[technologyId].push(
        publication,
      );
    }
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(
        index,
      ).map(
        ([
          technologyId,
          publications,
        ]) => [
          technologyId,

          Object.freeze([
            ...publications,
          ]),
        ],
      ),
    ),
  );
}


export const publicationKnowledgeByTechnologyId =
  buildPublicationKnowledgeByTechnologyId();


export function getPublicationsByTechnologyId(
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
    publicationKnowledgeByTechnologyId[
      technologyId
    ] ?? []
  );
}