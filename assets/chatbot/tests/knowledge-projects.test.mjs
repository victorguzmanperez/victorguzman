import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getProjectById,
  getProjectFact,
  getProjectsByStatus,
  projectKnowledge,
  projectKnowledgeById,
} from "../data/knowledge/projects.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


test(
  "project knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        projectKnowledge,
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
  "project catalog contains four strong projects",
  () => {
    assert.equal(
      projectKnowledge.length,
      4,
    );
  },
);


test(
  "all records use PROJECT type",
  () => {
    assert.ok(
      projectKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.PROJECT,
      ),
    );
  },
);


test(
  "project index contains every project",
  () => {
    assert.equal(
      Object.keys(
        projectKnowledgeById,
      ).length,
      4,
    );
  },
);


test(
  "Business Cost Intelligence covers PDF extraction",
  () => {
    const project =
      getProjectById(
        "project-business-cost-intelligence",
      );

    const problems =
      getProjectFact(
        project,
        "problems",
      ).value;

    assert.ok(
      problems.includes(
        "problem-manual-pdf-extraction",
      ),
    );
  },
);


test(
  "Business Cost Intelligence includes document extraction capability",
  () => {
    const project =
      getProjectById(
        "project-business-cost-intelligence",
      );

    assert.ok(
      getProjectFact(
        project,
        "capabilities",
      ).value.includes(
        "capability-document-data-extraction",
      ),
    );
  },
);


test(
  "digital audit covers web collection and scoring",
  () => {
    const project =
      getProjectById(
        "project-auditoria-digital-cv",
      );

    const capabilities =
      getProjectFact(
        project,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "capability-web-data-collection",
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
  "investment dashboard remains in development",
  () => {
    const project =
      getProjectById(
        "project-investment-dashboard-ai",
      );

    assert.equal(
      getProjectFact(
        project,
        "project-status",
      ).value,
      "in_development",
    );
  },
);


test(
  "investment dashboard explicitly forbids financial advice inference",
  () => {
    const project =
      getProjectById(
        "project-investment-dashboard-ai",
      );

    assert.ok(
      project.limitations.some(
        (limitation) =>
          limitation.claim.includes(
            "asesoramiento financiero",
          ),
      ),
    );
  },
);


test(
  "competency evaluation includes hierarchy scoring and testing",
  () => {
    const project =
      getProjectById(
        "project-digital-competency-evaluation",
      );

    const capabilities =
      getProjectFact(
        project,
        "capabilities",
      ).value;

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

    assert.ok(
      capabilities.includes(
        "capability-testing",
      ),
    );
  },
);


test(
  "published project query excludes investment project",
  () => {
    const published =
      getProjectsByStatus(
        "published",
      );

    assert.equal(
      published.length,
      3,
    );

    assert.ok(
      published.every(
        (project) =>
          project.id !==
          "project-investment-dashboard-ai",
      ),
    );
  },
);


test(
  "projects cannot directly promise services",
  () => {
    for (
      const project of
      projectKnowledge
    ) {
      assert.equal(
        project.coverage
          .canRecommend,
        false,
      );

      assert.ok(
        project.answerPolicy
          .forbiddenClaims
          .includes(
            "guaranteed-feasibility",
          ),
      );
    }
  },
);


test(
  "project getter is safe",
  () => {
    assert.equal(
      getProjectById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getProjectById(null),
      null,
    );
  },
);


test(
  "all projects expose matching dimensions",
  () => {
    for (
      const project of
      projectKnowledge
    ) {
      for (
        const key of [
          "problems",
          "capabilities",
          "technologies",
          "business-areas",
          "objectives",
          "process-characteristics",
          "constraints",
        ]
      ) {
        assert.ok(
          getProjectFact(
            project,
            key,
          ),
          `${project.id} missing ${key}`,
        );
      }
    }
  },
);