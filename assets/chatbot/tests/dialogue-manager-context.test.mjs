import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
} from "../core/response-contract.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
} from "../core/nlu.js";

import {
  DIALOGUE_ROUTE,
  DIALOGUE_STATE_MARKER,
  buildDialogueContext,
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  MESSAGE_ROLE,
  getState,
  resetState,
} from "../core/state.js";


/* ============================================================
 * HELPERS
 * ============================================================
 */

function visibleText(
  response,
) {
  return (
    response
      ?.messages ??
    []
  )
    .map(
      (message) =>
        message.text,
    )
    .join(" ")
    .trim();
}


function resetDialogueState() {
  resetState();

  return getState();
}


/* ============================================================
 * .23.8 — BASIC CONTEXT FROM STATE
 * ============================================================
 */

test(
  "buildDialogueContext exposes safe initial defaults",
  () => {
    resetDialogueState();

    const context =
      buildDialogueContext();

    assert.equal(
      context.previousIntent,
      null,
    );

    assert.equal(
      context.currentTopic,
      null,
    );

    assert.equal(
      context.consecutiveFallbacks,
      0,
    );

    assert.equal(
      context.pendingConfirmation,
      null,
    );

    assert.equal(
      context.visitorName,
      null,
    );

    assert.equal(
      context.continuing,
      false,
    );
  },
);


test(
  "DAX turn creates a real pending confirmation in state",
  () => {
    resetDialogueState();

    const result =
      processDialogueTurn({
        userText:
          "¿Sabe DAX?",
      });

    const state =
      getState();

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.CONFIRMATION,
    );

    assert.equal(
      result.response.outcome,
      RESPONSE_OUTCOME.NEEDS_CLARIFICATION,
    );

    assert.ok(
      state.understanding
        .pendingConfirmation,
    );

    assert.deepEqual(
      state.understanding
        .pendingConfirmation
        .candidates,
      [
        INTENT_IDS.POWER_BI,
      ],
    );
  },
);


test(
  "positive reply resolves DAX pending confirmation instead of creating fallback",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Sabe DAX?",
    });

    const result =
      processDialogueTurn({
        userText:
          "Sí",
      });

    const state =
      getState();

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    assert.notEqual(
      result.response.kind,
      RESPONSE_KIND.FALLBACK,
    );

    assert.ok(
      result.response.evidence
        .knowledgeIds
        .includes(
          "technology-dax",
        ),
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /DAX|uso profesional|Power BI/i,
    );

    assert.equal(
      state.understanding
        .pendingConfirmation,
      null,
    );

    assert.equal(
      state.conversation
        .consecutiveFallbacks,
      0,
    );
  },
);


test(
  "negative reply rejects pending confirmation without fallback",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Sabe DAX?",
    });

    const result =
      processDialogueTurn({
        userText:
          "No",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.CONFIRMATION,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.DISCOVERY,
    );

    assert.equal(
      result.response.outcome,
      RESPONSE_OUTCOME.NEEDS_CLARIFICATION,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /otra forma|exactamente qué quieres saber/i,
    );

    assert.equal(
      getState()
        .understanding
        .pendingConfirmation,
      null,
    );

    assert.equal(
      getState()
        .conversation
        .consecutiveFallbacks,
      0,
    );
  },
);


test(
  "new substantive question abandons old pending confirmation",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Sabe DAX?",
    });

    const result =
      processDialogueTurn({
        userText:
          "¿Qué proyectos tiene?",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    assert.equal(
      result.decision.intent,
      INTENT_IDS.PROJECTS,
    );

    assert.equal(
      getState()
        .understanding
        .pendingConfirmation,
      null,
    );
  },
);


/* ============================================================
 * REAL FALLBACK CHAIN FROM CENTRAL STATE
 * ============================================================
 */

test(
  "three real unknown turns progress CLARIFY to CATEGORIES to ESCALATE using state",
  () => {
    resetDialogueState();

    const first =
      processDialogueTurn({
        userText:
          "asdfgh qwerty",
      });

    const second =
      processDialogueTurn({
        userText:
          "zxcvbn poiuy",
      });

    const third =
      processDialogueTurn({
        userText:
          "mnbvc lkjhg",
      });

    assert.equal(
      first.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.CLARIFY,
    );

    assert.equal(
      second.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );

    assert.equal(
      third.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.ESCALATE,
    );

    assert.equal(
      getState()
        .conversation
        .consecutiveFallbacks,
      3,
    );

    assert.equal(
      getState()
        .conversation
        .totalFallbacks,
      3,
    );
  },
);


test(
  "recognized turn resets a real fallback chain",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "asdfgh qwerty",
    });

    processDialogueTurn({
      userText:
        "zxcvbn poiuy",
    });

    const result =
      processDialogueTurn({
        userText:
          "¿Qué ha estudiado Víctor?",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      getState()
        .conversation
        .consecutiveFallbacks,
      0,
    );
  },
);


/* ============================================================
 * PERSONALIZATION CONTEXT
 * ============================================================
 */

test(
  "explicit visitor name is retained in conversational context",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "Me llamo Ana",
    });

    const context =
      buildDialogueContext();

    assert.equal(
      context.visitorName,
      "Ana",
    );

    assert.equal(
      getState()
        .entities
        .contact
        .name,
      "Ana",
    );
  },
);


test(
  "first anonymous greeting does not solicit a name",
  () => {
    resetDialogueState();

    const result =
      processDialogueTurn({
        userText:
          "Hola",
      });

    assert.equal(
      result.response
        .personalization
        .mayAskName,
      false,
    );

    assert.ok(
      !getState()
        .conversation
        .askedQuestionIds
        .includes(
          DIALOGUE_STATE_MARKER
            .NAME_ASKED,
        ),
    );
  },
);


test(
  "second anonymous greeting does not ask visitor name again",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "Hola",
    });

    const result =
      processDialogueTurn({
        userText:
          "Buenas",
      });

    assert.equal(
      result.response
        .personalization
        .mayAskName,
      false,
    );

    assert.equal(
      result.response.followUp,
      null,
    );
  },
);


test(
  "goodbye after meaningful conversation offers feedback once",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Quién es Víctor?",
    });

    const firstGoodbye =
      processDialogueTurn({
        userText:
          "Hasta luego",
      });

    assert.equal(
      firstGoodbye.response
        .actions.length,
      0,
    );

    assert.deepEqual(
      firstGoodbye.response
        .quickReplies
        .map((item) => item.label),
      [
        "👍 Sí",
        "😐 Más o menos",
        "👎 No",
      ],
    );

    assert.ok(
      getState()
        .conversation
        .askedQuestionIds
        .includes(
          DIALOGUE_STATE_MARKER
            .FEEDBACK_OFFERED,
        ),
    );

    const secondGoodbye =
      processDialogueTurn({
        userText:
          "Adiós",
      });

    assert.deepEqual(
      secondGoodbye.response
        .actions,
      [],
    );
  },
);


/* ============================================================
 * TOPIC + MESSAGE STATE
 * ============================================================
 */

test(
  "substantive route updates currentTopic and social thanks does not erase it",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Qué proyectos tiene?",
    });

    assert.equal(
      getState()
        .understanding
        .currentTopic,
      INTENT_IDS.PROJECTS,
    );

    processDialogueTurn({
      userText:
        "Gracias",
    });

    assert.equal(
      getState()
        .understanding
        .currentTopic,
      INTENT_IDS.PROJECTS,
    );
  },
);


test(
  "real turns persist user and assistant text messages only",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Quién es Víctor?",
    });

    const messages =
      getState()
        .conversation
        .messages;

    assert.ok(
      messages.some(
        (message) =>
          message.role ===
            MESSAGE_ROLE.USER,
      ),
    );

    assert.ok(
      messages.some(
        (message) =>
          message.role ===
            MESSAGE_ROLE.ASSISTANT,
      ),
    );

    for (
      const message
      of messages
    ) {
      assert.equal(
        Object.prototype
          .hasOwnProperty.call(
            message,
            "html",
          ),
        false,
      );
    }
  },
);


test(
  "dialogue context and complete state remain JSON serializable",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Qué tecnologías domina?",
    });

    assert.doesNotThrow(
      () =>
        JSON.stringify(
          buildDialogueContext(),
        ),
    );

    assert.doesNotThrow(
      () =>
        JSON.stringify(
          getState(),
        ),
    );
  },
);
/* ============================================================
 * DM-H3 — SEMANTIC FOLLOW-UPS
 * ============================================================
 */

test(
  "technology experience turn stores structured semantic context",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Víctor tiene experiencia con AWS?",
    });

    assert.deepEqual(
      getState()
        .understanding
        .semanticContext,
      {
        relation:
          "experience_with",

        subjectType:
          "technology",

        subjectId:
          "technology-aws",
      },
    );
  },
);


test(
  "semantic follow-up inherits experience relation for a new technology",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Víctor tiene experiencia con AWS?",
    });

    const result =
      processDialogueTurn({
        userText:
          "¿Y con Qlik Sense?",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_DIRECT,
    );

    assert.equal(
      result.decision
        .metadata
        .knowledgeId,
      "technology-qlik",
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /QlikView|Qlik Sense|NPrinting/i,
    );

    assert.deepEqual(
      getState()
        .understanding
        .semanticContext,
      {
        relation:
          "experience_with",

        subjectType:
          "technology",

        subjectId:
          "technology-qlik",
      },
    );
  },
);


test(
  "temporal follow-up reuses the previous technology safely",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Ha trabajado con COBOL?",
    });

    const result =
      processDialogueTurn({
        userText:
          "¿Y actualmente?",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_DIRECT,
    );

    assert.equal(
      result.decision
        .metadata
        .knowledgeId,
      "technology-cobol",
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /no consta.*actual|histórica/i,
    );

    assert.equal(
      getState()
        .understanding
        .semanticContext
        .subjectId,
      "technology-cobol",
    );
  },
);


test(
  "semantic context is cleared after a substantive topic change",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Tiene experiencia con AWS?",
    });

    processDialogueTurn({
      userText:
        "¿Qué proyectos tiene?",
    });

    assert.deepEqual(
      getState()
        .understanding
        .semanticContext,
      {
        relation:
          null,

        subjectType:
          null,

        subjectId:
          null,
      },
    );
  },
);


test(
  "unknown technology follow-up cannot inherit stale evidence",
  () => {
    resetDialogueState();

    processDialogueTurn({
      userText:
        "¿Tiene experiencia con AWS?",
    });

    const result =
      processDialogueTurn({
        userText:
          "¿Y con UnknownEngine?",
      });

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .FALLBACK,
    );

    assert.ok(
      !(
        result.response
          ?.evidence
          ?.knowledgeIds ??
        []
      ).some(
        (id) =>
          id.startsWith(
            "technology-",
          ),
      ),
    );

    assert.deepEqual(
      getState()
        .understanding
        .semanticContext,
      {
        relation:
          null,

        subjectType:
          null,

        subjectId:
          null,
      },
    );
  },
);