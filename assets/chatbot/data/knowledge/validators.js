import {
  SOURCE_AUTHORITY,
  SOURCE_TYPE,
  SOURCE_VISIBILITY,
} from "../sources.js";

import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  DISCLOSURE,
  EVIDENCE_STRENGTH,
  FACT_VALUE_TYPE,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
  RELATION_TYPE,
  TEMPORAL_STATUS,
} from "./constants.js";


/* ============================================================
 * SOURCE VALIDATION
 * ============================================================
 */

const SOURCE_ALLOWED_FIELDS =
  Object.freeze([
    "id",
    "type",
    "title",
    "url",
    "authority",
    "visibility",
    "owner",
    "verified",
    "lastVerifiedAt",
    "topics",
  ]);

const SOURCE_TYPES_REQUIRING_URL =
  Object.freeze([
    SOURCE_TYPE.PORTFOLIO,
    SOURCE_TYPE.LINKEDIN,
    SOURCE_TYPE.SUBSTACK,
  ]);


/* ============================================================
 * KNOWLEDGE ITEM VALIDATION
 * ============================================================
 */

const KNOWLEDGE_ITEM_ALLOWED_FIELDS =
  Object.freeze([
    "id",
    "type",
    "status",
    "title",
    "shortDescription",
    "aliases",
    "facts",
    "relationships",
    "sources",
    "disclosure",
    "temporal",
    "coverage",
    "answerPolicy",
    "limitations",
    "metadata",
  ]);

const FACT_ALLOWED_FIELDS =
  Object.freeze([
    "id",
    "key",
    "value",
    "valueType",
    "status",
    "evidence",
    "sources",
    "disclosure",
    "temporal",
    "derivedFrom",
  ]);

const EVIDENCE_ALLOWED_FIELDS =
  Object.freeze([
    "strength",
    "type",
    "sourceIds",
    "note",
  ]);

const RELATIONSHIP_ALLOWED_FIELDS =
  Object.freeze([
    "type",
    "target",
    "strength",
    "sources",
  ]);

const TEMPORAL_ALLOWED_FIELDS =
  Object.freeze([
    "status",
    "validFrom",
    "validTo",
  ]);

const COVERAGE_ALLOWED_FIELDS =
  Object.freeze([
    "level",
    "canAnswerDirectly",
    "canRecommend",
    "canProvideEvidence",
    "canNavigate",
  ]);

const ANSWER_POLICY_ALLOWED_FIELDS =
  Object.freeze([
    "directAnswer",
    "mentionEvidence",
    "maxEvidenceItems",
    "allowInference",
    "allowRecommendation",
    "preferredDepth",
    "forbiddenClaims",
  ]);

const LIMITATION_ALLOWED_FIELDS =
  Object.freeze([
    "type",
    "claim",
  ]);


/* ============================================================
 * GENERIC HELPERS
 * ============================================================
 */

function enumValues(enumObject) {
  return Object.values(enumObject);
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isCanonicalIdentifier(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      value,
    )
  );
}

function isValidHttpsUrl(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidDateOnly(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }

    seen.add(value);
  }

  return [...duplicates];
}

function makeError(path, message) {
  return Object.freeze({
    path,
    message,
  });
}

function hasOnlyAllowedFields(
  object,
  allowedFields,
) {
  if (!isPlainObject(object)) {
    return [];
  }

  return Object.keys(object).filter(
    (key) =>
      !allowedFields.includes(key),
  );
}

function isArrayOfCanonicalIdentifiers(
  value,
) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isCanonicalIdentifier(item),
    )
  );
}

function hasDuplicates(values) {
  return (
    Array.isArray(values) &&
    new Set(values).size !==
      values.length
  );
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function validateFactValue(
  value,
  valueType,
) {
  switch (valueType) {
    case FACT_VALUE_TYPE.STRING:
      return (
        typeof value === "string"
      );

    case FACT_VALUE_TYPE.NUMBER:
      return (
        typeof value === "number" &&
        Number.isFinite(value)
      );

    case FACT_VALUE_TYPE.BOOLEAN:
      return (
        typeof value === "boolean"
      );

    case FACT_VALUE_TYPE.STRING_LIST:
      return (
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === "string",
        )
      );

    case FACT_VALUE_TYPE.NUMBER_LIST:
      return (
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === "number" &&
            Number.isFinite(item),
        )
      );

    default:
      return false;
  }
}


/* ============================================================
 * SOURCE VALIDATORS
 * ============================================================
 */

export function validateSource(source) {
  const errors = [];

  if (!isPlainObject(source)) {
    return {
      valid: false,
      errors: [
        makeError(
          "source",
          "source must be a plain object",
        ),
      ],
    };
  }

  const sourceId =
    isNonEmptyString(source.id)
      ? source.id
      : "<unknown>";

  const rootPath =
    `source.${sourceId}`;

  for (const key of Object.keys(source)) {
    if (
      !SOURCE_ALLOWED_FIELDS.includes(
        key,
      )
    ) {
      errors.push(
        makeError(
          `${rootPath}.${key}`,
          "unknown source field",
        ),
      );
    }
  }

  if (
    !isCanonicalIdentifier(source.id)
  ) {
    errors.push(
      makeError(
        `${rootPath}.id`,
        "source id must be a canonical kebab-case identifier",
      ),
    );
  }

  if (
    !enumValues(
      SOURCE_TYPE,
    ).includes(
      source.type,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.type`,
        "invalid source type",
      ),
    );
  }

  if (
    !isNonEmptyString(
      source.title,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.title`,
        "source title must be a non-empty string",
      ),
    );
  }

  if (
    !enumValues(
      SOURCE_AUTHORITY,
    ).includes(
      source.authority,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.authority`,
        "invalid source authority",
      ),
    );
  }

  if (
    !enumValues(
      SOURCE_VISIBILITY,
    ).includes(
      source.visibility,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.visibility`,
        "invalid source visibility",
      ),
    );
  }

  if (
    !isNonEmptyString(
      source.owner,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.owner`,
        "source owner must be a non-empty string",
      ),
    );
  }

  if (
    typeof source.verified !==
      "boolean"
  ) {
    errors.push(
      makeError(
        `${rootPath}.verified`,
        "source verified must be boolean",
      ),
    );
  }

  if (
    !isValidDateOnly(
      source.lastVerifiedAt,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.lastVerifiedAt`,
        "lastVerifiedAt must be a valid YYYY-MM-DD date",
      ),
    );
  }

  const requiresUrl =
    SOURCE_TYPES_REQUIRING_URL.includes(
      source.type,
    );

  if (requiresUrl) {
    if (
      !isValidHttpsUrl(
        source.url,
      )
    ) {
      errors.push(
        makeError(
          `${rootPath}.url`,
          "public web source must have a valid HTTPS URL",
        ),
      );
    }
  } else if (
    source.url !== null &&
    source.url !== undefined &&
    !isValidHttpsUrl(source.url)
  ) {
    errors.push(
      makeError(
        `${rootPath}.url`,
        "source URL must be null or a valid HTTPS URL",
      ),
    );
  }

  if (
    !Array.isArray(
      source.topics,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.topics`,
        "source topics must be an array",
      ),
    );
  } else {
    if (
      source.topics.length === 0
    ) {
      errors.push(
        makeError(
          `${rootPath}.topics`,
          "source must define at least one topic",
        ),
      );
    }

    source.topics.forEach(
      (
        topic,
        index,
      ) => {
        if (
          !isCanonicalIdentifier(
            topic,
          )
        ) {
          errors.push(
            makeError(
              `${rootPath}.topics[${index}]`,
              "topic must be a canonical kebab-case identifier",
            ),
          );
        }
      },
    );

    const duplicateTopics =
      findDuplicates(
        source.topics,
      );

    for (
      const topic of
      duplicateTopics
    ) {
      errors.push(
        makeError(
          `${rootPath}.topics`,
          `duplicate topic: ${topic}`,
        ),
      );
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


export function validateSources(
  sourceCatalog,
) {
  const errors = [];

  if (
    !Array.isArray(
      sourceCatalog,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          "sources",
          "source catalog must be an array",
        ),
      ],
    };
  }

  const sourceIds = [];

  sourceCatalog.forEach(
    (
      source,
      index,
    ) => {
      const result =
        validateSource(source);

      if (
        isPlainObject(source) &&
        isNonEmptyString(
          source.id,
        )
      ) {
        sourceIds.push(
          source.id,
        );
      }

      for (
        const error of
        result.errors
      ) {
        errors.push(
          makeError(
            `sources[${index}].${error.path}`,
            error.message,
          ),
        );
      }
    },
  );

  const duplicateIds =
    findDuplicates(
      sourceIds,
    );

  for (
    const sourceId of
    duplicateIds
  ) {
    errors.push(
      makeError(
        "sources",
        `duplicate source id: ${sourceId}`,
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


export function assertValidSources(
  sourceCatalog,
) {
  const result =
    validateSources(
      sourceCatalog,
    );

  if (result.valid) {
    return true;
  }

  const details =
    result.errors
      .map(
        ({
          path,
          message,
        }) =>
          `- ${path}: ${message}`,
      )
      .join("\n");

  throw new Error(
    `Invalid knowledge sources:\n${details}`,
  );
}


/* ============================================================
 * TEMPORAL VALIDATOR
 * ============================================================
 */

export function validateTemporal(
  temporal,
  path = "temporal",
) {
  const errors = [];

  if (
    !isPlainObject(
      temporal,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "temporal must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      temporal,
      TEMPORAL_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown temporal field",
      ),
    );
  }

  if (
    !enumValues(
      TEMPORAL_STATUS,
    ).includes(
      temporal.status,
    )
  ) {
    errors.push(
      makeError(
        `${path}.status`,
        "invalid temporal status",
      ),
    );
  }

  for (
    const field of [
      "validFrom",
      "validTo",
    ]
  ) {
    const value =
      temporal[field];

    if (
      value !== null &&
      value !== undefined &&
      !isValidDateOnly(value)
    ) {
      errors.push(
        makeError(
          `${path}.${field}`,
          `${field} must be null or a valid YYYY-MM-DD date`,
        ),
      );
    }
  }

  if (
    isValidDateOnly(
      temporal.validFrom,
    ) &&
    isValidDateOnly(
      temporal.validTo,
    ) &&
    temporal.validFrom >
      temporal.validTo
  ) {
    errors.push(
      makeError(
        path,
        "validFrom cannot be after validTo",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * EVIDENCE VALIDATOR
 * ============================================================
 */

export function validateEvidence(
  evidence,
  path = "evidence",
) {
  const errors = [];

  if (
    !isPlainObject(
      evidence,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "evidence must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      evidence,
      EVIDENCE_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown evidence field",
      ),
    );
  }

  if (
    !enumValues(
      EVIDENCE_STRENGTH,
    ).includes(
      evidence.strength,
    )
  ) {
    errors.push(
      makeError(
        `${path}.strength`,
        "invalid evidence strength",
      ),
    );
  }

  if (
    !isNonEmptyString(
      evidence.type,
    )
  ) {
    errors.push(
      makeError(
        `${path}.type`,
        "evidence type must be a non-empty string",
      ),
    );
  }

  if (
    !Array.isArray(
      evidence.sourceIds,
    ) ||
    evidence.sourceIds.length === 0
  ) {
    errors.push(
      makeError(
        `${path}.sourceIds`,
        "evidence must reference at least one source",
      ),
    );
  } else {
    for (
      let index = 0;
      index <
      evidence.sourceIds.length;
      index += 1
    ) {
      if (
        !isCanonicalIdentifier(
          evidence.sourceIds[
            index
          ],
        )
      ) {
        errors.push(
          makeError(
            `${path}.sourceIds[${index}]`,
            "evidence source id must be canonical",
          ),
        );
      }
    }

    if (
      hasDuplicates(
        evidence.sourceIds,
      )
    ) {
      errors.push(
        makeError(
          `${path}.sourceIds`,
          "duplicate evidence source ids",
        ),
      );
    }
  }

  if (
    evidence.note !== undefined &&
    evidence.note !== null &&
    !isNonEmptyString(
      evidence.note,
    )
  ) {
    errors.push(
      makeError(
        `${path}.note`,
        "evidence note must be null or a non-empty string",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * FACT VALIDATOR
 * ============================================================
 */

export function validateFact(
  fact,
  path = "fact",
) {
  const errors = [];

  if (
    !isPlainObject(fact)
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "fact must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      fact,
      FACT_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown fact field",
      ),
    );
  }

  if (
    !isCanonicalIdentifier(
      fact.id,
    )
  ) {
    errors.push(
      makeError(
        `${path}.id`,
        "fact id must be a canonical kebab-case identifier",
      ),
    );
  }

  if (
    !isCanonicalIdentifier(
      fact.key,
    )
  ) {
    errors.push(
      makeError(
        `${path}.key`,
        "fact key must be a canonical kebab-case identifier",
      ),
    );
  }

  if (
    !enumValues(
      FACT_VALUE_TYPE,
    ).includes(
      fact.valueType,
    )
  ) {
    errors.push(
      makeError(
        `${path}.valueType`,
        "invalid fact value type",
      ),
    );
  } else if (
    !validateFactValue(
      fact.value,
      fact.valueType,
    )
  ) {
    errors.push(
      makeError(
        `${path}.value`,
        "fact value does not match valueType",
      ),
    );
  }

  if (
    !enumValues(
      CLAIM_STATUS,
    ).includes(
      fact.status,
    )
  ) {
    errors.push(
      makeError(
        `${path}.status`,
        "invalid fact claim status",
      ),
    );
  }

  if (
    !enumValues(
      DISCLOSURE,
    ).includes(
      fact.disclosure,
    )
  ) {
    errors.push(
      makeError(
        `${path}.disclosure`,
        "invalid fact disclosure",
      ),
    );
  }

  const factSourcesValid =
    isArrayOfCanonicalIdentifiers(
      fact.sources,
    );

  if (!factSourcesValid) {
    errors.push(
      makeError(
        `${path}.sources`,
        "fact sources must be an array of canonical ids",
      ),
    );
  } else {
    if (
      hasDuplicates(
        fact.sources,
      )
    ) {
      errors.push(
        makeError(
          `${path}.sources`,
          "duplicate fact source ids",
        ),
      );
    }

    if (
      fact.status !==
        CLAIM_STATUS.DERIVED &&
      fact.sources.length === 0
    ) {
      errors.push(
        makeError(
          `${path}.sources`,
          "non-derived fact must reference at least one source",
        ),
      );
    }
  }

  if (
    !Array.isArray(
      fact.evidence,
    ) ||
    fact.evidence.length === 0
  ) {
    errors.push(
      makeError(
        `${path}.evidence`,
        "fact must define at least one evidence item",
      ),
    );
  } else {
    fact.evidence.forEach(
      (
        evidence,
        index,
      ) => {
        const result =
          validateEvidence(
            evidence,
            `${path}.evidence[${index}]`,
          );

        errors.push(
          ...result.errors,
        );
      },
    );
  }

  if (
    fact.temporal !==
      undefined &&
    fact.temporal !== null
  ) {
    const result =
      validateTemporal(
        fact.temporal,
        `${path}.temporal`,
      );

    errors.push(
      ...result.errors,
    );
  }

  if (
    fact.status ===
      CLAIM_STATUS.DERIVED
  ) {
    if (
      !Array.isArray(
        fact.derivedFrom,
      ) ||
      fact.derivedFrom.length === 0
    ) {
      errors.push(
        makeError(
          `${path}.derivedFrom`,
          "derived fact must reference parent facts",
        ),
      );
    } else {
      fact.derivedFrom.forEach(
        (
          factId,
          index,
        ) => {
          if (
            !isCanonicalIdentifier(
              factId,
            )
          ) {
            errors.push(
              makeError(
                `${path}.derivedFrom[${index}]`,
                "derived parent id must be canonical",
              ),
            );
          }
        },
      );

      if (
        hasDuplicates(
          fact.derivedFrom,
        )
      ) {
        errors.push(
          makeError(
            `${path}.derivedFrom`,
            "duplicate derived parent fact ids",
          ),
        );
      }
    }
  } else if (
    fact.derivedFrom !==
      undefined
  ) {
    errors.push(
      makeError(
        `${path}.derivedFrom`,
        "derivedFrom is only allowed for derived facts",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * RELATIONSHIP VALIDATOR
 * ============================================================
 */

export function validateRelationship(
  relationship,
  path = "relationship",
) {
  const errors = [];

  if (
    !isPlainObject(
      relationship,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "relationship must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      relationship,
      RELATIONSHIP_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown relationship field",
      ),
    );
  }

  if (
    !enumValues(
      RELATION_TYPE,
    ).includes(
      relationship.type,
    )
  ) {
    errors.push(
      makeError(
        `${path}.type`,
        "invalid relationship type",
      ),
    );
  }

  if (
    !isCanonicalIdentifier(
      relationship.target,
    )
  ) {
    errors.push(
      makeError(
        `${path}.target`,
        "relationship target must be a canonical knowledge id",
      ),
    );
  }

  if (
    relationship.strength !==
      undefined &&
    !enumValues(
      EVIDENCE_STRENGTH,
    ).includes(
      relationship.strength,
    )
  ) {
    errors.push(
      makeError(
        `${path}.strength`,
        "invalid relationship strength",
      ),
    );
  }

  if (
    !isArrayOfCanonicalIdentifiers(
      relationship.sources,
    )
  ) {
    errors.push(
      makeError(
        `${path}.sources`,
        "relationship sources must be canonical source ids",
      ),
    );
  } else if (
    hasDuplicates(
      relationship.sources,
    )
  ) {
    errors.push(
      makeError(
        `${path}.sources`,
        "duplicate relationship source ids",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * COVERAGE VALIDATOR
 * ============================================================
 */

export function validateCoverage(
  coverage,
  path = "coverage",
) {
  const errors = [];

  if (
    !isPlainObject(
      coverage,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "coverage must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      coverage,
      COVERAGE_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown coverage field",
      ),
    );
  }

  if (
    !enumValues(
      COVERAGE_LEVEL,
    ).includes(
      coverage.level,
    )
  ) {
    errors.push(
      makeError(
        `${path}.level`,
        "invalid coverage level",
      ),
    );
  }

  for (
    const field of [
      "canAnswerDirectly",
      "canRecommend",
      "canProvideEvidence",
      "canNavigate",
    ]
  ) {
    if (
      !isBoolean(
        coverage[field],
      )
    ) {
      errors.push(
        makeError(
          `${path}.${field}`,
          `${field} must be boolean`,
        ),
      );
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * ANSWER POLICY VALIDATOR
 * ============================================================
 */

export function validateAnswerPolicy(
  policy,
  path = "answerPolicy",
) {
  const errors = [];

  if (
    !isPlainObject(
      policy,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "answerPolicy must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      policy,
      ANSWER_POLICY_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown answerPolicy field",
      ),
    );
  }

  for (
    const field of [
      "directAnswer",
      "allowInference",
      "allowRecommendation",
    ]
  ) {
    if (
      !isBoolean(
        policy[field],
      )
    ) {
      errors.push(
        makeError(
          `${path}.${field}`,
          `${field} must be boolean`,
        ),
      );
    }
  }

  if (
    !enumValues(
      ANSWER_EVIDENCE_MODE,
    ).includes(
      policy.mentionEvidence,
    )
  ) {
    errors.push(
      makeError(
        `${path}.mentionEvidence`,
        "invalid evidence mention mode",
      ),
    );
  }

  if (
    !Number.isInteger(
      policy.maxEvidenceItems,
    ) ||
    policy.maxEvidenceItems < 0
  ) {
    errors.push(
      makeError(
        `${path}.maxEvidenceItems`,
        "maxEvidenceItems must be a non-negative integer",
      ),
    );
  }

  if (
    !enumValues(
      ANSWER_DEPTH,
    ).includes(
      policy.preferredDepth,
    )
  ) {
    errors.push(
      makeError(
        `${path}.preferredDepth`,
        "invalid preferred answer depth",
      ),
    );
  }

  if (
    !isArrayOfCanonicalIdentifiers(
      policy.forbiddenClaims,
    )
  ) {
    errors.push(
      makeError(
        `${path}.forbiddenClaims`,
        "forbiddenClaims must contain canonical claim ids",
      ),
    );
  } else if (
    hasDuplicates(
      policy.forbiddenClaims,
    )
  ) {
    errors.push(
      makeError(
        `${path}.forbiddenClaims`,
        "duplicate forbidden claims",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * LIMITATION VALIDATOR
 * ============================================================
 */

export function validateLimitation(
  limitation,
  path = "limitation",
) {
  const errors = [];

  if (
    !isPlainObject(
      limitation,
    )
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          path,
          "limitation must be a plain object",
        ),
      ],
    };
  }

  for (
    const field of
    hasOnlyAllowedFields(
      limitation,
      LIMITATION_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${path}.${field}`,
        "unknown limitation field",
      ),
    );
  }

  if (
    !enumValues(
      LIMITATION_TYPE,
    ).includes(
      limitation.type,
    )
  ) {
    errors.push(
      makeError(
        `${path}.type`,
        "invalid limitation type",
      ),
    );
  }

  if (
    !isNonEmptyString(
      limitation.claim,
    )
  ) {
    errors.push(
      makeError(
        `${path}.claim`,
        "limitation claim must be a non-empty string",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * KNOWLEDGE ITEM VALIDATOR
 * ============================================================
 */

export function validateKnowledgeItem(
  item,
) {
  const errors = [];

  if (
    !isPlainObject(item)
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          "knowledgeItem",
          "knowledge item must be a plain object",
        ),
      ],
    };
  }

  const itemId =
    isNonEmptyString(
      item.id,
    )
      ? item.id
      : "<unknown>";

  const rootPath =
    `knowledgeItem.${itemId}`;

  for (
    const field of
    hasOnlyAllowedFields(
      item,
      KNOWLEDGE_ITEM_ALLOWED_FIELDS,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.${field}`,
        "unknown knowledge item field",
      ),
    );
  }

  if (
    !isCanonicalIdentifier(
      item.id,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.id`,
        "knowledge item id must be a canonical kebab-case identifier",
      ),
    );
  }

  if (
    !enumValues(
      KNOWLEDGE_TYPE,
    ).includes(
      item.type,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.type`,
        "invalid knowledge item type",
      ),
    );
  }

  if (
    !enumValues(
      KNOWLEDGE_STATUS,
    ).includes(
      item.status,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.status`,
        "invalid knowledge status",
      ),
    );
  }

  if (
    !isNonEmptyString(
      item.title,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.title`,
        "knowledge title must be a non-empty string",
      ),
    );
  }

  if (
    !isNonEmptyString(
      item.shortDescription,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.shortDescription`,
        "shortDescription must be a non-empty string",
      ),
    );
  }

  if (
    !Array.isArray(
      item.aliases,
    ) ||
    !item.aliases.every(
      (alias) =>
        isNonEmptyString(alias),
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.aliases`,
        "aliases must be an array of non-empty strings",
      ),
    );
  } else if (
    hasDuplicates(
      item.aliases,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.aliases`,
        "duplicate aliases",
      ),
    );
  }

  if (
    !Array.isArray(
      item.facts,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.facts`,
        "facts must be an array",
      ),
    );
  } else {
    const factIds = [];

    item.facts.forEach(
      (
        fact,
        index,
      ) => {
        const result =
          validateFact(
            fact,
            `${rootPath}.facts[${index}]`,
          );

        errors.push(
          ...result.errors,
        );

        if (
          isPlainObject(fact) &&
          isNonEmptyString(
            fact.id,
          )
        ) {
          factIds.push(
            fact.id,
          );
        }
      },
    );

    const duplicateFactIds =
      findDuplicates(
        factIds,
      );

    for (
      const factId of
      duplicateFactIds
    ) {
      errors.push(
        makeError(
          `${rootPath}.facts`,
          `duplicate fact id: ${factId}`,
        ),
      );
    }
  }

  if (
    !Array.isArray(
      item.relationships,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.relationships`,
        "relationships must be an array",
      ),
    );
  } else {
    item.relationships.forEach(
      (
        relationship,
        index,
      ) => {
        const result =
          validateRelationship(
            relationship,
            `${rootPath}.relationships[${index}]`,
          );

        errors.push(
          ...result.errors,
        );
      },
    );
  }

  const itemSourcesValid =
    isArrayOfCanonicalIdentifiers(
      item.sources,
    );

  if (!itemSourcesValid) {
    errors.push(
      makeError(
        `${rootPath}.sources`,
        "sources must be an array of canonical source ids",
      ),
    );
  } else {
    if (
      hasDuplicates(
        item.sources,
      )
    ) {
      errors.push(
        makeError(
          `${rootPath}.sources`,
          "duplicate knowledge source ids",
        ),
      );
    }

    if (
      item.sources.length === 0
    ) {
      errors.push(
        makeError(
          `${rootPath}.sources`,
          "knowledge item must reference at least one source",
        ),
      );
    }
  }

  if (
    !enumValues(
      DISCLOSURE,
    ).includes(
      item.disclosure,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.disclosure`,
        "invalid knowledge disclosure",
      ),
    );
  }

  const temporalResult =
    validateTemporal(
      item.temporal,
      `${rootPath}.temporal`,
    );

  errors.push(
    ...temporalResult.errors,
  );

  const coverageResult =
    validateCoverage(
      item.coverage,
      `${rootPath}.coverage`,
    );

  errors.push(
    ...coverageResult.errors,
  );

  const policyResult =
    validateAnswerPolicy(
      item.answerPolicy,
      `${rootPath}.answerPolicy`,
    );

  errors.push(
    ...policyResult.errors,
  );

  if (
    !Array.isArray(
      item.limitations,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.limitations`,
        "limitations must be an array",
      ),
    );
  } else {
    item.limitations.forEach(
      (
        limitation,
        index,
      ) => {
        const result =
          validateLimitation(
            limitation,
            `${rootPath}.limitations[${index}]`,
          );

        errors.push(
          ...result.errors,
        );
      },
    );
  }

  if (
    !isPlainObject(
      item.metadata,
    )
  ) {
    errors.push(
      makeError(
        `${rootPath}.metadata`,
        "metadata must be a plain object",
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


/* ============================================================
 * KNOWLEDGE CATALOG VALIDATOR
 * ============================================================
 */

export function validateKnowledgeItems(
  items,
) {
  const errors = [];

  if (
    !Array.isArray(items)
  ) {
    return {
      valid: false,
      errors: [
        makeError(
          "knowledgeItems",
          "knowledge item catalog must be an array",
        ),
      ],
    };
  }

  const itemIds = [];

  items.forEach(
    (
      item,
      index,
    ) => {
      const result =
        validateKnowledgeItem(
          item,
        );

      for (
        const error of
        result.errors
      ) {
        errors.push(
          makeError(
            `knowledgeItems[${index}].${error.path}`,
            error.message,
          ),
        );
      }

      if (
        isPlainObject(item) &&
        isNonEmptyString(
          item.id,
        )
      ) {
        itemIds.push(
          item.id,
        );
      }
    },
  );

  const duplicateIds =
    findDuplicates(
      itemIds,
    );

  for (
    const itemId of
    duplicateIds
  ) {
    errors.push(
      makeError(
        "knowledgeItems",
        `duplicate knowledge item id: ${itemId}`,
      ),
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}


export function assertValidKnowledgeItems(
  items,
) {
  const result =
    validateKnowledgeItems(
      items,
    );

  if (result.valid) {
    return true;
  }

  const details =
    result.errors
      .map(
        ({
          path,
          message,
        }) =>
          `- ${path}: ${message}`,
      )
      .join("\n");

  throw new Error(
    `Invalid knowledge items:\n${details}`,
  );
}