import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
} from "./response-contract.js";

import {
  RESPONSE_INTERACTION_TARGET,
} from "./response-interactions.js";

/**
 * ============================================================
 * NAV-H1 — Contextual navigation handoff
 * ============================================================
 *
 * A navigation handoff explains why the visitor has arrived on a
 * destination page after clicking a chatbot action.
 *
 * It is intentionally conservative:
 * - it only reacts to known diagnostic action ids;
 * - it does not infer new facts;
 * - it does not persist free-form hidden context;
 * - the existing conversation remains the source of context.
 */

function safeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

const DIAGNOSTIC_ACTION_ID_PATTERNS = Object.freeze([
  /^action-(?:problem-flow|operational|commercial)-diagnostic(?:-|$)/,
  /^action-progress-[a-z-]+-diagnostic(?:-|$)/,
  /^(?:v2-diagnostic|v2-handoff-diagnostic|h2-diagnostic|action-diagnostic)$/,
]);

export const NAVIGATION_HANDOFF_KIND = Object.freeze({
  DIAGNOSTIC: "diagnostic",
});

export function isDiagnosticNavigationAction(actionId) {
  const normalized = safeString(actionId);
  return DIAGNOSTIC_ACTION_ID_PATTERNS.some(
    (pattern) => pattern.test(normalized),
  );
}


export function shouldDismissTrailingDiagnosticQuestion(
  state,
  actionId,
) {
  if (
    !isDiagnosticNavigationAction(
      actionId,
    )
  ) {
    return false;
  }

  const messages =
    Array.isArray(
      state?.conversation?.messages,
    )
      ? state.conversation.messages
      : [];

  const lastMessage =
    messages[
      messages.length - 1
    ] ?? null;

  const text =
    safeString(
      lastMessage?.text,
    );

  return (
    lastMessage?.role ===
      "assistant" &&
    Boolean(text) &&
    /\?\s*$/.test(text)
  );
}

export function buildNavigationHandoff(state) {
  const currentPageId =
    safeString(state?.page?.current?.pageId);

  const lastAction =
    safeString(state?.conversation?.lastAction);

  if (
    currentPageId !== "diagnostico" ||
    !isDiagnosticNavigationAction(lastAction)
  ) {
    return null;
  }

  return Object.freeze({
    kind:
      NAVIGATION_HANDOFF_KIND.DIAGNOSTIC,

    sourceActionId:
      lastAction,

    messages:
      Object.freeze([
        "Perfecto. Te he traído al diagnóstico porque, con lo que me has contado, ya merece la pena revisar tu caso con algo más de detalle. No hace falta que respondas a la pregunta anterior: aquí podrás concretarlo en el formulario.",
        "Completa el formulario de esta página; tarda unos 3 minutos. Cuando lo envíes, Víctor recibirá la información para revisar cómo trabajas ahora, qué quieres mejorar y qué resultado necesitas. Si prefieres hablarlo directamente con él, también puedes reservar una reunión inicial de 30 minutos.",
      ]),

    actions:
      Object.freeze([
        Object.freeze({
          id:
            "action-navigation-handoff-complete-diagnostic",

          type:
            RESPONSE_ACTION_TYPE.NAVIGATE,

          label:
            "Completar diagnóstico",

          target:
            "diagnostico.html#diagnosticForm",

          priority:
            RESPONSE_ACTION_PRIORITY.PRIMARY,

          requiresConfirmation:
            false,
        }),

        Object.freeze({
          id:
            "action-navigation-handoff-booking",

          type:
            RESPONSE_ACTION_TYPE.OPEN_CALENDLY,

          label:
            "Reservar reunión",

          target:
            RESPONSE_INTERACTION_TARGET.BOOKING,

          priority:
            RESPONSE_ACTION_PRIORITY.SECONDARY,

          requiresConfirmation:
            false,
        }),
      ]),
  });
}
