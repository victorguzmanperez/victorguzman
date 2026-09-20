/**
 * Asistente de Víctor
 * UI base.
 *
 * HITO I0.5:
 * - launcher;
 * - avatar;
 * - activación;
 * - lifecycle limpio.
 *
 * La ventana de chat llegará en I0.7.
 */

import {
  debugLog,
} from "../core/config.js";

import {
  AVATAR_STATUS,
  getState,
  setUiOpen,
} from "../core/state.js";

import {
  createAvatarController,
} from "./avatar.js";

import {
  CHATBOT_SHELL_SELECTOR,
  CHATBOT_UI_SELECTOR,
  createChatPanelTemplate,
  createLauncherTemplate,
  updateLauncherExpandedState,
} from "./templates.js";

/**
 * Devuelve true cuando el navegador solicita
 * reducir movimiento.
 *
 * No lo persistimos.
 * La preferencia del sistema es la fuente
 * de verdad en cada documento.
 */
export function detectReducedMotion({
  windowRef =
    globalThis.window,
} = {}) {
  if (
    !windowRef ||
    typeof windowRef
      .matchMedia !== "function"
  ) {
    return false;
  }

  try {
    return Boolean(
      windowRef.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
    );
  } catch {
    return false;
  }
}

/**
 * Monta exclusivamente el launcher.
 *
 * Es idempotente:
 * si ya existe dentro del root,
 * devuelve la instancia existente.
 */
export function mountLauncher({
  root,
  documentRef =
    globalThis.document,
  windowRef =
    globalThis.window,
  onActivate = null,
} = {}) {
  if (
    !root ||
    typeof root
      .querySelector !== "function" ||
    typeof root
      .appendChild !== "function"
  ) {
    throw new TypeError(
      "mountLauncher() requires a root element",
    );
  }

  if (
    onActivate !== null &&
    typeof onActivate !==
      "function"
  ) {
    throw new TypeError(
      "onActivate must be null or a function",
    );
  }

  const existingLauncher =
    root.querySelector(
      CHATBOT_UI_SELECTOR.launcher,
    );

  /**
   * I0.6 será responsable de impedir
   * raíces duplicadas globales.
   *
   * Aquí evitamos duplicar el launcher
   * dentro de una raíz válida.
   */
  if (existingLauncher) {
    return {
      launcher:
        existingLauncher,

      reused: true,

      avatarController:
        null,

      setExpanded(
        expanded,
      ) {
        return updateLauncherExpandedState(
          existingLauncher,
          expanded,
        );
      },

      destroy() {
        /**
         * No eliminamos un launcher
         * que esta llamada no creó.
         */
      },
    };
  }

  const template =
    createLauncherTemplate({
      documentRef,
      expanded: false,
    });

  const reducedMotion =
    detectReducedMotion({
      windowRef,
    });

  const avatarController =
    createAvatarController({
      container:
        template.avatarContainer,

      image:
        template.avatarImage,

      initialState:
        AVATAR_STATUS.IDLE,

      reducedMotion,
    });

  let destroyed = false;

  const handleActivate =
    (event) => {
      if (destroyed) {
        return;
      }

      if (onActivate) {
        onActivate({
          event,
          launcher:
            template.launcher,
        });
      }
    };

  template.launcher
    .addEventListener(
      "click",
      handleActivate,
    );

  root.appendChild(
    template.launcher,
  );

  debugLog(
    "chatbot launcher mounted",
    {
      reducedMotion,
    },
  );

  function setExpanded(
    expanded,
  ) {
    if (destroyed) {
      return null;
    }

    return updateLauncherExpandedState(
      template.launcher,
      expanded,
    );
  }

  function setAvatarState(
    avatarState,
  ) {
    if (destroyed) {
      return null;
    }

    return avatarController
      .setState(
        avatarState,
      );
  }

  function setReducedMotion(
    nextReducedMotion,
  ) {
    if (destroyed) {
      return null;
    }

    return avatarController
      .setReducedMotion(
        nextReducedMotion,
      );
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    template.launcher
      .removeEventListener(
        "click",
        handleActivate,
      );

    avatarController.destroy();

    if (
      template.launcher
        .parentNode === root
    ) {
      root.removeChild(
        template.launcher,
      );
    }

    debugLog(
      "chatbot launcher destroyed",
    );
  }

  return Object.freeze({
    launcher:
      template.launcher,

    reused: false,

    avatarController,

    setExpanded,
    setAvatarState,
    setReducedMotion,
    destroy,
  });
}
/**
 * ============================================================
 * CHAT SHELL CONTROLLER
 * HITO I0.7
 * ============================================================
 */

export function mountChatShell({
  root,

  launcherController,

  documentRef =
    globalThis.document,

  windowRef =
    globalThis.window,

  onComposerSubmit = null,

  onResetConversation = null,
} = {}) {
  if (
    !root ||
    typeof root.appendChild !==
      "function"
  ) {
    throw new TypeError(
      "mountChatShell() requires a root element",
    );
  }

  if (
    onComposerSubmit !== null &&
    typeof onComposerSubmit !==
      "function"
  ) {
    throw new TypeError(
      "onComposerSubmit must be null or a function",
    );
  }

  if (
    onResetConversation !== null &&
    typeof onResetConversation !==
      "function"
  ) {
    throw new TypeError(
      "onResetConversation must be null or a function",
    );
  }


  /**
   * Idempotencia.
   */
  const existingPanel =
    root.querySelector?.(
      CHATBOT_SHELL_SELECTOR.panel,
    );

  if (existingPanel) {
    return {
      panel:
        existingPanel,

      reused:
        true,

      isOpen() {
        return (
          existingPanel.getAttribute(
            "data-open",
          ) === "true"
        );
      },

      destroy() {},
    };
  }


  const template =
    createChatPanelTemplate({
      documentRef,
    });


  const headerAvatarController =
    createAvatarController({
      container:
        template.headerAvatar,

      image:
        template.headerAvatarImage,

      initialState:
        AVATAR_STATUS.IDLE,

      reducedMotion:
        detectReducedMotion({
          windowRef,
        }),
    });


  let destroyed =
    false;

  let previouslyFocusedElement =
    null;

  let resetConfirmationOpen =
    false;

  let resetPreviousFocus =
    null;


  /**
   * ========================================================
   * OPEN/CLOSE
   * ========================================================
   */

  function applyOpenState(
    open,
    {
      persist = true,
      focus = true,
    } = {},
  ) {
    if (destroyed) {
      return null;
    }

    if (
      typeof open !== "boolean"
    ) {
      throw new TypeError(
        "open must be a boolean",
      );
    }


    const currentOpen =
      template.panel.getAttribute(
        "data-open",
      ) === "true";


    if (
      currentOpen === open
    ) {
      return open;
    }


    if (open) {
      previouslyFocusedElement =
        documentRef.activeElement ??
        launcherController?.launcher ??
        null;

      template.panel.hidden =
        false;

      template.panel.setAttribute(
        "aria-hidden",
        "false",
      );

      template.panel.setAttribute(
        "data-open",
        "true",
      );

      launcherController
        ?.setExpanded?.(
          true,
        );


      if (persist) {
        setUiOpen(
          true,
        );
      }


      if (
        focus &&
        typeof template.input.focus ===
          "function"
      ) {
        /**
         * Esperamos un frame para que el
         * panel sea visible antes de enfocar.
         */
        const focusInput =
          () => {
            if (
              !destroyed &&
              !template.panel.hidden
            ) {
              template.input.focus();
            }
          };


        if (
          typeof windowRef
            ?.requestAnimationFrame ===
          "function"
        ) {
          windowRef.requestAnimationFrame(
            focusInput,
          );
        } else {
          queueMicrotask(
            focusInput,
          );
        }
      }

      return true;
    }


    template.panel.setAttribute(
      "aria-hidden",
      "true",
    );

    template.panel.setAttribute(
      "data-open",
      "false",
    );

    template.panel.hidden =
      true;


    launcherController
      ?.setExpanded?.(
        false,
      );


    if (persist) {
      setUiOpen(
        false,
      );
    }


    if (focus) {
      const focusTarget =
        previouslyFocusedElement ??
        launcherController?.launcher;


      if (
        typeof focusTarget?.focus ===
        "function"
      ) {
        focusTarget.focus();
      }
    }


    return false;
  }


  function open(
    options = {},
  ) {
    return applyOpenState(
      true,
      options,
    );
  }


  function close(
    options = {},
  ) {
    return applyOpenState(
      false,
      options,
    );
  }


  function toggle(
    options = {},
  ) {
    const currentlyOpen =
      template.panel.getAttribute(
        "data-open",
      ) === "true";

    return applyOpenState(
      !currentlyOpen,
      options,
    );
  }


  function isOpen() {
    return (
      template.panel.getAttribute(
        "data-open",
      ) === "true"
    );
  }


  /**
   * ========================================================
   * COMPOSER
   * ========================================================
   */

  function refreshSubmitState() {
    const value =
      template.input.value
        ?.trim?.() ??
      "";

    template.submitButton.disabled =
      value.length === 0;
  }


  function handleInput() {
    refreshSubmitState();
  }


  function handleComposerSubmit(
    event,
  ) {
    event.preventDefault?.();

    const text =
      template.input.value
        ?.trim?.() ??
      "";

    if (text === "") {
      refreshSubmitState();

      return;
    }


    if (onComposerSubmit) {
      onComposerSubmit({
        text,

        input:
          template.input,

        panel:
          template.panel,

        event,
      });
    }
  }


  /**
   * Enter envía.
   * Shift+Enter permite nueva línea.
   */
  function handleInputKeydown(
    event,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault?.();

      if (
        !template.submitButton.disabled
      ) {
        if (
          typeof template.composer
            .requestSubmit ===
          "function"
        ) {
          template.composer
            .requestSubmit();
        } else {
          handleComposerSubmit(
            event,
          );
        }
      }
    }
  }


  /**
   * ========================================================
   * RESET CONFIRMATION
   * ========================================================
   */

  function isResetConfirmationOpen() {
    return (
      resetConfirmationOpen ===
      true
    );
  }


  function requestResetConfirmation({
    focus = true,
  } = {}) {
    if (
      destroyed ||
      !isOpen()
    ) {
      return false;
    }

    if (
      resetConfirmationOpen
    ) {
      return true;
    }

    resetPreviousFocus =
      documentRef.activeElement ??
      template.resetButton ??
      null;

    resetConfirmationOpen =
      true;

    template.resetConfirmation.hidden =
      false;

    template.resetConfirmation.setAttribute(
      "aria-hidden",
      "false",
    );

    if (
      focus &&
      typeof template.resetCancelButton
        ?.focus ===
        "function"
    ) {
      template.resetCancelButton.focus();
    }

    return true;
  }


  function cancelResetConfirmation({
    focus = true,
  } = {}) {
    if (
      !resetConfirmationOpen
    ) {
      return false;
    }

    resetConfirmationOpen =
      false;

    template.resetConfirmation.setAttribute(
      "aria-hidden",
      "true",
    );

    template.resetConfirmation.hidden =
      true;

    if (focus) {
      const focusTarget =
        resetPreviousFocus ??
        template.resetButton;

      if (
        typeof focusTarget?.focus ===
          "function"
      ) {
        focusTarget.focus();
      }
    }

    resetPreviousFocus =
      null;

    return true;
  }


  function handleResetRequestClick() {
    requestResetConfirmation({
      focus: true,
    });
  }


  function handleResetCancelClick() {
    cancelResetConfirmation({
      focus: true,
    });
  }


  function handleResetConfirmClick() {
    cancelResetConfirmation({
      focus: false,
    });

    onResetConversation?.({
      source:
        "header-reset",
    });

    if (
      isOpen() &&
      typeof template.input.focus ===
        "function"
    ) {
      template.input.focus();
    }
  }


  /**
   * ========================================================
   * ESCAPE
   * ========================================================
   */

  function handleDocumentKeydown(
    event,
  ) {
    if (
      event.key !== "Escape" ||
      !isOpen()
    ) {
      return;
    }

    event.preventDefault?.();

    if (
      isResetConfirmationOpen()
    ) {
      cancelResetConfirmation({
        focus: true,
      });

      return;
    }

    close({
      persist: true,
      focus: true,
    });
  }


  function handleCloseClick() {
    close({
      persist: true,
      focus: true,
    });
  }


  template.resetButton
    .addEventListener(
      "click",
      handleResetRequestClick,
    );


  template.resetCancelButton
    .addEventListener(
      "click",
      handleResetCancelClick,
    );


  template.resetConfirmButton
    .addEventListener(
      "click",
      handleResetConfirmClick,
    );


  template.closeButton
    .addEventListener(
      "click",
      handleCloseClick,
    );


  template.input
    .addEventListener(
      "input",
      handleInput,
    );


  template.input
    .addEventListener(
      "keydown",
      handleInputKeydown,
    );


  template.composer
    .addEventListener(
      "submit",
      handleComposerSubmit,
    );


  documentRef.addEventListener?.(
    "keydown",
    handleDocumentKeydown,
  );


  root.appendChild(
    template.panel,
  );


  /**
   * ========================================================
   * RESTAURACIÓN
   * ========================================================
   *
   * Una sesión restaurada puede venir abierta.
   *
   * No robamos foco al cargar una página nueva.
   */
  const restoredOpen =
    Boolean(
      getState().ui.isOpen,
    );


  applyOpenState(
    restoredOpen,
    {
      persist: false,
      focus: false,
    },
  );


  refreshSubmitState();


  debugLog(
    "chatbot shell mounted",
    {
      restoredOpen,
    },
  );


  function setAvatarState(
    avatarState,
  ) {
    return headerAvatarController
      .setState(
        avatarState,
      );
  }


  function setReducedMotion(
    reducedMotion,
  ) {
    return headerAvatarController
      .setReducedMotion(
        reducedMotion,
      );
  }


  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed =
      true;


    template.resetButton
      .removeEventListener(
        "click",
        handleResetRequestClick,
      );


    template.resetCancelButton
      .removeEventListener(
        "click",
        handleResetCancelClick,
      );


    template.resetConfirmButton
      .removeEventListener(
        "click",
        handleResetConfirmClick,
      );


    template.closeButton
      .removeEventListener(
        "click",
        handleCloseClick,
      );


    template.input
      .removeEventListener(
        "input",
        handleInput,
      );


    template.input
      .removeEventListener(
        "keydown",
        handleInputKeydown,
      );


    template.composer
      .removeEventListener(
        "submit",
        handleComposerSubmit,
      );


    documentRef.removeEventListener?.(
      "keydown",
      handleDocumentKeydown,
    );


    headerAvatarController
      .destroy();


    if (
      template.panel.parentNode ===
        root
    ) {
      root.removeChild(
        template.panel,
      );
    }


    debugLog(
      "chatbot shell destroyed",
    );
  }


  return Object.freeze({
    panel:
      template.panel,

    input:
      template.input,

    messages:
      template.messages,

    emptyState:
      template.emptyState,

    resetButton:
      template.resetButton,

    resetConfirmation:
      template.resetConfirmation,

    resetCancelButton:
      template.resetCancelButton,

    resetConfirmButton:
      template.resetConfirmButton,

    submitButton:
      template.submitButton,

    reused:
      false,

    open,
    close,
    toggle,
    isOpen,
    requestResetConfirmation,
    cancelResetConfirmation,
    isResetConfirmationOpen,
    setAvatarState,
    setReducedMotion,
    destroy,
  });
}