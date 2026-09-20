import test from 'node:test';
import assert from 'node:assert/strict';

import { processDialogueTurn } from '../core/dialogue-manager.js';
import { resetConversation, resetState } from '../core/state.js';
import {
  ANSWER_ALIGNMENT,
  PENDING_QUESTION_KIND,
  classifyAnswerToPendingQuestion,
} from '../core/conversation-alignment.js';

const text = result => (result.response.messages ?? []).map(message => message.text).join(' ');
const quickReplies = result => (result.response.quickReplies ?? []).map(reply => reply.label);
const actions = result => (result.response.actions ?? []).map(action => action.label);

function turn(userText) {
  const result = processDialogueTurn({ userText });
  assert.ok(result?.response?.messages?.some(message => message.text), `No visible response for: ${userText}`);
  return result;
}

function assertNoFallback(results) {
  for (const result of results) assert.notEqual(result.decision.route, 'fallback');
}

test('CONV-H3.11 answer classifier distinguishes complete, partial, side, unknown, refusal and incomprehensible', () => {
  const pending = { kind: PENDING_QUESTION_KIND.BOTTLENECK };
  assert.equal(classifyAnswerToPendingQuestion('preparar los informes', pending).relation, ANSWER_ALIGNMENT.COMPLETE);
  assert.equal(classifyAnswerToPendingQuestion('cada mes', pending).relation, ANSWER_ALIGNMENT.PARTIAL);
  assert.equal(classifyAnswerToPendingQuestion('usamos Excel y Power BI', pending).relation, ANSWER_ALIGNMENT.SIDE_INFORMATION);
  assert.equal(classifyAnswerToPendingQuestion('no lo sé', pending).relation, ANSWER_ALIGNMENT.UNKNOWN);
  assert.equal(classifyAnswerToPendingQuestion('prefiero no responder', pending).relation, ANSWER_ALIGNMENT.REFUSAL);
  assert.equal(classifyAnswerToPendingQuestion('xyz', pending).relation, ANSWER_ALIGNMENT.INCOMPREHENSIBLE);
});

// H3.16–H3.22 supersede the pending-question obligation and CTA suppression.
// Keep the classifier unit coverage; assert conversation semantics independently.
const diagnostic = r => assert.deepEqual(actions(r), ['Completar diagnóstico']);
const state = r => r.decision.metadata.conversationalState;
test('H3 tools add facts without fabricating an answered operation',()=>{resetState();turn('Tengo un problema con los informes de mi empresa');const r=turn('Los hacemos con Excel y Power BI');diagnostic(r);assert.deepEqual(state(r).knownFacts.tools,['Excel','Power BI']);assert.equal(state(r).knownFacts.operation,undefined);assert.doesNotMatch(text(r),/no responde|lo guardo/);});
test('H3 monthly preparation supplies value before another question',()=>{resetState();turn('Tengo un problema con los informes de mi empresa');const r=turn('Tardamos mucho todos los meses en prepararlos');diagnostic(r);assert.equal(state(r).knownFacts.frequency,'monthly');assert.match(text(r),/solución|transformaciones/);});
test('H3 partial time does not invent the operation',()=>{resetState();turn('Tengo un problema con los informes de mi empresa');const r=turn('Cada mes alguien tarda dos días');diagnostic(r);assert.equal(state(r).knownFacts.operation,undefined);assert.match(text(r),/2 días/);});
test('H3 short ambiguous replies retain clickable help without inventing facts',()=>{for(const userText of ['sí','no','más o menos','no lo sé','depende','creo que sí','ninguna','las dos','eso','exacto','también']){resetState();turn('Tengo un problema con los informes de mi empresa');const r=turn(userText);diagnostic(r);assert.equal(state(r).knownFacts.operation,undefined);assert.ok(quickReplies(r).length);}});
test('H3 contextual ordinal resolves an offered operation',()=>{resetState();turn('Tengo un problema con los informes de mi empresa');const r=turn('la primera');assert.equal(state(r).knownFacts.operation,'consolidate');diagnostic(r);});
test('H3 healthy Power BI correction survives subsequent source information',()=>{resetState();['Tenemos Power BI','pero es un desastre','no, Power BI funciona bien','el problema es preparar los datos'].forEach(turn);const r=turn('vienen de Access');assert.deepEqual(state(r).knownFacts.healthyTools,['Power BI']);assert.equal(state(r).knownFacts.source,'Access');assert.match(text(r),/antes de cargarlos/);diagnostic(r);});
test('H3 quality evidence replans instead of ignoring errors',()=>{resetState();turn('Tengo un problema con unos informes');turn('Usamos Excel');const r=turn('A veces no cuadran');assert.equal(state(r).knownFacts.errors,true);assert.match(text(r),/diferencias|errores/);});
test('H3 related professional evidence survives a knowledge detour',()=>{resetState();turn('Tengo un problema con unos informes');turn('Usamos Excel');const e=turn('¿Víctor ha hecho algo parecido?');assert.match(text(e),/experiencia profesional.*Excel/);turn('¿Y sabe Power BI?');const r=turn('Bueno, volvamos a lo mío');assert.deepEqual(state(r).knownFacts.tools,['Excel']);assert.match(text(r),/Volvamos a tu caso/);});
test('H3 fragmentary data answers automation request directly',()=>{resetState();const r=['Necesito ayuda','con unos datos','son bastantes','no sé exactamente','están en varios Excel','y algún CSV','cada semana hago lo mismo','¿se podría automatizar?'].map(turn);assertNoFallback(r);r.forEach(diagnostic);assert.match(text(r.at(-1)),/^Sí.*automatizar/);assert.match(text(r.at(-1)),/Excel y CSV/);});
test('H3 repeated uncertainty changes strategy and keeps options',()=>{resetState();const r=['Tengo un problema con los informes de mi empresa','no lo sé','depende','más o menos'].map(turn);r.forEach(diagnostic);assert.notEqual(text(r[1]),text(r[2]));assert.ok(quickReplies(r.at(-1)).length>=4);});
test('H3 diagnosis is available before qualification and value follows sufficient facts',()=>{resetState();const r=['Tengo un problema con los informes de mi empresa','Los hacemos con Excel y Power BI','Tardamos mucho todos los meses en prepararlos','Preparamos y revisamos los datos a mano'].map(turn);r.forEach(diagnostic);assert.equal(state(r.at(-1)).informationSufficiency,true);assert.match(text(r.at(-1)),/muestra|validar|transformaciones/);});
test('H3 solution follow-up returns an actionable approach',()=>{resetState();['Tengo un problema con los informes de mi empresa','Tardamos mucho cada mes en prepararlos','Preparamos y revisamos los datos a mano'].forEach(turn);const r=turn('¿Qué podríamos hacer?');diagnostic(r);assert.match(text(r),/transformaciones|validar|automatizar/);});
test('H3 vague acknowledgement never invents a delivery channel',()=>{resetState();['Tengo un problema con unos informes','Usamos Power BI'].forEach(turn);const r=turn('más o menos');assert.equal(state(r).knownFacts.channel,undefined);diagnostic(r);const next=turn('Por correo');assert.equal(state(next).knownFacts.channel,'correo');});

test('H3.22 case 5 short replies without an active case stay neutral and do not loop',()=>{
  resetState();
  const results=['Hola','Sí','No','más o menos'].map(turn);
  const assistantTexts=results.slice(1).map(text);
  assertNoFallback(results);
  for(const result of results.slice(1)){
    const s=state(result);
    assert.equal(s.currentGoal,null);
    assert.equal(s.activeTopic,null);
    assert.deepEqual(s.knownFacts,{tools:[],healthyTools:[]});
    assert.doesNotMatch(text(result),/prepar(?:ar|asteis).*informe|proceso de datos|trabajo manual|reunir los archivos|preparar los datos|revisar el resultado/i);
    assert.doesNotMatch(text(result),/como te llamas|cual es tu nombre|dime tu nombre/i);
    assert.deepEqual(quickReplies(result),['Conocer a Víctor','Ver proyectos','Ver servicios','Tengo un problema']);
  }
  assert.equal(new Set(assistantTexts).size,assistantTexts.length);
});

test('H3.22 case 6 uncertainty and refusal without an active case change strategy and respect refusal',()=>{
  resetState();
  const results=['Hola','No lo sé','Ni idea','Eso no te lo puedo decir'].map(turn);
  const assistantTexts=results.slice(1).map(text);
  assertNoFallback(results);
  for(const result of results.slice(1)){
    const s=state(result);
    assert.equal(s.currentGoal,null);
    assert.equal(s.activeTopic,null);
    assert.deepEqual(s.knownFacts,{tools:[],healthyTools:[]});
    assert.doesNotMatch(text(result),/prepar(?:ar|asteis).*informe|proceso de datos|trabajo manual|reunir los archivos|preparar los datos|revisar el resultado/i);
    assert.doesNotMatch(text(result),/como te llamas|cual es tu nombre|dime tu nombre/i);
    assert.deepEqual(quickReplies(result),['Conocer a Víctor','Ver proyectos','Ver servicios','Tengo un problema']);
  }
  assert.equal(new Set(assistantTexts).size,assistantTexts.length);
  assert.match(text(results.at(-1)),/no hace falta que compartas ese dato/i);
});


test('H3.22 browser-style conversation reset clears a previous active case before short replies',()=>{
  resetState();
  turn('Tengo un problema con unos informes');
  resetConversation();
  const results=['Hola','Sí','No','más o menos'].map(turn);
  for(const result of results.slice(1)){
    const s=state(result);
    assert.equal(s.currentGoal,null);
    assert.equal(s.activeTopic,null);
    assert.deepEqual(s.knownFacts,{tools:[],healthyTools:[]});
    assert.doesNotMatch(text(result),/prepar(?:ar|asteis).*informe|proceso de datos|trabajo manual|reunir los archivos|preparar los datos|revisar el resultado/i);
  }
});

test('H3.22 short yes/no inside a real case keeps the case but changes clarification strategy',()=>{
  resetState();
  const first=turn('Tengo un problema con unos informes');
  assert.match(text(first),/reunir los archivos|preparar los datos|revisar el resultado/i);
  const yes=turn('Sí');
  assert.equal(state(yes).currentGoal,'understand_and_improve_process');
  assert.match(text(yes),/ese sí\/no no me permite saber/i);
  assert.deepEqual(quickReplies(yes),['Reunir archivos','Preparar datos','Revisar el resultado']);
  const no=turn('No');
  assert.equal(state(no).currentGoal,'understand_and_improve_process');
  assert.match(text(no),/podemos enfocarlo por el resultado/i);
  assert.deepEqual(quickReplies(no),['Tardar menos','Reducir errores','Simplificar el proceso']);
  assert.notEqual(text(yes),text(no));
});
