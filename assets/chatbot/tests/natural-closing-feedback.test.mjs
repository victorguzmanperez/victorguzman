import test from "node:test";
import assert from "node:assert/strict";

import {
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  detectConversationControl,
  CONVERSATION_CONTROL,
} from "../core/conversation-lifecycle.js";

import {
  resetState,
} from "../core/state.js";

function turn(text) {
  return processDialogueTurn({ userText: text });
}

function textOf(result) {
  return result.response.messages.map((item) => item.text).join(" ");
}

function startMiguelFlow() {
  resetState();
  turn("Hola, me llamo Miguel y tengo problemas con Excel y Access");
  turn("Reunir archivos");
  turn("Sí, misma estructura");
  return turn("Cada día");
}

for (const phrase of [
  "Ok, muchas gracias",
  "Bien gracias",
  "Perfecto, gracias",
  "Vale, gracias",
  "Ya no necesito nada",
  "No necesito nada más",
  "Gracias, ya está",
]) {
  test(`CONV-H3.25 natural closing wins over active discovery: ${phrase}`, () => {
    startMiguelFlow();

    const result = turn(phrase);

    assert.equal(result.decision.route, "social");
    assert.equal(result.decision.intent, "goodbye");
    assert.equal(result.decision.reason, "explicit_closing_control");
    assert.match(textOf(result), /ha resultado útil esta conversación/i);
    assert.deepEqual(
      result.response.quickReplies.map((item) => item.label),
      ["👍 Sí", "😐 Más o menos", "👎 No"],
    );
    assert.doesNotMatch(textOf(result), /qué comprobación|qué tuvo que hacer|campos vacíos/i);
  });
}

test("CONV-H3.25 full Miguel flow reaches survey and support offer", () => {
  startMiguelFlow();

  const closing = turn("Ok, muchas gracias");
  assert.match(textOf(closing), /ha resultado útil esta conversación/i);

  const rating = turn("Sí, me ha resultado útil");
  assert.equal(rating.decision.metadata.feedbackRating, "positive");
  assert.deepEqual(
    rating.response.quickReplies.map((item) => item.label),
    ["Apoyar el proyecto", "Ahora no"],
  );
  assert.match(textOf(rating), /apoyarlo de forma voluntaria/i);
});

test("CONV-H3.25 explicit closing detector recognizes no-more-help wording", () => {
  assert.equal(
    detectConversationControl("Ya no necesito nada"),
    CONVERSATION_CONTROL.CLOSE,
  );
  assert.equal(
    detectConversationControl("No necesito nada más"),
    CONVERSATION_CONTROL.CLOSE,
  );
});

test("CONV-H3.25 polite wording with a substantive contact request is not treated as closing", () => {
  resetState();
  turn("Tenemos varios Excel y perdemos tiempo uniéndolos");

  const result = turn("Gracias, pero ¿cómo puedo conectar con Víctor?");

  assert.equal(result.decision.route, "operational");
  assert.match(textOf(result), /email|LinkedIn/i);
});
