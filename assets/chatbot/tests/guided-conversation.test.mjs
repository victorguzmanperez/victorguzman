import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  GUIDED_GRAPH,
  GUIDED_HOME_NODE_ID,
  GUIDED_NODE_MODE,
  buildGuidedDiagnosticPrefill,
  continueGuidedMulti,
  createGuidedConversationController,
  createGuidedState,
  getGuidedView,
  goBackGuided,
  goContactGuided,
  goFeedbackGuided,
  goDiagnosticHandoffGuided,
  goHomeGuided,
  transitionGuidedState,
  validateGuidedState,
} from "../core/guided-conversation.js";

function selectSingle(state, optionId) {
  const result = transitionGuidedState(state, optionId);
  assert.equal(result.changed, true, optionId);
  assert.equal(result.advanced, true, optionId);
  return result.state;
}

function toggleMulti(state, ...optionIds) {
  let current = state;
  for (const optionId of optionIds) {
    const result = transitionGuidedState(current, optionId);
    assert.equal(result.changed, true, optionId);
    assert.equal(result.advanced, false, optionId);
    current = result.state;
  }
  return current;
}

function continueMulti(state) {
  const result = continueGuidedMulti(state);
  assert.equal(result.changed, true);
  assert.equal(result.advanced, true);
  return result.state;
}

test("CONV-G1 starts at a click-only home with the eight top-level routes", () => {
  const state = createGuidedState();
  const view = getGuidedView(state);
  assert.equal(view.id, GUIDED_HOME_NODE_ID);
  assert.equal(view.mode, GUIDED_NODE_MODE.SINGLE);
  assert.match(view.message, /Hola .*Soy el asistente de Víctor/i);
  assert.match(view.message, /conocer su experiencia y proyectos/i);
  assert.match(view.message, /explorar servicios y recursos/i);
  assert.match(view.message, /No necesitas escribir/i);
  assert.match(view.message, /volver atrás, regresar al inicio o terminar cuando quieras/i);
  assert.deepEqual(
    view.options.map((item) => item.label),
    [
      "Mejorar un proceso",
      "Conocer a Víctor",
      "Ver proyectos",
      "Servicios y soluciones",
      "Artículos y recursos",
      "Sobre este asistente",
      "Contactar con Víctor",
      "Completar diagnóstico",
    ],
  );
});

test("CONV-G1 all graph next links resolve and every node has an exit", () => {
  for (const [key, node] of Object.entries(GUIDED_GRAPH)) {
    assert.ok(node?.id, key);
    for (const option of node.options ?? []) {
      if (option.next) assert.ok(GUIDED_GRAPH[option.next], `${key} -> ${option.next}`);
      if (!option.next && node.mode !== GUIDED_NODE_MODE.MULTI) {
        assert.ok(option.action || node.terminal || key.startsWith("resources."), `${key}/${option.id} must act or navigate`);
      }
    }
    const view = getGuidedView({ ...createGuidedState(), currentNode: key });
    assert.ok(
      (view.options?.length ?? 0) > 0 || view.canBack || view.canHome || view.canFinish,
      `${key} must not be a dead end`,
    );
  }
});

test("CONV-G1 process discovery accepts broad multi-select answers instead of forcing one bottleneck", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  assert.equal(state.currentNode, "process.areas");

  state = toggleMulti(state, "area:manual-process", "area:excel-files");
  state = continueMulti(state);
  assert.deepEqual(state.selections.processAreas, ["manual-process", "excel-files"]);

  state = toggleMulti(state, "current:mostly_manual", "current:copy_paste", "current:review_errors");
  state = continueMulti(state);
  assert.deepEqual(state.selections.currentWork, ["mostly_manual", "copy_paste", "review_errors"]);
  assert.equal(state.currentNode, "process.frequency");
});

test("CONV-G1 complete process path produces deterministic editable diagnostic prefill", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process", "area:excel-files", "area:other");
  state = continueMulti(state);
  state = toggleMulti(state, "current:mostly_manual", "current:copy_paste");
  state = continueMulti(state);
  state = selectSingle(state, "frequency:daily");
  state = selectSingle(state, "users:one");
  state = toggleMulti(state, "tool:excel", "tool:access");
  state = continueMulti(state);
  state = toggleMulti(state, "pain:time", "pain:errors");
  state = continueMulti(state);
  state = toggleMulti(state, "goal:save_time", "goal:reduce_errors", "goal:automate");
  state = continueMulti(state);
  state = selectSingle(state, "timeframe:asap");

  assert.equal(state.currentNode, "process.summary");
  const prefill = buildGuidedDiagnosticPrefill(state);
  assert.deepEqual(prefill.needs, ["manual-process", "excel-files", "other"]);
  assert.equal(prefill.users, 1);
  assert.equal(prefill.timeframe, "urgent");
  assert.match(prefill.currentProcess, /Prácticamente todo el proceso es manual/i);
  assert.match(prefill.currentProcess, /Excel y Access/i);
  assert.match(prefill.objective, /Ahorrar tiempo/i);
  assert.match(prefill.additionalInfo, /Me consume demasiado tiempo/i);
});

test("CONV-G1 summary reflects the whole process and never invents a single bottleneck", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process");
  state = continueMulti(state);
  state = toggleMulti(state, "current:mostly_manual");
  state = continueMulti(state);
  state = selectSingle(state, "frequency:daily");
  state = selectSingle(state, "users:one");
  state = toggleMulti(state, "tool:excel");
  state = continueMulti(state);
  state = toggleMulti(state, "pain:time", "pain:repetitive");
  state = continueMulti(state);
  state = toggleMulti(state, "goal:save_time", "goal:automate");
  state = continueMulti(state);
  state = selectSingle(state, "timeframe:weeks");

  const view = getGuidedView(state);
  assert.equal(view.id, "process.summary");
  assert.match(view.message, /proceso|procesos manuales/i);
  assert.match(view.message, /tú solo/i);
  assert.match(view.message, /Con esto ya tengo una buena idea del caso/i);
  assert.doesNotMatch(view.message, /el cuello de botella (?:es|está)/i);
});

test("CONV-G1 Back restores the previous node and selections", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:excel-files");
  state = continueMulti(state);
  assert.equal(state.currentNode, "process.current");

  const back = goBackGuided(state);
  assert.equal(back.changed, true);
  assert.equal(back.state.currentNode, "process.areas");
  assert.deepEqual(back.state.selections.processAreas, ["excel-files"]);
  assert.deepEqual(back.state.pendingMulti, ["excel-files"]);
});

test("CONV-G1 Inicio always returns to home without losing already selected process facts", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:excel-files");
  state = continueMulti(state);
  const home = goHomeGuided(state).state;
  assert.equal(home.currentNode, "home");
  assert.deepEqual(home.selections.processAreas, ["excel-files"]);
  assert.deepEqual(home.history, []);
});

test("CONV-G1 universal finish reaches feedback from any functional branch", () => {
  for (const startOption of ["home-process", "home-victor", "home-projects", "home-services", "home-resources", "home-contact"]) {
    let state = createGuidedState();
    state = selectSingle(state, startOption);
    const finished = goFeedbackGuided(state).state;
    assert.equal(finished.currentNode, "feedback");
    assert.deepEqual(getGuidedView(finished).options.map((x) => x.label), ["👍 Sí", "😐 Más o menos", "👎 No"]);
  }
});

test("CONV-G1.1 diagnostic handoff is terminal, preserves facts and exposes only feedback", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process", "area:excel-files");
  state = continueMulti(state);
  state = toggleMulti(state, "current:mostly_manual", "current:copy_paste");
  state = continueMulti(state);

  const handoff = goDiagnosticHandoffGuided(state).state;
  const view = getGuidedView(handoff);

  assert.equal(handoff.currentNode, "diagnostic.handoff");
  assert.deepEqual(handoff.history, []);
  assert.deepEqual(handoff.selections.processAreas, ["manual-process", "excel-files"]);
  assert.match(view.message, /he dejado preparado un borrador del diagnóstico/i);
  assert.match(view.message, /revisa lo que ya aparece rellenado/i);
  assert.match(view.message, /casilla de privacidad queda sin marcar/i);
  assert.deepEqual(view.options.map((x) => x.label), ["👍 Sí", "😐 Más o menos", "👎 No"]);
  assert.equal(view.canBack, false);
  assert.equal(view.canHome, false);
  assert.equal(view.canFinish, false);
});

test("CONV-G1.1 direct diagnostic does not pretend that fields were prefilled", () => {
  const handoff = goDiagnosticHandoffGuided(createGuidedState()).state;
  const view = getGuidedView(handoff);
  assert.match(view.message, /Te llevo al diagnóstico/i);
  assert.match(view.message, /completa el formulario/i);
  assert.doesNotMatch(view.message, /he preparado un borrador/i);
  assert.doesNotMatch(view.message, /^Perfecto\./i);
});

test("CONV-G1.1 closing paths hide Back, Home and universal finish", () => {
  const feedback = getGuidedView(goFeedbackGuided(createGuidedState()).state);
  assert.equal(feedback.canBack, false);
  assert.equal(feedback.canHome, false);
  assert.equal(feedback.canFinish, false);

  let positive = selectSingle(goFeedbackGuided(createGuidedState()).state, "feedback-positive");
  const support = getGuidedView(positive);
  assert.equal(support.canBack, false);
  assert.equal(support.canHome, false);
  assert.equal(support.canFinish, false);
});

test("CONV-G1 feedback routes positive/neutral to support and negative directly to thanks", () => {
  let state = goFeedbackGuided(createGuidedState()).state;
  let positive = selectSingle(state, "feedback-positive");
  assert.equal(positive.currentNode, "support.offer");
  assert.deepEqual(getGuidedView(positive).options.map((x) => x.label), ["Apoyar el proyecto", "Ahora no"]);

  state = goFeedbackGuided(createGuidedState()).state;
  const neutral = selectSingle(state, "feedback-neutral");
  assert.equal(neutral.currentNode, "support.offer");

  state = goFeedbackGuided(createGuidedState()).state;
  const negative = selectSingle(state, "feedback-negative");
  assert.equal(negative.currentNode, "feedback.negative");
  assert.doesNotMatch(getGuidedView(negative).message, /apoy|aportación/i);
});

test("CONV-G1 controller persists current node and selections in its own session key", () => {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const first = createGuidedConversationController({ storageRef: storage });
  first.select("home-process");
  first.select("area:manual-process");
  first.continueMulti();
  assert.equal(first.getState().currentNode, "process.current");

  const restored = createGuidedConversationController({ storageRef: storage });
  assert.equal(restored.getState().currentNode, "process.current");
  assert.deepEqual(restored.getState().selections.processAreas, ["manual-process"]);
  assert.equal(validateGuidedState(restored.getState()), true);
});


test("CONV-G1.2.1 profile introduction is conversational and grounded in the documented trajectory", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-victor");
  const view = getGuidedView(state);

  assert.match(view.message, /Víctor lleva más de 20 años trabajando en tecnología/i);
  assert.match(view.message, /sector financiero/i);
  assert.match(view.message, /desarrollo COBOL/i);
  assert.match(view.message, /datos, Business Intelligence, automatización e inteligencia artificial aplicada/i);
  assert.doesNotMatch(view.message, /^Profesional con trayectoria/i);
});

test("CONV-G1.2.1 header reset re-renders guided Home options without requiring a browser refresh", () => {
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  const resetStart = bootstrap.indexOf("function performConversationReset");
  const resetEnd = bootstrap.indexOf("function scheduleFeedbackCompletion", resetStart);
  const resetSource = bootstrap.slice(resetStart, resetEnd);

  assert.match(resetSource, /guidedController\.reset\(\)/);
  assert.match(resetSource, /guidedAppendAssistant/);
  assert.match(resetSource, /renderGuidedConversation\(\)/);
  assert.match(resetSource, /else\s*\{[\s\S]*renderConversationState/);
});

test("CONV-G1.5 home exposes an explicit branch about the guided assistant", () => {
  const view = getGuidedView(createGuidedState());
  const about = view.options.find((option) => option.id === "home-assistant");

  assert.ok(about);
  assert.equal(about.label, "Sobre este asistente");
  assert.equal(about.next, "assistant.menu");
});

test("CONV-G1.5 assistant menu uses predefined questions instead of free text", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-assistant");
  const view = getGuidedView(state);

  assert.equal(view.id, "assistant.menu");
  assert.deepEqual(
    view.options.map((option) => option.label),
    ["¿Cómo funciona?", "¿Usa IA o un LLM?", "¿Qué puede hacer?", "¿Es un agente de IA?"],
  );
});

test("CONV-G1.5 guided assistant explains the guided flow in natural language", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-assistant");
  state = selectSingle(state, "assistant-how");
  const view = getGuidedView(state);

  assert.equal(view.id, "assistant.how");
  assert.match(view.message, /recorrido guiado/i);
  assert.match(view.message, /tú eliges entre distintas opciones/i);
  assert.match(view.message, /siguiente paso/i);
  assert.doesNotMatch(view.message, /Conversation Graph|determinista|estado estructurado|handoff|runtime/i);
});

test("CONV-G1.5 guided assistant distinguishes itself from LLM and autonomous AI agents", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-assistant");

  state = selectSingle(state, "assistant-llm");
  let view = getGuidedView(state);
  assert.match(view.message, /En esta conversación, no/i);
  assert.match(view.message, /no genera respuestas con un LLM/i);
  assert.match(view.message, /preparados de antemano/i);

  state = goHomeGuided(state).state;
  state = selectSingle(state, "home-assistant");
  state = selectSingle(state, "assistant-agent");
  view = getGuidedView(state);
  assert.match(view.message, /^No\./i);
  assert.match(view.message, /no toma decisiones ni actúa por su cuenta/i);
});

test("CONV-G1.6 public Guided copy avoids internal implementation jargon", () => {
  const forbiddenMessageJargon = /Conversation Graph|estado estructurado|handoff|runtime|testeable|discovery/i;
  for (const [nodeId, node] of Object.entries(GUIDED_GRAPH)) {
    if (node.message?.startsWith?.("__DYNAMIC_")) continue;
    assert.doesNotMatch(node.message ?? "", forbiddenMessageJargon, nodeId);
  }
});

test("CONV-G1.6 assistant branch uses natural visitor-facing labels", () => {
  const menu = getGuidedView({ ...createGuidedState(), currentNode: "assistant.menu" });
  assert.match(menu.message, /curiosidad por saber cómo funciona/i);

  const capabilities = getGuidedView({ ...createGuidedState(), currentNode: "assistant.capabilities" });
  assert.deepEqual(capabilities.options.map((option) => option.label), ["Explorar mi caso", "Completar diagnóstico"]);

  const agent = getGuidedView({ ...createGuidedState(), currentNode: "assistant.agent" });
  assert.ok(agent.options.some((option) => option.label === "Experiencia con IA"));

  const labels = Object.values(GUIDED_GRAPH).flatMap((node) => (node.options ?? []).map((option) => option.label));
  assert.equal(labels.includes("Probar el discovery"), false);
  assert.equal(labels.includes("IA de Víctor"), false);
  assert.equal(labels.includes("IA / LLM"), false);
});

test("CONV-G1.6 process discovery sounds conversational without losing multi-select semantics", () => {
  const areas = getGuidedView({ ...createGuidedState(), currentNode: "process.areas" });
  assert.match(areas.message, /¿Qué te gustaría mejorar\?/i);
  assert.match(areas.message, /marcar una o varias opciones/i);

  const current = getGuidedView({ ...createGuidedState(), currentNode: "process.current" });
  assert.match(current.message, /¿Cómo se hace hoy ese trabajo\?/i);
  assert.doesNotMatch(current.message, /cuello de botella/i);

  const pain = getGuidedView({ ...createGuidedState(), currentNode: "process.pain" });
  assert.match(pain.message, /¿Qué te está dando más problemas\?/i);
});

test("CONV-G1 browser integration hides the free-text composer behind a reversible config flag", () => {
  const config = fs.readFileSync(new URL("../core/config.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../chatbot.css", import.meta.url), "utf8");

  assert.match(config, /guidedMode:\s*true/);
  assert.match(bootstrap, /GUIDED_MODE_ENABLED/);
  assert.match(bootstrap, /createGuidedConversationController/);
  assert.match(bootstrap, /buildDiagnosticPrefill/);
  assert.match(css, /vg-chatbot--guided[\s\S]*vg-chatbot-composer/);
});


test("CONV-G1.2 every non-closing branch exposes the conversion funnel without duplicate CTAs", () => {
  const closing = new Set(["feedback", "diagnostic.handoff", "support.offer", "feedback.negative"]);

  for (const key of Object.keys(GUIDED_GRAPH)) {
    const state = { ...createGuidedState(), currentNode: key };
    const view = getGuidedView(state);
    if (closing.has(key)) continue;

    const hasDiagnostic = view.options.some((option) => option.action === "diagnostic") || view.canDiagnostic;
    const hasContact =
      view.section === "contact" ||
      view.options.some((option) => option.next === "contact.menu" || option.action === "contact") ||
      view.canContact;

    assert.equal(hasDiagnostic, true, `${key} must expose diagnostic`);
    assert.equal(hasContact, true, `${key} must expose contact`);
    assert.equal(view.canFinish, true, `${key} must expose finish`);
  }
});

test("CONV-G1.2 universal contact preserves pending multi-select facts", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process", "area:excel-files");

  const contact = goContactGuided(state).state;
  assert.equal(contact.currentNode, "contact.menu");
  assert.deepEqual(contact.selections.processAreas, ["manual-process", "excel-files"]);
  assert.equal(contact.pendingMulti.length, 0);
});

test("CONV-G1.2 universal diagnostic preserves pending multi-select facts in prefill", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process", "area:excel-files");

  const handoff = goDiagnosticHandoffGuided(state).state;
  const prefill = buildGuidedDiagnosticPrefill(handoff);
  assert.deepEqual(prefill.needs, ["manual-process", "excel-files"]);
});

test("CONV-G1.2 process summary uses natural second-person wording and omits unknown user count", () => {
  let state = createGuidedState();
  state = selectSingle(state, "home-process");
  state = toggleMulti(state, "area:manual-process", "area:excel-files");
  state = continueMulti(state);
  state = toggleMulti(state, "current:mostly_manual", "current:copy_paste", "current:update_reports");
  state = continueMulti(state);
  state = selectSingle(state, "frequency:daily");
  state = selectSingle(state, "users:unknown");
  state = toggleMulti(state, "tool:excel", "tool:access");
  state = continueMulti(state);
  state = toggleMulti(state, "pain:time");
  state = continueMulti(state);
  state = toggleMulti(state, "goal:save_time", "goal:automate");
  state = continueMulti(state);
  state = selectSingle(state, "timeframe:asap");

  const message = getGuidedView(state).message;
  assert.match(message, /prácticamente todo el proceso es manual/i);
  assert.match(message, /copias y pegas datos entre archivos/i);
  assert.match(message, /actualizas informes manualmente/i);
  assert.doesNotMatch(message, /Ahora mismo copio|Ahora mismo actualizo/i);
  assert.doesNotMatch(message, /lo utilizan no lo sé/i);
});

test("CONV-G1.2 guided diagnostic suppresses the legacy navigation handoff", () => {
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  assert.match(bootstrap, /navigationHandoffCandidate/);
  assert.match(bootstrap, /GUIDED_MODE_ENABLED\s*\?\s*null\s*:\s*navigationHandoffCandidate/);
  assert.match(bootstrap, /no añadimos[\s\S]*mensajes\/acciones legacy/i);
});


test("CONV-G1.2 renderer exposes universal diagnostic/contact shortcuts", () => {
  const renderer = fs.readFileSync(new URL("../ui/guided-conversation-renderer.js", import.meta.url), "utf8");
  assert.match(renderer, /También puedes/);
  assert.match(renderer, /Completar diagnóstico/);
  assert.match(renderer, /Contactar con Víctor/);
  assert.match(renderer, /onDiagnostic/);
  assert.match(renderer, /onContact/);
});


test("CONV-G1.3 top-level copy is natural and oriented to the visitor's intent", () => {
  const routes = [
    ["home-projects", "projects.menu", /algunos de los proyectos principales de Víctor/i, /qué problema resuelve/i],
    ["home-services", "services.menu", /Si tienes una necesidad concreta/i, /se parece más a tu caso/i],
    ["home-resources", "resources.menu", /Si quieres seguir explorando/i, /Power BI, Power Query, finanzas, inversión y aprendizaje/i],
    ["home-contact", "contact.menu", /Si quieres hablar con Víctor/i, /reservar una reunión inicial/i],
  ];

  for (const [optionId, nodeId, first, second] of routes) {
    const state = selectSingle(createGuidedState(), optionId);
    assert.equal(state.currentNode, nodeId);
    const view = getGuidedView(state);
    assert.match(view.message, first);
    assert.match(view.message, second);
  }
});

test("CONV-G1.3 resources expose only curated public content categories", () => {
  const state = selectSingle(createGuidedState(), "home-resources");
  const view = getGuidedView(state);
  assert.deepEqual(
    view.options.map((option) => option.label),
    [
      "Dataverso",
      "Power BI",
      "Power Query",
      "Finanzas personales",
      "Inversión",
      "Libros",
      "Aprendizaje y crecimiento personal",
    ],
  );
  assert.equal(view.options.some((option) => option.label === "Automatización e IA"), false);
});

test("CONV-G1.3 guided cache-busting keeps bootstrap, renderer and core on the same release", () => {
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  const renderer = fs.readFileSync(new URL("../ui/guided-conversation-renderer.js", import.meta.url), "utf8");
  assert.match(bootstrap, /guided-conversation-renderer\.js\?v=conv-g1\.13/);
  assert.match(bootstrap, /guided-conversation\.js\?v=conv-g1\.13/);
  assert.match(bootstrap, /chatbot\.css\?v=conv-g1\.13/);
  assert.match(renderer, /guided-conversation\.js\?v=conv-g1\.13/);
});


test("CONV-G1.4 Victor branch uses conversational copy without internal evidence jargon", () => {
  const checks = [
    ["victor.current", /Ahora mismo, Víctor trabaja principalmente con datos/i],
    ["victor.trajectory", /Víctor empezó su carrera en 2004/i],
    ["victor.technologies", /A lo largo de su trayectoria ha trabajado con Power BI/i],
    ["victor.tech.powerbi", /Power BI forma parte de su trabajo actual/i],
    ["victor.tech.cobol", /Durante buena parte de su trayectoria trabajó con COBOL/i],
    ["victor.tech.ai", /La IA es una línea más reciente dentro de su trayectoria/i],
    ["victor.education", /En los últimos años ha reforzado especialmente su formación/i],
  ];

  for (const [nodeId, expected] of checks) {
    const view = getGuidedView({ ...createGuidedState(), currentNode: nodeId });
    assert.match(view.message, expected, nodeId);
    assert.doesNotMatch(view.message, /evidencia profesional actual|responsabilidad actual centrada|respaldada por formación formal|área actual de aprendizaje/i, nodeId);
  }
});

test("CONV-G1.4 project, service and solution detail nodes do not repeat their titles as catalogue copy", () => {
  for (const project of [
    "project-business-cost-intelligence",
    "project-auditoria-digital-cv",
    "project-investment-dashboard-ai",
    "project-digital-competency-evaluation",
  ]) {
    const view = getGuidedView({ ...createGuidedState(), currentNode: `project:${project}` });
    assert.match(view.message, /^Este proyecto/i, project);
    assert.doesNotMatch(view.message, /^[^.]+\.\s+(?:Automatización|Proyecto|Plataforma|Modelo)/i, project);
  }

  for (const service of [
    "service-business-intelligence-dashboards",
    "service-excel-business-models",
    "service-data-process-automation",
    "service-ai-process-analysis",
  ]) {
    const view = getGuidedView({ ...createGuidedState(), currentNode: `service:${service}` });
    assert.match(view.message, /^(Si necesitas|Si tu proceso|Si tienes|Si estás valorando)/i, service);
  }

  const solutionTitles = new Map([
    ["solution-data-consolidation-automation", "Consolidación y automatización de datos"],
    ["solution-reporting-dashboard-automation", "Automatización de reporting y dashboards"],
    ["solution-evaluation-scoring-model", "Modelos de evaluación y scoring trazables"],
    ["solution-document-data-extraction", "Extracción estructurada de datos de documentos"],
    ["solution-data-quality-traceability", "Calidad, validación y trazabilidad de datos"],
    ["solution-web-audit-scoring-automation", "Automatización de auditoría y scoring web"],
    ["solution-financial-analysis-monitoring", "Análisis y monitorización de datos financieros"],
    ["solution-ai-opportunity-assessment", "Identificación y evaluación de oportunidades con IA"],
  ]);
  for (const [solution, title] of solutionTitles) {
    const view = getGuidedView({ ...createGuidedState(), currentNode: `solution:${solution}` });
    assert.equal(view.message.startsWith(`${title}.`), false, solution);
  }
});

test("CONV-G1.4 resources and contact use visitor-facing language", () => {
  const dataverso = getGuidedView({ ...createGuidedState(), currentNode: "resources.dataverso" });
  assert.match(dataverso.message, /donde comparte lo que va aprendiendo y aplicando/i);

  const powerBi = getGuidedView({ ...createGuidedState(), currentNode: "resources.power-bi" });
  assert.match(powerBi.message, /Si te interesa Power BI/i);
  assert.doesNotMatch(powerBi.message, /^Power BI\./i);

  const contact = getGuidedView({ ...createGuidedState(), currentNode: "contact.details" });
  assert.match(contact.message, /Puedes escribir a Víctor por email/i);
  assert.match(contact.message, /se concretan directamente con él/i);
  assert.doesNotMatch(contact.message, /El asistente no puede comprometer/i);
});

test("CONV-G1.4 all graph nodes remain reachable or are intentional universal/terminal destinations", () => {
  const reachable = new Set(["home"]);
  const queue = ["home"];
  while (queue.length) {
    const current = queue.shift();
    const node = GUIDED_GRAPH[current];
    if (node?.next && !reachable.has(node.next)) {
      reachable.add(node.next);
      queue.push(node.next);
    }
    for (const option of node?.options ?? []) {
      if (option.next && !reachable.has(option.next)) {
        reachable.add(option.next);
        queue.push(option.next);
      }
    }
  }

  // Universal controls/actions reach these nodes without being encoded as per-node next options.
  ["contact.menu", "diagnostic.handoff", "feedback", "support.offer", "feedback.negative"].forEach((id) => reachable.add(id));

  for (const [key, node] of Object.entries(GUIDED_GRAPH)) {
    // Alias keys intentionally point at an already reachable node definition.
    const aliasOfReachable = [...reachable].some((id) => GUIDED_GRAPH[id] === node);
    assert.equal(reachable.has(key) || aliasOfReachable, true, `${key} should be reachable`);
  }
});


test("CONV-G1.4.1 controller reset drops old discovery facts and a new discovery prefills only the new case", () => {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const controller = createGuidedConversationController({ storageRef: storage });

  controller.select("home-process");
  controller.select("area:reporting");
  controller.select("area:excel-files");
  controller.continueMulti();
  controller.select("current:copy_paste");
  controller.continueMulti();
  controller.select("frequency:daily");
  controller.select("users:one");
  controller.select("tool:excel");
  controller.continueMulti();

  const oldPrefill = controller.buildDiagnosticPrefill();
  assert.ok(oldPrefill.needs.includes("reporting"));
  assert.ok(oldPrefill.needs.includes("excel-files"));
  assert.match(oldPrefill.currentProcess, /Excel/i);

  controller.reset();
  const directAfterReset = controller.buildDiagnosticPrefill();
  assert.deepEqual(directAfterReset.needs, []);
  assert.equal(directAfterReset.currentProcess, null);
  assert.equal(directAfterReset.users, null);
  assert.equal(directAfterReset.timeframe, null);
  assert.equal(directAfterReset.objective, null);
  assert.equal(directAfterReset.additionalInfo, null);

  controller.select("home-process");
  controller.select("area:manual-process");
  controller.continueMulti();
  controller.select("current:mostly_manual");
  controller.continueMulti();
  controller.select("frequency:weekly");
  controller.select("users:two_five");
  controller.select("tool:access");
  controller.continueMulti();

  const newPrefill = controller.buildDiagnosticPrefill();
  assert.deepEqual(newPrefill.needs, ["manual-process"]);
  assert.match(newPrefill.currentProcess, /Access/i);
  assert.doesNotMatch(newPrefill.currentProcess, /Excel/i);
  assert.equal(newPrefill.users, 2);
});

test("CONV-G1.4.1 header reset clears both state and an already-rendered diagnostic form", () => {
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  const resetStart = bootstrap.indexOf("function performConversationReset");
  const resetEnd = bootstrap.indexOf("function scheduleFeedbackCompletion", resetStart);
  const resetSource = bootstrap.slice(resetStart, resetEnd);

  assert.match(resetSource, /resetConversation\(\)/);
  assert.match(resetSource, /resetDiagnosticFormForNewConversation\(\{[\s\S]*documentRef/);
  assert.match(resetSource, /guidedController\.reset\(\)/);
});


test("CONV-G1.4.2 guided diagnostic applies prefill to an already-visible diagnostic form before navigation", () => {
  const bootstrap = fs.readFileSync(new URL("../chatbot.js", import.meta.url), "utf8");
  const handlerStart = bootstrap.indexOf("function handleGuidedAction");
  const diagnosticStart = bootstrap.indexOf('action === "diagnostic"', handlerStart);
  const diagnosticEnd = bootstrap.indexOf('action === "contact"', diagnosticStart);
  const diagnosticSource = bootstrap.slice(diagnosticStart, diagnosticEnd);

  const buildIndex = diagnosticSource.indexOf("buildDiagnosticPrefill()");
  const stateIndex = diagnosticSource.indexOf("updateDiagnosticFields(");
  const domIndex = diagnosticSource.indexOf("applyDiagnosticPrefillToForm({");
  const navigationIndex = diagnosticSource.indexOf("windowRef.location.assign(");

  assert.ok(buildIndex >= 0, "guided diagnostic should build its current prefill");
  assert.ok(stateIndex > buildIndex, "prefill should update diagnostic state");
  assert.ok(domIndex > stateIndex, "same-page form should receive the new prefill");
  assert.ok(navigationIndex > domIndex, "DOM reapply must happen before navigation/hash update");
  assert.match(diagnosticSource, /allowPrefill:\s*true/);
});
