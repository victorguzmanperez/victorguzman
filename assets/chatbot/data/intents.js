/**
 * Asistente de Víctor
 * Catálogo declarativo de intents.
 *
 * PREPROD.1.11.10 — Intent scorer
 *
 * IMPORTANTE:
 * - aquí viven datos;
 * - aquí no vive lógica de clasificación;
 * - añadir un intent no debe obligar a modificar nlu.js.
 */

function freezeIntent(intent) {
  return Object.freeze({
    ...intent,

    examples:
      Object.freeze([
        ...(intent.examples ?? []),
      ]),

    keywords:
      Object.freeze([
        ...(intent.keywords ?? []),
      ]),

    concepts:
      Object.freeze([
        ...(intent.concepts ?? []),
      ]),

    requiredTerms:
      Object.freeze([
        ...(intent.requiredTerms ?? []),
      ]),

    negativeTerms:
      Object.freeze([
        ...(intent.negativeTerms ?? []),
      ]),

    contextBoost:
      Object.freeze({
        ...(intent.contextBoost ?? {}),
      }),

    weights:
      Object.freeze({
        example:
          5,

        keyword:
          2,

        concept:
          2.5,

        required:
          2,

        context:
          1.5,

        negative:
          5,

        ...(intent.weights ?? {}),
      }),
  });
}


export const INTENT_IDS =
  Object.freeze({
    GREETING:
      "greeting",

    THANKS:
      "thanks",

    GOODBYE:
      "goodbye",

    EDUCATION:
      "education",

    CAPABILITIES:
      "capabilities",

    TECHNOLOGIES:
      "technologies",

    PORTFOLIO:
      "portfolio_overview",

    EXPERIENCE:
      "experience",

    PROJECTS:
      "projects",

    SERVICES:
      "services",

    AUTOMATION:
      "automation",

    EXCEL_PROBLEM:
      "excel_problem",

    REPORTING_PROBLEM:
      "reporting_problem",

    POWER_BI:
      "powerbi",

    POWER_PLATFORM:
      "power_platform",

    AI:
      "ai",

    PYTHON:
      "python",

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
  });


export const intents =
  Object.freeze([
    freezeIntent({
      id:
        INTENT_IDS.GREETING,

      priority:
        100,

      examples: [
        "hola",
        "buenos dias",
        "buenas tardes",
        "buenas",
        "que tal",
      ],

      keywords: [
        "hola",
        "buenas",
        "saludos",
      ],

      concepts: [
        "greeting",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


        freezeIntent({
      id:
        INTENT_IDS.THANKS,

      priority:
        99,

      examples: [
        "gracias",
        "muchas gracias",
        "te lo agradezco",
        "perfecto gracias",
        "genial gracias",
      ],

      keywords: [
        "gracias",
        "agradezco",
      ],

      concepts: [],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.GOODBYE,

      priority:
        99,

      examples: [
        "adios",
        "hasta luego",
        "hasta pronto",
        "nos vemos",
        "chao",
      ],

      keywords: [
        "adios",
        "hasta luego",
        "hasta pronto",
        "nos vemos",
        "chao",
      ],

      concepts: [],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.EDUCATION,

      priority:
        79,

      examples: [
        "que ha estudiado victor",
        "que formacion tiene victor",
        "que estudios tiene victor",
        "cuentame su formacion",
        "cual es su formacion academica",
      ],

      keywords: [
        "formacion",
        "estudios",
        "ha estudiado",
        "formacion academica",
      ],

      concepts: [],

      requiredTerms: [],

      negativeTerms: [
        "precio de la formacion",
        "curso cuesta",
      ],
    }),


    freezeIntent({
      id:
        INTENT_IDS.CAPABILITIES,

      priority:
        78,

      examples: [
        "que sabe hacer victor",
        "cuales son sus principales capacidades",
        "que capacidades tiene victor",
        "que habilidades tiene victor",
        "en que areas puede aportar",
      ],

      keywords: [
        "capacidades",
        "habilidades",
        "competencias",
        "sabe hacer",
        "puede aportar",
      ],

      concepts: [],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.TECHNOLOGIES,

      priority:
        77,

      examples: [
        "que tecnologias conoce victor",
        "con que tecnologias trabaja victor",
        "que tecnologias domina",
        "que herramientas sabe utilizar",
        "cual es su stack tecnologico",
      ],

      keywords: [
        "tecnologia",
        "tecnologias",
        "herramientas",
        "stack tecnologico",
      ],

      concepts: [],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.AUTOMATION,

      priority:
        95,

      examples: [
        "quiero automatizar un proceso",
        "hago esto manualmente cada semana",
        "quiero dejar de hacer tareas repetitivas",
        "pierdo mucho tiempo copiando datos",
        "necesito automatizar",
      ],

      keywords: [
        "automatizar",
        "automatizacion",
        "manualmente",
        "manual",
        "a mano",
        "repetitivo",
        "repetitiva",
        "repetitivos",
        "repetitivas",
        "copiar y pegar",
        "copiando datos",
        "mismos pasos",
      ],

      concepts: [
        "manual_process",
        "repetitive_process",
        "automation",
      ],

      requiredTerms: [],

      negativeTerms: [
        "coche automatico",
      ],

      contextBoost: {
        automation:
          3,

        diagnostic:
          1,
      },
    }),


    freezeIntent({
      id:
        INTENT_IDS.EXCEL_PROBLEM,

      priority:
        90,

      examples: [
        "tengo muchos excel",
        "junto varios excel manualmente",
        "copio datos entre hojas de excel",
        "tengo problemas con excel",
        "consolido ficheros excel",
      ],

      keywords: [
        "excel",
        "xlsx",
        "xls",
        "hoja de calculo",
        "hojas de calculo",
      ],

      concepts: [
        "excel",
        "spreadsheet",
        "file_consolidation",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.REPORTING_PROBLEM,

      priority:
        88,

      examples: [
        "actualizo informes manualmente",
        "tardo mucho en preparar informes",
        "necesito mejorar el reporting",
        "quiero automatizar informes",
        "preparo reportes cada semana",
      ],

      keywords: [
        "informe",
        "informes",
        "reporting",
        "reporte",
        "reportes",
        "dashboard",
        "cuadro de mando",
      ],

      concepts: [
        "reporting",
        "dashboard",
        "manual_reporting",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.POWER_BI,

      priority:
        86,

      examples: [
        "trabaja con power bi",
        "necesito ayuda con power bi",
        "actualizo power bi",
        "quiero hacer un dashboard en power bi",
      ],

      keywords: [
        "power bi",
        "powerbi",
        "dax",
        "power query",
      ],

      concepts: [
        "powerbi",
        "business_intelligence",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.POWER_PLATFORM,

      priority:
        84,

      examples: [
        "trabaja con power platform",
        "usa power automate",
        "hace aplicaciones con power apps",
        "utiliza copilot",
      ],

      keywords: [
        "power platform",
        "power automate",
        "power apps",
        "copilot",
        "microsoft fabric",
      ],

      concepts: [
        "power_platform",
        "low_code",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.AI,

      priority:
        82,

      examples: [
        "trabaja con inteligencia artificial",
        "usa ia",
        "hace proyectos de inteligencia artificial",
        "automatizaciones con ia",
      ],

      keywords: [
        "inteligencia artificial",
        "ia",
        "ai",
        "agente de ia",
        "agentes de ia",
      ],

      concepts: [
        "artificial_intelligence",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.PYTHON,

      priority:
        80,

      examples: [
        "trabaja con python",
        "usa python",
        "tiene proyectos en python",
      ],

      keywords: [
        "python",
        "pandas",
      ],

      concepts: [
        "python",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.PROJECTS,

      priority:
        76,

      examples: [
        "quiero ver los proyectos",
        "que proyectos tiene",
        "ensename proyectos",
        "que ha construido victor",
        "quiero ver trabajos que haya hecho",
        "tiene algun caso real que pueda ver",
        "muestrame el portfolio",
      ],

      keywords: [
        "proyecto",
        "proyectos",
        "portfolio",
        "caso real",
        "casos reales",
        "trabajos",
        "trabajos que haya hecho",
      ],

      concepts: [
        "projects",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.SERVICES,

      priority:
        74,

      examples: [
      "que servicios ofrece",
      "en que me puede ayudar victor",
      "que soluciones ofrece",
      "que puede hacer para mi empresa",
      "tengo una pyme y no se que podria hacer victor por nosotros",
    ],

    keywords: [
      "servicio",
      "servicios",
      "solucion",
      "soluciones",
      "ayudar",
      "que puede hacer",
      "que podria hacer",
    ],

      concepts: [
        "services",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.EXPERIENCE,

      priority:
        72,

      examples: [
        "que experiencia tiene victor",
        "cual es su experiencia",
        "donde ha trabajado",
        "que sabe hacer victor",
      ],

      keywords: [
        "experiencia",
        "trayectoria",
        "curriculum",
        "cv",
      ],

      concepts: [
        "experience",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.PORTFOLIO,

      priority:
        70,

      examples: [
        "quien es victor",
        "cuentame sobre victor",
        "que hace victor",
        "de que trata este portfolio",
      ],

      keywords: [
        "portfolio",
        "perfil",
        "quien es",
        "a que se dedica",
      ],

      concepts: [
        "profile",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.DIAGNOSTIC,

      priority:
        78,

      examples: [
        "quiero hacer el diagnostico",
        "analiza mi caso",
        "quiero explicar mi problema",
        "puedes diagnosticar mi proceso",
        "quiero explicarte mi problema",
        "quiero explicarte mi problema para ver que solucion tendria",
      ],

      keywords: [
        "diagnostico",
        "diagnosticar",
        "analiza mi caso",
        "analizar mi caso",
        "explicar mi problema",
        "explicarte mi problema",
      ],

      concepts: [
        "diagnostic",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.CONTACT,

      priority:
        76,

      examples: [
        "quiero contactar con victor",
        "como contacto con victor",
        "me puedes poner en contacto con victor",
        "puedes ponerme en contacto con victor",
        "ponme en contacto con victor",
        "quiero hablar con victor",
        "como puedo escribirle",
        "como puedo hablar con el",
        "hay alguna forma de escribir a victor",
      ],

      keywords: [
        "contactar",
        "contacto",
        "hablar con victor",
        "hablar con el",
        "escribir a victor",
        "escribirle",
      ],

      concepts: [
        "contact",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.BOOKING,

      priority:
        82,

      examples: [
        "quiero reservar una reunion",
        "quiero agendar una reunion",
        "podemos tener una reunion",
        "quiero pedir una cita",
      ],

      keywords: [
        "reunion",
        "reservar",
        "agendar",
        "calendly",
        "cita",
      ],

      concepts: [
        "booking",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.PRICING,

      priority:
        92,

      examples: [
        "cuanto cuesta",
        "que precio tiene",
        "cual es el precio",
        "cuanto cobra victor",
      ],

      keywords: [
        "precio",
        "precios",
        "cuesta",
        "coste",
        "presupuesto",
        "cobra",
      ],

      concepts: [
        "pricing",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),


    freezeIntent({
      id:
        INTENT_IDS.TIMELINE,

      priority:
        90,

      examples: [
        "cuanto tardaria",
        "cuanto tiempo necesita",
        "en cuanto tiempo estaria",
        "cuando estaria terminado",
      ],

      keywords: [
        "cuanto tarda",
        "cuanto tardaria",
        "plazo",
        "cuando estaria",
      ],

      concepts: [
        "timeline",
      ],

      requiredTerms: [],

      negativeTerms: [],
    }),
  ]);


export const intentsById =
  Object.freeze(
    Object.fromEntries(
      intents.map(
        (intent) => [
          intent.id,
          intent,
        ],
      ),
    ),
  );


export function getIntentById(
  intentId,
) {
  return (
    intentsById[intentId] ??
    null
  );
}