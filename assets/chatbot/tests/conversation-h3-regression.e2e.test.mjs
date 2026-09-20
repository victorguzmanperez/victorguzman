import test from 'node:test';
import assert from 'node:assert/strict';

import { processDialogueTurn } from '../core/dialogue-manager.js';
import { resetState } from '../core/state.js';

const responseText = result => (result.response.messages ?? []).map(message => message.text).join(' ');
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

test('CONV-H3 corrections persist across Excel + Access + CSV and still reach the handoff', () => {
  resetState();
  const results = [
    turn('Usamos Excel y Access en un proceso semanal'),
    turn('No usamos Excel, solo Access'),
    turn('Y además CSV'),
    turn('¿Cómo seguimos?'),
  ];

  assertNoFallback(results);
  assert.doesNotMatch(responseText(results[1]), /Tenemos Excel/);
  assert.match(responseText(results[2]), /Access y CSV/);
  assert.deepEqual(actions(results[3]), ['Completar diagnóstico', 'Reservar reunión']);
});


test('CONV-H3 replacement from Excel to Power Query persists through later turns', () => {
  resetState();
  const first = turn('Tenemos un proceso con Excel');
  const corrected = turn('No usamos Excel, usamos Power Query');
  const automated = turn('Queremos automatizarlo');
  const recap = turn('¿Qué te acabo de contar?');

  assertNoFallback([first, corrected, automated, recap]);
  assert.match(responseText(corrected), /Power Query/);
  assert.doesNotMatch(responseText(corrected), /Tenemos Excel/);
  assert.match(responseText(automated), /Power Query/);
  assert.match(responseText(recap), /Power Query/);
  assert.doesNotMatch(responseText(recap), /Excel/);
});

test('CONV-H3 returns to the active Power BI case after a Knowledge detour', () => {
  resetState();
  turn('Tengo un problema con Power BI e informes');
  const aws = turn('¿Víctor tiene experiencia con AWS?');
  const resumed = turn('Volvamos a mi problema');

  assert.equal(aws.decision.route, 'knowledge_direct');
  assert.match(responseText(aws), /AWS/);
  assert.equal(resumed.decision.route, 'problem_flow');
  assert.deepEqual(quickReplies(resumed), ['Reunir archivos', 'Preparar datos', 'Revisar el resultado']);
});

test('CONV-H3 Qlik migration question does not invent professional experience', () => {
  resetState();
  const result = turn('¿Podría Víctor liderar una migración de QlikView a Qlik Sense?');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(responseText(result), /No tengo base/i);
  assert.match(responseText(result), /QlikView|Qlik Sense/);
  assert.doesNotMatch(responseText(result), /Sí, hay experiencia/i);
});

test('CONV-H3 PL-300 keeps its protected certification status on a semantic follow-up', () => {
  resetState();
  const first = turn('¿Tiene Víctor la PL-300?');
  const followup = turn('¿Y actualmente?');

  assertNoFallback([first, followup]);
  assert.match(responseText(first), /preparando Microsoft PL-300/i);
  assert.match(responseText(followup), /certificación oficial aún no consta como obtenida/i);
});

test('CONV-H3 technologies overview accepts free-text progressive disclosure', () => {
  resetState();
  const summary = turn('¿Qué tecnologías domina Víctor?');
  const current = turn('¿Cuáles usa actualmente?');
  const historical = turn('¿Y las históricas?');
  const supporting = turn('¿Y formación o proyectos?');

  assertNoFallback([summary, current, historical, supporting]);
  assert.match(responseText(current), /Power BI/);
  assert.match(responseText(historical), /COBOL/);
  assert.match(responseText(supporting), /AWS/);
  assert.match(responseText(supporting), /no equivale a experiencia profesional actual/i);
});

test('CONV-H3 book purchase and affiliate follow-ups stay anchored to the selected book', () => {
  resetState();
  const article = turn('Quiero leer Padre rico Padre pobre');
  const buy = turn('¿Dónde compro este libro?');
  const affiliate = turn('¿Ese enlace es afiliado?');

  assertNoFallback([article, buy, affiliate]);
  for (const result of [article, buy, affiliate]) {
    assert.match(responseText(result), /padre-rico-padre-pobre-cambio-mentalidad/);
  }
  assert.match(responseText(buy), /amzn\.to\/4bSGsrs/);
  assert.match(responseText(affiliate), /Enlace de afiliado/i);
});

test('CONV-H3 investment request stays educational and avoids a personalized buy recommendation', () => {
  resetState();
  const result = turn('¿Qué inversión me recomiendas comprar ahora?');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(responseText(result), /no elegir por ti qué activo comprar/i);
  assert.match(responseText(result), /(?:no|ni) prometer rentabilidad/i);
  assert.deepEqual(quickReplies(result), ['Quantfury', 'Libros', 'Artículos de inversión']);
});

test('CONV-H3 mixed thanks + contact routes directly to a usable contact path', () => {
  resetState();
  const result = turn('Gracias, ¿cómo contacto con Víctor?');

  assert.equal(result.decision.route, 'operational');
  assert.match(responseText(result), /email|LinkedIn/i);
  assert.deepEqual(actions(result), ['Contactar con Víctor', 'Completar diagnóstico', 'Reservar reunión']);
});

test('CONV-H3 booking follow-up never claims a reservation without Calendly confirmation', () => {
  resetState();
  const start = turn('Quiero agendar una cita');
  const followup = turn('Ya elegí fecha y hora, ¿está reservada?');

  assertNoFallback([start, followup]);
  assert.match(responseText(followup), /no me permite confirmar/i);
  assert.match(responseText(followup), /Calendly.*confirmación/i);
  assert.deepEqual(actions(followup), ['Volver a Calendly', 'Completar diagnóstico']);
});

test('CONV-H3 can recap a Power BI case instead of advancing the funnel blindly', () => {
  resetState();
  turn('Tengo un problema con Power BI');
  turn('Por correo');
  turn('Cada semana');
  const recap = turn('¿Qué problema te acabo de contar?');

  assert.equal(recap.decision.route, 'problem_flow');
  assert.match(responseText(recap), /Power BI/i);
  assert.match(responseText(recap), /cada semana|semanal/i);
  assert.match(responseText(recap), /correo/i);
  assert.ok(quickReplies(recap).includes('Continuar con mi caso'));
});

test('CONV-H3 explicit close clears the active case so a later greeting starts cleanly', () => {
  resetState();
  turn('Tengo un problema con Excel');
  const close = turn('Gracias, ya está');
  const hello = turn('Hola');

  assert.equal(close.decision.route, 'social');
  assert.match(responseText(close), /Hasta pronto|placer ayudarte/i);
  assert.equal(hello.decision.route, 'social');
  assert.match(responseText(hello), /Hola/i);
  assert.deepEqual(quickReplies(hello), ['Tengo un problema', 'Excel / Access', 'Informes / Power BI', 'Conocer a Víctor']);
  assert.doesNotMatch(responseText(hello), /Excel.*proceso/i);
});

test('CONV-H3 name is optional and the bot can explain why it asks', () => {
  resetState();
  turn('Me llamo Ana');
  const declined = turn('Prefiero no decir mi nombre');
  const why = turn('¿Por qué lo pides?');

  assertNoFallback([declined, why]);
  assert.match(responseText(declined), /No necesitas decirme tu nombre/i);
  assert.match(responseText(why), /totalmente opcional/i);
});

test('CONV-H3 privacy and ROI questions have direct safe answers', () => {
  resetState();
  const privacy = turn('¿Dónde se guarda esta conversación?');
  const roi = turn('¿Qué retorno económico me garantizas?');

  assertNoFallback([privacy, roi]);
  assert.equal(privacy.decision.route, 'privacy');
  assert.match(responseText(privacy), /sessionStorage|8 horas/i);
  assert.equal(roi.decision.route, 'commercial');
  assert.match(responseText(roi), /No puedo prometer un ahorro o retorno concreto/i);
  assert.deepEqual(actions(roi), ['Analizar mi caso']);
});

test('CONV-H3 current COBOL question distinguishes historical experience from current use', () => {
  resetState();
  const result = turn('¿Víctor sigue trabajando con COBOL actualmente?');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(responseText(result), /no consta entre sus tecnologías de trabajo actuales/i);
  assert.match(responseText(result), /experiencia profesional histórica/i);
});

test('CONV-H3 mentalidad y hábitos prioritizes the relevant published books and learning section', () => {
  resetState();
  const result = turn('Quiero leer sobre mentalidad y hábitos');

  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(responseText(result), /aprender-mejorar-e-invertir-con-datos/);
  assert.match(responseText(result), /los-secretos-de-la-mente-millonaria/);
  assert.match(responseText(result), /padre-rico-padre-pobre-cambio-mentalidad/);
  assert.doesNotMatch(responseText(result), /bienvenido-a-dataverso/);
});

test('CONV-H3 generic Excel + Access process can be corrected and recalled naturally', () => {
  resetState();
  const first = turn('Tenemos un proceso con Excel y Access');
  const corrected = turn('No usamos Excel, solo Access');
  const csv = turn('También usamos CSV');
  const recap = turn('¿Qué te acabo de contar?');

  assertNoFallback([first, corrected, csv, recap]);
  assert.match(responseText(corrected), /Access/);
  assert.doesNotMatch(responseText(corrected), /Tenemos Excel/);
  assert.match(responseText(csv), /Access y CSV/);
  assert.match(responseText(recap), /Access/);
  assert.match(responseText(recap), /CSV/);
});
