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
  CHATBOT_GLOBAL_KEY,
  CHATBOT_ROOT_ID,
  CHATBOT_STYLES_ID,
  bootstrapChatbot,
  detectPageContext,
  ensureChatbotRoot,
  ensureChatbotStylesheet,
  shouldAutoFocusComposerOnLauncher,
  shouldDismissComposerKeyboardAfterSubmit,
} from "../chatbot.js";


/**
 * ============================================================
 * FAKE DOM
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
    return element.attributes
      .has(
        attributeMatch[1],
      );
  }

  return false;
}


class FakeElement {
  constructor(
    tagName,
  ) {
    this.tagName =
      tagName.toUpperCase();

    this.id = "";

    this.className = "";

    this.textContent = "";

    this.children = [];

    this.parentNode = null;

    this.attributes =
      new Map();

    this.dataset = {};

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

    return true;
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
    const results = [];

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
          visit(child);
        }
      };

    for (
      const child
      of this.children
    ) {
      visit(child);
    }

    return results;
  }
}


class FakeDocument {
  constructor({
    title =
      "Test page",

    lang =
      "es",
  } = {}) {
    this.title =
      title;

    this.readyState =
      "complete";

    this.listeners =
      new Map();

    this.documentElement =
      new FakeElement(
        "html",
      );

    this.documentElement.lang =
      lang;

    this.head =
      new FakeElement(
        "head",
      );

    this.body =
      new FakeElement(
        "body",
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
    const results = [];

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

    return true;
  }
}


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
    if (type === "change") {
      this.listeners.add(
        listener,
      );
    }
  }


  removeEventListener(
    type,
    listener,
  ) {
    if (type === "change") {
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
  }
}


class FakeWindow {
  constructor({
    pathname =
      "/victorguzman/",

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
 * FAKE STORAGE
 * ============================================================
 */

class FakeStorage {
  constructor() {
    this.data =
      new Map();
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


function cleanRuntime() {
  storage.stopStorageSync({
    flush: false,
  });

  state.resetState();
}


/**
 * ============================================================
 * PAGE CONTEXT
 * ============================================================
 */

test(
  "root portfolio pages are classified correctly",
  () => {
    const cases = [
      [
        "/victorguzman/",
        "home",
        "home",
      ],

      [
        "/victorguzman/index.html",
        "home",
        "home",
      ],

      [
        "/victorguzman/soluciones.html",
        "soluciones",
        "solutions",
      ],

      [
        "/victorguzman/diagnostico.html",
        "diagnostico",
        "diagnostic",
      ],

      [
        "/victorguzman/apoya.html",
        "apoya",
        "support",
      ],

      [
        "/victorguzman/privacidad.html",
        "privacidad",
        "legal",
      ],

      [
        "/victorguzman/cookies.html",
        "cookies",
        "legal",
      ],
    ];

    for (
      const [
        pathname,
        expectedPageId,
        expectedType,
      ]
      of cases
    ) {
      const documentRef =
        new FakeDocument();

      const windowRef =
        new FakeWindow({
          pathname,
        });

      const context =
        detectPageContext({
          documentRef,
          locationRef:
            windowRef.location,
        });

      assert.equal(
        context.pageId,
        expectedPageId,
      );

      assert.equal(
        context.pageType,
        expectedType,
      );
    }
  },
);


test(
  "project pages derive projectId from filename",
  () => {
    const projects = [
      "costes",
      "auditoria-digital-cv",
      "investment",
      "modelo-evaluacion-competencias",
    ];

    for (
      const projectId
      of projects
    ) {
      const documentRef =
        new FakeDocument();

      const windowRef =
        new FakeWindow({
          pathname:
            `/victorguzman/projects/${projectId}.html`,
        });

      const context =
        detectPageContext({
          documentRef,
          locationRef:
            windowRef.location,
        });

      assert.equal(
        context.pageType,
        "project",
      );

      assert.equal(
        context.projectId,
        projectId,
      );

      assert.equal(
        context.pageId,
        projectId,
      );
    }
  },
);


test(
  "body data attributes override route inference",
  () => {
    const documentRef =
      new FakeDocument();

    documentRef.body.dataset = {
      pageId:
        "explicit-page",

      pageType:
        "custom",

      pageSection:
        "custom-section",

      projectId:
        "explicit-project",
    };

    const context =
      detectPageContext({
        documentRef,
        locationRef: {
          pathname:
            "/victorguzman/index.html",

          hash: "",
        },
      });

    assert.equal(
      context.pageId,
      "explicit-page",
    );

    assert.equal(
      context.pageType,
      "custom",
    );

    assert.equal(
      context.section,
      "custom-section",
    );

    assert.equal(
      context.projectId,
      "explicit-project",
    );
  },
);


test(
  "hash becomes current section when no explicit section exists",
  () => {
    const documentRef =
      new FakeDocument();

    const context =
      detectPageContext({
        documentRef,
        locationRef: {
          pathname:
            "/victorguzman/",

          hash:
            "#servicios",
        },
      });

    assert.equal(
      context.pageId,
      "home",
    );

    assert.equal(
      context.section,
      "servicios",
    );
  },
);


/**
 * ============================================================
 * ROOT / CSS
 * ============================================================
 */

test(
  "chatbot root creation is idempotent",
  () => {
    const documentRef =
      new FakeDocument();

    const first =
      ensureChatbotRoot({
        documentRef,
      });

    const second =
      ensureChatbotRoot({
        documentRef,
      });

    assert.equal(
      first.created,
      true,
    );

    assert.equal(
      second.reused,
      true,
    );

    assert.equal(
      first.root,
      second.root,
    );

    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );
  },
);


test(
  "duplicate chatbot roots are consolidated",
  () => {
    const documentRef =
      new FakeDocument();

    const a =
      documentRef.createElement(
        "div",
      );

    const b =
      documentRef.createElement(
        "div",
      );

    a.id =
      CHATBOT_ROOT_ID;

    b.id =
      CHATBOT_ROOT_ID;

    documentRef.body
      .appendChild(a);

    documentRef.body
      .appendChild(b);

    const result =
      ensureChatbotRoot({
        documentRef,
      });

    assert.equal(
      result.removedDuplicates,
      1,
    );

    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );
  },
);


test(
  "chatbot stylesheet is injected once",
  () => {
    const documentRef =
      new FakeDocument();

    const first =
      ensureChatbotStylesheet({
        documentRef,
      });

    const second =
      ensureChatbotStylesheet({
        documentRef,
      });

    assert.equal(
      first.created,
      true,
    );

    assert.equal(
      second.reused,
      true,
    );

    assert.equal(
      first.element,
      second.element,
    );

    assert.equal(
      typeof first.href,
      "string",
    );

    assert.match(
      first.href,
      /chatbot\.css$/,
    );

    assert.equal(
      documentRef.getElementById(
        CHATBOT_STYLES_ID,
      ),
      first.element,
    );
  },
);


test(
  "MOB-H2 mobile or touch launch does not auto-focus the composer",
  () => {
    assert.equal(
      shouldAutoFocusComposerOnLauncher({
        windowRef: {
          innerWidth: 390,
          navigator: {
            maxTouchPoints: 5,
          },
        },
      }),
      false,
    );

    assert.equal(
      shouldAutoFocusComposerOnLauncher({
        windowRef: {
          innerWidth: 1280,
          navigator: {
            maxTouchPoints: 0,
          },
        },
      }),
      true,
    );
  },
);


test(
  "MOB-H2.1 mobile submit dismisses the virtual keyboard while desktop keeps focus",
  () => {
    assert.equal(
      shouldDismissComposerKeyboardAfterSubmit({
        windowRef: {
          innerWidth: 390,
          navigator: {
            maxTouchPoints: 5,
          },
        },
      }),
      true,
    );

    assert.equal(
      shouldDismissComposerKeyboardAfterSubmit({
        windowRef: {
          innerWidth: 1280,
          navigator: {
            maxTouchPoints: 0,
          },
        },
      }),
      false,
    );
  },
);


/**
 * ============================================================
 * BOOTSTRAP
 * ============================================================
 */

test(
  "bootstrap mounts launcher and reaches READY without auto-opening",
  () => {
    cleanRuntime();

    const documentRef =
      new FakeDocument({
        title:
          "Víctor Guzmán",
      });

    const windowRef =
      new FakeWindow({
        pathname:
          "/victorguzman/",
      });

    const fakeStorage =
      new FakeStorage();

    const api =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

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

    assert.ok(
      api.root.querySelector(
        "[data-vg-chatbot-launcher]",
      ),
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "bootstrap is a true window singleton",
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
      windowRef[
        CHATBOT_GLOBAL_KEY
      ],
      first,
    );

    assert.equal(
      documentRef
        .querySelectorAll(
          `#${CHATBOT_ROOT_ID}`,
        )
        .length,
      1,
    );

    first.destroy({
      flush: false,
    });
  },
);


test(
  "restored session keeps conversation but page.current is recalculated",
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
        "Tengo varios Excel",
    });

    state.mergeEntities({
      contact: {
        name: "Ana",
      },
    });

    const original =
      state.getState();

    storage.saveState();

    state.resetState();

    const documentRef =
      new FakeDocument({
        title:
          "Soluciones",
      });

    const windowRef =
      new FakeWindow({
        pathname:
          "/victorguzman/soluciones.html",
      });

    const api =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          fakeStorage,

        startPersistence:
          false,
      });

    const restored =
      state.getState();

    assert.equal(
      restored.meta.sessionId,
      original.meta.sessionId,
    );

    assert.equal(
      restored.conversation
        .messages.length,
      1,
    );

    assert.equal(
      restored.entities.contact.name,
      "Ana",
    );

    assert.equal(
      restored.page.current.pageId,
      "soluciones",
    );

    assert.equal(
      restored.page.current.pageType,
      "solutions",
    );

    assert.equal(
      restored.bootstrap
        .restoredFromSession,
      true,
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "NAV-H1.3 diagnostic bootstrap removes restored pending question before arrival handoff",
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
        "Trabajo con varios Excel que tengo que consolidar manualmente.",
    });

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.ASSISTANT,
      text:
        "Sí, aquí hay bastante margen para quitar trabajo manual.",
      responseId:
        "response-problem-flow-problem-manual-data-consolidation",
    });

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.ASSISTANT,
      text:
        "¿Qué te lleva más tiempo ahora: juntar los archivos, limpiar los datos o preparar el resultado final?",
      responseId:
        "response-problem-flow-problem-manual-data-consolidation",
    });

    state.setLastAction(
      "action-problem-flow-diagnostic",
    );

    storage.saveState();
    state.resetState();

    const api =
      bootstrapChatbot({
        documentRef:
          new FakeDocument({
            title:
              "Diagnóstico",
          }),
        windowRef:
          new FakeWindow({
            pathname:
              "/victorguzman/diagnostico.html",
          }),
        storageRef:
          fakeStorage,
        startPersistence:
          false,
      });

    const restored =
      state.getState();

    const visibleTexts =
      restored.conversation.messages
        .map((message) => message.text)
        .filter(Boolean);

    assert.equal(
      visibleTexts.some(
        (text) =>
          text.includes(
            "¿Qué te lleva más tiempo ahora",
          ),
      ),
      false,
    );

    assert.equal(
      visibleTexts.some(
        (text) =>
          text.includes(
            "Te he traído al diagnóstico",
          ),
      ),
      true,
    );

    assert.equal(
      restored.conversation.lastAction,
      null,
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "bootstrap detects reduced motion",
  () => {
    cleanRuntime();

    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow({
        reducedMotion: true,
      });

    const api =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          new FakeStorage(),

        startPersistence:
          false,
      });

    assert.equal(
      state
        .getState()
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

    api.destroy({
      flush: false,
    });
  },
);


test(
  "hashchange updates pageContext without creating previous page",
  () => {
    cleanRuntime();

    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow({
        pathname:
          "/victorguzman/",

        hash: "",
      });

    const api =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          new FakeStorage(),

        startPersistence:
          false,
      });

    windowRef.location.hash =
      "#servicios";

    windowRef.emit(
      "hashchange",
    );

    const current =
      state.getState();

    assert.equal(
      current.page.current.section,
      "servicios",
    );

    assert.equal(
      current.page.previous,
      null,
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "core remains lazy until explicitly requested",
  () => {
    cleanRuntime();

    const api =
      bootstrapChatbot({
        documentRef:
          new FakeDocument(),

        windowRef:
          new FakeWindow(),

        storageRef:
          new FakeStorage(),

        startPersistence:
          false,
      });

    assert.equal(
      state
        .getState()
        .bootstrap
        .coreLoaded,
      false,
    );

    assert.equal(
      api.isCoreLoaded(),
      false,
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "ensureCoreLoaded loads once and updates bootstrap state",
  async () => {
    cleanRuntime();

    const api =
      bootstrapChatbot({
        documentRef:
          new FakeDocument(),

        windowRef:
          new FakeWindow(),

        storageRef:
          new FakeStorage(),

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
      typeof first.nlu,
      "object",
    );

    assert.equal(
      typeof first.knowledge,
      "object",
    );

    assert.equal(
      state
        .getState()
        .bootstrap
        .coreLoaded,
      true,
    );

    assert.equal(
      state
        .getState()
        .bootstrap
        .coreLoading,
      false,
    );

    api.destroy({
      flush: false,
    });
  },
);


test(
  "destroy removes owned root and global singleton",
  () => {
    cleanRuntime();

    const documentRef =
      new FakeDocument();

    const windowRef =
      new FakeWindow();

    const api =
      bootstrapChatbot({
        documentRef,
        windowRef,
        storageRef:
          new FakeStorage(),

        startPersistence:
          false,
      });

    assert.ok(
      windowRef[
        CHATBOT_GLOBAL_KEY
      ],
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
      state
        .getState()
        .bootstrap
        .shellMounted,
      false,
    );
  },
);


/**
 * ============================================================
 * HTML INTEGRATION
 * ============================================================
 */

test(
  "all current portfolio HTML files include chatbot module",
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

      assert.match(
        html,
        /<script\s+type=["']module["']\s+src=["']assets\/chatbot\/chatbot\.js(?:\?v=[^"']+)?["']\s*><\/script>/,
        `${relativePath} must include chatbot.js`,
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

      assert.match(
        html,
        /<script\s+type=["']module["']\s+src=["']\.\.\/assets\/chatbot\/chatbot\.js(?:\?v=[^"']+)?["']\s*><\/script>/,
        `${relativePath} must include chatbot.js`,
      );
    }
  },
);