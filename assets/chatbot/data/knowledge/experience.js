import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  FACT_VALUE_TYPE,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
  RELATION_TYPE,
  TEMPORAL_STATUS,
} from "./constants.js";


/* ============================================================
 * HELPERS
 * ============================================================
 */

function freezeFact(fact) {
  return Object.freeze({
    ...fact,

    evidence: Object.freeze(
      (fact.evidence ?? []).map(
        (evidence) =>
          Object.freeze({
            ...evidence,

            sourceIds: Object.freeze([
              ...(evidence.sourceIds ?? []),
            ]),
          }),
      ),
    ),

    sources: Object.freeze([
      ...(fact.sources ?? []),
    ]),

    derivedFrom:
      fact.derivedFrom
        ? Object.freeze([
            ...fact.derivedFrom,
          ])
        : undefined,

    temporal:
      fact.temporal
        ? Object.freeze({
            ...fact.temporal,
          })
        : undefined,
  });
}


function freezeRelationship(
  relationship,
) {
  return Object.freeze({
    ...relationship,

    sources: Object.freeze([
      ...(relationship.sources ?? []),
    ]),
  });
}


function freezeKnowledgeItem(item) {
  return Object.freeze({
    ...item,

    aliases: Object.freeze([
      ...(item.aliases ?? []),
    ]),

    facts: Object.freeze(
      (item.facts ?? []).map(
        freezeFact,
      ),
    ),

    relationships: Object.freeze(
      (item.relationships ?? []).map(
        freezeRelationship,
      ),
    ),

    sources: Object.freeze([
      ...(item.sources ?? []),
    ]),

    temporal: Object.freeze({
      ...item.temporal,
    }),

    coverage: Object.freeze({
      ...item.coverage,
    }),

    answerPolicy: Object.freeze({
      ...item.answerPolicy,

      forbiddenClaims:
        Object.freeze([
          ...(
            item.answerPolicy
              ?.forbiddenClaims ?? []
          ),
        ]),
    }),

    limitations: Object.freeze(
      (item.limitations ?? []).map(
        (limitation) =>
          Object.freeze({
            ...limitation,
          }),
      ),
    ),

    metadata: Object.freeze({
      ...(item.metadata ?? {}),
    }),
  });
}


function createEvidence(
  sourceIds,
  note,
  strength =
    EVIDENCE_STRENGTH.STRONG,
) {
  return {
    strength,

    type:
      "professional-history",

    sourceIds,

    note,
  };
}


function createFact({
  id,
  key,
  value,
  valueType,
  sourceIds,
  note,
  temporalStatus,
  validFrom,
  validTo,
  disclosure =
    DISCLOSURE.PUBLIC_SUMMARY_ONLY,
}) {
  return {
    id,
    key,
    value,
    valueType,

    status:
      CLAIM_STATUS.USER_CONFIRMED,

    evidence: [
      createEvidence(
        sourceIds,
        note,
      ),
    ],

    sources: [
      ...sourceIds,
    ],

    disclosure,

    temporal: {
      status:
        temporalStatus,

      validFrom:
        validFrom ?? null,

      validTo:
        validTo ?? null,
    },
  };
}


function createExperienceItem({
  id,
  title,
  shortDescription,
  aliases,
  organization,
  role,
  periodLabel,
  responsibilities,
  technologies,
  capabilities,
  businessAreas,
  validFrom,
  validTo,
  current = false,
  relationships = [],
  sources = [
    "source-user-confirmed-career",
    "source-linkedin-victor",
  ],
  limitations = [],
}) {
  const temporalStatus =
    current
      ? TEMPORAL_STATUS.CURRENT
      : TEMPORAL_STATUS.HISTORICAL;

  return freezeKnowledgeItem({
    id,

    type:
      KNOWLEDGE_TYPE.EXPERIENCE,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title,

    shortDescription,

    aliases,

    facts: [
      createFact({
        id:
          `${id}-fact-organization`,

        key:
          "organization",

        value:
          organization,

        valueType:
          FACT_VALUE_TYPE.STRING,

        sourceIds:
          sources,

        note:
          "Organización asociada a esta etapa profesional.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-role`,

        key:
          "role",

        value:
          role,

        valueType:
          FACT_VALUE_TYPE.STRING,

        sourceIds:
          sources,

        note:
          "Rol profesional asociado a esta etapa.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-period`,

        key:
          "period",

        value:
          periodLabel,

        valueType:
          FACT_VALUE_TYPE.STRING,

        sourceIds:
          sources,

        note:
          "Periodo temporal de la experiencia profesional.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-responsibilities`,

        key:
          "responsibilities",

        value:
          responsibilities,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        sourceIds:
          sources,

        note:
          "Responsabilidades principales confirmadas para esta etapa.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-technologies`,

        key:
          "technologies",

        value:
          technologies,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        sourceIds:
          sources,

        note:
          "Tecnologías o entornos asociados a esta experiencia.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-capabilities`,

        key:
          "capabilities",

        value:
          capabilities,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        sourceIds:
          sources,

        note:
          "Capacidades profesionales demostradas durante esta etapa.",

        temporalStatus,
        validFrom,
        validTo,
      }),

      createFact({
        id:
          `${id}-fact-business-areas`,

        key:
          "business-areas",

        value:
          businessAreas,

        valueType:
          FACT_VALUE_TYPE.STRING_LIST,

        sourceIds:
          sources,

        note:
          "Áreas de negocio relacionadas con esta experiencia.",

        temporalStatus,
        validFrom,
        validTo,
      }),
    ],

    relationships,

    sources,

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        temporalStatus,

      validFrom,

      validTo:
        validTo ?? null,
    },

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,
      canRecommend: false,
      canProvideEvidence: true,
      canNavigate: false,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 2,

      allowInference: true,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.MEDIUM,

      forbiddenClaims: [
        "invented-role",
        "invented-responsibility",
        "invented-technology",
        "invented-client-result",
        "invented-financial-result",
        "price",
        "availability",
        "deadline",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "Una tecnología asociada a una etapa histórica no debe presentarse automáticamente como tecnología de uso profesional actual.",
      },

      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "La experiencia profesional no autoriza a inventar proyectos, clientes, resultados o responsabilidades no documentadas.",
      },

      ...limitations,
    ],

    metadata: {
      version: 1,
      category: "professional-experience",
      organization,
      current,
    },
  });
}


/* ============================================================
 * EXPERIENCE KNOWLEDGE
 * ============================================================
 */

export const experienceKnowledge =
  Object.freeze([

    /* --------------------------------------------------------
     * 1. ACCENTURE — 2004-2005
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-2004",

      title:
        "Accenture — Programador COBOL",

      shortDescription:
        "Inicio profesional en desarrollo bancario COBOL dentro de una Software Factory, con fuerte orientación a testing, calidad y componentes reutilizables.",

      aliases: [
        "primer trabajo de Víctor",
        "Accenture 2004",
        "Software Factory",
        "InfoCaja",
        "inicio en COBOL",
      ],

      organization:
        "Accenture",

      role:
        "Programador COBOL",

      periodLabel:
        "Jul 2004 – Abr 2005",

      validFrom:
        "2004-07-01",

      validTo:
        "2005-04-30",

      responsibilities: [
        "Desarrollo de componentes COBOL reutilizables para entornos bancarios.",
        "Pruebas unitarias y validación funcional.",
        "Documentación técnica.",
        "Uso de herramientas internas para automatizar y sistematizar pruebas.",
        "Validación de ramas lógicas como IF, ELSE, EVALUATE y condiciones de error.",
      ],

      technologies: [
        "cobol",
        "mainframe",
      ],

      capabilities: [
        "software-development",
        "testing",
        "quality-assurance",
        "technical-documentation",
        "banking-software",
      ],

      businessAreas: [
        "banking",
        "core-banking",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-testing",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-cobol",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-banking",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      sources: [
        "source-user-confirmed-career",
        "source-linkedin-victor",
      ],
    }),


    /* --------------------------------------------------------
     * 2. SINERGIA TECNOLÓGICA — 2005
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-sinergia-2005",

      title:
        "Sinergia Tecnológica — Programador COBOL",

      shortDescription:
        "Mantenimiento correctivo y evolutivo de aplicaciones bancarias, resolución de incidencias y trabajo en procesos online y batch.",

      aliases: [
        "Sinergia Tecnológica",
        "Caja Murcia",
        "InfoCaja Caja Murcia",
        "Sinergia 2005",
      ],

      organization:
        "Sinergia Tecnológica",

      role:
        "Programador COBOL",

      periodLabel:
        "Abr 2005 – Nov 2005",

      validFrom:
        "2005-04-01",

      validTo:
        "2005-11-30",

      responsibilities: [
        "Mantenimiento correctivo y evolutivo de aplicaciones bancarias.",
        "Resolución de incidencias de producción.",
        "Trabajo con procesos online y batch.",
        "Soporte a estabilidad y despliegues.",
      ],

      technologies: [
        "cobol",
        "mainframe",
        "batch",
        "online",
      ],

      capabilities: [
        "application-maintenance",
        "incident-resolution",
        "production-support",
        "banking-software",
      ],

      businessAreas: [
        "banking",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-cobol",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-production-support",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 3. ACCENTURE — 2005-2011
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-2005-2011",

      title:
        "Accenture — Senior COBOL",

      shortDescription:
        "Desarrollo, migraciones de core bancario y soporte de producción en servicios financieros, trabajando con procesos batch y online.",

      aliases: [
        "Accenture Senior COBOL",
        "CAM Alnova",
        "migración CAM",
        "BULL a Alnova",
        "Control-M",
      ],

      organization:
        "Accenture",

      role:
        "Senior COBOL",

      periodLabel:
        "Nov 2005 – Ene 2011",

      validFrom:
        "2005-11-01",

      validTo:
        "2011-01-31",

      responsibilities: [
        "Participación en migraciones de core bancario.",
        "Migración de sistemas desde BULL hacia Alnova.",
        "Desarrollo de procesos COBOL batch y online.",
        "Diseños técnicos.",
        "Pruebas y validación.",
        "Despliegue y estabilización.",
        "Soporte de procesos batch en entornos críticos.",
        "Planificación y monitorización mediante Control-M.",
      ],

      technologies: [
        "cobol",
        "mainframe",
        "batch",
        "online",
        "control-m",
        "alnova",
      ],

      capabilities: [
        "core-banking-migration",
        "software-development",
        "technical-design",
        "testing",
        "deployment",
        "production-support",
        "batch-processing",
      ],

      businessAreas: [
        "banking",
        "payments",
        "transfers",
        "direct-debits",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-control-m",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-data-migration",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 4. ACCENTURE — LOANS — 2011
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-loans-2011",

      title:
        "Accenture — Analista Programador COBOL / Préstamos",

      shortDescription:
        "Etapa centrada en aplicaciones de préstamos, análisis técnico, desarrollo batch y online, mantenimiento y soporte productivo.",

      aliases: [
        "Accenture préstamos",
        "Loans",
        "analista programador COBOL",
        "préstamos 2011",
      ],

      organization:
        "Accenture",

      role:
        "Analista Programador COBOL",

      periodLabel:
        "Feb 2011 – Ago 2011",

      validFrom:
        "2011-02-01",

      validTo:
        "2011-08-31",

      responsibilities: [
        "Análisis técnico de evolutivos y mantenimiento.",
        "Desarrollo COBOL batch y online.",
        "Mantenimiento de aplicaciones de préstamos.",
        "Soporte de producción.",
        "Creación y uso de utilidades técnicas.",
        "Pruebas y documentación.",
      ],

      technologies: [
        "cobol",
        "mainframe",
        "batch",
        "online",
      ],

      capabilities: [
        "technical-analysis",
        "software-development",
        "application-maintenance",
        "testing",
        "production-support",
      ],

      businessAreas: [
        "banking",
        "loans",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-loans",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 5. ALTRAN — FRANKFURT — 2011-2012
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-altran-frankfurt-2011-2012",

      title:
        "Altran — Analista Funcional / Frankfurt",

      shortDescription:
        "Análisis funcional y migraciones bancarias internacionales, trabajando en transformación de información desde COBOL hacia XML y Oracle.",

      aliases: [
        "Altran",
        "Frankfurt",
        "UGI",
        "ISBAN",
        "BDP",
        "KREBIS",
        "Partenón",
      ],

      organization:
        "Altran",

      role:
        "Analista Funcional",

      periodLabel:
        "Sep 2011 – Ago 2012",

      validFrom:
        "2011-09-01",

      validTo:
        "2012-08-31",

      responsibilities: [
        "Análisis funcional para proyectos bancarios internacionales.",
        "Participación en migraciones de información.",
        "Definición y revisión de requisitos.",
        "Elaboración de documentación funcional.",
        "Gestión y resolución de incidencias.",
        "Soporte a procesos batch de migración.",
        "Trabajo sobre modelos de personas, bienes, garantías y relaciones.",
      ],

      technologies: [
        "cobol",
        "xml",
        "oracle",
        "batch",
      ],

      capabilities: [
        "functional-analysis",
        "requirements-analysis",
        "data-migration",
        "incident-resolution",
        "business-modeling",
      ],

      businessAreas: [
        "banking",
        "customers",
        "guarantees",
        "risk",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-oracle",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-functional-analysis",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 6. EVERIS / NTT DATA — 2012-2014
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-everis-2012-2014",

      title:
        "everis — Analista Sénior",

      shortDescription:
        "Análisis funcional y técnico en proyectos bancarios complejos, modernización de aplicaciones, migraciones y coordinación con equipos distribuidos.",

      aliases: [
        "everis",
        "NTT Data",
        "KREBIS Batch Online",
        "Barclays",
        "Alicante Tucumán",
      ],

      organization:
        "everis",

      role:
        "Analista Sénior",

      periodLabel:
        "Ago 2012 – Jul 2014",

      validFrom:
        "2012-08-01",

      validTo:
        "2014-07-31",

      responsibilities: [
        "Evolución de aplicaciones desde procesos batch hacia modelos online.",
        "Análisis funcional.",
        "Elaboración de diseños técnicos.",
        "Preparación de libros de carga y documentación.",
        "Participación en migraciones bancarias.",
        "Coordinación con equipos distribuidos.",
        "Transferencia de conocimiento entre equipos.",
        "Soporte sobre aplicaciones bancarias críticas.",
      ],

      technologies: [
        "cobol",
        "batch",
        "online",
        "oracle",
      ],

      capabilities: [
        "functional-analysis",
        "technical-design",
        "banking-migration",
        "distributed-team-collaboration",
        "knowledge-transfer",
        "production-support",
      ],

      businessAreas: [
        "banking",
        "payments",
        "direct-debits",
        "transfers",
        "taxes",
        "sepa",
        "cheques",
        "pensions",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-technical-leadership",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-stakeholder-coordination",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 7. SOPRA STERIA — 2014-2015
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-sopra-2014-2015",

      title:
        "Sopra Steria — Analista Funcional",

      shortDescription:
        "Análisis funcional y técnico en servicios bancarios y SEPA, incluyendo requisitos, coordinación, UAT y puesta en producción.",

      aliases: [
        "Sopra Steria",
        "Sopra",
        "SEPA",
        "analista funcional Sopra",
      ],

      organization:
        "Sopra Steria",

      role:
        "Analista Funcional",

      periodLabel:
        "Sep 2014 – Jun 2015",

      validFrom:
        "2014-09-01",

      validTo:
        "2015-06-30",

      responsibilities: [
        "Análisis funcional de servicios bancarios.",
        "Elaboración de diseños funcionales y técnicos.",
        "Gestión y análisis de requisitos.",
        "Coordinación con equipos técnicos.",
        "Validación funcional.",
        "Participación en pruebas UAT.",
        "Apoyo a despliegues y puesta en producción.",
      ],

      technologies: [
        "cobol",
        "mainframe",
      ],

      capabilities: [
        "functional-analysis",
        "requirements-analysis",
        "technical-design",
        "uat",
        "deployment",
        "stakeholder-coordination",
      ],

      businessAreas: [
        "banking",
        "payments",
        "sepa",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-uat",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 8. ACCENTURE — BATCH / LOANS — 2015-2016
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-batch-2015-2016",

      title:
        "Accenture — System Developer Associate Manager / Batch",

      shortDescription:
        "Responsabilidad sobre el entorno batch de una aplicación de préstamos, coordinación de equipo, integración, UAT y soporte de producción crítica.",

      aliases: [
        "Accenture Batch",
        "hombre batch",
        "Altamira préstamos",
        "Associate Manager Batch",
        "mini batch",
      ],

      organization:
        "Accenture",

      role:
        "System Developer Associate Manager",

      periodLabel:
        "Jun 2015 – Mar 2016",

      validFrom:
        "2015-06-01",

      validTo:
        "2016-03-31",

      responsibilities: [
        "Responsabilidad sobre el entorno batch de una aplicación de préstamos.",
        "Construcción y coordinación de un entorno batch específico para préstamos.",
        "Coordinación y formación de un pequeño equipo técnico.",
        "Gestión de integración.",
        "Participación en UAT.",
        "Preparación y soporte de puesta en producción.",
        "Soporte sobre procesos críticos.",
      ],

      technologies: [
        "cobol",
        "batch",
        "mainframe",
      ],

      capabilities: [
        "batch-management",
        "technical-leadership",
        "team-coordination",
        "team-training",
        "integration",
        "uat",
        "production-support",
      ],

      businessAreas: [
        "banking",
        "loans",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-technical-leadership",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "No deben exponerse públicamente detalles internos de carga de trabajo, horas extraordinarias u otra información privada asociada a esta etapa.",
        },
      ],
    }),


    /* --------------------------------------------------------
     * 9. ACCENTURE — PERFORMANCE — 2016-2017
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-performance-2016-2017",

      title:
        "Accenture — Optimización de rendimiento / Liberbank",

      shortDescription:
        "Análisis y mejora del rendimiento de procesos batch y transacciones online en aplicaciones bancarias.",

      aliases: [
        "Liberbank",
        "Impagados",
        "optimización rendimiento",
        "performance COBOL",
      ],

      organization:
        "Accenture",

      role:
        "System Developer Associate Manager",

      periodLabel:
        "Mar 2016 – Mar 2017",

      validFrom:
        "2016-03-01",

      validTo:
        "2017-03-31",

      responsibilities: [
        "Análisis de rendimiento de procesos batch.",
        "Análisis de rendimiento de transacciones online.",
        "Identificación de cuellos de botella.",
        "Diseño de mejoras técnicas.",
        "Seguimiento de resultados tras las optimizaciones.",
      ],

      technologies: [
        "cobol",
        "batch",
        "online",
        "mainframe",
      ],

      capabilities: [
        "performance-analysis",
        "performance-optimization",
        "bottleneck-analysis",
        "technical-improvement",
        "production-analysis",
      ],

      businessAreas: [
        "banking",
        "unpaid-items",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-performance-optimization",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 10. ACCENTURE / SABADELL — VALORES — 2017-2018
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-valores-2017-2018",

      title:
        "Accenture — Project Manager / Valores",

      shortDescription:
        "Gestión funcional y técnica de proyectos en el área de Valores, coordinando desarrollo, UAT, incidencias y ciclo de vida hasta producción.",

      aliases: [
        "Valores",
        "Accenture Sabadell Valores",
        "PM Valores",
        "Project Manager Valores",
      ],

      organization:
        "Accenture",

      role:
        "System Developer Associate Manager / Project Manager",

      periodLabel:
        "Jun 2017 – Feb 2018",

      validFrom:
        "2017-06-01",

      validTo:
        "2018-02-28",

      responsibilities: [
        "Análisis funcional.",
        "Coordinación de desarrollos.",
        "Gestión del ciclo de vida de proyectos.",
        "Coordinación y seguimiento de UAT.",
        "Gestión de incidencias.",
        "Preparación de puesta en producción.",
        "Seguimiento posterior a implantación.",
      ],

      technologies: [
        "banking-systems",
        "project-management",
      ],

      capabilities: [
        "project-management",
        "functional-analysis",
        "development-coordination",
        "uat",
        "incident-management",
        "deployment",
      ],

      businessAreas: [
        "banking",
        "securities",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-project-management",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],
    }),


    /* --------------------------------------------------------
     * 11. ACCENTURE / SABADELL — CAPITAL MARKETS — 2018-2023
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-accenture-capital-markets-2018-2023",

      title:
        "Accenture — Project Manager / Capital Markets",

      shortDescription:
        "Gestión de proyectos y equipos multidisciplinares en Capital Markets, actuando como puente entre negocio y tecnología durante todo el ciclo de vida.",

      aliases: [
        "Capital Markets",
        "Mercados de Capitales",
        "Módulo de Producto",
        "PM Capital Markets",
        "Business Integration Architecture Associate Manager",
      ],

      organization:
        "Accenture",

      role:
        "Business & Integration Architecture Associate Manager / Project Manager",

      periodLabel:
        "Mar 2018 – Jul 2023",

      validFrom:
        "2018-03-01",

      validTo:
        "2023-07-31",

      responsibilities: [
        "Gestión de proyectos en Capital Markets.",
        "Coordinación de equipos multidisciplinares.",
        "Toma y análisis de requisitos.",
        "Elaboración de diseños funcionales y conceptuales.",
        "Estimación y planificación.",
        "Seguimiento económico y de facturación.",
        "Coordinación del desarrollo.",
        "Coordinación de UAT.",
        "Preparación de despliegues.",
        "Seguimiento post-implantación.",
        "Gestión de mantenimiento y evolutivos.",
      ],

      technologies: [
        "project-management",
        "banking-systems",
      ],

      capabilities: [
        "project-management",
        "stakeholder-management",
        "business-technology-bridge",
        "requirements-analysis",
        "planning",
        "estimation",
        "economic-tracking",
        "development-coordination",
        "uat",
        "deployment",
      ],

      businessAreas: [
        "banking",
        "capital-markets",
        "financial-markets",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-business-technology-bridge",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },

        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-capital-markets",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "El seguimiento económico puede mencionarse de forma general, pero no deben inventarse ni ampliarse cifras económicas o contractuales no publicadas.",
        },
      ],
    }),


    /* --------------------------------------------------------
     * 12. BANCO SABADELL — 2023-CURRENT
     * --------------------------------------------------------
     */

    createExperienceItem({
      id:
        "experience-banco-sabadell-2023-current",

      title:
        "Banco Sabadell — Responsable Especialista / Control Mercados Financieros",

      shortDescription:
        "Responsabilidad actual centrada en datos, Business Intelligence, automatización y evolución hacia IA aplicada dentro del área de Control de Mercados Financieros.",

      aliases: [
        "Banco Sabadell",
        "trabajo actual de Víctor",
        "Control Mercados Financieros",
        "Mercados Financieros",
        "puesto actual",
      ],

      organization:
        "Banco Sabadell",

      role:
        "Responsable Especialista - Control Mercados Financieros",

      periodLabel:
        "Jul 2023 – Actualidad",

      validFrom:
        "2023-07-01",

      validTo:
        null,

      current:
        true,

      responsibilities: [
        "Responsabilidad sobre datos dentro de la unidad de Control de Mercados Financieros.",
        "Transformación y preparación de grandes volúmenes de datos para análisis, control y toma de decisiones.",
        "Construcción y utilización de datamarts.",
        "Exploración y explotación de datos Oracle.",
        "Automatización de procesos de datos mediante SAS, Access, VBA y VBS.",
        "Construcción de dashboards e informes en Power BI.",
        "Trabajo con fuentes de datos mediante ODBC.",
        "Control de calidad y trazabilidad del dato.",
        "Trabajo con requerimientos regulatorios y de control.",
        "Evolución y aprendizaje aplicado en IA, Copilot y Power Platform.",
      ],

      technologies: [
        "power-bi",
        "power-query",
        "dax",
        "oracle",
        "microstrategy",
        "sas",
        "access",
        "vba",
        "vbs",
        "odbc",
        "copilot",
        "power-automate",
        "power-apps",
        "python",
      ],

      capabilities: [
        "data-analysis",
        "data-transformation",
        "business-intelligence",
        "dashboarding",
        "process-automation",
        "data-quality",
        "data-traceability",
        "regulatory-data-control",
        "financial-markets-analysis",
      ],

      businessAreas: [
        "banking",
        "financial-markets",
        "risk",
        "control",
        "regulatory-reporting",
      ],

      relationships: [
        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-power-bi",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },

        {
          type:
            RELATION_TYPE.USES,

          target:
            "technology-oracle",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.DEMONSTRATES,

          target:
            "capability-business-intelligence",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
          ],
        },

        {
          type:
            RELATION_TYPE.WORKED_IN,

          target:
            "business-area-financial-markets",

          strength:
            EVIDENCE_STRENGTH.STRONG,

          sources: [
            "source-user-confirmed-career",
            "source-linkedin-victor",
          ],
        },
      ],

      limitations: [
        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Power Automate, Power Apps y agentes de IA deben presentarse como áreas recientes de aprendizaje y aplicación, no como décadas de experiencia especializada.",
        },

        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Python forma parte de la evolución actual y de proyectos aplicados, pero no debe equipararse a la experiencia histórica acumulada en COBOL o banca.",
        },
      ],
    }),
  ]);


/* ============================================================
 * INDEX
 * ============================================================
 */

export const experienceKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      experienceKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getExperienceKnowledgeById(
  itemId,
) {
  if (
    typeof itemId !== "string" ||
    !itemId.trim()
  ) {
    return null;
  }

  return (
    experienceKnowledgeById[
      itemId
    ] ?? null
  );
}


export function getCurrentExperience() {
  return (
    experienceKnowledge.find(
      (item) =>
        item.temporal.status ===
        TEMPORAL_STATUS.CURRENT,
    ) ?? null
  );
}


export function getHistoricalExperience() {
  return experienceKnowledge.filter(
    (item) =>
      item.temporal.status ===
      TEMPORAL_STATUS.HISTORICAL,
  );
}


export function getExperienceByOrganization(
  organization,
) {
  if (
    typeof organization !== "string" ||
    !organization.trim()
  ) {
    return [];
  }

  const normalized =
    organization
      .trim()
      .toLowerCase();

  return experienceKnowledge.filter(
    (item) =>
      String(
        item.metadata.organization,
      )
        .toLowerCase()
        .includes(normalized),
  );
}