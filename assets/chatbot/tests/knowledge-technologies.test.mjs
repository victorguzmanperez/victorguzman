import test from "node:test";
import assert from "node:assert/strict";

import {
  EXPERIENCE_EVIDENCE,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  getCurrentProfessionalTechnologies,
  getHistoricalProfessionalTechnologies,
  getTechnologiesByEvidence,
  getTechnologyById,
  technologyKnowledge,
  technologyKnowledgeById,
} from "../data/knowledge/technologies.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


function evidenceOf(item) {
  return item.facts.find(
    (fact) =>
      fact.key ===
      "experience-evidence",
  ).value;
}


test(
  "technology knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        technologyKnowledge,
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
  "all technology items use TECHNOLOGY type",
  () => {
    assert.ok(
      technologyKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.TECHNOLOGY,
      ),
    );
  },
);


test(
  "technology ids are unique",
  () => {
    const ids =
      technologyKnowledge.map(
        (item) => item.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "technology index contains every item",
  () => {
    assert.equal(
      Object.keys(
        technologyKnowledgeById,
      ).length,
      technologyKnowledge.length,
    );
  },
);


test(
  "Power BI has current professional project training and publication evidence",
  () => {
    const item =
      getTechnologyById(
        "technology-power-bi",
      );

    const evidence =
      evidenceOf(item);

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PUBLISHED_KNOWLEDGE,
      ),
    );
  },
);


test(
  "COBOL is strong historical professional evidence",
  () => {
    const item =
      getTechnologyById(
        "technology-cobol",
      );

    assert.deepEqual(
      evidenceOf(item),
      [
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ],
    );
  },
);


test(
  "Oracle has both current and historical professional evidence",
  () => {
    const evidence =
      evidenceOf(
        getTechnologyById(
          "technology-oracle",
        ),
      );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_HISTORICAL,
      ),
    );
  },
);


test(
  "Python combines current project and formal training evidence",
  () => {
    const evidence =
      evidenceOf(
        getTechnologyById(
          "technology-python",
        ),
      );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROFESSIONAL_CURRENT,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .PROJECT_APPLIED,
      ),
    );

    assert.ok(
      evidence.includes(
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ),
    );
  },
);


test(
  "AWS is formal training not professional expertise",
  () => {
    const item =
      getTechnologyById(
        "technology-aws",
      );

    assert.deepEqual(
      evidenceOf(item),
      [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],
    );

    assert.equal(
      item.facts.find(
        (fact) =>
          fact.key ===
          "professional-current",
      ).value,
      false,
    );
  },
);


test(
  "R is formal training only",
  () => {
    assert.deepEqual(
      evidenceOf(
        getTechnologyById(
          "technology-r",
        ),
      ),
      [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],
    );
  },
);


test(
  "Java and Android are self learning",
  () => {
    for (
      const id of [
        "technology-java",
        "technology-android",
      ]
    ) {
      assert.deepEqual(
        evidenceOf(
          getTechnologyById(id),
        ),
        [
          EXPERIENCE_EVIDENCE
            .SELF_LEARNING,
        ],
      );
    }
  },
);


test(
  "Qlik explicitly has no evidence",
  () => {
    const item =
      getTechnologyById(
        "technology-qlik",
      );

    assert.deepEqual(
      evidenceOf(item),
      [
        EXPERIENCE_EVIDENCE
          .NO_EVIDENCE,
      ],
    );
  },
);


test(
  "Power Automate and Power Apps remain qualified as recent technologies",
  () => {
    for (
      const id of [
        "technology-power-automate",
        "technology-power-apps",
      ]
    ) {
      const item =
        getTechnologyById(id);

      assert.equal(
        item.facts.find(
          (fact) =>
            fact.key ===
            "professional-current",
        ).value,
        true,
      );

      assert.ok(
        item.limitations.length >
          1,
      );
    }
  },
);


test(
  "AI aliases include Spanish IA and English AI",
  () => {
    const item =
      getTechnologyById(
        "technology-ai",
      );

    assert.ok(
      item.aliases.includes("ia"),
    );

    assert.ok(
      item.aliases.includes("ai"),
    );

    assert.ok(
      item.aliases.includes(
        "inteligencia artificial",
      ),
    );
  },
);


test(
  "current professional technologies query works",
  () => {
    const ids =
      getCurrentProfessionalTechnologies()
        .map(
          (item) => item.id,
        );

    assert.ok(
      ids.includes(
        "technology-power-bi",
      ),
    );

    assert.ok(
      ids.includes(
        "technology-sas",
      ),
    );

    assert.ok(
      ids.includes(
        "technology-python",
      ),
    );
  },
);


test(
  "historical professional technologies query works",
  () => {
    const ids =
      getHistoricalProfessionalTechnologies()
        .map(
          (item) => item.id,
        );

    assert.ok(
      ids.includes(
        "technology-cobol",
      ),
    );

    assert.ok(
      ids.includes(
        "technology-control-m",
      ),
    );

    assert.ok(
      ids.includes(
        "technology-oracle",
      ),
    );
  },
);


test(
  "evidence query returns formal training technologies",
  () => {
    const result =
      getTechnologiesByEvidence(
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      );

    assert.ok(
      result.length > 0,
    );

    assert.ok(
      result.some(
        (item) =>
          item.id ===
          "technology-aws",
      ),
    );
  },
);


test(
  "technology getter handles invalid ids safely",
  () => {
    assert.equal(
      getTechnologyById(
        "technology-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getTechnologyById(""),
      null,
    );

    assert.equal(
      getTechnologyById(null),
      null,
    );
  },
);