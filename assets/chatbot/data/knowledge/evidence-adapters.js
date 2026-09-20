import {
  EXPERIENCE_EVIDENCE,
  TEMPORAL_STATUS,
} from "./constants.js";

import {
  EVIDENCE_KIND,
  freezeEvidenceRecord,
} from "./evidence-model.js";

import {
  profileKnowledge,
} from "./profile.js";

import {
  experienceKnowledge,
} from "./experience.js";

import {
  technologyKnowledge,
  technologyKnowledgeById,
} from "./technologies.js";

import {
  capabilityKnowledge,
  capabilityKnowledgeById,
} from "./capabilities.js";

import {
  educationKnowledge,
} from "./education.js";

import {
  certificationKnowledge,
} from "./certifications.js";

import {
  projectKnowledge,
  getProjectFact,
} from "./projects.js";


function factValue(
  item,
  key,
  fallback = [],
) {
  return (
    item.facts.find(
      (fact) =>
        fact.key === key,
    )?.value ?? fallback
  );
}


function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}


function toTechnologyId(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    value.startsWith(
      "technology-",
    )
  ) {
    return value;
  }

  const candidate =
    `technology-${value}`;

  return technologyKnowledgeById[
    candidate
  ]
    ? candidate
    : null;
}


function toCapabilityId(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    value.startsWith(
      "capability-",
    )
  ) {
    return value;
  }

  const candidate =
    `capability-${value}`;

  return capabilityKnowledgeById[
    candidate
  ]
    ? candidate
    : null;
}


function inferProcessCharacteristics(
  capabilities,
  technologies,
  values = [],
) {
  const result = [
    ...values,
  ];

  if (
    capabilities.includes(
      "capability-data-migration",
    )
  ) {
    result.push("migration");
  }

  if (
    capabilities.includes(
      "capability-process-automation",
    )
  ) {
    result.push("automation");
  }

  if (
    capabilities.includes(
      "capability-testing",
    )
  ) {
    result.push("testing");
  }

  if (
    capabilities.includes(
      "capability-hierarchical-modeling",
    )
  ) {
    result.push("hierarchical");
  }

  if (
    technologies.includes(
      "technology-power-bi",
    )
  ) {
    result.push("reporting");
  }

  return unique(result);
}


/* ============================================================
 * PROFILE
 * ============================================================
 */

export function adaptProfileEvidence(
  item,
) {
  const capabilities =
    item.relationships
      .map(
        (relationship) =>
          relationship.target,
      )
      .filter(
        (target) =>
          target.startsWith(
            "capability-",
          ),
      );

  const businessAreas =
    item.relationships
      .map(
        (relationship) =>
          relationship.target,
      )
      .filter(
        (target) =>
          target.startsWith(
            "business-area-",
          ),
      )
      .map(
        (target) =>
          target.replace(
            "business-area-",
            "",
          ),
      );

  const currentFocus =
    factValue(
      item,
      "current-focus",
      [],
    );

  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.PROFILE}:${item.id}`,

    kind:
      EVIDENCE_KIND.PROFILE,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities:
      unique(capabilities),

    technologies: [],

    businessAreas:
      unique(businessAreas),

    objectives: [],

    processCharacteristics:
      Array.isArray(currentFocus)
        ? currentFocus
        : [],

    constraints: [],

    evidenceModes: [
      "profile_summary",
    ],

    sourceIds:
      item.sources,

    metadata: {
      current:
        item.temporal.status ===
        TEMPORAL_STATUS.CURRENT,
    },
  });
}


/* ============================================================
 * EXPERIENCE
 * ============================================================
 */

export function adaptExperienceEvidence(
  item,
) {
  const rawCapabilities =
    factValue(
      item,
      "capabilities",
      [],
    );

  const capabilities =
    unique(
      rawCapabilities
        .map(toCapabilityId),
    );

  const technologies =
    unique(
      factValue(
        item,
        "technologies",
        [],
      )
        .map(toTechnologyId),
    );

  const businessAreas =
    factValue(
      item,
      "business-areas",
      [],
    );

  const current =
    item.temporal.status ===
    TEMPORAL_STATUS.CURRENT;

  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.EXPERIENCE}:${item.id}`,

    kind:
      EVIDENCE_KIND.EXPERIENCE,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities,

    technologies,

    businessAreas:
      unique(businessAreas),

    objectives: [],

    processCharacteristics:
      inferProcessCharacteristics(
        capabilities,
        technologies,
        rawCapabilities,
      ),

    constraints: [],

    evidenceModes: [
      current
        ? EXPERIENCE_EVIDENCE
            .PROFESSIONAL_CURRENT
        : EXPERIENCE_EVIDENCE
            .PROFESSIONAL_HISTORICAL,
    ],

    sourceIds:
      item.sources,

    metadata: {
      current,
      organization:
        item.metadata
          ?.organization ?? null,
    },
  });
}


/* ============================================================
 * TECHNOLOGY
 * ============================================================
 */

export function adaptTechnologyEvidence(
  item,
) {
  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.TECHNOLOGY}:${item.id}`,

    kind:
      EVIDENCE_KIND.TECHNOLOGY,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities: [],

    technologies: [
      item.id,
    ],

    businessAreas: [],

    objectives: [],

    processCharacteristics: [],

    constraints: [],

    evidenceModes:
      factValue(
        item,
        "experience-evidence",
        [],
      ),

    sourceIds:
      item.sources,

    metadata: {
      currentProfessional:
        factValue(
          item,
          "professional-current",
          false,
        ),

      historicalProfessional:
        factValue(
          item,
          "professional-historical",
          false,
        ),
    },
  });
}


/* ============================================================
 * CAPABILITY
 * ============================================================
 */

export function adaptCapabilityEvidence(
  item,
) {
  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.CAPABILITY}:${item.id}`,

    kind:
      EVIDENCE_KIND.CAPABILITY,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities: [
      item.id,
    ],

    technologies: [],

    businessAreas: [],

    objectives: [],

    processCharacteristics:
      factValue(
        item,
        "domains",
        [],
      ),

    constraints: [],

    evidenceModes:
      factValue(
        item,
        "evidence-types",
        [],
      ),

    sourceIds:
      item.sources,

    metadata: {
      derivedCapability: true,
    },
  });
}


/* ============================================================
 * EDUCATION
 * ============================================================
 */

export function adaptEducationEvidence(
  item,
) {
  const topics =
    factValue(
      item,
      "topics",
      [],
    );

  const technologies =
    unique(
      topics.map(
        toTechnologyId,
      ),
    );

  const businessAreas =
    topics.filter(
      (topic) =>
        [
          "finance",
          "financial-markets",
          "marketing",
        ].includes(topic),
    );

  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.EDUCATION}:${item.id}`,

    kind:
      EVIDENCE_KIND.EDUCATION,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities: [],

    technologies,

    businessAreas:
      unique(businessAreas),

    objectives: [],

    processCharacteristics:
      topics,

    constraints: [],

    evidenceModes: [
      EXPERIENCE_EVIDENCE
        .FORMAL_TRAINING,
    ],

    sourceIds:
      item.sources,

    metadata: {
      training: true,
    },
  });
}


/* ============================================================
 * CERTIFICATION
 * ============================================================
 */

export function adaptCertificationEvidence(
  item,
) {
  const technologies = [];

  if (
    item.id ===
    "certification-pl300"
  ) {
    technologies.push(
      "technology-power-bi",
    );
  }

  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.CERTIFICATION}:${item.id}`,

    kind:
      EVIDENCE_KIND.CERTIFICATION,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems: [],

    capabilities: [],

    technologies,

    businessAreas: [],

    objectives: [],

    processCharacteristics: [
      "pl-300",
      "power-bi",
    ],

    constraints: [
      "not-earned",
    ],

    evidenceModes: [
      EXPERIENCE_EVIDENCE
        .FORMAL_TRAINING,
    ],

    sourceIds:
      item.sources,

    metadata: {
      certificationStatus:
        factValue(
          item,
          "certification-status",
          null,
        ),

      earned:
        factValue(
          item,
          "official-certification-earned",
          false,
        ),
    },
  });
}


/* ============================================================
 * PROJECT
 * ============================================================
 */

export function adaptProjectEvidence(
  item,
) {
  return freezeEvidenceRecord({
    id:
      `evidence:${EVIDENCE_KIND.PROJECT}:${item.id}`,

    kind:
      EVIDENCE_KIND.PROJECT,

    knowledgeId:
      item.id,

    title:
      item.title,

    summary:
      item.shortDescription,

    problems:
      getProjectFact(
        item,
        "problems",
      )?.value ?? [],

    capabilities:
      getProjectFact(
        item,
        "capabilities",
      )?.value ?? [],

    technologies:
      getProjectFact(
        item,
        "technologies",
      )?.value ?? [],

    businessAreas:
      getProjectFact(
        item,
        "business-areas",
      )?.value ?? [],

    objectives:
      getProjectFact(
        item,
        "objectives",
      )?.value ?? [],

    processCharacteristics:
      getProjectFact(
        item,
        "process-characteristics",
      )?.value ?? [],

    constraints:
      getProjectFact(
        item,
        "constraints",
      )?.value ?? [],

    evidenceModes: [
      EXPERIENCE_EVIDENCE
        .PROJECT_APPLIED,
    ],

    sourceIds:
      item.sources,

    metadata: {
      projectStatus:
        getProjectFact(
          item,
          "project-status",
        )?.value ?? null,
    },
  });
}


/* ============================================================
 * ALL KNOWLEDGE
 * ============================================================
 */

export function adaptAllKnowledgeToEvidence() {
  return [
    ...profileKnowledge.map(
      adaptProfileEvidence,
    ),

    ...experienceKnowledge.map(
      adaptExperienceEvidence,
    ),

    ...technologyKnowledge.map(
      adaptTechnologyEvidence,
    ),

    ...capabilityKnowledge.map(
      adaptCapabilityEvidence,
    ),

    ...educationKnowledge.map(
      adaptEducationEvidence,
    ),

    ...certificationKnowledge.map(
      adaptCertificationEvidence,
    ),

    ...projectKnowledge.map(
      adaptProjectEvidence,
    ),
  ];
}