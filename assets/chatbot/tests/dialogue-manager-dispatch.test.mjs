import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_TYPE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
} from "../core/nlu.js";

import {
  DIALOGUE_DECISION_KIND,
  DIALOGUE_ROUTE,
  applyDialogueStateEffects,
  dispatchDialogueResponse,
  processDialogueTurn,
  resolveDialogueDecision,
} from "../core/dialogue-manager.js";

import {
  getState,
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


function actionTypes(
  response,
) {
  return (
    response
      ?.actions ??
    []
  ).map(
    (action) =>
      action.type,
  );
}


function quickReplyLabels(
  response,
) {
  return (
    response
      ?.quickReplies ??
    []
  ).map(
    (reply) =>
      reply.label,
  );
}


function createInjectedDecision({
  route,
  intent = null,
  metadata = {},
  analysis = null,
} = {}) {
  return Object.freeze({
    kind:
      DIALOGUE_DECISION_KIND.ROUTE,

    route,

    priority:
      1,

    intent,

    reason:
      "test_injected_route",

    analysis,

    metadata:
      Object.freeze({
        ...metadata,
      }),

    confirmation:
      null,
  });
}


/* ============================================================
 * .23.5 — DISPATCHER → RESPONSE COMPOSERS
 * ============================================================
 */

test(
  "education overview turn produces real Response Envelope",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué ha estudiado Víctor?",

        applyState:
          false,
      });


    assert.ok(result);
    assert.ok(result.response);

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Desarrollo de Aplicaciones Informáticas/i,
    );
  },
);


test(
  "capabilities overview turn produces capability answer",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué sabe hacer Víctor?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Business Intelligence/i,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /automatización de procesos/i,
    );
  },
);


test(
  "technologies overview turn preserves mastery qualification",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué tecnologías domina?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE
        .KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /No sería correcto decir que Víctor domina todas las tecnologías al mismo nivel/i,
    );

    assert.equal(
      /domina Qlik|experto en Qlik/i
        .test(
          visibleText(
            result.response,
          ),
        ),
      false,
    );
  },
);


test(
  "privacy turn dispatches Privacy Composer",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Cómo funciona la privacidad?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.PRIVACY,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.PRIVACY,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /sessionStorage/i,
    );
  },
);


test(
  "commercial price turn dispatches safe commercial response",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Cuánto cobra Víctor?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.COMMERCIAL,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.outcome,
      RESPONSE_OUTCOME.REDIRECTED,
    );

    assert.ok(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.OPEN_CONTACT,
      ),
    );

    assert.equal(
      /\b\d+(?:[.,]\d+)?\s*(?:€|euros?)\b/i
        .test(
          visibleText(
            result.response,
          ),
        ),
      false,
    );
  },
);


test(
  "commercial timeline turn never invents duration",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Cuánto tardaría en hacer un proyecto?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.COMMERCIAL,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      /\b\d+\s*(?:días?|semanas?|meses?)\b/i
        .test(
          visibleText(
            result.response,
          ),
        ),
      false,
    );
  },
);


test(
  "booking turn dispatches Operational Composer",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "Quiero reservar una reunión",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.OPERATIONAL,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.ok(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.OPEN_CALENDLY,
      ),
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Calendly/i,
    );
  },
);


test(
  "contact turn dispatches Operational Composer",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "Quiero contactar con Víctor",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.OPERATIONAL,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.ok(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.OPEN_CONTACT,
      ),
    );
  },
);


test(
  "manual Excel problem dispatches Problem Solution Service Composer",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI.",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.PROBLEM_FLOW,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.outcome,
      RESPONSE_OUTCOME.QUALIFIED,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /reporting.*simplificarse|automatizada.*preparación|actualización de los datos/i,
    );

    assert.ok(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
      ),
    );
  },
);


test(
  "portfolio question dispatches direct Knowledge response",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Quién es Víctor?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /trayectoria|Business Intelligence|automatización/i,
    );
  },
);


test(
  "projects question dispatches Knowledge list",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué proyectos tiene?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Business Cost Intelligence/i,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Investment Dashboard/i,
    );
  },
);


test(
  "services question dispatches Knowledge list",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué servicios ofrece Víctor?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Dashboards y Business Intelligence/i,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Automatización de procesos y datos/i,
    );
  },
);


/* ============================================================
 * QUALIFIED KNOWLEDGE DISPATCH
 *
 * Aquí inyectamos la decisión porque este fichero prueba el
 * dispatcher. El routing textual completo se volverá a atacar
 * en .23.8/.23.9.
 * ============================================================
 */

test(
  "direct Knowledge dispatcher qualifies Qlik instead of inventing experience",
  () => {
    const decision =
      createInjectedDecision({
        route:
          DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

        intent:
          INTENT_IDS.TECHNOLOGIES,

        analysis: {
          entities: {
            case: {
              tools: [
                "Qlik",
              ],
            },
          },
        },
      });


    const response =
      dispatchDialogueResponse({
        userText:
          "¿Víctor tiene experiencia con Qlik Sense?",

        decision,
      });


    assert.ok(response);

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.QUALIFIED,
    );

    assert.match(
      visibleText(response),
      /no tengo base.*experiencia profesional|eso no equivale a experiencia profesional/i,
    );

    assert.equal(
      /sí tiene experiencia|experto en Qlik/i
        .test(
          visibleText(response),
        ),
      false,
    );
  },
);


test(
  "direct Knowledge dispatcher qualifies AWS as training rather than professional experience",
  () => {
    const decision =
      createInjectedDecision({
        route:
          DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

        intent:
          INTENT_IDS.TECHNOLOGIES,

        analysis: {
          entities: {
            case: {
              tools: [
                "AWS",
              ],
            },
          },
        },
      });


    const response =
      dispatchDialogueResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        decision,
      });


    assert.ok(response);

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.QUALIFIED,
    );

    assert.match(
      visibleText(response),
      /formación/i,
    );

    assert.match(
      visibleText(response),
      /no tengo base.*experiencia profesional|eso no equivale a experiencia profesional/i,
    );
  },
);


test(
  "direct Knowledge dispatcher can answer explicit Power BI technology",
  () => {
    const decision =
      createInjectedDecision({
        route:
          DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,

        intent:
          INTENT_IDS.POWER_BI,

        analysis: {
          entities: {
            case: {
              tools: [
                "Power BI",
              ],
            },
          },
        },
      });


    const response =
      dispatchDialogueResponse({
        userText:
          "¿Víctor trabaja con Power BI?",

        decision,
      });


    assert.ok(response);

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.equal(
      response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );

    assert.ok(
      response.evidence
        .knowledgeIds
        .includes(
          "technology-power-bi",
        ),
    );

    assert.match(
      visibleText(response),
      /uso profesional actual/i,
    );
  },
);


/* ============================================================
 * CONFIRMATION DISPATCH
 * ============================================================
 */

test(
  "DAX confirmation produces real clarification Response Envelope",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Sabe DAX?",

        applyState:
          false,
      });


    assert.equal(
      result.decision.kind,
      DIALOGUE_DECISION_KIND.CONFIRM,
    );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.CONFIRMATION,
    );

    assert.ok(result.response);

    assert.equal(
      isValidResponseEnvelope(
        result.response,
      ),
      true,
    );

    assert.equal(
      result.response.outcome,
      RESPONSE_OUTCOME.NEEDS_CLARIFICATION,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /Power BI, DAX o Power Query/i,
    );

    assert.equal(
      result.response.followUp.required,
      true,
    );

    assert.equal(
      result.response.stateEffects
        .resetFallbacks,
      true,
    );
  },
);


test(
  "DAX confirmation is never dispatched as fallback",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Sabe DAX?",

        applyState:
          false,
      });


    assert.notEqual(
      result.response.kind,
      RESPONSE_KIND.FALLBACK,
    );

    assert.notEqual(
      result.decision.route,
      DIALOGUE_ROUTE.FALLBACK,
    );

    assert.equal(
      result.decision.analysis
        .fallbackLevel,
      FALLBACK_LEVEL.NONE,
    );
  },
);


/* ============================================================
 * .23.7 — FALLBACK ORCHESTRATION
 * ============================================================
 */

test(
  "first unknown turn dispatches CLARIFY fallback",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "asdfgh qwerty",

        context: {
          consecutiveFallbacks:
            0,
        },

        applyState:
          false,
      });


    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.FALLBACK,
    );

    assert.equal(
      result.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.CLARIFY,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.FALLBACK,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /otra forma|más contexto/i,
    );

    assert.ok(result.response.quickReplies.length > 0);

    assert.ok(result.response.actions.some(a => a.type === 'start-diagnostic'));
  },
);


test(
  "second consecutive unknown turn dispatches CATEGORIES fallback",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "asdfgh qwerty",

        context: {
          consecutiveFallbacks:
            1,
        },

        applyState:
          false,
      });


    assert.equal(
      result.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.FALLBACK,
    );

    assert.deepEqual(
      quickReplyLabels(
        result.response,
      ),
      [
        "Experiencia",
        "Tecnologías",
        "Proyectos",
        "Servicios",
      ],
    );

    assert.ok(result.response.actions.some(a => a.type === 'start-diagnostic'));
  },
);


test(
  "third consecutive unknown turn dispatches ESCALATE fallback",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "asdfgh qwerty",

        context: {
          consecutiveFallbacks:
            2,
        },

        applyState:
          false,
      });


    assert.equal(
      result.decision.metadata
        .fallbackLevel,
      FALLBACK_LEVEL.ESCALATE,
    );

    assert.equal(
      result.response.kind,
      RESPONSE_KIND.FALLBACK,
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /No quiero seguir haciéndote repetir/i,
    );

    assert.ok(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.OPEN_CONTACT,
      ),
    );

    assert.equal(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.START_DIAGNOSTIC,
      ),
      true,
    );

    assert.equal(
      actionTypes(
        result.response,
      ).includes(
        RESPONSE_ACTION_TYPE.OPEN_CALENDLY,
      ),
      false,
    );
  },
);


test(
  "fallback dispatcher preserves fallback stateEffects",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "asdfgh qwerty",

        context: {
          consecutiveFallbacks:
            0,
        },

        applyState:
          false,
      });


    assert.equal(
      result.response
        .stateEffects
        .incrementFallbacks,
      true,
    );

    assert.equal(
      result.response
        .stateEffects
        .resetFallbacks,
      false,
    );

    assert.equal(
      result.response
        .stateEffects
        .markQuestionAsked,
      "fallback-clarify",
    );
  },
);


test(
  "recognized response resets fallback chain declaratively",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué ha estudiado Víctor?",

        context: {
          consecutiveFallbacks:
            2,
        },

        applyState:
          false,
      });


    assert.notEqual(
      result.decision.route,
      DIALOGUE_ROUTE.FALLBACK,
    );

    assert.equal(
      result.response
        .stateEffects
        .resetFallbacks,
      true,
    );
  },
);


/* ============================================================
 * .23.6 — CENTRAL STATE EFFECT APPLICATION
 * ============================================================
 */

test(
  "applyState false keeps turn orchestration pure",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué ha estudiado Víctor?",

        applyState:
          false,
      });


    assert.equal(
      result.stateApplication,
      null,
    );
  },
);


test(
  "Dialogue Manager applies supported stateEffects centrally",
  () => {
    const before =
      getState();


    const beforeConsecutive =
      before.conversation
        .consecutiveFallbacks;


    const beforeTotal =
      before.conversation
        .totalFallbacks;


    const result =
      applyDialogueStateEffects({
        stateEffects: {
          resetFallbacks:
            false,

          incrementFallbacks:
            true,

          markQuestionAsked:
            "dm-dispatch-test-question",

          setLastAction:
            "dm-dispatch-test-action",

          markNameAsked:
            false,

          markFeedbackOffered:
            false,
        },
      });


    assert.ok(
      result.applied.includes(
        "incrementFallbacks",
      ),
    );

    assert.ok(
      result.applied.includes(
        "markQuestionAsked",
      ),
    );

    assert.ok(
      result.applied.includes(
        "setLastAction",
      ),
    );

    assert.deepEqual(
      result.deferred,
      [],
    );

    assert.equal(
      result.state
        .conversation
        .consecutiveFallbacks,
      beforeConsecutive + 1,
    );

    assert.equal(
      result.state
        .conversation
        .totalFallbacks,
      beforeTotal + 1,
    );

    assert.ok(
      result.state
        .conversation
        .askedQuestionIds
        .includes(
          "dm-dispatch-test-question",
        ),
    );

    assert.equal(
      result.state
        .conversation
        .lastAction,
      "dm-dispatch-test-action",
    );
  },
);


test(
  "name and feedback state effects are persisted through canonical markers",
  () => {
    const result =
      applyDialogueStateEffects({
        stateEffects: {
          resetFallbacks:
            false,

          incrementFallbacks:
            false,

          markQuestionAsked:
            null,

          setLastAction:
            null,

          markNameAsked:
            true,

          markFeedbackOffered:
            true,
        },
      });


    assert.deepEqual(
      result.deferred,
      [],
    );

    assert.ok(
      result.applied.includes(
        "markNameAsked",
      ),
    );

    assert.ok(
      result.applied.includes(
        "markFeedbackOffered",
      ),
    );

    assert.ok(
      result.state
        .conversation
        .askedQuestionIds
        .includes(
          "social-name-asked",
        ),
    );

    assert.ok(
      result.state
        .conversation
        .askedQuestionIds
        .includes(
          "social-feedback-offered",
        ),
    );
  },
);


test(
  "resetFallbacks stateEffect resets consecutive fallback counter",
  () => {
    const result =
      applyDialogueStateEffects({
        stateEffects: {
          resetFallbacks:
            true,

          incrementFallbacks:
            false,

          markQuestionAsked:
            null,

          setLastAction:
            null,

          markNameAsked:
            false,

          markFeedbackOffered:
            false,
        },
      });


    assert.ok(
      result.applied.includes(
        "resetFallbacks",
      ),
    );

    assert.equal(
      result.state
        .conversation
        .consecutiveFallbacks,
      0,
    );
  },
);


/* ============================================================
 * FAIL-CLOSED / CONTRACT
 * ============================================================
 */

test(
  "dispatcher fails closed for unsupported route",
  () => {
    const response =
      dispatchDialogueResponse({
        userText:
          "texto cualquiera",

        decision:
          createInjectedDecision({
            route:
              DIALOGUE_ROUTE.UNSUPPORTED,
          }),
      });


    assert.equal(
      response,
      null,
    );
  },
);


test(
  "dispatcher rejects missing decision",
  () => {
    assert.equal(
      dispatchDialogueResponse({
        userText:
          "Hola",
      }),
      null,
    );
  },
);


test(
  "dispatcher rejects blank user text",
  () => {
    const decision =
      resolveDialogueDecision({
        userText:
          "Hola",
      });


    assert.equal(
      dispatchDialogueResponse({
        userText:
          "   ",

        decision,
      }),
      null,
    );
  },
);


test(
  "processDialogueTurn rejects blank user text",
  () => {
    assert.equal(
      processDialogueTurn({
        userText:
          "   ",
      }),
      null,
    );
  },
);


test(
  "turn result remains JSON serializable",
  () => {
    const result =
      processDialogueTurn({
        userText:
          "¿Qué tecnologías domina?",

        applyState:
          false,
      });


    assert.doesNotThrow(
      () =>
        JSON.stringify(
          result,
        ),
    );
  },
);