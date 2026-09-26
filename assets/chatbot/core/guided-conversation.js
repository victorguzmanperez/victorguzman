/**
 * CONV-G1 — Guided Conversation Engine
 *
 * Deterministic click-only conversation graph. It intentionally keeps the
 * legacy free-text engine intact behind a feature flag so the change is easy
 * to test and roll back.
 */

import { guidedKnowledge } from "../data/guided-knowledge.js";

const projectKnowledge = guidedKnowledge.projects;
const serviceKnowledge = guidedKnowledge.services;
const solutionKnowledge = guidedKnowledge.solutions;
const technologyKnowledge = Object.entries(guidedKnowledge.technologies).map(
  ([id, value]) => ({ id, ...value }),
);
const experienceKnowledge = [
  { id: "experience-accenture-2004", shortDescription: guidedKnowledge.firstExperience },
  { id: "experience-banco-sabadell-2023-current", shortDescription: guidedKnowledge.currentExperience },
];
const educationKnowledge = guidedKnowledge.education;
const certificationKnowledge = guidedKnowledge.certification;
const profileKnowledge = [
  { id: "profile-victor", shortDescription: guidedKnowledge.profile },
];
const assistantKnowledge = guidedKnowledge.assistant;
const catalog = guidedKnowledge.catalog;


export const GUIDED_SCHEMA_VERSION = 1;
export const GUIDED_STORAGE_KEY = "vg_portfolio_guided_conversation_v1";
export const GUIDED_HOME_NODE_ID = "home";

export const GUIDED_NODE_MODE = Object.freeze({
  SINGLE: "single",
  MULTI: "multi",
  INFO: "info",
});

export const GUIDED_ACTION_KIND = Object.freeze({
  NAVIGATE: "navigate",
  EXTERNAL: "external",
  DIAGNOSTIC: "diagnostic",
  CONTACT: "contact",
  CALENDLY: "calendly",
  SUPPORT: "support",
  CLOSE: "close",
});

const PROCESS_AREA = Object.freeze({
  REPORTING: "reporting",
  MANUAL: "manual-process",
  EXCEL: "excel-files",
  SALES: "sales-customers",
  BILLING: "collections-billing",
  OTHER: "other",
});

const LABELS = Object.freeze({
  processAreas: Object.freeze({
    [PROCESS_AREA.REPORTING]: "Informes y cuadros de mando",
    [PROCESS_AREA.MANUAL]: "Procesos manuales",
    [PROCESS_AREA.EXCEL]: "Archivos Excel",
    [PROCESS_AREA.SALES]: "Ventas y clientes",
    [PROCESS_AREA.BILLING]: "Cobros y facturación",
    [PROCESS_AREA.OTHER]: "Otro proceso",
  }),
  currentWork: Object.freeze({
    join_files: "Descargo y junto archivos manualmente",
    copy_paste: "Copio y pego datos entre archivos",
    clean_transform: "Limpio o transformo datos a mano",
    update_reports: "Actualizo informes manualmente",
    review_errors: "Reviso errores o campos vacíos",
    disconnected_tools: "Uso herramientas que no están conectadas",
    mostly_manual: "Prácticamente todo el proceso es manual",
  }),
  frequency: Object.freeze({
    daily: "Cada día",
    several_week: "Varias veces por semana",
    weekly: "Semanalmente",
    monthly: "Mensualmente",
    occasional: "Puntualmente",
  }),
  users: Object.freeze({
    one: "Solo yo",
    two_five: "2–5 personas",
    six_ten: "6–10 personas",
    more_ten: "Más de 10 personas",
    unknown: "No lo sé",
  }),
  tools: Object.freeze({
    excel: "Excel",
    "power-bi": "Power BI",
    access: "Access",
    csv: "CSV",
    email: "Email",
    "erp-crm": "ERP / CRM",
    sql: "Base de datos / SQL",
    other: "Otras herramientas",
  }),
  painPoints: Object.freeze({
    time: "Me consume demasiado tiempo",
    errors: "Se producen errores",
    repetitive: "Hay demasiado trabajo repetitivo",
    scattered: "Los datos están dispersos",
    outdated: "La información llega tarde o desactualizada",
    dependency: "Depende demasiado de una persona",
    visibility: "Cuesta tener una visión clara del resultado",
  }),
  goals: Object.freeze({
    save_time: "Ahorrar tiempo",
    reduce_errors: "Reducir errores",
    automate: "Automatizar tareas",
    centralize: "Centralizar datos",
    improve_reporting: "Mejorar informes",
    fresh_data: "Tener información más actualizada",
  }),
  timeframe: Object.freeze({
    asap: "Lo antes posible",
    weeks: "En las próximas semanas",
    one_three_months: "En 1–3 meses",
    exploring: "Solo estoy explorando opciones",
  }),
});

const CURRENT_WORK_SUMMARY = Object.freeze({
  join_files: "reúnes archivos manualmente",
  copy_paste: "copias y pegas datos entre archivos",
  clean_transform: "limpias o transformas datos a mano",
  update_reports: "actualizas informes manualmente",
  review_errors: "revisas errores o campos vacíos",
  disconnected_tools: "trabajas con herramientas que no están conectadas",
  mostly_manual: "prácticamente todo el proceso es manual",
});

const PROJECT_URLS = Object.freeze({
  "project-business-cost-intelligence": "projects/costes.html",
  "project-auditoria-digital-cv": "projects/auditoria-digital-cv.html",
  "project-investment-dashboard-ai": "projects/investment.html",
  "project-digital-competency-evaluation": "projects/modelo-evaluacion-competencias.html",
});

const CONTACT_PAGE = "index.html#contacto";
const DIAGNOSTIC_PAGE = "diagnostico.html#diagnosticForm";
const SUPPORT_PAGE = "apoya.html";
const CALENDLY_URL = "https://calendly.com/victorguzman-data-pro/reunion-inicial-proyecto";

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function naturalJoin(values) {
  const clean = unique(values.map(safeString).filter(Boolean));
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} y ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} y ${clean.at(-1)}`;
}

function labelList(group, values) {
  const dictionary = LABELS[group] ?? {};
  return (values ?? []).map((value) => dictionary[value] ?? value).filter(Boolean);
}

function fact(item, key) {
  if (item && Object.prototype.hasOwnProperty.call(item, key)) {
    return item[key];
  }
  return item?.facts?.find?.((entry) => entry?.key === key)?.value ?? null;
}

function itemById(items, id) {
  return items.find((item) => item.id === id) ?? null;
}

function makeOption(id, label, next = null, extra = {}) {
  return Object.freeze({ id, label, next, ...extra });
}

function node(id, mode, message, options = [], extra = {}) {
  return Object.freeze({ id, mode, message, options: Object.freeze(options), ...extra });
}

function currentProfessionalTechnologies() {
  return technologyKnowledge.filter((technology) =>
    technology.current === true,
  );
}

function profileSummary() {
  const profile = itemById(profileKnowledge, "profile-victor") ?? profileKnowledge[0];
  return profile?.shortDescription ??
    "Víctor combina experiencia en tecnología, datos, Business Intelligence, automatización e inteligencia artificial aplicada.";
}

function currentExperienceSummary() {
  return "Ahora mismo, Víctor trabaja principalmente con datos, Business Intelligence y automatización dentro del área de Control de Mercados Financieros. También está incorporando progresivamente inteligencia artificial y herramientas del ecosistema Microsoft a este trabajo.";
}

function trajectorySummary() {
  return "Víctor empezó su carrera en 2004 desarrollando sistemas bancarios en COBOL. Con el tiempo fue pasando a análisis funcional y a distintos proyectos del sector financiero, hasta centrarse hoy en datos, Business Intelligence, automatización e IA aplicada.";
}

function educationSummary() {
  return "En los últimos años ha reforzado especialmente su formación en datos, Power BI, Python, SQL e inteligencia artificial, además de formación relacionada con mercados financieros. Entre otras, ha cursado formación en IA y Big Data, Power BI, SQL y Python.";
}

function certificationSummary() {
  return "Ahora está preparando la certificación Microsoft PL-300. Ha completado formación específica para prepararla, pero todavía no ha obtenido la certificación oficial.";
}

function technologySummary(id) {
  const item = itemById(technologyKnowledge, id);
  return item?.shortDescription ?? "No hay información pública suficiente para ampliar esta tecnología.";
}

function projectSummary(id) {
  const summaries = {
    "project-business-cost-intelligence": "Este proyecto automatiza la extracción y transformación de información económica contenida en documentos y la conecta con Power BI para facilitar el análisis de costes, la trazabilidad y la visibilidad del dato.",
    "project-auditoria-digital-cv": "Este proyecto recopila automáticamente información pública de webs, la evalúa mediante indicadores y reglas de scoring y presenta el resultado con análisis geográfico y visualizaciones para estudiar la madurez digital.",
    "project-investment-dashboard-ai": "Este proyecto, todavía en desarrollo, reúne y analiza información sobre inversión, dividendos, riesgo, valoración, noticias y señales cuantitativas mediante Python, Power BI e IA. Su finalidad es analítica e informativa, no de asesoramiento financiero.",
    "project-digital-competency-evaluation": "Este proyecto convierte una evaluación compleja en un modelo estructurado en Excel y Power Query, con jerarquías, reglas, ponderaciones, scoring, pruebas, validaciones y documentación.",
  };
  return summaries[id] ?? "Este es uno de los proyectos del portfolio de Víctor.";
}

function projectProblemSummary(id) {
  const summaries = {
    "project-business-cost-intelligence": "El punto de partida es un proceso con información económica repartida en documentos y tareas manuales de extracción, transformación y consolidación. El proyecto busca reducir ese trabajo repetitivo y dejar un flujo más trazable y reutilizable.",
    "project-auditoria-digital-cv": "El reto es recopilar información pública de muchas webs, aplicar los mismos criterios de evaluación y convertir el resultado en un scoring comparable y trazable.",
    "project-investment-dashboard-ai": "El reto es reunir muchas fuentes y señales financieras distintas y analizarlas con un criterio consistente. El proyecto organiza esa información para facilitar seguimiento y comparación, sin convertirla en una recomendación personalizada.",
    "project-digital-competency-evaluation": "El problema es trasladar criterios, jerarquías y pesos complejos a un modelo que pueda calcularse, probarse y explicarse sin depender de fórmulas frágiles o resultados difíciles de rastrear.",
  };
  return summaries[id] ?? "El proyecto busca convertir un proceso complejo en un resultado más estructurado, verificable y trazable.";
}

function projectHowSummary(id) {
  const summaries = {
    "project-business-cost-intelligence": "Se plantea como un flujo en varias etapas: extraer la información de los documentos, transformarla y validarla, consolidarla y llevar el resultado a Power BI para su análisis. Python, Power Query y Power BI son piezas centrales del enfoque.",
    "project-auditoria-digital-cv": "El flujo automatiza la recopilación de datos públicos, aplica reglas e indicadores para obtener un scoring y después presenta los resultados mediante análisis geográfico y visualización. Python y Power BI forman parte del enfoque.",
    "project-investment-dashboard-ai": "La arquitectura separa la recopilación de datos, los cálculos de riesgo y valoración, el análisis de señales y la presentación final. Python concentra buena parte del procesamiento y Power BI sirve para explorar los resultados; la IA se utiliza como apoyo analítico.",
    "project-digital-competency-evaluation": "El modelo separa datos, reglas, cálculos y resultados. Excel y Power Query se utilizan para construir una estructura jerárquica con ponderaciones, controles y casos de prueba, de modo que cada resultado pueda revisarse y trazarse.",
  };
  return summaries[id] ?? "El enfoque separa datos, reglas y resultados para que el proceso sea más fácil de revisar, validar y mantener.";
}

function serviceSummary(id) {
  const summaries = {
    "service-business-intelligence-dashboards": "Si necesitas convertir datos dispersos en información útil para decidir, Víctor puede ayudarte a construir cuadros de mando con KPIs claros, un modelo de datos sólido y una visualización orientada a negocio.",
    "service-excel-business-models": "Si tu proceso depende de Excel, el trabajo puede ir más allá de una hoja con fórmulas: se pueden construir modelos estructurados, reglas de cálculo, automatizaciones, controles, pruebas y documentación para que la herramienta sea más fiable y mantenible.",
    "service-data-process-automation": "Si tienes tareas manuales y repetitivas, Víctor puede ayudarte a ordenar el proceso y automatizar pasos como la preparación, transformación, validación o integración de datos y archivos.",
    "service-ai-process-analysis": "Si estás valorando incorporar IA a un proceso, el enfoque es empezar por el problema y los datos: identificar dónde puede aportar valor para analizar, extraer o clasificar información, documentar tareas o apoyar decisiones, sin forzar la IA donde no hace falta.",
  };
  return summaries[id] ?? "Este servicio está pensado para convertir un problema de datos o proceso en una solución más clara, estructurada y mantenible.";
}

function solutionSummary(id) {
  const summaries = {
    "solution-data-consolidation-automation": "Si la información llega desde varios archivos o fuentes y hay que unirla, transformarla o revisarla a mano, este enfoque puede ayudarte a centralizar el flujo y reducir trabajo repetitivo y errores.",
    "solution-reporting-dashboard-automation": "Si preparar o actualizar informes obliga a repetir siempre los mismos pasos, se puede estructurar la preparación de datos para que el reporting y los dashboards necesiten menos trabajo manual.",
    "solution-evaluation-scoring-model": "Si trabajas con criterios, jerarquías, pesos o reglas que deben convertirse en una puntuación, la idea es construir un modelo que pueda probarse, revisarse y explicarse con claridad.",
    "solution-document-data-extraction": "Si parte de la información está dentro de documentos y alguien tiene que transcribirla o prepararla antes de analizarla, se puede extraer y estructurar de forma consistente para reducir ese trabajo manual.",
    "solution-data-quality-traceability": "Si cuesta confiar en los resultados o explicar de dónde sale cada dato, se pueden añadir validaciones y trazabilidad para detectar inconsistencias y revisar mejor los cálculos.",
    "solution-web-audit-scoring-automation": "Si hay que revisar muchas webs con los mismos criterios, se puede automatizar la recopilación, aplicar las mismas reglas de scoring y presentar los resultados de forma comparable.",
    "solution-financial-analysis-monitoring": "Si quieres reunir y seguir datos financieros de forma estructurada, se pueden organizar para facilitar la comparación, el control de riesgo y el análisis mediante modelos y cuadros de mando. La información es analítica, no asesoramiento financiero.",
    "solution-ai-opportunity-assessment": "Si estás pensando en usar IA, primero conviene revisar el proceso, el problema, los datos disponibles y el resultado que esperas. Así es más fácil detectar dónde puede aportar valor y dónde no hace falta.",
  };
  return summaries[id] ?? "Esta opción busca estructurar el problema y reducir trabajo innecesario sin perder control ni trazabilidad.";
}

function articleOptions(topic, limit = 5) {
  const seen = new Set();

  return (catalog?.articles ?? [])
    .filter((article) => Array.isArray(article.topics) && article.topics.includes(topic))
    .filter((article) => {
      const key = safeString(article.title).toLocaleLowerCase("es") || safeString(article.url) || safeString(article.id);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((article) => makeOption(
      `article:${article.id}`,
      article.title,
      null,
      { action: GUIDED_ACTION_KIND.EXTERNAL, target: article.url },
    ));
}

function bookOptions() {
  return (catalog?.books ?? []).map((book) => makeOption(
    `book:${book.id}`,
    book.title,
    null,
    {
      action: GUIDED_ACTION_KIND.EXTERNAL,
      target: book.url,
      note: book.affiliate ? "Enlace de afiliado" : null,
    },
  ));
}

function resourceNode(id, body, topic) {
  return node(
    id,
    GUIDED_NODE_MODE.INFO,
    body,
    articleOptions(topic),
    { section: "resources" },
  );
}

function buildStaticGraph() {
  const graph = {};

  graph.home = node(
    "home",
    GUIDED_NODE_MODE.SINGLE,
    "Hola 👋. Soy el asistente de Víctor.\n\nPuedo ayudarte a conocer su experiencia y proyectos, explorar servicios y recursos, identificar un proceso que quieras mejorar o ponerte en contacto con él.\n\nNo necesitas escribir: elige una opción y te iré guiando. Puedes volver atrás, regresar al inicio o terminar cuando quieras.",
    [
      makeOption("home-process", "Mejorar un proceso", "process.areas"),
      makeOption("home-victor", "Conocer a Víctor", "victor.menu"),
      makeOption("home-projects", "Ver proyectos", "projects.menu"),
      makeOption("home-services", "Servicios y soluciones", "services.menu"),
      makeOption("home-resources", "Artículos y recursos", "resources.menu"),
      makeOption("home-assistant", "Sobre este asistente", "assistant.menu"),
      makeOption("home-contact", "Contactar con Víctor", "contact.menu"),
      makeOption("home-diagnostic", "Completar diagnóstico", null, {
        action: GUIDED_ACTION_KIND.DIAGNOSTIC,
        target: DIAGNOSTIC_PAGE,
      }),
    ],
    { title: "¿En qué te puedo ayudar?", section: "home" },
  );

  graph["assistant.menu"] = node(
    "assistant.menu",
    GUIDED_NODE_MODE.SINGLE,
    "Si tienes curiosidad por saber cómo funciona este asistente, aquí puedes conocerlo un poco mejor.",
    [
      makeOption("assistant-how", "¿Cómo funciona?", "assistant.how"),
      makeOption("assistant-llm", "¿Usa IA o un LLM?", "assistant.llm"),
      makeOption("assistant-can", "¿Qué puede hacer?", "assistant.capabilities"),
      makeOption("assistant-agent", "¿Es un agente de IA?", "assistant.agent"),
    ],
    { title: "Sobre este asistente", section: "assistant" },
  );

  graph["assistant.how"] = node(
    "assistant.how",
    GUIDED_NODE_MODE.INFO,
    assistantKnowledge.about,
    [
      makeOption("assistant-how-capabilities", "¿Qué puede hacer?", "assistant.capabilities"),
      makeOption("assistant-how-llm", "¿Usa IA?", "assistant.llm"),
    ],
    { section: "assistant" },
  );

  graph["assistant.llm"] = node(
    "assistant.llm",
    GUIDED_NODE_MODE.INFO,
    assistantKnowledge.llm,
    [
      makeOption("assistant-llm-how", "¿Cómo funciona?", "assistant.how"),
      makeOption("assistant-llm-agent", "¿Es un agente de IA?", "assistant.agent"),
    ],
    { section: "assistant" },
  );

  graph["assistant.capabilities"] = node(
    "assistant.capabilities",
    GUIDED_NODE_MODE.INFO,
    assistantKnowledge.capabilities,
    [
      makeOption("assistant-cap-process", "Explorar mi caso", "process.areas"),
      makeOption("assistant-cap-diagnostic", "Completar diagnóstico", null, {
        action: GUIDED_ACTION_KIND.DIAGNOSTIC,
        target: DIAGNOSTIC_PAGE,
      }),
    ],
    { section: "assistant" },
  );

  graph["assistant.agent"] = node(
    "assistant.agent",
    GUIDED_NODE_MODE.INFO,
    assistantKnowledge.agent,
    [
      makeOption("assistant-agent-how", "¿Cómo funciona?", "assistant.how"),
      makeOption("assistant-agent-ai", "Experiencia con IA", "victor.tech.ai"),
    ],
    { section: "assistant" },
  );

  graph["process.areas"] = node(
    "process.areas",
    GUIDED_NODE_MODE.MULTI,
    "Vamos a situar el caso. ¿Qué te gustaría mejorar? Puedes marcar una o varias opciones.",
    Object.entries(LABELS.processAreas).map(([value, label]) => makeOption(`area:${value}`, label, null, { value })),
    { selectionKey: "processAreas", next: "process.current", section: "process", minSelections: 1 },
  );

  graph["process.current"] = node(
    "process.current",
    GUIDED_NODE_MODE.MULTI,
    "¿Cómo se hace hoy ese trabajo? Marca todo lo que encaje; puedes elegir varias opciones.",
    Object.entries(LABELS.currentWork).map(([value, label]) => makeOption(`current:${value}`, label, null, { value })),
    { selectionKey: "currentWork", next: "process.frequency", section: "process", minSelections: 1 },
  );

  graph["process.frequency"] = node(
    "process.frequency",
    GUIDED_NODE_MODE.SINGLE,
    "Bien. ¿Con qué frecuencia se repite este proceso?",
    Object.entries(LABELS.frequency).map(([value, label]) => makeOption(`frequency:${value}`, label, "process.users", { value, selectionKey: "frequency" })),
    { section: "process" },
  );

  graph["process.users"] = node(
    "process.users",
    GUIDED_NODE_MODE.SINGLE,
    "¿Cuántas personas participan en este proceso o utilizan su resultado?",
    Object.entries(LABELS.users).map(([value, label]) => makeOption(`users:${value}`, label, "process.tools", { value, selectionKey: "users" })),
    { section: "process" },
  );

  graph["process.tools"] = node(
    "process.tools",
    GUIDED_NODE_MODE.MULTI,
    "¿Qué herramientas intervienen en el proceso? Puedes marcar varias.",
    Object.entries(LABELS.tools).map(([value, label]) => makeOption(`tool:${value}`, label, null, { value })),
    { selectionKey: "tools", next: "process.pain", section: "process", minSelections: 1 },
  );

  graph["process.pain"] = node(
    "process.pain",
    GUIDED_NODE_MODE.MULTI,
    "¿Qué te está dando más problemas? Puedes elegir más de una opción.",
    Object.entries(LABELS.painPoints).map(([value, label]) => makeOption(`pain:${value}`, label, null, { value })),
    { selectionKey: "painPoints", next: "process.goals", section: "process", minSelections: 1 },
  );

  graph["process.goals"] = node(
    "process.goals",
    GUIDED_NODE_MODE.MULTI,
    "¿Qué te gustaría conseguir? Puedes marcar varias opciones.",
    Object.entries(LABELS.goals).map(([value, label]) => makeOption(`goal:${value}`, label, null, { value })),
    { selectionKey: "goals", next: "process.timeframe", section: "process", minSelections: 1 },
  );

  graph["process.timeframe"] = node(
    "process.timeframe",
    GUIDED_NODE_MODE.SINGLE,
    "Y una última pregunta para situar el caso: ¿cuándo te gustaría empezar?",
    Object.entries(LABELS.timeframe).map(([value, label]) => makeOption(`timeframe:${value}`, label, "process.summary", { value, selectionKey: "timeframe" })),
    { section: "process" },
  );

  graph["process.summary"] = node(
    "process.summary",
    GUIDED_NODE_MODE.SINGLE,
    "__DYNAMIC_PROCESS_SUMMARY__",
    [
      makeOption("process-solution", "Ver una posible solución", "process.solution"),
      makeOption("process-project", "Ver un proyecto relacionado", "process.project"),
      makeOption("process-diagnostic", "Completar diagnóstico", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption("process-contact", "Hablar con Víctor", "contact.menu"),
    ],
    { section: "process" },
  );

  graph["process.solution"] = node(
    "process.solution",
    GUIDED_NODE_MODE.INFO,
    "__DYNAMIC_PROCESS_SOLUTION__",
    [
      makeOption("process-solution-diagnostic", "Completar diagnóstico", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption("process-solution-project", "Ver proyecto relacionado", "process.project"),
      makeOption("process-solution-contact", "Contactar con Víctor", "contact.menu"),
    ],
    { section: "process" },
  );

  graph["process.project"] = node(
    "process.project",
    GUIDED_NODE_MODE.INFO,
    "__DYNAMIC_PROCESS_PROJECT__",
    [
      makeOption("process-project-open", "Abrir proyecto", null, { action: "dynamic-project" }),
      makeOption("process-project-diagnostic", "Completar diagnóstico", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption("process-project-contact", "Contactar con Víctor", "contact.menu"),
    ],
    { section: "process" },
  );

  graph["victor.menu"] = node(
    "victor.menu",
    GUIDED_NODE_MODE.SINGLE,
    `${profileSummary()} ¿Qué parte te interesa conocer?`,
    [
      makeOption("victor-current", "Experiencia actual", "victor.current"),
      makeOption("victor-trajectory", "Trayectoria profesional", "victor.trajectory"),
      makeOption("victor-tech", "Tecnologías", "victor.technologies"),
      makeOption("victor-data", "Power BI y datos", "victor.powerbi"),
      makeOption("victor-ai", "Automatización e IA", "victor.automation-ai"),
      makeOption("victor-education", "Formación y certificaciones", "victor.education"),
      makeOption("victor-projects", "Proyectos realizados", "projects.menu"),
      makeOption("victor-content", "Contenido y publicaciones", "resources.menu"),
    ],
    { section: "victor" },
  );

  graph["victor.current"] = node("victor.current", GUIDED_NODE_MODE.INFO, currentExperienceSummary(), [
    makeOption("current-tech", "Tecnologías actuales", "victor.technologies"),
    makeOption("current-projects", "Ver proyectos", "projects.menu"),
    makeOption("current-contact", "Contactar con Víctor", "contact.menu"),
  ], { section: "victor" });

  graph["victor.trajectory"] = node("victor.trajectory", GUIDED_NODE_MODE.INFO, trajectorySummary(), [
    makeOption("trajectory-current", "Experiencia actual", "victor.current"),
    makeOption("trajectory-cobol", "Etapa COBOL y banca", "victor.tech.cobol"),
    makeOption("trajectory-projects", "Ver proyectos", "projects.menu"),
  ], { section: "victor" });

  graph["victor.technologies"] = node(
    "victor.technologies",
    GUIDED_NODE_MODE.SINGLE,
    "A lo largo de su trayectoria ha trabajado con Power BI, Excel, Power Query, SQL, Oracle y COBOL, y más recientemente ha ido incorporando Python. En los últimos años también está sumando herramientas de IA y automatización como Microsoft Copilot y Power Automate. Si quieres, elige una y te cuento algo más.",
    [
      makeOption("tech-powerbi", "Power BI", "victor.tech.powerbi"),
      makeOption("tech-excel", "Excel / Power Query", "victor.tech.excel"),
      makeOption("tech-python", "Python", "victor.tech.python"),
      makeOption("tech-sql", "SQL / Oracle", "victor.tech.sql"),
      makeOption("tech-cobol", "COBOL", "victor.tech.cobol"),
      makeOption("tech-ai", "IA / Power Platform", "victor.tech.ai"),
      makeOption("tech-qlik", "Qlik", "victor.tech.qlik"),
    ],
    { section: "victor" },
  );

  graph["victor.tech.powerbi"] = node("victor.tech.powerbi", GUIDED_NODE_MODE.INFO, "Power BI forma parte de su trabajo actual y también aparece en varios proyectos del portfolio. Además, Víctor se ha formado específicamente en esta herramienta y publica contenido relacionado en DataVerso.", [
    makeOption("pb-projects", "Ver proyectos con Power BI", "projects.menu"),
    makeOption("pb-content", "Ver artículos de Power BI", "resources.power-bi"),
  ], { section: "victor" });
  graph["victor.tech.excel"] = node("victor.tech.excel", GUIDED_NODE_MODE.INFO, "Excel y Power Query forman parte de su trabajo con datos. Los utiliza para análisis, modelado y transformación de información, y también aparecen en proyectos del portfolio y contenidos de DataVerso.", [
    makeOption("excel-project", "Ver proyecto Excel", "project:project-digital-competency-evaluation"),
    makeOption("excel-content", "Ver artículos de Power Query", "resources.power-query"),
  ], { section: "victor" });
  graph["victor.tech.python"] = node("victor.tech.python", GUIDED_NODE_MODE.INFO, "Python es una tecnología que Víctor ha ido incorporando en los últimos años. Cuenta con formación específica y la utiliza en varios proyectos propios de automatización, análisis de datos e IA; su uso profesional actual está todavía en evolución.", [
    makeOption("python-projects", "Ver proyectos", "projects.menu"),
  ], { section: "victor" });
  graph["victor.tech.sql"] = node("victor.tech.sql", GUIDED_NODE_MODE.INFO, "SQL y Oracle forman parte de su experiencia con bases de datos. Oracle aparece tanto en trabajos históricos de migración bancaria como en su contexto profesional actual de explotación de datos, y además cuenta con formación específica en SQL.", [], { section: "victor" });
  graph["victor.tech.cobol"] = node("victor.tech.cobol", GUIDED_NODE_MODE.INFO, "Durante buena parte de su trayectoria trabajó con COBOL en entornos bancarios, tanto en procesos batch y online como en migraciones y sistemas en producción.", [
    makeOption("cobol-trajectory", "Ver trayectoria", "victor.trajectory"),
  ], { section: "victor" });
  graph["victor.tech.ai"] = node("victor.tech.ai", GUIDED_NODE_MODE.INFO, "La IA es una línea más reciente dentro de su trayectoria. Actualmente sigue formándose y la aplica de manera práctica, especialmente con Copilot y otras herramientas del ecosistema Microsoft. También la está incorporando a proyectos propios de automatización y análisis.", [
    makeOption("ai-service", "Ver servicio de IA aplicada", "service:service-ai-process-analysis"),
    makeOption("ai-projects", "Ver proyectos", "projects.menu"),
  ], { section: "victor" });
  graph["victor.tech.qlik"] = node("victor.tech.qlik", GUIDED_NODE_MODE.INFO, "Qlik no forma parte de su experiencia profesional actual: no tiene experiencia confirmada con QlikView, Qlik Sense o NPrinting. Si buscas específicamente esas herramientas, conviene tenerlo en cuenta.", [], { section: "victor" });
  graph["victor.powerbi"] = graph["victor.tech.powerbi"];
  graph["victor.automation-ai"] = graph["victor.tech.ai"];

  graph["victor.education"] = node("victor.education", GUIDED_NODE_MODE.INFO, `${educationSummary()} ${certificationSummary()}`, [
    makeOption("education-pl300", "Estado de PL-300", "victor.certifications"),
    makeOption("education-tech", "Tecnologías", "victor.technologies"),
  ], { section: "victor" });
  graph["victor.certifications"] = node("victor.certifications", GUIDED_NODE_MODE.INFO, certificationSummary(), [], { section: "victor" });

  graph["projects.menu"] = node(
    "projects.menu",
    GUIDED_NODE_MODE.SINGLE,
    "Estos son algunos de los proyectos principales de Víctor. Elige uno y te cuento qué problema resuelve, cómo está planteado y qué tecnologías utiliza.",
    projectKnowledge.map((project) => makeOption(`project-menu:${project.id}`, project.title, `project:${project.id}`)),
    { section: "projects" },
  );

  for (const project of projectKnowledge) {
    graph[`project:${project.id}`] = node(
      `project:${project.id}`,
      GUIDED_NODE_MODE.SINGLE,
      projectSummary(project.id),
      [
        makeOption(`project-problem:${project.id}`, "¿Qué problema resuelve?", `project-problem:${project.id}`),
        makeOption(`project-how:${project.id}`, "¿Cómo está planteado?", `project-how:${project.id}`),
        makeOption(`project-open:${project.id}`, "Abrir proyecto", null, { action: GUIDED_ACTION_KIND.NAVIGATE, target: PROJECT_URLS[project.id] }),
        makeOption(`project-contact:${project.id}`, "Hablar con Víctor", "contact.menu"),
      ],
      { section: "projects" },
    );
    graph[`project-problem:${project.id}`] = node(`project-problem:${project.id}`, GUIDED_NODE_MODE.INFO, projectProblemSummary(project.id), [
      makeOption(`project-problem-how:${project.id}`, "Ver cómo está planteado", `project-how:${project.id}`),
      makeOption(`project-problem-open:${project.id}`, "Abrir proyecto", null, { action: GUIDED_ACTION_KIND.NAVIGATE, target: PROJECT_URLS[project.id] }),
    ], { section: "projects" });
    graph[`project-how:${project.id}`] = node(`project-how:${project.id}`, GUIDED_NODE_MODE.INFO, projectHowSummary(project.id), [
      makeOption(`project-how-open:${project.id}`, "Abrir proyecto", null, { action: GUIDED_ACTION_KIND.NAVIGATE, target: PROJECT_URLS[project.id] }),
    ], { section: "projects" });
  }

  graph["services.menu"] = node(
    "services.menu",
    GUIDED_NODE_MODE.SINGLE,
    "Si tienes una necesidad concreta, aquí puedes ver las áreas en las que trabaja Víctor y explorar cuál se parece más a tu caso.",
    [
      ...serviceKnowledge.map((service) => makeOption(`service-menu:${service.id}`, service.title, `service:${service.id}`)),
      makeOption("services-solutions", "Ver soluciones por problema", "solutions.menu"),
    ],
    { section: "services" },
  );

  for (const service of serviceKnowledge) {
    graph[`service:${service.id}`] = node(`service:${service.id}`, GUIDED_NODE_MODE.INFO, serviceSummary(service.id), [
      makeOption(`service-diagnostic:${service.id}`, "Analizar mi caso", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption(`service-contact:${service.id}`, "Contactar con Víctor", "contact.menu"),
    ], { section: "services" });
  }

  graph["solutions.menu"] = node(
    "solutions.menu",
    GUIDED_NODE_MODE.SINGLE,
    "¿Cuál de estas opciones se parece más a lo que necesitas?",
    solutionKnowledge.map((solution) => makeOption(`solution-menu:${solution.id}`, solution.title, `solution:${solution.id}`)),
    { section: "services" },
  );

  for (const solution of solutionKnowledge) {
    graph[`solution:${solution.id}`] = node(`solution:${solution.id}`, GUIDED_NODE_MODE.INFO, solutionSummary(solution.id), [
      makeOption(`solution-diagnostic:${solution.id}`, "Analizar mi caso", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption(`solution-contact:${solution.id}`, "Contactar con Víctor", "contact.menu"),
    ], { section: "services" });
  }

  graph["resources.menu"] = node(
    "resources.menu",
    GUIDED_NODE_MODE.SINGLE,
    "Si quieres seguir explorando, aquí tienes DataVerso y otros recursos públicos de Víctor sobre datos, Power BI, Power Query, finanzas, inversión y aprendizaje.",
    [
      makeOption("resources-dataverso", "Dataverso", "resources.dataverso"),
      makeOption("resources-powerbi", "Power BI", "resources.power-bi"),
      makeOption("resources-powerquery", "Power Query", "resources.power-query"),
      makeOption("resources-finance", "Finanzas personales", "resources.finance"),
      makeOption("resources-investing", "Inversión", "resources.investing"),
      makeOption("resources-books", "Libros", "resources.books"),
      makeOption("resources-learning", "Aprendizaje y crecimiento personal", "resources.learning"),
    ],
    { section: "resources" },
  );

  graph["resources.dataverso"] = node(
    "resources.dataverso",
    GUIDED_NODE_MODE.INFO,
    "DataVerso es la publicación de Víctor, donde comparte lo que va aprendiendo y aplicando sobre datos, Power BI, Power Query, finanzas e inversión. Puedes abrirla y explorar los artículos publicados.",
    [makeOption("open-dataverso", "Abrir Dataverso", null, { action: GUIDED_ACTION_KIND.EXTERNAL, target: catalog.publication.url })],
    { section: "resources" },
  );
  graph["resources.power-bi"] = resourceNode("resources.power-bi", "Si te interesa Power BI, aquí tienes artículos públicos de Víctor sobre fundamentos, modelado, conexión a datos y uso práctico de la herramienta.", "power-bi");
  graph["resources.power-query"] = resourceNode("resources.power-query", "Aquí puedes ver contenidos centrados en Power Query y en la preparación y transformación de datos.", "power-query");
  graph["resources.finance"] = resourceNode("resources.finance", "Aquí encontrarás contenido divulgativo sobre organización financiera, aprendizaje y libros relacionados. Es contenido educativo y no sustituye asesoramiento profesional.", "finance");
  graph["resources.investing"] = resourceNode("resources.investing", "Aquí encontrarás experiencias y contenidos divulgativos sobre inversión. No son recomendaciones personalizadas de compra o venta.", "investing");
  graph["resources.learning"] = resourceNode("resources.learning", "Aquí encontrarás contenidos y recursos sobre aprendizaje, hábitos, mentalidad y evolución personal.", "learning");
  graph["resources.books"] = node(
    "resources.books",
    GUIDED_NODE_MODE.INFO,
    "Estos son algunos de los libros que Víctor ha mencionado o recomendado en su contenido público. Cuando un enlace de compra es de afiliado, se indica expresamente.",
    bookOptions(),
    { section: "resources" },
  );

  const contactEmail = safeString(guidedKnowledge.contact?.email);
  const contactLinkedIn = safeString(guidedKnowledge.contact?.linkedin);
  graph["contact.menu"] = node(
    "contact.menu",
    GUIDED_NODE_MODE.SINGLE,
    "Si quieres hablar con Víctor, puedes preparar primero tu caso con el diagnóstico, reservar una reunión inicial o consultar sus datos de contacto.",
    [
      makeOption("contact-diagnostic", "Completar diagnóstico", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
      makeOption("contact-calendly", "Reservar reunión inicial", null, { action: GUIDED_ACTION_KIND.CALENDLY, target: CALENDLY_URL }),
      makeOption("contact-details", "Ver datos de contacto", "contact.details"),
    ],
    { section: "contact" },
  );
  graph["contact.details"] = node(
    "contact.details",
    GUIDED_NODE_MODE.INFO,
    `Puedes escribir a Víctor por email${contactEmail ? ` (${contactEmail})` : ""} o contactar con él en LinkedIn. La disponibilidad, el presupuesto y los plazos se concretan directamente con él.`,
    [
      ...(contactEmail ? [makeOption("contact-email", "Enviar email", null, { action: GUIDED_ACTION_KIND.EXTERNAL, target: `mailto:${contactEmail}` })] : []),
      ...(contactLinkedIn ? [makeOption("contact-linkedin", "Abrir LinkedIn", null, { action: GUIDED_ACTION_KIND.EXTERNAL, target: contactLinkedIn })] : []),
      makeOption("contact-diagnostic-details", "Completar diagnóstico", null, { action: GUIDED_ACTION_KIND.DIAGNOSTIC, target: DIAGNOSTIC_PAGE }),
    ],
    { section: "contact" },
  );

  graph["diagnostic.handoff"] = node(
    "diagnostic.handoff",
    GUIDED_NODE_MODE.SINGLE,
    "__DYNAMIC_DIAGNOSTIC_HANDOFF__",
    [
      makeOption("feedback-positive", "👍 Sí", "support.offer", { value: "positive", selectionKey: "feedback" }),
      makeOption("feedback-neutral", "😐 Más o menos", "support.offer", { value: "neutral", selectionKey: "feedback" }),
      makeOption("feedback-negative", "👎 No", "feedback.negative", { value: "negative", selectionKey: "feedback" }),
    ],
    {
      title: "Antes de cerrar, ¿te ha resultado útil esta conversación?",
      section: "closing",
      terminal: true,
    },
  );

  graph.feedback = node(
    "feedback",
    GUIDED_NODE_MODE.SINGLE,
    "Gracias por visitar el portfolio. Antes de cerrar, ¿te ha resultado útil esta conversación?",
    [
      makeOption("feedback-positive", "👍 Sí", "support.offer", { value: "positive", selectionKey: "feedback" }),
      makeOption("feedback-neutral", "😐 Más o menos", "support.offer", { value: "neutral", selectionKey: "feedback" }),
      makeOption("feedback-negative", "👎 No", "feedback.negative", { value: "negative", selectionKey: "feedback" }),
    ],
    { section: "closing" },
  );
  graph["support.offer"] = node(
    "support.offer",
    GUIDED_NODE_MODE.SINGLE,
    "Gracias por decírmelo. Si quieres contribuir a que este proyecto siga creciendo y mejorando, puedes apoyarlo de forma voluntaria.",
    [
      makeOption("support-accept", "Apoyar el proyecto", null, { action: GUIDED_ACTION_KIND.SUPPORT, target: SUPPORT_PAGE }),
      makeOption("support-decline", "Ahora no", null, { action: GUIDED_ACTION_KIND.CLOSE }),
    ],
    { section: "closing", terminal: true },
  );
  graph["feedback.negative"] = node(
    "feedback.negative",
    GUIDED_NODE_MODE.INFO,
    "Gracias por decírmelo. Esa valoración ayuda a detectar qué partes del asistente conviene mejorar.",
    [makeOption("feedback-negative-close", "Cerrar conversación", null, { action: GUIDED_ACTION_KIND.CLOSE })],
    { section: "closing", terminal: true },
  );

  return Object.freeze(graph);
}

export const GUIDED_GRAPH = buildStaticGraph();

function emptySelections() {
  return {
    processAreas: [],
    currentWork: [],
    frequency: null,
    users: null,
    tools: [],
    painPoints: [],
    goals: [],
    timeframe: null,
    feedback: null,
  };
}

export function createGuidedState() {
  return {
    version: GUIDED_SCHEMA_VERSION,
    currentNode: GUIDED_HOME_NODE_ID,
    history: [],
    selections: emptySelections(),
    pendingMulti: [],
  };
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function validateGuidedState(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  if (candidate.version !== GUIDED_SCHEMA_VERSION) return false;
  if (!GUIDED_GRAPH[candidate.currentNode]) return false;
  if (!Array.isArray(candidate.history) || !Array.isArray(candidate.pendingMulti)) return false;
  if (!candidate.selections || typeof candidate.selections !== "object") return false;
  return true;
}

function processSummary(selections) {
  const areas = labelList("processAreas", selections.processAreas);
  const currentValues = selections.currentWork ?? [];
  const frequency = LABELS.frequency[selections.frequency] ?? "";
  const users = LABELS.users[selections.users] ?? "";
  const tools = labelList("tools", selections.tools);
  const goals = labelList("goals", selections.goals);

  const naturalAreas = areas.map((value) => value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value);
  const first = naturalAreas.length > 0
    ? `Por lo que has marcado, quieres mejorar ${naturalJoin(naturalAreas)}.`
    : "Por lo que has indicado, quieres revisar un proceso de trabajo.";

  const specificCurrent = currentValues
    .filter((value) => value !== "mostly_manual")
    .map((value) => CURRENT_WORK_SUMMARY[value])
    .filter(Boolean);

  let second = "";
  if (currentValues.includes("mostly_manual")) {
    second = specificCurrent.length > 0
      ? `Ahora mismo, prácticamente todo el proceso es manual; además, ${naturalJoin(specificCurrent)}.`
      : "Ahora mismo, prácticamente todo el proceso es manual.";
  } else if (specificCurrent.length > 0) {
    second = `Ahora mismo ${naturalJoin(specificCurrent)}.`;
  }

  const contextParts = [];
  if (frequency) contextParts.push(`se repite ${frequency.toLowerCase()}`);
  if (users && users !== "No lo sé") {
    contextParts.push(users === "Solo yo" ? "lo realizas tú solo" : `lo utilizan ${users.toLowerCase()}`);
  }
  if (tools.length > 0) contextParts.push(`utilizas ${naturalJoin(tools)}`);
  const third = contextParts.length > 0 ? `El proceso ${naturalJoin(contextParts)}.` : "";
  const fourth = goals.length > 0 ? `Tus prioridades son ${naturalJoin(goals).toLowerCase()}.` : "";

  return [
    first,
    second,
    third,
    fourth,
    "Con esto ya tengo una buena idea del caso. Ahora puedes ver una posible solución, revisar un proyecto relacionado o pasar al diagnóstico.",
  ].filter(Boolean).join(" ");
}

function recommendedProjectId(selections) {
  const areas = new Set(selections.processAreas ?? []);
  const goals = new Set(selections.goals ?? []);
  const tools = new Set(selections.tools ?? []);

  if (areas.has(PROCESS_AREA.SALES) || areas.has(PROCESS_AREA.BILLING)) {
    return "project-business-cost-intelligence";
  }
  if (areas.has(PROCESS_AREA.REPORTING) && tools.has("power-bi")) {
    return "project-business-cost-intelligence";
  }
  if (areas.has(PROCESS_AREA.EXCEL) && goals.has("reduce_errors")) {
    return "project-digital-competency-evaluation";
  }
  if (areas.has(PROCESS_AREA.MANUAL) || selections.currentWork?.includes("mostly_manual")) {
    return "project-business-cost-intelligence";
  }
  return "project-business-cost-intelligence";
}

function recommendedSolutionId(selections) {
  const areas = new Set(selections.processAreas ?? []);
  const goals = new Set(selections.goals ?? []);
  if (areas.has(PROCESS_AREA.REPORTING) || goals.has("improve_reporting")) return "solution-reporting-dashboard-automation";
  if (areas.has(PROCESS_AREA.EXCEL) && goals.has("reduce_errors")) return "solution-data-quality-traceability";
  if (goals.has("automate") || areas.has(PROCESS_AREA.MANUAL)) return "solution-data-consolidation-automation";
  if (areas.has(PROCESS_AREA.BILLING) || areas.has(PROCESS_AREA.SALES)) return "solution-data-consolidation-automation";
  return "solution-data-consolidation-automation";
}

function hasDiagnosticPrefillContext(selections) {
  return Boolean(
    (selections.processAreas ?? []).length > 0 ||
    (selections.currentWork ?? []).length > 0 ||
    selections.frequency ||
    selections.users ||
    (selections.tools ?? []).length > 0 ||
    (selections.painPoints ?? []).length > 0 ||
    (selections.goals ?? []).length > 0 ||
    selections.timeframe
  );
}

function diagnosticHandoffMessage(selections) {
  const hasContext = hasDiagnosticPrefillContext(selections);
  const opening = hasContext
    ? "Perfecto. Con lo que has seleccionado ya he dejado preparado un borrador del diagnóstico para ahorrarte trabajo."
    : "Te llevo al diagnóstico para que puedas contar tu caso con algo más de detalle.";

  const review = hasContext
    ? "Revisa lo que ya aparece rellenado, cambia lo que necesites y completa cualquier dato que falte antes de enviarlo."
    : "Completa el formulario, revisa los datos antes de enviarlo y añade cualquier información que te parezca útil.";

  return `${opening} ${review} La casilla de privacidad queda sin marcar para que la revises y decidas tú si la aceptas. Cuando envíes el formulario, Víctor recibirá la información para revisar tu caso.`;
}

function dynamicMessage(nodeId, selections) {
  if (nodeId === "diagnostic.handoff") return diagnosticHandoffMessage(selections);
  if (nodeId === "process.summary") return processSummary(selections);
  if (nodeId === "process.solution") {
    const solutionId = recommendedSolutionId(selections);
    const solution = itemById(solutionKnowledge, solutionId);
    return solution ? solutionSummary(solutionId) : "Una opción razonable sería estructurar primero el proceso y automatizar después los pasos repetitivos, manteniendo controles y trazabilidad.";
  }
  if (nodeId === "process.project") {
    const projectId = recommendedProjectId(selections);
    const project = itemById(projectKnowledge, projectId);
    return project ? `Un proyecto del portfolio que puede servirte como referencia es ${project.title}. ${projectSummary(projectId)}` : "Hay proyectos del portfolio relacionados con consolidación, automatización y análisis de datos que pueden servir como referencia.";
  }
  return null;
}

function dynamicOptions(nodeDef, selections) {
  if (nodeDef.id !== "process.project") return nodeDef.options;
  const projectId = recommendedProjectId(selections);
  return nodeDef.options.map((option) => {
    if (option.action !== "dynamic-project") return option;
    return Object.freeze({
      ...option,
      action: GUIDED_ACTION_KIND.NAVIGATE,
      target: PROJECT_URLS[projectId],
    });
  });
}

export function getGuidedView(state) {
  const safeState = validateGuidedState(state) ? state : createGuidedState();
  const nodeDef = GUIDED_GRAPH[safeState.currentNode] ?? GUIDED_GRAPH[GUIDED_HOME_NODE_ID];
  const message = dynamicMessage(nodeDef.id, safeState.selections) ?? nodeDef.message;
  const options = dynamicOptions(nodeDef, safeState.selections);
  const closingNode = [
    "feedback",
    "diagnostic.handoff",
    "support.offer",
    "feedback.negative",
  ].includes(nodeDef.id);

  const hasDiagnosticOption = options.some(
    (option) => option.action === GUIDED_ACTION_KIND.DIAGNOSTIC,
  );
  const hasContactOption = options.some(
    (option) => option.next === "contact.menu" || option.action === GUIDED_ACTION_KIND.CONTACT,
  );

  return Object.freeze({
    ...nodeDef,
    message,
    options: Object.freeze(options),
    selectedValues: Object.freeze([...(safeState.pendingMulti ?? [])]),
    canBack: !closingNode && safeState.history.length > 0,
    canHome: !closingNode && nodeDef.id !== GUIDED_HOME_NODE_ID,
    canDiagnostic: !closingNode && !hasDiagnosticOption,
    canContact: !closingNode && nodeDef.section !== "contact" && !hasContactOption,
    canFinish: !closingNode,
    diagnosticTarget: DIAGNOSTIC_PAGE,
  });
}

function snapshotForHistory(state) {
  return {
    currentNode: state.currentNode,
    selections: cloneState(state.selections),
  };
}

function assignSelection(state, key, value) {
  if (!key) return;
  state.selections[key] = value;
}

function commitPendingMultiSelections(state) {
  const currentNode = GUIDED_GRAPH[state.currentNode];
  if (
    currentNode?.mode === GUIDED_NODE_MODE.MULTI &&
    currentNode.selectionKey &&
    Array.isArray(state.pendingMulti) &&
    state.pendingMulti.length > 0
  ) {
    assignSelection(state, currentNode.selectionKey, [...state.pendingMulti]);
  }
}

export function transitionGuidedState(state, optionId) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  const view = getGuidedView(nextState);
  const option = view.options.find((entry) => entry.id === optionId);
  if (!option) return Object.freeze({ changed: false, state: nextState, reason: "unknown-option" });

  if (view.mode === GUIDED_NODE_MODE.MULTI) {
    const value = option.value;
    const selected = new Set(nextState.pendingMulti);
    if (selected.has(value)) selected.delete(value); else selected.add(value);
    nextState.pendingMulti = [...selected];
    return Object.freeze({ changed: true, advanced: false, state: nextState, selectedLabel: option.label, option });
  }

  if (option.action && option.action !== GUIDED_ACTION_KIND.NAVIGATE) {
    return Object.freeze({ changed: false, advanced: false, state: nextState, action: option.action, target: option.target, selectedLabel: option.label, option });
  }

  if (option.action === GUIDED_ACTION_KIND.NAVIGATE && !option.next) {
    return Object.freeze({ changed: false, advanced: false, state: nextState, action: option.action, target: option.target, selectedLabel: option.label, option });
  }

  if (option.selectionKey) assignSelection(nextState, option.selectionKey, option.value);
  if (option.next) {
    nextState.history.push(snapshotForHistory(nextState));
    nextState.currentNode = option.next;
    nextState.pendingMulti = [];
  }
  return Object.freeze({ changed: true, advanced: Boolean(option.next), state: nextState, selectedLabel: option.label, option });
}

export function continueGuidedMulti(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  const view = getGuidedView(nextState);
  if (view.mode !== GUIDED_NODE_MODE.MULTI) return Object.freeze({ changed: false, state: nextState, reason: "not-multi" });
  const minimum = Number.isInteger(view.minSelections) ? view.minSelections : 1;
  if (nextState.pendingMulti.length < minimum) return Object.freeze({ changed: false, state: nextState, reason: "selection-required" });
  const labels = nextState.pendingMulti.map((value) => LABELS[view.selectionKey]?.[value] ?? value);
  assignSelection(nextState, view.selectionKey, [...nextState.pendingMulti]);
  nextState.history.push(snapshotForHistory(nextState));
  nextState.currentNode = view.next;
  nextState.pendingMulti = [];
  return Object.freeze({ changed: true, advanced: true, state: nextState, selectedLabel: naturalJoin(labels) });
}

export function goBackGuided(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  const previous = nextState.history.pop();
  if (!previous) return Object.freeze({ changed: false, state: nextState });
  nextState.currentNode = previous.currentNode;
  nextState.selections = previous.selections;
  const previousNode = GUIDED_GRAPH[previous.currentNode];
  nextState.pendingMulti =
    previousNode?.mode === GUIDED_NODE_MODE.MULTI &&
    Array.isArray(nextState.selections?.[previousNode.selectionKey])
      ? [...nextState.selections[previousNode.selectionKey]]
      : [];
  return Object.freeze({ changed: true, state: nextState });
}

export function goHomeGuided(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  commitPendingMultiSelections(nextState);
  nextState.currentNode = GUIDED_HOME_NODE_ID;
  nextState.history = [];
  nextState.pendingMulti = [];
  return Object.freeze({ changed: true, state: nextState });
}

export function goContactGuided(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  commitPendingMultiSelections(nextState);
  if (nextState.currentNode !== "contact.menu") {
    nextState.history.push(snapshotForHistory(nextState));
    nextState.currentNode = "contact.menu";
  }
  nextState.pendingMulti = [];
  return Object.freeze({ changed: true, state: nextState });
}

export function goFeedbackGuided(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  commitPendingMultiSelections(nextState);
  nextState.history = [];
  nextState.currentNode = "feedback";
  nextState.pendingMulti = [];
  return Object.freeze({ changed: true, state: nextState });
}

export function goDiagnosticHandoffGuided(state) {
  const nextState = validateGuidedState(state) ? cloneState(state) : createGuidedState();
  commitPendingMultiSelections(nextState);
  nextState.history = [];
  nextState.currentNode = "diagnostic.handoff";
  nextState.pendingMulti = [];
  return Object.freeze({ changed: true, state: nextState });
}

export function buildGuidedDiagnosticPrefill(state) {
  const selections = validateGuidedState(state) ? state.selections : emptySelections();
  const needs = unique(selections.processAreas ?? []);
  const currentLabels = labelList("currentWork", selections.currentWork);
  const toolLabels = labelList("tools", selections.tools);
  const frequencyLabel = LABELS.frequency[selections.frequency] ?? null;
  const painLabels = labelList("painPoints", selections.painPoints);
  const goalLabels = labelList("goals", selections.goals);

  const processParts = [];
  if (currentLabels.length > 0) processParts.push(`${naturalJoin(currentLabels)}.`);
  if (toolLabels.length > 0) processParts.push(`Herramientas: ${naturalJoin(toolLabels)}.`);
  if (frequencyLabel) processParts.push(`Frecuencia: ${frequencyLabel.toLowerCase()}.`);

  const usersMap = { one: 1, two_five: 2, six_ten: 6, more_ten: 11, unknown: null };
  const timeframeMap = { asap: "urgent", weeks: "4 weeks", one_three_months: "3 months", exploring: null };

  const additional = [];
  if (painLabels.length > 0) additional.push(`Problemas indicados: ${naturalJoin(painLabels)}`);
  if (toolLabels.length > 0) additional.push(`Herramientas: ${naturalJoin(toolLabels)}`);
  if (frequencyLabel) additional.push(`Frecuencia: ${frequencyLabel}`);

  return Object.freeze({
    name: null,
    company: null,
    email: null,
    phone: null,
    needs: Object.freeze(needs),
    currentProcess: processParts.length > 0 ? processParts.join(" ") : null,
    users: usersMap[selections.users] ?? null,
    timeframe: timeframeMap[selections.timeframe] ?? null,
    objective: goalLabels.length > 0 ? `${naturalJoin(goalLabels)}.` : null,
    additionalInfo: additional.length > 0 ? `${additional.join(". ")}.` : null,
  });
}

export function createGuidedConversationController({ storageRef = globalThis.sessionStorage } = {}) {
  let state = createGuidedState();

  function save() {
    try { storageRef?.setItem?.(GUIDED_STORAGE_KEY, JSON.stringify(state)); } catch { /* fail-soft */ }
  }

  function load() {
    try {
      const raw = storageRef?.getItem?.(GUIDED_STORAGE_KEY);
      if (!raw) return state;
      const parsed = JSON.parse(raw);
      if (validateGuidedState(parsed)) state = parsed;
    } catch { /* fail-soft */ }
    return cloneState(state);
  }

  function replace(next) {
    state = validateGuidedState(next) ? cloneState(next) : createGuidedState();
    save();
    return cloneState(state);
  }

  function reset() {
    state = createGuidedState();
    save();
    return cloneState(state);
  }

  load();

  return Object.freeze({
    getState: () => cloneState(state),
    getView: () => getGuidedView(state),
    select: (optionId) => { const result = transitionGuidedState(state, optionId); if (result.changed) replace(result.state); return result; },
    continueMulti: () => { const result = continueGuidedMulti(state); if (result.changed) replace(result.state); return result; },
    back: () => { const result = goBackGuided(state); if (result.changed) replace(result.state); return result; },
    home: () => { const result = goHomeGuided(state); replace(result.state); return result; },
    contact: () => { const result = goContactGuided(state); replace(result.state); return result; },
    finish: () => { const result = goFeedbackGuided(state); replace(result.state); return result; },
    diagnosticHandoff: () => { const result = goDiagnosticHandoffGuided(state); replace(result.state); return result; },
    reset,
    replace,
    buildDiagnosticPrefill: () => buildGuidedDiagnosticPrefill(state),
  });
}

export const GUIDED_PUBLIC_ROUTES = Object.freeze({
  CONTACT_PAGE,
  DIAGNOSTIC_PAGE,
  SUPPORT_PAGE,
  CALENDLY_URL,
  PROJECT_URLS,
});
