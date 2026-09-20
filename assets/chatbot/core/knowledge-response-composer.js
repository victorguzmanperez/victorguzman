import {
  RESPONSE_CONTINUITY,
  RESPONSE_DEPTH,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  createResponseEnvelope,
} from "./response-contract.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";


/* ============================================================
 * KNOWLEDGE RESPONSE COMPOSER
 * 1.11.22.3
 *
 * Construye respuestas DIRECTAS desde Knowledge.
 *
 * NO inventa facts.
 * NO realiza inferencias.
 * NO responde claims cualificados.
 * NO responde pricing / timing / availability.
 *
 * Las respuestas cualificadas se construirán en 1.11.22.4.
 * ============================================================
 */


/* ============================================================
 * MODES
 * ============================================================
 */

export const KNOWLEDGE_RESPONSE_MODE =
  Object.freeze({
    SUMMARY:
      "summary",

    FACT:
      "fact",

    LIST:
      "list",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function humanJoin(
  values,
) {
  const clean =
    values
      .map(
        safeString,
      )
      .filter(Boolean);


  if (
    clean.length === 0
  ) {
    return "";
  }


  if (
    clean.length === 1
  ) {
    return clean[0];
  }


  if (
    clean.length === 2
  ) {
    return `${clean[0]} y ${clean[1]}`;
  }


  return (
    `${clean
      .slice(
        0,
        -1,
      )
      .join(", ")} y ${
        clean.at(-1)
      }`
  );
}


function normalizeContext(
  context = {},
) {
  return {
    turnIndex:
      Number.isInteger(
        context.turnIndex,
      ) &&
      context.turnIndex >= 0
        ? context.turnIndex
        : 0,

    continuing:
      context.continuing ===
      true,

    visitorName:
      safeString(
        context.visitorName,
      ) ||
      null,

    suppressRepeatedCTA:
      context
        .suppressRepeatedCTA !==
      false,
  };
}


/* ============================================================
 * FACT VALUE → TEXT
 * ============================================================
 */

export function knowledgeFactValueToText(
  value,
) {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }


  if (
    typeof value === "number"
  ) {
    return String(value);
  }


  if (
    typeof value === "boolean"
  ) {
    return (
      value
        ? "Sí"
        : "No"
    );
  }


  if (
    Array.isArray(value)
  ) {
    return humanJoin(
      value.map(
        (item) =>
          String(item),
      ),
    );
  }


  return "";
}


/* ============================================================
 * DIRECT ANSWER ELIGIBILITY
 * ============================================================
 */

export function canComposeDirectKnowledgeAnswer(
  item,
) {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return false;
  }


  return (
    item.coverage
      ?.canAnswerDirectly ===
      true &&
    item.answerPolicy
      ?.directAnswer ===
      true
  );
}


/* ============================================================
 * SUMMARY TEXT
 * ============================================================
 */

function summaryForItem(
  item,
) {
  return (
    safeString(
      item.shortDescription,
    ) ||
    safeString(
      item.summary,
    ) ||
    safeString(
      item.title,
    )
  );
}


/* ============================================================
 * FACT LOOKUP
 * ============================================================
 */

function findFact(
  item,
  factKey,
) {
  if (
    !Array.isArray(
      item.facts,
    )
  ) {
    return null;
  }


  return (
    item.facts.find(
      (fact) =>
        fact.key ===
        factKey,
    ) ??
    null
  );
}


/* ============================================================
 * DIRECT SUMMARY RESPONSE
 * ============================================================
 */

export function composeKnowledgeSummaryResponse(
  {
    knowledgeId,
    intent = null,
    context = {},
    faqId = null,
    answerQaId = null,
  } = {},
) {
  const item =
    getKnowledgeById(
      knowledgeId,
    );


  if (!item) {
    return null;
  }


  if (
    !canComposeDirectKnowledgeAnswer(
      item,
    )
  ) {
    return null;
  }


  const text =
    summaryForItem(
      item,
    );


  if (!text) {
    return null;
  }


  const normalized =
    normalizeContext(
      context,
    );


  return createResponseEnvelope({
    id:
      `response-knowledge-${item.id}`,

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent,

    messages: [
      {
        id:
          `msg-knowledge-${item.id}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text,
      },
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        "knowledge-direct-summary",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE
          .WHEN_USEFUL,

      knowledgeIds: [
        item.id,
      ],
    },

    safety: {
      mustQualify:
        false,

      allowInference:
        false,

      forbiddenClaims:
        item.answerPolicy
          ?.forbiddenClaims ??
        [],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalized.continuing
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        normalized
          .suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        "knowledge-direct-summary",
    },
  });
}


/* ============================================================
 * DIRECT FACT RESPONSE
 * ============================================================
 */

export function composeKnowledgeFactResponse(
  {
    knowledgeId,
    factKey,
    intent = null,
    context = {},
    faqId = null,
    answerQaId = null,
  } = {},
) {
  const item =
    getKnowledgeById(
      knowledgeId,
    );


  if (!item) {
    return null;
  }


  if (
    !canComposeDirectKnowledgeAnswer(
      item,
    )
  ) {
    return null;
  }


  const fact =
    findFact(
      item,
      factKey,
    );


  if (!fact) {
    return null;
  }


  const valueText =
    knowledgeFactValueToText(
      fact.value,
    );


  if (!valueText) {
    return null;
  }


  const normalized =
    normalizeContext(
      context,
    );


  return createResponseEnvelope({
    id:
      `response-knowledge-${item.id}-${fact.key}`,

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent,

    messages: [
      {
        id:
          `msg-knowledge-${fact.id}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text:
          valueText,
      },
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.SHORT,

      splitBubbles:
        false,

      variationFamily:
        "knowledge-direct-fact",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE
          .WHEN_USEFUL,

      knowledgeIds: [
        item.id,
      ],

      factIds: [
        fact.id,
      ],
    },

    safety: {
      mustQualify:
        false,

      allowInference:
        false,

      forbiddenClaims:
        item.answerPolicy
          ?.forbiddenClaims ??
        [],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalized.continuing
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        normalized
          .suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        "knowledge-direct-fact",
    },
  });
}


/* ============================================================
 * LIST RESPONSE
 * ============================================================
 */

export function composeKnowledgeListResponse(
  {
    knowledgeIds,
    intent = null,
    intro = null,
    context = {},
    faqId = null,
    answerQaId = null,
  } = {},
) {
  if (
    !Array.isArray(
      knowledgeIds,
    ) ||
    knowledgeIds.length === 0
  ) {
    return null;
  }


  const items =
    knowledgeIds
      .map(
        getKnowledgeById,
      )
      .filter(Boolean);


  if (
    items.length === 0
  ) {
    return null;
  }


  if (
    items.some(
      (item) =>
        !canComposeDirectKnowledgeAnswer(
          item,
        ),
    )
  ) {
    return null;
  }


  const titles =
    items
      .map(
        (item) =>
          safeString(
            item.title,
          ),
      )
      .filter(Boolean);


  if (
    titles.length === 0
  ) {
    return null;
  }


  const listText =
    humanJoin(
      titles,
    );


  const text =
    intro
      ? `${safeString(
          intro,
        )} ${listText}.`
      : `${listText}.`;


  const normalized =
    normalizeContext(
      context,
    );


  return createResponseEnvelope({
    id:
      "response-knowledge-list",

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent,

    messages: [
      {
        id:
          "msg-knowledge-list",

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text,
      },
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.MEDIUM,

      splitBubbles:
        false,

      variationFamily:
        "knowledge-direct-list",

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE
          .WHEN_USEFUL,

      knowledgeIds:
        items.map(
          (item) =>
            item.id,
        ),
    },

    safety: {
      mustQualify:
        false,

      allowInference:
        false,

      forbiddenClaims:
        [
          ...new Set(
            items.flatMap(
              (item) =>
                item.answerPolicy
                  ?.forbiddenClaims ??
                [],
            ),
          ),
        ],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalized.continuing
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        normalized
          .suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        "knowledge-direct-list",
    },
  });
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeDirectKnowledgeResponse(
  {
    mode =
      KNOWLEDGE_RESPONSE_MODE
        .SUMMARY,

    ...options
  } = {},
) {
  switch (mode) {

    case KNOWLEDGE_RESPONSE_MODE
      .SUMMARY:
      return (
        composeKnowledgeSummaryResponse(
          options,
        )
      );


    case KNOWLEDGE_RESPONSE_MODE
      .FACT:
      return (
        composeKnowledgeFactResponse(
          options,
        )
      );


    case KNOWLEDGE_RESPONSE_MODE
      .LIST:
      return (
        composeKnowledgeListResponse(
          options,
        )
      );


    default:
      return null;
  }
}