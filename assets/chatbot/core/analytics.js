/**
 * ============================================================
 * CHATBOT ANALYTICS
 * OBS-H1 / 1.11.58–1.11.61
 * ============================================================
 *
 * Objetivos:
 * - instrumentar uso y funnel del asistente;
 * - respetar consentimiento de Analytics;
 * - enviar únicamente señales estructuradas no PII;
 * - no enviar texto libre, nombres, email, teléfono ni transcript;
 * - funcionar de forma fail-soft si GA4 no está disponible.
 */

import { analyticsValues } from './analytics-values.js';

export const CHATBOT_ANALYTICS_EVENT =
  Object.freeze({
    OPEN:
      "chat_open",

    CLOSE:
      "chat_close",

    FIRST_MESSAGE:
      "chat_first_message",

    TURN_PROCESSED:
      "chat_turn_processed",

    FALLBACK:
      "chat_fallback",

    UNANSWERED:
      "chat_unanswered",

    QUICK_REPLY_CLICK:
      "chat_quick_reply_click",

    ACTION_CLICK:
      "chat_action_click",

    DIAGNOSTIC_OPEN:
      "chat_diagnostic_open",

    CONTACT_CLICK:
      "chat_contact_click",

    CALENDLY_OPEN:
      "chat_calendly_open",

    FEEDBACK_SUBMITTED:
      "chat_feedback_submitted",

    RESET:
      "chat_reset",
  });


export const ANALYTICS_CONSENT_STORAGE_KEY =
  "vg_cookie_consent";


const ANALYTICS_CONSENT_ACCEPTED =
  "accepted";


const ACTION_TARGET_BY_TYPE =
  Object.freeze({
    "open-contact":
      "contact",

    "start-diagnostic":
      "diagnostic",

    "open-calendly":
      "booking",

    "offer-feedback":
      "feedback",

    navigate:
      "navigation",
  });


const QUICK_REPLY_TYPES =
  new Set([
    "intent",
    "answer",
  ]);


const EXECUTED_INTERACTION_STATUS =
  new Set([
    "executed",
    "submitted",
  ]);


const FEEDBACK_RATINGS =
  new Set([
    "positive",
    "neutral",
    "negative",
  ]);


const TOKEN_PARAM_KEYS =
  new Set([
    "source",
    "route",
    "intent",
    "outcome",
    "response_kind",
    "confidence_bucket",
    "fallback_level",
    "page_id",
    "page_type",
    "interaction_type",
    "action_target",
    "feedback_rating",
    "reset_source",
  ]);


const INTEGER_PARAM_KEYS =
  new Set([
    "turn_count",
    "consecutive_fallbacks",
  ]);


const ALLOWED_PARAM_KEYS =
  new Set([
    ...TOKEN_PARAM_KEYS,
    ...INTEGER_PARAM_KEYS,
  ]);


const SAFE_TOKEN_PATTERN =
  /^[a-z0-9][a-z0-9._:-]{0,63}$/i;


function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function safeInteger(
  value,
) {
  if (
    !Number.isInteger(value)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      999,
      value,
    ),
  );
}


function safeToken(
  value,
) {
  const normalized =
    safeString(
      value,
    );

  if (
    !normalized ||
    !SAFE_TOKEN_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}


/**
 * Sanitización por allowlist.
 *
 * Aunque el caller entregue accidentalmente `text`, `message`, `email`,
 * `name`, `phone`, etc., nunca salen de este módulo porque solo aceptamos
 * las claves declaradas arriba y únicamente tokens estructurados.
 */
export function sanitizeAnalyticsParams(
  input,
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return Object.freeze({});
  }

  const output = {};

  for (
    const [
      key,
      value,
    ]
    of Object.entries(input)
  ) {
    if (
      !ALLOWED_PARAM_KEYS.has(
        key,
      )
    ) {
      continue;
    }

    if (
      INTEGER_PARAM_KEYS.has(
        key,
      )
    ) {
      const integerValue =
        safeInteger(
          value,
        );

      if (
        integerValue !== null
      ) {
        output[key] =
          integerValue;
      }

      continue;
    }

    const token =
      safeToken(
        value,
      );

    if (!token || !analyticsValues[key]?.has(token)) {
      continue;
    }

    if (
      key ===
        "feedback_rating" &&
      !FEEDBACK_RATINGS.has(
        token,
      )
    ) {
      continue;
    }

    output[key] =
      token;
  }

  return Object.freeze(
    output,
  );
}


export function hasAnalyticsConsent(
  windowRef =
    globalThis.window,
) {
  try {
    return (
      windowRef
        ?.localStorage
        ?.getItem?.(
          ANALYTICS_CONSENT_STORAGE_KEY,
        ) ===
      ANALYTICS_CONSENT_ACCEPTED
    );
  } catch {
    return false;
  }
}


export function sendChatbotAnalyticsEvent(
  eventName,
  params = {},
  {
    windowRef =
      globalThis.window,
  } = {},
) {
  const normalizedEventName =
    safeToken(
      eventName,
    );

  if (
    !normalizedEventName ||
    !Object.values(
      CHATBOT_ANALYTICS_EVENT,
    ).includes(
      normalizedEventName,
    )
  ) {
    return false;
  }

  if (
    !hasAnalyticsConsent(
      windowRef,
    )
  ) {
    return false;
  }

  const gtag =
    windowRef?.gtag;

  if (
    typeof gtag !==
      "function"
  ) {
    return false;
  }

  try {
    gtag(
      "event",
      normalizedEventName,
      sanitizeAnalyticsParams(
        params,
      ),
    );

    return true;
  } catch {
    return false;
  }
}


function pageParamsFromState(
  state,
) {
  return {
    page_id:
      state?.page?.current
        ?.pageId ??
      null,

    page_type:
      state?.page?.current
        ?.pageType ??
      null,
  };
}


function userTurnCount(
  state,
) {
  return (
    Array.isArray(
      state?.conversation
        ?.messages,
    )
      ? state.conversation
          .messages
          .filter(
            (message) =>
              message?.role ===
              "user",
          )
          .length
      : 0
  );
}


function isFallbackDetail(
  detail,
) {
  return (
    detail?.outcome ===
      "fallback" ||
    detail?.responseKind ===
      "fallback" ||
    (
      detail?.fallbackLevel &&
      detail.fallbackLevel !==
        "none"
    )
  );
}


function isEscalatedFallback(
  detail,
) {
  return (
    detail?.fallbackLevel ===
      "escalate"
  );
}


function actionTarget(
  interactionType,
) {
  return (
    ACTION_TARGET_BY_TYPE[
      interactionType
    ] ??
    null
  );
}


/**
 * Observador fino del funnel del chatbot.
 *
 * Dependencias inyectadas para poder probarlo sin navegador real.
 */
export function createChatbotAnalyticsObserver(
  {
    documentRef =
      globalThis.document,

    windowRef =
      globalThis.window,

    getState,

    subscribe,

    hasAnalyticsFlagBeenSent =
      null,

    markAnalyticsFlagSent =
      null,

    analyticsFlags =
      {},

    sendEvent =
      sendChatbotAnalyticsEvent,
  } = {},
) {
  if (
    typeof getState !==
      "function" ||
    typeof subscribe !==
      "function"
  ) {
    throw new TypeError(
      "createChatbotAnalyticsObserver() requires getState and subscribe",
    );
  }

  let started =
    false;

  let unsubscribeState =
    null;

  let lastOpen =
    getState()?.ui?.isOpen ===
    true;


  function track(
    eventName,
    params = {},
  ) {
    const state =
      getState();

    return sendEvent(
      eventName,
      {
        ...pageParamsFromState(
          state,
        ),
        ...params,
      },
      {
        windowRef,
      },
    );
  }


  function flagWasSent(
    flag,
  ) {
    if (
      !flag ||
      typeof hasAnalyticsFlagBeenSent !==
        "function"
    ) {
      return false;
    }

    try {
      return hasAnalyticsFlagBeenSent(
        flag,
      );
    } catch {
      return false;
    }
  }


  function markFlag(
    flag,
  ) {
    if (
      !flag ||
      typeof markAnalyticsFlagSent !==
        "function"
    ) {
      return;
    }

    try {
      markAnalyticsFlagSent(
        flag,
      );
    } catch {
      // Fail-soft: Analytics nunca debe romper el chat.
    }
  }


  function handleStateChange() {
    const open =
      getState()?.ui?.isOpen ===
      true;

    if (
      open === lastOpen
    ) {
      return;
    }

    lastOpen =
      open;

    track(
      open
        ? CHATBOT_ANALYTICS_EVENT.OPEN
        : CHATBOT_ANALYTICS_EVENT.CLOSE,
    );
  }


  function handleTurnProcessed(
    event,
  ) {
    const detail =
      event?.detail ??
      {};

    const state =
      getState();

    const turnCount =
      userTurnCount(
        state,
      );

    const chatStartFlag =
      analyticsFlags
        ?.CHAT_START_SENT ??
      null;

    if (
      turnCount >= 1 &&
      !flagWasSent(
        chatStartFlag,
      )
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .FIRST_MESSAGE,
        {
          source:
            detail.source ??
            null,
          turn_count:
            turnCount,
        },
      );

      /*
       * Marcamos el hito incluso si no había consentimiento.
       * De esta forma nunca convertimos un segundo/tercer mensaje
       * en un falso "first_message" si el usuario acepta Analytics tarde.
       */
      markFlag(
        chatStartFlag,
      );
    }

    const commonParams =
      {
        source:
          detail.source ??
          null,

        route:
          detail.route ??
          null,

        intent:
          detail.intent ??
          null,

        outcome:
          detail.outcome ??
          null,

        response_kind:
          detail.responseKind ??
          null,

        confidence_bucket:
          detail.confidenceBucket ??
          null,

        fallback_level:
          detail.fallbackLevel ??
          null,

        turn_count:
          turnCount,

        consecutive_fallbacks:
          state?.conversation
            ?.consecutiveFallbacks ??
          0,
      };

    track(
      CHATBOT_ANALYTICS_EVENT
        .TURN_PROCESSED,
      commonParams,
    );

    if (
      isFallbackDetail(
        detail,
      )
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .FALLBACK,
        commonParams,
      );

      if (
        isEscalatedFallback(
          detail,
        )
      ) {
        track(
          CHATBOT_ANALYTICS_EVENT
            .UNANSWERED,
          commonParams,
        );
      }
    }

    if (
      FEEDBACK_RATINGS.has(
        detail.feedbackRating,
      )
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .FEEDBACK_SUBMITTED,
        {
          feedback_rating:
            detail.feedbackRating,
          turn_count:
            turnCount,
        },
      );
    }
  }


  function handleInteractionExecuted(
    event,
  ) {
    const detail =
      event?.detail ??
      {};

    if (
      !EXECUTED_INTERACTION_STATUS
        .has(
          detail.status,
        )
    ) {
      return;
    }

    const interactionType =
      safeToken(
        detail.interactionType,
      );

    if (!interactionType) {
      return;
    }

    if (
      QUICK_REPLY_TYPES.has(
        interactionType,
      )
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .QUICK_REPLY_CLICK,
        {
          interaction_type:
            interactionType,
        },
      );

      return;
    }

    const target =
      actionTarget(
        interactionType,
      );

    track(
      CHATBOT_ANALYTICS_EVENT
        .ACTION_CLICK,
      {
        interaction_type:
          interactionType,
        action_target:
          target,
      },
    );

    if (
      interactionType ===
        "start-diagnostic"
    ) {
      const diagnosticFlag =
        analyticsFlags
          ?.DIAGNOSTIC_STARTED_SENT ??
        null;

      if (
        !flagWasSent(
          diagnosticFlag,
        )
      ) {
        track(
          CHATBOT_ANALYTICS_EVENT
            .DIAGNOSTIC_OPEN,
          {
            action_target:
              "diagnostic",
          },
        );

        markFlag(
          diagnosticFlag,
        );
      }

      return;
    }

    if (
      interactionType ===
        "open-contact"
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .CONTACT_CLICK,
        {
          action_target:
            "contact",
        },
      );

      return;
    }

    if (
      interactionType ===
        "open-calendly"
    ) {
      track(
        CHATBOT_ANALYTICS_EVENT
          .CALENDLY_OPEN,
        {
          action_target:
            "booking",
        },
      );
    }
  }


  function handleConversationReset(
    event,
  ) {
    track(
      CHATBOT_ANALYTICS_EVENT.RESET,
      {
        reset_source:
          event?.detail?.source ??
          null,
      },
    );
  }


  function start() {
    if (started) {
      return false;
    }

    started =
      true;

    lastOpen =
      getState()?.ui?.isOpen ===
      true;

    unsubscribeState =
      subscribe(
        handleStateChange,
      );

    documentRef
      ?.addEventListener?.(
        "victor-chatbot:turn-processed",
        handleTurnProcessed,
      );

    documentRef
      ?.addEventListener?.(
        "victor-chatbot:interaction-executed",
        handleInteractionExecuted,
      );

    documentRef
      ?.addEventListener?.(
        "victor-chatbot:conversation-reset",
        handleConversationReset,
      );

    return true;
  }


  function destroy() {
    if (!started) {
      return false;
    }

    started =
      false;

    unsubscribeState?.();
    unsubscribeState =
      null;

    documentRef
      ?.removeEventListener?.(
        "victor-chatbot:turn-processed",
        handleTurnProcessed,
      );

    documentRef
      ?.removeEventListener?.(
        "victor-chatbot:interaction-executed",
        handleInteractionExecuted,
      );

    documentRef
      ?.removeEventListener?.(
        "victor-chatbot:conversation-reset",
        handleConversationReset,
      );

    return true;
  }


  return Object.freeze({
    start,
    destroy,
    track,
  });
}
