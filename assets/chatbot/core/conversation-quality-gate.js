import { createResponseEnvelope } from './response-contract.js';
import { createAnswerQuickReply, createDiagnosticAction, createContactAction, createCalendlyAction } from './response-interactions.js';
import { composeNaturalResponse, entryOptions } from './natural-response-composer.js?v=conv-h3.22.2';
import { planConversationV2 } from './conversation-planner-v2.js?v=conv-h3.22.2';
import { conversationStateFromMessages, interpretConversationTurn, updateConversationV2 } from './conversational-state-v2.js?v=conv-h3.22.2';

const reviews = new WeakMap();
export const getConversationReview = response => reviews.get(response) ?? null;
export const roboticLanguage = /lo guardo|ese dato ayuda|no responde|no quiero fingir|todavía me falta saber|necesitamos resolver para avanzar/i;
const visibleText = response => (response?.messages ?? []).map(m => m.text ?? '').join(' ');
export function critiqueConversation(response, { state, turn, plan, messages = [] } = {}) {
  const text = visibleText(response), reasons = [];
  if (!text.trim()) reasons.push('EMPTY_RESPONSE');
  if (roboticLanguage.test(text)) reasons.push('INTERNAL_LANGUAGE');
  const last = messages.filter(m => m.role === 'assistant').at(-1);
  if (last?.text === text) reasons.push('REPEATED_RESPONSE');
  if (plan && state?.informationSufficiency && plan.action !== 'PROVIDE_VALUE' && !['ANSWER', 'CORRECT_HYPOTHESIS', 'CLARIFY', 'HANDOFF'].includes(plan.action)) reasons.push('VALUE_BEFORE_QUESTION');
  if (turn?.intent === 'PROVIDE_VALUE' && !/automatiz|transform|valid|muestra/i.test(text)) reasons.push('UNANSWERED_REQUEST');
  for (const tool of state?.knownFacts.healthyTools ?? []) if (text.includes(`${tool} es el problema`)) reasons.push('CONTRADICTS_CORRECTION');
  if (plan?.question && state?.knownFacts[plan.question]) reasons.push('QUESTION_ALREADY_ANSWERED');
  return { pass: reasons.length === 0, repairReasons: [...new Set(reasons)] };
}
export function ensureInteractionCompleteness(response, { explicitContact = false, terminal = false } = {}) {
  if (!response || terminal) return response;
  let actions = [...(response.actions ?? [])];
  if (explicitContact) actions = [createContactAction({ id: 'v2-contact', label: 'Contactar con Víctor' }), createDiagnosticAction({ id: 'v2-diagnostic', label: 'Completar diagnóstico', priority: 'secondary' }), createCalendlyAction({ id: 'v2-meeting', label: 'Reservar reunión', priority: 'secondary' })];
  else if (!actions.some(a => a.type === 'start-diagnostic')) {
    const diagnostic = createDiagnosticAction({ id: 'v2-diagnostic', label: 'Completar diagnóstico', priority: 'secondary' });
    if (!actions.some(a => a.target === diagnostic.target)) actions = [...actions.slice(0, 2), diagnostic];
  }
  let replies = response.quickReplies ?? [];
  if (!replies.length && !explicitContact) replies = entryOptions.map((label, i) => createAnswerQuickReply({ id: `v2-continue-${i}`, label, answer: label }));
  return createResponseEnvelope({ ...response, quickReplies: replies, actions });
}
export function finalizeConversationResponse(response, text, context = {}) {
  if (!response) return response;
  const previous = context.conversationalState ?? conversationStateFromMessages(context.recentMessages);
  const turn = interpretConversationTurn(text, previous);
  const state = updateConversationV2(previous, turn);
  const planned = planConversationV2(text, context);
  const terminal = turn.intent === 'CLOSE' || ['closing', 'closed', 'feedback'].includes(response.conversation?.stage);
  let reviewContext = { state, turn, plan: planned?.plan, messages: context.recentMessages };
  const review = critiqueConversation(response, reviewContext);
  let result = response;
  if (!review.pass && planned) {
    // One repair pass; no recursive critic/composer cycle.
    const repairPlan = { ...planned.plan };
    if (review.repairReasons.includes('REPEATED_RESPONSE')) repairPlan.question = planned.plan.question === 'example' ? 'examples' : 'example';
    if (review.repairReasons.includes('VALUE_BEFORE_QUESTION')) repairPlan.action = 'PROVIDE_VALUE';
    if (review.repairReasons.includes('QUESTION_ALREADY_ANSWERED')) repairPlan.question = null;
    reviewContext = { ...reviewContext, plan: repairPlan };
    result = composeNaturalResponse(repairPlan, planned.state, planned.turn, { repair: true });
  } else if (!review.pass && roboticLanguage.test(visibleText(result))) {
    result = createResponseEnvelope({ ...result, messages: result.messages.map(m => ({ ...m, text: m.text?.replace(/[^.!?]*(?:lo guardo|ese dato ayuda|no responde|no quiero fingir|todavía me falta saber|necesitamos resolver para avanzar)[^.!?]*[.!]?/gi, '').trim() || 'Podemos verlo con un ejemplo concreto.' })) });
  }
  let finalReview = critiqueConversation(result, reviewContext);
  if (!finalReview.pass && planned) {
    // A failed repair never leaks the rejected draft. Use a bounded, grounded
    // value response with no further discovery question.
    const safePlan = { action: 'PROVIDE_VALUE', detail: true };
    result = composeNaturalResponse(safePlan, planned.state, planned.turn);
    reviewContext = { ...reviewContext, plan: safePlan };
    finalReview = critiqueConversation(result, reviewContext);
    if (!finalReview.pass && finalReview.repairReasons.every(reason => reason === 'REPEATED_RESPONSE')) {
      result = createResponseEnvelope({ ...result, messages: result.messages.map((m, i) => i ? m : { ...m, text: 'Podemos concretarlo con una muestra de tus datos. ' + m.text }) });
      finalReview = critiqueConversation(result, reviewContext);
    }
  }
  // Name is voluntary, never an unsolicited opening question.
  if (result.followUp?.key === 'name') result = createResponseEnvelope({ ...result, followUp: null, stateEffects: { ...result.stateEffects, markNameAsked: false } });
  const completed = ensureInteractionCompleteness(result, { explicitContact: turn.intent === 'HANDOFF', terminal });
  reviews.set(completed, { initial: review, final: finalReview, repairCount: review.pass ? 0 : 1 });
  return completed;
}
