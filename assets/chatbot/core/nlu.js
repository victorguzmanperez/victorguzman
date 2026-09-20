/**
 * Asistente de Víctor
 * NLU local determinista.
 *
 * PREPROD.1.11.9 → 1.11.17
 *
 * Responsabilidad:
 * texto libre
 *   ↓
 * señales estructuradas
 *
 * NO:
 * - responde;
 * - modifica state;
 * - navega;
 * - abre Calendly;
 * - genera HTML.
 */

import {
  CONFIDENCE_BUCKET,
} from "./state.js";

import {
  extractEntities,
} from "./entities.js";

import {
  INTENT_IDS,
  intents,
} from "../data/intents.js";

import {
  analyzeTone,
} from "./tone-analyzer.js";


export const NLU_CONFIDENCE =
  Object.freeze({
    HIGH_MIN:
      0.72,

    MEDIUM_MIN:
      0.40,
  });


export const FALLBACK_LEVEL =
  Object.freeze({
    NONE:
      0,

    CLARIFY:
      1,

    CATEGORIES:
      2,

    ESCALATE:
      3,
  });


const SYNONYMS =
  Object.freeze({
    automatizacion:
      "automatizar",

    automatizado:
      "automatizar",

    automatizada:
      "automatizar",

    automaticamente:
      "automatizar",

    reportes:
      "informe",

    reporte:
      "informe",

    informes:
      "informe",

    dashboards:
      "dashboard",

    excels:
      "excel",

    ficheros:
      "archivo",

    archivos:
      "archivo",

    reuniones:
      "reunion",

    agendar:
      "reservar",

    cita:
      "reunion",

    ia:
      "inteligencia artificial",
    xlsx:
      "excel",

    xls:
      "excel",

  });


const SIMPLE_TYPO_MAP =
  Object.freeze({
    exel:
      "excel",

    excel:
      "excel",

    powebi:
      "powerbi",

    powerby:
      "powerbi",

    pwerbi:
      "powerbi",

    automatizr:
      "automatizar",

    automatiar:
      "automatizar",

    informee:
      "informe",
  });


function removeDiacritics(
  value,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


export function normalizeText(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    throw new TypeError(
      "normalizeText() requires a string",
    );
  }


  const original =
    text.trim();


  if (!original) {
    return {
      originalText:
        "",

      normalizedText:
        "",

      tokens:
        [],
    };
  }


  let normalized =
    removeDiacritics(
      original.toLowerCase(),
    );


  /**
 * El canal NLU elimina puntuación superficial
 * para que "informe" e "informe." sean equivalentes.
 *
 * Email y teléfono se extraen siempre desde
 * el texto original en entities.js, por lo que
 * no necesitamos conservar su puntuación aquí.
 */
  normalized =
    normalized
      .replace(
        /[¿?¡!.,;:"“”()[\]{}<>/\\|]+/g,
        " ",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();


  let tokens =
    normalized
      .split(" ")
      .filter(Boolean)
      .map(
        (token) =>
          SIMPLE_TYPO_MAP[
            token
          ] ??
          token,
      );


  tokens =
    tokens.flatMap(
      (token) => {
        const synonym =
          SYNONYMS[token];


        if (!synonym) {
          return [
            token,
          ];
        }


        return synonym
          .split(" ");
      },
    );


  normalized =
    tokens.join(" ");


  /**
   * Variantes multi-palabra.
   */
  normalized =
    normalized
      .replace(
        /\bpower\s+bi\b/g,
        "powerbi",
      )
      .replace(
        /\bpower\s+query\b/g,
        "power query",
      )
      .replace(
        /\bhojas?\s+de\s+calculo\b/g,
        "excel",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();


  tokens =
    normalized
      .split(" ")
      .filter(Boolean);


  return {
    originalText:
      original,

    normalizedText:
      normalized,

    tokens,
  };
}


function normalizeComparable(
  value,
) {
  return normalizeText(
    value,
  ).normalizedText;
}


function containsPhrase(
  normalizedText,
  phrase,
) {
  const normalizedPhrase =
    normalizeComparable(
      phrase,
    );


  if (!normalizedPhrase) {
    return false;
  }


  if (
    normalizedPhrase.includes(
      " ",
    )
  ) {
    return normalizedText.includes(
      normalizedPhrase,
    );
  }


  return (
    normalizedText
      .split(" ")
      .includes(
        normalizedPhrase,
      )
  );
}


function detectConcepts(
  normalizedText,
) {
  const concepts =
    new Set();


  const rules = [
    [
      "automation",
      /\bautomatizar\b/,
    ],

    [
      "manual_process",
      /\b(?:manual|manualmente|a mano|copio|copiamos|copiar|copiando|pego|pegamos|pegar|copiar y pegar)\b/,
    ],

    [
      "repetitive_process",
      /\b(?:cada|diariamente|semanalmente|mensualmente|todos los meses|todas las semanas|mismos pasos|repetitiv[oa]s?)\b/,
    ],

    [
      "excel",
      /\bexcel\b/,
    ],

    [
      "reporting",
      /\b(?:informe|reporting|dashboard|cuadro de mando)\b/,
    ],

    [
      "powerbi",
      /\b(?:powerbi|dax|power query)\b/,
    ],

    [
      "power_platform",
      /\b(?:power platform|power automate|power apps|copilot)\b/,
    ],

    [
      "artificial_intelligence",
      /\b(?:inteligencia artificial|ai|agente de ia)\b/,
    ],

    [
      "python",
      /\bpython\b/,
    ],

    [
      "booking",
      /\b(?:reunion|reservar|calendly)\b/,
    ],

    [
      "pricing",
      /\b(?:precio|coste|cuesta|presupuesto|cobra)\b/,
    ],

    [
      "timeline",
      /\b(?:plazo|cuanto tarda|cuanto tardaria|cuando estaria)\b/,
    ],
  ];


  for (
    const [
      concept,
      pattern,
    ]
    of rules
  ) {
    if (
      pattern.test(
        normalizedText,
      )
    ) {
      concepts.add(
        concept,
      );
    }
  }


  return [
    ...concepts,
  ];
}


function exampleSimilarity(
  normalizedText,
  normalizedExample,
) {
  if (
    normalizedText ===
    normalizedExample
  ) {
    return 1;
  }


  if (
    normalizedText.includes(
      normalizedExample,
    ) ||
    normalizedExample.includes(
      normalizedText,
    )
  ) {
    return 0.85;
  }


  const inputTokens =
    new Set(
      normalizedText
        .split(" ")
        .filter(Boolean),
    );


  const exampleTokens =
    new Set(
      normalizedExample
        .split(" ")
        .filter(Boolean),
    );


  if (
    inputTokens.size === 0 ||
    exampleTokens.size === 0
  ) {
    return 0;
  }


  let intersection =
    0;


  for (
    const token
    of inputTokens
  ) {
    if (
      exampleTokens.has(
        token,
      )
    ) {
      intersection +=
        1;
    }
  }


  return (
    intersection /
    Math.max(
      inputTokens.size,
      exampleTokens.size,
    )
  );
}


function contextBoostForIntent(
  intent,
  context,
) {
  if (
    !context ||
    typeof context !== "object"
  ) {
    return 0;
  }


  let boost =
    0;


  const candidates = [
    context.currentTopic,
    context.previousIntent,
    context.pageType,
    context.section,
  ].filter(
    (value) =>
      typeof value ===
        "string" &&
      value.trim(),
  );


  for (
    const candidate
    of candidates
  ) {
    const weight =
      intent.contextBoost[
        candidate
      ];


    if (
      typeof weight ===
      "number"
    ) {
      boost +=
        weight *
        intent.weights.context;
    }
  }


  return boost;
}


export function scoreIntent(
  intent,
  analysisInput,
  context = {},
) {
  if (
    !intent ||
    typeof intent !== "object"
  ) {
    throw new TypeError(
      "scoreIntent() requires an intent",
    );
  }


  const {
    normalizedText,
    concepts,
  } =
    analysisInput;


  let score =
    0;

  const reasons =
    [];


  /**
   * Required terms.
   *
   * Si existe alguno y falta,
   * el intent queda descartado.
   */
  for (
    const required
    of intent.requiredTerms
  ) {
    if (
      !containsPhrase(
        normalizedText,
        required,
      )
    ) {
      return {
        id:
          intent.id,

        score:
          0,

        priority:
          intent.priority,

        reasons: [
          `missing_required:${required}`,
        ],

        blocked:
          true,
      };
    }


    score +=
      intent.weights.required;


    reasons.push(
      `required:${required}`,
    );
  }


  /**
   * Negative terms.
   */
  for (
    const negative
    of intent.negativeTerms
  ) {
    if (
      containsPhrase(
        normalizedText,
        negative,
      )
    ) {
      score -=
        intent.weights.negative;


      reasons.push(
        `negative:${negative}`,
      );
    }
  }


    /**
   * Keywords.
   *
   * Varios aliases pueden normalizar al mismo término
   * semántico:
   *
   * informes -> informe
   * reporte  -> informe
   * power bi -> powerbi
   *
   * Una misma evidencia nunca debe puntuar dos veces.
   */
  const matchedKeywords =
    new Set();


  for (
    const keyword
    of intent.keywords
  ) {
    const normalizedKeyword =
      normalizeComparable(
        keyword,
      );


    if (
      !normalizedKeyword ||
      matchedKeywords.has(
        normalizedKeyword,
      )
    ) {
      continue;
    }


    if (
      containsPhrase(
        normalizedText,
        keyword,
      )
    ) {
      matchedKeywords.add(
        normalizedKeyword,
      );


      score +=
        intent.weights.keyword;


      reasons.push(
        `keyword:${keyword}`,
      );
    }
  }


  /**
   * Concepts.
   */
  for (
    const concept
    of intent.concepts
  ) {
    if (
      concepts.includes(
        concept,
      )
    ) {
      score +=
        intent.weights.concept;


      reasons.push(
        `concept:${concept}`,
      );
    }
  }


  /**
   * Example similarity.
   *
   * Solo aplicamos bonus significativo
   * cuando existe similitud real.
   */
  let bestExample =
    0;


  for (
    const example
    of intent.examples
  ) {
    const similarity =
      exampleSimilarity(
        normalizedText,
        normalizeComparable(
          example,
        ),
      );


    bestExample =
      Math.max(
        bestExample,
        similarity,
      );
  }


  if (
    bestExample >=
    0.45
  ) {
    const exampleScore =
      bestExample *
      intent.weights.example;


    score +=
      exampleScore;


    reasons.push(
      `example:${bestExample.toFixed(2)}`,
    );
  }


  /**
   * Conversational context.
   */
  const contextBoost =
    contextBoostForIntent(
      intent,
      context,
    );


  if (
    contextBoost > 0 && score > 0
  ) {
    score +=
      contextBoost;


    reasons.push(
      `context:${contextBoost.toFixed(2)}`,
    );
  }


  return {
    id:
      intent.id,

    score:
      Math.max(
        0,
        Number(
          score.toFixed(4),
        ),
      ),

    priority:
      intent.priority,

    reasons,

    blocked:
      false,
  };
}


export function scoreIntents(
  normalized,
  context = {},
) {
  const concepts =
    detectConcepts(
      normalized.normalizedText,
    );


  const scored =
    intents.map(
      (intent) =>
        scoreIntent(
          intent,
          {
            normalizedText:
              normalized.normalizedText,

            concepts,
          },
          context,
        ),
    );


  scored.sort(
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


      return (
        right.priority -
        left.priority
      );
    },
  );


  return {
    concepts,
    scored,
  };
}


export function calculateConfidence(
  scoredIntents,
) {
  if (
    !Array.isArray(
      scoredIntents,
    )
  ) {
    throw new TypeError(
      "calculateConfidence() requires an array",
    );
  }


  const first =
    scoredIntents[0] ??
    null;

  const second =
    scoredIntents[1] ??
    null;


  if (
    !first ||
    first.score <= 0
  ) {
    return 0;
  }


  /**
   * Saturación:
   * score 10 ≈ evidencia fuerte.
   */
  const absoluteEvidence =
    Math.min(
      1,
      first.score / 10,
    );


  /**
   * Separación respecto al segundo candidato.
   */
  const separation =
    second &&
    second.score > 0
      ? Math.max(
          0,
          (
            first.score -
            second.score
          ) /
          Math.max(
            first.score,
            1,
          ),
        )
      : 1;


  /**
   * Evitamos que un solo keyword dé HIGH.
   */
  const weightedConfidence =
    (
      absoluteEvidence *
      0.72
    ) +
    (
      separation *
      0.28
    );


  /**
   * Cuando existe evidencia semántica suficiente,
   * un empate entre varios intents no significa
   * que no entendamos el mensaje.
   *
   * La incertidumbre entre intents se expresa
   * separadamente mediante ambiguity.
   */
  const confidence =
    first.score >= 3.5
      ? Math.max(
          absoluteEvidence,
          weightedConfidence,
        )
      : weightedConfidence;


  return Number(
    Math.min(
      1,
      confidence,
    ).toFixed(4),
  );
}


export function getConfidenceBucket(
  confidence,
) {
  if (
    typeof confidence !==
      "number" ||
    !Number.isFinite(
      confidence,
    ) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new RangeError(
      "confidence must be between 0 and 1",
    );
  }


  if (
    confidence >=
    NLU_CONFIDENCE.HIGH_MIN
  ) {
    return CONFIDENCE_BUCKET.HIGH;
  }


  if (
    confidence >=
    NLU_CONFIDENCE.MEDIUM_MIN
  ) {
    return CONFIDENCE_BUCKET.MEDIUM;
  }


  return CONFIDENCE_BUCKET.LOW;
}


function secondaryIntentThreshold(
  primaryScore,
) {
  return Math.max(
    3.5,
    primaryScore *
      0.38,
  );
}


export function resolveIntents(
  scored,
  confidence,
) {
  const primary =
    scored[0] ??
    null;


  if (
    !primary ||
    primary.score <= 0
  ) {
    return {
      primaryIntent:
        null,

      secondaryIntents:
        [],
    };
  }


  /**
   * Un LOW extremadamente débil
   * no se convierte artificialmente
   * en intent seguro.
   */
  if (
    confidence < 0.2 &&
    primary.score < 2.5
  ) {
    return {
      primaryIntent:
        null,

      secondaryIntents:
        [],
    };
  }


  const threshold =
    secondaryIntentThreshold(
      primary.score,
    );


  const secondaryIntents =
    scored
      .slice(1)
      .filter(
        (candidate) =>
          candidate.score >=
            threshold &&
          candidate.id !==
            primary.id,
      )
      .slice(
        0,
        4,
      )
      .map(
        (candidate) =>
          candidate.id,
      );


  return {
    primaryIntent:
      primary.id,

    secondaryIntents,
  };
}


export function detectAmbiguity(
  scored,
  confidence,
) {
  const first =
    scored[0] ??
    null;

  const second =
    scored[1] ??
    null;


  if (
    !first ||
    first.score <= 0
  ) {
    return {
      ambiguous:
        false,

      candidates:
        [],
    };
  }


  if (
    !second ||
    second.score <= 0
  ) {
    return {
      ambiguous:
        false,

      candidates: [
        first.id,
      ],
    };
  }


  const gap =
    first.score -
    second.score;


  const relativeGap =
    gap /
    Math.max(
      first.score,
      1,
    );


  const ambiguous =
    confidence <
      NLU_CONFIDENCE.HIGH_MIN &&
    relativeGap <=
      0.18;


  return {
    ambiguous,

    candidates:
      ambiguous
        ? [
            first.id,
            second.id,
          ]
        : [
            first.id,
          ],

    scoreGap:
      Number(
        gap.toFixed(4),
      ),
  };
}


export function resolveContext(
  normalized,
  context = {},
) {
  const text =
    normalized.normalizedText;


  const result = {
    continuation:
      false,

    polarity:
      null,

    previousIntent:
      typeof context
        .previousIntent ===
        "string"
        ? context.previousIntent
        : null,

    currentTopic:
      typeof context
        .currentTopic ===
        "string"
        ? context.currentTopic
        : null,
  };


  if (
    /^(?:si|vale|de acuerdo|correcto|exacto)$/
      .test(text)
  ) {
    result.continuation =
      true;

    result.polarity =
      "positive";
  }


  if (
    /^(?:no|nope|negativo|para nada)$/
      .test(text)
  ) {
    result.continuation =
      true;

    result.polarity =
      "negative";
  }


  return result;
}

export function getFallbackLevel({
  confidenceBucket,
  primaryIntent,
  ambiguous = false,
  consecutiveFallbacks = 0,
} = {}) {
  /**
   * HIGH y MEDIUM con intent reconocido
   * NO son fallback.
   *
   * MEDIUM y/o ambiguous podrán requerir
   * confirmación conversacional, pero eso
   * pertenece al Dialogue Manager.
   */
  if (
    primaryIntent &&
    confidenceBucket !==
      CONFIDENCE_BUCKET.LOW
  ) {
    return FALLBACK_LEVEL.NONE;
  }


  /**
   * Los fallbacks consecutivos cambian
   * progresivamente de estrategia.
   */
  if (
    consecutiveFallbacks >= 2
  ) {
    return FALLBACK_LEVEL.ESCALATE;
  }


  if (
    consecutiveFallbacks === 1
  ) {
    return FALLBACK_LEVEL.CATEGORIES;
  }


  return FALLBACK_LEVEL.CLARIFY;
}

export function analyzeMessage(
  text,
  context = {},
) {
  const normalized =
    normalizeText(
      text,
    );


  const entities =
    extractEntities(
      text,
    );


  /*
   * Señal efímera: describe el tono lingüístico del turno.
   * No se persiste en state mediante toStateIntentResult().
   */
  const tone =
    analyzeTone(
      text,
    );


  const contextResolution =
    resolveContext(
      normalized,
      context,
    );


  /**
   * Respuestas cortas como "sí" o "no"
   * no deben clasificarse como un intent
   * nuevo sin contexto.
   */
  if (
    contextResolution.continuation &&
    contextResolution.previousIntent
  ) {
    const confidence =
      0.82;


    const confidenceBucket =
      getConfidenceBucket(
        confidence,
      );


    return {
      normalizedText:
        normalized.normalizedText,

      tokens:
        normalized.tokens,

      primaryIntent:
        contextResolution
          .previousIntent,

      secondaryIntents:
        [],

      confidence,

      confidenceBucket,

      needsConfirmation:
        false,

      entities,

      tone,

      concepts: [
        "contextual_reply",
      ],

      context:
        contextResolution,

      ambiguity: {
        ambiguous:
          false,

        candidates: [
          contextResolution
            .previousIntent,
        ],
      },

      fallbackLevel:
        FALLBACK_LEVEL.NONE,

      candidates:
        [],

      isFallback:
        false,
    };
  }


  const {
    concepts,
    scored,
  } =
    scoreIntents(
      normalized,
      context,
    );


  const confidence =
    calculateConfidence(
      scored,
    );


  const confidenceBucket =
    getConfidenceBucket(
      confidence,
    );


  const resolved =
    resolveIntents(
      scored,
      confidence,
    );


  const ambiguity =
    detectAmbiguity(
      scored,
      confidence,
    );


  const fallbackLevel =
    getFallbackLevel({
      confidenceBucket,

      primaryIntent:
        resolved.primaryIntent,

      ambiguous:
        ambiguity.ambiguous,

      consecutiveFallbacks:
        Number.isInteger(
          context.consecutiveFallbacks,
        )
          ? context
              .consecutiveFallbacks
          : 0,
    });


  /**
   * MEDIUM no significa fallback.
   *
   * Si existe un intent razonable pero la confianza
   * todavía no es HIGH, el Dialogue Manager podrá
   * confirmar la interpretación antes de actuar.
   *
   * También pediremos confirmación cuando dos intents
   * estén demasiado próximos.
   */
  const needsConfirmation =
    Boolean(
      resolved.primaryIntent,
    ) &&
    (
      confidenceBucket ===
        CONFIDENCE_BUCKET.MEDIUM ||
      ambiguity.ambiguous
    );


  return {
    normalizedText:
      normalized.normalizedText,

    tokens:
      normalized.tokens,

    primaryIntent:
      resolved.primaryIntent,

    secondaryIntents:
      resolved.secondaryIntents,

    confidence,

    confidenceBucket,

    needsConfirmation,

    entities,

    tone,

    concepts,

    context:
      contextResolution,

    ambiguity,

    fallbackLevel,

    candidates:
      scored
        .filter(
          (candidate) =>
            candidate.score > 0,
        )
        .slice(
          0,
          6,
        ),

    isFallback:
      fallbackLevel !==
      FALLBACK_LEVEL.NONE,
  };
}


/**
 * Helper para construir el payload
 * compatible con state.setIntentResult().
 *
 * NO modifica state.
 */
export function toStateIntentResult(
  analysis,
) {
  if (
    !analysis ||
    typeof analysis !== "object"
  ) {
    throw new TypeError(
      "toStateIntentResult() requires an analysis",
    );
  }


  return {
    primaryIntent:
      analysis.primaryIntent,

    secondaryIntents:
      [
        ...analysis
          .secondaryIntents,
      ],

    confidence:
      analysis.confidence,

    confidenceBucket:
      analysis.confidenceBucket,

    concepts:
      [
        ...analysis.concepts,
      ],

    /**
     * No almacenamos texto original ni PII
     * dentro de lastAnalysis.
     *
     * Guardamos únicamente señales técnicas.
     */
    lastAnalysis: {
      ambiguity:
        analysis.ambiguity,

      needsConfirmation:
        Boolean(
          analysis.needsConfirmation,
        ),

      fallbackLevel:
        analysis.fallbackLevel,

      candidates:
        analysis.candidates.map(
          (candidate) => ({
            id:
              candidate.id,

            score:
              candidate.score,
          }),
        ),
    },
  };
}


/**
 * Reexport útil para consumidores
 * que necesiten IDs estables.
 */
export {
  INTENT_IDS,
};