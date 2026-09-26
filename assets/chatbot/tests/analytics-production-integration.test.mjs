import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../../..");

function read(relativePath) {
  return fs.readFileSync(
    path.join(root, relativePath),
    "utf8",
  );
}

test("FINAL QA public pages load the release-versioned chatbot bootstrap", () => {
  const pages = [
    "index.html",
    "soluciones.html",
    "diagnostico.html",
    "apoya.html",
    "privacidad.html",
    "cookies.html",
    "projects/costes.html",
    "projects/auditoria-digital-cv.html",
    "projects/modelo-evaluacion-competencias.html",
    "projects/investment.html",
  ];

  for (const page of pages) {
    const html = read(page);
    assert.match(
      html,
      /assets\/chatbot\/chatbot\.js\?v=conv-g1\.13/,
      page,
    );
  }

  const bootstrap = read("assets/chatbot/chatbot.js");
  const manager = read("assets/chatbot/core/dialogue-manager.js");
  const planner = read("assets/chatbot/core/conversation-planner.js");
  const plannerV2 = read("assets/chatbot/core/conversation-planner-v2.js");
  const qualityGate = read("assets/chatbot/core/conversation-quality-gate.js");

  assert.match(bootstrap, /navigation-handoff\.js\?v=conv-h3\.23\.1/);
  assert.match(bootstrap, /diagnostic-prefill\.js\?v=conv-g1\.13/);
  assert.match(bootstrap, /ui\/ui\.js\?v=mob-h1\.1/);
  assert.match(bootstrap, /actions\.js\?v=mob-h1\.1/);
  assert.match(bootstrap, /dialogue-manager\.js\?v=conv-h3\.27/);
  assert.match(manager, /conversation-planner\.js\?v=conv-h3\.22\.2/);
  assert.match(manager, /conversation-quality-gate\.js\?v=conv-h3\.22\.2/);
  assert.match(planner, /conversation-planner-v2\.js\?v=conv-h3\.22\.2/);
  assert.match(plannerV2, /natural-response-composer\.js\?v=conv-h3\.22\.2/);
  assert.match(qualityGate, /conversation-planner-v2\.js\?v=conv-h3\.22\.2/);
  assert.match(qualityGate, /natural-response-composer\.js\?v=conv-h3\.22\.2/);
});

test("OBS-H1 diagnostic conversion keeps only structured chatbot attribution in GA4", () => {
  const html = read("diagnostico.html");

  assert.match(html, /lead_source:\s*\n\s*diagnosticAnalyticsSource\(\)/);
  assert.match(html, /"chatbot_diagnostic"/);
  assert.match(html, /diagnosticStartedSent/);
});

test("OBS-H1 privacy copy explicitly excludes conversation text and personal fields from Analytics", () => {
  const privacy = read("privacidad.html");
  const cookies = read("cookies.html");

  assert.match(privacy, /no incluyen el texto de los mensajes/i);
  assert.match(privacy, /nombre, correo electrónico, teléfono/i);
  assert.match(privacy, /Si no aceptas Analytics/i);
  assert.match(cookies, /No se envía a Google Analytics el texto libre de los mensajes/i);
});
