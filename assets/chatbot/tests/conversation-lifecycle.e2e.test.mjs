import test from "node:test";
import assert from "node:assert/strict";

import {
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  DIALOGUE_STATE_MARKER,
} from "../core/dialogue-manager.js";

import {
  getState,
  resetState,
} from "../core/state.js";

function resetDialogue() {
  resetState();
}

function textOf(response) {
  return [
    ...(response?.messages ?? []).map((item) => item.text),
    response?.followUp?.text ?? "",
  ].filter(Boolean).join("\n");
}


test("CONV-H1 mixed greeting acknowledges hello without losing the real need", () => {
  resetDialogue();

  const result = processDialogueTurn({
    userText: "Hola, me siento perdido y no sé cómo Víctor me puede ayudar",
  });

  assert.equal(result.decision.route, "need_discovery");
  assert.match(textOf(result.response), /^Hola/u);
  assert.match(textOf(result.response), /empecemos por lo que te gustaría mejorar/i);
});


test("CONV-H1 direct first question answers without requesting a name", () => {
  resetDialogue();

  const result = processDialogueTurn({
    userText: "¿Víctor tiene experiencia con AWS?",
  });

  assert.match(textOf(result.response), /AWS/i);
  assert.doesNotMatch(textOf(result.response), /si quieres, dime cómo te llamas/i);

  assert.ok(
    !getState().conversation.askedQuestionIds.includes(
      DIALOGUE_STATE_MARKER.NAME_ASKED,
    ),
  );
});


test("CONV-H1 thanks after a useful exchange asks whether the visitor needs anything else", () => {
  resetDialogue();

  processDialogueTurn({
    userText: "¿Quién es Víctor?",
  });

  const result = processDialogueTurn({
    userText: "Gracias",
  });

  assert.match(textOf(result.response), /¿Necesitas algo más\?/i);
  assert.deepEqual(
    result.response.quickReplies.map((item) => item.label),
    ["Otra consulta", "No, gracias"],
  );
});


test("CONV-H1 no thanks closes and offers one structured rating", () => {
  resetDialogue();

  processDialogueTurn({
    userText: "¿Quién es Víctor?",
  });

  processDialogueTurn({
    userText: "Gracias",
  });

  const closing = processDialogueTurn({
    userText: "No, gracias",
  });

  assert.equal(closing.decision.intent, "goodbye");
  assert.deepEqual(
    closing.response.quickReplies.map((item) => item.label),
    ["👍 Sí", "😐 Más o menos", "👎 No"],
  );
  assert.match(textOf(closing.response), /ha resultado útil esta conversación/i);

  const rating = processDialogueTurn({
    userText: "Sí, me ha resultado útil",
  });

  assert.equal(rating.decision.metadata.feedbackRating, "positive");
  assert.match(textOf(rating.response), /Gracias por decírmelo/i);
  assert.deepEqual(rating.response.quickReplies.map((item) => item.label), ['Apoyar el proyecto', 'Ahora no']);
});


test("CONV-H1 another consultation reopens naturally without feedback", () => {
  resetDialogue();

  processDialogueTurn({
    userText: "¿Quién es Víctor?",
  });

  processDialogueTurn({
    userText: "Gracias",
  });

  const result = processDialogueTurn({
    userText: "Quiero hacer otra consulta",
  });

  assert.equal(result.decision.intent, "continue");
  assert.match(textOf(result.response), /¿Qué quieres consultar ahora\?/i);
  assert.ok(result.response.quickReplies.length > 0);
});
