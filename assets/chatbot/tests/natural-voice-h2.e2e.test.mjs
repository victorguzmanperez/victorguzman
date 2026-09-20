import test from "node:test";
import assert from "node:assert/strict";

import {
  DIALOGUE_ROUTE,
  processDialogueTurn,
} from "../core/dialogue-manager.js";

import {
  getState,
  resetState,
} from "../core/state.js";


function visibleText(response) {
  return (response?.messages ?? [])
    .map((message) => message.text)
    .join(" ")
    .trim();
}

function isolatedTurn(userText) {
  resetState();
  return processDialogueTurn({ userText });
}


test(
  "NAT-H2 Excel problem leads with benefit and one concrete follow-up",
  () => {
    const result = isolatedTurn(
      "Trabajo con varios Excel o datos que tengo que consolidar manualmente.",
    );

    const text = visibleText(result.response);

    assert.equal(result.decision.route, DIALOGUE_ROUTE.PROBLEM_FLOW);
    assert.match(text, /quitar trabajo manual|forma repetible/i);
    assert.doesNotMatch(
      text,
      /una línea de solución|este tipo de necesidad se relaciona|para confirmar si encaja/i,
    );
    assert.equal(
      result.response.messages.filter(
        (message) => /\?$/.test(message.text.trim()),
      ).length,
      1,
    );
    assert.ok(result.response.quickReplies.length >= 2);
  },
);


test(
  "NAT-H2 reporting problem explains value before technology",
  () => {
    const result = isolatedTurn(
      "Actualizo a mano informes o dashboards cada semana.",
    );

    const text = visibleText(result.response);

    assert.equal(result.decision.route, DIALOGUE_ROUTE.PROBLEM_FLOW);
    assert.match(text, /automatizada.*preparación|actualización de los datos/i);
    assert.match(text, /preparando los datos|actualizando el dashboard/i);
    assert.doesNotMatch(text, /Power BI.*Power Query.*DAX/i);
  },
);


test(
  "NAT-H2 AI problem starts from the process rather than selling AI",
  () => {
    const result = isolatedTurn(
      "Quiero aplicar IA, pero no sé dónde tendría sentido.",
    );

    const text = visibleText(result.response);

    assert.equal(result.decision.route, DIALOGUE_ROUTE.PROBLEM_FLOW);
    assert.match(text, /empezaría por el proceso, no por la IA/i);
    assert.match(text, /tarea concreta/i);
  },
);


test(
  "NAT-H2 frustrated concrete problem may acknowledge tone without stealing intent",
  () => {
    const result = isolatedTurn(
      "Estoy harto de juntar Excel manualmente todos los meses.",
    );

    const text = visibleText(result.response);

    assert.equal(result.decision.route, DIALOGUE_ROUTE.PROBLEM_FLOW);
    assert.match(text, /algo concreto que atacar|quitar trabajo manual/i);
  },
);


test(
  "NAT-H2 AWS contextual bridge answers usefulness and keeps evidence qualified",
  () => {
    resetState();

    processDialogueTurn({
      userText: "¿Víctor tiene experiencia con AWS?",
    });

    const result = processDialogueTurn({
      userText: "¿Y esto cómo me puede ayudar?",
    });

    const text = visibleText(result.response);

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.CONTEXTUAL_BENEFIT,
    );
    assert.match(text, /AWS.*nube|nube.*AWS/i);
    assert.match(text, /formación o exposición/i);
    assert.match(text, /no experiencia profesional demostrada/i);
    assert.doesNotMatch(text, /cuenta con exposición y formación en AWS dentro de estudios/i);
    assert.equal(
      getState().understanding.semanticContext.subjectId,
      "technology-aws",
    );
  },
);


test(
  "NAT-H2 explicit Power BI benefit question works without prior turn",
  () => {
    const result = isolatedTurn(
      "¿Para qué me serviría Power BI?",
    );

    const text = visibleText(result.response);

    assert.equal(
      result.decision.route,
      DIALOGUE_ROUTE.CONTEXTUAL_BENEFIT,
    );
    assert.match(text, /informes y cuadros de mando/i);
    assert.match(text, /trabaja actualmente a nivel profesional/i);
    assert.ok(result.response.quickReplies.length >= 2);
  },
);


test(
  "NAT-H2 direct contact request does not ask an unnecessary confirmation",
  () => {
    const result = isolatedTurn(
      "¿Me puedes poner en contacto con Víctor?",
    );

    const text = visibleText(result.response);

    assert.equal(result.decision.route, DIALOGUE_ROUTE.OPERATIONAL);
    assert.notEqual(result.decision.route, DIALOGUE_ROUTE.CONFIRMATION);
    assert.match(text, /Claro\. Puedes escribirle directamente a Víctor/i);
    assert.doesNotMatch(text, /¿Es correcto\?/i);
  },
);


test(
  "NAT-H2 problem quick reply advances naturally instead of restarting the catalog",
  () => {
    const first = isolatedTurn(
      "Trabajo con varios Excel o datos que tengo que consolidar manualmente.",
    );

    const reply = first.response.quickReplies.find(
      (candidate) => candidate.label === "Sí, misma estructura",
    );

    assert.ok(reply);

    const second = processDialogueTurn({
      userText: reply.value,
    });

    assert.equal(second.decision.route, DIALOGUE_ROUTE.PROBLEM_FLOW);
    assert.doesNotMatch(
      visibleText(second.response),
      /Los servicios publicados son|una línea de solución/i,
    );
  },
);


test(
  "NAT-H2 conversational corpus avoids system and consultancy phrasing",
  () => {
    const inputs = [
      "Trabajo con varios Excel o datos que tengo que consolidar manualmente.",
      "Actualizo a mano informes o dashboards cada semana.",
      "Quiero aplicar IA, pero no sé dónde tendría sentido.",
      "Necesito extraer datos de PDF automáticamente.",
    ];

    for (const input of inputs) {
      const result = isolatedTurn(input);
      const text = visibleText(result.response);

      assert.doesNotMatch(
        text,
        /una línea de solución|líneas de solución|este tipo de necesidad se relaciona|para confirmar si encaja|las capacidades documentadas abarcan/i,
        input,
      );
    }
  },
);
