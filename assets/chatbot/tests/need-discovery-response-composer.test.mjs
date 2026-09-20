import test from "node:test";
import assert from "node:assert/strict";

import {
  NEED_DISCOVERY_KIND,
  detectNeedDiscoveryRequest,
  composeNeedDiscoveryResponse,
} from "../core/need-discovery-response-composer.js";

import {
  analyzeMessage,
} from "../core/nlu.js";


function textOf(response) {
  return (
    response?.messages ?? []
  )
    .map((message) => message.text)
    .join(" ")
    .trim();
}


test(
  "NAT-H1 detects broad help requests without turning service catalog requests into discovery",
  () => {
    const cases = [
      "No sé muy bien si Víctor me puede ayudar",
      "¿En qué me puede ayudar Víctor?",
      "Me siento perdido y no sé cómo Víctor me puede ayudar",
      "No tengo claro qué necesito",
    ];

    for (const userText of cases) {
      assert.ok(
        detectNeedDiscoveryRequest({
          userText,
          analysis:
            analyzeMessage(userText),
        }),
        userText,
      );
    }

    assert.equal(
      detectNeedDiscoveryRequest({
        userText:
          "¿Qué servicios ofrece Víctor?",
        analysis:
          analyzeMessage(
            "¿Qué servicios ofrece Víctor?",
          ),
      }),
      null,
    );
  },
);


test(
  "NAT-H1 recognizes combined what-does-Victor-do plus help intent",
  () => {
    const userText =
      "No sé muy bien qué hace Víctor y si me puede ayudar";

    assert.equal(
      detectNeedDiscoveryRequest({
        userText,
        analysis:
          analyzeMessage(userText),
      }),
      NEED_DISCOVERY_KIND.WHAT_VICTOR_DOES,
    );
  },
);


test(
  "NAT-H1 response leads with orientation instead of CV or service inventory",
  () => {
    const userText =
      "Pues me siento perdido y no sé cómo Víctor me puede ayudar";

    const analysis =
      analyzeMessage(userText);

    const response =
      composeNeedDiscoveryResponse({
        userText,
        analysis,
        intent:
          analysis.primaryIntent,
      });

    const text =
      textOf(response);

    assert.match(
      text,
      /problema|quieres mejorar|situaciones/i,
    );

    assert.doesNotMatch(
      text,
      /Los servicios publicados son|Profesional con trayectoria/i,
    );

    assert.equal(
      response.quickReplies.length,
      4,
    );

    assert.equal(
      response.presentation.splitBubbles,
      true,
    );
  },
);


test(
  "NAT-H1 tone adapts wording without claiming emotional knowledge",
  () => {
    const userText =
      "Estoy frustrado y no sé si Víctor me puede ayudar";

    const analysis =
      analyzeMessage(userText);

    const response =
      composeNeedDiscoveryResponse({
        userText,
        analysis,
      });

    assert.match(
      textOf(response),
      /simplificar|dando más guerra/i,
    );

    assert.doesNotMatch(
      textOf(response),
      /sé cómo te sientes|estás deprimido|ansiedad/i,
    );
  },
);


test(
  "NAT-H1 can use semantic technology context without assuming fit",
  () => {
    const userText =
      "¿Y esto cómo me puede ayudar?";

    const context = {
      semanticContext: {
        relation:
          "experience_with",
        subjectType:
          "technology",
        subjectId:
          "technology-aws",
      },
    };

    const kind =
      detectNeedDiscoveryRequest({
        userText,
        analysis:
          analyzeMessage(userText),
        context,
      });

    assert.equal(
      kind,
      NEED_DISCOVERY_KIND.CONTEXTUAL,
    );

    const response =
      composeNeedDiscoveryResponse({
        userText,
        kind,
        analysis:
          analyzeMessage(userText),
        context,
      });

    assert.match(
      textOf(response),
      /AWS/i,
    );

    assert.match(
      textOf(response),
      /no hace falta asumir/i,
    );
  },
);
