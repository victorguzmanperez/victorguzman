import { technologyKnowledge } from "../data/knowledge/technologies.js";

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

// Knowledge is the only vocabulary. Keep punctuation significant (C vs C++),
// match whole terms, and prefer the longest mention at overlapping positions.
export function resolveTechnologyMentions(text, catalog = technologyKnowledge) {
  if (typeof text !== "string") return [];
  const input = normalize(text);
  const matches = [];
  for (const item of catalog) {
    for (const term of new Set([item.title, ...(item.aliases ?? [])])) {
      if (typeof term !== "string" || !term.trim()) continue;
      const alias = normalize(term);
      let start = input.indexOf(alias);
      while (start !== -1) {
        const end = start + alias.length;
        const boundary = /[\p{L}\p{N}_+#]/u;
        if (!boundary.test(input[start - 1] ?? "") &&
            !boundary.test(input[end] ?? "")) {
          matches.push({ item, start, end });
        }
        start = input.indexOf(alias, start + 1);
      }
    }
  }
  matches.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const accepted = [];
  for (const match of matches) {
    if (!accepted.some(other => match.start < other.end && other.start < match.end)) {
      accepted.push(match);
    }
  }
  accepted.sort((a, b) => a.start - b.start);
  return [...new Map(accepted.map(({ item }) => [item.id, item])).values()];
}
