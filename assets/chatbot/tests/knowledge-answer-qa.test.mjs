import test from "node:test";
import assert from "node:assert/strict";

import {
  knowledgeById,
} from "../data/knowledge.js";

import {
  faqCorpus,
} from "../data/faqs.js";

import {
  ANSWER_QA_ACTION,
  ANSWER_QA_CATEGORY,
  ANSWER_QA_DECISION,
  ANSWER_QA_EVIDENCE,
  ANSWER_QA_NAME_POLICY,
  answerQaCases,
  answerQaContracts,
  answerQaById,
  faqAnswerContracts,
  getAnswerQaByCategory,
  getAnswerQaById,
} from "../data/answer-qa.js";


function unique(
  values,
) {
  return (
    new Set(values).size ===
    values.length
  );
}


test(
  "every canonical FAQ has an Answer QA contract",
  () => {
    assert.equal(
      faqAnswerContracts.length,
      faqCorpus.length,
    );

    assert.equal(
      faqAnswerContracts.length,
      200,
    );
  },
);


test(
  "Answer QA ids are globally unique",
  () => {
    assert.equal(
      unique(
        answerQaContracts.map(
          (item) =>
            item.id,
        ),
      ),
      true,
    );
  },
);


test(
  "Answer QA index contains every contract",
  () => {
    assert.equal(
      Object.keys(
        answerQaById,
      ).length,
      answerQaContracts.length,
    );

    for (
      const item
      of answerQaContracts
    ) {
      assert.equal(
        answerQaById[
          item.id
        ],
        item,
      );
    }
  },
);


test(
  "every referenced Knowledge id exists",
  () => {
    for (
      const contract
      of answerQaContracts
    ) {
      for (
        const knowledgeId
        of contract.knowledgeIds
      ) {
        assert.ok(
          knowledgeById[
            knowledgeId
          ],
          `${contract.id} references unknown Knowledge ${knowledgeId}`,
        );
      }
    }
  },
);


test(
  "FAQ contracts never contain final response text",
  () => {
    for (
      const contract
      of answerQaContracts
    ) {
      assert.equal(
        Object.hasOwn(
          contract,
          "answer",
        ),
        false,
      );

      assert.equal(
        Object.hasOwn(
          contract,
          "response",
        ),
        false,
      );

      assert.equal(
        Object.hasOwn(
          contract,
          "responseText",
        ),
        false,
      );
    }
  },
);


test(
  "safe redirect FAQ contracts only redirect commercially",
  () => {
    const redirects =
      faqAnswerContracts.filter(
        (item) =>
          item.decision ===
          ANSWER_QA_DECISION.REDIRECT,
      );

    assert.ok(
      redirects.length > 0,
    );

    for (
      const contract
      of redirects
    ) {
      assert.ok(
        contract.allowedActions
          .includes(
            ANSWER_QA_ACTION
              .OPEN_CONTACT,
          ),
      );
    }
  },
);


test(
  "evidence verification contracts require evidence",
  () => {
    const evidence =
      faqAnswerContracts.filter(
        (item) =>
          item.evidence ===
          ANSWER_QA_EVIDENCE.REQUIRED,
      );

    assert.ok(
      evidence.length > 0,
    );
  },
);


test(
  "Qlik answer must remain qualified",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-evidence-001",
      );

    assert.equal(
      contract.decision,
      ANSWER_QA_DECISION
        .ANSWER_QUALIFIED,
    );

    assert.equal(
      contract.mustQualify,
      true,
    );

    assert.equal(
      contract.evidence,
      ANSWER_QA_EVIDENCE.REQUIRED,
    );
  },
);


test(
  "AWS professional experience cannot be upgraded from training",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-evidence-002",
      );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "upgrade-training-to-professional-experience",
        ),
    );
  },
);


test(
  "PL-300 answer cannot claim certification earned",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-evidence-003",
      );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "certification-earned",
        ),
    );
  },
);


test(
  "in-development project cannot be described as finished",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-evidence-004",
      );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "present-in-development-as-finished",
        ),
    );
  },
);


test(
  "historical COBOL cannot be presented as current work",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-evidence-005",
      );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "historical-as-current",
        ),
    );
  },
);


test(
  "all pricing QA scenarios redirect to human contact",
  () => {
    const cases =
      getAnswerQaByCategory(
        ANSWER_QA_CATEGORY
          .COMMERCIAL,
      ).filter(
        (item) =>
          item.expectedIntent ===
          "pricing",
      );

    assert.ok(
      cases.length >= 3,
    );

    for (
      const contract
      of cases
    ) {
      assert.equal(
        contract.decision,
        ANSWER_QA_DECISION.REDIRECT,
      );

      assert.ok(
        contract.allowedActions
          .includes(
            ANSWER_QA_ACTION
              .OPEN_CONTACT,
          ),
      );
    }
  },
);


test(
  "timeline QA redirects instead of inventing duration",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-commercial-004",
      );

    assert.equal(
      contract.decision,
      ANSWER_QA_DECISION.REDIRECT,
    );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "invented-timeline",
        ),
    );
  },
);


test(
  "availability is never promised automatically",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-commercial-005",
      );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "automatic-availability",
        ),
    );

    assert.ok(
      contract.allowedActions
        .includes(
          ANSWER_QA_ACTION
            .OPEN_CONTACT,
        ),
    );
  },
);


test(
  "feasibility result and ROI are never guaranteed",
  () => {
    const ids = [
      "aqa-commercial-006",
      "aqa-commercial-007",
      "aqa-commercial-008",
    ];

    for (
      const id
      of ids
    ) {
      const contract =
        getAnswerQaById(id);

      assert.equal(
        contract.mustQualify,
        true,
      );

      assert.ok(
        contract.allowedActions
          .includes(
            ANSWER_QA_ACTION
              .START_DIAGNOSTIC,
          ),
      );
    }
  },
);


test(
  "privacy answers are always backed by Policy Knowledge",
  () => {
    const cases =
      getAnswerQaByCategory(
        ANSWER_QA_CATEGORY.PRIVACY,
      );

    assert.ok(
      cases.length > 0,
    );

    for (
      const contract
      of cases
    ) {
      assert.ok(
        contract.knowledgeIds
          .every(
            (id) =>
              knowledgeById[id]
                ?.type ===
              "policy",
          ),
        contract.id,
      );
    }
  },
);


test(
  "Analytics QA explicitly protects raw conversation and PII",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-privacy-003",
      );

    for (
      const key
      of [
        "raw-message",
        "conversation",
        "free-text",
        "name",
        "email",
        "phone",
      ]
    ) {
      assert.ok(
        contract.privacy
          .analyticsForbidden
          .includes(
            key,
          ),
        key,
      );
    }
  },
);


test(
  "greetings are social answers and never require Knowledge",
  () => {
    const greetings =
      getAnswerQaByCategory(
        ANSWER_QA_CATEGORY.GREETING,
      );

    assert.equal(
      greetings.length,
      6,
    );

    for (
      const contract
      of greetings
    ) {
      assert.equal(
        contract.decision,
        ANSWER_QA_DECISION.SOCIAL,
      );

      assert.equal(
        contract.mustUseKnowledge,
        false,
      );

      assert.equal(
        contract.social
          .nameRequired,
        false,
      );
    }
  },
);


test(
  "unknown visitor name may be requested only optionally",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-greeting-001",
      );

    assert.equal(
      contract.social.namePolicy,
      ANSWER_QA_NAME_POLICY
        .OPTIONAL,
    );

    assert.equal(
      contract.social.mayAskName,
      true,
    );

    assert.equal(
      contract.social.nameRequired,
      false,
    );
  },
);


test(
  "known name can personalize a greeting without asking again",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-greeting-003",
      );

    assert.equal(
      contract.context.name,
      "Juan",
    );

    assert.equal(
      contract.social.namePolicy,
      ANSWER_QA_NAME_POLICY
        .USE_IF_KNOWN,
    );

    assert.equal(
      contract.social.mayAskName,
      false,
    );
  },
);


test(
  "Hola Victor never implies that the visitor is named Victor",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-greeting-005",
      );

    assert.equal(
      contract.social
        .mustNotTreatVictorAsUserName,
      true,
    );
  },
);


test(
  "a direct technical question is never interrupted to request a name",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-name-004",
      );

    assert.equal(
      contract.social
        .mustNotInterruptForName,
      true,
    );

    assert.equal(
      contract.social.mayAskName,
      false,
    );
  },
);


test(
  "declining to provide a name must be respected",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-name-002",
      );

    assert.equal(
      contract.social
        .mustContinueWithoutName,
      true,
    );

    assert.equal(
      contract.social.mayAskName,
      false,
    );
  },
);


test(
  "provided names are forbidden from Analytics",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-name-001",
      );

    assert.ok(
      contract.privacy
        .analyticsForbidden
        .includes(
          "name",
        ),
    );
  },
);


test(
  "thanks never force commercial CTA",
  () => {
    const cases =
      getAnswerQaByCategory(
        ANSWER_QA_CATEGORY.THANKS,
      );

    for (
      const contract
      of cases
    ) {
      assert.equal(
        contract.social
          .mustNotReopenFlow,
        true,
      );

      assert.equal(
        contract.allowedActions
          .includes(
            ANSWER_QA_ACTION
              .OPEN_CONTACT,
          ),
        false,
      );
    }
  },
);


test(
  "goodbye may offer feedback only after a meaningful conversation",
  () => {
    const eligible =
      getAnswerQaById(
        "aqa-goodbye-002",
      );

    const ineligible =
      getAnswerQaById(
        "aqa-goodbye-004",
      );

    assert.equal(
      eligible.context
        .meaningfulConversation,
      true,
    );

    assert.equal(
      eligible.social
        .mayOfferFeedback,
      true,
    );

    assert.ok(
      eligible.allowedActions
        .includes(
          ANSWER_QA_ACTION
            .OFFER_FEEDBACK,
        ),
    );

    assert.equal(
      ineligible.context
        .meaningfulConversation,
      false,
    );

    assert.equal(
      ineligible.social
        .mayOfferFeedback,
      false,
    );
  },
);


test(
  "goodbye never reopens diagnostic or commercial flow",
  () => {
    const cases =
      getAnswerQaByCategory(
        ANSWER_QA_CATEGORY.GOODBYE,
      );

    for (
      const contract
      of cases
    ) {
      assert.equal(
        contract.social
          .mustNotReopenFlow,
        true,
      );

      assert.equal(
        contract.allowedActions
          .includes(
            ANSWER_QA_ACTION
              .START_DIAGNOSTIC,
          ),
        false,
      );
    }
  },
);


test(
  "politeness respects an explicit decline",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-politeness-003",
      );

    assert.equal(
      contract.social
        .mustRespectDecline,
      true,
    );

    assert.equal(
      contract.social
        .mustNotRepeatCTA,
      true,
    );
  },
);


test(
  "fallback levels progress without inventing an answer",
  () => {
    assert.equal(
      getAnswerQaById(
        "aqa-unsupported-001",
      ).social.fallbackLevel,
      1,
    );

    assert.equal(
      getAnswerQaById(
        "aqa-unsupported-002",
      ).social.fallbackLevel,
      2,
    );

    assert.equal(
      getAnswerQaById(
        "aqa-unsupported-003",
      ).social.fallbackLevel,
      3,
    );
  },
);


test(
  "unsupported questions explicitly forbid invented facts",
  () => {
    const contract =
      getAnswerQaById(
        "aqa-unsupported-004",
      );

    assert.equal(
      contract.decision,
      ANSWER_QA_DECISION.FALLBACK,
    );

    assert.ok(
      contract.forbiddenClaims
        .includes(
          "invented-fact",
        ),
    );
  },
);


test(
  "Answer QA structures are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        answerQaContracts,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        answerQaCases,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        answerQaById,
      ),
      true,
    );

    for (
      const contract
      of answerQaContracts
    ) {
      assert.equal(
        Object.isFrozen(
          contract,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          contract
            .knowledgeIds,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          contract
            .allowedActions,
        ),
        true,
      );
    }
  },
);


test(
  "Answer QA getters fail safely",
  () => {
    assert.equal(
      getAnswerQaById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getAnswerQaById(null),
      null,
    );

    assert.deepEqual(
      getAnswerQaByCategory(
        "does-not-exist",
      ),
      [],
    );
  },
);