import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";

import {
  AVATAR_STATUS,
} from "../core/state.js";

import {
  DEFAULT_AVATAR_FILENAME,
  getAvatarPresentation,
  normalizeAvatarState,
} from "../ui/avatar.js";

import {
  CHATBOT_UI_ID,
  createLauncherTemplate,
  getLauncherAccessibilityProps,
  updateLauncherExpandedState,
} from "../ui/templates.js";

import {
  detectReducedMotion,
} from "../ui/ui.js";


/**
 * DOM mínimo suficiente para probar
 * nuestros templates.
 */
class FakeElement {
  constructor(tagName) {
    this.tagName =
      tagName.toUpperCase();

    this.attributes =
      new Map();

    this.children = [];

    this.className = "";
    this.id = "";
    this.textContent = "";

    this.parentNode = null;
  }

  setAttribute(
    name,
    value,
  ) {
    this.attributes.set(
      name,
      String(value),
    );
  }

  getAttribute(name) {
    return this.attributes.has(
      name,
    )
      ? this.attributes.get(name)
      : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  appendChild(child) {
    child.parentNode = this;

    this.children.push(
      child,
    );

    return child;
  }
}


class FakeDocument {
  createElement(tagName) {
    return new FakeElement(
      tagName,
    );
  }
}


test(
  "default avatar asset resolves",
  () => {
    const presentation =
      getAvatarPresentation(
        AVATAR_STATUS.IDLE,
      );

    assert.equal(
      presentation.state,
      AVATAR_STATUS.IDLE,
    );

    assert.equal(
      presentation.filename,
      DEFAULT_AVATAR_FILENAME,
    );

    /**
     * Contrato entre config.js y avatar.js:
     * src debe ser siempre una URL ya resuelta
     * representada como string.
     */
    assert.equal(
      typeof presentation.src,
      "string",
    );

    assert.match(
      presentation.src,
      /victor-assistant-default\.webp$/,
    );
  },
);


test(
  "all current avatar states avoid missing assets",
  () => {
    for (
      const avatarState
      of Object.values(
        AVATAR_STATUS,
      )
    ) {
      const presentation =
        getAvatarPresentation(
          avatarState,
        );

      assert.equal(
        presentation.filename,
        DEFAULT_AVATAR_FILENAME,
      );
    }
  },
);


test(
  "invalid avatar state is rejected",
  () => {
    assert.throws(
      () => {
        normalizeAvatarState(
          "dancing",
        );
      },
      RangeError,
    );
  },
);


test(
  "reduced motion is represented semantically",
  () => {
    const presentation =
      getAvatarPresentation(
        AVATAR_STATUS.THINKING,
        {
          reducedMotion: true,
        },
      );

    assert.equal(
      presentation.reducedMotion,
      true,
    );

    assert.equal(
      presentation.animated,
      false,
    );
  },
);


test(
  "launcher accessibility closed state is correct",
  () => {
    const props =
      getLauncherAccessibilityProps(
        false,
      );

    assert.equal(
      props.type,
      "button",
    );

    assert.equal(
      props.ariaHasPopup,
      "dialog",
    );

    assert.equal(
      props.ariaExpanded,
      "false",
    );

    assert.match(
      props.ariaLabel,
      /^Abrir /,
    );
  },
);


test(
  "launcher accessibility open state is correct",
  () => {
    const props =
      getLauncherAccessibilityProps(
        true,
      );

    assert.equal(
      props.ariaExpanded,
      "true",
    );

    assert.match(
      props.ariaLabel,
      /^Cerrar /,
    );
  },
);


test(
  "launcher template uses safe DOM structure",
  () => {
    const documentRef =
      new FakeDocument();

    const template =
      createLauncherTemplate({
        documentRef,
      });

    assert.equal(
      template.launcher.tagName,
      "BUTTON",
    );

    assert.equal(
      template.launcher.id,
      CHATBOT_UI_ID.launcher,
    );

    assert.equal(
      template.launcher
        .getAttribute(
          "type",
        ),
      "button",
    );

    assert.equal(
      template.launcher
        .getAttribute(
          "aria-haspopup",
        ),
      "dialog",
    );

    assert.equal(
      template.avatarImage.tagName,
      "IMG",
    );

    assert.equal(
      template.onlineStatus
        .getAttribute(
          "aria-hidden",
        ),
      "true",
    );

    assert.equal(
      template.tooltip
        .getAttribute(
          "role",
        ),
      "tooltip",
    );

    assert.ok(
      template.tooltip
        .textContent.length >
        0,
    );
  },
);


test(
  "launcher expanded state updates ARIA",
  () => {
    const documentRef =
      new FakeDocument();

    const {
      launcher,
    } =
      createLauncherTemplate({
        documentRef,
      });

    updateLauncherExpandedState(
      launcher,
      true,
    );

    assert.equal(
      launcher.getAttribute(
        "aria-expanded",
      ),
      "true",
    );

    assert.equal(
      launcher.getAttribute(
        "data-expanded",
      ),
      "true",
    );

    assert.match(
      launcher.getAttribute(
        "aria-label",
      ),
      /^Cerrar /,
    );
  },
);


test(
  "reduced motion detection uses matchMedia",
  () => {
    const windowRef = {
      matchMedia(query) {
        assert.equal(
          query,
          "(prefers-reduced-motion: reduce)",
        );

        return {
          matches: true,
        };
      },
    };

    assert.equal(
      detectReducedMotion({
        windowRef,
      }),
      true,
    );
  },
);


test(
  "reduced motion detection degrades safely",
  () => {
    assert.equal(
      detectReducedMotion({
        windowRef: {},
      }),
      false,
    );
  },
);


test(
  "CSS contains launcher responsive and accessibility rules",
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
      /--vg-chatbot-launcher-size:\s*64px/,
    );

    assert.match(
      css,
      /--vg-chatbot-launcher-size-mobile:\s*56px/,
    );

    assert.match(
      css,
      /:focus-visible/,
    );

    assert.match(
      css,
      /prefers-reduced-motion:\s*reduce/,
    );

    assert.match(
      css,
      /safe-area-inset-bottom/,
    );
  },
);