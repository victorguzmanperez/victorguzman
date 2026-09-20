import test from 'node:test';
import assert from 'node:assert/strict';
import {processDialogueTurn} from '../core/dialogue-manager.js';
import {resetState,getState} from '../core/state.js';
const turn=text=>{const result=processDialogueTurn({userText:text});assert.ok(result?.response?.messages?.some(m=>m.text),'Every accepted message must receive a visible response');return result;};
const visible=r=>r.response.messages.map(m=>m.text).join(' ');
const start='Hola, tenemos varios Excel de distintas delegaciones y cada semana perdemos mucho tiempo uniéndolos.';

test('FINAL QA: Excel quick reply progresses, free text refines the answer and evidence is not repeated',()=>{
 resetState();const first=turn(start);const next=turn(first.response.quickReplies[0].value);
 assert.match(visible(next),/columnas|estructura/);assert.doesNotMatch(visible(next),/Hay un proyecto|Qué te lleva más tiempo/);
 const detail=turn('Además, no todos los Excel tienen exactamente las mismas columnas.');assert.match(visible(detail),/normalizar|estructura/);
 assert.match(visible(turn('Sobre todo cambian los nombres de las columnas.')),/equivalencias/);
 assert.match(visible(turn('¿Y eso?')),/campos comunes|controles/);
 const evidence=visible(turn('¿Ha hecho algo parecido?'));assert.match(evidence,/experiencia profesional.*Excel/);assert.doesNotMatch(evidence,/Hay un proyecto del portfolio/);
});
for(const reply of ['Juntar los archivos','Sobre todo juntarlos','En realidad el problema es otro','No todos tienen las mismas columnas','xyz sin relación','Gracias'])test('FINAL QA: pending suggestions allow free text: '+reply,()=>{resetState();turn(start);turn(reply);});
test('FINAL QA: topic changes override discovery and thanks closes normally',()=>{
 resetState();turn(start);const aws=turn('Otra consulta: ¿tiene experiencia con AWS?');assert.match(visible(aws),/formación|estudios/);assert.doesNotMatch(visible(aws),/columnas/);
 assert.match(visible(turn('¿Y con Power BI?')),/profesional actual/);
 assert.match(visible(turn('Gracias')),/Necesitas algo más/);
 const close=turn('No, gracias');assert.match(visible(close),/útil/);
 const rating=turn('5');assert.equal(rating.decision.metadata.feedbackRating,'positive');assert.match(visible(rating),/resultado útil/);assert.deepEqual(rating.response.quickReplies.map(q=>q.label),['Apoyar el proyecto','Ahora no']);
});
for(const [score,rating]of [['1','negative'],['3','neutral'],['4','positive']])test('FINAL QA: contextual feedback '+score,()=>{resetState();turn(start);turn('No, gracias');assert.equal(turn(score).decision.metadata.feedbackRating,rating);});
test('FINAL QA: a numeric message outside feedback is not a rating',()=>{resetState();assert.notEqual(turn('5').decision.metadata.feedbackRating,'positive');});
test('FINAL QA: recruiting answers every technology and follows qualifications',()=>{
 resetState();const r=turn('¿Víctor tiene experiencia con Python, AWS, Qlik y Power BI?');
 for(const word of ['Python','AWS','Qlik','Power BI'])assert.ok(visible(r).includes(word));
 turn('¿Y AWS?');assert.match(visible(turn('¿Lo ha usado profesionalmente?')),/No tengo documentado un uso profesional/);
 turn('¿Y Qlik?');assert.match(visible(turn('Cuéntame más')),/No hay más detalle confirmado/);
 assert.match(visible(turn('¿Qué proyectos tiene con Python?')),/Business Cost Intelligence/);
 assert.equal(turn('¿Cómo contacto con él?').decision.route,'operational');
 const no=turn('No quiero reservar todavía');assert.equal(no.response.actions.length,1);assert.doesNotMatch(visible(no),/Calendly/);
});
test('FINAL QA: reporting accepts preparation and weekly email detail',()=>{resetState();assert.match(visible(turn('Tenemos Power BI, pero actualizar los informes sigue siendo bastante manual.')),/actualiza/);assert.match(visible(turn('Preparar los datos')),/datos|fuentes/);assert.match(visible(turn('Los recibimos por correo cada semana.')),/correo/);turn('¿Qué me recomiendas?');turn('¿Cuánto costaría?');turn('¿Y cuánto tardaría?');});
test('FINAL QA: AI retains the task across privacy, and does not guarantee results',()=>{
 resetState();turn('Queremos empezar a usar IA pero no tenemos claro dónde tiene sentido aplicarla.');turn('Clasificar correos');turn('Llegan unos cien al día y los clasificamos a mano');turn('¿Necesitaríamos compartir datos personales?');
 const r=visible(turn('¿Qué me recomiendas?'));assert.doesNotMatch(r,/Qué hacéis hoy a mano/);assert.match(r,/muestra|categorías/);
 assert.equal(turn('¿Puedes garantizar el resultado?').decision.route,'commercial');
});
test('FINAL QA: duplicate explanation is about identifying records',()=>{resetState();turn(start);turn('Limpiar datos');turn('Hay filas duplicadas');assert.match(visible(turn('¿Y eso?')),/operaciones distintas|duplicados reales/);});
test('FINAL QA: reset clears the discovery context',()=>{resetState();turn(start);turn('Juntar archivos');resetState();assert.equal(getState().conversation.messages.length,0);assert.doesNotMatch(visible(turn('¿Y eso?')),/columnas|estructura común/);});

test('FINAL QA: qualified Excel discovery hands off naturally after at most three useful questions',()=>{
 resetState();turn(start);turn('Juntar archivos');turn('Además, no todos los Excel tienen exactamente las mismas columnas.');
 const handoff=turn('Solo los nombres');
 const text=visible(handoff);
 assert.match(text,/equivalencias/i);
 assert.match(text,/muestra|validar|comprobar/i);
 assert.ok(handoff.response.quickReplies.length > 0);
 assert.equal(handoff.response.actions.length,1);
 assert.deepEqual(handoff.response.actions.map(a=>a.label),['Completar diagnóstico']);
 const after=turn('Además hacemos algunas comprobaciones manuales.');
 assert.equal(after.response.actions.length,1);
 assert.match(visible(after),/comprobar|validar|transformaciones/i);
});

test('FINAL QA: how-do-we-proceed follow-up uses discovery context instead of fallback',()=>{
 resetState();turn(start);turn('Juntar archivos');turn('Además, no todos los Excel tienen exactamente las mismas columnas.');
 const result=turn('¿Cómo lo hacemos?');
 assert.notEqual(result.decision.route,'fallback');
 assert.match(visible(result),/siguiente paso|diagnóstico|reunión/i);
 assert.equal(result.response.actions.length,2);
});

test('FINAL QA: contact request wins over polite thanks and offers a real human path',()=>{
 resetState();turn(start);
 const result=turn('Gracias, pero ¿cómo puedo conectar con Víctor?');
 assert.equal(result.decision.route,'operational');
 assert.match(visible(result),/email|LinkedIn/i);
 assert.match(visible(result),/reunión/i);
 assert.equal(result.response.actions[0].type,'open-contact');
 assert.ok(result.response.actions.some(action=>action.type==='open-calendly'));
});
