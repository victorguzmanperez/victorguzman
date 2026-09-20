import test from "node:test";
import assert from "node:assert/strict";

import {
  isConversationNearEnd,
  removeTypingIndicator,
  renderConversationState,
  renderTypingIndicator,
} from "../ui/conversation-renderer.js";

import {
  AVATAR_STATUS,
  getState,
  resetState,
  setUiAvatarState,
  setUiTyping,
} from "../core/state.js";


class FakeElement {
  constructor(tagName) {
    this.tagName =
      tagName.toUpperCase();
    this.className = "";
    this.textContent = "";
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.scrollTop = 0;
    this.scrollHeight = 500;
    this.clientHeight = 200;
  }

  setAttribute(name, value) {
    this.attributes.set(
      name,
      String(value),
    );
  }

  getAttribute(name) {
    return this.attributes.has(name)
      ? this.attributes.get(name)
      : null;
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
}


class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
}


function conversationState() {
  return {
    conversation: {
      messages: [
        {
          id: "u1",
          role: "user",
          text: "Hola",
        },
        {
          id: "a1",
          role: "assistant",
          text: "¡Hola!",
        },
      ],
    },
  };
}


test(
  "1.11.39 detects whether the visitor is near the end of the chat",
  () => {
    const messages =
      new FakeElement("div");

    messages.scrollTop = 250;

    assert.equal(
      isConversationNearEnd(
        messages,
      ),
      true,
    );

    messages.scrollTop = 40;

    assert.equal(
      isConversationNearEnd(
        messages,
      ),
      false,
    );
  },
);


test(
  "1.11.39 preserves scroll position when visitor is reading older messages",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");

    messages.scrollTop = 40;

    const result =
      renderConversationState({
        shellController: {
          messages,
        },
        state:
          conversationState(),
        documentRef,
      });

    assert.equal(
      result.autoScrolled,
      false,
    );

    assert.equal(
      messages.scrollTop,
      40,
    );
  },
);


test(
  "1.11.39 can force scroll to the newest turn without scrolling the page",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");

    messages.scrollTop = 20;

    const result =
      renderConversationState({
        shellController: {
          messages,
        },
        state:
          conversationState(),
        documentRef,
        forceScrollToEnd: true,
      });

    assert.equal(
      result.autoScrolled,
      true,
    );

    assert.equal(
      messages.scrollTop,
      messages.scrollHeight,
    );
  },
);


test(
  "1.11.37 renders one accessible typing indicator with three visual dots",
  () => {
    const documentRef =
      new FakeDocument();
    const messages =
      new FakeElement("div");

    const shellController = {
      messages,
    };

    const first =
      renderTypingIndicator({
        shellController,
        documentRef,
      });

    const second =
      renderTypingIndicator({
        shellController,
        documentRef,
      });

    assert.equal(
      first.rendered,
      true,
    );

    assert.equal(
      second.rendered,
      true,
    );

    assert.equal(
      messages.children.length,
      1,
    );

    const typing =
      messages.children[0];

    assert.equal(
      typing.getAttribute("role"),
      "status",
    );

    assert.equal(
      typing.getAttribute("aria-label"),
      "El asistente está escribiendo",
    );

    const bubble =
      typing.children[0];
    const dots =
      bubble.children[0];

    assert.equal(
      dots.children.length,
      3,
    );

    assert.equal(
      removeTypingIndicator({
        shellController,
      }),
      true,
    );

    assert.equal(
      messages.children.length,
      0,
    );
  },
);


test(
  "1.11.37 typing state is explicit and resettable",
  () => {
    resetState();

    setUiTyping(true);

    assert.equal(
      getState().ui.typing,
      true,
    );

    setUiTyping(false);

    assert.equal(
      getState().ui.typing,
      false,
    );
  },
);


test(
  "1.11.38 avatar state supports thinking speaking and idle",
  () => {
    resetState();

    setUiAvatarState(
      AVATAR_STATUS.THINKING,
    );

    assert.equal(
      getState().ui.avatarState,
      AVATAR_STATUS.THINKING,
    );

    setUiAvatarState(
      AVATAR_STATUS.SPEAKING,
    );

    assert.equal(
      getState().ui.avatarState,
      AVATAR_STATUS.SPEAKING,
    );

    setUiAvatarState(
      AVATAR_STATUS.IDLE,
    );

    assert.equal(
      getState().ui.avatarState,
      AVATAR_STATUS.IDLE,
    );
  },
);
