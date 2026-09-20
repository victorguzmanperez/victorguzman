import test from "node:test";
import assert from "node:assert/strict";

import {
  EVIDENCE_CLAIM_MODE,
  EVIDENCE_MATCH_LEVEL,
  SIMILARITY_USER_GOAL,
} from "../data/knowledge/evidence-model.js";

import {
  buildSimilarityProfile,
  explainEvidenceResult,
  findSimilarEvidence,
} from "../data/knowledge/similarity-engine.js";


function resultByKnowledgeId(
  assessment,
  knowledgeId,
) {
  return assessment.results.find(
    (result) =>
      result.knowledgeId ===
      knowledgeId,
  );
}


test(
  "manual Excel consolidation creates a rich similarity profile",
  () => {
    const profile =
      buildSimilarityProfile(
        "Tengo 20 Excel que junto manualmente todos los lunes",
      );

    assert.ok(
      profile.problems.includes(
        "problem-manual-data-consolidation",
      ),
    );

    assert.ok(
      profile.capabilitiesNeeded
        .includes(
          "capability-data-consolidation",
        ),
    );

    assert.ok(
      profile.processCharacteristics
        .includes(
          "manual",
        ),
    );
  },
);


test(
  "similar-case wording sets FIND_SIMILAR_CASE goal",
  () => {
    const profile =
      buildSimilarityProfile(
        "¿Víctor ha hecho algo parecido con facturas PDF?",
      );

    assert.equal(
      profile.userGoal,
      SIMILARITY_USER_GOAL
        .FIND_SIMILAR_CASE,
    );
  },
);


test(
  "PDF extraction finds Business Cost Intelligence as direct evidence",
  () => {
    const assessment =
      findSimilarEvidence(
        "Tengo facturas PDF y quiero extraer los importes automáticamente",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-business-cost-intelligence",
      );

    assert.ok(project);

    assert.equal(
      project.level,
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );
  },
);


test(
  "web audit and scoring finds digital audit project",
  () => {
    const assessment =
      findSimilarEvidence(
        "Necesito auditar cientos de webs y calcular un scoring comparable",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-auditoria-digital-cv",
      );

    assert.ok(project);

    assert.equal(
      project.level,
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );
  },
);


test(
  "weighted Excel evaluation finds competency project",
  () => {
    const assessment =
      findSimilarEvidence(
        "Tengo un Excel con categorías, subcompetencias, indicadores y pesos",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-digital-competency-evaluation",
      );

    assert.ok(project);

    assert.equal(
      project.level,
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );
  },
);


test(
  "Oracle migration finds professional Frankfurt experience",
  () => {
    const assessment =
      findSimilarEvidence(
        "Necesito migrar información de un sistema antiguo a Oracle en banca",
      );

    const experience =
      resultByKnowledgeId(
        assessment,
        "experience-altran-frankfurt-2011-2012",
      );

    assert.ok(experience);

    assert.equal(
      experience.level,
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );
  },
);


test(
  "AWS produces training-only qualification",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con AWS?",
      );

    assert.equal(
      assessment.qualification.mode,
      EVIDENCE_CLAIM_MODE
        .TRAINING_ONLY,
    );

    assert.equal(
      assessment.qualification
        .canClaimDirectExperience,
      false,
    );
  },
);


test(
  "Qlik produces no-evidence qualification",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con Qlik Sense?",
      );

    assert.equal(
      assessment.qualification.mode,
      EVIDENCE_CLAIM_MODE
        .NO_EVIDENCE,
    );
  },
);


test(
  "PL-300 remains supporting training rather than earned certification",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene la certificación PL-300?",
      );

    const certification =
      resultByKnowledgeId(
        assessment,
        "certification-pl300",
      );

    assert.ok(certification);

    assert.equal(
      certification.level,
      EVIDENCE_MATCH_LEVEL.SUPPORTING,
    );

    assert.equal(
      certification.metadata.earned,
      false,
    );
  },
);


test(
  "investment dashboard cannot reach DIRECT while in development",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Tiene algún proyecto para analizar dividendos, riesgo y valoración?",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-investment-dashboard-ai",
      );

    assert.ok(project);

    assert.notEqual(
      project.level,
      EVIDENCE_MATCH_LEVEL.DIRECT,
    );
  },
);


test(
  "financial advice request detects constraint conflict",
  () => {
    const assessment =
      findSimilarEvidence(
        "Quiero que me recomiende qué acciones comprar analizando dividendos y riesgo",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-investment-dashboard-ai",
      );

    assert.ok(project);

    assert.ok(
      project.conflicts.includes(
        "financial-advice-not-supported",
      ),
    );
  },
);


test(
  "Power BI can be supported by several evidence kinds",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con Power BI?",
      );

    const ids =
      assessment.results.map(
        (result) =>
          result.knowledgeId,
      );

    assert.ok(
      ids.includes(
        "technology-power-bi",
      ),
    );

    assert.ok(
      ids.includes(
        "experience-banco-sabadell-2023-current",
      ),
    );
  },
);


test(
  "direct project evidence allows direct experience claim",
  () => {
    const assessment =
      findSimilarEvidence(
        "Tengo facturas PDF y quiero automatizar la extracción de datos",
      );

    assert.equal(
      assessment.qualification.mode,
      EVIDENCE_CLAIM_MODE
        .DIRECT_EXPERIENCE,
    );

    assert.equal(
      assessment.qualification
        .canClaimDirectExperience,
      true,
    );
  },
);


test(
  "evidence explanation describes direct similarity",
  () => {
    const assessment =
      findSimilarEvidence(
        "Tengo facturas PDF y quiero extraer datos",
      );

    const project =
      resultByKnowledgeId(
        assessment,
        "project-business-cost-intelligence",
      );

    const explanation =
      explainEvidenceResult(
        project,
      );

    assert.ok(
      explanation.includes(
        "coincidencia directa",
      ),
    );
  },
);


test(
  "training evidence explanation does not claim direct experience",
  () => {
    const assessment =
      findSimilarEvidence(
        "¿Víctor sabe AWS?",
      );

    const education =
      assessment.results.find(
        (result) =>
          result.kind ===
            "education" &&
          result.level ===
            EVIDENCE_MATCH_LEVEL
              .SUPPORTING,
      );

    assert.ok(education);

    const explanation =
      explainEvidenceResult(
        education,
      );

    assert.ok(
      explanation.includes(
        "no demuestra por sí sola experiencia directa",
      ),
    );
  },
);


test(
  "similarity results are ordered by descending score",
  () => {
    const assessment =
      findSimilarEvidence(
        "Necesito automatizar extracción de datos de facturas PDF",
      );

    for (
      let index = 1;
      index <
      assessment.results.length;
      index += 1
    ) {
      assert.ok(
        assessment.results[
          index - 1
        ].score >=
        assessment.results[
          index
        ].score,
      );
    }
  },
);


test(
  "similarity engine respects result limit",
  () => {
    const assessment =
      findSimilarEvidence(
        "Power BI datos automatización Excel",
        {
          limit: 3,
        },
      );

    assert.ok(
      assessment.results.length <=
        3,
    );
  },
);


test(
  "empty similarity input produces no direct evidence",
  () => {
    const assessment =
      findSimilarEvidence("");

    assert.equal(
      assessment.qualification.mode,
      EVIDENCE_CLAIM_MODE
        .NO_EVIDENCE,
    );
  },
);