// CONV-H2: visitor environment is not evidence of Víctor's experience.
export const normalizeTurn = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tools = [['Excel', /\bexcel\b/g], ['Access', /\baccess\b/g], ['Power BI', /\bpower\s*bi\b/g], ['Power Query', /\bpower\s*query\b/g], ['Python', /\bpython\b/g], ['SQL', /\bsql\b/g], ['PDF', /\bpdf\b/g], ['CSV', /\bcsv\b/g], ['VBA', /\bvba\b|\bmacros?\b/g], ['IA', /\bia\b|inteligencia artificial/g]];
export function interpretTurn(text) {
  const normalized = normalizeTurn(text);
  const name = String(text).match(/\b(?:me llamo|mi nombre es)\s+([\p{L}][\p{L}'-]{1,30})/iu)?.[1] ?? null;
  const mentions = tools.flatMap(([tool, pattern]) => [...normalized.matchAll(pattern)].map(m => ({ tool, index:m.index, excluded: /(?:\bno(?: usamos| uso| utilizamos| utilizo| era| es)?|sin|dejamos de usar|en vez de)\s*$/.test(normalized.slice(Math.max(0,m.index-30),m.index)) }))).sort((a,b)=>a.index-b.index);
  const intents = [];
  if (/privacidad|datos personales|guardas mis datos/.test(normalized)) intents.push('privacy');
  if (/contact|conectar con|reservar|reunion|calendly/.test(normalized)) intents.push('contact');
  if (/experiencia|profesional|recruiter|contratar|formacion|estudios/.test(normalized)) intents.push('profile');
  if (/articulo|substack|dataverso|libro|leer|aprender|finanzas|invertir|inversion/.test(normalized)) intents.push('content');
  const problem = /problema|procesos? manual|manualidades|automatiz|copi[ao]|copiar|pegando|perdemos tiempo|proceso con|(?:tenemos|tengo|usamos|utilizamos)\s+(?:un\s+)?proceso/.test(normalized) || (/\b(?:usamos|utilizamos|trabajamos con)\b/.test(normalized) && mentions.filter(mention => !mention.excluded).length >= 2);
  if (problem) intents.push('process');
  if (name) intents.push('introduce_name');
  for(const mention of mentions) {
    const clause=normalized.slice(0,mention.index).split(/[,;]| y (?:tengo|tenemos)| pero /).at(-1);
    mention.queryOnly=/(?:sabe|conoce|ha hecho|victor|víctor)/.test(normalized) || /(?:articulo|aprender|leer sobre|experiencia|formacion)/.test(clause) || (!problem && (intents.includes('content')||intents.includes('profile')));
  }
  return { name, intents, primaryIntent:intents[0] ?? null, secondaryIntents:intents.slice(1), mentions, problem,
    correction:/\bno\b|en realidad|queria decir|me referia|corrijo|correccion|en vez de/.test(normalized),
    topicSwitch:/cambi(?:ar|amos|emos) de tema|otra consulta|ahora quiero/.test(normalized),
    objective:/automatiz/.test(normalized)?'automate':/limpi|duplicad/.test(normalized)?'clean':/consolid|juntar|unir/.test(normalized)?'consolidate':null,
    frequency:/diari|cada dia|todos los dias/.test(normalized)?'daily':/seman/.test(normalized)?'weekly':/mensual|cada mes|todos los meses/.test(normalized)?'monthly':null };
}
export function updateDiscourse(memory, turn) {
  const next = { tools:[...(memory?.tools ?? [])], problem:memory?.problem ?? false, objective:memory?.objective ?? null, frequency:memory?.frequency ?? null, name:memory?.name ?? null };
  if (turn.topicSwitch) { next.tools=[]; next.problem=false; next.objective=null; next.frequency=null; }
  for (const mention of turn.mentions.filter(m=>!m.queryOnly)) {
    next.tools=next.tools.filter(t=>t!==mention.tool);
    if (!mention.excluded) next.tools.push(mention.tool);
  }
  if (turn.name) next.name=turn.name;
  if (turn.problem) next.problem=true;
  if (turn.objective) next.objective=turn.objective;
  if (turn.frequency) next.frequency=turn.frequency;
  return next;
}
export function discourseFromMessages(messages = []) {
  return messages.filter(m=>m.role==='user').slice(-24).reduce((m,t)=>updateDiscourse(m,interpretTurn(t.text)), null) ?? updateDiscourse(null,interpretTurn(''));
}
