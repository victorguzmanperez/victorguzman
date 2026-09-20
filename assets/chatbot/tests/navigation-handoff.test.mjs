import test from "node:test";
import assert from "node:assert/strict";

import {
  NAVIGATION_HANDOFF_KIND,
  buildNavigationHandoff,
  isDiagnosticNavigationAction,
  shouldDismissTrailingDiagnosticQuestion,
} from "../core/navigation-handoff.js";

function state({
  pageId = "diagnostico",
  lastAction = "action-problem-flow-diagnostic",
} = {}) {
  return {
    page: {
      current: {
        pageId,
      },
    },
    conversation: {
      lastAction,
    },
  };
}

test(
  "NAV-H1 recognizes canonical diagnostic navigation actions",
  () => {
    assert.equal(
      isDiagnosticNavigationAction(
        "action-problem-flow-diagnostic",
      ),
      true,
    );

    assert.equal(
      isDiagnosticNavigationAction(
        "action-operational-diagnostic",
      ),
      true,
    );

    assert.equal(
      isDiagnosticNavigationAction(
        "action-commercial-diagnostic-price",
      ),
      true,
    );

    for (const actionId of [
      "v2-diagnostic",
      "v2-handoff-diagnostic",
      "h2-diagnostic",
      "action-progress-automation-diagnostic",
    ]) {
      assert.equal(
        isDiagnosticNavigationAction(actionId),
        true,
        actionId,
      );
    }
  },
);

test(
  "NAV-H1 ignores unrelated actions",
  () => {
    assert.equal(
      isDiagnosticNavigationAction(
        "action-contact-victor",
      ),
      false,
    );
  },
);

test(
  "NAV-H1 builds a diagnostic arrival handoff only on diagnostic page",
  () => {
    const handoff =
      buildNavigationHandoff(
        state(),
      );

    assert.equal(
      handoff.kind,
      NAVIGATION_HANDOFF_KIND.DIAGNOSTIC,
    );

    assert.equal(
      handoff.messages.length,
      2,
    );

    assert.match(
      handoff.messages.join(" "),
      /formulario/i,
    );

    assert.match(
      handoff.messages.join(" "),
      /Víctor recibirá la información/i,
    );

    assert.match(
      handoff.messages.join(" "),
      /reunión inicial de 30 minutos/i,
    );

    assert.equal(
      handoff.actions.length,
      2,
    );

    assert.deepEqual(
      handoff.actions.map(
        (action) => [
          action.label,
          action.type,
          action.target,
        ],
      ),
      [
        [
          "Completar diagnóstico",
          "navigate",
          "diagnostico.html#diagnosticForm",
        ],
        [
          "Reservar reunión",
          "open-calendly",
          "booking-calendly-initial-meeting",
        ],
      ],
    );
  },
);

test(
  "NAV-H1 does not appear when diagnostic page is opened manually",
  () => {
    assert.equal(
      buildNavigationHandoff(
        state({
          lastAction: null,
        }),
      ),
      null,
    );
  },
);

test(
  "NAV-H1 does not leak onto other pages",
  () => {
    assert.equal(
      buildNavigationHandoff(
        state({
          pageId: "home",
        }),
      ),
      null,
    );
  },
);


test(
  "NAV-H1.2 closes a trailing assistant question before diagnostic navigation",
  () => {
    const currentState = {
      conversation: {
        messages: [
          {
            role: "user",
            text: "Trabajo con varios Excel que consolido manualmente.",
          },
          {
            role: "assistant",
            text: "Sí, aquí hay bastante margen para quitar trabajo manual.",
          },
          {
            role: "assistant",
            text: "¿Qué te lleva más tiempo ahora: juntar los archivos, limpiar los datos o preparar el resultado final?",
          },
        ],
      },
    };

    assert.equal(
      shouldDismissTrailingDiagnosticQuestion(
        currentState,
        "action-problem-flow-diagnostic",
      ),
      true,
    );
  },
);

test(
  "NAV-H1.2 does not close conversation text for unrelated actions",
  () => {
    const currentState = {
      conversation: {
        messages: [
          {
            role: "assistant",
            text: "¿Quieres que te ponga en contacto con Víctor?",
          },
        ],
      },
    };

    assert.equal(
      shouldDismissTrailingDiagnosticQuestion(
        currentState,
        "action-contact-victor",
      ),
      false,
    );
  },
);

test(
  "NAV-H1.2 keeps the last assistant message when it is not a question",
  () => {
    const currentState = {
      conversation: {
        messages: [
          {
            role: "assistant",
            text: "Puedes completar el diagnóstico cuando quieras.",
          },
        ],
      },
    };

    assert.equal(
      shouldDismissTrailingDiagnosticQuestion(
        currentState,
        "action-problem-flow-diagnostic",
      ),
      false,
    );
  },
);
