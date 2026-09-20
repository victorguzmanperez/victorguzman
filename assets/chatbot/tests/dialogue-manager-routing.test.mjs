import test from "node:test";
import assert from "node:assert/strict";

import {
  CONFIDENCE_BUCKET,
} from "../core/state.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
  analyzeMessage,
} from "../core/nlu.js";

import {
  DIALOGUE_CONFIRMATION_REASON,
  DIALOGUE_DECISION_KIND,
  DIALOGUE_INTENT_ROUTE,
  DIALOGUE_ROUTE,
  DIALOGUE_ROUTE_PRIORITY,
  buildDialogueConfirmation,
  resolveDialogueDecision,
} from "../core/dialogue-manager.js";


test(
  "final intent catalog includes technologies education capabilities thanks and goodbye",
  () => {
    assert.equal(
      INTENT_IDS.TECHNOLOGIES,
      "technologies",
    );

    assert.equal(
      INTENT_IDS.EDUCATION,
      "education",
    );

    assert.equal(
      INTENT_IDS.CAPABILITIES,
      "capabilities",
    );

    assert.equal(
      INTENT_IDS.THANKS,
      "thanks",
    );

    assert.equal(
      INTENT_IDS.GOODBYE,
      "goodbye",
    );
  },
);


test(
  "final dialogue route map covers every canonical NLU intent",
  () => {
    for (
      const intentId
      of Object.values(
        INTENT_IDS,
      )
    ) {
      assert.ok(
        DIALOGUE_INTENT_ROUTE[
          intentId
        ],
        intentId,
      );
    }
  },
);


test(
  "privacy has highest routing priority",
  () => {
    assert.ok(
      DIALOGUE_ROUTE_PRIORITY
        .PRIVACY >
      DIALOGUE_ROUTE_PRIORITY
        .COMMERCIAL,
    );
  },
);


test(
  "commercial outranks operational generic routing",
  () => {
    assert.ok(
      DIALOGUE_ROUTE_PRIORITY
        .COMMERCIAL >
      DIALOGUE_ROUTE_PRIORITY
        .OPERATIONAL,
    );
  },
);


test(
  "education open question routes to Knowledge Overview",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Qué ha estudiado Víctor?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );


    assert.equal(
      decision.metadata
        .overviewTopic,
      "education",
    );
  },
);


test(
  "capabilities open question routes to Knowledge Overview",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Qué sabe hacer Víctor?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );


    assert.equal(
      decision.metadata
        .overviewTopic,
      "capabilities",
    );
  },
);


test(
  "technologies open question routes to Knowledge Overview",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Qué tecnologías domina?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );


    assert.equal(
      decision.intent,
      INTENT_IDS
        .TECHNOLOGIES,
    );
  },
);


test(
  "thanks is a canonical social route",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Muchas gracias",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );


    assert.equal(
      decision.intent,
      INTENT_IDS.THANKS,
    );
  },
);


test(
  "goodbye is a canonical social route",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Hasta luego",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );


    assert.equal(
      decision.intent,
      INTENT_IDS.GOODBYE,
    );
  },
);


test(
  "explicit name is routed socially without inventing an intent",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Me llamo Ana",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );


    assert.equal(
      decision.intent,
      "name_provided",
    );


    assert.equal(
      decision.metadata
        .providedName,
      "Ana",
    );
  },
);


test(
  "privacy detector overrides generic NLU routing",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Mandáis mis datos a Google Analytics?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE.PRIVACY,
    );
  },
);


test(
  "commercial detector overrides generic NLU routing",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Cuánto cobra Víctor?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .COMMERCIAL,
    );
  },
);


test(
  "operational booking routes before generic Knowledge",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Quiero reservar una reunión",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .OPERATIONAL,
    );
  },
);


test(
  "known problem routes through Problem Solution Service flow",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI.",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .PROBLEM_FLOW,
    );
  },
);


/* ============================================================
 * CRITICAL DAX GUARDRAIL
 * ============================================================
 */

test(
  "DAX guardrail remains MEDIUM needsConfirmation and no fallback",
  () => {
    const analysis =
      analyzeMessage(
        "¿Sabe DAX?",
      );


    assert.equal(
      analysis.primaryIntent,
      INTENT_IDS.POWER_BI,
    );


    assert.equal(
      analysis.confidenceBucket,
      CONFIDENCE_BUCKET.MEDIUM,
    );


    assert.equal(
      analysis.needsConfirmation,
      true,
    );


    assert.equal(
      analysis.fallbackLevel,
      FALLBACK_LEVEL.NONE,
    );
  },
);


test(
  "DAX guardrail routes to confirmation instead of fallback",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Sabe DAX?",
      });


    assert.equal(
      decision.kind,
      DIALOGUE_DECISION_KIND
        .CONFIRM,
    );


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .CONFIRMATION,
    );


    assert.equal(
      decision.intent,
      INTENT_IDS.POWER_BI,
    );


    assert.equal(
      decision.confirmation
        .reason,
      DIALOGUE_CONFIRMATION_REASON
        .MEDIUM_CONFIDENCE,
    );


    assert.match(
      decision.confirmation
        .text,
      /Power BI, DAX o Power Query/i,
    );
  },
);


test(
  "ambiguous confirmation never exposes internal intent ids",
  () => {
    const confirmation =
      buildDialogueConfirmation({
        needsConfirmation:
          true,

        primaryIntent:
          INTENT_IDS
            .AUTOMATION,

        ambiguity: {
          ambiguous:
            true,

          candidates: [
            INTENT_IDS
              .AUTOMATION,

            INTENT_IDS
              .REPORTING_PROBLEM,
          ],
        },
      });


    assert.equal(
      confirmation.reason,
      DIALOGUE_CONFIRMATION_REASON
        .AMBIGUOUS,
    );


    assert.equal(
      /automation|reporting_problem/i
        .test(
          confirmation.text,
        ),
      false,
    );
  },
);


/* ============================================================
 * MIXED SOCIAL + SUBSTANTIVE
 * ============================================================
 */

test(
  "greeting plus substantive question does not get trapped in social route",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Hola, ¿qué tecnologías conoce Víctor?",
      });


    assert.equal(
      decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );
  },
);


/* ============================================================
 * FALLBACK
 * ============================================================
 */

test(
  "unknown text remains progressive fallback",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "asdfgh qwerty",

        context: {
          consecutiveFallbacks:
            1,
        },
      });


    assert.equal(
      decision.kind,
      DIALOGUE_DECISION_KIND
        .FALLBACK,
    );


    assert.equal(
      decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );
  },
);


test(
  "empty text does not fabricate dialogue decision",
  () => {
    assert.equal(
      resolveDialogueDecision({
        userText:
          "   ",
      }),
      null,
    );
  },
);


test(
  "dialogue decisions remain JSON serializable",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "¿Sabe DAX?",
      });


    assert.doesNotThrow(
      () =>
        JSON.stringify(
          decision,
        ),
    );
  },
);