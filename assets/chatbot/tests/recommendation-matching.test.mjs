import test from "node:test";
import assert from "node:assert/strict";

import {
  recommendForProblem,
  RECOMMENDATION_MODE,
} from "../data/knowledge/recommendation-engine.js";


function serviceIds(
  recommendation,
) {
  return recommendation.services
    .map(
      (service) =>
        service.id,
    )
    .sort();
}


function sorted(
  values,
) {
  return [
    ...values,
  ].sort();
}


/* ============================================================
 * BASIC MATCHING
 * ============================================================
 */

test(
  "manual data consolidation recommends data process automation",
  () => {
    const result =
      recommendForProblem(
        "problem-manual-data-consolidation",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      result.solutions,
      [
        "solution-data-consolidation-automation",
      ],
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-data-process-automation",
      ],
    );

    assert.equal(
      result.requiresQualification,
      true,
    );

    assert.equal(
      result.canPromise,
      false,
    );
  },
);


test(
  "multiple Excel files recommends data process automation",
  () => {
    const result =
      recommendForProblem(
        "problem-multiple-excel-files",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-data-process-automation",
      ],
    );
  },
);


test(
  "repetitive reporting recommends BI dashboards service",
  () => {
    const result =
      recommendForProblem(
        "problem-repetitive-reporting",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-business-intelligence-dashboards",
      ],
    );
  },
);


test(
  "manual dashboard refresh recommends BI dashboards service",
  () => {
    const result =
      recommendForProblem(
        "problem-manual-dashboard-refresh",
      );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-business-intelligence-dashboards",
      ],
    );
  },
);


/* ============================================================
 * EXCEL / SCORING
 * ============================================================
 */

test(
  "fragile Excel model recommends Excel business models service",
  () => {
    const result =
      recommendForProblem(
        "problem-fragile-excel-model",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-excel-business-models",
      ],
    );
  },
);


test(
  "complex weighted evaluation recommends Excel business models service",
  () => {
    const result =
      recommendForProblem(
        "problem-complex-weighted-evaluation",
      );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-excel-business-models",
      ],
    );
  },
);


test(
  "scoring rules may match several solutions but only explicit service is recommended",
  () => {
    const result =
      recommendForProblem(
        "problem-scoring-rules",
      );

    assert.deepEqual(
      sorted(
        result.solutions,
      ),
      [
        "solution-evaluation-scoring-model",
        "solution-web-audit-scoring-automation",
      ],
    );

    /*
     * Web Audit sigue deliberadamente
     * sin Service comercial.
     */
    assert.deepEqual(
      serviceIds(result),
      [
        "service-excel-business-models",
      ],
    );
  },
);


/* ============================================================
 * DOCUMENTS / DATA QUALITY
 * ============================================================
 */

test(
  "PDF extraction can recommend automation and AI services",
  () => {
    const result =
      recommendForProblem(
        "problem-manual-pdf-extraction",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-ai-process-analysis",
        "service-data-process-automation",
      ],
    );
  },
);


test(
  "unstructured documents can recommend automation and AI services",
  () => {
    const result =
      recommendForProblem(
        "problem-unstructured-documents",
      );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-ai-process-analysis",
        "service-data-process-automation",
      ],
    );
  },
);


test(
  "data quality may recommend Excel and automation services",
  () => {
    const result =
      recommendForProblem(
        "problem-data-quality",
      );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-data-process-automation",
        "service-excel-business-models",
      ],
    );
  },
);


/* ============================================================
 * AI
 * ============================================================
 */

test(
  "AI process opportunity recommends AI process analysis service",
  () => {
    const result =
      recommendForProblem(
        "problem-ai-process-opportunity",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .QUALIFIED_SERVICE,
    );

    assert.deepEqual(
      serviceIds(result),
      [
        "service-ai-process-analysis",
      ],
    );
  },
);


/* ============================================================
 * SOLUTION-ONLY CASES
 * ============================================================
 */

test(
  "web audit remains solution-only and does not invent a service",
  () => {
    const result =
      recommendForProblem(
        "problem-web-scoring-audit",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .SOLUTION_ONLY,
    );

    assert.ok(
      result.solutions.includes(
        "solution-web-audit-scoring-automation",
      ),
    );

    assert.deepEqual(
      result.services,
      [],
    );

    assert.equal(
      result.canPromise,
      false,
    );
  },
);


test(
  "financial analysis remains solution-only and does not invent a service",
  () => {
    const result =
      recommendForProblem(
        "problem-financial-analysis",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .SOLUTION_ONLY,
    );

    assert.deepEqual(
      result.solutions,
      [
        "solution-financial-analysis-monitoring",
      ],
    );

    assert.deepEqual(
      result.services,
      [],
    );

    assert.equal(
      result.canPromise,
      false,
    );
  },
);


/* ============================================================
 * QUALIFICATION
 * ============================================================
 */

test(
  "every recommended service includes qualification information and evidence",
  () => {
    const problemIds = [
      "problem-manual-data-consolidation",
      "problem-repetitive-reporting",
      "problem-fragile-excel-model",
      "problem-manual-pdf-extraction",
      "problem-ai-process-opportunity",
    ];

    for (
      const problemId
      of problemIds
    ) {
      const result =
        recommendForProblem(
          problemId,
        );

      for (
        const service
        of result.services
      ) {
        assert.ok(
          service.viaSolutionIds
            .length > 0,
          `${service.id} has no solution path`,
        );

        assert.ok(
          service.evidenceTargets
            .length > 0,
          `${service.id} has no evidence`,
        );

        assert.ok(
          service.fitConditions
            .length > 0,
          `${service.id} has no fit conditions`,
        );

        assert.ok(
          service.discoveryQuestions
            .length > 0,
          `${service.id} has no discovery questions`,
        );
      }
    }
  },
);


test(
  "recommendations never promise project acceptance or outcome",
  () => {
    const problemIds = [
      "problem-manual-data-consolidation",
      "problem-repetitive-reporting",
      "problem-fragile-excel-model",
      "problem-manual-pdf-extraction",
      "problem-data-quality",
      "problem-ai-process-opportunity",
      "problem-web-scoring-audit",
      "problem-financial-analysis",
    ];

    for (
      const problemId
      of problemIds
    ) {
      const result =
        recommendForProblem(
          problemId,
        );

      assert.equal(
        result.canPromise,
        false,
        `${problemId} unexpectedly permits promises`,
      );
    }
  },
);


/* ============================================================
 * UNKNOWN
 * ============================================================
 */

test(
  "unknown problem is safely unsupported",
  () => {
    const result =
      recommendForProblem(
        "problem-does-not-exist",
      );

    assert.equal(
      result.mode,
      RECOMMENDATION_MODE
        .UNSUPPORTED,
    );

    assert.equal(
      result.problemId,
      null,
    );

    assert.deepEqual(
      result.solutions,
      [],
    );

    assert.deepEqual(
      result.services,
      [],
    );

    assert.equal(
      result.canPromise,
      false,
    );
  },
);