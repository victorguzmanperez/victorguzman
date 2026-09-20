import assert from "node:assert/strict";
import test from "node:test";

import {
  CHATBOT_ANALYTICS_EVENT,
  createChatbotAnalyticsObserver,
  hasAnalyticsConsent,
  sanitizeAnalyticsParams,
  sendChatbotAnalyticsEvent,
} from "../core/analytics.js";


function createStorage(
  initial = {},
) {
  const values =
    new Map(
      Object.entries(initial),
    );

  return {
    getItem(key) {
      return values.has(key)
        ? values.get(key)
        : null;
    },

    setItem(key, value) {
      values.set(
        key,
        String(value),
      );
    },
  };
}


function createDocumentBus() {
  const listeners =
    new Map();

  return {
    addEventListener(
      type,
      listener,
    ) {
      if (!listeners.has(type)) {
        listeners.set(
          type,
          new Set(),
        );
      }

      listeners
        .get(type)
        .add(listener);
    },

    removeEventListener(
      type,
      listener,
    ) {
      listeners
        .get(type)
        ?.delete(listener);
    },

    dispatch(
      type,
      detail = {},
    ) {
      for (
        const listener
        of listeners.get(type) ?? []
      ) {
        listener({
          type,
          detail,
        });
      }
    },
  };
}


function createObserverHarness() {
  const documentRef =
    createDocumentBus();

  const sent = [];

  const subscribers =
    new Set();

  const flags = {
    chatStartSent: false,
    diagnosticStartedSent: false,
  };

  const state = {
    ui: {
      isOpen: false,
    },

    page: {
      current: {
        pageId: "home",
        pageType: "landing",
      },
    },

    conversation: {
      messages: [],
      consecutiveFallbacks: 0,
    },
  };

  const observer =
    createChatbotAnalyticsObserver({
      documentRef,

      windowRef: {},

      getState() {
        return state;
      },

      subscribe(listener) {
        subscribers.add(listener);

        return () => {
          subscribers.delete(listener);
        };
      },

      hasAnalyticsFlagBeenSent(
        flagName,
      ) {
        return flags[flagName] === true;
      },

      markAnalyticsFlagSent(
        flagName,
      ) {
        flags[flagName] = true;
      },

      analyticsFlags: {
        CHAT_START_SENT:
          "chatStartSent",
        DIAGNOSTIC_STARTED_SENT:
          "diagnosticStartedSent",
      },

      sendEvent(
        eventName,
        params,
      ) {
        sent.push({
          eventName,
          params:
            sanitizeAnalyticsParams(
              params,
            ),
        });

        return true;
      },
    });

  function notifyState() {
    for (
      const listener
      of subscribers
    ) {
      listener({
        type: "state_updated",
      });
    }
  }

  return {
    documentRef,
    flags,
    notifyState,
    observer,
    sent,
    state,
  };
}


test(
  "OBS-H1 analytics sanitizer allows only structured non-PII fields",
  () => {
    assert.deepEqual(
      sanitizeAnalyticsParams({
        page_id: "home",
        page_type: "landing",
        intent: "experience",
        turn_count: 2,
        feedback_rating: "positive",
        text: "mi mensaje privado",
        message: "otro texto",
        name: "Víctor",
        email: "victor@example.com",
        phone: "600000000",
        conversation:
          "transcript completo",
        diagnostic_summary:
          "resumen sensible",
      }),
      {
        page_id: "home",
        page_type: "landing",
        intent: "experience",
        turn_count: 2,
        feedback_rating: "positive",
      },
    );
  },
);


test(
  "OBS-H1 rejects free-form parameter values even on allowed keys",
  () => {
    assert.deepEqual(
      sanitizeAnalyticsParams({
        intent:
          "quiero que guardes este texto libre con espacios",
        route:
          "knowledge_direct",
        feedback_rating:
          "super feliz",
      }),
      {
        route:
          "knowledge_direct",
      },
    );
  },
);


test(
  "OBS-H1 GA4 events require explicit analytics consent",
  () => {
    const calls = [];

    const rejectedWindow = {
      localStorage:
        createStorage({
          vg_cookie_consent:
            "rejected",
        }),
      gtag(...args) {
        calls.push(args);
      },
    };

    assert.equal(
      hasAnalyticsConsent(
        rejectedWindow,
      ),
      false,
    );

    assert.equal(
      sendChatbotAnalyticsEvent(
        CHATBOT_ANALYTICS_EVENT.OPEN,
        {
          page_id: "home",
        },
        {
          windowRef:
            rejectedWindow,
        },
      ),
      false,
    );

    assert.equal(
      calls.length,
      0,
    );
  },
);


test(
  "OBS-H1 sends only sanitized GA4 payload after consent",
  () => {
    const calls = [];

    const windowRef = {
      localStorage:
        createStorage({
          vg_cookie_consent:
            "accepted",
        }),
      gtag(...args) {
        calls.push(args);
      },
    };

    assert.equal(
      sendChatbotAnalyticsEvent(
        CHATBOT_ANALYTICS_EVENT
          .TURN_PROCESSED,
        {
          intent: "experience",
          turn_count: 3,
          text:
            "esto jamás debe salir",
          email:
            "secret@example.com",
        },
        {
          windowRef,
        },
      ),
      true,
    );

    assert.deepEqual(
      calls,
      [
        [
          "event",
          "chat_turn_processed",
          {
            intent: "experience",
            turn_count: 3,
          },
        ],
      ],
    );
  },
);


test(
  "OBS-H1 tracks explicit chat open and close without counting restored open state",
  () => {
    const h =
      createObserverHarness();

    h.observer.start();

    assert.equal(
      h.sent.length,
      0,
    );

    h.state.ui.isOpen = true;
    h.notifyState();

    h.state.ui.isOpen = false;
    h.notifyState();

    assert.deepEqual(
      h.sent.map(
        (item) =>
          item.eventName,
      ),
      [
        "chat_open",
        "chat_close",
      ],
    );

    h.observer.destroy();
  },
);


test(
  "OBS-H1 tracks first message once and every processed turn without raw text",
  () => {
    const h =
      createObserverHarness();

    h.observer.start();

    h.state.conversation.messages.push({
      role: "user",
      text: "contenido privado",
    });

    h.documentRef.dispatch(
      "victor-chatbot:turn-processed",
      {
        source: "composer",
        route: "knowledge_direct",
        intent: "experience",
        outcome: "answered",
        responseKind: "knowledge",
      },
    );

    h.state.conversation.messages.push({
      role: "assistant",
      text: "respuesta",
    });

    h.state.conversation.messages.push({
      role: "user",
      text: "otro contenido privado",
    });

    h.documentRef.dispatch(
      "victor-chatbot:turn-processed",
      {
        source: "composer",
        route: "knowledge_direct",
        intent: "technology",
        outcome: "answered",
        responseKind: "knowledge",
      },
    );

    assert.deepEqual(
      h.sent.map(
        (item) =>
          item.eventName,
      ),
      [
        "chat_first_message",
        "chat_turn_processed",
        "chat_turn_processed",
      ],
    );

    assert.equal(
      h.flags.chatStartSent,
      true,
    );

    for (
      const item
      of h.sent
    ) {
      assert.equal(
        Object.hasOwn(
          item.params,
          "text",
        ),
        false,
      );
    }

    h.observer.destroy();
  },
);


test(
  "OBS-H1 tracks fallback and escalated unanswered signals",
  () => {
    const h =
      createObserverHarness();

    h.observer.start();

    h.state.conversation.messages.push({
      role: "user",
      text: "asdfgh qwerty",
    });

    h.state.conversation.consecutiveFallbacks =
      3;

    h.documentRef.dispatch(
      "victor-chatbot:turn-processed",
      {
        source: "composer",
        route: "fallback",
        intent: "unknown",
        outcome: "fallback",
        responseKind: "fallback",
        confidenceBucket: "low",
        fallbackLevel: "escalate",
      },
    );

    assert.deepEqual(
      h.sent.map(
        (item) =>
          item.eventName,
      ),
      [
        "chat_first_message",
        "chat_turn_processed",
        "chat_fallback",
        "chat_unanswered",
      ],
    );

    assert.equal(
      h.sent.at(-1)
        .params
        .consecutive_fallbacks,
      3,
    );

    h.observer.destroy();
  },
);


test(
  "OBS-H1 tracks quick replies and conversion actions as structured funnel milestones",
  () => {
    const h =
      createObserverHarness();

    h.observer.start();

    h.documentRef.dispatch(
      "victor-chatbot:interaction-executed",
      {
        status: "submitted",
        interactionType: "answer",
        interactionId:
          "qr-private-label-is-ignored",
      },
    );

    h.documentRef.dispatch(
      "victor-chatbot:interaction-executed",
      {
        status: "executed",
        interactionType:
          "start-diagnostic",
        destination:
          "/diagnostico.html",
      },
    );

    h.documentRef.dispatch(
      "victor-chatbot:interaction-executed",
      {
        status: "executed",
        interactionType:
          "open-contact",
        destination:
          "/index.html#contacto",
      },
    );

    h.documentRef.dispatch(
      "victor-chatbot:interaction-executed",
      {
        status: "executed",
        interactionType:
          "open-calendly",
        destination:
          "https://calendly.example/private",
      },
    );

    assert.deepEqual(
      h.sent.map(
        (item) =>
          item.eventName,
      ),
      [
        "chat_quick_reply_click",
        "chat_action_click",
        "chat_diagnostic_open",
        "chat_action_click",
        "chat_contact_click",
        "chat_action_click",
        "chat_calendly_open",
      ],
    );

    assert.equal(
      h.flags
        .diagnosticStartedSent,
      true,
    );

    assert.equal(
      h.sent.some(
        (item) =>
          Object.hasOwn(
            item.params,
            "destination",
          ),
      ),
      false,
    );

    h.observer.destroy();
  },
);


test(
  "OBS-H1 tracks structured feedback rating without conversation text",
  () => {
    const h =
      createObserverHarness();

    h.observer.start();

    h.state.conversation.messages.push({
      role: "user",
      text: "sí, me ha resultado útil",
    });

    h.documentRef.dispatch(
      "victor-chatbot:turn-processed",
      {
        source: "quick-reply",
        route: "social_feedback",
        intent: "social",
        outcome: "answered",
        responseKind: "social",
        feedbackRating:
          "positive",
      },
    );

    const feedback =
      h.sent.find(
        (item) =>
          item.eventName ===
          "chat_feedback_submitted",
      );

    assert.deepEqual(
      feedback?.params,
      {
        page_id: "home",
        page_type: "landing",
        feedback_rating:
          "positive",
        turn_count: 1,
      },
    );

    h.observer.destroy();
  },
);
