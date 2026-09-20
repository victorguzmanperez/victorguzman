import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  getState,
  markQuestionAsked,
  resetState,
} from "../core/state.js";

import {
  SUPPORT_CHOICE,
  SUPPORT_OFFER_MARKER,
  SUPPORT_QUICK_REPLY_ID,
  supportChoiceFromQuickReply,
} from "../core/conversation-lifecycle.js";

const start =
  "Hola, tenemos varios Excel y cada semana perdemos mucho tiempo uniéndolos.";

function turn(text) {
  return processDialogueTurn({ userText: text });
}

function labels(result) {
  return result.response.quickReplies.map((item) => item.label);
}

function finishAndRate(ratingText) {
  resetState();
  turn(start);
  turn("Gracias");
  turn("No, gracias");
  return turn(ratingText);
}

test("H3.24 positive feedback thanks the visitor and offers optional support", () => {
  const result = finishAndRate("Sí, me ha resultado útil");
  assert.equal(result.decision.metadata.feedbackRating, "positive");
  assert.match(
    result.response.messages.map((m) => m.text).join(" "),
    /gracias.*resultado útil|resultado útil.*gracias/i,
  );
  assert.match(
    result.response.messages.map((m) => m.text).join(" "),
    /apoyarlo de forma voluntaria/i,
  );
  assert.deepEqual(labels(result), ["Apoyar el proyecto", "Ahora no"]);
});

test("H3.24 neutral feedback also offers support without pressure", () => {
  const result = finishAndRate("Más o menos");
  assert.equal(result.decision.metadata.feedbackRating, "neutral");
  assert.match(
    result.response.messages.map((m) => m.text).join(" "),
    /margen|seguir mejorando/i,
  );
  assert.deepEqual(labels(result), ["Apoyar el proyecto", "Ahora no"]);
});

test("H3.24 negative feedback thanks the visitor and never asks for money", () => {
  const result = finishAndRate("No me ha resultado útil");
  assert.equal(result.decision.metadata.feedbackRating, "negative");
  const text = result.response.messages.map((m) => m.text).join(" ");
  assert.match(text, /gracias.*mejorar|valoración.*mejorar/i);
  assert.doesNotMatch(text, /apoy|colabor|económ|don/i);
  assert.equal(result.response.quickReplies.length, 0);
});

test("H3.24 support offer is shown at most once per conversation state", () => {
  const first = finishAndRate("Sí, me ha resultado útil");
  assert.deepEqual(labels(first), ["Apoyar el proyecto", "Ahora no"]);

  markQuestionAsked(SUPPORT_OFFER_MARKER);
  assert.ok(getState().conversation.askedQuestionIds.includes(SUPPORT_OFFER_MARKER));

  const repeated = turn("Sí, me ha resultado útil");
  assert.equal(repeated.response.quickReplies.length, 0);
  assert.doesNotMatch(
    repeated.response.messages.map((m) => m.text).join(" "),
    /apoyarlo de forma voluntaria/i,
  );
});

test("H3.24 support quick replies map to explicit structured choices", () => {
  assert.equal(
    supportChoiceFromQuickReply({ id: SUPPORT_QUICK_REPLY_ID.ACCEPT }),
    SUPPORT_CHOICE.ACCEPT,
  );
  assert.equal(
    supportChoiceFromQuickReply({ id: SUPPORT_QUICK_REPLY_ID.DECLINE }),
    SUPPORT_CHOICE.DECLINE,
  );
  assert.equal(supportChoiceFromQuickReply({ id: "other" }), null);
});

test("H3.24 contact diagnostic and booking flows never inject support choices", () => {
  for (const text of [
    "Quiero contactar con Víctor",
    "Quiero hacer el diagnóstico",
    "Quiero reservar una reunión",
  ]) {
    resetState();
    const result = turn(text);
    const ids = result.response.quickReplies.map((q) => q.id);
    assert.ok(!ids.includes(SUPPORT_QUICK_REPLY_ID.ACCEPT));
    assert.ok(!ids.includes(SUPPORT_QUICK_REPLY_ID.DECLINE));
  }
});

test("H3.24 browser handler resets and closes both choices, navigating only support acceptance", () => {
  const source = fs.readFileSync(
    new URL("../chatbot.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /handleSupportOfferQuickReply/);
  assert.match(source, /support_accepted/);
  assert.match(source, /support_declined/);
  assert.match(source, /performConversationReset/);
  assert.match(source, /shellController[\s\S]*?\.close/);
  assert.match(source, /windowRef\.location\.assign\([\s\S]*?SUPPORT_PAGE_URL/);
  assert.match(source, /\.\.\/\.\.\/apoya\.html/);
});
