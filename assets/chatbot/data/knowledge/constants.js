export const KNOWLEDGE_TYPE =
  Object.freeze({
    PROFILE: "profile",
    EXPERIENCE: "experience",
    TECHNOLOGY: "technology",
    CAPABILITY: "capability",
    SERVICE: "service",
    PROBLEM: "problem",
    SOLUTION: "solution",
    PROJECT: "project",
    BUSINESS_AREA: "business_area",
    PUBLICATION: "publication",
    EDUCATION: "education",
    CERTIFICATION: "certification",
    DIAGNOSTIC: "diagnostic",
    CONTACT: "contact",
    BOOKING: "booking",
    POLICY: "policy",
  });

export const CLAIM_STATUS =
  Object.freeze({
    VERIFIED: "verified",
    USER_CONFIRMED: "user_confirmed",
    DERIVED: "derived",
    PLANNED: "planned",
    UNKNOWN: "unknown",
  });

export const DISCLOSURE =
  Object.freeze({
    PUBLIC: "public",
    PUBLIC_SUMMARY_ONLY:
      "public_summary_only",
  });

export const TEMPORAL_STATUS =
  Object.freeze({
    CURRENT: "current",
    HISTORICAL: "historical",
    PLANNED: "planned",
    IN_DEVELOPMENT: "in_development",
  });

export const COVERAGE_LEVEL =
  Object.freeze({
    ANSWERABLE: "answerable",
    PARTIALLY_ANSWERABLE:
      "partially_answerable",
    SAFE_REDIRECT: "safe_redirect",
    UNSUPPORTED: "unsupported",
  });

export const EVIDENCE_STRENGTH =
  Object.freeze({
    STRONG: "strong",
    MODERATE: "moderate",
    SUPPORTING: "supporting",
  });

export const EXPERIENCE_EVIDENCE =
  Object.freeze({
    PROFESSIONAL_CURRENT:
      "professional_current",

    PROFESSIONAL_HISTORICAL:
      "professional_historical",

    PROJECT_APPLIED:
      "project_applied",

    FORMAL_TRAINING:
      "formal_training",

    SELF_LEARNING:
      "self_learning",

    PUBLISHED_KNOWLEDGE:
      "published_knowledge",

    NO_EVIDENCE:
      "no_evidence",
  });

export const RELATION_TYPE =
  Object.freeze({
    USES: "uses",
    KNOWS: "knows",
    DEMONSTRATES: "demonstrates",
    SOLVES: "solves",
    SUPPORTS: "supports",
    RELATED_TO: "related_to",
    APPLIES_TO: "applies_to",
    PUBLISHED_ABOUT: "published_about",
    WORKED_IN: "worked_in",
    EVIDENCE_FOR: "evidence_for",
    RECOMMENDED_FOR: "recommended_for",
    REQUIRES: "requires",

    // Relaciones específicas que diseñamos
    // posteriormente para servicios/soluciones.
    ENABLES: "enables",
    ADDRESSES: "addresses",
    IMPLEMENTED_BY: "implemented_by",
    EXEMPLIFIED_BY: "exemplified_by",
    SUPPORTED_BY: "supported_by",
  });

export const PROJECT_STATUS =
  Object.freeze({
    PUBLISHED: "published",
    PROTOTYPE: "prototype",
    IN_DEVELOPMENT: "in_development",
    PLANNED: "planned",
  });

export const PROJECT_KIND =
  Object.freeze({
    PERSONAL: "personal",
    PORTFOLIO_DEMO: "portfolio_demo",
    PROFESSIONAL_PUBLIC:
      "professional_public",
    EDUCATIONAL: "educational",
    RESEARCH: "research",
  });

export const KNOWLEDGE_STATUS =
  Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    DRAFT: "draft",
  });

export const CERTIFICATION_STATUS =
  Object.freeze({
    PREPARING: "preparing",
    EARNED: "earned",
    EXPIRED: "expired",
    NOT_EARNED: "not_earned",
  });

export const ANSWER_EVIDENCE_MODE =
  Object.freeze({
    NEVER: "never",
    WHEN_USEFUL: "when_useful",
    ALWAYS: "always",
  });

export const ANSWER_DEPTH =
  Object.freeze({
    SHORT: "short",
    MEDIUM: "medium",
    DEEP: "deep",
  });

export const FACT_VALUE_TYPE =
  Object.freeze({
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    STRING_LIST: "string_list",
    NUMBER_LIST: "number_list",
  });

export const LIMITATION_TYPE =
  Object.freeze({
    NO_INFERENCE: "no_inference",
    QUALIFICATION: "qualification",
    SAFETY: "safety",
    COMMERCIAL: "commercial",
    TEMPORAL: "temporal",
  });