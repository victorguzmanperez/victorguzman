import test from "node:test";
import assert from "node:assert/strict";

import {
  DIALOGUE_ROUTE,
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  resetState,
  getState,
} from "../core/state.js";


function visibleText(
  response,
) {
  return (
    response?.messages ??
    []
  )
    .map(
      (message) =>
        message.text,
    )
    .join(" ")
    .trim();
}


function turn(
  text,
) {
  resetState();

  return processDialogueTurn({
    userText:
      text,
  });
}


test(
  "¿Cómo estás? is handled as natural small talk",
  () => {
    const result =
      turn(
        "¿Cómo estás?",
      );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );

    assert.equal(
      result.decision.intent,
      "check_in",
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /todo listo|funcionando|preparado/i,
    );

    assert.doesNotMatch(
      visibleText(
        result.response,
      ),
      /estoy feliz|estoy triste|me siento/i,
    );
  },
);


test(
  "¿Qué tal? prefers check-in over generic greeting",
  () => {
    const result =
      turn(
        "¿Qué tal?",
      );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );

    assert.equal(
      result.decision.intent,
      "check_in",
    );
  },
);


test(
  "positive visitor state receives a warm acknowledgement",
  () => {
    const result =
      turn(
        "Estoy genial",
      );

    assert.equal(
      result.decision.intent,
      "user_state",
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /alegra|qué bien|genial/i,
    );
  },
);


test(
  "negative visitor state stays supportive without diagnosing",
  () => {
    const result =
      turn(
        "Estoy cansado",
      );

    assert.equal(
      result.decision.intent,
      "user_state",
    );

    assert.match(
      visibleText(
        result.response,
      ),
      /paso a paso|una sola cosa|orientarte/i,
    );

    assert.doesNotMatch(
      visibleText(
        result.response,
      ),
      /depres|ansiedad|diagnóst/i,
    );
  },
);


test(
  "frustrated visitor state is acknowledged and redirected to the concrete blocker",
  () => {
    const result =
      turn(
        "Estoy harto",
      );

    assert.match(
      visibleText(
        result.response,
      ),
      /frustrante|dando bastante guerra|desbloquearlo/i,
    );
  },
);


test(
  "uncertain visitor state is oriented gently",
  () => {
    const result =
      turn(
        "No sé por dónde empezar",
      );

    assert.match(
      visibleText(
        result.response,
      ),
      /orient|empezar|estructura/i,
    );
  },
);


test(
  "substantive intent keeps priority even when tone is frustrated",
  () => {
    const result =
      turn(
        "Necesito automatizar un Excel y estoy frustrado",
      );

    assert.notEqual(
      result.decision.route,
      DIALOGUE_ROUTE.SOCIAL,
    );

    assert.equal(
      result.decision.analysis
        .tone.tone,
      "frustrated",
    );
  },
);


test(
  "tone signal is not persisted in understanding.lastAnalysis",
  () => {
    turn(
      "Estoy harto",
    );

    const lastAnalysis =
      getState()
        .understanding
        .lastAnalysis;

    assert.equal(
      Object.hasOwn(
        lastAnalysis,
        "tone",
      ),
      false,
    );
  },
);
