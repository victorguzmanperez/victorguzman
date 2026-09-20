import { conversationStateFromMessages, interpretConversationTurn, updateConversationV2 } from './conversational-state-v2.js?v=conv-h3.22.2';
import { composeNaturalResponse } from './natural-response-composer.js?v=conv-h3.22.2';

export function decideConversationPlan(state, turn, messages = []) {
  const f = state.knownFacts;
  const previous = messages.filter(m => m.role === 'assistant').at(-1);
  const asked = key => messages.some(m => m.role === 'assistant' && m.responseId === `response-v2-${key}`);
  const noCaseOrientationCount = messages.filter(
    m => m.role === 'assistant' && /^response-v2-orientation-/.test(m.responseId ?? ''),
  ).length;
  if (turn.intent === 'CLARIFY' && !state.currentGoal) {
    const refusal = /no te lo puedo decir|no puedo decir|prefiero no|no quiero decir/.test(turn.n);
    return {
      action: 'ORIENT_WITHOUT_CASE',
      variant: refusal ? 'refusal' : noCaseOrientationCount === 0 ? 'first' : noCaseOrientationCount === 1 ? 'second' : 'open',
    };
  }
  if (/como (?:seguimos|lo hacemos|procedemos)|siguiente paso|que hacemos ahora|y ahora que/.test(turn.n)) return { action: 'HANDOFF' };
  if (/^[¿]?(?:y eso|por que)[?]?$/.test(turn.n) && f.duplicates) return { action: 'ANSWER', explainDuplicates: true };
  if (turn.intent === 'HANDOFF') return { action: 'HANDOFF' };
  if (turn.knowledge && /parecido|similar/.test(turn.n)) return { action: 'ANSWER', evidence: true };
  if (turn.intent === 'RECAP') return { action: 'ANSWER', recap: true };
  if (turn.intent === 'CLARIFY') {
    if (state.currentGoal && previous?.responseId === 'response-v2-operation') {
      return { action: 'CLARIFY', question: 'operation_retry' };
    }
    if (state.currentGoal && previous?.responseId === 'response-v2-operation_retry') {
      return { action: 'CLARIFY', question: 'case_goal' };
    }
    return { action: 'CLARIFY', question: 'examples', variant: state.conversationProgress % 2 };
  }
  if (/necesito ayuda/.test(turn.n) && !f.tools.length) return { action: 'CLARIFY', question: 'welcome' };
  if (/desastre|fatal|mal/.test(turn.n) && !f.operation) return { action: 'CLARIFY', question: 'symptom' };
  if (turn.correction && /funciona bien|no es el problema/.test(turn.n)) return { action: 'CORRECT_HYPOTHESIS', question: f.operation ? 'transforms' : 'operation' };
  if (turn.intent === 'PROVIDE_VALUE' || state.informationSufficiency) {
    const question = f.source && !asked('transforms') ? 'transforms' : (f.multipleSources || f.sources || f.tools.some(t => ['Excel', 'CSV'].includes(t))) && !f.structure && !asked('structure') ? 'structure' : !f.operation && !asked('operation') ? 'operation' : !f.controls && !asked('controls') ? 'controls' : null;
    return { action: 'PROVIDE_VALUE', question, alreadyProvided: messages.some(m => m.role === 'assistant' && /Una primera solución|Empezaría con una muestra/.test(m.text)), detail: /como|ver como/.test(turn.n) || asked('structure') };
  }
  if (turn.intent === 'RESUME_TOPIC') return { action: 'RESUME_TOPIC', question: f.operation ? 'transforms' : 'operation' };
  if (f.errors && !f.operation) return { action: 'REPLAN', question: 'error' };
  if (f.structure === 'different') return { action: 'PROVIDE_VALUE', detail: true, question: 'controls' };
  if (f.source) return { action: 'REPLAN', question: 'transforms' };
  if (f.operation) return { action: 'REPLAN', question: f.operation === 'consolidate' && !f.structure ? 'structure' : !f.frequency ? 'frequency' : 'transforms' };
  if (f.multipleSources || f.sources || f.tools.includes('CSV')) return { action: 'REPLAN', question: previous?.responseId === 'response-v2-operation' ? 'example' : 'operation' };
  const question = previous?.responseId === 'response-v2-operation' ? 'example' : 'operation';
  return { action: 'ACKNOWLEDGE_AND_ASK', question };
}

export function planConversationV2(text, context = {}) {
  const messages = context.recentMessages ?? [];
  const previous = context.conversationalState ?? conversationStateFromMessages(messages);
  const turn = interpretConversationTurn(text, previous);
  const state = updateConversationV2(previous, turn);
  const lastAssistant = messages.filter(m => m.role === 'assistant').at(-1);
  // Specialized domains keep their established composers, with the same final critic/gate.
  const specialized = /\b(?:pdf|ocr|scoring|pesos|modelo de puntuacion|inteligencia artificial|ia)\b/;
  if (specialized.test(turn.n) || (!/response-v2-/.test(lastAssistant?.responseId ?? '') && messages.some(m => m.role === 'user' && specialized.test(m.text.toLowerCase())))) return null;
  if (/^(?:[¿]?y eso[?]?|[¿]?por que[?]?)$/.test(turn.n) && !state.knownFacts.duplicates) return null;
  if (/^(?:gracias|no[,]? gracias|[1-5])[.! ]*$/.test(turn.n)) return null;
  if (/^(?:la )?(?:primera|segunda|tercera)$/.test(turn.n) && lastAssistant?.responseId === 'response-v2-operation') {
    state.knownFacts.operation = /primera/.test(turn.n) ? 'consolidate' : /segunda/.test(turn.n) ? 'prepare' : 'validate';
  }

  if (turn.intent === 'CLOSE' || turn.intent === 'TOPIC_SWITCH' || turn.scope) return null;
  if (turn.knowledge && !/parecido|similar/.test(turn.n)) return null;
  if (turn.intent === 'HANDOFF') return null; // operational composer + final gate
  if (lastAssistant && /response-(?:continuation|problem|flow|discovery)-/.test(lastAssistant.responseId ?? '') && !messages.some(m => /response-v2-/.test(m.responseId ?? '')) && !/necesito ayuda/.test(turn.n)) return null;
  const dataCase = state.knownFacts.tools.some(t => ['Excel', 'Access', 'Power BI', 'Power Query', 'CSV', 'SQL'].includes(t)) || /datos|informes|necesito ayuda/.test(turn.n) || !!previous.currentGoal;
  // A short/uncertain reply may enter the V2 planner without a case only to
  // provide neutral orientation. It must not turn a previous V2 response into
  // evidence that a data/reporting case exists.
  const socialUncertainty = turn.intent === 'CLARIFY' && !turn.caseStart && !previous.currentGoal;
  if (!dataCase && !socialUncertainty) return null;
  if (!turn.isCase && !socialUncertainty && !turn.knowledge) return null;
  const plan = decideConversationPlan(state, turn, messages);
  return { state, turn, plan, route: turn.knowledge ? 'knowledge' : 'problem_flow', response: composeNaturalResponse(plan, state, turn) };
}
