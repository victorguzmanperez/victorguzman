import test from "node:test";
import assert from "node:assert/strict";

import {
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  composeSocialResponse,
} from "../core/social-response-composer.js";

import {
  composeKnowledgeSummaryResponse,
  composeKnowledgeListResponse,
} from "../core/knowledge-response-composer.js";

import {
  composeKnowledgeOverviewResponse,
} from "../core/knowledge-overview-response-composer.js";

import {
  composeQualifiedResponse,
} from "../core/qualified-response-composer.js";

import {
  composeCommercialResponse,
} from "../core/commercial-response-composer.js";

import {
  composeProblemSolutionServiceResponse,
} from "../core/problem-solution-service-response-composer.js";

import {
  composeOperationalResponse,
  composeBookingEventResponse,
} from "../core/operational-response-composer.js";

import {
  composePrivacyResponse,
} from "../core/privacy-response-composer.js";

import {
  RESPONSE_QA_FAMILY,
  RESPONSE_QA_ROUTE,
  responseQaCases,
  responseQaStats,
} from "../data/response-qa.js";


function visibleText(response) {
  return (
    response?.messages ?? []
  )
    .map(
      (message) =>
        message.text,
    )
    .join(" ")
    .trim();
}


function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}


async function composeCase(item) {
  const options =
    item.options ?? {};

  switch (item.route) {
    case RESPONSE_QA_ROUTE.SOCIAL:
      return composeSocialResponse(options);

    case RESPONSE_QA_ROUTE.KNOWLEDGE_SUMMARY:
      return composeKnowledgeSummaryResponse({
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.KNOWLEDGE_LIST:
      return composeKnowledgeListResponse({
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.KNOWLEDGE_OVERVIEW:
      return composeKnowledgeOverviewResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.QUALIFIED:
      return composeQualifiedResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.COMMERCIAL:
      return composeCommercialResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.PROBLEM_FLOW:
      return composeProblemSolutionServiceResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.OPERATIONAL:
      return composeOperationalResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.BOOKING_EVENT:
      return composeBookingEventResponse(options);

    case RESPONSE_QA_ROUTE.PRIVACY:
      return composePrivacyResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });

    case RESPONSE_QA_ROUTE.FALLBACK: {
      const {
        composeFallbackResponse,
      } = await import(
        "../core/fallback-response-composer.js"
      );

      return composeFallbackResponse({
        userText:
          item.userText,
        ...options,
        answerQaId:
          item.id,
      });
    }

    default:
      return null;
  }
}


function assertIncludes(text, fragments, id) {
  const normalizedText =
    normalize(text);

  for (const fragment of fragments) {
    assert.ok(
      normalizedText.includes(
        normalize(fragment),
      ),
      `${id} missing visible fragment: ${fragment}\n${text}`,
    );
  }
}


function assertExcludes(text, fragments, id) {
  const normalizedText =
    normalize(text);

  for (const fragment of fragments) {
    assert.equal(
      normalizedText.includes(
        normalize(fragment),
      ),
      false,
      `${id} contains forbidden visible fragment: ${fragment}\n${text}`,
    );
  }
}


/* ============================================================
 * .11.1 — CORPUS CONTRACT
 * ============================================================
 */

test("Response QA corpus has unique ids", () => {
  const ids =
    responseQaCases.map(
      (item) =>
        item.id,
    );

  assert.equal(
    new Set(ids).size,
    ids.length,
  );
});


test("Response QA corpus covers every planned family", () => {
  for (const family of Object.values(RESPONSE_QA_FAMILY)) {
    assert.ok(
      responseQaStats.byFamily[family] > 0,
      family,
    );
  }
});


test("Response QA corpus contains panoramic Education Capability Technology cases", () => {
  const overviewIds =
    new Set(
      responseQaCases
        .filter(
          (item) =>
            item.family ===
              RESPONSE_QA_FAMILY.OVERVIEW,
        )
        .map(
          (item) =>
            item.id,
        ),
    );

  for (const id of [
    "OV-EDU-001",
    "OV-EDU-002",
    "OV-EDU-003",
    "OV-CAP-001",
    "OV-CAP-002",
    "OV-CAP-003",
    "OV-TEC-001",
    "OV-TEC-002",
    "OV-TEC-003",
  ]) {
    assert.ok(
      overviewIds.has(id),
      id,
    );
  }
});


/* ============================================================
 * .11.2 → .11.9 — CASE EXECUTION
 * ============================================================
 */

for (const item of responseQaCases) {
  test(
    `${item.id} — ${item.userText}`,
    async () => {
      const response =
        await composeCase(item);

      assert.ok(
        response,
        `${item.id} returned null`,
      );

      assert.equal(
        isValidResponseEnvelope(response),
        true,
        item.id,
      );

      assert.equal(
        response.kind,
        item.expected.kind,
        `${item.id} kind`,
      );

      assert.equal(
        response.outcome,
        item.expected.outcome,
        `${item.id} outcome`,
      );

      const text =
        visibleText(response);

      assert.ok(
        text,
        `${item.id} has no visible text`,
      );

      assertIncludes(
        text,
        item.expected.include,
        item.id,
      );

      assertExcludes(
        text,
        item.expected.exclude,
        item.id,
      );

      if (
        item.expected.actionTypes.length > 0
      ) {
        const actionTypes =
          response.actions.map(
            (action) =>
              action.type,
          );

        for (
          const actionType
          of item.expected.actionTypes
        ) {
          assert.ok(
            actionTypes.includes(actionType),
            `${item.id} missing action ${actionType}`,
          );
        }
      }

      if (
        item.expected.quickReplyLabels.length > 0
      ) {
        assert.deepEqual(
          response.quickReplies.map(
            (reply) =>
              reply.label,
          ),
          item.expected.quickReplyLabels,
          `${item.id} quick replies`,
        );
      }
    },
  );
}


/* ============================================================
 * .11.10 — TRANSVERSAL INVARIANTS
 * ============================================================
 */

test("all non-social QA responses disable inference", async () => {
  for (
    const item
    of responseQaCases.filter(
      (candidate) =>
        candidate.family !==
          RESPONSE_QA_FAMILY.SOCIAL,
    )
  ) {
    const response =
      await composeCase(item);

    assert.equal(
      response.safety.allowInference,
      false,
      item.id,
    );
  }
});


test("QA analytics never contains raw user text", async () => {
  for (const item of responseQaCases) {
    const response =
      await composeCase(item);

    const analytics =
      JSON.stringify(
        response.analytics,
      );

    assert.equal(
      analytics.includes(
        item.userText,
      ),
      false,
      item.id,
    );
  }
});


test("visible responses never expose internal Response Engine terminology", async () => {
  const forbidden = [
    "responseTemplateId",
    "knowledgeIds",
    "factIds",
    "fallbackLevel",
    "qualificationReasons",
    "direct_experience",
    "training_only",
    "no_evidence",
    "project_in_development",
    "commercialRedirect",
  ];

  for (const item of responseQaCases) {
    const response =
      await composeCase(item);

    const text =
      visibleText(response);

    for (const token of forbidden) {
      assert.equal(
        text.includes(token),
        false,
        `${item.id} exposes ${token}`,
      );
    }
  }
});


test("technical and commercial responses never interrupt to ask visitor name", async () => {
  const excludedFamilies =
    new Set([
      RESPONSE_QA_FAMILY.SOCIAL,
    ]);

  for (
    const item
    of responseQaCases.filter(
      (candidate) =>
        !excludedFamilies.has(
          candidate.family,
        ),
    )
  ) {
    const response =
      await composeCase(item);

    assert.equal(
      response.personalization.mayAskName,
      false,
      item.id,
    );
  }
});


/* ============================================================
 * .11.11 — NATURALNESS / ANTI-ROBOTICITY
 * ============================================================
 */

test("visible QA responses respect bubble and total text limits", async () => {
  for (const item of responseQaCases) {
    const response =
      await composeCase(item);

    const messages =
      response.messages;

    assert.ok(
      messages.length >= 1 &&
      messages.length <= 4,
      item.id,
    );

    for (const message of messages) {
      assert.ok(
        message.text.length <= 700,
        `${item.id} bubble too long`,
      );
    }

    assert.ok(
      visibleText(response).length <= 1800,
      `${item.id} total text too long`,
    );
  }
});


test("visible QA responses contain no HTML or debug formatting", async () => {
  for (const item of responseQaCases) {
    const text =
      visibleText(
        await composeCase(item),
      );

    assert.equal(
      /<\/?[a-z][^>]*>/i.test(text),
      false,
      item.id,
    );

    assert.equal(
      /\[object Object\]|undefined|null/i.test(text),
      false,
      item.id,
    );
  }
});


test("commercial QA never invents money duration or guaranteed ROI", async () => {
  for (
    const item
    of responseQaCases.filter(
      (candidate) =>
        candidate.family ===
          RESPONSE_QA_FAMILY.COMMERCIAL,
    )
  ) {
    const text =
      visibleText(
        await composeCase(item),
      );

    assert.equal(
      /\b\d+(?:[.,]\d+)?\s*(?:€|euros?|d[ií]as?|semanas?|meses?)\b/i.test(text),
      false,
      item.id,
    );

    assert.equal(
      /roi garantizado|resultado garantizado|ahorro garantizado/i.test(text),
      false,
      item.id,
    );
  }
});


test("mastery overview never converts no-evidence technology into expertise", async () => {
  const item =
    responseQaCases.find(
      (candidate) =>
        candidate.id ===
          "OV-TEC-003",
    );

  const text =
    visibleText(
      await composeCase(item),
    );

  assert.match(
    text,
    /Qlik no se presenta como experiencia/i,
  );

  assert.equal(
    /domina Qlik|experto en Qlik/i.test(text),
    false,
  );
});


/* ============================================================
 * .11.12 — SERIALIZATION / FINAL CONTRACT
 * ============================================================
 */

test("every Response QA case remains JSON serializable", async () => {
  for (const item of responseQaCases) {
    const response =
      await composeCase(item);

    assert.doesNotThrow(
      () =>
        JSON.stringify(response),
      item.id,
    );
  }
});