import {
  RESPONSE_CONTINUITY,
  RESPONSE_FOLLOW_UP_KIND,
  RESPONSE_IDENTITY_DISCLOSURE,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_NAME_POLICY,
  RESPONSE_NAME_SOURCE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  createResponseEnvelope,
} from "./response-contract.js";

import {
  SOCIAL_LANGUAGE_FAMILY,
  renderSocialTemplate,
  selectSocialVariant,
} from "../data/social-language.js";

import {
  CONVERSATION_TONE,
} from "./tone-analyzer.js";

import {
  createAnswerQuickReply,
} from "./response-interactions.js";

import {
  SUPPORT_QUICK_REPLY_ID,
} from "./conversation-lifecycle.js?v=conv-h3.25.1";


/* ============================================================
 * SOCIAL RESPONSE COMPOSER
 * 1.11.22.3
 *
 * Compone respuestas sociales completas.
 *
 * NO usa Knowledge.
 * NO responde preguntas técnicas.
 * NO toma decisiones comerciales.
 * ============================================================
 */


/* ============================================================
 * SOCIAL INTENTS
 * ============================================================
 */

export const SOCIAL_RESPONSE_INTENT =
  Object.freeze({
    GREETING:
      "greeting",

    THANKS:
      "thanks",

    GOODBYE:
      "goodbye",

    NAME_PROVIDED:
      "name_provided",

    NAME_DECLINED:
      "name_declined",

    ACKNOWLEDGEMENT:
      "acknowledgement",

    CHECK_IN:
      "check_in",

    USER_STATE:
      "user_state",

    CONTINUE:
      "continue",

    FEEDBACK_RATING:
      "feedback_rating",
  });


/* ============================================================
 * GREETING TYPE
 * ============================================================
 */

export const SOCIAL_GREETING_TYPE =
  Object.freeze({
    GENERIC:
      "generic",

    MORNING:
      "morning",

    AFTERNOON:
      "afternoon",

    EVENING:
      "evening",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function normalizeRecentVariantIds(
  value,
) {
  return (
    Array.isArray(value)
      ? value.filter(
          (item) =>
            typeof item ===
              "string" &&
            item.trim(),
        )
      : []
  );
}


function socialVariant(
  familyId,
  context,
) {
  return selectSocialVariant(
    familyId,
    {
      turnIndex:
        context.turnIndex,

      recentVariantIds:
        context.recentVariantIds,

      preferredTone:
        context.preferredTone,
    },
  );
}


function textMessage(
  id,
  purpose,
  variant,
  variables = {},
) {
  return {
    id,

    purpose,

    text:
      renderSocialTemplate(
        variant.text,
        variables,
      ),

    variantId:
      variant.id,
  };
}


function openingQuickReplies() {
  return [
    createAnswerQuickReply({
      id: "qr-opening-problem",
      label: "Tengo un problema",
      answer: "Tengo un problema y no sé por dónde empezar.",
    }),
    createAnswerQuickReply({
      id: "qr-opening-excel-access",
      label: "Excel / Access",
      answer: "Tengo un problema con Excel o Access y procesos manuales.",
    }),
    createAnswerQuickReply({
      id: "qr-opening-reporting",
      label: "Informes / Power BI",
      answer: "Tengo un problema con informes o Power BI.",
    }),
    createAnswerQuickReply({
      id: "qr-opening-profile",
      label: "Conocer a Víctor",
      answer: "¿Quién es Víctor y en qué me puede ayudar?",
    }),
  ];
}


function greetingFamilyFromType(
  greetingType,
) {
  switch (
    greetingType
  ) {
    case SOCIAL_GREETING_TYPE.MORNING:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_MORNING
      );

    case SOCIAL_GREETING_TYPE.AFTERNOON:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_AFTERNOON
      );

    case SOCIAL_GREETING_TYPE.EVENING:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_EVENING
      );

    default:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_GENERIC
      );
  }
}


/* ============================================================
 * CONTEXT NORMALIZATION
 * ============================================================
 */

export function normalizeSocialResponseContext(
  input = {},
) {
  return {
    turnIndex:
      Number.isInteger(
        input.turnIndex,
      ) &&
      input.turnIndex >= 0
        ? input.turnIndex
        : 0,

    recentVariantIds:
      normalizeRecentVariantIds(
        input.recentVariantIds,
      ),

    preferredTone:
      input.preferredTone ??
      null,

    visitorName:
      safeString(
        input.visitorName,
      ) ||
      null,

    providedName:
      safeString(
        input.providedName,
      ) ||
      null,

    nameAlreadyAsked:
      input.nameAlreadyAsked ===
      true,

    nameDeclined:
      input.nameDeclined ===
      true,

    assistantIntroduced:
      input.assistantIntroduced ===
      true,

    meaningfulConversation:
      input.meaningfulConversation ===
      true,

    feedbackAlreadyOffered:
      input.feedbackAlreadyOffered ===
      true,

    allowNameQuestion:
      input.allowNameQuestion !==
      false,

    allowFeedback:
      input.allowFeedback !==
      false,
  };
}


/* ============================================================
 * GREETING
 * ============================================================
 */

export function composeGreetingResponse(
  {
    greetingType =
      SOCIAL_GREETING_TYPE.GENERIC,

    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const greetingVariant =
    socialVariant(
      greetingFamilyFromType(
        greetingType,
      ),
      normalized,
    );

  const introductionVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .INTRODUCTION,
      {
        ...normalized,
        turnIndex:
          normalized.turnIndex +
          1,
      },
    );

  const helpVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .ASK_HOW_CAN_HELP,
      {
        ...normalized,
        turnIndex:
          normalized.turnIndex +
          2,
      },
    );


  const knownName =
    normalized.visitorName;


  const greetingText =
    knownName
      ? `${greetingVariant.text.replace(
          /[!！]\s*(?:👋)?$/,
          "",
        )}, ${knownName}! 👋`
      : greetingVariant.text;


  const messages = [
    {
      id:
        "msg-social-greeting",

      purpose:
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,

      text:
        greetingText,

      variantId:
        greetingVariant.id,
    },
  ];


  if (
    !normalized.assistantIntroduced
  ) {
    messages.push(
      textMessage(
        "msg-social-introduction",
        RESPONSE_MESSAGE_PURPOSE
          .EXPLANATION,
        introductionVariant,
      ),
    );
  }


  messages.push(
    textMessage(
      "msg-social-help",
      RESPONSE_MESSAGE_PURPOSE
        .ANSWER,
      helpVariant,
    ),
  );


  const mayAskName =
    false && // H3.18: voluntary introduction only
    !knownName &&
    !normalized.nameAlreadyAsked &&
    !normalized.nameDeclined &&
    normalized.allowNameQuestion;


  let followUp =
    null;


  if (mayAskName) {
    const optionalNameVariant =
      socialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .OPTIONAL_NAME,
        {
          ...normalized,
          turnIndex:
            normalized.turnIndex +
            3,
        },
      );

    followUp = {
      kind:
        RESPONSE_FOLLOW_UP_KIND
          .OPTIONAL_PERSONALIZATION,

      text:
        optionalNameVariant.text,

      required:
        false,

      key:
        "name",
    };
  }


  return createResponseEnvelope({
    id:
      "response-social-greeting",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "greeting",

    messages,

    quickReplies:
      openingQuickReplies(),

    followUp,

    personalization: {
      namePolicy:
        knownName
          ? RESPONSE_NAME_POLICY
              .USE_IF_KNOWN
          : mayAskName
            ? RESPONSE_NAME_POLICY
                .OPTIONAL
            : RESPONSE_NAME_POLICY
                .NEVER,

      usedName:
        Boolean(
          knownName,
        ),

      nameSource:
        knownName
          ? RESPONSE_NAME_SOURCE
              .SESSION
          : null,

      mayAskName,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.OPENING,

      continuity:
        normalized
          .assistantIntroduced
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      identityDisclosure:
        normalized
          .assistantIntroduced
          ? RESPONSE_IDENTITY_DISCLOSURE
              .NOT_NEEDED
          : RESPONSE_IDENTITY_DISCLOSURE
              .REQUIRED,

      mirrorUserGreeting:
        true,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,

      markNameAsked:
        mayAskName,
    },

    trace: {
      responseTemplateId:
        "social-greeting",
    },
  });
}


/* ============================================================
 * NAME PROVIDED
 * ============================================================
 */

export function composeNameProvidedResponse(
  {
    name,
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext({
      ...context,
      providedName:
        name,
    });


  if (
    !normalized.providedName
  ) {
    throw new TypeError(
      "composeNameProvidedResponse requires a valid name",
    );
  }


  const acceptedVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .NAME_ACCEPTED,
      normalized,
    );

  const helpVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .ASK_HOW_CAN_HELP,
      {
        ...normalized,
        turnIndex:
          normalized.turnIndex +
          1,
      },
    );


  return createResponseEnvelope({
    id:
      "response-social-name-provided",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "greeting",

    messages: [
      textMessage(
        "msg-social-name-accepted",
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,
        acceptedVariant,
        {
          name:
            normalized.providedName,
        },
      ),

      textMessage(
        "msg-social-name-help",
        RESPONSE_MESSAGE_PURPOSE
          .ANSWER,
        helpVariant,
      ),
    ],

    personalization: {
      namePolicy:
        RESPONSE_NAME_POLICY
          .USE_IF_KNOWN,

      usedName:
        true,

      nameSource:
        RESPONSE_NAME_SOURCE
          .CURRENT_MESSAGE,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.OPENING,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-name-provided",
    },
  });
}


/* ============================================================
 * NAME DECLINED
 * ============================================================
 */

export function composeNameDeclinedResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const declineVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .DECLINE_ACKNOWLEDGEMENT,
      normalized,
    );

  const helpVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .ASK_HOW_CAN_HELP,
      {
        ...normalized,
        turnIndex:
          normalized.turnIndex +
          1,
      },
    );


  return createResponseEnvelope({
    id:
      "response-social-name-declined",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "greeting",

    messages: [
      textMessage(
        "msg-social-name-decline",
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,
        declineVariant,
      ),

      textMessage(
        "msg-social-name-decline-help",
        RESPONSE_MESSAGE_PURPOSE
          .ANSWER,
        helpVariant,
      ),
    ],

    personalization: {
      namePolicy:
        RESPONSE_NAME_POLICY.NEVER,

      usedName:
        false,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.OPENING,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-name-declined",
    },
  });
}


/* ============================================================
 * THANKS
 * ============================================================
 */

export function composeThanksResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const thanksVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .THANKS,
      normalized,
    );

  const shouldAskAnythingElse =
    normalized.meaningfulConversation ===
      true;

  const messages = [
    textMessage(
      "msg-social-thanks",
      RESPONSE_MESSAGE_PURPOSE
        .ACKNOWLEDGEMENT,
      thanksVariant,
    ),
  ];

  if (shouldAskAnythingElse) {
    messages.push({
      id:
        "msg-social-anything-else",

      purpose:
        RESPONSE_MESSAGE_PURPOSE
          .QUESTION,

      text:
        "¿Necesitas algo más?",
    });
  }

  const quickReplies =
    shouldAskAnythingElse
      ? [
          createAnswerQuickReply({
            id:
              "qr-social-another-question",
            label:
              "Otra consulta",
            answer:
              "Quiero hacer otra consulta",
          }),
          createAnswerQuickReply({
            id:
              "qr-social-no-thanks",
            label:
              "No, gracias",
            answer:
              "No, gracias",
          }),
        ].filter(Boolean)
      : [];

  return createResponseEnvelope({
    id:
      "response-social-thanks",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "thanks",

    messages,
    quickReplies,

    personalization: {
      namePolicy:
        normalized.visitorName
          ? RESPONSE_NAME_POLICY
              .USE_IF_KNOWN
          : RESPONSE_NAME_POLICY
              .NEVER,

      usedName:
        false,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,

      mustNotReopenFlow:
        !shouldAskAnythingElse,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-thanks",
    },
  });
}


/* ============================================================
 * GOODBYE
 * ============================================================
 */

export function composeGoodbyeResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const goodbyeVariant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .GOODBYE,
      normalized,
    );


  let goodbyeText =
    goodbyeVariant.text;


  let usedName =
    false;


  /*
   * Despedida es uno de los pocos lugares
   * donde usar el nombre resulta natural.
   */
  if (
    normalized.visitorName
  ) {
    goodbyeText =
      `${normalized.visitorName}, ${goodbyeText.charAt(
        0,
      ).toLowerCase()}${goodbyeText.slice(
        1,
      )}`;

    usedName =
      true;
  }


  const shouldOfferFeedback =
    normalized.allowFeedback &&
    normalized
      .meaningfulConversation &&
    !normalized
      .feedbackAlreadyOffered;


  const quickReplies =
    shouldOfferFeedback
      ? [
          createAnswerQuickReply({
            id:
              "qr-feedback-positive",
            label:
              "👍 Sí",
            answer:
              "Sí, me ha resultado útil",
          }),
          createAnswerQuickReply({
            id:
              "qr-feedback-neutral",
            label:
              "😐 Más o menos",
            answer:
              "Más o menos",
          }),
          createAnswerQuickReply({
            id:
              "qr-feedback-negative",
            label:
              "👎 No",
            answer:
              "No me ha resultado útil",
          }),
        ].filter(Boolean)
      : [];


  return createResponseEnvelope({
    id:
      "response-social-goodbye",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "goodbye",

    messages: [
      {
        id:
          "msg-social-goodbye",

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .CLOSING,

        text:
          goodbyeText,

        variantId:
          goodbyeVariant.id,
      },
      ...(
        shouldOfferFeedback
          ? [{
              id:
                "msg-social-feedback-question",

              purpose:
                RESPONSE_MESSAGE_PURPOSE
                  .QUESTION,

              text:
                "Antes de irte, ¿te ha resultado útil esta conversación?",
            }]
          : []
      ),
    ],

    quickReplies,

    personalization: {
      namePolicy:
        normalized.visitorName
          ? RESPONSE_NAME_POLICY
              .USE_IF_KNOWN
          : RESPONSE_NAME_POLICY
              .NEVER,

      usedName,

      nameSource:
        usedName
          ? RESPONSE_NAME_SOURCE
              .SESSION
          : null,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.CLOSING,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,

      mustNotReopenFlow:
        true,

      mayOfferFeedback:
        shouldOfferFeedback,

      meaningfulConversation:
        normalized
          .meaningfulConversation,

      feedbackAlreadyOffered:
        normalized
          .feedbackAlreadyOffered,
    },

    stateEffects: {
      resetFallbacks:
        true,

      markFeedbackOffered:
        shouldOfferFeedback,
    },

    trace: {
      responseTemplateId:
        "social-goodbye",
    },
  });
}


/* ============================================================
 * ASSISTANT CHECK-IN
 * ============================================================
 */

export function composeAssistantCheckInResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const variant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .ASSISTANT_CHECK_IN,
      normalized,
    );

  return createResponseEnvelope({
    id:
      "response-social-check-in",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "social_check_in",

    messages: [
      textMessage(
        "msg-social-check-in",
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,
        variant,
      ),
    ],

    personalization: {
      namePolicy:
        RESPONSE_NAME_POLICY.NEVER,

      usedName:
        false,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-check-in",
    },
  });
}


function familyForConversationTone(
  tone,
) {
  switch (tone) {
    case CONVERSATION_TONE
      .POSITIVE:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_POSITIVE
      );

    case CONVERSATION_TONE
      .NEGATIVE:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_NEGATIVE
      );

    case CONVERSATION_TONE
      .FRUSTRATED:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_FRUSTRATED
      );

    case CONVERSATION_TONE
      .UNCERTAIN:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_UNCERTAIN
      );

    default:
      return (
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_NEUTRAL
      );
  }
}


export function composeUserStateResponse(
  {
    toneAnalysis = null,
    feedbackRating = null,
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const tone =
    toneAnalysis?.tone ??
    CONVERSATION_TONE
      .NEUTRAL;

  const variant =
    socialVariant(
      familyForConversationTone(
        tone,
      ),
      normalized,
    );

  return createResponseEnvelope({
    id:
      `response-social-user-state-${tone}`,

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "social_user_state",

    messages: [
      textMessage(
        `msg-social-user-state-${tone}`,
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,
        variant,
      ),
    ],

    personalization: {
      namePolicy:
        RESPONSE_NAME_POLICY.NEVER,

      usedName:
        false,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        `social-user-state-${tone}`,
    },
  });
}


/* ============================================================
 * ACKNOWLEDGEMENT
 * ============================================================
 */

export function composeAcknowledgementResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  const variant =
    socialVariant(
      SOCIAL_LANGUAGE_FAMILY
        .ACKNOWLEDGEMENT,
      normalized,
    );


  return createResponseEnvelope({
    id:
      "response-social-acknowledgement",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "unknown",

    messages: [
      textMessage(
        "msg-social-acknowledgement",
        RESPONSE_MESSAGE_PURPOSE
          .ACKNOWLEDGEMENT,
        variant,
      ),
    ],

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        RESPONSE_CONTINUITY
          .CONTINUING,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-acknowledgement",
    },
  });
}


/* ============================================================
 * CONTINUE / FEEDBACK
 * ============================================================
 */

export function composeContinueConversationResponse(
  {
    context = {},
  } = {},
) {
  const normalized =
    normalizeSocialResponseContext(
      context,
    );

  return createResponseEnvelope({
    id:
      "response-social-continue",

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "continue",

    messages: [{
      id:
        "msg-social-continue",

      purpose:
        RESPONSE_MESSAGE_PURPOSE
          .QUESTION,

      text:
        normalized.visitorName
          ? `Claro, ${normalized.visitorName}. ¿Qué quieres consultar ahora?`
          : "Claro. ¿Qué quieres consultar ahora?",
    }],

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,
      continuity:
        RESPONSE_CONTINUITY.CONTINUING,
      acknowledgeUser:
        true,
      suppressRepeatedCTA:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-continue",
    },
  });
}


export function composeFeedbackRatingResponse(
  {
    rating = null,
    context = {},
  } = {},
) {
  const positive =
    rating === "positive";

  const neutral =
    rating === "neutral";

  const negative =
    rating === "negative";

  const mayOfferSupport =
    (positive || neutral) &&
    context?.supportAlreadyOffered !== true;

  const thanksText =
    positive
      ? "Gracias por decírmelo 😊. Me alegra que te haya resultado útil."
      : negative
        ? "Gracias por decírmelo. Tu valoración me ayuda a detectar qué debe mejorar el asistente."
        : "Gracias por decírmelo. Me ayuda a saber qué conviene seguir mejorando.";

  const messages = [{
    id:
      "msg-social-feedback-thanks",

    purpose:
      RESPONSE_MESSAGE_PURPOSE
        .CLOSING,

    text:
      thanksText,
  }];

  if (mayOfferSupport) {
    messages.push({
      id:
        "msg-social-support-invitation",

      purpose:
        RESPONSE_MESSAGE_PURPOSE
          .ANSWER,

      text:
        "Si quieres contribuir a que este proyecto siga creciendo y mejorando, puedes apoyarlo de forma voluntaria.",
    });
  }

  const quickReplies =
    mayOfferSupport
      ? [
          createAnswerQuickReply({
            id:
              SUPPORT_QUICK_REPLY_ID.ACCEPT,
            label:
              "Apoyar el proyecto",
            answer:
              "Quiero apoyar el proyecto",
          }),
          createAnswerQuickReply({
            id:
              SUPPORT_QUICK_REPLY_ID.DECLINE,
            label:
              "Ahora no",
            answer:
              "Ahora no",
          }),
        ].filter(Boolean)
      : [];

  return createResponseEnvelope({
    id:
      `response-social-feedback-${rating ?? "neutral"}`,

    kind:
      RESPONSE_KIND.SOCIAL,

    outcome:
      RESPONSE_OUTCOME.SOCIAL,

    intent:
      "feedback_rating",

    messages,
    quickReplies,

    conversation: {
      stage:
        RESPONSE_STAGE.CLOSING,
      continuity:
        RESPONSE_CONTINUITY.CONTINUING,
      acknowledgeUser:
        true,
      suppressRepeatedCTA:
        true,
      mustNotReopenFlow:
        true,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      responseTemplateId:
        "social-feedback-rating",
    },
  });
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeSocialResponse(
  {
    intent,
    greetingType,
    name,
    toneAnalysis = null,
    feedbackRating = null,
    context = {},
  } = {},
) {
  switch (intent) {

    case SOCIAL_RESPONSE_INTENT
      .GREETING:
      return composeGreetingResponse({
        greetingType,
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .THANKS:
      return composeThanksResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .GOODBYE:
      return composeGoodbyeResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .NAME_PROVIDED:
      return composeNameProvidedResponse({
        name,
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .NAME_DECLINED:
      return composeNameDeclinedResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .ACKNOWLEDGEMENT:
      return composeAcknowledgementResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .CHECK_IN:
      return composeAssistantCheckInResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .USER_STATE:
      return composeUserStateResponse({
        toneAnalysis,
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .CONTINUE:
      return composeContinueConversationResponse({
        context,
      });


    case SOCIAL_RESPONSE_INTENT
      .FEEDBACK_RATING:
      return composeFeedbackRatingResponse({
        rating:
          feedbackRating,
        context,
      });


    default:
      return null;
  }
}