import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_TYPE,
  RESPONSE_IDENTITY_DISCLOSURE,
  RESPONSE_KIND,
  RESPONSE_NAME_POLICY,
  RESPONSE_NAME_SOURCE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  SOCIAL_GREETING_TYPE,
  SOCIAL_RESPONSE_INTENT,
  composeAcknowledgementResponse,
  composeGoodbyeResponse,
  composeGreetingResponse,
  composeNameDeclinedResponse,
  composeNameProvidedResponse,
  composeSocialResponse,
  composeThanksResponse,
  normalizeSocialResponseContext,
} from "../core/social-response-composer.js";


test(
  "social context normalizes safely",
  () => {
    const context =
      normalizeSocialResponseContext({
        turnIndex:
          -5,

        visitorName:
          "  Juan  ",

        recentVariantIds: [
          "x",
          null,
          "",
        ],
      });

    assert.equal(
      context.turnIndex,
      0,
    );

    assert.equal(
      context.visitorName,
      "Juan",
    );

    assert.deepEqual(
      context.recentVariantIds,
      [
        "x",
      ],
    );
  },
);


test(
  "anonymous generic greeting is valid",
  () => {
    const response =
      composeGreetingResponse({
        greetingType:
          SOCIAL_GREETING_TYPE
            .GENERIC,
      });

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.equal(
      response.kind,
      RESPONSE_KIND.SOCIAL,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.SOCIAL,
    );
  },
);


test(
  "first greeting introduces digital assistant",
  () => {
    const response =
      composeGreetingResponse({
        context: {
          assistantIntroduced:
            false,
        },
      });

    assert.equal(
      response.conversation
        .identityDisclosure,
      RESPONSE_IDENTITY_DISCLOSURE
        .REQUIRED,
    );

    assert.ok(
      response.messages.some(
        (message) =>
          message.text
            .toLowerCase()
            .includes(
              "asistente digital",
            ),
      ),
    );
  },
);


test(
  "returning greeting does not repeat introduction",
  () => {
    const response =
      composeGreetingResponse({
        context: {
          assistantIntroduced:
            true,
        },
      });

    assert.equal(
      response.conversation
        .identityDisclosure,
      RESPONSE_IDENTITY_DISCLOSURE
        .NOT_NEEDED,
    );

    assert.equal(
      response.messages.some(
        (message) =>
          message.text
            .toLowerCase()
            .includes(
              "asistente digital",
            ),
      ),
      false,
    );
  },
);


test(
  "anonymous greeting does not ask for a name",
  () => {
    const response =
      composeGreetingResponse({
        context: {
          allowNameQuestion:
            true,

          nameAlreadyAsked:
            false,
        },
      });

    assert.equal(
      response.personalization
        .namePolicy,
      RESPONSE_NAME_POLICY
        .NEVER,
    );

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );

    assert.equal(
      response.followUp,
      null,
    );
  },
);


test(
  "name is never asked twice",
  () => {
    const response =
      composeGreetingResponse({
        context: {
          nameAlreadyAsked:
            true,
        },
      });

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );

    assert.equal(
      response.followUp,
      null,
    );
  },
);


test(
  "name decline prevents future name question",
  () => {
    const response =
      composeGreetingResponse({
        context: {
          nameDeclined:
            true,
        },
      });

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );
  },
);


test(
  "known name personalizes greeting",
  () => {
    const response =
      composeGreetingResponse({
        greetingType:
          SOCIAL_GREETING_TYPE
            .MORNING,

        context: {
          visitorName:
            "Juan",

          assistantIntroduced:
            true,
        },
      });

    assert.ok(
      response.messages[0]
        .text.includes(
          "Juan",
        ),
    );

    assert.equal(
      response.personalization
        .usedName,
      true,
    );

    assert.equal(
      response.personalization
        .nameSource,
      RESPONSE_NAME_SOURCE
        .SESSION,
    );
  },
);


test(
  "morning greeting preserves morning language",
  () => {
    const response =
      composeGreetingResponse({
        greetingType:
          SOCIAL_GREETING_TYPE
            .MORNING,

        context: {
          visitorName:
            "Juan",

          assistantIntroduced:
            true,
        },
      });

    assert.match(
      response.messages[0]
        .text,
      /buenos días/i,
    );
  },
);


test(
  "afternoon greeting preserves afternoon language",
  () => {
    const response =
      composeGreetingResponse({
        greetingType:
          SOCIAL_GREETING_TYPE
            .AFTERNOON,

        context: {
          visitorName:
            "Ana",

          assistantIntroduced:
            true,
        },
      });

    assert.match(
      response.messages[0]
        .text,
      /buenas tardes/i,
    );
  },
);


test(
  "evening greeting preserves evening language",
  () => {
    const response =
      composeGreetingResponse({
        greetingType:
          SOCIAL_GREETING_TYPE
            .EVENING,

        context: {
          visitorName:
            "Luis",

          assistantIntroduced:
            true,
        },
      });

    assert.match(
      response.messages[0]
        .text,
      /buenas noches/i,
    );
  },
);


test(
  "provided name creates natural acknowledgement",
  () => {
    const response =
      composeNameProvidedResponse({
        name:
          "Laura",
      });

    assert.ok(
      response.messages[0]
        .text.includes(
          "Laura",
        ),
    );

    assert.equal(
      response.personalization
        .usedName,
      true,
    );

    assert.equal(
      response.personalization
        .nameSource,
      RESPONSE_NAME_SOURCE
        .CURRENT_MESSAGE,
    );
  },
);


test(
  "name provided requires actual name",
  () => {
    assert.throws(
      () =>
        composeNameProvidedResponse({
          name:
            "   ",
        }),
    );
  },
);


test(
  "declining name is respected",
  () => {
    const response =
      composeNameDeclinedResponse();

    assert.equal(
      response.personalization
        .namePolicy,
      RESPONSE_NAME_POLICY.NEVER,
    );

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );
  },
);


test(
  "thanks is short and does not reopen flow",
  () => {
    const response =
      composeThanksResponse();

    assert.equal(
      response.messages.length,
      1,
    );

    assert.equal(
      response.conversation
        .mustNotReopenFlow,
      true,
    );

    assert.equal(
      response.actions.length,
      0,
    );
  },
);


test(
  "thanks does not overuse known visitor name",
  () => {
    const response =
      composeThanksResponse({
        context: {
          visitorName:
            "Juan",
        },
      });

    assert.equal(
      response.personalization
        .usedName,
      false,
    );

    assert.equal(
      response.messages[0]
        .text.includes(
          "Juan",
        ),
      false,
    );
  },
);


test(
  "goodbye closes conversation",
  () => {
    const response =
      composeGoodbyeResponse();

    assert.equal(
      response.conversation
        .stage,
      RESPONSE_STAGE.CLOSING,
    );

    assert.equal(
      response.conversation
        .mustNotReopenFlow,
      true,
    );
  },
);


test(
  "goodbye may naturally use known name",
  () => {
    const response =
      composeGoodbyeResponse({
        context: {
          visitorName:
            "Juan",
        },
      });

    assert.equal(
      response.personalization
        .usedName,
      true,
    );

    assert.ok(
      response.messages[0]
        .text.includes(
          "Juan",
        ),
    );
  },
);


test(
  "feedback is offered after meaningful conversation",
  () => {
    const response =
      composeGoodbyeResponse({
        context: {
          meaningfulConversation:
            true,

          feedbackAlreadyOffered:
            false,

          allowFeedback:
            true,
        },
      });

    assert.equal(
      response.conversation
        .mayOfferFeedback,
      true,
    );

    assert.equal(
      response.actions.length,
      0,
    );

    assert.deepEqual(
      response.quickReplies.map(
        (item) => item.label,
      ),
      [
        "👍 Sí",
        "😐 Más o menos",
        "👎 No",
      ],
    );

    assert.match(
      response.messages.at(-1).text,
      /resultado útil|resultado util|ha resultado útil|ha resultado util/i,
    );

    assert.equal(
      response.stateEffects
        .markFeedbackOffered,
      true,
    );
  },
);


test(
  "feedback is not offered for trivial conversation",
  () => {
    const response =
      composeGoodbyeResponse({
        context: {
          meaningfulConversation:
            false,
        },
      });

    assert.equal(
      response.actions.length,
      0,
    );

    assert.equal(
      response.conversation
        .mayOfferFeedback,
      false,
    );
  },
);


test(
  "feedback is never offered twice",
  () => {
    const response =
      composeGoodbyeResponse({
        context: {
          meaningfulConversation:
            true,

          feedbackAlreadyOffered:
            true,
        },
      });

    assert.equal(
      response.actions.length,
      0,
    );
  },
);


test(
  "acknowledgement remains conversational and action free",
  () => {
    const response =
      composeAcknowledgementResponse();

    assert.equal(
      response.kind,
      RESPONSE_KIND.SOCIAL,
    );

    assert.equal(
      response.actions.length,
      0,
    );
  },
);


test(
  "main composer routes greeting",
  () => {
    const response =
      composeSocialResponse({
        intent:
          SOCIAL_RESPONSE_INTENT
            .GREETING,
      });

    assert.equal(
      response.intent,
      "greeting",
    );
  },
);


test(
  "main composer routes thanks",
  () => {
    const response =
      composeSocialResponse({
        intent:
          SOCIAL_RESPONSE_INTENT
            .THANKS,
      });

    assert.equal(
      response.intent,
      "thanks",
    );
  },
);


test(
  "main composer routes goodbye",
  () => {
    const response =
      composeSocialResponse({
        intent:
          SOCIAL_RESPONSE_INTENT
            .GOODBYE,
      });

    assert.equal(
      response.intent,
      "goodbye",
    );
  },
);


test(
  "main composer routes name provided",
  () => {
    const response =
      composeSocialResponse({
        intent:
          SOCIAL_RESPONSE_INTENT
            .NAME_PROVIDED,

        name:
          "Marta",
      });

    assert.ok(
      response.messages[0]
        .text.includes(
          "Marta",
        ),
    );
  },
);


test(
  "unknown social intent returns null",
  () => {
    assert.equal(
      composeSocialResponse({
        intent:
          "does-not-exist",
      }),
      null,
    );
  },
);


test(
  "social responses remain JSON serializable",
  () => {
    const responses = [
      composeGreetingResponse(),
      composeThanksResponse(),
      composeGoodbyeResponse(),
      composeNameDeclinedResponse(),
      composeAcknowledgementResponse(),
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