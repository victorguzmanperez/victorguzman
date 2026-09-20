/* ============================================================
 * RESPONSE QA CORPUS
 * 1.11.22.11
 *
 * Corpus transversal de respuestas V1.
 * No sustituye al NLU ni al futuro Dialogue Manager.
 * Cada caso describe qué composer debe responder y qué contrato
 * visible/estructural debe mantenerse.
 * ============================================================
 */

export const RESPONSE_QA_ROUTE =
  Object.freeze({
    SOCIAL:
      "social",

    KNOWLEDGE_SUMMARY:
      "knowledge_summary",

    KNOWLEDGE_LIST:
      "knowledge_list",

    KNOWLEDGE_OVERVIEW:
      "knowledge_overview",

    QUALIFIED:
      "qualified",

    COMMERCIAL:
      "commercial",

    PROBLEM_FLOW:
      "problem_flow",

    OPERATIONAL:
      "operational",

    BOOKING_EVENT:
      "booking_event",

    PRIVACY:
      "privacy",

    FALLBACK:
      "fallback",
  });


export const RESPONSE_QA_FAMILY =
  Object.freeze({
    SOCIAL:
      "social",

    DIRECT_KNOWLEDGE:
      "direct_knowledge",

    OVERVIEW:
      "overview",

    QUALIFIED:
      "qualified",

    COMMERCIAL:
      "commercial",

    PROBLEM_FLOW:
      "problem_flow",

    OPERATIONAL:
      "operational",

    PRIVACY:
      "privacy",

    FALLBACK:
      "fallback",
  });


function freezeCase(item) {
  return Object.freeze({
    ...item,

    options:
      Object.freeze({
        ...(item.options ?? {}),
      }),

    expected:
      Object.freeze({
        ...(item.expected ?? {}),

        include:
          Object.freeze([
            ...(item.expected?.include ?? []),
          ]),

        exclude:
          Object.freeze([
            ...(item.expected?.exclude ?? []),
          ]),

        actionTypes:
          Object.freeze([
            ...(item.expected?.actionTypes ?? []),
          ]),

        quickReplyLabels:
          Object.freeze([
            ...(item.expected?.quickReplyLabels ?? []),
          ]),
      }),
  });
}


export const responseQaCases =
  Object.freeze([

    /* ========================================================
     * SOCIAL
     * ========================================================
     */

    {
      id:
        "SOC-001",

      family:
        RESPONSE_QA_FAMILY.SOCIAL,

      route:
        RESPONSE_QA_ROUTE.SOCIAL,

      userText:
        "Hola",

      options: {
        intent:
          "greeting",

        greetingType:
          "generic",

        context: {
          assistantIntroduced:
            false,

          allowNameQuestion:
            false,
        },
      },

      expected: {
        kind:
          "social",

        outcome:
          "social",

        include: [
          "asistente digital",
        ],
      },
    },

    {
      id:
        "SOC-002",

      family:
        RESPONSE_QA_FAMILY.SOCIAL,

      route:
        RESPONSE_QA_ROUTE.SOCIAL,

      userText:
        "Gracias",

      options: {
        intent:
          "thanks",
      },

      expected: {
        kind:
          "social",

        outcome:
          "social",
      },
    },

    {
      id:
        "SOC-003",

      family:
        RESPONSE_QA_FAMILY.SOCIAL,

      route:
        RESPONSE_QA_ROUTE.SOCIAL,

      userText:
        "Hasta luego",

      options: {
        intent:
          "goodbye",
      },

      expected: {
        kind:
          "social",

        outcome:
          "social",
      },
    },


    /* ========================================================
     * .11.2 — DIRECT KNOWLEDGE
     * ========================================================
     */

    {
      id:
        "KNW-001",

      family:
        RESPONSE_QA_FAMILY.DIRECT_KNOWLEDGE,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_SUMMARY,

      userText:
        "¿Quién es Víctor?",

      options: {
        knowledgeId:
          "profile-victor",

        intent:
          "profile",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "Profesional con trayectoria",
        ],
      },
    },

    {
      id:
        "KNW-002",

      family:
        RESPONSE_QA_FAMILY.DIRECT_KNOWLEDGE,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_SUMMARY,

      userText:
        "¿Qué experiencia tiene Víctor con Power BI?",

      options: {
        knowledgeId:
          "technology-power-bi",

        intent:
          "technologies",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "uso profesional actual",
        ],
      },
    },

    {
      id:
        "KNW-003",

      family:
        RESPONSE_QA_FAMILY.DIRECT_KNOWLEDGE,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_LIST,

      userText:
        "¿Qué proyectos tiene?",

      options: {
        knowledgeIds: [
          "project-business-cost-intelligence",
          "project-auditoria-digital-cv",
          "project-investment-dashboard-ai",
          "project-digital-competency-evaluation",
        ],

        intent:
          "projects",

        intro:
          "En el portfolio aparecen",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "Business Cost Intelligence",
          "Auditoría Digital Automatizada",
          "Investment Dashboard con IA",
          "Modelo de Evaluación de Competencias Digitales",
        ],
      },
    },

    {
      id:
        "KNW-004",

      family:
        RESPONSE_QA_FAMILY.DIRECT_KNOWLEDGE,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_LIST,

      userText:
        "¿Qué servicios ofrece Víctor?",

      options: {
        knowledgeIds: [
          "service-business-intelligence-dashboards",
          "service-excel-business-models",
          "service-data-process-automation",
          "service-ai-process-analysis",
        ],

        intent:
          "services",

        intro:
          "Los servicios publicados son",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "Dashboards y Business Intelligence",
          "Excel avanzado y modelos de negocio",
          "Automatización de procesos y datos",
          "IA aplicada a procesos y análisis",
        ],
      },
    },


    /* ========================================================
     * .11.3 — PANORAMIC / OPEN QUESTIONS
     * ========================================================
     */

    ...[
      [
        "OV-EDU-001",
        "¿Qué ha estudiado Víctor?",
      ],
      [
        "OV-EDU-002",
        "¿Qué formación tiene?",
      ],
      [
        "OV-EDU-003",
        "¿Qué estudios tiene Víctor?",
      ],
      [
        "OV-EDU-004",
        "Cuéntame su formación",
      ],
    ].map(
      ([id, userText]) => ({
        id,

        family:
          RESPONSE_QA_FAMILY.OVERVIEW,

        route:
          RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

        userText,

        expected: {
          kind:
            "knowledge",

          outcome:
            "answered",

          include: [
            "Desarrollo de Aplicaciones Informáticas",
            "Inteligencia Artificial y Big Data",
          ],

          exclude: [
            "certificación obtenida",
          ],
        },
      }),
    ),

    ...[
      [
        "OV-CAP-001",
        "¿Qué sabe hacer Víctor?",
      ],
      [
        "OV-CAP-002",
        "¿Cuáles son sus principales capacidades?",
      ],
      [
        "OV-CAP-003",
        "¿En qué áreas puede aportar?",
      ],
      [
        "OV-CAP-004",
        "¿Qué habilidades tiene?",
      ],
    ].map(
      ([id, userText]) => ({
        id,

        family:
          RESPONSE_QA_FAMILY.OVERVIEW,

        route:
          RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

        userText,

        expected: {
          kind:
            "knowledge",

          outcome:
            "answered",

          include: [
            "Business Intelligence",
            "análisis de datos",
            "automatización de procesos",
          ],

          exclude: [
            "Qlik",
            "AWS",
          ],
        },
      }),
    ),

    {
      id:
        "OV-TEC-001",

      family:
        RESPONSE_QA_FAMILY.OVERVIEW,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

      userText:
        "¿Qué tecnologías conoce Víctor?",

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "uso profesional actual",
          "experiencia profesional histórica",
          "Qlik no se presenta como experiencia",
        ],
      },
    },

    {
      id:
        "OV-TEC-002",

      family:
        RESPONSE_QA_FAMILY.OVERVIEW,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

      userText:
        "¿Con qué tecnologías trabaja?",

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "Power BI",
          "Power Query",
          "DAX",
          "Python",
        ],
      },
    },

    {
      id:
        "OV-TEC-003",

      family:
        RESPONSE_QA_FAMILY.OVERVIEW,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

      userText:
        "¿Qué tecnologías domina?",

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "No sería correcto decir que Víctor domina todas las tecnologías al mismo nivel",
        ],

        exclude: [
          "Víctor domina Qlik",
          "experto en Qlik",
          "experto en AWS",
        ],
      },
    },

    {
      id:
        "OV-TEC-004",

      family:
        RESPONSE_QA_FAMILY.OVERVIEW,

      route:
        RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW,

      userText:
        "¿Qué herramientas sabe utilizar?",

      expected: {
        kind:
          "knowledge",

        outcome:
          "answered",

        include: [
          "proyectos, formación o autoaprendizaje",
        ],
      },
    },


    /* ========================================================
     * .11.4 — QUALIFIED / TEMPORAL
     * ========================================================
     */

    {
      id:
        "QLF-001",

      family:
        RESPONSE_QA_FAMILY.QUALIFIED,

      route:
        RESPONSE_QA_ROUTE.QUALIFIED,

      userText:
        "¿Víctor tiene experiencia con Qlik Sense?",

      options: {
        knowledgeId:
          "technology-qlik",

        intent:
          "technologies",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "qualified",

        include: [
          "No tengo base",
          "experiencia profesional",
        ],

        exclude: [
          "sí tiene experiencia",
          "experto",
        ],
      },
    },

    {
      id:
        "QLF-002",

      family:
        RESPONSE_QA_FAMILY.QUALIFIED,

      route:
        RESPONSE_QA_ROUTE.QUALIFIED,

      userText:
        "¿Víctor tiene experiencia con AWS?",

      options: {
        knowledgeId:
          "technology-aws",

        intent:
          "technologies",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "qualified",

        include: [
          "formación en AWS",
          "no equivale a experiencia profesional",
        ],
      },
    },

    {
      id:
        "QLF-003",

      family:
        RESPONSE_QA_FAMILY.QUALIFIED,

      route:
        RESPONSE_QA_ROUTE.QUALIFIED,

      userText:
        "¿Víctor trabaja actualmente con COBOL?",

      options: {
        knowledgeId:
          "technology-cobol",

        intent:
          "technologies",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "qualified",

        include: [
          "histórica",
        ],

        exclude: [
          "trabaja actualmente con COBOL",
        ],
      },
    },

    {
      id:
        "QLF-004",

      family:
        RESPONSE_QA_FAMILY.QUALIFIED,

      route:
        RESPONSE_QA_ROUTE.QUALIFIED,

      userText:
        "¿Víctor tiene la certificación PL-300?",

      options: {
        knowledgeId:
          "certification-pl300",

        intent:
          "certifications",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "qualified",

        include: [
          "está preparando",
          "aún no consta como obtenida",
        ],

        exclude: [
          "está certificado",
        ],
      },
    },

    {
      id:
        "QLF-005",

      family:
        RESPONSE_QA_FAMILY.QUALIFIED,

      route:
        RESPONSE_QA_ROUTE.QUALIFIED,

      userText:
        "¿Investment Dashboard ya está terminado?",

      options: {
        knowledgeId:
          "project-investment-dashboard-ai",

        intent:
          "projects",
      },

      expected: {
        kind:
          "knowledge",

        outcome:
          "qualified",

        include: [
          "está desarrollando",
          "Todavía no es una versión final",
        ],

        exclude: [
          "está terminado",
        ],
      },
    },


    /* ========================================================
     * .11.5 — COMMERCIAL SAFETY
     * ========================================================
     */

    ...[
      [
        "COM-001",
        "¿Cuánto cobra Víctor?",
        "commercial_redirect",
        "redirected",
        ["depende del alcance"],
        ["open-contact"],
      ],
      [
        "COM-002",
        "¿Cuánto tardaría en hacerlo?",
        "commercial_redirect",
        "redirected",
        ["depende del alcance"],
        ["open-contact"],
      ],
      [
        "COM-003",
        "¿Víctor puede empezar mañana?",
        "commercial_redirect",
        "redirected",
        ["No puedo confirmar la disponibilidad"],
        ["open-contact"],
      ],
      [
        "COM-004",
        "¿Víctor aceptaría mi proyecto?",
        "commercial_redirect",
        "redirected",
        ["No puedo confirmar"],
        ["open-contact"],
      ],
      [
        "COM-005",
        "¿Esto se puede automatizar?",
        "discovery",
        "qualified",
        ["revisar"],
        ["start-diagnostic"],
      ],
      [
        "COM-006",
        "¿Esto encaja con sus servicios?",
        "discovery",
        "qualified",
        ["diagnóstico"],
        ["start-diagnostic"],
      ],
      [
        "COM-007",
        "¿Qué resultado conseguiré?",
        "discovery",
        "qualified",
        ["prometer un resultado concreto"],
        ["start-diagnostic"],
      ],
      [
        "COM-008",
        "¿Cuánto me ahorraré?",
        "discovery",
        "qualified",
        ["No puedo prometer un ahorro"],
        ["start-diagnostic"],
      ],
    ].map(
      ([
        id,
        userText,
        kind,
        outcome,
        include,
        actionTypes,
      ]) => ({
        id,

        family:
          RESPONSE_QA_FAMILY.COMMERCIAL,

        route:
          RESPONSE_QA_ROUTE.COMMERCIAL,

        userText,

        expected: {
          kind,
          outcome,
          include,
          actionTypes,
        },
      }),
    ),


    /* ========================================================
     * .11.6 — PROBLEM → SOLUTION → SERVICE
     * ========================================================
     */

    {
      id:
        "PSS-001",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "reporting",
          "preparación y actualización de los datos",
        ],
      },
    },

    {
      id:
        "PSS-002",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Necesito extraer datos de PDF automáticamente.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "extraer la información útil",
          "documentos",
        ],
      },
    },

    {
      id:
        "PSS-003",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Necesito auditar webs de muchas empresas.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "revisión manual de muchas webs",
          "recogida estructurada",
        ],
      },
    },

    {
      id:
        "PSS-004",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Quiero analizar dividendos y comparar activos.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "datos y seguimiento",
          "propio análisis",
        ],
      },
    },

    {
      id:
        "PSS-005",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Tenemos reglas de evaluación con pesos y subcompetencias en Excel.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "evaluación",
        ],
      },
    },

    {
      id:
        "PSS-006",

      family:
        RESPONSE_QA_FAMILY.PROBLEM_FLOW,

      route:
        RESPONSE_QA_ROUTE.PROBLEM_FLOW,

      userText:
        "Quiero usar IA pero no sé en qué proceso tiene sentido.",

      expected: {
        kind:
          "discovery",

        outcome:
          "qualified",

        include: [
          "IA",
        ],
      },
    },


    /* ========================================================
     * .11.7 — OPERATIONAL
     * ========================================================
     */

    {
      id:
        "OPS-001",

      family:
        RESPONSE_QA_FAMILY.OPERATIONAL,

      route:
        RESPONSE_QA_ROUTE.OPERATIONAL,

      userText:
        "Quiero explicarte mi problema para ver qué solución tendría",

      expected: {
        kind:
          "action",

        outcome:
          "answered",

        include: [
          "diagnóstico breve",
          "consentimiento",
          "tampoco se enviará automáticamente",
        ],

        actionTypes: [
          "start-diagnostic",
        ],
      },
    },

    {
      id:
        "OPS-002",

      family:
        RESPONSE_QA_FAMILY.OPERATIONAL,

      route:
        RESPONSE_QA_ROUTE.OPERATIONAL,

      userText:
        "Quiero contactar con Víctor",

      expected: {
        kind:
          "action",

        outcome:
          "answered",

        include: [
          "victorguzman.data.pro@gmail.com",
          "LinkedIn",
        ],

        actionTypes: [
          "open-contact",
        ],
      },
    },

    {
      id:
        "OPS-003",

      family:
        RESPONSE_QA_FAMILY.OPERATIONAL,

      route:
        RESPONSE_QA_ROUTE.OPERATIONAL,

      userText:
        "Quiero reservar una reunión",

      expected: {
        kind:
          "action",

        outcome:
          "answered",

        include: [
          "30 minutos",
          "Calendly",
        ],

        actionTypes: [
          "open-calendly",
        ],
      },
    },

    {
      id:
        "OPS-004",

      family:
        RESPONSE_QA_FAMILY.OPERATIONAL,

      route:
        RESPONSE_QA_ROUTE.BOOKING_EVENT,

      userText:
        "calendly.event_scheduled",

      options: {
        eventName:
          "calendly.event_scheduled",
      },

      expected: {
        kind:
          "action",

        outcome:
          "answered",

        include: [
          "ha quedado reservada",
        ],
      },
    },


    /* ========================================================
     * .11.8 — PRIVACY
     * ========================================================
     */

    ...[
      [
        "PRV-001",
        "¿Cómo funciona la privacidad?",
        ["sessionStorage", "8 horas", "Analytics"],
      ],
      [
        "PRV-002",
        "¿Guardáis mi conversación?",
        ["sessionStorage", "transcripción central"],
      ],
      [
        "PRV-003",
        "¿Mandáis mis datos a Google Analytics?",
        ["nombre", "email", "teléfono", "pregunta literal"],
      ],
      [
        "PRV-004",
        "¿Usáis mis preguntas para mejorar el asistente?",
        ["opcional", "consentimiento explícito"],
      ],
      [
        "PRV-005",
        "¿Compartís mis datos con terceros?",
        ["Formspree", "Calendly", "cuando tú los inicias"],
      ],
      [
        "PRV-006",
        "¿Puedo borrar la conversación?",
        ["reiniciar la conversación", "eliminar los datos conversacionales"],
      ],
    ].map(
      ([id, userText, include]) => ({
        id,

        family:
          RESPONSE_QA_FAMILY.PRIVACY,

        route:
          RESPONSE_QA_ROUTE.PRIVACY,

        userText,

        expected: {
          kind:
            "privacy",

          outcome:
            "answered",

          include,
        },
      }),
    ),


    /* ========================================================
     * .11.9 — FALLBACKS / INTERACTIONS
     * ========================================================
     */

    {
      id:
        "FBK-001",

      family:
        RESPONSE_QA_FAMILY.FALLBACK,

      route:
        RESPONSE_QA_ROUTE.FALLBACK,

      userText:
        "asdfgh qwerty",

      options: {
        fallbackLevel:
          1,
      },

      expected: {
        kind:
          "fallback",

        outcome:
          "fallback",

        include: [
          "otra forma",
        ],
      },
    },

    {
      id:
        "FBK-002",

      family:
        RESPONSE_QA_FAMILY.FALLBACK,

      route:
        RESPONSE_QA_ROUTE.FALLBACK,

      userText:
        "asdfgh qwerty",

      options: {
        fallbackLevel:
          2,
      },

      expected: {
        kind:
          "fallback",

        outcome:
          "fallback",

        quickReplyLabels: [
          "Experiencia",
          "Tecnologías",
          "Proyectos",
          "Servicios",
        ],
      },
    },

    {
      id:
        "FBK-003",

      family:
        RESPONSE_QA_FAMILY.FALLBACK,

      route:
        RESPONSE_QA_ROUTE.FALLBACK,

      userText:
        "asdfgh qwerty",

      options: {
        fallbackLevel:
          3,
      },

      expected: {
        kind:
          "fallback",

        outcome:
          "fallback",

        include: [
          "No quiero seguir haciéndote repetir",
        ],

        actionTypes: [
          "open-contact",
        ],
      },
    },
  ].map(
    freezeCase,
  ));


export const responseQaStats =
  Object.freeze({
    total:
      responseQaCases.length,

    byFamily:
      Object.freeze(
        Object.fromEntries(
          Object.values(
            RESPONSE_QA_FAMILY,
          ).map(
            (family) => [
              family,
              responseQaCases.filter(
                (item) =>
                  item.family === family,
              ).length,
            ],
          ),
        ),
      ),
  });