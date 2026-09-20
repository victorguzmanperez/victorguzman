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


function policyAnswerPolicy() {
  return {
    directAnswer: true,

    mentionEvidence:
      ANSWER_EVIDENCE_MODE.NEVER,

    maxEvidenceItems: 0,

    allowInference: false,
    allowRecommendation: false,

    preferredDepth:
      ANSWER_DEPTH.MEDIUM,

    forbiddenClaims: [
      "invented-privacy-policy",
      "invented-retention",
      "automatic-consent",
      "automatic-transcript-storage",
      "analytics-with-pii",
    ],
  };
}


function policyCoverage() {
  return {
    level:
      COVERAGE_LEVEL.ANSWERABLE,

    canAnswerDirectly: true,
    canRecommend: false,
    canProvideEvidence: false,
    canNavigate: true,
  };
}


export const policyKnowledge =
  Object.freeze([

    createOperationalKnowledgeItem({
      id:
        "policy-chatbot-session-data",

      type:
        KNOWLEDGE_TYPE.POLICY,

      title:
        "Privacidad de la conversación",

      aliases: [
        "privacidad del chatbot",
        "guardar conversación",
        "se guarda el chat",
        "datos de conversación",
        "borrar conversación",
      ],

      summary:
        "Política V1 de minimización y persistencia temporal de la conversación.",

      sources: [
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix: "storage",
          key: "conversation-storage",
          value:
            "sessionStorage",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "ttl",
          key: "conversation-ttl-hours",
          value: 8,
          valueType:
            FACT_VALUE_TYPE.NUMBER,
        },

        {
          suffix: "messages",
          key: "max-persisted-messages",
          value: 50,
          valueType:
            FACT_VALUE_TYPE.NUMBER,
        },

        {
          suffix: "central-transcripts",
          key: "automatic-central-transcript-storage",
          value: false,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
        },

        {
          suffix: "drafts",
          key: "persist-input-drafts",
          value: false,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
        },
      ],

      coverage:
        policyCoverage(),

      answerPolicy:
        policyAnswerPolicy(),

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "La persistencia temporal no debe interpretarse como almacenamiento seguro de información sensible; la protección se basa en minimización, sesión corta y prevención XSS.",
        },
      ],

      metadata: {
        category:
          "conversation-privacy",
      },
    }),


    createOperationalKnowledgeItem({
      id:
        "policy-chatbot-analytics-privacy",

      type:
        KNOWLEDGE_TYPE.POLICY,

      title:
        "Privacidad de Analytics",

      aliases: [
        "analytics chatbot",
        "ga4 chatbot",
        "datos enviados a analytics",
        "seguimiento del chatbot",
      ],

      summary:
        "Política que limita Analytics a señales estructuradas y excluye datos personales y texto libre de la conversación.",

      sources: [
        "source-portfolio-privacy",
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix: "consent",
          key: "analytics-requires-consent",
          value: true,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
        },

        {
          suffix: "forbidden-data",
          key: "analytics-forbidden-data",
          value: [
            "name",
            "email",
            "phone",
            "conversation",
            "raw-message",
            "free-text",
            "diagnostic-summary",
          ],
          valueType:
            FACT_VALUE_TYPE.STRING_LIST,
          status:
            CLAIM_STATUS.VERIFIED,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix: "allowed-mode",
          key: "analytics-data-mode",
          value:
            "structured-non-pii-events",
          valueType:
            FACT_VALUE_TYPE.STRING,
          status:
            CLAIM_STATUS.VERIFIED,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

      ],

      coverage:
        policyCoverage(),

      answerPolicy:
        policyAnswerPolicy(),

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "Analytics no debe utilizarse como sistema de almacenamiento o reconstrucción de conversaciones individuales.",
        },
      ],

      metadata: {
        category:
          "analytics-privacy",
      },
    }),


    createOperationalKnowledgeItem({
      id:
        "policy-chatbot-improvement-feedback",

      type:
        KNOWLEDGE_TYPE.POLICY,

      title:
        "Mejora continua del asistente",

      aliases: [
        "mejorar chatbot",
        "analizar fallbacks",
        "preguntas sin respuesta",
        "feedback chatbot",
      ],

      summary:
        "Política prevista para detectar preguntas no cubiertas sin almacenar automáticamente conversaciones completas.",

      sources: [
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix: "automatic-transcripts",
          key: "automatic-transcript-collection",
          value: false,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
          status:
            CLAIM_STATUS.VERIFIED,
        },

        {
          suffix: "fallback-telemetry",
          key: "fallback-telemetry-mode",
          value:
            "structured-anonymous-signals",
          valueType:
            FACT_VALUE_TYPE.STRING,
          status:
            CLAIM_STATUS.VERIFIED,
        },

        {
          suffix: "exact-question",
          key: "exact-question-feedback",
          value:
            "optional-explicit-user-consent",
          valueType:
            FACT_VALUE_TYPE.STRING,
          status:
            CLAIM_STATUS.PLANNED,
        },

        {
          suffix: "review",
          key: "feedback-user-review",
          value: true,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
          status:
            CLAIM_STATUS.PLANNED,
        },
      ],

      coverage:
        policyCoverage(),

      answerPolicy:
        policyAnswerPolicy(),

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "Cualquier pregunta enviada voluntariamente para mejorar el asistente deberá minimizar o eliminar datos personales antes de incorporarse a datasets o QA.",
        },
      ],

      metadata: {
        category:
          "continuous-improvement",
      },
    }),
  ]);


export const policyKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      policyKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getPolicyById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    policyKnowledgeById[id] ??
    null
  );
}


export function getPolicyFact(
  policy,
  key,
) {
  if (!policy) {
    return null;
  }

  return (
    policy.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}