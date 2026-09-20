import {
  RESPONSE_ACTION_PRIORITY,
  RESPONSE_ACTION_TYPE,
  RESPONSE_QUICK_REPLY_KIND,
} from "./response-contract.js";

import {
  RESPONSE_INTERACTION_TARGET,
} from "./response-interactions.js";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";

import {
  setLastAction,
} from "./state.js";


/* ============================================================
 * ACTION ROUTER
 * 1.11.24
 *
 * Ejecuta únicamente interacciones declarativas ya validadas
 * por el Response Engine. No interpreta lenguaje natural y no
 * inventa destinos: contacto, diagnóstico y booking se resuelven
 * desde Knowledge.
 * ============================================================
 */

export const ACTION_ROUTER_STATUS =
  Object.freeze({
    EXECUTED:
      "executed",

    SUBMITTED:
      "submitted",

    CONFIRMATION_REQUIRED:
      "confirmation_required",

    DUPLICATE_SUPPRESSED:
      "duplicate_suppressed",

    INVALID:
      "invalid",

    UNSUPPORTED:
      "unsupported",

    FAILED:
      "failed",
  });


export const ACTION_ROUTER_EVENT =
  Object.freeze({
    FEEDBACK_REQUESTED:
      "victor-chatbot:feedback-requested",
  });


export const ACTION_ROUTER_DUPLICATE_WINDOW_MS =
  750;


const DEFAULT_SITE_BASE_URL =
  new URL(
    "../../../",
    import.meta.url,
  ).href;


const ACTION_TARGET_TYPE =
  Object.freeze({
    [RESPONSE_ACTION_TYPE.OPEN_CONTACT]:
      KNOWLEDGE_TYPE.CONTACT,

    [RESPONSE_ACTION_TYPE.START_DIAGNOSTIC]:
      KNOWLEDGE_TYPE.DIAGNOSTIC,

    [RESPONSE_ACTION_TYPE.OPEN_CALENDLY]:
      KNOWLEDGE_TYPE.BOOKING,
  });


const ACTION_ROUTE_FACT =
  Object.freeze({
    [RESPONSE_ACTION_TYPE.OPEN_CONTACT]:
      "contact-route",

    [RESPONSE_ACTION_TYPE.START_DIAGNOSTIC]:
      "diagnostic-route",

    [RESPONSE_ACTION_TYPE.OPEN_CALENDLY]:
      "booking-url",
  });


const QUICK_REPLY_DEFAULT_TARGET =
  Object.freeze({
    [RESPONSE_ACTION_TYPE.OPEN_CONTACT]:
      RESPONSE_INTERACTION_TARGET.CONTACT,

    [RESPONSE_ACTION_TYPE.START_DIAGNOSTIC]:
      RESPONSE_INTERACTION_TARGET.DIAGNOSTIC,

    [RESPONSE_ACTION_TYPE.OPEN_CALENDLY]:
      RESPONSE_INTERACTION_TARGET.BOOKING,

    [RESPONSE_ACTION_TYPE.OFFER_FEEDBACK]:
      null,
  });


function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function frozenResult(
  input,
) {
  return Object.freeze({
    handled:
      input.handled === true,

    executed:
      input.executed === true,

    status:
      input.status,

    interactionId:
      input.interactionId ??
      null,

    interactionType:
      input.interactionType ??
      null,

    destination:
      input.destination ??
      null,

    submittedText:
      input.submittedText ??
      null,

    reason:
      input.reason ??
      null,
  });
}


function getFactValue(
  item,
  key,
) {
  if (
    !item ||
    !Array.isArray(item.facts)
  ) {
    return null;
  }

  return (
    item.facts.find(
      (fact) =>
        fact?.key === key,
    )?.value ??
    null
  );
}


function isCanonicalActionType(
  type,
) {
  return (
    Object.values(
      RESPONSE_ACTION_TYPE,
    ).includes(type)
  );
}


function isSafeInternalTarget(
  value,
) {
  const target =
    safeString(value);

  if (!target) {
    return false;
  }

  if (
    target.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i
      .test(target)
  ) {
    return false;
  }

  return (
    /^\/?[a-z0-9][a-z0-9._/-]*(?:#[a-z0-9._-]+)?$/i
      .test(target)
  );
}


function normalizeSiteBaseUrl(
  value,
) {
  try {
    const url =
      new URL(
        value ??
          DEFAULT_SITE_BASE_URL,
      );

    if (!url.pathname.endsWith("/")) {
      url.pathname =
        `${url.pathname}/`;
    }

    url.search = "";
    url.hash = "";

    return url.href;
  } catch {
    return null;
  }
}


function resolveInternalUrl(
  target,
  siteBaseUrl,
) {
  if (
    !isSafeInternalTarget(target)
  ) {
    return null;
  }

  const baseUrl =
    normalizeSiteBaseUrl(
      siteBaseUrl,
    );

  if (!baseUrl) {
    return null;
  }

  try {
    /*
     * Un target /foo.html se interpreta como relativo a la raíz
     * del portfolio, no a la raíz del dominio. Esto evita romper
     * GitHub Pages cuando el site vive bajo /victorguzman/.
     */
    const normalizedTarget =
      safeString(target)
        .replace(/^\/+/, "");

    return new URL(
      normalizedTarget,
      baseUrl,
    ).href;
  } catch {
    return null;
  }
}




function sameDocumentHashTarget(
  destinationUrl,
  windowRef,
) {
  const currentHref =
    safeString(
      windowRef?.location?.href,
    );

  if (!currentHref) {
    return null;
  }

  try {
    const current =
      new URL(currentHref);

    const destination =
      new URL(destinationUrl);

    if (
      current.origin ===
        destination.origin &&
      current.pathname ===
        destination.pathname &&
      current.search ===
        destination.search &&
      destination.hash
    ) {
      return destination.hash;
    }
  } catch {
    return null;
  }

  return null;
}


function focusDocumentHashTarget(
  hash,
  documentRef,
) {
  const normalizedHash =
    safeString(hash);

  if (
    !normalizedHash ||
    !normalizedHash.startsWith(
      "#",
    )
  ) {
    return false;
  }

  let id =
    normalizedHash.slice(1);

  try {
    id =
      decodeURIComponent(id);
  } catch {
    // Conservamos el identificador sin decodificar.
  }

  const target =
    documentRef?.getElementById?.(
      id,
    ) ??
    null;

  if (!target) {
    return false;
  }

  try {
    target.scrollIntoView?.({
      behavior:
        "smooth",
      block:
        "start",
    });
  } catch {
    target.scrollIntoView?.();
  }

  let focusTarget =
    typeof target.focus ===
      "function"
      ? target
      : null;

  if (
    !focusTarget &&
    typeof target.querySelector ===
      "function"
  ) {
    focusTarget =
      target.querySelector(
        "input:not([type='hidden']), select, textarea, button, [tabindex]",
      );
  }

  if (
    focusTarget &&
    typeof focusTarget.focus ===
      "function"
  ) {
    try {
      focusTarget.focus({
        preventScroll:
          true,
      });
    } catch {
      focusTarget.focus();
    }
  }

  return true;
}


function resolveCalendlyUrl(
  value,
) {
  const raw =
    safeString(value);

  if (!raw) {
    return null;
  }

  try {
    const url =
      new URL(raw);

    const hostname =
      url.hostname
        .toLowerCase();

    if (
      url.protocol !== "https:" ||
      !(
        hostname === "calendly.com" ||
        hostname.endsWith(
          ".calendly.com",
        )
      )
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}


function canonicalKnowledgeTarget(
  action,
) {
  const expectedType =
    ACTION_TARGET_TYPE[
      action?.type
    ] ??
    null;

  const targetId =
    safeString(
      action?.target,
    );

  if (
    !expectedType ||
    !targetId
  ) {
    return null;
  }

  const item =
    getKnowledgeById(
      targetId,
    );

  return (
    item?.type === expectedType
      ? item
      : null
  );
}


export function resolveActionDestination(
  action,
  {
    siteBaseUrl =
      DEFAULT_SITE_BASE_URL,
  } = {},
) {
  if (
    !action ||
    typeof action !== "object" ||
    !isCanonicalActionType(
      action.type,
    )
  ) {
    return null;
  }

  switch (action.type) {
    case RESPONSE_ACTION_TYPE.NAVIGATE: {
      const url =
        resolveInternalUrl(
          action.target,
          siteBaseUrl,
        );

      return (
        url
          ? Object.freeze({
              kind:
                "internal",
              url,
            })
          : null
      );
    }

    case RESPONSE_ACTION_TYPE.OPEN_CONTACT:
    case RESPONSE_ACTION_TYPE.START_DIAGNOSTIC: {
      const item =
        canonicalKnowledgeTarget(
          action,
        );

      const factKey =
        ACTION_ROUTE_FACT[
          action.type
        ];

      const url =
        item
          ? resolveInternalUrl(
              getFactValue(
                item,
                factKey,
              ),
              siteBaseUrl,
            )
          : null;

      return (
        url
          ? Object.freeze({
              kind:
                "internal",
              url,
            })
          : null
      );
    }

    case RESPONSE_ACTION_TYPE.OPEN_CALENDLY: {
      const item =
        canonicalKnowledgeTarget(
          action,
        );

      const url =
        item
          ? resolveCalendlyUrl(
              getFactValue(
                item,
                ACTION_ROUTE_FACT[
                  action.type
                ],
              ),
            )
          : null;

      return (
        url
          ? Object.freeze({
              kind:
                "external",
              url,
            })
          : null
      );
    }

    case RESPONSE_ACTION_TYPE.OFFER_FEEDBACK:
      return Object.freeze({
        kind:
          "feedback",
        url:
          null,
      });

    default:
      return null;
  }
}


function quickReplyAction(
  quickReply,
) {
  const type =
    quickReply?.value;

  if (
    quickReply?.kind !==
      RESPONSE_QUICK_REPLY_KIND
        .ACTION ||
    !isCanonicalActionType(type) ||
    type ===
      RESPONSE_ACTION_TYPE.NAVIGATE
  ) {
    return null;
  }

  return Object.freeze({
    id:
      safeString(
        quickReply.id,
      ),

    type,

    label:
      safeString(
        quickReply.label,
      ),

    priority:
      RESPONSE_ACTION_PRIORITY
        .SECONDARY,

    target:
      QUICK_REPLY_DEFAULT_TARGET[
        type
      ] ??
      null,

    requiresConfirmation:
      false,
  });
}


function interactionFingerprint(
  action,
) {
  return [
    safeString(action?.id),
    safeString(action?.type),
    safeString(action?.target),
  ].join("|");
}


export function createActionRouter(
  {
    windowRef =
      globalThis.window,

    documentRef =
      globalThis.document,

    siteBaseUrl =
      DEFAULT_SITE_BASE_URL,

    submitText =
      null,

    onFeedbackRequested =
      null,

    beforeInternalNavigation =
      null,

    now =
      () => Date.now(),

    duplicateWindowMs =
      ACTION_ROUTER_DUPLICATE_WINDOW_MS,
  } = {},
) {
  if (
    submitText !== null &&
    typeof submitText !==
      "function"
  ) {
    throw new TypeError(
      "submitText must be null or a function",
    );
  }

  if (
    onFeedbackRequested !== null &&
    typeof onFeedbackRequested !==
      "function"
  ) {
    throw new TypeError(
      "onFeedbackRequested must be null or a function",
    );
  }

  if (
    beforeInternalNavigation !== null &&
    typeof beforeInternalNavigation !==
      "function"
  ) {
    throw new TypeError(
      "beforeInternalNavigation must be null or a function",
    );
  }

  const recentExecutions =
    new Map();


  function isDuplicate(
    action,
  ) {
    const fingerprint =
      interactionFingerprint(
        action,
      );

    const currentTime =
      Number(now());

    const previousTime =
      recentExecutions.get(
        fingerprint,
      );

    if (
      Number.isFinite(
        previousTime,
      ) &&
      Number.isFinite(
        currentTime,
      ) &&
      currentTime - previousTime <
        duplicateWindowMs
    ) {
      return true;
    }

    recentExecutions.set(
      fingerprint,
      currentTime,
    );

    return false;
  }


  function executeAction(
    action,
    {
      confirmed = false,
    } = {},
  ) {
    const actionId =
      safeString(
        action?.id,
      );

    const actionType =
      action?.type ??
      null;

    if (
      !actionId ||
      !isCanonicalActionType(
        actionType,
      )
    ) {
      return frozenResult({
        handled:
          false,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.INVALID,
        interactionId:
          actionId || null,
        interactionType:
          actionType,
        reason:
          "invalid_action",
      });
    }

    if (
      action.requiresConfirmation ===
        true &&
      confirmed !== true
    ) {
      return frozenResult({
        handled:
          true,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS
            .CONFIRMATION_REQUIRED,
        interactionId:
          actionId,
        interactionType:
          actionType,
        reason:
          "confirmation_required",
      });
    }

    const destination =
      resolveActionDestination(
        action,
        {
          siteBaseUrl,
        },
      );

    if (!destination) {
      return frozenResult({
        handled:
          false,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.INVALID,
        interactionId:
          actionId,
        interactionType:
          actionType,
        reason:
          "unresolvable_destination",
      });
    }

    if (
      isDuplicate(
        action,
      )
    ) {
      return frozenResult({
        handled:
          true,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS
            .DUPLICATE_SUPPRESSED,
        interactionId:
          actionId,
        interactionType:
          actionType,
        destination:
          destination.url,
        reason:
          "duplicate_click",
      });
    }

    try {
      if (
        destination.kind ===
          "internal"
      ) {
        const localHash =
          sameDocumentHashTarget(
            destination.url,
            windowRef,
          );

        /*
         * NAV-H1.1: una acción que apunta a un elemento de la
         * página actual no necesita recargar ni persistir otra
         * navegación. Hacemos scroll al formulario y enfocamos
         * su primer control útil.
         */
        if (localHash) {
          /*
           * MOB-H3 — Incluso una navegación interna a un ancla de la
           * página actual debe poder preparar el handoff (por ejemplo,
           * minimizar el chat) antes de mostrar el contenido destino.
           */
          if (beforeInternalNavigation) {
            beforeInternalNavigation({
              action,
              destination,
            });
          }

          if (
            focusDocumentHashTarget(
              localHash,
              documentRef,
            )
          ) {
            return frozenResult({
            handled:
              true,
            executed:
              true,
            status:
              ACTION_ROUTER_STATUS.EXECUTED,
            interactionId:
              actionId,
            interactionType:
              actionType,
            destination:
              destination.url,
            reason:
              "same_document_target",
            });
          }
        }

        if (
          typeof windowRef
            ?.location
            ?.assign !==
            "function"
        ) {
          throw new Error(
            "location.assign unavailable",
          );
        }

        setLastAction(
          actionId,
        );

        /*
         * NAV-H1: el marcador de navegación debe estar persistido
         * antes de abandonar el documento actual. El callback lo
         * inyecta el bootstrap para mantener este router desacoplado
         * de storage.js y conservar su testabilidad.
         */
        if (beforeInternalNavigation) {
          beforeInternalNavigation({
            action,
            destination,
          });
        }

        windowRef.location.assign(
          destination.url,
        );
      } else if (
        destination.kind ===
          "external"
      ) {
        if (
          typeof windowRef?.open !==
            "function"
        ) {
          throw new Error(
            "window.open unavailable",
          );
        }

        const openedWindow =
          windowRef.open(
            destination.url,
            "_blank",
            "noopener,noreferrer",
          );

        if (
          openedWindow &&
          "opener" in openedWindow
        ) {
          try {
            openedWindow.opener =
              null;
          } catch {
            // No necesitamos acceso al nuevo contexto.
          }
        }

        setLastAction(
          actionId,
        );
      } else if (
        destination.kind ===
          "feedback"
      ) {
        if (onFeedbackRequested) {
          onFeedbackRequested({
            action,
          });
        } else if (
          documentRef &&
          typeof documentRef
            .dispatchEvent ===
            "function" &&
          typeof windowRef
            ?.CustomEvent ===
            "function"
        ) {
          documentRef.dispatchEvent(
            new windowRef.CustomEvent(
              ACTION_ROUTER_EVENT
                .FEEDBACK_REQUESTED,
              {
                detail: {
                  actionId,
                },
              },
            ),
          );
        }

        setLastAction(
          actionId,
        );
      } else {
        return frozenResult({
          handled:
            false,
          executed:
            false,
          status:
            ACTION_ROUTER_STATUS
              .UNSUPPORTED,
          interactionId:
            actionId,
          interactionType:
            actionType,
          reason:
            "unsupported_destination",
        });
      }

      return frozenResult({
        handled:
          true,
        executed:
          true,
        status:
          ACTION_ROUTER_STATUS.EXECUTED,
        interactionId:
          actionId,
        interactionType:
          actionType,
        destination:
          destination.url,
      });
    } catch {
      return frozenResult({
        handled:
          true,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.FAILED,
        interactionId:
          actionId,
        interactionType:
          actionType,
        destination:
          destination.url,
        reason:
          "execution_failed",
      });
    }
  }


  function executeQuickReply(
    quickReply,
  ) {
    const replyId =
      safeString(
        quickReply?.id,
      );

    const label =
      safeString(
        quickReply?.label,
      );

    if (
      !replyId ||
      !label ||
      !Object.values(
        RESPONSE_QUICK_REPLY_KIND,
      ).includes(
        quickReply?.kind,
      )
    ) {
      return frozenResult({
        handled:
          false,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.INVALID,
        interactionId:
          replyId || null,
        interactionType:
          quickReply?.kind ??
          null,
        reason:
          "invalid_quick_reply",
      });
    }

    if (
      quickReply.kind ===
        RESPONSE_QUICK_REPLY_KIND
          .ACTION
    ) {
      const action =
        quickReplyAction(
          quickReply,
        );

      return (
        action
          ? executeAction(action)
          : frozenResult({
              handled:
                false,
              executed:
                false,
              status:
                ACTION_ROUTER_STATUS
                  .UNSUPPORTED,
              interactionId:
                replyId,
              interactionType:
                quickReply.kind,
              reason:
                "unsupported_quick_reply_action",
            })
      );
    }

    if (!submitText) {
      return frozenResult({
        handled:
          false,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS
            .UNSUPPORTED,
        interactionId:
          replyId,
        interactionType:
          quickReply.kind,
        reason:
          "submit_handler_unavailable",
      });
    }

    const submittedText =
      quickReply.kind ===
        RESPONSE_QUICK_REPLY_KIND
          .ANSWER
        ? safeString(
            quickReply.value,
          )
        : label;

    if (!submittedText) {
      return frozenResult({
        handled:
          false,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.INVALID,
        interactionId:
          replyId,
        interactionType:
          quickReply.kind,
        reason:
          "empty_quick_reply",
      });
    }

    try {
      submitText(
        submittedText,
        {
          source:
            "quick-reply",
          quickReply,
        },
      );

      return frozenResult({
        handled:
          true,
        executed:
          true,
        status:
          ACTION_ROUTER_STATUS.SUBMITTED,
        interactionId:
          replyId,
        interactionType:
          quickReply.kind,
        submittedText,
      });
    } catch {
      return frozenResult({
        handled:
          true,
        executed:
          false,
        status:
          ACTION_ROUTER_STATUS.FAILED,
        interactionId:
          replyId,
        interactionType:
          quickReply.kind,
        submittedText,
        reason:
          "submission_failed",
      });
    }
  }


  return Object.freeze({
    executeAction,
    executeQuickReply,
  });
}
