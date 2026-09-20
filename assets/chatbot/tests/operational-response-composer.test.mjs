import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_TYPE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  OPERATIONAL_RESPONSE_INTENT,
  OPERATIONAL_RESPONSE_TARGET,
  buildBookingPrefill,
  buildBookingPreferences,
  buildDiagnosticPrefill,
  composeBookingEventResponse,
  composeOperationalResponse,
  detectOperationalIntent,
  isBookingConfirmationEvent,
  resolveOperationalIntent,
} from "../core/operational-response-composer.js";


/* ============================================================
 * INTENT DETECTION
 * ============================================================
 */

test(
  "diagnostic wording is detected",
  () => {
    for (
      const text
      of [
        "Quiero hacer un diagnóstico",
        "Quiero explicarte mi problema",
        "Quiero analizar mi caso",
      ]
    ) {
      assert.equal(
        detectOperationalIntent(
          text,
        ),
        OPERATIONAL_RESPONSE_INTENT
          .DIAGNOSTIC,
        text,
      );
    }
  },
);


test(
  "contact wording is detected",
  () => {
    for (
      const text
      of [
        "Quiero contactar con Víctor",
        "¿Cómo puedo hablar con él?",
        "¿Cuál es el email de Víctor?",
      ]
    ) {
      assert.equal(
        detectOperationalIntent(
          text,
        ),
        OPERATIONAL_RESPONSE_INTENT
          .CONTACT,
        text,
      );
    }
  },
);


test(
  "booking wording is detected",
  () => {
    for (
      const text
      of [
        "Quiero reservar una reunión",
        "¿Podemos agendar una llamada?",
        "¿Dónde está el Calendly?",
      ]
    ) {
      assert.equal(
        detectOperationalIntent(
          text,
        ),
        OPERATIONAL_RESPONSE_INTENT
          .BOOKING,
        text,
      );
    }
  },
);


test(
  "booking has priority over generic contact wording",
  () => {
    assert.equal(
      detectOperationalIntent(
        "Quiero contactar con Víctor para reservar una reunión",
      ),
      OPERATIONAL_RESPONSE_INTENT
        .BOOKING,
    );
  },
);


test(
  "explicit operational intent overrides text detection",
  () => {
    assert.equal(
      resolveOperationalIntent({
        userText:
          "Texto genérico",

        intent:
          OPERATIONAL_RESPONSE_INTENT
            .CONTACT,
      }),
      OPERATIONAL_RESPONSE_INTENT
        .CONTACT,
    );
  },
);


test(
  "unrelated text has no operational intent",
  () => {
    assert.equal(
      detectOperationalIntent(
        "¿Qué sabe hacer Víctor?",
      ),
      null,
    );
  },
);


/* ============================================================
 * DIAGNOSTIC RESPONSE
 * ============================================================
 */

test(
  "diagnostic response is a valid Response Envelope",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


test(
  "diagnostic response uses ACTION kind",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero analizar mi caso",
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND.ACTION,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.ANSWERED,
    );
  },
);


test(
  "diagnostic exposes start diagnostic action",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero explicarte mi problema",
      });


    assert.equal(
      response.actions.length,
      1,
    );

    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.equal(
      response.actions[0]
        .target,
      OPERATIONAL_RESPONSE_TARGET
        .DIAGNOSTIC,
    );
  },
);


test(
  "diagnostic visible language preserves consent control",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",
      });


    assert.match(
      response.messages[0]
        .text,
      /consentimiento de privacidad/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /marcarlo tú/i,
    );
  },
);

test(
  "diagnostic visible language says form is not submitted automatically",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",
      });


    assert.match(
      response.messages[0]
        .text,
      /(?:no|tampoco) se enviará automáticamente/i,
    );
  },
);
/* ============================================================
 * DIAGNOSTIC PREFILL
 * ============================================================
 */

test(
  "diagnostic prefill keeps user provided allowed fields",
  () => {
    const prefill =
      buildDiagnosticPrefill({
        nombre:
          "Ana",

        empresa:
          "Empresa Demo",

        email:
          "ana@example.com",

        que_quiere_mejorar:
          "Automatizar reporting",
      });


    assert.equal(
      prefill.nombre,
      "Ana",
    );

    assert.equal(
      prefill.empresa,
      "Empresa Demo",
    );

    assert.equal(
      prefill.email,
      "ana@example.com",
    );

    assert.equal(
      prefill
        .que_quiere_mejorar,
      "Automatizar reporting",
    );
  },
);


test(
  "diagnostic never prefills privacy consent",
  () => {
    const prefill =
      buildDiagnosticPrefill({
        nombre:
          "Ana",

        acepta_privacidad:
          true,
      });


    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          prefill,
          "acepta_privacidad",
        ),
      false,
    );
  },
);


test(
  "diagnostic never copies unknown fields",
  () => {
    const prefill =
      buildDiagnosticPrefill({
        nombre:
          "Ana",

        invented_field:
          "invented",
      });


    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          prefill,
          "invented_field",
        ),
      false,
    );
  },
);


test(
  "diagnostic never invents missing fields",
  () => {
    const prefill =
      buildDiagnosticPrefill({
        nombre:
          "Ana",
      });


    assert.deepEqual(
      Object.keys(
        prefill,
      ),
      [
        "nombre",
      ],
    );
  },
);


test(
  "diagnostic ignores blank user values",
  () => {
    const prefill =
      buildDiagnosticPrefill({
        nombre:
          "   ",

        empresa:
          "Empresa Demo",
      });


    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          prefill,
          "nombre",
        ),
      false,
    );

    assert.equal(
      prefill.empresa,
      "Empresa Demo",
    );
  },
);


test(
  "diagnostic forbidden claims propagate",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",
      });


    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-form-submit",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "prefilled-consent",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "guaranteed-feasibility",
        ),
    );
  },
);


/* ============================================================
 * CONTACT
 * ============================================================
 */

test(
  "contact response is valid",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero contactar con Víctor",
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


test(
  "contact response exposes canonical public email",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "¿Cuál es el email de Víctor?",
      });


    assert.match(
      response.messages[0]
        .text,
      /victorguzman\.data\.pro@gmail\.com/i,
    );
  },
);


test(
  "contact response mentions LinkedIn only as canonical channel",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "¿Cómo puedo hablar con Víctor?",
      });


    assert.match(
      response.messages[0]
        .text,
      /LinkedIn/i,
    );
  },
);


test(
  "contact exposes open contact action",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero contactar con Víctor",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );

    assert.equal(
      response.actions[0]
        .target,
      OPERATIONAL_RESPONSE_TARGET
        .CONTACT,
    );
  },
);


test(
  "contact keeps commercial and availability claims forbidden",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero contactar con Víctor",
      });


    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-availability",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "guaranteed-response-time",
        ),
    );
  },
);


/* ============================================================
 * BOOKING
 * ============================================================
 */

test(
  "booking response is valid",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero reservar una reunión",
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


test(
  "booking response uses canonical provider and duration",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "¿Dónde está el Calendly?",
      });


    assert.match(
      response.messages[0]
        .text,
      /30 minutos/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /Calendly/i,
    );
  },
);


test(
  "booking exposes open Calendly action",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero reservar una reunión",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CALENDLY,
    );

    assert.equal(
      response.actions[0]
        .target,
      OPERATIONAL_RESPONSE_TARGET
        .BOOKING,
    );
  },
);


test(
  "booking prefill accepts only name and email",
  () => {
    const prefill =
      buildBookingPrefill({
        name:
          "Ana",

        email:
          "ana@example.com",

        phone:
          "600000000",

        company:
          "Demo",
      });


    assert.deepEqual(
      prefill,
      {
        name:
          "Ana",

        email:
          "ana@example.com",
      },
    );
  },
);


test(
  "booking preferences preserve only canonical preference fields",
  () => {
    const preferences =
      buildBookingPreferences({
        "preferred-date":
          "martes",

        "preferred-time-window":
          "por la tarde",

        timezone:
          "Europe/Madrid",

        confirmed:
          true,
      });


    assert.deepEqual(
      preferences,
      {
        "preferred-date":
          "martes",

        "preferred-time-window":
          "por la tarde",

        timezone:
          "Europe/Madrid",
      },
    );
  },
);


test(
  "booking preferences do not become booking confirmation",
  () => {
    const preferences =
      buildBookingPreferences({
        "preferred-date":
          "martes",

        "preferred-time-window":
          "17:00",
      });


    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          preferences,
          "confirmed",
        ),
      false,
    );
  },
);


test(
  "booking safety preserves no automatic booking guarantees",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero reservar una reunión",
      });


    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-booking",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "guaranteed-availability",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "booking-confirmed-without-event",
        ),
    );
  },
);


/* ============================================================
 * BOOKING EVENTS
 * ============================================================
 */

test(
  "event_scheduled is canonical booking confirmation event",
  () => {
    assert.equal(
      isBookingConfirmationEvent(
        "calendly.event_scheduled",
      ),
      true,
    );
  },
);


test(
  "scheduled Calendly event creates valid confirmation response",
  () => {
    const response =
      composeBookingEventResponse({
        eventName:
          "calendly.event_scheduled",
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.match(
      response.messages[0]
        .text,
      /reunión ha quedado reservada/i,
    );
  },
);


test(
  "date and time selection is not booking confirmation",
  () => {
    assert.equal(
      isBookingConfirmationEvent(
        "calendly.date_and_time_selected",
      ),
      false,
    );

    assert.equal(
      composeBookingEventResponse({
        eventName:
          "calendly.date_and_time_selected",
      }),
      null,
    );
  },
);


test(
  "event type viewed is not booking confirmation",
  () => {
    assert.equal(
      composeBookingEventResponse({
        eventName:
          "calendly.event_type_viewed",
      }),
      null,
    );
  },
);


test(
  "unknown Calendly event cannot fabricate booking confirmation",
  () => {
    assert.equal(
      composeBookingEventResponse({
        eventName:
          "calendly.invented_event",
      }),
      null,
    );
  },
);


/* ============================================================
 * CONTEXT / TRACE
 * ============================================================
 */

test(
  "operational response preserves continuing context",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero reservar una reunión",

        context: {
          continuing:
            true,
        },
      });


    assert.equal(
      response.conversation
        .continuity,
      "continuing",
    );
  },
);


test(
  "operational response never interrupts to ask visitor name",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero contactar con Víctor",
      });


    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );

    assert.equal(
      response.personalization
        .usedName,
      false,
    );
  },
);


test(
  "operational response preserves FAQ and Answer QA trace",
  () => {
    const response =
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",

        faqId:
          "faq-operational-test",

        answerQaId:
          "answer-qa-operational-test",
      });


    assert.equal(
      response.trace.faqId,
      "faq-operational-test",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-qa-operational-test",
    );
  },
);


/* ============================================================
 * GLOBAL SAFETY
 * ============================================================
 */

test(
  "all operational responses disable inference",
  () => {
    const cases = [
      "Quiero hacer un diagnóstico",
      "Quiero contactar con Víctor",
      "Quiero reservar una reunión",
    ];


    for (
      const userText
      of cases
    ) {
      const response =
        composeOperationalResponse({
          userText,
        });


      assert.equal(
        response.safety
          .allowInference,
        false,
        userText,
      );
    }
  },
);


test(
  "operational responses remain JSON serializable",
  () => {
    const responses = [
      composeOperationalResponse({
        userText:
          "Quiero hacer un diagnóstico",
      }),

      composeOperationalResponse({
        userText:
          "Quiero contactar con Víctor",
      }),

      composeOperationalResponse({
        userText:
          "Quiero reservar una reunión",
      }),

      composeBookingEventResponse({
        eventName:
          "calendly.event_scheduled",
      }),
    ];


    for (
      const response
      of responses
    ) {
      assert.doesNotThrow(
        () =>
          JSON.stringify(
            response,
          ),
      );
    }
  },
);


/* ============================================================
 * DEFENSIVE
 * ============================================================
 */

test(
  "empty operational message returns null",
  () => {
    assert.equal(
      composeOperationalResponse({
        userText:
          "   ",
      }),
      null,
    );
  },
);


test(
  "unsupported operational message returns null",
  () => {
    assert.equal(
      composeOperationalResponse({
        userText:
          "¿Qué tecnologías conoce Víctor?",
      }),
      null,
    );
  },
);