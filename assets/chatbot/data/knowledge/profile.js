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
      fact.derivedFrom
        ? Object.freeze([
            ...fact.derivedFrom,
          ])
        : undefined,

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


export const profileKnowledge =
  Object.freeze([
    freezeKnowledgeItem({
      id: "profile-victor",

      type:
        KNOWLEDGE_TYPE.PROFILE,

      status:
        KNOWLEDGE_STATUS.ACTIVE,

      title:
        "Perfil profesional de Víctor Guzmán",

      shortDescription:
        "Profesional con trayectoria en tecnología bancaria, análisis funcional, gestión de proyectos, datos, Business Intelligence, automatización e inteligencia artificial aplicada.",

      aliases: [
        "Víctor",
        "Víctor Guzmán",
        "perfil de Víctor",
        "perfil profesional de Víctor",
        "trayectoria de Víctor",
      ],

      facts: [
        {
          id:
            "fact-profile-career-start-2004",

          key:
            "career-start",

          value:
            "2004",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "Inicio de la trayectoria profesional documentado y confirmado.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2004-01-01",

            validTo:
              null,
          },
        },

        {
          id:
            "fact-profile-banking-experience",

          key:
            "banking-experience",

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
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "La trayectoria profesional se desarrolla ampliamente en banca y mercados financieros.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              "2004-01-01",

            validTo:
              null,
          },
        },

        {
          id:
            "fact-profile-current-focus",

          key:
            "current-focus",

          value: [
            "data",
            "business-intelligence",
            "automation",
            "artificial-intelligence",
            "financial-markets",
          ],

          valueType:
            FACT_VALUE_TYPE.STRING_LIST,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "current-professional-context",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
                "source-portfolio-home",
              ],

              note:
                "Áreas actuales de trabajo y desarrollo profesional.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
            "source-portfolio-home",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              "2023-07-01",

            validTo:
              null,
          },
        },

        {
          id:
            "fact-profile-multidisciplinary",

          key:
            "multidisciplinary-profile",

          value: true,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.DERIVED,

          derivedFrom: [
            "fact-profile-banking-experience",
            "fact-profile-current-focus",
          ],

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "derived-professional-profile",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
                "source-portfolio-home",
              ],

              note:
                "Perfil derivado de la combinación de experiencia técnica, funcional, de gestión y de datos.",
            },
          ],

          sources: [],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              null,

            validTo:
              null,
          },
        },
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-business-technology-bridge",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },

        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-banking",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },

        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-financial-markets",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
        "source-portfolio-home",
      ],

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom:
          null,

        validTo:
          null,
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
          ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

        maxEvidenceItems: 2,

        allowInference: true,

        allowRecommendation: false,

        preferredDepth:
          ANSWER_DEPTH.MEDIUM,

        forbiddenClaims: [
          "price",
          "deadline",
          "availability",
          "undocumented-role",
          "undocumented-certification",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "El perfil multidisciplinar no implica experiencia profesional en cualquier tecnología o sector.",
        },

        {
          type:
            LIMITATION_TYPE.COMMERCIAL,

          claim:
            "El perfil profesional no implica disponibilidad inmediata ni aceptación automática de proyectos.",
        },
      ],

      metadata: {
        version: 1,
        category: "professional-profile",
      },
    }),


    freezeKnowledgeItem({
      id:
        "profile-career-evolution",

      type:
        KNOWLEDGE_TYPE.PROFILE,

      status:
        KNOWLEDGE_STATUS.ACTIVE,

      title:
        "Evolución profesional",

      shortDescription:
        "Evolución desde desarrollo COBOL y sistemas bancarios hacia análisis funcional, liderazgo, gestión de proyectos, mercados financieros, datos, BI, automatización e IA.",

      aliases: [
        "evolución profesional",
        "carrera profesional",
        "trayectoria profesional",
        "cómo ha evolucionado Víctor",
      ],

      facts: [
        {
          id:
            "fact-career-stage-development",

          key:
            "career-stage-development",

          value:
            "2004-2011: desarrollo, testing, core bancario, COBOL, batch y online.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
              ],

              note:
                "Primera etapa profesional.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2004-01-01",

            validTo:
              "2011-08-31",
          },
        },

        {
          id:
            "fact-career-stage-functional",

          key:
            "career-stage-functional",

          value:
            "2011-2015: análisis funcional, modernización, migraciones, requisitos y UAT.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
              ],

              note:
                "Etapa de transición hacia análisis funcional y proyectos de transformación.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2011-09-01",

            validTo:
              "2015-06-30",
          },
        },

        {
          id:
            "fact-career-stage-leadership",

          key:
            "career-stage-leadership",

          value:
            "2015-2017: liderazgo, entornos batch, producción crítica y optimización de rendimiento.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
              ],

              note:
                "Etapa con responsabilidades de coordinación y optimización.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2015-06-01",

            validTo:
              "2017-03-31",
          },
        },

        {
          id:
            "fact-career-stage-management",

          key:
            "career-stage-management",

          value:
            "2017-2023: gestión de proyectos y equipos en Valores y Capital Markets.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "professional-history",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "Etapa de gestión de proyectos y coordinación multidisciplinar.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.HISTORICAL,

            validFrom:
              "2017-06-01",

            validTo:
              "2023-07-31",
          },
        },

        {
          id:
            "fact-career-stage-data-ai",

          key:
            "career-stage-data-ai",

          value:
            "2023-actualidad: datos, BI, automatización e IA en el contexto de mercados financieros.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "current-professional-context",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "Etapa profesional actual.",
            },
          ],

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              "2023-07-01",

            validTo:
              null,
          },
        },
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.RELATED_TO,

          target:
            "profile-victor",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom:
          "2004-01-01",

        validTo:
          null,
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

        allowInference: true,

        allowRecommendation: false,

        preferredDepth:
          ANSWER_DEPTH.MEDIUM,

        forbiddenClaims: [
          "invented-career-stage",
          "invented-role",
          "invented-date",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Las etapas son una síntesis semántica de la trayectoria y no sustituyen el detalle cronológico de cada puesto.",
        },
      ],

      metadata: {
        version: 1,
        category: "career-evolution",
      },
    }),


    freezeKnowledgeItem({
      id:
        "profile-business-technology-bridge",

      type:
        KNOWLEDGE_TYPE.PROFILE,

      status:
        KNOWLEDGE_STATUS.ACTIVE,

      title:
        "Puente entre negocio y tecnología",

      shortDescription:
        "Capacidad desarrollada a lo largo de la trayectoria para conectar necesidades funcionales y de negocio con soluciones técnicas, datos y ejecución de proyectos.",

      aliases: [
        "puente negocio tecnología",
        "perfil técnico y funcional",
        "negocio y tecnología",
        "business technology bridge",
      ],

      facts: [
        {
          id:
            "fact-profile-technical-functional",

          key:
            "technical-functional-profile",

          value: true,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.DERIVED,

          derivedFrom: [
            "fact-career-stage-development",
            "fact-career-stage-functional",
            "fact-career-stage-management",
            "fact-career-stage-data-ai",
          ],

          evidence: [
            {
              strength:
                EVIDENCE_STRENGTH.STRONG,

              type:
                "derived-career-evidence",

              sourceIds: [
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "La combinación de desarrollo, análisis funcional, gestión y datos evidencia un perfil mixto.",
            },
          ],

          sources: [],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              null,

            validTo:
              null,
          },
        },
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-business-technology-bridge",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom:
          null,

        validTo:
          null,
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

        allowInference: true,

        allowRecommendation: false,

        preferredDepth:
          ANSWER_DEPTH.MEDIUM,

        forbiddenClaims: [
          "expert-in-every-domain",
          "expert-in-every-technology",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "Un perfil transversal no significa dominio profesional de cualquier tecnología.",
        },
      ],

      metadata: {
        version: 1,
        category: "professional-profile",
      },
    }),


    freezeKnowledgeItem({
      id:
        "profile-continuous-learning",

      type:
        KNOWLEDGE_TYPE.PROFILE,

      status:
        KNOWLEDGE_STATUS.ACTIVE,

      title:
        "Aprendizaje continuo",

      shortDescription:
        "Perfil de aprendizaje continuo, con formación técnica recurrente y evolución hacia nuevas áreas como datos, BI, Python, IA y Power Platform.",

      aliases: [
        "aprendizaje continuo",
        "formación continua",
        "capacidad de aprender",
        "aprende nuevas tecnologías",
      ],

      facts: [
        {
          id:
            "fact-profile-continuous-learning",

          key:
            "continuous-learning",

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
                "education-and-career-history",

              sourceIds: [
                "source-user-confirmed-learning",
                "source-user-confirmed-career",
                "source-linkedin-victor",
              ],

              note:
                "La trayectoria incluye formación recurrente y evolución tecnológica sostenida.",
            },
          ],

          sources: [
            "source-user-confirmed-learning",
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],

          disclosure:
            DISCLOSURE.PUBLIC_SUMMARY_ONLY,

          temporal: {
            status:
              TEMPORAL_STATUS.CURRENT,

            validFrom:
              null,

            validTo:
              null,
          },
        },
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.RELATED_TO,

          target:
            "profile-victor",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-learning",
            "source-user-confirmed-career",
          ],
        },
      ],

      sources: [
        "source-user-confirmed-learning",
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],

      disclosure:
        DISCLOSURE.PUBLIC_SUMMARY_ONLY,

      temporal: {
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom:
          null,

        validTo:
          null,
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

        allowInference: true,

        allowRecommendation: false,

        preferredDepth:
          ANSWER_DEPTH.SHORT,

        forbiddenClaims: [
          "can-learn-anything-instantly",
          "can-do-any-project",
          "automatic-expertise",
          "guaranteed-solution",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "El aprendizaje continuo no permite presentar como experiencia profesional una tecnología que no haya utilizado profesionalmente.",
        },

        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "La capacidad de aprender no implica que pueda aceptar o resolver cualquier proyecto sin evaluación previa.",
        },
      ],

      metadata: {
        version: 1,
        category: "continuous-learning",
      },
    }),
  ]);


export const profileKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      profileKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getProfileKnowledgeById(
  itemId,
) {
  if (
    typeof itemId !== "string" ||
    !itemId.trim()
  ) {
    return null;
  }

  return (
    profileKnowledgeById[
      itemId
    ] ?? null
  );
}