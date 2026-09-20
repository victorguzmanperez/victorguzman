import {
  FAQ_ANSWER_MODE,
  FAQ_INTENT,
  FAQ_OBJECTIVE,
  faqCorpus,
} from "./faqs.js";

import {
  knowledgeById,
} from "./knowledge.js";


/* ============================================================
 * K9.2 — ANSWER QA CONTRACTS
 *
 * Define QUÉ puede hacer una respuesta.
 *
 * NO contiene el texto final de las respuestas.
 * responses.js se construirá después de K9.
 * ============================================================
 */


/* ============================================================
 * CATEGORIES
 * ============================================================
 */

export const ANSWER_QA_CATEGORY =
  Object.freeze({
    FACTUAL:
      "factual",

    EVIDENCE:
      "evidence",

    COMMERCIAL:
      "commercial",

    PRIVACY:
      "privacy",

    GREETING:
      "greeting",

    THANKS:
      "thanks",

    GOODBYE:
      "goodbye",

    NAME_PERSONALIZATION:
      "name_personalization",

    POLITENESS:
      "politeness",

    UNSUPPORTED:
      "unsupported",
  });


/* ============================================================
 * DECISIONS
 * ============================================================
 */

export const ANSWER_QA_DECISION =
  Object.freeze({
    ANSWER:
      "answer",

    ANSWER_QUALIFIED:
      "answer_qualified",

    DISCOVER:
      "discover",

    REDIRECT:
      "redirect",

    SOCIAL:
      "social",

    FALLBACK:
      "fallback",
  });


/* ============================================================
 * EVIDENCE POLICY
 * ============================================================
 */

export const ANSWER_QA_EVIDENCE =
  Object.freeze({
    NONE:
      "none",

    WHEN_USEFUL:
      "when_useful",

    REQUIRED:
      "required",
  });


/* ============================================================
 * ACTIONS
 *
 * Son acciones semánticas de QA.
 * Action Router las mapeará después.
 * ============================================================
 */

export const ANSWER_QA_ACTION =
  Object.freeze({
    ANSWER:
      "answer",

    ASK:
      "ask",

    OPEN_CONTACT:
      "open-contact",

    START_DIAGNOSTIC:
      "start-diagnostic",

    OPEN_CALENDLY:
      "open-calendly",

    OFFER_FEEDBACK:
      "offer-feedback",

    FALLBACK:
      "fallback",
  });


/* ============================================================
 * NAME POLICY
 * ============================================================
 */

export const ANSWER_QA_NAME_POLICY =
  Object.freeze({
    NEVER:
      "never",

    OPTIONAL:
      "optional",

    USE_IF_KNOWN:
      "use_if_known",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function unique(
  values,
) {
  return [
    ...new Set(values),
  ];
}


function freezeArray(
  values = [],
) {
  return Object.freeze([
    ...values,
  ]);
}


function freezeObject(
  value,
) {
  return Object.freeze({
    ...value,
  });
}


function freezeContract(
  contract,
) {
  return Object.freeze({
    ...contract,

    knowledgeIds:
      freezeArray(
        contract.knowledgeIds,
      ),

    allowedActions:
      freezeArray(
        contract.allowedActions,
      ),

    forbiddenClaims:
      freezeArray(
        contract.forbiddenClaims,
      ),

    context:
      freezeObject(
        contract.context ?? {},
      ),

    social:
      freezeObject(
        contract.social ?? {},
      ),

    privacy:
      Object.freeze({
        ...(
          contract.privacy ??
          {}
        ),

        analyticsForbidden:
          freezeArray(
            contract.privacy
              ?.analyticsForbidden ??
            [],
          ),
      }),
  });
}


function forbiddenClaimsForKnowledge(
  knowledgeIds,
) {
  return unique(
    knowledgeIds.flatMap(
      (knowledgeId) =>
        knowledgeById[
          knowledgeId
        ]?.answerPolicy
          ?.forbiddenClaims ??
        [],
    ),
  );
}


function canProvideEvidence(
  knowledgeIds,
) {
  return knowledgeIds.some(
    (knowledgeId) =>
      knowledgeById[
        knowledgeId
      ]?.coverage
        ?.canProvideEvidence ===
      true,
  );
}


/* ============================================================
 * FAQ → ANSWER CONTRACT
 * ============================================================
 */

function decisionFromFaq(
  faq,
) {
  switch (
    faq.answerMode
  ) {
    case FAQ_ANSWER_MODE.DIRECT:
      return (
        ANSWER_QA_DECISION.ANSWER
      );

    case FAQ_ANSWER_MODE.QUALIFIED:
      return (
        ANSWER_QA_DECISION
          .ANSWER_QUALIFIED
      );

    case FAQ_ANSWER_MODE.DISCOVERY:
      return (
        ANSWER_QA_DECISION.DISCOVER
      );

    case FAQ_ANSWER_MODE.SAFE_REDIRECT:
      return (
        ANSWER_QA_DECISION.REDIRECT
      );

    default:
      throw new Error(
        `Unsupported FAQ answer mode: ${faq.answerMode}`,
      );
  }
}


function evidenceFromFaq(
  faq,
) {
  if (
    faq.objective ===
      FAQ_OBJECTIVE
        .VERIFY_EVIDENCE ||
    faq.objective ===
      FAQ_OBJECTIVE
        .CHECK_CERTIFICATION_STATUS ||
    faq.objective ===
      FAQ_OBJECTIVE
        .CHECK_CURRENT_STATUS
  ) {
    return (
      ANSWER_QA_EVIDENCE.REQUIRED
    );
  }


  if (
    canProvideEvidence(
      faq.knowledgeIds,
    )
  ) {
    return (
      ANSWER_QA_EVIDENCE
        .WHEN_USEFUL
    );
  }


  return (
    ANSWER_QA_EVIDENCE.NONE
  );
}


function actionsFromFaq(
  faq,
) {
  switch (
    faq.answerMode
  ) {
    case FAQ_ANSWER_MODE
      .SAFE_REDIRECT:
      return [
        ANSWER_QA_ACTION
          .OPEN_CONTACT,
      ];

    case FAQ_ANSWER_MODE
      .DISCOVERY:
      return [
        ANSWER_QA_ACTION.ANSWER,
        ANSWER_QA_ACTION.ASK,
        ANSWER_QA_ACTION
          .START_DIAGNOSTIC,
      ];

    default:
      return [
        ANSWER_QA_ACTION.ANSWER,
      ];
  }
}


export const faqAnswerContracts =
  Object.freeze(
    faqCorpus.map(
      (faq) =>
        freezeContract({
          id:
            `answer-contract-${faq.id}`,

          category:
            ANSWER_QA_CATEGORY.FACTUAL,

          source:
            "faq",

          faqId:
            faq.id,

          input:
            faq.question,

          expectedIntent:
            faq.expectedIntent,

          knowledgeIds:
            faq.knowledgeIds,

          decision:
            decisionFromFaq(
              faq,
            ),

          evidence:
            evidenceFromFaq(
              faq,
            ),

          mustUseKnowledge:
            true,

          mustQualify:
            faq.answerMode ===
              FAQ_ANSWER_MODE
                .QUALIFIED ||
            faq.answerMode ===
              FAQ_ANSWER_MODE
                .DISCOVERY ||
            faq.answerMode ===
              FAQ_ANSWER_MODE
                .SAFE_REDIRECT,

          allowedActions:
            actionsFromFaq(
              faq,
            ),

          forbiddenClaims:
            forbiddenClaimsForKnowledge(
              faq.knowledgeIds,
            ),

          context: {},

          social: {
            namePolicy:
              ANSWER_QA_NAME_POLICY
                .NEVER,

            mayAskName:
              false,

            nameRequired:
              false,

            mayOfferFeedback:
              false,
          },

          privacy: {
            analyticsForbidden: [
              "raw-message",
              "conversation",
            ],
          },
        }),
    ),
  );


/* ============================================================
 * MANUAL QA SCENARIOS
 * ============================================================
 */

function scenario({
  id,
  category,
  input,
  expectedIntent,
  knowledgeIds = [],
  decision,
  evidence =
    ANSWER_QA_EVIDENCE.NONE,
  mustUseKnowledge = false,
  mustQualify = false,
  allowedActions = [],
  forbiddenClaims = [],
  context = {},
  social = {},
  privacy = {},
}) {
  return freezeContract({
    id,
    category,
    source:
      "manual-qa",

    faqId: null,

    input,
    expectedIntent,

    knowledgeIds,

    decision,

    evidence,

    mustUseKnowledge,

    mustQualify,

    allowedActions,

    forbiddenClaims,

    context,

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .NEVER,

      mayAskName:
        false,

      nameRequired:
        false,

      mayOfferFeedback:
        false,

      mustNotReopenFlow:
        false,

      ...social,
    },

    privacy: {
      analyticsForbidden: [
        "raw-message",
        "conversation",
      ],

      ...privacy,
    },
  });
}


/* ============================================================
 * 01 — FACTUAL / KNOWLEDGE
 * ============================================================
 */

const factualCases = [

  scenario({
    id:
      "aqa-factual-001",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Quién es Víctor?",

    expectedIntent:
      FAQ_INTENT.ABOUT_VICTOR,

    knowledgeIds: [
      "profile-victor",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    evidence:
      ANSWER_QA_EVIDENCE
        .WHEN_USEFUL,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),


  scenario({
    id:
      "aqa-factual-002",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Víctor trabaja con Power BI?",

    expectedIntent:
      FAQ_INTENT.POWERBI,

    knowledgeIds: [
      "technology-power-bi",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),


  scenario({
    id:
      "aqa-factual-003",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Qué proyectos tiene Víctor?",

    expectedIntent:
      FAQ_INTENT.PROJECTS,

    knowledgeIds: [
      "project-business-cost-intelligence",
      "project-auditoria-digital-cv",
      "project-investment-dashboard-ai",
      "project-digital-competency-evaluation",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    evidence:
      ANSWER_QA_EVIDENCE
        .WHEN_USEFUL,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),


  scenario({
    id:
      "aqa-factual-004",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Qué servicios ofrece?",

    expectedIntent:
      FAQ_INTENT.SERVICES,

    knowledgeIds: [
      "service-business-intelligence-dashboards",
      "service-excel-business-models",
      "service-data-process-automation",
      "service-ai-process-analysis",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "invented-service",
      "automatic-service-fit",
    ],
  }),


  scenario({
    id:
      "aqa-factual-005",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Dónde puedo contactar con Víctor?",

    expectedIntent:
      FAQ_INTENT.CONTACT,

    knowledgeIds: [
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
      ANSWER_QA_ACTION
        .OPEN_CONTACT,
    ],
  }),


  scenario({
    id:
      "aqa-factual-006",

    category:
      ANSWER_QA_CATEGORY.FACTUAL,

    input:
      "¿Cuánto dura la reunión inicial?",

    expectedIntent:
      FAQ_INTENT.BOOKING,

    knowledgeIds: [
      "booking-calendly-initial-meeting",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
      ANSWER_QA_ACTION
        .OPEN_CALENDLY,
    ],
  }),
];


/* ============================================================
 * 02 — EVIDENCE QUALIFICATION
 * ============================================================
 */

const evidenceCases = [

  scenario({
    id:
      "aqa-evidence-001",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿Víctor tiene experiencia con Qlik Sense?",

    expectedIntent:
      FAQ_INTENT.TECHNOLOGIES,

    knowledgeIds: [
      "technology-qlik",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "invented-professional-experience",
    ],
  }),


  scenario({
    id:
      "aqa-evidence-002",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿Tiene experiencia profesional con AWS?",

    expectedIntent:
      FAQ_INTENT.TECHNOLOGIES,

    knowledgeIds: [
      "technology-aws",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "upgrade-training-to-professional-experience",
    ],
  }),


  scenario({
    id:
      "aqa-evidence-003",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿Víctor está certificado en PL-300?",

    expectedIntent:
      FAQ_INTENT.CERTIFICATION,

    knowledgeIds: [
      "certification-pl300",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "certification-earned",
      "certified-professional",
    ],
  }),


  scenario({
    id:
      "aqa-evidence-004",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿El Investment Dashboard ya está terminado?",

    expectedIntent:
      FAQ_INTENT.PROJECTS,

    knowledgeIds: [
      "project-investment-dashboard-ai",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "present-in-development-as-finished",
    ],
  }),


  scenario({
    id:
      "aqa-evidence-005",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿Víctor sigue trabajando profesionalmente con COBOL?",

    expectedIntent:
      FAQ_INTENT.TECHNOLOGIES,

    knowledgeIds: [
      "technology-cobol",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "historical-as-current",
    ],
  }),


  scenario({
    id:
      "aqa-evidence-006",

    category:
      ANSWER_QA_CATEGORY.EVIDENCE,

    input:
      "¿Power BI forma parte de su trabajo actual?",

    expectedIntent:
      FAQ_INTENT.POWERBI,

    knowledgeIds: [
      "technology-power-bi",
      "experience-banco-sabadell-2023-current",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    evidence:
      ANSWER_QA_EVIDENCE.REQUIRED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),
];


/* ============================================================
 * 03 — COMMERCIAL SAFETY
 * ============================================================
 */

const commercialCases = [

  scenario({
    id:
      "aqa-commercial-001",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Cuánto cobra Víctor?",

    expectedIntent:
      FAQ_INTENT.PRICING,

    knowledgeIds: [
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.REDIRECT,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.OPEN_CONTACT,
    ],

    forbiddenClaims: [
      "automatic-price",
      "invented-price",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-002",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Qué presupuesto tendría un dashboard?",

    expectedIntent:
      FAQ_INTENT.PRICING,

    knowledgeIds: [
      "service-business-intelligence-dashboards",
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.REDIRECT,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.OPEN_CONTACT,
    ],

    forbiddenClaims: [
      "automatic-price",
      "invented-budget",
      "invented-quote",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-003",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Cuál es su tarifa por hora?",

    expectedIntent:
      FAQ_INTENT.PRICING,

    knowledgeIds: [
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.REDIRECT,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.OPEN_CONTACT,
    ],

    forbiddenClaims: [
      "invented-rate",
      "automatic-price",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-004",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Cuánto tardaría en hacer el proyecto?",

    expectedIntent:
      FAQ_INTENT.TIMELINE,

    knowledgeIds: [
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.REDIRECT,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.OPEN_CONTACT,
    ],

    forbiddenClaims: [
      "automatic-deadline",
      "invented-timeline",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-005",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Puede empezar mañana?",

    expectedIntent:
      FAQ_INTENT.CONTACT,

    knowledgeIds: [
      "contact-victor-portfolio",
    ],

    decision:
      ANSWER_QA_DECISION.REDIRECT,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.OPEN_CONTACT,
    ],

    forbiddenClaims: [
      "automatic-availability",
      "guaranteed-availability",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-006",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Seguro que puede hacer este proyecto?",

    expectedIntent:
      FAQ_INTENT.DIAGNOSTIC,

    knowledgeIds: [
      "diagnostic-portfolio-initial",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION
        .START_DIAGNOSTIC,
    ],

    forbiddenClaims: [
      "guaranteed-feasibility",
      "guaranteed-acceptance",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-007",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Me garantizas que funcionará?",

    expectedIntent:
      FAQ_INTENT.DIAGNOSTIC,

    knowledgeIds: [
      "diagnostic-portfolio-initial",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION
        .START_DIAGNOSTIC,
    ],

    forbiddenClaims: [
      "guaranteed-result",
      "guaranteed-feasibility",
    ],
  }),


  scenario({
    id:
      "aqa-commercial-008",

    category:
      ANSWER_QA_CATEGORY.COMMERCIAL,

    input:
      "¿Qué retorno económico me garantiza?",

    expectedIntent:
      FAQ_INTENT.DIAGNOSTIC,

    knowledgeIds: [
      "diagnostic-portfolio-initial",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION
        .START_DIAGNOSTIC,
    ],

    forbiddenClaims: [
      "guaranteed-roi",
      "guaranteed-result",
    ],
  }),
];


/* ============================================================
 * 04 — PRIVACY
 * ============================================================
 */

const privacyCases = [

  scenario({
    id:
      "aqa-privacy-001",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "¿Dónde se guarda esta conversación?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-session-data",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),


  scenario({
    id:
      "aqa-privacy-002",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "¿Cuánto tiempo guardáis el chat?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-session-data",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],
  }),


  scenario({
    id:
      "aqa-privacy-003",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "¿Google Analytics recibe lo que escribo?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-analytics-privacy",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    privacy: {
      analyticsForbidden: [
        "raw-message",
        "conversation",
        "free-text",
        "name",
        "email",
        "phone",
      ],
    },
  }),


  scenario({
    id:
      "aqa-privacy-004",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "¿Guardáis automáticamente las conversaciones completas?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-session-data",
      "policy-chatbot-improvement-feedback",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "automatic-central-transcript-storage",
    ],
  }),


  scenario({
    id:
      "aqa-privacy-005",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "¿Puede guardarse mi pregunta exacta para mejorar el chatbot?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-improvement-feedback",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustUseKnowledge:
      true,

    mustQualify:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    forbiddenClaims: [
      "automatic-exact-question-storage",
      "implicit-feedback-consent",
    ],
  }),


  scenario({
    id:
      "aqa-privacy-006",

    category:
      ANSWER_QA_CATEGORY.PRIVACY,

    input:
      "Si te digo mi nombre, ¿lo mandas a Analytics?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-analytics-privacy",
      "policy-chatbot-session-data",
    ],

    decision:
      ANSWER_QA_DECISION.ANSWER,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    privacy: {
      analyticsForbidden: [
        "name",
        "raw-message",
        "conversation",
      ],
    },
  }),
];


/* ============================================================
 * 05 — GREETING
 * ============================================================
 */

const greetingCases = [

  scenario({
    id:
      "aqa-greeting-001",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Hola",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .OPTIONAL,

      mayAskName:
        true,

      nameRequired:
        false,

      mirrorGreeting:
        true,
    },
  }),


  scenario({
    id:
      "aqa-greeting-002",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Buenos días",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .OPTIONAL,

      mayAskName:
        true,

      nameRequired:
        false,

      mirrorGreeting:
        true,
    },
  }),


  scenario({
    id:
      "aqa-greeting-003",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Buenas tardes",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    context: {
      name:
        "Juan",
    },

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayAskName:
        false,

      nameRequired:
        false,

      mirrorGreeting:
        true,
    },
  }),


  scenario({
    id:
      "aqa-greeting-004",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Buenas noches",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    context: {
      name:
        "Ana",
    },

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayAskName:
        false,

      nameRequired:
        false,

      mirrorGreeting:
        true,
    },
  }),


  scenario({
    id:
      "aqa-greeting-005",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Hola Víctor",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .OPTIONAL,

      mayAskName:
        true,

      nameRequired:
        false,

      mirrorGreeting:
        true,

      mustNotTreatVictorAsUserName:
        true,
    },
  }),


  scenario({
    id:
      "aqa-greeting-006",

    category:
      ANSWER_QA_CATEGORY.GREETING,

    input:
      "Hola, me llamo Laura",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    context: {
      providedName:
        "Laura",
    },

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayAskName:
        false,

      nameRequired:
        false,

      mirrorGreeting:
        true,
    },

    privacy: {
      analyticsForbidden: [
        "name",
        "raw-message",
        "conversation",
      ],
    },
  }),
];


/* ============================================================
 * 06 — THANKS
 * ============================================================
 */

const thanksCases = [

  scenario({
    id:
      "aqa-thanks-001",

    category:
      ANSWER_QA_CATEGORY.THANKS,

    input:
      "Gracias",

    expectedIntent:
      "thanks",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-thanks-002",

    category:
      ANSWER_QA_CATEGORY.THANKS,

    input:
      "Muchas gracias por la ayuda",

    expectedIntent:
      "thanks",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      name:
        "Juan",
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-thanks-003",

    category:
      ANSWER_QA_CATEGORY.THANKS,

    input:
      "Perfecto, gracias",

    expectedIntent:
      "thanks",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mustNotReopenFlow:
        true,

      mayAskName:
        false,
    },
  }),
];


/* ============================================================
 * 07 — GOODBYE
 * ============================================================
 */

const goodbyeCases = [

  scenario({
    id:
      "aqa-goodbye-001",

    category:
      ANSWER_QA_CATEGORY.GOODBYE,

    input:
      "Adiós",

    expectedIntent:
      "goodbye",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-goodbye-002",

    category:
      ANSWER_QA_CATEGORY.GOODBYE,

    input:
      "Hasta luego",

    expectedIntent:
      "goodbye",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      name:
        "Juan",

      meaningfulConversation:
        true,

      feedbackAlreadyOffered:
        false,
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
      ANSWER_QA_ACTION
        .OFFER_FEEDBACK,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayOfferFeedback:
        true,

      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-goodbye-003",

    category:
      ANSWER_QA_CATEGORY.GOODBYE,

    input:
      "Gracias, eso es todo. Hasta luego.",

    expectedIntent:
      "goodbye",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      meaningfulConversation:
        true,

      feedbackAlreadyOffered:
        false,
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
      ANSWER_QA_ACTION
        .OFFER_FEEDBACK,
    ],

    social: {
      mayOfferFeedback:
        true,

      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-goodbye-004",

    category:
      ANSWER_QA_CATEGORY.GOODBYE,

    input:
      "Me voy, gracias",

    expectedIntent:
      "goodbye",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      meaningfulConversation:
        false,
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mayOfferFeedback:
        false,

      mustNotReopenFlow:
        true,
    },
  }),
];


/* ============================================================
 * 08 — OPTIONAL NAME PERSONALIZATION
 * ============================================================
 */

const nameCases = [

  scenario({
    id:
      "aqa-name-001",

    category:
      ANSWER_QA_CATEGORY
        .NAME_PERSONALIZATION,

    input:
      "Me llamo Juan",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      providedName:
        "Juan",
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayAskName:
        false,

      nameRequired:
        false,
    },

    privacy: {
      analyticsForbidden: [
        "name",
        "raw-message",
      ],
    },
  }),


  scenario({
    id:
      "aqa-name-002",

    category:
      ANSWER_QA_CATEGORY
        .NAME_PERSONALIZATION,

    input:
      "Prefiero no decir mi nombre",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY.NEVER,

      mayAskName:
        false,

      nameRequired:
        false,

      mustContinueWithoutName:
        true,
    },
  }),


  scenario({
    id:
      "aqa-name-003",

    category:
      ANSWER_QA_CATEGORY
        .NAME_PERSONALIZATION,

    input:
      "¿Por qué quieres saber mi nombre?",

    expectedIntent:
      "privacy",

    knowledgeIds: [
      "policy-chatbot-session-data",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustUseKnowledge:
      true,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .OPTIONAL,

      mayAskName:
        false,

      nameRequired:
        false,

      mustExplainOptionalPurpose:
        true,
    },
  }),


  scenario({
    id:
      "aqa-name-004",

    category:
      ANSWER_QA_CATEGORY
        .NAME_PERSONALIZATION,

    input:
      "¿Qué experiencia tiene Víctor con Power BI?",

    expectedIntent:
      FAQ_INTENT.POWERBI,

    knowledgeIds: [
      "technology-power-bi",
    ],

    decision:
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,

    mustUseKnowledge:
      true,

    context: {
      name:
        null,
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY.NEVER,

      mayAskName:
        false,

      nameRequired:
        false,

      mustNotInterruptForName:
        true,
    },
  }),


  scenario({
    id:
      "aqa-name-005",

    category:
      ANSWER_QA_CATEGORY
        .NAME_PERSONALIZATION,

    input:
      "Buenos días",

    expectedIntent:
      "greeting",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      name:
        "María",

      nameAlreadyAsked:
        true,
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mayAskName:
        false,

      nameRequired:
        false,
    },
  }),
];


/* ============================================================
 * 09 — CONVERSATIONAL POLITENESS
 * ============================================================
 */

const politenessCases = [

  scenario({
    id:
      "aqa-politeness-001",

    category:
      ANSWER_QA_CATEGORY.POLITENESS,

    input:
      "Vale",

    expectedIntent:
      "unknown",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mustNotForceCTA:
        true,
    },
  }),


  scenario({
    id:
      "aqa-politeness-002",

    category:
      ANSWER_QA_CATEGORY.POLITENESS,

    input:
      "Entendido, gracias",

    expectedIntent:
      "thanks",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    context: {
      name:
        "Juan",
    },

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      namePolicy:
        ANSWER_QA_NAME_POLICY
          .USE_IF_KNOWN,

      mustNotOveruseName:
        true,

      mustNotReopenFlow:
        true,
    },
  }),


  scenario({
    id:
      "aqa-politeness-003",

    category:
      ANSWER_QA_CATEGORY.POLITENESS,

    input:
      "No, gracias",

    expectedIntent:
      "thanks",

    decision:
      ANSWER_QA_DECISION.SOCIAL,

    allowedActions: [
      ANSWER_QA_ACTION.ANSWER,
    ],

    social: {
      mustRespectDecline:
        true,

      mustNotRepeatCTA:
        true,

      mustNotReopenFlow:
        true,
    },
  }),
];


/* ============================================================
 * 10 — UNSUPPORTED / FALLBACK
 * ============================================================
 */

const unsupportedCases = [

  scenario({
    id:
      "aqa-unsupported-001",

    category:
      ANSWER_QA_CATEGORY.UNSUPPORTED,

    input:
      "¿Quién va a ganar la liga?",

    expectedIntent:
      "unknown",

    decision:
      ANSWER_QA_DECISION.FALLBACK,

    allowedActions: [
      ANSWER_QA_ACTION.FALLBACK,
    ],

    social: {
      fallbackLevel:
        1,
    },
  }),


  scenario({
    id:
      "aqa-unsupported-002",

    category:
      ANSWER_QA_CATEGORY.UNSUPPORTED,

    input:
      "asdfgh qwerty",

    expectedIntent:
      "unknown",

    decision:
      ANSWER_QA_DECISION.FALLBACK,

    context: {
      consecutiveFallbacks:
        1,
    },

    allowedActions: [
      ANSWER_QA_ACTION.FALLBACK,
    ],

    social: {
      fallbackLevel:
        2,
    },
  }),


  scenario({
    id:
      "aqa-unsupported-003",

    category:
      ANSWER_QA_CATEGORY.UNSUPPORTED,

    input:
      "No sé, otra cosa",

    expectedIntent:
      "unknown",

    decision:
      ANSWER_QA_DECISION.FALLBACK,

    context: {
      consecutiveFallbacks:
        2,
    },

    allowedActions: [
      ANSWER_QA_ACTION.FALLBACK,
      ANSWER_QA_ACTION
        .OPEN_CONTACT,
    ],

    social: {
      fallbackLevel:
        3,
    },
  }),


  scenario({
    id:
      "aqa-unsupported-004",

    category:
      ANSWER_QA_CATEGORY.UNSUPPORTED,

    input:
      "¿Puedes decirme algo que no aparece en el portfolio?",

    expectedIntent:
      "unknown",

    decision:
      ANSWER_QA_DECISION.FALLBACK,

    allowedActions: [
      ANSWER_QA_ACTION.FALLBACK,
    ],

    forbiddenClaims: [
      "invented-fact",
      "invented-experience",
      "invented-project",
      "invented-service",
    ],
  }),
];


/* ============================================================
 * COMPLETE MANUAL CORPUS
 * ============================================================
 */

export const answerQaCases =
  Object.freeze([
    ...factualCases,
    ...evidenceCases,
    ...commercialCases,
    ...privacyCases,
    ...greetingCases,
    ...thanksCases,
    ...goodbyeCases,
    ...nameCases,
    ...politenessCases,
    ...unsupportedCases,
  ]);


/* ============================================================
 * ALL CONTRACTS
 * ============================================================
 */

export const answerQaContracts =
  Object.freeze([
    ...faqAnswerContracts,
    ...answerQaCases,
  ]);


/* ============================================================
 * INDEXES
 * ============================================================
 */

export const answerQaById =
  Object.freeze(
    Object.fromEntries(
      answerQaContracts.map(
        (contract) => [
          contract.id,
          contract,
        ],
      ),
    ),
  );


export function getAnswerQaById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    answerQaById[id] ??
    null
  );
}


export function getAnswerQaByCategory(
  category,
) {
  if (
    typeof category !== "string" ||
    !category.trim()
  ) {
    return [];
  }

  return Object.freeze(
    answerQaCases.filter(
      (contract) =>
        contract.category ===
        category,
    ),
  );
}