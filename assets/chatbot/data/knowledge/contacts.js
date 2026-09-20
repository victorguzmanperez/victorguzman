import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  FACT_VALUE_TYPE,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
} from "./constants.js";

import {
  createOperationalKnowledgeItem,
} from "./operational-knowledge-factory.js";


export const contactKnowledge =
  Object.freeze([
    createOperationalKnowledgeItem({
      id:
        "contact-victor-portfolio",

      type:
        KNOWLEDGE_TYPE.CONTACT,

      title:
        "Contacto con Víctor",

      aliases: [
        "contactar con víctor",
        "hablar con víctor",
        "escribir a víctor",
        "contacto",
        "email",
        "linkedin",
      ],

      summary:
        "Canales públicos disponibles para contactar directamente con Víctor o iniciar un diagnóstico.",

      sources: [
        "source-portfolio-home",
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix: "channels",
          key: "contact-channels",
          value: [
            "email",
            "linkedin",
            "diagnostic",
          ],
          valueType:
            FACT_VALUE_TYPE.STRING_LIST,
        },

        {
          suffix: "route",
          key: "contact-route",
          value:
            "index.html#contacto",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "email",
          key: "contact-email",
          value:
            "victorguzman.data.pro@gmail.com",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "linkedin",
          key: "contact-linkedin",
          value:
            "https://www.linkedin.com/in/victorguzmanperez/",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "diagnostic-route",
          key: "diagnostic-route",
          value:
            "diagnostico.html",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "commercial-escalation",
          key: "commercial-escalation",
          value:
            "pricing-budget-quote-to-human-contact",
          valueType:
            FACT_VALUE_TYPE.STRING,
          status:
            CLAIM_STATUS.PLANNED,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },
      ],

      coverage: {
        level:
          COVERAGE_LEVEL.SAFE_REDIRECT,

        canAnswerDirectly: true,
        canRecommend: true,
        canProvideEvidence: false,
        canNavigate: true,
      },

      answerPolicy: {
        directAnswer: true,

        mentionEvidence:
          ANSWER_EVIDENCE_MODE.NEVER,

        maxEvidenceItems: 0,

        allowInference: false,
        allowRecommendation: true,

        preferredDepth:
          ANSWER_DEPTH.SHORT,

        forbiddenClaims: [
          "invented-contact-channel",
          "automatic-price",
          "guaranteed-response-time",
          "guaranteed-acceptance",
          "automatic-availability",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.COMMERCIAL,

          claim:
            "El asistente puede facilitar los canales públicos de contacto, pero no puede comprometer disponibilidad, precio, plazo, aceptación o respuesta de Víctor.",
        },
      ],

      metadata: {
        category: "contact",
      },
    }),
  ]);


export const contactKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      contactKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getContactById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    contactKnowledgeById[id] ??
    null
  );
}


export function getContactFact(
  contact,
  key,
) {
  if (!contact) {
    return null;
  }

  return (
    contact.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}