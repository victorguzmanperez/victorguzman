/**
 * Asistente de Víctor
 * Templates DOM seguros.
 *
 * PREPROD.1.11.33 — Floating launcher
 * HITO I0.5
 *
 * Regla:
 * nunca insertar texto del usuario mediante innerHTML.
 */

import {
  chatbotConfig,
} from "../core/config.js";

/**
 * Selectores/data attributes estables.
 *
 * Evitamos depender todavía de bootstrap.js.
 */
export const CHATBOT_UI_SELECTOR =
  Object.freeze({
    launcher:
      "[data-vg-chatbot-launcher]",

    avatar:
      "[data-vg-chatbot-avatar]",

    avatarImage:
      "[data-vg-chatbot-avatar-image]",

    onlineStatus:
      "[data-vg-chatbot-online-status]",

    tooltip:
      "[data-vg-chatbot-launcher-tooltip]",
  });

export const CHATBOT_UI_ID =
  Object.freeze({
    launcher:
      "victor-chatbot-launcher",

    launcherTooltip:
      "victor-chatbot-launcher-tooltip",
  });

function getAssistantName() {
  return (
    chatbotConfig?.identity?.name ??
    chatbotConfig?.name ??
    "Asistente de Víctor"
  );
}

/**
 * Propiedades accesibles puras para poder
 * verificarlas también sin DOM.
 */
export function getLauncherAccessibilityProps(
  expanded = false,
) {
  if (
    typeof expanded !== "boolean"
  ) {
    throw new TypeError(
      "expanded must be a boolean",
    );
  }

  const assistantName =
    getAssistantName();

  return {
    type: "button",

    ariaLabel:
      expanded
        ? `Cerrar ${assistantName}`
        : `Abrir ${assistantName}`,

    ariaHasPopup:
      "dialog",

    ariaExpanded:
      String(expanded),

    ariaDescribedBy:
      CHATBOT_UI_ID
        .launcherTooltip,
  };
}

/**
 * Crea el avatar base.
 */
export function createAvatarTemplate({
  documentRef =
    globalThis.document,
} = {}) {
  if (
    !documentRef ||
    typeof documentRef
      .createElement !== "function"
  ) {
    throw new TypeError(
      "A DOM document is required",
    );
  }

  const container =
    documentRef.createElement(
      "span",
    );

  container.className =
    "vg-chatbot-avatar";

  container.setAttribute(
    "data-vg-chatbot-avatar",
    "",
  );

  /**
   * Fallback CSS si la imagen falla.
   */
  container.setAttribute(
    "data-avatar-fallback-label",
    "AV",
  );

  const image =
    documentRef.createElement(
      "img",
    );

  image.className =
    "vg-chatbot-avatar__image";

  image.setAttribute(
    "data-vg-chatbot-avatar-image",
    "",
  );

  image.setAttribute(
    "alt",
    "",
  );

  image.setAttribute(
    "aria-hidden",
    "true",
  );

  image.setAttribute(
    "draggable",
    "false",
  );

  image.setAttribute(
    "decoding",
    "async",
  );

  container.appendChild(
    image,
  );

  return {
    container,
    image,
  };
}

/**
 * Crea el launcher flotante completo.
 */
export function createLauncherTemplate({
  documentRef =
    globalThis.document,
  expanded = false,
} = {}) {
  if (
    !documentRef ||
    typeof documentRef
      .createElement !== "function"
  ) {
    throw new TypeError(
      "A DOM document is required",
    );
  }

  const accessibility =
    getLauncherAccessibilityProps(
      expanded,
    );

  const launcher =
    documentRef.createElement(
      "button",
    );

  launcher.id =
    CHATBOT_UI_ID.launcher;

  launcher.className =
    "vg-chatbot-launcher";

  launcher.setAttribute(
    "data-vg-chatbot-launcher",
    "",
  );

  launcher.setAttribute(
    "type",
    accessibility.type,
  );

  launcher.setAttribute(
    "aria-label",
    accessibility.ariaLabel,
  );

  launcher.setAttribute(
    "aria-haspopup",
    accessibility.ariaHasPopup,
  );

  launcher.setAttribute(
    "aria-expanded",
    accessibility.ariaExpanded,
  );

  launcher.setAttribute(
    "aria-describedby",
    accessibility
      .ariaDescribedBy,
  );

  /**
   * El avatar es visual.
   * El nombre accesible está en el botón.
   */
  const {
    container:
      avatarContainer,
    image:
      avatarImage,
  } =
    createAvatarTemplate({
      documentRef,
    });

  const onlineStatus =
    documentRef.createElement(
      "span",
    );

  onlineStatus.className =
    "vg-chatbot-launcher__status";

  onlineStatus.setAttribute(
    "data-vg-chatbot-online-status",
    "",
  );

  onlineStatus.setAttribute(
    "aria-hidden",
    "true",
  );

  avatarContainer.appendChild(
    onlineStatus,
  );

  launcher.appendChild(
    avatarContainer,
  );

  /**
   * Tooltip real en DOM.
   * Es texto fijo seguro.
   */
  const tooltip =
    documentRef.createElement(
      "span",
    );

  tooltip.id =
    CHATBOT_UI_ID
      .launcherTooltip;

  tooltip.className =
    "vg-chatbot-launcher__tooltip";

  tooltip.setAttribute(
    "data-vg-chatbot-launcher-tooltip",
    "",
  );

  tooltip.setAttribute(
    "role",
    "tooltip",
  );

  tooltip.textContent =
    getAssistantName();

  launcher.appendChild(
    tooltip,
  );

  return {
    launcher,
    avatarContainer,
    avatarImage,
    onlineStatus,
    tooltip,
  };
}

/**
 * Actualiza únicamente atributos accesibles
 * relacionados con abierto/cerrado.
 */
export function updateLauncherExpandedState(
  launcher,
  expanded,
) {
  if (
    !launcher ||
    typeof launcher
      .setAttribute !== "function"
  ) {
    throw new TypeError(
      "launcher element is required",
    );
  }

  const accessibility =
    getLauncherAccessibilityProps(
      expanded,
    );

  launcher.setAttribute(
    "aria-expanded",
    accessibility.ariaExpanded,
  );

  launcher.setAttribute(
    "aria-label",
    accessibility.ariaLabel,
  );

  launcher.setAttribute(
    "data-expanded",
    String(expanded),
  );

  return accessibility;
}
/**
 * ============================================================
 * CHAT SHELL
 * HITO I0.7
 * ============================================================
 */

export const CHATBOT_SHELL_ID =
  Object.freeze({
    panel:
      "victor-chatbot-panel",

    title:
      "victor-chatbot-panel-title",

    description:
      "victor-chatbot-panel-description",

    messages:
      "victor-chatbot-messages",

    composer:
      "victor-chatbot-composer",

    input:
      "victor-chatbot-input",

    reset:
      "victor-chatbot-reset",

    resetConfirmation:
      "victor-chatbot-reset-confirmation",

    resetConfirmationTitle:
      "victor-chatbot-reset-confirmation-title",

    resetConfirmationDescription:
      "victor-chatbot-reset-confirmation-description",

    resetCancel:
      "victor-chatbot-reset-cancel",

    resetConfirm:
      "victor-chatbot-reset-confirm",

    close:
      "victor-chatbot-close",
  });


export const CHATBOT_SHELL_SELECTOR =
  Object.freeze({
    panel:
      "[data-vg-chatbot-panel]",

    reset:
      "[data-vg-chatbot-reset]",

    resetConfirmation:
      "[data-vg-chatbot-reset-confirmation]",

    resetCancel:
      "[data-vg-chatbot-reset-cancel]",

    resetConfirm:
      "[data-vg-chatbot-reset-confirm]",

    close:
      "[data-vg-chatbot-close]",

    messages:
      "[data-vg-chatbot-messages]",

    composer:
      "[data-vg-chatbot-composer]",

    input:
      "[data-vg-chatbot-input]",

    submit:
      "[data-vg-chatbot-submit]",

    emptyState:
      "[data-vg-chatbot-empty-state]",
  });


/**
 * Crea un icono SVG accesible sin usar innerHTML.
 */
function createSvgIcon(
  documentRef,
  {
    viewBox = "0 0 24 24",
    paths = [],
  } = {},
) {
  const namespace =
    "http://www.w3.org/2000/svg";

  const svg =
    documentRef.createElementNS
      ? documentRef.createElementNS(
          namespace,
          "svg",
        )
      : documentRef.createElement(
          "svg",
        );

  svg.setAttribute(
    "viewBox",
    viewBox,
  );

  svg.setAttribute(
    "aria-hidden",
    "true",
  );

  svg.setAttribute(
    "focusable",
    "false",
  );

  for (const pathDefinition of paths) {
    const path =
      documentRef.createElementNS
        ? documentRef.createElementNS(
            namespace,
            "path",
          )
        : documentRef.createElement(
            "path",
          );

    path.setAttribute(
      "d",
      pathDefinition,
    );

    svg.appendChild(
      path,
    );
  }

  return svg;
}


/**
 * Crea la ventana base del asistente.
 *
 * Todavía no renderiza mensajes conversacionales reales:
 * eso llegará con Dialogue Manager.
 */
export function createChatPanelTemplate({
  documentRef =
    globalThis.document,
} = {}) {
  if (
    !documentRef ||
    typeof documentRef.createElement !==
      "function"
  ) {
    throw new TypeError(
      "A DOM document is required",
    );
  }

  /**
   * PANEL
   */
  const panel =
    documentRef.createElement(
      "section",
    );

  panel.id =
    CHATBOT_SHELL_ID.panel;

  panel.className =
    "vg-chatbot-panel";

  panel.setAttribute(
    "data-vg-chatbot-panel",
    "",
  );

  panel.setAttribute(
    "role",
    "dialog",
  );

  panel.setAttribute(
    "aria-labelledby",
    CHATBOT_SHELL_ID.title,
  );

  panel.setAttribute(
    "aria-describedby",
    CHATBOT_SHELL_ID.description,
  );

  panel.setAttribute(
    "aria-hidden",
    "true",
  );

  panel.setAttribute(
    "data-open",
    "false",
  );

  panel.hidden = true;


  /**
   * HEADER
   */
  const header =
    documentRef.createElement(
      "header",
    );

  header.className =
    "vg-chatbot-panel__header";


  const headerIdentity =
    documentRef.createElement(
      "div",
    );

  headerIdentity.className =
    "vg-chatbot-panel__identity";


  const avatar =
    documentRef.createElement(
      "div",
    );

  avatar.className =
    "vg-chatbot-panel__avatar";

  avatar.setAttribute(
    "aria-hidden",
    "true",
  );


  const avatarImage =
    documentRef.createElement(
      "img",
    );

  avatarImage.className =
    "vg-chatbot-panel__avatar-image";

  avatarImage.setAttribute(
    "alt",
    "",
  );

  avatarImage.setAttribute(
    "aria-hidden",
    "true",
  );

  avatarImage.setAttribute(
    "draggable",
    "false",
  );

  avatar.appendChild(
    avatarImage,
  );


  const identityText =
    documentRef.createElement(
      "div",
    );

  identityText.className =
    "vg-chatbot-panel__identity-text";


  const title =
    documentRef.createElement(
      "h2",
    );

  title.id =
    CHATBOT_SHELL_ID.title;

  title.className =
    "vg-chatbot-panel__title";

  title.textContent =
    "Asistente de Víctor";


  const status =
    documentRef.createElement(
      "div",
    );

  status.className =
    "vg-chatbot-panel__status";


  const statusDot =
    documentRef.createElement(
      "span",
    );

  statusDot.className =
    "vg-chatbot-panel__status-dot";

  statusDot.setAttribute(
    "aria-hidden",
    "true",
  );


  const statusText =
    documentRef.createElement(
      "span",
    );

  statusText.textContent =
    "Disponible";


  status.appendChild(
    statusDot,
  );

  status.appendChild(
    statusText,
  );


  identityText.appendChild(
    title,
  );

  identityText.appendChild(
    status,
  );


  headerIdentity.appendChild(
    avatar,
  );

  headerIdentity.appendChild(
    identityText,
  );


  /**
   * HEADER ACTIONS
   */
  const headerActions =
    documentRef.createElement(
      "div",
    );

  headerActions.className =
    "vg-chatbot-panel__header-actions";


  /**
   * RESET CONVERSATION
   */
  const resetButton =
    documentRef.createElement(
      "button",
    );

  resetButton.id =
    CHATBOT_SHELL_ID.reset;

  resetButton.className =
    "vg-chatbot-panel__reset";

  resetButton.setAttribute(
    "data-vg-chatbot-reset",
    "",
  );

  resetButton.setAttribute(
    "type",
    "button",
  );

  resetButton.setAttribute(
    "aria-label",
    "Iniciar una nueva conversación",
  );

  resetButton.setAttribute(
    "title",
    "Nueva conversación",
  );

  resetButton.textContent =
    "↻";


  /**
   * CLOSE
   */
  const closeButton =
    documentRef.createElement(
      "button",
    );

  closeButton.id =
    CHATBOT_SHELL_ID.close;

  closeButton.className =
    "vg-chatbot-panel__close";

  closeButton.setAttribute(
    "data-vg-chatbot-close",
    "",
  );

  closeButton.setAttribute(
    "type",
    "button",
  );

  closeButton.setAttribute(
    "aria-label",
    "Cerrar asistente",
  );


  const closeIcon =
    createSvgIcon(
      documentRef,
      {
        paths: [
          "M6 6l12 12",
          "M18 6L6 18",
        ],
      },
    );

  closeButton.appendChild(
    closeIcon,
  );


  headerActions.appendChild(
    resetButton,
  );

  headerActions.appendChild(
    closeButton,
  );


  header.appendChild(
    headerIdentity,
  );

  header.appendChild(
    headerActions,
  );


  /**
   * DESCRIPCIÓN ACCESIBLE
   */
  const description =
    documentRef.createElement(
      "p",
    );

  description.id =
    CHATBOT_SHELL_ID.description;

  description.className =
    "vg-chatbot-sr-only";

  description.textContent =
    "Asistente digital del portfolio de Víctor Guzmán";


  /**
   * RESET CONFIRMATION
   *
   * Se mantiene dentro del panel y oculto hasta que el visitante
   * solicita una nueva conversación.
   */
  const resetConfirmation =
    documentRef.createElement(
      "div",
    );

  resetConfirmation.id =
    CHATBOT_SHELL_ID.resetConfirmation;

  resetConfirmation.className =
    "vg-chatbot-reset-confirmation";

  resetConfirmation.setAttribute(
    "data-vg-chatbot-reset-confirmation",
    "",
  );

  resetConfirmation.setAttribute(
    "role",
    "alertdialog",
  );

  resetConfirmation.setAttribute(
    "aria-modal",
    "true",
  );

  resetConfirmation.setAttribute(
    "aria-labelledby",
    CHATBOT_SHELL_ID.resetConfirmationTitle,
  );

  resetConfirmation.setAttribute(
    "aria-describedby",
    CHATBOT_SHELL_ID.resetConfirmationDescription,
  );

  resetConfirmation.setAttribute(
    "aria-hidden",
    "true",
  );

  resetConfirmation.hidden =
    true;


  const resetConfirmationCard =
    documentRef.createElement(
      "div",
    );

  resetConfirmationCard.className =
    "vg-chatbot-reset-confirmation__card";


  const resetConfirmationTitle =
    documentRef.createElement(
      "p",
    );

  resetConfirmationTitle.id =
    CHATBOT_SHELL_ID.resetConfirmationTitle;

  resetConfirmationTitle.className =
    "vg-chatbot-reset-confirmation__title";

  resetConfirmationTitle.textContent =
    "¿Iniciar una nueva conversación?";


  const resetConfirmationCopy =
    documentRef.createElement(
      "p",
    );

  resetConfirmationCopy.id =
    CHATBOT_SHELL_ID.resetConfirmationDescription;

  resetConfirmationCopy.className =
    "vg-chatbot-reset-confirmation__copy";

  resetConfirmationCopy.textContent =
    "Se borrará el historial actual del asistente y el diagnóstico parcial, pero el chat permanecerá abierto.";


  const resetConfirmationActions =
    documentRef.createElement(
      "div",
    );

  resetConfirmationActions.className =
    "vg-chatbot-reset-confirmation__actions";


  const resetCancelButton =
    documentRef.createElement(
      "button",
    );

  resetCancelButton.id =
    CHATBOT_SHELL_ID.resetCancel;

  resetCancelButton.className =
    "vg-chatbot-reset-confirmation__button vg-chatbot-reset-confirmation__button--secondary";

  resetCancelButton.setAttribute(
    "data-vg-chatbot-reset-cancel",
    "",
  );

  resetCancelButton.setAttribute(
    "type",
    "button",
  );

  resetCancelButton.textContent =
    "Cancelar";


  const resetConfirmButton =
    documentRef.createElement(
      "button",
    );

  resetConfirmButton.id =
    CHATBOT_SHELL_ID.resetConfirm;

  resetConfirmButton.className =
    "vg-chatbot-reset-confirmation__button vg-chatbot-reset-confirmation__button--primary";

  resetConfirmButton.setAttribute(
    "data-vg-chatbot-reset-confirm",
    "",
  );

  resetConfirmButton.setAttribute(
    "type",
    "button",
  );

  resetConfirmButton.textContent =
    "Nueva conversación";


  resetConfirmationActions.appendChild(
    resetCancelButton,
  );

  resetConfirmationActions.appendChild(
    resetConfirmButton,
  );

  resetConfirmationCard.appendChild(
    resetConfirmationTitle,
  );

  resetConfirmationCard.appendChild(
    resetConfirmationCopy,
  );

  resetConfirmationCard.appendChild(
    resetConfirmationActions,
  );

  resetConfirmation.appendChild(
    resetConfirmationCard,
  );


  /**
   * MESSAGES AREA
   */
  const messages =
    documentRef.createElement(
      "div",
    );

  messages.id =
    CHATBOT_SHELL_ID.messages;

  messages.className =
    "vg-chatbot-messages";

  messages.setAttribute(
    "data-vg-chatbot-messages",
    "",
  );

  messages.setAttribute(
    "role",
    "log",
  );

  messages.setAttribute(
    "aria-live",
    "polite",
  );

  messages.setAttribute(
    "aria-relevant",
    "additions text",
  );


  /**
   * Empty state visual.
   *
   * No cuenta todavía como mensaje conversacional.
   */
  const emptyState =
    documentRef.createElement(
      "div",
    );

  emptyState.className =
    "vg-chatbot-empty-state";

  emptyState.setAttribute(
    "data-vg-chatbot-empty-state",
    "",
  );


  const emptyEyebrow =
    documentRef.createElement(
      "span",
    );

  emptyEyebrow.className =
    "vg-chatbot-empty-state__eyebrow";

  emptyEyebrow.textContent =
    "DATOS · BI · AUTOMATIZACIÓN · IA";


  const emptyTitle =
    documentRef.createElement(
      "p",
    );

  emptyTitle.className =
    "vg-chatbot-empty-state__title";

  emptyTitle.textContent =
    "¿En qué te puedo ayudar?";


  const emptyCopy =
    documentRef.createElement(
      "p",
    );

  emptyCopy.className =
    "vg-chatbot-empty-state__copy";

  emptyCopy.textContent =
    "Puedes preguntarme por los proyectos, servicios y soluciones de Víctor o explicarme qué proceso quieres mejorar.";


  emptyState.appendChild(
    emptyEyebrow,
  );

  emptyState.appendChild(
    emptyTitle,
  );

  emptyState.appendChild(
    emptyCopy,
  );


  messages.appendChild(
    emptyState,
  );


  /**
   * COMPOSER
   */
  const composer =
    documentRef.createElement(
      "form",
    );

  composer.id =
    CHATBOT_SHELL_ID.composer;

  composer.className =
    "vg-chatbot-composer";

  composer.setAttribute(
    "data-vg-chatbot-composer",
    "",
  );


  const inputWrapper =
    documentRef.createElement(
      "div",
    );

  inputWrapper.className =
    "vg-chatbot-composer__field";


  const input =
    documentRef.createElement(
      "textarea",
    );

  input.id =
    CHATBOT_SHELL_ID.input;

  input.className =
    "vg-chatbot-composer__input";

  input.setAttribute(
    "data-vg-chatbot-input",
    "",
  );

  input.setAttribute(
    "rows",
    "1",
  );

  input.setAttribute(
    "maxlength",
    "1500",
  );

  input.setAttribute(
    "autocomplete",
    "off",
  );

  input.setAttribute(
    "placeholder",
    "Escribe tu mensaje…",
  );

  input.setAttribute(
    "aria-label",
    "Mensaje para el asistente",
  );


  const submitButton =
    documentRef.createElement(
      "button",
    );

  submitButton.className =
    "vg-chatbot-composer__submit";

  submitButton.setAttribute(
    "data-vg-chatbot-submit",
    "",
  );

  submitButton.setAttribute(
    "type",
    "submit",
  );

  submitButton.setAttribute(
    "aria-label",
    "Enviar mensaje",
  );

  submitButton.disabled =
    true;


  const sendIcon =
    createSvgIcon(
      documentRef,
      {
        paths: [
          "M4 4l16 8-16 8 3-8-3-8z",
          "M7 12h13",
        ],
      },
    );

  submitButton.appendChild(
    sendIcon,
  );


  inputWrapper.appendChild(
    input,
  );

  inputWrapper.appendChild(
    submitButton,
  );


  const composerNote =
    documentRef.createElement(
      "p",
    );

  composerNote.className =
    "vg-chatbot-composer__note";

  composerNote.textContent =
    "No compartas contraseñas ni información sensible.";


  composer.appendChild(
    inputWrapper,
  );

  composer.appendChild(
    composerNote,
  );


  const openingOptions = documentRef.createElement('div');
  openingOptions.className = 'vg-chatbot-empty-options';
  for (const label of ['Excel / datos', 'Informes / Power BI', 'Procesos repetitivos', 'Conocer a Víctor']) {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      input.value = label;
      input.dispatchEvent(new (documentRef.defaultView?.Event ?? Event)('input', { bubbles: true }));
      composer.requestSubmit();
    });
    openingOptions.appendChild(button);
  }
  const diagnosticLink = documentRef.createElement('a');
  diagnosticLink.textContent = 'Completar diagnóstico';
  diagnosticLink.href = new URL('../../../diagnostico.html', import.meta.url).href;
  openingOptions.appendChild(diagnosticLink);
  emptyState.appendChild(openingOptions);

  /**
   * ASSEMBLY
   */
  panel.appendChild(
    header,
  );

  panel.appendChild(
    description,
  );

  panel.appendChild(
    resetConfirmation,
  );

  panel.appendChild(
    messages,
  );

  panel.appendChild(
    composer,
  );


  return {
    panel,

    header,

    headerAvatar:
      avatar,

    headerAvatarImage:
      avatarImage,

    resetButton,

    resetConfirmation,

    resetCancelButton,

    resetConfirmButton,

    closeButton,

    messages,

    emptyState,

    composer,

    input,

    submitButton,
  };
}
