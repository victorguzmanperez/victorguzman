import test
  from "node:test";

import assert
  from "node:assert/strict";


import * as state
  from "../core/state.js";

import {
  FALLBACK_LEVEL,
  INTENT_IDS,
  analyzeMessage,
  calculateConfidence,
  detectAmbiguity,
  getConfidenceBucket,
  normalizeText,
  resolveContext,
  scoreIntents,
  toStateIntentResult,
} from "../core/nlu.js";

import {
  extractBusinessArea,
  extractCompany,
  extractCurrentProcess,
  extractEmail,
  extractEntities,
  extractFrequency,
  extractName,
  extractObjective,
  extractPhone,
  extractTimeframe,
  extractTools,
  extractUsers,
  extractVolume,
} from "../core/entities.js";

import {
  getIntentById,
  intents,
} from "../data/intents.js";


/**
 * ============================================================
 * NORMALIZATION
 * ============================================================
 */

test(
  "normalization lowercases removes accents punctuation and extra spaces",
  () => {
    const result =
      normalizeText(
        "  ¡HÓLA,   Víctor!  ",
      );


    assert.equal(
      result.normalizedText,
      "hola victor",
    );


    assert.deepEqual(
      result.tokens,
      [
        "hola",
        "victor",
      ],
    );
  },
);

test(
  "normalization removes sentence-final periods without breaking semantic tokens",
  () => {
    const result =
      normalizeText(
        "Necesito preparar el informe.",
      );


    assert.equal(
      result.normalizedText,
      "necesito preparar el informe",
    );


    assert.deepEqual(
      result.tokens,
      [
        "necesito",
        "preparar",
        "el",
        "informe",
      ],
    );
  },
);

test(
  "normalization handles common Power BI and Excel variants",
  () => {
    assert.equal(
      normalizeText(
        "Uso Power BI y hojas de cálculo",
      ).normalizedText,
      "uso powerbi y excel",
    );


    assert.equal(
      normalizeText(
        "Tengo EXEL",
      ).normalizedText,
      "tengo excel",
    );
  },
);


test(
  "normalization rejects non strings",
  () => {
    assert.throws(
      () =>
        normalizeText(
          null,
        ),
      TypeError,
    );
  },
);


/**
 * ============================================================
 * INTENT CATALOG
 * ============================================================
 */

test(
  "intent catalog has unique ids and required scorer fields",
  () => {
    const ids =
      intents.map(
        (intent) =>
          intent.id,
      );


    assert.equal(
      new Set(ids).size,
      ids.length,
    );


    for (
      const intent
      of intents
    ) {
      assert.equal(
        typeof intent.id,
        "string",
      );

      assert.equal(
        typeof intent.priority,
        "number",
      );

      assert.ok(
        Array.isArray(
          intent.examples,
        ),
      );

      assert.ok(
        Array.isArray(
          intent.keywords,
        ),
      );

      assert.ok(
        Array.isArray(
          intent.concepts,
        ),
      );

      assert.ok(
        Array.isArray(
          intent.negativeTerms,
        ),
      );

      assert.ok(
        Array.isArray(
          intent.requiredTerms,
        ),
      );

      assert.equal(
        typeof intent.weights,
        "object",
      );
    }
  },
);


test(
  "intent lookup resolves known ids safely",
  () => {
    assert.equal(
      getIntentById(
        "automation",
      )?.id,
      "automation",
    );


    assert.equal(
      getIntentById(
        "does-not-exist",
      ),
      null,
    );
  },
);


/**
 * ============================================================
 * ENTITY EXTRACTION
 * ============================================================
 */

test(
  "email extractor recognizes a valid email",
  () => {
    assert.equal(
      extractEmail(
        "Mi email es Ana.Demo+web@example.com",
      ),
      "ana.demo+web@example.com",
    );
  },
);


test(
  "phone extractor normalizes Spanish phone",
  () => {
    assert.equal(
      extractPhone(
        "Mi teléfono es +34 612 34 56 78",
      ),
      "+34612345678",
    );
  },
);


test(
  "name extractor detects explicit self identification",
  () => {
    assert.equal(
      extractName(
        "Hola, me llamo Ana García.",
      ),
      "Ana García",
    );
  },
);


test(
  "company extractor detects explicit company",
  () => {
    assert.equal(
      extractCompany(
        "Mi empresa se llama Levante Data.",
      ),
      "Levante Data",
    );
  },
);


test(
  "tool extractor detects multiple tools without duplicates",
  () => {
    assert.deepEqual(
      extractTools(
        "Trabajo con Excel, Power BI, Power Query y Python, también PowerBI",
      ),
      [
        "excel",
        "power-bi",
        "power-query",
        "python",
      ],
    );
  },
);


test(
  "frequency extractor handles weekly language",
  () => {
    assert.equal(
      extractFrequency(
        "Lo hacemos todos los lunes",
      ),
      "weekly",
    );


    assert.equal(
      extractFrequency(
        "Se actualiza mensualmente",
      ),
      "monthly",
    );
  },
);


test(
  "users extractor returns integer",
  () => {
    assert.equal(
      extractUsers(
        "Lo utilizan 25 usuarios",
      ),
      25,
    );
  },
);


test(
  "volume extractor separates files records and sources",
  () => {
    assert.deepEqual(
      extractVolume(
        "Tengo 20 archivos, 30000 registros y 4 fuentes",
      ),
      {
        files:
          20,

        records:
          30000,

        sources:
          4,
      },
    );
  },
);


test(
  "timeframe extractor detects explicit deadlines",
  () => {
    assert.equal(
      extractTimeframe(
        "Lo necesito en 3 semanas",
      ),
      "3 weeks",
    );


    assert.equal(
      extractTimeframe(
        "Es urgente",
      ),
      "urgent",
    );
  },
);


test(
  "business area extractor detects finance",
  () => {
    assert.equal(
      extractBusinessArea(
        "Es un proceso del área financiera",
      ),
      "finanzas",
    );
  },
);


test(
  "current process extractor detects manual work",
  () => {
    assert.equal(
      extractCurrentProcess(
        "Ahora mismo lo hacemos manualmente",
      ),
      "manual",
    );
  },
);

test(
  "current process extractor recognizes copy and paste as manual work",
  () => {
    assert.equal(
      extractCurrentProcess(
        "Quiero dejar de copiar y pegar información",
      ),
      "manual",
    );
  },
);


test(
  "objective extractor captures explicit objective",
  () => {
    assert.equal(
      extractObjective(
        "Quiero reducir el trabajo manual.",
      ),
      "reducir el trabajo manual",
    );
  },
);


test(
  "extractEntities returns state-compatible structure",
  () => {
    const result =
      extractEntities(
        "Me llamo Ana García. Mi empresa se llama Levante Data. Tengo 20 archivos Excel que preparo manualmente cada semana para Power BI y lo utilizan 5 usuarios.",
      );


    assert.equal(
      result.contact.name,
      "Ana García",
    );


    assert.equal(
      result.contact.company,
      "Levante Data",
    );


    assert.deepEqual(
      result.case.tools,
      [
        "excel",
        "power-bi",
      ],
    );


    assert.equal(
      result.case.currentProcess,
      "manual",
    );


    assert.equal(
      result.case.frequency,
      "weekly",
    );


    assert.equal(
      result.case.users,
      5,
    );


    assert.equal(
      result.case.volume.files,
      20,
    );
  },
);


/**
 * ============================================================
 * INTENT SCORING
 * ============================================================
 */

test(
  "automation message ranks automation first",
  () => {
    const normalized =
      normalizeText(
        "Quiero automatizar un proceso manual repetitivo",
      );


    const result =
      scoreIntents(
        normalized,
      );


    assert.equal(
      result.scored[0].id,
      INTENT_IDS.AUTOMATION,
    );


    assert.ok(
      result.scored[0].score >
        0,
    );
  },
);


test(
  "Power BI question ranks Power BI intent",
  () => {
    const result =
      analyzeMessage(
        "¿Víctor trabaja con Power BI?",
      );


    assert.equal(
      result.primaryIntent,
      INTENT_IDS.POWER_BI,
    );
  },
);


test(
  "pricing question is detected without answering a price",
  () => {
    const result =
      analyzeMessage(
        "¿Cuánto cuesta trabajar con Víctor?",
      );


    assert.equal(
      result.primaryIntent,
      INTENT_IDS.PRICING,
    );


    assert.equal(
      "answer" in result,
      false,
    );
  },
);


/**
 * ============================================================
 * CONFIDENCE
 * ============================================================
 */

test(
  "confidence bucket follows fixed thresholds",
  () => {
    assert.equal(
      getConfidenceBucket(
        0.9,
      ),
      state.CONFIDENCE_BUCKET.HIGH,
    );


    assert.equal(
      getConfidenceBucket(
        0.55,
      ),
      state.CONFIDENCE_BUCKET.MEDIUM,
    );


    assert.equal(
      getConfidenceBucket(
        0.2,
      ),
      state.CONFIDENCE_BUCKET.LOW,
    );
  },
);


test(
  "no matching intents yields zero confidence",
  () => {
    assert.equal(
      calculateConfidence(
        [],
      ),
      0,
    );
  },
);


/**
 * ============================================================
 * CONTEXT
 * ============================================================
 */

test(
  "context resolver detects short confirmation",
  () => {
    const result =
      resolveContext(
        normalizeText(
          "sí",
        ),
        {
          previousIntent:
            "automation",
        },
      );


    assert.equal(
      result.continuation,
      true,
    );


    assert.equal(
      result.polarity,
      "positive",
    );
  },
);


test(
  "short yes inherits previous intent instead of guessing a new one",
  () => {
    const result =
      analyzeMessage(
        "Sí",
        {
          previousIntent:
            "automation",
        },
      );


    assert.equal(
      result.primaryIntent,
      "automation",
    );


    assert.equal(
      result.confidenceBucket,
      state.CONFIDENCE_BUCKET.HIGH,
    );


    assert.deepEqual(
      result.concepts,
      [
        "contextual_reply",
      ],
    );
  },
);


/**
 * ============================================================
 * MULTI INTENT
 * ============================================================
 */

test(
  "canonical multi-intent example detects automation Excel reporting and Power BI",
  () => {
    const result =
      analyzeMessage(
        "Tengo 20 Excel que junto manualmente todos los lunes para actualizar Power BI y preparar el informe.",
      );


    const allIntents =
      new Set([
        result.primaryIntent,
        ...result.secondaryIntents,
      ]);


    assert.equal(
      allIntents.has(
        INTENT_IDS.AUTOMATION,
      ),
      true,
    );


    assert.equal(
      allIntents.has(
        INTENT_IDS.EXCEL_PROBLEM,
      ),
      true,
    );


    assert.equal(
      allIntents.has(
        INTENT_IDS.REPORTING_PROBLEM,
      ),
      true,
    );


    assert.equal(
      allIntents.has(
        INTENT_IDS.POWER_BI,
      ),
      true,
    );


    assert.equal(
      result.entities
        .case.volume.files,
      20,
    );


    assert.equal(
      result.entities
        .case.frequency,
      "weekly",
    );


    assert.equal(
      result.entities
        .case.currentProcess,
      "manual",
    );
  },
);


/**
 * ============================================================
 * AMBIGUITY
 * ============================================================
 */

test(
  "ambiguity resolver exposes close candidates",
  () => {
    const result =
      detectAmbiguity(
        [
          {
            id:
              "automation",

            score:
              5,
          },

          {
            id:
              "excel_problem",

            score:
              4.5,
          },
        ],
        0.5,
      );


    assert.equal(
      result.ambiguous,
      true,
    );


    assert.deepEqual(
      result.candidates,
      [
        "automation",
        "excel_problem",
      ],
    );
  },
);


/**
 * ============================================================
 * FALLBACK
 * ============================================================
 */

test(
  "unknown text produces low confidence fallback",
  () => {
    const result =
      analyzeMessage(
        "asdf qwer zxcv",
      );


    assert.equal(
      result.primaryIntent,
      null,
    );


    assert.equal(
      result.confidenceBucket,
      state.CONFIDENCE_BUCKET.LOW,
    );


    assert.equal(
      result.isFallback,
      true,
    );


    assert.equal(
      result.fallbackLevel,
      FALLBACK_LEVEL.CLARIFY,
    );
  },
);


test(
  "second consecutive fallback switches strategy to categories",
  () => {
    const result =
      analyzeMessage(
        "asdf qwer",
        {
          consecutiveFallbacks:
            1,
        },
      );


    assert.equal(
      result.fallbackLevel,
      FALLBACK_LEVEL.CATEGORIES,
    );
  },
);


test(
  "third consecutive fallback switches strategy to escalation",
  () => {
    const result =
      analyzeMessage(
        "asdf qwer",
        {
          consecutiveFallbacks:
            2,
        },
      );


    assert.equal(
      result.fallbackLevel,
      FALLBACK_LEVEL.ESCALATE,
    );
  },
);


/**
 * ============================================================
 * STATE CONTRACT
 * ============================================================
 */

test(
  "NLU analysis can be committed through controlled state APIs",
  () => {
    state.resetState();


    const analysis =
      analyzeMessage(
        "Tengo 20 Excel que actualizo manualmente cada semana en Power BI.",
      );


    state.setIntentResult(
      toStateIntentResult(
        analysis,
      ),
    );


    state.mergeEntities(
      analysis.entities,
    );


    const current =
      state.getState();


    assert.equal(
      current.understanding
        .primaryIntent,
      analysis.primaryIntent,
    );


    assert.deepEqual(
      current.understanding
        .secondaryIntents,
      analysis.secondaryIntents,
    );


    assert.equal(
      current.understanding
        .confidence,
      analysis.confidence,
    );


    assert.equal(
      current.understanding
        .confidenceBucket,
      analysis.confidenceBucket,
    );


    assert.deepEqual(
      current.entities
        .case.tools,
      analysis.entities
        .case.tools,
    );


    assert.equal(
      current.entities
        .case.volume.files,
      20,
    );


    assert.equal(
      state.validateState().valid,
      true,
    );
  },
);


test(
  "technical lastAnalysis does not duplicate raw user text or contact entities",
  () => {
    const analysis =
      analyzeMessage(
        "Mi email es ana@example.com y quiero automatizar Excel",
      );


    const payload =
      toStateIntentResult(
        analysis,
      );


    const serialized =
      JSON.stringify(
        payload.lastAnalysis,
      );


    assert.equal(
      serialized.includes(
        "ana@example.com",
      ),
      false,
    );


    assert.equal(
      serialized.includes(
        "quiero automatizar Excel",
      ),
      false,
    );
  },
);


test(
  "complete NLU result is JSON serializable",
  () => {
    const analysis =
      analyzeMessage(
        "Tengo 12 archivos Excel y preparo informes semanalmente con Power BI.",
      );


    assert.doesNotThrow(
      () => {
        JSON.stringify(
          analysis,
        );
      },
    );
  },
);

test(
  "clear MEDIUM intent requests confirmation instead of fallback",
  () => {
    const result =
      analyzeMessage(
        "¿Sabe DAX?",
      );


    assert.equal(
      result.primaryIntent,
      INTENT_IDS.POWER_BI,
    );


    assert.equal(
      result.confidenceBucket,
      state.CONFIDENCE_BUCKET.MEDIUM,
    );


    assert.equal(
      result.needsConfirmation,
      true,
    );


    assert.equal(
      result.isFallback,
      false,
    );


    assert.equal(
      result.fallbackLevel,
      FALLBACK_LEVEL.NONE,
    );
  },
);

test(
  "normalized keyword aliases do not inflate intent score",
  () => {
    const normalized =
      normalizeText(
        "Necesito preparar un informe",
      );


    const result =
      scoreIntents(
        normalized,
      );


    const reporting =
      result.scored.find(
        (candidate) =>
          candidate.id ===
          INTENT_IDS.REPORTING_PROBLEM,
      );


    const keywordReasons =
      reporting.reasons.filter(
        (reason) =>
          reason.startsWith(
            "keyword:",
          ),
      );


    assert.equal(
      keywordReasons.length,
      1,
    );
  },
);

test(
  "single explicit keyword can reach MEDIUM confidence",
  () => {
    const result =
      analyzeMessage(
        "Quiero conocer su currículum",
      );


    assert.equal(
      result.primaryIntent,
      INTENT_IDS.EXPERIENCE,
    );


    assert.equal(
      result.confidenceBucket,
      state.CONFIDENCE_BUCKET.MEDIUM,
    );


    assert.equal(
      result.isFallback,
      false,
    );
  },
);


test(
  "strong multi-intent tie is clarification not fallback",
  () => {
    const result =
      analyzeMessage(
        "Nuestros dashboards requieren demasiado trabajo manual",
      );


    assert.equal(
      result.isFallback,
      false,
    );


    assert.equal(
      result.needsConfirmation,
      true,
    );


    assert.equal(
      result.ambiguity.ambiguous,
      true,
    );
  },
);


test(
  "generic word tiempo does not imply project timeline",
  () => {
    const result =
      analyzeMessage(
        "Pierdo muchísimo tiempo copiando datos",
      );


    assert.notEqual(
      result.primaryIntent,
      INTENT_IDS.TIMELINE,
    );


    assert.equal(
      [
        result.primaryIntent,
        ...result.secondaryIntents,
      ].includes(
        INTENT_IDS.AUTOMATION,
      ),
      true,
    );
  },
);


test(
  "automatic car is not classified as process automation",
  () => {
    const result =
      analyzeMessage(
        "Mi coche es automático",
      );


    assert.equal(
      result.primaryIntent,
      null,
    );


    assert.equal(
      [
        result.primaryIntent,
        ...result.secondaryIntents,
      ].includes(
        INTENT_IDS.AUTOMATION,
      ),
      false,
    );
  },
);


test(
  "natural project phrasing is understood",
  () => {
    const result =
      analyzeMessage(
        "Quiero ver trabajos que haya hecho",
      );


    assert.equal(
      result.primaryIntent,
      INTENT_IDS.PROJECTS,
    );
  },
);


test(
  "Spanish written number is extracted as files volume",
  () => {
    const result =
      extractEntities(
        "Trabajo con veinte archivos Excel distintos",
      );


    assert.equal(
      result.case.volume.files,
      20,
    );
  },
);
