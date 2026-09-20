import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
  TEMPORAL_STATUS,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
} from "../data/knowledge/validators.js";

import {
  evidenceIndexByKnowledgeId,
} from "../data/knowledge/evidence-index.js";

import {
  businessAreaKnowledge,
  businessAreaKnowledgeById,
  businessAreaKnowledgeByKey,
  getBusinessAreaById,
  getBusinessAreaByKey,
  getBusinessAreaFact,
} from "../data/knowledge/business-areas.js";


test(
  "business area Knowledge is structurally valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          businessAreaKnowledge,
        ),
    );
  },
);


test(
  "four professional business areas are materialized",
  () => {
    assert.equal(
      businessAreaKnowledge.length,
      4,
    );
  },
);


test(
  "all business area items use BUSINESS_AREA type",
  () => {
    for (
      const item
      of businessAreaKnowledge
    ) {
      assert.equal(
        item.type,
        KNOWLEDGE_TYPE.BUSINESS_AREA,
      );
    }
  },
);


test(
  "business area id index contains every item",
  () => {
    assert.equal(
      Object.keys(
        businessAreaKnowledgeById,
      ).length,
      businessAreaKnowledge.length,
    );

    for (
      const item
      of businessAreaKnowledge
    ) {
      assert.equal(
        businessAreaKnowledgeById[
          item.id
        ],
        item,
      );
    }
  },
);


test(
  "business area canonical key index contains every item",
  () => {
    assert.deepEqual(
      Object.keys(
        businessAreaKnowledgeByKey,
      ).sort(),
      [
        "banking",
        "capital-markets",
        "financial-markets",
        "loans",
      ],
    );
  },
);


test(
  "banking and financial markets are current contexts",
  () => {
    assert.equal(
      getBusinessAreaByKey(
        "banking",
      ).temporal.status,
      TEMPORAL_STATUS.CURRENT,
    );

    assert.equal(
      getBusinessAreaByKey(
        "financial-markets",
      ).temporal.status,
      TEMPORAL_STATUS.CURRENT,
    );
  },
);


test(
  "loans and capital markets are historical contexts",
  () => {
    assert.equal(
      getBusinessAreaByKey(
        "loans",
      ).temporal.status,
      TEMPORAL_STATUS.HISTORICAL,
    );

    assert.equal(
      getBusinessAreaByKey(
        "capital-markets",
      ).temporal.status,
      TEMPORAL_STATUS.HISTORICAL,
    );
  },
);


test(
  "Business Area is classification and not professional evidence itself",
  () => {
    for (
      const item
      of businessAreaKnowledge
    ) {
      assert.equal(
        item.coverage
          .canProvideEvidence,
        false,
      );

      assert.equal(
        evidenceIndexByKnowledgeId[
          item.id
        ],
        undefined,
      );
    }
  },
);


test(
  "business area facts preserve canonical keys",
  () => {
    const banking =
      getBusinessAreaById(
        "business-area-banking",
      );

    assert.equal(
      getBusinessAreaFact(
        banking,
        "business-area-key",
      ).value,
      "banking",
    );
  },
);


test(
  "business area getters fail safely",
  () => {
    assert.equal(
      getBusinessAreaById(
        "business-area-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getBusinessAreaByKey(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getBusinessAreaFact(
        null,
        "business-area-key",
      ),
      null,
    );
  },
);