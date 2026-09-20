import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTION_ROUTER_STATUS,
  createActionRouter,
  resolveActionDestination,
} from "../core/actions.js";

import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_QUICK_REPLY_KIND,
} from "../core/response-contract.js";

import {
  RESPONSE_INTERACTION_TARGET,
} from "../core/response-interactions.js";

import {
  getState,
  resetState,
} from "../core/state.js";


const SITE_BASE =
  "https://victorguzmanperez.github.io/victorguzman/";


function action(
  type,
  target,
  overrides = {},
) {
  return {
    id:
      overrides.id ??
      `action-${type}`,
    type,
    label:
      overrides.label ??
      "Acción",
    priority:
      RESPONSE_ACTION_PRIORITY.PRIMARY,
    target,
    requiresConfirmation:
      overrides.requiresConfirmation ??
      false,
  };
}


test(
  "contact destination is resolved from canonical Knowledge",
  () => {
    const result =
      resolveActionDestination(
        action(
          RESPONSE_ACTION_TYPE.OPEN_CONTACT,
          RESPONSE_INTERACTION_TARGET.CONTACT,
        ),
        {
          siteBaseUrl:
            SITE_BASE,
        },
      );

    assert.deepEqual(
      result,
      {
        kind:
          "internal",
        url:
          `${SITE_BASE}index.html#contacto`,
      },
    );
  },
);


test(
  "diagnostic destination remains portfolio-rooted from project pages",
  () => {
    const result =
      resolveActionDestination(
        action(
          RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
          RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,
        ),
        {
          siteBaseUrl:
            SITE_BASE,
        },
      );

    assert.equal(
      result?.url,
      `${SITE_BASE}diagnostico.html`,
    );
  },
);


test(
  "Calendly destination comes from booking Knowledge and is HTTPS",
  () => {
    const result =
      resolveActionDestination(
        action(
          RESPONSE_ACTION_TYPE.OPEN_CALENDLY,
          RESPONSE_INTERACTION_TARGET.BOOKING,
        ),
        {
          siteBaseUrl:
            SITE_BASE,
        },
      );

    assert.equal(
      result?.kind,
      "external",
    );

    assert.equal(
      result?.url,
      "https://calendly.com/victorguzman-data-pro/reunion-inicial-proyecto",
    );
  },
);


test(
  "navigate action is rooted at GitHub Pages site base",
  () => {
    const result =
      resolveActionDestination(
        action(
          RESPONSE_ACTION_TYPE.NAVIGATE,
          "projects/investment.html",
        ),
        {
          siteBaseUrl:
            SITE_BASE,
        },
      );

    assert.equal(
      result?.url,
      `${SITE_BASE}projects/investment.html`,
    );
  },
);


test(
  "navigate rejects protocols and protocol-relative targets",
  () => {
    for (const target of [
      "javascript:alert(1)",
      "https://evil.example/",
      "//evil.example/path",
    ]) {
      assert.equal(
        resolveActionDestination(
          action(
            RESPONSE_ACTION_TYPE.NAVIGATE,
            target,
          ),
          {
            siteBaseUrl:
              SITE_BASE,
          },
        ),
        null,
      );
    }
  },
);


test(
  "internal action executes once and records lastAction",
  () => {
    resetState();

    const navigations = [];

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,
        windowRef: {
          location: {
            assign(url) {
              navigations.push(url);
            },
          },
        },
      });

    const result =
      router.executeAction(
        action(
          RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
          RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,
          {
            id:
              "action-test-diagnostic",
          },
        ),
      );

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    assert.deepEqual(
      navigations,
      [
        `${SITE_BASE}diagnostico.html`,
      ],
    );

    assert.equal(
      getState().conversation.lastAction,
      "action-test-diagnostic",
    );
  },
);


test(
  "external Calendly opens with noopener and does not confirm a booking",
  () => {
    resetState();

    const opens = [];

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,
        windowRef: {
          open(...args) {
            opens.push(args);
            return {
              opener:
                "unsafe",
            };
          },
        },
      });

    const result =
      router.executeAction(
        action(
          RESPONSE_ACTION_TYPE.OPEN_CALENDLY,
          RESPONSE_INTERACTION_TARGET.BOOKING,
        ),
      );

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    assert.deepEqual(
      opens[0],
      [
        "https://calendly.com/victorguzman-data-pro/reunion-inicial-proyecto",
        "_blank",
        "noopener,noreferrer",
      ],
    );

    assert.notEqual(
      getState().booking.status,
      "scheduled",
    );
  },
);


test(
  "requiresConfirmation never executes before confirmation",
  () => {
    resetState();

    const navigations = [];

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,
        windowRef: {
          location: {
            assign(url) {
              navigations.push(url);
            },
          },
        },
      });

    const guarded =
      action(
        RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
        RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,
        {
          requiresConfirmation:
            true,
        },
      );

    const pending =
      router.executeAction(
        guarded,
      );

    assert.equal(
      pending.status,
      ACTION_ROUTER_STATUS.CONFIRMATION_REQUIRED,
    );

    assert.equal(
      navigations.length,
      0,
    );

    const confirmed =
      router.executeAction(
        guarded,
        {
          confirmed:
            true,
        },
      );

    assert.equal(
      confirmed.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );
  },
);


test(
  "rapid duplicate action is suppressed",
  () => {
    resetState();

    let currentTime =
      1000;

    const navigations = [];

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,
        now:
          () => currentTime,
        windowRef: {
          location: {
            assign(url) {
              navigations.push(url);
            },
          },
        },
      });

    const diagnosticAction =
      action(
        RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
        RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,
      );

    assert.equal(
      router.executeAction(
        diagnosticAction,
      ).status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    currentTime =
      1200;

    assert.equal(
      router.executeAction(
        diagnosticAction,
      ).status,
      ACTION_ROUTER_STATUS.DUPLICATE_SUPPRESSED,
    );

    assert.equal(
      navigations.length,
      1,
    );
  },
);


test(
  "answer quick reply submits its natural answer text",
  () => {
    const submitted = [];

    const router =
      createActionRouter({
        submitText(
          text,
        ) {
          submitted.push(text);
        },
      });

    const result =
      router.executeQuickReply({
        id:
          "qr-technologies",
        label:
          "Tecnologías",
        kind:
          RESPONSE_QUICK_REPLY_KIND.ANSWER,
        value:
          "¿Qué tecnologías conoce Víctor?",
      });

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.SUBMITTED,
    );

    assert.deepEqual(
      submitted,
      [
        "¿Qué tecnologías conoce Víctor?",
      ],
    );
  },
);


test(
  "intent quick reply submits its visible label instead of an internal intent id",
  () => {
    const submitted = [];

    const router =
      createActionRouter({
        submitText(text) {
          submitted.push(text);
        },
      });

    const result =
      router.executeQuickReply({
        id:
          "qr-projects",
        label:
          "Proyectos",
        kind:
          RESPONSE_QUICK_REPLY_KIND.INTENT,
        value:
          "projects",
      });

    assert.equal(
      result.submittedText,
      "Proyectos",
    );

    assert.deepEqual(
      submitted,
      ["Proyectos"],
    );
  },
);


test(
  "feedback action is local and invokes feedback callback",
  () => {
    resetState();

    let feedbackCount =
      0;

    const router =
      createActionRouter({
        onFeedbackRequested() {
          feedbackCount += 1;
        },
      });

    const result =
      router.executeAction(
        action(
          RESPONSE_ACTION_TYPE.OFFER_FEEDBACK,
          null,
          {
            id:
              "action-feedback-test",
          },
        ),
      );

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    assert.equal(
      feedbackCount,
      1,
    );
  },
);


test(
  "internal navigation flush hook runs after lastAction and before location.assign",
  () => {
    resetState();

    const events = [];

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,

        beforeInternalNavigation() {
          events.push({
            step:
              "before-navigation",
            lastAction:
              getState()
                .conversation
                .lastAction,
          });
        },

        windowRef: {
          location: {
            assign(url) {
              events.push({
                step:
                  "assign",
                url,
                lastAction:
                  getState()
                    .conversation
                    .lastAction,
              });
            },
          },
        },
      });

    const result =
      router.executeAction(
        action(
          RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
          RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,
          {
            id:
              "action-problem-flow-diagnostic",
          },
        ),
      );

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    assert.deepEqual(
      events,
      [
        {
          step:
            "before-navigation",
          lastAction:
            "action-problem-flow-diagnostic",
        },
        {
          step:
            "assign",
          url:
            `${SITE_BASE}diagnostico.html`,
          lastAction:
            "action-problem-flow-diagnostic",
        },
      ],
    );
  },
);


test(
  "action router validates beforeInternalNavigation hook",
  () => {
    assert.throws(
      () =>
        createActionRouter({
          beforeInternalNavigation:
            "invalid",
        }),
      TypeError,
    );
  },
);


test(
  "NAV-H1.1 same-document diagnostic CTA scrolls and focuses without reloading",
  () => {
    resetState();

    const events = [];

    const nameInput = {
      focus(options) {
        events.push([
          "focus",
          options ?? null,
        ]);
      },
    };

    const form = {
      scrollIntoView(options) {
        events.push([
          "scroll",
          options ?? null,
        ]);
      },

      querySelector(selector) {
        assert.match(
          selector,
          /input/,
        );

        return nameInput;
      },
    };

    const router =
      createActionRouter({
        siteBaseUrl:
          SITE_BASE,

        beforeInternalNavigation({
          action: preparedAction,
        }) {
          events.push([
            "before-navigation",
            preparedAction?.id ?? null,
          ]);
        },

        documentRef: {
          getElementById(id) {
            return (
              id ===
                "diagnosticForm"
                ? form
                : null
            );
          },
        },

        windowRef: {
          location: {
            href:
              `${SITE_BASE}diagnostico.html`,

            assign(url) {
              events.push([
                "assign",
                url,
              ]);
            },
          },
        },
      });

    const result =
      router.executeAction(
        action(
          RESPONSE_ACTION_TYPE.NAVIGATE,
          "diagnostico.html#diagnosticForm",
          {
            id:
              "action-navigation-handoff-complete-diagnostic",
          },
        ),
      );

    assert.equal(
      result.status,
      ACTION_ROUTER_STATUS.EXECUTED,
    );

    assert.equal(
      result.reason,
      "same_document_target",
    );

    assert.deepEqual(
      events,
      [
        [
          "before-navigation",
          "action-navigation-handoff-complete-diagnostic",
        ],
        [
          "scroll",
          {
            behavior:
              "smooth",
            block:
              "start",
          },
        ],
        [
          "focus",
          {
            preventScroll:
              true,
          },
        ],
      ],
    );

    assert.equal(
      getState()
        .conversation
        .lastAction,
      null,
    );
  },
);
