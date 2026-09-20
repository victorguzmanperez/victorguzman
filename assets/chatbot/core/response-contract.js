/* ============================================================
 * RESPONSE CONTRACT
 * 1.11.22.1
 *
 * Contrato entre:
 *
 * responses.js
 *     ↓
 * Dialogue Manager
 *     ↓
 * UI / Actions / State / Analytics
 *
 * Este módulo NO redacta respuestas.
 * Define qué forma debe tener una respuesta válida.
 * ============================================================
 */


/* ============================================================
 * SCHEMA
 * ============================================================
 */

export const RESPONSE_SCHEMA_VERSION =
  1;


/* ============================================================
 * RESPONSE KIND
 * ============================================================
 */

export const RESPONSE_KIND =
  Object.freeze({
    SOCIAL:
      "social",

    KNOWLEDGE:
      "knowledge",

    DISCOVERY:
      "discovery",

    COMMERCIAL_REDIRECT:
      "commercial_redirect",

    PRIVACY:
      "privacy",

    FALLBACK:
      "fallback",

    ACTION:
      "action",
  });


/* ============================================================
 * OUTCOME
 * ============================================================
 */

export const RESPONSE_OUTCOME =
  Object.freeze({
    ANSWERED:
      "answered",

    QUALIFIED:
      "qualified",

    NEEDS_CLARIFICATION:
      "needs_clarification",

    REDIRECTED:
      "redirected",

    SOCIAL:
      "social",

    FALLBACK:
      "fallback",
  });


/* ============================================================
 * MESSAGE PURPOSE
 * ============================================================
 */

export const RESPONSE_MESSAGE_PURPOSE =
  Object.freeze({
    ACKNOWLEDGEMENT:
      "acknowledgement",

    ANSWER:
      "answer",

    QUALIFICATION:
      "qualification",

    EXPLANATION:
      "explanation",

    CTA:
      "cta",

    CLOSING:
      "closing",
  });


/* ============================================================
 * CONVERSATION
 * ============================================================
 */

export const RESPONSE_STAGE =
  Object.freeze({
    OPENING:
      "opening",

    ACTIVE:
      "active",

    CLOSING:
      "closing",
  });


export const RESPONSE_CONTINUITY =
  Object.freeze({
    NEW:
      "new",

    CONTINUING:
      "continuing",

    REPAIR:
      "repair",
  });


export const RESPONSE_IDENTITY_DISCLOSURE =
  Object.freeze({
    REQUIRED:
      "required",

    WHEN_RELEVANT:
      "when_relevant",

    NOT_NEEDED:
      "not_needed",
  });


/* ============================================================
 * PRESENTATION
 * ============================================================
 */

export const RESPONSE_DEPTH =
  Object.freeze({
    MICRO:
      "micro",

    SHORT:
      "short",

    MEDIUM:
      "medium",

    DEEP:
      "deep",
  });


export const RESPONSE_TONE =
  Object.freeze({
    WARM_PROFESSIONAL:
      "warm_professional",

    CONCISE:
      "concise",

    REASSURING:
      "reassuring",
  });


export const RESPONSE_EMOJI_MODE =
  Object.freeze({
    NONE:
      "none",

    LIGHT:
      "light",
  });


/* ============================================================
 * NAME PERSONALIZATION
 * ============================================================
 */

export const RESPONSE_NAME_POLICY =
  Object.freeze({
    NEVER:
      "never",

    OPTIONAL:
      "optional",

    USE_IF_KNOWN:
      "use_if_known",
  });


export const RESPONSE_NAME_SOURCE =
  Object.freeze({
    CURRENT_MESSAGE:
      "current_message",

    SESSION:
      "session",
  });


/* ============================================================
 * EVIDENCE
 * ============================================================
 */

export const RESPONSE_EVIDENCE_MODE =
  Object.freeze({
    NONE:
      "none",

    WHEN_USEFUL:
      "when_useful",

    REQUIRED:
      "required",
  });


/* ============================================================
 * FOLLOW-UP
 * ============================================================
 */

export const RESPONSE_FOLLOW_UP_KIND =
  Object.freeze({
    QUESTION:
      "question",

    CLARIFICATION:
      "clarification",

    OPTIONAL_PERSONALIZATION:
      "optional_personalization",
  });


/* ============================================================
 * QUICK REPLIES
 * ============================================================
 */

export const RESPONSE_QUICK_REPLY_KIND =
  Object.freeze({
    INTENT:
      "intent",

    ACTION:
      "action",

    ANSWER:
      "answer",
  });


/* ============================================================
 * ACTIONS
 * ============================================================
 */

export const RESPONSE_ACTION_TYPE =
  Object.freeze({
    OPEN_CONTACT:
      "open-contact",

    START_DIAGNOSTIC:
      "start-diagnostic",

    OPEN_CALENDLY:
      "open-calendly",

    OFFER_FEEDBACK:
      "offer-feedback",

    NAVIGATE:
      "navigate",
  });


export const RESPONSE_ACTION_PRIORITY =
  Object.freeze({
    PRIMARY:
      "primary",

    SECONDARY:
      "secondary",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function isPlainObject(
  value,
) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new TypeError(
      `[Response Contract] ${message}`,
    );
  }
}


function assertExactKeys(
  value,
  allowedKeys,
  path,
) {
  assert(
    isPlainObject(value),
    `${path} must be a plain object`,
  );

  const allowed =
    new Set(allowedKeys);

  for (
    const key
    of Object.keys(value)
  ) {
    assert(
      allowed.has(key),
      `${path}.${key} is not allowed`,
    );
  }
}


function assertEnum(
  value,
  enumObject,
  path,
) {
  assert(
    Object.values(
      enumObject,
    ).includes(value),
    `${path} has invalid value "${value}"`,
  );
}


function assertString(
  value,
  path,
  {
    nullable = false,
    maxLength = 1000,
  } = {},
) {
  if (
    nullable &&
    value === null
  ) {
    return;
  }

  assert(
    typeof value === "string",
    `${path} must be a string`,
  );

  assert(
    value.trim().length > 0,
    `${path} cannot be empty`,
  );

  assert(
    value.length <= maxLength,
    `${path} exceeds ${maxLength} characters`,
  );
}


function assertBoolean(
  value,
  path,
) {
  assert(
    typeof value === "boolean",
    `${path} must be boolean`,
  );
}


function assertStringArray(
  value,
  path,
) {
  assert(
    Array.isArray(value),
    `${path} must be an array`,
  );

  for (
    const item
    of value
  ) {
    assertString(
      item,
      `${path}[]`,
      {
        maxLength: 200,
      },
    );
  }

  assert(
    new Set(value).size ===
      value.length,
    `${path} contains duplicates`,
  );
}


function containsHtml(
  text,
) {
  return (
    /<\/?[a-z][^>]*>/i
      .test(text)
  );
}


/* ============================================================
 * NORMALIZERS
 * ============================================================
 */

function normalizeMessage(
  message,
) {
  assertExactKeys(
    message,
    [
      "id",
      "type",
      "purpose",
      "text",
      "variantId",
    ],
    "messages[]",
  );

  return {
    id:
      message.id,

    type:
      message.type ??
      "text",

    purpose:
      message.purpose ??
      RESPONSE_MESSAGE_PURPOSE
        .ANSWER,

    text:
      message.text,

    variantId:
      message.variantId ??
      null,
  };
}


function normalizeFollowUp(
  followUp,
) {
  if (
    followUp === null ||
    followUp === undefined
  ) {
    return null;
  }

  assertExactKeys(
    followUp,
    [
      "kind",
      "text",
      "required",
      "key",
      "options",
    ],
    "followUp",
  );

  return {
    kind:
      followUp.kind,

    text:
      followUp.text,

    required:
      followUp.required ??
      false,

    key:
      followUp.key ??
      null,

    options:
      (
        followUp.options ??
        []
      ).map(
        (option) => {
          assertExactKeys(
            option,
            [
              "id",
              "label",
              "value",
            ],
            "followUp.options[]",
          );

          return {
            id:
              option.id,

            label:
              option.label,

            value:
              option.value,
          };
        },
      ),
  };
}


function normalizeQuickReply(
  quickReply,
) {
  assertExactKeys(
    quickReply,
    [
      "id",
      "label",
      "kind",
      "value",
    ],
    "quickReplies[]",
  );

  return {
    id:
      quickReply.id,

    label:
      quickReply.label,

    kind:
      quickReply.kind,

    value:
      quickReply.value,
  };
}


function normalizeAction(
  action,
) {
  assertExactKeys(
    action,
    [
      "id",
      "type",
      "label",
      "priority",
      "target",
      "requiresConfirmation",
    ],
    "actions[]",
  );

  return {
    id:
      action.id,

    type:
      action.type,

    label:
      action.label,

    priority:
      action.priority ??
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,

    target:
      action.target ??
      null,

    requiresConfirmation:
      action.requiresConfirmation ??
      false,
  };
}


/* ============================================================
 * CONTRACT FACTORY
 * ============================================================
 */

export function createResponseEnvelope(
  input,
) {
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "id",
      "locale",
      "kind",
      "outcome",
      "intent",
      "messages",
      "followUp",
      "quickReplies",
      "actions",
      "presentation",
      "personalization",
      "evidence",
      "safety",
      "conversation",
      "stateEffects",
      "analytics",
      "trace",
    ],
    "response",
  );


  const presentationInput =
    input.presentation ??
    {};

  assertExactKeys(
    presentationInput,
    [
      "depth",
      "tone",
      "emoji",
      "splitBubbles",
      "variationFamily",
      "avoidRecentVariants",
    ],
    "presentation",
  );


  const personalizationInput =
    input.personalization ??
    {};

  assertExactKeys(
    personalizationInput,
    [
      "namePolicy",
      "usedName",
      "nameSource",
      "mayAskName",
      "nameRequired",
      "nameCooldownTurns",
    ],
    "personalization",
  );


  const evidenceInput =
    input.evidence ??
    {};

  assertExactKeys(
    evidenceInput,
    [
      "mode",
      "knowledgeIds",
      "factIds",
      "qualificationReasons",
    ],
    "evidence",
  );


  const safetyInput =
    input.safety ??
    {};

  assertExactKeys(
    safetyInput,
    [
      "mustQualify",
      "commercialRedirect",
      "allowInference",
      "mustNotClaimHuman",
      "forbiddenClaims",
    ],
    "safety",
  );


  const conversationInput =
    input.conversation ??
    {};

  assertExactKeys(
    conversationInput,
    [
      "stage",
      "continuity",
      "identityDisclosure",
      "mirrorUserGreeting",
      "acknowledgeUser",
      "suppressRepeatedCTA",
      "mustNotReopenFlow",
      "mayOfferFeedback",
      "meaningfulConversation",
      "feedbackAlreadyOffered",
    ],
    "conversation",
  );


  const stateEffectsInput =
    input.stateEffects ??
    {};

  assertExactKeys(
    stateEffectsInput,
    [
      "resetFallbacks",
      "incrementFallbacks",
      "markQuestionAsked",
      "setLastAction",
      "markFeedbackOffered",
      "markNameAsked",
    ],
    "stateEffects",
  );


  const analyticsInput =
    input.analytics ??
    {};

  assertExactKeys(
    analyticsInput,
    [
      "eventName",
      "intent",
      "outcome",
      "responseKind",
      "confidenceBucket",
      "fallbackLevel",
    ],
    "analytics",
  );


  const traceInput =
    input.trace ??
    {};

  assertExactKeys(
    traceInput,
    [
      "faqId",
      "answerQaId",
      "problemId",
      "solutionIds",
      "serviceIds",
      "responseTemplateId",
    ],
    "trace",
  );


  const response = {
    schemaVersion:
      input.schemaVersion ??
      RESPONSE_SCHEMA_VERSION,

    id:
      input.id,

    locale:
      input.locale ??
      "es-ES",

    kind:
      input.kind,

    outcome:
      input.outcome,

    intent:
      input.intent ??
      null,

    messages:
      (
        input.messages ??
        []
      ).map(
        normalizeMessage,
      ),

    followUp:
      normalizeFollowUp(
        input.followUp,
      ),

    quickReplies:
      (
        input.quickReplies ??
        []
      ).map(
        normalizeQuickReply,
      ),

    actions:
      (
        input.actions ??
        []
      ).map(
        normalizeAction,
      ),

    presentation: {
      depth:
        presentationInput
          .depth ??
        RESPONSE_DEPTH.SHORT,

      tone:
        presentationInput
          .tone ??
        RESPONSE_TONE
          .WARM_PROFESSIONAL,

      emoji:
        presentationInput
          .emoji ??
        RESPONSE_EMOJI_MODE.LIGHT,

      splitBubbles:
        presentationInput
          .splitBubbles ??
        false,

      variationFamily:
        presentationInput
          .variationFamily ??
        null,

      avoidRecentVariants:
        presentationInput
          .avoidRecentVariants ??
        2,
    },

    personalization: {
      namePolicy:
        personalizationInput
          .namePolicy ??
        RESPONSE_NAME_POLICY.NEVER,

      usedName:
        personalizationInput
          .usedName ??
        false,

      nameSource:
        personalizationInput
          .nameSource ??
        null,

      mayAskName:
        personalizationInput
          .mayAskName ??
        false,

      nameRequired:
        personalizationInput
          .nameRequired ??
        false,

      nameCooldownTurns:
        personalizationInput
          .nameCooldownTurns ??
        4,
    },

    evidence: {
      mode:
        evidenceInput.mode ??
        RESPONSE_EVIDENCE_MODE.NONE,

      knowledgeIds:
        [
          ...(
            evidenceInput
              .knowledgeIds ??
            []
          ),
        ],

      factIds:
        [
          ...(
            evidenceInput
              .factIds ??
            []
          ),
        ],

      qualificationReasons:
        [
          ...(
            evidenceInput
              .qualificationReasons ??
            []
          ),
        ],
    },

    safety: {
      mustQualify:
        safetyInput
          .mustQualify ??
        false,

      commercialRedirect:
        safetyInput
          .commercialRedirect ??
        false,

      allowInference:
        safetyInput
          .allowInference ??
        false,

      /*
       * Invariante:
       * el chatbot puede sonar natural,
       * pero nunca afirmar que es humano.
       */
      mustNotClaimHuman:
        safetyInput
          .mustNotClaimHuman ??
        true,

      forbiddenClaims:
        [
          ...(
            safetyInput
              .forbiddenClaims ??
            []
          ),
        ],
    },

    conversation: {
      stage:
        conversationInput
          .stage ??
        RESPONSE_STAGE.ACTIVE,

      continuity:
        conversationInput
          .continuity ??
        RESPONSE_CONTINUITY.NEW,

      identityDisclosure:
        conversationInput
          .identityDisclosure ??
        RESPONSE_IDENTITY_DISCLOSURE
          .NOT_NEEDED,

      mirrorUserGreeting:
        conversationInput
          .mirrorUserGreeting ??
        false,

      acknowledgeUser:
        conversationInput
          .acknowledgeUser ??
        true,

      suppressRepeatedCTA:
        conversationInput
          .suppressRepeatedCTA ??
        true,

      mustNotReopenFlow:
        conversationInput
          .mustNotReopenFlow ??
        false,

      mayOfferFeedback:
        conversationInput
          .mayOfferFeedback ??
        false,

      meaningfulConversation:
        conversationInput
          .meaningfulConversation ??
        false,

      feedbackAlreadyOffered:
        conversationInput
          .feedbackAlreadyOffered ??
        false,
    },

    stateEffects: {
      resetFallbacks:
        stateEffectsInput
          .resetFallbacks ??
        false,

      incrementFallbacks:
        stateEffectsInput
          .incrementFallbacks ??
        false,

      markQuestionAsked:
        stateEffectsInput
          .markQuestionAsked ??
        null,

      setLastAction:
        stateEffectsInput
          .setLastAction ??
        null,

      markFeedbackOffered:
        stateEffectsInput
          .markFeedbackOffered ??
        false,

      markNameAsked:
        stateEffectsInput
          .markNameAsked ??
        false,
    },

    /*
     * Solo datos estructurados.
     *
     * No existe ningún campo para:
     * raw message
     * conversation text
     * name
     * email
     * phone
     */
    analytics: {
      eventName:
        analyticsInput
          .eventName ??
        "chat_response",

      intent:
        analyticsInput
          .intent ??
        input.intent ??
        null,

      outcome:
        analyticsInput
          .outcome ??
        input.outcome,

      responseKind:
        analyticsInput
          .responseKind ??
        input.kind,

      confidenceBucket:
        analyticsInput
          .confidenceBucket ??
        null,

      fallbackLevel:
        analyticsInput
          .fallbackLevel ??
        null,
    },

    /*
     * Trazabilidad técnica.
     * No se muestra al visitante.
     */
    trace: {
      faqId:
        traceInput.faqId ??
        null,

      answerQaId:
        traceInput.answerQaId ??
        null,

      problemId:
        traceInput.problemId ??
        null,

      solutionIds:
        [
          ...(
            traceInput
              .solutionIds ??
            []
          ),
        ],

      serviceIds:
        [
          ...(
            traceInput
              .serviceIds ??
            []
          ),
        ],

      responseTemplateId:
        traceInput
          .responseTemplateId ??
        null,
    },
  };


  assertValidResponseEnvelope(
    response,
  );

  return freezeResponseEnvelope(
    response,
  );
}


/* ============================================================
 * VALIDATION
 * ============================================================
 */

export function assertValidResponseEnvelope(
  response,
) {
  assertExactKeys(
    response,
    [
      "schemaVersion",
      "id",
      "locale",
      "kind",
      "outcome",
      "intent",
      "messages",
      "followUp",
      "quickReplies",
      "actions",
      "presentation",
      "personalization",
      "evidence",
      "safety",
      "conversation",
      "stateEffects",
      "analytics",
      "trace",
    ],
    "response",
  );


  assert(
    response.schemaVersion ===
      RESPONSE_SCHEMA_VERSION,
    "unsupported schema version",
  );


  assertString(
    response.id,
    "response.id",
    {
      maxLength: 100,
    },
  );

  assert(
    /^response-[a-z0-9][a-z0-9-_]*$/
      .test(
        response.id,
      ),
    "response.id must use canonical response-* format",
  );


  assertString(
    response.locale,
    "response.locale",
    {
      maxLength: 20,
    },
  );


  assertEnum(
    response.kind,
    RESPONSE_KIND,
    "response.kind",
  );


  assertEnum(
    response.outcome,
    RESPONSE_OUTCOME,
    "response.outcome",
  );


  assertString(
    response.intent,
    "response.intent",
    {
      nullable: true,
      maxLength: 100,
    },
  );


  /* --------------------------------------------------------
   * MESSAGES
   * --------------------------------------------------------
   */

  assert(
    Array.isArray(
      response.messages,
    ),
    "messages must be an array",
  );

  assert(
    response.messages.length >=
      1,
    "response must contain at least one message",
  );

  assert(
    response.messages.length <=
      4,
    "response cannot contain more than four message bubbles",
  );


  let totalCharacters =
    0;

  const messageTexts =
    [];


  for (
    const message
    of response.messages
  ) {
    assertExactKeys(
      message,
      [
        "id",
        "type",
        "purpose",
        "text",
        "variantId",
      ],
      "messages[]",
    );

    assertString(
      message.id,
      "messages[].id",
      {
        maxLength: 80,
      },
    );

    assert(
      message.type ===
        "text",
      "only plain text messages are supported",
    );

    assertEnum(
      message.purpose,
      RESPONSE_MESSAGE_PURPOSE,
      "messages[].purpose",
    );

    assertString(
      message.text,
      "messages[].text",
      {
        maxLength: 700,
      },
    );

    assert(
      !containsHtml(
        message.text,
      ),
      "message text cannot contain HTML",
    );

    assertString(
      message.variantId,
      "messages[].variantId",
      {
        nullable: true,
        maxLength: 100,
      },
    );

    totalCharacters +=
      message.text.length;

    messageTexts.push(
      message.text.trim(),
    );
  }


  assert(
    totalCharacters <=
      1800,
    "response text is too long",
  );


  assert(
    new Set(
      messageTexts,
    ).size ===
      messageTexts.length,
    "response cannot repeat identical message bubbles",
  );


  /* --------------------------------------------------------
   * FOLLOW-UP
   * --------------------------------------------------------
   */

  if (
    response.followUp !==
      null
  ) {
    const followUp =
      response.followUp;

    assertExactKeys(
      followUp,
      [
        "kind",
        "text",
        "required",
        "key",
        "options",
      ],
      "followUp",
    );

    assertEnum(
      followUp.kind,
      RESPONSE_FOLLOW_UP_KIND,
      "followUp.kind",
    );

    assertString(
      followUp.text,
      "followUp.text",
      {
        maxLength: 300,
      },
    );

    assertBoolean(
      followUp.required,
      "followUp.required",
    );

    assertString(
      followUp.key,
      "followUp.key",
      {
        nullable: true,
        maxLength: 100,
      },
    );

    assert(
      Array.isArray(
        followUp.options,
      ),
      "followUp.options must be an array",
    );

    assert(
      followUp.options.length <=
        4,
      "followUp supports at most four options",
    );

    for (
      const option
      of followUp.options
    ) {
      assertString(
        option.id,
        "followUp.options[].id",
        {
          maxLength: 80,
        },
      );

      assertString(
        option.label,
        "followUp.options[].label",
        {
          maxLength: 80,
        },
      );

      assertString(
        option.value,
        "followUp.options[].value",
        {
          maxLength: 150,
        },
      );
    }


    if (
      followUp.kind ===
        RESPONSE_FOLLOW_UP_KIND
          .OPTIONAL_PERSONALIZATION
    ) {
      assert(
        followUp.required ===
          false,
        "name personalization can never be required",
      );
    }
  }


  /* --------------------------------------------------------
   * QUICK REPLIES
   * --------------------------------------------------------
   */

  assert(
    Array.isArray(
      response.quickReplies,
    ),
    "quickReplies must be an array",
  );

  assert(
    response.quickReplies.length <=
      4,
    "at most four quick replies are allowed",
  );


  for (
    const reply
    of response.quickReplies
  ) {
    assertString(
      reply.id,
      "quickReplies[].id",
      {
        maxLength: 80,
      },
    );

    assertString(
      reply.label,
      "quickReplies[].label",
      {
        maxLength: 60,
      },
    );

    assertEnum(
      reply.kind,
      RESPONSE_QUICK_REPLY_KIND,
      "quickReplies[].kind",
    );

    assertString(
      reply.value,
      "quickReplies[].value",
      {
        maxLength: 150,
      },
    );
  }


  /* --------------------------------------------------------
   * ACTIONS
   * --------------------------------------------------------
   */

  assert(
    Array.isArray(
      response.actions,
    ),
    "actions must be an array",
  );

  assert(
    response.actions.length <=
      3,
    "a response cannot expose more than three actions",
  );


  let primaryActions =
    0;


  for (
    const action
    of response.actions
  ) {
    assertString(
      action.id,
      "actions[].id",
      {
        maxLength: 80,
      },
    );

    assertEnum(
      action.type,
      RESPONSE_ACTION_TYPE,
      "actions[].type",
    );

    assertString(
      action.label,
      "actions[].label",
      {
        maxLength: 80,
      },
    );

    assertEnum(
      action.priority,
      RESPONSE_ACTION_PRIORITY,
      "actions[].priority",
    );

    assertString(
      action.target,
      "actions[].target",
      {
        nullable: true,
        maxLength: 150,
      },
    );

    assertBoolean(
      action.requiresConfirmation,
      "actions[].requiresConfirmation",
    );


    if (
      action.priority ===
        RESPONSE_ACTION_PRIORITY
          .PRIMARY
    ) {
      primaryActions +=
        1;
    }
  }


  assert(
    primaryActions <= 1,
    "only one primary action is allowed",
  );


  /* --------------------------------------------------------
   * PRESENTATION
   * --------------------------------------------------------
   */

  assertEnum(
    response.presentation
      .depth,
    RESPONSE_DEPTH,
    "presentation.depth",
  );

  assertEnum(
    response.presentation
      .tone,
    RESPONSE_TONE,
    "presentation.tone",
  );

  assertEnum(
    response.presentation
      .emoji,
    RESPONSE_EMOJI_MODE,
    "presentation.emoji",
  );

  assertBoolean(
    response.presentation
      .splitBubbles,
    "presentation.splitBubbles",
  );

  assertString(
    response.presentation
      .variationFamily,
    "presentation.variationFamily",
    {
      nullable: true,
      maxLength: 100,
    },
  );

  assert(
    Number.isInteger(
      response.presentation
        .avoidRecentVariants,
    ),
    "avoidRecentVariants must be integer",
  );

  assert(
    response.presentation
      .avoidRecentVariants >=
        0 &&
    response.presentation
      .avoidRecentVariants <=
        5,
    "avoidRecentVariants must be between 0 and 5",
  );


  /* --------------------------------------------------------
   * NAME PERSONALIZATION
   * --------------------------------------------------------
   */

  assertEnum(
    response.personalization
      .namePolicy,
    RESPONSE_NAME_POLICY,
    "personalization.namePolicy",
  );

  assertBoolean(
    response.personalization
      .usedName,
    "personalization.usedName",
  );

  if (
    response.personalization
      .nameSource !==
      null
  ) {
    assertEnum(
      response.personalization
        .nameSource,
      RESPONSE_NAME_SOURCE,
      "personalization.nameSource",
    );
  }

  assertBoolean(
    response.personalization
      .mayAskName,
    "personalization.mayAskName",
  );

  assertBoolean(
    response.personalization
      .nameRequired,
    "personalization.nameRequired",
  );


  /*
   * Regla de producto:
   * dar el nombre nunca será obligatorio.
   */
  assert(
    response.personalization
      .nameRequired ===
      false,
    "visitor name can never be required",
  );


  assert(
    Number.isInteger(
      response.personalization
        .nameCooldownTurns,
    ),
    "nameCooldownTurns must be integer",
  );

  assert(
    response.personalization
      .nameCooldownTurns >=
        0 &&
    response.personalization
      .nameCooldownTurns <=
        20,
    "invalid name cooldown",
  );


  if (
    response.personalization
      .usedName
  ) {
    assert(
      response.personalization
        .namePolicy ===
        RESPONSE_NAME_POLICY
          .USE_IF_KNOWN,
      "usedName requires USE_IF_KNOWN policy",
    );

    assert(
      response.personalization
        .nameSource !== null,
      "usedName requires a known name source",
    );

    assert(
      response.personalization
        .mayAskName === false,
      "do not ask for name when it is already known",
    );
  }


  if (
    response.personalization
      .mayAskName
  ) {
    assert(
      response.personalization
        .namePolicy ===
        RESPONSE_NAME_POLICY
          .OPTIONAL,
      "asking for a name requires OPTIONAL policy",
    );

    assert(
      response.personalization
        .usedName === false,
      "cannot ask for name after already using one",
    );
  }


  /* --------------------------------------------------------
   * EVIDENCE
   * --------------------------------------------------------
   */

  assertEnum(
    response.evidence.mode,
    RESPONSE_EVIDENCE_MODE,
    "evidence.mode",
  );

  assertStringArray(
    response.evidence
      .knowledgeIds,
    "evidence.knowledgeIds",
  );

  assertStringArray(
    response.evidence
      .factIds,
    "evidence.factIds",
  );

  assertStringArray(
    response.evidence
      .qualificationReasons,
    "evidence.qualificationReasons",
  );


  if (
    response.evidence.mode ===
      RESPONSE_EVIDENCE_MODE
        .REQUIRED
  ) {
    assert(
      response.evidence
        .knowledgeIds.length >
        0,
      "required evidence needs Knowledge references",
    );
  }


  /* --------------------------------------------------------
   * SAFETY
   * --------------------------------------------------------
   */

  assertBoolean(
    response.safety
      .mustQualify,
    "safety.mustQualify",
  );

  assertBoolean(
    response.safety
      .commercialRedirect,
    "safety.commercialRedirect",
  );

  assertBoolean(
    response.safety
      .allowInference,
    "safety.allowInference",
  );

  assertBoolean(
    response.safety
      .mustNotClaimHuman,
    "safety.mustNotClaimHuman",
  );


  /*
   * Invariante absoluto.
   */
  assert(
    response.safety
      .mustNotClaimHuman ===
      true,
    "assistant must never claim to be human",
  );


  assertStringArray(
    response.safety
      .forbiddenClaims,
    "safety.forbiddenClaims",
  );


  if (
    response.safety
      .commercialRedirect
  ) {
    assert(
      response.actions.some(
        (action) =>
          action.type ===
          RESPONSE_ACTION_TYPE
            .OPEN_CONTACT,
      ),
      "commercial redirect requires open-contact action",
    );
  }


  /* --------------------------------------------------------
   * CONVERSATION
   * --------------------------------------------------------
   */

  assertEnum(
    response.conversation
      .stage,
    RESPONSE_STAGE,
    "conversation.stage",
  );

  assertEnum(
    response.conversation
      .continuity,
    RESPONSE_CONTINUITY,
    "conversation.continuity",
  );

  assertEnum(
    response.conversation
      .identityDisclosure,
    RESPONSE_IDENTITY_DISCLOSURE,
    "conversation.identityDisclosure",
  );

  assertBoolean(
    response.conversation
      .mirrorUserGreeting,
    "conversation.mirrorUserGreeting",
  );

  assertBoolean(
    response.conversation
      .acknowledgeUser,
    "conversation.acknowledgeUser",
  );

  assertBoolean(
    response.conversation
      .suppressRepeatedCTA,
    "conversation.suppressRepeatedCTA",
  );

  assertBoolean(
    response.conversation
      .mustNotReopenFlow,
    "conversation.mustNotReopenFlow",
  );

  assertBoolean(
    response.conversation
      .mayOfferFeedback,
    "conversation.mayOfferFeedback",
  );

  assertBoolean(
    response.conversation
      .meaningfulConversation,
    "conversation.meaningfulConversation",
  );

  assertBoolean(
    response.conversation
      .feedbackAlreadyOffered,
    "conversation.feedbackAlreadyOffered",
  );


  const feedbackAction =
    response.actions.find(
      (action) =>
        action.type ===
        RESPONSE_ACTION_TYPE
          .OFFER_FEEDBACK,
    );


  if (feedbackAction) {
    assert(
      response.conversation
        .stage ===
        RESPONSE_STAGE.CLOSING,
      "feedback can only be offered during closing",
    );

    assert(
      response.conversation
        .meaningfulConversation ===
        true,
      "feedback requires a meaningful conversation",
    );

    assert(
      response.conversation
        .mayOfferFeedback ===
        true,
      "feedback must be explicitly allowed",
    );

    assert(
      response.conversation
        .feedbackAlreadyOffered ===
        false,
      "feedback cannot be offered twice",
    );
  }


  /* --------------------------------------------------------
   * FALLBACK
   * --------------------------------------------------------
   */

  if (
    response.kind ===
      RESPONSE_KIND.FALLBACK
  ) {
    assert(
      response.outcome ===
        RESPONSE_OUTCOME
          .FALLBACK,
      "fallback kind requires fallback outcome",
    );

    assert(
      response.evidence.mode ===
        RESPONSE_EVIDENCE_MODE
          .NONE,
      "fallback cannot pretend to have evidence",
    );
  }


  /* --------------------------------------------------------
   * STATE EFFECTS
   * --------------------------------------------------------
   */

  assertBoolean(
    response.stateEffects
      .resetFallbacks,
    "stateEffects.resetFallbacks",
  );

  assertBoolean(
    response.stateEffects
      .incrementFallbacks,
    "stateEffects.incrementFallbacks",
  );

  assertString(
    response.stateEffects
      .markQuestionAsked,
    "stateEffects.markQuestionAsked",
    {
      nullable: true,
      maxLength: 100,
    },
  );

  assertString(
    response.stateEffects
      .setLastAction,
    "stateEffects.setLastAction",
    {
      nullable: true,
      maxLength: 100,
    },
  );

  assertBoolean(
    response.stateEffects
      .markFeedbackOffered,
    "stateEffects.markFeedbackOffered",
  );

  assertBoolean(
    response.stateEffects
      .markNameAsked,
    "stateEffects.markNameAsked",
  );


  assert(
    !(
      response.stateEffects
        .resetFallbacks &&
      response.stateEffects
        .incrementFallbacks
    ),
    "cannot reset and increment fallback counter simultaneously",
  );


  /* --------------------------------------------------------
   * ANALYTICS
   * --------------------------------------------------------
   */

  assertString(
    response.analytics
      .eventName,
    "analytics.eventName",
    {
      maxLength: 100,
    },
  );

  assertString(
    response.analytics
      .intent,
    "analytics.intent",
    {
      nullable: true,
      maxLength: 100,
    },
  );

  assertString(
    response.analytics
      .outcome,
    "analytics.outcome",
    {
      maxLength: 100,
    },
  );

  assertString(
    response.analytics
      .responseKind,
    "analytics.responseKind",
    {
      maxLength: 100,
    },
  );

  assertString(
    response.analytics
      .confidenceBucket,
    "analytics.confidenceBucket",
    {
      nullable: true,
      maxLength: 30,
    },
  );


  if (
    response.analytics
      .fallbackLevel !==
      null
  ) {
    assert(
      Number.isInteger(
        response.analytics
          .fallbackLevel,
      ),
      "analytics.fallbackLevel must be integer",
    );

    assert(
      response.analytics
        .fallbackLevel >=
          1 &&
      response.analytics
        .fallbackLevel <=
          3,
      "fallbackLevel must be 1-3",
    );
  }


  /* --------------------------------------------------------
   * TRACE
   * --------------------------------------------------------
   */

  for (
    const key
    of [
      "faqId",
      "answerQaId",
      "problemId",
      "responseTemplateId",
    ]
  ) {
    assertString(
      response.trace[key],
      `trace.${key}`,
      {
        nullable: true,
        maxLength: 120,
      },
    );
  }

  assertStringArray(
    response.trace
      .solutionIds,
    "trace.solutionIds",
  );

  assertStringArray(
    response.trace
      .serviceIds,
    "trace.serviceIds",
  );


  return true;
}


/* ============================================================
 * BOOLEAN VALIDATOR
 * ============================================================
 */

export function isValidResponseEnvelope(
  value,
) {
  try {
    assertValidResponseEnvelope(
      value,
    );

    return true;
  } catch {
    return false;
  }
}


/* ============================================================
 * DEEP FREEZE
 * ============================================================
 */

function freezeResponseEnvelope(
  response,
) {
  for (
    const message
    of response.messages
  ) {
    Object.freeze(message);
  }

  for (
    const quickReply
    of response.quickReplies
  ) {
    Object.freeze(
      quickReply,
    );
  }

  for (
    const action
    of response.actions
  ) {
    Object.freeze(action);
  }

  if (
    response.followUp
  ) {
    for (
      const option
      of response.followUp
        .options
    ) {
      Object.freeze(option);
    }

    Object.freeze(
      response.followUp
        .options,
    );

    Object.freeze(
      response.followUp,
    );
  }


  Object.freeze(
    response.messages,
  );

  Object.freeze(
    response.quickReplies,
  );

  Object.freeze(
    response.actions,
  );

  Object.freeze(
    response.evidence
      .knowledgeIds,
  );

  Object.freeze(
    response.evidence
      .factIds,
  );

  Object.freeze(
    response.evidence
      .qualificationReasons,
  );

  Object.freeze(
    response.safety
      .forbiddenClaims,
  );

  Object.freeze(
    response.trace
      .solutionIds,
  );

  Object.freeze(
    response.trace
      .serviceIds,
  );


  Object.freeze(
    response.presentation,
  );

  Object.freeze(
    response.personalization,
  );

  Object.freeze(
    response.evidence,
  );

  Object.freeze(
    response.safety,
  );

  Object.freeze(
    response.conversation,
  );

  Object.freeze(
    response.stateEffects,
  );

  Object.freeze(
    response.analytics,
  );

  Object.freeze(
    response.trace,
  );


  return Object.freeze(
    response,
  );
}