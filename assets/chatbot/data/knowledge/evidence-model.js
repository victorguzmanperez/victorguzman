export const EVIDENCE_KIND =
  Object.freeze({
    PROFILE: "profile",
    EXPERIENCE: "experience",
    TECHNOLOGY: "technology",
    CAPABILITY: "capability",
    EDUCATION: "education",
    CERTIFICATION: "certification",
    PROJECT: "project",
  });


export const EVIDENCE_MATCH_LEVEL =
  Object.freeze({
    DIRECT: "direct",
    STRONG_RELATED: "strong_related",
    RELATED: "related",
    SUPPORTING: "supporting",
    NO_EVIDENCE: "no_evidence",
  });


export const EVIDENCE_CLAIM_MODE =
  Object.freeze({
    DIRECT_EXPERIENCE:
      "direct_experience",

    RELATED_EXPERIENCE:
      "related_experience",

    TRAINING_ONLY:
      "training_only",

    NO_EVIDENCE:
      "no_evidence",
  });


export const SIMILARITY_USER_GOAL =
  Object.freeze({
    ASK_FACT:
      "ask_fact",

    ASK_EVIDENCE:
      "ask_evidence",

    FIND_PROJECT:
      "find_project",

    FIND_SIMILAR_CASE:
      "find_similar_case",

    SOLVE_PROBLEM:
      "solve_problem",

    BROWSE_PROJECTS:
      "browse_projects",
  });


export const EVIDENCE_DIMENSION_WEIGHT =
  Object.freeze({
    problems: 30,
    capabilities: 25,
    technologies: 15,
    objectives: 10,
    businessAreas: 10,
    processCharacteristics: 10,
  });


export const EVIDENCE_KIND_WEIGHT =
  Object.freeze({
    [EVIDENCE_KIND.EXPERIENCE]:
      1,

    [EVIDENCE_KIND.PROJECT]:
      1,

    [EVIDENCE_KIND.TECHNOLOGY]:
      0.9,

    [EVIDENCE_KIND.EDUCATION]:
      0.65,

    [EVIDENCE_KIND.CERTIFICATION]:
      0.65,

    [EVIDENCE_KIND.PROFILE]:
      0.55,

    [EVIDENCE_KIND.CAPABILITY]:
      0.5,
  });


export const EVIDENCE_LEVEL_SCORE =
  Object.freeze({
    [EVIDENCE_MATCH_LEVEL.DIRECT]:
      4,

    [EVIDENCE_MATCH_LEVEL.STRONG_RELATED]:
      3,

    [EVIDENCE_MATCH_LEVEL.RELATED]:
      2,

    [EVIDENCE_MATCH_LEVEL.SUPPORTING]:
      1,

    [EVIDENCE_MATCH_LEVEL.NO_EVIDENCE]:
      0,
  });


export function classifyEvidenceScore(
  score,
) {
  if (
    typeof score !== "number" ||
    !Number.isFinite(score)
  ) {
    return (
      EVIDENCE_MATCH_LEVEL.NO_EVIDENCE
    );
  }

  if (score >= 85) {
    return EVIDENCE_MATCH_LEVEL.DIRECT;
  }

  if (score >= 70) {
    return (
      EVIDENCE_MATCH_LEVEL
        .STRONG_RELATED
    );
  }

  if (score >= 55) {
    return EVIDENCE_MATCH_LEVEL.RELATED;
  }

  if (score >= 40) {
    return (
      EVIDENCE_MATCH_LEVEL.SUPPORTING
    );
  }

  return (
    EVIDENCE_MATCH_LEVEL.NO_EVIDENCE
  );
}


export function capEvidenceLevel(
  level,
  maximumLevel,
) {
  const current =
    EVIDENCE_LEVEL_SCORE[level];

  const maximum =
    EVIDENCE_LEVEL_SCORE[
      maximumLevel
    ];

  if (
    current === undefined ||
    maximum === undefined
  ) {
    return (
      EVIDENCE_MATCH_LEVEL.NO_EVIDENCE
    );
  }

  return current <= maximum
    ? level
    : maximumLevel;
}


export function freezeEvidenceRecord(
  record,
) {
  return Object.freeze({
    ...record,

    problems:
      Object.freeze([
        ...(record.problems ?? []),
      ]),

    capabilities:
      Object.freeze([
        ...(record.capabilities ?? []),
      ]),

    technologies:
      Object.freeze([
        ...(record.technologies ?? []),
      ]),

    businessAreas:
      Object.freeze([
        ...(record.businessAreas ?? []),
      ]),

    objectives:
      Object.freeze([
        ...(record.objectives ?? []),
      ]),

    processCharacteristics:
      Object.freeze([
        ...(
          record.processCharacteristics ??
          []
        ),
      ]),

    constraints:
      Object.freeze([
        ...(record.constraints ?? []),
      ]),

    evidenceModes:
      Object.freeze([
        ...(record.evidenceModes ?? []),
      ]),

    sourceIds:
      Object.freeze([
        ...(record.sourceIds ?? []),
      ]),

    metadata:
      Object.freeze({
        ...(record.metadata ?? {}),
      }),
  });
}