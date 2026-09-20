import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_QUICK_REPLY_KIND,
  createResponseEnvelope,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  INTENT_IDS,
} from "../core/nlu.js";

import {
  RESPONSE_INTERACTION_PRESET,
  RESPONSE_INTERACTION_TARGET,
  createActionQuickReply,
  createAnswerQuickReply,
  createCalendlyAction,
  createContactAction,
  createDiagnosticAction,
  createFallbackCategoryQuickReplies,
  createFeedbackAction,
  createInteractionSet,
  createIntentQuickReply,
  createNavigationAction,
} from "../core/response-interactions.js";


/* ============================================================
 * PRESETS
 * ============================================================
 */

test(
  "fallback categories preset has stable id",
  () => {
    assert.equal(
      RESPONSE_INTERACTION_PRESET
        .FALLBACK_CATEGORIES,
      "fallback-categories",
    );
  },
);


/* ============================================================
 * QUICK REPLY — INTENT
 * ============================================================
 */

test(
  "intent quick reply uses canonical intent kind and value",
  () => {
    const reply =
      createIntentQuickReply({
        id:
          "qr-projects",

        label:
          "Proyectos",

        intent:
          INTENT_IDS.PROJECTS,
      });


    assert.deepEqual(
      reply,
      {
        id:
          "qr-projects",

        label:
          "Proyectos",

        kind:
          RESPONSE_QUICK_REPLY_KIND
            .INTENT,

        value:
          INTENT_IDS.PROJECTS,
      },
    );
  },
);


test(
  "intent quick reply rejects unknown intent",
  () => {
    assert.equal(
      createIntentQuickReply({
        id:
          "qr-unknown",

        label:
          "Unknown",

        intent:
          "nonexistent-intent",
      }),
      null,
    );
  },
);


/* ============================================================
 * QUICK REPLY — ANSWER
 * ============================================================
 */

test(
  "answer quick reply preserves safe user-facing answer",
  () => {
    const reply =
      createAnswerQuickReply({
        id:
          "qr-technologies",

        label:
          "Tecnologías",

        answer:
          "¿Qué tecnologías conoce Víctor?",
      });


    assert.equal(
      reply.kind,
      RESPONSE_QUICK_REPLY_KIND
        .ANSWER,
    );

    assert.equal(
      reply.value,
      "¿Qué tecnologías conoce Víctor?",
    );
  },
);


test(
  "answer quick reply rejects blank answer",
  () => {
    assert.equal(
      createAnswerQuickReply({
        id:
          "qr-empty",

        label:
          "Vacío",

        answer:
          "   ",
      }),
      null,
    );
  },
);


/* ============================================================
 * QUICK REPLY — ACTION
 * ============================================================
 */

test(
  "action quick reply exposes canonical action type",
  () => {
    const reply =
      createActionQuickReply({
        id:
          "qr-contact",

        label:
          "Contactar",

        actionType:
          RESPONSE_ACTION_TYPE
            .OPEN_CONTACT,
      });


    assert.equal(
      reply.kind,
      RESPONSE_QUICK_REPLY_KIND
        .ACTION,
    );

    assert.equal(
      reply.value,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );
  },
);


test(
  "action quick reply rejects navigation because target cannot travel in quick reply",
  () => {
    assert.equal(
      createActionQuickReply({
        id:
          "qr-nav",

        label:
          "Ir",

        actionType:
          RESPONSE_ACTION_TYPE
            .NAVIGATE,
      }),
      null,
    );
  },
);


/* ============================================================
 * QUICK REPLY CONTRACT
 * ============================================================
 */

test(
  "quick reply factory trims string values",
  () => {
    const reply =
      createAnswerQuickReply({
        id:
          "  qr-trim  ",

        label:
          "  Opción  ",

        answer:
          "  Respuesta  ",
      });


    assert.deepEqual(
      reply,
      {
        id:
          "qr-trim",

        label:
          "Opción",

        kind:
          RESPONSE_QUICK_REPLY_KIND
            .ANSWER,

        value:
          "Respuesta",
      },
    );
  },
);


test(
  "quick reply factory enforces contract lengths",
  () => {
    assert.equal(
      createAnswerQuickReply({
        id:
          "x".repeat(81),

        label:
          "Opción",

        answer:
          "Respuesta",
      }),
      null,
    );


    assert.equal(
      createAnswerQuickReply({
        id:
          "qr-long-label",

        label:
          "x".repeat(61),

        answer:
          "Respuesta",
      }),
      null,
    );


    assert.equal(
      createAnswerQuickReply({
        id:
          "qr-long-value",

        label:
          "Opción",

        answer:
          "x".repeat(151),
      }),
      null,
    );
  },
);


/* ============================================================
 * CANONICAL ACTIONS
 * ============================================================
 */

test(
  "contact action resolves canonical Contact Knowledge target",
  () => {
    const action =
      createContactAction();


    assert.equal(
      action.type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );

    assert.equal(
      action.target,
      RESPONSE_INTERACTION_TARGET
        .CONTACT,
    );

    assert.equal(
      action.priority,
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,
    );
  },
);


test(
  "diagnostic action resolves canonical Diagnostic Knowledge target",
  () => {
    const action =
      createDiagnosticAction();


    assert.equal(
      action.type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.equal(
      action.target,
      RESPONSE_INTERACTION_TARGET
        .DIAGNOSTIC,
    );
  },
);


test(
  "Calendly action resolves canonical Booking Knowledge target",
  () => {
    const action =
      createCalendlyAction();


    assert.equal(
      action.type,
      RESPONSE_ACTION_TYPE
        .OPEN_CALENDLY,
    );

    assert.equal(
      action.target,
      RESPONSE_INTERACTION_TARGET
        .BOOKING,
    );
  },
);


test(
  "feedback action is secondary and has no navigation target",
  () => {
    const action =
      createFeedbackAction();


    assert.equal(
      action.type,
      RESPONSE_ACTION_TYPE
        .OFFER_FEEDBACK,
    );

    assert.equal(
      action.priority,
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,
    );

    assert.equal(
      action.target,
      null,
    );
  },
);


test(
  "specialized action factories allow safe labels and ids",
  () => {
    const action =
      createContactAction({
        id:
          "action-custom-contact",

        label:
          "Escribir a Víctor",

        priority:
          RESPONSE_ACTION_PRIORITY
            .SECONDARY,
      });


    assert.equal(
      action.id,
      "action-custom-contact",
    );

    assert.equal(
      action.label,
      "Escribir a Víctor",
    );

    assert.equal(
      action.priority,
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,
    );
  },
);


test(
  "specialized action factories reject invalid priority",
  () => {
    assert.equal(
      createContactAction({
        priority:
          "urgent",
      }),
      null,
    );
  },
);


test(
  "specialized action factories preserve confirmation flag",
  () => {
    const action =
      createDiagnosticAction({
        requiresConfirmation:
          true,
      });


    assert.equal(
      action.requiresConfirmation,
      true,
    );
  },
);


/* ============================================================
 * NAVIGATION
 * ============================================================
 */

test(
  "navigation action accepts safe relative html route",
  () => {
    const action =
      createNavigationAction({
        id:
          "action-solutions",

        label:
          "Ver soluciones",

        target:
          "soluciones.html",
      });


    assert.equal(
      action.type,
      RESPONSE_ACTION_TYPE
        .NAVIGATE,
    );

    assert.equal(
      action.target,
      "soluciones.html",
    );
  },
);


test(
  "navigation action accepts safe root-relative route",
  () => {
    const action =
      createNavigationAction({
        id:
          "action-diagnostic-route",

        label:
          "Abrir diagnóstico",

        target:
          "/diagnostico.html",
      });


    assert.equal(
      action.target,
      "/diagnostico.html",
    );
  },
);


test(
  "navigation action rejects external protocol",
  () => {
    assert.equal(
      createNavigationAction({
        id:
          "action-external",

        label:
          "External",

        target:
          "https://example.com",
      }),
      null,
    );
  },
);


test(
  "navigation action rejects protocol-relative URL",
  () => {
    assert.equal(
      createNavigationAction({
        id:
          "action-external",

        label:
          "External",

        target:
          "//example.com",
      }),
      null,
    );
  },
);


test(
  "navigation action rejects javascript URL",
  () => {
    assert.equal(
      createNavigationAction({
        id:
          "action-js",

        label:
          "Bad",

        target:
          "javascript:alert(1)",
      }),
      null,
    );
  },
);


/* ============================================================
 * FALLBACK CATEGORY PRESET
 * ============================================================
 */

test(
  "fallback category preset contains exactly four quick replies",
  () => {
    const replies =
      createFallbackCategoryQuickReplies();


    assert.equal(
      replies.length,
      4,
    );
  },
);


test(
  "fallback category preset contains experience projects and services intents",
  () => {
    const replies =
      createFallbackCategoryQuickReplies();


    const values =
      replies.map(
        (reply) =>
          reply.value,
      );


    assert.ok(
      values.includes(
        INTENT_IDS.EXPERIENCE,
      ),
    );

    assert.ok(
      values.includes(
        INTENT_IDS.PROJECTS,
      ),
    );

    assert.ok(
      values.includes(
        INTENT_IDS.SERVICES,
      ),
    );
  },
);


test(
  "technologies fallback category is answer-based until canonical intent exists",
  () => {
    const reply =
      createFallbackCategoryQuickReplies()
        .find(
          (item) =>
            item.label ===
            "Tecnologías",
        );


    assert.ok(reply);

    assert.equal(
      reply.kind,
      RESPONSE_QUICK_REPLY_KIND
        .ANSWER,
    );

    assert.equal(
      reply.value,
      "¿Qué tecnologías conoce Víctor?",
    );
  },
);


test(
  "fallback category quick reply ids are unique",
  () => {
    const replies =
      createFallbackCategoryQuickReplies();


    const ids =
      replies.map(
        (reply) =>
          reply.id,
      );


    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "fallback category preset is frozen",
  () => {
    const replies =
      createFallbackCategoryQuickReplies();


    assert.equal(
      Object.isFrozen(
        replies,
      ),
      true,
    );

    assert.equal(
      replies.every(
        Object.isFrozen,
      ),
      true,
    );
  },
);


/* ============================================================
 * INTERACTION SET
 * ============================================================
 */

test(
  "interaction set accepts four quick replies",
  () => {
    const interactions =
      createInteractionSet({
        quickReplies:
          createFallbackCategoryQuickReplies(),
      });


    assert.equal(
      interactions.quickReplies
        .length,
      4,
    );

    assert.deepEqual(
      interactions.actions,
      [],
    );
  },
);


test(
  "interaction set accepts at most two actions with one primary",
  () => {
    const interactions =
      createInteractionSet({
        actions: [
          createContactAction(),
          createFeedbackAction(),
        ],
      });


    assert.equal(
      interactions.actions.length,
      2,
    );
  },
);


test(
  "interaction set rejects more than four quick replies",
  () => {
    const replies = [
      ...createFallbackCategoryQuickReplies(),

      createAnswerQuickReply({
        id:
          "qr-extra",

        label:
          "Extra",

        answer:
          "Extra",
      }),
    ];


    assert.equal(
      createInteractionSet({
        quickReplies:
          replies,
      }),
      null,
    );
  },
);


test(
  "interaction set rejects more than two actions",
  () => {
    assert.equal(
      createInteractionSet({
        actions: [
          createContactAction(),

          createFeedbackAction(),

          createNavigationAction({
            id:
              "action-nav",

            label:
              "Ver soluciones",

            target:
              "soluciones.html",
          }),
        ],
      }),
      null,
    );
  },
);


test(
  "interaction set rejects two primary actions",
  () => {
    assert.equal(
      createInteractionSet({
        actions: [
          createContactAction(),
          createDiagnosticAction(),
        ],
      }),
      null,
    );
  },
);


test(
  "interaction set rejects duplicate ids across quick replies and actions",
  () => {
    assert.equal(
      createInteractionSet({
        quickReplies: [
          createAnswerQuickReply({
            id:
              "same-id",

            label:
              "Opción",

            answer:
              "Respuesta",
          }),
        ],

        actions: [
          createContactAction({
            id:
              "same-id",
          }),
        ],
      }),
      null,
    );
  },
);


test(
  "interaction set is frozen",
  () => {
    const interactions =
      createInteractionSet({
        quickReplies:
          createFallbackCategoryQuickReplies(),

        actions: [
          createFeedbackAction(),
        ],
      });


    assert.equal(
      Object.isFrozen(
        interactions,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        interactions.quickReplies,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        interactions.actions,
      ),
      true,
    );
  },
);


/* ============================================================
 * RESPONSE CONTRACT INTEGRATION
 * ============================================================
 */

test(
  "factory output can enter a valid Response Envelope",
  () => {
    const interactions =
      createInteractionSet({
        quickReplies:
          createFallbackCategoryQuickReplies(),

        actions: [
          createContactAction(),
        ],
      });


    const response =
      createResponseEnvelope({
        id:
          "response-interactions-test",

        kind:
          "action",

        outcome:
          "answered",

        intent:
          "projects",

        messages: [
          {
            id:
              "msg-interactions-test",

            purpose:
              "answer",

            text:
              "Elige una opción.",
          },
        ],

        quickReplies:
          interactions.quickReplies,

        actions:
          interactions.actions,
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


/* ============================================================
 * DEFENSIVE
 * ============================================================
 */

test(
  "interaction set rejects malformed quick reply objects",
  () => {
    assert.equal(
      createInteractionSet({
        quickReplies: [
          {
            id:
              "qr-bad",

            label:
              "Bad",

            kind:
              "invented",

            value:
              "x",
          },
        ],
      }),
      null,
    );
  },
);


test(
  "interaction set rejects malformed action objects",
  () => {
    assert.equal(
      createInteractionSet({
        actions: [
          {
            id:
              "action-bad",

            type:
              "invented",

            label:
              "Bad",

            priority:
              "primary",

            target:
              null,

            requiresConfirmation:
              false,
          },
        ],
      }),
      null,
    );
  },
);
