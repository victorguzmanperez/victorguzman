import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

test("MOB-H1 Power BI embed uses a compact mobile aspect ratio", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.powerbi-frame\s*\{[\s\S]*?min-height:\s*0;/);
  assert.match(css, /\.powerbi-frame iframe\s*\{[\s\S]*?height:\s*auto;[\s\S]*?aspect-ratio:\s*16\s*\/\s*10;/);
});

test("MOB-H1 release entrypoints bust cache for stylesheet and chatbot", () => {
  const pages = [
    "index.html",
    "soluciones.html",
    "diagnostico.html",
    "apoya.html",
    "cookies.html",
    "privacidad.html",
    "projects/auditoria-digital-cv.html",
    "projects/costes.html",
    "projects/investment.html",
    "projects/modelo-evaluacion-competencias.html",
  ];

  for (const relative of pages) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    assert.match(html, /styles\.css\?v=mob-h1\.1/);
    assert.match(html, /chatbot\.js\?v=conv-g1\.13/);
  }
});


test("MOB-H2.1 mobile turns blur composer and do not force refocus after assistant response", () => {
  const bootstrap = fs.readFileSync(path.join(root, "assets/chatbot/chatbot.js"), "utf8");
  assert.match(bootstrap, /shouldDismissComposerKeyboardAfterSubmit\(\{[\s\S]*?windowRef,[\s\S]*?\}\)[\s\S]*?\.blur\?\.\(\)/);
  assert.match(bootstrap, /shouldAutoFocusComposerOnLauncher\(\{[\s\S]*?windowRef,[\s\S]*?\}\)[\s\S]*?input\?\.focus/);
});


test("CONV-G1.1 guided internal navigation only minimizes the panel on narrow viewports", () => {
  const bootstrap = fs.readFileSync(path.join(root, "assets/chatbot/chatbot.js"), "utf8");
  assert.match(bootstrap, /shouldMinimizeGuidedPanelForNavigation/);
  assert.match(bootstrap, /minimizeGuidedPanelForNavigationIfNeeded/);
  assert.match(bootstrap, /action === "navigate"[\s\S]*?minimizeGuidedPanelForNavigationIfNeeded\(\)/);
  assert.match(bootstrap, /action === "diagnostic"[\s\S]*?diagnosticHandoff[\s\S]*?minimizeGuidedPanelForNavigationIfNeeded\(\)/);
});
