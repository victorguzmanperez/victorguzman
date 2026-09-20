import test from "node:test";
import assert from "node:assert/strict";

import {
  CERTIFICATION_STATUS,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  certificationKnowledge,
  certificationKnowledgeById,
  getCertificationById,
  getEarnedCertifications,
  getPreparingCertifications,
} from "../data/knowledge/certifications.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


function factByKey(
  item,
  key,
) {
  return item.facts.find(
    (fact) =>
      fact.key === key,
  );
}


test(
  "certification knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        certificationKnowledge,
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
  "PL-300 certification record exists",
  () => {
    const item =
      getCertificationById(
        "certification-pl300",
      );

    assert.ok(item);

    assert.equal(
      item.type,
      KNOWLEDGE_TYPE.CERTIFICATION,
    );
  },
);


test(
  "PL-300 status is PREPARING",
  () => {
    const item =
      getCertificationById(
        "certification-pl300",
      );

    assert.equal(
      factByKey(
        item,
        "certification-status",
      ).value,
      CERTIFICATION_STATUS.PREPARING,
    );
  },
);


test(
  "PL-300 training is completed",
  () => {
    const item =
      getCertificationById(
        "certification-pl300",
      );

    assert.equal(
      factByKey(
        item,
        "training-completed",
      ).value,
      true,
    );
  },
);


test(
  "PL-300 official certification is not earned",
  () => {
    const item =
      getCertificationById(
        "certification-pl300",
      );

    assert.equal(
      factByKey(
        item,
        "official-certification-earned",
      ).value,
      false,
    );
  },
);


test(
  "PL-300 forbids certified claim",
  () => {
    const item =
      getCertificationById(
        "certification-pl300",
      );

    assert.ok(
      item.answerPolicy
        .forbiddenClaims
        .includes(
          "microsoft-certified-power-bi-data-analyst",
        ),
    );

    assert.ok(
      item.answerPolicy
        .forbiddenClaims
        .includes(
          "pl300-earned",
        ),
    );
  },
);


test(
  "no earned certifications are returned currently",
  () => {
    assert.deepEqual(
      getEarnedCertifications(),
      [],
    );
  },
);


test(
  "PL-300 appears in preparing certifications",
  () => {
    const preparing =
      getPreparingCertifications();

    assert.equal(
      preparing.length,
      1,
    );

    assert.equal(
      preparing[0].id,
      "certification-pl300",
    );
  },
);


test(
  "certification index contains every certification",
  () => {
    assert.equal(
      Object.keys(
        certificationKnowledgeById,
      ).length,
      certificationKnowledge.length,
    );
  },
);


test(
  "certification getter handles invalid ids safely",
  () => {
    assert.equal(
      getCertificationById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getCertificationById(null),
      null,
    );
  },
);