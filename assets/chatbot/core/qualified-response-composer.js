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
  getKnowledgeById,
} from "../data/knowledge.js";

import {
  EVIDENCE_CLAIM_MODE,
} from "../data/knowledge/evidence-model.js";

import {
  EXPERIENCE_EVIDENCE,
} from "../data/knowledge/constants.js";

import {
  findSimilarEvidence,
} from "../data/knowledge/similarity-engine.js";


/* ============================================================
 * QUALIFIED RESPONSE COMPOSER
 * 1.11.22.4
 *
 * Knowledge factual
 *      +
 * Similarity / Evidence
 *      +
 * Temporal status
 *      +
 * limitations / forbiddenClaims
 *          ↓
 * Qualified conversational response
 *
 * Nunca convierte:
 *
 * formación → experiencia profesional
 * histórico → actual
 * preparing → certificación obtenida
 * in_development → proyecto terminado
 * no_evidence → experiencia inventada
 *
 * La capa visible intenta expresarlo con lenguaje humano,
 * evitando exponer reglas internas o terminología técnica.
 * ============================================================
 */


/* ============================================================
 * QUALIFICATION REASON
 * ============================================================
 */

export const QUALIFIED_RESPONSE_REASON =
  Object.freeze({
    DIRECT_EXPERIENCE:
      "direct_experience",

    RELATED_EXPERIENCE:
      "related_experience",

    TRAINING_ONLY:
      "training_only",

    NO_EVIDENCE:
      "no_evidence",

    HISTORICAL_NOT_CURRENT:
      "historical_not_current",

    CERTIFICATION_PREPARING:
      "certification_preparing",

    CERTIFICATION_NOT_EARNED:
      "certification_not_earned",

    PROJECT_IN_DEVELOPMENT:
      "project_in_development",

    PROJECT_PLANNED:
      "project_planned",

    TEMPORAL_QUALIFICATION:
      "temporal_qualification",
  });


/* ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

function safeString(
  value,
) {
  return (
    typeof value === "string"
      ? value.trim()
      : ""
  );
}


function normalizeText(
  value,
) {
  return safeString(
    value,
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();
}


function unique(
  values,
) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}


function stripTerminalPunctuation(
  value,
) {
  return safeString(
    value,
  ).replace(
    /[.!?]+$/,
    "",
  );
}


function ensurePeriod(
  value,
) {
  const text =
    safeString(
      value,
    );

  if (!text) {
    return "";
  }


  if (
    /[.!?]$/.test(
      text,
    )
  ) {
    return text;
  }


  return `${text}.`;
}


function lowercaseInitial(
  value,
) {
  const text =
    safeString(
      value,
    );

  if (!text) {
    return "";
  }


  const firstWord =
    text.split(
      /\s+/,
    )[0];


  /*
   * Conservamos acrónimos:
   *
   * AWS → AWS
   * IA  → IA
   *
   * pero:
   *
   * Experiencia → experiencia
   */
  if (
    firstWord.length > 1 &&
    firstWord ===
      firstWord.toUpperCase()
  ) {
    return text;
  }


  return (
    text.charAt(0)
      .toLowerCase() +
    text.slice(1)
  );
}


function firstSummaryClause(
  value,
) {
  const text =
    safeString(
      value,
    );

  if (!text) {
    return "";
  }


  return stripTerminalPunctuation(
    text.split(";")[0],
  );
}


function getFact(
  item,
  key,
) {
  if (
    !item ||
    !Array.isArray(
      item.facts,
    )
  ) {
    return null;
  }


  return (
    item.facts.find(
      (fact) =>
        fact.key ===
        key,
    ) ??
    null
  );
}


function getFactValue(
  item,
  key,
) {
  return (
    getFact(
      item,
      key,
    )?.value ??
    null
  );
}


function getEvidenceSummary(
  item,
) {
  const fact =
    getFact(
      item,
      "evidence-summary",
    );


  return (
    safeString(
      fact?.value,
    ) ||
    safeString(
      item?.shortDescription,
    ) ||
    safeString(
      item?.title,
    )
  );
}


function contextFromInput(
  context = {},
) {
  return {
    continuing:
      context.continuing ===
      true,

    suppressRepeatedCTA:
      context
        .suppressRepeatedCTA !==
      false,
  };
}


/* ============================================================
 * NATURAL SUMMARY HELPERS
 * ============================================================
 */

function summaryAsExperiencePhrase(
  summary,
) {
  const text =
    firstSummaryClause(
      summary,
    );


  if (!text) {
    return "";
  }


  if (
    /^experiencia\b/i.test(
      text,
    )
  ) {
    return (
      `una ${lowercaseInitial(
        text,
      )}`
    );
  }


  return lowercaseInitial(
    text,
  );
}


function summaryAsVictorStatement(
  summary,
) {
  const text =
    firstSummaryClause(
      summary,
    );


  if (!text) {
    return "";
  }


  if (
    /^(experiencia|exposición|formación|aprendizaje|trayectoria)\b/i
      .test(
        text,
      )
  ) {
    return ensurePeriod(
      `Víctor cuenta con ${lowercaseInitial(
        text,
      )}`,
    );
  }


  return ensurePeriod(
    text,
  );
}


function naturalizeNoEvidenceSummary(
  summary,
) {
  let text =
    stripTerminalPunctuation(
      summary,
    );


  if (!text) {
    return "";
  }


  text =
    text.replace(
      /^no existe actualmente\s+/i,
      "Actualmente no consta ",
    );


  text =
    text.replace(
      /^no existe\s+/i,
      "No consta ",
    );


  return ensurePeriod(
    text,
  );
}


function projectSummaryAsApposition(
  summary,
) {
  let text =
    stripTerminalPunctuation(
      summary,
    );


  if (!text) {
    return "";
  }


  /*
   * Convertimos una ficha de catálogo:
   *
   * "Plataforma en desarrollo para recopilar..."
   *
   * en lenguaje que pueda continuar:
   *
   * "Víctor está desarrollando X,
   *  una plataforma para recopilar..."
   */
  text =
    text.replace(
      /^plataforma en desarrollo para\s+/i,
      "una plataforma para ",
    );


  text =
    text.replace(
      /^proyecto en desarrollo para\s+/i,
      "un proyecto para ",
    );


  text =
    text.replace(
      /^plataforma para\s+/i,
      "una plataforma para ",
    );


  text =
    text.replace(
      /^proyecto para\s+/i,
      "un proyecto para ",
    );


  return lowercaseInitial(
    text,
  );
}


/* ============================================================
 * QUESTION SEMANTICS
 * ============================================================
 */

export function asksCurrentStatus(
  text,
) {
  const normalized =
    normalizeText(
      text,
    );


  if (!normalized) {
    return false;
  }


  return [
    "actualmente",
    "ahora mismo",
    "a dia de hoy",
    "hoy en dia",
    "sigue trabajando",
    "trabaja actualmente",
    "usa actualmente",
    "utiliza actualmente",
    "experiencia actual",
    "trabajo actual",
  ].some(
    (pattern) =>
      normalized.includes(
        pattern,
      ),
  );
}


export function asksCertificationEarned(
  text,
) {
  const normalized =
    normalizeText(
      text,
    );


  if (!normalized) {
    return false;
  }


  return [
    "tiene la certificacion",
    "esta certificado",
    "esta certificada",
    "ha obtenido",
    "ha aprobado",
    "certificacion obtenida",
    "ya tiene",
  ].some(
    (pattern) =>
      normalized.includes(
        pattern,
      ),
  );
}


export function asksProjectFinished(
  text,
) {
  const normalized =
    normalizeText(
      text,
    );


  if (!normalized) {
    return false;
  }


  return [
    "esta terminado",
    "esta terminada",
    "esta acabado",
    "esta acabada",
    "esta finalizado",
    "esta finalizada",
    "ya esta terminado",
    "ya esta listo",
    "producto final",
    "esta completo",
  ].some(
    (pattern) =>
      normalized.includes(
        pattern,
      ),
  );
}


/* ============================================================
 * SPECIAL FACTUAL QUALIFICATIONS
 *
 * Knowledge factual has priority over generic similarity mode.
 * ============================================================
 */

function deriveCertificationQualification(
  item,
) {
  if (
    item?.type !==
    "certification"
  ) {
    return null;
  }


  const status =
    getFactValue(
      item,
      "certification-status",
    );


  const trainingCompleted =
    getFactValue(
      item,
      "training-completed",
    );


  const earned =
    getFactValue(
      item,
      "official-certification-earned",
    );


  if (
    status ===
      "preparing" &&
    earned ===
      false
  ) {
    return {
      reason:
        QUALIFIED_RESPONSE_REASON
          .CERTIFICATION_PREPARING,

      status,

      trainingCompleted:
        trainingCompleted ===
        true,

      earned:
        false,
    };
  }


  if (
    earned === false
  ) {
    return {
      reason:
        QUALIFIED_RESPONSE_REASON
          .CERTIFICATION_NOT_EARNED,

      status,

      trainingCompleted:
        trainingCompleted ===
        true,

      earned:
        false,
    };
  }


  return null;
}


function deriveExplicitTechnologyEvidenceQualification(
  item,
) {
  if (item?.type !== "technology") {
    return null;
  }

  const evidence = getFactValue(
    item,
    "experience-evidence",
  );

  if (
    Array.isArray(evidence) &&
    evidence.includes(EXPERIENCE_EVIDENCE.NO_EVIDENCE)
  ) {
    return {
      reason: QUALIFIED_RESPONSE_REASON.NO_EVIDENCE,
    };
  }

  return null;
}


function deriveProfessionalTemporalQualification(
  item,
  userText,
) {
  if (
    item?.type !==
      "technology" ||
    !asksCurrentStatus(
      userText,
    )
  ) {
    return null;
  }


  const current =
    getFactValue(
      item,
      "professional-current",
    );


  const historical =
    getFactValue(
      item,
      "professional-historical",
    );


  if (
    current === false &&
    historical === true
  ) {
    return {
      reason:
        QUALIFIED_RESPONSE_REASON
          .HISTORICAL_NOT_CURRENT,

      current:
        false,

      historical:
        true,
    };
  }


  return null;
}


function deriveProjectQualification(
  item,
) {
  if (
    item?.type !==
    "project"
  ) {
    return null;
  }


  const status =
    getFactValue(
      item,
      "project-status",
    ) ??
    item.metadata
      ?.projectStatus ??
    null;


  if (
    status ===
    "in_development"
  ) {
    return {
      reason:
        QUALIFIED_RESPONSE_REASON
          .PROJECT_IN_DEVELOPMENT,

      status,
    };
  }


  if (
    status ===
    "planned"
  ) {
    return {
      reason:
        QUALIFIED_RESPONSE_REASON
          .PROJECT_PLANNED,

      status,
    };
  }


  return null;
}


/* ============================================================
 * GENERIC EVIDENCE QUALIFICATION
 * ============================================================
 */

function qualificationFromAssessment(
  assessment,
) {
  switch (
    assessment
      ?.qualification
      ?.mode
  ) {
    case EVIDENCE_CLAIM_MODE
      .DIRECT_EXPERIENCE:
      return {
        reason:
          QUALIFIED_RESPONSE_REASON
            .DIRECT_EXPERIENCE,
      };


    case EVIDENCE_CLAIM_MODE
      .RELATED_EXPERIENCE:
      return {
        reason:
          QUALIFIED_RESPONSE_REASON
            .RELATED_EXPERIENCE,
      };


    case EVIDENCE_CLAIM_MODE
      .TRAINING_ONLY:
      return {
        reason:
          QUALIFIED_RESPONSE_REASON
            .TRAINING_ONLY,
      };


    case EVIDENCE_CLAIM_MODE
      .NO_EVIDENCE:

    default:
      return {
        reason:
          QUALIFIED_RESPONSE_REASON
            .NO_EVIDENCE,
      };
  }
}


/* ============================================================
 * QUALIFICATION RESOLUTION
 *
 * Priority:
 *
 * certification facts
 * → temporal professional facts
 * → project status
 * → similarity qualification
 * ============================================================
 */

export function resolveQualifiedResponseReason(
  {
    item,
    userText,
    assessment,
  } = {},
) {
  return (
    deriveCertificationQualification(
      item,
    ) ??
    deriveExplicitTechnologyEvidenceQualification(
      item,
    ) ??
    deriveProfessionalTemporalQualification(
      item,
      userText,
    ) ??
    deriveProjectQualification(
      item,
    ) ??
    qualificationFromAssessment(
      assessment,
    )
  );
}


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

function composeCertificationText(
  item,
  qualification,
) {
  const title =
    safeString(
      item.title,
    );


  if (
    qualification.reason ===
      QUALIFIED_RESPONSE_REASON
        .CERTIFICATION_PREPARING
  ) {
    if (
      qualification
        .trainingCompleted
    ) {
      return (
        `Todavía no. Víctor está preparando ${title}. ` +
        "Ya ha completado formación específica relacionada, " +
        "pero la certificación oficial aún no consta como obtenida."
      );
    }


    return (
      `Todavía no. Víctor está preparando ${title}, ` +
      "pero la certificación oficial aún no consta como obtenida."
    );
  }


  return (
    `No. No consta que Víctor haya obtenido oficialmente ${title}.`
  );
}


function composeHistoricalText(
  item,
) {
  const title =
    safeString(
      item.title,
    );


  const summary =
    getEvidenceSummary(
      item,
    );


  const experiencePhrase =
    summaryAsExperiencePhrase(
      summary,
    );


  if (experiencePhrase) {
    return (
      `${title} no consta entre sus tecnologías de trabajo actuales, ` +
      `aunque Víctor cuenta con ${experiencePhrase}.`
    );
  }


  return (
    `${title} no consta entre sus tecnologías de trabajo actuales, ` +
    "aunque sí existe experiencia profesional histórica relacionada."
  );
}


function composeProjectText(
  item,
  qualification,
) {
  const title =
    safeString(
      item.title,
    );


  const summary =
    safeString(
      item.shortDescription,
    );


  if (
    qualification.reason ===
      QUALIFIED_RESPONSE_REASON
        .PROJECT_IN_DEVELOPMENT
  ) {
    const description =
      projectSummaryAsApposition(
        summary,
      );


    if (description) {
      return (
        `Sí. Víctor está desarrollando ${title}, ${description}. ` +
        "Todavía no es una versión final."
      );
    }


    return (
      `Sí. Víctor está desarrollando ${title}. ` +
      "Todavía no es una versión final."
    );
  }


  return (
    `Sí. Hay un proyecto relacionado, ${title}, ` +
    "aunque por ahora está en fase de planificación."
  );
}


function composeNoEvidenceText(
  item,
) {
  const summary =
    getEvidenceSummary(
      item,
    );


  if (summary) {
    const cleaned =
      stripTerminalPunctuation(
        summary,
      );

    const noExperienceMatch =
      cleaned.match(
        /^no existe actualmente experiencia profesional ni formación confirmada en\s+(.+)$/i,
      );

    if (noExperienceMatch) {
      return (
        "No tengo base para decir que Víctor tenga experiencia profesional " +
        `o formación confirmada en ${noExperienceMatch[1]}.`
      );
    }

    const naturalSummary =
      naturalizeNoEvidenceSummary(
        summary,
      );


    if (
      /^no[.!?]/i.test(
        naturalSummary,
      )
    ) {
      return naturalSummary;
    }


    return (
      `No. ${naturalSummary}`
    );
  }


  return (
    `No tengo base suficiente para afirmar que Víctor tenga experiencia con ${item.title}.`
  );
}


function composeTrainingOnlyText(
  item,
) {
  const title =
    safeString(
      item.title,
    );


  const summary =
    getEvidenceSummary(
      item,
    );


  const detail =
    firstSummaryClause(
      summary,
    );


  if (detail) {
    return (
      `Víctor tiene ${lowercaseInitial(
        detail,
      )}. Aun así, eso no equivale a experiencia profesional ` +
      `con ${
        item.type === "technology"
          ? "esta tecnología"
          : title
      }.`
    );
  }


  return (
    `Víctor tiene formación relacionada con ${title}, ` +
    "pero eso no equivale a experiencia profesional."
  );
}


function composeDirectExperienceText(
  item,
) {
  const title =
    safeString(
      item.title,
    );


  const summary =
    getEvidenceSummary(
      item,
    );


  const naturalSummary =
    summaryAsVictorStatement(
      summary,
    );


  if (naturalSummary) {
    return (
      `Sí. ${naturalSummary}`
    );
  }


  return (
    `Sí. Víctor cuenta con experiencia directa relacionada con ${title}.`
  );
}


function composeRelatedExperienceText(
  item,
) {
  const title =
    safeString(
      item.title,
    );


  const summary =
    getEvidenceSummary(
      item,
    );


  const naturalSummary =
    summaryAsVictorStatement(
      summary,
    );


  if (naturalSummary) {
    return (
      `Sí, hay experiencia relacionada con ${title}, ` +
      "aunque no es exactamente el mismo caso. " +
      naturalSummary
    );
  }


  return (
    `Sí, hay experiencia relacionada con ${title}, ` +
    "aunque no es exactamente el mismo caso."
  );
}


export function composeQualifiedNaturalText(
  {
    item,
    qualification,
  } = {},
) {
  if (
    !item ||
    !qualification
  ) {
    return "";
  }


  switch (
    qualification.reason
  ) {
    case QUALIFIED_RESPONSE_REASON
      .CERTIFICATION_PREPARING:

    case QUALIFIED_RESPONSE_REASON
      .CERTIFICATION_NOT_EARNED:
      return composeCertificationText(
        item,
        qualification,
      );


    case QUALIFIED_RESPONSE_REASON
      .HISTORICAL_NOT_CURRENT:
      return composeHistoricalText(
        item,
      );


    case QUALIFIED_RESPONSE_REASON
      .PROJECT_IN_DEVELOPMENT:

    case QUALIFIED_RESPONSE_REASON
      .PROJECT_PLANNED:
      return composeProjectText(
        item,
        qualification,
      );


    case QUALIFIED_RESPONSE_REASON
      .TRAINING_ONLY:
      return composeTrainingOnlyText(
        item,
      );


    case QUALIFIED_RESPONSE_REASON
      .DIRECT_EXPERIENCE:
      return composeDirectExperienceText(
        item,
      );


    case QUALIFIED_RESPONSE_REASON
      .RELATED_EXPERIENCE:
      return composeRelatedExperienceText(
        item,
      );


    case QUALIFIED_RESPONSE_REASON
      .NO_EVIDENCE:

    default:
      return composeNoEvidenceText(
        item,
      );
  }
}


/* ============================================================
 * EVIDENCE IDS
 * ============================================================
 */

function evidenceKnowledgeIds(
  item,
  assessment,
) {
  const maxItems =
    Number.isInteger(
      item.answerPolicy
        ?.maxEvidenceItems,
    )
      ? item.answerPolicy
          .maxEvidenceItems
      : 3;


  return unique([
    item.id,

    ...(
      assessment?.results ??
      []
    ).map(
      (result) =>
        result.knowledgeId,
    ),
  ]).slice(
    0,
    Math.max(
      1,
      maxItems,
    ),
  );
}


function relevantFactIds(
  item,
  qualification,
) {
  const keys =
    new Set();


  switch (
    qualification.reason
  ) {
    case QUALIFIED_RESPONSE_REASON
      .HISTORICAL_NOT_CURRENT:
      keys.add(
        "professional-current",
      );

      keys.add(
        "professional-historical",
      );

      keys.add(
        "evidence-summary",
      );

      break;


    case QUALIFIED_RESPONSE_REASON
      .CERTIFICATION_PREPARING:

    case QUALIFIED_RESPONSE_REASON
      .CERTIFICATION_NOT_EARNED:
      keys.add(
        "certification-status",
      );

      keys.add(
        "training-completed",
      );

      keys.add(
        "official-certification-earned",
      );

      break;


    case QUALIFIED_RESPONSE_REASON
      .PROJECT_IN_DEVELOPMENT:

    case QUALIFIED_RESPONSE_REASON
      .PROJECT_PLANNED:
      keys.add(
        "project-status",
      );

      break;


    case QUALIFIED_RESPONSE_REASON
      .TRAINING_ONLY:

    case QUALIFIED_RESPONSE_REASON
      .NO_EVIDENCE:

    case QUALIFIED_RESPONSE_REASON
      .DIRECT_EXPERIENCE:

    case QUALIFIED_RESPONSE_REASON
      .RELATED_EXPERIENCE:
      keys.add(
        "experience-evidence",
      );

      keys.add(
        "evidence-summary",
      );

      break;
  }


  return (
    item.facts ??
    []
  )
    .filter(
      (fact) =>
        keys.has(
          fact.key,
        ),
    )
    .map(
      (fact) =>
        fact.id,
    );
}


/* ============================================================
 * TEMPLATE IDS
 * ============================================================
 */

function templateIdForReason(
  reason,
) {
  return (
    `qualified-${reason
      .replaceAll(
        "_",
        "-",
      )}`
  );
}


/* ============================================================
 * MAIN COMPOSER
 * ============================================================
 */

export function composeQualifiedResponse(
  {
    userText,
    knowledgeId,
    intent = null,
    context = {},
    faqId = null,
    answerQaId = null,
  } = {},
) {
  const text =
    safeString(
      userText,
    );


  if (
    !text ||
    !safeString(
      knowledgeId,
    )
  ) {
    return null;
  }


  const item =
    getKnowledgeById(
      knowledgeId,
    );


  if (!item) {
    return null;
  }


  const assessment =
    findSimilarEvidence(
      text,
    );


  const qualification =
    resolveQualifiedResponseReason({
      item,

      userText:
        text,

      assessment,
    });


  const answerText =
    composeQualifiedNaturalText({
      item,
      qualification,
    });


  if (!answerText) {
    return null;
  }


  const normalizedContext =
    contextFromInput(
      context,
    );


  const knowledgeIds =
    evidenceKnowledgeIds(
      item,
      assessment,
    );


  const factIds =
    relevantFactIds(
      item,
      qualification,
    );


  return createResponseEnvelope({
    id:
      `response-qualified-${item.id}`,

    kind:
      RESPONSE_KIND.KNOWLEDGE,

    outcome:
      RESPONSE_OUTCOME.QUALIFIED,

    intent,

    messages: [
      {
        id:
          `msg-qualified-${item.id}`,

        purpose:
          RESPONSE_MESSAGE_PURPOSE
            .ANSWER,

        text:
          answerText,
      },
    ],

    presentation: {
      depth:
        RESPONSE_DEPTH.MEDIUM,

      splitBubbles:
        false,

      variationFamily:
        templateIdForReason(
          qualification.reason,
        ),

      avoidRecentVariants:
        2,
    },

    evidence: {
      mode:
        RESPONSE_EVIDENCE_MODE.REQUIRED,

      knowledgeIds,

      factIds,

      qualificationReasons: [
        qualification.reason,
      ],
    },

    safety: {
      mustQualify:
        true,

      allowInference:
        false,

      forbiddenClaims:
        item.answerPolicy
          ?.forbiddenClaims ??
        [],
    },

    conversation: {
      stage:
        RESPONSE_STAGE.ACTIVE,

      continuity:
        normalizedContext
          .continuing
          ? RESPONSE_CONTINUITY
              .CONTINUING
          : RESPONSE_CONTINUITY.NEW,

      acknowledgeUser:
        true,

      suppressRepeatedCTA:
        normalizedContext
          .suppressRepeatedCTA,
    },

    stateEffects: {
      resetFallbacks:
        true,
    },

    trace: {
      faqId,

      answerQaId,

      responseTemplateId:
        templateIdForReason(
          qualification.reason,
        ),
    },
  });
}