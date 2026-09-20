import test from "node:test";
import assert from "node:assert/strict";

import {
  knowledgeById,
} from "../data/knowledge.js";

import {
  FAQ_ANSWER_MODE,
  FAQ_INTENT,
  FAQ_OBJECTIVE,
  FAQ_TOPIC_MODE,
  faqCorpus,
  faqCorpusById,
  faqCorpusByTopic,
  faqTopicSpecs,
  getFaqById,
  getFaqsByIntent,
  getFaqsByKnowledgeId,
  getFaqsByTopic,
} from "../data/faqs.js";


function isUnique(
  values,
) {
  return (
    new Set(values).size ===
    values.length
  );
}


test(
  "FAQ corpus contains fifty canonical topics",
  () => {
    assert.equal(
      faqTopicSpecs.length,
      50,
    );
  },
);


test(
  "FAQ corpus contains exactly two hundred canonical questions",
  () => {
    assert.equal(
      faqCorpus.length,
      200,
    );
  },
);


test(
  "every FAQ topic generates exactly four questions",
  () => {
    for (
      const topic
      of faqTopicSpecs
    ) {
      assert.equal(
        faqCorpusByTopic[
          topic.id
        ].length,
        4,
        topic.id,
      );
    }
  },
);


test(
  "FAQ ids are globally unique",
  () => {
    assert.equal(
      isUnique(
        faqCorpus.map(
          (faq) =>
            faq.id,
        ),
      ),
      true,
    );
  },
);


test(
  "canonical FAQ questions are unique",
  () => {
    assert.equal(
      isUnique(
        faqCorpus.map(
          (faq) =>
            faq.question,
        ),
      ),
      true,
    );
  },
);


test(
  "FAQ id index contains every canonical question",
  () => {
    assert.equal(
      Object.keys(
        faqCorpusById,
      ).length,
      faqCorpus.length,
    );

    for (
      const faq
      of faqCorpus
    ) {
      assert.equal(
        faqCorpusById[
          faq.id
        ],
        faq,
      );
    }
  },
);


test(
  "every FAQ references existing global Knowledge",
  () => {
    for (
      const faq
      of faqCorpus
    ) {
      assert.ok(
        faq.knowledgeIds.length > 0,
        `${faq.id} has no Knowledge`,
      );

      for (
        const knowledgeId
        of faq.knowledgeIds
      ) {
        assert.ok(
          knowledgeById[
            knowledgeId
          ],
          `${faq.id} references unknown Knowledge ${knowledgeId}`,
        );
      }
    }
  },
);


test(
  "every FAQ uses a canonical semantic intent",
  () => {
    const allowed =
      new Set(
        Object.values(
          FAQ_INTENT,
        ),
      );

    for (
      const faq
      of faqCorpus
    ) {
      assert.ok(
        allowed.has(
          faq.expectedIntent,
        ),
        `${faq.id} has invalid intent ${faq.expectedIntent}`,
      );
    }
  },
);


test(
  "every FAQ uses a canonical objective",
  () => {
    const allowed =
      new Set(
        Object.values(
          FAQ_OBJECTIVE,
        ),
      );

    for (
      const faq
      of faqCorpus
    ) {
      assert.ok(
        allowed.has(
          faq.objective,
        ),
        `${faq.id} has invalid objective ${faq.objective}`,
      );
    }
  },
);


test(
  "every FAQ uses a canonical answer mode",
  () => {
    const allowed =
      new Set(
        Object.values(
          FAQ_ANSWER_MODE,
        ),
      );

    for (
      const faq
      of faqCorpus
    ) {
      assert.ok(
        allowed.has(
          faq.answerMode,
        ),
        `${faq.id} has invalid answer mode ${faq.answerMode}`,
      );
    }
  },
);


test(
  "every FAQ topic uses a canonical topic mode",
  () => {
    const allowed =
      new Set(
        Object.values(
          FAQ_TOPIC_MODE,
        ),
      );

    for (
      const topic
      of faqTopicSpecs
    ) {
      assert.ok(
        allowed.has(
          topic.mode,
        ),
        `${topic.id} has invalid mode`,
      );
    }
  },
);


test(
  "pricing FAQs always require safe commercial redirect",
  () => {
    const pricing =
      getFaqsByIntent(
        FAQ_INTENT.PRICING,
      );

    assert.ok(
      pricing.length > 0,
    );

    for (
      const faq
      of pricing
    ) {
      assert.equal(
        faq.answerMode,
        FAQ_ANSWER_MODE
          .SAFE_REDIRECT,
      );

      assert.equal(
        faq.objective,
        FAQ_OBJECTIVE
          .REDIRECT_COMMERCIAL,
      );
    }
  },
);


test(
  "timeline FAQs always require safe commercial redirect",
  () => {
    const timeline =
      getFaqsByIntent(
        FAQ_INTENT.TIMELINE,
      );

    assert.ok(
      timeline.length > 0,
    );

    for (
      const faq
      of timeline
    ) {
      assert.equal(
        faq.answerMode,
        FAQ_ANSWER_MODE
          .SAFE_REDIRECT,
      );

      assert.equal(
        faq.objective,
        FAQ_OBJECTIVE
          .REDIRECT_COMMERCIAL,
      );
    }
  },
);


test(
  "all four explicit services have pricing and timeline FAQ coverage",
  () => {
    const serviceIds = [
      "service-business-intelligence-dashboards",
      "service-excel-business-models",
      "service-data-process-automation",
      "service-ai-process-analysis",
    ];

    for (
      const serviceId
      of serviceIds
    ) {
      const faqs =
        getFaqsByKnowledgeId(
          serviceId,
        );

      assert.ok(
        faqs.some(
          (faq) =>
            faq.expectedIntent ===
              FAQ_INTENT.PRICING,
        ),
        `${serviceId} lacks pricing coverage`,
      );

      assert.ok(
        faqs.some(
          (faq) =>
            faq.expectedIntent ===
              FAQ_INTENT.TIMELINE,
        ),
        `${serviceId} lacks timeline coverage`,
      );
    }
  },
);


test(
  "Qlik FAQ coverage exists without inventing positive evidence",
  () => {
    const qlikFaqs =
      getFaqsByKnowledgeId(
        "technology-qlik",
      );

    assert.equal(
      qlikFaqs.length,
      4,
    );

    for (
      const faq
      of qlikFaqs
    ) {
      assert.equal(
        faq.answerMode,
        FAQ_ANSWER_MODE.QUALIFIED,
      );
    }
  },
);


test(
  "PL-300 has four certification-status FAQs",
  () => {
    const faqs =
      getFaqsByKnowledgeId(
        "certification-pl300",
      );

    assert.equal(
      faqs.length,
      4,
    );

    assert.ok(
      faqs.every(
        (faq) =>
          faq.expectedIntent ===
            FAQ_INTENT.CERTIFICATION,
      ),
    );
  },
);


test(
  "privacy FAQ references all chatbot privacy policies",
  () => {
    const privacy =
      getFaqsByTopic(
        "topic-privacy",
      );

    assert.equal(
      privacy.length,
      4,
    );

    const expected = [
      "policy-chatbot-session-data",
      "policy-chatbot-analytics-privacy",
      "policy-chatbot-improvement-feedback",
    ];

    for (
      const faq
      of privacy
    ) {
      assert.deepEqual(
        [...faq.knowledgeIds],
        expected,
      );
    }
  },
);


test(
  "diagnostic FAQ never models automatic submission as a desired objective",
  () => {
    const diagnostic =
      getFaqsByTopic(
        "topic-diagnostic",
      );

    assert.equal(
      diagnostic.length,
      4,
    );

    assert.ok(
      diagnostic.every(
        (faq) =>
          faq.objective ===
            FAQ_OBJECTIVE.START_DIAGNOSTIC,
      ),
    );
  },
);


test(
  "FAQ corpus contains no final response text",
  () => {
    for (
      const faq
      of faqCorpus
    ) {
      assert.equal(
        Object.hasOwn(
          faq,
          "answer",
        ),
        false,
      );

      assert.equal(
        Object.hasOwn(
          faq,
          "response",
        ),
        false,
      );

      assert.equal(
        Object.hasOwn(
          faq,
          "responseText",
        ),
        false,
      );
    }
  },
);


test(
  "FAQ corpus and indexes are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        faqCorpus,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        faqCorpusById,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        faqCorpusByTopic,
      ),
      true,
    );

    for (
      const faq
      of faqCorpus
    ) {
      assert.equal(
        Object.isFrozen(
          faq,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          faq.knowledgeIds,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          faq.tags,
        ),
        true,
      );
    }
  },
);


test(
  "FAQ helpers fail safely",
  () => {
    assert.equal(
      getFaqById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getFaqById(null),
      null,
    );

    assert.deepEqual(
      getFaqsByTopic(
        "does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getFaqsByIntent(
        "does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getFaqsByKnowledgeId(
        "does-not-exist",
      ),
      [],
    );
  },
);