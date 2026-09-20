import {
  adaptAllKnowledgeToEvidence,
} from "./evidence-adapters.js";


export const evidenceIndex =
  Object.freeze(
    adaptAllKnowledgeToEvidence(),
  );


export const evidenceIndexById =
  Object.freeze(
    Object.fromEntries(
      evidenceIndex.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export const evidenceIndexByKnowledgeId =
  Object.freeze(
    Object.fromEntries(
      evidenceIndex.map(
        (item) => [
          item.knowledgeId,
          item,
        ],
      ),
    ),
  );


export function getEvidenceById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    evidenceIndexById[id] ??
    null
  );
}


export function getEvidenceByKnowledgeId(
  knowledgeId,
) {
  if (
    typeof knowledgeId !==
      "string" ||
    !knowledgeId.trim()
  ) {
    return null;
  }

  return (
    evidenceIndexByKnowledgeId[
      knowledgeId
    ] ?? null
  );
}


export function getEvidenceByKind(
  kind,
) {
  if (
    typeof kind !== "string" ||
    !kind.trim()
  ) {
    return [];
  }

  return evidenceIndex.filter(
    (item) =>
      item.kind === kind,
  );
}