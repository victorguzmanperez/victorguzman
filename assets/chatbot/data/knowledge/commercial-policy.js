import {
  getServiceById,
} from "./services.js";


export const COMMERCIAL_CLAIM =
  Object.freeze({
    SERVICE_FIT:
      "service_fit",

    FEASIBILITY:
      "feasibility",

    PRICE:
      "price",

    TIMELINE:
      "timeline",

    AVAILABILITY:
      "availability",

    ACCEPTANCE:
      "acceptance",

    RESULT:
      "result",

    ROI:
      "roi",
  });


export const COMMERCIAL_DECISION =
  Object.freeze({
    QUALIFY:
      "qualify",

    REDIRECT:
      "redirect",

    BLOCK:
      "block",
  });


const FORBIDDEN_BY_CLAIM =
  Object.freeze({
    [COMMERCIAL_CLAIM.SERVICE_FIT]:
      "automatic-service-fit",

    [COMMERCIAL_CLAIM.FEASIBILITY]:
      "guaranteed-feasibility",

    [COMMERCIAL_CLAIM.PRICE]:
      "automatic-price",

    [COMMERCIAL_CLAIM.TIMELINE]:
      "automatic-deadline",

    [COMMERCIAL_CLAIM.AVAILABILITY]:
      "automatic-availability",

    [COMMERCIAL_CLAIM.ACCEPTANCE]:
      "guaranteed-acceptance",

    [COMMERCIAL_CLAIM.RESULT]:
      "guaranteed-result",

    [COMMERCIAL_CLAIM.ROI]:
      "guaranteed-roi",
  });


export const REQUIRED_SERVICE_FORBIDDEN_CLAIMS =
  Object.freeze(
    Object.values(
      FORBIDDEN_BY_CLAIM,
    ),
  );


export const PROHIBITED_COMMERCIAL_FACT_KEYS =
  Object.freeze([
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

    "timeline",
    "deadline",
    "duration",
    "availability",
    "sla",

    "guaranteed-result",
    "guaranteed-roi",
  ]);


export function findUnsafeCommercialFacts(
  service,
) {
  if (
    !service ||
    !Array.isArray(
      service.facts,
    )
  ) {
    return [];
  }

  return service.facts.filter(
    (fact) =>
      PROHIBITED_COMMERCIAL_FACT_KEYS
        .includes(
          fact.key,
        ),
  );
}


export function servicePassesCommercialSafety(
  service,
) {
  if (!service) {
    return false;
  }

  const forbiddenClaims =
    service.answerPolicy
      ?.forbiddenClaims ?? [];

  const hasAllGuards =
    REQUIRED_SERVICE_FORBIDDEN_CLAIMS
      .every(
        (claim) =>
          forbiddenClaims.includes(
            claim,
          ),
      );

  return (
    hasAllGuards &&
    findUnsafeCommercialFacts(
      service,
    ).length === 0 &&
    service.answerPolicy
      ?.allowInference === false
  );
}


export function assessCommercialClaim(
  serviceId,
  claim,
) {
  const service =
    getServiceById(
      serviceId,
    );

  if (!service) {
    return Object.freeze({
      allowed: false,

      decision:
        COMMERCIAL_DECISION.BLOCK,

      reason:
        "unknown-service",

      action:
        "no-commercial-claim",
    });
  }

  const forbiddenClaim =
    FORBIDDEN_BY_CLAIM[
      claim
    ];

  if (!forbiddenClaim) {
    return Object.freeze({
      allowed: false,

      decision:
        COMMERCIAL_DECISION.BLOCK,

      reason:
        "unknown-commercial-claim",

      action:
        "no-commercial-claim",
    });
  }

  const diagnosticClaims =
    new Set([
      COMMERCIAL_CLAIM
        .SERVICE_FIT,

      COMMERCIAL_CLAIM
        .FEASIBILITY,

      COMMERCIAL_CLAIM
        .RESULT,

      COMMERCIAL_CLAIM
        .ROI,
    ]);

  return Object.freeze({
    /*
     * V1 nunca autoriza una promesa
     * comercial automática.
     */
    allowed: false,

    decision:
      diagnosticClaims.has(
        claim,
      )
        ? COMMERCIAL_DECISION
            .QUALIFY
        : COMMERCIAL_DECISION
            .REDIRECT,

    reason:
      forbiddenClaim,

    action:
      diagnosticClaims.has(
        claim,
      )
        ? "start-diagnostic"
        : "open-contact",
  });
}