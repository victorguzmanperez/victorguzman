import { interpretTurn, normalizeTurn } from './turn-interpreter.js';

// A replayable projection of the session history. Only visitor case statements
// supply facts: knowledge questions and assistant text never become case facts.
export const emptyConversationV2 = () => ({ version: 2, knownFacts: { tools: [], healthyTools: [] }, correctedFacts: [], openQuestions: [], currentGoal: null, activeTopic: null, suspendedTopic: null, informationSufficiency: false, conversationProgress: 0, userLatestIntent: null });
export function interpretConversationTurn(text, state = emptyConversationV2()) {
  const n = normalizeTurn(text).trim();
  const base = interpretTurn(text);
  const knowledge = /(?:victor|sabe|ha hecho|experiencia|conocer a|proyectos?|formacion|estudios|certific|pl-300)/.test(n) && !/mi proyecto|nuestro proyecto/.test(n);
  const contact = /(?:contact|reservar|agendar|reunion|calendly)/.test(n) && !/no .*?(?:contact|reservar|agendar|reunion)/.test(n);
  const close = /^(?:no[,]? gracias)[.! ]*$/.test(n) || /^(?:gracias[, ]*)?(?:ya esta|es todo|eso es todo|adios|hasta luego|nada mas|con eso es suficiente)[.! ]*$/.test(n);
  const resume = /(?:volvamos|retomemos|volver|retomar).*(?:mio|caso|problema|datos)|continuar con mi caso/.test(n);
  const uncertain = /^(?:si|no|mas o menos|depende|creo que si|ninguna|las dos|eso|exacto|tambien)[.! ]*$/.test(n) || /no (?:lo )?se|ni idea|no te lo puedo decir|no se exactamente/.test(n);
  const solution = /automatiz|como lo harias|como lo haria|que (?:podemos|podriamos|se podria) hacer|que recomiend/.test(n);
  const recap = /(?:resume|recuerdame|que .*?(?:contado|dicho)|que .*?acabo de contar)/.test(n);
  const caseStart = base.problem || /necesito ayuda|con unos datos|varios excel|preparo informes|repito tareas|datos de varias fuentes/.test(n) || /^(?:tenemos|usamos|utilizamos|trabajamos con)/.test(n);
  const scope = /privacidad|datos personales|guardas|articulo|substack|dataverso|libro|aprender|finanzas|inversion/.test(n);
  const social = /^(?:gracias|[1-5])[.! ]*$/.test(n);
  const intent = close ? 'CLOSE' : contact ? 'HANDOFF' : resume ? 'RESUME_TOPIC' : recap ? 'RECAP' : knowledge || scope || social ? 'ANSWER' : base.topicSwitch ? 'TOPIC_SWITCH' : uncertain ? 'CLARIFY' : solution ? 'PROVIDE_VALUE' : base.correction ? 'CORRECT_HYPOTHESIS' : 'ACKNOWLEDGE_AND_ASK';
  return { ...base, text, n, intent, knowledge, scope, caseStart, isCase: !knowledge && !scope && !contact && !close && !social && (caseStart || !!state.currentGoal || resume) };
}
const numberWords = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
const amount = x => numberWords[x] ?? Number(x);
export function updateConversationV2(previous, turn) {
  if (turn.intent === 'CLOSE' || turn.intent === 'TOPIC_SWITCH') return emptyConversationV2();
  const state = structuredClone(previous);
  state.userLatestIntent = turn.intent;
  if (turn.knowledge || turn.scope) {
    state.suspendedTopic = state.currentGoal ? 'visitor_case' : null;
    state.activeTopic = 'knowledge';
    return state;
  }
  if (!turn.isCase) return state;
  state.currentGoal = 'understand_and_improve_process';
  state.activeTopic = 'visitor_case';
  state.suspendedTopic = null;
  state.conversationProgress++;
  const f = state.knownFacts, n = turn.n;
  for (const m of turn.mentions) {
    if (m.queryOnly) continue;
    // "No, Power BI funciona bien" corrects the hypothesis, not tool usage.
    const healthy = n.includes(normalizeTurn(m.tool)) && /funciona bien|no es el problema/.test(n);
    if (healthy) { if (!f.healthyTools.includes(m.tool)) f.healthyTools.push(m.tool); }
    if (m.excluded && !healthy) { f.tools = f.tools.filter(x => x !== m.tool); state.correctedFacts.push({ key: 'tools', removed: m.tool }); }
    else if (!f.tools.includes(m.tool)) f.tools.push(m.tool);
  }
  if (/correo/.test(n)) f.channel = 'correo';
  if (turn.frequency) {
    if (f.frequency && f.frequency !== turn.frequency) state.correctedFacts.push({ key: 'frequency', removed: f.frequency, value: turn.frequency });
    f.frequency = turn.frequency;
  }
  const duration = n.match(/(\d+(?:[.,]\d+)?|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(horas?|dias?|minutos?)/);
  if (duration) f.duration = { value: amount(duration[1].replace(',', '.')), unit: duration[2].replace('dias', 'días').replace('dia', 'día') };
  const sources = n.match(/(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(excel|archivos?|ficheros?|departamentos?)/);
  if (sources) f.sources = { count: amount(sources[1]), kind: sources[2] === 'excel' ? 'Excel' : sources[2] };
  if (/varios|varias/.test(n) && /excel|csv|archivo|fuente/.test(n)) f.multipleSources = true;
  if (/vienen de|salen de|origen/.test(n) && turn.mentions.length) f.source = turn.mentions.filter(m => !m.excluded).map(m => m.tool).join(' y ');
  if (/junt|unir|consolid|reunir|copi|peg/.test(n)) f.operation = 'consolidate';
  else if (/prepar|limpi|transform/.test(n) && /datos|prepararlos/.test(n)) f.operation = 'prepare';
  else if (/valid|revis|comprob/.test(n) && !f.operation) f.operation = 'validate';
  else if (/actualiz.*informe|prepar.*informe/.test(n)) f.operation = 'report';
  if (/duplicad/.test(n)) f.duplicates = true;
  if (/compar.*total|comprob|valid|revis.*campo/.test(n)) f.controls = true;
  if (/manual|cada .*hago lo mismo|repit|repite/.test(n)) f.repetitive = true;
  if (/errores?|no cuadr|inconsisten/.test(n)) f.errors = !/sin errores|no hay errores/.test(n);
  if (/mismas? (?:columnas|estructura)|misma estructura/.test(n)) f.structure = /no .*misma/.test(n) ? 'different' : 'same';
  if (/columnas distintas|estructuras? distintas|cambian|no, cambian/.test(n)) f.structure = 'different';
  if (/tardamos mucho|tarda|mucho tiempo/.test(n)) f.slow = true;
  state.correctedFacts = state.correctedFacts.slice(-20);
  state.informationSufficiency = !!((f.operation && (f.frequency || f.source || f.duration || f.sources)) || (f.repetitive && f.frequency && f.tools.length) || (f.sources && f.duration && f.frequency));
  state.openQuestions = ['operation', 'structure', 'frequency'].filter(k => !f[k]);
  return state;
}
export function conversationStateFromMessages(messages = []) {
  let state = emptyConversationV2();
  for (const message of messages) if (message.role === 'user') state = updateConversationV2(state, interpretConversationTurn(message.text, state));
  return state;
}

// Persist only this bounded factual projection; never copy raw text or identity.
export function isConversationV2(value) {
  if (value === null) return true;
  if (!value || value.version !== 2 || !Number.isSafeInteger(value.conversationProgress) || value.conversationProgress < 0) return false;
  const keys = Object.keys(emptyConversationV2());
  if (Object.keys(value).length !== keys.length || Object.keys(value).some(k => !keys.includes(k))) return false;
  const facts = value.knownFacts;
  const factKeys = ['tools','healthyTools','frequency','duration','sources','source','operation','repetitive','errors','structure','slow','multipleSources','channel','duplicates','controls'];
  if (!facts || typeof facts !== 'object' || Object.keys(facts).some(k => !factKeys.includes(k))) return false;
  const tools = ['Excel','Access','Power BI','Power Query','Python','SQL','PDF','CSV','IA','VBA'];
  if (![facts.tools,facts.healthyTools].every(a => Array.isArray(a) && a.length <= tools.length && a.every(t => tools.includes(t)))) return false;
  if (facts.frequency && !['daily','weekly','monthly'].includes(facts.frequency)) return false;
  if (facts.operation && !['consolidate','prepare','validate','report'].includes(facts.operation)) return false;
  if (facts.structure && !['same','different'].includes(facts.structure)) return false;
  if (facts.channel && facts.channel !== 'correo') return false;
  if (facts.source && (typeof facts.source !== 'string' || facts.source.split(' y ').some(t => !tools.includes(t)))) return false;
  if (facts.duration && (!Number.isFinite(facts.duration.value) || facts.duration.value < 0 || !['hora','horas','día','días','minuto','minutos'].includes(facts.duration.unit) || Object.keys(facts.duration).length !== 2)) return false;
  if (facts.sources && (!Number.isSafeInteger(facts.sources.count) || facts.sources.count < 0 || !['Excel','archivo','archivos','fichero','ficheros','departamento','departamentos'].includes(facts.sources.kind) || Object.keys(facts.sources).length !== 2)) return false;
  for (const key of ['repetitive','errors','slow','multipleSources','duplicates','controls']) if (key in facts && typeof facts[key] !== 'boolean') return false;
  if (!Array.isArray(value.correctedFacts) || value.correctedFacts.length > 20 || !value.correctedFacts.every(c => c && ['tools','frequency'].includes(c.key) && Object.keys(c).every(k => ['key','removed','value'].includes(k)) && [...tools,'daily','weekly','monthly'].includes(c.removed) && (c.value === undefined || ['daily','weekly','monthly'].includes(c.value)))) return false;
  if (!Array.isArray(value.openQuestions) || value.openQuestions.some(q => !['operation','structure','frequency'].includes(q))) return false;
  if (![null,'understand_and_improve_process'].includes(value.currentGoal) || ![null,'visitor_case','knowledge'].includes(value.activeTopic) || ![null,'visitor_case'].includes(value.suspendedTopic)) return false;
  return typeof value.informationSufficiency === 'boolean' && [null,'CLOSE','HANDOFF','RESUME_TOPIC','RECAP','ANSWER','TOPIC_SWITCH','CLARIFY','PROVIDE_VALUE','CORRECT_HYPOTHESIS','ACKNOWLEDGE_AND_ASK'].includes(value.userLatestIntent);
}
