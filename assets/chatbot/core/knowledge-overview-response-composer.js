import {
  RESPONSE_CONTINUITY,
  RESPONSE_DEPTH,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_MESSAGE_PURPOSE,
  RESPONSE_OUTCOME,
  RESPONSE_STAGE,
  createResponseEnvelope,
} from "./response-contract.js";

import {
  EXPERIENCE_EVIDENCE,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getKnowledgeByType,
  getKnowledgeFact,
} from "../data/knowledge.js";

import {
  createAnswerQuickReply,
} from "./response-interactions.js";


/* ============================================================
 * KNOWLEDGE OVERVIEW RESPONSE COMPOSER
 * 1.11.22.11 — Response QA / panoramic responses
 *
 * Responde preguntas abiertas como:
 * - ¿Qué ha estudiado Víctor?
 * - ¿Qué sabe hacer Víctor?
 * - ¿Qué tecnologías conoce / domina?
 *
 * No sustituye al futuro Dialogue Manager.
 * Es una capa determinista de síntesis sobre Knowledge.
 * ============================================================
 */

export const KNOWLEDGE_OVERVIEW_TOPIC =
  Object.freeze({
    EDUCATION:
      "education",

    CAPABILITIES:
      "capabilities",

    TECHNOLOGIES:
      "technologies",
  });


export const KNOWLEDGE_OVERVIEW_DETAIL =
  Object.freeze({
    SUMMARY:
      "summary",

    FULL:
      "full",

    EDUCATION_TECH_DATA:
      "education_tech_data",

    EDUCATION_FINANCE_BUSINESS:
      "education_finance_business",

    CAPABILITIES_BI_DATA:
      "capabilities_bi_data",

    CAPABILITIES_AUTOMATION_AI:
      "capabilities_automation_ai",

    CAPABILITIES_DELIVERY_BUSINESS:
      "capabilities_delivery_business",

    TECHNOLOGIES_CURRENT:
      "technologies_current",

    TECHNOLOGIES_HISTORICAL:
      "technologies_historical",

    TECHNOLOGIES_SUPPORTING:
      "technologies_supporting",
  });


function safeString(value) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function normalizeText(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function humanJoin(values) {
  const clean =
    values
      .map(safeString)
      .filter(Boolean);

  if (clean.length === 0) {
    return "";
  }

  if (clean.length === 1) {
    return clean[0];
  }

  if (clean.length === 2) {
    return `${clean[0]} y ${clean[1]}`;
  }

  return (
    `${clean.slice(0, -1).join(", ")} y ${clean.at(-1)}`
  );
}


function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}


function contextFromInput(context = {}) {
  return {
    continuing:
      context.continuing === true,

    suppressRepeatedCTA:
      context.suppressRepeatedCTA !== false,
  };
}


function isCanonicalOverviewTopic(value) {
  return (
    typeof value === "string" &&
    Object.values(
      KNOWLEDGE_OVERVIEW_TOPIC,
    ).includes(value)
  );
}


const OVERVIEW_PATTERNS =
  Object.freeze({
    [KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION]:
      Object.freeze([
        "que ha estudiado",
        "que estudios tiene",
        "que formacion tiene",
        "cual es su formacion",
        "cuentame su formacion",
        "formacion academica",
      ]),

    [KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES]:
      Object.freeze([
        "que sabe hacer",
        "que capacidades tiene",
        "cuales son sus capacidades",
        "principales capacidades",
        "que habilidades tiene",
        "en que areas puede aportar",
        "que competencias tiene",
      ]),

    [KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES]:
      Object.freeze([
        "que tecnologias conoce",
        "con que tecnologias trabaja",
        "que tecnologias domina",
        "que herramientas sabe utilizar",
        "que herramientas conoce",
        "stack tecnologico",
      ]),
  });


export function detectKnowledgeOverviewTopic(userText) {
  const text =
    normalizeText(userText);

  if (!text) {
    return null;
  }

  const priority = [
    KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION,
    KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES,
    KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES,
  ];

  for (const topic of priority) {
    const patterns =
      OVERVIEW_PATTERNS[topic] ?? [];

    if (
      patterns.some(
        (pattern) =>
          text.includes(
            normalizeText(pattern),
          ),
      )
    ) {
      return topic;
    }
  }

  return null;
}


export function resolveKnowledgeOverviewTopic({
  userText,
  topic = null,
} = {}) {
  if (
    topic !== null &&
    topic !== undefined
  ) {
    return (
      isCanonicalOverviewTopic(topic)
        ? topic
        : null
    );
  }

  return detectKnowledgeOverviewTopic(userText);
}


function includesAny(text, patterns) {
  return patterns.some(
    (pattern) =>
      text.includes(
        normalizeText(pattern),
      ),
  );
}


export function resolveKnowledgeOverviewDetail({
  userText,
  topic,
} = {}) {
  const text =
    normalizeText(userText);

  if (
    !text ||
    !isCanonicalOverviewTopic(topic)
  ) {
    return (
      KNOWLEDGE_OVERVIEW_DETAIL
        .SUMMARY
    );
  }

  if (
    includesAny(
      text,
      [
        "todo el detalle",
        "detalle completo",
        "lista completa",
        "ver toda",
        "ver todas",
        "toda la formacion",
        "todas las capacidades",
        "todas las tecnologias",
      ],
    )
  ) {
    return (
      KNOWLEDGE_OVERVIEW_DETAIL
        .FULL
    );
  }

  if (
    topic ===
      KNOWLEDGE_OVERVIEW_TOPIC
        .EDUCATION
  ) {
    if (
      includesAny(
        text,
        [
          "tecnologia y datos",
          "tecnica y datos",
          "formacion tecnica",
          "datos e ia",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .EDUCATION_TECH_DATA
      );
    }

    if (
      includesAny(
        text,
        [
          "finanzas y negocio",
          "negocio y finanzas",
          "formacion financiera",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .EDUCATION_FINANCE_BUSINESS
      );
    }
  }

  if (
    topic ===
      KNOWLEDGE_OVERVIEW_TOPIC
        .CAPABILITIES
  ) {
    if (
      includesAny(
        text,
        [
          "bi y datos",
          "datos y bi",
          "business intelligence y datos",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .CAPABILITIES_BI_DATA
      );
    }

    if (
      includesAny(
        text,
        [
          "automatizacion e ia",
          "automatizacion y ia",
          "automatizacion e inteligencia artificial",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .CAPABILITIES_AUTOMATION_AI
      );
    }

    if (
      includesAny(
        text,
        [
          "entrega y negocio",
          "proyectos y negocio",
          "analisis funcional y entrega",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .CAPABILITIES_DELIVERY_BUSINESS
      );
    }
  }

  if (
    topic ===
      KNOWLEDGE_OVERVIEW_TOPIC
        .TECHNOLOGIES
  ) {
    if (
      includesAny(
        text,
        [
          "uso profesional actual",
          "usa actualmente",
          "trabaja actualmente",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .TECHNOLOGIES_CURRENT
      );
    }

    if (
      includesAny(
        text,
        [
          "experiencia historica",
          "experiencia profesional historica",
          "tecnologias historicas",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .TECHNOLOGIES_HISTORICAL
      );
    }

    if (
      includesAny(
        text,
        [
          "formacion o proyectos",
          "proyectos o formacion",
          "formacion y proyectos",
          "proyectos formacion",
        ],
      )
    ) {
      return (
        KNOWLEDGE_OVERVIEW_DETAIL
          .TECHNOLOGIES_SUPPORTING
      );
    }
  }

  return (
    KNOWLEDGE_OVERVIEW_DETAIL
      .SUMMARY
  );
}


function allItemsOfType(type) {
  return getKnowledgeByType(type) ?? [];
}


function titleById(items, id) {
  return (
    items.find(
      (item) =>
        item.id === id,
    )?.title ??
    ""
  );
}


function titlesByIds(items, ids) {
  const titles =
    ids.map(
      (id) =>
        titleById(items, id),
    );

  if (
    titles.some(
      (title) =>
        !safeString(title),
    )
  ) {
    return [];
  }

  return titles;
}


function itemsByIds(items, ids) {
  const byId =
    new Map(
      items.map(
        (item) =>
          [item.id, item],
      ),
    );

  const selected =
    ids.map(
      (id) =>
        byId.get(id) ??
        null,
    );

  return (
    selected.some(
      (item) =>
        !item,
    )
      ? []
      : selected
  );
}


function createOverviewQuickReplies(
  topic,
  detail,
) {
  const answer = (
    id,
    label,
    value,
  ) =>
    createAnswerQuickReply({
      id,
      label,
      answer:
        value,
    });

  let replies = [];

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .SUMMARY
  ) {
    switch (topic) {
      case KNOWLEDGE_OVERVIEW_TOPIC
        .EDUCATION:
        replies = [
          answer(
            "qr-edu-tech-data",
            "Tecnología y datos",
            "¿Qué formación tiene Víctor en tecnología y datos?",
          ),
          answer(
            "qr-edu-finance-business",
            "Finanzas y negocio",
            "¿Qué formación tiene Víctor en finanzas y negocio?",
          ),
          answer(
            "qr-edu-full",
            "Ver toda la formación",
            "¿Qué formación tiene Víctor? Muéstrame toda la formación.",
          ),
        ];
        break;

      case KNOWLEDGE_OVERVIEW_TOPIC
        .CAPABILITIES:
        replies = [
          answer(
            "qr-cap-bi-data",
            "BI y datos",
            "¿Qué sabe hacer Víctor en BI y datos?",
          ),
          answer(
            "qr-cap-automation-ai",
            "Automatización e IA",
            "¿Qué sabe hacer Víctor en automatización e IA?",
          ),
          answer(
            "qr-cap-delivery-business",
            "Entrega y negocio",
            "¿Qué sabe hacer Víctor en entrega y negocio?",
          ),
          answer(
            "qr-cap-full",
            "Ver todas",
            "¿Qué sabe hacer Víctor? Muéstrame todas las capacidades.",
          ),
        ];
        break;

      case KNOWLEDGE_OVERVIEW_TOPIC
        .TECHNOLOGIES:
        replies = [
          answer(
            "qr-tech-current",
            "Uso actual",
            "¿Qué tecnologías conoce Víctor con uso profesional actual?",
          ),
          answer(
            "qr-tech-historical",
            "Experiencia histórica",
            "¿Qué tecnologías conoce Víctor con experiencia histórica?",
          ),
          answer(
            "qr-tech-supporting",
            "Formación/proyectos",
            "¿Qué tecnologías conoce Víctor por formación o proyectos?",
          ),
          answer(
            "qr-tech-full",
            "Ver todas",
            "¿Qué tecnologías conoce Víctor? Muéstrame todas las tecnologías.",
          ),
        ];
        break;

      default:
        replies = [];
    }
  } else if (
    detail !==
      KNOWLEDGE_OVERVIEW_DETAIL
        .FULL
  ) {
    const fullByTopic = {
      [KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION]:
        answer(
          "qr-edu-full",
          "Ver toda la formación",
          "¿Qué formación tiene Víctor? Muéstrame toda la formación.",
        ),

      [KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES]:
        answer(
          "qr-cap-full",
          "Ver todas las capacidades",
          "¿Qué sabe hacer Víctor? Muéstrame todas las capacidades.",
        ),

      [KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES]:
        answer(
          "qr-tech-full",
          "Ver todas las tecnologías",
          "¿Qué tecnologías conoce Víctor? Muéstrame todas las tecnologías.",
        ),
    };

    replies = [
      fullByTopic[topic],
    ];
  }

  if (
    replies.some(
      (reply) =>
        !reply,
    )
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    replies,
  );
}


function collectForbiddenClaims(items) {
  return unique(
    items.flatMap(
      (item) =>
        item.answerPolicy
          ?.forbiddenClaims ??
        [],
    ),
  );
}


function composeEducationOverview(detail) {
  const items =
    allItemsOfType(
      KNOWLEDGE_TYPE.EDUCATION,
    );

  if (items.length === 0) {
    return null;
  }

  const techDataIds = [
    "education-dai-2001-2003",
    "education-ai-big-data-2021-2022",
    "education-data-scientist-2022",
    "education-power-bi-2022",
    "education-ai-business-2022-2023",
    "education-power-bi-ibm-2024",
    "education-pl300-2024",
    "education-sql-2024",
    "education-python-2024",
  ];

  const financeBusinessIds = [
    "education-marketing-online-2023",
    "education-financial-markets-2025",
    "education-wealth-management-2025",
    "education-entrepreneurship-2025",
  ];

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .SUMMARY
  ) {
    const selected =
      titlesByIds(
        items,
        [
          "education-dai-2001-2003",
          "education-ai-big-data-2021-2022",
          "education-power-bi-2022",
          "education-sql-2024",
          "education-python-2024",
          "education-financial-markets-2025",
        ],
      );

    if (selected.length === 0) {
      return null;
    }

    const [
      development,
      aiBigData,
      powerBi,
      sql,
      python,
      financialMarkets,
    ] = selected;

    return {
      text:
        `La formación de Víctor combina ${development} con ${aiBigData}, además de formación específica en ${powerBi}, ${sql} y ${python}, y formación en ${financialMarkets}. Puedes profundizar por área o ver el detalle completo.`,
      items,
      knowledgeIds:
        items.map(
          (item) =>
            item.id,
        ),
      factIds: [],
    };
  }

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .EDUCATION_TECH_DATA
  ) {
    const selectedItems =
      itemsByIds(
        items,
        techDataIds,
      );

    if (selectedItems.length === 0) {
      return null;
    }

    return {
      text:
        `En tecnología y datos constan ${humanJoin(selectedItems.map((item) => item.title))}.`,
      items:
        selectedItems,
      knowledgeIds:
        selectedItems.map(
          (item) =>
            item.id,
        ),
      factIds: [],
    };
  }

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .EDUCATION_FINANCE_BUSINESS
  ) {
    const selectedItems =
      itemsByIds(
        items,
        financeBusinessIds,
      );

    if (selectedItems.length === 0) {
      return null;
    }

    return {
      text:
        `En finanzas y negocio constan ${humanJoin(selectedItems.map((item) => item.title))}.`,
      items:
        selectedItems,
      knowledgeIds:
        selectedItems.map(
          (item) =>
            item.id,
        ),
      factIds: [],
    };
  }

  const selected =
    titlesByIds(
      items,
      [
        "education-dai-2001-2003",
        "education-ai-big-data-2021-2022",
        "education-data-scientist-2022",
        "education-power-bi-2022",
        "education-pl300-2024",
        "education-sql-2024",
        "education-python-2024",
        "education-financial-markets-2025",
        "education-wealth-management-2025",
      ],
    );

  if (selected.length === 0) {
    return null;
  }

  const [
    development,
    aiBigData,
    dataScientist,
    powerBi,
    pl300,
    sql,
    python,
    financialMarkets,
    wealthManagement,
  ] = selected;

  const text =
    (
      `La formación documentada de Víctor combina ${development} con ${aiBigData} y ${dataScientist}. ` +
      `También cuenta con formación específica en ${powerBi}, ${pl300}, ${sql} y ${python}, ` +
      `además de ${financialMarkets} y ${wealthManagement}. ` +
      "El catálogo incluye también formación complementaria en IA aplicada a la empresa, marketing/reputación online y emprendimiento."
    );

  return {
    text,
    items,
    knowledgeIds:
      items.map(
        (item) =>
          item.id,
      ),
    factIds: [],
  };
}


function composeCapabilitiesOverview(detail) {
  const items =
    allItemsOfType(
      KNOWLEDGE_TYPE.CAPABILITY,
    );

  if (items.length === 0) {
    return null;
  }

  const biDataIds = [
    "capability-business-intelligence",
    "capability-data-analysis",
    "capability-data-transformation",
    "capability-data-consolidation",
    "capability-dashboarding",
    "capability-data-quality",
    "capability-data-traceability",
    "capability-scoring-and-rules",
    "capability-hierarchical-modeling",
    "capability-financial-analysis",
  ];

  const automationAiIds = [
    "capability-reporting-automation",
    "capability-process-automation",
    "capability-document-data-extraction",
    "capability-ai-assisted-analysis",
    "capability-web-data-collection",
  ];

  const deliveryBusinessIds = [
    "capability-functional-analysis",
    "capability-requirements-analysis",
    "capability-business-technology-bridge",
    "capability-project-management",
    "capability-testing",
    "capability-uat",
    "capability-production-support",
    "capability-technical-leadership",
    "capability-performance-optimization",
    "capability-data-migration",
    "capability-stakeholder-coordination",
  ];

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .SUMMARY
  ) {
    return {
      text:
        "Las capacidades documentadas de Víctor se concentran en Business Intelligence y análisis de datos, automatización de procesos e IA aplicada, y en la entrega de soluciones desde el análisis funcional hasta testing, soporte y coordinación con negocio. Puedes profundizar por área.",
      items,
      knowledgeIds:
        items.map(
          (item) =>
            item.id,
        ),
      factIds: [],
    };
  }

  const detailIds = {
    [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_BI_DATA]:
      biDataIds,
    [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_AUTOMATION_AI]:
      automationAiIds,
    [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_DELIVERY_BUSINESS]:
      deliveryBusinessIds,
  }[detail];

  if (detailIds) {
    const selectedItems =
      itemsByIds(
        items,
        detailIds,
      );

    if (selectedItems.length === 0) {
      return null;
    }

    const intro = {
      [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_BI_DATA]:
        "En BI, datos y modelado constan",
      [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_AUTOMATION_AI]:
        "En automatización e IA constan",
      [KNOWLEDGE_OVERVIEW_DETAIL.CAPABILITIES_DELIVERY_BUSINESS]:
        "En entrega, proyectos y conexión con negocio constan",
    }[detail];

    return {
      text:
        `${intro} ${humanJoin(selectedItems.map((item) => item.title))}.`,
      items:
        selectedItems,
      knowledgeIds:
        selectedItems.map(
          (item) =>
            item.id,
        ),
      factIds: [],
    };
  }

  const requiredIds = [
    ...biDataIds,
    ...automationAiIds,
    ...deliveryBusinessIds,
  ];

  if (
    titlesByIds(
      items,
      requiredIds,
    ).length === 0
  ) {
    return null;
  }

  const text =
    (
      "Las capacidades documentadas de Víctor abarcan Business Intelligence, análisis de datos, transformación y consolidación de datos, calidad y trazabilidad; " +
      "dashboards, automatización de reporting y automatización de procesos; análisis funcional y de requisitos, puente negocio-tecnología, gestión de proyectos, testing, UAT y soporte; " +
      "y áreas aplicadas como reglas y scoring, modelado jerárquico, análisis financiero, IA asistida, recopilación web y migración de datos. " +
      "También constan liderazgo técnico, optimización de rendimiento y coordinación con negocio y equipos. No todas tienen el mismo tipo de evidencia."
    );

  return {
    text,
    items,
    knowledgeIds:
      items.map(
        (item) =>
          item.id,
      ),
    factIds: [],
  };
}


function technologyEvidence(item) {
  const categories =
    getKnowledgeFact(
      item,
      "experience-evidence",
    )?.value;

  return (
    Array.isArray(categories)
      ? categories
      : []
  );
}


function technologyBooleanFact(item, key) {
  return (
    getKnowledgeFact(
      item,
      key,
    )?.value === true
  );
}


function asksMastery(userText) {
  const text =
    normalizeText(userText);

  return [
    "domina",
    "dominio",
    "experto",
    "experta",
  ].some(
    (token) =>
      text.includes(token),
  );
}


function composeTechnologiesOverview(
  userText,
  detail,
) {
  const items =
    allItemsOfType(
      KNOWLEDGE_TYPE.TECHNOLOGY,
    );

  if (items.length === 0) {
    return null;
  }

  const current = [];
  const historical = [];
  const supporting = [];
  const noEvidence = [];

  const factIdsById =
    new Map();

  for (const item of items) {
    const currentProfessional =
      technologyBooleanFact(
        item,
        "professional-current",
      );

    const historicalProfessional =
      technologyBooleanFact(
        item,
        "professional-historical",
      );

    const evidence =
      technologyEvidence(item);

    const relatedFactIds = [
      getKnowledgeFact(
        item,
        "professional-current",
      )?.id,
      getKnowledgeFact(
        item,
        "professional-historical",
      )?.id,
      getKnowledgeFact(
        item,
        "experience-evidence",
      )?.id,
    ].filter(Boolean);

    factIdsById.set(
      item.id,
      relatedFactIds,
    );

    if (
      evidence.includes(
        EXPERIENCE_EVIDENCE.NO_EVIDENCE,
      )
    ) {
      noEvidence.push(item);
      continue;
    }

    if (currentProfessional) {
      current.push(item);
      continue;
    }

    if (historicalProfessional) {
      historical.push(item);
      continue;
    }

    if (
      evidence.some(
        (category) =>
          [
            EXPERIENCE_EVIDENCE.PROJECT_APPLIED,
            EXPERIENCE_EVIDENCE.FORMAL_TRAINING,
            EXPERIENCE_EVIDENCE.SELF_LEARNING,
            EXPERIENCE_EVIDENCE.PUBLISHED_KNOWLEDGE,
          ].includes(category),
      )
    ) {
      supporting.push(item);
    }
  }

  if (
    current.length === 0 ||
    noEvidence.length === 0
  ) {
    return null;
  }

  const masteryPrefix =
    asksMastery(userText)
      ? "No sería correcto decir que Víctor domina todas las tecnologías al mismo nivel. "
      : "";

  const factIdsFor =
    (selectedItems) =>
      unique(
        selectedItems.flatMap(
          (item) =>
            factIdsById.get(
              item.id,
            ) ??
            [],
        ),
      );

  if (
    detail ===
      KNOWLEDGE_OVERVIEW_DETAIL
        .SUMMARY
  ) {
    const preferredCurrent = [
      "Power BI",
      "Power Query",
      "DAX",
      "Excel",
      "Python",
      "SQL",
      "Oracle",
    ];

    const representative =
      preferredCurrent.filter(
        (title) =>
          current.some(
            (item) =>
              item.title === title,
          ),
      );

    const selectedItems = [
      ...current,
      ...historical,
      ...supporting,
      ...noEvidence,
    ];

    return {
      text:
        `${masteryPrefix}Con uso profesional actual constan, entre otras, ${humanJoin(representative)}. También hay experiencia profesional histórica y otras tecnologías con respaldo de proyectos, formación o autoaprendizaje. Qlik no se presenta como experiencia porque no hay experiencia profesional ni formación confirmada. Puedes profundizar por tipo de evidencia.`,
      items:
        selectedItems,
      knowledgeIds:
        selectedItems.map(
          (item) =>
            item.id,
        ),
      factIds:
        factIdsFor(
          selectedItems,
        ),
    };
  }

  const categoryItems = {
    [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_CURRENT]:
      current,
    [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_HISTORICAL]:
      historical,
    [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_SUPPORTING]:
      supporting,
  }[detail];

  if (categoryItems) {
    const prefix = {
      [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_CURRENT]:
        "Con uso profesional actual constan",
      [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_HISTORICAL]:
        "Con experiencia profesional histórica constan",
      [KNOWLEDGE_OVERVIEW_DETAIL.TECHNOLOGIES_SUPPORTING]:
        "Con respaldo de proyectos, formación o autoaprendizaje constan",
    }[detail];

    const suffix =
      detail ===
        KNOWLEDGE_OVERVIEW_DETAIL
          .TECHNOLOGIES_SUPPORTING
        ? " Esta categoría no equivale a experiencia profesional actual."
        : "";

    return {
      text:
        `${masteryPrefix}${prefix} ${humanJoin(categoryItems.map((item) => item.title))}.${suffix}`,
      items:
        categoryItems,
      knowledgeIds:
        categoryItems.map(
          (item) =>
            item.id,
        ),
      factIds:
        factIdsFor(
          categoryItems,
        ),
    };
  }

  let text =
    (
      masteryPrefix +
      `Con uso profesional actual constan ${humanJoin(current.map((item) => item.title))}.`
    );

  if (historical.length > 0) {
    text +=
      ` Con experiencia profesional histórica aparecen ${humanJoin(historical.map((item) => item.title))}.`;
  }

  if (supporting.length > 0) {
    text +=
      ` Otras cuentan con respaldo de proyectos, formación o autoaprendizaje, como ${humanJoin(supporting.map((item) => item.title))}.`;
  }

  if (noEvidence.length > 0) {
    text +=
      ` ${humanJoin(noEvidence.map((item) => item.title))} no se presenta como experiencia de Víctor porque no hay experiencia profesional ni formación confirmada.`;
  }

  return {
    text,
    items,
    knowledgeIds:
      items.map(
        (item) =>
          item.id,
      ),
    factIds:
      factIdsFor(items),
  };
}


function buildOverviewPayload(
  topic,
  userText,
  detail,
) {
  switch (topic) {
    case KNOWLEDGE_OVERVIEW_TOPIC.EDUCATION:
      return composeEducationOverview(
        detail,
      );

    case KNOWLEDGE_OVERVIEW_TOPIC.CAPABILITIES:
      return composeCapabilitiesOverview(
        detail,
      );

    case KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES:
      return composeTechnologiesOverview(
        userText,
        detail,
      );

    default:
      return null;
  }
}


export function composeKnowledgeOverviewResponse({
  userText,
  topic = null,
  intent = null,
  context = {},
  faqId = null,
  answerQaId = null,
} = {}) {
  const text =
    safeString(userText);

  if (!text) {
    return null;
  }

  const resolvedTopic =
    resolveKnowledgeOverviewTopic({
      userText: text,
      topic,
    });

  if (!resolvedTopic) {
    return null;
  }

  const detail =
    resolveKnowledgeOverviewDetail({
      userText:
        text,
      topic:
        resolvedTopic,
    });

  const payload =
    buildOverviewPayload(
      resolvedTopic,
      text,
      detail,
    );

  if (
    !payload ||
    !safeString(payload.text)
  ) {
    return null;
  }

  const normalizedContext =
    contextFromInput(context);

  return createResponseEnvelope({
    id:
      `response-knowledge-overview-${resolvedTopic}-${detail}`,

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.ANSWERED,

    intent:
      intent ?? resolvedTopic,

    messages: [
      {
        id:
          `msg-knowledge-overview-${resolvedTopic}-${detail}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE.ANSWER,

        text:
          payload.text,
      },
    ],

    quickReplies:
      createOverviewQuickReplies(
        resolvedTopic,
        detail,
      ),

    presentation: {
      depth:
        detail ===
          KNOWLEDGE_OVERVIEW_DETAIL
            .SUMMARY
          ? RESPONSE_DEPTH.SHORT
          : detail ===
              KNOWLEDGE_OVERVIEW_DETAIL
                .FULL
            ? RESPONSE_DEPTH.DEEP
            : RESPONSE_DEPTH.MEDIUM,

      splitBubbles:
        false,

      variationFamily:
        `knowledge-overview-${resolvedTopic}-${detail}`,

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE.WHEN_USEFUL,

      knowledgeIds:
        payload.knowledgeIds,

      factIds:
        payload.factIds,

      qualificationReasons: [],
    },

    safety: {
      mustQualify:
        false,

      commercialRedirect:
        false,

      allowInference:
        false,

      forbiddenClaims:
        collectForbiddenClaims(
          payload.items,
        ),
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalizedContext.continuing
          ? RESPONSE_CONTINUITY.CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        normalizedContext.suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,
      answerQaId,
      responseTemplateId:
        `knowledge-overview-${resolvedTopic}-${detail}`,
    },
  });
}