import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  QUALIFIED_RESPONSE_REASON,
  asksCertificationEarned,
  asksCurrentStatus,
  asksProjectFinished,
  composeQualifiedNaturalText,
  composeQualifiedResponse,
  resolveQualifiedResponseReason,
} from "../core/qualified-response-composer.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";

import {
  findSimilarEvidence,
} from "../data/knowledge/similarity-engine.js";


/* ============================================================
 * QUESTION SEMANTICS
 * ============================================================
 */

test(
  "current wording is detected",
  () => {
    assert.equal(
      asksCurrentStatus(
        "¿Víctor trabaja actualmente con COBOL?",
      ),
      true,
    );

    assert.equal(
      asksCurrentStatus(
        "¿Víctor tiene experiencia con COBOL?",
      ),
      false,
    );
  },
);


test(
  "certification earned wording is detected",
  () => {
    assert.equal(
      asksCertificationEarned(
        "¿Víctor tiene la certificación PL-300?",
      ),
      true,
    );
  },
);


test(
  "project finished wording is detected",
  () => {
    assert.equal(
      asksProjectFinished(
        "¿El proyecto ya está terminado?",
      ),
      true,
    );
  },
);


/* ============================================================
 * QLIK
 * ============================================================
 */

test(
  "Qlik resolves as no evidence",
  () => {
    const item =
      getKnowledgeById(
        "technology-qlik",
      );

    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con Qlik Sense?",
      );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Víctor tiene experiencia con Qlik Sense?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .NO_EVIDENCE,
    );
  },
);


test(
  "Qlik response never invents professional experience",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con Qlik Sense?",

        knowledgeId:
          "technology-qlik",

        intent:
          "technologies",
      });

    assert.ok(response);

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.QUALIFIED,
    );

    assert.match(
      response.messages[0]
        .text,
      /no tengo base.*experiencia profesional.*formación/i,
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "invented-professional-experience",
        ),
    );
  },
);


/* ============================================================
 * AWS
 * ============================================================
 */

test(
  "AWS resolves as training only",
  () => {
    const item =
      getKnowledgeById(
        "technology-aws",
      );

    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con AWS?",
      );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Víctor tiene experiencia con AWS?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .TRAINING_ONLY,
    );
  },
);


test(
  "AWS response distinguishes training from professional experience",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",

        intent:
          "technologies",
      });

    assert.ok(response);

    assert.match(
      response.messages[0]
        .text,
      /formación/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /no.*experiencia profesional|no existe base|no sería correcto/i,
    );
  },
);


/* ============================================================
 * COBOL TEMPORALITY
 * ============================================================
 */

test(
  "current COBOL question resolves historical not current",
  () => {
    const item =
      getKnowledgeById(
        "technology-cobol",
      );

    const assessment =
      findSimilarEvidence(
        "¿Víctor trabaja actualmente con COBOL?",
      );

    assert.equal(
      assessment.qualification.mode,
      "direct_experience",
    );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Víctor trabaja actualmente con COBOL?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .HISTORICAL_NOT_CURRENT,
    );
  },
);


test(
  "COBOL current question does not convert historical experience into current experience",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor trabaja actualmente con COBOL?",

        knowledgeId:
          "technology-cobol",

        intent:
          "technologies",
      });

    assert.ok(response);

    assert.match(
      response.messages[0]
        .text,
      /no consta.*actual/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /histórica|histórico/i,
    );

    assert.ok(
      response.evidence
        .factIds.includes(
          "technology-cobol-fact-current-professional",
        ),
    );

    assert.ok(
      response.evidence
        .factIds.includes(
          "technology-cobol-fact-historical-professional",
        ),
    );
  },
);


test(
  "non-current COBOL experience question may remain direct evidence",
  () => {
    const item =
      getKnowledgeById(
        "technology-cobol",
      );

    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene experiencia con COBOL?",
      );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Víctor tiene experiencia con COBOL?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .DIRECT_EXPERIENCE,
    );
  },
);


/* ============================================================
 * PL-300
 * ============================================================
 */

test(
  "PL-300 resolves as preparing instead of generic training-only",
  () => {
    const item =
      getKnowledgeById(
        "certification-pl300",
      );

    const assessment =
      findSimilarEvidence(
        "¿Víctor tiene la certificación PL-300?",
      );

    assert.equal(
      assessment.qualification.mode,
      "training_only",
    );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Víctor tiene la certificación PL-300?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .CERTIFICATION_PREPARING,
    );

    assert.equal(
      qualification.earned,
      false,
    );

    assert.equal(
      qualification.trainingCompleted,
      true,
    );
  },
);


test(
  "PL-300 response says certification is not yet earned",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene la certificación PL-300?",

        knowledgeId:
          "certification-pl300",

        intent:
          "certification",
      });

    assert.ok(response);

    assert.match(
      response.messages[0]
        .text,
      /está preparando/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /no consta como obtenida|todavía no/i,
    );

    assert.ok(
      response.evidence
        .factIds.includes(
          "fact-pl300-status",
        ),
    );

    assert.ok(
      response.evidence
        .factIds.includes(
          "fact-pl300-official-earned",
        ),
    );
  },
);


test(
  "PL-300 preserves forbidden certified claims",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene la certificación PL-300?",

        knowledgeId:
          "certification-pl300",
      });

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "pl300-earned",
        ),
    );
  },
);


/* ============================================================
 * PROJECT IN DEVELOPMENT
 * ============================================================
 */

test(
  "investment dashboard resolves as in development",
  () => {
    const item =
      getKnowledgeById(
        "project-investment-dashboard-ai",
      );

    const assessment =
      findSimilarEvidence(
        "¿Tiene algún proyecto para analizar dividendos, riesgo y valoración?",
      );

    const qualification =
      resolveQualifiedResponseReason({
        item,
        userText:
          "¿Tiene algún proyecto para analizar dividendos, riesgo y valoración?",
        assessment,
      });

    assert.equal(
      qualification.reason,
      QUALIFIED_RESPONSE_REASON
        .PROJECT_IN_DEVELOPMENT,
    );
  },
);


test(
  "investment dashboard response never presents project as finished",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Tiene algún proyecto para analizar dividendos, riesgo y valoración?",

        knowledgeId:
          "project-investment-dashboard-ai",

        intent:
          "projects",
      });

    assert.ok(response);

    assert.match(
      response.messages[0]
        .text,
      /está desarrollando|en desarrollo/i,
    );

    assert.match(
      response.messages[0]
        .text,
      /todavía no es una versión final/i,
    );

    assert.ok(
      response.evidence
        .factIds.includes(
          "project-investment-dashboard-ai-fact-project-status",
        ),
    );

    assert.equal(
      /no está disponible|no esta disponible/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


/* ============================================================
 * GENERIC RESPONSE CONTRACT
 * ============================================================
 */

test(
  "qualified response creates valid Response Envelope",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",

        intent:
          "technologies",
      });

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );

    assert.equal(
      response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );
  },
);


test(
  "qualified response always requires evidence",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con Qlik?",

        knowledgeId:
          "technology-qlik",
      });

    assert.equal(
      response.evidence.mode,
      RESPONSE_EVIDENCE_MODE.REQUIRED,
    );

    assert.ok(
      response.evidence
        .knowledgeIds.length >
        0,
    );
  },
);


test(
  "qualified response always sets mustQualify",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      });

    assert.equal(
      response.safety
        .mustQualify,
      true,
    );
  },
);


test(
  "qualified response never enables inference",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      });

    assert.equal(
      response.safety
        .allowInference,
      false,
    );
  },
);


test(
  "qualified response preserves FAQ and Answer QA trace",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con Qlik Sense?",

        knowledgeId:
          "technology-qlik",

        faqId:
          "faq-test",

        answerQaId:
          "answer-qa-test",
      });

    assert.equal(
      response.trace.faqId,
      "faq-test",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-qa-test",
    );
  },
);


test(
  "qualification reason enters evidence trace",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      });

    assert.deepEqual(
      response.evidence
        .qualificationReasons,
      [
        QUALIFIED_RESPONSE_REASON
          .TRAINING_ONLY,
      ],
    );
  },
);


test(
  "continuing context remains continuing",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",

        context: {
          continuing:
            true,
        },
      });

    assert.equal(
      response.conversation
        .continuity,
      "continuing",
    );
  },
);


test(
  "technical qualified response never asks visitor name",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      });

    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );

    assert.equal(
      response.personalization
        .usedName,
      false,
    );
  },
);


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

test(
  "qualified natural text never exposes internal modes or policy wording",
  () => {
    const cases = [
      {
        text:
          "¿Víctor tiene experiencia con Qlik?",

        knowledgeId:
          "technology-qlik",
      },

      {
        text:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      },

      {
        text:
          "¿Víctor trabaja actualmente con COBOL?",

        knowledgeId:
          "technology-cobol",
      },

      {
        text:
          "¿Víctor tiene la certificación PL-300?",

        knowledgeId:
          "certification-pl300",
      },

      {
        text:
          "¿Tiene algún proyecto para analizar dividendos, riesgo y valoración?",

        knowledgeId:
          "project-investment-dashboard-ai",
      },
    ];


    for (
      const item
      of cases
    ) {
      const response =
        composeQualifiedResponse({
          userText:
            item.text,

          knowledgeId:
            item.knowledgeId,
        });


      const text =
        response.messages[0]
          .text;


      assert.equal(
        /training_only|no_evidence|direct_experience|related_experience|strong_related/i
          .test(
            text,
          ),
        false,
      );


      assert.equal(
        /no debe presentarse|no sería correcto presentarlo|producto final cerrado/i
          .test(
            text,
          ),
        false,
      );
    }
  },
);


test(
  "qualified responses remain JSON serializable",
  () => {
    const response =
      composeQualifiedResponse({
        userText:
          "¿Víctor tiene experiencia con AWS?",

        knowledgeId:
          "technology-aws",
      });

    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);


test(
  "unknown Knowledge returns null",
  () => {
    assert.equal(
      composeQualifiedResponse({
        userText:
          "Una pregunta",

        knowledgeId:
          "does-not-exist",
      }),
      null,
    );
  },
);


test(
  "empty user text returns null",
  () => {
    assert.equal(
      composeQualifiedResponse({
        userText:
          "   ",

        knowledgeId:
          "technology-aws",
      }),
      null,
    );
  },
);