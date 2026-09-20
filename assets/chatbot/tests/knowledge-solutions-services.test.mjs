import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
  RELATION_TYPE,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
} from "../data/knowledge/validators.js";

import {
  problemKnowledge,
  problemKnowledgeById,
} from "../data/knowledge/problems.js";

import {
  capabilityKnowledgeById,
} from "../data/knowledge/capabilities.js";

import {
  technologyKnowledgeById,
} from "../data/knowledge/technologies.js";

import {
  solutionKnowledge,
  solutionKnowledgeById,
  solutionKnowledgeByProblemId,
  solutionKnowledgeByCapabilityId,
  solutionKnowledgeByTechnologyId,
  solutionKnowledgeByServiceId,
  getSolutionsByProblemId,
  getSolutionsByCapabilityId,
  getSolutionsByTechnologyId,
  getSolutionsByServiceId,
} from "../data/knowledge/solutions.js";

import {
  serviceKnowledge,
  serviceKnowledgeById,
  getServiceById,
  getServiceFact,
  getServicesBySolutionId,
  getServicesByCapabilityId,
  getServicesByTechnologyId,
} from "../data/knowledge/services.js";

import {
  evidenceIndexByKnowledgeId,
} from "../data/knowledge/evidence-index.js";

import {
  COMMERCIAL_CLAIM,
  COMMERCIAL_DECISION,
  PROHIBITED_COMMERCIAL_FACT_KEYS,
  assessCommercialClaim,
  findUnsafeCommercialFacts,
  servicePassesCommercialSafety,
} from "../data/knowledge/commercial-policy.js";


/* ============================================================
 * HELPERS
 * ============================================================
 */

function unique(values) {
  return new Set(values).size ===
    values.length;
}


function relationTargets(
  item,
  relationType,
) {
  return item.relationships
    .filter(
      (relationship) =>
        relationship.type ===
          relationType,
    )
    .map(
      (relationship) =>
        relationship.target,
    );
}


function factValues(
  item,
  key,
) {
  return (
    item.facts.find(
      (fact) =>
        fact.key === key,
    )?.value ?? []
  );
}


function sorted(values) {
  return [
    ...values,
  ].sort();
}


/* ============================================================
 * SOLUTION STRUCTURE
 * ============================================================
 */

test(
  "solution knowledge is structurally valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          solutionKnowledge,
        ),
    );
  },
);


test(
  "solution catalog contains eight solutions",
  () => {
    assert.equal(
      solutionKnowledge.length,
      8,
    );
  },
);


test(
  "all solution records use SOLUTION type",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      assert.equal(
        solution.type,
        KNOWLEDGE_TYPE.SOLUTION,
      );
    }
  },
);


test(
  "solution ids are unique",
  () => {
    assert.equal(
      unique(
        solutionKnowledge.map(
          (solution) =>
            solution.id,
        ),
      ),
      true,
    );
  },
);


test(
  "solution index contains every solution",
  () => {
    assert.equal(
      Object.keys(
        solutionKnowledgeById,
      ).length,
      solutionKnowledge.length,
    );

    for (
      const solution
      of solutionKnowledge
    ) {
      assert.equal(
        solutionKnowledgeById[
          solution.id
        ],
        solution,
      );
    }
  },
);


/* ============================================================
 * PROBLEM → SOLUTION
 * ============================================================
 */

test(
  "every problem resolves at least one solution",
  () => {
    for (
      const problem
      of problemKnowledge
    ) {
      assert.ok(
        getSolutionsByProblemId(
          problem.id,
        ).length > 0,
        `${problem.id} has no solution`,
      );
    }
  },
);


test(
  "all ADDRESSES targets are canonical problems",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      for (
        const problemId
        of relationTargets(
          solution,
          RELATION_TYPE.ADDRESSES,
        )
      ) {
        assert.ok(
          problemKnowledgeById[
            problemId
          ],
          `${solution.id} references unknown problem ${problemId}`,
        );
      }
    }
  },
);


test(
  "problem facts and ADDRESSES relationships stay synchronized",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      assert.deepEqual(
        sorted(
          factValues(
            solution,
            "problems-addressed",
          ),
        ),
        sorted(
          relationTargets(
            solution,
            RELATION_TYPE.ADDRESSES,
          ),
        ),
        `${solution.id} problem facts and relationships differ`,
      );
    }
  },
);


test(
  "problem inverse index contains eighteen links",
  () => {
    const links =
      Object.values(
        solutionKnowledgeByProblemId,
      ).reduce(
        (
          total,
          solutions,
        ) =>
          total +
          solutions.length,
        0,
      );

    assert.equal(
      links,
      18,
    );
  },
);


/* ============================================================
 * SOLUTION → CAPABILITY
 * ============================================================
 */

test(
  "all REQUIRES targets are canonical capabilities",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      for (
        const capabilityId
        of relationTargets(
          solution,
          RELATION_TYPE.REQUIRES,
        )
      ) {
        assert.ok(
          capabilityKnowledgeById[
            capabilityId
          ],
          `${solution.id} references unknown capability ${capabilityId}`,
        );
      }
    }
  },
);


test(
  "capability facts and REQUIRES relationships stay synchronized",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      assert.deepEqual(
        sorted(
          factValues(
            solution,
            "capabilities-required",
          ),
        ),
        sorted(
          relationTargets(
            solution,
            RELATION_TYPE.REQUIRES,
          ),
        ),
        `${solution.id} capability facts and relationships differ`,
      );
    }
  },
);


test(
  "capability inverse index contains thirty five links",
  () => {
    const links =
      Object.values(
        solutionKnowledgeByCapabilityId,
      ).reduce(
        (
          total,
          solutions,
        ) =>
          total +
          solutions.length,
        0,
      );

    assert.equal(
      links,
      35,
    );
  },
);


/* ============================================================
 * SOLUTION → TECHNOLOGY
 * ============================================================
 */

test(
  "all USES targets are canonical technologies",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      for (
        const technologyId
        of relationTargets(
          solution,
          RELATION_TYPE.USES,
        )
      ) {
        assert.ok(
          technologyKnowledgeById[
            technologyId
          ],
          `${solution.id} references unknown technology ${technologyId}`,
        );
      }
    }
  },
);


test(
  "technology facts and USES relationships stay synchronized",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      assert.deepEqual(
        sorted(
          factValues(
            solution,
            "technologies",
          ),
        ),
        sorted(
          relationTargets(
            solution,
            RELATION_TYPE.USES,
          ),
        ),
        `${solution.id} technology facts and relationships differ`,
      );
    }
  },
);


test(
  "technology inverse index contains twenty six links",
  () => {
    const links =
      Object.values(
        solutionKnowledgeByTechnologyId,
      ).reduce(
        (
          total,
          solutions,
        ) =>
          total +
          solutions.length,
        0,
      );

    assert.equal(
      links,
      26,
    );
  },
);


/* ============================================================
 * SERVICE STRUCTURE
 * ============================================================
 */

test(
  "service knowledge is structurally valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          serviceKnowledge,
        ),
    );
  },
);


test(
  "service catalog contains four explicit services",
  () => {
    assert.equal(
      serviceKnowledge.length,
      4,
    );
  },
);


test(
  "all service records use SERVICE type",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.equal(
        service.type,
        KNOWLEDGE_TYPE.SERVICE,
      );
    }
  },
);


test(
  "service ids are unique",
  () => {
    assert.equal(
      unique(
        serviceKnowledge.map(
          (service) =>
            service.id,
        ),
      ),
      true,
    );
  },
);


test(
  "service index contains every explicit service",
  () => {
    assert.equal(
      Object.keys(
        serviceKnowledgeById,
      ).length,
      serviceKnowledge.length,
    );

    for (
      const service
      of serviceKnowledge
    ) {
      assert.equal(
        serviceKnowledgeById[
          service.id
        ],
        service,
      );
    }
  },
);


/* ============================================================
 * SOLUTION → SERVICE
 * ============================================================
 */

test(
  "all IMPLEMENTED_BY targets are explicit services",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      for (
        const serviceId
        of relationTargets(
          solution,
          RELATION_TYPE.IMPLEMENTED_BY,
        )
      ) {
        assert.ok(
          serviceKnowledgeById[
            serviceId
          ],
          `${solution.id} references unknown service ${serviceId}`,
        );
      }
    }
  },
);


test(
  "solution and service mappings are bidirectionally consistent",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      const expectedSolutionIds =
        sorted(
          factValues(
            service,
            "solutions-supported",
          ),
        );

      const graphSolutionIds =
        sorted(
          getSolutionsByServiceId(
            service.id,
          ).map(
            (solution) =>
              solution.id,
          ),
        );

      assert.deepEqual(
        graphSolutionIds,
        expectedSolutionIds,
        `${service.id} solution mapping differs`,
      );
    }
  },
);


test(
  "there are eight Solution to Service relationships",
  () => {
    const links =
      solutionKnowledge.reduce(
        (
          total,
          solution,
        ) =>
          total +
          relationTargets(
            solution,
            RELATION_TYPE.IMPLEMENTED_BY,
          ).length,
        0,
      );

    assert.equal(
      links,
      8,
    );
  },
);


test(
  "web audit and financial analysis remain solution-only",
  () => {
    assert.deepEqual(
      getSolutionsByServiceId(
        "service-does-not-exist",
      ),
      [],
    );

    const solutionOnly =
      solutionKnowledge
        .filter(
          (solution) =>
            relationTargets(
              solution,
              RELATION_TYPE.IMPLEMENTED_BY,
            ).length === 0,
        )
        .map(
          (solution) =>
            solution.id,
        )
        .sort();

    assert.deepEqual(
      solutionOnly,
      [
        "solution-financial-analysis-monitoring",
        "solution-web-audit-scoring-automation",
      ],
    );
  },
);


/* ============================================================
 * SERVICE → EVIDENCE
 * ============================================================
 */

test(
  "service evidence relationships point to real evidence knowledge",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      const evidenceRelations =
        service.relationships.filter(
          (relationship) =>
            relationship.type ===
              RELATION_TYPE.SUPPORTED_BY ||
            relationship.type ===
              RELATION_TYPE.EXEMPLIFIED_BY,
        );

      for (
        const relationship
        of evidenceRelations
      ) {
        assert.ok(
          evidenceIndexByKnowledgeId[
            relationship.target
          ],
          `${service.id} references unknown evidence ${relationship.target}`,
        );
      }
    }
  },
);


test(
  "all explicit services have supporting evidence",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.ok(
        relationTargets(
          service,
          RELATION_TYPE.SUPPORTED_BY,
        ).length > 0,
        `${service.id} has no supporting evidence`,
      );
    }
  },
);


test(
  "all explicit services have at least one project example",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.ok(
        relationTargets(
          service,
          RELATION_TYPE.EXEMPLIFIED_BY,
        ).length > 0,
        `${service.id} has no project example`,
      );
    }
  },
);


test(
  "service evidence graph contains ten links",
  () => {
    const links =
      serviceKnowledge.reduce(
        (
          total,
          service,
        ) =>
          total +
          service.relationships.filter(
            (relationship) =>
              relationship.type ===
                RELATION_TYPE.SUPPORTED_BY ||
              relationship.type ===
                RELATION_TYPE.EXEMPLIFIED_BY,
          ).length,
        0,
      );

    assert.equal(
      links,
      10,
    );
  },
);


/* ============================================================
 * SOLUTION / SERVICE ARE NOT EVIDENCE
 * ============================================================
 */

test(
  "solutions do not enter evidence index",
  () => {
    for (
      const solution
      of solutionKnowledge
    ) {
      assert.equal(
        evidenceIndexByKnowledgeId[
          solution.id
        ],
        undefined,
      );
    }
  },
);


test(
  "services do not enter evidence index",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.equal(
        evidenceIndexByKnowledgeId[
          service.id
        ],
        undefined,
      );
    }
  },
);


/* ============================================================
 * QUERY HELPERS
 * ============================================================
 */

test(
  "solution inverse getters handle unknown ids safely",
  () => {
    assert.deepEqual(
      getSolutionsByProblemId(
        "problem-does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getSolutionsByCapabilityId(
        "capability-does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getSolutionsByTechnologyId(
        "technology-does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getSolutionsByServiceId(
        "service-does-not-exist",
      ),
      [],
    );
  },
);


test(
  "service getters handle unknown ids safely",
  () => {
    assert.equal(
      getServiceById(
        "service-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getServiceById(null),
      null,
    );

    assert.equal(
      getServiceFact(
        null,
        "service-definition",
      ),
      null,
    );

    assert.deepEqual(
      getServicesBySolutionId(
        "solution-does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getServicesByCapabilityId(
        "capability-does-not-exist",
      ),
      [],
    );

    assert.deepEqual(
      getServicesByTechnologyId(
        "technology-does-not-exist",
      ),
      [],
    );
  },
);


/* ============================================================
 * COMMERCIAL SAFETY
 * ============================================================
 */

test(
  "every service passes commercial safety policy",
  () => {
    for (
      const service
      of serviceKnowledge
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
  "services contain no price budget quote rate cost or timing facts",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.deepEqual(
        findUnsafeCommercialFacts(
          service,
        ),
        [],
        `${service.id} contains unsafe commercial facts`,
      );
    }
  },
);


test(
  "all prohibited commercial fact keys remain protected",
  () => {
    const mandatoryKeys = [
      "price",
      "pricing",
      "price-range",
      "fixed-price",
      "rate",
      "hourly-rate",
      "tariff",
      "cost",
      "estimated-cost",
      "quote",
      "quotation",
      "budget",
      "estimate",
    ];

    for (
      const key
      of mandatoryKeys
    ) {
      assert.ok(
        PROHIBITED_COMMERCIAL_FACT_KEYS
          .includes(key),
        `${key} is not protected`,
      );
    }
  },
);


/* ============================================================
 * PRICE CONTRACT — NEVER ANSWER PRICE
 * ============================================================
 */

test(
  "price is never automatically disclosed for any service",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      const assessment =
        assessCommercialClaim(
          service.id,
          COMMERCIAL_CLAIM.PRICE,
        );

      assert.equal(
        assessment.allowed,
        false,
        `${service.id} unexpectedly allows price disclosure`,
      );

      assert.equal(
        assessment.decision,
        COMMERCIAL_DECISION.REDIRECT,
        `${service.id} does not redirect price`,
      );

      assert.equal(
        assessment.action,
        "open-contact",
        `${service.id} price does not redirect to contact`,
      );
    }
  },
);


test(
  "price policy also blocks unknown services",
  () => {
    const assessment =
      assessCommercialClaim(
        "service-does-not-exist",
        COMMERCIAL_CLAIM.PRICE,
      );

    assert.equal(
      assessment.allowed,
      false,
    );

    assert.equal(
      assessment.decision,
      COMMERCIAL_DECISION.BLOCK,
    );
  },
);


test(
  "every service explicitly forbids automatic price",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.ok(
        service.answerPolicy
          .forbiddenClaims
          .includes(
            "automatic-price",
          ),
        `${service.id} does not forbid automatic-price`,
      );
    }
  },
);


test(
  "every service contains a commercial limitation",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.ok(
        service.limitations.some(
          (limitation) =>
            limitation.type ===
              LIMITATION_TYPE.COMMERCIAL,
        ),
        `${service.id} has no commercial limitation`,
      );
    }
  },
);


test(
  "service recommendation never implies automatic fit",
  () => {
    for (
      const service
      of serviceKnowledge
    ) {
      assert.equal(
        service.answerPolicy
          .allowInference,
        false,
      );

      assert.ok(
        service.answerPolicy
          .forbiddenClaims
          .includes(
            "automatic-service-fit",
          ),
      );
    }
  },
);