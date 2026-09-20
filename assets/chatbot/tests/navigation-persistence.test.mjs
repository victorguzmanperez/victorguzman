import test
  from "node:test";

import assert
  from "node:assert/strict";


import * as state
  from "../core/state.js";

import * as storage
  from "../core/storage.js";

import {
  bootstrapChatbot,
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
    selector.startsWith("#")
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


class FakeElement {
  constructor(
    tagName,
    ownerDocument,
  ) {
    this.tagName =
      tagName.toUpperCase();

    this.ownerDocument =
      ownerDocument;

    this.id = "";

    this.className = "";

    this.textContent = "";

    this.value = "";

    this.hidden = false;

    this.disabled = false;

    this.dataset = {};

    this.children = [];

    this.parentNode = null;

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


  getAttribute(name) {
    return this.attributes.has(
      name,
    )
      ? this.attributes.get(name)
      : null;
  }


  removeAttribute(name) {
    this.attributes.delete(
      name,
    );
  }


  appendChild(child) {
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


  removeChild(child) {
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
      !this.listeners.has(type)
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
      ?.delete(listener);
  }


  dispatchEvent(event) {
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

    return true;
  }


  focus() {
    if (this.ownerDocument) {
      this.ownerDocument
        .activeElement =
        this;
    }
  }


  requestSubmit() {
    this.dispatchEvent({
      type: "submit",

      target: this,

      currentTarget: this,

      preventDefault() {},
    });
  }


  querySelector(selector) {
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
    title = "Test page",
    lang = "es",
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


  getElementById(id) {
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
      !this.listeners.has(type)
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
      ?.delete(listener);
  }


  dispatchEvent(event) {
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

    hash = "",

    reducedMotion =
      false,
  } = {}) {
    this.location = {
      pathname,
      hash,
    };

    this.listeners =
      new Map();

    this.CustomEvent =
      FakeCustomEvent;

    this.reducedMotion =
      reducedMotion;


    this.requestAnimationFrame =
      (callback) => {
        callback();

        return 1;
      };
  }


  matchMedia(query) {
    assert.equal(
      query,
      "(prefers-reduced-motion: reduce)",
    );

    return {
      matches:
        this.reducedMotion,

      addEventListener() {},

      removeEventListener() {},
    };
  }


  addEventListener(
    type,
    listener,
  ) {
    if (
      !this.listeners.has(type)
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
      ?.delete(listener);
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
  }


  getItem(key) {
    return this.data.has(key)
      ? this.data.get(key)
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


  removeItem(key) {
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

function resetRuntime() {
  storage.stopStorageSync({
    flush: false,
  });

  state.resetState();
}


function bootstrapPage({
  pathname,
  storageRef,
  title = "Test page",
  startPersistence = true,
} = {}) {
  const documentRef =
    new FakeDocument({
      title,
    });

  const windowRef =
    new FakeWindow({
      pathname,
    });


  const api =
    bootstrapChatbot({
      documentRef,
      windowRef,
      storageRef,

      startPersistence,

      bindPagehide: false,
    });


  return {
    api,
    documentRef,
    windowRef,
  };
}


/**
 * Simula abandonar un documento real.
 *
 * destroy({ flush: true }) fuerza la escritura
 * pendiente antes de abandonar la página.
 *
 * resetState() simula que el nuevo documento
 * vuelve a cargar state.js desde cero.
 */
function leavePage(api) {
  api.destroy({
    flush: true,
  });

  state.resetState();
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
 * 1 — OPEN / CLOSED
 * ============================================================
 */

test(
  "open panel survives page A to page B navigation",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,

        title:
          "Inicio",
      });


    pageA.api.shell.open();


    assert.equal(
      state
        .getState()
        .ui.isOpen,
      true,
    );


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,

        title:
          "Soluciones",
      });


    assert.equal(
      pageB.api.shell.isOpen(),
      true,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      true,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


test(
  "closed panel remains closed across navigation",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    assert.equal(
      pageA.api.shell.isOpen(),
      false,
    );


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    assert.equal(
      pageB.api.shell.isOpen(),
      false,
    );

    assert.equal(
      state
        .getState()
        .ui.isOpen,
      false,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 2 — CONVERSATION
 * ============================================================
 */

test(
  "conversation and sessionId survive document navigation",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Tengo varios Excel",
    });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.ASSISTANT,

      text:
        "Puedo ayudarte a analizar el proceso.",
    });


    const before =
      state.getState();

    const sessionId =
      before.meta.sessionId;

    const conversationId =
      before.conversation.id;


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    const after =
      state.getState();


    assert.equal(
      after.meta.sessionId,
      sessionId,
    );

    assert.equal(
      after.conversation.id,
      conversationId,
    );

    assert.equal(
      after.conversation.messages.length,
      2,
    );

    assert.equal(
      after.conversation.messages[0]
        .text,
      "Tengo varios Excel",
    );

    assert.equal(
      after.conversation.turnCount,
      1,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 3 — ENTITIES + DIAGNOSTIC
 * ============================================================
 */

test(
  "entities and diagnostic survive navigation",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.mergeEntities({
      contact: {
        name:
          "Ana",

        company:
          "Empresa Demo",
      },

      case: {
        tools: [
          "excel",
          "power-bi",
        ],

        currentProcess:
          "manual",

        users: 5,
      },
    });


    state.setDiagnosticStatus(
      state.DIAGNOSTIC_STATUS
        .COLLECTING,
    );


    state.updateDiagnosticFields({
      name:
        "Ana",

      company:
        "Empresa Demo",

      currentProcess:
        "manual",

      users: 5,

      objective:
        "Automatizar",
    });


    state.updateDiagnosticAssessment({
      missingFields: [
        "email",
        "timeframe",
      ],

      completionRatio:
        0.75,

      summary: {
        situation:
          "Proceso manual",

        objective:
          "Automatizar",
      },
    });


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/diagnostico.html",

        storageRef:
          fakeStorage,
      });


    const restored =
      state.getState();


    assert.equal(
      restored.entities
        .contact.name,
      "Ana",
    );

    assert.equal(
      restored.entities
        .contact.company,
      "Empresa Demo",
    );

    assert.deepEqual(
      restored.entities.case.tools,
      [
        "excel",
        "power-bi",
      ],
    );

    assert.equal(
      restored.diagnostic.status,
      state.DIAGNOSTIC_STATUS
        .COLLECTING,
    );

    assert.equal(
      restored.diagnostic.fields
        .objective,
      "Automatizar",
    );

    assert.equal(
      restored.diagnostic
        .completionRatio,
      0.75,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 4 — RECOMMENDATIONS / BOOKING / ANALYTICS
 * ============================================================
 */

test(
  "recommendations booking and analytics flags survive navigation",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.addRecommendation({
      type:
        state.RECOMMENDATION_TYPE
          .PROJECT,

      id:
        "dashboard-pyme",

      reasonCode:
        "powerbi_reporting_match",

      shown: true,
    });


    state.setBookingStatus(
      state.BOOKING_STATUS.OFFERED,
      {
        source:
          "chatbot",
      },
    );


    state.markAnalyticsFlagSent(
      state.ANALYTICS_FLAG
        .CHAT_START_SENT,
    );


    state.markAnalyticsFlagSent(
      state.ANALYTICS_FLAG
        .GENERATE_LEAD_SENT,
    );


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    const restored =
      state.getState();


    assert.equal(
      restored.recommendations
        .projects.length,
      1,
    );

    assert.equal(
      restored.recommendations
        .projects[0].id,
      "dashboard-pyme",
    );

    assert.equal(
      restored.booking.status,
      state.BOOKING_STATUS.OFFERED,
    );

    assert.equal(
      restored.booking.source,
      "chatbot",
    );

    assert.equal(
      restored.analytics
        .chatStartSent,
      true,
    );

    assert.equal(
      restored.analytics
        .generateLeadSent,
      true,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 5 — PAGE CURRENT / PREVIOUS
 * ============================================================
 */

test(
  "page.current is recalculated and previous becomes page A",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,

        title:
          "Inicio",
      });


    assert.equal(
      state
        .getState()
        .page.current.pageId,
      "home",
    );


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,

        title:
          "Soluciones",
      });


    const page =
      state.getState().page;


    assert.equal(
      page.current.pageId,
      "soluciones",
    );

    assert.equal(
      page.current.pageType,
      "solutions",
    );

    assert.equal(
      page.previous.pageId,
      "home",
    );

    assert.equal(
      page.previous.path,
      "/victorguzman/index.html",
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


test(
  "project context never leaks into next non-project page",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const projectPage =
      bootstrapPage({
        pathname:
          "/victorguzman/projects/investment.html",

        storageRef:
          fakeStorage,

        title:
          "Investment",
      });


    assert.equal(
      state
        .getState()
        .page.current.projectId,
      "investment",
    );


    leavePage(
      projectPage.api,
    );


    const solutionsPage =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    const page =
      state.getState().page;


    assert.equal(
      page.current.projectId,
      null,
    );

    assert.equal(
      page.previous.projectId,
      "investment",
    );


    solutionsPage.api.destroy({
      flush: false,
    });
  },
);


test(
  "refreshing same page does not make page previous to itself",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const firstLoad =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    leavePage(
      firstLoad.api,
    );


    const refreshed =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    const page =
      state.getState().page;


    assert.equal(
      page.current.pageId,
      "home",
    );

    assert.equal(
      page.previous,
      null,
    );


    refreshed.api.destroy({
      flush: false,
    });
  },
);


test(
  "three-page navigation tracks the immediately previous page",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    assert.equal(
      state
        .getState()
        .page.previous.pageId,
      "home",
    );


    leavePage(
      pageB.api,
    );


    const pageC =
      bootstrapPage({
        pathname:
          "/victorguzman/diagnostico.html",

        storageRef:
          fakeStorage,
      });


    const page =
      state.getState().page;


    assert.equal(
      page.current.pageId,
      "diagnostico",
    );

    assert.equal(
      page.previous.pageId,
      "soluciones",
    );


    pageC.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 6 — EPHEMERAL STATE
 * ============================================================
 */

test(
  "ephemeral technical state is not restored on next page",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.updateState(
      (draft) => {
        draft.ui.typing =
          true;

        draft.ui.avatarState =
          state.AVATAR_STATUS
            .THINKING;

        draft.ui.reducedMotion =
          true;

        draft.understanding
          .lastAnalysis = {
          technical:
            "do not persist",
        };

        draft.errors.count =
          1;

        draft.errors.lastError = {
          code:
            "TEST_ERROR",

          occurredAt:
            new Date()
              .toISOString(),
        };
      },
      {
        source:
          "test:ephemeral_navigation",
      },
    );


    leavePage(
      pageA.api,
    );


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    const restored =
      state.getState();


    assert.equal(
      restored.ui.typing,
      false,
    );

    assert.equal(
      restored.ui.avatarState,
      state.AVATAR_STATUS.IDLE,
    );

    /**
     * Nueva página:
     * se vuelve a detectar desde matchMedia.
     */
    assert.equal(
      restored.ui.reducedMotion,
      false,
    );

    assert.equal(
      restored.understanding
        .lastAnalysis,
      null,
    );

    assert.equal(
      restored.errors.count,
      0,
    );

    assert.equal(
      restored.errors.lastError,
      null,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 7 — FLUSH
 * ============================================================
 */

test(
  "leaving a page flushes latest state without waiting for debounce",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.setUiOpen(
      true,
    );


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Último cambio antes de navegar",
    });


    /**
     * No esperamos 100 ms.
     * destroy({flush:true}) debe persistirlo.
     */
    pageA.api.destroy({
      flush: true,
    });


    const persisted =
      rawPersisted(
        fakeStorage,
      );


    assert.equal(
      persisted.ui.isOpen,
      true,
    );

    assert.equal(
      persisted.conversation
        .messages.length,
      1,
    );

    assert.equal(
      persisted.conversation
        .messages[0].text,
      "Último cambio antes de navegar",
    );
  },
);


/**
 * ============================================================
 * 8 — TTL
 * ============================================================
 */

test(
  "expired session is discarded on next document",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Esta sesión expirará",
    });


    const oldSessionId =
      state
        .getState()
        .meta.sessionId;


    pageA.api.destroy({
      flush: true,
    });


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


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    const current =
      state.getState();


    assert.equal(
      pageB.api.restoreResult
        .restored,
      false,
    );

    assert.equal(
      pageB.api.restoreResult
        .reason,
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
      current.ui.isOpen,
      false,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 9 — SCHEMA
 * ============================================================
 */

test(
  "incompatible schema is discarded on next document",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const pageA =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Estado antiguo",
    });


    pageA.api.destroy({
      flush: true,
    });


    const persisted =
      rawPersisted(
        fakeStorage,
      );


    persisted.meta.schemaVersion =
      999;


    fakeStorage.setItem(
      storage.STORAGE_KEY,
      JSON.stringify(
        persisted,
      ),
    );


    state.resetState();


    const pageB =
      bootstrapPage({
        pathname:
          "/victorguzman/soluciones.html",

        storageRef:
          fakeStorage,
      });


    assert.equal(
      pageB.api.restoreResult
        .restored,
      false,
    );

    assert.equal(
      pageB.api.restoreResult
        .reason,
      "incompatible_schema",
    );

    assert.equal(
      state
        .getState()
        .conversation.messages.length,
      0,
    );


    pageB.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 10 — NEW SESSION
 * ============================================================
 */

test(
  "empty storage starts a clean anonymous session",
  () => {
    resetRuntime();

    const fakeStorage =
      new FakeStorage();


    const page =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          fakeStorage,
      });


    const current =
      state.getState();


    assert.equal(
      page.api.restoreResult
        .restored,
      false,
    );

    assert.equal(
      page.api.restoreResult
        .reason,
      "missing",
    );

    assert.equal(
      typeof current.meta.sessionId,
      "string",
    );

    assert.ok(
      current.meta.sessionId.length >
        0,
    );

    assert.equal(
      current.conversation
        .messages.length,
      0,
    );

    assert.equal(
      current.entities
        .contact.name,
      null,
    );

    assert.equal(
      current.ui.isOpen,
      false,
    );


    page.api.destroy({
      flush: false,
    });
  },
);


/**
 * ============================================================
 * 11 — STORAGE BLOCKED
 * ============================================================
 */

test(
  "blocked sessionStorage does not break bootstrap",
  () => {
    resetRuntime();


    const page =
      bootstrapPage({
        pathname:
          "/victorguzman/index.html",

        storageRef:
          new BrokenStorage(),
      });


    assert.equal(
      page.api.storageStatus
        .persistent,
      false,
    );

    assert.equal(
      page.api.storageStatus
        .mode,
      "memory",
    );

    assert.equal(
      state
        .getState()
        .bootstrap.status,
      state.BOOTSTRAP_STATUS.READY,
    );


    assert.doesNotThrow(
      () => {
        page.api.shell.open();
        page.api.shell.close();
      },
    );


    page.api.destroy({
      flush: false,
    });
  },
);