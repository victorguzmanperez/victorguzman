import test from "node:test";
import assert from "node:assert/strict";

import {
  renderConversationState,
  renderResponseInteractions,
} from "../ui/conversation-renderer.js";


class FakeElement {
  constructor(tagName) {
    this.tagName =
      tagName.toUpperCase();
    this.className = "";
    this.textContent = "";
    this.type = "";
    this.disabled = false;
    this.children = [];
    this.parentNode = null;
    this.attributes =
      new Map();
    this.listeners =
      new Map();
    this.scrollHeight = 100;
    this.scrollTop = 0;
  }

  setAttribute(name, value) {
    this.attributes.set(
      name,
      String(value),
    );
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index =
      this.children.indexOf(child);

    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }

    return child;
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(
        type,
        new Set(),
      );
    }
    this.listeners.get(type).add(listener);
  }

  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) ?? []) {
      listener.call(this, event);
    }
  }

  querySelectorAll(selector) {
    if (selector !== "button") {
      return [];
    }
    return this.children.filter(
      (child) =>
        child.tagName === "BUTTON",
    );
  }
}


class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
}


function response() {
  return {
    quickReplies: [
      {
        id: "qr-projects",
        label: "Proyectos",
        kind: "intent",
        value: "projects",
      },
      {
        id: "qr-technologies",
        label: "Tecnologías",
        kind: "answer",
        value: "¿Qué tecnologías conoce Víctor?",
      },
    ],
    actions: [
      {
        id: "action-contact",
        type: "open-contact",
        label: "Contactar con Víctor",
        priority: "primary",
        target: "contact-victor-portfolio",
        requiresConfirmation: false,
      },
    ],
  };
}


test(
  "response interactions render quick replies and actions as buttons",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");

    const result =
      renderResponseInteractions({
        shellController: {
          messages,
        },
        response:
          response(),
        documentRef,
      });

    assert.deepEqual(
      result,
      {
        rendered: true,
        quickReplies: 2,
        actions: 1,
      },
    );

    assert.equal(
      messages.children.length,
      1,
    );

    const container =
      messages.children[0];

    assert.equal(
      container.children.length,
      3,
    );

    assert.equal(
      container.children[0].textContent,
      "Proyectos",
    );

    assert.equal(
      container.children[2].getAttribute(
        "data-action-priority",
      ),
      "primary",
    );
  },
);


test(
  "clicking a quick reply invokes callback and disables all controls",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");
    const activated = [];

    renderResponseInteractions({
      shellController: {
        messages,
      },
      response:
        response(),
      documentRef,
      onQuickReply(item) {
        activated.push(item.id);
      },
    });

    const container =
      messages.children[0];

    container.children[0]
      .dispatchEvent({
        type: "click",
      });

    assert.deepEqual(
      activated,
      ["qr-projects"],
    );

    assert.ok(
      container.children.every(
        (button) =>
          button.disabled === true,
      ),
    );
  },
);


test(
  "clicking an action invokes action callback once",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");
    const activated = [];

    renderResponseInteractions({
      shellController: {
        messages,
      },
      response:
        response(),
      documentRef,
      onAction(item) {
        activated.push(item.id);
      },
    });

    const actionButton =
      messages.children[0]
        .children[2];

    actionButton.dispatchEvent({
      type: "click",
    });

    actionButton.dispatchEvent({
      type: "click",
    });

    assert.deepEqual(
      activated,
      ["action-contact"],
    );
  },
);



test(
  "conversation reset restores the shell empty state in the DOM",
  () => {
    const documentRef =
      new FakeDocument();

    const messages =
      new FakeElement("div");

    const emptyState =
      new FakeElement("div");

    messages.appendChild(
      new FakeElement("p"),
    );

    const result =
      renderConversationState({
        shellController: {
          messages,
          emptyState,
        },

        state: {
          conversation: {
            messages: [],
          },
        },

        documentRef,
      });

    assert.equal(
      result.rendered,
      false,
    );

    assert.equal(
      result.emptyStateRestored,
      true,
    );

    assert.equal(
      messages.children.length,
      1,
    );

    assert.equal(
      messages.children[0],
      emptyState,
    );
  },
);
