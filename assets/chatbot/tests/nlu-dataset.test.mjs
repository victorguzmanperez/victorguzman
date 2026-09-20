import test
  from "node:test";

import assert
  from "node:assert/strict";


import {
  CONFIDENCE_BUCKET,
} from "../core/state.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
  analyzeMessage,
} from "../core/nlu.js";


/**
 * ============================================================
 * PREPROD.1.11 — NLU DATASET V1
 * ============================================================
 *
 * 80 frases de validación funcional.
 *
 * Objetivos:
 *
 * - medir clasificación fuera de los examples directos;
 * - detectar falsos positivos;
 * - validar multi-intent;
 * - validar confidence/fallback;
 * - validar contexto;
 * - validar entidades;
 * - preparar posterior calibración.
 *
 * IMPORTANTE:
 *
 * Este dataset NO debe adaptarse al motor únicamente
 * para poner tests verdes.
 *
 * Si un caso representa mejor la intención humana que
 * la salida actual del clasificador, corregimos el motor.
 */


const DATASET = [
  /**
   * ==========================================================
   * GREETING — 1..5
   * ==========================================================
   */

  {
    id:
      "GRT-001",

    text:
      "Hola",

    expectedPrimary:
      INTENT_IDS.GREETING,

    fallback:
      false,
  },

  {
    id:
      "GRT-002",

    text:
      "Buenas, ¿qué tal?",

    expectedPrimary:
      INTENT_IDS.GREETING,

    fallback:
      false,
  },

  {
    id:
      "GRT-003",

    text:
      "Buenos días",

    expectedPrimary:
      INTENT_IDS.GREETING,

    fallback:
      false,
  },

  {
    id:
      "GRT-004",

    text:
      "Buenas tardes",

    expectedPrimary:
      INTENT_IDS.GREETING,

    fallback:
      false,
  },

  {
    id:
      "GRT-005",

    text:
      "Hola Víctor",

    expectedPrimary:
      INTENT_IDS.GREETING,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * PORTFOLIO / EXPERIENCE — 6..12
   * ==========================================================
   */

  {
    id:
      "PRO-001",

    text:
      "¿Quién es Víctor?",

    expectedPrimary:
      INTENT_IDS.PORTFOLIO,

    fallback:
      false,
  },

  {
    id:
      "PRO-002",

    text:
      "Cuéntame un poco sobre Víctor",

    expectedPrimary:
      INTENT_IDS.PORTFOLIO,

    fallback:
      false,
  },

  {
    id:
      "PRO-003",

    text:
      "¿A qué se dedica Víctor?",

    expectedPrimary:
      INTENT_IDS.PORTFOLIO,

    fallback:
      false,
  },

  {
    id:
      "EXP-001",

    text:
      "¿Qué experiencia tiene?",

    expectedPrimary:
      INTENT_IDS.EXPERIENCE,

    fallback:
      false,
  },

  {
    id:
      "EXP-002",

    text:
      "¿Cuál es la trayectoria profesional de Víctor?",

    expectedPrimary:
      INTENT_IDS.EXPERIENCE,

    fallback:
      false,
  },

  {
    id:
      "EXP-003",

    text:
      "¿Dónde ha trabajado Víctor?",

    expectedPrimary:
      INTENT_IDS.EXPERIENCE,

    fallback:
      false,
  },

  {
    id:
      "EXP-004",

    text:
      "Quiero conocer su currículum",

    expectedPrimary:
      INTENT_IDS.EXPERIENCE,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * PROJECTS — 13..18
   * ==========================================================
   */

  {
    id:
      "PRJ-001",

    text:
      "¿Qué proyectos tiene?",

    expectedPrimary:
      INTENT_IDS.PROJECTS,

    fallback:
      false,
  },

  {
    id:
      "PRJ-002",

    text:
      "Enséñame algún proyecto de Víctor",

    expectedPrimary:
      INTENT_IDS.PROJECTS,

    fallback:
      false,
  },

  {
    id:
      "PRJ-003",

    text:
      "Quiero ver trabajos que haya hecho",

    expectedPrimary:
      INTENT_IDS.PROJECTS,

    fallback:
      false,
  },

  {
    id:
      "PRJ-004",

    text:
      "¿Tiene algún caso real que pueda ver?",

    expectedPrimary:
      INTENT_IDS.PROJECTS,

    fallback:
      false,
  },

  {
    id:
      "PRJ-005",

    text:
      "Muéstrame el portfolio",

    expectedPrimaryAnyOf: [
      INTENT_IDS.PROJECTS,
      INTENT_IDS.PORTFOLIO,
    ],

    fallback:
      false,
  },

  {
    id:
      "PRJ-006",

    text:
      "¿Qué ha construido Víctor?",

    expectedPrimary:
      INTENT_IDS.PROJECTS,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * SERVICES — 19..24
   * ==========================================================
   */

  {
    id:
      "SRV-001",

    text:
      "¿Qué servicios ofrece Víctor?",

    expectedPrimary:
      INTENT_IDS.SERVICES,

    fallback:
      false,
  },

  {
    id:
      "SRV-002",

    text:
      "¿En qué me puede ayudar?",

    expectedPrimary:
      INTENT_IDS.SERVICES,

    fallback:
      false,
  },

  {
    id:
      "SRV-003",

    text:
      "¿Qué soluciones ofrece para empresas?",

    expectedPrimary:
      INTENT_IDS.SERVICES,

    fallback:
      false,
  },

  {
    id:
      "SRV-004",

    text:
      "Tengo una pyme y no sé qué podría hacer Víctor por nosotros",

    expectedPrimary:
      INTENT_IDS.SERVICES,

    fallback:
      false,
  },

  {
    id:
      "SRV-005",

    text:
      "¿Qué puede hacer para mejorar nuestros procesos?",

    expectedPrimaryAnyOf: [
      INTENT_IDS.SERVICES,
      INTENT_IDS.AUTOMATION,
    ],

    fallback:
      false,
  },

  {
    id:
      "SRV-006",

    text:
      "Busco ayuda con datos y automatización",

    expectedPrimaryAnyOf: [
      INTENT_IDS.AUTOMATION,
      INTENT_IDS.SERVICES,
    ],

    requiredIntents: [
      INTENT_IDS.AUTOMATION,
    ],

    fallback:
      false,
  },


  /**
   * ==========================================================
   * AUTOMATION — 25..34
   * ==========================================================
   */

  {
    id:
      "AUT-001",

    text:
      "Quiero automatizar un proceso",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    fallback:
      false,
  },

  {
    id:
      "AUT-002",

    text:
      "Tengo una tarea que hago a mano todas las semanas",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    expectedEntities: {
      currentProcess:
        "manual",

      frequency:
        "weekly",
    },

    fallback:
      false,
  },

  {
    id:
      "AUT-003",

    text:
      "Pierdo muchísimo tiempo copiando datos de un sitio a otro",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    fallback:
      false,
  },

  {
    id:
      "AUT-004",

    text:
      "Hay un proceso repetitivo que me gustaría eliminar",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    fallback:
      false,
  },

  {
    id:
      "AUT-005",

    text:
      "Todos los meses hago exactamente los mismos pasos",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    expectedEntities: {
      frequency:
        "monthly",
    },

    fallback:
      false,
  },

  {
    id:
      "AUT-006",

    text:
      "¿Se podría hacer esto automáticamente?",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    fallback:
      false,
  },

  {
    id:
      "AUT-007",

    text:
      "Tenemos demasiado trabajo manual",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    expectedEntities: {
      currentProcess:
        "manual",
    },

    fallback:
      false,
  },

  {
    id:
      "AUT-008",

    text:
      "Necesito reducir tareas repetitivas",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    fallback:
      false,
  },

  {
    id:
      "AUT-009",

    text:
      "Quiero dejar de copiar y pegar información",

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    expectedEntities: {
      currentProcess:
        "manual",
    },

    fallback:
      false,
  },

  {
    id:
      "AUT-010",

    text:
      "Mi coche es automático",

    expectedPrimary:
      null,

    forbiddenIntents: [
      INTENT_IDS.AUTOMATION,
    ],

    fallback:
      true,
  },


  /**
   * ==========================================================
   * EXCEL — 35..41
   * ==========================================================
   */

  {
    id:
      "XLS-001",

    text:
      "Tengo un lío con varios Excel",

    expectedPrimary:
      INTENT_IDS.EXCEL_PROBLEM,

    expectedEntities: {
      tools: [
        "excel",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "XLS-002",

    text:
      "Trabajo con veinte archivos Excel distintos",

    expectedPrimary:
      INTENT_IDS.EXCEL_PROBLEM,

    expectedEntities: {
      tools: [
        "excel",
      ],

      files:
        20,
    },

    fallback:
      false,
  },

  {
    id:
      "XLS-003",

    text:
      "Tengo que unir varias hojas de cálculo",

    expectedPrimary:
      INTENT_IDS.EXCEL_PROBLEM,

    expectedEntities: {
      tools: [
        "excel",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "XLS-004",

    text:
      "Copio datos entre distintos Excel",

    expectedPrimaryAnyOf: [
      INTENT_IDS.EXCEL_PROBLEM,
      INTENT_IDS.AUTOMATION,
    ],

    requiredIntents: [
      INTENT_IDS.EXCEL_PROBLEM,
    ],

    fallback:
      false,
  },

  {
    id:
      "XLS-005",

    text:
      "¿Puede ayudarme con un fichero xlsx?",

    expectedPrimary:
      INTENT_IDS.EXCEL_PROBLEM,

    expectedEntities: {
      tools: [
        "excel",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "XLS-006",

    text:
      "Tengo problemas con Exel",

    expectedPrimary:
      INTENT_IDS.EXCEL_PROBLEM,

    expectedEntities: {
      tools: [
        "excel",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "XLS-007",

    text:
      "Quiero aprender Excel por mi cuenta",

    expectedPrimaryAnyOf: [
      INTENT_IDS.EXCEL_PROBLEM,
      null,
    ],

    forbiddenIntents: [
      INTENT_IDS.AUTOMATION,
    ],
  },


  /**
   * ==========================================================
   * REPORTING — 42..48
   * ==========================================================
   */

  {
    id:
      "RPT-001",

    text:
      "Tardo horas en preparar los informes",

    expectedPrimary:
      INTENT_IDS.REPORTING_PROBLEM,

    fallback:
      false,
  },

  {
    id:
      "RPT-002",

    text:
      "Necesito mejorar el reporting de la empresa",

    expectedPrimary:
      INTENT_IDS.REPORTING_PROBLEM,

    fallback:
      false,
  },

  {
    id:
      "RPT-003",

    text:
      "Preparamos reportes todas las semanas",

    expectedPrimary:
      INTENT_IDS.REPORTING_PROBLEM,

    expectedEntities: {
      frequency:
        "weekly",
    },

    fallback:
      false,
  },

  {
    id:
      "RPT-004",

    text:
      "Quiero montar un cuadro de mando",

    expectedPrimary:
      INTENT_IDS.REPORTING_PROBLEM,

    fallback:
      false,
  },

  {
    id:
      "RPT-005",

    text:
      "Nuestros dashboards requieren demasiado trabajo manual",

    expectedPrimaryAnyOf: [
      INTENT_IDS.REPORTING_PROBLEM,
      INTENT_IDS.AUTOMATION,
    ],

    requiredIntents: [
      INTENT_IDS.REPORTING_PROBLEM,
      INTENT_IDS.AUTOMATION,
    ],

    fallback:
      false,
  },

  {
    id:
      "RPT-006",

    text:
      "Cada mes tengo que rehacer los informes",

    expectedPrimary:
      INTENT_IDS.REPORTING_PROBLEM,

    expectedEntities: {
      frequency:
        "monthly",
    },

    fallback:
      false,
  },

  {
    id:
      "RPT-007",

    text:
      "El reporting está muy poco automatizado",

    expectedPrimaryAnyOf: [
      INTENT_IDS.REPORTING_PROBLEM,
      INTENT_IDS.AUTOMATION,
    ],

    requiredIntents: [
      INTENT_IDS.REPORTING_PROBLEM,
    ],

    fallback:
      false,
  },


  /**
   * ==========================================================
   * POWER BI — 49..55
   * ==========================================================
   */

  {
    id:
      "PBI-001",

    text:
      "¿Víctor trabaja con Power BI?",

    expectedPrimary:
      INTENT_IDS.POWER_BI,

    expectedEntities: {
      tools: [
        "power-bi",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PBI-002",

    text:
      "Necesito ayuda con PowerBI",

    expectedPrimary:
      INTENT_IDS.POWER_BI,

    expectedEntities: {
      tools: [
        "power-bi",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PBI-003",

    text:
      "Tengo que actualizar un dashboard en Power BI",

    expectedPrimary:
      INTENT_IDS.POWER_BI,

    requiredIntents: [
      INTENT_IDS.REPORTING_PROBLEM,
    ],

    expectedEntities: {
      tools: [
        "power-bi",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PBI-004",

    text:
      "¿Sabe DAX?",

    expectedPrimary:
      INTENT_IDS.POWER_BI,

    fallback:
      false,
  },

  {
    id:
      "PBI-005",

    text:
      "¿Trabaja con Power Query?",

    expectedPrimary:
      INTENT_IDS.POWER_BI,

    expectedEntities: {
      tools: [
        "power-query",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PBI-006",

    text:
      "Tengo un informe de PwerBI que quiero mejorar",

    expectedPrimaryAnyOf: [
      INTENT_IDS.POWER_BI,
      INTENT_IDS.REPORTING_PROBLEM,
    ],

    requiredIntents: [
      INTENT_IDS.POWER_BI,
    ],

    fallback:
      false,
  },

  {
    id:
      "PBI-007",

    text:
      "Todos los lunes actualizo Power BI a mano",

    expectedPrimaryAnyOf: [
      INTENT_IDS.POWER_BI,
      INTENT_IDS.AUTOMATION,
    ],

    requiredIntents: [
      INTENT_IDS.POWER_BI,
      INTENT_IDS.AUTOMATION,
    ],

    expectedEntities: {
      tools: [
        "power-bi",
      ],

      currentProcess:
        "manual",

      frequency:
        "weekly",
    },

    fallback:
      false,
  },


  /**
   * ==========================================================
   * POWER PLATFORM — 56..59
   * ==========================================================
   */

  {
    id:
      "PPL-001",

    text:
      "¿Trabaja con Power Platform?",

    expectedPrimary:
      INTENT_IDS.POWER_PLATFORM,

    fallback:
      false,
  },

  {
    id:
      "PPL-002",

    text:
      "¿Sabe usar Power Automate?",

    expectedPrimary:
      INTENT_IDS.POWER_PLATFORM,

    expectedEntities: {
      tools: [
        "power-automate",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PPL-003",

    text:
      "Necesito una app sencilla con Power Apps",

    expectedPrimary:
      INTENT_IDS.POWER_PLATFORM,

    expectedEntities: {
      tools: [
        "power-apps",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PPL-004",

    text:
      "¿Víctor utiliza Copilot?",

    expectedPrimary:
      INTENT_IDS.POWER_PLATFORM,

    expectedEntities: {
      tools: [
        "copilot",
      ],
    },

    fallback:
      false,
  },


  /**
   * ==========================================================
   * AI — 60..63
   * ==========================================================
   */

  {
    id:
      "AI-001",

    text:
      "¿Trabaja con inteligencia artificial?",

    expectedPrimary:
      INTENT_IDS.AI,

    fallback:
      false,
  },

  {
    id:
      "AI-002",

    text:
      "Quiero incorporar IA a un proceso",

    expectedPrimaryAnyOf: [
      INTENT_IDS.AI,
      INTENT_IDS.AUTOMATION,
    ],

    requiredIntents: [
      INTENT_IDS.AI,
    ],

    fallback:
      false,
  },

  {
    id:
      "AI-003",

    text:
      "¿Hace agentes de IA?",

    expectedPrimary:
      INTENT_IDS.AI,

    fallback:
      false,
  },

  {
    id:
      "AI-004",

    text:
      "Necesito automatización con inteligencia artificial",

    expectedPrimaryAnyOf: [
      INTENT_IDS.AUTOMATION,
      INTENT_IDS.AI,
    ],

    requiredIntents: [
      INTENT_IDS.AUTOMATION,
      INTENT_IDS.AI,
    ],

    fallback:
      false,
  },


  /**
   * ==========================================================
   * PYTHON — 64..66
   * ==========================================================
   */

  {
    id:
      "PY-001",

    text:
      "¿Víctor trabaja con Python?",

    expectedPrimary:
      INTENT_IDS.PYTHON,

    expectedEntities: {
      tools: [
        "python",
      ],
    },

    fallback:
      false,
  },

  {
    id:
      "PY-002",

    text:
      "¿Tiene proyectos hechos en Python?",

    expectedPrimaryAnyOf: [
      INTENT_IDS.PYTHON,
      INTENT_IDS.PROJECTS,
    ],

    requiredIntents: [
      INTENT_IDS.PYTHON,
    ],

    fallback:
      false,
  },

  {
    id:
      "PY-003",

    text:
      "Necesito procesar datos con Python",

    expectedPrimary:
      INTENT_IDS.PYTHON,

    expectedEntities: {
      tools: [
        "python",
      ],
    },

    fallback:
      false,
  },


  /**
   * ==========================================================
   * DIAGNOSTIC — 67..69
   * ==========================================================
   */

  {
    id:
      "DIA-001",

    text:
      "Quiero hacer el diagnóstico",

    expectedPrimary:
      INTENT_IDS.DIAGNOSTIC,

    fallback:
      false,
  },

  {
    id:
      "DIA-002",

    text:
      "¿Puedes analizar mi caso?",

    expectedPrimary:
      INTENT_IDS.DIAGNOSTIC,

    fallback:
      false,
  },

  {
    id:
      "DIA-003",

    text:
      "Quiero explicarte mi problema para ver qué solución tendría",

    expectedPrimaryAnyOf: [
      INTENT_IDS.DIAGNOSTIC,
      INTENT_IDS.SERVICES,
    ],

    fallback:
      false,
  },


  /**
   * ==========================================================
   * CONTACT — 70..72
   * ==========================================================
   */

  {
    id:
      "CON-001",

    text:
      "Quiero contactar con Víctor",

    expectedPrimary:
      INTENT_IDS.CONTACT,

    fallback:
      false,
  },

  {
    id:
      "CON-002",

    text:
      "¿Cómo puedo hablar con él?",

    expectedPrimary:
      INTENT_IDS.CONTACT,

    fallback:
      false,
  },

  {
    id:
      "CON-003",

    text:
      "¿Hay alguna forma de escribir a Víctor?",

    expectedPrimary:
      INTENT_IDS.CONTACT,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * BOOKING — 73..75
   * ==========================================================
   */

  {
    id:
      "BKG-001",

    text:
      "Quiero reservar una reunión",

    expectedPrimary:
      INTENT_IDS.BOOKING,

    fallback:
      false,
  },

  {
    id:
      "BKG-002",

    text:
      "¿Podemos agendar una llamada?",

    expectedPrimary:
      INTENT_IDS.BOOKING,

    fallback:
      false,
  },

  {
    id:
      "BKG-003",

    text:
      "¿Dónde está el Calendly?",

    expectedPrimary:
      INTENT_IDS.BOOKING,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * PRICING / TIMELINE — 76..78
   * ==========================================================
   */

  {
    id:
      "PRI-001",

    text:
      "¿Cuánto cobra Víctor?",

    expectedPrimary:
      INTENT_IDS.PRICING,

    fallback:
      false,
  },

  {
    id:
      "PRI-002",

    text:
      "¿Qué precio tendría un proyecto?",

    expectedPrimary:
      INTENT_IDS.PRICING,

    fallback:
      false,
  },

  {
    id:
      "TIM-001",

    text:
      "¿Cuánto tardaría en hacer un proyecto?",

    expectedPrimary:
      INTENT_IDS.TIMELINE,

    fallback:
      false,
  },


  /**
   * ==========================================================
   * MULTI-INTENT / CONTEXT / ADVERSARIAL — 79..80
   * ==========================================================
   */

  {
    id:
      "MUL-001",

    text:
      "Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI y preparar un informe",

    expectedPrimaryAnyOf: [
      INTENT_IDS.AUTOMATION,
      INTENT_IDS.EXCEL_PROBLEM,
      INTENT_IDS.POWER_BI,
    ],

    requiredIntents: [
      INTENT_IDS.AUTOMATION,
      INTENT_IDS.EXCEL_PROBLEM,
      INTENT_IDS.POWER_BI,
      INTENT_IDS.REPORTING_PROBLEM,
    ],

    expectedEntities: {
      tools: [
        "excel",
        "power-bi",
      ],

      files:
        20,

      frequency:
        "weekly",

      currentProcess:
        "manual",
    },

    fallback:
      false,
  },

  {
    id:
      "CTX-001",

    text:
      "Sí",

    context: {
      previousIntent:
        INTENT_IDS.AUTOMATION,

      currentTopic:
        "automation",
    },

    expectedPrimary:
      INTENT_IDS.AUTOMATION,

    expectedConfidenceBucket:
      CONFIDENCE_BUCKET.HIGH,

    fallback:
      false,
  },
];


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getDetectedIntents(
  analysis,
) {
  return new Set(
    [
      analysis.primaryIntent,

      ...analysis
        .secondaryIntents,
    ].filter(Boolean),
  );
}


function describeAnalysis(
  analysis,
) {
  return JSON.stringify(
    {
      primaryIntent:
        analysis.primaryIntent,

      secondaryIntents:
        analysis.secondaryIntents,

      confidence:
        analysis.confidence,

      confidenceBucket:
        analysis.confidenceBucket,

      fallbackLevel:
        analysis.fallbackLevel,

      ambiguity:
        analysis.ambiguity,

      entities:
        analysis.entities,

      candidates:
        analysis.candidates,
    },
    null,
    2,
  );
}


function assertExpectedEntities(
  expected,
  analysis,
  caseId,
) {
  if (!expected) {
    return;
  }


  const actualCase =
    analysis.entities.case;


  if (
    expected.tools
  ) {
    for (
      const tool
      of expected.tools
    ) {
      assert.equal(
        actualCase.tools
          ?.includes(
            tool,
          ),
        true,
        `${caseId}: missing tool "${tool}"`,
      );
    }
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "frequency",
      )
  ) {
    assert.equal(
      actualCase.frequency,
      expected.frequency,
      `${caseId}: wrong frequency`,
    );
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "currentProcess",
      )
  ) {
    assert.equal(
      actualCase.currentProcess,
      expected.currentProcess,
      `${caseId}: wrong currentProcess`,
    );
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "users",
      )
  ) {
    assert.equal(
      actualCase.users,
      expected.users,
      `${caseId}: wrong users count`,
    );
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "files",
      )
  ) {
    assert.equal(
      actualCase.volume?.files,
      expected.files,
      `${caseId}: wrong files volume`,
    );
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "records",
      )
  ) {
    assert.equal(
      actualCase.volume?.records,
      expected.records,
      `${caseId}: wrong records volume`,
    );
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        expected,
        "sources",
      )
  ) {
    assert.equal(
      actualCase.volume?.sources,
      expected.sources,
      `${caseId}: wrong sources volume`,
    );
  }
}


/**
 * ============================================================
 * DATASET CONTRACT
 * ============================================================
 */

assert.equal(
  DATASET.length,
  80,
  "NLU dataset must contain exactly 80 phrases",
);


const ids =
  DATASET.map(
    (entry) =>
      entry.id,
  );


assert.equal(
  new Set(ids).size,
  ids.length,
  "NLU dataset IDs must be unique",
);


/**
 * ============================================================
 * 80 DATASET TESTS
 * ============================================================
 */

for (
  const datasetCase
  of DATASET
) {
  test(
    `${datasetCase.id} — ${datasetCase.text}`,
    () => {
      const analysis =
        analyzeMessage(
          datasetCase.text,
          datasetCase.context ??
            {},
        );


      const detectedIntents =
        getDetectedIntents(
          analysis,
        );


      /**
       * PRIMARY EXACTO
       */
      if (
        Object.prototype
          .hasOwnProperty.call(
            datasetCase,
            "expectedPrimary",
          )
      ) {
        assert.equal(
          analysis.primaryIntent,
          datasetCase
            .expectedPrimary,
          [
            `${datasetCase.id}: unexpected primary intent`,
            describeAnalysis(
              analysis,
            ),
          ].join("\n"),
        );
      }


      /**
       * PRIMARY ENTRE VARIAS OPCIONES RAZONABLES
       */
      if (
        datasetCase
          .expectedPrimaryAnyOf
      ) {
        assert.equal(
          datasetCase
            .expectedPrimaryAnyOf
            .includes(
              analysis.primaryIntent,
            ),
          true,
          [
            `${datasetCase.id}: primary intent not in allowed set`,
            `Allowed: ${JSON.stringify(
              datasetCase
                .expectedPrimaryAnyOf,
            )}`,
            describeAnalysis(
              analysis,
            ),
          ].join("\n"),
        );
      }


      /**
       * INTENTS QUE DEBEN ESTAR PRESENTES,
       * SEA COMO PRIMARY O SECONDARY.
       */
      if (
        datasetCase
          .requiredIntents
      ) {
        for (
          const intent
          of datasetCase
            .requiredIntents
        ) {
          assert.equal(
            detectedIntents.has(
              intent,
            ),
            true,
            [
              `${datasetCase.id}: required intent "${intent}" not detected`,
              describeAnalysis(
                analysis,
              ),
            ].join("\n"),
          );
        }
      }


      /**
       * FALSOS POSITIVOS EXPRESAMENTE PROHIBIDOS.
       */
      if (
        datasetCase
          .forbiddenIntents
      ) {
        for (
          const intent
          of datasetCase
            .forbiddenIntents
        ) {
          assert.equal(
            detectedIntents.has(
              intent,
            ),
            false,
            [
              `${datasetCase.id}: forbidden intent "${intent}" detected`,
              describeAnalysis(
                analysis,
              ),
            ].join("\n"),
          );
        }
      }


      /**
       * FALLBACK
       */
      if (
        typeof datasetCase
          .fallback ===
        "boolean"
      ) {
        assert.equal(
          analysis.isFallback,
          datasetCase.fallback,
          [
            `${datasetCase.id}: wrong fallback state`,
            describeAnalysis(
              analysis,
            ),
          ].join("\n"),
        );
      }


      /**
       * CONFIDENCE BUCKET
       */
      if (
        datasetCase
          .expectedConfidenceBucket
      ) {
        assert.equal(
          analysis
            .confidenceBucket,
          datasetCase
            .expectedConfidenceBucket,
          [
            `${datasetCase.id}: wrong confidence bucket`,
            describeAnalysis(
              analysis,
            ),
          ].join("\n"),
        );
      }


      /**
       * ENTITIES
       */
      assertExpectedEntities(
        datasetCase
          .expectedEntities,
        analysis,
        datasetCase.id,
      );


      /**
       * CONTRATO GENERAL
       */
      assert.equal(
        typeof analysis
          .confidence,
        "number",
      );


      assert.ok(
        analysis.confidence >=
          0 &&
        analysis.confidence <=
          1,
        `${datasetCase.id}: invalid confidence`,
      );


      assert.ok(
        Object.values(
          CONFIDENCE_BUCKET,
        ).includes(
          analysis
            .confidenceBucket,
        ),
        `${datasetCase.id}: invalid confidence bucket`,
      );


      assert.ok(
        [
          FALLBACK_LEVEL.NONE,
          FALLBACK_LEVEL.CLARIFY,
          FALLBACK_LEVEL.CATEGORIES,
          FALLBACK_LEVEL.ESCALATE,
        ].includes(
          analysis.fallbackLevel,
        ),
        `${datasetCase.id}: invalid fallback level`,
      );


      assert.doesNotThrow(
        () => {
          JSON.stringify(
            analysis,
          );
        },
        `${datasetCase.id}: result must be JSON serializable`,
      );
    },
  );
}