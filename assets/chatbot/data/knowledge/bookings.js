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


export const bookingKnowledge =
  Object.freeze([
    createOperationalKnowledgeItem({
      id:
        "booking-calendly-initial-meeting",

      type:
        KNOWLEDGE_TYPE.BOOKING,

      title:
        "Reserva de reunión inicial",

      aliases: [
        "reservar reunión",
        "reservar una reunión",
        "agendar llamada",
        "agendar reunión",
        "calendly",
        "pedir cita",
      ],

      summary:
        "Reserva opcional de una reunión inicial mediante la integración pública de Calendly.",

      sources: [
        "source-portfolio-diagnostic",
        "source-portfolio-privacy",
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix: "provider",
          key: "booking-provider",
          value:
            "calendly",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "url",
          key: "booking-url",
          value:
            "https://calendly.com/victorguzman-data-pro/reunion-inicial-proyecto",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "mode",
          key: "booking-mode",
          value:
            "inline-widget",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "duration",
          key: "meeting-duration-minutes",
          value: 30,
          valueType:
            FACT_VALUE_TYPE.NUMBER,
        },

        {
          suffix: "prefill",
          key: "booking-prefill-fields",
          value: [
            "name",
            "email",
          ],
          valueType:
            FACT_VALUE_TYPE.STRING_LIST,
        },

        {
          suffix: "events",
          key: "booking-events",
          value: [
            "calendly.event_type_viewed",
            "calendly.date_and_time_selected",
            "calendly.event_scheduled",
          ],
          valueType:
            FACT_VALUE_TYPE.STRING_LIST,
        },

        {
          suffix: "confirmation-event",
          key: "booking-confirmation-event",
          value:
            "calendly.event_scheduled",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "availability-authority",
          key: "availability-authority",
          value:
            "calendly",
          valueType:
            FACT_VALUE_TYPE.STRING,
        },

        {
          suffix: "source",
          key: "booking-source",
          value:
            "chatbot",
          valueType:
            FACT_VALUE_TYPE.STRING,
          status:
            CLAIM_STATUS.PLANNED,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix: "preference-fields",
          key: "booking-preference-fields",
          value: [
            "preferred-date",
            "preferred-time-window",
            "timezone",
          ],
          valueType:
            FACT_VALUE_TYPE.STRING_LIST,
          status:
            CLAIM_STATUS.PLANNED,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix: "automatic-booking",
          key: "automatic-booking",
          value: false,
          valueType:
            FACT_VALUE_TYPE.BOOLEAN,
          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },
      ],

      coverage: {
        level:
          COVERAGE_LEVEL.ANSWERABLE,

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
          "invented-availability",
          "invented-booking",
          "booking-confirmed-without-event",
          "automatic-availability",
          "automatic-booking",
          "guaranteed-availability",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "La fecha u hora indicada por el usuario es únicamente una preferencia hasta que Calendly muestre disponibilidad real.",
        },

        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "El asistente solo puede considerar una reserva confirmada después de recibir el evento real calendly.event_scheduled.",
        },

        {
          type:
            LIMITATION_TYPE.COMMERCIAL,

          claim:
            "La reserva de una reunión no implica aceptación del proyecto, presupuesto, plazo ni compromiso comercial.",
        },
      ],

      metadata: {
        category: "booking",
        provider: "calendly",
      },
    }),
  ]);


export const bookingKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      bookingKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getBookingById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    bookingKnowledgeById[id] ??
    null
  );
}


export function getBookingFact(
  booking,
  key,
) {
  if (!booking) {
    return null;
  }

  return (
    booking.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}