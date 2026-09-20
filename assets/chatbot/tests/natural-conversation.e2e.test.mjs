import test from "node:test";
import assert from "node:assert/strict";

import {
  DIALOGUE_ROUTE,
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  resetState,
} from "../core/state.js";


function visibleText(response) {
  return (
    response?.messages ?? []
  )
    .map((message) => message.text)
    .join(" ")
    .trim();
}


function isolatedTurn(userText) {
  resetState();

  return processDialogueTurn({
    userText,
  });
}


test(
  "NAT-H1 broad uncertain help request routes to need discovery",
  () => {
    const result =
      isolatedTurn(
        "Pues me siento perdido y no sé cómo Víctor me puede ayudar",
      );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.NEED_DISCOVERY,
    );

    assert.match(
      visibleText(result.response),
      /gustaría mejorar|quieres mejorar|empezar por el problema/i,
    );

    assert.doesNotMatch(
      visibleText(result.response),
      /Los servicios publicados son/i,
    );

    assert.equal(
      result.response.quickReplies.length,
      4,
    );
  },
);


test(
  "NAT-H1 answers what Victor does briefly before returning to visitor need",
  () => {
    const result =
      isolatedTurn(
        "No sé muy bien qué hace Víctor y si me puede ayudar",
      );

    const text =
      visibleText(result.response);

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.NEED_DISCOVERY,
    );

    assert.match(
      text,
      /datos.*Business Intelligence.*automatización/i,
    );

    assert.match(
      text,
      /tu situación/i,
    );

    assert.doesNotMatch(
      text,
      /Profesional con trayectoria en tecnología bancaria/i,
    );
  },
);


test(
  "NAT-H1 concrete problem keeps Problem Flow priority over broad uncertainty",
  () => {
    const result =
      isolatedTurn(
        "Estoy perdido: tengo varios Excel que consolido manualmente cada mes",
      );

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.PROBLEM_FLOW,
    );
  },
);


test(
  "NAT-H1 explicit service catalog request remains the service route",
  () => {
    const result =
      isolatedTurn(
        "¿Qué servicios ofrece Víctor?",
      );

    assert.notEqual(
      result.decision.route,
      DIALOGUE_ROUTE.NEED_DISCOVERY,
    );

    assert.match(
      visibleText(result.response),
      /servicios publicados/i,
    );
  },
);


test(
  "NAT-H1 quick replies advance into canonical problem flow",
  () => {
    const initial =
      isolatedTurn(
        "No sé si Víctor me puede ayudar",
      );

    const reply =
      initial.response.quickReplies.find(
        (candidate) =>
          candidate.label ===
            "Excel / datos manuales",
      );

    assert.ok(reply);

    const followUp =
      processDialogueTurn({
        userText:
          reply.value,
      });

    assert.equal(
      followUp.decision.route,
      DIALOGUE_ROUTE.PROBLEM_FLOW,
    );

    assert.match(
      visibleText(followUp.response),
      /problema.*datos|reunir (?:los )?archivos|limpiar\/revisar|preparar informes/i,
    );
  },
);


test(
  "NAT-H1 contextual help can use previous technology without locking onto it",
  () => {
    resetState();

    const first =
      processDialogueTurn({
        userText:
          "¿Víctor tiene experiencia con AWS?",
      });

    assert.equal(
      first.decision.route,
      DIALOGUE_ROUTE.KNOWLEDGE_DIRECT,
    );

    const second =
      processDialogueTurn({
        userText:
          "¿Y esto cómo me puede ayudar?",
      });

    assert.equal(
      second.decision.route,
      DIALOGUE_ROUTE.CONTEXTUAL_BENEFIT,
    );

    assert.match(
      visibleText(second.response),
      /AWS.*nube|nube.*AWS/i,
    );

    assert.match(
      visibleText(second.response),
      /formación o exposición.*no experiencia profesional/i,
    );
  },
);


test(
  "NAT-H1 conversation corpus avoids robotic catalog phrasing",
  () => {
    const corpus = [
      "No sé si Víctor me puede ayudar",
      "¿En qué me puede ayudar Víctor?",
      "Me siento perdido y no sé cómo Víctor me puede ayudar",
      "No tengo claro qué necesito",
      "Creo que Víctor podría ayudarme pero no sé por dónde empezar",
    ];

    for (const userText of corpus) {
      const result =
        isolatedTurn(userText);

      assert.equal(
        result.decision.route,
        DIALOGUE_ROUTE.NEED_DISCOVERY,
        userText,
      );

      const text =
        visibleText(result.response);

      assert.doesNotMatch(
        text,
        /Los servicios publicados son|Profesional con trayectoria|Las capacidades documentadas de Víctor abarcan/i,
        userText,
      );

      assert.match(
        text,
        /problema|quieres mejorar|gustaría mejorar|situación|necesitas|orientarte/i,
        userText,
      );
    }
  },
);
