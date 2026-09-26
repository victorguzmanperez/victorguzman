/** CONV-G1 — click-only guided conversation renderer. */

import { scrollConversationToEnd } from "./conversation-renderer.js";
import { GUIDED_NODE_MODE } from "../core/guided-conversation.js?v=conv-g1.13";

function clearGuidedOptions(messagesElement) {
  const existing = messagesElement?.querySelector?.("[data-vg-guided-options]");
  existing?.parentNode?.removeChild?.(existing);
}

function button(documentRef, { label, className = "", pressed = null, disabled = false, onClick }) {
  const element = documentRef.createElement("button");
  element.type = "button";
  element.className = `vg-guided-option ${className}`.trim();
  element.textContent = label;
  element.disabled = disabled;
  if (pressed !== null) element.setAttribute("aria-pressed", pressed ? "true" : "false");
  element.addEventListener("click", onClick);
  return element;
}

export function setGuidedComposerMode(shellController, enabled) {
  const panel = shellController?.panel;
  if (!panel) return false;
  panel.classList?.toggle?.("vg-chatbot--guided", enabled === true);
  if (shellController.composer) shellController.composer.hidden = enabled === true;
  if (shellController.emptyState) shellController.emptyState.hidden = enabled === true;
  if (shellController.input) {
    shellController.input.disabled = enabled === true;
    shellController.input.setAttribute?.("aria-hidden", enabled === true ? "true" : "false");
  }
  return true;
}

export function renderGuidedOptions({
  shellController,
  view,
  documentRef = globalThis.document,
  onSelect,
  onContinue,
  onBack,
  onHome,
  onDiagnostic,
  onContact,
  onFinish,
} = {}) {
  const messagesElement = shellController?.messages;
  if (!messagesElement || !view || !documentRef?.createElement) return { rendered: false };

  clearGuidedOptions(messagesElement);

  const container = documentRef.createElement("div");
  container.className = "vg-guided-options";
  container.setAttribute("data-vg-guided-options", "");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Opciones de conversación");

  if (view.title) {
    const title = documentRef.createElement("p");
    title.className = "vg-guided-options__title";
    title.textContent = view.title;
    container.appendChild(title);
  }

  const options = documentRef.createElement("div");
  options.className = "vg-guided-options__choices";
  const selected = new Set(view.selectedValues ?? []);

  for (const item of view.options ?? []) {
    const isMulti = view.mode === GUIDED_NODE_MODE.MULTI;
    options.appendChild(button(documentRef, {
      label: item.note ? `${item.label} · ${item.note}` : item.label,
      pressed: isMulti ? selected.has(item.value) : null,
      className: isMulti && selected.has(item.value) ? "is-selected" : "",
      onClick: () => onSelect?.(item),
    }));
  }

  container.appendChild(options);

  if (view.mode === GUIDED_NODE_MODE.MULTI) {
    const continueWrap = documentRef.createElement("div");
    continueWrap.className = "vg-guided-options__continue";
    continueWrap.appendChild(button(documentRef, {
      label: "Continuar",
      className: "vg-guided-option--primary",
      disabled: selected.size < (view.minSelections ?? 1),
      onClick: () => onContinue?.(),
    }));
    container.appendChild(continueWrap);
  }

  if (view.canDiagnostic || view.canContact) {
    const shortcuts = documentRef.createElement("div");
    shortcuts.className = "vg-guided-shortcuts";
    shortcuts.setAttribute("aria-label", "También puedes");

    const shortcutLabel = documentRef.createElement("span");
    shortcutLabel.className = "vg-guided-shortcuts__label";
    shortcutLabel.textContent = "También puedes";
    shortcuts.appendChild(shortcutLabel);

    if (view.canDiagnostic) {
      shortcuts.appendChild(button(documentRef, {
        label: "Completar diagnóstico",
        className: "vg-guided-option--shortcut",
        onClick: () => onDiagnostic?.(),
      }));
    }

    if (view.canContact) {
      shortcuts.appendChild(button(documentRef, {
        label: "Contactar con Víctor",
        className: "vg-guided-option--shortcut",
        onClick: () => onContact?.(),
      }));
    }

    container.appendChild(shortcuts);
  }

  const nav = documentRef.createElement("div");
  nav.className = "vg-guided-nav";
  nav.setAttribute("aria-label", "Navegación de la conversación");

  if (view.canBack) nav.appendChild(button(documentRef, { label: "← Atrás", className: "vg-guided-option--nav", onClick: () => onBack?.() }));
  if (view.canHome) nav.appendChild(button(documentRef, { label: "Inicio", className: "vg-guided-option--nav", onClick: () => onHome?.() }));
  if (view.canFinish) nav.appendChild(button(documentRef, { label: "No necesito nada más", className: "vg-guided-option--finish", onClick: () => onFinish?.() }));

  if (nav.children?.length > 0) container.appendChild(nav);

  messagesElement.appendChild(container);
  scrollConversationToEnd(messagesElement, { smooth: false });
  return { rendered: true };
}
