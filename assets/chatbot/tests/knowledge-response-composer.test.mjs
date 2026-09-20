import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  KNOWLEDGE_RESPONSE_MODE,
  canComposeDirectKnowledgeAnswer,
  composeDirectKnowledgeResponse,
  composeKnowledgeFactResponse,
  composeKnowledgeListResponse,
  composeKnowledgeSummaryResponse,
  knowledgeFactValueToText,
} from "../core/knowledge-response-composer.js";

import {
  getKnowledgeById,
} from "../data/knowledge.js";


test(
  "string fact values remain text",
  () => {
    assert.equal(
      knowledgeFactValueToText(
        "Power BI",
      ),
      "Power BI",
    );
  },
);


test(
  "boolean fact values become natural Spanish",
  () => {
    assert.equal(
      knowledgeFactValueToText(
        true,
      ),
      "Sí",
    );

    assert.equal(
      knowledgeFactValueToText(
        false,
      ),
      "No",
    );
  },
);


test(
  "array fact values are joined naturally",
  () => {
    assert.equal(
      knowledgeFactValueToText([
        "Power BI",
        "Power Query",
        "DAX",
      ]),
      "Power BI, Power Query y DAX",
    );
  },
);


test(
  "unsupported fact values produce empty text",
  () => {
    assert.equal(
      knowledgeFactValueToText({
        x:
          1,
      }),
      "",
    );
  },
);


test(
  "direct Knowledge eligibility follows answer policy",
  () => {
    const profile =
      getKnowledgeById(
        "profile-victor",
      );

    assert.equal(
      canComposeDirectKnowledgeAnswer(
        profile,
      ),
      true,
    );
  },
);


test(
  "unknown Knowledge cannot be composed",
  () => {
    assert.equal(
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "does-not-exist",
      }),
      null,
    );
  },
);


test(
  "profile summary creates valid Knowledge response",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",

        intent:
          "about_victor",
      });

    assert.ok(response);

    assert.equal(
      response.kind,
      RESPONSE_KIND.KNOWLEDGE,
    );

    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME.ANSWERED,
    );

    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


test(
  "Knowledge summary carries Knowledge trace",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",
      });

    assert.deepEqual(
      response.evidence
        .knowledgeIds,
      [
        "profile-victor",
      ],
    );
  },
);


test(
  "direct Knowledge response never enables inference",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",
      });

    assert.equal(
      response.safety
        .allowInference,
      false,
    );
  },
);


test(
  "direct Knowledge response uses evidence when useful",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",
      });

    assert.equal(
      response.evidence.mode,
      RESPONSE_EVIDENCE_MODE
        .WHEN_USEFUL,
    );
  },
);


test(
  "real fact can be rendered from Knowledge",
  () => {
    const profile =
      getKnowledgeById(
        "profile-victor",
      );

    const fact =
      profile.facts[0];

    const response =
      composeKnowledgeFactResponse({
        knowledgeId:
          profile.id,

        factKey:
          fact.key,
      });

    assert.ok(response);

    assert.deepEqual(
      response.evidence
        .factIds,
      [
        fact.id,
      ],
    );
  },
);


test(
  "unknown fact returns null",
  () => {
    assert.equal(
      composeKnowledgeFactResponse({
        knowledgeId:
          "profile-victor",

        factKey:
          "does-not-exist",
      }),
      null,
    );
  },
);


test(
  "project list is built from canonical Knowledge titles",
  () => {
    const response =
      composeKnowledgeListResponse({
        knowledgeIds: [
          "project-business-cost-intelligence",
          "project-auditoria-digital-cv",
          "project-digital-competency-evaluation",
        ],

        intent:
          "projects",

        intro:
          "Entre los proyectos del portfolio están",
      });

    assert.ok(response);

    assert.ok(
      response.messages[0]
        .text.includes(
          "Business Cost Intelligence",
        ),
    );
  },
);


test(
  "service list is built from explicit Service Knowledge",
  () => {
    const response =
      composeKnowledgeListResponse({
        knowledgeIds: [
          "service-business-intelligence-dashboards",
          "service-excel-business-models",
          "service-data-process-automation",
          "service-ai-process-analysis",
        ],

        intent:
          "services",

        intro:
          "Actualmente se presentan cuatro líneas de servicio:",
      });

    assert.ok(response);

    assert.equal(
      response.evidence
        .knowledgeIds.length,
      4,
    );
  },
);


test(
  "list refuses unknown-only Knowledge",
  () => {
    assert.equal(
      composeKnowledgeListResponse({
        knowledgeIds: [
          "does-not-exist",
        ],
      }),
      null,
    );
  },
);


test(
  "list does not silently discard unsafe Knowledge",
  () => {
    const response =
      composeKnowledgeListResponse({
        knowledgeIds: [
          "profile-victor",
          "does-not-exist",
        ],
      });

    /*
     * Known items are allowed.
     * Unknown ids contribute no invented output.
     */
    assert.ok(response);

    assert.deepEqual(
      response.evidence
        .knowledgeIds,
      [
        "profile-victor",
      ],
    );
  },
);


test(
  "forbidden claims propagate from Knowledge",
  () => {
    const item =
      getKnowledgeById(
        "profile-victor",
      );

    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          item.id,
      });

    assert.deepEqual(
      response.safety
        .forbiddenClaims,
      item.answerPolicy
        .forbiddenClaims,
    );
  },
);


test(
  "FAQ and Answer QA trace may be preserved",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",

        faqId:
          "faq-001",

        answerQaId:
          "answer-contract-faq-001",
      });

    assert.equal(
      response.trace.faqId,
      "faq-001",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-contract-faq-001",
    );
  },
);


test(
  "continuing context marks response continuity",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",

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
  "technical answer never asks visitor name",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",

        context: {
          visitorName:
            "Juan",
        },
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


test(
  "main composer routes SUMMARY mode",
  () => {
    const response =
      composeDirectKnowledgeResponse({
        mode:
          KNOWLEDGE_RESPONSE_MODE
            .SUMMARY,

        knowledgeId:
          "profile-victor",
      });

    assert.ok(response);
  },
);


test(
  "main composer routes FACT mode",
  () => {
    const item =
      getKnowledgeById(
        "profile-victor",
      );

    const response =
      composeDirectKnowledgeResponse({
        mode:
          KNOWLEDGE_RESPONSE_MODE
            .FACT,

        knowledgeId:
          item.id,

        factKey:
          item.facts[0].key,
      });

    assert.ok(response);
  },
);


test(
  "main composer routes LIST mode",
  () => {
    const response =
      composeDirectKnowledgeResponse({
        mode:
          KNOWLEDGE_RESPONSE_MODE
            .LIST,

        knowledgeIds: [
          "project-business-cost-intelligence",
          "project-auditoria-digital-cv",
        ],
      });

    assert.ok(response);
  },
);


test(
  "unknown composer mode returns null",
  () => {
    assert.equal(
      composeDirectKnowledgeResponse({
        mode:
          "does-not-exist",

        knowledgeId:
          "profile-victor",
      }),
      null,
    );
  },
);


test(
  "direct Knowledge responses remain JSON serializable",
  () => {
    const response =
      composeKnowledgeSummaryResponse({
        knowledgeId:
          "profile-victor",
      });

    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);