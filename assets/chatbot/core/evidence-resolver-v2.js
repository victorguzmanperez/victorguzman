import { evidenceIndex } from '../data/knowledge/evidence-index.js';
import { normalizeTurn } from './turn-interpreter.js';

export const EVIDENCE_LEVEL = Object.freeze({ EXACT_CASE: 'EXACT_CASE', PROFESSIONAL: 'RELATED_PROFESSIONAL_EXPERIENCE', PROJECT: 'RELATED_PROJECT', CAPABILITY: 'RELATED_CAPABILITY', TRAINING: 'TRAINING_ONLY', NONE: 'NO_EVIDENCE' });
// Exact identity must be supplied explicitly; overlap in tools never proves it.
export function resolveRelatedEvidence({ tools = [], exactCaseId = null } = {}, index = evidenceIndex) {
  if (exactCaseId) {
    const exact = index.find(e => e.knowledgeId === exactCaseId && e.kind === 'project');
    if (exact) return { level: EVIDENCE_LEVEL.EXACT_CASE, records: [exact] };
  }
  const ids = tools.map(t => `technology-${normalizeTurn(t).replace(/\s+/g, '-')}`);
  const matches = index.filter(e => ids.includes(e.knowledgeId));
  const professional = matches.filter(e => e.metadata?.currentProfessional || e.metadata?.historicalProfessional);
  if (professional.length) return { level: EVIDENCE_LEVEL.PROFESSIONAL, records: professional };
  const project = index.filter(e => e.kind === 'project' && e.technologies?.some(id => ids.includes(id)));
  if (project.length) return { level: EVIDENCE_LEVEL.PROJECT, records: project.slice(0, 2) };
  const capability = index.filter(e => e.kind === 'capability' && e.technologies?.some(id => ids.includes(id)));
  if (capability.length) return { level: EVIDENCE_LEVEL.CAPABILITY, records: capability.slice(0, 2) };
  return { level: matches.length ? EVIDENCE_LEVEL.TRAINING : EVIDENCE_LEVEL.NONE, records: matches };
}
