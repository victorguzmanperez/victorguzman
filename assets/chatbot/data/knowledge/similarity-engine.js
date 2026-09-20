import {
  EXPERIENCE_EVIDENCE,
} from "./constants.js";

import {
  technologyKnowledge,
} from "./technologies.js";

import {
  capabilityKnowledgeById,
} from "./capabilities.js";

import {
  getProblemById,
  getProblemFact,
} from "./problems.js";

import {
  matchProblemsByText,
  normalizeMatcherText,
} from "./problem-matcher.js";

import {
  evidenceIndex,
} from "./evidence-index.js";

import {
  EVIDENCE_CLAIM_MODE,
  EVIDENCE_DIMENSION_WEIGHT,
  EVIDENCE_KIND,
  EVIDENCE_KIND_WEIGHT,
  EVIDENCE_MATCH_LEVEL,
  SIMILARITY_USER_GOAL,
  capEvidenceLevel,
  classifyEvidenceScore,
} from "./evidence-model.js";


/* ============================================================
 * TEXT MATCHING
 * ============================================================
 */

const STOPWORDS =
  Object.freeze(
    new Set([
      "a",
      "al",
      "con",
      "de",
      "del",
      "el",
      "en",
      "la",
      "las",
      "los",
      "o",
      "para",
      "por",
      "sin",
      "un",
      "una",
      "unos",
      "unas",
      "y",
    ]),
  );


function tokenize(
  value,
) {
  const normalized =
    normalizeMatcherText(
      value,
    );

  return normalized
    ? normalized
        .split(" ")
        .filter(Boolean)
    : [];
}


function containsPattern(
  text,
  pattern,
) {
  const normalizedText =
    normalizeMatcherText(
      text,
    );

  const normalizedPattern =
    normalizeMatcherText(
      pattern,
    );

  if (
    !normalizedText ||
    !normalizedPattern
  ) {
    return false;
  }

  const textTokens =
    new Set(
      tokenize(
        normalizedText,
      ),
    );

  const patternTokens =
    tokenize(
      normalizedPattern,
    );

  if (
    patternTokens.length === 1
  ) {
    return textTokens.has(
      patternTokens[0],
    );
  }

  if (
    normalizedText.includes(
      normalizedPattern,
    )
  ) {
    return true;
  }

  const meaningful =
    patternTokens.filter(
      (token) =>
        !STOPWORDS.has(token),
    );

  return (
    meaningful.length > 0 &&
    meaningful.every(
      (token) =>
        textTokens.has(token),
    )
  );
}


function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}


/* ============================================================
 * TECHNOLOGY DETECTION
 * ============================================================
 */

function detectTechnologyIds(
  text,
) {
  return technologyKnowledge
    .filter(
      (technology) => {
        const patterns = [
          technology.title,
          ...technology.aliases,
        ];

        return patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        );
      },
    )
    .map(
      (technology) =>
        technology.id,
    );
}


/* ============================================================
 * EXPLICIT CAPABILITY DETECTION
 * ============================================================
 */

const CAPABILITY_PATTERNS =
  Object.freeze({
    "capability-data-migration": [
      "migrar datos",
      "migracion de datos",
      "migrar informacion",
      "migracion de sistemas",
    ],

    "capability-data-consolidation": [
      "consolidar datos",
      "unir datos",
      "combinar archivos",
    ],

    "capability-document-data-extraction": [
      "extraer datos",
      "extraer campos",
      "leer facturas",
    ],

    "capability-web-data-collection": [
      "scraping",
      "recopilar datos web",
      "revisar webs",
    ],

    "capability-scoring-and-rules": [
      "scoring",
      "reglas de negocio",
      "puntuacion",
    ],

    "capability-hierarchical-modeling": [
      "jerarquia",
      "modelo jerarquico",
      "subcompetencias",
      "criterios ponderados",
    ],

    "capability-financial-analysis": [
      "analisis financiero",
      "dividendos",
      "valoracion",
      "riesgo",
    ],

    "capability-reporting-automation": [
      "automatizar informes",
      "reporting automatico",
      "actualizar informes",
    ],

    "capability-process-automation": [
      "automatizar proceso",
      "trabajo manual",
      "tarea repetitiva",
      "copiar y pegar",
    ],
  });


function detectExplicitCapabilities(
  text,
) {
  return Object.entries(
    CAPABILITY_PATTERNS,
  )
    .filter(
      ([, patterns]) =>
        patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        ),
    )
    .map(
      ([capabilityId]) =>
        capabilityId,
    )
    .filter(
      (capabilityId) =>
        capabilityKnowledgeById[
          capabilityId
        ],
    );
}


/* ============================================================
 * BUSINESS AREAS
 * ============================================================
 */

const BUSINESS_AREA_PATTERNS =
  Object.freeze({
    banking: [
      "banca",
      "banco",
      "banking",
    ],

    "financial-markets": [
      "mercados financieros",
      "capital markets",
    ],

    finance: [
      "finanzas",
      "financiero",
      "inversion",
      "dividendos",
    ],

    marketing: [
      "marketing",
    ],

    investment: [
      "inversion",
      "acciones",
      "cartera",
    ],

    evaluation: [
      "evaluacion",
      "competencias",
      "scoring",
    ],
  });


function detectBusinessAreas(
  text,
) {
  return Object.entries(
    BUSINESS_AREA_PATTERNS,
  )
    .filter(
      ([, patterns]) =>
        patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        ),
    )
    .map(
      ([area]) =>
        area,
    );
}


/* ============================================================
 * OBJECTIVES
 * ============================================================
 */

const OBJECTIVE_PATTERNS =
  Object.freeze({
    "reduce-manual-work": [
      "ahorrar tiempo",
      "reducir trabajo manual",
      "dejar de hacerlo a mano",
      "automatizar",
    ],

    "single-data-source": [
      "centralizar datos",
      "unificar datos",
      "consolidar datos",
    ],

    "extract-structured-data": [
      "extraer datos",
      "extraer campos",
    ],

    "decision-support": [
      "analizar",
      "dashboard",
      "cuadro de mando",
      "tomar decisiones",
    ],

    "comparable-scoring": [
      "scoring",
      "comparar puntuaciones",
      "puntuar",
    ],

    "risk-analysis": [
      "riesgo",
    ],

    "financial-monitoring": [
      "seguimiento financiero",
      "dividendos",
      "cartera",
    ],

    "validate-results": [
      "validar resultados",
      "testing",
      "pruebas",
    ],

    "traceable-results": [
      "trazabilidad",
      "saber de donde sale",
    ],
  });


function detectObjectives(
  text,
) {
  return Object.entries(
    OBJECTIVE_PATTERNS,
  )
    .filter(
      ([, patterns]) =>
        patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        ),
    )
    .map(
      ([objective]) =>
        objective,
    );
}


/* ============================================================
 * PROCESS CHARACTERISTICS
 * ============================================================
 */

const PROCESS_PATTERNS =
  Object.freeze({
    repetitive: [
      "cada semana",
      "cada mes",
      "todos los dias",
      "repetitivo",
    ],

    manual: [
      "manualmente",
      "a mano",
      "copiar y pegar",
    ],

    "multi-source": [
      "muchos archivos",
      "varias fuentes",
      "varios excel",
    ],

    "document-heavy": [
      "pdf",
      "facturas",
      "documentos",
    ],

    "web-scale": [
      "cientos de webs",
      "muchas webs",
      "paginas web",
    ],

    "rule-based": [
      "reglas",
      "criterios",
      "scoring",
    ],

    hierarchical: [
      "jerarquia",
      "subcompetencias",
      "categorias",
      "pesos",
    ],

    financial: [
      "dividendos",
      "acciones",
      "riesgo",
      "valoracion",
    ],

    migration: [
      "migracion",
      "migrar",
    ],

    "machine-learning": [
      "machine learning",
      "aprendizaje automatico",
    ],

    "pl-300": [
      "pl-300",
      "pl300",
    ],
  });


function detectProcessCharacteristics(
  text,
) {
  return Object.entries(
    PROCESS_PATTERNS,
  )
    .filter(
      ([, patterns]) =>
        patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        ),
    )
    .map(
      ([characteristic]) =>
        characteristic,
    );
}


/* ============================================================
 * CONSTRAINTS
 * ============================================================
 */

const CONSTRAINT_PATTERNS =
  Object.freeze({
    "scanned-documents": [
      "escaneado",
      "imagen pdf",
    ],

    "authenticated-source": [
      "login",
      "credenciales",
      "web privada",
    ],

    "sensitive-data": [
      "datos sensibles",
      "confidencial",
      "datos privados",
    ],

    "financial-advice-request": [
      "que acciones comprar",
      "comprar acciones",
      "vender acciones",
      "recomiendame una accion",
    ],

    "time-constraint": [
      "urgente",
      "esta semana",
      "en dos dias",
    ],

    "budget-constraint": [
      "presupuesto",
      "precio maximo",
    ],
  });


function detectConstraints(
  text,
) {
  return Object.entries(
    CONSTRAINT_PATTERNS,
  )
    .filter(
      ([, patterns]) =>
        patterns.some(
          (pattern) =>
            containsPattern(
              text,
              pattern,
            ),
        ),
    )
    .map(
      ([constraint]) =>
        constraint,
    );
}


/* ============================================================
 * USER GOAL
 * ============================================================
 */

function detectUserGoal(
  text,
) {
  if (
    [
      "algo parecido",
      "caso parecido",
      "caso similar",
      "ha hecho algo",
      "ha trabajado en algo",
    ].some(
      (pattern) =>
        containsPattern(
          text,
          pattern,
        ),
    )
  ) {
    return (
      SIMILARITY_USER_GOAL
        .FIND_SIMILAR_CASE
    );
  }

  if (
    [
      "que proyectos",
      "ver proyectos",
      "portfolio",
    ].some(
      (pattern) =>
        containsPattern(
          text,
          pattern,
        ),
    )
  ) {
    return (
      SIMILARITY_USER_GOAL
        .BROWSE_PROJECTS
    );
  }

  if (
    [
      "experiencia",
      "ha trabajado",
      "sabe",
      "conoce",
    ].some(
      (pattern) =>
        containsPattern(
          text,
          pattern,
        ),
    )
  ) {
    return (
      SIMILARITY_USER_GOAL
        .ASK_EVIDENCE
    );
  }

  return (
    SIMILARITY_USER_GOAL
      .SOLVE_PROBLEM
  );
}


/* ============================================================
 * SIMILARITY PROFILE
 * ============================================================
 */

export function buildSimilarityProfile(
  text,
) {
  const normalizedText =
    normalizeMatcherText(
      text,
    );

  if (!normalizedText) {
    return Object.freeze({
      problems:
        Object.freeze([]),

      capabilitiesNeeded:
        Object.freeze([]),

      technologies:
        Object.freeze([]),

      businessAreas:
        Object.freeze([]),

      objectives:
        Object.freeze([]),

      processCharacteristics:
        Object.freeze([]),

      constraints:
        Object.freeze([]),

      userGoal:
        SIMILARITY_USER_GOAL
          .ASK_FACT,
    });
  }


  const problemMatches =
    matchProblemsByText(
      text,
      {
        limit: 5,
        minScore: 4,
      },
    );


  const problemIds =
    problemMatches.map(
      (match) =>
        match.problemId,
    );


  const capabilitiesFromProblems =
    problemMatches.flatMap(
      (match) =>
        match.capabilityIds,
    );


  const objectivesFromProblems =
    problemIds.flatMap(
      (problemId) => {
        const problem =
          getProblemById(
            problemId,
          );

        return (
          getProblemFact(
            problem,
            "objectives",
          )?.value ?? []
        );
      },
    );


  return Object.freeze({
    problems:
      Object.freeze(
        unique(
          problemIds,
        ),
      ),

    capabilitiesNeeded:
      Object.freeze(
        unique([
          ...capabilitiesFromProblems,
          ...detectExplicitCapabilities(
            text,
          ),
        ]),
      ),

    technologies:
      Object.freeze(
        unique(
          detectTechnologyIds(
            text,
          ),
        ),
      ),

    businessAreas:
      Object.freeze(
        unique(
          detectBusinessAreas(
            text,
          ),
        ),
      ),

    objectives:
      Object.freeze(
        unique([
          ...objectivesFromProblems,
          ...detectObjectives(
            text,
          ),
        ]),
      ),

    processCharacteristics:
      Object.freeze(
        unique(
          detectProcessCharacteristics(
            text,
          ),
        ),
      ),

    constraints:
      Object.freeze(
        unique(
          detectConstraints(
            text,
          ),
        ),
      ),

    userGoal:
      detectUserGoal(
        text,
      ),
  });
}


/* ============================================================
 * SCORE HELPERS
 * ============================================================
 */

function overlap(
  requested,
  available,
) {
  if (
    !Array.isArray(requested) ||
    requested.length === 0
  ) {
    return {
      ratio: 0,
      matched: [],
      active: false,
    };
  }

  const availableSet =
    new Set(
      available ?? [],
    );

  const matched =
    requested.filter(
      (value) =>
        availableSet.has(value),
    );

  return {
    ratio:
      matched.length /
      requested.length,

    matched,

    active: true,
  };
}


function determineMaximumLevel(
  evidence,
) {
  if (
    evidence.kind ===
    EVIDENCE_KIND.EDUCATION ||
    evidence.kind ===
    EVIDENCE_KIND.CERTIFICATION ||
    evidence.kind ===
    EVIDENCE_KIND.PROFILE ||
    evidence.kind ===
    EVIDENCE_KIND.CAPABILITY
  ) {
    return (
      EVIDENCE_MATCH_LEVEL
        .SUPPORTING
    );
  }


  if (
    evidence.kind ===
    EVIDENCE_KIND.PROJECT
  ) {
    const status =
      evidence.metadata
        ?.projectStatus;

    if (
      status ===
      "planned"
    ) {
      return (
        EVIDENCE_MATCH_LEVEL
          .SUPPORTING
      );
    }

    if (
      status ===
      "in_development"
    ) {
      return (
        EVIDENCE_MATCH_LEVEL
          .STRONG_RELATED
      );
    }

    return (
      EVIDENCE_MATCH_LEVEL
        .DIRECT
    );
  }


  if (
    evidence.kind ===
    EVIDENCE_KIND.TECHNOLOGY
  ) {
    if (
      evidence.evidenceModes.includes(
        EXPERIENCE_EVIDENCE
          .NO_EVIDENCE,
      )
    ) {
      return (
        EVIDENCE_MATCH_LEVEL
          .NO_EVIDENCE
      );
    }

    const professional =
      evidence.evidenceModes.some(
        (mode) =>
          [
            EXPERIENCE_EVIDENCE
              .PROFESSIONAL_CURRENT,

            EXPERIENCE_EVIDENCE
              .PROFESSIONAL_HISTORICAL,

            EXPERIENCE_EVIDENCE
              .PROJECT_APPLIED,
          ].includes(mode),
      );

    return professional
      ? EVIDENCE_MATCH_LEVEL.DIRECT
      : EVIDENCE_MATCH_LEVEL.SUPPORTING;
  }


  return (
    EVIDENCE_MATCH_LEVEL.DIRECT
  );
}


function calculateConstraintPenalty(
  profile,
  evidence,
) {
  let penalty = 0;

  const conflicts = [];


  if (
    profile.constraints.includes(
      "authenticated-source",
    ) &&
    evidence.constraints.includes(
      "public-access-required",
    )
  ) {
    penalty += 20;

    conflicts.push(
      "public-access-required",
    );
  }


  if (
    profile.constraints.includes(
      "scanned-documents",
    ) &&
    evidence.constraints.includes(
      "format-dependency",
    )
  ) {
    penalty += 10;

    conflicts.push(
      "document-format-risk",
    );
  }


  if (
    profile.constraints.includes(
      "financial-advice-request",
    ) &&
    evidence.constraints.includes(
      "not-financial-advice",
    )
  ) {
    penalty += 35;

    conflicts.push(
      "financial-advice-not-supported",
    );
  }


  return {
    penalty,
    conflicts,
  };
}


/* ============================================================
 * EVIDENCE SCORING
 * ============================================================
 */

export function scoreEvidence(
  profile,
  evidence,
) {
  const dimensions = {
    problems:
      overlap(
        profile.problems,
        evidence.problems,
      ),

    capabilities:
      overlap(
        profile.capabilitiesNeeded,
        evidence.capabilities,
      ),

    technologies:
      overlap(
        profile.technologies,
        evidence.technologies,
      ),

    objectives:
      overlap(
        profile.objectives,
        evidence.objectives,
      ),

    businessAreas:
      overlap(
        profile.businessAreas,
        evidence.businessAreas,
      ),

    processCharacteristics:
      overlap(
        profile.processCharacteristics,
        evidence.processCharacteristics,
      ),
  };


  let availableWeight = 0;
  let matchedWeight = 0;


  for (
    const [
      dimension,
      result,
    ]
    of Object.entries(
      dimensions,
    )
  ) {
    if (!result.active) {
      continue;
    }

    const weight =
      EVIDENCE_DIMENSION_WEIGHT[
        dimension
      ];

    availableWeight +=
      weight;

    matchedWeight +=
      weight *
      result.ratio;
  }


  const similarityScore =
    availableWeight > 0
      ? (
          matchedWeight /
          availableWeight
        ) * 100
      : 0;


  const kindWeight =
    EVIDENCE_KIND_WEIGHT[
      evidence.kind
    ] ?? 0;


  const weightedScore =
    similarityScore *
    kindWeight;


  const constraintResult =
    calculateConstraintPenalty(
      profile,
      evidence,
    );


  const finalScore =
    Math.max(
      0,
      Math.min(
        100,
        weightedScore -
        constraintResult.penalty,
      ),
    );


  const initialLevel =
    classifyEvidenceScore(
      finalScore,
    );


  const maximumLevel =
    determineMaximumLevel(
      evidence,
    );


  const level =
    capEvidenceLevel(
      initialLevel,
      maximumLevel,
    );


  return Object.freeze({
    evidenceId:
      evidence.id,

    knowledgeId:
      evidence.knowledgeId,

    kind:
      evidence.kind,

    title:
      evidence.title,

    score:
      Number(
        finalScore.toFixed(2),
      ),

    similarityScore:
      Number(
        similarityScore.toFixed(2),
      ),

    level,

    matched: Object.freeze({
      problems:
        Object.freeze(
          dimensions.problems
            .matched,
        ),

      capabilities:
        Object.freeze(
          dimensions.capabilities
            .matched,
        ),

      technologies:
        Object.freeze(
          dimensions.technologies
            .matched,
        ),

      objectives:
        Object.freeze(
          dimensions.objectives
            .matched,
        ),

      businessAreas:
        Object.freeze(
          dimensions.businessAreas
            .matched,
        ),

      processCharacteristics:
        Object.freeze(
          dimensions
            .processCharacteristics
            .matched,
        ),
    }),

    conflicts:
      Object.freeze(
        constraintResult
          .conflicts,
      ),

    evidenceModes:
      evidence.evidenceModes,

    constraints:
      evidence.constraints,

    metadata:
      evidence.metadata,
  });
}


/* ============================================================
 * EXPLANATION
 * ============================================================
 */

export function explainEvidenceResult(
  result,
) {
  if (!result) {
    return "";
  }

  const reasons = [];


  if (
    result.matched.problems
      .length
  ) {
    reasons.push(
      "el tipo de problema",
    );
  }


  if (
    result.matched.capabilities
      .length
  ) {
    reasons.push(
      "las capacidades necesarias",
    );
  }


  if (
    result.matched.technologies
      .length
  ) {
    reasons.push(
      "las tecnologías",
    );
  }


  if (
    result.matched.businessAreas
      .length
  ) {
    reasons.push(
      "el área de negocio",
    );
  }


  if (
    result.matched.objectives
      .length
  ) {
    reasons.push(
      "los objetivos",
    );
  }


  if (
    result.matched
      .processCharacteristics
      .length
  ) {
    reasons.push(
      "las características del proceso",
    );
  }


  const reasonText =
    reasons.length
      ? reasons.join(", ")
      : "evidencia relacionada";


  switch (
    result.level
  ) {
    case EVIDENCE_MATCH_LEVEL.DIRECT:
      return (
        `${result.title} presenta una coincidencia directa por ${reasonText}.`
      );

    case EVIDENCE_MATCH_LEVEL.STRONG_RELATED:
      return (
        `${result.title} es una evidencia muy relacionada por ${reasonText}, aunque no debe considerarse un caso idéntico.`
      );

    case EVIDENCE_MATCH_LEVEL.RELATED:
      return (
        `${result.title} aporta experiencia relacionada por ${reasonText}.`
      );

    case EVIDENCE_MATCH_LEVEL.SUPPORTING:
      return (
        `${result.title} aporta evidencia de apoyo por ${reasonText}, pero no demuestra por sí sola experiencia directa.`
      );

    default:
      return (
        `${result.title} no aporta evidencia suficiente para afirmar experiencia en ese caso.`
      );
  }
}


/* ============================================================
 * QUALIFICATION
 * ============================================================
 */

function hasProfessionalMode(
  result,
) {
  return result.evidenceModes.some(
    (mode) =>
      [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,

        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,

        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ].includes(mode),
  );
}


function isTrainingEvidence(
  result,
) {
  if (
    result.kind ===
      EVIDENCE_KIND.EDUCATION ||
    result.kind ===
      EVIDENCE_KIND.CERTIFICATION
  ) {
    return true;
  }

  if (
    result.kind ===
    EVIDENCE_KIND.TECHNOLOGY
  ) {
    return (
      !hasProfessionalMode(
        result,
      ) &&
      !result.evidenceModes.includes(
        EXPERIENCE_EVIDENCE
          .NO_EVIDENCE,
      )
    );
  }

  return false;
}


export function qualifyEvidenceResults(
  results,
) {
  const positive =
    results.filter(
      (result) =>
        result.level !==
        EVIDENCE_MATCH_LEVEL
          .NO_EVIDENCE,
    );


  if (
    positive.length === 0
  ) {
    return Object.freeze({
      mode:
        EVIDENCE_CLAIM_MODE
          .NO_EVIDENCE,

      canClaimDirectExperience:
        false,

      canClaimRelatedExperience:
        false,

      trainingOnly:
        false,

      message:
        "No consta evidencia suficiente para afirmar experiencia en ese caso.",
    });
  }


  const direct =
    positive.some(
      (result) =>
        result.level ===
          EVIDENCE_MATCH_LEVEL
            .DIRECT &&
        (
          result.kind ===
            EVIDENCE_KIND.EXPERIENCE ||
          result.kind ===
            EVIDENCE_KIND.PROJECT ||
          hasProfessionalMode(
            result,
          )
        ),
    );


  if (direct) {
    return Object.freeze({
      mode:
        EVIDENCE_CLAIM_MODE
          .DIRECT_EXPERIENCE,

      canClaimDirectExperience:
        true,

      canClaimRelatedExperience:
        true,

      trainingOnly:
        false,

      message:
        "Existe evidencia directa de experiencia o proyectos suficientemente similares.",
    });
  }


  const trainingOnly =
    positive.every(
      isTrainingEvidence,
    );


  if (trainingOnly) {
    return Object.freeze({
      mode:
        EVIDENCE_CLAIM_MODE
          .TRAINING_ONLY,

      canClaimDirectExperience:
        false,

      canClaimRelatedExperience:
        false,

      trainingOnly:
        true,

      message:
        "La evidencia disponible corresponde a formación o aprendizaje, no a experiencia profesional demostrada.",
    });
  }


  return Object.freeze({
    mode:
      EVIDENCE_CLAIM_MODE
        .RELATED_EXPERIENCE,

    canClaimDirectExperience:
      false,

    canClaimRelatedExperience:
      true,

    trainingOnly:
      false,

    message:
      "Existe experiencia o evidencia relacionada, pero no debe afirmarse que sea un caso idéntico.",
  });
}


/* ============================================================
 * SIMILARITY ENGINE
 * ============================================================
 */

export function findSimilarEvidence(
  input,
  {
    limit = 6,
    minScore = 40,
    includeNoEvidence = true,
  } = {},
) {
  const profile =
    typeof input === "string"
      ? buildSimilarityProfile(
          input,
        )
      : input;


  if (!profile) {
    return Object.freeze({
      profile: null,
      results: Object.freeze([]),
      qualification:
        qualifyEvidenceResults([]),
    });
  }


  const scored =
    evidenceIndex
      .map(
        (evidence) =>
          scoreEvidence(
            profile,
            evidence,
          ),
      )

      .filter(
        (result) =>
          result.score >=
            minScore ||
          (
            includeNoEvidence &&
            result.level ===
              EVIDENCE_MATCH_LEVEL
                .NO_EVIDENCE &&
            result.similarityScore >
              0
          ),
      )

      .sort(
        (
          left,
          right,
        ) => {
          if (
            right.score !==
            left.score
          ) {
            return (
              right.score -
              left.score
            );
          }

          return left.knowledgeId
            .localeCompare(
              right.knowledgeId,
            );
        },
      )

      .slice(
        0,
        Number.isInteger(limit) &&
        limit > 0
          ? limit
          : 6,
      );


  const qualification =
    qualifyEvidenceResults(
      scored,
    );


  return Object.freeze({
    profile,

    results:
      Object.freeze(
        scored,
      ),

    qualification,
  });
}