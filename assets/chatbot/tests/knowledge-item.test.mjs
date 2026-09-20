import test from "node:test";
import assert from "node:assert/strict";

import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  FACT_VALUE_TYPE,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
  RELATION_TYPE,
  TEMPORAL_STATUS,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
  validateFact,
  validateKnowledgeItem,
  validateKnowledgeItems,
  validateTemporal,
} from "../data/knowledge/validators.js";

function createValidItem() {
  return {
    id: "profile-victor",
    type:
      KNOWLEDGE_TYPE.PROFILE,

    status:
      KNOWLEDGE_STATUS.ACTIVE,

    title:
      "Perfil profesional de Víctor",

    shortDescription:
      "Perfil profesional transversal entre tecnología, banca, datos, BI y automatización.",

    aliases: [
      "Víctor",
      "Víctor Guzmán",
      "perfil de Víctor",
    ],

    facts: [
      {
        id:
          "fact-career-start-2004",

        key:
          "career-start",

        value:
          "2004",

        valueType:
          FACT_VALUE_TYPE.STRING,

        status:
          CLAIM_STATUS.USER_CONFIRMED,

        evidence: [
          {
            strength:
              EVIDENCE_STRENGTH.STRONG,

            type:
              "professional-history",

            sourceIds: [
              "source-user-confirmed-career",
            ],

            note:
              "Inicio de trayectoria profesional confirmado.",
          },
        ],

        sources: [
          "source-user-confirmed-career",
        ],

        disclosure:
          DISCLOSURE.PUBLIC_SUMMARY_ONLY,

        temporal: {
          status:
            TEMPORAL_STATUS.HISTORICAL,

          validFrom:
            "2004-01-01",

          validTo:
            null,
        },
      },
    ],

    relationships: [
      {
        type:
          RELATION_TYPE.DEMONSTRATES,

        target:
          "capability-business-technology-bridge",

        strength:
          EVIDENCE_STRENGTH.STRONG,

        sources: [
          "source-user-confirmed-career",
        ],
      },
    ],

    sources: [
      "source-user-confirmed-career",
    ],

    disclosure:
      DISCLOSURE.PUBLIC_SUMMARY_ONLY,

    temporal: {
      status:
        TEMPORAL_STATUS.CURRENT,

      validFrom:
        null,

      validTo:
        null,
    },

    coverage: {
      level:
        COVERAGE_LEVEL.ANSWERABLE,

      canAnswerDirectly: true,
      canRecommend: false,
      canProvideEvidence: true,
      canNavigate: false,
    },

    answerPolicy: {
      directAnswer: true,

      mentionEvidence:
        ANSWER_EVIDENCE_MODE.WHEN_USEFUL,

      maxEvidenceItems: 2,

      allowInference: true,

      allowRecommendation: false,

      preferredDepth:
        ANSWER_DEPTH.MEDIUM,

      forbiddenClaims: [
        "price",
        "deadline",
        "availability",
      ],
    },

    limitations: [
      {
        type:
          LIMITATION_TYPE.NO_INFERENCE,

        claim:
          "No implica disponibilidad profesional inmediata.",
      },
    ],

    metadata: {
      version: 1,
    },
  };
}

test(
  "valid knowledge item passes validation",
  () => {
    const item =
      createValidItem();

    const result =
      validateKnowledgeItem(item);

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
  "knowledge item catalog validates",
  () => {
    const result =
      validateKnowledgeItems([
        createValidItem(),
      ]);

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
  "invalid knowledge type is rejected",
  () => {
    const item =
      createValidItem();

    item.type =
      "wizard";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".type",
          ),
      ),
    );
  },
);

test(
  "private context disclosure is rejected",
  () => {
    const item =
      createValidItem();

    item.disclosure =
      "private_context";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "fact value must match declared type",
  () => {
    const item =
      createValidItem();

    item.facts[0].valueType =
      FACT_VALUE_TYPE.NUMBER;

    item.facts[0].value =
      "2004";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".value",
          ),
      ),
    );
  },
);

test(
  "derived fact requires parent facts",
  () => {
    const item =
      createValidItem();

    const fact =
      item.facts[0];

    fact.status =
      CLAIM_STATUS.DERIVED;

    fact.sources = [];

    fact.derivedFrom = [];

    const result =
      validateFact(fact);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".derivedFrom",
          ),
      ),
    );
  },
);

test(
  "non-derived fact cannot define derivedFrom",
  () => {
    const item =
      createValidItem();

    item.facts[0].derivedFrom = [
      "fact-parent",
    ];

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "duplicate fact ids are rejected",
  () => {
    const item =
      createValidItem();

    item.facts.push({
      ...item.facts[0],
    });

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message.includes(
            "duplicate fact id",
          ),
      ),
    );
  },
);

test(
  "unknown knowledge fields are rejected",
  () => {
    const item =
      createValidItem();

    item.internalSecret =
      "should not exist";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message ===
          "unknown knowledge item field",
      ),
    );
  },
);

test(
  "invalid relationship type is rejected",
  () => {
    const item =
      createValidItem();

    item.relationships[0].type =
      "magically_proves";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "relationship target must use canonical id",
  () => {
    const item =
      createValidItem();

    item.relationships[0].target =
      "Power BI Capability";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "invalid coverage level is rejected",
  () => {
    const item =
      createValidItem();

    item.coverage.level =
      "always-answer";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "invalid answer depth is rejected",
  () => {
    const item =
      createValidItem();

    item.answerPolicy.preferredDepth =
      "essay";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "duplicate forbidden claims are rejected",
  () => {
    const item =
      createValidItem();

    item.answerPolicy.forbiddenClaims = [
      "price",
      "price",
    ];

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "invalid temporal date range is rejected",
  () => {
    const item =
      createValidItem();

    item.temporal.validFrom =
      "2026-09-15";

    item.temporal.validTo =
      "2020-01-01";

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "temporal validator accepts current open range",
  () => {
    const result =
      validateTemporal({
        status:
          TEMPORAL_STATUS.CURRENT,

        validFrom:
          "2023-07-01",

        validTo:
          null,
      });

    assert.equal(
      result.valid,
      true,
    );
  },
);

test(
  "knowledge item must reference at least one source",
  () => {
    const item =
      createValidItem();

    item.sources = [];

    const result =
      validateKnowledgeItem(item);

    assert.equal(
      result.valid,
      false,
    );
  },
);

test(
  "duplicate knowledge ids are rejected",
  () => {
    const first =
      createValidItem();

    const second =
      createValidItem();

    const result =
      validateKnowledgeItems([
        first,
        second,
      ]);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message.includes(
            "duplicate knowledge item id",
          ),
      ),
    );
  },
);

test(
  "assertValidKnowledgeItems throws for invalid knowledge",
  () => {
    const item =
      createValidItem();

    item.type =
      "invalid";

    assert.throws(
      () =>
        assertValidKnowledgeItems([
          item,
        ]),
      /Invalid knowledge items/,
    );
  },
);