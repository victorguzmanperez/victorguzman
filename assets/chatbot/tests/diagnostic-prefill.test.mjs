import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGNOSTIC_NEED,
  applyDiagnosticPrefillToForm,
  buildDiagnosticPrefillFromState,
  resetDiagnosticFormForNewConversation,
} from "../core/diagnostic-prefill.js";

function baseState(overrides = {}) {
  return {
    entities: {
      contact: { name: null, company: null, email: null, phone: null },
      case: {
        needs: [], tools: [], currentProcess: null, frequency: null,
        users: null, volume: { files: null, records: null, sources: null, other: null },
        objective: null, timeframe: null, businessArea: null,
      },
    },
    understanding: {
      conversationalState: {
        version: 2,
        knownFacts: { tools: [], healthyTools: [] },
        correctedFacts: [], openQuestions: [], currentGoal: null,
        activeTopic: null, suspendedTopic: null, informationSufficiency: false,
        conversationProgress: 0, userLatestIntent: null,
      },
    },
    ...overrides,
  };
}

function withConversation(state, facts = {}) {
  state.understanding.conversationalState = {
    ...state.understanding.conversationalState,
    knownFacts: { tools: [], healthyTools: [], ...facts },
    currentGoal: "understand_and_improve_process",
    activeTopic: "visitor_case",
    conversationProgress: 3,
  };
  return state;
}

function fakeDocument() {
  const elements = new Map();
  const add = (id, extra = {}) => {
    const value = { id, value: "", checked: false, options: [], ...extra };
    elements.set(id, value);
    return value;
  };

  add("diagnosticForm");
  for (const id of ["name", "company", "email", "phone", "currentProcess", "objective", "additional"]) add(id);
  add("users", { options: ["", "1 persona", "2-5 personas", "6-10 personas", "Más de 10 personas", "No lo sé"].map(value => ({ value })) });
  add("start", { options: ["", "Lo antes posible", "Durante este mes", "En los próximos tres meses", "Solo estoy informándome"].map(value => ({ value })) });
  const privacy = add("privacy", { checked: false });

  const checkboxes = [
    "Informes y cuadros de mando", "Procesos manuales", "Archivos Excel",
    "Ventas y clientes", "Cobros y facturación", "Otro",
  ].map((value, index) => add(`check-${index}`, { value, checked: false }));

  return {
    privacy,
    elements,
    checkboxes,
    getElementById(id) { return elements.get(id) ?? null; },
    querySelectorAll(selector) {
      return selector === 'input[name="que_quiere_mejorar"]' ? checkboxes : [];
    },
  };
}

test("H3.23 monthly Excel + Power BI reporting prefills only supported diagnostic facts", () => {
  const state = withConversation(baseState(), {
    tools: ["Excel", "Power BI"], frequency: "monthly", slow: true,
  });
  state.entities.case.needs = ["reporting"];
  state.entities.case.tools = ["excel", "power-bi"];
  state.entities.case.frequency = "monthly";

  const fields = buildDiagnosticPrefillFromState(state);
  assert.deepEqual(fields.needs, [DIAGNOSTIC_NEED.REPORTING, DIAGNOSTIC_NEED.EXCEL_FILES]);
  assert.match(fields.currentProcess, /Excel y Power BI/);
  assert.match(fields.currentProcess, /mensual/);
  assert.match(fields.objective, /Reducir el tiempo de preparación de los informes/);
  assert.match(fields.additionalInfo, /Herramientas: Excel y Power BI/);
  assert.match(fields.additionalInfo, /Frecuencia: mensual/);
});

test("H3.23 manual weekly Excel/CSV case marks manual process and Excel files", () => {
  const state = withConversation(baseState(), {
    tools: ["Excel", "CSV"], frequency: "weekly", operation: "consolidate",
    repetitive: true, sources: { count: 4, kind: "Excel" }, errors: true,
    duration: { value: 5, unit: "horas" },
  });
  state.entities.case.tools = ["excel"];
  state.entities.case.currentProcess = "manual";
  state.entities.case.frequency = "weekly";
  state.entities.case.volume.files = 4;

  const fields = buildDiagnosticPrefillFromState(state);
  assert.deepEqual(fields.needs, [DIAGNOSTIC_NEED.MANUAL_PROCESS, DIAGNOSTIC_NEED.EXCEL_FILES]);
  assert.match(fields.currentProcess, /consolidan manualmente/);
  assert.match(fields.additionalInfo, /4 Excel/);
  assert.match(fields.additionalInfo, /5 horas/);
  assert.match(fields.objective, /reducir los errores|reducir el trabajo manual/i);
});

test("H3.23 explicit identity and contact details can be prefilled", () => {
  const state = baseState();
  state.entities.contact = {
    name: "Ana", company: "Empresa Demo", email: "ana@example.com", phone: "612345678",
  };
  const fields = buildDiagnosticPrefillFromState(state);
  assert.equal(fields.name, "Ana");
  assert.equal(fields.company, "Empresa Demo");
  assert.equal(fields.email, "ana@example.com");
  assert.equal(fields.phone, "612345678");
});

test("H3.23 insufficient case data does not invent diagnostic needs", () => {
  const fields = buildDiagnosticPrefillFromState(baseState());
  assert.deepEqual(fields.needs, []);
  assert.equal(fields.currentProcess, null);
  assert.equal(fields.objective, null);
});

test("H3.23 corrected V2 tools override stale legacy entity tools", () => {
  const state = withConversation(baseState(), { tools: ["Access"], healthyTools: [] });
  state.entities.case.tools = ["excel", "access"];
  const fields = buildDiagnosticPrefillFromState(state);
  assert.ok(!fields.needs.includes(DIAGNOSTIC_NEED.EXCEL_FILES));
  assert.match(fields.currentProcess, /Access/);
  assert.doesNotMatch(fields.currentProcess, /Excel/);
});

test("H3.23 manual diagnostic visit does not apply prefill", () => {
  const doc = fakeDocument();
  const result = applyDiagnosticPrefillToForm({
    documentRef: doc,
    fields: { name: "Ana", needs: [DIAGNOSTIC_NEED.REPORTING] },
    allowPrefill: false,
  });
  assert.equal(result.applied, false);
  assert.equal(doc.getElementById("name").value, "");
  assert.equal(doc.checkboxes.some(item => item.checked), false);
});

test("H3.23 arrival prefill is conservative, idempotent and never touches privacy", () => {
  const doc = fakeDocument();
  doc.getElementById("company").value = "Escrito por el usuario";
  const fields = {
    name: "Ana", company: "Empresa Demo", email: null, phone: null,
    needs: [DIAGNOSTIC_NEED.REPORTING, DIAGNOSTIC_NEED.EXCEL_FILES],
    currentProcess: "Se trabaja con Excel.", users: 4, timeframe: "urgent",
    objective: "Reducir el tiempo de preparación.", additionalInfo: "Frecuencia: mensual.",
  };

  const first = applyDiagnosticPrefillToForm({ documentRef: doc, fields, allowPrefill: true });
  assert.equal(first.applied, true);
  assert.equal(doc.getElementById("name").value, "Ana");
  assert.equal(doc.getElementById("company").value, "Escrito por el usuario");
  assert.equal(doc.getElementById("users").value, "2-5 personas");
  assert.equal(doc.getElementById("start").value, "Lo antes posible");
  assert.equal(doc.checkboxes.find(item => item.value === "Informes y cuadros de mando").checked, true);
  assert.equal(doc.checkboxes.find(item => item.value === "Archivos Excel").checked, true);
  assert.equal(doc.privacy.checked, false);

  const second = applyDiagnosticPrefillToForm({ documentRef: doc, fields, allowPrefill: true });
  assert.equal(second.applied, true);
  assert.equal(doc.getElementById("company").value, "Escrito por el usuario");
  assert.equal(doc.privacy.checked, false);
});

test("CONV-G1 guided 'Otro proceso' maps to the existing diagnostic checkbox", () => {
  const doc = fakeDocument();
  const fields = {
    name: null,
    company: null,
    email: null,
    phone: null,
    needs: [DIAGNOSTIC_NEED.OTHER],
    currentProcess: null,
    users: null,
    timeframe: null,
    objective: null,
    additionalInfo: null,
  };

  const result = applyDiagnosticPrefillToForm({ documentRef: doc, fields, allowPrefill: true });
  assert.equal(result.applied, true);
  assert.equal(doc.checkboxes.find(item => item.value === "Otro").checked, true);
  assert.equal(doc.privacy.checked, false);
});


test("CONV-G1.4.1 reset clears a previously prefilled diagnostic before a direct diagnostic", () => {
  const doc = fakeDocument();
  const previousFields = {
    name: "Ana",
    company: "Empresa anterior",
    email: "ana@example.com",
    phone: "612345678",
    needs: [DIAGNOSTIC_NEED.REPORTING, DIAGNOSTIC_NEED.EXCEL_FILES],
    currentProcess: "Proceso anterior con Excel.",
    users: 4,
    timeframe: "urgent",
    objective: "Ahorrar tiempo.",
    additionalInfo: "Datos de la conversación anterior.",
  };

  applyDiagnosticPrefillToForm({
    documentRef: doc,
    fields: previousFields,
    allowPrefill: true,
  });
  doc.privacy.checked = true;

  const reset = resetDiagnosticFormForNewConversation({ documentRef: doc });
  assert.equal(reset.reset, true);

  for (const id of ["name", "company", "email", "phone", "currentProcess", "objective", "additional", "users", "start"]) {
    assert.equal(doc.getElementById(id).value, "", id);
  }
  assert.equal(doc.checkboxes.some((item) => item.checked), false);
  assert.equal(doc.privacy.checked, false);

  const emptyFields = buildDiagnosticPrefillFromState(baseState());
  applyDiagnosticPrefillToForm({
    documentRef: doc,
    fields: emptyFields,
    allowPrefill: true,
  });

  assert.equal(doc.checkboxes.some((item) => item.checked), false);
  assert.equal(doc.getElementById("currentProcess").value, "");
  assert.equal(doc.getElementById("objective").value, "");
  assert.equal(doc.privacy.checked, false);
});

test("CONV-G1.4.1 reset helper is fail-soft outside diagnostico.html", () => {
  const result = resetDiagnosticFormForNewConversation({
    documentRef: {
      getElementById() { return null; },
      querySelectorAll() { return []; },
    },
  });
  assert.equal(result.reset, false);
  assert.deepEqual(result.changedFields, []);
});


test("CONV-G1.4.2 same-page diagnostic reapplies a new discovery immediately after reset", () => {
  const doc = fakeDocument();

  const oldFields = {
    name: null,
    company: null,
    email: null,
    phone: null,
    needs: [DIAGNOSTIC_NEED.REPORTING, DIAGNOSTIC_NEED.EXCEL_FILES],
    currentProcess: "Proceso anterior con Excel.",
    users: 4,
    timeframe: "urgent",
    objective: "Ahorrar tiempo.",
    additionalInfo: "Contexto anterior.",
  };

  applyDiagnosticPrefillToForm({
    documentRef: doc,
    fields: oldFields,
    allowPrefill: true,
  });

  resetDiagnosticFormForNewConversation({ documentRef: doc });

  const newFields = {
    name: null,
    company: null,
    email: null,
    phone: null,
    needs: [DIAGNOSTIC_NEED.MANUAL_PROCESS],
    currentProcess: "Proceso nuevo con Access y CSV.",
    users: 1,
    timeframe: "3 months",
    objective: "Reducir errores.",
    additionalInfo: "Herramientas: Access y CSV.",
  };

  const applied = applyDiagnosticPrefillToForm({
    documentRef: doc,
    fields: newFields,
    allowPrefill: true,
  });

  assert.equal(applied.applied, true);
  assert.equal(doc.getElementById("currentProcess").value, "Proceso nuevo con Access y CSV.");
  assert.equal(doc.getElementById("users").value, "1 persona");
  assert.equal(doc.getElementById("start").value, "En los próximos tres meses");
  assert.equal(doc.getElementById("objective").value, "Reducir errores.");
  assert.equal(doc.getElementById("additional").value, "Herramientas: Access y CSV.");
  assert.equal(doc.checkboxes.find(item => item.value === "Procesos manuales").checked, true);
  assert.equal(doc.checkboxes.find(item => item.value === "Informes y cuadros de mando").checked, false);
  assert.equal(doc.checkboxes.find(item => item.value === "Archivos Excel").checked, false);
  assert.equal(doc.privacy.checked, false);
});
