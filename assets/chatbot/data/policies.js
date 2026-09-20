/**
 * Public data facade for chatbot policies.
 *
 * The canonical policy records live in data/knowledge/policies.js so there is
 * a single source of truth for privacy, analytics and transcript behaviour.
 */
export {
  policyKnowledge,
  policyKnowledgeById,
  getPolicyById,
  getPolicyFact,
} from "./knowledge/policies.js";
