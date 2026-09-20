import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  PRIVACY_POLICY_ID,
  PRIVACY_RESPONSE_INTENT,
  composePrivacyResponse,
  detectPrivacyIntent,
  resolvePrivacyIntent,
} from "../core/privacy-response-composer.js";


/* ============================================================
 * DETECTION
 * ============================================================
 */

test(
  "general privacy wording is detected",
  () => {
    for (
      const text
      of [
        "¿Qué hacéis con mis datos?",
        "¿Cómo funciona la privacidad?",
        "¿Qué pasa con mis datos personales?",
      ]
    ) {
      assert.equal(
        detectPrivacyIntent(
          text,
        ),
        PRIVACY_RESPONSE_INTENT
          .GENERAL,
        text,
      );
    }
  },
);


test(
  "session privacy wording is detected",
  () => {
    for (
      const text
      of [
        "¿Guardáis la conversación?",
        "¿Guardáis mi conversación?",
        "¿Se guarda mi conversación?",
        "¿Dónde se guarda el chat?",
        "¿Dónde guardáis el chat?",
        "¿Cuánto tiempo se guarda?",
        "¿Usáis sessionStorage?",
      ]
    ) {
      assert.equal(
        detectPrivacyIntent(
          text,
        ),
        PRIVACY_RESPONSE_INTENT
          .SESSION,
        text,
      );
    }
  },
);

test(
  "Analytics wording is detected",
  () => {
    for (
      const text
      of [
        "¿Mandáis mis datos a Google Analytics?",
        "¿Usáis GA4?",
        "¿Qué datos van a Analytics?",
      ]
    ) {
      assert.equal(
        detectPrivacyIntent(
          text,
        ),
        PRIVACY_RESPONSE_INTENT
          .ANALYTICS,
        text,
      );
    }
  },
);


test(
  "feedback privacy wording is detected",
  () => {
    assert.equal(
      detectPrivacyIntent(
        "¿Usáis mis preguntas para mejorar el asistente?",
      ),
      PRIVACY_RESPONSE_INTENT
        .FEEDBACK,
    );
  },
);


test(
  "third party wording is detected",
  () => {
    for (
      const text
      of [
        "¿Usáis Formspree?",
        "¿Qué datos van a Calendly?",
        "¿Compartís mis datos con terceros?",
      ]
    ) {
      assert.equal(
        detectPrivacyIntent(
          text,
        ),
        PRIVACY_RESPONSE_INTENT
          .THIRD_PARTIES,
        text,
      );
    }
  },
);


test(
  "reset privacy wording is detected",
  () => {
    for (
      const text
      of [
        "Quiero borrar la conversación",
        "¿Puedo reiniciar el chat?",
        "Quiero eliminar el chat",
      ]
    ) {
      assert.equal(
        detectPrivacyIntent(
          text,
        ),
        PRIVACY_RESPONSE_INTENT
          .RESET,
        text,
      );
    }
  },
);


test(
  "explicit privacy intent overrides detection",
  () => {
    assert.equal(
      resolvePrivacyIntent({
        userText:
          "Texto genérico",

        intent:
          PRIVACY_RESPONSE_INTENT
            .ANALYTICS,
      }),
      PRIVACY_RESPONSE_INTENT
        .ANALYTICS,
    );
  },
);


test(
  "unrelated question has no privacy intent",
  () => {
    assert.equal(
      detectPrivacyIntent(
        "¿Qué tecnologías conoce Víctor?",
      ),
      null,
    );
  },
);


/* ============================================================
 * SESSION
 * ============================================================
 */

test(
  "session privacy creates valid envelope",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Guardáis la conversación?",
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
  "privacy response uses PRIVACY kind",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cómo funciona la privacidad?",
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND.PRIVACY,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.ANSWERED,
    );
  },
);


test(
  "session response names sessionStorage",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Dónde guardáis la conversación?",
      });


    assert.match(
      response.messages[0]
        .text,
      /sessionStorage/i,
    );
  },
);


test(
  "session response exposes eight hour TTL",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cuánto tiempo se guarda?",
      });


    assert.match(
      response.messages[0]
        .text,
      /8 horas/i,
    );
  },
);


test(
  "session response says no automatic central transcript",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Guardáis el chat?",
      });


    assert.match(
      response.messages[0]
        .text,
      /no se guarda automáticamente una transcripción central/i,
    );
  },
);


test(
  "session privacy traces canonical policy",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Guardáis la conversación?",
      });


    assert.ok(
      response.evidence
        .knowledgeIds
        .includes(
          PRIVACY_POLICY_ID.SESSION,
        ),
    );

    assert.equal(
      response.evidence.mode,
      RESPONSE_EVIDENCE_MODE
        .WHEN_USEFUL,
    );
  },
);


/* ============================================================
 * ANALYTICS
 * ============================================================
 */

test(
  "Analytics response protects PII",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Qué datos mandáis a Analytics?",
      });


    const text =
      response.messages[0]
        .text;


    assert.match(
      text,
      /nombre/i,
    );

    assert.match(
      text,
      /email/i,
    );

    assert.match(
      text,
      /teléfono/i,
    );
  },
);


test(
  "Analytics response protects conversation text",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Mandáis la conversación a Google Analytics?",
      });


    const text =
      response.messages[0]
        .text;


    assert.match(
      text,
      /conversación/i,
    );

    assert.match(
      text,
      /pregunta literal/i,
    );

    assert.match(
      text,
      /texto libre/i,
    );

    assert.match(
      text,
      /resumen del diagnóstico/i,
    );
  },
);


test(
  "Analytics privacy traces canonical policy",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Usáis GA4?",
      });


    assert.ok(
      response.evidence
        .knowledgeIds
        .includes(
          PRIVACY_POLICY_ID
            .ANALYTICS,
        ),
    );
  },
);


/* ============================================================
 * FEEDBACK
 * ============================================================
 */

test(
  "feedback response rejects automatic transcript collection",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Usáis mis preguntas para mejorar?",
      });


    assert.match(
      response.messages[0]
        .text,
      /no se recopila automáticamente/i,
    );
  },
);


test(
  "exact question feedback is optional",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Guardáis mi pregunta como feedback?",
      });


    assert.match(
      response.messages[0]
        .text,
      /opcional/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /consentimiento explícito/i,
    );
  },
);


test(
  "feedback remains user reviewable",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Usáis mis preguntas para mejorar?",
      });


    assert.match(
      response.messages[0]
        .text,
      /podrás revisar/i,
    );
  },
);


/* ============================================================
 * THIRD PARTIES
 * ============================================================
 */

test(
  "third party response identifies Formspree for diagnostic submission",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Usáis Formspree?",
      });


    assert.match(
      response.messages[0]
        .text,
      /Formspree/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /formulario de diagnóstico/i,
    );
  },
);


test(
  "third party response identifies Calendly for booking",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Qué datos van a Calendly?",
      });


    assert.match(
      response.messages[0]
        .text,
      /Calendly/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /reservar una reunión/i,
    );
  },
);


test(
  "third party transfers require user initiated action",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Compartís mis datos con terceros?",
      });


    assert.match(
      response.messages[0]
        .text,
      /cuando tú los inicias/i,
    );
  },
);


/* ============================================================
 * RESET
 * ============================================================
 */

test(
  "reset privacy explains conversation can be cleared",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "Quiero borrar la conversación",
      });


    assert.match(
      response.messages[0]
        .text,
      /reiniciar la conversación/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /eliminar los datos conversacionales/i,
    );
  },
);


test(
  "reset privacy does not claim permanent account deletion",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "Quiero borrar la conversación",
      });


    assert.equal(
      /borrar tu cuenta|eliminar tu cuenta|borrado permanente del servidor/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


/* ============================================================
 * GENERAL
 * ============================================================
 */

test(
  "general privacy summarizes temporary storage and Analytics",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cómo funciona la privacidad?",
      });


    const text =
      response.messages[0]
        .text;


    assert.match(
      text,
      /sessionStorage/i,
    );

    assert.match(
      text,
      /8 horas/i,
    );

    assert.match(
      text,
      /Analytics/i,
    );
  },
);


/* ============================================================
 * SAFETY
 * ============================================================
 */

test(
  "privacy responses never enable inference",
  () => {
    const cases = [
      "¿Cómo funciona la privacidad?",
      "¿Guardáis la conversación?",
      "¿Usáis GA4?",
      "¿Usáis mis preguntas para mejorar?",
      "¿Compartís mis datos con terceros?",
      "Quiero borrar la conversación",
    ];


    for (
      const userText
      of cases
    ) {
      const response =
        composePrivacyResponse({
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
  "privacy responses never become commercial redirect",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cómo funciona la privacidad?",
      });


    assert.equal(
      response.safety
        .commercialRedirect,
      false,
    );
  },
);


test(
  "privacy response never asks visitor name",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Guardáis la conversación?",
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


/* ============================================================
 * CONTEXT / TRACE
 * ============================================================
 */

test(
  "privacy response preserves continuing context",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Y cuánto tiempo se guarda?",

        context: {
          continuing:
            true,
        },

        intent:
          PRIVACY_RESPONSE_INTENT
            .SESSION,
      });


    assert.equal(
      response.conversation
        .continuity,
      "continuing",
    );
  },
);


test(
  "privacy response preserves FAQ and Answer QA trace",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cómo funciona la privacidad?",

        faqId:
          "faq-privacy-test",

        answerQaId:
          "answer-qa-privacy-test",
      });


    assert.equal(
      response.trace.faqId,
      "faq-privacy-test",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-qa-privacy-test",
    );
  },
);


/* ============================================================
 * DEFENSIVE
 * ============================================================
 */

test(
  "privacy responses remain JSON serializable",
  () => {
    const response =
      composePrivacyResponse({
        userText:
          "¿Cómo funciona la privacidad?",
      });


    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);


test(
  "empty privacy message returns null",
  () => {
    assert.equal(
      composePrivacyResponse({
        userText:
          "   ",
      }),
      null,
    );
  },
);


test(
  "unsupported privacy message returns null",
  () => {
    assert.equal(
      composePrivacyResponse({
        userText:
          "¿Víctor sabe Power BI?",
      }),
      null,
    );
  },
);