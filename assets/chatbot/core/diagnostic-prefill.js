/**
 * CONV-H3.23 — Chat → Diagnostic deterministic prefill.
 *
 * Rules:
 * - only structured, already-known conversation state is used;
 * - no LLM and no hidden inference from assistant text;
 * - consent is never touched;
 * - form values already entered by the visitor are never overwritten;
 * - manual visits to diagnostico.html do not trigger prefill.
 */

const DIAGNOSTIC_ACTION_TYPE = "start-diagnostic";

export const DIAGNOSTIC_NEED = Object.freeze({
  REPORTING: "reporting",
  MANUAL_PROCESS: "manual-process",
  EXCEL_FILES: "excel-files",
  SALES_CUSTOMERS: "sales-customers",
  COLLECTIONS_BILLING: "collections-billing",
  OTHER: "other",
});

const NEED_TO_FORM_VALUE = Object.freeze({
  [DIAGNOSTIC_NEED.REPORTING]: "Informes y cuadros de mando",
  [DIAGNOSTIC_NEED.MANUAL_PROCESS]: "Procesos manuales",
  [DIAGNOSTIC_NEED.EXCEL_FILES]: "Archivos Excel",
  [DIAGNOSTIC_NEED.SALES_CUSTOMERS]: "Ventas y clientes",
  [DIAGNOSTIC_NEED.COLLECTIONS_BILLING]: "Cobros y facturación",
  [DIAGNOSTIC_NEED.OTHER]: "Otro",
});

const TOOL_LABELS = Object.freeze({
  excel: "Excel",
  "power-bi": "Power BI",
  access: "Access",
  "power-query": "Power Query",
  python: "Python",
  sql: "SQL",
  pdf: "PDF",
  csv: "CSV",
  vba: "VBA",
  ia: "IA",
});

const FREQUENCY_LABELS = Object.freeze({
  daily: "diaria",
  weekly: "semanal",
  monthly: "mensual",
  quarterly: "trimestral",
  yearly: "anual",
});

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function naturalJoin(values) {
  const clean = unique(values);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} y ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} y ${clean.at(-1)}`;
}

function displayTool(value) {
  const text = safeString(value);
  if (!text) return "";
  return TOOL_LABELS[text.toLowerCase()] ?? text;
}

function resolvedTools(state) {
  const v2 = state?.understanding?.conversationalState;
  if (v2?.version === 2 && Array.isArray(v2?.knownFacts?.tools)) {
    return unique(v2.knownFacts.tools.map(displayTool));
  }

  const legacy = Array.isArray(state?.entities?.case?.tools)
    ? state.entities.case.tools
    : [];

  return unique(legacy.map(displayTool));
}

function resolvedFrequency(state) {
  const v2Frequency = safeString(
    state?.understanding?.conversationalState?.knownFacts?.frequency,
  );
  return v2Frequency || safeString(state?.entities?.case?.frequency) || null;
}

function hasExcel(state, tools) {
  if (tools.includes("Excel")) return true;
  const sources = state?.understanding?.conversationalState?.knownFacts?.sources;
  return sources?.kind === "Excel";
}

function explicitObjective(value) {
  const text = safeString(value);
  if (!text) return null;

  const tooGeneric = /^(?:ayuda|unos? datos|datos|informacion|información|mejorar|solucion|solución|esto|eso)$/i;
  return tooGeneric.test(text) ? null : text;
}

function buildObjective(state, needs) {
  const explicit = explicitObjective(state?.entities?.case?.objective);
  if (explicit) {
    const first = explicit.charAt(0).toUpperCase() + explicit.slice(1);
    return /[.!?]$/.test(first) ? first : `${first}.`;
  }

  const facts = state?.understanding?.conversationalState?.knownFacts ?? {};
  const clauses = [];

  if (facts.slow === true) {
    clauses.push(
      needs.includes(DIAGNOSTIC_NEED.REPORTING)
        ? "reducir el tiempo de preparación de los informes"
        : "reducir el tiempo dedicado al proceso",
    );
  }

  if (facts.errors === true) {
    clauses.push("reducir los errores del proceso");
  }

  if (state?.entities?.case?.currentProcess === "manual") {
    clauses.push("reducir el trabajo manual y repetitivo");
  } else if (facts.repetitive === true) {
    clauses.push("simplificar el trabajo repetitivo");
  }

  const clean = unique(clauses).slice(0, 2);
  if (clean.length === 0) return null;

  const sentence = naturalJoin(clean).replace(/ y reducir /g, " y ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function buildCurrentProcess(state, tools, frequency) {
  const caseEntities = state?.entities?.case ?? {};
  const facts = state?.understanding?.conversationalState?.knownFacts ?? {};
  const parts = [];

  if (
    caseEntities.currentProcess === "manual" &&
    facts.operation === "consolidate"
  ) {
    parts.push("Los datos o archivos se reúnen y consolidan manualmente.");
  } else if (caseEntities.currentProcess === "manual") {
    parts.push("Parte del proceso se realiza manualmente.");
  } else if (facts.operation === "consolidate") {
    parts.push("Los datos o archivos se reúnen y consolidan antes de utilizarlos.");
  }

  if (safeString(facts.source)) {
    parts.push(`Los datos vienen de ${facts.source}.`);
  }

  if (tools.length > 0) {
    parts.push(`Se trabaja con ${naturalJoin(tools)}.`);
  }

  if (frequency && FREQUENCY_LABELS[frequency]) {
    parts.push(`El proceso se repite con frecuencia ${FREQUENCY_LABELS[frequency]}.`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

function buildAdditionalInfo(state, tools, frequency) {
  const facts = state?.understanding?.conversationalState?.knownFacts ?? {};
  const volume = state?.entities?.case?.volume ?? {};
  const details = [];

  if (tools.length > 0) {
    details.push(`Herramientas: ${naturalJoin(tools)}`);
  }

  if (frequency && FREQUENCY_LABELS[frequency]) {
    details.push(`Frecuencia: ${FREQUENCY_LABELS[frequency]}`);
  }

  if (facts.sources?.count && facts.sources?.kind) {
    const kind = facts.sources.kind === "Excel"
      ? "Excel"
      : facts.sources.kind;
    details.push(`Orígenes/volumen mencionado: ${facts.sources.count} ${kind}`);
  } else if (Number.isInteger(volume.files) && volume.files > 0) {
    details.push(`Archivos mencionados: ${volume.files}`);
  } else if (Number.isInteger(volume.sources) && volume.sources > 0) {
    details.push(`Fuentes mencionadas: ${volume.sources}`);
  }

  if (facts.duration?.value && facts.duration?.unit) {
    details.push(`Tiempo dedicado: ${facts.duration.value} ${facts.duration.unit}`);
  }

  if (facts.errors === true) {
    details.push("Se han mencionado errores en el proceso");
  }

  return details.length > 0 ? `${details.join(". ")}.` : null;
}

function buildNeeds(state, tools) {
  const needs = [];
  const caseEntities = state?.entities?.case ?? {};
  const declaredNeeds = Array.isArray(caseEntities.needs)
    ? caseEntities.needs
    : [];
  const objective = safeString(caseEntities.objective).toLowerCase();
  const businessArea = safeString(caseEntities.businessArea).toLowerCase();

  if (declaredNeeds.includes("reporting")) {
    needs.push(DIAGNOSTIC_NEED.REPORTING);
  }

  if (caseEntities.currentProcess === "manual") {
    needs.push(DIAGNOSTIC_NEED.MANUAL_PROCESS);
  }

  if (hasExcel(state, tools)) {
    needs.push(DIAGNOSTIC_NEED.EXCEL_FILES);
  }

  if (businessArea === "ventas") {
    needs.push(DIAGNOSTIC_NEED.SALES_CUSTOMERS);
  }

  if (/\b(?:cobros?|facturaci[oó]n|facturas?|vencimientos?)\b/i.test(objective)) {
    needs.push(DIAGNOSTIC_NEED.COLLECTIONS_BILLING);
  }

  return unique(needs);
}

function buildTimeframe(state) {
  const timeframe = safeString(state?.entities?.case?.timeframe);
  if (!timeframe) return null;
  return timeframe;
}

export function isDiagnosticStartAction(action) {
  return action?.type === DIAGNOSTIC_ACTION_TYPE;
}

export function buildDiagnosticPrefillFromState(state) {
  const contact = state?.entities?.contact ?? {};
  const caseEntities = state?.entities?.case ?? {};
  const tools = resolvedTools(state);
  const frequency = resolvedFrequency(state);
  const needs = buildNeeds(state, tools);

  return Object.freeze({
    name: safeString(contact.name) || null,
    company: safeString(contact.company) || null,
    email: safeString(contact.email) || null,
    phone: safeString(contact.phone) || null,
    needs: Object.freeze([...needs]),
    currentProcess: buildCurrentProcess(state, tools, frequency),
    users: Number.isInteger(caseEntities.users) ? caseEntities.users : null,
    timeframe: buildTimeframe(state),
    objective: buildObjective(state, needs),
    additionalInfo: buildAdditionalInfo(state, tools, frequency),
  });
}

function setIfEmpty(element, value) {
  if (!element || !safeString(value) || safeString(element.value)) {
    return false;
  }
  element.value = value;
  return true;
}

function selectIfEmpty(element, value) {
  if (!element || !safeString(value) || safeString(element.value)) {
    return false;
  }

  const values = Array.from(element.options ?? []).map(option => option.value);
  if (!values.includes(value)) return false;
  element.value = value;
  return true;
}

function userCountToOption(users) {
  if (!Number.isInteger(users) || users < 1) return null;
  if (users === 1) return "1 persona";
  if (users <= 5) return "2-5 personas";
  if (users <= 10) return "6-10 personas";
  return "Más de 10 personas";
}

function timeframeToOption(timeframe) {
  const value = safeString(timeframe).toLowerCase();
  if (!value) return null;
  if (value === "urgent") return "Lo antes posible";

  const months = value.match(/^(\d+)\s+months?$/);
  if (months && Number(months[1]) <= 3) return "En los próximos tres meses";

  const weeks = value.match(/^(\d+)\s+weeks?$/);
  if (weeks && Number(weeks[1]) <= 12) return "En los próximos tres meses";

  return null;
}

/**
 * CONV-G1.4.1 — Limpia explícitamente el formulario de diagnóstico
 * cuando el visitante inicia una nueva conversación estando ya en
 * diagnostico.html.
 *
 * Se mantiene separado de applyDiagnosticPrefillToForm(): el prefill
 * normal nunca debe sobrescribir lo escrito por el visitante, mientras
 * que un reset explícito sí debe garantizar un diagnóstico nuevo y limpio.
 */
export function resetDiagnosticFormForNewConversation({
  documentRef = globalThis.document,
} = {}) {
  if (!documentRef) {
    return Object.freeze({ reset: false, changedFields: Object.freeze([]) });
  }

  const form = documentRef.getElementById?.("diagnosticForm");
  if (!form) {
    return Object.freeze({ reset: false, changedFields: Object.freeze([]) });
  }

  const changed = [];

  for (const id of [
    "name",
    "company",
    "email",
    "phone",
    "currentProcess",
    "objective",
    "additional",
  ]) {
    const element = documentRef.getElementById?.(id);
    if (element && element.value !== "") {
      element.value = "";
      changed.push(id);
    }
  }

  for (const id of ["users", "start"]) {
    const element = documentRef.getElementById?.(id);
    if (element && element.value !== "") {
      element.value = "";
      changed.push(id);
    }
  }

  const checkboxes = Array.from(
    documentRef.querySelectorAll?.('input[name="que_quiere_mejorar"]') ?? [],
  );

  for (const checkbox of checkboxes) {
    if (checkbox.checked === true) {
      checkbox.checked = false;
      changed.push(`need:${checkbox.value}`);
    }
  }

  const privacy = documentRef.getElementById?.("privacy");
  if (privacy?.checked === true) {
    privacy.checked = false;
    changed.push("privacy");
  }

  return Object.freeze({
    reset: true,
    changedFields: Object.freeze(changed),
  });
}

/**
 * Applies an already-prepared payload to diagnostico.html.
 * The caller must explicitly prove this page was reached through a chatbot
 * diagnostic action by passing allowPrefill=true.
 */
export function applyDiagnosticPrefillToForm({
  documentRef = globalThis.document,
  fields,
  allowPrefill = false,
} = {}) {
  if (!allowPrefill || !documentRef || !fields) {
    return Object.freeze({ applied: false, changedFields: Object.freeze([]) });
  }

  const form = documentRef.getElementById?.("diagnosticForm");
  if (!form) {
    return Object.freeze({ applied: false, changedFields: Object.freeze([]) });
  }

  const changed = [];

  const simpleFields = [
    ["name", fields.name],
    ["company", fields.company],
    ["email", fields.email],
    ["phone", fields.phone],
    ["currentProcess", fields.currentProcess],
    ["objective", fields.objective],
    ["additional", fields.additionalInfo],
  ];

  for (const [id, value] of simpleFields) {
    if (setIfEmpty(documentRef.getElementById?.(id), value)) {
      changed.push(id);
    }
  }

  const usersValue = userCountToOption(fields.users);
  if (selectIfEmpty(documentRef.getElementById?.("users"), usersValue)) {
    changed.push("users");
  }

  const timeframeValue = timeframeToOption(fields.timeframe);
  if (selectIfEmpty(documentRef.getElementById?.("start"), timeframeValue)) {
    changed.push("start");
  }

  const wanted = new Set(
    (Array.isArray(fields.needs) ? fields.needs : [])
      .map(need => NEED_TO_FORM_VALUE[need])
      .filter(Boolean),
  );

  if (wanted.size > 0) {
    const checkboxes = Array.from(
      documentRef.querySelectorAll?.('input[name="que_quiere_mejorar"]') ?? [],
    );

    for (const checkbox of checkboxes) {
      if (wanted.has(checkbox.value) && checkbox.checked !== true) {
        checkbox.checked = true;
        changed.push(`need:${checkbox.value}`);
      }
    }
  }

  // Privacy/consent is deliberately not queried or changed here.
  return Object.freeze({
    applied: true,
    changedFields: Object.freeze(changed),
  });
}
