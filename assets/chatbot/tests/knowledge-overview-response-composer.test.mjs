import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  KNOWLEDGE_OVERVIEW_DETAIL,
  KNOWLEDGE_OVERVIEW_TOPIC,
  composeKnowledgeOverviewResponse,
  detectKnowledgeOverviewTopic,
  resolveKnowledgeOverviewDetail,
  resolveKnowledgeOverviewTopic,
} from "../core/knowledge-overview-response-composer.js";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";


test("education overview wording is detected", () => {
  for (const text of [
    "¿Qué ha estudiado Víctor?",
    "¿Qué formación tiene?",
    "¿Qué estudios tiene Víctor?",
    "Cuéntame su formación",
  ]) {
    assert.equal(
      detectKnowledgeOverviewTopic(text),
      KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION,
      text,
    );
  }
});


test("capability overview wording is detected", () => {
  for (const text of [
    "¿Qué sabe hacer Víctor?",
    "¿Cuáles son sus principales capacidades?",
    "¿En qué áreas puede aportar?",
    "¿Qué habilidades tiene?",
  ]) {
    assert.equal(
      detectKnowledgeOverviewTopic(text),
      KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES,
      text,
    );
  }
});


test("technology overview wording is detected", () => {
  for (const text of [
    "¿Qué tecnologías conoce Víctor?",
    "¿Con qué tecnologías trabaja?",
    "¿Qué tecnologías domina?",
    "¿Qué herramientas sabe utilizar?",
  ]) {
    assert.equal(
      detectKnowledgeOverviewTopic(text),
      KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES,
      text,
    );
  }
});


test("explicit overview topic overrides text detection", () => {
  assert.equal(
    resolveKnowledgeOverviewTopic({
      userText:
        "Texto genérico",
      topic:
        KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION,
    }),
    KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION,
  );
});


test("invalid explicit overview topic fails closed", () => {
  assert.equal(
    resolveKnowledgeOverviewTopic({
      userText:
        "¿Qué ha estudiado Víctor?",
      topic:
        "invented-overview",
    }),
    null,
  );
});


test("unrelated text has no overview topic", () => {
  assert.equal(
    detectKnowledgeOverviewTopic(
      "¿Cuánto cobra Víctor?",
    ),
    null,
  );
});


test("education overview creates valid Knowledge response", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué ha estudiado Víctor?",
    });

  assert.equal(
    isValidResponseEnvelope(response),
    true,
  );

  assert.equal(
    response.kind,
    RESPONSE_KIND.KNOWLEDGE,
  );

  assert.equal(
    response.outcome,
    RESPONSE_OUTCOME.ANSWERED,
  );
});


test("education overview starts with a concise progressive summary", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué formación tiene Víctor?",
    });

  const text =
    response.messages[0].text;

  assert.match(
    text,
    /Desarrollo de Aplicaciones Informáticas/i,
  );

  assert.match(
    text,
    /Inteligencia Artificial y Big Data/i,
  );

  assert.equal(
    response.presentation.depth,
    "short",
  );

  assert.equal(
    response.quickReplies.length,
    3,
  );

  assert.ok(
    text.length < 450,
  );
});


test("education overview does not convert PL-300 training into certification", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué ha estudiado Víctor?",
    }).messages[0].text;

  assert.equal(
    /certificado|certificación obtenida|PL-300 obtenida/i.test(text),
    false,
  );
});


test("education overview evidence contains Education only", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué estudios tiene Víctor?",
    });

  assert.ok(
    response.evidence.knowledgeIds.length >= 10,
  );

  for (const id of response.evidence.knowledgeIds) {
    assert.equal(
      getKnowledgeById(id)?.type,
      KNOWLEDGE_TYPE.EDUCATION,
      id,
    );
  }
});


test("capabilities overview creates valid Knowledge response", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué sabe hacer Víctor?",
    });

  assert.equal(
    isValidResponseEnvelope(response),
    true,
  );

  assert.equal(
    response.kind,
    RESPONSE_KIND.KNOWLEDGE,
  );
});


test("capabilities overview answers capabilities rather than technology inventory", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Cuáles son sus principales capacidades?",
    }).messages[0].text;

  assert.match(text, /Business Intelligence/i);
  assert.match(text, /Análisis de datos/i);
  assert.match(text, /Automatización de procesos/i);
  assert.match(text, /Análisis funcional/i);
  assert.match(text, /Testing/i);

  assert.equal(
    /AWS|Qlik|Java|COBOL/i.test(text),
    false,
  );
});


test("capabilities overview evidence contains Capability only", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué habilidades tiene?",
    });

  assert.ok(
    response.evidence.knowledgeIds.length >= 20,
  );

  for (const id of response.evidence.knowledgeIds) {
    assert.equal(
      getKnowledgeById(id)?.type,
      KNOWLEDGE_TYPE.CAPABILITY,
      id,
    );
  }
});


test("technologies overview creates valid Knowledge response", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor?",
    });

  assert.equal(
    isValidResponseEnvelope(response),
    true,
  );

  assert.equal(
    response.kind,
    RESPONSE_KIND.KNOWLEDGE,
  );
});


test("technology overview separates current professional evidence", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Con qué tecnologías trabaja?",
    }).messages[0].text;

  assert.match(
    text,
    /uso profesional actual/i,
  );

  assert.match(text, /Power BI/i);
  assert.match(text, /Power Query/i);
  assert.match(text, /DAX/i);
  assert.match(text, /Excel/i);
  assert.match(text, /Python/i);
});


test("technology overview separates historical evidence", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor con experiencia histórica?",
    }).messages[0].text;

  assert.match(
    text,
    /experiencia profesional histórica/i,
  );

  assert.match(text, /COBOL/i);
  assert.match(text, /Control-M/i);
  assert.match(text, /XML/i);
});


test("technology overview separates training project and self-learning evidence", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor por formación o proyectos?",
    }).messages[0].text;

  assert.match(
    text,
    /proyectos, formación o autoaprendizaje/i,
  );

  assert.match(text, /AWS/i);
  assert.match(text, /Java/i);
  assert.match(text, /R/i);
});


test("Qlik is never promoted to known professional technology", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor?",
    }).messages[0].text;

  assert.match(
    text,
    /Qlik no se presenta como experiencia/i,
  );

  assert.match(
    text,
    /no hay experiencia profesional ni formación confirmada/i,
  );
});


test("mastery wording is explicitly qualified", () => {
  const text =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías domina?",
    }).messages[0].text;

  assert.match(
    text,
    /No sería correcto decir que Víctor domina todas las tecnologías al mismo nivel/i,
  );

  assert.ok(
    text.length <= 700,
  );
});


test("technology overview evidence contains Technology only", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué herramientas sabe utilizar?",
    });

  assert.ok(
    response.evidence.knowledgeIds.length >= 25,
  );

  for (const id of response.evidence.knowledgeIds) {
    assert.equal(
      getKnowledgeById(id)?.type,
      KNOWLEDGE_TYPE.TECHNOLOGY,
      id,
    );
  }
});


test("all overview responses disable inference and do not ask visitor name", () => {
  for (const text of [
    "¿Qué ha estudiado Víctor?",
    "¿Qué sabe hacer Víctor?",
    "¿Qué tecnologías conoce Víctor?",
  ]) {
    const response =
      composeKnowledgeOverviewResponse({
        userText: text,
      });

    assert.equal(
      response.safety.allowInference,
      false,
      text,
    );

    assert.equal(
      response.personalization.mayAskName,
      false,
      text,
    );
  }
});


test("overview response preserves continuing context", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Y qué sabe hacer?",
      topic:
        KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES,
      context: {
        continuing: true,
      },
    });

  assert.equal(
    response.conversation.continuity,
    "continuing",
  );
});


test("overview response preserves QA trace", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor?",
      faqId:
        "faq-overview-test",
      answerQaId:
        "response-qa-overview-test",
    });

  assert.equal(
    response.trace.faqId,
    "faq-overview-test",
  );

  assert.equal(
    response.trace.answerQaId,
    "response-qa-overview-test",
  );
});


/* ============================================================
 * DM-H4 — PROGRESSIVE DISCLOSURE
 * ============================================================
 */

test("H4 resolves progressive detail categories deterministically", () => {
  assert.equal(
    resolveKnowledgeOverviewDetail({
      userText:
        "¿Qué formación tiene Víctor en tecnología y datos?",
      topic:
        KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION,
    }),
    KNOWLEDGE_OVERVIEW_DETAIL.EDUCATION_TECH_DATA,
  );

  assert.equal(
    resolveKnowledgeOverviewDetail({
      userText:
        "¿Qué sabe hacer Víctor en automatización e IA?",
      topic:
        KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES,
    }),
    KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_AUTOMATION_AI,
  );

  assert.equal(
    resolveKnowledgeOverviewDetail({
      userText:
        "¿Qué tecnologías conoce Víctor con uso profesional actual?",
      topic:
        KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES,
    }),
    KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_CURRENT,
  );
});


test("H4 initial overview exposes category quick replies instead of full dump", () => {
  const cases = [
    [
      "¿Qué formación tiene Víctor?",
      3,
    ],
    [
      "¿Qué sabe hacer Víctor?",
      4,
    ],
    [
      "¿Qué tecnologías conoce Víctor?",
      4,
    ],
  ];

  for (const [userText, count] of cases) {
    const response =
      composeKnowledgeOverviewResponse({
        userText,
      });

    assert.equal(
      response.presentation.depth,
      "short",
      userText,
    );

    assert.equal(
      response.quickReplies.length,
      count,
      userText,
    );

    assert.ok(
      response.messages[0].text.length < 450,
      userText,
    );
  }
});


test("H4 technology current expansion contains current evidence only", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor con uso profesional actual?",
    });

  const text =
    response.messages[0].text;

  assert.equal(
    response.presentation.depth,
    "medium",
  );

  assert.match(text, /Power BI/i);
  assert.match(text, /Power Automate/i);
  assert.match(text, /Microsoft Copilot/i);

  assert.equal(
    /COBOL|Qlik|AWS/i.test(text),
    false,
  );

  assert.equal(
    response.quickReplies.length,
    1,
  );
});


test("H4 full technology expansion is deep and terminal", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué tecnologías conoce Víctor? Muéstrame todas las tecnologías.",
    });

  const text =
    response.messages[0].text;

  assert.equal(
    response.presentation.depth,
    "deep",
  );

  assert.match(text, /Power BI/i);
  assert.match(text, /COBOL/i);
  assert.match(text, /AWS/i);
  assert.match(text, /Qlik no se presenta como experiencia/i);

  assert.equal(
    response.quickReplies.length,
    0,
  );
});


test("H4 partial education expansion offers one path to full detail", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué formación tiene Víctor en tecnología y datos?",
    });

  assert.match(
    response.messages[0].text,
    /Data Scientist/i,
  );

  assert.match(
    response.messages[0].text,
    /Formación PL-300/i,
  );

  assert.equal(
    response.quickReplies.length,
    1,
  );

  assert.match(
    response.quickReplies[0].label,
    /toda la formación/i,
  );
});


test("H4 capability categories remain grounded in Capability Knowledge", () => {
  const response =
    composeKnowledgeOverviewResponse({
      userText:
        "¿Qué sabe hacer Víctor en BI y datos?",
    });

  assert.match(
    response.messages[0].text,
    /Business Intelligence/i,
  );

  assert.match(
    response.messages[0].text,
    /Calidad de datos|Trazabilidad de datos/i,
  );

  for (const id of response.evidence.knowledgeIds) {
    assert.equal(
      getKnowledgeById(id)?.type,
      KNOWLEDGE_TYPE.CAPABILITY,
      id,
    );
  }
});

test("empty overview message returns null", () => {
  assert.equal(
    composeKnowledgeOverviewResponse({
      userText: "   ",
    }),
    null,
  );
});


test("unsupported overview message returns null", () => {
  assert.equal(
    composeKnowledgeOverviewResponse({
      userText:
        "¿Cuánto cuesta un proyecto?",
    }),
    null,
  );
});


test("overview responses remain JSON serializable", () => {
  for (const text of [
    "¿Qué ha estudiado Víctor?",
    "¿Qué sabe hacer Víctor?",
    "¿Qué tecnologías domina?",
  ]) {
    const response =
      composeKnowledgeOverviewResponse({
        userText: text,
      });

    assert.doesNotThrow(
      () =>
        JSON.stringify(response),
      text,
    );
  }
});