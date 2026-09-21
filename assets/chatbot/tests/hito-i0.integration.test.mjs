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

import * as storage
  from "../core/storage.js";

import {
  chatbotConfig,
} from "../core/config.js";

import {
  CHATBOT_GLOBAL_KEY,
  CHATBOT_ROOT_ID,
  CHATBOT_STYLES_ID,
  bootstrapChatbot,
} from "../chatbot.js";


/**
 * ============================================================
 * HITO I0 — INTEGRATION / HARDENING
 * ============================================================
 *
 * Objetivo:
 *
 * Probar conjuntamente:
 *
 * state
 *   ↓
 * storage
 *   ↓
 * bootstrap
 *   ↓
 * launcher
 *   ↓
 * shell
 *   ↓
 * navegación / lifecycle
 *
 * Sin jsdom, Jest, Vitest ni dependencias npm.
 */


/**
 * ============================================================
 * FAKE EVENT
 * ============================================================
 */

class FakeEvent {
  constructor(
    type,
    {
      key = undefined,
      shiftKey = false,
      isComposing = false,
      detail = null,
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

    this.detail =
      detail;

    this.target =
      null;

    this.currentTarget =
      null;

    this.defaultPrevented =
      false;
  }


  preventDefault() {
    this.defaultPrevented =
      true;
  }
}


/**
 * ============================================================
 * SELECTOR
 * ============================================================
 */

function matchesSelector(
  element,
  selector,
) {
  if (
    selector.startsWith(
      "#",
    )
  ) {
    return (
      element.id ===
      selector.slice(1)
    );
  }


  const attributeMatch =
    selector.match(
      /^\[([^\]]+)\]$/,
    );


  if (attributeMatch) {
    return element.attributes.has(
      attributeMatch[1],
    );
  }


  return false;
}


/**
 * ============================================================
 * FAKE ELEMENT
 * ============================================================
 */

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

    this.dataset =
      {};

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
          matchesSelector(
            element,
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


/**
 * ============================================================
 * FAKE DOCUMENT
 * ============================================================
 */

class FakeDocument {
  constructor({
    title =
      "Víctor Guzmán",

    lang =
      "es",
  } = {}) {
    this.title =
      title;

    this.readyState =
      "complete";

    this.activeElement =
      null;

    this.listeners =
      new Map();


    this.documentElement =
      new FakeElement(
        "html",
        this,
      );


    this.documentElement.lang =
      lang;


    this.head =
      new FakeElement(
        "head",
        this,
      );


    this.body =
      new FakeElement(
        "body",
        this,
      );


    this.documentElement
      .appendChild(
        this.head,
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


  getElementById(
    id,
  ) {
    if (
      this.documentElement.id ===
      id
    ) {
      return this.documentElement;
    }


    return (
      this.documentElement
        .querySelector(
          `#${id}`,
        )
    );
  }


  querySelectorAll(
    selector,
  ) {
    const results =
      [];


    if (
      matchesSelector(
        this.documentElement,
        selector,
      )
    ) {
      results.push(
        this.documentElement,
      );
    }


    return [
      ...results,

      ...this.documentElement
        .querySelectorAll(
          selector,
        ),
    ];
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
}


/**
 * ============================================================
 * MEDIA QUERY
 * ============================================================
 */

class FakeMediaQuery {
  constructor(
    matches = false,
  ) {
    this.matches =
      matches;

    this.listeners =
      new Set();
  }


  addEventListener(
    type,
    listener,
  ) {
    if (
      type === "change"
    ) {
      this.listeners.add(
        listener,
      );
    }
  }


  removeEventListener(
    type,
    listener,
  ) {
    if (
      type === "change"
    ) {
      this.listeners.delete(
        listener,
      );
    }
  }


  emit(
    matches,
  ) {
    this.matches =
      matches;


    for (
      const listener
      of this.listeners
    ) {
      listener({
        matches,
      });
    }
  }
}


/**
 * ============================================================
 * CUSTOM EVENT
 * ============================================================
 */

class FakeCustomEvent {
  constructor(
    type,
    {
      detail = null,
    } = {},
  ) {
    this.type =
      type;

    this.detail =
      detail;

    this.target =
      null;

    this.currentTarget =
      null;
  }
}


/**
 * ============================================================
 * FAKE WINDOW
 * ============================================================
 */

class FakeWindow {
  constructor({
    pathname =
      "/victorguzman/index.html",

    hash =
      "",

    reducedMotion =
      false,
  } = {}) {
    this.location = {
      pathname,
      hash,
    };


    this.listeners =
      new Map();


    this.mediaQuery =
      new FakeMediaQuery(
        reducedMotion,
      );


    this.CustomEvent =
      FakeCustomEvent;


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


    return this.mediaQuery;
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


  emit(
    type,
  ) {
    for (
      const listener
      of this.listeners
        .get(type) ??
        []
    ) {
      listener({
        type,
      });
    }
  }
}


/**
 * ============================================================
 * STORAGE
 * ============================================================
 */

class FakeStorage {
  constructor() {
    this.data =
      new Map();

    this.writeCount =
      0;
  }


  getItem(
    key,
  ) {
    return this.data.has(
      key,
    )
      ? this.data.get(
          key,
        )
      : null;
  }


  setItem(
    key,
    value,
  ) {
    this.writeCount +=
      1;


    this.data.set(
      String(key),
      String(value),
    );
  }


  removeItem(
    key,
  ) {
    this.data.delete(
      String(key),
    );
  }
}


class BrokenStorage {
  getItem() {
    throw new Error(
      "Storage blocked",
    );
  }


  setItem() {
    throw new Error(
      "Storage blocked",
    );
  }


  removeItem() {
    throw new Error(
      "Storage blocked",
    );
  }
}


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanRuntime() {
  storage.stopStorageSync({
    flush: false,
  });


  state.resetState();
}


function bootstrapEnvironment({
  pathname =
    "/victorguzman/index.html",

  hash =
    "",

  storageRef =
    new FakeStorage(),

  reducedMotion =
    false,

  startPersistence =
    true,

  title =
    "Víctor Guzmán",
} = {}) {
  const documentRef =
    new FakeDocument({
      title,
    });


  const windowRef =
    new FakeWindow({
      pathname,
      hash,
      reducedMotion,
    });


  const api =
    bootstrapChatbot({
      documentRef,
      windowRef,
      storageRef,

      startPersistence,

      bindPagehide:
        false,
    });


  return {
    api,
    documentRef,
    windowRef,
    storageRef,
  };
}


function listenerCount(
  target,
  type,
) {
  return (
    target.listeners
      ?.get(type)
      ?.size ??
    0
  );
}


function rawPersisted(
  fakeStorage,
) {
  const raw =
    fakeStorage.getItem(
      storage.STORAGE_KEY,
    );


  return raw
    ? JSON.parse(raw)
    : null;
}


/**
 * ============================================================
 * 1 — COMPLETE BOOTSTRAP CONTRACT
 * ============================================================
 */

test(
  "complete bootstrap mounts one operational HITO I0 shell",
  () => {
    cleanRuntime();


    const {
      api,
      documentRef,
      windowRef,
    } =
      bootstrapEnvironment({
        startPersistence:
          false,
      });


    const current =
      state.getState();


    assert.equal(
      current.bootstrap.status,
      state.BOOTSTRAP_STATUS.READY,
    );


    assert.equal(
      current.bootstrap.shellMounted,
      true,
    );


    assert.equal(
      current.ui.isOpen,
      false,
    );


    assert.equal(
      current.page.current.pageId,
      "home",
    );


    assert.equal(
      windowRef[
        CHATBOT_GLOBAL_KEY
      ],
      api,
    );


    assert.ok(
      api.root,
    );


    assert.ok(
      api.launcher,
    );


    assert.ok(
      api.shell,
    );


    assert.equal(
      api.shell.isOpen(),
      false,
    );


    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );


    assert.equal(
      api.root
        .querySelectorAll(
          "[data-vg-chatbot-launcher]",
        )
        .length,
      1,
    );


    assert.equal(
      api.root
        .querySelectorAll(
          "[data-vg-chatbot-panel]",
        )
        .length,
      1,
    );


    assert.ok(
      documentRef.getElementById(
        CHATBOT_STYLES_ID,
      ),
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 2 — SINGLETON + DUPLICATION
 * ============================================================
 */

test(
  "repeated bootstrap returns same instance and creates no duplicate UI",
  () => {
    cleanRuntime();


    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow();

    const fakeStorage =
      new FakeStorage();


    const first =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    const hashListenersBefore =
      listenerCount(
        windowRef,
        "hashchange",
      );


    const keyListenersBefore =
      listenerCount(
        documentRef,
        "keydown",
      );


    const second =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    assert.equal(
      first,
      second,
    );


    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );


    assert.equal(
      first.root
        .querySelectorAll(
          "[data-vg-chatbot-launcher]",
        )
        .length,
      1,
    );


    assert.equal(
      first.root
        .querySelectorAll(
          "[data-vg-chatbot-panel]",
        )
        .length,
      1,
    );


    assert.equal(
      listenerCount(
        windowRef,
        "hashchange",
      ),
      hashListenersBefore,
    );


    assert.equal(
      listenerCount(
        documentRef,
        "keydown",
      ),
      keyListenersBefore,
    );


    first.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 3 — LAUNCHER → SHELL → FOCUS
 * ============================================================
 */

test(
  "launcher drives shell state ARIA and focus as one lifecycle",
  () => {
    cleanRuntime();


    const {
      api,
      documentRef,
    } =
      bootstrapEnvironment({
        startPersistence:
          false,
      });


    const launcher =
      api.launcher.launcher;


    documentRef.activeElement =
      launcher;


    launcher.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );


    assert.equal(
      api.shell.isOpen(),
      true,
    );


    assert.equal(
      state.getState()
        .ui.isOpen,
      true,
    );


    assert.equal(
      launcher.getAttribute(
        "aria-expanded",
      ),
      "true",
    );


    assert.equal(
      documentRef.activeElement,
      chatbotConfig?.conversation
        ?.guidedMode === true
        ? launcher
        : api.shell.input,
    );


    launcher.dispatchEvent(
      new FakeEvent(
        "click",
      ),
    );


    assert.equal(
      api.shell.isOpen(),
      false,
    );


    assert.equal(
      state.getState()
        .ui.isOpen,
      false,
    );


    assert.equal(
      launcher.getAttribute(
        "aria-expanded",
      ),
      "false",
    );


    assert.equal(
      documentRef.activeElement,
      launcher,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 4 — LIVE REDUCED MOTION
 * ============================================================
 */

test(
  "live reduced-motion changes update runtime without persistence",
  () => {
    cleanRuntime();


    const {
      api,
      windowRef,
    } =
      bootstrapEnvironment({
        reducedMotion:
          false,

        startPersistence:
          false,
      });


    assert.equal(
      state.getState()
        .ui.reducedMotion,
      false,
    );


    assert.equal(
      api.launcher
        .avatarController
        .getStatus()
        .reducedMotion,
      false,
    );


    assert.equal(
      windowRef.mediaQuery
        .listeners.size,
      1,
    );


    windowRef.mediaQuery.emit(
      true,
    );


    assert.equal(
      state.getState()
        .ui.reducedMotion,
      true,
    );


    assert.equal(
      api.launcher
        .avatarController
        .getStatus()
        .reducedMotion,
      true,
    );


    windowRef.mediaQuery.emit(
      false,
    );


    assert.equal(
      state.getState()
        .ui.reducedMotion,
      false,
    );


    api.destroy({
      flush: false,
    });


    assert.equal(
      windowRef.mediaQuery
        .listeners.size,
      0,
    );
  },
);


/**
 * ============================================================
 * 5 — DESTROY
 * ============================================================
 */

test(
  "destroy removes DOM singleton subscriptions and runtime listeners",
  () => {
    cleanRuntime();


    const {
      api,
      documentRef,
      windowRef,
    } =
      bootstrapEnvironment();


    assert.equal(
      listenerCount(
        windowRef,
        "hashchange",
      ),
      1,
    );


    assert.equal(
      listenerCount(
        windowRef,
        "popstate",
      ),
      1,
    );


    assert.equal(
      listenerCount(
        documentRef,
        "keydown",
      ),
      1,
    );


    assert.equal(
      windowRef.mediaQuery
        .listeners.size,
      1,
    );


    assert.equal(
      storage
        .getStorageStatus()
        .syncActive,
      true,
    );


    api.destroy({
      flush: false,
    });


    assert.equal(
      windowRef[
        CHATBOT_GLOBAL_KEY
      ],
      undefined,
    );


    assert.equal(
      documentRef.getElementById(
        CHATBOT_ROOT_ID,
      ),
      null,
    );


    assert.equal(
      listenerCount(
        windowRef,
        "hashchange",
      ),
      0,
    );


    assert.equal(
      listenerCount(
        windowRef,
        "popstate",
      ),
      0,
    );


    assert.equal(
      listenerCount(
        documentRef,
        "keydown",
      ),
      0,
    );


    assert.equal(
      windowRef.mediaQuery
        .listeners.size,
      0,
    );


    assert.equal(
      storage
        .getStorageStatus()
        .syncActive,
      false,
    );


    assert.equal(
      state.getState()
        .bootstrap.shellMounted,
      false,
    );


    /**
     * destroy() es idempotente.
     */
    assert.doesNotThrow(
      () => {
        api.destroy({
          flush: false,
        });
      },
    );
  },
);


/**
 * ============================================================
 * 6 — DESTROY + REBOOTSTRAP
 * ============================================================
 */

test(
  "destroy followed by rebootstrap creates one clean new runtime",
  () => {
    cleanRuntime();


    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow();

    const fakeStorage =
      new FakeStorage();


    const first =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    first.destroy({
      flush: false,
    });


    const second =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    assert.notEqual(
      first,
      second,
    );


    assert.equal(
      windowRef[
        CHATBOT_GLOBAL_KEY
      ],
      second,
    );


    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );


    assert.equal(
      second.root
        .querySelectorAll(
          "[data-vg-chatbot-launcher]",
        )
        .length,
      1,
    );


    assert.equal(
      second.root
        .querySelectorAll(
          "[data-vg-chatbot-panel]",
        )
        .length,
      1,
    );


    assert.equal(
      listenerCount(
        windowRef,
        "hashchange",
      ),
      1,
    );


    assert.equal(
      listenerCount(
        documentRef,
        "keydown",
      ),
      1,
    );


    second.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 7 — CORRUPT STORAGE + BOOTSTRAP
 * ============================================================
 */

test(
  "corrupt persisted JSON cannot break bootstrap",
  () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    fakeStorage.setItem(
      storage.STORAGE_KEY,
      "{this is not valid json",
    );


    const {
      api,
    } =
      bootstrapEnvironment({
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    assert.equal(
      api.restoreResult.restored,
      false,
    );


    assert.equal(
      api.restoreResult.reason,
      "invalid_json",
    );


    assert.equal(
      state.getState()
        .bootstrap.status,
      state.BOOTSTRAP_STATUS.READY,
    );


    assert.equal(
      state.getState()
        .conversation.messages.length,
      0,
    );


    assert.equal(
      fakeStorage.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 8 — BLOCKED STORAGE
 * ============================================================
 */

test(
  "blocked storage falls back to memory while launcher and shell remain usable",
  () => {
    cleanRuntime();


    const {
      api,
    } =
      bootstrapEnvironment({
        storageRef:
          new BrokenStorage(),
      });


    assert.equal(
      api.storageStatus.mode,
      "memory",
    );


    assert.equal(
      api.storageStatus.persistent,
      false,
    );


    assert.doesNotThrow(
      () => {
        api.shell.open();
      },
    );


    assert.equal(
      api.shell.isOpen(),
      true,
    );


    assert.equal(
      state.getState()
        .ui.isOpen,
      true,
    );


    api.shell.close();


    assert.equal(
      api.shell.isOpen(),
      false,
    );


    assert.equal(
      state.getState()
        .bootstrap.status,
      state.BOOTSTRAP_STATUS.READY,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 9 — FULL DOCUMENT NAVIGATION JOURNEY
 * ============================================================
 */

test(
  "full HITO I0 session survives document navigation coherently",
  () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapEnvironment({
        pathname:
          "/victorguzman/index.html",

        title:
          "Inicio",

        storageRef:
          fakeStorage,
      });


    pageA.api.shell.open();


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Necesito automatizar varios Excel",
    });


    state.mergeEntities({
      contact: {
        name:
          "Ana",
      },

      case: {
        tools: [
          "excel",
        ],

        currentProcess:
          "manual",
      },
    });


    const sessionId =
      state.getState()
        .meta.sessionId;


    pageA.api.destroy({
      flush: true,
    });


    state.resetState();


    const pageB =
      bootstrapEnvironment({
        pathname:
          "/victorguzman/soluciones.html",

        title:
          "Soluciones",

        storageRef:
          fakeStorage,
      });


    const restored =
      state.getState();


    assert.equal(
      restored.meta.sessionId,
      sessionId,
    );


    assert.equal(
      restored.conversation
        .messages.length,
      1,
    );


    assert.equal(
      restored.conversation
        .messages[0].text,
      "Necesito automatizar varios Excel",
    );


    assert.equal(
      restored.entities
        .contact.name,
      "Ana",
    );


    assert.deepEqual(
      restored.entities
        .case.tools,
      [
        "excel",
      ],
    );


    assert.equal(
      restored.page.current.pageId,
      "soluciones",
    );


    assert.equal(
      restored.page.previous.pageId,
      "home",
    );


    assert.equal(
      restored.ui.isOpen,
      true,
    );


    assert.equal(
      pageB.api.shell.isOpen(),
      true,
    );


    assert.equal(
      restored.bootstrap
        .restoredFromSession,
      true,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 10 — EXPIRED SESSION
 * ============================================================
 */

test(
  "expired persisted session starts clean but keeps real page context",
  () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    storage.initStorage({
      storage:
        fakeStorage,
    });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Mensaje antiguo",
    });


    const oldSessionId =
      state.getState()
        .meta.sessionId;


    storage.saveState();


    const persisted =
      rawPersisted(
        fakeStorage,
      );


    persisted.meta.updatedAt =
      new Date(
        Date.now() -
        storage.STORAGE_TTL_MS -
        1000,
      ).toISOString();


    fakeStorage.setItem(
      storage.STORAGE_KEY,
      JSON.stringify(
        persisted,
      ),
    );


    state.resetState();


    const {
      api,
    } =
      bootstrapEnvironment({
        pathname:
          "/victorguzman/diagnostico.html",

        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });


    const current =
      state.getState();


    assert.equal(
      api.restoreResult.restored,
      false,
    );


    assert.equal(
      api.restoreResult.reason,
      "expired",
    );


    assert.notEqual(
      current.meta.sessionId,
      oldSessionId,
    );


    assert.equal(
      current.conversation
        .messages.length,
      0,
    );


    assert.equal(
      current.page.current.pageId,
      "diagnostico",
    );


    assert.equal(
      current.page.current.pageType,
      "diagnostic",
    );


    assert.equal(
      current.ui.isOpen,
      false,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 11 — CONCURRENT CORE LOAD
 * ============================================================
 */

test(
  "concurrent lazy-core requests converge to one module set",
  async () => {
    cleanRuntime();


    const {
      api,
    } =
      bootstrapEnvironment({
        startPersistence:
          false,
      });


    const [
      first,
      second,
      third,
    ] =
      await Promise.all([
        api.ensureCoreLoaded(),
        api.ensureCoreLoaded(),
        api.ensureCoreLoaded(),
      ]);


    assert.equal(
      first,
      second,
    );


    assert.equal(
      second,
      third,
    );


    if (
      chatbotConfig?.conversation
        ?.guidedMode === true
    ) {
      assert.equal(
        typeof first.guidedConversation,
        "object",
      );
    } else {
      assert.equal(
        typeof first.nlu,
        "object",
      );

      assert.equal(
        typeof first.entities,
        "object",
      );

      assert.equal(
        typeof first.dialogueManager,
        "object",
      );

      assert.equal(
        typeof first.actions,
        "object",
      );
    }


    if (
      chatbotConfig?.conversation
        ?.guidedMode !== true
    ) {
      assert.equal(
        typeof first.knowledge,
        "object",
      );
    }


    assert.equal(
      api.isCoreLoaded(),
      true,
    );


    assert.equal(
      state.getState()
        .bootstrap.coreLoading,
      false,
    );


    assert.equal(
      state.getState()
        .bootstrap.coreLoaded,
      true,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 12 — CORE IDEMPOTENCE AFTER LOAD
 * ============================================================
 */

test(
  "already loaded core remains idempotent across repeated requests",
  async () => {
    cleanRuntime();


    const {
      api,
    } =
      bootstrapEnvironment({
        startPersistence:
          false,
      });


    const first =
      await api.ensureCoreLoaded();


    const second =
      await api.ensureCoreLoaded();


    assert.equal(
      first,
      second,
    );


    assert.equal(
      api.isCoreLoaded(),
      true,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 13 — RESET CONVERSATION
 * ============================================================
 */

test(
  "resetConversation clears conversational data but preserves anonymous session",
  () => {
    cleanRuntime();


    const {
      api,
    } =
      bootstrapEnvironment({
        startPersistence:
          false,
      });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Hola",
    });


    state.mergeEntities({
      contact: {
        name:
          "Ana",
      },
    });


    state.addRecommendation({
      type:
        state.RECOMMENDATION_TYPE.PROJECT,

      id:
        "dashboard-pyme",

      reasonCode:
        "integration_test",

      shown:
        true,
    });


    const before =
      state.getState();


    const after =
      state.resetConversation();


    assert.equal(
      after.meta.sessionId,
      before.meta.sessionId,
    );


    assert.equal(
      after.conversation.started,
      false,
    );


    assert.equal(
      after.conversation.messages.length,
      0,
    );


    assert.equal(
      after.entities.contact.name,
      null,
    );


    assert.equal(
      after.recommendations
        .projects.length,
      0,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 14 — TECHNICAL RESET
 * ============================================================
 */

test(
  "resetState creates a new technical session and remains JSON-valid",
  () => {
    cleanRuntime();


    const before =
      state.getState();


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Hola",
    });


    const after =
      state.resetState();


    assert.notEqual(
      after.meta.sessionId,
      before.meta.sessionId,
    );


    assert.equal(
      after.conversation.id,
      null,
    );


    assert.equal(
      after.conversation
        .messages.length,
      0,
    );


    assert.equal(
      after.bootstrap.status,
      state.BOOTSTRAP_STATUS
        .INITIALIZING,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );


    assert.doesNotThrow(
      () => {
        JSON.stringify(
          after,
        );
      },
    );
  },
);


/**
 * ============================================================
 * 15 — REAL 50 MESSAGE PERSISTENCE CONTRACT
 * ============================================================
 */

test(
  "real bootstrap persistence never stores more than 50 messages",
  () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    const {
      api,
    } =
      bootstrapEnvironment({
        storageRef:
          fakeStorage,
      });


    for (
      let index = 0;
      index < 70;
      index += 1
    ) {
      state.appendMessage({
        role:
          index % 2 === 0
            ? state.MESSAGE_ROLE.USER
            : state.MESSAGE_ROLE.ASSISTANT,

        text:
          `Mensaje ${index + 1}`,
      });
    }


    api.destroy({
      flush: true,
    });


    const persisted =
      rawPersisted(
        fakeStorage,
      );


    assert.ok(
      persisted,
    );


    assert.equal(
      persisted.conversation
        .messages.length,
      50,
    );


    assert.equal(
      persisted.conversation
        .messages[0].text,
      "Mensaje 21",
    );


    assert.equal(
      persisted.conversation
        .messages[49].text,
      "Mensaje 70",
    );


    assert.equal(
      "bootstrap" in persisted,
      false,
    );


    assert.equal(
      "current" in persisted.page,
      false,
    );
  },
);


/**
 * ============================================================
 * 16 — ANALYTICS PII HARDENING
 * ============================================================
 */

test(
  "analytics state rejects accidental PII transactionally",
  () => {
    cleanRuntime();


    const before =
      state.getState();


    assert.throws(
      () => {
        state.updateState(
          (draft) => {
            draft.analytics.email =
              "ana@example.com";
          },
          {
            source:
              "integration:analytics_pii",
          },
        );
      },
      (error) =>
        error.name ===
        "StateValidationError",
    );


    const after =
      state.getState();


    assert.equal(
      "email" in
        after.analytics,
      false,
    );


    assert.deepEqual(
      after.analytics,
      before.analytics,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );
  },
);


/**
 * ============================================================
 * 17 — CLEAR PERSISTED ON DESTROY
 * ============================================================
 */

test(
  "destroy can explicitly clear persisted chatbot session",
  () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    const {
      api,
    } =
      bootstrapEnvironment({
        storageRef:
          fakeStorage,
      });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Este mensaje se borrará",
    });


    storage.flushStateSave();


    assert.notEqual(
      fakeStorage.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );


    api.destroy({
      flush: true,
      clearPersisted: true,
    });


    assert.equal(
      fakeStorage.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );
  },
);


/**
 * ============================================================
 * 18 — HTML INTEGRATION CONTRACT
 * ============================================================
 */

test(
  "all current public portfolio pages still integrate exactly one chatbot module",
  () => {
    const currentFile =
      fileURLToPath(
        import.meta.url,
      );


    const repositoryRoot =
      path.resolve(
        path.dirname(
          currentFile,
        ),
        "../../..",
      );


    const rootPages = [
      "index.html",
      "soluciones.html",
      "diagnostico.html",
      "apoya.html",
      "privacidad.html",
      "cookies.html",
    ];


    const projectPages = [
      "projects/costes.html",
      "projects/auditoria-digital-cv.html",
      "projects/investment.html",
      "projects/modelo-evaluacion-competencias.html",
    ];


    for (
      const relativePath
      of rootPages
    ) {
      const html =
        fs.readFileSync(
          path.join(
            repositoryRoot,
            relativePath,
          ),
          "utf8",
        );


      const matches =
        html.match(
          /<script\s+type=["']module["']\s+src=["']assets\/chatbot\/chatbot\.js(?:\?v=[^"']+)?["']\s*><\/script>/g,
        ) ??
        [];


      assert.equal(
        matches.length,
        1,
        `${relativePath} must include chatbot.js exactly once`,
      );
    }


    for (
      const relativePath
      of projectPages
    ) {
      const html =
        fs.readFileSync(
          path.join(
            repositoryRoot,
            relativePath,
          ),
          "utf8",
        );


      const matches =
        html.match(
          /<script\s+type=["']module["']\s+src=["']\.\.\/assets\/chatbot\/chatbot\.js(?:\?v=[^"']+)?["']\s*><\/script>/g,
        ) ??
        [];


      assert.equal(
        matches.length,
        1,
        `${relativePath} must include chatbot.js exactly once`,
      );
    }
  },
);


/**
 * ============================================================
 * 19 — FINAL STATE SERIALIZATION
 * ============================================================
 */

test(
  "integrated HITO I0 lifecycle finishes with a valid serializable state",
  async () => {
    cleanRuntime();


    const fakeStorage =
      new FakeStorage();


    const {
      api,
      windowRef,
    } =
      bootstrapEnvironment({
        storageRef:
          fakeStorage,
      });


    api.shell.open();


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Necesito mejorar mis informes",
    });


    state.mergeEntities({
      case: {
        tools: [
          "excel",
          "power-bi",
        ],

        currentProcess:
          "manual",

        objective:
          "automatizar reporting",
      },
    });


    await api.ensureCoreLoaded();


    windowRef.location.hash =
      "#proyectos";


    windowRef.emit(
      "hashchange",
    );


    windowRef.mediaQuery.emit(
      true,
    );


    const current =
      state.getState();


    const validation =
      state.validateState(
        current,
      );


    assert.equal(
      validation.valid,
      true,
    );


    assert.deepEqual(
      validation.errors,
      [],
    );


    assert.doesNotThrow(
      () => {
        JSON.stringify(
          current,
        );
      },
    );


    assert.equal(
      current.bootstrap.status,
      state.BOOTSTRAP_STATUS.READY,
    );


    assert.equal(
      current.bootstrap.coreLoaded,
      true,
    );


    assert.equal(
      current.ui.isOpen,
      true,
    );


    assert.equal(
      current.ui.reducedMotion,
      true,
    );


    assert.equal(
      current.page.current.section,
      "proyectos",
    );


    assert.equal(
      current.conversation
        .messages.length,
      1,
    );


    api.destroy({
      flush: true,
    });


    assert.equal(
      storage
        .getStorageStatus()
        .syncActive,
      false,
    );
  },
);