import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
  TEMPORAL_STATUS,
} from "../data/knowledge/constants.js";

import {
  experienceKnowledge,
  experienceKnowledgeById,
  getCurrentExperience,
  getExperienceByOrganization,
  getExperienceKnowledgeById,
  getHistoricalExperience,
} from "../data/knowledge/experience.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


function getFact(
  item,
  key,
) {
  return item.facts.find(
    (fact) =>
      fact.key === key,
  );
}


test(
  "experience knowledge catalog is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        experienceKnowledge,
      );

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
  "experience catalog contains twelve professional stages",
  () => {
    assert.equal(
      experienceKnowledge.length,
      12,
    );
  },
);


test(
  "all experience items use EXPERIENCE type",
  () => {
    assert.ok(
      experienceKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.EXPERIENCE,
      ),
    );
  },
);


test(
  "experience catalog and nested structures are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        experienceKnowledge,
      ),
      true,
    );

    for (
      const item of
      experienceKnowledge
    ) {
      assert.equal(
        Object.isFrozen(item),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.facts,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.relationships,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.sources,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          item.answerPolicy,
        ),
        true,
      );
    }
  },
);


test(
  "experienceKnowledgeById indexes every item",
  () => {
    assert.equal(
      Object.keys(
        experienceKnowledgeById,
      ).length,
      experienceKnowledge.length,
    );

    for (
      const item of
      experienceKnowledge
    ) {
      assert.equal(
        experienceKnowledgeById[
          item.id
        ],
        item,
      );
    }
  },
);


test(
  "getExperienceKnowledgeById resolves safely",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-2004",
      );

    assert.ok(item);

    assert.equal(
      item.id,
      "experience-accenture-2004",
    );

    assert.equal(
      getExperienceKnowledgeById(
        "does-not-exist",
      ),
      null,
    );

    assert.equal(
      getExperienceKnowledgeById(
        "",
      ),
      null,
    );

    assert.equal(
      getExperienceKnowledgeById(
        null,
      ),
      null,
    );
  },
);


test(
  "career starts with Accenture in 2004",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-2004",
      );

    assert.ok(item);

    assert.equal(
      getFact(
        item,
        "organization",
      ).value,
      "Accenture",
    );

    assert.equal(
      getFact(
        item,
        "role",
      ).value,
      "Programador COBOL",
    );

    assert.equal(
      item.temporal.validFrom,
      "2004-07-01",
    );
  },
);


test(
  "first Accenture stage contains COBOL testing and quality evidence",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-2004",
      );

    const technologies =
      getFact(
        item,
        "technologies",
      ).value;

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      technologies.includes(
        "cobol",
      ),
    );

    assert.ok(
      capabilities.includes(
        "testing",
      ),
    );

    assert.ok(
      capabilities.includes(
        "quality-assurance",
      ),
    );
  },
);


test(
  "Sinergia stage includes production support",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-sinergia-2005",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "production-support",
      ),
    );
  },
);


test(
  "core banking Accenture stage includes Control-M",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-2005-2011",
      );

    const technologies =
      getFact(
        item,
        "technologies",
      ).value;

    assert.ok(
      technologies.includes(
        "control-m",
      ),
    );
  },
);


test(
  "Frankfurt experience includes COBOL XML and Oracle",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-altran-frankfurt-2011-2012",
      );

    const technologies =
      getFact(
        item,
        "technologies",
      ).value;

    assert.ok(
      technologies.includes(
        "cobol",
      ),
    );

    assert.ok(
      technologies.includes(
        "xml",
      ),
    );

    assert.ok(
      technologies.includes(
        "oracle",
      ),
    );
  },
);


test(
  "everis stage includes distributed teams and knowledge transfer",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-everis-2012-2014",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "distributed-team-collaboration",
      ),
    );

    assert.ok(
      capabilities.includes(
        "knowledge-transfer",
      ),
    );
  },
);


test(
  "Sopra stage includes UAT",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-sopra-2014-2015",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "uat",
      ),
    );
  },
);


test(
  "batch leadership stage includes technical leadership",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-batch-2015-2016",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "technical-leadership",
      ),
    );

    assert.ok(
      capabilities.includes(
        "team-coordination",
      ),
    );
  },
);


test(
  "performance stage includes optimization and bottleneck analysis",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-performance-2016-2017",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "performance-optimization",
      ),
    );

    assert.ok(
      capabilities.includes(
        "bottleneck-analysis",
      ),
    );
  },
);


test(
  "Valores stage contains project management and UAT",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-valores-2017-2018",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "project-management",
      ),
    );

    assert.ok(
      capabilities.includes(
        "uat",
      ),
    );
  },
);


test(
  "Capital Markets stage contains planning estimation and economic tracking",
  () => {
    const item =
      getExperienceKnowledgeById(
        "experience-accenture-capital-markets-2018-2023",
      );

    const capabilities =
      getFact(
        item,
        "capabilities",
      ).value;

    assert.ok(
      capabilities.includes(
        "planning",
      ),
    );

    assert.ok(
      capabilities.includes(
        "estimation",
      ),
    );

    assert.ok(
      capabilities.includes(
        "economic-tracking",
      ),
    );
  },
);


test(
  "Banco Sabadell is the only current professional stage",
  () => {
    const current =
      getCurrentExperience();

    assert.ok(current);

    assert.equal(
      current.id,
      "experience-banco-sabadell-2023-current",
    );

    assert.equal(
      current.temporal.status,
      TEMPORAL_STATUS.CURRENT,
    );

    assert.equal(
      experienceKnowledge.filter(
        (item) =>
          item.temporal.status ===
          TEMPORAL_STATUS.CURRENT,
      ).length,
      1,
    );
  },
);


test(
  "current Banco Sabadell stage contains current data and BI technologies",
  () => {
    const item =
      getCurrentExperience();

    const technologies =
      getFact(
        item,
        "technologies",
      ).value;

    for (
      const technology of [
        "power-bi",
        "oracle",
        "microstrategy",
        "sas",
        "access",
        "vba",
        "vbs",
        "odbc",
      ]
    ) {
      assert.ok(
        technologies.includes(
          technology,
        ),
        `missing technology: ${technology}`,
      );
    }
  },
);


test(
  "current experience keeps recent Power Platform technologies qualified",
  () => {
    const item =
      getCurrentExperience();

    const claims =
      item.limitations.map(
        (limitation) =>
          limitation.claim,
      );

    assert.ok(
      claims.some(
        (claim) =>
          claim.includes(
            "Power Automate",
          ),
      ),
    );

    assert.ok(
      claims.some(
        (claim) =>
          claim.includes(
            "Python",
          ),
      ),
    );
  },
);


test(
  "historical experience excludes current role",
  () => {
    const historical =
      getHistoricalExperience();

    assert.equal(
      historical.length,
      11,
    );

    assert.ok(
      historical.every(
        (item) =>
          item.temporal.status ===
          TEMPORAL_STATUS.HISTORICAL,
      ),
    );
  },
);


test(
  "organization lookup finds all Accenture stages",
  () => {
    const accenture =
      getExperienceByOrganization(
        "Accenture",
      );

    assert.ok(
      accenture.length >= 6,
    );

    assert.ok(
      accenture.every(
        (item) =>
          item.metadata.organization ===
          "Accenture",
      ),
    );
  },
);


test(
  "organization lookup is case insensitive",
  () => {
    const upper =
      getExperienceByOrganization(
        "ACCENTURE",
      );

    const lower =
      getExperienceByOrganization(
        "accenture",
      );

    assert.deepEqual(
      upper,
      lower,
    );
  },
);


test(
  "organization lookup handles invalid values safely",
  () => {
    assert.deepEqual(
      getExperienceByOrganization(
        "",
      ),
      [],
    );

    assert.deepEqual(
      getExperienceByOrganization(
        null,
      ),
      [],
    );
  },
);


test(
  "experience knowledge contains no private overtime facts",
  () => {
    const serialized =
      JSON.stringify(
        experienceKnowledge,
      ).toLowerCase();

    assert.equal(
      serialized.includes(
        "300 overtime",
      ),
      false,
    );

    assert.equal(
      serialized.includes(
        "300 horas",
      ),
      false,
    );

    assert.equal(
      serialized.includes(
        "horas extraordinarias: 300",
      ),
      false,
    );
  },
);


test(
  "all professional stages are answerable but not directly recommendable",
  () => {
    for (
      const item of
      experienceKnowledge
    ) {
      assert.equal(
        item.coverage.level,
        "answerable",
      );

      assert.equal(
        item.coverage
          .canAnswerDirectly,
        true,
      );

      assert.equal(
        item.coverage
          .canRecommend,
        false,
      );
    }
  },
);