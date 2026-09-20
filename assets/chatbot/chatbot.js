/**
 * ============================================================
 * ASISTENTE DE VÍCTOR
 * Bootstrap global
 * ============================================================
 *
 * HITO I0.6
 *
 * Responsabilidades:
 * - entry point único;
 * - singleton global;
 * - root DOM;
 * - carga CSS;
 * - restauración de sesión;
 * - detección de pageContext;
 * - montaje del launcher;
 * - reduced-motion;
 * - sincronización con storage;
 * - lazy loading del core conversacional;
 * - lifecycle / destroy.
 *
 * NO contiene:
 * - NLU;
 * - políticas de conversación;
 * - respuestas;
 * - conocimiento;
 * - Calendly.
 */

import {
  chatbotConfig,
  debugLog,
} from "./core/config.js";

import {
  AVATAR_STATUS,
  BOOTSTRAP_STATUS,
  CHATBOT_VERSION,
  ANALYTICS_FLAG,
  MESSAGE_ROLE,
  MESSAGE_TYPE,
  appendMessage,
  getState,
  hasAnalyticsFlagBeenSent,
  hasAskedQuestion,
  markAnalyticsFlagSent,
  markQuestionAsked,
  resetConversation,
  setLastAction,
  setPageContext,
  setUiAvatarState,
  setUiTyping,
  subscribe,
  updateState,
  updateDiagnosticFields,
} from "./core/state.js";

import {
  clearState as clearPersistedState,
  flushStateSave,
  initStorage,
  loadState,
  startStorageSync,
  stopStorageSync,
} from "./core/storage.js";

import {
  createChatbotAnalyticsObserver,
} from "./core/analytics.js?v=conv-h3.22";

import {
  isConversationResetCommand,
} from "./core/conversation-reset.js";

import {
  SUPPORT_CHOICE,
  SUPPORT_OFFER_MARKER,
  supportChoiceFromQuickReply,
  shouldFinalizeFeedbackConversation,
} from "./core/conversation-lifecycle.js?v=conv-h3.25.1";

import {
  buildNavigationHandoff,
  shouldDismissTrailingDiagnosticQuestion,
} from "./core/navigation-handoff.js?v=conv-h3.23.1";


import {
  applyDiagnosticPrefillToForm,
  buildDiagnosticPrefillFromState,
  isDiagnosticStartAction,
} from "./core/diagnostic-prefill.js?v=conv-h3.23.1";

import {
  detectReducedMotion,
  mountChatShell,
  mountLauncher,
} from "./ui/ui.js?v=mob-h1.1";

import {
  removeTypingIndicator,
  renderConversationState,
  renderResponseInteractions,
  renderTypingIndicator,
  resetConversationComposer,
} from "./ui/conversation-renderer.js?v=conv-h3.22";


/**
 * ============================================================
 * CONSTANTES PÚBLICAS
 * ============================================================
 */

export const CHATBOT_GLOBAL_KEY =
  "__VICTOR_CHATBOT__";

export const CHATBOT_ROOT_ID =
  chatbotConfig?.dom?.rootId ??
  "victor-chatbot-root";

export const CHATBOT_STYLES_ID =
  "victor-chatbot-styles";

const SUPPORT_PAGE_URL =
  new URL(
    "../../apoya.html",
    import.meta.url,
  ).href;

/**
 * MOB-H2 — En dispositivos táctiles no enfocamos automáticamente
 * el composer al abrir el panel. Así el teclado virtual solo aparece
 * cuando el visitante toca explícitamente el campo de escritura.
 */
export function shouldAutoFocusComposerOnLauncher({
  windowRef = globalThis.window,
} = {}) {
  const viewportWidth =
    Number(windowRef?.innerWidth);

  const maxTouchPoints =
    Number(
      windowRef?.navigator
        ?.maxTouchPoints,
    );

  const isNarrowViewport =
    Number.isFinite(viewportWidth) &&
    viewportWidth > 0 &&
    viewportWidth <= 640;

  const hasTouchInput =
    Number.isFinite(maxTouchPoints) &&
    maxTouchPoints > 0;

  return !(
    isNarrowViewport ||
    hasTouchInput
  );
}

/**
 * MOB-H2.1 — En móvil/táctil, después de enviar un mensaje
 * dejamos de mantener el foco en el composer. El teclado virtual
 * debe cerrarse mientras el asistente responde y solo volver a
 * abrirse si el visitante toca explícitamente el campo.
 */
export function shouldDismissComposerKeyboardAfterSubmit({
  windowRef = globalThis.window,
} = {}) {
  return !shouldAutoFocusComposerOnLauncher({
    windowRef,
  });
}

export const CHATBOT_EVENTS =
  Object.freeze({
    READY:
      "victor-chatbot:ready",

    LAUNCHER_ACTIVATE:
      "victor-chatbot:launcher-activate",

    CORE_READY:
      "victor-chatbot:core-ready",

    CORE_ERROR:
      "victor-chatbot:core-error",

    PAGE_CONTEXT_CHANGED:
      "victor-chatbot:page-context-changed",

    TURN_PROCESSED:
      "victor-chatbot:turn-processed",

    INTERACTION_EXECUTED:
      "victor-chatbot:interaction-executed",

    FEEDBACK_REQUESTED:
      "victor-chatbot:feedback-requested",

    CONVERSATION_RESET:
      "victor-chatbot:conversation-reset",

    CONVERSATION_RESET_REQUESTED:
      "victor-chatbot:conversation-reset-requested",
  });


/**
 * ============================================================
 * LAZY CORE
 * ============================================================
 *
 * Estos módulos no se descargan/evalúan durante
 * el arranque ligero.
 *
 * Se cargan cuando el usuario interactúe
 * realmente con el asistente.
 */

const CORE_MODULE_LOADERS =
  Object.freeze({
    nlu:
      () =>
        import(
          "./core/nlu.js"
        ),

    entities:
      () =>
        import(
          "./core/entities.js"
        ),

    dialogueManager:
      () =>
        import(
          "./core/dialogue-manager.js?v=conv-h3.25.1"
        ),

    actions:
      () =>
        import(
          "./core/actions.js?v=mob-h1.1"
        ),

    intents:
      () =>
        import(
          "./data/intents.js"
        ),

    knowledge:
      () =>
        import(
          "./data/knowledge.js"
        ),

    policies:
      () =>
        import(
          "./data/policies.js"
        ),

    responses:
      () =>
        import(
          "./data/responses.js"
        ),
  });


let loadedCoreModules = null;

let coreLoadPromise = null;


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalizeOptionalString(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized === ""
    ? null
    : normalized;
}


function decodePathSafely(
  pathname,
) {
  const rawPath =
    typeof pathname === "string"
      ? pathname
      : "/";

  try {
    return decodeURIComponent(
      rawPath,
    );
  } catch {
    return rawPath;
  }
}


function normalizePathname(
  pathname,
) {
  let path =
    decodePathSafely(
      pathname,
    );

  if (
    typeof path !== "string" ||
    path.trim() === ""
  ) {
    return "/";
  }

  path =
    path
      .trim()
      .replace(
        /\/{2,}/g,
        "/",
      );

  if (!path.startsWith("/")) {
    path =
      `/${path}`;
  }

  return path;
}


function extractFilename(
  pathname,
) {
  const cleanPath =
    pathname.split("?")[0]
      .split("#")[0];

  const segments =
    cleanPath
      .split("/")
      .filter(Boolean);

  if (
    segments.length === 0 ||
    cleanPath.endsWith("/")
  ) {
    return "index.html";
  }

  return (
    segments[
      segments.length - 1
    ] || "index.html"
  );
}


function extractStem(
  filename,
) {
  return filename.replace(
    /\.html?$/i,
    "",
  );
}


function normalizeHashSection(
  hash,
) {
  if (
    typeof hash !== "string"
  ) {
    return null;
  }

  let value =
    hash.replace(
      /^#/,
      "",
    );

  try {
    value =
      decodeURIComponent(
        value,
      );
  } catch {
    // Conservamos el valor original.
  }

  value =
    value.trim();

  return value === ""
    ? null
    : value;
}


/**
 * ============================================================
 * PAGE CONTEXT
 * ============================================================
 */

function inferPageFromPath(
  pathname,
) {
  const normalizedPath =
    normalizePathname(
      pathname,
    );

  const lowerPath =
    normalizedPath
      .toLowerCase();

  const filename =
    extractFilename(
      lowerPath,
    );

  const stem =
    extractStem(
      filename,
    );

  /**
   * Cualquier HTML dentro de /projects/
   * se considera proyecto.
   *
   * Esto permite que proyectos futuros
   * funcionen sin ampliar este switch.
   */
  if (
    lowerPath.includes(
      "/projects/",
    )
  ) {
    return {
      pageId: stem,
      pageType: "project",
      section: "projects",
      projectId: stem,
      solutionId: null,
      serviceId: null,
    };
  }

  switch (filename) {
    case "index.html":
      return {
        pageId: "home",
        pageType: "home",
        section: "home",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    case "soluciones.html":
      return {
        pageId: "soluciones",
        pageType: "solutions",
        section: "solutions",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    case "diagnostico.html":
      return {
        pageId: "diagnostico",
        pageType: "diagnostic",
        section: "diagnostic",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    case "apoya.html":
      return {
        pageId: "apoya",
        pageType: "support",
        section: "support",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    case "privacidad.html":
      return {
        pageId: "privacidad",
        pageType: "legal",
        section: "legal",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    case "cookies.html":
      return {
        pageId: "cookies",
        pageType: "legal",
        section: "legal",
        projectId: null,
        solutionId: null,
        serviceId: null,
      };

    default:
      return {
        pageId:
          stem || "unknown",

        pageType:
          "page",

        section:
          stem || null,

        projectId: null,
        solutionId: null,
        serviceId: null,
      };
  }
}


/**
 * Detecta la página real.
 *
 * Prioridad:
 *
 * 1. data-* explícitos del body;
 * 2. URL / pathname;
 * 3. defaults defensivos.
 *
 * Así podremos añadir metadata explícita
 * sin depender siempre de nombres de fichero.
 */
export function detectPageContext({
  documentRef =
    globalThis.document,

  locationRef =
    globalThis.location,
} = {}) {
  if (
    !documentRef
  ) {
    throw new TypeError(
      "detectPageContext() requires a document",
    );
  }

  const pathname =
    normalizePathname(
      locationRef?.pathname ??
        "/",
    );

  const inferred =
    inferPageFromPath(
      pathname,
    );

  const bodyDataset =
    documentRef.body
      ?.dataset ??
    {};

  const documentLanguage =
    normalizeOptionalString(
      documentRef.documentElement
        ?.lang,
    );

  const locale =
    normalizeOptionalString(
      bodyDataset.locale,
    ) ??
    documentLanguage ??
    "es";

  const hashSection =
    normalizeHashSection(
      locationRef?.hash,
    );

  /**
   * Los data-* tienen prioridad.
   */
  const pageId =
    normalizeOptionalString(
      bodyDataset.pageId,
    ) ??
    inferred.pageId;

  const pageType =
    normalizeOptionalString(
      bodyDataset.pageType,
    ) ??
    inferred.pageType;

  const section =
    normalizeOptionalString(
      bodyDataset.pageSection,
    ) ??
    hashSection ??
    inferred.section;

  const projectId =
    normalizeOptionalString(
      bodyDataset.projectId,
    ) ??
    inferred.projectId;

  const solutionId =
    normalizeOptionalString(
      bodyDataset.solutionId,
    ) ??
    inferred.solutionId;

  const serviceId =
    normalizeOptionalString(
      bodyDataset.serviceId,
    ) ??
    inferred.serviceId;

  const title =
    normalizeOptionalString(
      documentRef.title,
    );

  return {
    path:
      pathname,

    pageId,

    pageType,

    section,

    locale,

    title,

    projectId,

    solutionId,

    serviceId,
  };
}


/**
 * API pública coherente con el diseño
 * original del bootstrap.
 */
export function getPageContext() {
  return getState()
    .page.current;
}


/**
 * ============================================================
 * ROOT ÚNICO
 * ============================================================
 */

export function ensureChatbotRoot({
  documentRef =
    globalThis.document,
} = {}) {
  if (
    !documentRef ||
    typeof documentRef
      .createElement !== "function"
  ) {
    throw new TypeError(
      "ensureChatbotRoot() requires a DOM document",
    );
  }

  const selector =
    `#${CHATBOT_ROOT_ID}`;

  const matches =
    typeof documentRef
      .querySelectorAll ===
      "function"
      ? Array.from(
          documentRef
            .querySelectorAll(
              selector,
            ),
        )
      : [];

  let root =
    matches[0] ??
    documentRef.getElementById?.(
      CHATBOT_ROOT_ID,
    ) ??
    null;

  let created = false;

  if (!root) {
    root =
      documentRef.createElement(
        "div",
      );

    root.id =
      CHATBOT_ROOT_ID;

    root.setAttribute(
      "data-vg-chatbot-root",
      "",
    );

    const host =
      documentRef.body ??
      documentRef.documentElement;

    if (
      !host ||
      typeof host.appendChild !==
        "function"
    ) {
      throw new Error(
        "Unable to mount chatbot root",
      );
    }

    host.appendChild(
      root,
    );

    created = true;
  } else {
    root.setAttribute(
      "data-vg-chatbot-root",
      "",
    );
  }

  /**
   * Si por error existen varios roots,
   * conservamos el primero y eliminamos
   * únicamente los duplicados con nuestro
   * ID reservado.
   */
  let removedDuplicates = 0;

  for (
    const duplicate
    of matches.slice(1)
  ) {
    if (
      duplicate?.parentNode &&
      typeof duplicate.parentNode
        .removeChild === "function"
    ) {
      duplicate.parentNode
        .removeChild(
          duplicate,
        );

      removedDuplicates += 1;
    }
  }

  return {
    root,
    created,
    reused:
      !created,
    removedDuplicates,
  };
}


/**
 * ============================================================
 * CSS
 * ============================================================
 *
 * No obligamos a cada HTML a conocer
 * dónde está chatbot.css.
 *
 * import.meta.url resuelve correctamente:
 * - localhost;
 * - GitHub Pages;
 * - subcarpetas /projects/;
 * - repo publicado bajo /victorguzman/.
 */

export function ensureChatbotStylesheet({
  documentRef =
    globalThis.document,
} = {}) {
  if (
    !documentRef ||
    typeof documentRef
      .createElement !== "function"
  ) {
    throw new TypeError(
      "ensureChatbotStylesheet() requires a DOM document",
    );
  }

  const href =
    new URL(
      "./chatbot.css",
      import.meta.url,
    ).href;

  const existing =
    documentRef.getElementById?.(
      CHATBOT_STYLES_ID,
    ) ??
    null;

  if (existing) {
    existing.setAttribute(
      "rel",
      "stylesheet",
    );

    existing.setAttribute(
      "href",
      href,
    );

    return {
      element:
        existing,

      href,

      created: false,
      reused: true,
    };
  }

  const link =
    documentRef.createElement(
      "link",
    );

  link.id =
    CHATBOT_STYLES_ID;

  link.setAttribute(
    "rel",
    "stylesheet",
  );

  link.setAttribute(
    "href",
    href,
  );

  link.setAttribute(
    "data-vg-chatbot-styles",
    "",
  );

  const host =
    documentRef.head ??
    documentRef.documentElement;

  if (
    !host ||
    typeof host.appendChild !==
      "function"
  ) {
    throw new Error(
      "Unable to mount chatbot stylesheet",
    );
  }

  host.appendChild(
    link,
  );

  return {
    element:
      link,

    href,

    created: true,
    reused: false,
  };
}


/**
 * ============================================================
 * EVENTOS
 * ============================================================
 */

function dispatchChatbotEvent({
  documentRef,
  windowRef,
  type,
  detail = {},
}) {
  if (
    !documentRef ||
    typeof documentRef
      .dispatchEvent !==
      "function"
  ) {
    return false;
  }

  const CustomEventConstructor =
    windowRef?.CustomEvent ??
    globalThis.CustomEvent;

  if (
    typeof CustomEventConstructor !==
      "function"
  ) {
    return false;
  }

  try {
    documentRef.dispatchEvent(
      new CustomEventConstructor(
        type,
        {
          detail,
        },
      ),
    );

    return true;
  } catch {
    return false;
  }
}


/**
 * ============================================================
 * BOOTSTRAP STATE HELPERS
 * ============================================================
 */

function updateBootstrapState(
  patch,
  source,
) {
  return updateState(
    (draft) => {
      Object.assign(
        draft.bootstrap,
        patch,
      );
    },
    {
      source,
    },
  );
}


function updateReducedMotionState(
  reducedMotion,
) {
  const current =
    getState();

  if (
    current.ui.reducedMotion ===
    reducedMotion
  ) {
    return current;
  }

  return updateState(
    (draft) => {
      draft.ui.reducedMotion =
        reducedMotion;
    },
    {
      source:
        "ui:set_reduced_motion",
    },
  );
}


function recordBootstrapError(
  code,
) {
  return updateState(
    (draft) => {
      draft.errors.count += 1;

      draft.errors.lastError = {
        code,
        occurredAt:
          new Date()
            .toISOString(),
      };
    },
    {
      source:
        "bootstrap:record_error",
    },
  );
}


/**
 * ============================================================
 * LAZY LOAD DEL CORE
 * ============================================================
 */

export async function ensureCoreLoaded() {
  /**
   * Los módulos ya están en memoria.
   */
  if (loadedCoreModules) {
    const current =
      getState();

    if (
      !current.bootstrap.coreLoaded ||
      current.bootstrap.coreLoading
    ) {
      updateBootstrapState(
        {
          coreLoaded: true,
          coreLoading: false,
        },
        "bootstrap:core_reuse",
      );
    }

    return loadedCoreModules;
  }

  /**
   * Ya existe una carga en curso.
   */
  if (coreLoadPromise) {
    return coreLoadPromise;
  }

  updateBootstrapState(
    {
      coreLoading: true,
      coreLoaded: false,
    },
    "bootstrap:core_loading",
  );

  coreLoadPromise =
    Promise.all(
      Object.entries(
        CORE_MODULE_LOADERS,
      ).map(
        async (
          [
            moduleName,
            loader,
          ],
        ) => {
          const moduleNamespace =
            await loader();

          return [
            moduleName,
            moduleNamespace,
          ];
        },
      ),
    )
      .then(
        (entries) => {
          loadedCoreModules =
            Object.freeze(
              Object.fromEntries(
                entries,
              ),
            );

          updateBootstrapState(
            {
              coreLoading: false,
              coreLoaded: true,
              status:
                BOOTSTRAP_STATUS.READY,
            },
            "bootstrap:core_ready",
          );

          return loadedCoreModules;
        },
      )
      .catch(
        (error) => {
          updateBootstrapState(
            {
              coreLoading: false,
              coreLoaded: false,
              status:
                BOOTSTRAP_STATUS.FAILED,
            },
            "bootstrap:core_failed",
          );

          recordBootstrapError(
            "CORE_LOAD_FAILED",
          );

          coreLoadPromise =
            null;

          throw error;
        },
      );

  return coreLoadPromise;
}


/**
 * ============================================================
 * RESTORE
 * ============================================================
 */

export function restoreSession({
  now = Date.now(),
} = {}) {
  return loadState({
    now,
    clearInvalid: true,
  });
}


/**
 * ============================================================
 * REDUCED MOTION REACTIVO
 * ============================================================
 */

function bindReducedMotion({
  windowRef,
  launcherController,
  shellController,
}) {
  if (
    !windowRef ||
    typeof windowRef.matchMedia !==
      "function"
  ) {
    return () => {};
  }

  let mediaQuery;

  try {
    mediaQuery =
      windowRef.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
  } catch {
    return () => {};
  }

  const handleChange =
    (event) => {
      const reduced =
        Boolean(
          event?.matches,
        );

      updateReducedMotionState(
        reduced,
      );

      launcherController
        ?.setReducedMotion?.(
          reduced,
        );
      shellController
        ?.setReducedMotion?.(
          reduced,
        );
    };

  if (
    typeof mediaQuery
      .addEventListener ===
      "function"
  ) {
    mediaQuery.addEventListener(
      "change",
      handleChange,
    );

    return () => {
      mediaQuery.removeEventListener?.(
        "change",
        handleChange,
      );
    };
  }

  /**
   * Compatibilidad con navegadores antiguos.
   */
  if (
    typeof mediaQuery.addListener ===
      "function"
  ) {
    mediaQuery.addListener(
      handleChange,
    );

    return () => {
      mediaQuery.removeListener?.(
        handleChange,
      );
    };
  }

  return () => {};
}


/**
 * ============================================================
 * BOOTSTRAP PRINCIPAL
 * ============================================================
 */

export function bootstrapChatbot({
  documentRef =
    globalThis.document,

  windowRef =
    globalThis.window,

  storageRef =
    undefined,

  startPersistence =
    true,

  bindPagehide =
    true,
} = {}) {
  if (
    !documentRef ||
    !windowRef
  ) {
    throw new TypeError(
      "bootstrapChatbot() requires window and document",
    );
  }

  /**
   * ========================================================
   * SINGLETON
   * ========================================================
   */

  const existingInstance =
    windowRef[
      CHATBOT_GLOBAL_KEY
    ];

  if (
    existingInstance &&
    typeof existingInstance ===
      "object"
  ) {
    return existingInstance;
  }

  let api = null;

  let destroyed = false;

  let unbindReducedMotion =
    () => {};

  let handleNavigation =
    null;

  let rootResult =
    null;

  let launcherController =
    null;

  let shellController =
    null;

  let actionRouter =
    null;

  let analyticsObserver =
    null;

  let visualTurnToken =
    0;

  let speakingTimer =
    null;

  let feedbackCompletionTimer =
    null;

  try {
    /**
     * ------------------------------------------------------
     * STYLES
     * ------------------------------------------------------
     */

    const stylesheet =
      ensureChatbotStylesheet({
        documentRef,
      });

    /**
     * ------------------------------------------------------
     * ROOT
     * ------------------------------------------------------
     */

    rootResult =
      ensureChatbotRoot({
        documentRef,
      });

    /**
     * ------------------------------------------------------
     * STORAGE
     * ------------------------------------------------------
     */

    const storageStatus =
      storageRef !== undefined
        ? initStorage({
            storage:
              storageRef,
          })
        : initStorage();

    /**
     * ------------------------------------------------------
     * RESTORE
     * ------------------------------------------------------
     */

    const restoreResult =
      restoreSession();

    /**
     * ------------------------------------------------------
     * CONTEXTO REAL DE PÁGINA
     *
     * Siempre después del restore.
     *
     * Nunca confiamos en page.current
     * de una página anterior.
     * ------------------------------------------------------
     */

    const initialPageContext =
      detectPageContext({
        documentRef,
        locationRef:
          windowRef.location,
      });

    setPageContext(
      initialPageContext,
    );

    /**
     * ------------------------------------------------------
     * REDUCED MOTION
     * ------------------------------------------------------
     */

    const reducedMotion =
      detectReducedMotion({
        windowRef,
      });

    updateReducedMotionState(
      reducedMotion,
    );

    /**
     * ------------------------------------------------------
     * LAUNCHER
     * ------------------------------------------------------
     */

    launcherController =
      mountLauncher({
        root:
          rootResult.root,

        documentRef,

        windowRef,

        onActivate:
          () => {
            /**
             * Launcher:
             *
             * cerrado → abrir
             * abierto → cerrar
             */
            const open =
              shellController
                ?.toggle({
                  persist: true,
                  focus:
                    shouldAutoFocusComposerOnLauncher({
                      windowRef,
                    }),
                });


            dispatchChatbotEvent({
              documentRef,
              windowRef,

              type:
                CHATBOT_EVENTS
                  .LAUNCHER_ACTIVATE,

              detail: {
                open,

                pageContext:
                  getPageContext(),
              },
            });


            /**
             * Solo necesitamos cargar el core
             * cuando el usuario abre realmente.
             */
            if (open) {
              ensureCoreLoaded()
                .then(
                  () => {
                    dispatchChatbotEvent({
                      documentRef,
                      windowRef,

                      type:
                        CHATBOT_EVENTS
                          .CORE_READY,
                    });
                  },
                )
                .catch(
                  () => {
                    dispatchChatbotEvent({
                      documentRef,
                      windowRef,

                      type:
                        CHATBOT_EVENTS
                          .CORE_ERROR,
                    });
                  },
                );
            }
          },
      });

    /**
   * ------------------------------------------------------
   * CHAT SHELL
   * ------------------------------------------------------
   */

  function setComposerBusy(
    busy,
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
      input.disabled =
        busy === true;
    }

    if (submitButton) {
      submitButton.disabled =
        busy === true ||
        !(
          input
            ?.value
            ?.trim?.()
        );
    }
  }


  function clearSpeakingTimer() {
    if (speakingTimer === null) {
      return;
    }

    const clearTimer =
      windowRef?.clearTimeout ??
      globalThis.clearTimeout;

    clearTimer?.(
      speakingTimer,
    );

    speakingTimer =
      null;
  }


  function syncConversationVisualState({
    typing,
    avatarState,
  }) {
    const current =
      getState();

    if (
      typeof typing === "boolean" &&
      current.ui.typing !== typing
    ) {
      setUiTyping(
        typing,
      );
    }

    if (
      avatarState &&
      current.ui.avatarState !==
        avatarState
    ) {
      setUiAvatarState(
        avatarState,
      );
    }

    if (avatarState) {
      shellController
        ?.setAvatarState?.(
          avatarState,
        );

      launcherController
        ?.setAvatarState?.(
          avatarState,
        );
    }
  }


  function cancelConversationVisuals({
    invalidateTurn = true,
  } = {}) {
    if (invalidateTurn) {
      visualTurnToken += 1;
    }

    clearSpeakingTimer();

    removeTypingIndicator({
      shellController,
    });

    syncConversationVisualState({
      typing: false,
      avatarState:
        AVATAR_STATUS.IDLE,
    });
  }


  function buildPendingTurnState(
    beforeMessageCount,
  ) {
    const current =
      getState();

    const messages =
      current
        .conversation
        .messages;

    const earlier =
      messages.slice(
        0,
        beforeMessageCount,
      );

    const currentUserMessages =
      messages
        .slice(
          beforeMessageCount,
        )
        .filter(
          (message) =>
            message?.role ===
              "user",
        );

    return {
      ...current,
      conversation: {
        ...current.conversation,
        messages: [
          ...earlier,
          ...currentUserMessages,
        ],
      },
    };
  }


  function responseTextLength(
    result,
  ) {
    return (
      result
        ?.response
        ?.messages ??
      []
    ).reduce(
      (total, message) =>
        total +
        (
          typeof message?.text ===
            "string"
            ? message.text.length
            : 0
        ),
      0,
    );
  }


  function typingDelayMs(
    result,
  ) {
    if (
      getState().ui.reducedMotion
    ) {
      return 260;
    }

    const length =
      responseTextLength(
        result,
      );

    return Math.min(
      950,
      Math.max(
        650,
        650 +
          Math.round(
            Math.min(
              length,
              150,
            ) * 2,
          ),
      ),
    );
  }


  function waitForUi(
    milliseconds,
  ) {
    const setTimer =
      windowRef?.setTimeout ??
      globalThis.setTimeout;

    return new Promise(
      (resolve) => {
        setTimer(
          resolve,
          milliseconds,
        );
      },
    );
  }


  function scheduleAvatarIdle(
    turnToken,
  ) {
    clearSpeakingTimer();

    const setTimer =
      windowRef?.setTimeout ??
      globalThis.setTimeout;

    const holdMs =
      getState().ui.reducedMotion
        ? 180
        : 720;

    speakingTimer =
      setTimer(
        () => {
          speakingTimer =
            null;

          if (
            destroyed ||
            visualTurnToken !==
              turnToken
          ) {
            return;
          }

          syncConversationVisualState({
            typing: false,
            avatarState:
              AVATAR_STATUS.IDLE,
          });
        },
        holdMs,
      );
  }


  function dispatchInteractionResult(
    result,
  ) {
    dispatchChatbotEvent({
      documentRef,
      windowRef,
      type:
        CHATBOT_EVENTS
          .INTERACTION_EXECUTED,
      detail: {
        status:
          result?.status ??
          null,
        interactionId:
          result
            ?.interactionId ??
          null,
        interactionType:
          result
            ?.interactionType ??
          null,
        destination:
          result
            ?.destination ??
          null,
      },
    });
  }


  function dismissTrailingDiagnosticQuestion(
    action,
  ) {
    if (
      !shouldDismissTrailingDiagnosticQuestion(
        getState(),
        action?.id,
      )
    ) {
      return false;
    }

    updateState(
      (draft) => {
        draft.conversation.messages =
          draft.conversation.messages.slice(
            0,
            -1,
          );

        draft.ui.activeQuickReplies = [];
      },
      {
        source:
          "navigation:dismiss_pending_question",
      },
    );

    return true;
  }


  function getActionRouter(
    core,
  ) {
    if (actionRouter) {
      return actionRouter;
    }

    const createRouter =
      core
        ?.actions
        ?.createActionRouter;

    /*
     * Fail-soft:
     * el Action Router mejora la UI, pero nunca debe impedir
     * que el chat de texto siga funcionando.
     *
     * Este guardarraíl protege también frente a una caché de
     * navegador antigua que aún conserve actions.js vacío.
     */
    if (
      typeof createRouter !==
        "function"
    ) {
      debugLog(
        "Action Router unavailable; continuing without response interactions",
      );

      return null;
    }

    try {
      actionRouter =
        createRouter({
          windowRef,
          documentRef,

          submitText:
            (text) =>
              processUserTurn(
                text,
                {
                  source:
                    "quick-reply",
                },
              ),

          beforeInternalNavigation:
            ({ action }) => {
              /*
               * MOB-H3 — El visitante ha elegido una acción que
               * muestra contenido de la página. Conservamos toda la
               * conversación, pero llegamos al destino con el panel
               * minimizado para no tapar el contenido.
               */
              shellController
                ?.close?.({
                  persist: true,
                  focus: false,
                });

              /*
               * CONV-H3.23: justo antes de navegar al diagnóstico,
               * convertimos únicamente el estado estructurado conocido
               * en campos pre-rellenables. No se toca consentimiento ni
               * se inventan datos que el visitante no haya aportado.
               */
              if (isDiagnosticStartAction(action)) {
                updateDiagnosticFields(
                  buildDiagnosticPrefillFromState(
                    getState(),
                  ),
                );
              }

              /*
               * NAV-H1.2: si el visitante abandona el mini-diagnóstico
               * mediante “Analizar mi caso”, la última pregunta del
               * asistente deja de estar pendiente. Conservamos el resto
               * del historial y retiramos únicamente esa pregunta antes
               * de persistir y navegar.
               */
              dismissTrailingDiagnosticQuestion(
                action,
              );

              /*
               * NAV-H1: persistimos inmediatamente lastAction y el
               * resto del contexto antes de cambiar de documento.
               * Sin este flush, la navegación puede ganar la carrera
               * al debounce normal de sessionStorage.
               */
              if (startPersistence) {
                flushStateSave();
              }
            },

          onFeedbackRequested:
            ({ action }) => {
              dispatchChatbotEvent({
                documentRef,
                windowRef,
                type:
                  CHATBOT_EVENTS
                    .FEEDBACK_REQUESTED,
                detail: {
                  actionId:
                    action?.id ??
                    null,
                },
              });
            },
        });
    } catch (error) {
      debugLog(
        "Action Router initialization failed; continuing without response interactions",
        error,
      );

      actionRouter =
        null;
    }

    return actionRouter;
  }


  function handleSupportOfferQuickReply(
    quickReply,
  ) {
    const choice =
      supportChoiceFromQuickReply(
        quickReply,
      );

    if (!choice) {
      return false;
    }

    /*
     * Registramos únicamente una interacción estructurada. El texto
     * visible de la conversación nunca se envía a Analytics.
     */
    dispatchInteractionResult({
      status:
        "submitted",
      interactionId:
        quickReply?.id ?? null,
      interactionType:
        quickReply?.kind ?? null,
      destination:
        choice === SUPPORT_CHOICE.ACCEPT
          ? SUPPORT_PAGE_URL
          : null,
    });

    shellController
      ?.close?.({
        persist: true,
        focus: false,
      });

    performConversationReset({
      source:
        choice === SUPPORT_CHOICE.ACCEPT
          ? "support_accepted"
          : "support_declined",
    });

    flushStateSave();

    if (
      choice === SUPPORT_CHOICE.ACCEPT &&
      typeof windowRef?.location?.assign === "function"
    ) {
      windowRef.location.assign(
        SUPPORT_PAGE_URL,
      );
    }

    return true;
  }


  function renderTurnResult(
    result,
    core,
    {
      forceScrollToEnd =
        false,
      smoothScroll =
        false,
    } = {},
  ) {
    renderConversationState({
      shellController,
      state:
        getState(),
      documentRef,
      forceScrollToEnd,
      smoothScroll,
    });

    const router =
      getActionRouter(
        core,
      );

    if (!router) {
      return;
    }

    try {
      renderResponseInteractions({
        shellController,
        response:
          result?.response ??
          null,
        documentRef,

        onQuickReply:
          (quickReply) => {
            if (
              handleSupportOfferQuickReply(
                quickReply,
              )
            ) {
              return;
            }

            const interactionResult =
              router
                .executeQuickReply(
                  quickReply,
                );

            dispatchInteractionResult(
              interactionResult,
            );
          },

        onAction:
          (action) => {
            const interactionResult =
              router
                .executeAction(
                  action,
                );

            dispatchInteractionResult(
              interactionResult,
            );
          },
      });
    } catch (error) {
      debugLog(
        "Response interactions failed to render; text conversation remains available",
        error,
      );
    }
  }


  function performConversationReset({
    source =
      "ui",
  } = {}) {
    cancelConversationVisuals();

    resetConversation();

    resetConversationComposer(
      shellController,
    );

    renderConversationState({
      shellController,

      state:
        getState(),

      documentRef,
    });

    /*
     * UX-H0: el reset debe sobrevivir a la navegación inmediatamente.
     * No borramos la sesión completa: persistimos el nuevo estado vacío.
     */
    flushStateSave();

    dispatchChatbotEvent({
      documentRef,
      windowRef,
      type:
        CHATBOT_EVENTS
          .CONVERSATION_RESET,
      detail: {
        source,
      },
    });

    return Object.freeze({
      reset:
        true,
      source,
    });
  }


  function scheduleFeedbackCompletion(
    result,
  ) {
    if (
      !shouldFinalizeFeedbackConversation(
        result,
      )
    ) {
      return;
    }

    if (feedbackCompletionTimer) {
      (windowRef.clearTimeout ?? globalThis.clearTimeout)?.(
        feedbackCompletionTimer,
      );
    }

    const setTimer =
      windowRef.setTimeout ??
      globalThis.setTimeout;

    if (typeof setTimer !== "function") {
      return;
    }

    feedbackCompletionTimer =
      setTimer(
        () => {
          feedbackCompletionTimer =
            null;

          if (destroyed) {
            return;
          }

          performConversationReset({
            source:
              "feedback_complete",
          });

          shellController
            ?.close?.({
              focus: false,
            });

          flushStateSave();
        },
        2800,
      );
  }


  function processUserTurn(
    text,
    {
      source =
        "composer",
    } = {},
  ) {
    if (
      isConversationResetCommand(
        text,
      )
    ) {
      resetConversationComposer(
        shellController,
      );

      shellController
        ?.requestResetConfirmation?.({
          focus:
            true,
        });

      dispatchChatbotEvent({
        documentRef,
        windowRef,
        type:
          CHATBOT_EVENTS
            .CONVERSATION_RESET_REQUESTED,
        detail: {
          source,
        },
      });

      return Promise.resolve(
        Object.freeze({
          resetRequested:
            true,
        }),
      );
    }

    dispatchChatbotEvent({
      documentRef,
      windowRef,
      type:
        "victor-chatbot:composer-submit",
      detail: {
        text,
        source,
      },
    });

    setComposerBusy(
      true,
    );

    /*
     * MOB-H2.1 — Al enviar desde móvil/táctil ocultamos el teclado
     * inmediatamente. El asistente puede responder y mostrar opciones
     * sin que media pantalla quede ocupada por el teclado virtual.
     */
    if (
      shouldDismissComposerKeyboardAfterSubmit({
        windowRef,
      })
    ) {
      shellController
        ?.input
        ?.blur?.();
    }

    clearSpeakingTimer();

    const turnToken =
      ++visualTurnToken;

    const beforeMessageCount =
      getState()
        .conversation
        .messages
        .length;

    return ensureCoreLoaded()
      .then(
        async (core) => {
          const result =
            core
              .dialogueManager
              .processDialogueTurn({
                userText:
                  text,
              });

          if (
            visualTurnToken !==
              turnToken
          ) {
            return result;
          }

          /*
           * El Dialogue Manager ya ha calculado la respuesta y actualizado
           * state, pero durante el pequeño intervalo de escritura mostramos
           * únicamente el mensaje nuevo del visitante.
           */
          renderConversationState({
            shellController,
            state:
              buildPendingTurnState(
                beforeMessageCount,
              ),
            documentRef,
            forceScrollToEnd:
              true,
            smoothScroll:
              !getState().ui
                .reducedMotion,
          });

          resetConversationComposer(
            shellController,
          );

          syncConversationVisualState({
            typing: true,
            avatarState:
              AVATAR_STATUS.THINKING,
          });

          renderTypingIndicator({
            shellController,
            documentRef,
            forceScrollToEnd:
              true,
            smooth:
              !getState().ui
                .reducedMotion,
          });

          await waitForUi(
            typingDelayMs(
              result,
            ),
          );

          if (
            visualTurnToken !==
              turnToken
          ) {
            return result;
          }

          removeTypingIndicator({
            shellController,
          });

          syncConversationVisualState({
            typing: false,
            avatarState:
              AVATAR_STATUS.SPEAKING,
          });

          renderTurnResult(
            result,
            core,
            {
              forceScrollToEnd:
                true,
              smoothScroll:
                !getState().ui
                  .reducedMotion,
            },
          );

          const supportOfferVisible =
            Array.isArray(
              result?.response?.quickReplies,
            ) &&
            result.response.quickReplies.some(
              (quickReply) =>
                supportChoiceFromQuickReply(
                  quickReply,
                ) !== null,
            );

          if (
            supportOfferVisible &&
            !hasAskedQuestion(
              SUPPORT_OFFER_MARKER,
            )
          ) {
            markQuestionAsked(
              SUPPORT_OFFER_MARKER,
            );

            if (startPersistence) {
              flushStateSave();
            }
          }

          dispatchChatbotEvent({
            documentRef,
            windowRef,
            type:
              CHATBOT_EVENTS
                .TURN_PROCESSED,
            detail: {
              source,

              route:
                result
                  ?.decision
                  ?.route ??
                null,

              intent:
                result
                  ?.response
                  ?.analytics
                  ?.intent ??
                result
                  ?.decision
                  ?.intent ??
                null,

              responseId:
                result
                  ?.response
                  ?.id ??
                null,

              outcome:
                result
                  ?.response
                  ?.outcome ??
                null,

              responseKind:
                result
                  ?.response
                  ?.kind ??
                result
                  ?.response
                  ?.analytics
                  ?.responseKind ??
                null,

              confidenceBucket:
                result
                  ?.response
                  ?.analytics
                  ?.confidenceBucket ??
                result
                  ?.decision
                  ?.analysis
                  ?.confidenceBucket ??
                null,

              fallbackLevel:
                result
                  ?.response
                  ?.analytics
                  ?.fallbackLevel ??
                result
                  ?.decision
                  ?.analysis
                  ?.fallbackLevel ??
                null,

              feedbackRating:
                result
                  ?.decision
                  ?.metadata
                  ?.feedbackRating ??
                null,
            },
          });

          scheduleFeedbackCompletion(
            result,
          );

          scheduleAvatarIdle(
            turnToken,
          );

          return result;
        },
      )
      .catch(
        (error) => {
          debugLog(
            "Chat turn processing failed",
            error,
          );

          if (
            visualTurnToken ===
              turnToken
          ) {
            cancelConversationVisuals({
              invalidateTurn:
                false,
            });
            appendMessage({ role: MESSAGE_ROLE.ASSISTANT, type: MESSAGE_TYPE.TEXT,
              text: "Ha ocurrido un problema al preparar la respuesta. Puedes volver a intentarlo o hacer otra pregunta." });
            renderConversationState({ shellController, state: getState(), documentRef, forceScrollToEnd: true });
          }

          dispatchChatbotEvent({
            documentRef,
            windowRef,
            type:
              CHATBOT_EVENTS
                .CORE_ERROR,
          });

          return null;
        },
      )
      .finally(
        () => {
          setComposerBusy(
            false,
          );

          const input =
            shellController
              ?.input ??
            null;

          if (
            shellController
              ?.isOpen?.() &&
            shouldAutoFocusComposerOnLauncher({
              windowRef,
            }) &&
            typeof input?.focus ===
              "function"
          ) {
            input.focus();
          }
        },
      );
  }


  shellController =
    mountChatShell({
      root:
        rootResult.root,

      launcherController,

      documentRef,

      windowRef,

      onComposerSubmit:
        ({ text }) =>
          processUserTurn(
            text,
          ),

      onResetConversation:
        ({ source }) =>
          performConversationReset({
            source,
          }),
    });


    /*
     * MOB-H3.1 — La opción «Completar diagnóstico» del estado
     * inicial es un enlace directo del template y no pasa por el
     * Action Router. La interceptamos aquí para aplicar exactamente
     * la misma UX que al resto de navegaciones: cerrar el panel,
     * persistir el estado y después navegar.
     */
    const openingDiagnosticLink =
      shellController
        ?.panel
        ?.querySelector?.(
          ".vg-chatbot-empty-options a[href]",
        ) ?? null;

    if (openingDiagnosticLink) {
      openingDiagnosticLink.addEventListener(
        "click",
        (event) => {
          const destination =
            openingDiagnosticLink.href;

          if (!destination) {
            return;
          }

          event.preventDefault();

          shellController
            ?.close?.({
              persist: true,
              focus: false,
            });

          if (startPersistence) {
            flushStateSave();
          }

          windowRef.location.assign(
            destination,
          );
        },
      );
    }


    /*
     * Si sessionStorage restauró una conversación anterior,
     * la reflejamos visualmente inmediatamente después de montar
     * el shell.
     */
    renderConversationState({
      shellController,

      state:
        getState(),

      documentRef,

      forceScrollToEnd:
        true,
    });

    /**
     * ------------------------------------------------------
     * OBS-H1 — ANALYTICS DEL CHATBOT
     * ------------------------------------------------------
     *
     * El observador escucha únicamente señales estructuradas.
     * La capa de Analytics aplica consentimiento + allowlist
     * y nunca recibe el texto libre de la conversación.
     */
    if (
      chatbotConfig?.analytics
        ?.enabled === true
    ) {
      analyticsObserver =
        createChatbotAnalyticsObserver({
          documentRef,
          windowRef,
          getState,
          subscribe,
          hasAnalyticsFlagBeenSent,
          markAnalyticsFlagSent,
          analyticsFlags:
            ANALYTICS_FLAG,
        });

      analyticsObserver.start();
    }


  launcherController
    .setReducedMotion(
      reducedMotion,
    );


  shellController
    .setReducedMotion(
      reducedMotion,
    );
    launcherController
      .setReducedMotion(
        reducedMotion,
      );

    /**
     * ------------------------------------------------------
     * NAVIGATION / HASH
     * ------------------------------------------------------
     */

    const syncPageContext =
      () => {
        if (destroyed) {
          return null;
        }

        const nextContext =
          detectPageContext({
            documentRef,
            locationRef:
              windowRef.location,
          });

        const before =
          getPageContext();

        const result =
          setPageContext(
            nextContext,
          );

        const after =
          result.page.current;

        if (
          JSON.stringify(
            before,
          ) !==
          JSON.stringify(
            after,
          )
        ) {
          dispatchChatbotEvent({
            documentRef,
            windowRef,
            type:
              CHATBOT_EVENTS
                .PAGE_CONTEXT_CHANGED,

            detail: {
              pageContext:
                after,
            },
          });
        }

        return after;
      };

    handleNavigation =
      () => {
        syncPageContext();
      };

    if (
      typeof windowRef
        .addEventListener ===
      "function"
    ) {
      windowRef.addEventListener(
        "hashchange",
        handleNavigation,
      );

      windowRef.addEventListener(
        "popstate",
        handleNavigation,
      );
    }

    /**
     * ------------------------------------------------------
     * PREFERS-REDUCED-MOTION LIVE
     * ------------------------------------------------------
     */

    unbindReducedMotion =
      bindReducedMotion({
        windowRef,
        launcherController,
        shellController,
      });

    /**
     * ------------------------------------------------------
     * BOOTSTRAP READY
     *
     * Lo hacemos ANTES de activar storage sync
     * para no guardar escrituras técnicas
     * innecesarias durante el bootstrap.
     * ------------------------------------------------------
     */

    updateBootstrapState(
      {
        status:
          BOOTSTRAP_STATUS.READY,

        shellMounted:
          true,

        restoredFromSession:
          Boolean(
            restoreResult.restored,
          ),
      },
      "bootstrap:ready",
    );

    /**
     * ------------------------------------------------------
     * STORAGE SYNC
     * ------------------------------------------------------
     */

    if (startPersistence) {
      startStorageSync({
        bindPagehide,
      });
    }

    /**
     * ------------------------------------------------------
     * NAV-H1 — HANDOFF CONTEXTUAL DE NAVEGACIÓN
     * ------------------------------------------------------
     *
     * Si el visitante llega al diagnóstico desde una acción del
     * chatbot, explicamos por qué está ahí, qué debe hacer y qué
     * ocurrirá después. El marcador se consume para no repetir el
     * mensaje en una recarga posterior.
     */

    const navigationHandoff =
      buildNavigationHandoff(
        getState(),
      );

    if (navigationHandoff) {
      /*
       * CONV-H3.23: el prefill solo se aplica cuando el handoff prueba
       * que la llegada procede del chatbot. Una apertura manual de
       * diagnostico.html nunca entra aquí. Los valores ya escritos en
       * el formulario tampoco se sobrescriben.
       */
      applyDiagnosticPrefillToForm({
        documentRef,
        fields:
          getState().diagnostic.fields,
        allowPrefill: true,
      });

      /*
       * NAV-H1.3: saneamos también el estado RESTAURADO en la
       * página de diagnóstico. Esto evita que una pregunta del
       * mini-diagnóstico reaparezca si la navegación anterior
       * llegó a persistirla antes de abandonar el documento.
       *
       * El guardarraíl sigue siendo conservador: solo actúa si
       * hay un handoff diagnóstico válido y el último mensaje
       * restaurado es una pregunta del asistente.
       */
      dismissTrailingDiagnosticQuestion({
        id:
          navigationHandoff
            .sourceActionId,
      });

      for (
        const text
        of navigationHandoff.messages
      ) {
        appendMessage({
          role:
            MESSAGE_ROLE.ASSISTANT,
          type:
            MESSAGE_TYPE.NOTICE,
          text,
        });
      }

      setLastAction(null);

      if (startPersistence) {
        flushStateSave();
      }

      renderConversationState({
        shellController,
        state:
          getState(),
        documentRef,
        forceScrollToEnd:
          true,
      });

      /*
       * NAV-H1.1: las acciones de llegada se renderizan con el
       * mismo Action Router que el resto del chatbot. De esta forma
       * "Completar diagnóstico" y "Reservar reunión" no son
       * enlaces especiales ni duplican lógica operativa.
       */
      if (
        Array.isArray(
          navigationHandoff.actions,
        ) &&
        navigationHandoff.actions.length > 0
      ) {
        ensureCoreLoaded()
          .then(
            (core) => {
              if (destroyed) {
                return;
              }

              renderTurnResult(
                {
                  response: {
                    quickReplies: [],
                    actions:
                      navigationHandoff.actions,
                  },
                },
                core,
                {
                  forceScrollToEnd:
                    true,
                },
              );
            },
          )
          .catch(
            (error) => {
              debugLog(
                "Navigation handoff actions failed to render; explanatory messages remain available",
                error,
              );
            },
          );
      }
    }

    /**
     * ------------------------------------------------------
     * API PÚBLICA
     * ------------------------------------------------------
     */

    api =
      Object.freeze({
        version:
          CHATBOT_VERSION,

        root:
          rootResult.root,

        launcher:
          launcherController,

        shell:
          shellController,

        storageStatus,

        restoreResult,

        getState,

        getPageContext,

        syncPageContext,

        ensureCoreLoaded,

        /**
         * I0.7 lo utilizará para saber
         * si el core está listo.
         */
        isCoreLoaded() {
          return Boolean(
            getState()
              .bootstrap
              .coreLoaded,
          );
        },

        /**
         * Desmontaje limpio.
         */
        destroy({
          clearPersisted =
            false,

          flush =
            true,
        } = {}) {
          if (destroyed) {
            return;
          }

          destroyed = true;

          if (feedbackCompletionTimer) {
            (windowRef.clearTimeout ?? globalThis.clearTimeout)?.(
              feedbackCompletionTimer,
            );

            feedbackCompletionTimer =
              null;
          }

          cancelConversationVisuals();

          /**
           * Primero paramos persistencia.
           */
          stopStorageSync({
            flush,
          });

          /**
           * Listeners navegación.
           */
          if (
            handleNavigation &&
            typeof windowRef
              .removeEventListener ===
              "function"
          ) {
            windowRef
              .removeEventListener(
                "hashchange",
                handleNavigation,
              );

            windowRef
              .removeEventListener(
                "popstate",
                handleNavigation,
              );
          }

          /**
           * Media query.
           */
          unbindReducedMotion();

          /**
           * OBS-H1 Analytics.
           */
          analyticsObserver
            ?.destroy?.();

          analyticsObserver =
            null;

          /**
           * Launcher.
           */
          shellController
            ?.destroy?.();

          launcherController
            ?.destroy?.();

          /**
           * Root creado por nosotros.
           */
          if (
            rootResult.created &&
            rootResult.root
              ?.parentNode &&
            typeof rootResult.root
              .parentNode
              .removeChild ===
              "function"
          ) {
            rootResult.root
              .parentNode
              .removeChild(
                rootResult.root,
              );
          }

          /**
           * Persistencia opcional.
           */
          if (
            clearPersisted
          ) {
            clearPersistedState();
          }

          /**
           * Estado técnico.
           */
          updateBootstrapState(
            {
              status:
                BOOTSTRAP_STATUS
                  .INITIALIZING,

              shellMounted:
                false,

              coreLoading:
                false,

              coreLoaded:
                false,
            },
            "bootstrap:destroy",
          );

          /**
           * Singleton.
           */
          if (
            windowRef[
              CHATBOT_GLOBAL_KEY
            ] === api
          ) {
            try {
              delete windowRef[
                CHATBOT_GLOBAL_KEY
              ];
            } catch {
              windowRef[
                CHATBOT_GLOBAL_KEY
              ] = undefined;
            }
          }

          debugLog(
            "chatbot bootstrap destroyed",
          );
        },
      });

    /**
     * Publicamos el singleton solamente
     * cuando ya tenemos una instancia válida.
     */
    windowRef[
      CHATBOT_GLOBAL_KEY
    ] =
      api;

    debugLog(
      "chatbot bootstrap ready",
      {
        pageContext:
          getPageContext(),

        restored:
          restoreResult.restored,

        storageMode:
          storageStatus.mode,
      },
    );

    dispatchChatbotEvent({
      documentRef,
      windowRef,
      type:
        CHATBOT_EVENTS.READY,

      detail: {
        pageContext:
          getPageContext(),

        restored:
          Boolean(
            restoreResult.restored,
          ),
      },
    });

    return api;
  } catch (error) {
    /**
     * Nunca guardamos stack/error completo
     * dentro del state.
     */
    try {
      updateBootstrapState(
        {
          status:
            BOOTSTRAP_STATUS.FAILED,

          shellMounted:
            false,
        },
        "bootstrap:failed",
      );

      recordBootstrapError(
        "BOOTSTRAP_FAILED",
      );
    } catch {
      // No ocultamos el error original.
    }

    debugLog(
      "chatbot bootstrap failed",
      error,
    );

    throw error;
  }
}


/**
 * ============================================================
 * AUTOBOOTSTRAP
 * ============================================================
 *
 * type="module" ya es defer por naturaleza,
 * pero seguimos siendo defensivos por si
 * cambia dónde se incluye el script.
 */

function autoBootstrap() {
  const documentRef =
    globalThis.document;

  const windowRef =
    globalThis.window;

  if (
    !documentRef ||
    !windowRef
  ) {
    return;
  }

  /**
   * Kill switch útil para tests/manual debug.
   */
  if (
    windowRef
      .__VICTOR_CHATBOT_DISABLE_AUTOBOOTSTRAP__ ===
    true
  ) {
    return;
  }

  const run =
    () => {
      try {
        bootstrapChatbot({
          documentRef,
          windowRef,
        });
      } catch (error) {
        debugLog(
          "automatic chatbot bootstrap failed",
          error,
        );
      }
    };

  if (
    documentRef.readyState ===
      "loading" &&
    typeof documentRef
      .addEventListener ===
      "function"
  ) {
    documentRef.addEventListener(
      "DOMContentLoaded",
      run,
      {
        once: true,
      },
    );

    return;
  }

  /**
   * Evitamos bloquear la evaluación
   * inmediata del módulo.
   */
  if (
    typeof globalThis
      .queueMicrotask ===
      "function"
  ) {
    globalThis.queueMicrotask(
      run,
    );
  } else {
    Promise.resolve()
      .then(run);
  }
}


autoBootstrap();