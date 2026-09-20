import test from "node:test";
import assert from "node:assert/strict";

import {
  SOURCE_AUTHORITY,
  SOURCE_TYPE,
  SOURCE_VISIBILITY,
  getSourceById,
  getSourcesByTopic,
  getSourcesByType,
  normalizeSourceTopic,
  sources,
  sourcesById,
} from "../data/sources.js";

import {
  assertValidSources,
  validateSource,
  validateSources,
} from "../data/knowledge/validators.js";

function cloneSource(
  source = sources[0],
) {
  return {
    ...source,
    topics: [...source.topics],
  };
}

test(
  "knowledge source catalog is valid",
  () => {
    const result =
      validateSources(sources);

    assert.equal(
      result.valid,
      true,
      JSON.stringify(
        result.errors,
        null,
        2,
      ),
    );

    assert.deepEqual(
      result.errors,
      [],
    );
  },
);

test(
  "knowledge source ids are unique",
  () => {
    const ids =
      sources.map(
        (source) => source.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);

test(
  "source catalog and nested topic arrays are frozen",
  () => {
    assert.equal(
      Object.isFrozen(sources),
      true,
    );

    for (const source of sources) {
      assert.equal(
        Object.isFrozen(source),
        true,
      );

      assert.equal(
        Object.isFrozen(source.topics),
        true,
      );
    }
  },
);

test(
  "sourcesById contains every source",
  () => {
    assert.equal(
      Object.keys(sourcesById).length,
      sources.length,
    );

    for (const source of sources) {
      assert.equal(
        sourcesById[source.id],
        source,
      );
    }
  },
);

test(
  "getSourceById resolves known ids safely",
  () => {
    const expected =
      sources[0];

    assert.equal(
      getSourceById(expected.id),
      expected,
    );

    assert.equal(
      getSourceById(
        "source-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getSourceById(""),
      null,
    );

    assert.equal(
      getSourceById(null),
      null,
    );
  },
);

test(
  "getSourcesByType returns only matching sources",
  () => {
    const portfolioSources =
      getSourcesByType(
        SOURCE_TYPE.PORTFOLIO,
      );

    assert.ok(
      portfolioSources.length > 0,
    );

    assert.ok(
      portfolioSources.every(
        (source) =>
          source.type ===
          SOURCE_TYPE.PORTFOLIO,
      ),
    );
  },
);

test(
  "AI and Spanish IA normalize to the same canonical topic",
  () => {
    assert.equal(
      normalizeSourceTopic("ai"),
      "ai",
    );

    assert.equal(
      normalizeSourceTopic("AI"),
      "ai",
    );

    assert.equal(
      normalizeSourceTopic("ia"),
      "ai",
    );

    assert.equal(
      normalizeSourceTopic("IA"),
      "ai",
    );

    assert.equal(
      normalizeSourceTopic(
        "Inteligencia Artificial",
      ),
      "ai",
    );

    assert.equal(
      normalizeSourceTopic(
        "Artificial Intelligence",
      ),
      "ai",
    );
  },
);

test(
  "AI and IA source lookups return the same sources",
  () => {
    const aiSources =
      getSourcesByTopic("ai");

    const iaSources =
      getSourcesByTopic("ia");

    const fullSpanishSources =
      getSourcesByTopic(
        "inteligencia artificial",
      );

    assert.ok(aiSources.length > 0);

    assert.deepEqual(
      iaSources,
      aiSources,
    );

    assert.deepEqual(
      fullSpanishSources,
      aiSources,
    );
  },
);

test(
  "Power BI aliases normalize to one canonical topic",
  () => {
    assert.equal(
      normalizeSourceTopic("Power BI"),
      "power-bi",
    );

    assert.equal(
      normalizeSourceTopic("PowerBI"),
      "power-bi",
    );

    assert.equal(
      normalizeSourceTopic("PBI"),
      "power-bi",
    );
  },
);

test(
  "public web source types have HTTPS URLs",
  () => {
    const webTypes =
      new Set([
        SOURCE_TYPE.PORTFOLIO,
        SOURCE_TYPE.LINKEDIN,
        SOURCE_TYPE.SUBSTACK,
      ]);

    for (const source of sources) {
      if (!webTypes.has(source.type)) {
        continue;
      }

      assert.equal(
        typeof source.url,
        "string",
      );

      assert.match(
        source.url,
        /^https:\/\//,
      );
    }
  },
);

test(
  "user-confirmed sources may intentionally have no URL",
  () => {
    const confirmed =
      getSourcesByType(
        SOURCE_TYPE.USER_CONFIRMED,
      );

    assert.ok(
      confirmed.length > 0,
    );

    assert.ok(
      confirmed.some(
        (source) =>
          source.url === null,
      ),
    );
  },
);

test(
  "required canonical knowledge sources exist",
  () => {
    const requiredIds = [
      "source-portfolio-home",
      "source-project-business-cost-intelligence",
      "source-project-auditoria-digital",
      "source-project-investment-dashboard",
      "source-project-digital-competency-evaluation",
      "source-linkedin-victor",
      "source-dataverso-home",
    ];

    for (const sourceId of requiredIds) {
      assert.ok(
        getSourceById(sourceId),
        `missing required source: ${sourceId}`,
      );
    }
  },
);

test(
  "PL-300 preparation status has a dedicated user-confirmed source",
  () => {
    const source =
      getSourceById(
        "source-user-confirmed-pl300-status",
      );

    assert.ok(source);

    assert.equal(
      source.type,
      SOURCE_TYPE.USER_CONFIRMED,
    );

    assert.equal(
      source.authority,
      SOURCE_AUTHORITY.USER_CONFIRMED,
    );

    assert.ok(
      source.topics.includes(
        "pl-300",
      ),
    );
  },
);

test(
  "invalid source type is rejected",
  () => {
    const source =
      cloneSource();

    source.type =
      "made-up-source-type";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".type",
          ),
      ),
    );
  },
);

test(
  "invalid source authority is rejected",
  () => {
    const source =
      cloneSource();

    source.authority =
      "super-authoritative";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".authority",
          ),
      ),
    );
  },
);

test(
  "private context visibility cannot enter public knowledge sources",
  () => {
    const source =
      cloneSource();

    source.visibility =
      "private_context";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".visibility",
          ),
      ),
    );

    assert.equal(
      Object.values(
        SOURCE_VISIBILITY,
      ).includes(
        "private_context",
      ),
      false,
    );
  },
);

test(
  "duplicate source topics are rejected",
  () => {
    const source =
      cloneSource();

    source.topics = [
      "ai",
      "ai",
    ];

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message.includes(
            "duplicate topic",
          ),
      ),
    );
  },
);

test(
  "non-canonical source topics are rejected",
  () => {
    const source =
      cloneSource();

    source.topics = [
      "Power BI",
    ];

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.includes(
            ".topics[",
          ),
      ),
    );
  },
);

test(
  "invalid verification dates are rejected",
  () => {
    const source =
      cloneSource();

    source.lastVerifiedAt =
      "2026-02-31";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".lastVerifiedAt",
          ),
      ),
    );
  },
);

test(
  "invalid web URLs are rejected",
  () => {
    const source =
      cloneSource();

    source.type =
      SOURCE_TYPE.PORTFOLIO;

    source.url =
      "javascript:alert(1)";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".url",
          ),
      ),
    );
  },
);

test(
  "duplicate source ids are rejected at catalog level",
  () => {
    const first =
      cloneSource();

    const second =
      cloneSource();

    const result =
      validateSources([
        first,
        second,
      ]);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message.includes(
            "duplicate source id",
          ),
      ),
    );
  },
);

test(
  "assertValidSources throws for an invalid catalog",
  () => {
    const source =
      cloneSource();

    source.type =
      "invalid";

    assert.throws(
      () =>
        assertValidSources([
          source,
        ]),
      /Invalid knowledge sources/,
    );
  },
);

test(
  "missing source title is rejected",
  () => {
    const source =
      cloneSource();

    source.title = "";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.path.endsWith(
            ".title",
          ),
      ),
    );
  },
);

test(
  "unknown source fields are rejected",
  () => {
    const source =
      cloneSource();

    source.secretInternalNote =
      "should never be here";

    const result =
      validateSource(source);

    assert.equal(
      result.valid,
      false,
    );

    assert.ok(
      result.errors.some(
        (error) =>
          error.message ===
          "unknown source field",
      ),
    );
  },
);