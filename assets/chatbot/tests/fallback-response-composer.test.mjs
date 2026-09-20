import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_TYPE,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  RESPONSE_QUICK_REPLY_KIND,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
  analyzeMessage,
} from "../core/nlu.js";

import {
  FALLBACK_FORBIDDEN_CLAIMS,
  FALLBACK_LAST_ACTION,
  FALLBACK_RESPONSE_TARGET,
  FALLBACK_RESPONSE_TEMPLATE,
  composeFallbackNaturalText,
  composeFallbackResponse,
  isCanonicalFallbackLevel,
  resolveFallbackLevel,
} from "../core/fallback-response-composer.js";


/* ============================================================
 * LEVEL CONTRACT
 * ============================================================
 */

test(
  "canonical fallback levels are accepted",
  () => {
    assert.equal(
      isCanonicalFallbackLevel(
        FALLBACK_LEVEL.CLARIFY,
      ),
      true,
    );


    assert.equal(
      isCanonicalFallbackLevel(
        FALLBACK_LEVEL.CATEGORIES,
      ),
      true,
    );


    assert.equal(
      isCanonicalFallbackLevel(
        FALLBACK_LEVEL.ESCALATE,
      ),
      true,
    );
  },
);


test(
  "NONE is not a visible fallback response level",
  () => {
    assert.equal(
      isCanonicalFallbackLevel(
        FALLBACK_LEVEL.NONE,
      ),
      false,
    );
  },
);


test(
  "explicit fallback level is resolved",
  () => {
    assert.equal(
      resolveFallbackLevel({
        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      }),
      FALLBACK_LEVEL.CATEGORIES,
    );
  },
);


test(
  "analysis fallback level is resolved",
  () => {
    assert.equal(
      resolveFallbackLevel({
        analysis: {
          fallbackLevel:
            FALLBACK_LEVEL.ESCALATE,
        },
      }),
      FALLBACK_LEVEL.ESCALATE,
    );
  },
);


test(
  "invalid explicit fallback level fails closed",
  () => {
    assert.equal(
      resolveFallbackLevel({
        fallbackLevel:
          99,

        analysis: {
          fallbackLevel:
            FALLBACK_LEVEL.CLARIFY,
        },
      }),
      null,
    );
  },
);


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

test(
  "CLARIFY asks for a reformulation or more context",
  () => {
    const text =
      composeFallbackNaturalText(
        FALLBACK_LEVEL.CLARIFY,
      );


    assert.match(
      text,
      /otra forma|más contexto/i,
    );
  },
);


test(
  "CATEGORIES exposes useful portfolio categories",
  () => {
    const text =
      composeFallbackNaturalText(
        FALLBACK_LEVEL.CATEGORIES,
      );


    assert.match(
      text,
      /experiencia/i,
    );


    assert.match(
      text,
      /tecnologías/i,
    );


    assert.match(
      text,
      /proyectos/i,
    );


    assert.match(
      text,
      /servicios/i,
    );


    assert.match(
      text,
      /datos y automatización/i,
    );
  },
);


test(
  "ESCALATE changes strategy instead of asking the same question again",
  () => {
    const text =
      composeFallbackNaturalText(
        FALLBACK_LEVEL.ESCALATE,
      );


    assert.match(
      text,
      /no quiero seguir haciéndote repetir/i,
    );


    assert.match(
      text,
      /contactar directamente con Víctor/i,
    );
  },
);


test(
  "visible fallback language never exposes internal engine terminology",
  () => {
    for (
      const level
      of [
        FALLBACK_LEVEL.CLARIFY,
        FALLBACK_LEVEL.CATEGORIES,
        FALLBACK_LEVEL.ESCALATE,
      ]
    ) {
      const text =
        composeFallbackNaturalText(
          level,
        );


      assert.equal(
        /fallback|confidence|CLARIFY|CATEGORIES|ESCALATE/i
          .test(
            text,
          ),
        false,
      );
    }
  },
);


/* ============================================================
 * LEVEL 1 — CLARIFY
 * ============================================================
 */

test(
  "CLARIFY creates a valid fallback envelope",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
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
  "CLARIFY uses fallback kind and outcome",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND.FALLBACK,
    );


    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.FALLBACK,
    );
  },
);


test(
  "CLARIFY increments fallback counter without resetting it",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.equal(
      response.stateEffects
        .incrementFallbacks,
      true,
    );


    assert.equal(
      response.stateEffects
        .resetFallbacks,
      false,
    );
  },
);


test(
  "CLARIFY marks its clarification question as asked",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.equal(
      response.stateEffects
        .markQuestionAsked,
      FALLBACK_RESPONSE_TEMPLATE
        .CLARIFY,
    );
  },
);


test(
  "CLARIFY exposes no action",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.deepEqual(
      response.actions,
      [],
    );
  },
);


test(
  "CLARIFY exposes no category quick replies",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.deepEqual(
      response.quickReplies,
      [],
    );
  },
);


/* ============================================================
 * LEVEL 2 — CATEGORIES
 * ============================================================
 */

test(
  "CATEGORIES creates a valid fallback envelope",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
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
  "CATEGORIES does not repeat the CLARIFY question id",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    assert.equal(
      response.stateEffects
        .markQuestionAsked,
      null,
    );
  },
);


test(
  "CATEGORIES exposes four useful quick replies",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    assert.equal(
      response.quickReplies.length,
      4,
    );


    assert.deepEqual(
      response.quickReplies
        .map(
          (reply) =>
            reply.label,
        ),
      [
        "Experiencia",
        "Tecnologías",
        "Proyectos",
        "Servicios",
      ],
    );
  },
);


test(
  "CATEGORIES routes canonical categories through intents",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    const byLabel =
      Object.fromEntries(
        response.quickReplies
          .map(
            (reply) => [
              reply.label,
              reply,
            ],
          ),
      );


    assert.equal(
      byLabel.Experiencia.kind,
      RESPONSE_QUICK_REPLY_KIND
        .INTENT,
    );


    assert.equal(
      byLabel.Experiencia.value,
      INTENT_IDS.EXPERIENCE,
    );


    assert.equal(
      byLabel.Proyectos.kind,
      RESPONSE_QUICK_REPLY_KIND
        .INTENT,
    );


    assert.equal(
      byLabel.Proyectos.value,
      INTENT_IDS.PROJECTS,
    );


    assert.equal(
      byLabel.Servicios.kind,
      RESPONSE_QUICK_REPLY_KIND
        .INTENT,
    );


    assert.equal(
      byLabel.Servicios.value,
      INTENT_IDS.SERVICES,
    );
  },
);


test(
  "technologies fallback quick reply remains natural answer until intent exists",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    const technologies =
      response.quickReplies
        .find(
          (reply) =>
            reply.label ===
            "Tecnologías",
        );


    assert.ok(
      technologies,
    );


    assert.equal(
      technologies.kind,
      RESPONSE_QUICK_REPLY_KIND
        .ANSWER,
    );


    assert.equal(
      technologies.value,
      "¿Qué tecnologías conoce Víctor?",
    );
  },
);


test(
  "CATEGORIES quick reply ids are unique",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    const ids =
      response.quickReplies
        .map(
          (reply) =>
            reply.id,
        );


    assert.equal(
      new Set(
        ids,
      ).size,
      ids.length,
    );
  },
);


test(
  "CATEGORIES exposes no commercial CTA",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "otra cosa rara",

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,
      });


    assert.deepEqual(
      response.actions,
      [],
    );
  },
);


/* ============================================================
 * LEVEL 3 — ESCALATE
 * ============================================================
 */

test(
  "ESCALATE creates a valid fallback envelope",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "No sé, otra cosa",

        fallbackLevel:
          FALLBACK_LEVEL.ESCALATE,
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
  "ESCALATE exposes canonical open contact action",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "No sé, otra cosa",

        fallbackLevel:
          FALLBACK_LEVEL.ESCALATE,
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
      response.actions[0].target,
      FALLBACK_RESPONSE_TARGET
        .CONTACT,
    );
  },
);


test(
  "ESCALATE records offered contact as last functional action",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "No sé, otra cosa",

        fallbackLevel:
          FALLBACK_LEVEL.ESCALATE,
      });


    assert.equal(
      response.stateEffects
        .setLastAction,
      FALLBACK_LAST_ACTION
        .OFFER_CONTACT,
    );
  },
);


test(
  "ESCALATE does not invent diagnostic or Calendly actions",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "No sé, otra cosa",

        fallbackLevel:
          FALLBACK_LEVEL.ESCALATE,
      });


    const actionTypes =
      response.actions.map(
        (action) =>
          action.type,
      );


    assert.equal(
      actionTypes.includes(
        RESPONSE_ACTION_TYPE
          .START_DIAGNOSTIC,
      ),
      false,
    );


    assert.equal(
      actionTypes.includes(
        RESPONSE_ACTION_TYPE
          .OPEN_CALENDLY,
      ),
      false,
    );
  },
);


test(
  "ESCALATE exposes no category quick replies",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "No sé, otra cosa",

        fallbackLevel:
          FALLBACK_LEVEL.ESCALATE,
      });


    assert.deepEqual(
      response.quickReplies,
      [],
    );
  },
);


/* ============================================================
 * SAFETY / EVIDENCE
 * ============================================================
 */

test(
  "all fallback levels expose no Knowledge evidence",
  () => {
    for (
      const fallbackLevel
      of [
        FALLBACK_LEVEL.CLARIFY,
        FALLBACK_LEVEL.CATEGORIES,
        FALLBACK_LEVEL.ESCALATE,
      ]
    ) {
      const response =
        composeFallbackResponse({
          userText:
            "texto no entendido",

          fallbackLevel,
        });


      assert.equal(
        response.evidence.mode,
        RESPONSE_EVIDENCE_MODE.NONE,
      );


      assert.deepEqual(
        response.evidence
          .knowledgeIds,
        [],
      );
    }
  },
);


test(
  "all fallback levels disable inference",
  () => {
    for (
      const fallbackLevel
      of [
        FALLBACK_LEVEL.CLARIFY,
        FALLBACK_LEVEL.CATEGORIES,
        FALLBACK_LEVEL.ESCALATE,
      ]
    ) {
      const response =
        composeFallbackResponse({
          userText:
            "texto no entendido",

          fallbackLevel,
        });


      assert.equal(
        response.safety
          .allowInference,
        false,
      );
    }
  },
);


test(
  "fallback forbidden invented claims are preserved",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "¿Puedes decir algo que no aparece en el portfolio?",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    for (
      const claim
      of FALLBACK_FORBIDDEN_CLAIMS
    ) {
      assert.ok(
        response.safety
          .forbiddenClaims
          .includes(
            claim,
          ),
        claim,
      );
    }
  },
);


test(
  "fallback continuity is always repair",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "texto extraño",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.equal(
      response.conversation
        .continuity,
      "repair",
    );
  },
);


test(
  "fallback never asks visitor name",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "texto extraño",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
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
 * ANALYTICS / TRACE
 * ============================================================
 */

test(
  "fallback analytics exposes only structured level data",
  () => {
    const rawText =
      "mensaje privado que no debe entrar en analytics";


    const response =
      composeFallbackResponse({
        userText:
          rawText,

        fallbackLevel:
          FALLBACK_LEVEL.CATEGORIES,

        confidenceBucket:
          "low",
      });


    assert.equal(
      response.analytics
        .fallbackLevel,
      2,
    );


    assert.equal(
      response.analytics
        .confidenceBucket,
      "low",
    );


    assert.equal(
      JSON.stringify(
        response.analytics,
      ).includes(
        rawText,
      ),
      false,
    );
  },
);


test(
  "fallback defaults canonical unknown intent",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      });


    assert.equal(
      response.intent,
      "unknown",
    );


    assert.equal(
      response.analytics.intent,
      "unknown",
    );
  },
);


test(
  "fallback preserves FAQ and Answer QA trace",
  () => {
    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,

        faqId:
          "faq-fallback-test",

        answerQaId:
          "aqa-unsupported-001",
      });


    assert.equal(
      response.trace.faqId,
      "faq-fallback-test",
    );


    assert.equal(
      response.trace.answerQaId,
      "aqa-unsupported-001",
    );
  },
);


test(
  "each fallback level has a distinct response template id",
  () => {
    const templateIds =
      [
        FALLBACK_LEVEL.CLARIFY,
        FALLBACK_LEVEL.CATEGORIES,
        FALLBACK_LEVEL.ESCALATE,
      ].map(
        (fallbackLevel) =>
          composeFallbackResponse({
            userText:
              "texto extraño",

            fallbackLevel,
          }).trace
            .responseTemplateId,
      );


    assert.deepEqual(
      templateIds,
      [
        FALLBACK_RESPONSE_TEMPLATE
          .CLARIFY,

        FALLBACK_RESPONSE_TEMPLATE
          .CATEGORIES,

        FALLBACK_RESPONSE_TEMPLATE
          .ESCALATE,
      ],
    );
  },
);


/* ============================================================
 * REAL NLU INTEGRATION
 * ============================================================
 */

test(
  "first real unknown NLU result composes CLARIFY",
  () => {
    const analysis =
      analyzeMessage(
        "asdfgh qwerty",
        {
          consecutiveFallbacks:
            0,
        },
      );


    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        analysis,
      });


    assert.equal(
      analysis.fallbackLevel,
      FALLBACK_LEVEL.CLARIFY,
    );


    assert.equal(
      response.analytics
        .fallbackLevel,
      FALLBACK_LEVEL.CLARIFY,
    );


    assert.deepEqual(
      response.quickReplies,
      [],
    );
  },
);


test(
  "second consecutive real NLU fallback composes CATEGORIES",
  () => {
    const analysis =
      analyzeMessage(
        "asdfgh qwerty",
        {
          consecutiveFallbacks:
            1,
        },
      );


    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        analysis,
      });


    assert.equal(
      analysis.fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );


    assert.equal(
      response.analytics
        .fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );


    assert.equal(
      response.quickReplies
        .length,
      4,
    );
  },
);


test(
  "third consecutive real NLU fallback composes ESCALATE",
  () => {
    const analysis =
      analyzeMessage(
        "asdfgh qwerty",
        {
          consecutiveFallbacks:
            2,
        },
      );


    const response =
      composeFallbackResponse({
        userText:
          "asdfgh qwerty",

        analysis,
      });


    assert.equal(
      analysis.fallbackLevel,
      FALLBACK_LEVEL.ESCALATE,
    );


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );


    assert.deepEqual(
      response.quickReplies,
      [],
    );
  },
);


test(
  "recognized MEDIUM NLU intent is not converted into fallback",
  () => {
    const analysis =
      analyzeMessage(
        "¿Sabe DAX?",
      );


    assert.equal(
      analysis.fallbackLevel,
      FALLBACK_LEVEL.NONE,
    );


    assert.equal(
      analysis.needsConfirmation,
      true,
    );


    assert.equal(
      composeFallbackResponse({
        userText:
          "¿Sabe DAX?",

        analysis,
      }),
      null,
    );
  },
);


/* ============================================================
 * DEFENSIVE
 * ============================================================
 */

test(
  "empty message cannot fabricate fallback response",
  () => {
    assert.equal(
      composeFallbackResponse({
        userText:
          "   ",

        fallbackLevel:
          FALLBACK_LEVEL.CLARIFY,
      }),
      null,
    );
  },
);


test(
  "NONE level cannot fabricate fallback response",
  () => {
    assert.equal(
      composeFallbackResponse({
        userText:
          "Texto válido",

        fallbackLevel:
          FALLBACK_LEVEL.NONE,
      }),
      null,
    );
  },
);


test(
  "fallback responses remain JSON serializable",
  () => {
    for (
      const fallbackLevel
      of [
        FALLBACK_LEVEL.CLARIFY,
        FALLBACK_LEVEL.CATEGORIES,
        FALLBACK_LEVEL.ESCALATE,
      ]
    ) {
      const response =
        composeFallbackResponse({
          userText:
            "texto extraño",

          fallbackLevel,
        });


      assert.doesNotThrow(
        () =>
          JSON.stringify(
            response,
          ),
      );
    }
  },
);