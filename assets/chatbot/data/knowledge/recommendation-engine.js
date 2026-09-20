import {
  KNOWLEDGE_STATUS,
  RELATION_TYPE,
} from "./constants.js";

import {
  getProblemById,
} from "./problems.js";

import {
  getSolutionsByProblemId,
} from "./solutions.js";

import {
  getServiceById,
  getServiceFact,
} from "./services.js";


export const RECOMMENDATION_MODE =
  Object.freeze({
    UNSUPPORTED:
      "unsupported",

    SOLUTION_ONLY:
      "solution_only",

    QUALIFIED_SERVICE:
      "qualified_service",
  });


function isRecommendable(
  item,
) {
  return Boolean(
    item &&
    item.status ===
      KNOWLEDGE_STATUS.ACTIVE &&
    item.coverage
      ?.canRecommend === true &&
    item.answerPolicy
      ?.allowRecommendation === true,
  );
}


function getImplementedServiceIds(
  solution,
) {
  return solution.relationships
    .filter(
      (relationship) =>
        relationship.type ===
          RELATION_TYPE.IMPLEMENTED_BY,
    )
    .map(
      (relationship) =>
        relationship.target,
    );
}


function getEvidenceRelations(
  service,
) {
  return service.relationships.filter(
    (relationship) =>
      relationship.type ===
        RELATION_TYPE.SUPPORTED_BY ||
      relationship.type ===
        RELATION_TYPE.EXEMPLIFIED_BY,
  );
}


export function recommendForProblem(
  problemId,
) {
  const problem =
    getProblemById(
      problemId,
    );

  if (!problem) {
    return Object.freeze({
      problemId: null,
      mode:
        RECOMMENDATION_MODE
          .UNSUPPORTED,
      solutions:
        Object.freeze([]),
      services:
        Object.freeze([]),
      requiresQualification:
        false,
      canPromise:
        false,
    });
  }

  const solutions =
    getSolutionsByProblemId(
      problemId,
    ).filter(
      isRecommendable,
    );

  const servicesById =
    new Map();

  for (
    const solution
    of solutions
  ) {
    const serviceIds =
      getImplementedServiceIds(
        solution,
      );

    for (
      const serviceId
      of serviceIds
    ) {
      const service =
        getServiceById(
          serviceId,
        );

      if (
        !isRecommendable(
          service,
        )
      ) {
        continue;
      }

      const evidenceRelations =
        getEvidenceRelations(
          service,
        );

      /*
       * Un Service sin respaldo explícito
       * no entra en recomendaciones.
       */
      if (
        evidenceRelations.length ===
        0
      ) {
        continue;
      }

      if (
        !servicesById.has(
          service.id,
        )
      ) {
        servicesById.set(
          service.id,
          {
            id:
              service.id,

            title:
              service.title,

            viaSolutionIds:
              [],

            evidenceTargets:
              evidenceRelations.map(
                (relationship) =>
                  relationship.target,
              ),

            fitConditions:
              getServiceFact(
                service,
                "fit-conditions",
              )?.value ?? [],

            discoveryQuestions:
              getServiceFact(
                service,
                "discovery-questions",
              )?.value ?? [],
          },
        );
      }

      servicesById
        .get(service.id)
        .viaSolutionIds
        .push(
          solution.id,
        );
    }
  }

  const serviceCandidates =
    [...servicesById.values()]
      .map(
        (service) =>
          Object.freeze({
            ...service,

            viaSolutionIds:
              Object.freeze([
                ...service
                  .viaSolutionIds,
              ]),

            evidenceTargets:
              Object.freeze([
                ...service
                  .evidenceTargets,
              ]),

            fitConditions:
              Object.freeze([
                ...service
                  .fitConditions,
              ]),

            discoveryQuestions:
              Object.freeze([
                ...service
                  .discoveryQuestions,
              ]),
          }),
      );

  return Object.freeze({
    problemId:
      problem.id,

    mode:
      serviceCandidates.length > 0
        ? RECOMMENDATION_MODE
            .QUALIFIED_SERVICE
        : solutions.length > 0
          ? RECOMMENDATION_MODE
              .SOLUTION_ONLY
          : RECOMMENDATION_MODE
              .UNSUPPORTED,

    solutions:
      Object.freeze(
        solutions.map(
          (solution) =>
            solution.id,
        ),
      ),

    services:
      Object.freeze(
        serviceCandidates,
      ),

    /*
     * Un Service relacionado nunca
     * equivale a encaje automático.
     */
    requiresQualification:
      serviceCandidates.length > 0,

    canPromise:
      false,
  });
}