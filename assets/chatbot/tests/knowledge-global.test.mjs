import test from "node:test";
import assert from "node:assert/strict";

import {
  CLAIM_STATUS,
  DISCLOSURE,
  KNOWLEDGE_TYPE,
  RELATION_TYPE,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
} from "../data/knowledge/validators.js";

import {
  sourcesById,
} from "../data/sources.js";

import {
  evidenceIndexByKnowledgeId,
} from "../data/knowledge/evidence-index.js";

import {
  COMMERCIAL_CLAIM,
  COMMERCIAL_DECISION,
  assessCommercialClaim,
  servicePassesCommercialSafety,
} from "../data/knowledge/commercial-policy.js";

import {
  knowledgeCatalogsByType,
  knowledgeItems,
  knowledgeById,
  knowledgeByType,
  knowledgeByAlias,
  knowledgeStats,
  normalizeKnowledgeAlias,
  getKnowledgeById,
  getKnowledgeByType,
  getKnowledgeByAlias,
  resolveKnowledgeAlias,
  getKnowledgeFact,
} from "../data/knowledge.js";


/* ============================================================
 * HELPERS
 * ============================================================
 */

function unique(values) {
  return (
    new Set(values).size ===
    values.length
  );
}


function allSourceIdsFromItem(
  item,
) {
  const ids = [
    ...(item.sources ?? []),
  ];

  for (
    const fact
    of item.facts ?? []
  ) {
    ids.push(
      ...(fact.sources ?? []),
    );

    for (
      const evidence
      of fact.evidence ?? []
    ) {
      ids.push(
        ...(
          evidence.sourceIds ??
          []
        ),
      );
    }
  }

  for (
    const relationship
    of item.relationships ?? []
  ) {
    ids.push(
      ...(
        relationship.sources ??
        []
      ),
    );
  }

  return ids;
}


/* ============================================================
 * GLOBAL CATALOG
 * ============================================================
 */

test(
  "global Knowledge catalog is structurally valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          knowledgeItems,
        ),
    );
  },
);

test(
  "global Knowledge catalog contains 133 items",
  () => {
    assert.equal(
      knowledgeItems.length,
      133,
    );

    assert.equal(
      knowledgeStats.total,
      133,
    );
  },
);


test(
  "global Knowledge ids are unique",
  () => {
    assert.equal(
      unique(
        knowledgeItems.map(
          (item) =>
            item.id,
        ),
      ),
      true,
    );
  },
);


test(
  "knowledgeById indexes every global item exactly once",
  () => {
    assert.equal(
      Object.keys(
        knowledgeById,
      ).length,
      knowledgeItems.length,
    );

    for (
      const item
      of knowledgeItems
    ) {
      assert.equal(
        knowledgeById[
          item.id
        ],
        item,
      );
    }
  },
);


/* ============================================================
 * TYPE INDEX
 * ============================================================
 */

test(
  "knowledgeByType contains every canonical Knowledge type",
  () => {
    assert.deepEqual(
      Object.keys(
        knowledgeByType,
      ).sort(),
      Object.values(
        KNOWLEDGE_TYPE,
      ).sort(),
    );
  },
);


test(
  "type partitions contain every item exactly once",
  () => {
    const indexedItems =
      Object.values(
        knowledgeByType,
      ).flat();

    assert.equal(
      indexedItems.length,
      knowledgeItems.length,
    );

    assert.equal(
      new Set(
        indexedItems.map(
          (item) =>
            item.id,
        ),
      ).size,
      knowledgeItems.length,
    );
  },
);


test(
  "every item belongs to its canonical type partition",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      assert.ok(
        knowledgeByType[
          item.type
        ].includes(
          item,
        ),
        `${item.id} missing from ${item.type}`,
      );
    }
  },
);


test(
  "all sixteen Knowledge types are materialized",
  () => {
    assert.equal(
      knowledgeStats
        .materializedTypes
        .length,
      Object.values(
        KNOWLEDGE_TYPE,
      ).length,
    );

    assert.equal(
      knowledgeStats
        .materializedTypes
        .length,
      16,
    );
  },
);


test(
  "no canonical Knowledge type remains empty",
  () => {
    assert.deepEqual(
      knowledgeStats.emptyTypes,
      [],
    );

    for (
      const type
      of Object.values(
        KNOWLEDGE_TYPE,
      )
    ) {
      assert.ok(
        getKnowledgeByType(
          type,
        ).length > 0,
        `${type} has no materialized Knowledge`,
      );
    }
  },
);

test(
  "catalog registry and type index have matching counts",
  () => {
    for (
      const type
      of Object.values(
        KNOWLEDGE_TYPE,
      )
    ) {
      assert.equal(
        knowledgeCatalogsByType[
          type
        ].length,
        knowledgeByType[
          type
        ].length,
        `${type} catalog mismatch`,
      );
    }
  },
);


/* ============================================================
 * SOURCE INTEGRITY
 * ============================================================
 */

test(
  "every Knowledge item source exists in canonical sources",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const sourceId
        of item.sources
      ) {
        assert.ok(
          sourcesById[
            sourceId
          ],
          `${item.id} references unknown source ${sourceId}`,
        );
      }
    }
  },
);


test(
  "every fact source exists in canonical sources",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const fact
        of item.facts
      ) {
        for (
          const sourceId
          of fact.sources ?? []
        ) {
          assert.ok(
            sourcesById[
              sourceId
            ],
            `${fact.id} references unknown source ${sourceId}`,
          );
        }
      }
    }
  },
);


test(
  "every evidence source exists in canonical sources",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const fact
        of item.facts
      ) {
        for (
          const evidence
          of fact.evidence ?? []
        ) {
          for (
            const sourceId
            of evidence.sourceIds ??
            []
          ) {
            assert.ok(
              sourcesById[
                sourceId
              ],
              `${fact.id} evidence references unknown source ${sourceId}`,
            );
          }
        }
      }
    }
  },
);


test(
  "every relationship source exists in canonical sources",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships
      ) {
        for (
          const sourceId
          of relationship.sources ??
          []
        ) {
          assert.ok(
            sourcesById[
              sourceId
            ],
            `${item.id} relationship references unknown source ${sourceId}`,
          );
        }
      }
    }
  },
);


test(
  "no Knowledge item contains an unknown source anywhere",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      const unknown =
        allSourceIdsFromItem(
          item,
        ).filter(
          (sourceId) =>
            !sourcesById[
              sourceId
            ],
        );

      assert.deepEqual(
        unknown,
        [],
        `${item.id} has unknown source references`,
      );
    }
  },
);


/* ============================================================
 * FACT INTEGRITY
 * ============================================================
 */

test(
  "fact ids are globally unique",
  () => {
    const factIds =
      knowledgeItems.flatMap(
        (item) =>
          item.facts.map(
            (fact) =>
              fact.id,
          ),
      );

    assert.equal(
      unique(factIds),
      true,
    );
  },
);

test(
  "derived facts reference existing global facts",
  () => {
    const globalFactIds =
      new Set(
        knowledgeItems.flatMap(
          (item) =>
            item.facts.map(
              (fact) =>
                fact.id,
            ),
        ),
      );

    for (
      const item
      of knowledgeItems
    ) {
      for (
        const fact
        of item.facts
      ) {
        for (
          const parentId
          of fact.derivedFrom ??
          []
        ) {
          assert.ok(
            globalFactIds.has(
              parentId,
            ),
            `${fact.id} derives from unknown global fact ${parentId}`,
          );
        }
      }
    }
  },
);

test(
  "all Knowledge disclosures remain public-safe",
  () => {
    const allowed =
      new Set([
        DISCLOSURE.PUBLIC,
        DISCLOSURE
          .PUBLIC_SUMMARY_ONLY,
      ]);

    for (
      const item
      of knowledgeItems
    ) {
      assert.ok(
        allowed.has(
          item.disclosure,
        ),
        `${item.id} has unsafe disclosure`,
      );

      for (
        const fact
        of item.facts
      ) {
        assert.ok(
          allowed.has(
            fact.disclosure,
          ),
          `${fact.id} has unsafe disclosure`,
        );
      }
    }
  },
);


/* ============================================================
 * RELATIONSHIP TARGET INTEGRITY
 * ============================================================
 */

test(
  "every relationship target resolves to real Knowledge",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships
      ) {
        assert.ok(
          knowledgeById[
            relationship.target
          ],
          `${item.id} → ${relationship.type} → ${relationship.target} is orphaned`,
        );
      }
    }
  },
);

test(
  "global Knowledge graph contains zero unresolved relationship targets",
  () => {
    const unresolved =
      knowledgeItems.flatMap(
        (item) =>
          item.relationships
            .filter(
              (relationship) =>
                !knowledgeById[
                  relationship.target
                ],
            )
            .map(
              (relationship) => ({
                from:
                  item.id,

                type:
                  relationship.type,

                target:
                  relationship.target,
              }),
            ),
      );

    assert.deepEqual(
      unresolved,
      [],
    );
  },
);

test(
  "ADDRESSES relationships always target problems",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.ADDRESSES,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.PROBLEM,
        );
      }
    }
  },
);


test(
  "REQUIRES relationships always target capabilities",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.REQUIRES,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.CAPABILITY,
        );
      }
    }
  },
);


test(
  "USES relationships always target technologies",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.USES,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.TECHNOLOGY,
        );
      }
    }
  },
);


test(
  "IMPLEMENTED_BY relationships always target explicit services",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.IMPLEMENTED_BY,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.SERVICE,
        );
      }
    }
  },
);


test(
  "EXEMPLIFIED_BY relationships always target projects",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.EXEMPLIFIED_BY,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.PROJECT,
        );
      }
    }
  },
);


test(
  "SUPPORTED_BY relationships only target professional evidence Knowledge",
  () => {
    const allowedTypes =
      new Set([
        KNOWLEDGE_TYPE.PROFILE,
        KNOWLEDGE_TYPE.EXPERIENCE,
        KNOWLEDGE_TYPE.TECHNOLOGY,
        KNOWLEDGE_TYPE.CAPABILITY,
        KNOWLEDGE_TYPE.EDUCATION,
        KNOWLEDGE_TYPE.CERTIFICATION,
        KNOWLEDGE_TYPE.PROJECT,
      ]);

    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.SUPPORTED_BY,
        )
      ) {
        const target =
          getKnowledgeById(
            relationship.target,
          );

        assert.ok(
          allowedTypes.has(
            target?.type,
          ),
          `${item.id} SUPPORTED_BY invalid type ${target?.type}`,
        );
      }
    }
  },
);


test(
  "PUBLISHED_ABOUT only links technologies and publications",
  () => {
    const allowedTypes =
      new Set([
        KNOWLEDGE_TYPE.TECHNOLOGY,
        KNOWLEDGE_TYPE.PUBLICATION,
      ]);

    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.PUBLISHED_ABOUT,
        )
      ) {
        const target =
          getKnowledgeById(
            relationship.target,
          );

        assert.ok(
          allowedTypes.has(
            target?.type,
          ),
          `${item.id} PUBLISHED_ABOUT invalid type ${target?.type}`,
        );
      }
    }
  },
);


/* ============================================================
 * ALIAS INDEX
 * ============================================================
 */

test(
  "alias index keys are already normalized",
  () => {
    for (
      const alias
      of Object.keys(
        knowledgeByAlias,
      )
    ) {
      assert.equal(
        alias,
        normalizeKnowledgeAlias(
          alias,
        ),
      );
    }
  },
);


test(
  "alias buckets never duplicate the same Knowledge item",
  () => {
    for (
      const [
        alias,
        items,
      ]
      of Object.entries(
        knowledgeByAlias,
      )
    ) {
      assert.equal(
        unique(
          items.map(
            (item) =>
              item.id,
          ),
        ),
        true,
        `${alias} contains duplicate items`,
      );
    }
  },
);


test(
  "every Knowledge item is discoverable through its canonical id",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      const matches =
        getKnowledgeByAlias(
          item.id,
        );

      assert.ok(
        matches.some(
          (candidate) =>
            candidate.id ===
            item.id,
        ),
        `${item.id} missing from alias index`,
      );
    }
  },
);


test(
  "Power BI remains intentionally ambiguous globally",
  () => {
    const matches =
      getKnowledgeByAlias(
        "Power BI",
      );

    assert.ok(
      matches.some(
        (item) =>
          item.id ===
            "technology-power-bi",
      ),
    );

    assert.ok(
      matches.some(
        (item) =>
          item.id ===
            "service-business-intelligence-dashboards",
      ),
    );

    assert.equal(
      resolveKnowledgeAlias(
        "Power BI",
      ),
      null,
    );
  },
);


test(
  "typed Power BI alias resolves only the technology",
  () => {
    const matches =
      getKnowledgeByAlias(
        "Power BI",
        KNOWLEDGE_TYPE.TECHNOLOGY,
      );

    assert.deepEqual(
      matches.map(
        (item) =>
          item.id,
      ),
      [
        "technology-power-bi",
      ],
    );

    assert.equal(
      resolveKnowledgeAlias(
        "Power BI",
        KNOWLEDGE_TYPE.TECHNOLOGY,
      )?.id,
      "technology-power-bi",
    );
  },
);


test(
  "alias normalization preserves meaningful programming symbols",
  () => {
    assert.equal(
      normalizeKnowledgeAlias(
        "  PÓWER   BI  ",
      ),
      "power bi",
    );

    assert.equal(
      normalizeKnowledgeAlias(
        "C++",
      ),
      "c++",
    );

    assert.equal(
      normalizeKnowledgeAlias(
        "C#",
      ),
      "c#",
    );
  },
);


/* ============================================================
 * SAFE GLOBAL HELPERS
 * ============================================================
 */

test(
  "global helpers fail safely for unknown values",
  () => {
    assert.equal(
      getKnowledgeById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getKnowledgeById(null),
      null,
    );

    assert.deepEqual(
      getKnowledgeByType(
        "does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getKnowledgeByAlias(
        "does-not-exist",
      ),
      [],
    );

    assert.equal(
      resolveKnowledgeAlias(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getKnowledgeFact(
        null,
        "anything",
      ),
      null,
    );
  },
);


test(
  "global fact helper resolves real facts",
  () => {
    const technology =
      getKnowledgeById(
        "technology-power-bi",
      );

    assert.equal(
      getKnowledgeFact(
        technology,
        "professional-current",
      )?.value,
      true,
    );
  },
);


/* ============================================================
 * IMMUTABILITY
 * ============================================================
 */

test(
  "global Knowledge structures are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        knowledgeItems,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        knowledgeById,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        knowledgeByType,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        knowledgeByAlias,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        knowledgeStats,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        knowledgeStats.byType,
      ),
      true,
    );
  },
);


test(
  "all type and alias buckets are frozen",
  () => {
    for (
      const items
      of Object.values(
        knowledgeByType,
      )
    ) {
      assert.equal(
        Object.isFrozen(
          items,
        ),
        true,
      );
    }

    for (
      const items
      of Object.values(
        knowledgeByAlias,
      )
    ) {
      assert.equal(
        Object.isFrozen(
          items,
        ),
        true,
      );
    }
  },
);


/* ============================================================
 * EVIDENCE BOUNDARY
 * ============================================================
 */

test(
  "every evidence index entry resolves to global Knowledge",
  () => {
    for (
      const knowledgeId
      of Object.keys(
        evidenceIndexByKnowledgeId,
      )
    ) {
      assert.ok(
        knowledgeById[
          knowledgeId
        ],
        `${knowledgeId} exists in evidence but not global Knowledge`,
      );
    }
  },
);


test(
  "only professional evidence types enter evidence index",
  () => {
    const allowedTypes =
      new Set([
        KNOWLEDGE_TYPE.PROFILE,
        KNOWLEDGE_TYPE.EXPERIENCE,
        KNOWLEDGE_TYPE.TECHNOLOGY,
        KNOWLEDGE_TYPE.CAPABILITY,
        KNOWLEDGE_TYPE.EDUCATION,
        KNOWLEDGE_TYPE.CERTIFICATION,
        KNOWLEDGE_TYPE.PROJECT,
      ]);

    for (
      const knowledgeId
      of Object.keys(
        evidenceIndexByKnowledgeId,
      )
    ) {
      assert.ok(
        allowedTypes.has(
          knowledgeById[
            knowledgeId
          ].type,
        ),
        `${knowledgeId} should not be professional evidence`,
      );
    }
  },
);


/* ============================================================
 * COMMERCIAL SAFETY — GLOBAL CONTRACT
 * ============================================================
 */

test(
  "every globally indexed Service passes commercial safety",
  () => {
    for (
      const service
      of getKnowledgeByType(
        KNOWLEDGE_TYPE.SERVICE,
      )
    ) {
      assert.equal(
        servicePassesCommercialSafety(
          service,
        ),
        true,
        `${service.id} fails commercial safety`,
      );
    }
  },
);


test(
  "price always redirects every Service to human contact",
  () => {
    for (
      const service
      of getKnowledgeByType(
        KNOWLEDGE_TYPE.SERVICE,
      )
    ) {
      const assessment =
        assessCommercialClaim(
          service.id,
          COMMERCIAL_CLAIM.PRICE,
        );

      assert.equal(
        assessment.allowed,
        false,
      );

      assert.equal(
        assessment.decision,
        COMMERCIAL_DECISION.REDIRECT,
      );

      assert.equal(
        assessment.action,
        "open-contact",
      );
    }
  },
);


/* ============================================================
 * DIAGNOSTIC SAFETY
 * ============================================================
 */

test(
  "diagnostic never prefills consent or submits automatically",
  () => {
    const diagnostic =
      getKnowledgeById(
        "diagnostic-portfolio-initial",
      );

    const prefillable =
      getKnowledgeFact(
        diagnostic,
        "prefillable-fields",
      ).value;

    const neverPrefill =
      getKnowledgeFact(
        diagnostic,
        "never-prefill-fields",
      ).value;

    assert.equal(
      prefillable.includes(
        "acepta_privacidad",
      ),
      false,
    );

    assert.ok(
      neverPrefill.includes(
        "acepta_privacidad",
      ),
    );

    assert.equal(
      getKnowledgeFact(
        diagnostic,
        "automatic-submit",
      ).value,
      false,
    );
  },
);


/* ============================================================
 * BOOKING SAFETY
 * ============================================================
 */

test(
  "booking can only be confirmed by real Calendly scheduled event",
  () => {
    const booking =
      getKnowledgeById(
        "booking-calendly-initial-meeting",
      );

    assert.equal(
      getKnowledgeFact(
        booking,
        "booking-confirmation-event",
      ).value,
      "calendly.event_scheduled",
    );

    assert.equal(
      getKnowledgeFact(
        booking,
        "automatic-booking",
      ).value,
      false,
    );

    assert.equal(
      getKnowledgeFact(
        booking,
        "availability-authority",
      ).value,
      "calendly",
    );
  },
);


/* ============================================================
 * PRIVACY / ANALYTICS
 * ============================================================
 */

test(
  "conversation policy keeps transcripts local and temporary",
  () => {
    const policy =
      getKnowledgeById(
        "policy-chatbot-session-data",
      );

    assert.equal(
      getKnowledgeFact(
        policy,
        "conversation-storage",
      ).value,
      "sessionStorage",
    );

    assert.equal(
      getKnowledgeFact(
        policy,
        "conversation-ttl-hours",
      ).value,
      8,
    );

    assert.equal(
      getKnowledgeFact(
        policy,
        "automatic-central-transcript-storage",
      ).value,
      false,
    );
  },
);


test(
  "Analytics policy forbids PII and conversation text",
  () => {
    const policy =
      getKnowledgeById(
        "policy-chatbot-analytics-privacy",
      );

    const forbidden =
      getKnowledgeFact(
        policy,
        "analytics-forbidden-data",
      ).value;

    for (
      const key
      of [
        "name",
        "email",
        "phone",
        "conversation",
        "raw-message",
        "free-text",
        "diagnostic-summary",
      ]
    ) {
      assert.ok(
        forbidden.includes(
          key,
        ),
        `${key} is not protected from Analytics`,
      );
    }
  },
);


test(
  "exact question feedback remains optional and consented",
  () => {
    const policy =
      getKnowledgeById(
        "policy-chatbot-improvement-feedback",
      );

    assert.equal(
      getKnowledgeFact(
        policy,
        "automatic-transcript-collection",
      ).value,
      false,
    );

    assert.equal(
      getKnowledgeFact(
        policy,
        "exact-question-feedback",
      ).value,
      "optional-explicit-user-consent",
    );

    assert.equal(
      getKnowledgeFact(
        policy,
        "feedback-user-review",
      ).value,
      true,
    );
  },
);

test(
  "WORKED_IN relationships always target Business Areas",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.WORKED_IN,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.BUSINESS_AREA,
          `${item.id} WORKED_IN must target BUSINESS_AREA`,
        );
      }
    }
  },
);

test(
  "DEMONSTRATES relationships always target canonical capabilities",
  () => {
    for (
      const item
      of knowledgeItems
    ) {
      for (
        const relationship
        of item.relationships.filter(
          (candidate) =>
            candidate.type ===
              RELATION_TYPE.DEMONSTRATES,
        )
      ) {
        assert.equal(
          getKnowledgeById(
            relationship.target,
          )?.type,
          KNOWLEDGE_TYPE.CAPABILITY,
          `${item.id} DEMONSTRATES must target CAPABILITY`,
        );
      }
    }
  },
);
test(
  "planned operational facts are backed by confirmed chatbot design",
  () => {
    const operationalTypes =
      new Set([
        KNOWLEDGE_TYPE.DIAGNOSTIC,
        KNOWLEDGE_TYPE.CONTACT,
        KNOWLEDGE_TYPE.BOOKING,
        KNOWLEDGE_TYPE.POLICY,
      ]);

    const designSource =
      "source-user-confirmed-chatbot-design";

    for (
      const item
      of knowledgeItems.filter(
        (candidate) =>
          operationalTypes.has(
            candidate.type,
          ),
      )
    ) {
      for (
        const fact
        of item.facts.filter(
          (candidate) =>
            candidate.status ===
               CLAIM_STATUS.PLANNED,
        )
      ) {
        assert.ok(
          fact.sources.includes(
            designSource,
          ),
          `${fact.id} is PLANNED but is not backed by ${designSource}`,
        );
      }
    }
  },
);