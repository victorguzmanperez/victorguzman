/* ============================================================
 * FAQ CORPUS — K9.1
 *
 * Pregunta
 *   ↓
 * intent semántico
 *   ↓
 * Knowledge autorizado
 *   ↓
 * objetivo
 *
 * IMPORTANTE:
 * Este fichero NO contiene respuestas finales.
 * responses.js se construirá después de K9.
 * ============================================================
 */


/* ============================================================
 * FAQ INTENTS
 * ============================================================
 */

export const FAQ_INTENT =
  Object.freeze({
    ABOUT_VICTOR:
      "about_victor",

    EXPERIENCE:
      "experience",

    TECHNOLOGIES:
      "technologies",

    POWERBI:
      "powerbi",

    POWER_PLATFORM:
      "power_platform",

    AI_PROJECT:
      "ai_project",

    PROJECTS:
      "projects",

    SERVICES:
      "services",

    EXCEL_PROBLEM:
      "excel_problem",

    REPORTING_PROBLEM:
      "reporting_problem",

    AUTOMATION:
      "automation",

    DATA_ANALYSIS:
      "data_analysis",

    PUBLICATIONS:
      "publications",

    CERTIFICATION:
      "certification",

    DIAGNOSTIC:
      "diagnostic",

    CONTACT:
      "contact",

    BOOKING:
      "booking",

    PRICING:
      "pricing",

    TIMELINE:
      "timeline",

    PRIVACY:
      "privacy",
  });


/* ============================================================
 * FAQ OBJECTIVES
 * ============================================================
 */

export const FAQ_OBJECTIVE =
  Object.freeze({
    INFORM:
      "inform",

    VERIFY_EVIDENCE:
      "verify_evidence",

    CHECK_CURRENT_STATUS:
      "check_current_status",

    DISCOVER_PROJECT:
      "discover_project",

    DISCOVER_SERVICE:
      "discover_service",

    CHECK_SERVICE_FIT:
      "check_service_fit",

    MATCH_PROBLEM:
      "match_problem",

    CLARIFY_PROBLEM:
      "clarify_problem",

    NAVIGATE_PUBLICATION:
      "navigate_publication",

    CHECK_CERTIFICATION_STATUS:
      "check_certification_status",

    START_DIAGNOSTIC:
      "start_diagnostic",

    CONTACT:
      "contact",

    BOOK:
      "book",

    UNDERSTAND_PRIVACY:
      "understand_privacy",

    REDIRECT_COMMERCIAL:
      "redirect_commercial",
  });


/* ============================================================
 * ANSWER MODES
 * ============================================================
 */

export const FAQ_ANSWER_MODE =
  Object.freeze({
    DIRECT:
      "direct",

    QUALIFIED:
      "qualified",

    DISCOVERY:
      "discovery",

    SAFE_REDIRECT:
      "safe_redirect",
  });


/* ============================================================
 * TOPIC MODES
 * ============================================================
 */

export const FAQ_TOPIC_MODE =
  Object.freeze({
    PROFILE:
      "profile",

    EXPERIENCE:
      "experience",

    BUSINESS_AREA:
      "business_area",

    TECHNOLOGY:
      "technology",

    CAPABILITY:
      "capability",

    PROJECT:
      "project",

    SERVICE:
      "service",

    PROBLEM:
      "problem",

    PUBLICATION:
      "publication",

    CERTIFICATION:
      "certification",

    DIAGNOSTIC:
      "diagnostic",

    CONTACT:
      "contact",

    BOOKING:
      "booking",

    PRIVACY:
      "privacy",
  });


/* ============================================================
 * FREEZE HELPERS
 * ============================================================
 */

function freezeTopic(
  topic,
) {
  return Object.freeze({
    ...topic,

    knowledgeIds:
      Object.freeze([
        ...topic.knowledgeIds,
      ]),

    tags:
      Object.freeze([
        ...(topic.tags ?? []),
      ]),
  });
}


function freezeFaq(
  faq,
) {
  return Object.freeze({
    ...faq,

    knowledgeIds:
      Object.freeze([
        ...faq.knowledgeIds,
      ]),

    tags:
      Object.freeze([
        ...faq.tags,
      ]),
  });
}


/* ============================================================
 * TOPIC DEFINITIONS
 *
 * 50 topics × 4 questions = 200 FAQ
 * ============================================================
 */

export const faqTopicSpecs =
  Object.freeze([

    /* 01 */
    freezeTopic({
      id:
        "topic-profile-victor",

      mode:
        FAQ_TOPIC_MODE.PROFILE,

      subject:
        "Víctor",

      intent:
        FAQ_INTENT.ABOUT_VICTOR,

      knowledgeIds: [
        "profile-victor",
      ],

      tags: [
        "profile",
        "identity",
      ],
    }),


    /* 02 */
    freezeTopic({
      id:
        "topic-experience-accenture-2004",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "los inicios profesionales de Víctor en Accenture",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-accenture-2004",
      ],

      tags: [
        "experience",
        "accenture",
        "career",
      ],
    }),


    /* 03 */
    freezeTopic({
      id:
        "topic-experience-core-banking",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "su etapa de core banking y migraciones",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-accenture-2005-2011",
      ],

      tags: [
        "experience",
        "banking",
        "migration",
      ],
    }),


    /* 04 */
    freezeTopic({
      id:
        "topic-experience-frankfurt",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "su experiencia profesional en Frankfurt",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-altran-frankfurt-2011-2012",
      ],

      tags: [
        "experience",
        "oracle",
        "cobol",
      ],
    }),


    /* 05 */
    freezeTopic({
      id:
        "topic-experience-everis",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "su etapa en everis",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-everis-2012-2014",
      ],

      tags: [
        "experience",
        "teams",
        "leadership",
      ],
    }),


    /* 06 */
    freezeTopic({
      id:
        "topic-experience-capital-markets",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "su experiencia en Capital Markets",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-accenture-capital-markets-2018-2023",
      ],

      tags: [
        "experience",
        "capital-markets",
      ],
    }),


    /* 07 */
    freezeTopic({
      id:
        "topic-experience-current",

      mode:
        FAQ_TOPIC_MODE.EXPERIENCE,

      subject:
        "su trabajo profesional actual",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "experience-banco-sabadell-2023-current",
      ],

      tags: [
        "experience",
        "current",
        "data",
        "bi",
      ],
    }),


    /* 08 */
    freezeTopic({
      id:
        "topic-business-area-banking",

      mode:
        FAQ_TOPIC_MODE.BUSINESS_AREA,

      subject:
        "banca",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "business-area-banking",
      ],

      tags: [
        "banking",
        "business-area",
      ],
    }),


    /* 09 */
    freezeTopic({
      id:
        "topic-business-area-financial-markets",

      mode:
        FAQ_TOPIC_MODE.BUSINESS_AREA,

      subject:
        "mercados financieros",

      intent:
        FAQ_INTENT.EXPERIENCE,

      knowledgeIds: [
        "business-area-financial-markets",
      ],

      tags: [
        "financial-markets",
        "business-area",
      ],
    }),


    /* 10 */
    freezeTopic({
      id:
        "topic-technology-cobol",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "COBOL",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-cobol",
      ],

      tags: [
        "technology",
        "cobol",
        "mainframe",
      ],
    }),


    /* 11 */
    freezeTopic({
      id:
        "topic-technology-power-bi",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Power BI",

      intent:
        FAQ_INTENT.POWERBI,

      knowledgeIds: [
        "technology-power-bi",
      ],

      tags: [
        "technology",
        "power-bi",
      ],
    }),


    /* 12 */
    freezeTopic({
      id:
        "topic-technology-power-query",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Power Query",

      intent:
        FAQ_INTENT.POWERBI,

      knowledgeIds: [
        "technology-power-query",
      ],

      tags: [
        "technology",
        "power-query",
      ],
    }),


    /* 13 */
    freezeTopic({
      id:
        "topic-technology-dax",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "DAX",

      intent:
        FAQ_INTENT.POWERBI,

      knowledgeIds: [
        "technology-dax",
      ],

      tags: [
        "technology",
        "dax",
      ],
    }),


    /* 14 */
    freezeTopic({
      id:
        "topic-technology-excel",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Excel",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-excel",
      ],

      tags: [
        "technology",
        "excel",
      ],
    }),


    /* 15 */
    freezeTopic({
      id:
        "topic-technology-python",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Python",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-python",
      ],

      tags: [
        "technology",
        "python",
      ],
    }),


    /* 16 */
    freezeTopic({
      id:
        "topic-technology-sql-oracle",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "SQL y Oracle",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-sql",
        "technology-oracle",
      ],

      tags: [
        "technology",
        "sql",
        "oracle",
      ],
    }),


    /* 17 */
    freezeTopic({
      id:
        "topic-technology-sas-microstrategy",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "SAS y MicroStrategy",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-sas",
        "technology-microstrategy",
      ],

      tags: [
        "technology",
        "sas",
        "microstrategy",
      ],
    }),


    /* 18 */
    freezeTopic({
      id:
        "topic-technology-access-vba-vbs",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Access, VBA y VBS",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-access",
        "technology-vba",
        "technology-vbs",
      ],

      tags: [
        "technology",
        "access",
        "vba",
        "vbs",
      ],
    }),


    /* 19 */
    freezeTopic({
      id:
        "topic-technology-copilot",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Copilot",

      intent:
        FAQ_INTENT.AI_PROJECT,

      knowledgeIds: [
        "technology-copilot",
      ],

      tags: [
        "technology",
        "copilot",
        "ai",
      ],
    }),


    /* 20 */
    freezeTopic({
      id:
        "topic-technology-power-automate",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Power Automate",

      intent:
        FAQ_INTENT.POWER_PLATFORM,

      knowledgeIds: [
        "technology-power-automate",
      ],

      tags: [
        "technology",
        "power-platform",
        "power-automate",
      ],
    }),


    /* 21 */
    freezeTopic({
      id:
        "topic-technology-power-apps",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Power Apps",

      intent:
        FAQ_INTENT.POWER_PLATFORM,

      knowledgeIds: [
        "technology-power-apps",
      ],

      tags: [
        "technology",
        "power-platform",
        "power-apps",
      ],
    }),


    /* 22 */
    freezeTopic({
      id:
        "topic-technology-ai",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "inteligencia artificial",

      intent:
        FAQ_INTENT.AI_PROJECT,

      knowledgeIds: [
        "technology-ai",
      ],

      tags: [
        "technology",
        "ai",
      ],
    }),


    /* 23 */
    freezeTopic({
      id:
        "topic-technology-qlik",

      mode:
        FAQ_TOPIC_MODE.TECHNOLOGY,

      subject:
        "Qlik",

      intent:
        FAQ_INTENT.TECHNOLOGIES,

      knowledgeIds: [
        "technology-qlik",
      ],

      tags: [
        "technology",
        "qlik",
        "negative-evidence",
      ],
    }),


    /* 24 */
    freezeTopic({
      id:
        "topic-capability-functional-analysis",

      mode:
        FAQ_TOPIC_MODE.CAPABILITY,

      subject:
        "análisis funcional",

      intent:
        FAQ_INTENT.ABOUT_VICTOR,

      knowledgeIds: [
        "capability-functional-analysis",
      ],

      tags: [
        "capability",
        "functional-analysis",
      ],
    }),


    /* 25 */
    freezeTopic({
      id:
        "topic-capability-project-management",

      mode:
        FAQ_TOPIC_MODE.CAPABILITY,

      subject:
        "gestión de proyectos",

      intent:
        FAQ_INTENT.ABOUT_VICTOR,

      knowledgeIds: [
        "capability-project-management",
      ],

      tags: [
        "capability",
        "project-management",
      ],
    }),


    /* 26 */
    freezeTopic({
      id:
        "topic-capability-testing",

      mode:
        FAQ_TOPIC_MODE.CAPABILITY,

      subject:
        "testing y validación",

      intent:
        FAQ_INTENT.ABOUT_VICTOR,

      knowledgeIds: [
        "capability-testing",
        "capability-uat",
      ],

      tags: [
        "capability",
        "testing",
        "uat",
      ],
    }),


    /* 27 */
    freezeTopic({
      id:
        "topic-capability-data-migration",

      mode:
        FAQ_TOPIC_MODE.CAPABILITY,

      subject:
        "migraciones de datos y sistemas",

      intent:
        FAQ_INTENT.ABOUT_VICTOR,

      knowledgeIds: [
        "capability-data-migration",
      ],

      tags: [
        "capability",
        "migration",
      ],
    }),


    /* 28 */
    freezeTopic({
      id:
        "topic-project-business-cost-intelligence",

      mode:
        FAQ_TOPIC_MODE.PROJECT,

      subject:
        "Business Cost Intelligence",

      intent:
        FAQ_INTENT.PROJECTS,

      knowledgeIds: [
        "project-business-cost-intelligence",
      ],

      tags: [
        "project",
        "documents",
        "data",
      ],
    }),


    /* 29 */
    freezeTopic({
      id:
        "topic-project-auditoria-digital",

      mode:
        FAQ_TOPIC_MODE.PROJECT,

      subject:
        "Auditoría Digital CV",

      intent:
        FAQ_INTENT.PROJECTS,

      knowledgeIds: [
        "project-auditoria-digital-cv",
      ],

      tags: [
        "project",
        "web",
        "scoring",
      ],
    }),


    /* 30 */
    freezeTopic({
      id:
        "topic-project-investment-dashboard",

      mode:
        FAQ_TOPIC_MODE.PROJECT,

      subject:
        "Investment Dashboard con IA",

      intent:
        FAQ_INTENT.PROJECTS,

      knowledgeIds: [
        "project-investment-dashboard-ai",
      ],

      tags: [
        "project",
        "finance",
        "ai",
        "in-development",
      ],
    }),


    /* 31 */
    freezeTopic({
      id:
        "topic-project-digital-competency",

      mode:
        FAQ_TOPIC_MODE.PROJECT,

      subject:
        "Modelo de Evaluación de Competencias Digitales",

      intent:
        FAQ_INTENT.PROJECTS,

      knowledgeIds: [
        "project-digital-competency-evaluation",
      ],

      tags: [
        "project",
        "excel",
        "scoring",
      ],
    }),


    /* 32 */
    freezeTopic({
      id:
        "topic-service-bi",

      mode:
        FAQ_TOPIC_MODE.SERVICE,

      subject:
        "Dashboards y Business Intelligence",

      intent:
        FAQ_INTENT.SERVICES,

      knowledgeIds: [
        "service-business-intelligence-dashboards",
      ],

      tags: [
        "service",
        "bi",
      ],
    }),


    /* 33 */
    freezeTopic({
      id:
        "topic-service-excel",

      mode:
        FAQ_TOPIC_MODE.SERVICE,

      subject:
        "Excel avanzado y modelos de negocio",

      intent:
        FAQ_INTENT.SERVICES,

      knowledgeIds: [
        "service-excel-business-models",
      ],

      tags: [
        "service",
        "excel",
      ],
    }),


    /* 34 */
    freezeTopic({
      id:
        "topic-service-automation",

      mode:
        FAQ_TOPIC_MODE.SERVICE,

      subject:
        "automatización de procesos y datos",

      intent:
        FAQ_INTENT.SERVICES,

      knowledgeIds: [
        "service-data-process-automation",
      ],

      tags: [
        "service",
        "automation",
      ],
    }),


    /* 35 */
    freezeTopic({
      id:
        "topic-service-ai",

      mode:
        FAQ_TOPIC_MODE.SERVICE,

      subject:
        "análisis de procesos y oportunidades con IA",

      intent:
        FAQ_INTENT.SERVICES,

      knowledgeIds: [
        "service-ai-process-analysis",
      ],

      tags: [
        "service",
        "ai",
      ],
    }),


    /* 36 */
    freezeTopic({
      id:
        "topic-problem-multiple-excel",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "muchos archivos Excel que tengo que unir manualmente",

      intent:
        FAQ_INTENT.EXCEL_PROBLEM,

      knowledgeIds: [
        "problem-multiple-excel-files",
      ],

      tags: [
        "problem",
        "excel",
        "consolidation",
      ],
    }),


    /* 37 */
    freezeTopic({
      id:
        "topic-problem-reporting",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "informes que tengo que rehacer todas las semanas",

      intent:
        FAQ_INTENT.REPORTING_PROBLEM,

      knowledgeIds: [
        "problem-repetitive-reporting",
      ],

      tags: [
        "problem",
        "reporting",
      ],
    }),


    /* 38 */
    freezeTopic({
      id:
        "topic-problem-dashboard-refresh",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "un dashboard que actualizo manualmente",

      intent:
        FAQ_INTENT.REPORTING_PROBLEM,

      knowledgeIds: [
        "problem-manual-dashboard-refresh",
      ],

      tags: [
        "problem",
        "dashboard",
        "power-bi",
      ],
    }),


    /* 39 */
    freezeTopic({
      id:
        "topic-problem-pdf",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "datos que tengo que extraer manualmente de PDFs",

      intent:
        FAQ_INTENT.AUTOMATION,

      knowledgeIds: [
        "problem-manual-pdf-extraction",
        "problem-unstructured-documents",
      ],

      tags: [
        "problem",
        "pdf",
        "documents",
      ],
    }),


    /* 40 */
    freezeTopic({
      id:
        "topic-problem-weighted-evaluation",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "un modelo Excel con reglas, puntuaciones y pesos",

      intent:
        FAQ_INTENT.EXCEL_PROBLEM,

      knowledgeIds: [
        "problem-scoring-rules",
        "problem-complex-weighted-evaluation",
      ],

      tags: [
        "problem",
        "scoring",
        "excel",
      ],
    }),


    /* 41 */
    freezeTopic({
      id:
        "topic-problem-web-scoring",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "muchas webs que necesito revisar y puntuar",

      intent:
        FAQ_INTENT.AUTOMATION,

      knowledgeIds: [
        "problem-web-data-collection",
        "problem-web-scoring-audit",
      ],

      tags: [
        "problem",
        "web",
        "scoring",
      ],
    }),


    /* 42 */
    freezeTopic({
      id:
        "topic-problem-financial-analysis",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "datos financieros que quiero analizar y monitorizar",

      intent:
        FAQ_INTENT.DATA_ANALYSIS,

      knowledgeIds: [
        "problem-financial-analysis",
      ],

      tags: [
        "problem",
        "finance",
        "analysis",
      ],
    }),


    /* 43 */
    freezeTopic({
      id:
        "topic-problem-ai-opportunity",

      mode:
        FAQ_TOPIC_MODE.PROBLEM,

      subject:
        "un proceso donde creo que podría utilizar IA",

      intent:
        FAQ_INTENT.AI_PROJECT,

      knowledgeIds: [
        "problem-ai-process-opportunity",
      ],

      tags: [
        "problem",
        "ai",
        "discovery",
      ],
    }),


    /* 44 */
    freezeTopic({
      id:
        "topic-publication-power-bi",

      mode:
        FAQ_TOPIC_MODE.PUBLICATION,

      subject:
        "Power BI",

      intent:
        FAQ_INTENT.PUBLICATIONS,

      knowledgeIds: [
        "publication-dataverso-power-bi",
      ],

      tags: [
        "publication",
        "dataverso",
        "power-bi",
      ],
    }),


    /* 45 */
    freezeTopic({
      id:
        "topic-publication-power-query",

      mode:
        FAQ_TOPIC_MODE.PUBLICATION,

      subject:
        "Power Query",

      intent:
        FAQ_INTENT.PUBLICATIONS,

      knowledgeIds: [
        "publication-dataverso-power-query-intro",
        "publication-dataverso-power-query-home",
      ],

      tags: [
        "publication",
        "dataverso",
        "power-query",
      ],
    }),


    /* 46 */
    freezeTopic({
      id:
        "topic-certification-pl300",

      mode:
        FAQ_TOPIC_MODE.CERTIFICATION,

      subject:
        "PL-300",

      intent:
        FAQ_INTENT.CERTIFICATION,

      knowledgeIds: [
        "certification-pl300",
      ],

      tags: [
        "certification",
        "pl300",
      ],
    }),


    /* 47 */
    freezeTopic({
      id:
        "topic-diagnostic",

      mode:
        FAQ_TOPIC_MODE.DIAGNOSTIC,

      subject:
        "diagnóstico inicial",

      intent:
        FAQ_INTENT.DIAGNOSTIC,

      knowledgeIds: [
        "diagnostic-portfolio-initial",
      ],

      tags: [
        "diagnostic",
        "form",
      ],
    }),


    /* 48 */
    freezeTopic({
      id:
        "topic-contact",

      mode:
        FAQ_TOPIC_MODE.CONTACT,

      subject:
        "contacto con Víctor",

      intent:
        FAQ_INTENT.CONTACT,

      knowledgeIds: [
        "contact-victor-portfolio",
      ],

      tags: [
        "contact",
      ],
    }),


    /* 49 */
    freezeTopic({
      id:
        "topic-booking",

      mode:
        FAQ_TOPIC_MODE.BOOKING,

      subject:
        "reserva de reunión",

      intent:
        FAQ_INTENT.BOOKING,

      knowledgeIds: [
        "booking-calendly-initial-meeting",
      ],

      tags: [
        "booking",
        "calendly",
      ],
    }),


    /* 50 */
    freezeTopic({
      id:
        "topic-privacy",

      mode:
        FAQ_TOPIC_MODE.PRIVACY,

      subject:
        "privacidad del asistente",

      intent:
        FAQ_INTENT.PRIVACY,

      knowledgeIds: [
        "policy-chatbot-session-data",
        "policy-chatbot-analytics-privacy",
        "policy-chatbot-improvement-feedback",
      ],

      tags: [
        "privacy",
        "analytics",
        "session",
      ],
    }),
  ]);


/* ============================================================
 * QUESTION BLUEPRINTS
 * ============================================================
 */

function buildQuestionBlueprints(
  topic,
) {
  const subject =
    topic.subject;


  switch (topic.mode) {

    case FAQ_TOPIC_MODE.PROFILE:
      return [
        {
          question:
            "¿Quién es Víctor y a qué se dedica?",

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Cuál es el perfil profesional de Víctor?",

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Qué experiencia respalda el perfil de Víctor?",

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            "¿En qué está centrado profesionalmente Víctor ahora?",

          objective:
            FAQ_OBJECTIVE.CHECK_CURRENT_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.EXPERIENCE:
      return [
        {
          question:
            `¿Qué me puedes contar sobre ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Qué hizo Víctor durante ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Qué experiencia demostrable tiene relacionada con ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Esa experiencia de ${subject} es actual o histórica?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CURRENT_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.BUSINESS_AREA:
      return [
        {
          question:
            `¿Víctor tiene experiencia en ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué trayectoria tiene relacionada con ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Su experiencia en ${subject} es actual?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CURRENT_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué evidencia profesional hay sobre su trabajo en ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.TECHNOLOGY:
      return [
        {
          question:
            `¿Víctor trabaja con ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué experiencia tiene Víctor con ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Utiliza ${subject} actualmente a nivel profesional?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CURRENT_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué evidencia existe sobre sus conocimientos de ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.CAPABILITY:
      return [
        {
          question:
            `¿Víctor tiene experiencia en ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué evidencia respalda su capacidad de ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Dónde ha aplicado ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Se puede afirmar que domina cualquier proyecto de ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.PROJECT:
      return [
        {
          question:
            `¿En qué consiste el proyecto ${subject}?`,

          objective:
            FAQ_OBJECTIVE.DISCOVER_PROJECT,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Qué problema resuelve ${subject}?`,

          objective:
            FAQ_OBJECTIVE.DISCOVER_PROJECT,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Qué tecnologías o capacidades demuestra ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Cuál es el estado actual del proyecto ${subject}?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CURRENT_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.SERVICE:
      return [
        {
          question:
            `¿Qué incluye el servicio de ${subject}?`,

          intent:
            FAQ_INTENT.SERVICES,

          objective:
            FAQ_OBJECTIVE.DISCOVER_SERVICE,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿En qué casos puede encajar el servicio de ${subject}?`,

          intent:
            FAQ_INTENT.SERVICES,

          objective:
            FAQ_OBJECTIVE.CHECK_SERVICE_FIT,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué precio tendría un proyecto de ${subject}?`,

          intent:
            FAQ_INTENT.PRICING,

          objective:
            FAQ_OBJECTIVE.REDIRECT_COMMERCIAL,

          answerMode:
            FAQ_ANSWER_MODE.SAFE_REDIRECT,
        },

        {
          question:
            `¿Cuánto tardaría un proyecto de ${subject}?`,

          intent:
            FAQ_INTENT.TIMELINE,

          objective:
            FAQ_OBJECTIVE.REDIRECT_COMMERCIAL,

          answerMode:
            FAQ_ANSWER_MODE.SAFE_REDIRECT,
        },
      ];


    case FAQ_TOPIC_MODE.PROBLEM:
      return [
        {
          question:
            `Tengo ${subject}. ¿Cómo podría orientarme el asistente?`,

          objective:
            FAQ_OBJECTIVE.MATCH_PROBLEM,

          answerMode:
            FAQ_ANSWER_MODE.DISCOVERY,
        },

        {
          question:
            `¿Qué solución podría tener si tengo ${subject}?`,

          objective:
            FAQ_OBJECTIVE.MATCH_PROBLEM,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Víctor tiene algún caso parecido a ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Qué información necesitarías para analizar ${subject}?`,

          objective:
            FAQ_OBJECTIVE.CLARIFY_PROBLEM,

          answerMode:
            FAQ_ANSWER_MODE.DISCOVERY,
        },
      ];


    case FAQ_TOPIC_MODE.PUBLICATION:
      return [
        {
          question:
            `¿Víctor ha publicado contenido sobre ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Qué publicaciones tiene sobre ${subject}?`,

          objective:
            FAQ_OBJECTIVE.INFORM,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Dónde puedo leer sus contenidos de ${subject}?`,

          objective:
            FAQ_OBJECTIVE.NAVIGATE_PUBLICATION,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            `¿Esas publicaciones sirven como evidencia sobre ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.CERTIFICATION:
      return [
        {
          question:
            `¿Cuál es el estado de la certificación ${subject} de Víctor?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CERTIFICATION_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Víctor ya tiene obtenida la certificación ${subject}?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CERTIFICATION_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Ha realizado formación relacionada con ${subject}?`,

          objective:
            FAQ_OBJECTIVE.VERIFY_EVIDENCE,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            `¿Se puede presentar a Víctor como certificado en ${subject}?`,

          objective:
            FAQ_OBJECTIVE.CHECK_CERTIFICATION_STATUS,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.DIAGNOSTIC:
      return [
        {
          question:
            "¿En qué consiste el diagnóstico inicial?",

          objective:
            FAQ_OBJECTIVE.START_DIAGNOSTIC,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Qué información pide el diagnóstico?",

          objective:
            FAQ_OBJECTIVE.START_DIAGNOSTIC,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿El chatbot puede preparar los datos del diagnóstico?",

          objective:
            FAQ_OBJECTIVE.START_DIAGNOSTIC,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            "¿El chatbot puede enviar el diagnóstico automáticamente?",

          objective:
            FAQ_OBJECTIVE.START_DIAGNOSTIC,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.CONTACT:
      return [
        {
          question:
            "¿Cómo puedo contactar con Víctor?",

          objective:
            FAQ_OBJECTIVE.CONTACT,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Cuál es el email público de contacto de Víctor?",

          objective:
            FAQ_OBJECTIVE.CONTACT,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Puedo contactar con Víctor por LinkedIn?",

          objective:
            FAQ_OBJECTIVE.CONTACT,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿El asistente puede garantizar cuándo responderá Víctor?",

          objective:
            FAQ_OBJECTIVE.CONTACT,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.BOOKING:
      return [
        {
          question:
            "¿Cómo puedo reservar una reunión con Víctor?",

          objective:
            FAQ_OBJECTIVE.BOOK,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Cuánto dura la reunión inicial?",

          objective:
            FAQ_OBJECTIVE.BOOK,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿El chatbot sabe qué horarios están disponibles?",

          objective:
            FAQ_OBJECTIVE.BOOK,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },

        {
          question:
            "¿El chatbot puede confirmar una reunión sin Calendly?",

          objective:
            FAQ_OBJECTIVE.BOOK,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    case FAQ_TOPIC_MODE.PRIVACY:
      return [
        {
          question:
            "¿Dónde se guarda la conversación del chatbot?",

          objective:
            FAQ_OBJECTIVE.UNDERSTAND_PRIVACY,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Cuánto tiempo se conserva la conversación?",

          objective:
            FAQ_OBJECTIVE.UNDERSTAND_PRIVACY,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Se envía a Analytics el texto de lo que escribo?",

          objective:
            FAQ_OBJECTIVE.UNDERSTAND_PRIVACY,

          answerMode:
            FAQ_ANSWER_MODE.DIRECT,
        },

        {
          question:
            "¿Puede guardarse mi pregunta exacta para mejorar el chatbot?",

          objective:
            FAQ_OBJECTIVE.UNDERSTAND_PRIVACY,

          answerMode:
            FAQ_ANSWER_MODE.QUALIFIED,
        },
      ];


    default:
      throw new Error(
        `Unknown FAQ topic mode: ${topic.mode}`,
      );
  }
}


/* ============================================================
 * CORPUS BUILDER
 * ============================================================
 */

function buildFaqCorpus() {
  const corpus = [];

  let sequence = 1;


  for (
    const topic
    of faqTopicSpecs
  ) {
    const blueprints =
      buildQuestionBlueprints(
        topic,
      );


    if (
      blueprints.length !== 4
    ) {
      throw new Error(
        `${topic.id} must generate exactly 4 canonical FAQs`,
      );
    }


    for (
      const blueprint
      of blueprints
    ) {
      corpus.push(
        freezeFaq({
          id:
            `faq-${String(
              sequence,
            ).padStart(
              3,
              "0",
            )}`,

          topicId:
            topic.id,

          question:
            blueprint.question,

          expectedIntent:
            blueprint.intent ??
            topic.intent,

          knowledgeIds:
            topic.knowledgeIds,

          objective:
            blueprint.objective,

          answerMode:
            blueprint.answerMode,

          tags:
            topic.tags,
        }),
      );

      sequence += 1;
    }
  }


  return Object.freeze(
    corpus,
  );
}


/* ============================================================
 * CANONICAL FAQ CORPUS
 * ============================================================
 */

export const faqCorpus =
  buildFaqCorpus();


/* ============================================================
 * INDEXES
 * ============================================================
 */

export const faqCorpusById =
  Object.freeze(
    Object.fromEntries(
      faqCorpus.map(
        (faq) => [
          faq.id,
          faq,
        ],
      ),
    ),
  );


export const faqCorpusByTopic =
  Object.freeze(
    Object.fromEntries(
      faqTopicSpecs.map(
        (topic) => [
          topic.id,

          Object.freeze(
            faqCorpus.filter(
              (faq) =>
                faq.topicId ===
                topic.id,
            ),
          ),
        ],
      ),
    ),
  );


/* ============================================================
 * SAFE HELPERS
 * ============================================================
 */

export function getFaqById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    faqCorpusById[id] ??
    null
  );
}


export function getFaqsByTopic(
  topicId,
) {
  if (
    typeof topicId !== "string" ||
    !topicId.trim()
  ) {
    return [];
  }

  return (
    faqCorpusByTopic[
      topicId
    ] ?? []
  );
}


export function getFaqsByIntent(
  intent,
) {
  if (
    typeof intent !== "string" ||
    !intent.trim()
  ) {
    return [];
  }

  return Object.freeze(
    faqCorpus.filter(
      (faq) =>
        faq.expectedIntent ===
        intent,
    ),
  );
}


export function getFaqsByKnowledgeId(
  knowledgeId,
) {
  if (
    typeof knowledgeId !==
      "string" ||
    !knowledgeId.trim()
  ) {
    return [];
  }

  return Object.freeze(
    faqCorpus.filter(
      (faq) =>
        faq.knowledgeIds.includes(
          knowledgeId,
        ),
    ),
  );
}