import {
  capabilityKnowledgeById,
} from "./capabilities.js";

import {
  getProblemCapabilities,
  problemKnowledge,
} from "./problems.js";


/* ============================================================
 * MATCHER CONFIGURATION
 * ============================================================
 */

/*
 * Palabras funcionales que pueden aparecer entre los términos
 * importantes sin cambiar el significado del patrón.
 *
 * Ejemplo:
 *
 * "consolidar datos manualmente"
 *
 * debe poder coincidir con:
 *
 * "consolidar LOS datos manualmente"
 */
const MATCH_STOPWORDS =
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
      "unas",
      "unos",
      "y",
    ]),
  );


/* ============================================================
 * NORMALIZATION
 * ============================================================
 */

export function normalizeMatcherText(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9+]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


function tokenizeMatcherText(
  value,
) {
  const normalized =
    normalizeMatcherText(
      value,
    );

  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter(Boolean);
}


function getMeaningfulTokens(
  value,
) {
  return tokenizeMatcherText(
    value,
  ).filter(
    (token) =>
      !MATCH_STOPWORDS.has(
        token,
      ),
  );
}


function normalizeList(values) {
  return (
    Array.isArray(values)
      ? values
          .map(
            normalizeMatcherText,
          )
          .filter(Boolean)
      : []
  );
}


function getFactValue(
  problem,
  key,
) {
  return (
    problem.facts.find(
      (fact) =>
        fact.key === key,
    )?.value ?? []
  );
}


/* ============================================================
 * PATTERN MATCHING
 * ============================================================
 */

/*
 * El matcher utiliza dos estrategias:
 *
 * 1. Frase literal
 *    "muchos excel"
 *      ↓
 *    "tengo muchos excel"
 *
 * 2. Coincidencia por términos significativos
 *    "consolidar datos manualmente"
 *      ↓
 *    "tengo que consolidar los datos manualmente"
 *
 * Esto permite lenguaje natural sin convertir el matcher
 * en un sistema probabilístico.
 */
function matchesPattern(
  normalizedText,
  pattern,
) {
  if (
    !normalizedText ||
    typeof pattern !== "string"
  ) {
    return false;
  }

  const normalizedPattern =
    normalizeMatcherText(
      pattern,
    );

  if (!normalizedPattern) {
    return false;
  }

  const textTokens =
    tokenizeMatcherText(
      normalizedText,
    );

  if (
    textTokens.length === 0
  ) {
    return false;
  }

  const textTokenSet =
    new Set(textTokens);

  const rawPatternTokens =
    tokenizeMatcherText(
      normalizedPattern,
    );

  /*
   * Para una sola palabra usamos tokens completos.
   *
   * Esto evita falsos positivos del estilo:
   *
   * "ia"
   *
   * coincidiendo accidentalmente dentro de otra palabra.
   */
  if (
    rawPatternTokens.length === 1
  ) {
    return textTokenSet.has(
      rawPatternTokens[0],
    );
  }

  /*
   * Primero comprobamos la expresión literal.
   */
  if (
    normalizedText.includes(
      normalizedPattern,
    )
  ) {
    return true;
  }

  /*
   * Si la frase literal no aparece, permitimos palabras
   * intermedias siempre que todos los términos relevantes
   * estén presentes.
   */
  const meaningfulTokens =
    getMeaningfulTokens(
      normalizedPattern,
    );

  if (
    meaningfulTokens.length === 0
  ) {
    return false;
  }

  return meaningfulTokens.every(
    (token) =>
      textTokenSet.has(token),
  );
}


/* ============================================================
 * DIRECT RELATION QUERIES
 * ============================================================
 */

export function getCapabilitiesForProblem(
  problemId,
) {
  return getProblemCapabilities(
    problemId,
  )
    .map(
      (capabilityId) =>
        capabilityKnowledgeById[
          capabilityId
        ],
    )
    .filter(Boolean);
}


export function getProblemsForCapability(
  capabilityId,
) {
  if (
    typeof capabilityId !==
      "string" ||
    !capabilityId.trim()
  ) {
    return [];
  }

  return problemKnowledge.filter(
    (problem) =>
      getProblemCapabilities(
        problem.id,
      ).includes(
        capabilityId,
      ),
  );
}


/* ============================================================
 * PROBLEM SCORING
 * ============================================================
 */

function scoreProblem(
  normalizedText,
  problem,
) {
  let score = 0;

  const matchedAliases = [];
  const matchedSymptoms = [];
  const matchedSignals = [];

  const aliases =
    normalizeList(
      problem.aliases,
    );

  const symptoms =
    normalizeList(
      getFactValue(
        problem,
        "symptoms",
      ),
    );

  const signals =
    normalizeList(
      getFactValue(
        problem,
        "signals",
      ),
    );


  /*
   * ALIAS
   *
   * Es la evidencia semántica más fuerte del problema.
   */
  for (
    const alias of aliases
  ) {
    if (
      matchesPattern(
        normalizedText,
        alias,
      )
    ) {
      score += 6;

      matchedAliases.push(
        alias,
      );
    }
  }


  /*
   * SYMPTOM
   *
   * Describe comportamiento observable del problema.
   */
  for (
    const symptom of symptoms
  ) {
    if (
      matchesPattern(
        normalizedText,
        symptom,
      )
    ) {
      score += 4;

      matchedSymptoms.push(
        symptom,
      );
    }
  }


  /*
   * SIGNAL
   *
   * Es evidencia más débil y por eso pesa menos.
   */
  for (
    const signal of signals
  ) {
    if (
      matchesPattern(
        normalizedText,
        signal,
      )
    ) {
      score += 2;

      matchedSignals.push(
        signal,
      );
    }
  }


  return {
    problemId:
      problem.id,

    score,

    matchedAliases:
      [
        ...new Set(
          matchedAliases,
        ),
      ],

    matchedSymptoms:
      [
        ...new Set(
          matchedSymptoms,
        ),
      ],

    matchedSignals:
      [
        ...new Set(
          matchedSignals,
        ),
      ],

    capabilityIds:
      getProblemCapabilities(
        problem.id,
      ),
  };
}


/* ============================================================
 * TEXT → PROBLEM MATCHING
 * ============================================================
 */

export function matchProblemsByText(
  text,
  {
    limit = 5,
    minScore = 1,
  } = {},
) {
  const normalizedText =
    normalizeMatcherText(
      text,
    );

  if (!normalizedText) {
    return [];
  }

  const safeLimit =
    Number.isInteger(limit) &&
    limit > 0
      ? limit
      : 5;

  const safeMinScore =
    typeof minScore ===
      "number" &&
    Number.isFinite(
      minScore,
    )
      ? minScore
      : 1;


  return problemKnowledge
    .map(
      (problem) =>
        scoreProblem(
          normalizedText,
          problem,
        ),
    )

    .filter(
      (result) =>
        result.score >=
        safeMinScore,
    )

    .sort(
      (
        left,
        right,
      ) => {
        /*
         * Primero gana la puntuación.
         */
        if (
          right.score !==
          left.score
        ) {
          return (
            right.score -
            left.score
          );
        }

        /*
         * Si hay empate mantenemos un resultado
         * completamente determinista.
         */
        return left.problemId
          .localeCompare(
            right.problemId,
          );
      },
    )

    .slice(
      0,
      safeLimit,
    );
}


/* ============================================================
 * MATCH RESULT ENRICHMENT
 * ============================================================
 */

export function enrichProblemMatch(
  match,
) {
  if (
    !match ||
    typeof match.problemId !==
      "string"
  ) {
    return null;
  }

  return Object.freeze({
    ...match,

    capabilities:
      Object.freeze(
        getCapabilitiesForProblem(
          match.problemId,
        ),
      ),
  });
}


export function matchProblemCapabilities(
  text,
  options,
) {
  return matchProblemsByText(
    text,
    options,
  ).map(
    enrichProblemMatch,
  );
}