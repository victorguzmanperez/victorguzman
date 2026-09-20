import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
  RELATION_TYPE,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
} from "../data/knowledge/validators.js";

import {
  technologyKnowledgeById,
} from "../data/knowledge/technologies.js";

import {
  publicationKnowledge,
  publicationKnowledgeById,
  publicationKnowledgeByTechnologyId,
  getPublicationById,
  getPublicationFact,
  getPublicationsByTechnologyId,
} from "../data/knowledge/publications.js";


function unique(values) {
  return new Set(
    values,
  ).size === values.length;
}


function sorted(values) {
  return [
    ...values,
  ].sort();
}


function relationshipTargets(
  publication,
) {
  return publication.relationships
    .filter(
      (relationship) =>
        relationship.type ===
        RELATION_TYPE.PUBLISHED_ABOUT,
    )
    .map(
      (relationship) =>
        relationship.target,
    );
}


/* ============================================================
 * STRUCTURE
 * ============================================================
 */

test(
  "publication knowledge is structurally valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          publicationKnowledge,
        ),
    );
  },
);


test(
  "publication catalog contains three verified publications",
  () => {
    assert.equal(
      publicationKnowledge.length,
      3,
    );
  },
);


test(
  "all publication records use PUBLICATION type",
  () => {
    for (
      const publication
      of publicationKnowledge
    ) {
      assert.equal(
        publication.type,
        KNOWLEDGE_TYPE.PUBLICATION,
      );
    }
  },
);


test(
  "publication ids are unique",
  () => {
    assert.equal(
      unique(
        publicationKnowledge.map(
          (publication) =>
            publication.id,
        ),
      ),
      true,
    );
  },
);


test(
  "publication index contains every item",
  () => {
    assert.equal(
      Object.keys(
        publicationKnowledgeById,
      ).length,
      publicationKnowledge.length,
    );

    for (
      const publication
      of publicationKnowledge
    ) {
      assert.equal(
        publicationKnowledgeById[
          publication.id
        ],
        publication,
      );
    }
  },
);


/* ============================================================
 * EXISTING KNOWLEDGE DEBT
 * ============================================================
 */

test(
  "Power BI publication referenced by technology knowledge now exists",
  () => {
    assert.ok(
      publicationKnowledgeById[
        "publication-dataverso-power-bi"
      ],
    );
  },
);


/* ============================================================
 * TECHNOLOGY RELATIONSHIPS
 * ============================================================
 */

test(
  "all publication technology targets are canonical technologies",
  () => {
    for (
      const publication
      of publicationKnowledge
    ) {
      for (
        const technologyId
        of relationshipTargets(
          publication,
        )
      ) {
        assert.ok(
          technologyKnowledgeById[
            technologyId
          ],
          `${publication.id} references unknown technology ${technologyId}`,
        );
      }
    }
  },
);


test(
  "technology facts and PUBLISHED_ABOUT relationships stay synchronized",
  () => {
    for (
      const publication
      of publicationKnowledge
    ) {
      const factTechnologyIds =
        getPublicationFact(
          publication,
          "technologies-covered",
        )?.value ?? [];

      assert.deepEqual(
        sorted(
          factTechnologyIds,
        ),
        sorted(
          relationshipTargets(
            publication,
          ),
        ),
        `${publication.id} technology mapping differs`,
      );
    }
  },
);


test(
  "publication technology graph contains seven links",
  () => {
    const links =
      Object.values(
        publicationKnowledgeByTechnologyId,
      ).reduce(
        (
          total,
          publications,
        ) =>
          total +
          publications.length,
        0,
      );

    assert.equal(
      links,
      7,
    );
  },
);


/* ============================================================
 * POWER BI / POWER QUERY / DAX
 * ============================================================
 */

test(
  "Power BI resolves all three current DataVerso publications",
  () => {
    assert.deepEqual(
      sorted(
        getPublicationsByTechnologyId(
          "technology-power-bi",
        ).map(
          (publication) =>
            publication.id,
        ),
      ),
      [
        "publication-dataverso-power-bi",
        "publication-dataverso-power-query-home",
        "publication-dataverso-power-query-intro",
      ],
    );
  },
);


test(
  "Power Query resolves all three current related publications",
  () => {
    assert.deepEqual(
      sorted(
        getPublicationsByTechnologyId(
          "technology-power-query",
        ).map(
          (publication) =>
            publication.id,
        ),
      ),
      [
        "publication-dataverso-power-bi",
        "publication-dataverso-power-query-home",
        "publication-dataverso-power-query-intro",
      ],
    );
  },
);


test(
  "DAX resolves the Power BI guide",
  () => {
    assert.deepEqual(
      getPublicationsByTechnologyId(
        "technology-dax",
      ).map(
        (publication) =>
          publication.id,
      ),
      [
        "publication-dataverso-power-bi",
      ],
    );
  },
);


/* ============================================================
 * DATES / STATUS
 * ============================================================
 */

test(
  "Power BI guide is an ongoing published series",
  () => {
    const publication =
      getPublicationById(
        "publication-dataverso-power-bi",
      );

    assert.equal(
      getPublicationFact(
        publication,
        "publication-status",
      )?.value,
      "published-ongoing",
    );

    assert.equal(
      getPublicationFact(
        publication,
        "published-at",
      )?.value,
      "2026-03-09",
    );
  },
);


test(
  "Power Query articles preserve their publication dates",
  () => {
    assert.equal(
      getPublicationFact(
        getPublicationById(
          "publication-dataverso-power-query-intro",
        ),
        "published-at",
      )?.value,
      "2026-06-21",
    );

    assert.equal(
      getPublicationFact(
        getPublicationById(
          "publication-dataverso-power-query-home",
        ),
        "published-at",
      )?.value,
      "2026-06-28",
    );
  },
);


/* ============================================================
 * ANSWER POLICY
 * ============================================================
 */

test(
  "publications are answerable and navigable but not recommendable services",
  () => {
    for (
      const publication
      of publicationKnowledge
    ) {
      assert.equal(
        publication.coverage
          .canAnswerDirectly,
        true,
      );

      assert.equal(
        publication.coverage
          .canNavigate,
        true,
      );

      assert.equal(
        publication.coverage
          .canRecommend,
        false,
      );

      assert.equal(
        publication.answerPolicy
          .allowInference,
        false,
      );

      assert.equal(
        publication.answerPolicy
          .allowRecommendation,
        false,
      );
    }
  },
);


test(
  "publications cannot automatically imply expertise or service fit",
  () => {
    for (
      const publication
      of publicationKnowledge
    ) {
      assert.ok(
        publication.answerPolicy
          .forbiddenClaims
          .includes(
            "automatic-expertise",
          ),
      );

      assert.ok(
        publication.answerPolicy
          .forbiddenClaims
          .includes(
            "automatic-service-fit",
          ),
      );
    }
  },
);


/* ============================================================
 * SAFE GETTERS
 * ============================================================
 */

test(
  "publication getters handle unknown values safely",
  () => {
    assert.equal(
      getPublicationById(
        "publication-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getPublicationById(null),
      null,
    );

    assert.equal(
      getPublicationFact(
        null,
        "publication-definition",
      ),
      null,
    );

    assert.deepEqual(
      getPublicationsByTechnologyId(
        "technology-does-not-exist",
      ),
      [],
    );
  },
);