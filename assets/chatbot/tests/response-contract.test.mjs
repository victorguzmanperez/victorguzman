import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_CONTINUITY,
  RESPONSE_DEPTH,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_FOLLOW_UP_KIND,
  RESPONSE_IDENTITY_DISCLOSURE,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_NAME_POLICY,
  RESPONSE_NAME_SOURCE,
  RESPONSE_OUTCOME,
  RESPONSE_SCHEMA_VERSION,
  RESPONSE_STAGE,
  createResponseEnvelope,
  isValidResponseEnvelope,
} from "../core/response-contract.js";


function basicResponse(
  overrides = {},
) {
  return {
    id:
      "response-test-basic",

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent:
      "powerbi",

    messages: [
      {
        id:
          "msg-1",

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text:
          "Sí. Power BI forma parte de la experiencia profesional documentada de Víctor.",
      },
    ],

    ...overrides,
  };
}


test(
  "valid response envelope can be created",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse(),
      );

    assert.equal(
      response.schemaVersion,
      RESPONSE_SCHEMA_VERSION,
    );

    assert.equal(
      response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );
  },
);


test(
  "response structures are deeply frozen",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse(),
      );

    assert.equal(
      Object.isFrozen(
        response,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        response.messages,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        response.messages[0],
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        response.presentation,
      ),
      true,
    );
  },
);


test(
  "unknown top-level fields are rejected",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope({
          ...basicResponse(),

          rawUserText:
            "private text",
        }),
    );
  },
);


test(
  "response requires at least one message",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            messages: [],
          }),
        ),
    );
  },
);


test(
  "response supports at most four bubbles",
  () => {
    const messages =
      Array.from(
        {
          length: 5,
        },
        (_, index) => ({
          id:
            `msg-${index}`,

          purpose:
            RESPONSE_MESSAGE_PURPOSE
              .ANSWER,

          text:
            `Mensaje ${index}`,
        }),
      );

    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            messages,
          }),
        ),
    );
  },
);


test(
  "HTML cannot enter response text",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            messages: [
              {
                id:
                  "msg-html",

                purpose:
                  RESPONSE_MESSAGE_PURPOSE
                    .ANSWER,

                text:
                  "<script>alert(1)</script>",
              },
            ],
          }),
        ),
    );
  },
);


test(
  "identical response bubbles are rejected",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            messages: [
              {
                id:
                  "msg-1",

                purpose:
                  RESPONSE_MESSAGE_PURPOSE
                    .ANSWER,

                text:
                  "De acuerdo.",
              },

              {
                id:
                  "msg-2",

                purpose:
                  RESPONSE_MESSAGE_PURPOSE
                    .ANSWER,

                text:
                  "De acuerdo.",
              },
            ],
          }),
        ),
    );
  },
);


test(
  "visitor name can never be required",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            personalization: {
              namePolicy:
                RESPONSE_NAME_POLICY
                  .OPTIONAL,

              nameRequired:
                true,
            },
          }),
        ),
    );
  },
);


test(
  "unknown visitor name may be requested optionally",
  () => {
    const response =
      createResponseEnvelope({
        id:
          "response-greeting-anonymous",

        kind:
          RESPONSE_KIND.SOCIAL,

        outcome:
          RESPONSE_OUTCOME.SOCIAL,

        intent:
          "greeting",

        messages: [
          {
            id:
              "msg-greeting",

            purpose:
              RESPONSE_MESSAGE_PURPOSE
                .ACKNOWLEDGEMENT,

            text:
              "¡Buenos días! 👋",
          },
        ],

        followUp: {
          kind:
            RESPONSE_FOLLOW_UP_KIND
              .OPTIONAL_PERSONALIZATION,

          text:
            "Si quieres, puedes decirme cómo te llamas.",

          required:
            false,

          key:
            "name",
        },

        personalization: {
          namePolicy:
            RESPONSE_NAME_POLICY
              .OPTIONAL,

          mayAskName:
            true,
        },

        conversation: {
          stage:
            RESPONSE_STAGE.OPENING,

          mirrorUserGreeting:
            true,

          identityDisclosure:
            RESPONSE_IDENTITY_DISCLOSURE
              .REQUIRED,
        },
      });

    assert.equal(
      response.personalization
        .mayAskName,
      true,
    );

    assert.equal(
      response.followUp.required,
      false,
    );
  },
);


test(
  "known name can personalize without asking again",
  () => {
    const response =
      createResponseEnvelope({
        id:
          "response-greeting-known",

        kind:
          RESPONSE_KIND.SOCIAL,

        outcome:
          RESPONSE_OUTCOME.SOCIAL,

        intent:
          "greeting",

        messages: [
          {
            id:
              "msg-greeting-known",

            purpose:
              RESPONSE_MESSAGE_PURPOSE
                .ACKNOWLEDGEMENT,

            text:
              "¡Buenos días, Juan! 👋",
          },
        ],

        personalization: {
          namePolicy:
            RESPONSE_NAME_POLICY
              .USE_IF_KNOWN,

          usedName:
            true,

          nameSource:
            RESPONSE_NAME_SOURCE
              .SESSION,

          mayAskName:
            false,
        },
      });

    assert.equal(
      response.personalization
        .usedName,
      true,
    );

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );
  },
);


test(
  "using a name requires a known source",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            personalization: {
              namePolicy:
                RESPONSE_NAME_POLICY
                  .USE_IF_KNOWN,

              usedName:
                true,
            },
          }),
        ),
    );
  },
);


test(
  "asking for name requires OPTIONAL policy",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            personalization: {
              namePolicy:
                RESPONSE_NAME_POLICY
                  .NEVER,

              mayAskName:
                true,
            },
          }),
        ),
    );
  },
);


test(
  "assistant can never claim to be human",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            safety: {
              mustNotClaimHuman:
                false,
            },
          }),
        ),
    );
  },
);


test(
  "commercial redirect requires human contact action",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            kind:
              RESPONSE_KIND
                .COMMERCIAL_REDIRECT,

            outcome:
              RESPONSE_OUTCOME
                .REDIRECTED,

            safety: {
              commercialRedirect:
                true,
            },

            actions: [],
          }),
        ),
    );
  },
);


test(
  "valid commercial redirect exposes contact action",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse({
          id:
            "response-pricing",

          kind:
            RESPONSE_KIND
              .COMMERCIAL_REDIRECT,

          outcome:
            RESPONSE_OUTCOME
              .REDIRECTED,

          intent:
            "pricing",

          safety: {
            commercialRedirect:
              true,

            mustQualify:
              true,

            forbiddenClaims: [
              "automatic-price",
            ],
          },

          actions: [
            {
              id:
                "action-contact",

              type:
                RESPONSE_ACTION_TYPE
                  .OPEN_CONTACT,

              label:
                "Contactar con Víctor",

              priority:
                RESPONSE_ACTION_PRIORITY
                  .PRIMARY,
            },
          ],
        }),
      );

    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .OPEN_CONTACT,
    );
  },
);


test(
  "only one primary action is allowed",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            actions: [
              {
                id:
                  "action-1",

                type:
                  RESPONSE_ACTION_TYPE
                    .OPEN_CONTACT,

                label:
                  "Contactar",

                priority:
                  RESPONSE_ACTION_PRIORITY
                    .PRIMARY,
              },

              {
                id:
                  "action-2",

                type:
                  RESPONSE_ACTION_TYPE
                    .START_DIAGNOSTIC,

                label:
                  "Diagnóstico",

                priority:
                  RESPONSE_ACTION_PRIORITY
                    .PRIMARY,
              },
            ],
          }),
        ),
    );
  },
);


test(
  "required evidence requires Knowledge references",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            evidence: {
              mode:
                RESPONSE_EVIDENCE_MODE
                  .REQUIRED,
            },
          }),
        ),
    );
  },
);


test(
  "qualified Knowledge response can expose traceability",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse({
          outcome:
            RESPONSE_OUTCOME
              .QUALIFIED,

          evidence: {
            mode:
              RESPONSE_EVIDENCE_MODE
                .REQUIRED,

            knowledgeIds: [
              "technology-power-bi",
            ],

            qualificationReasons: [
              "current-professional-evidence",
            ],
          },

          safety: {
            mustQualify:
              true,
          },

          trace: {
            answerQaId:
              "aqa-factual-002",
          },
        }),
      );

    assert.deepEqual(
      response.evidence
        .knowledgeIds,
      [
        "technology-power-bi",
      ],
    );
  },
);


test(
  "fallback requires fallback outcome",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            kind:
              RESPONSE_KIND.FALLBACK,

            outcome:
              RESPONSE_OUTCOME
                .ANSWERED,
          }),
        ),
    );
  },
);


test(
  "fallback never pretends to have evidence",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            kind:
              RESPONSE_KIND.FALLBACK,

            outcome:
              RESPONSE_OUTCOME
                .FALLBACK,

            evidence: {
              mode:
                RESPONSE_EVIDENCE_MODE
                  .REQUIRED,

              knowledgeIds: [
                "profile-victor",
              ],
            },
          }),
        ),
    );
  },
);


test(
  "fallback may increment but not reset counter",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse({
          id:
            "response-fallback",

          kind:
            RESPONSE_KIND.FALLBACK,

          outcome:
            RESPONSE_OUTCOME
              .FALLBACK,

          stateEffects: {
            incrementFallbacks:
              true,
          },

          analytics: {
            fallbackLevel:
              1,
          },
        }),
      );

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
  "fallback counter cannot increment and reset simultaneously",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            stateEffects: {
              incrementFallbacks:
                true,

              resetFallbacks:
                true,
            },
          }),
        ),
    );
  },
);


test(
  "feedback can be offered after meaningful closing conversation",
  () => {
    const response =
      createResponseEnvelope({
        id:
          "response-goodbye-feedback",

        kind:
          RESPONSE_KIND.SOCIAL,

        outcome:
          RESPONSE_OUTCOME.SOCIAL,

        intent:
          "goodbye",

        messages: [
          {
            id:
              "msg-goodbye",

            purpose:
              RESPONSE_MESSAGE_PURPOSE
                .CLOSING,

            text:
              "Ha sido un placer ayudarte. ¡Hasta pronto!",
          },
        ],

        conversation: {
          stage:
            RESPONSE_STAGE.CLOSING,

          continuity:
            RESPONSE_CONTINUITY
              .CONTINUING,

          mayOfferFeedback:
            true,

          meaningfulConversation:
            true,

          feedbackAlreadyOffered:
            false,

          mustNotReopenFlow:
            true,
        },

        actions: [
          {
            id:
              "action-feedback",

            type:
              RESPONSE_ACTION_TYPE
                .OFFER_FEEDBACK,

            label:
              "Valorar conversación",

            priority:
              RESPONSE_ACTION_PRIORITY
                .SECONDARY,
          },
        ],

        stateEffects: {
          markFeedbackOffered:
            true,
        },
      });

    assert.equal(
      response.conversation
        .mayOfferFeedback,
      true,
    );
  },
);


test(
  "feedback cannot be offered twice",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope({
          id:
            "response-feedback-repeat",

          kind:
            RESPONSE_KIND.SOCIAL,

          outcome:
            RESPONSE_OUTCOME.SOCIAL,

          intent:
            "goodbye",

          messages: [
            {
              id:
                "msg-goodbye",

              purpose:
                RESPONSE_MESSAGE_PURPOSE
                  .CLOSING,

              text:
                "Hasta pronto.",
            },
          ],

          conversation: {
            stage:
              RESPONSE_STAGE.CLOSING,

            mayOfferFeedback:
              true,

            meaningfulConversation:
              true,

            feedbackAlreadyOffered:
              true,
          },

          actions: [
            {
              id:
                "action-feedback",

              type:
                RESPONSE_ACTION_TYPE
                  .OFFER_FEEDBACK,

              label:
                "Valorar conversación",
            },
          ],
        }),
    );
  },
);


test(
  "feedback cannot interrupt an active conversation",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope({
          id:
            "response-feedback-active",

          kind:
            RESPONSE_KIND.SOCIAL,

          outcome:
            RESPONSE_OUTCOME.SOCIAL,

          messages: [
            {
              id:
                "msg-feedback",

              purpose:
                RESPONSE_MESSAGE_PURPOSE
                  .ANSWER,

              text:
                "Continuamos.",
            },
          ],

          conversation: {
            stage:
              RESPONSE_STAGE.ACTIVE,

            mayOfferFeedback:
              true,

            meaningfulConversation:
              true,
          },

          actions: [
            {
              id:
                "action-feedback",

              type:
                RESPONSE_ACTION_TYPE
                  .OFFER_FEEDBACK,

              label:
                "Valorar",
            },
          ],
        }),
    );
  },
);


test(
  "response variation metadata supports anti repetition",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse({
          presentation: {
            depth:
              RESPONSE_DEPTH.SHORT,

            variationFamily:
              "knowledge-confirmation",

            avoidRecentVariants:
              3,
          },
        }),
      );

    assert.equal(
      response.presentation
        .avoidRecentVariants,
      3,
    );
  },
);


test(
  "response can contain only four quick replies",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            quickReplies:
              Array.from(
                {
                  length: 5,
                },
                (_, index) => ({
                  id:
                    `reply-${index}`,

                  label:
                    `Opción ${index}`,

                  kind:
                    "answer",

                  value:
                    `value-${index}`,
                }),
              ),
          }),
        ),
    );
  },
);


test(
  "analytics schema cannot contain raw message or PII",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            analytics: {
              rawMessage:
                "Me llamo Juan",
            },
          }),
        ),
    );
  },
);


test(
  "state effects never contain raw entity values",
  () => {
    assert.throws(
      () =>
        createResponseEnvelope(
          basicResponse({
            stateEffects: {
              name:
                "Juan",
            },
          }),
        ),
    );
  },
);


test(
  "technical response does not require visitor name",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse({
          personalization: {
            namePolicy:
              RESPONSE_NAME_POLICY
                .NEVER,

            mayAskName:
              false,
          },
        }),
      );

    assert.equal(
      response.personalization
        .nameRequired,
      false,
    );

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );
  },
);


test(
  "response envelope remains JSON serializable",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse(),
      );

    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);


test(
  "boolean validator accepts valid envelope",
  () => {
    const response =
      createResponseEnvelope(
        basicResponse(),
      );

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);