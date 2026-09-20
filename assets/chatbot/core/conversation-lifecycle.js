import {
  RESPONSE_FOLLOW_UP_KIND,
  createResponseEnvelope,
} from "./response-contract.js";

/* ============================================================
 * CONV-H1 — CONVERSATION LIFECYCLE
 *
 * Conversational polish shared by the Dialogue Manager:
 * - acknowledge a greeting that accompanies a substantive need;
 * - offer the visitor's name once, only when it does not interrupt;
 * - detect explicit continuation / closing / feedback controls.
 * ============================================================
 */

export const SUPPORT_OFFER_MARKER =
  "social-support-offered";

export const SUPPORT_QUICK_REPLY_ID =
  Object.freeze({
    ACCEPT:
      "qr-support-project",
    DECLINE:
      "qr-support-later",
  });

export const SUPPORT_CHOICE =
  Object.freeze({
    ACCEPT:
      "accept",
    DECLINE:
      "decline",
  });

export const CONVERSATION_CONTROL = Object.freeze({
  CONTINUE: "continue",
  CLOSE: "close",
  FEEDBACK_POSITIVE: "feedback_positive",
  FEEDBACK_NEUTRAL: "feedback_neutral",
  FEEDBACK_NEGATIVE: "feedback_negative",
});

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¡!¿?.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


export function supportChoiceFromQuickReply(
  quickReply,
) {
  const id =
    safeString(quickReply?.id);

  if (id === SUPPORT_QUICK_REPLY_ID.ACCEPT) {
    return SUPPORT_CHOICE.ACCEPT;
  }

  if (id === SUPPORT_QUICK_REPLY_ID.DECLINE) {
    return SUPPORT_CHOICE.DECLINE;
  }

  return null;
}

export function shouldFinalizeFeedbackConversation(
  result,
) {
  const rating =
    result?.decision
      ?.metadata
      ?.feedbackRating ??
    null;

  if (
    rating !== "positive" &&
    rating !== "neutral" &&
    rating !== "negative"
  ) {
    return false;
  }

  /*
   * CONV-H3.24: positive/neutral feedback pauses the automatic
   * close while the optional support choice is visible. Negative
   * feedback never receives a financial-support prompt and may
   * finish normally after the thank-you message.
   */
  const hasSupportChoice =
    Array.isArray(result?.response?.quickReplies) &&
    result.response.quickReplies.some(
      (quickReply) =>
        supportChoiceFromQuickReply(quickReply) !== null,
    );

  return !hasSupportChoice;
}

export function hasOpeningGreeting(value) {
  const text = normalizeText(value);

  return /^(?:hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(text);
}

export function detectConversationControl(value) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  if (
    /^(?:si me ha resultado util|si me resulto util|me ha resultado util|me resulto util)$/.test(text)
  ) {
    return CONVERSATION_CONTROL.FEEDBACK_POSITIVE;
  }

  if (/^(?:mas o menos|regular)$/.test(text)) {
    return CONVERSATION_CONTROL.FEEDBACK_NEUTRAL;
  }

  if (
    /^(?:no me ha resultado util|no me resulto util|no me ha servido|no me sirvio)$/.test(text)
  ) {
    return CONVERSATION_CONTROL.FEEDBACK_NEGATIVE;
  }

  if (
    /^(?:otra consulta|quiero hacer otra consulta|tengo otra pregunta|quiero preguntar otra cosa|necesito otra cosa)$/.test(text)
  ) {
    return CONVERSATION_CONTROL.CONTINUE;
  }

  if (
    /^(?:no gracias|(?:ok|vale|bien|perfecto|de acuerdo)(?: muchas)? gracias|gracias ya esta|gracias eso es todo|gracias con eso es suficiente|gracias ya no necesito nada(?: mas)?|eso es todo(?: gracias)?|nada mas(?: gracias)?|no necesito nada(?: mas)?|ya no necesito nada(?: mas)?|ya esta(?: gracias)?|con eso es suficiente|he terminado(?: gracias)?)$/.test(text)
  ) {
    return CONVERSATION_CONTROL.CLOSE;
  }

  return null;
}

function prefixMixedGreeting(response) {
  const messages = Array.isArray(response?.messages)
    ? response.messages.map((message) => ({ ...message }))
    : [];

  if (messages.length === 0) {
    return response;
  }

  const firstText = safeString(messages[0]?.text);

  if (!firstText || /^hola\b/i.test(firstText)) {
    return response;
  }

  messages[0] = {
    ...messages[0],
    text: `Hola 🙂. ${firstText}`,
  };

  return createResponseEnvelope({
    ...response,
    messages,
  });
}

function mayOfferOptionalName({ response, context, decision }) {
  if (!response || !context || !decision) {
    return false;
  }

  if (context.visitorName || context.nameAlreadyAsked) {
    return false;
  }

  if (Number(context.turnIndex) !== 0) {
    return false;
  }

  if (response.followUp) {
    return false;
  }

  if (
    (Array.isArray(response.quickReplies) && response.quickReplies.length > 0) ||
    (Array.isArray(response.actions) && response.actions.length > 0)
  ) {
    return false;
  }

  if (
    ["social", "fallback", "confirmation", "operational"].includes(
      decision.route,
    )
  ) {
    return false;
  }

  return true;
}

function addOptionalName(response) {
  return createResponseEnvelope({
    ...response,
    followUp: {
      kind: RESPONSE_FOLLOW_UP_KIND.OPTIONAL_PERSONALIZATION,
      text: "Por cierto, si quieres, dime cómo te llamas y puedo dirigirme a ti por tu nombre.",
      required: false,
      key: "name",
    },
    stateEffects: {
      ...(response.stateEffects ?? {}),
      markNameAsked: true,
    },
  });
}

export function enhanceConversationalResponse({
  response,
  userText,
  context = {},
  decision = null,
} = {}) {
  if (!response) {
    return response;
  }

  let enhanced = response;

  const mixedGreeting =
    hasOpeningGreeting(userText) &&
    decision?.route !== "social" &&
    context.assistantIntroduced !== true;

  if (mixedGreeting) {
    enhanced = prefixMixedGreeting(enhanced);
  }

  if (
    mayOfferOptionalName({
      response: enhanced,
      context,
      decision,
    })
  ) {
    enhanced = addOptionalName(enhanced);
  }

  return enhanced;
}
