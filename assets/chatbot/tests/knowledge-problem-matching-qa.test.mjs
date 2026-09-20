import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
  RELATION_TYPE,
} from "../data/knowledge/constants.js";

import {
  knowledgeById,
  getKnowledgeByType,
} from "../data/knowledge.js";

import {
  matchProblemsByText,
} from "../data/knowledge/problem-matcher.js";

import {
  getSolutionsByProblemId,
} from "../data/knowledge/solutions.js";

import {
  PROBLEM_QA_SERVICE_MODE,
  problemFlowExpectations,
  problemFlowByProblemId,
  problemMatchingQaCases,
  problemMatchingQaById,
  getProblemFlowExpectation,
  getProblemMatchingQaById,
} from "../data/problem-matching-qa.js";


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


function sorted(
  values,
) {
  return [
    ...values,
  ].sort();
}


function serviceIdsForSolutions(
  solutions,
) {
  return unique(
    solutions.flatMap(
      (solution) =>
        solution.relationships
          .filter(
            (relationship) =>
              relationship.type ===
                RELATION_TYPE
                  .IMPLEMENTED_BY,
          )
          .map(
            (relationship) =>
              relationship.target,
          ),
    ),
  );
}


/* ============================================================
 * STRUCTURAL QA — 10 TESTS
 * ============================================================
 */

test(
  "Problem Matching QA covers all seventeen Problems",
  () => {
    const problems =
      getKnowledgeByType(
        KNOWLEDGE_TYPE.PROBLEM,
      );

    assert.equal(
      problems.length,
      17,
    );

    assert.equal(
      problemFlowExpectations.length,
      17,
    );

    assert.deepEqual(
      sorted(
        problemFlowExpectations.map(
          (flow) =>
            flow.problemId,
        ),
      ),
      sorted(
        problems.map(
          (problem) =>
            problem.id,
        ),
      ),
    );
  },
);


test(
  "Problem Matching QA contains exactly fifty one real-language cases",
  () => {
    assert.equal(
      problemMatchingQaCases.length,
      51,
    );
  },
);


test(
  "every Problem has exactly three language cases",
  () => {
    for (
      const flow
      of problemFlowExpectations
    ) {
      const cases =
        problemMatchingQaCases
          .filter(
            (item) =>
              item.expectedProblemId ===
                flow.problemId,
          );

      assert.equal(
        cases.length,
        3,
        `${flow.problemId} does not have exactly 3 QA phrases`,
      );
    }
  },
);


test(
  "Problem Matching QA ids are unique",
  () => {
    assert.equal(
      new Set(
        problemMatchingQaCases.map(
          (item) =>
            item.id,
        ),
      ).size,
      problemMatchingQaCases.length,
    );
  },
);


test(
  "Problem Matching QA inputs are unique",
  () => {
    assert.equal(
      new Set(
        problemMatchingQaCases.map(
          (item) =>
            item.input,
        ),
      ).size,
      problemMatchingQaCases.length,
    );
  },
);


test(
  "every expected Problem exists in global Knowledge",
  () => {
    for (
      const flow
      of problemFlowExpectations
    ) {
      assert.equal(
        knowledgeById[
          flow.problemId
        ]?.type,
        KNOWLEDGE_TYPE.PROBLEM,
        flow.problemId,
      );
    }
  },
);


test(
  "every expected Solution and Service exists with the correct Knowledge type",
  () => {
    for (
      const flow
      of problemFlowExpectations
    ) {
      for (
        const solutionId
        of flow.solutionIds
      ) {
        assert.equal(
          knowledgeById[
            solutionId
          ]?.type,
          KNOWLEDGE_TYPE.SOLUTION,
          solutionId,
        );
      }

      for (
        const serviceId
        of flow.serviceIds
      ) {
        assert.equal(
          knowledgeById[
            serviceId
          ]?.type,
          KNOWLEDGE_TYPE.SERVICE,
          serviceId,
        );
      }
    }
  },
);


test(
  "expected Problem to Solution to Service flows match the canonical graph",
  () => {
    for (
      const expected
      of problemFlowExpectations
    ) {
      const solutions =
        getSolutionsByProblemId(
          expected.problemId,
        );

      const actualSolutionIds =
        solutions.map(
          (solution) =>
            solution.id,
        );

      const actualServiceIds =
        serviceIdsForSolutions(
          solutions,
        );

      assert.deepEqual(
        sorted(
          actualSolutionIds,
        ),
        sorted(
          expected.solutionIds,
        ),
        `${expected.problemId} has unexpected Solutions`,
      );

      assert.deepEqual(
        sorted(
          actualServiceIds,
        ),
        sorted(
          expected.serviceIds,
        ),
        `${expected.problemId} has unexpected Services`,
      );
    }
  },
);


test(
  "solution-only and service flows remain semantically distinct",
  () => {
    for (
      const flow
      of problemFlowExpectations
    ) {
      if (
        flow.serviceMode ===
          PROBLEM_QA_SERVICE_MODE
            .SOLUTION_ONLY
      ) {
        assert.deepEqual(
          flow.serviceIds,
          [],
          `${flow.problemId} should remain solution-only`,
        );
      } else {
        assert.ok(
          flow.serviceIds.length > 0,
          `${flow.problemId} should expose at least one explicit Service`,
        );
      }
    }
  },
);


test(
  "Problem Matching QA indexes are frozen and getters fail safely",
  () => {
    assert.equal(
      Object.isFrozen(
        problemFlowExpectations,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        problemMatchingQaCases,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        problemFlowByProblemId,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        problemMatchingQaById,
      ),
      true,
    );

    assert.equal(
      getProblemFlowExpectation(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getProblemFlowExpectation(
        null,
      ),
      null,
    );

    assert.equal(
      getProblemMatchingQaById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getProblemMatchingQaById(
        null,
      ),
      null,
    );
  },
);


/* ============================================================
 * 51 REAL-LANGUAGE MATCHING TESTS
 * ============================================================
 */

for (
  const qaCase
  of problemMatchingQaCases
) {
  test(
    `${qaCase.id} — ${qaCase.input}`,
    () => {
      const matches =
        matchProblemsByText(
          qaCase.input,
          {
            limit: 5,
            minScore: 1,
          },
        );

      assert.ok(
        matches.length > 0,
        `${qaCase.id} produced no Problem match`,
      );

      assert.equal(
        matches[0].problemId,
        qaCase.expectedProblemId,
        `${qaCase.id} resolved to ${matches[0].problemId} instead of ${qaCase.expectedProblemId}`,
      );

      /*
       * Todas las frases contienen al menos un alias
       * fuerte del Problem esperado.
       *
       * Alias = 6 puntos en el matcher actual.
       */
      assert.ok(
        matches[0].score >= 6,
        `${qaCase.id} matched too weakly: ${matches[0].score}`,
      );

      const flow =
        getProblemFlowExpectation(
          qaCase.expectedProblemId,
        );

      assert.ok(
        flow,
        `${qaCase.expectedProblemId} has no expected graph flow`,
      );

      assert.ok(
        flow.solutionIds.length > 0,
        `${qaCase.expectedProblemId} has no Solution`,
      );

      if (
        flow.serviceMode ===
          PROBLEM_QA_SERVICE_MODE
            .SOLUTION_ONLY
      ) {
        assert.equal(
          flow.serviceIds.length,
          0,
        );
      } else {
        assert.ok(
          flow.serviceIds.length > 0,
        );
      }
    },
  );
}