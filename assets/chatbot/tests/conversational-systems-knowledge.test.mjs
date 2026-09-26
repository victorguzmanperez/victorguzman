import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { processDialogueTurn, DIALOGUE_ROUTE } from "../core/dialogue-manager.js";
import { resetState } from "../core/state.js";
import { resolveKnowledgeAlias } from "../data/knowledge.js";
import { KNOWLEDGE_TYPE } from "../data/knowledge/constants.js";
import {
  ASSISTANT_KNOWLEDGE_REQUEST,
  detectAssistantKnowledgeRequest,
} from "../core/assistant-architecture-response-composer.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const capabilityId = "capability-deterministic-conversational-systems";

function visibleText(turn) {
  return (turn.response.messages ?? []).map(message => message.text).join(" ");
}

function turnFor(userText) {
  resetState();
  return processDialogueTurn({ userText, applyState: false });
}

test("CONV-H3.26 deterministic conversational aliases resolve to the canonical capability", () => {
  for (const alias of [
    "asistente conversacional",
    "asistente del portfolio",
    "chatbot basado en reglas",
    "preguntas y respuestas precargadas",
    "deterministic chatbot",
  ]) {
    assert.equal(
      resolveKnowledgeAlias(alias, KNOWLEDGE_TYPE.CAPABILITY)?.id,
      capabilityId,
      alias,
    );
  }
});

test("CONV-H3.26 generic agent wording is deliberately not an alias", () => {
  for (const alias of ["agente", "agentes", "agente de IA", "agentes de IA"]) {
    assert.notEqual(
      resolveKnowledgeAlias(alias, KNOWLEDGE_TYPE.CAPABILITY)?.id,
      capabilityId,
      alias,
    );
  }
});

test("CONV-H3.26 applied chatbot experience remains project-qualified", () => {
  const turn = turnFor("¿Víctor tiene experiencia diseñando chatbots basados en reglas?");

  assert.equal(turn.decision.route, DIALOGUE_ROUTE.KNOWLEDGE_DIRECT);
  assert.equal(turn.decision.metadata.knowledgeId, capabilityId);
  assert.ok((turn.response.evidence.knowledgeIds ?? []).includes(capabilityId));
  assert.match(visibleText(turn), /Conversation Graph|grafo de conversación/i);
  assert.match(visibleText(turn), /proyecto aplicado/i);
  assert.match(visibleText(turn), /sin depender de un LLM/i);
});

test("CONV-H3.27 self-knowledge detector covers the intended architecture families", () => {
  const cases = [
    ["¿Qué es el asistente del portfolio?", ASSISTANT_KNOWLEDGE_REQUEST.ABOUT],
    ["¿Cómo funciona el asistente del portfolio?", ASSISTANT_KNOWLEDGE_REQUEST.HOW_IT_WORKS],
    ["¿El chatbot usa IA?", ASSISTANT_KNOWLEDGE_REQUEST.USES_AI],
    ["¿El chatbot es generativo?", ASSISTANT_KNOWLEDGE_REQUEST.USES_AI],
    ["¿El asistente usa un LLM?", ASSISTANT_KNOWLEDGE_REQUEST.USES_LLM],
    ["¿Es un agente de IA?", ASSISTANT_KNOWLEDGE_REQUEST.IS_AI_AGENT],
    ["¿Ha hecho chatbots?", ASSISTANT_KNOWLEDGE_REQUEST.CHATBOT_EXPERIENCE],
    ["¿Qué son las preguntas y respuestas precargadas?", ASSISTANT_KNOWLEDGE_REQUEST.PRELOADED_QA],
    ["¿Víctor tiene experiencia desarrollando agentes de IA?", ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE],
    ["¿Hace agentes de IA?", ASSISTANT_KNOWLEDGE_REQUEST.AI_AGENT_EXPERIENCE],
  ];

  for (const [input, expected] of cases) {
    assert.equal(detectAssistantKnowledgeRequest(input), expected, input);
  }
});

test("CONV-H3.27 what-is question explains the portfolio assistant, not the project catalog", () => {
  const turn = turnFor("¿Qué es el asistente del portfolio?");
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.equal(turn.decision.metadata.knowledgeId, capabilityId);
  assert.match(visibleText(turn), /asistente guiado determinista/i);
  assert.match(visibleText(turn), /opciones predefinidas/i);
  assert.doesNotMatch(visibleText(turn), /En el portfolio aparecen/i);
});

test("CONV-H3.27 how-it-works question exposes deterministic architecture", () => {
  const turn = turnFor("¿Cómo funciona el asistente del portfolio?");
  const text = visibleText(turn);
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.match(text, /Conversation Graph/i);
  assert.match(text, /estado estructurado/i);
  assert.match(text, /reglas de transición|reglas/i);
  assert.match(text, /LLM/i);
});

test("CONV-H3.27 chatbot AI question is about this assistant, not Victor's AI technology evidence", () => {
  const turn = turnFor("¿El chatbot usa IA?");
  const ids = turn.response.evidence.knowledgeIds ?? [];
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.ok(ids.includes(capabilityId));
  assert.equal(ids.includes("technology-ai"), false);
  assert.match(visibleText(turn), /no funciona como un chatbot de IA generativa/i);
});

test("CONV-H3.27 LLM question is answered explicitly", () => {
  const turn = turnFor("¿El asistente usa un LLM?");
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.match(visibleText(turn), /^No\./i);
  assert.match(visibleText(turn), /no depende de un LLM/i);
});

test("CONV-H3.27 implicit agent question is understood as a question about the assistant", () => {
  const turn = turnFor("¿Es un agente de IA?");
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.match(visibleText(turn), /No es un agente autónomo de IA/i);
  assert.ok((turn.response.evidence.knowledgeIds ?? []).includes(capabilityId));
});

test("CONV-H3.27 generic chatbot experience is limited to demonstrated project evidence", () => {
  const turn = turnFor("¿Ha hecho chatbots?");
  const text = visibleText(turn);
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.match(text, /experiencia aplicada demostrable en este proyecto/i);
  assert.match(text, /no una afirmación genérica de experiencia profesional/i);
});

test("CONV-H3.27 preloaded Q&A wording explains that the implementation goes beyond a fixed table", () => {
  const turn = turnFor("¿Qué son las preguntas y respuestas precargadas?");
  const text = visibleText(turn);
  assert.equal(turn.decision.reason, "assistant_self_knowledge");
  assert.match(text, /solo una parte/i);
  assert.match(text, /grafo de conversación/i);
  assert.match(text, /estado estructurado/i);
});

test("CONV-H3.27 AI-agent experience stays qualified and never uses deterministic chatbot capability as proof", () => {
  for (const input of [
    "¿Víctor tiene experiencia desarrollando agentes de IA?",
    "¿Hace agentes de IA?",
  ]) {
    const turn = turnFor(input);
    const ids = turn.response.evidence.knowledgeIds ?? [];
    const text = visibleText(turn);

    assert.equal(turn.decision.reason, "assistant_self_knowledge", input);
    assert.ok(ids.includes("technology-ai"), input);
    assert.equal(ids.includes(capabilityId), false, input);
    assert.match(text, /no aporta evidencia suficiente/i, input);
    assert.match(text, /asistente.*distinto/i, input);
  }
});

test("CONV-H3.27 creation requests are not hijacked as self-knowledge", () => {
  for (const input of [
    "Quiero crear un chatbot para mi empresa",
    "Necesito un asistente para responder a clientes",
  ]) {
    assert.equal(detectAssistantKnowledgeRequest(input), null, input);
  }
});

test("CONV-H3.27 portfolio explains the guided assistant publicly in natural language", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /asistente guiado que he diseñado/i);
  assert.match(html, /opciones y recorridos preparados/i);
  assert.match(html, /No interpreta texto libre ni genera esta conversación con IA/i);
  assert.doesNotMatch(html, /Conversation Graph|estado estructurado|handoff|runtime/i);
  assert.match(html, /Asistentes guiados/);
});
