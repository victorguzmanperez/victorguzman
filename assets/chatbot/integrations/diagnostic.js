/**
 * Diagnostic integration facade.
 *
 * The canonical diagnostic definition lives in data/knowledge/diagnostics.js.
 * Navigation/submission behaviour is handled by the Action Router and the
 * diagnostic page; this file intentionally contains no duplicate business
 * rules.
 */
export {
  diagnosticKnowledge,
  diagnosticKnowledgeById,
  getDiagnosticById,
  getDiagnosticFact,
} from "../data/knowledge/diagnostics.js";
