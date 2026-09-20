import {
  KNOWLEDGE_TYPE,
} from "./knowledge/constants.js";

import {
  profileKnowledge,
} from "./knowledge/profile.js";

import {
  experienceKnowledge,
} from "./knowledge/experience.js";

import {
  technologyKnowledge,
} from "./knowledge/technologies.js";

import {
  capabilityKnowledge,
} from "./knowledge/capabilities.js";

import {
  educationKnowledge,
} from "./knowledge/education.js";

import {
  certificationKnowledge,
} from "./knowledge/certifications.js";

import {
  problemKnowledge,
} from "./knowledge/problems.js";

import {
  solutionKnowledge,
} from "./knowledge/solutions.js";

import {
  serviceKnowledge,
} from "./knowledge/services.js";

import {
  projectKnowledge,
} from "./knowledge/projects.js";

import {
  publicationKnowledge,
} from "./knowledge/publications.js";

import {
  diagnosticKnowledge,
} from "./knowledge/diagnostics.js";

import {
  contactKnowledge,
} from "./knowledge/contacts.js";

import {
  bookingKnowledge,
} from "./knowledge/bookings.js";

import {
  policyKnowledge,
} from "./knowledge/policies.js";

import {
  businessAreaKnowledge,
} from "./knowledge/business-areas.js";


/* ============================================================
 * EMPTY RESULT
 * ============================================================
 */

const EMPTY_RESULT =
  Object.freeze([]);


/* ============================================================
 * MATERIALIZED CATALOGS
 * ============================================================
 *
 * BUSINESS_AREA forma parte del modelo global,
 * pero todavía no dispone de catálogo propio.
 *
 * No se inventan registros para completar el enum.
 * ============================================================
 */

export const knowledgeCatalogsByType =
  Object.freeze({
    [KNOWLEDGE_TYPE.PROFILE]:
      profileKnowledge,

    [KNOWLEDGE_TYPE.EXPERIENCE]:
      experienceKnowledge,

    [KNOWLEDGE_TYPE.TECHNOLOGY]:
      technologyKnowledge,

    [KNOWLEDGE_TYPE.CAPABILITY]:
      capabilityKnowledge,

    [KNOWLEDGE_TYPE.SERVICE]:
      serviceKnowledge,

    [KNOWLEDGE_TYPE.PROBLEM]:
      problemKnowledge,

    [KNOWLEDGE_TYPE.SOLUTION]:
      solutionKnowledge,

    [KNOWLEDGE_TYPE.PROJECT]:
      projectKnowledge,

    [KNOWLEDGE_TYPE.BUSINESS_AREA]:
      businessAreaKnowledge,

    [KNOWLEDGE_TYPE.PUBLICATION]:
      publicationKnowledge,

    [KNOWLEDGE_TYPE.EDUCATION]:
      educationKnowledge,

    [KNOWLEDGE_TYPE.CERTIFICATION]:
      certificationKnowledge,

    [KNOWLEDGE_TYPE.DIAGNOSTIC]:
      diagnosticKnowledge,

    [KNOWLEDGE_TYPE.CONTACT]:
      contactKnowledge,

    [KNOWLEDGE_TYPE.BOOKING]:
      bookingKnowledge,

    [KNOWLEDGE_TYPE.POLICY]:
      policyKnowledge,
  });


/* ============================================================
 * GLOBAL CATALOG
 * ============================================================
 */

export const knowledgeItems =
  Object.freeze(
    Object.values(
      knowledgeCatalogsByType,
    ).flat(),
  );


/* ============================================================
 * ID INDEX
 * ============================================================
 */

function buildKnowledgeById() {
  const index = {};

  for (
    const item
    of knowledgeItems
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        index,
        item.id,
      )
    ) {
      throw new Error(
        `Duplicate global knowledge id: ${item.id}`,
      );
    }

    index[item.id] =
      item;
  }

  return Object.freeze(
    index,
  );
}


export const knowledgeById =
  buildKnowledgeById();


/* ============================================================
 * TYPE INDEX
 * ============================================================
 */

function buildKnowledgeByType() {
  const index = {};

  /*
   * Inicializamos TODOS los tipos canónicos,
   * incluso los todavía no materializados.
   */
  for (
    const type
    of Object.values(
      KNOWLEDGE_TYPE,
    )
  ) {
    index[type] = [];
  }


  for (
    const item
    of knowledgeItems
  ) {
    if (
      !Array.isArray(
        index[item.type],
      )
    ) {
      /*
       * Esto no debería ocurrir porque
       * validators.js ya restringe type.
       *
       * Aun así, el agregador nunca
       * crea un tipo implícitamente.
       */
      throw new Error(
        `Unknown global knowledge type: ${item.type}`,
      );
    }

    index[item.type].push(
      item,
    );
  }


  return Object.freeze(
    Object.fromEntries(
      Object.entries(
        index,
      ).map(
        ([
          type,
          items,
        ]) => [
          type,

          Object.freeze([
            ...items,
          ]),
        ],
      ),
    ),
  );
}


export const knowledgeByType =
  buildKnowledgeByType();


/* ============================================================
 * ALIAS NORMALIZATION
 * ============================================================
 */

export function normalizeKnowledgeAlias(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    /*
     * Conservamos +, # y .
     *
     * Es importante para no convertir
     * automáticamente C++ en C.
     */
    .replace(
      /[^a-z0-9+#.]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}


/* ============================================================
 * ALIAS INDEX
 * ============================================================
 *
 * El índice es:
 *
 * alias → KnowledgeItem[]
 *
 * NO:
 *
 * alias → KnowledgeItem
 *
 * porque distintos tipos pueden compartir
 * vocabulario y no debemos escoger uno
 * silenciosamente.
 * ============================================================
 */

function buildKnowledgeByAlias() {
  const index = {};

  for (
    const item
    of knowledgeItems
  ) {
    const candidates = [
      item.id,
      item.title,
      ...(
        item.aliases ??
        []
      ),
    ];


    for (
      const candidate
      of candidates
    ) {
      const alias =
        normalizeKnowledgeAlias(
          candidate,
        );

      if (!alias) {
        continue;
      }


      if (
        !Array.isArray(
          index[alias],
        )
      ) {
        index[alias] = [];
      }


      /*
       * Un mismo item puede tener título
       * y alias que normalicen igual.
       *
       * No lo duplicamos dentro del bucket.
       */
      if (
        !index[alias].some(
          (existing) =>
            existing.id ===
            item.id,
        )
      ) {
        index[alias].push(
          item,
        );
      }
    }
  }


  return Object.freeze(
    Object.fromEntries(
      Object.entries(
        index,
      ).map(
        ([
          alias,
          items,
        ]) => [
          alias,

          Object.freeze([
            ...items,
          ]),
        ],
      ),
    ),
  );
}


export const knowledgeByAlias =
  buildKnowledgeByAlias();


/* ============================================================
 * GLOBAL HELPERS — BY ID
 * ============================================================
 */

export function getKnowledgeById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    knowledgeById[id] ??
    null
  );
}


/* ============================================================
 * GLOBAL HELPERS — BY TYPE
 * ============================================================
 */

export function getKnowledgeByType(
  type,
) {
  if (
    typeof type !== "string" ||
    !type.trim()
  ) {
    return EMPTY_RESULT;
  }

  return (
    knowledgeByType[type] ??
    EMPTY_RESULT
  );
}


/* ============================================================
 * GLOBAL HELPERS — BY ALIAS
 * ============================================================
 */

export function getKnowledgeByAlias(
  alias,
  type = null,
) {
  const normalized =
    normalizeKnowledgeAlias(
      alias,
    );

  if (!normalized) {
    return EMPTY_RESULT;
  }

  const matches =
    knowledgeByAlias[
      normalized
    ] ?? EMPTY_RESULT;


  if (type === null) {
    return matches;
  }


  if (
    typeof type !== "string" ||
    !type.trim()
  ) {
    return EMPTY_RESULT;
  }


  return Object.freeze(
    matches.filter(
      (item) =>
        item.type === type,
    ),
  );
}


/* ============================================================
 * SAFE UNIQUE ALIAS RESOLUTION
 * ============================================================
 *
 * Solo devuelve un KnowledgeItem cuando
 * el alias identifica exactamente UNO.
 *
 * Si hay:
 *
 * 0 matches → null
 * 1 match   → item
 * 2+        → null
 *
 * De esta forma la ambigüedad nunca se
 * resuelve inventando prioridad.
 * ============================================================
 */

export function resolveKnowledgeAlias(
  alias,
  type = null,
) {
  const matches =
    getKnowledgeByAlias(
      alias,
      type,
    );

  return (
    matches.length === 1
      ? matches[0]
      : null
  );
}


/* ============================================================
 * GLOBAL FACT HELPER
 * ============================================================
 */

export function getKnowledgeFact(
  item,
  key,
) {
  if (
    !item ||
    !Array.isArray(
      item.facts,
    ) ||
    typeof key !== "string" ||
    !key.trim()
  ) {
    return null;
  }

  return (
    item.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}


/* ============================================================
 * GLOBAL STATS
 * ============================================================
 */

const statsByType =
  Object.freeze(
    Object.fromEntries(
      Object.values(
        KNOWLEDGE_TYPE,
      ).map(
        (type) => [
          type,

          knowledgeByType[
            type
          ]?.length ?? 0,
        ],
      ),
    ),
  );


export const knowledgeStats =
  Object.freeze({
    total:
      knowledgeItems.length,

    byType:
      statsByType,

    materializedTypes:
      Object.freeze(
        Object.entries(
          statsByType,
        )
          .filter(
            ([
              ,
              count,
            ]) =>
              count > 0,
          )
          .map(
            ([
              type,
            ]) =>
              type,
          ),
      ),

    emptyTypes:
      Object.freeze(
        Object.entries(
          statsByType,
        )
          .filter(
            ([
              ,
              count,
            ]) =>
              count === 0,
          )
          .map(
            ([
              type,
            ]) =>
              type,
          ),
      ),
  });