import { INTENT_IDS } from '../data/intents.js';
import { RESPONSE_KIND, RESPONSE_OUTCOME } from './response-contract.js';
const values=text=>new Set(text.split(' '));
// Values, as well as keys, are closed vocabularies. A name or phone can be a
// syntactically valid token, so token-shaped values alone are not sufficient.
export const analyticsValues={
  source:values('composer quick-reply action launcher header feedback reset navigation manual shell'),
  reset_source:values('header-reset feedback_complete header reset manual feedback feedback-complete feedback-submitted feedback-auto-close user user-confirmed reset-confirmation'),
  route:values('privacy commercial operational knowledge_overview contextual_benefit knowledge_direct problem_flow need_discovery social social_feedback confirmation fallback unsupported'),
  intent:new Set([...Object.values(INTENT_IDS),'technology','social','experience','unknown']),
  outcome:new Set(Object.values(RESPONSE_OUTCOME)), response_kind:new Set(Object.values(RESPONSE_KIND)),
  confidence_bucket:values('high medium low'), fallback_level:values('0 1 2 3 none clarify categories escalate'),
  page_id:values('home soluciones diagnostico apoya privacidad cookies costes auditoria-digital-cv investment modelo-evaluacion-competencias unknown'),
  page_type:values('home landing solutions diagnostic support legal project unknown'),
  interaction_type:values('intent answer navigate open-contact start-diagnostic open-calendly offer-feedback'),
  action_target:values('contact diagnostic booking feedback navigation'), feedback_rating:values('positive neutral negative'),
};
