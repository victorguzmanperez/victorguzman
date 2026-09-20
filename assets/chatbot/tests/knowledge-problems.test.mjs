import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getProblemById,
  getProblemCapabilities,
  getProblemFact,
  problemKnowledge,
  problemKnowledgeById,
} from "../data/knowledge/problems.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


test(
  "problem knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        problemKnowledge,
      );

    assert.equal(
      result.valid,
      true,
      JSON.stringify(
        result.errors,
        null,
        2,
      ),
    );
  },
);


test(
  "all problem records use PROBLEM type",
  () => {
    assert.ok(
      problemKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.PROBLEM,
      ),
    );
  },
);


test(
  "problem ids are unique",
  () => {
    const ids =
      problemKnowledge.map(
        (item) => item.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "problem index contains every problem",
  () => {
    assert.equal(
      Object.keys(
        problemKnowledgeById,
      ).length,
      problemKnowledge.length,
    );
  },
);


test(
  "manual consolidation maps to consolidation transformation and automation",
  () => {
    const capabilities =
      getProblemCapabilities(
        "problem-manual-data-consolidation",
      );

    assert.ok(
      capabilities.includes(
        "capability-data-consolidation",
      ),
    );

    assert.ok(
      capabilities.includes(
        "capability-data-transformation",
      ),
    );

    assert.ok(
      capabilities.includes(
        "capability-process-automation",
      ),
    );
  },
);


test(
  "weighted evaluation maps to hierarchical modeling and scoring",
  () => {
    const capabilities =
      getProblemCapabilities(
        "problem-complex-weighted-evaluation",
      );

    assert.ok(
      capabilities.includes(
        "capability-hierarchical-modeling",
      ),
    );

    assert.ok(
      capabilities.includes(
        "capability-scoring-and-rules",
      ),
    );
  },
);


test(
  "PDF extraction problem asks useful clarification questions",
  () => {
    const problem =
      getProblemById(
        "problem-manual-pdf-extraction",
      );

    const questions =
      getProblemFact(
        problem,
        "clarification-questions",
      ).value;

    assert.ok(
      questions.length >= 3,
    );
  },
);


test(
  "unstructured documents distinguishes extraction from interpretation",
  () => {
    const item =
      getProblemById(
        "problem-unstructured-documents",
      );

    assert.ok(
      item.limitations.some(
        (limitation) =>
          limitation.claim.includes(
            "Extracción estructurada",
          ),
      ),
    );
  },
);


test(
  "web collection problem asks whether information is public",
  () => {
    const item =
      getProblemById(
        "problem-web-data-collection",
      );

    const questions =
      getProblemFact(
        item,
        "clarification-questions",
      ).value;

    assert.ok(
      questions.some(
        (question) =>
          question.includes(
            "pública",
          ),
      ),
    );
  },
);


test(
  "financial analysis problem includes safety limitation",
  () => {
    const item =
      getProblemById(
        "problem-financial-analysis",
      );

    assert.ok(
      item.limitations.some(
        (limitation) =>
          limitation.claim.includes(
            "compra o venta",
          ),
      ),
    );
  },
);


test(
  "AI opportunity problem requires requirements analysis",
  () => {
    const capabilities =
      getProblemCapabilities(
        "problem-ai-process-opportunity",
      );

    assert.ok(
      capabilities.includes(
        "capability-requirements-analysis",
      ),
    );
  },
);


test(
  "fragile Excel problem maps to testing and rules",
  () => {
    const capabilities =
      getProblemCapabilities(
        "problem-fragile-excel-model",
      );

    assert.ok(
      capabilities.includes(
        "capability-testing",
      ),
    );

    assert.ok(
      capabilities.includes(
        "capability-scoring-and-rules",
      ),
    );
  },
);


test(
  "problem getter handles invalid values",
  () => {
    assert.equal(
      getProblemById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getProblemById(null),
      null,
    );
  },
);


test(
  "problem capabilities returns empty array for unknown problem",
  () => {
    assert.deepEqual(
      getProblemCapabilities(
        "unknown",
      ),
      [],
    );
  },
);


test(
  "all problems allow recommendation but do not guarantee outcomes",
  () => {
    for (
      const problem of
      problemKnowledge
    ) {
      assert.equal(
        problem.coverage
          .canRecommend,
        true,
      );

      assert.ok(
        problem.answerPolicy
          .forbiddenClaims
          .includes(
            "guaranteed-solution",
          ),
      );
    }
  },
);