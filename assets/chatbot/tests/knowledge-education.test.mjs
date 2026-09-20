import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  educationKnowledge,
  educationKnowledgeById,
  getEducationById,
  getEducationByTopic,
} from "../data/knowledge/education.js";

import {
  validateKnowledgeItems,
} from "../data/knowledge/validators.js";


test(
  "education knowledge is structurally valid",
  () => {
    const result =
      validateKnowledgeItems(
        educationKnowledge,
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
  },
);


test(
  "education catalog contains thirteen records",
  () => {
    assert.equal(
      educationKnowledge.length,
      13,
    );
  },
);


test(
  "all education items use EDUCATION type",
  () => {
    assert.ok(
      educationKnowledge.every(
        (item) =>
          item.type ===
          KNOWLEDGE_TYPE.EDUCATION,
      ),
    );
  },
);


test(
  "education index covers all items",
  () => {
    assert.equal(
      Object.keys(
        educationKnowledgeById,
      ).length,
      educationKnowledge.length,
    );
  },
);


test(
  "initial formal education includes C C++ Delphi and Paradox",
  () => {
    const item =
      getEducationById(
        "education-dai-2001-2003",
      );

    const topics =
      item.facts.find(
        (fact) =>
          fact.key === "topics",
      ).value;

    for (
      const topic of [
        "c",
        "cpp",
        "delphi",
        "paradox",
      ]
    ) {
      assert.ok(
        topics.includes(topic),
      );
    }
  },
);


test(
  "AI and Big Data specialization stores confirmed grade 9.60",
  () => {
    const item =
      getEducationById(
        "education-ai-big-data-2021-2022",
      );

    const grade =
      item.facts.find(
        (fact) =>
          fact.key === "grade",
      );

    assert.equal(
      grade.value,
      "9.60",
    );
  },
);


test(
  "Data Scientist training stores grade 9.5",
  () => {
    const item =
      getEducationById(
        "education-data-scientist-2022",
      );

    assert.equal(
      item.facts.find(
        (fact) =>
          fact.key === "grade",
      ).value,
      "9.5",
    );
  },
);


test(
  "PL-300 education record exists independently from certification status",
  () => {
    const item =
      getEducationById(
        "education-pl300-2024",
      );

    assert.ok(item);

    assert.ok(
      item.facts.find(
        (fact) =>
          fact.key === "topics",
      ).value.includes(
        "pl-300",
      ),
    );
  },
);


test(
  "SQL training contains stored procedures views triggers and transactions",
  () => {
    const topics =
      getEducationById(
        "education-sql-2024",
      )
        .facts.find(
          (fact) =>
            fact.key === "topics",
        )
        .value;

    for (
      const topic of [
        "stored-procedures",
        "views",
        "triggers",
        "transactions",
      ]
    ) {
      assert.ok(
        topics.includes(topic),
      );
    }
  },
);


test(
  "Power BI topic lookup returns several education records",
  () => {
    const result =
      getEducationByTopic(
        "power-bi",
      );

    assert.ok(
      result.length >= 3,
    );
  },
);


test(
  "Python topic lookup includes Python and AI Big Data training",
  () => {
    const ids =
      getEducationByTopic(
        "python",
      ).map(
        (item) => item.id,
      );

    assert.ok(
      ids.includes(
        "education-python-2024",
      ),
    );

    assert.ok(
      ids.includes(
        "education-ai-big-data-2021-2022",
      ),
    );
  },
);


test(
  "education getter handles invalid ids safely",
  () => {
    assert.equal(
      getEducationById(
        "not-found",
      ),
      null,
    );

    assert.equal(
      getEducationById(null),
      null,
    );
  },
);