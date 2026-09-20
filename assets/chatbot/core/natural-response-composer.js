import { createResponseEnvelope } from './response-contract.js';
import { createAnswerQuickReply, createDiagnosticAction, createCalendlyAction } from './response-interactions.js';
import { resolveRelatedEvidence, EVIDENCE_LEVEL } from './evidence-resolver-v2.js';

const frequencies = { daily: 'cada día', weekly: 'cada semana', monthly: 'cada mes' };
const operations = { consolidate: 'reunir los archivos', prepare: 'preparar los datos', validate: 'revisar los datos', report: 'actualizar los informes' };
export const entryOptions = ['Excel / datos', 'Informes / Power BI', 'Procesos repetitivos', 'Conocer a Víctor'];
const generalEntryOptions = ['Conocer a Víctor', 'Ver proyectos', 'Ver servicios', 'Tengo un problema'];
const prompts = {
  welcome: ['Claro. Cuéntame qué necesitas y vemos por dónde empezar.', entryOptions],
  operation: ['En ese proceso de datos e informes, ¿qué parte manual os lleva más trabajo: reunir los archivos, preparar los datos o revisar el resultado?', ['Reunir archivos', 'Preparar datos', 'Revisar el resultado']],
  example: ['Piensa en la última vez que preparasteis un informe: ¿qué tuvo que hacer alguien a mano?', ['Copiar y pegar', 'Limpiar datos', 'Actualizar el informe']],
  symptom: ['¿Qué es lo que va mal: cuesta prepararlo, aparecen errores o el resultado no sirve como esperabais?', ['Cuesta prepararlo', 'Aparecen errores', 'El resultado no sirve']],
  error: ['¿Dónde aparecen las diferencias: al reunir las fuentes o al calcular el resultado?', ['Al reunir archivos', 'Al calcular', 'No lo sé todavía']],
  transforms: ['¿Qué hacéis con los datos antes de cargarlos en el informe?', ['Unir tablas', 'Limpiar formatos', 'Hacer cálculos', 'Ver cómo lo automatizaría']],
  frequency: ['¿Con qué frecuencia tenéis que repetir ese trabajo?', ['Cada día', 'Cada semana', 'Cada mes']],
  structure: ['¿Los archivos mantienen normalmente las mismas columnas?', ['Sí, misma estructura', 'No, cambian', 'Ver cómo lo automatizaría']],
  controls: ['¿Qué comprobación os permite saber que el resultado está bien?', ['Comparar totales', 'Buscar duplicados', 'Revisar campos vacíos']],
  examples: ['Podemos empezar con un ejemplo, sin que tengas que saber la causa. Elige lo que más se parezca a tu situación.', ['Trabajo mucho con Excel', 'Preparo informes', 'Repito tareas manuales', 'Tengo datos de varias fuentes']],
  operation_retry: ['Ese sí/no no me permite saber cuál de las tres encaja mejor. En vuestro caso de informes, ¿dónde se os va más tiempo: reunir archivos, preparar datos o revisar el resultado?', ['Reunir archivos', 'Preparar datos', 'Revisar el resultado']],
  case_goal: ['No pasa nada si ninguna opción encaja del todo. Podemos enfocarlo por el resultado: ¿qué os gustaría mejorar primero en esos informes?', ['Tardar menos', 'Reducir errores', 'Simplificar el proceso']],
};
export function summarizeCase(f) {
  let lead = f.sources
    ? `Recibís datos de ${f.sources.count} ${f.sources.kind}`
    : f.tools.length ? `Trabajáis con ${f.tools.join(' y ')}` : 'El trabajo con los datos';
  if (f.channel) lead += ` por ${f.channel}`;
  if (f.frequency) lead += ` ${frequencies[f.frequency]}`;
  if (f.operation) lead += ` y la parte que queréis mejorar es ${operations[f.operation]}`;
  const details = [];
  if (f.source) details.push(`Los datos salen de ${f.source}`);
  if (f.duration) details.push(`dedicáis ${f.duration.value} ${f.duration.unit} a este trabajo`);
  if (f.errors) details.push('a veces aparecen errores');
  const tail = details.length ? details.join(' y ') + '.' : '';
  return lead + '.' + (tail ? ' ' + tail[0].toUpperCase() + tail.slice(1) : '');
}
export function composeNaturalResponse(plan, state, turn, { repair = false } = {}) {
  const f = state.knownFacts;
  let text = '', ids = [], replies, actions = [];
  if (plan.action === 'HANDOFF') {
    text = `El siguiente paso es recoger una muestra de los datos y acordar qué resultado necesitáis. Puedes completar el diagnóstico o reservar una reunión con Víctor.`;
    actions = [createDiagnosticAction({id:'v2-handoff-diagnostic',label:'Completar diagnóstico'}),createCalendlyAction({id:'v2-handoff-meeting',label:'Reservar reunión',priority:'secondary'})];
  }
  if (plan.action === 'ORIENT_WITHOUT_CASE') {
    if (plan.variant === 'refusal') {
      text = 'De acuerdo, no hace falta que compartas ese dato. Podemos seguir sin él: puedes preguntarme por Víctor, sus proyectos o servicios, o contar solo la parte que sí quieras comentar.';
    } else if (plan.variant === 'second') {
      text = 'Podemos cambiar de enfoque. Puedes preguntarme por Víctor, ver sus proyectos o servicios, o contarme un problema cuando tengas uno concreto.';
    } else if (plan.variant === 'open') {
      text = 'Podemos dejarlo abierto y empezar por otro sitio. Elige una opción o escribe directamente lo que quieras saber.';
    } else {
      text = 'No hace falta que tengas un problema definido. Para empezar, puedes decirme qué quieres consultar o elegir uno de estos caminos.';
    }
    replies = generalEntryOptions;
  }
  if (plan.explainDuplicates) {
    text = 'Dos filas con el mismo importe y fecha pueden corresponder a operaciones distintas. Antes de quitar duplicados, conviene acordar un identificador o una combinación de campos que distinga los duplicados reales.';
    replies = ['Tenemos un identificador', 'Hay que combinar campos', 'Continuar con mi caso'];
  } else if (plan.evidence) {
    const evidence = resolveRelatedEvidence({ tools: f.tools });
    ids = evidence.records.map(e => e.knowledgeId);
    const titles = evidence.records.map(e => e.title).join(', ');
    text = evidence.level === EVIDENCE_LEVEL.PROFESSIONAL
      ? `Sí. Víctor tiene experiencia profesional relacionada con ${titles}. Esa experiencia es relevante para abordar tu caso; el alcance concreto dependerá del proceso y de los datos.`
      : evidence.level === EVIDENCE_LEVEL.PROJECT ? `Hay proyectos relacionados con esas herramientas: ${titles}. Sirven para comparar el enfoque con tu caso.`
      : evidence.level === EVIDENCE_LEVEL.CAPABILITY ? `Hay capacidades documentadas relacionadas: ${titles}. Podemos revisar cómo encajan en tu proceso.`
      : evidence.level === EVIDENCE_LEVEL.TRAINING ? `La evidencia disponible sobre ${titles} es de formación o uso de apoyo. No la presentaría como experiencia profesional en tu caso.`
      : 'Necesito concretar qué parte de tu caso quieres comparar para buscar experiencia relacionada.';
    replies = ['Continuar con mi caso', 'Ver proyectos'];
  } else if (plan.recap) {
    text = summarizeCase(f); replies = ['Continuar con mi caso', 'Ver cómo lo automatizaría'];
  } else if (plan.action === 'HANDOFF') {
    replies = ['Continuar con mi caso'];
  } else if (plan.action === 'PROVIDE_VALUE') {
    text = `${turn.intent === 'PROVIDE_VALUE' ? 'Sí, parece posible automatizar parte del trabajo. ' : 'Aquí hay una oportunidad de reducir trabajo manual. '}${plan.alreadyProvided && turn.intent !== 'PROVIDE_VALUE' ? '' : summarizeCase(f)} `;
    text += plan.detail
      ? 'Empezaría con una muestra: definir equivalencias entre nombres y campos, normalizar la estructura y transformar cada origen, comprobar totales y duplicados y comparar el resultado con el que obtenéis hoy. Después se podría programar la actualización y revisar las excepciones.'
      : 'Una primera solución sería reunir los datos, aplicar las transformaciones que se repiten y validar el resultado antes de actualizar el informe. Habría que comprobarlo con una muestra.';
  } else if (plan.action === 'CORRECT_HYPOTHESIS') {
    text = `Entendido: ${f.healthyTools.join(' y ') || 'esa herramienta'} funciona bien. ${f.operation ? `El trabajo que queréis mejorar es ${operations[f.operation]}. ` : 'Veamos qué ocurre antes de llegar al informe. '}`;
  } else if (plan.action === 'RESUME_TOPIC') {
    text = `Volvamos a tu caso: ${plan.alreadyProvided && turn.intent !== 'PROVIDE_VALUE' ? '' : summarizeCase(f)} `;
  } else if (plan.action === 'REPLAN') {
    text = f.source ? `Los datos salen de ${f.source}. ` : f.operation ? `Podemos revisar cómo quitar trabajo manual de este proceso: ${operations[f.operation]}. ` : f.sources?.kind.includes('departamento') ? `Los datos llegan de ${f.sources.count} departamentos. ` : `Trabajáis con ${f.tools.join(' y ') || 'varios archivos'}. `;
  } else if (turn.mentions?.length && f.tools.length) {
    text = `Vale, trabajáis con ${f.tools.join(' y ')}. `;
  } else if (f.frequency && plan.action !== 'CLARIFY') {
    text = `El proceso se repite ${frequencies[f.frequency]}${f.tools.length ? ` con ${f.tools.join(' y ')}` : ''}${f.duration ? ` y ocupa ${f.duration.value} ${f.duration.unit}` : ''}. `;
  } else if (f.duration && plan.action !== 'CLARIFY') {
    text = `Dedicar ${f.duration.value} ${f.duration.unit}${f.frequency ? ` ${frequencies[f.frequency]}` : ''} es un buen motivo para revisar el proceso. `;
  }
  if (turn.name) text = `Encantado, ${turn.name}. ${text}`;
  if (plan.question) {
    let [question, options] = prompts[plan.question] ?? prompts.examples;
    if (plan.question === 'examples' && (plan.variant || repair)) question = 'Sin problema. Puedes elegir una tarea habitual o describir solo el resultado que te gustaría conseguir.';
    text += `${text && !text.endsWith(' ') ? ' ' : ''}${question}`;
    replies = options;
  }
  replies ??= ['Ver cómo lo automatizaría', 'Continuar con mi caso'];
  const id = plan.action === 'ORIENT_WITHOUT_CASE'
    ? `response-v2-orientation-${plan.variant ?? 'first'}`
    : `response-v2-${plan.evidence ? 'evidence' : plan.recap ? 'recap' : plan.question ?? 'value'}`;
  return createResponseEnvelope({ id, kind: plan.evidence ? 'knowledge' : 'discovery', outcome: 'answered', messages: [{ id: `${id}-text`, text }], quickReplies: replies.map((label, i) => createAnswerQuickReply({ id: `${id}-${i}`, label, answer: label })), actions, evidence: { knowledgeIds: ids }, stateEffects: { resetFallbacks: true }, trace: { responseTemplateId: id } });
}
