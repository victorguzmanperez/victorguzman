import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  COMMERCIAL_CLAIM,
  COMMERCIAL_DECISION,
} from "../data/knowledge/commercial-policy.js";

import {
  COMMERCIAL_RESPONSE_TARGET,
  composeCommercialResponse,
  detectCommercialClaim,
  resolveCommercialAssessment,
  resolveCommercialClaim,
} from "../core/commercial-response-composer.js";


const SERVICE_ID =
  "service-data-process-automation";


/* ============================================================
 * CLAIM DETECTION
 * ============================================================
 */

test(
  "price wording is detected",
  () => {
    for (
      const text
      of [
        "¿Cuánto cobra Víctor?",
        "¿Cuánto cuesta un proyecto?",
        "¿Qué presupuesto tendría?",
        "¿Cuál es su tarifa?",
        "¿Me puedes dar un rango aproximado?",
      ]
    ) {
      assert.equal(
        detectCommercialClaim(
          text,
        ),
        COMMERCIAL_CLAIM.PRICE,
        text,
      );
    }
  },
);


test(
  "timeline wording is detected",
  () => {
    for (
      const text
      of [
        "¿Cuánto tardaría?",
        "¿Qué plazo tendría?",
        "¿Cuál sería la fecha de entrega?",
        "¿Cuándo estaría listo?",
        "¿Qué duración estimada tendría?",
      ]
    ) {
      assert.equal(
        detectCommercialClaim(
          text,
        ),
        COMMERCIAL_CLAIM.TIMELINE,
        text,
      );
    }
  },
);


test(
  "availability wording is detected",
  () => {
    for (
      const text
      of [
        "¿Víctor está disponible?",
        "¿Tiene hueco?",
        "¿Puede empezar mañana?",
        "¿Cuándo podría empezar?",
      ]
    ) {
      assert.equal(
        detectCommercialClaim(
          text,
        ),
        COMMERCIAL_CLAIM
          .AVAILABILITY,
        text,
      );
    }
  },
);


test(
  "feasibility wording is detected",
  () => {
    for (
      const text
      of [
        "¿Esto es viable?",
        "¿Se puede hacer?",
        "¿Víctor puede hacerlo?",
        "¿Se puede automatizar?",
        "¿Es técnicamente posible?",
      ]
    ) {
      assert.equal(
        detectCommercialClaim(
          text,
        ),
        COMMERCIAL_CLAIM
          .FEASIBILITY,
        text,
      );
    }
  },
);


test(
  "service fit wording is detected",
  () => {
    assert.equal(
      detectCommercialClaim(
        "¿Esto encaja con sus servicios?",
      ),
      COMMERCIAL_CLAIM
        .SERVICE_FIT,
    );
  },
);


test(
  "acceptance wording is detected",
  () => {
    assert.equal(
      detectCommercialClaim(
        "¿Víctor aceptaría mi proyecto?",
      ),
      COMMERCIAL_CLAIM
        .ACCEPTANCE,
    );
  },
);


test(
  "result wording is detected",
  () => {
    assert.equal(
      detectCommercialClaim(
        "¿Qué resultado conseguiré?",
      ),
      COMMERCIAL_CLAIM.RESULT,
    );
  },
);


test(
  "ROI wording is detected",
  () => {
    const cases = [
      "¿Cuánto me ahorraré con la automatización?",
      "¿Cuánto me ahorraré?",
      "¿Cuánto me ahorraría?",
      "¿Cuánto ahorraré?",
      "¿Qué ahorro conseguiré?",
      "¿Qué ROI tendría?",
      "¿Cuál sería el retorno de la inversión?",
    ];


    for (
      const text
      of cases
    ) {
      assert.equal(
        detectCommercialClaim(
          text,
        ),
        COMMERCIAL_CLAIM.ROI,
        text,
      );
    }
  },
);


test(
  "availability takes precedence over generic feasibility",
  () => {
    assert.equal(
      detectCommercialClaim(
        "¿Víctor puede empezar mañana?",
      ),
      COMMERCIAL_CLAIM
        .AVAILABILITY,
    );
  },
);


test(
  "non commercial text returns null",
  () => {
    assert.equal(
      detectCommercialClaim(
        "¿Qué sabe hacer Víctor?",
      ),
      null,
    );
  },
);


test(
  "explicit commercial claim overrides text detection",
  () => {
    assert.equal(
      resolveCommercialClaim({
        userText:
          "Pregunta genérica",

        claim:
          COMMERCIAL_CLAIM.PRICE,
      }),
      COMMERCIAL_CLAIM.PRICE,
    );
  },
);


/* ============================================================
 * COMMERCIAL POLICY
 * ============================================================
 */

test(
  "specific Service price policy redirects",
  () => {
    const assessment =
      resolveCommercialAssessment({
        serviceId:
          SERVICE_ID,

        claim:
          COMMERCIAL_CLAIM.PRICE,
      });


    assert.ok(assessment);

    assert.equal(
      assessment.allowed,
      false,
    );

    assert.equal(
      assessment.decision,
      COMMERCIAL_DECISION
        .REDIRECT,
    );

    assert.equal(
      assessment.action,
      "open-contact",
    );
  },
);


test(
  "generic price policy uses all-Service consensus",
  () => {
    const assessment =
      resolveCommercialAssessment({
        claim:
          COMMERCIAL_CLAIM.PRICE,
      });


    assert.ok(assessment);

    assert.equal(
      assessment.scope,
      "all_services",
    );

    assert.equal(
      assessment.serviceIds.length,
      4,
    );

    assert.equal(
      assessment.decision,
      COMMERCIAL_DECISION
        .REDIRECT,
    );
  },
);


test(
  "generic feasibility policy uses diagnostic qualification",
  () => {
    const assessment =
      resolveCommercialAssessment({
        claim:
          COMMERCIAL_CLAIM
            .FEASIBILITY,
      });


    assert.ok(assessment);

    assert.equal(
      assessment.decision,
      COMMERCIAL_DECISION
        .QUALIFY,
    );

    assert.equal(
      assessment.action,
      "start-diagnostic",
    );
  },
);


test(
  "unknown Service cannot produce commercial assessment",
  () => {
    assert.equal(
      resolveCommercialAssessment({
        serviceId:
          "service-does-not-exist",

        claim:
          COMMERCIAL_CLAIM.PRICE,
      }),
      null,
    );
  },
);


/* ============================================================
 * PRICE
 * ============================================================
 */

test(
  "price response creates valid Response Envelope",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto me costaría un proyecto?",

        claim:
          COMMERCIAL_CLAIM.PRICE,
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
  "price uses commercial redirect kind",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cobra Víctor?",
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND
        .COMMERCIAL_REDIRECT,
    );
  },
);


test(
  "price outcome is redirected",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Qué precio tendría?",
      });


    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME
        .REDIRECTED,
    );
  },
);


test(
  "price exposes safe contact action",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Qué presupuesto tendría?",
      });


    assert.equal(
      response.actions.length,
      1,
    );

    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );

    assert.equal(
      response.actions[0]
        .target,
      COMMERCIAL_RESPONSE_TARGET
        .CONTACT,
    );

    assert.equal(
      response.actions[0]
        .priority,
      RESPONSE_ACTION_PRIORITY
        .PRIMARY,
    );
  },
);


test(
  "price never invents monetary amount or range",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "Dime un precio aproximado",
      });


    const text =
      response.messages[0]
        .text;


    assert.equal(
      /€|\beuros?\b|\b\d+[.,]?\d*\s*€?/i
        .test(
          text,
        ),
      false,
    );
  },
);


/* ============================================================
 * TIMELINE
 * ============================================================
 */

test(
  "timeline redirects to human contact",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto tardaría en hacer el proyecto?",
      });


    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME
        .REDIRECTED,
    );

    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );
  },
);


test(
  "timeline never invents a duration",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿En cuánto tiempo estaría listo?",
      });


    assert.equal(
      /\b\d+\s*(día|dias|días|semana|semanas|mes|meses|hora|horas)\b/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


/* ============================================================
 * AVAILABILITY
 * ============================================================
 */

test(
  "availability redirects to human contact",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Víctor está disponible?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );
  },
);


test(
  "availability is never promised",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Puede empezar mañana?",
      });


    assert.equal(
      /\bestá disponible\b|\bpuede empezar mañana\b/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


/* ============================================================
 * ACCEPTANCE
 * ============================================================
 */

test(
  "project acceptance redirects to human contact",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Víctor aceptaría mi proyecto?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );

    assert.equal(
      response.safety
        .commercialRedirect,
      true,
    );
  },
);


/* ============================================================
 * FEASIBILITY / FIT / RESULT / ROI
 * ============================================================
 */

test(
  "feasibility creates qualified discovery response",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Esto se puede automatizar?",
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND.DISCOVERY,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME
        .QUALIFIED,
    );
  },
);


test(
  "feasibility proposes diagnostic instead of guaranteeing viability",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Esto es viable?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.equal(
      response.actions[0]
        .target,
      COMMERCIAL_RESPONSE_TARGET
        .DIAGNOSTIC,
    );
  },
);


test(
  "service fit qualifies through diagnostic",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Esto encaja con sus servicios?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );
  },
);


test(
  "result claim qualifies through diagnostic",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Qué resultado conseguiré?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.match(
      response.messages[0]
        .text,
      /no sería fiable prometer un resultado concreto/i,
    );
  },
);


test(
  "ROI claim qualifies through diagnostic",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto me ahorraré?",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.match(
      response.messages[0]
        .text,
      /no puedo prometer un ahorro o retorno concreto/i,
    );
  },
);


/* ============================================================
 * SAFETY
 * ============================================================
 */

test(
  "redirect decision sets commercialRedirect",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cuesta?",
      });


    assert.equal(
      response.safety
        .commercialRedirect,
      true,
    );
  },
);


test(
  "qualification is not marked as commercial redirect",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Esto es viable?",
      });


    assert.equal(
      response.safety
        .commercialRedirect,
      false,
    );

    assert.equal(
      response.safety
        .mustQualify,
      true,
    );
  },
);


test(
  "commercial responses never enable inference",
  () => {
    const cases = [
      "¿Cuánto cuesta?",
      "¿Cuánto tardaría?",
      "¿Está disponible?",
      "¿Esto es viable?",
    ];


    for (
      const text
      of cases
    ) {
      const response =
        composeCommercialResponse({
          userText:
            text,
        });


      assert.equal(
        response.safety
          .allowInference,
        false,
        text,
      );
    }
  },
);


test(
  "Service forbidden claims propagate into commercial response",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cuesta?",

        serviceId:
          SERVICE_ID,
      });


    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-price",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-availability",
        ),
    );
  },
);


test(
  "commercial policy reason is preserved internally as forbidden claim",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Esto es viable?",
      });


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
 * TRACE / CONTEXT
 * ============================================================
 */

test(
  "FAQ and Answer QA trace are preserved",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cuesta?",

        faqId:
          "faq-commercial-test",

        answerQaId:
          "answer-qa-commercial-test",
      });


    assert.equal(
      response.trace.faqId,
      "faq-commercial-test",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-qa-commercial-test",
    );
  },
);


test(
  "continuing commercial conversation remains continuing",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Y cuánto tardaría?",

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
  "commercial response never interrupts to ask visitor name",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cuesta?",
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
 * NATURAL LANGUAGE
 * ============================================================
 */

test(
  "visible commercial language never exposes policy internals",
  () => {
    const cases = [
      "¿Cuánto cuesta?",
      "¿Cuánto tardaría?",
      "¿Está disponible?",
      "¿Aceptaría mi proyecto?",
      "¿Esto encaja con sus servicios?",
      "¿Esto es viable?",
      "¿Qué resultado conseguiré?",
      "¿Cuánto me ahorraré?",
    ];


    for (
      const text
      of cases
    ) {
      const response =
        composeCommercialResponse({
          userText:
            text,
        });


      assert.ok(response);


      assert.equal(
        /automatic-price|automatic-deadline|automatic-availability|guaranteed-feasibility|guaranteed-result|guaranteed-roi|commercial_redirect|start-diagnostic/i
          .test(
            response.messages[0]
              .text,
          ),
        false,
        text,
      );
    }
  },
);


test(
  "commercial responses remain JSON serializable",
  () => {
    const response =
      composeCommercialResponse({
        userText:
          "¿Cuánto cuesta?",
      });


    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);


/* ============================================================
 * DEFENSIVE BEHAVIOUR
 * ============================================================
 */

test(
  "empty user text returns null",
  () => {
    assert.equal(
      composeCommercialResponse({
        userText:
          "   ",
      }),
      null,
    );
  },
);


test(
  "invalid explicit commercial claim returns null",
  () => {
    assert.equal(
      composeCommercialResponse({
        userText:
          "Pregunta comercial",

        claim:
          "invented-commercial-claim",
      }),
      null,
    );
  },
);