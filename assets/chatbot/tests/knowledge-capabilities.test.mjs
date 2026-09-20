import test from "node:test";
import assert from "node:assert/strict";

import {
  EXPERIENCE_EVIDENCE,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  capabilityKnowledge,
  capabilityKnowledgeById,
  getCapabilityById,
  getCapabilitiesByDomain,
  getCapabilitiesByEvidence,
} from "../data/knowledge/capabilities.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


function factValue(
  item,
  key,
) {
  return item.facts.find(
    (fact) =>
      fact.key === key,
  )?.value;
}


test(
  "capability knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        capabilityKnowledge,
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
  "all capability records use CAPABILITY type",
  () => {
    assert.ok(
      capabilityKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.CAPABILITY,
      ),
    );
  },
);


test(
  "capability ids are unique",
  () => {
    const ids =
      capabilityKnowledge.map(
        (item) => item.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "capability index contains every item",
  () => {
    assert.equal(
      Object.keys(
        capabilityKnowledgeById,
      ).length,
      capabilityKnowledge.length,
    );
  },
);


test(
  "Business Intelligence capability has current professional evidence",
  () => {
    const item =
      getCapabilityById(
        "capability-business-intelligence",
      );

    assert.ok(
      factValue(
        item,
        "evidence-types",
      ).includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ),
    );
  },
);


test(
  "document extraction is project-backed and qualified",
  () => {
    const item =
      getCapabilityById(
        "capability-document-data-extraction",
      );

    assert.ok(
      factValue(
        item,
        "evidence-types",
      ).includes(
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ),
    );

    assert.ok(
      item.limitations.length > 1,
    );
  },
);


test(
  "functional analysis has professional historical evidence",
  () => {
    const item =
      getCapabilityById(
        "capability-functional-analysis",
      );

    assert.ok(
      factValue(
        item,
        "evidence-types",
      ).includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ),
    );
  },
);


test(
  "scoring and rules is backed by project evidence",
  () => {
    const item =
      getCapabilityById(
        "capability-scoring-and-rules",
      );

    assert.deepEqual(
      factValue(
        item,
        "evidence-types",
      ),
      [
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ],
    );
  },
);


test(
  "financial analysis contains safety limitation",
  () => {
    const item =
      getCapabilityById(
        "capability-financial-analysis",
      );

    assert.ok(
      item.limitations.some(
        (limitation) =>
          limitation.claim.includes(
            "recomendaciones personalizadas",
          ),
      ),
    );
  },
);


test(
  "web data collection is project-backed",
  () => {
    const item =
      getCapabilityById(
        "capability-web-data-collection",
      );

    assert.ok(
      factValue(
        item,
        "evidence-types",
      ).includes(
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ),
    );
  },
);


test(
  "data domain returns multiple capabilities",
  () => {
    const result =
      getCapabilitiesByDomain(
        "data",
      );

    assert.ok(
      result.length >= 5,
    );
  },
);


test(
  "project evidence query includes scoring and document extraction",
  () => {
    const ids =
      getCapabilitiesByEvidence(
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ).map(
        (item) => item.id,
      );

    assert.ok(
      ids.includes(
        "capability-scoring-and-rules",
      ),
    );

    assert.ok(
      ids.includes(
        "capability-document-data-extraction",
      ),
    );
  },
);


test(
  "business technology bridge capability exists",
  () => {
    assert.ok(
      getCapabilityById(
        "capability-business-technology-bridge",
      ),
    );
  },
);


test(
  "historical performance optimization remains historical evidence",
  () => {
    const item =
      getCapabilityById(
        "capability-performance-optimization",
      );

    assert.deepEqual(
      factValue(
        item,
        "evidence-types",
      ),
      [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],
    );
  },
);


test(
  "capability getter is safe",
  () => {
    assert.equal(
      getCapabilityById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getCapabilityById(null),
      null,
    );
  },
);