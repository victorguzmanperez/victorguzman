import test from 'node:test';
import assert from 'node:assert/strict';

import { processDialogueTurn } from '../core/dialogue-manager.js';
import { resetState } from '../core/state.js';

const text = result => (result.response.messages ?? []).map(message => message.text).join(' ');
const quickReplies = result => (result.response.quickReplies ?? []).map(reply => reply.label);
const actions = result => (result.response.actions ?? []).map(action => action.label);

function turn(userText) {
  const result = processDialogueTurn({ userText });
  assert.ok(result?.response?.messages?.some(message => message.text), `No visible response for: ${userText}`);
  return result;
}

test('natural opening never leaves the visitor without an obvious path', () => {
  resetState();
  const greeting = turn('Hola');
  assert.deepEqual(quickReplies(greeting), [
    'Tengo un problema',
    'Excel / Access',
    'Informes / Power BI',
    'Conocer a Víctor',
  ]);

  const unsure = turn('No sé por dónde empezar');
  assert.equal(unsure.decision.route, 'problem_flow');
  assert.ok(quickReplies(unsure).length >= 4);
  assert.match(text(unsure), /Empecemos|empezar/i);
});

test('vague problem -> reporting -> Power BI reaches useful CTA without fallback', () => {
  resetState();
  const turns = [
    turn('Tengo un problema'),
    turn('con informes'),
    turn('Power BI'),
    turn('vale'),
    turn('y ahora qué'),
  ];

  assert.ok(turns.every(result => result.decision.route !== 'fallback'));
  assert.equal(turns[1].decision.route, 'problem_flow');
  assert.match(text(turns[1]), /reporting|informe/i);
  assert.ok(quickReplies(turns[2]).length >= 3);
  assert.ok(quickReplies(turns[3]).length >= 3);
  assert.doesNotMatch(text(turns[3]), /no responde|lo guardo/);
  assert.deepEqual(actions(turns[4]), ['Completar diagnóstico', 'Reservar reunión']);
  assert.match(text(turns[4]), /diagnóstico|muestra/);
});

test('Access discovery stays conversational and reaches contact/booking bridge', () => {
  resetState();
  const first = turn('Tengo un problema');
  assert.equal(first.decision.route, 'need_discovery');

  const access = turn('Access');
  assert.equal(access.decision.route, 'problem_flow');
  assert.ok(quickReplies(access).length >= 3);

  const source = turn('Preparar informes');
  assert.ok(quickReplies(source).length >= 3);

  const handoff = turn('Con Excel');
  assert.ok(actions(handoff).includes('Completar diagnóstico'));
  assert.notEqual(handoff.decision.route, 'fallback');
});

test('single-candidate DAX confirmation has visible yes/no controls and resolves', () => {
  resetState();
  const confirm = turn('¿Sabe DAX?');
  assert.equal(confirm.decision.route, 'confirmation');
  assert.deepEqual(quickReplies(confirm), ['Sí', 'No']);

  const resolved = turn('Sí');
  assert.equal(resolved.decision.route, 'knowledge_direct');
  assert.match(text(resolved), /DAX|Power BI/i);
});

test('Power BI reading detour preserves the active business case and offers a return path', () => {
  resetState();
  turn('Tengo un problema con Power BI e informes manuales.');
  const content = turn('¿Tienes algo de Power BI en Substack?');

  assert.equal(content.decision.route, 'knowledge_direct');
  assert.match(text(content), /https:\/\/dataversodata\.substack\.com\/s\/power-bi-desde-cero/);
  assert.ok(quickReplies(content).includes('Volver a mi caso'));

  const resumed = turn('¿Cómo seguimos con mi caso?');
  assert.equal(resumed.decision.route, 'problem_flow');
  assert.notEqual(resumed.decision.route, 'fallback');
  assert.match(text(resumed), /fuentes|datos|dashboard|informe/i);
});

test('Quantfury is a first-class content topic, not a fallback', () => {
  resetState();
  const result = turn('Háblame de Quantfury');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.notEqual(result.response.kind, 'fallback');
  assert.match(text(result), /experiencia.*Quantfury|Quantfury.*experiencia/i);
  assert.match(text(result), /https:\/\/dataversodata\.substack\.com\/p\/mover-6000-con-300/);
  assert.match(text(result), /https:\/\/dataversodata\.substack\.com\/s\/aprender-mejorar-e-invertir-con-datos/);
  assert.match(text(result), /apalancamiento.*pérdidas|pérdidas.*apalancamiento/i);
  assert.ok(quickReplies(result).includes('Libros'));
});

test('growth and personal-finance route prioritizes the published reading path', () => {
  resetState();
  const result = turn('Quiero aprender sobre crecimiento personal y finanzas personales');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(text(result), /https:\/\/dataversodata\.substack\.com\/s\/aprender-mejorar-e-invertir-con-datos/);
  assert.match(text(result), /lo-que-aporta-el-metodo-rico/);
  assert.match(text(result), /los-secretos-de-la-mente-millonaria/);
  assert.doesNotMatch(text(result), /apalancamiento amplifica también las pérdidas/i);
  assert.ok(quickReplies(result).includes('Libros'));
});

test('book conversation exposes the three read-book articles progressively', () => {
  resetState();
  const first = turn('¿Qué libros ha leído Víctor?');
  assert.match(text(first), /lo-que-aporta-el-metodo-rico/);
  assert.match(text(first), /los-secretos-de-la-mente-millonaria/);
  assert.ok(quickReplies(first).includes('Otro libro'));

  const next = turn('Otro libro');
  assert.match(text(next), /padre-rico-padre-pobre-cambio-mentalidad/);
  assert.doesNotMatch(text(next), /lo-que-aporta-el-metodo-rico/);
  assert.doesNotMatch(text(next), /los-secretos-de-la-mente-millonaria/);
});
