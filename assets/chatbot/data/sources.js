/**
 * Fuentes autorizadas de la base de conocimiento del asistente.
 *
 * IMPORTANTE:
 * - Este fichero contiene únicamente fuentes que pueden respaldar
 *   conocimiento público o resumible públicamente.
 * - PRIVATE_CONTEXT nunca debe registrarse aquí.
 * - Una inferencia DERIVED no es una fuente: debe apuntar a facts padre.
 */

export const SOURCE_TYPE = Object.freeze({
  PORTFOLIO: "portfolio",
  LINKEDIN: "linkedin",
  SUBSTACK: "substack",
  USER_CONFIRMED: "user_confirmed",
  INTERNAL_PROJECT: "internal_project",
});

export const SOURCE_AUTHORITY = Object.freeze({
  CANONICAL: "canonical",
  PROFESSIONAL: "professional",
  PUBLISHED_KNOWLEDGE: "published_knowledge",
  USER_CONFIRMED: "user_confirmed",
  SUPPORTING: "supporting",
});


export const SOURCE_VISIBILITY = Object.freeze({
  PUBLIC: "public",
  PUBLIC_SUMMARY_ONLY: "public_summary_only",
});

function freezeSource(source) {
  return Object.freeze({
    ...source,
    topics: Object.freeze([...(source.topics ?? [])]),
  });
}

export const sources = Object.freeze([
  freezeSource({
    id: "source-portfolio-home",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Portfolio de Víctor Guzmán",
    url: "https://victorguzmanperez.github.io/victorguzman/",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "profile",
      "services",
      "projects",
      "technologies",
      "business-intelligence",
      "automation",
      "ai",
      "contact",
    ],
  }),

  freezeSource({
    id: "source-portfolio-solutions",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Soluciones de Datos, BI, Automatización e IA",
    url: "https://victorguzmanperez.github.io/victorguzman/soluciones.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "services",
      "solutions",
      "business-intelligence",
      "excel",
      "automation",
      "ai",
    ],
  }),

  freezeSource({
    id: "source-portfolio-diagnostic",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Diagnóstico inicial",
    url: "https://victorguzmanperez.github.io/victorguzman/diagnostico.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "diagnostic",
      "contact",
      "booking",
      "automation",
      "business-intelligence",
    ],
  }),

  freezeSource({
    id: "source-portfolio-privacy",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Política de privacidad",
    url: "https://victorguzmanperez.github.io/victorguzman/privacidad.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "privacy",
      "contact",
      "diagnostic",
      "personal-data",
    ],
  }),

  freezeSource({
    id: "source-project-business-cost-intelligence",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Business Cost Intelligence",
    url:
      "https://victorguzmanperez.github.io/victorguzman/projects/costes.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "python",
      "power-bi",
      "power-query",
      "dax",
      "pdf",
      "automation",
      "cost-analysis",
      "data-extraction",
    ],
  }),

  freezeSource({
    id: "source-project-auditoria-digital",
    type: SOURCE_TYPE.PORTFOLIO,
    title:
      "Auditoría de Presencia Digital de la Comunidad Valenciana",
    url:
      "https://victorguzmanperez.github.io/victorguzman/projects/auditoria-digital-cv.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "python",
      "power-bi",
      "power-query",
      "dax",
      "web-scraping",
      "playwright",
      "beautifulsoup",
      "geolocation",
      "open-data",
      "scoring",
      "ai",
    ],
  }),

  freezeSource({
    id: "source-project-investment-dashboard",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Investment Dashboard con IA",
    url:
      "https://victorguzmanperez.github.io/victorguzman/projects/investment.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "python",
      "power-bi",
      "pandas",
      "parquet",
      "financial-analysis",
      "dividends",
      "risk",
      "valuation",
      "backtesting",
      "ai",
    ],
  }),

  freezeSource({
    id: "source-project-digital-competency-evaluation",
    type: SOURCE_TYPE.PORTFOLIO,
    title: "Modelo de Evaluación de Competencias Digitales",
    url:
      "https://victorguzmanperez.github.io/victorguzman/projects/modelo-evaluacion-competencias.html",
    authority: SOURCE_AUTHORITY.CANONICAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "excel",
      "power-query",
      "hierarchical-modeling",
      "business-rules",
      "testing",
      "qa",
      "staging",
      "documentation",
    ],
  }),

  freezeSource({
    id: "source-linkedin-victor",
    type: SOURCE_TYPE.LINKEDIN,
    title: "LinkedIn profesional de Víctor Guzmán Pérez",
    url: "https://www.linkedin.com/in/victorguzmanperez/",
    authority: SOURCE_AUTHORITY.PROFESSIONAL,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "career",
      "experience",
      "education",
      "training",
      "professional-profile",
    ],
  }),

  freezeSource({
    id: "source-dataverso-home",
    type: SOURCE_TYPE.SUBSTACK,
    title: "DataVerso",
    url: "https://dataversodata.substack.com/",
    authority: SOURCE_AUTHORITY.PUBLISHED_KNOWLEDGE,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "power-bi",
      "power-query",
      "data-analysis",
      "automation",
      "ai",
      "investment",
      "learning",
    ],
  }),

  freezeSource({
    id: "source-dataverso-power-bi-guide",
    type: SOURCE_TYPE.SUBSTACK,
    title: "Guía completa Power BI desde cero",
    url:
      "https://dataversodata.substack.com/p/guia-completa-power-bi-desde-cero",
    authority: SOURCE_AUTHORITY.PUBLISHED_KNOWLEDGE,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "power-bi",
      "power-query",
      "dax",
      "data-modeling",
      "visualization",
    ],
  }),

  freezeSource({
    id: "source-dataverso-power-query-intro",
    type: SOURCE_TYPE.SUBSTACK,
    title: "Qué es Power Query",
    url:
      "https://dataversodata.substack.com/p/que-es-power-query-power-bi",
    authority: SOURCE_AUTHORITY.PUBLISHED_KNOWLEDGE,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "power-query",
      "etl",
      "data-transformation",
      "automation",
      "query-folding",
      "m-language",
    ],
  }),

  freezeSource({
    id: "source-dataverso-power-query-home",
    type: SOURCE_TYPE.SUBSTACK,
    title: "Power Query: explorando el menú Inicio",
    url:
      "https://dataversodata.substack.com/p/power-query-explorando-el-menu-inicio",
    authority: SOURCE_AUTHORITY.PUBLISHED_KNOWLEDGE,
    visibility: SOURCE_VISIBILITY.PUBLIC,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "power-query",
      "excel",
      "csv",
      "sql-server",
      "data-sources",
      "data-transformation",
    ],
  }),

  freezeSource({
    id: "source-user-confirmed-career",
    type: SOURCE_TYPE.USER_CONFIRMED,
    title: "Trayectoria profesional ampliada confirmada por Víctor",
    url: null,
    authority: SOURCE_AUTHORITY.USER_CONFIRMED,
    visibility: SOURCE_VISIBILITY.PUBLIC_SUMMARY_ONLY,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "career",
      "cobol",
      "banking",
      "testing",
      "batch",
      "functional-analysis",
      "leadership",
      "capital-markets",
      "data",
      "automation",
    ],
  }),

  freezeSource({
    id: "source-user-confirmed-learning",
    type: SOURCE_TYPE.USER_CONFIRMED,
    title: "Formación y aprendizaje técnico ampliado confirmado por Víctor",
    url: null,
    authority: SOURCE_AUTHORITY.USER_CONFIRMED,
    visibility: SOURCE_VISIBILITY.PUBLIC_SUMMARY_ONLY,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "c",
      "cpp",
      "delphi",
      "paradox",
      "java",
      "android",
      "python",
      "r",
      "aws",
      "big-data",
      "ai",
    ],
  }),

  freezeSource({
    id: "source-user-confirmed-pl300-status",
    type: SOURCE_TYPE.USER_CONFIRMED,
    title: "Estado actual de preparación PL-300 confirmado por Víctor",
    url: null,
    authority: SOURCE_AUTHORITY.USER_CONFIRMED,
    visibility: SOURCE_VISIBILITY.PUBLIC_SUMMARY_ONLY,
    owner: "victor",
    verified: true,
    lastVerifiedAt: "2026-09-15",
    topics: [
      "power-bi",
      "pl-300",
      "certification",
      "training",
    ],
  }),

  freezeSource({
    id:
      "source-user-confirmed-chatbot-design",

    type:
      SOURCE_TYPE.USER_CONFIRMED,

    title:
      "Decisiones de arquitectura y comportamiento del asistente confirmadas por Víctor",

    url: null,

    authority:
      SOURCE_AUTHORITY.USER_CONFIRMED,

    visibility:
      SOURCE_VISIBILITY.PUBLIC_SUMMARY_ONLY,

    owner:
      "victor",

    verified: true,

    lastVerifiedAt:
      "2026-09-15",

    topics: [
      "chatbot",
      "privacy",
      "diagnostic",
      "booking",
      "contact",
      "analytics",
      "feedback",
      "commercial-policy",
    ],
  }),
]);


export const sourcesById = Object.freeze(
  Object.fromEntries(
    sources.map((source) => [
      source.id,
      source,
    ]),
  ),
);

export function getSourceById(sourceId) {
  if (
    typeof sourceId !== "string" ||
    !sourceId.trim()
  ) {
    return null;
  }

  return sourcesById[sourceId] ?? null;
}

export function getSourcesByType(type) {
  return sources.filter(
    (source) => source.type === type,
  );
}

const SOURCE_TOPIC_ALIASES = Object.freeze({
  // Inteligencia artificial
  ai: "ai",
  ia: "ai",
  "inteligencia-artificial": "ai",
  "artificial-intelligence": "ai",

  // Power BI
  "power-bi": "power-bi",
  powerbi: "power-bi",
  pbi: "power-bi",

  // Power Query
  "power-query": "power-query",
  powerquery: "power-query",
  pq: "power-query",

  // Big Data
  "big-data": "big-data",
  bigdata: "big-data",

  // Machine Learning
  "machine-learning": "machine-learning",
  ml: "machine-learning",
});

export function normalizeSourceTopic(topic) {
  if (
    typeof topic !== "string" ||
    !topic.trim()
  ) {
    return null;
  }

  const normalized = topic
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    return null;
  }

  return (
    SOURCE_TOPIC_ALIASES[normalized] ??
    normalized
  );
}

export function getSourcesByTopic(topic) {
  const normalizedTopic =
    normalizeSourceTopic(topic);

  if (!normalizedTopic) {
    return [];
  }

  return sources.filter((source) =>
    source.topics.includes(normalizedTopic),
  );
}