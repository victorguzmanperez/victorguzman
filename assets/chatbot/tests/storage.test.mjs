import test from "node:test";
import assert from "node:assert/strict";

import * as state
  from "../core/state.js";

import * as storage
  from "../core/storage.js";

/**
 * SessionStorage falso para Node.
 */
class FakeStorage {
  constructor() {
    this.data =
      new Map();

    this.writeCount = 0;
    this.readCount = 0;
    this.removeCount = 0;
  }

  getItem(key) {
    this.readCount += 1;

    return this.data.has(key)
      ? this.data.get(key)
      : null;
  }

  setItem(key, value) {
    this.writeCount += 1;

    this.data.set(
      String(key),
      String(value),
    );
  }

  removeItem(key) {
    this.removeCount += 1;

    this.data.delete(
      String(key),
    );
  }

  clear() {
    this.data.clear();
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

function createStorage() {
  const fake =
    new FakeStorage();

  storage.initStorage({
    storage: fake,
  });

  /**
   * El probe de disponibilidad cuenta como
   * una escritura técnica.
   */
  fake.writeCount = 0;
  fake.readCount = 0;
  fake.removeCount = 0;

  return fake;
}

function resetEnvironment() {
  storage.stopStorageSync({
    flush: false,
  });

  state.resetState();

  return createStorage();
}

test(
  "sessionStorage backend is detected",
  () => {
    resetEnvironment();

    const status =
      storage.getStorageStatus();

    assert.equal(
      status.initialized,
      true,
    );

    assert.equal(
      status.persistent,
      true,
    );

    assert.equal(
      status.mode,
      "sessionStorage",
    );

    assert.equal(
      status.key,
      storage.STORAGE_KEY,
    );
  },
);

test(
  "persisted payload uses an explicit whitelist",
  () => {
    resetEnvironment();

    state.updateState(
      (draft) => {
        draft.ui.typing = true;

        draft.ui.avatarState =
          state.AVATAR_STATUS
            .THINKING;

        draft.ui.reducedMotion =
          true;

        draft.understanding
          .lastAnalysis = {
          technical:
            "must not persist",
        };

        draft.errors.count = 1;

        draft.errors.lastError = {
          code: "TEST_ERROR",
          occurredAt:
            new Date()
              .toISOString(),
        };
      },
      {
        source:
          "test:ephemeral",
      },
    );

    const payload =
      storage.buildPersistedState();

    assert.equal(
      "bootstrap" in payload,
      false,
    );

    assert.equal(
      "errors" in payload,
      false,
    );

    assert.deepEqual(
      Object.keys(
        payload.ui,
      ).sort(),
      [
        "isOpen",
        "unreadCount",
      ].sort(),
    );

    assert.equal(
      "current" in payload.page,
      false,
    );

    assert.equal(
      "typing" in payload.ui,
      false,
    );

    assert.equal(
      "avatarState" in payload.ui,
      false,
    );

    assert.equal(
      "reducedMotion" in payload.ui,
      false,
    );

    assert.equal(
      "lastAnalysis" in
        payload.understanding,
      false,
    );

    assert.equal(
      "confidence" in
        payload.understanding,
      false,
    );
  },
);

test(
  "state can be saved and restored",
  () => {
    const fake =
      resetEnvironment();

    state.setUiOpen(true);

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Tengo 20 Excel",
    });

    state.mergeEntities({
      contact: {
        name: "Ana",
      },

      case: {
        tools: [
          "excel",
          "power-bi",
        ],

        volume: {
          files: 20,
        },
      },
    });

    state.setDiagnosticStatus(
      state.DIAGNOSTIC_STATUS
        .COLLECTING,
    );

    const original =
      state.getState();

    const saveResult =
      storage.saveState();

    assert.equal(
      saveResult.saved,
      true,
    );

    assert.equal(
      fake.data.has(
        storage.STORAGE_KEY,
      ),
      true,
    );

    state.resetState();

    assert.equal(
      state
        .getState()
        .entities.contact.name,
      null,
    );

    const loadResult =
      storage.loadState();

    assert.equal(
      loadResult.restored,
      true,
    );

    const restored =
      state.getState();

    assert.equal(
      restored.meta.sessionId,
      original.meta.sessionId,
    );

    assert.equal(
      restored.entities
        .contact.name,
      "Ana",
    );

    assert.equal(
      restored.conversation
        .messages.length,
      1,
    );

    assert.deepEqual(
      restored.entities.case.tools,
      [
        "excel",
        "power-bi",
      ],
    );

    assert.equal(
      restored.entities.case.volume
        .files,
      20,
    );

    assert.equal(
      restored.ui.isOpen,
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
  },
);

test(
  "page.current is never restored and last current becomes previous navigation candidate",
  () => {
    const fake =
      resetEnvironment();


    /**
     * Primera página visitada.
     */
    state.setPageContext({
      path:
        "/proyectos/dashboard-pyme/",

      pageId:
        "dashboard-pyme",

      pageType:
        "project",

      section:
        "projects",

      locale:
        "es",

      projectId:
        "dashboard-pyme",
    });


    /**
     * Navegamos dentro del mismo documento/runtime
     * hacia servicios.
     *
     * En este momento:
     *
     * current  = /servicios/
     * previous = /proyectos/dashboard-pyme/
     */
    state.setPageContext({
      path:
        "/servicios/",

      pageId:
        "services",

      pageType:
        "listing",

      section:
        "services",

      locale:
        "es",
    });


    const beforeSave =
      state.getState();


    assert.equal(
      beforeSave.page.current.path,
      "/servicios/",
    );


    assert.equal(
      beforeSave.page.previous.path,
      "/proyectos/dashboard-pyme/",
    );


    storage.saveState();


    /**
     * Comprobamos también el contrato físico
     * que queda escrito en sessionStorage.
     *
     * page.current NO se persiste.
     *
     * La página que estamos abandonando
     * (/servicios/) queda como previous,
     * preparada para el siguiente documento.
     */
    const persisted =
      JSON.parse(
        fake.getItem(
          storage.STORAGE_KEY,
        ),
      );


    assert.equal(
      "current" in persisted.page,
      false,
    );


    assert.equal(
      persisted.page.previous.path,
      "/servicios/",
    );


    assert.equal(
      persisted.page.previous.pageId,
      "services",
    );


    /**
     * Simulamos un documento nuevo.
     */
    state.resetState();


    storage.loadState();


    const restored =
      state.getState();


    /**
     * current pertenece exclusivamente
     * al documento real que se cargará.
     *
     * storage.js nunca debe restaurarlo.
     */
    assert.equal(
      restored.page.current.path,
      null,
    );


    assert.equal(
      restored.page.current.pageId,
      null,
    );


    assert.equal(
      restored.page.current.projectId,
      null,
    );


    /**
     * La última página real del documento
     * anterior sí se restaura como previous.
     */
    assert.equal(
      restored.page.previous.path,
      "/servicios/",
    );


    assert.equal(
      restored.page.previous.pageId,
      "services",
    );


    assert.equal(
      restored.page.previous.projectId,
      null,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );
  },
);

test(
  "lastAnalysis and ephemeral UI are not restored",
  () => {
    resetEnvironment();

    state.updateState(
      (draft) => {
        draft.ui.typing = true;

        draft.ui.avatarState =
          state.AVATAR_STATUS
            .SPEAKING;

        draft.ui.reducedMotion =
          true;

        draft.understanding
          .lastAnalysis = {
          normalizedText:
            "secret technical copy",
        };
      },
      {
        source:
          "test:ephemeral",
      },
    );

    storage.saveState();

    state.resetState();

    storage.loadState();

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

    assert.equal(
      restored.ui.reducedMotion,
      false,
    );

    assert.equal(
      restored.understanding
        .lastAnalysis,
      null,
    );
  },
);

test(
  "expired state is discarded",
  () => {
    const fake =
      resetEnvironment();

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text: "Hola",
    });

    storage.saveState();

    const raw =
      JSON.parse(
        fake.getItem(
          storage.STORAGE_KEY,
        ),
      );

    raw.meta.updatedAt =
      new Date(
        Date.now() -
        storage.STORAGE_TTL_MS -
        1000,
      ).toISOString();

    fake.setItem(
      storage.STORAGE_KEY,
      JSON.stringify(raw),
    );

    state.resetState();

    const result =
      storage.loadState();

    assert.equal(
      result.restored,
      false,
    );

    assert.equal(
      result.reason,
      "expired",
    );

    assert.equal(
      fake.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );
  },
);

test(
  "incompatible schema is discarded",
  () => {
    const fake =
      resetEnvironment();

    storage.saveState();

    const raw =
      JSON.parse(
        fake.getItem(
          storage.STORAGE_KEY,
        ),
      );

    raw.meta.schemaVersion =
      999;

    fake.setItem(
      storage.STORAGE_KEY,
      JSON.stringify(raw),
    );

    state.resetState();

    const result =
      storage.loadState();

    assert.equal(
      result.restored,
      false,
    );

    assert.equal(
      result.reason,
      "incompatible_schema",
    );

    assert.equal(
      fake.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );
  },
);

test(
  "invalid JSON is discarded safely",
  () => {
    const fake =
      resetEnvironment();

    fake.setItem(
      storage.STORAGE_KEY,
      "{not valid json",
    );

    const result =
      storage.loadState();

    assert.equal(
      result.restored,
      false,
    );

    assert.equal(
      result.reason,
      "invalid_json",
    );

    assert.equal(
      fake.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );
  },
);

test(
  "unknown or unsafe fields are rejected",
  () => {
    const fake =
      resetEnvironment();

    state.mergeEntities({
      contact: {
        name: "Ana",
      },
    });

    storage.saveState();

    const raw =
      JSON.parse(
        fake.getItem(
          storage.STORAGE_KEY,
        ),
      );

    raw.analytics.email =
      "ana@example.com";

    fake.setItem(
      storage.STORAGE_KEY,
      JSON.stringify(raw),
    );

    state.resetState();

    const result =
      storage.loadState();

    assert.equal(
      result.restored,
      false,
    );

    assert.equal(
      result.reason,
      "invalid_state",
    );

    assert.equal(
      state
        .getState()
        .entities.contact.name,
      null,
    );
  },
);

test(
  "blocked sessionStorage degrades to memory",
  () => {
    storage.stopStorageSync({
      flush: false,
    });

    state.resetState();

    storage.initStorage({
      storage:
        new BrokenStorage(),
    });

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text:
        "Persistencia degradada",
    });

    const saveResult =
      storage.saveState();

    assert.equal(
      saveResult.saved,
      true,
    );

    assert.equal(
      saveResult.mode,
      "memory",
    );

    assert.equal(
      storage
        .getStorageStatus()
        .persistent,
      false,
    );

    state.resetState();

    const loadResult =
      storage.loadState();

    assert.equal(
      loadResult.restored,
      true,
    );

    assert.equal(
      state
        .getState()
        .conversation.messages[0]
        .text,
      "Persistencia degradada",
    );
  },
);

test(
  "identical payload is not written twice",
  () => {
    const fake =
      resetEnvironment();

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text: "Hola",
    });

    const first =
      storage.saveState();

    const writesAfterFirst =
      fake.writeCount;

    const second =
      storage.saveState();

    assert.equal(
      first.saved,
      true,
    );

    assert.equal(
      second.saved,
      false,
    );

    assert.equal(
      second.reason,
      "unchanged",
    );

    assert.equal(
      fake.writeCount,
      writesAfterFirst,
    );
  },
);

test(
  "debounce coalesces rapid state changes",
  async () => {
    const fake =
      resetEnvironment();

    storage.startStorageSync({
      bindPagehide: false,
    });

    /**
     * Ignoramos cualquier escritura
     * anterior al bloque probado.
     */
    fake.writeCount = 0;

    state.setUiOpen(true);

    state.incrementFallback();

    state.setLastAction(
      "test_action",
    );

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          storage
            .STORAGE_DEBOUNCE_MS +
            50,
        ),
    );

    assert.equal(
      fake.writeCount,
      1,
    );

    storage.stopStorageSync({
      flush: false,
    });
  },
);

test(
  "flushStateSave writes immediately",
  () => {
    const fake =
      resetEnvironment();

    storage.startStorageSync({
      bindPagehide: false,
    });

    fake.writeCount = 0;

    state.setUiOpen(true);

    assert.equal(
      storage
        .getStorageStatus()
        .pendingSave,
      true,
    );

    storage.flushStateSave();

    assert.equal(
      fake.writeCount,
      1,
    );

    assert.equal(
      storage
        .getStorageStatus()
        .pendingSave,
      false,
    );

    storage.stopStorageSync({
      flush: false,
    });
  },
);

test(
  "clearState removes persisted data",
  () => {
    const fake =
      resetEnvironment();

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,

      text: "Hola",
    });

    storage.saveState();

    assert.notEqual(
      fake.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );

    storage.clearState();

    assert.equal(
      fake.getItem(
        storage.STORAGE_KEY,
      ),
      null,
    );

    const info =
      storage.getPersistedStateInfo();

    assert.equal(
      info.exists,
      false,
    );
  },
);

test(
  "no more than 50 messages are persisted",
  () => {
    resetEnvironment();

    for (
      let index = 0;
      index < 70;
      index += 1
    ) {
      state.appendMessage({
        role:
          state.MESSAGE_ROLE
            .ASSISTANT,

        text:
          `Mensaje ${index}`,
      });
    }

    const payload =
      storage.buildPersistedState();

    assert.equal(
      payload.conversation
        .messages.length,
      50,
    );

    assert.equal(
      payload.conversation
        .messages[0].text,
      "Mensaje 20",
    );

    assert.equal(
      payload.conversation
        .messages[49].text,
      "Mensaje 69",
    );
  },
);
test(
  "semantic context is persisted and restored without free text",
  () => {
    resetEnvironment();

    state.setSemanticContext({
      relation:
        state.SEMANTIC_RELATION
          .EXPERIENCE_WITH,

      subjectType:
        state.SEMANTIC_SUBJECT_TYPE
          .TECHNOLOGY,

      subjectId:
        "technology-aws",
    });

    storage.saveState();

    state.resetState();

    storage.loadState();

    assert.deepEqual(
      state
        .getState()
        .understanding
        .semanticContext,
      {
        relation:
          "experience_with",

        subjectType:
          "technology",

        subjectId:
          "technology-aws",
      },
    );
  },
);
test(
  "conversation reset is flushed immediately and survives reload",
  () => {
    const fake =
      resetEnvironment();

    state.setUiOpen(
      true,
    );

    state.appendMessage({
      role:
        state.MESSAGE_ROLE.USER,
      text:
        "¿Qué tecnologías conoce Víctor?",
    });

    state.setSemanticContext({
      relation:
        state.SEMANTIC_RELATION
          .EXPERIENCE_WITH,

      subjectType:
        state.SEMANTIC_SUBJECT_TYPE
          .TECHNOLOGY,

      subjectId:
        "technology-aws",
    });

    storage.saveState();

    state.resetConversation();

    storage.flushStateSave();

    const raw =
      fake.getItem(
        storage.STORAGE_KEY,
      );

    const persisted =
      JSON.parse(raw);

    assert.equal(
      persisted.ui.isOpen,
      true,
    );

    assert.deepEqual(
      persisted.conversation.messages,
      [],
    );

    assert.deepEqual(
      persisted.understanding
        .semanticContext,
      {
        relation: null,
        subjectType: null,
        subjectId: null,
      },
    );

    state.resetState();
    storage.loadState();

    assert.equal(
      state.getState().ui.isOpen,
      true,
    );

    assert.deepEqual(
      state
        .getState()
        .conversation
        .messages,
      [],
    );
  },
);
