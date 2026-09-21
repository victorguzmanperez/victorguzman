import test from "node:test";
import assert from "node:assert/strict";

import { guidedKnowledge } from "../data/guided-knowledge.js";
import { projectKnowledge } from "../data/knowledge/projects.js";
import { serviceKnowledge } from "../data/knowledge/services.js";
import { solutionKnowledge } from "../data/knowledge/solutions.js";
import { technologyKnowledge } from "../data/knowledge/technologies.js";

function byId(items, id) {
  return items.find((item) => item.id === id);
}

test("CONV-G1 lightweight project summaries stay aligned with protected Knowledge", () => {
  for (const guided of guidedKnowledge.projects) {
    const source = byId(projectKnowledge, guided.id);
    assert.ok(source, guided.id);
    assert.equal(guided.title, source.title);
    assert.equal(guided.shortDescription, source.shortDescription);
  }
});

test("CONV-G1 lightweight service and solution summaries stay aligned with protected Knowledge", () => {
  for (const guided of guidedKnowledge.services) {
    const source = byId(serviceKnowledge, guided.id);
    assert.ok(source, guided.id);
    assert.equal(guided.title, source.title);
    assert.equal(guided.shortDescription, source.shortDescription);
  }
  for (const guided of guidedKnowledge.solutions) {
    const source = byId(solutionKnowledge, guided.id);
    assert.ok(source, guided.id);
    assert.equal(guided.title, source.title);
    assert.equal(guided.shortDescription, source.shortDescription);
  }
});

test("CONV-G1 technology statements are copied only from approved technology Knowledge", () => {
  for (const [id, guided] of Object.entries(guidedKnowledge.technologies)) {
    const source = byId(technologyKnowledge, id);
    assert.ok(source, id);
    assert.equal(guided.title, source.title);
    assert.equal(guided.shortDescription, source.shortDescription);
  }
});
