import test from "node:test";
import assert from "node:assert/strict";

import * as stateModule
  from "../core/state.js";

const {
  AVATAR_STATUS,
  BOOKING_STATUS,
  CONFIDENCE_BUCKET,
  CONVERSATION_STATUS,
  DIAGNOSTIC_STATUS,
  MESSAGE_ROLE,
  RECOMMENDATION_TYPE,
  SEMANTIC_RELATION,
  SEMANTIC_SUBJECT_TYPE,
} = stateModule;

function cleanState() {
  return stateModule.resetState();
}

test(
  "initial state is valid",
  () => {
    cleanState();

    const result =
      stateModule.validateState();

    assert.equal(
      result.valid,
      true,
    );

    assert.deepEqual(
      result.errors,
      [],
    );
  },
);

test(
  "normal conversational flow remains valid",
  () => {
    cleanState();

    stateModule.setPageContext({
      path: "/es/",
      pageId: "home",
      pageType: "landing",
      section: "home",
      locale: "es",
    });

    stateModule.appendMessage({
      role: MESSAGE_ROLE.USER,
      text:
        "Tengo varios Excel que actualizo cada semana",
    });

    stateModule.setIntentResult({
      primaryIntent: "automation",
      secondaryIntents: [
        "excel_problem",
      ],
      confidence: 0.92,
      confidenceBucket:
        CONFIDENCE_BUCKET.HIGH,
      concepts: [
        "manual_process",
      ],
    });

    stateModule.mergeEntities({
      case: {
        tools: [
          "excel",
        ],
        frequency: "weekly",
        currentProcess: "manual",
        volume: {
          files: 20,
        },
      },
    });

    stateModule.markQuestionAsked(
      "automation.file_structure",
    );

    stateModule.setLastAction(
      "ask_file_structure",
    );

    const result =
      stateModule.validateState();

    assert.equal(
      result.valid,
      true,
    );
  },
);

test(
  "diagnostic flow remains valid",
  () => {
    cleanState();

    stateModule.setDiagnosticStatus(
      DIAGNOSTIC_STATUS.COLLECTING,
    );

    stateModule.updateDiagnosticFields({
      needs: [
        "automation",
      ],
      currentProcess: "manual",
      users: 4,
      objective:
        "reducir trabajo manual",
    });

    stateModule.updateDiagnosticAssessment({
      missingFields: [
        "email",
        "timeframe",
      ],
      completionRatio: 0.7,
      summary: {
        situation:
          "Consolidación de Excel",
        objective:
          "Reducir trabajo manual",
      },
    });

    stateModule.setDiagnosticStatus(
      DIAGNOSTIC_STATUS.READY,
    );

    const result =
      stateModule.validateState();

    assert.equal(
      result.valid,
      true,
    );
  },
);

test(
  "recommendations remain valid",
  () => {
    cleanState();

    stateModule.addRecommendation({
      type:
        RECOMMENDATION_TYPE.PROJECT,
      id: "dashboard-pyme",
      reasonCode:
        "powerbi_reporting_match",
      shown: true,
    });

    stateModule.addRecommendation({
      type:
        RECOMMENDATION_TYPE.SOLUTION,
      id: "automation",
      reasonCode:
        "manual_process_match",
      shown: true,
    });

    const result =
      stateModule.validateState();

    assert.equal(
      result.valid,
      true,
    );
  },
);

test(
  "Calendly scheduled state is valid only through Calendly function",
  () => {
    cleanState();

    stateModule.setBookingStatus(
      BOOKING_STATUS.OFFERED,
      {
        source: "chatbot",
      },
    );

    stateModule.setBookingStatus(
      BOOKING_STATUS.OPENED,
    );

    stateModule.setBookingStatus(
      BOOKING_STATUS.TIME_SELECTED,
    );

    stateModule
      .confirmBookingScheduledFromCalendly();

    const current =
      stateModule.getState();

    assert.equal(
      current.booking.status,
      BOOKING_STATUS.SCHEDULED,
    );

    assert.ok(
      current.booking.scheduledAt,
    );

    assert.equal(
      stateModule
        .validateState()
        .valid,
      true,
    );
  },
);

test(
  "scheduled booking cannot be downgraded",
  () => {
    cleanState();

    stateModule
      .confirmBookingScheduledFromCalendly({
        source: "chatbot",
      });

    assert.throws(
      () => {
        stateModule.setBookingStatus(
          BOOKING_STATUS.OPENED,
        );
      },
      RangeError,
    );
  },
);

test(
  "conversation reset keeps session but removes conversation data",
  () => {
    cleanState();

    stateModule.appendMessage({
      role: MESSAGE_ROLE.USER,
      text: "Hola",
    });

    stateModule.mergeEntities({
      contact: {
        name: "Ana",
      },
    });

    const before =
      stateModule.getState();

    const after =
      stateModule.resetConversation();

    assert.equal(
      after.meta.sessionId,
      before.meta.sessionId,
    );

    assert.equal(
      after.conversation.started,
      false,
    );

    assert.equal(
      after.conversation.messages.length,
      0,
    );

    assert.equal(
      after.entities.contact.name,
      null,
    );

    assert.ok(
      after.conversation.id,
    );

    assert.equal(
      stateModule
        .validateState()
        .valid,
      true,
    );
  },
);

test(
  "technical reset creates a new session",
  () => {
    cleanState();

    const before =
      stateModule.getState();

    const after =
      stateModule.resetState();

    assert.notEqual(
      after.meta.sessionId,
      before.meta.sessionId,
    );

    assert.equal(
      after.conversation.id,
      null,
    );

    assert.equal(
      after.conversation.started,
      false,
    );

    assert.equal(
      stateModule
        .validateState()
        .valid,
      true,
    );
  },
);

test(
  "corrupt schemaVersion is detected",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.meta.schemaVersion =
      999;

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path ===
          "state.meta.schemaVersion",
      ),
    );
  },
);

test(
  "arbitrary HTML in messages is detected",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.conversation.messages
      .push({
        id: "msg_bad",
        role: MESSAGE_ROLE.USER,
        type: "text",
        text: "Hola",
        html:
          "<script>alert(1)</script>",
        createdAt:
          new Date().toISOString(),
      });

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".html",
          ),
      ),
    );
  },
);

test(
  "PII cannot be added to analytics",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.analytics.email =
      "ana@example.com";

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path ===
          "state.analytics.email",
      ),
    );
  },
);

test(
  "scheduled booking without scheduledAt is invalid",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.booking.status =
      BOOKING_STATUS.SCHEDULED;

    corrupted.booking.scheduledAt =
      null;

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "invalid direct update is transactional",
  () => {
    cleanState();

    const before =
      stateModule.getState();

    assert.throws(
      () => {
        stateModule.updateState(
          (draft) => {
            draft.booking.status =
              "banana";
          },
          {
            source:
              "test:invalid_mutation",
          },
        );
      },
      (error) =>
        error.name ===
        "StateValidationError",
    );

    const after =
      stateModule.getState();

    assert.deepEqual(
      after.booking,
      before.booking,
    );
  },
);

test(
  "more consecutive fallbacks than total is invalid",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.conversation
      .consecutiveFallbacks = 3;

    corrupted.conversation
      .totalFallbacks = 1;

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "invalid avatar state is detected",
  () => {
    cleanState();

    const corrupted =
      stateModule.getState();

    corrupted.ui.avatarState =
      "dancing";

    const result =
      stateModule.validateState(
        corrupted,
      );

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "valid avatar status remains accepted",
  () => {
    cleanState();

    stateModule.updateState(
      (draft) => {
        draft.ui.avatarState =
          AVATAR_STATUS.THINKING;
      },
      {
        source:
          "test:avatar",
      },
    );

    assert.equal(
      stateModule
        .validateState()
        .valid,
      true,
    );
  },
);

test(
  "state stays JSON serializable",
  () => {
    cleanState();

    stateModule.appendMessage({
      role: MESSAGE_ROLE.USER,
      text: "Hola",
    });

    const current =
      stateModule.getState();

    const serialized =
      JSON.stringify(current);

    const parsed =
      JSON.parse(serialized);

    assert.equal(
      parsed.meta.sessionId,
      current.meta.sessionId,
    );
  },
);
test(
  "semantic context can be set and cleared",
  () => {
    cleanState();

    stateModule.setSemanticContext({
      relation:
        SEMANTIC_RELATION.EXPERIENCE_WITH,

      subjectType:
        SEMANTIC_SUBJECT_TYPE.TECHNOLOGY,

      subjectId:
        "technology-aws",
    });

    let current =
      stateModule.getState();

    assert.deepEqual(
      current.understanding.semanticContext,
      {
        relation: "experience_with",
        subjectType: "technology",
        subjectId: "technology-aws",
      },
    );

    stateModule.clearSemanticContext();

    current =
      stateModule.getState();

    assert.deepEqual(
      current.understanding.semanticContext,
      {
        relation: null,
        subjectType: null,
        subjectId: null,
      },
    );
  },
);

test(
  "semantic context rejects invalid values",
  () => {
    cleanState();

    assert.throws(
      () =>
        stateModule.setSemanticContext({
          relation: "invented_relation",

          subjectType:
            SEMANTIC_SUBJECT_TYPE.TECHNOLOGY,

          subjectId:
            "technology-aws",
        }),
      RangeError,
    );

    assert.throws(
      () =>
        stateModule.setSemanticContext({
          relation:
            SEMANTIC_RELATION.EXPERIENCE_WITH,

          subjectType:
            SEMANTIC_SUBJECT_TYPE.TECHNOLOGY,

          subjectId: "",
        }),
      TypeError,
    );
  },
);

test(
  "conversation reset clears semantic context",
  () => {
    cleanState();

    stateModule.setSemanticContext({
      relation:
        SEMANTIC_RELATION.EXPERIENCE_WITH,

      subjectType:
        SEMANTIC_SUBJECT_TYPE.TECHNOLOGY,

      subjectId:
        "technology-aws",
    });

    stateModule.resetConversation();

    assert.deepEqual(
      stateModule
        .getState()
        .understanding
        .semanticContext,
      {
        relation: null,
        subjectType: null,
        subjectId: null,
      },
    );
  },
);