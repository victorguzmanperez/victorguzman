import test from "node:test";
import assert from "node:assert/strict";
import { processDialogueTurn, DIALOGUE_ROUTE } from "../core/dialogue-manager.js";
import { resetState, getState } from "../core/state.js";
import { isValidResponseEnvelope } from "../core/response-contract.js";
import { analyzeMessage } from "../core/nlu.js";
import { resolveTechnologyMentions } from "../core/technology-entities.js";
import { technologyKnowledge } from "../data/knowledge/technologies.js";

const cases = [
  ["¿Víctor tiene experiencia con AWS?", "aws", "training_only", /formación.*eso no equivale a experiencia profesional/i, false],
  ["¿Ha trabajado con Qlik Sense?", "qlik", "no_evidence", /no tengo base.*experiencia profesional.*formación/i, false],
  ["¿Trabaja con Power BI?", "power-bi", "direct_experience", /uso profesional actual/i, false],
  ["¿Sabe DAX?", "dax", "direct_experience", /DAX.*Power BI/i, true],
  ["¿Tiene experiencia con Power Automate?", "power-automate", "direct_experience", /aprendizaje.*reciente/i, true],
  ["¿Ha trabajado con COBOL?", "cobol", "direct_experience", /experiencia profesional histórica/i, false],
  ["¿Qué sabe de Java?", "java", "training_only", /autoaprendizaje.*eso no equivale a experiencia profesional/i, false],
];

for (const [userText, tool, qualification, wording, confirm] of cases) {
  test(`free text through final envelope: ${userText}`, () => {
    resetState();
    let turn = processDialogueTurn({ userText });
    assert.deepEqual(turn.decision.analysis.entities.case.tools, [tool]);
    assert.equal(turn.decision.metadata.knowledgeId, `technology-${tool}`);
    assert.ok(isValidResponseEnvelope(turn.response));
    assert.equal(turn.decision.route, confirm ? DIALOGUE_ROUTE.CONFIRMATION : DIALOGUE_ROUTE.KNOWLEDGE_DIRECT);
    if (confirm) {
      assert.equal(turn.response.outcome, "needs_clarification");
      turn = processDialogueTurn({ userText: "Sí" });
      assert.equal(getState().understanding.pendingConfirmation, null);
    }
    assert.equal(turn.decision.route, DIALOGUE_ROUTE.KNOWLEDGE_DIRECT);
    assert.ok(isValidResponseEnvelope(turn.response));
    assert.equal(turn.response.outcome, "qualified");
    assert.equal(turn.response.safety.mustQualify, true);
    assert.equal(turn.response.evidence.knowledgeIds[0], `technology-${tool}`);
    assert.ok(turn.response.evidence.factIds.every(id => id.startsWith(`technology-${tool}-`)));
    assert.ok(turn.response.evidence.qualificationReasons.includes(qualification));
    assert.match(turn.response.messages.map(m => m.text).join(" "), wording);
    assert.notEqual(turn.response.trace.responseTemplateId, "knowledge-direct-list");
  });
}

test("every Knowledge title and alias is recognized by the real NLU", () => {
  for (const item of technologyKnowledge) {
    for (const alias of [item.title, ...item.aliases]) {
      const result = analyzeMessage(`¿Tiene experiencia con ${alias}?`);
      assert.deepEqual(result.entities.case.tools, [item.id.replace(/^technology-/, "")], alias);
    }
  }
});

test("new catalog entries need only title and aliases", () => {
  const item = { id: "technology-new", title: "Future Engine", aliases: ["FÉ v2"] };
  for (const text of ["¿Sabe Future Engine?", "¿Trabaja con fe   v2?"]) {
    assert.deepEqual(resolveTechnologyMentions(text, [...technologyKnowledge, item]), [item]);
  }
});

test("whole terms, longest overlapping aliases and deduplication", () => {
  const ids = text => resolveTechnologyMentions(text).map(item => item.id);
  assert.deepEqual(ids("JavaScript, drawstring, sqlserver y Power Bionic"), []);
  assert.deepEqual(ids("Microsoft SQL Server"), ["technology-sql-server"]);
  assert.deepEqual(ids("C++"), ["technology-cpp"]);
  assert.deepEqual(ids("AWS y Amazon Web Services"), ["technology-aws"]);
  assert.deepEqual(ids("Java y AWS"), ["technology-java", "technology-aws"]);
});

test("general experience remains a general response", () => {
  const turn = processDialogueTurn({ userText: "¿Qué experiencia profesional tiene Víctor?", applyState: false });
  assert.equal(turn.response.trace.responseTemplateId, "knowledge-direct-list");
  assert.ok(isValidResponseEnvelope(turn.response));
});

test("unknown technology cannot acquire a known technology's evidence", () => {
  const turn = processDialogueTurn({ userText: "¿Tiene experiencia con UnknownEngine?", applyState: false });
  assert.ok(!(turn.response?.evidence.knowledgeIds ?? []).some(id => id.startsWith("technology-")));
});

test("entity resolution preserves other routing priorities", () => {
  for (const [userText, route] of [
    ["¿Guardas mis datos de AWS?", DIALOGUE_ROUTE.PRIVACY],
    ["¿Cuánto cuesta un proyecto con AWS?", DIALOGUE_ROUTE.COMMERCIAL],
    ["Quiero contactar con Víctor sobre AWS", DIALOGUE_ROUTE.OPERATIONAL],
    ["Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI.", DIALOGUE_ROUTE.PROBLEM_FLOW],
    ["¿Qué tecnologías domina?", DIALOGUE_ROUTE.KNOWLEDGE_OVERVIEW],
  ]) {
    const turn = processDialogueTurn({ userText, applyState: false });
    assert.equal(turn.decision.route, route, userText);
    assert.ok(isValidResponseEnvelope(turn.response));
  }
});
