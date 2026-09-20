import test from "node:test";
import assert from "node:assert/strict";

import {
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  KNOWLEDGE_TYPE,
  TEMPORAL_STATUS,
} from "../data/knowledge/constants.js";

import {
  getProfileKnowledgeById,
  profileKnowledge,
  profileKnowledgeById,
} from "../data/knowledge/profile.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


test(
  "profile knowledge catalog is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        profileKnowledge,
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

    assert.deepEqual(
      result.errors,
      [],
    );
  },
);


test(
  "profile knowledge contains four high-level items",
  () => {
    assert.equal(
      profileKnowledge.length,
      4,
    );
  },
);


test(
  "all profile items use PROFILE knowledge type",
  () => {
    assert.ok(
      profileKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.PROFILE,
      ),
    );
  },
);


test(
  "profile catalog and nested structures are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        profileKnowledge,
      ),
      true,
    );

    for (
      const item of
      profileKnowledge
    ) {
      assert.equal(
        Object.isFrozen(item),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.aliases,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.facts,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.relationships,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.sources,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.coverage,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.answerPolicy,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.limitations,
        ),
        true,
      );
    }
  },
);


test(
  "profileKnowledgeById indexes every profile item",
  () => {
    assert.equal(
      Object.keys(
        profileKnowledgeById,
      ).length,
      profileKnowledge.length,
    );

    for (
      const item of
      profileKnowledge
    ) {
      assert.equal(
        profileKnowledgeById[
          item.id
        ],
        item,
      );
    }
  },
);


test(
  "getProfileKnowledgeById resolves safely",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-victor",
      );

    assert.ok(item);

    assert.equal(
      item.id,
      "profile-victor",
    );

    assert.equal(
      getProfileKnowledgeById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getProfileKnowledgeById(
        "",
      ),
      null,
    );

    assert.equal(
      getProfileKnowledgeById(
        null,
      ),
      null,
    );
  },
);


test(
  "main profile records career start in 2004",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-victor",
      );

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-profile-career-start-2004",
      );

    assert.ok(fact);

    assert.equal(
      fact.value,
      "2004",
    );

    assert.equal(
      fact.status,
      CLAIM_STATUS.USER_CONFIRMED,
    );

    assert.equal(
      fact.temporal.status,
      TEMPORAL_STATUS.HISTORICAL,
    );
  },
);


test(
  "main profile records banking experience",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-victor",
      );

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-profile-banking-experience",
      );

    assert.ok(fact);

    assert.equal(
      fact.value,
      true,
    );
  },
);


test(
  "main profile current focus includes data BI automation AI and financial markets",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-victor",
      );

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-profile-current-focus",
      );

    assert.ok(fact);

    assert.deepEqual(
      fact.value,
      [
        "data",
        "business-intelligence",
        "automation",
        "artificial-intelligence",
        "financial-markets",
      ],
    );

    assert.equal(
      fact.temporal.status,
      TEMPORAL_STATUS.CURRENT,
    );
  },
);


test(
  "multidisciplinary profile is explicitly derived",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-victor",
      );

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-profile-multidisciplinary",
      );

    assert.ok(fact);

    assert.equal(
      fact.status,
      CLAIM_STATUS.DERIVED,
    );

    assert.ok(
      fact.derivedFrom.length >
        0,
    );

    assert.equal(
      fact.sources.length,
      0,
    );
  },
);


test(
  "career evolution contains five semantic stages",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-career-evolution",
      );

    assert.ok(item);

    assert.equal(
      item.facts.length,
      5,
    );
  },
);


test(
  "career evolution includes current data and AI stage",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-career-evolution",
      );

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-career-stage-data-ai",
      );

    assert.ok(fact);

    assert.equal(
      fact.temporal.status,
      TEMPORAL_STATUS.CURRENT,
    );
  },
);


test(
  "business technology bridge is derived rather than invented",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-business-technology-bridge",
      );

    assert.ok(item);

    const fact =
      item.facts.find(
        (candidate) =>
          candidate.id ===
          "fact-profile-technical-functional",
      );

    assert.ok(fact);

    assert.equal(
      fact.status,
      CLAIM_STATUS.DERIVED,
    );

    assert.ok(
      fact.derivedFrom.includes(
        "fact-career-stage-development",
      ),
    );

    assert.ok(
      fact.derivedFrom.includes(
        "fact-career-stage-functional",
      ),
    );
  },
);


test(
  "continuous learning does not authorize automatic expertise claims",
  () => {
    const item =
      getProfileKnowledgeById(
        "profile-continuous-learning",
      );

    assert.ok(item);

    assert.ok(
      item.answerPolicy
        .forbiddenClaims
        .includes(
          "automatic-expertise",
        ),
    );

    assert.ok(
      item.answerPolicy
        .forbiddenClaims
        .includes(
          "can-do-any-project",
        ),
    );
  },
);


test(
  "profile knowledge is directly answerable but not directly recommendable",
  () => {
    for (
      const item of
      profileKnowledge
    ) {
      assert.equal(
        item.coverage.level,
        COVERAGE_LEVEL.ANSWERABLE,
      );

      assert.equal(
        item.coverage
          .canAnswerDirectly,
        true,
      );

      assert.equal(
        item.coverage
          .canRecommend,
        false,
      );
    }
  },
);