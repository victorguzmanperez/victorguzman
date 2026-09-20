import test from 'node:test';
import assert from 'node:assert/strict';
import { processDialogueTurn } from '../core/dialogue-manager.js';
import { resetState } from '../core/state.js';

const visible = result => result.response.messages.map(message => message.text).join(' ');
const actionLabels = result => (result.response.actions ?? []).map(action => action.label);

function turn(text) {
  const result = processDialogueTurn({ userText: text });
  assert.ok(result?.response?.messages?.some(message => message.text), `No visible response for: ${text}`);
  return result;
}

function runFunnel({ name, turns, expectedOpening = null }) {
  resetState();
  const results = turns.map(turn);

  if (expectedOpening) {
    assert.match(visible(results[0]), expectedOpening, `${name}: opening did not match`);
  }

  for (const result of results) {
    assert.notEqual(result.decision.route, 'fallback', `${name}: unexpected fallback: ${visible(result)}`);
  }

  const handoffIndex = results.findIndex(result => actionLabels(result).includes('Completar diagnóstico'));
  assert.ok(handoffIndex >= 0, `${name}: no diagnostic continuation`);
  assert.ok(handoffIndex <= 4, `${name}: handoff arrived too late at turn index ${handoffIndex}`);

  return { results, handoffIndex };
}

const funnelScenarios = [
  {
    name: 'Excel consolidation',
    expectedOpening: /Excel|archivos|trabajo manual/i,
    turns: [
      'Tenemos varios Excel de distintas delegaciones y perdemos mucho tiempo uniéndolos.',
      'Lo que más tiempo me lleva es juntarlos y consolidarlos.',
      'No todos tienen las mismas columnas.',
      'Solo cambian los nombres.',
    ],
  },
  {
    name: 'Power BI reporting',
    expectedOpening: /reporting|informe|actualiz/i,
    turns: [
      'Tenemos Power BI, pero actualizar los informes sigue siendo bastante manual.',
      'Pierdo más tiempo preparando los datos.',
      'Los recibimos por correo cada semana.',
      'Lo revisamos manualmente.',
    ],
  },
  {
    name: 'Copy paste automation',
    expectedOpening: /copiar y pegar|mover información|herramientas/i,
    turns: [
      'Paso buena parte del día copiando y pegando entre herramientas.',
      'Copiamos entre Excel y un sistema interno.',
      'Lo hacemos todos los días.',
      'Validamos algunos campos manualmente.',
    ],
  },
  {
    name: 'AI opportunity',
    expectedOpening: /proceso|IA|inteligencia artificial/i,
    turns: [
      'Queremos empezar a usar IA pero no tenemos claro dónde tiene sentido aplicarla.',
      'Nos gustaría clasificar documentos.',
      'Llegan unos cien al día y los revisa una persona.',
      'Sí, las categorías ya están definidas.',
    ],
  },
  {
    name: 'Data quality',
    expectedOpening: /datos|calidad|confiar/i,
    turns: [
      'Tenemos datos incorrectos y no confiamos en el resultado.',
      'Los errores vienen de varios ficheros.',
      'Lo revisamos manualmente cada semana.',
      'Comparamos totales y campos obligatorios.',
    ],
  },
  {
    name: 'PDF extraction',
    expectedOpening: /documentos|PDF|extraer/i,
    turns: [
      'Tenemos que leer muchas facturas PDF una a una y copiar datos manualmente.',
      'Son unas cien facturas al mes.',
      'Algunas vienen escaneadas.',
      'Necesitamos proveedor, fecha e importe.',
      'Lo comprueba una persona antes de continuar.',
    ],
  },
  {
    name: 'Scoring model',
    expectedOpening: /reglas|pesos|modelo/i,
    turns: [
      'Tenemos una evaluación con pesos y subcompetencias en Excel.',
      'Lo más difícil es validar el resultado.',
      'Las reglas cambian con frecuencia.',
      'Lo validamos manualmente.',
    ],
  },
  {
    name: 'Web audit',
    expectedOpening: /web|revisión|puntuación|datos/i,
    turns: [
      'Necesito auditar webs de muchas empresas y puntuar resultados.',
      'Necesito datos y scoring.',
      'Las webs son muy distintas.',
      'Revisamos unas doscientas al mes.',
    ],
  },
  {
    name: 'Financial monitoring',
    expectedOpening: /datos|seguimiento|financiero|activos/i,
    turns: [
      'Quiero analizar dividendos y comparar activos.',
      'Quiero comparar crecimiento y métricas homogéneas.',
      'Uso ficheros descargados y alguna API.',
      'Lo actualizo cada semana.',
    ],
  },
];

for (const scenario of funnelScenarios) {
  test(`FUNNEL matrix: ${scenario.name} reaches CTA after sufficient answered stages without fallback`, () => {
    runFunnel(scenario);
  });
}

test('FUNNEL matrix: quick replies are optional and free text remains valid', () => {
  resetState();
  const first = turn('Tenemos varios Excel que consolidamos manualmente cada semana.');
  assert.ok(first.response.quickReplies.length > 0);
  const freeText = turn('En realidad cada delegación usa columnas algo distintas.');
  assert.notEqual(freeText.decision.route, 'fallback');
  assert.match(visible(freeText), /estructura|columnas|normalizar/i);
});

test('FUNNEL matrix: next-step follow-ups reuse active discovery context', () => {
  resetState();
  turn('Tenemos Power BI pero preparar el informe es muy manual.');
  turn('Los datos llegan por correo.');
  const result = turn('¿Cómo seguimos?');
  assert.notEqual(result.decision.route, 'fallback');
  assert.deepEqual(actionLabels(result), ['Completar diagnóstico', 'Reservar reunión']);
});

test('FUNNEL matrix: contact request beats polite thanks', () => {
  resetState();
  turn('Tenemos varios Excel que consolidamos manualmente.');
  const result = turn('Gracias, pero ¿cómo puedo contactar con Víctor?');
  assert.equal(result.decision.route, 'operational');
  assert.match(visible(result), /email|LinkedIn|reunión/i);
});

test('FUNNEL matrix: financial metric wording does not become a false ROI promise question', () => {
  resetState();
  turn('Quiero analizar dividendos y comparar activos.');
  const result = turn('Quiero comparar rentabilidad histórica y crecimiento del dividendo.');
  assert.notEqual(result.decision.route, 'commercial');
  assert.notEqual(result.decision.route, 'fallback');
});

test('FUNNEL matrix: browser release cache bust reaches continuation hardening', async () => {
  const fs = await import('node:fs/promises');
  const manager = await fs.readFile(new URL('../core/dialogue-manager.js', import.meta.url), 'utf8');
  const bootstrap = await fs.readFile(new URL('../chatbot.js', import.meta.url), 'utf8');
  assert.match(manager, /dialogue-continuation\.js\?v=final-qa\.3/);
  assert.match(bootstrap, /dialogue-manager\.js\?v=conv-h3\.25\.1/);
});

test('FUNNEL matrix: privacy detour does not erase an active discovery', () => {
  resetState();
  turn('Queremos usar IA para clasificar documentos.');
  turn('Llegan unos cien al día y una persona revisa los casos dudosos.');
  const privacy = turn('¿Necesitaríamos compartir datos personales?');
  assert.equal(privacy.decision.route, 'privacy');
  const next = turn('¿Cómo seguimos?');
  assert.deepEqual(actionLabels(next), ['Completar diagnóstico', 'Reservar reunión']);
});

test('FUNNEL matrix: commercial detour keeps the discovery available afterwards', () => {
  resetState();
  turn('Tenemos Power BI y preparar los datos sigue siendo manual.');
  turn('Las fuentes llegan por correo.');
  const price = turn('¿Cuánto costaría?');
  assert.equal(price.decision.route, 'commercial');
  const next = turn('¿Cómo seguimos?');
  assert.deepEqual(actionLabels(next), ['Completar diagnóstico', 'Reservar reunión']);
});

test('FUNNEL matrix: direct booking intent remains operational', () => {
  resetState();
  const result = turn('Prefiero hablarlo con Víctor, quiero reservar una reunión.');
  assert.equal(result.decision.route, 'operational');
  assert.ok((result.response.actions ?? []).some(action => action.type === 'open-calendly'));
});

test('FUNNEL matrix: a technology topic change escapes discovery cleanly', () => {
  resetState();
  turn('Tenemos varios Excel que consolidamos manualmente.');
  turn('Cada delegación usa columnas distintas.');
  const result = turn('Otra consulta: ¿Víctor tiene experiencia con AWS?');
  assert.equal(result.decision.route, 'knowledge_direct');
  assert.match(visible(result), /formación|estudios/i);
  assert.doesNotMatch(visible(result), /columnas|diagnóstico|reunión/i);
});

test('FUNNEL matrix: after handoff, extra detail is acknowledged without repeating CTAs', () => {
  resetState();
  turn('Tenemos varios Excel que consolidamos manualmente.');
  turn('Cada delegación usa columnas distintas.');
  const handoff = turn('Solo cambian los nombres.');
  assert.deepEqual(actionLabels(handoff), ['Completar diagnóstico']);
  const detail = turn('Además hay una comprobación mensual que no podemos perder.');
  assert.equal((detail.response.actions ?? []).length, 1);
  assert.match(visible(detail), /comprobar|validar|controles|muestra/i);
});
