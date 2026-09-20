import test from "node:test";
import assert from "node:assert/strict";

import {
  DIALOGUE_ROUTE,
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  RESPONSE_QUICK_REPLY_KIND,
} from "../core/response-contract.js";


function visibleText(response) {
  return (
    response?.messages ?? []
  )
    .map(
      (message) =>
        message.text,
    )
    .join(" ")
    .trim();
}


function turn(userText) {
  return processDialogueTurn({
    userText,
    applyState: false,
  });
}


test(
  "H4 technology summary offers four natural expansion paths",
  () => {
    const result =
      turn(
        "¿Qué tecnologías conoce Víctor?",
      );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      result.response.presentation.depth,
      "short",
    );

    assert.equal(
      result.response.quickReplies.length,
      4,
    );

    for (
      const reply
      of result.response.quickReplies
    ) {
      assert.equal(
        reply.kind,
        RESPONSE_QUICK_REPLY_KIND.ANSWER,
      );

      assert.match(
        reply.value,
        /tecnolog/i,
      );
    }
  },
);


test(
  "H4 a technology quick reply re-enters Dialogue Manager and expands current evidence",
  () => {
    const initial =
      turn(
        "¿Qué tecnologías conoce Víctor?",
      );

    const currentReply =
      initial.response.quickReplies.find(
        (reply) =>
          reply.label ===
            "Uso actual",
      );

    assert.ok(currentReply);

    const expanded =
      turn(
        currentReply.value,
      );

    assert.equal(
      expanded.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      expanded.response.presentation.depth,
      "medium",
    );

    assert.match(
      visibleText(
        expanded.response,
      ),
      /Power BI/i,
    );

    assert.equal(
      /COBOL|AWS|Qlik/i.test(
        visibleText(
          expanded.response,
        ),
      ),
      false,
    );

    assert.equal(
      expanded.response.quickReplies.length,
      1,
    );
  },
);


test(
  "H4 partial expansion can reach full technology detail without looping",
  () => {
    const partial =
      turn(
        "¿Qué tecnologías conoce Víctor con experiencia histórica?",
      );

    const fullReply =
      partial.response.quickReplies[0];

    assert.ok(fullReply);

    const full =
      turn(
        fullReply.value,
      );

    assert.equal(
      full.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,
    );

    assert.equal(
      full.response.presentation.depth,
      "deep",
    );

    assert.match(
      visibleText(full.response),
      /Power BI/i,
    );

    assert.match(
      visibleText(full.response),
      /COBOL/i,
    );

    assert.match(
      visibleText(full.response),
      /AWS/i,
    );

    assert.ok(full.response.quickReplies.length > 0);
  },
);


test(
  "H4 education and capability category replies also round-trip through Dialogue Manager",
  () => {
    const cases = [
      {
        initial:
          "¿Qué formación tiene Víctor?",
        label:
          "Tecnología y datos",
        expected:
          /Data Scientist/i,
      },
      {
        initial:
          "¿Qué sabe hacer Víctor?",
        label:
          "Automatización e IA",
        expected:
          /Automatización de procesos|Análisis asistido por IA/i,
      },
    ];

    for (const item of cases) {
      const initial =
        turn(
          item.initial,
        );

      const reply =
        initial.response.quickReplies.find(
          (candidate) =>
            candidate.label ===
              item.label,
        );

      assert.ok(
        reply,
        item.label,
      );

      const expanded =
        turn(
          reply.value,
        );

      assert.equal(
        expanded.decision.route,
        DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW,
        item.label,
      );

      assert.match(
        visibleText(
          expanded.response,
        ),
        item.expected,
        item.label,
      );
    }
  },
);
