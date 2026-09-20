import test
  from "node:test";

import assert
  from "node:assert/strict";

import fs
  from "node:fs";

import path
  from "node:path";

import {
  fileURLToPath,
} from "node:url";


import * as state
  from "../core/state.js";

import {
  createChatPanelTemplate,
} from "../ui/templates.js";

import {
  mountChatShell,
} from "../ui/ui.js";


/**
 * ============================================================
 * FAKE DOM
 * ============================================================
 *
 * DOM mínimo para probar el shell sin:
 * - jsdom;
 * - Jest;
 * - Vitest;
 * - dependencias npm.
 */

class FakeEvent {
  constructor(
    type,
    {
      key = undefined,
      shiftKey = false,
      isComposing = false,
    } = {},
  ) {
    this.type =
      type;

    this.key =
      key;

    this.shiftKey =
      shiftKey;

    this.isComposing =
      isComposing;

    this.defaultPrevented =
      false;

    this.target =
      null;

    this.currentTarget =
      null;
  }


  preventDefault() {
    this.defaultPrevented =
      true;
  }
}


class FakeElement {
  constructor(
    tagName,
    ownerDocument,
  ) {
    this.tagName =
      tagName.toUpperCase();

    this.ownerDocument =
      ownerDocument;

    this.id =
      "";

    this.className =
      "";

    this.textContent =
      "";

    this.value =
      "";

    this.hidden =
      false;

    this.disabled =
      false;

    this.children =
      [];

    this.parentNode =
      null;

    this.attributes =
      new Map();

    this.listeners =
      new Map();
  }


  setAttribute(
    name,
    value,
  ) {
    const normalized =
      String(value);

    this.attributes.set(
      name,
      normalized,
    );

    if (name === "id") {
      this.id =
        normalized;
    }
  }


  getAttribute(
    name,
  ) {
    return this.attributes.has(
      name,
    )
      ? this.attributes.get(
          name,
        )
      : null;
  }


  removeAttribute(
    name,
  ) {
    this.attributes.delete(
      name,
    );
  }


  appendChild(
    child,
  ) {
    if (
      child.parentNode &&
      child.parentNode !== this
    ) {
      child.parentNode
        .removeChild?.(
          child,
        );
    }

    child.parentNode =
      this;

    this.children.push(
      child,
    );

    return child;
  }


  removeChild(
    child,
  ) {
    const index =
      this.children.indexOf(
        child,
      );

    if (index >= 0) {
      this.children.splice(
        index,
        1,
      );

      child.parentNode =
        null;
    }

    return child;
  }


  addEventListener(
    type,
    listener,
  ) {
    if (
      !this.listeners.has(
        type,
      )
    ) {
      this.listeners.set(
        type,
        new Set(),
      );
    }

    this.listeners
      .get(type)
      .add(listener);
  }


  removeEventListener(
    type,
    listener,
  ) {
    this.listeners
      .get(type)
      ?.delete(
        listener,
      );
  }


  dispatchEvent(
    event,
  ) {
    if (!event.target) {
      event.target =
        this;
    }

    event.currentTarget =
      this;

    for (
      const listener
      of this.listeners
        .get(event.type) ??
        []
    ) {
      listener.call(
        this,
        event,
      );
    }

    return (
      !event.defaultPrevented
    );
  }


  focus() {
    if (
      this.ownerDocument
    ) {
      this.ownerDocument
        .activeElement =
        this;
    }
  }


  requestSubmit() {
    const event =
      new FakeEvent(
        "submit",
      );

    this.dispatchEvent(
      event,
    );
  }


  matches(
    selector,
  ) {
    if (
      selector.startsWith(
        "#",
      )
    ) {
      return (
        this.id ===
        selector.slice(1)
      );
    }

    const attributeMatch =
      selector.match(
        /^\[([^\]]+)\]$/,
      );

    if (attributeMatch) {
      return this.attributes.has(
        attributeMatch[1],
      );
    }

    return false;
  }


  querySelector(
    selector,
  ) {
    return (
      this.querySelectorAll(
        selector,
      )[0] ??
      null
    );
  }


  querySelectorAll(
    selector,
  ) {
    const results =
      [];

    const visit =
      (element) => {
        if (
          element.matches?.(
            selector,
          )
        ) {
          results.push(
            element,
          );
        }

        for (
          const child
          of element.children
        ) {
          visit(
            child,
          );
        }
      };

    for (
      const child
      of this.children
    ) {
      visit(
        child,
      );
    }

    return results;
  }
}


class FakeDocument {
  constructor() {
    this.listeners =
      new Map();

    this.activeElement =
      null;

    this.documentElement =
      new FakeElement(
        "html",
        this,
      );

    this.body =
      new FakeElement(
        "body",
        this,
      );

    this.documentElement
      .appendChild(
        this.body,
      );
  }


  createElement(
    tagName,
  ) {
    return new FakeElement(
      tagName,
      this,
    );
  }


  createElementNS(
    _namespace,
    tagName,
  ) {
    return this.createElement(
      tagName,
    );
  }


  addEventListener(
    type,
    listener,
  ) {
    if (
      !this.listeners.has(
        type,
      )
    ) {
      this.listeners.set(
        type,
        new Set(),
      );
    }

    this.listeners
      .get(type)
      .add(listener);
  }


  removeEventListener(
    type,
    listener,
  ) {
    this.listeners
      .get(type)
      ?.delete(
        listener,
      );
  }


  dispatchEvent(
    event,
  ) {
    for (
      const listener
      of this.listeners
        .get(event.type) ??
        []
    ) {
      listener.call(
        this,
        event,
      );
    }

    return (
      !event.defaultPrevented
    );
  }
}


class FakeWindow {
  constructor() {
    this.requestAnimationFrame =
      (callback) => {
        callback();

        return 1;
      };
  }


  matchMedia(
    query,
  ) {
    assert.equal(
      query,
      "(prefers-reduced-motion: reduce)",
    );

    return {
      matches: false,

      addEventListener() {},

      removeEventListener() {},
    };
  }
}


/**
 * ============================================================
 * LAUNCHER CONTROLLER FAKE
 * ============================================================
 */

function createLauncherController(
  documentRef,
) {
  const launcher =
    documentRef.createElement(
      "button",
    );

  launcher.setAttribute(
    "data-expanded",
    "false",
  );

  launcher.focus =
    function focus() {
      documentRef.activeElement =
        launcher;
    };


  return {
    launcher,

    expanded:
      false,

    reducedMotion:
      false,

    setExpanded(
      expanded,
    ) {
      this.expanded =
        expanded;

      launcher.setAttribute(
        "data-expanded",
        String(expanded),
      );

      launcher.setAttribute(
        "aria-expanded",
        String(expanded),
      );

      return {
        ariaExpanded:
          String(expanded),
      };
    },

    setReducedMotion(
      reduced,
    ) {
      this.reducedMotion =
        reduced;
    },
  };
}


/**
 * ============================================================
 * TEST ENVIRONMENT
 * ============================================================
 */

function resetState() {
  state.resetState();
}


function createEnvironment({
  restoredOpen =
    false,

  onComposerSubmit =
    null,

  onResetConversation =
    null,
} = {}) {
  resetState();

  if (restoredOpen) {
    state.setUiOpen(
      true,
    );
  }

  const documentRef =
    new FakeDocument();

  const windowRef =
    new FakeWindow();

  const root =
    documentRef.createElement(
      "div",
    );

  documentRef.body
    .appendChild(
      root,
    );

  const launcherController =
    createLauncherController(
      documentRef,
    );

  root.appendChild(
    launcherController
      .launcher,
  );

  documentRef.activeElement =
    launcherController
      .launcher;


  const shell =
    mountChatShell({
      root,

      launcherController,

      documentRef,

      windowRef,

      onComposerSubmit,

      onResetConversation,
    });


  return {
    documentRef,
    windowRef,
    root,
    launcherController,
    shell,
  };
}


/**
 * ============================================================
 * TEMPLATE / ACCESSIBILITY
 * ============================================================
 */

test(
  "chat panel template has required semantic structure",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createChatPanelTemplate({
        documentRef,
      });


    assert.equal(
      template.panel.tagName,
      "SECTION",
    );

    assert.equal(
      template.panel
        .getAttribute(
          "role",
        ),
      "dialog",
    );

    assert.equal(
      template.panel
        .getAttribute(
          "aria-hidden",
        ),
      "true",
    );

    assert.equal(
      template.panel
        .getAttribute(
          "data-open",
        ),
      "false",
    );

    assert.equal(
      template.panel.hidden,
      true,
    );
  },
);


test(
  "dialog is labelled and described",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createChatPanelTemplate({
        documentRef,
      });


    assert.equal(
      template.panel
        .getAttribute(
          "aria-labelledby",
        ),
      "victor-chatbot-panel-title",
    );

    assert.equal(
      template.panel
        .getAttribute(
          "aria-describedby",
        ),
      "victor-chatbot-panel-description",
    );
  },
);


test(
  "messages area is an accessible live log",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createChatPanelTemplate({
        documentRef,
      });


    assert.equal(
      template.messages
        .getAttribute(
          "role",
        ),
      "log",
    );

    assert.equal(
      template.messages
        .getAttribute(
          "aria-live",
        ),
      "polite",
    );

    assert.equal(
      template.messages
        .getAttribute(
          "aria-relevant",
        ),
      "additions text",
    );
  },
);


test(
  "composer has safe base configuration",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createChatPanelTemplate({
        documentRef,
      });


    assert.equal(
      template.input.tagName,
      "TEXTAREA",
    );

    assert.equal(
      template.input
        .getAttribute(
          "maxlength",
        ),
      "1500",
    );

    assert.equal(
      template.input
        .getAttribute(
          "autocomplete",
        ),
      "off",
    );

    assert.equal(
      template.submitButton
        .getAttribute(
          "type",
        ),
      "submit",
    );

    assert.equal(
      template.submitButton
        .disabled,
      true,
    );
  },
);


/**
 * ============================================================
 * INITIAL STATE
 * ============================================================
 */

test(
  "fresh session mounts shell closed",
  () => {
    const {
      shell,
      launcherController,
    } =
      createEnvironment();


    assert.equal(
      shell.isOpen(),
      false,
    );

    assert.equal(
      shell.panel.hidden,
      true,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      false,
    );

    assert.equal(
      launcherController
        .expanded,
      false,
    );


    shell.destroy();
  },
);


test(
  "restored open state mounts shell open without changing state",
  () => {
    const {
      shell,
      launcherController,
    } =
      createEnvironment({
        restoredOpen: true,
      });


    assert.equal(
      shell.isOpen(),
      true,
    );

    assert.equal(
      shell.panel.hidden,
      false,
    );

    assert.equal(
      shell.panel
        .getAttribute(
          "aria-hidden",
        ),
      "false",
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      true,
    );

    assert.equal(
      launcherController
        .expanded,
      true,
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * OPEN / CLOSE / TOGGLE
 * ============================================================
 */

test(
  "open synchronizes DOM launcher and state",
  () => {
    const {
      shell,
      launcherController,
    } =
      createEnvironment();


    const result =
      shell.open();


    assert.equal(
      result,
      true,
    );

    assert.equal(
      shell.isOpen(),
      true,
    );

    assert.equal(
      shell.panel.hidden,
      false,
    );

    assert.equal(
      shell.panel
        .getAttribute(
          "aria-hidden",
        ),
      "false",
    );

    assert.equal(
      launcherController
        .expanded,
      true,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      true,
    );


    shell.destroy();
  },
);


test(
  "close synchronizes DOM launcher and state",
  () => {
    const {
      shell,
      launcherController,
    } =
      createEnvironment();


    shell.open();

    const result =
      shell.close();


    assert.equal(
      result,
      false,
    );

    assert.equal(
      shell.isOpen(),
      false,
    );

    assert.equal(
      shell.panel.hidden,
      true,
    );

    assert.equal(
      shell.panel
        .getAttribute(
          "aria-hidden",
        ),
      "true",
    );

    assert.equal(
      launcherController
        .expanded,
      false,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      false,
    );


    shell.destroy();
  },
);


test(
  "toggle alternates shell state",
  () => {
    const {
      shell,
    } =
      createEnvironment();


    assert.equal(
      shell.toggle(),
      true,
    );

    assert.equal(
      shell.toggle(),
      false,
    );

    assert.equal(
      shell.toggle(),
      true,
    );


    assert.equal(
      shell.isOpen(),
      true,
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * FOCUS
 * ============================================================
 */

test(
  "opening shell focuses composer input",
  () => {
    const {
      shell,
      documentRef,
    } =
      createEnvironment();


    shell.open();


    assert.equal(
      documentRef
        .activeElement,
      shell.input,
    );


    shell.destroy();
  },
);


test(
  "closing shell restores previous focus",
  () => {
    const {
      shell,
      documentRef,
      launcherController,
    } =
      createEnvironment();


    documentRef.activeElement =
      launcherController
        .launcher;


    shell.open();

    assert.equal(
      documentRef
        .activeElement,
      shell.input,
    );


    shell.close();

    assert.equal(
      documentRef
        .activeElement,
      launcherController
        .launcher,
    );


    shell.destroy();
  },
);


test(
  "restored open panel does not steal focus",
  () => {
    resetState();

    state.setUiOpen(
      true,
    );


    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow();

    const root =
      documentRef.createElement(
        "div",
      );

    documentRef.body
      .appendChild(
        root,
      );


    const externalButton =
      documentRef.createElement(
        "button",
      );

    documentRef.body
      .appendChild(
        externalButton,
      );

    documentRef.activeElement =
      externalButton;


    const launcherController =
      createLauncherController(
        documentRef,
      );

    root.appendChild(
      launcherController
        .launcher,
    );


    const shell =
      mountChatShell({
        root,
        launcherController,
        documentRef,
        windowRef,
      });


    assert.equal(
      shell.isOpen(),
      true,
    );

    assert.equal(
      documentRef
        .activeElement,
      externalButton,
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * ESCAPE + CLOSE BUTTON
 * ============================================================
 */

test(
  "Escape closes an open shell",
  () => {
    const {
      shell,
      documentRef,
    } =
      createEnvironment();


    shell.open();


    const event =
      new FakeEvent(
        "keydown",
        {
          key: "Escape",
        },
      );


    documentRef.dispatchEvent(
      event,
    );


    assert.equal(
      event.defaultPrevented,
      true,
    );

    assert.equal(
      shell.isOpen(),
      false,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      false,
    );


    shell.destroy();
  },
);


test(
  "Escape does nothing when shell is already closed",
  () => {
    const {
      shell,
      documentRef,
    } =
      createEnvironment();


    const event =
      new FakeEvent(
        "keydown",
        {
          key: "Escape",
        },
      );


    documentRef.dispatchEvent(
      event,
    );


    assert.equal(
      event.defaultPrevented,
      false,
    );

    assert.equal(
      shell.isOpen(),
      false,
    );


    shell.destroy();
  },
);


test(
  "close button closes shell",
  () => {
    const {
      shell,
      root,
    } =
      createEnvironment();


    shell.open();


    const closeButton =
      root.querySelector(
        "[data-vg-chatbot-close]",
      );


    assert.ok(
      closeButton,
    );


    closeButton.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );


    assert.equal(
      shell.isOpen(),
      false,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      false,
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * COMPOSER
 * ============================================================
 */

test(
  "submit button activates only when composer contains text",
  () => {
    const {
      shell,
    } =
      createEnvironment();


    assert.equal(
      shell.submitButton
        .disabled,
      true,
    );


    shell.input.value =
      "Hola";

    shell.input.dispatchEvent(
      new FakeEvent(
        "input",
      ),
    );


    assert.equal(
      shell.submitButton
        .disabled,
      false,
    );


    shell.input.value =
      "   ";

    shell.input.dispatchEvent(
      new FakeEvent(
        "input",
      ),
    );


    assert.equal(
      shell.submitButton
        .disabled,
      true,
    );


    shell.destroy();
  },
);


test(
  "composer submit emits trimmed text",
  () => {
    const submitted =
      [];


    const {
      shell,
      root,
    } =
      createEnvironment({
        onComposerSubmit({
          text,
        }) {
          submitted.push(
            text,
          );
        },
      });


    shell.input.value =
      "  Necesito automatizar Excel  ";

    shell.input.dispatchEvent(
      new FakeEvent(
        "input",
      ),
    );


    const composer =
      root.querySelector(
        "[data-vg-chatbot-composer]",
      );


    composer.requestSubmit();


    assert.deepEqual(
      submitted,
      [
        "Necesito automatizar Excel",
      ],
    );


    shell.destroy();
  },
);


test(
  "empty composer cannot submit meaningful content",
  () => {
    const submitted =
      [];


    const {
      shell,
      root,
    } =
      createEnvironment({
        onComposerSubmit({
          text,
        }) {
          submitted.push(
            text,
          );
        },
      });


    shell.input.value =
      "    ";


    const composer =
      root.querySelector(
        "[data-vg-chatbot-composer]",
      );


    composer.requestSubmit();


    assert.deepEqual(
      submitted,
      [],
    );


    shell.destroy();
  },
);


test(
  "Enter submits but Shift+Enter does not",
  () => {
    const submitted =
      [];


    const {
      shell,
    } =
      createEnvironment({
        onComposerSubmit({
          text,
        }) {
          submitted.push(
            text,
          );
        },
      });


    shell.input.value =
      "Hola";

    shell.input.dispatchEvent(
      new FakeEvent(
        "input",
      ),
    );


    const shiftEnter =
      new FakeEvent(
        "keydown",
        {
          key: "Enter",
          shiftKey: true,
        },
      );


    shell.input.dispatchEvent(
      shiftEnter,
    );


    assert.equal(
      shiftEnter.defaultPrevented,
      false,
    );

    assert.deepEqual(
      submitted,
      [],
    );


    const enter =
      new FakeEvent(
        "keydown",
        {
          key: "Enter",
          shiftKey: false,
        },
      );


    shell.input.dispatchEvent(
      enter,
    );


    assert.equal(
      enter.defaultPrevented,
      true,
    );

    assert.deepEqual(
      submitted,
      [
        "Hola",
      ],
    );


    shell.destroy();
  },
);


test(
  "IME composition Enter does not submit",
  () => {
    const submitted =
      [];


    const {
      shell,
    } =
      createEnvironment({
        onComposerSubmit({
          text,
        }) {
          submitted.push(
            text,
          );
        },
      });


    shell.input.value =
      "テスト";

    shell.input.dispatchEvent(
      new FakeEvent(
        "input",
      ),
    );


    const event =
      new FakeEvent(
        "keydown",
        {
          key: "Enter",
          isComposing: true,
        },
      );


    shell.input.dispatchEvent(
      event,
    );


    assert.equal(
      event.defaultPrevented,
      false,
    );

    assert.deepEqual(
      submitted,
      [],
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * REDUCED MOTION
 * ============================================================
 */

test(
  "shell accepts reduced-motion changes",
  () => {
    const {
      shell,
    } =
      createEnvironment();


    assert.doesNotThrow(
      () => {
        shell.setReducedMotion(
          true,
        );

        shell.setReducedMotion(
          false,
        );
      },
    );


    shell.destroy();
  },
);


/**
 * ============================================================
 * IDEMPOTENCE / DESTROY
 * ============================================================
 */

test(
  "mountChatShell does not duplicate panel inside same root",
  () => {
    const environment =
      createEnvironment();


    const second =
      mountChatShell({
        root:
          environment.root,

        launcherController:
          environment
            .launcherController,

        documentRef:
          environment
            .documentRef,

        windowRef:
          environment
            .windowRef,
      });


    assert.equal(
      second.reused,
      true,
    );

    assert.equal(
      environment.root
        .querySelectorAll(
          "[data-vg-chatbot-panel]",
        )
        .length,
      1,
    );


    environment.shell
      .destroy();
  },
);


test(
  "destroy removes panel and listeners safely",
  () => {
    const {
      shell,
      root,
      documentRef,
    } =
      createEnvironment();


    shell.open();


    shell.destroy();


    assert.equal(
      root.querySelector(
        "[data-vg-chatbot-panel]",
      ),
      null,
    );


    assert.doesNotThrow(
      () => {
        documentRef.dispatchEvent(
          new FakeEvent(
            "keydown",
            {
              key:
                "Escape",
            },
          ),
        );
      },
    );


    /**
     * Segunda llamada:
     * destroy debe ser idempotente.
     */
    assert.doesNotThrow(
      () => {
        shell.destroy();
      },
    );
  },
);


/**
 * ============================================================
 * CSS CONTRACT
 * ============================================================
 */

test(
  "shell CSS includes desktop mobile scroll focus and reduced-motion rules",
  () => {
    const currentFile =
      fileURLToPath(
        import.meta.url,
      );


    const cssPath =
      path.resolve(
        path.dirname(
          currentFile,
        ),
        "../chatbot.css",
      );


    const css =
      fs.readFileSync(
        cssPath,
        "utf8",
      );


    assert.match(
      css,
      /--vg-chatbot-panel-width:\s*390px/,
    );


    assert.match(
      css,
      /\.vg-chatbot-panel\s*\{/,
    );


    assert.match(
      css,
      /\.vg-chatbot-panel\[([\s\S]*?)data-open=["']?true["']?([\s\S]*?)\]/,
    );


    assert.match(
      css,
      /overflow-y:\s*auto/,
    );


    assert.match(
      css,
      /\.vg-chatbot-composer__field:focus-within/,
    );


    assert.match(
      css,
      /\.vg-chatbot-composer__submit:hover:not\(:disabled\)/,
    );


    assert.match(
      css,
      /\.vg-chatbot-composer__submit:disabled/,
    );


    assert.match(
      css,
      /\.vg-chatbot-composer__submit:focus-visible/,
    );


    assert.match(
      css,
      /max-width:\s*640px/,
    );


    assert.match(
      css,
      /height:\s*100dvh/,
    );


    assert.match(
      css,
      /prefers-reduced-motion:\s*reduce/,
    );
  },
);

/**
 * ============================================================
 * UX-H0 — RESET CONVERSATION
 * ============================================================
 */

test(
  "reset control and confirmation are accessible",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createChatPanelTemplate({
        documentRef,
      });

    assert.equal(
      template.resetButton
        .getAttribute(
          "aria-label",
        ),
      "Iniciar una nueva conversación",
    );

    assert.equal(
      template.resetConfirmation
        .getAttribute(
          "role",
        ),
      "alertdialog",
    );

    assert.equal(
      template.resetConfirmation
        .getAttribute(
          "aria-modal",
        ),
      "true",
    );

    assert.equal(
      template.resetConfirmation
        .getAttribute(
          "aria-describedby",
        ),
      "victor-chatbot-reset-confirmation-description",
    );

    assert.equal(
      template.resetConfirmation.hidden,
      true,
    );
  },
);


test(
  "reset button asks for confirmation without closing chat",
  () => {
    let resetCount = 0;

    const {
      shell,
      documentRef,
    } =
      createEnvironment({
        restoredOpen: true,

        onResetConversation() {
          resetCount += 1;
        },
      });

    shell.resetButton.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );

    assert.equal(
      shell.isOpen(),
      true,
    );

    assert.equal(
      shell.isResetConfirmationOpen(),
      true,
    );

    assert.equal(
      shell.resetConfirmation.hidden,
      false,
    );

    assert.equal(
      documentRef.activeElement,
      shell.resetCancelButton,
    );

    assert.equal(
      resetCount,
      0,
    );

    shell.destroy();
  },
);


test(
  "reset cancellation preserves conversation and returns focus",
  () => {
    let resetCount = 0;

    const {
      shell,
      documentRef,
    } =
      createEnvironment({
        restoredOpen: true,

        onResetConversation() {
          resetCount += 1;
        },
      });

    shell.resetButton.focus();

    shell.resetButton.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );

    shell.resetCancelButton.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );

    assert.equal(
      shell.isResetConfirmationOpen(),
      false,
    );

    assert.equal(
      shell.resetConfirmation.hidden,
      true,
    );

    assert.equal(
      documentRef.activeElement,
      shell.resetButton,
    );

    assert.equal(
      resetCount,
      0,
    );

    shell.destroy();
  },
);


test(
  "reset confirmation executes once and keeps panel open",
  () => {
    let resetCount = 0;

    const {
      shell,
      documentRef,
    } =
      createEnvironment({
        restoredOpen: true,

        onResetConversation() {
          resetCount += 1;
        },
      });

    shell.requestResetConfirmation();

    shell.resetConfirmButton.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );

    assert.equal(
      resetCount,
      1,
    );

    assert.equal(
      shell.isOpen(),
      true,
    );

    assert.equal(
      shell.isResetConfirmationOpen(),
      false,
    );

    assert.equal(
      documentRef.activeElement,
      shell.input,
    );

    shell.destroy();
  },
);


test(
  "Escape cancels reset confirmation before closing chat",
  () => {
    const {
      shell,
      documentRef,
    } =
      createEnvironment({
        restoredOpen: true,
      });

    shell.requestResetConfirmation();

    documentRef.dispatchEvent(
      new FakeEvent(
        "keydown",
        {
          key: "Escape",
        },
      ),
    );

    assert.equal(
      shell.isResetConfirmationOpen(),
      false,
    );

    assert.equal(
      shell.isOpen(),
      true,
    );

    shell.destroy();
  },
);
