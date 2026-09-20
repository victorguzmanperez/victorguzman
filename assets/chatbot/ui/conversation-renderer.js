/**
 * ============================================================
 * ASISTENTE DE VÍCTOR
 * Conversation renderer mínimo
 * 1.11.23.10
 * ============================================================
 *
 * Responsabilidad:
 * - leer state.conversation.messages;
 * - renderizar texto seguro mediante textContent;
 * - conservar separación visual user / assistant / system;
 * - restaurar la conversación persistida al montar la UI.
 *
 * NO:
 * - ejecuta actions;
 * - procesa quick replies;
 * - interpreta HTML;
 * - modifica el estado conversacional.
 *
 * La ejecución de actions pertenece a 1.11.24.
 */


import { approvedContentUrls } from '../core/dataverso-response.js';

function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function clearChildren(
  element,
) {
  if (!element) {
    return;
  }

  while (
    Array.isArray(
      element.children,
    ) &&
    element.children.length > 0
  ) {
    element.removeChild?.(
      element.children[0],
    );
  }

  /*
   * En DOM real textContent limpia también nodos de texto.
   * Los tests usan un DOM mínimo donde children es un array.
   */
  if (
    "textContent" in element
  ) {
    element.textContent = "";
  }
}


function roleClass(
  role,
) {
  switch (role) {
    case "user":
      return "user";

    case "system":
      return "system";

    default:
      return "assistant";
  }
}


function createMessageElement({
  message,
  documentRef,
}) {
  const text =
    safeString(
      message?.text,
    );

  if (!text) {
    return null;
  }

  const role =
    roleClass(
      message?.role,
    );

  const wrapper =
    documentRef.createElement(
      "div",
    );

  wrapper.className =
    `vg-chatbot-message vg-chatbot-message--${role}`;

  wrapper.setAttribute(
    "data-vg-chatbot-message",
    "",
  );

  wrapper.setAttribute(
    "data-message-role",
    role,
  );

  const messageId =
    safeString(
      message?.id,
    );

  if (messageId) {
    wrapper.setAttribute(
      "data-message-id",
      messageId,
    );
  }

  const bubble =
    documentRef.createElement(
      "p",
    );

  bubble.className =
    "vg-chatbot-message__bubble";

  /*
   * Seguridad: nunca interpretamos el mensaje como HTML.
   */
  bubble.textContent =
    text;

  // Only exact reviewed catalog URLs become anchors; never interpret HTML.
  if (role === 'assistant' && documentRef.createTextNode) {
    const parts = text.split(/(https:\/\/[^\s]+)/g);
    if (parts.some(part => approvedContentUrls.has(part))) {
      bubble.textContent = '';
      for (const part of parts) {
        if (approvedContentUrls.has(part)) {
          const link = documentRef.createElement('a');
          link.href = part; link.textContent = part.startsWith('https://amzn.to/') ? 'Ver libro (afiliado)' : 'Leer artículo';
          link.target = '_blank'; link.rel = 'noopener noreferrer';
          bubble.appendChild(link);
        } else bubble.appendChild(documentRef.createTextNode(part));
      }
    }
  }

  wrapper.appendChild(
    bubble,
  );

  return wrapper;
}


export function isConversationNearEnd(
  messagesElement,
  {
    threshold = 72,
  } = {},
) {
  if (!messagesElement) {
    return true;
  }

  const scrollTop =
    Number(messagesElement.scrollTop);

  const scrollHeight =
    Number(messagesElement.scrollHeight);

  const clientHeight =
    Number(messagesElement.clientHeight);

  if (
    !Number.isFinite(scrollTop) ||
    !Number.isFinite(scrollHeight) ||
    !Number.isFinite(clientHeight) ||
    clientHeight <= 0
  ) {
    /*
     * DOMs mínimos de tests y navegadores sin métricas completas:
     * mantenemos el comportamiento histórico de seguir el final.
     */
    return true;
  }

  const distanceFromEnd =
    scrollHeight -
    (scrollTop + clientHeight);

  return (
    distanceFromEnd <= threshold
  );
}


export function scrollConversationToEnd(
  messagesElement,
  {
    smooth = false,
  } = {},
) {
  if (!messagesElement) {
    return false;
  }

  const scrollHeight =
    Number(
      messagesElement.scrollHeight,
    );

  if (!Number.isFinite(scrollHeight)) {
    return false;
  }

  if (
    smooth &&
    typeof messagesElement.scrollTo ===
      "function"
  ) {
    try {
      messagesElement.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });

      return true;
    } catch {
      /* fallback a scrollTop */
    }
  }

  messagesElement.scrollTop =
    scrollHeight;

  return true;
}


function findTypingIndicator(
  messagesElement,
) {
  if (!messagesElement) {
    return null;
  }

  if (
    typeof messagesElement.querySelector ===
      "function"
  ) {
    return messagesElement.querySelector(
      "[data-vg-chatbot-typing]",
    );
  }

  return (
    Array.from(
      messagesElement.children ?? [],
    ).find(
      (child) =>
        child?.getAttribute?.(
          "data-vg-chatbot-typing",
        ) !== null,
    ) ?? null
  );
}


export function removeTypingIndicator({
  shellController,
} = {}) {
  const messagesElement =
    shellController?.messages ?? null;

  const typingElement =
    findTypingIndicator(
      messagesElement,
    );

  if (!typingElement) {
    return false;
  }

  typingElement.parentNode
    ?.removeChild?.(
      typingElement,
    );

  return true;
}


export function renderTypingIndicator({
  shellController,
  documentRef =
    globalThis.document,
  forceScrollToEnd = true,
  smooth = false,
} = {}) {
  const messagesElement =
    shellController?.messages ?? null;

  if (
    !messagesElement ||
    !documentRef ||
    typeof documentRef.createElement !==
      "function"
  ) {
    return Object.freeze({
      rendered: false,
      element: null,
    });
  }

  removeTypingIndicator({
    shellController,
  });

  const shouldScroll =
    forceScrollToEnd ||
    isConversationNearEnd(
      messagesElement,
    );

  const wrapper =
    documentRef.createElement(
      "div",
    );

  wrapper.className =
    "vg-chatbot-message vg-chatbot-message--assistant vg-chatbot-typing";

  wrapper.setAttribute(
    "data-vg-chatbot-typing",
    "",
  );

  wrapper.setAttribute(
    "role",
    "status",
  );

  wrapper.setAttribute(
    "aria-label",
    "El asistente está escribiendo",
  );

  const bubble =
    documentRef.createElement(
      "div",
    );

  bubble.className =
    "vg-chatbot-message__bubble vg-chatbot-typing__bubble";

  const dots =
    documentRef.createElement(
      "span",
    );

  dots.className =
    "vg-chatbot-typing__dots";

  dots.setAttribute(
    "aria-hidden",
    "true",
  );

  for (let index = 0; index < 3; index += 1) {
    const dot =
      documentRef.createElement(
        "span",
      );

    dot.className =
      "vg-chatbot-typing__dot";

    dots.appendChild(
      dot,
    );
  }

  bubble.appendChild(
    dots,
  );

  wrapper.appendChild(
    bubble,
  );

  messagesElement.appendChild(
    wrapper,
  );

  if (shouldScroll) {
    scrollConversationToEnd(
      messagesElement,
      {
        smooth,
      },
    );
  }

  return Object.freeze({
    rendered: true,
    element: wrapper,
  });
}


export function renderConversationState({
  shellController,
  state,
  documentRef =
    globalThis.document,
  forceScrollToEnd = false,
  smoothScroll = false,
} = {}) {
  const messagesElement =
    shellController
      ?.messages ??
    null;

  if (
    !messagesElement ||
    !documentRef ||
    typeof documentRef
      .createElement !==
      "function"
  ) {
    return Object.freeze({
      rendered:
        false,

      count:
        0,
    });
  }

  const messages =
    Array.isArray(
      state
        ?.conversation
        ?.messages,
    )
      ? state
          .conversation
          .messages
      : [];

  const previousScrollTop =
    Number.isFinite(
      Number(
        messagesElement.scrollTop,
      ),
    )
      ? Number(
          messagesElement.scrollTop,
        )
      : 0;

  const shouldScrollToEnd =
    forceScrollToEnd ||
    isConversationNearEnd(
      messagesElement,
    );

  /*
   * Si no hay conversación, restauramos el empty state del shell.
   */
  if (
    messages.length === 0
  ) {
    clearChildren(
      messagesElement,
    );

    const emptyState =
      shellController
        ?.emptyState ??
      null;

    if (
      emptyState &&
      typeof messagesElement
        .appendChild ===
        "function"
    ) {
      messagesElement.appendChild(
        emptyState,
      );
    }

    messagesElement.scrollTop = 0;

    return Object.freeze({
      rendered:
        false,

      count:
        0,

      emptyStateRestored:
        Boolean(
          emptyState,
        ),

      autoScrolled:
        false,
    });
  }

  clearChildren(
    messagesElement,
  );

  let renderedCount = 0;

  for (
    const message
    of messages
  ) {
    const element =
      createMessageElement({
        message,
        documentRef,
      });

    if (!element) {
      continue;
    }

    messagesElement.appendChild(
      element,
    );

    renderedCount += 1;
  }

  if (shouldScrollToEnd) {
    scrollConversationToEnd(
      messagesElement,
      {
        smooth:
          smoothScroll,
      },
    );
  } else {
    messagesElement.scrollTop =
      previousScrollTop;
  }

  return Object.freeze({
    rendered:
      renderedCount > 0,

    count:
      renderedCount,

    autoScrolled:
      shouldScrollToEnd,
  });
}


export function resetConversationComposer(
  shellController,
) {
  const input =
    shellController
      ?.input ??
    null;

  const submitButton =
    shellController
      ?.submitButton ??
    null;

  if (input) {
    input.value = "";
  }

  if (submitButton) {
    submitButton.disabled =
      true;
  }

  return Boolean(
    input ||
    submitButton,
  );
}


function disableInteractionButtons(
  container,
) {
  if (!container) {
    return;
  }

  if (
    typeof container.querySelectorAll ===
      "function"
  ) {
    for (
      const button
      of container.querySelectorAll(
        "button",
      )
    ) {
      button.disabled = true;
    }

    return;
  }

  for (
    const child
    of container.children ??
      []
  ) {
    if (
      child?.tagName ===
        "BUTTON"
    ) {
      child.disabled = true;
    }
  }
}


function createInteractionButton({
  item,
  kind,
  documentRef,
  onActivate,
}) {
  const id =
    safeString(
      item?.id,
    );

  const label =
    safeString(
      item?.label,
    );

  if (
    !id ||
    !label
  ) {
    return null;
  }

  const button =
    documentRef.createElement(
      "button",
    );

  button.type =
    "button";

  button.className =
    `vg-chatbot-interaction vg-chatbot-interaction--${kind}`;

  button.textContent =
    label;

  button.setAttribute(
    "data-vg-chatbot-interaction",
    kind,
  );

  button.setAttribute(
    "data-interaction-id",
    id,
  );

  if (
    kind === "action"
  ) {
    const priority =
      safeString(
        item?.priority,
      );

    if (priority) {
      button.setAttribute(
        "data-action-priority",
        priority,
      );
    }
  }

  button.addEventListener(
    "click",
    () => {
      if (button.disabled) {
        return;
      }

      disableInteractionButtons(
        button.parentNode,
      );

      onActivate?.(item);
    },
  );

  return button;
}


export function renderResponseInteractions({
  shellController,
  response,
  documentRef =
    globalThis.document,
  onQuickReply = null,
  onAction = null,
} = {}) {
  const messagesElement =
    shellController
      ?.messages ??
    null;

  if (
    !messagesElement ||
    !response ||
    !documentRef ||
    typeof documentRef
      .createElement !==
      "function"
  ) {
    return Object.freeze({
      rendered:
        false,
      quickReplies:
        0,
      actions:
        0,
    });
  }

  const quickReplies =
    Array.isArray(
      response.quickReplies,
    )
      ? response.quickReplies
      : [];

  const actions =
    Array.isArray(
      response.actions,
    )
      ? response.actions
      : [];

  if (
    quickReplies.length === 0 &&
    actions.length === 0
  ) {
    return Object.freeze({
      rendered:
        false,
      quickReplies:
        0,
      actions:
        0,
    });
  }

  const container =
    documentRef.createElement(
      "div",
    );

  container.className =
    "vg-chatbot-interactions";

  container.setAttribute(
    "data-vg-chatbot-interactions",
    "",
  );

  container.setAttribute(
    "role",
    "group",
  );

  container.setAttribute(
    "aria-label",
    "Opciones de respuesta",
  );

  let quickReplyCount = 0;
  let actionCount = 0;

  for (
    const quickReply
    of quickReplies
  ) {
    const button =
      createInteractionButton({
        item:
          quickReply,
        kind:
          "quick-reply",
        documentRef,
        onActivate:
          onQuickReply,
      });

    if (!button) {
      continue;
    }

    container.appendChild(
      button,
    );

    quickReplyCount += 1;
  }

  for (
    const action
    of actions
  ) {
    const button =
      createInteractionButton({
        item:
          action,
        kind:
          "action",
        documentRef,
        onActivate:
          onAction,
      });

    if (!button) {
      continue;
    }

    container.appendChild(
      button,
    );

    actionCount += 1;
  }

  if (
    quickReplyCount === 0 &&
    actionCount === 0
  ) {
    return Object.freeze({
      rendered:
        false,
      quickReplies:
        0,
      actions:
        0,
    });
  }

  messagesElement.appendChild(
    container,
  );

  scrollConversationToEnd(
    messagesElement,
  );

  return Object.freeze({
    rendered:
      true,
    quickReplies:
      quickReplyCount,
    actions:
      actionCount,
  });
}
