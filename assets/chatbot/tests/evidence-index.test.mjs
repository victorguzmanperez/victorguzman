import test from "node:test";
import assert from "node:assert/strict";

import {
  EXPERIENCE_EVIDENCE,
} from "../data/knowledge/constants.js";

import {
  EVIDENCE_KIND,
  EVIDENCE_MATCH_LEVEL,
  classifyEvidenceScore,
} from "../data/knowledge/evidence-model.js";

import {
  evidenceIndex,
  evidenceIndexById,
  getEvidenceByKind,
  getEvidenceByKnowledgeId,
} from "../data/knowledge/evidence-index.js";


test(
  "evidence score classification follows thresholds",
  () => {
    assert.equal(
      classifyEvidenceScore(90),
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );

    assert.equal(
      classifyEvidenceScore(75),
      EVIDENCE_MATCH_LEVEL
        .STRONG_RELATED,
    );

    assert.equal(
      classifyEvidenceScore(60),
      EVIDENCE_MATCH_LEVEL.RELATED,
    );

    assert.equal(
      classifyEvidenceScore(45),
      EVIDENCE_MATCH_LEVEL.SUPPORTING,
    );

    assert.equal(
      classifyEvidenceScore(20),
      EVIDENCE_MATCH_LEVEL.NO_EVIDENCE,
    );
  },
);


test(
  "evidence index is not empty",
  () => {
    assert.ok(
      evidenceIndex.length > 0,
    );
  },
);


test(
  "evidence ids are unique",
  () => {
    const ids =
      evidenceIndex.map(
        (item) => item.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "evidence index includes every required knowledge kind",
  () => {
    const kinds =
      new Set(
        evidenceIndex.map(
          (item) => item.kind,
        ),
      );

    for (
      const kind of [
        EVIDENCE_KIND.PROFILE,
        EVIDENCE_KIND.EXPERIENCE,
        EVIDENCE_KIND.TECHNOLOGY,
        EVIDENCE_KIND.CAPABILITY,
        EVIDENCE_KIND.EDUCATION,
        EVIDENCE_KIND.CERTIFICATION,
        EVIDENCE_KIND.PROJECT,
      ]
    ) {
      assert.ok(
        kinds.has(kind),
        `missing ${kind}`,
      );
    }
  },
);


test(
  "evidence index object contains every evidence item",
  () => {
    assert.equal(
      Object.keys(
        evidenceIndexById,
      ).length,
      evidenceIndex.length,
    );
  },
);


test(
  "project evidence exposes problems capabilities and technologies",
  () => {
    const evidence =
      getEvidenceByKnowledgeId(
        "project-business-cost-intelligence",
      );

    assert.equal(
      evidence.kind,
      EVIDENCE_KIND.PROJECT,
    );

    assert.ok(
      evidence.problems.length > 0,
    );

    assert.ok(
      evidence.capabilities.length >
        0,
    );

    assert.ok(
      evidence.technologies.length >
        0,
    );
  },
);


test(
  "professional experience is represented as experience evidence",
  () => {
    const evidence =
      getEvidenceByKnowledgeId(
        "experience-altran-frankfurt-2011-2012",
      );

    assert.equal(
      evidence.kind,
      EVIDENCE_KIND.EXPERIENCE,
    );

    assert.ok(
      evidence.technologies.includes(
        "technology-oracle",
      ),
    );
  },
);


test(
  "formal education is marked as training evidence",
  () => {
    const evidence =
      getEvidenceByKnowledgeId(
        "education-ai-big-data-2021-2022",
      );

    assert.deepEqual(
      evidence.evidenceModes,
      [
        EXPERIENCE_EVIDENCE
          .FORMAL_TRAINING,
      ],
    );
  },
);


test(
  "Qlik evidence preserves explicit no-evidence status",
  () => {
    const evidence =
      getEvidenceByKnowledgeId(
        "technology-qlik",
      );

    assert.ok(
      evidence.evidenceModes
        .includes(
          EXPERIENCE_EVIDENCE
            .NO_EVIDENCE,
        ),
    );
  },
);


test(
  "PL-300 certification evidence is not earned",
  () => {
    const evidence =
      getEvidenceByKnowledgeId(
        "certification-pl300",
      );

    assert.equal(
      evidence.metadata.earned,
      false,
    );
  },
);


test(
  "kind query returns projects",
  () => {
    const projects =
      getEvidenceByKind(
        EVIDENCE_KIND.PROJECT,
      );

    assert.equal(
      projects.length,
      4,
    );
  },
);


test(
  "unknown knowledge evidence resolves safely",
  () => {
    assert.equal(
      getEvidenceByKnowledgeId(
        "does-not-exist",
      ),
      null,
    );
  },
);