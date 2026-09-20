import { getKnowledgeByType, getKnowledgeById } from '../data/knowledge.js';
import { composeKnowledgeListResponse } from './knowledge-response-composer.js';
import { composeKnowledgeOverviewResponse, KNOWLEDGE_OVERVIEW_TOPIC } from './knowledge-overview-response-composer.js';
import { discourseFromMessages } from './turn-interpreter.js';
import { createResponseEnvelope, RESPONSE_ACTION_PRIORITY } from './response-contract.js';
import { createAnswerQuickReply, createDiagnosticAction, createCalendlyAction } from './response-interactions.js';
import { resolveTechnologyMentions } from './technology-entities.js';
import { composeQualifiedResponse } from './qualified-response-composer.js';
import { composeSocialResponse } from './social-response-composer.js';
import { composeProblemSolutionServiceResponse } from './problem-solution-service-response-composer.js?v=final-qa.3';
import { DATAVERSO_COLLECTIONS } from './dataverso-response.js';
import {
  ANSWER_ALIGNMENT,
  PENDING_QUESTION_KIND,
  classifyAnswerToPendingQuestion,
  derivePendingQuestion,
  derivePendingQuestionFromHistory,
  isUnansweredAlignment,
} from './conversation-alignment.js';

const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[¿?¡!.,;:]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const DOMAIN_PROFILES = Object.freeze({
  excel: Object.freeze({
    problemIds: Object.freeze([
      'problem-manual-data-consolidation',
      'problem-multiple-excel-files',
      'problem-fragile-excel-model',
      'problem-manual-data-transformation',
    ]),
    initial: /(?:excel|archivos?).*(?:unir|uniend|juntar|copi|manual|consolid|transform)|(?:copi|junt|unir|consolid|transform).*(?:excel|archivos?)/,
    query: 'Trabajo con varios Excel o datos que tengo que consolidar manualmente.',
  }),
  reporting: Object.freeze({
    problemIds: Object.freeze([
      'problem-repetitive-reporting',
      'problem-manual-dashboard-refresh',
    ]),
    initial: /(?:power bi|informes?|reporting|dashboard).*(?:actualiz|manual|prepar|repet)|(?:actualiz|prepar).*(?:informes?|dashboard|power bi)/,
    query: 'Actualizo a mano informes o dashboards cada semana.',
  }),
  automation: Object.freeze({
    problemIds: Object.freeze([
      'problem-repetitive-copy-paste',
    ]),
    initial: /(?:copi|pegar|copy paste).*(?:herramient|sistema|aplicacion|datos)|(?:sistema|herramient|aplicacion).*(?:copi|pegar)/,
    query: 'Copio y pego datos manualmente entre herramientas todos los días.',
  }),
  access: Object.freeze({
    problemIds: Object.freeze([]),
    initial: /(?:access).*(?:manual|problema|informe|consulta|formulario|import|export|datos)|(?:manual|problema|informe|consulta|formulario|import|export|datos).*(?:access)/,
    query: 'Tengo un proceso manual en Access que quiero revisar.',
  }),
  documents: Object.freeze({
    problemIds: Object.freeze([
      'problem-manual-pdf-extraction',
      'problem-unstructured-documents',
    ]),
    initial: /(?:pdf|facturas?|documentos?).*(?:leer|copi|extraer|revis|manual|escanead)|(?:leer|copi|extraer|revis).*(?:pdf|facturas?|documentos?)/,
    query: 'Tengo muchos documentos o PDF que revisar y procesar manualmente.',
  }),
  dataquality: Object.freeze({
    problemIds: Object.freeze([
      'problem-data-quality',
      'problem-no-data-traceability',
    ]),
    initial: /(?:datos?).*(?:incorrect|inconsisten|duplicad|calidad|trazabilidad|no cuadr)|(?:errores?|duplicad|inconsisten).*(?:datos?|ficheros?)/,
    query: 'Tengo problemas de calidad o trazabilidad en los datos y no confío en el resultado.',
  }),
  scoring: Object.freeze({
    problemIds: Object.freeze([
      'problem-scoring-rules',
      'problem-complex-weighted-evaluation',
    ]),
    initial: /(?:scoring|puntuacion|evaluacion|criterios?|pesos?|subcompetencias?).*(?:reglas?|modelo|excel|calculo)|(?:reglas?|pesos?).*(?:evaluacion|scoring|criterios?)/,
    query: 'Tengo una evaluación con reglas, pesos y criterios que quiero hacer reproducible.',
  }),
  web: Object.freeze({
    problemIds: Object.freeze([
      'problem-web-data-collection',
      'problem-web-scoring-audit',
    ]),
    initial: /(?:webs?|paginas web|scraping).*(?:recopil|auditar|puntuar|scoring|datos)|(?:auditar|recopil|puntuar).*(?:webs?|paginas web)/,
    query: 'Necesito recopilar o evaluar información de muchas webs de forma repetible.',
  }),
  financial: Object.freeze({
    problemIds: Object.freeze([
      'problem-financial-analysis',
    ]),
    initial: /(?:dividend|inversion|activos?|financier).*(?:analiz|compar|seguim|dashboard)|(?:analiz|compar).*(?:dividend|activos?|inversion)/,
    query: 'Quiero ordenar y comparar datos financieros para hacer seguimiento.',
  }),
  ia: Object.freeze({
    problemIds: Object.freeze([
      'problem-ai-process-opportunity',
    ]),
    initial: /(?:usar|aplicar|empezar|probar|incorporar).*(?:\bia\b|inteligencia artificial)|(?:\bia\b|inteligencia artificial).*(?:proceso|empresa|aplicar|usar)/,
    query: 'Quiero aplicar IA, pero no sé dónde tendría sentido.',
  }),
});

const PROBLEM_DOMAIN = Object.freeze(
  Object.fromEntries(
    Object.entries(DOMAIN_PROFILES)
      .flatMap(([domain, profile]) => profile.problemIds.map(problemId => [problemId, domain])),
  ),
);

const DISCOVERY_QUESTION_STAGES = Object.freeze(new Set([
  'structure', 'schema', 'mapping', 'source', 'validation', 'duplicates',
  'task', 'volume', 'review', 'systems', 'controls',
  'quality-source', 'quality-check', 'doc-format', 'doc-fields',
  'rules', 'rule-change', 'web-scope', 'web-frequency',
  'metrics', 'financial-source',
]));

function envelope(domain, stage, text, replies = [], evidence = []) {
  return createResponseEnvelope({
    id: `response-progress-${domain}-${stage}`,
    kind: 'discovery',
    outcome: 'qualified',
    messages: [{ id: `msg-progress-${domain}-${stage}`, text }],
    quickReplies: replies.map((label, index) => createAnswerQuickReply({
      id: `qr-progress-${domain}-${stage}-${index}`,
      label,
      answer: label,
    })),
    evidence: { mode: evidence.length ? 'required' : 'none', knowledgeIds: evidence },
    conversation: { continuity: 'continuing' },
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: `progress-${domain}-${stage}` },
  });
}

function discoveryStages(messages, domain) {
  const initialStageByResponseId = {
    'response-problem-flow-problem-repetitive-copy-paste': ['automation', 'systems'],
    'response-problem-flow-problem-manual-pdf-extraction': ['documents', 'doc-format'],
    'response-problem-flow-problem-data-quality': ['dataquality', 'quality-problem'],
    'response-problem-flow-problem-financial-analysis': ['financial', 'financial-goal'],
  };

  return new Set(
    (messages ?? [])
      .filter(message => message?.role === 'assistant')
      .map(message => String(message?.responseId ?? ''))
      .map(id => {
        const progress = id.match(new RegExp(`^response-progress-${domain}-(.+)$`))?.[1] ?? null;
        if (progress) return progress.replace(/-retry$/, '');
        const initial = initialStageByResponseId[id];
        return initial?.[0] === domain ? initial[1] : null;
      })
      .filter(Boolean),
  );
}

function userHistoryText(messages, currentText = '') {
  return [
    ...(messages ?? []).filter(message => message?.role === 'user').map(message => normalize(message.text)),
    normalize(currentText),
  ].filter(Boolean).join(' ');
}

function stageCoveredByConversation(messages, domain, stage, currentText = '') {
  const all = userHistoryText(messages, currentText);
  const patterns = {
    'excel:structure': /(?:mismas? columnas|columnas? distintas?|estructura distinta|estructuras? distintas?|cada delegacion.*column)/,
    'excel:mapping': /(?:solo.*nombres?|cambian.*nombres?|nombres? de columnas?)/,
    'automation:systems': /(?:excel|access|power bi|power query|csv|sql|erp|crm|correo).*(?:sistema|excel|access|power bi|power query|csv|sql|erp|crm|correo)|(?:entre sistemas|dos sistemas|dos aplicaciones)/,
    'automation:frequency': /(?:diari|cada dia|todos los dias|seman|cada semana|mensual|cada mes|trimestr|anual)/,
    'documents:doc-format': /(?:escanead|pdf con texto|imagen|foto|mezcla de formatos|formatos variados)/,
    'documents:doc-fields': /(?:proveedor|fecha|importe|numero de factura|nif|cif|campo obligatorio)/,
    'documents:doc-review': /(?:revis|valid|comprueba|persona|equipo|responsable|nadie|automatic)/,
    'dataquality:quality-problem': /(?:error|incorrect|duplic|trazab|no cuadr|calidad)/,
    'dataquality:quality-source': /(?:errores?|diferencias?).*(?:fichero|archivo|sistema|fuente|departamento)|(?:fichero|archivo|sistema|fuente|departamento).*(?:errores?|diferencias?)/,
    'dataquality:quality-check': /(?:compar|total|campo obligatorio|reconcil|regla de control|control de|cuadr)/,
    'financial:financial-goal': /(?:seguim|compar|dashboard|analiz|control)/,
    'financial:metrics': /(?:margen|venta|rentab|dividend|precio|ratio|kpi|indicador|metrica|crecim|yield|volatil)/,
    'financial:financial-source': /(?:api|fichero|archivo|descarg|fuente manual)/,
  };
  return patterns[`${domain}:${stage}`]?.test(all) ?? false;
}

function discoveryQuestionCount(messages, domain) {
  const stages = discoveryStages(messages, domain);
  return [...stages].filter(stage => DISCOVERY_QUESTION_STAGES.has(stage)).length;
}

function nextStepEnvelope(domain, { reason = 'readiness', detailText = '', showPowerBiSeries = false } = {}) {
  const diagnostic = createDiagnosticAction({
    id: `action-progress-${domain}-diagnostic`,
    label: 'Completar diagnóstico',
    priority: RESPONSE_ACTION_PRIORITY.PRIMARY,
  });

  const booking = createCalendlyAction({
    id: `action-progress-${domain}-booking`,
    label: 'Reservar reunión',
    priority: RESPONSE_ACTION_PRIORITY.SECONDARY,
  });

  const baseText = reason === 'asked'
    ? 'Sí. Con lo que me has contado ya hay suficiente contexto para dar el siguiente paso. Puedes completar el diagnóstico para dejar el caso ordenado o reservar una reunión de 30 minutos con Víctor. Si prefieres aclarar algo más antes, podemos seguir hablando aquí.'
    : 'Con lo que me has contado ya hay suficiente contexto para que Víctor revise el caso con más detalle. Lo más útil ahora es completar el diagnóstico o, si prefieres hablarlo directamente, reservar una reunión de 30 minutos. Si todavía quieres aclarar algo antes, podemos seguir aquí.';

  const text = [detailText, baseText].filter(Boolean).join(' ');
  const messages = [{ id: `msg-progress-${domain}-handoff`, text }];

  if (showPowerBiSeries) {
    messages.push({
      id: `msg-progress-${domain}-power-bi-series`,
      text: `Si además quieres aprender o repasar Power BI mientras revisamos el caso, Víctor tiene la serie “${DATAVERSO_COLLECTIONS.powerBi.title}”:
${DATAVERSO_COLLECTIONS.powerBi.url}`,
    });
  }

  return createResponseEnvelope({
    id: `response-progress-${domain}-handoff`,
    kind: 'action',
    outcome: 'answered',
    messages,
    actions: [diagnostic, booking].filter(Boolean),
    evidence: { mode: 'none', knowledgeIds: [] },
    conversation: { continuity: 'continuing', suppressRepeatedCTA: true },
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: `progress-${domain}-handoff` },
  });
}

function postHandoffEnvelope(domain, text) {
  let message = 'Perfecto, ese matiz también ayuda a concretar el caso. Podemos seguir afinándolo aquí y, cuando quieras, pasar al diagnóstico o a la reunión.';

  if (domain === 'excel') {
    if (/diari|mensual|seman/.test(text)) {
      message = 'La frecuencia también importa: si hay controles diarios y mensuales, conviene separar cuáles deben ejecutarse siempre y cuáles solo al cierre. Eso sería parte de la revisión con Víctor.';
    } else if (/manual|comprob|valid/.test(text)) {
      message = 'Perfecto. Esas comprobaciones manuales son importantes: la idea no sería eliminarlas sin más, sino convertirlas en controles repetibles antes de consolidar o publicar el resultado.';
    }
  } else if (domain === 'reporting' && /manual|revis|control/.test(text)) {
    message = 'Ese control manual conviene mantenerlo como regla del proceso, pero ejecutarlo de forma repetible antes de actualizar el informe.';
  } else if (domain === 'ia' && /criter|categoria|revision/.test(text)) {
    message = 'Ese criterio de revisión es clave para una prueba de IA: sirve para medir aciertos y decidir qué casos deben seguir pasando por una persona.';
  }

  return envelope(domain, 'post-handoff', message);
}

function explicitDomain(text) {
  return Object.entries(DOMAIN_PROFILES)
    .find(([, profile]) => profile.initial.test(text))?.[0] ?? null;
}

function genericDataScopeEnvelope({ retry = false, reason = 'initial' } = {}) {
  const bridges = {
    initial: 'Entendido: el problema está alrededor de datos. Para no asumir el tipo de problema, necesito ubicar qué trabajo te pesa más.',
    partial: 'Ese dato ayuda a dimensionarlo, pero todavía no me dice qué parte del trabajo con datos te está dando problemas.',
    side: 'Lo tengo en cuenta. Aun así, me falta ubicar qué quieres mejorar de esos datos.',
    unknown: 'No hace falta que sepas todavía cuál es la causa. Podemos empezar por el tipo de trabajo que repites.',
    refusal: 'No necesitas compartir información sensible. Basta con situar el tipo de tarea.',
    incomprehensible: 'No he podido relacionar esa respuesta con el tipo de trabajo que quieres mejorar.',
  };
  return createResponseEnvelope({
    id: retry ? 'response-h3-generic-data-scope-retry' : 'response-h3-generic-data-scope',
    kind: 'discovery',
    outcome: 'qualified',
    messages: [{
      id: retry ? 'msg-h3-generic-data-scope-retry' : 'msg-h3-generic-data-scope',
      text: `${bridges[reason] ?? bridges.initial} ¿El problema está en reunir archivos, limpiar/revisar los datos, preparar informes o en otra tarea repetitiva?`,
    }],
    quickReplies: ['Reunir archivos', 'Limpiar / revisar datos', 'Preparar informes', 'Otra tarea repetitiva']
      .map((label, index) => createAnswerQuickReply({
        id: `qr-h3-generic-data-scope-${index}`,
        label,
        answer: label,
      })),
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: 'h3-generic-data-scope' },
  });
}

const PENDING_STAGE_PROMPTS = Object.freeze({
  structure: ['¿Los archivos tienen las mismas columnas o estructuras distintas?', ['Mismas columnas', 'Columnas distintas']],
  duplicates: ['¿Tenéis un identificador único o habría que combinar varios campos para distinguir registros?', ['Identificador único', 'Combinar campos']],
  schema: ['¿Las diferencias son sobre todo nombres de columnas o también faltan campos?', ['Solo los nombres', 'También faltan campos']],
  mapping: ['¿También cambian los formatos o solo los nombres?', ['Solo los nombres', 'También cambian formatos']],
  source: ['¿Las fuentes llegan en archivos, por correo o desde un sistema?', ['Archivos', 'Por correo', 'Desde un sistema']],
  validation: ['¿Quién valida hoy el resultado y qué control no puede faltar?', ['Lo valido yo', 'Lo valida otra persona', 'No hay un control claro']],
  systems: ['¿Entre qué herramientas se copian los datos?', []],
  frequency: ['¿Con qué frecuencia se repite ese copiar y pegar?', ['Todos los días', 'Cada semana', 'Cada mes']],
  controls: ['¿Qué comprobáis hoy antes de dar el proceso por bueno?', []],
  task: ['¿Dónde está el mayor trabajo manual: importar/exportar, consultas/formularios o preparar informes?', ['Importar / exportar', 'Consultas / formularios', 'Preparar informes']],
  'doc-format': ['¿La mayoría son PDF con texto, documentos escaneados o una mezcla?', ['PDF con texto', 'Escaneados', 'Mezcla']],
  'doc-fields': ['¿Qué campos necesitáis obtener siempre de cada documento?', []],
  'doc-review': ['¿Quién comprueba hoy que los datos extraídos sean correctos?', []],
  'quality-problem': ['¿Qué os preocupa más: datos incorrectos, duplicados o no poder seguir el origen?', ['Errores', 'Duplicados', 'Trazabilidad']],
  'quality-source': ['¿Los errores vienen de varios ficheros o de un sistema central?', []],
  'quality-check': ['¿Cómo comprobáis hoy que los datos cuadran?', []],
  rules: ['¿Las reglas cambian con frecuencia o son bastante estables?', ['Cambian a menudo', 'Son bastante estables']],
  'rule-change': ['¿Cómo validáis hoy que la puntuación final sea correcta?', []],
  'web-scope': ['¿Las webs siguen una estructura parecida o son muy distintas?', []],
  'web-frequency': ['¿Cuántas webs revisáis y cada cuánto necesitáis actualizar el análisis?', []],
  'financial-goal': ['¿Necesitas seguimiento, comparación entre activos o un dashboard de control?', ['Seguimiento', 'Comparar activos', 'Dashboard']],
  metrics: ['¿Qué indicadores necesitas comparar de forma periódica?', []],
  'financial-source': ['¿Las fuentes son manuales, APIs o ficheros descargados?', []],
  volume: ['¿Qué volumen manejáis y quién revisa hoy si el resultado es correcto?', []],
  review: ['¿Ya tenéis criterios o categorías definidos?', ['Sí, están definidos', 'Hay que definirlos']],
});

function retryPendingDomainQuestion(domain, pending, alignment, text) {
  const domainPrompt = domain === 'access' && pending.stage === 'source'
    ? ['¿Access trabaja solo o intercambia datos con Excel, CSV u otro sistema?', ['Con Excel', 'Con CSV', 'Con otro sistema']]
    : null;
  const [question, replies = []] = domainPrompt ?? PENDING_STAGE_PROMPTS[pending.stage] ?? ['¿Puedes concretar un poco ese punto del proceso?', []];
  let bridge = 'Ese dato es útil, pero no responde todavía a la pregunta que necesitamos resolver para avanzar.';
  if (alignment.relation === ANSWER_ALIGNMENT.PARTIAL) bridge = 'Eso responde solo a una parte; guardo el dato y completo lo que falta.';
  else if (alignment.relation === ANSWER_ALIGNMENT.UNKNOWN) bridge = 'No pasa nada si no lo sabes con precisión; podemos aproximarlo con una opción sencilla.';
  else if (alignment.relation === ANSWER_ALIGNMENT.REFUSAL) bridge = 'De acuerdo. No hace falta compartir detalles sensibles; una respuesta general es suficiente.';
  else if (alignment.relation === ANSWER_ALIGNMENT.INCOMPREHENSIBLE) bridge = 'No he podido relacionar esa respuesta con el punto que estábamos aclarando.';
  else if (alignment.relation === ANSWER_ALIGNMENT.CORRECTION) bridge = 'Gracias por la corrección. Actualizo ese dato, pero mantengo pendiente este punto.';

  if (/se podria automatizar|podria automatizar|es automatizable|se puede automatizar/.test(text)) {
    bridge = 'Sí, potencialmente se puede automatizar una parte, pero no sería responsable decidir cuál sin cerrar este dato del proceso.';
  } else if (/que podriamos hacer|que se podria hacer|que hariais|que recomiendas|que recomendarias/.test(text)) {
    bridge = 'La línea de trabajo sería separar entrada de datos, transformaciones y controles, y automatizar después lo repetible. Para concretarlo sin adivinar, me falta este dato.';
  }

  if (domain === 'dataquality' && pending.stage === 'quality-check' && /(?:manual|seman|diari|mensual)/.test(text)) {
    return envelope(domain, 'quality-check-retry', 'Perfecto, ya sé que la revisión es manual y recurrente. Me falta concretar el control: ¿qué comparáis o comprobáis para saber que los datos cuadran?');
  }

  return envelope(domain, `${pending.stage}-retry`, `${bridge} ${question}`, replies);
}

function activeDomain(messages) {
  for (let index = (messages ?? []).length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === 'assistant') {
      const responseId = String(message.responseId ?? '');

      if (/response-social-(?:goodbye|feedback)|response-(?:qualified|knowledge|overview)/.test(responseId)) {
        return null;
      }

      const progressMatch = responseId.match(/^response-progress-([a-z]+)-/);
      if (progressMatch?.[1] && DOMAIN_PROFILES[progressMatch[1]]) {
        return progressMatch[1];
      }

      const problemMatch = responseId.match(/^response-problem-flow-(problem-[a-z-]+)$/);
      const domain = problemMatch?.[1] ? PROBLEM_DOMAIN[problemMatch[1]] : null;
      if (domain) {
        return domain;
      }
    }

    if (message?.role === 'user') {
      const domain = explicitDomain(normalize(message.text));
      if (domain) {
        return domain;
      }
    }
  }

  return null;
}


function conversationMentionsPowerBi(messages, currentText = '') {
  return /power\s*bi/.test([
    currentText,
    ...(messages ?? []).filter(message => message?.role === 'user').map(message => message.text ?? ''),
  ].join(' ').toLowerCase());
}


function latestBusinessDomain(messages) {
  for (let index = (messages ?? []).length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'assistant') continue;
    const responseId = String(message.responseId ?? '');
    if (/^response-social-(?:goodbye|feedback)/.test(responseId)) return null;
    const progressMatch = responseId.match(/^response-progress-([a-z]+)-/);
    if (progressMatch?.[1] && DOMAIN_PROFILES[progressMatch[1]]) return progressMatch[1];
    const problemMatch = responseId.match(/^response-problem-flow-(problem-[a-z-]+)$/);
    const domain = problemMatch?.[1] ? PROBLEM_DOMAIN[problemMatch[1]] : null;
    if (domain) return domain;
    if (/^response-h2-process-/.test(responseId)) {
      const discourse = discourseFromMessages(messages.slice(0, index + 1));
      if (discourse?.tools?.includes('Access')) return 'access';
      if (discourse?.tools?.includes('Power BI')) return 'reporting';
      if (discourse?.tools?.includes('Excel') || discourse?.tools?.includes('CSV')) return 'excel';
      return 'automation';
    }
  }
  return null;
}

function recapBusinessCase(domain, messages) {
  const discourse = discourseFromMessages(messages);
  const userText = (messages ?? []).filter(message => message?.role === 'user').map(message => normalize(message.text)).join(' ');
  const labels = {
    excel: 'Excel, ficheros o consolidación de datos',
    reporting: 'informes / Power BI',
    automation: 'un proceso manual o repetitivo',
    access: 'Access',
    documents: 'documentos o PDF',
    dataquality: 'calidad o trazabilidad de datos',
    scoring: 'un modelo de evaluación y reglas',
    web: 'recogida o evaluación de información web',
    financial: 'seguimiento de datos financieros',
    ia: 'un caso de uso de IA',
  };
  const details = [];
  if (discourse?.tools?.length) details.push(`Herramientas mencionadas: ${discourse.tools.join(', ')}.`);
  if (discourse?.frequency) details.push(`Frecuencia: ${{ daily: 'diaria', weekly: 'semanal', monthly: 'mensual' }[discourse.frequency]}.`);
  if (/correo/.test(userText)) details.push('Comentaste que parte de la información llega por correo.');
  if (/manual/.test(userText)) details.push('También indicaste que hay trabajo o controles manuales.');
  return envelope(
    domain,
    'recap',
    `Me habías contado un caso relacionado con ${labels[domain] ?? 'un proceso de datos'}. ${details.join(' ')} Podemos continuar desde ahí sin empezar de cero.`,
    ['Continuar', 'Completar diagnóstico', 'Reservar reunión'],
  );
}

function optionalNameEnvelope(reason = 'declined') {
  const text = reason === 'why'
    ? 'El nombre solo sirve para hacer la conversación un poco más natural. Es totalmente opcional: no necesitas dármelo para preguntarme nada ni para explicar tu caso.'
    : 'Perfecto. No necesitas decirme tu nombre. Puedes contarme directamente qué quieres resolver o elegir una de estas opciones.';
  return createResponseEnvelope({
    id: `response-social-name-${reason}`,
    kind: 'social',
    outcome: 'social',
    messages: [{ id: `msg-social-name-${reason}`, text }],
    quickReplies: [
      createAnswerQuickReply({ id: 'qr-name-problem', label: 'Tengo un problema', answer: 'Tengo un problema y no sé por dónde empezar.' }),
      createAnswerQuickReply({ id: 'qr-name-excel', label: 'Excel / Access', answer: 'Tengo un problema con Excel o Access y procesos manuales.' }),
      createAnswerQuickReply({ id: 'qr-name-reporting', label: 'Informes / Power BI', answer: 'Tengo un problema con informes o Power BI.' }),
      createAnswerQuickReply({ id: 'qr-name-profile', label: 'Conocer a Víctor', answer: '¿Quién es Víctor y en qué me puede ayudar?' }),
    ],
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: `social-name-${reason}` },
  });
}

function resumeGenericPendingEnvelope(pending) {
  if (pending?.kind === PENDING_QUESTION_KIND.BOTTLENECK) {
    return createResponseEnvelope({
      id: 'response-h2-process-bottleneck-retry',
      kind: 'discovery',
      outcome: 'qualified',
      messages: [{ id: 'msg-h2-resume-bottleneck', text: 'Claro. Volvemos a tu caso. Se había quedado pendiente ubicar dónde se os va más tiempo: ¿en mover/reunir los datos, revisarlos o preparar/actualizar el informe?' }],
      quickReplies: ['Mover / reunir datos', 'Revisar datos', 'Preparar informes'].map((label, index) => createAnswerQuickReply({ id: `qr-h2-resume-bottleneck-${index}`, label, answer: label })),
      stateEffects: { resetFallbacks: true },
      trace: { responseTemplateId: 'h2-resume-bottleneck' },
    });
  }
  if (pending?.kind === PENDING_QUESTION_KIND.PROCESS_DETAIL || pending?.kind === PENDING_QUESTION_KIND.FREQUENCY_CONTROLS) {
    return createResponseEnvelope({
      id: 'response-h2-process-detail-retry',
      kind: 'discovery',
      outcome: 'qualified',
      messages: [{ id: 'msg-h2-resume-detail', text: 'Claro. Retomamos tu caso donde lo dejamos: ¿qué parte hacéis manualmente cada vez, preparar/limpiar los datos, validarlos o actualizar el informe?' }],
      quickReplies: ['Preparar / limpiar datos', 'Validar / revisar', 'Actualizar informe'].map((label, index) => createAnswerQuickReply({ id: `qr-h2-resume-detail-${index}`, label, answer: label })),
      stateEffects: { resetFallbacks: true },
      trace: { responseTemplateId: 'h2-resume-detail' },
    });
  }
  return null;
}

function bookingStatusEnvelope() {
  const booking = createCalendlyAction({
    id: 'action-booking-status-calendly',
    label: 'Volver a Calendly',
    priority: RESPONSE_ACTION_PRIORITY.PRIMARY,
  });
  return createResponseEnvelope({
    id: 'response-booking-status-pending-confirmation',
    kind: 'action',
    outcome: 'answered',
    messages: [{
      id: 'msg-booking-status-pending-confirmation',
      text: 'Elegir una fecha y una hora en Calendly no me permite confirmar desde este chat que la reserva haya quedado registrada. La cita solo debe darse por confirmada cuando Calendly completa la reserva y muestra o envía su confirmación. Si no la viste, puedes volver a Calendly para comprobarlo.',
    }],
    actions: booking ? [booking] : [],
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: 'booking-status-pending-confirmation' },
  });
}

function overviewFollowUpResponse(text, lastAssistant) {
  const responseId = String(lastAssistant?.responseId ?? '');
  if (!responseId.startsWith('response-knowledge-overview-technologies-')) return null;
  let canonical = null;
  if (/actual|ahora|hoy/.test(text)) canonical = '¿Qué tecnologías conoce Víctor con uso profesional actual?';
  else if (/histor|antes|trayectoria/.test(text)) canonical = '¿Qué tecnologías conoce Víctor con experiencia histórica?';
  else if (/formacion|proyecto|aprendid|estudi/.test(text)) canonical = '¿Qué tecnologías conoce Víctor por formación o proyectos?';
  else if (/todo|todas|detalle|completo/.test(text)) canonical = '¿Qué tecnologías conoce Víctor? Muéstrame todas las tecnologías.';
  if (!canonical) return null;
  return composeKnowledgeOverviewResponse({
    userText: canonical,
    topic: KNOWLEDGE_OVERVIEW_TOPIC.TECHNOLOGIES,
  });
}

function certificationFollowUpResponse(text, messages, context) {
  const previous = [...(messages ?? [])].reverse().find(message =>
    message?.role === 'assistant' && String(message.responseId ?? '').startsWith('response-qualified-certification-')
  );
  if (!previous) return null;
  if (!/(certific|obtenid|aprob|ya esta|ya la|portfolio|eso|actual|ahora|hoy|sigue)/.test(text)) return null;
  const knowledgeId = String(previous.responseId).replace(/^response-qualified-/, '');
  const item = getKnowledgeById(knowledgeId);
  if (!item) return null;
  return composeQualifiedResponse({
    knowledgeId: item.id,
    userText: `¿Cuál es el estado actual de ${item.title}?`,
    context,
  });
}

function handoffDetail(domain, text) {
  switch (domain) {
    case 'excel':
      if (/nombre/.test(text)) return 'Si las diferencias son sobre todo de nombres, se puede definir una tabla de equivalencias y validar los campos obligatorios antes de consolidar.';
      if (/faltan|campo/.test(text)) return 'Si también faltan campos, conviene separar los obligatorios de los opcionales y avisar antes de cargar un archivo incompleto.';
      if (/manual|comprob|valid/.test(text)) return 'Si esas comprobaciones se hacen manualmente, son una buena candidata para convertirlas en controles automáticos antes de publicar el resultado.';
      return '';
    case 'reporting':
      if (/correo/.test(text)) return 'Si las fuentes llegan por correo, conviene fijar un punto de entrada y comprobar que estén todos los archivos antes de actualizar el informe.';
      if (/manual|revis/.test(text)) return 'Si la validación final sigue siendo manual, podemos convertir parte de esos controles en comprobaciones repetibles antes del refresh.';
      return '';
    case 'automation':
      if (/manual|valid|campo/.test(text)) return 'Ese control manual es precisamente el tipo de paso que habría que conservar como regla antes de automatizar el movimiento de datos.';
      return '';
    case 'access':
      if (/informe|report/.test(text)) return 'Si Access termina alimentando informes, conviene separar la extracción y validación del dato de la capa de reporting para reducir pasos manuales.';
      if (/consulta|formulario|import|export/.test(text)) return 'Ese punto del flujo es una buena candidata para revisar qué puede automatizarse sin perder los controles actuales.';
      return '';
    case 'documents':
      if (/escanead|imagen/.test(text)) return 'Si parte de los documentos viene escaneada, habría que combinar extracción/OCR con una revisión de los casos dudosos.';
      if (/campo|dato/.test(text)) return 'Con los campos obligatorios definidos ya se puede diseñar una extracción y validación mucho más concreta.';
      return '';
    case 'dataquality':
      if (/manual|semana|diari/.test(text)) return 'Si hoy la comprobación es manual y recurrente, tiene sentido mover esos controles antes del informe para detectar diferencias cuanto antes.';
      return '';
    case 'scoring':
      if (/manual|valid/.test(text)) return 'Si la validación del resultado es manual, conviene convertir ejemplos conocidos en casos de prueba para proteger los cambios de reglas y pesos.';
      return '';
    case 'web':
      if (/seman|mes|diari|\d/.test(text)) return 'Con volumen y frecuencia definidos ya se puede dimensionar una recogida repetible y los controles necesarios.';
      return '';
    case 'financial':
      if (/api|archivo|manual|fuente/.test(text)) return 'Con las fuentes identificadas ya se puede plantear una actualización homogénea y trazable de las métricas.';
      return '';
    case 'ia':
      if (/definid|categoria|criterio/.test(text)) return 'Si ya tenéis categorías o criterios definidos, una prueba con una muestra revisada permite medir aciertos, errores y tiempo de revisión antes de ampliar.';
      if (/cien|\d|volumen|dia/.test(text)) return 'Con ese volumen ya merece la pena probar sobre una muestra controlada y medir cuánto trabajo de revisión sigue siendo necesario.';
      return '';
    default:
      return '';
  }
}

function domainDiscoveryResponse(domain, text, messages) {
  const stages = discoveryStages(messages, domain);
  const seen = stage => stages.has(stage);

  switch (domain) {
    case 'excel': {
      if (!seen('structure') && !stageCoveredByConversation(messages, domain, 'structure', text)) {
        if (/limpi|duplicad|vacio|formato/.test(text)) {
          return envelope(domain, 'structure', 'Antes de automatizar la limpieza, separaría errores de formato, campos vacíos y duplicados. ¿Cuál de esos problemas os aparece con más frecuencia?', ['Duplicados', 'Campos vacíos', 'Formatos distintos']);
        }
        return envelope(domain, 'structure', 'Entonces el cuello de botella está en reunir los archivos. ¿Todos tienen las mismas columnas o cada delegación utiliza una estructura distinta?', ['Mismas columnas', 'Columnas distintas']);
      }

      if (/duplicad/.test(text) && !seen('duplicates')) {
        return envelope(domain, 'duplicates', 'Antes de eliminar filas, conviene definir qué identifica cada registro: dos filas parecidas pueden representar operaciones distintas. ¿Tenéis un identificador único o habría que combinar varios campos?', ['Identificador único', 'Combinar campos']);
      }

      if (!seen('schema') && !seen('mapping')) {
        if (/nombre/.test(text)) {
          return envelope(domain, 'mapping', 'Si cambian los nombres, se puede preparar una tabla de equivalencias y validar los campos obligatorios antes de unir los archivos. ¿También cambian los formatos o solo los nombres?', ['Solo los nombres', 'También cambian formatos']);
        }
        return envelope(domain, 'schema', 'Entonces hay que normalizar la estructura antes de consolidar. ¿Las diferencias son sobre todo nombres de columnas o también faltan campos?', ['Solo los nombres', 'También faltan campos']);
      }

      return nextStepEnvelope(domain, { detailText: handoffDetail(domain, text) });
    }

    case 'reporting': {
      if (!seen('source')) {
        return envelope(domain, 'source', 'Antes de tocar el dashboard, revisaría cómo llegan y se preparan los datos. ¿Las fuentes llegan en archivos, por correo o desde un sistema?', ['Archivos', 'Por correo', 'Desde un sistema']);
      }
      if (!seen('validation')) {
        const lead = /correo/.test(text)
          ? 'Si las fuentes llegan por correo, conviene fijar un punto de entrada y comprobar que estén todos los archivos antes de actualizar.'
          : 'El siguiente punto es comprobar que el dato esté completo antes de actualizar el informe.';
        return envelope(domain, 'validation', `${lead} ¿Quién valida hoy el resultado y qué control no puede faltar?`, ['Lo valido yo', 'Lo valida otra persona', 'No hay un control claro']);
      }
      return nextStepEnvelope(domain, { showPowerBiSeries: conversationMentionsPowerBi(messages, text) });
    }

    case 'automation': {
      if (!seen('systems') && !stageCoveredByConversation(messages, domain, 'systems', text)) {
        return envelope(domain, 'systems', 'Aquí conviene entender el recorrido de la información antes de automatizar. ¿Entre qué herramientas se copian los datos?');
      }
      if (!seen('frequency') && !stageCoveredByConversation(messages, domain, 'frequency', text)) {
        return envelope(domain, 'frequency', 'Perfecto, ya tenemos localizado el recorrido. ¿Con qué frecuencia se repite ese copiar y pegar?', ['Todos los días', 'Cada semana', 'Cada mes']);
      }
      if (!seen('controls')) {
        return envelope(domain, 'controls', 'Perfecto. Antes de mover los datos automáticamente, dejaría claro qué validación debe pasar cada registro. ¿Qué comprobáis hoy antes de dar el proceso por bueno?');
      }
      return nextStepEnvelope(domain);
    }

    case 'access': {
      if (!seen('task')) {
        return envelope(domain, 'task', 'En Access, ¿dónde está ahora el mayor trabajo manual: importar o exportar datos, mantener consultas/formularios o preparar informes?', ['Importar / exportar', 'Consultas / formularios', 'Preparar informes']);
      }
      if (!seen('source')) {
        return envelope(domain, 'source', 'Para situar el flujo completo, ¿Access trabaja solo o intercambia datos con Excel, CSV u otro sistema?', ['Con Excel', 'Con CSV', 'Con otro sistema']);
      }
      return nextStepEnvelope(domain);
    }

    case 'documents': {
      if (!seen('doc-format') && !stageCoveredByConversation(messages, domain, 'doc-format', text)) {
        return envelope(domain, 'doc-format', 'Para elegir el enfoque necesito distinguir el formato. ¿La mayoría son PDF con texto, documentos escaneados o una mezcla?', ['PDF con texto', 'Escaneados', 'Mezcla']);
      }
      if (!seen('doc-fields') && !stageCoveredByConversation(messages, domain, 'doc-fields', text)) {
        const lead = /escanead|imagen|foto/.test(text)
          ? 'Si parte de los documentos viene escaneada, habrá que combinar extracción/OCR con revisión de los casos dudosos.'
          : 'Con el formato ya situado, el siguiente paso es definir qué información debe salir de cada documento.';
        return envelope(domain, 'doc-fields', `${lead} ¿Qué campos necesitáis obtener siempre?`);
      }
      if (!seen('doc-review') && !stageCoveredByConversation(messages, domain, 'doc-review', text)) {
        return envelope(domain, 'doc-review', 'Perfecto, ya están claros los campos. Para cerrar el control del proceso: ¿quién comprueba hoy que los datos extraídos sean correctos?');
      }
      return nextStepEnvelope(domain);
    }

    case 'dataquality': {
      if (!seen('quality-problem') && !stageCoveredByConversation(messages, domain, 'quality-problem', text)) {
        return envelope(domain, 'quality-problem', 'Para no asumir la causa, ¿qué os preocupa más: datos incorrectos, duplicados o no poder seguir el origen?', ['Errores', 'Duplicados', 'Trazabilidad']);
      }
      if (!seen('quality-source') && !stageCoveredByConversation(messages, domain, 'quality-source', text)) {
        return envelope(domain, 'quality-source', 'Lo primero sería localizar dónde aparecen las diferencias. ¿Los errores vienen de varios ficheros o de un sistema central?');
      }
      if (!seen('quality-check')) {
        return envelope(domain, 'quality-check', 'Ya tenemos el origen aproximado. El siguiente paso es convertir la revisión en controles explícitos. ¿Cómo comprobáis hoy que los datos cuadran?');
      }
      return nextStepEnvelope(domain);
    }

    case 'scoring': {
      if (!seen('rules')) {
        return envelope(domain, 'rules', 'Para hacerlo mantenible separaría reglas, pesos y cálculo final. ¿Las reglas cambian con frecuencia o son bastante estables?', ['Cambian a menudo', 'Son bastante estables']);
      }
      if (!seen('rule-change')) {
        return envelope(domain, 'rule-change', 'El otro punto clave es poder demostrar que un cambio no rompe el resultado. ¿Cómo validáis hoy que la puntuación final sea correcta?');
      }
      return nextStepEnvelope(domain);
    }

    case 'web': {
      if (!seen('web-scope')) {
        return envelope(domain, 'web-scope', 'Antes de automatizar la revisión, concretaría qué información pública hay que recoger y qué criterios se aplican. ¿Las webs siguen una estructura parecida o son muy distintas?');
      }
      if (!seen('web-frequency')) {
        return envelope(domain, 'web-frequency', 'También conviene fijar volumen y frecuencia para diseñar controles y reintentos. ¿Cuántas webs revisáis y cada cuánto necesitáis actualizar el análisis?');
      }
      return nextStepEnvelope(domain);
    }

    case 'financial': {
      if (!seen('financial-goal') && !stageCoveredByConversation(messages, domain, 'financial-goal', text)) {
        return envelope(domain, 'financial-goal', 'Para mantenerlo como herramienta de análisis y no como recomendación financiera, ¿qué necesitas principalmente: seguimiento, comparación entre activos o un dashboard de control?', ['Seguimiento', 'Comparar activos', 'Dashboard']);
      }
      if (!seen('metrics') && !stageCoveredByConversation(messages, domain, 'metrics', text)) {
        return envelope(domain, 'metrics', 'Ya está claro el objetivo. ¿Qué indicadores concretos necesitas comparar de forma periódica?');
      }
      if (!seen('financial-source') && !stageCoveredByConversation(messages, domain, 'financial-source', text)) {
        return envelope(domain, 'financial-source', 'Después revisaría de dónde salen esos datos. ¿Hoy las fuentes son manuales, APIs o ficheros descargados?');
      }
      return nextStepEnvelope(domain);
    }

    case 'ia': {
      if (!seen('volume')) {
        return envelope(domain, 'volume', 'Empezaría por una tarea concreta y medible. ¿Qué volumen manejáis y quién revisa hoy si el resultado es correcto?');
      }
      if (!seen('review')) {
        return envelope(domain, 'review', 'Con ese volumen, una prueba pequeña permitiría comparar tiempo y errores manteniendo revisión humana en los casos dudosos. ¿Ya tenéis criterios o categorías definidos?', ['Sí, están definidos', 'Hay que definirlos']);
      }
      return nextStepEnvelope(domain);
    }

    default:
      return null;
  }
}

export function resolveConversationContinuation(userText, context = {}) {
  const text = normalize(userText);
  const messages = context.recentMessages ?? [];
  const lastAssistant = [...messages].reverse().find(message => message.role === 'assistant');
  const result = response => ({ route: 'problem_flow', response });

  const overviewResponse = overviewFollowUpResponse(text, lastAssistant);
  if (overviewResponse) {
    return { route: 'knowledge_overview', response: overviewResponse };
  }

  const certificationResponse = certificationFollowUpResponse(text, messages, context);
  if (certificationResponse) {
    return { route: 'knowledge_direct', response: certificationResponse };
  }

  if (/^(?:prefiero|quiero) no (?:decir|dar)(?:te)? mi nombre$|^no (?:quiero|voy a) decir(?:te)? mi nombre$/.test(text)) {
    return { route: 'social', response: optionalNameEnvelope('declined') };
  }

  if (/^(?:por que|para que) (?:lo )?(?:pides|preguntas|necesitas|quieres)(?: el nombre)?$|^(?:por que|para que) (?:pides|preguntas) (?:mi )?nombre$/.test(text)) {
    const nameContext = (messages ?? []).some(message => String(message?.responseId ?? '').startsWith('response-social-name-'));
    if (nameContext) return { route: 'social', response: optionalNameEnvelope('why') };
  }

  const bookingContext = (messages ?? []).some(message =>
    message?.role === 'assistant' && /^(?:response-operational-booking|response-booking-status-)/.test(String(message.responseId ?? ''))
  );
  if (bookingContext && /(?:ya )?(?:elegi|seleccione|escogi).*(?:fecha|hora)|(?:ya )?(?:esta|quedo).*(?:reservad|confirmad)|tengo (?:cita|reunion|reserva)/.test(text)) {
    return { route: 'operational', response: bookingStatusEnvelope() };
  }

  // Explicit operational/contact intent must not be swallowed by a domain
  // mention in the same turn (e.g. “problema con Access, ¿cómo contacto?”).
  if (/(?:contactar|contacto|email|correo de victor|linkedin).*(?:victor)?|(?:como|donde).*(?:contactar|contacto).*(?:victor)?/.test(text)) {
    return null;
  }

  const priorDomain = latestBusinessDomain(messages);
  if (priorDomain && /(?:volvamos|retomemos|regresemos|volver|retomar).*(?:problema|caso|lo mio|mi tema)|^(?:volvamos|retomemos)$/.test(text)) {
    const historicPending = derivePendingQuestionFromHistory(messages);
    const genericResume = resumeGenericPendingEnvelope(historicPending);
    if (genericResume) return result(genericResume);
    const resumed = domainDiscoveryResponse(priorDomain, text, messages) ?? nextStepEnvelope(priorDomain, {
      reason: 'asked',
      showPowerBiSeries: priorDomain === 'reporting' && conversationMentionsPowerBi(messages, text),
    });
    return result(resumed);
  }

  if (priorDomain && /que (?:problema|caso).*?(?:contado|dicho|te acabo de contar)|que te acabo de contar|recuerdame.*(?:problema|caso)|resume.*(?:problema|caso)/.test(text)) {
    return result(recapBusinessCase(priorDomain, messages));
  }

  if (/^(?:muchas )?gracias(?: por (?:todo|la ayuda))?$/.test(text)) {
    return { route: 'social', intent: 'thanks', response: composeSocialResponse({ intent: 'thanks', context }) };
  }

  if (/^(?:no quiero|no deseo|prefiero no|no voy a) (?:reservar|agendar|concertar)/.test(text)) {
    return {
      route: 'social',
      response: createResponseEnvelope({
        id: 'response-reservation-declined',
        kind: 'social',
        outcome: 'social',
        messages: [{ id: 'msg-reservation-declined', text: 'De acuerdo. Podemos seguir aquí con tus dudas; no hace falta reservar.' }],
      }),
    };
  }

  if (/feedback/.test(lastAssistant?.responseId ?? '') || /te ha resultado util/.test(normalize(lastAssistant?.text))) {
    const rating = /^(?:[45]|si|bien|util)$/.test(text)
      ? 'positive'
      : /^(?:[12]|no)$/.test(text)
        ? 'negative'
        : /^(?:3|regular|mas o menos)$/.test(text)
          ? 'neutral'
          : null;

    if (rating) {
      return {
        route: 'social',
        intent: 'feedback_rating',
        feedbackRating: rating,
        response: composeSocialResponse({ intent: 'feedback_rating', context, feedbackRating: rating }),
      };
    }
  }

  const fromNeedDiscovery = String(lastAssistant?.responseId ?? '').startsWith('response-need-discovery-');

  if (fromNeedDiscovery) {
    if (/^(?:con )?(?:informes?|reporting|dashboards?|power bi)$/.test(text)) {
      return result(composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES.reporting.query, context }));
    }

    if (/^(?:con )?(?:excel|datos|ficheros?|archivos?)$/.test(text)) {
      return result(composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES.excel.query, context }));
    }

    if (/^(?:con )?(?:access|microsoft access)$/.test(text)) {
      return result(envelope(
        'access',
        'task',
        'Entendido, hablamos de Access. ¿Dónde está ahora el mayor trabajo manual: importar o exportar datos, mantener consultas/formularios o preparar informes?',
        ['Importar / exportar', 'Consultas / formularios', 'Preparar informes'],
      ));
    }

    if (/^(?:con )?(?:automatizacion|procesos? repetitivos?|copiar y pegar)$/.test(text)) {
      return result(composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES.automation.query, context }));
    }

    if (/^(?:con )?(?:ia|inteligencia artificial)$/.test(text)) {
      return result(composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES.ia.query, context }));
    }

    if (/\bdatos?\b/.test(text)) {
      return result(genericDataScopeEnvelope());
    }
  }

  const technologies = resolveTechnologyMentions(userText);

  if (technologies.length > 1 && /experiencia|conoce|domina|ha usado/.test(text)) {
    const responses = technologies
      .map(technology => composeQualifiedResponse({
        knowledgeId: technology.id,
        userText: `¿Qué experiencia tiene Víctor con ${technology.title}?`,
        context,
      }))
      .filter(Boolean);

    if (responses.length) {
      return {
        route: 'knowledge_direct',
        response: createResponseEnvelope({
          id: 'response-qualified-multiple',
          kind: 'knowledge',
          outcome: 'qualified',
          messages: responses.flatMap((response, index) => response.messages.map(message => ({
            ...message,
            text: `${technologies[index].title}: ${message.text}`,
          }))),
          evidence: {
            mode: 'required',
            knowledgeIds: [...new Set(responses.flatMap(response => response.evidence.knowledgeIds))],
            factIds: [...new Set(responses.flatMap(response => response.evidence.factIds))],
          },
          safety: { mustQualify: true },
        }),
      };
    }
  }

  if (technologies.length === 1 && /proyectos?/.test(text)) {
    const projects = getKnowledgeByType('project')
      .filter(project => project.facts?.find(fact => fact.key === 'technologies')?.value?.includes(technologies[0].id));

    if (projects.length) {
      return {
        route: 'knowledge_direct',
        response: composeKnowledgeListResponse({
          knowledgeIds: projects.map(project => project.id),
          intro: `Estos proyectos del portfolio utilizan ${technologies[0].title}:`,
          context,
        }),
      };
    }
  }

  if (technologies.length === 1 && context.continuing && /experiencia/.test(text) && !/problema|necesito|manual/.test(text)) {
    return {
      route: 'knowledge_direct',
      response: composeQualifiedResponse({ knowledgeId: technologies[0].id, userText, context }),
    };
  }

  if (technologies.length === 1 && /^(?:y (?:con |en )?|ahora quiero saber sobre )/.test(text)) {
    return {
      route: 'knowledge_direct',
      response: composeQualifiedResponse({
        knowledgeId: technologies[0].id,
        userText: `¿Qué experiencia tiene Víctor con ${technologies[0].title}?`,
        context,
      }),
    };
  }

  if (/^(?:lo ha usado profesionalmente|lo usa actualmente|cuentame mas|dime mas)$/.test(text) && /qualified/.test(lastAssistant?.responseId ?? '')) {
    const lastUser = [...messages]
      .reverse()
      .find(message => message.role === 'user' && resolveTechnologyMentions(message.text).length === 1);
    const item = resolveTechnologyMentions(lastUser?.text)[0];

    if (item && /qlik/.test(item.id)) {
      return {
        route: 'knowledge_direct',
        response: createResponseEnvelope({
          id: 'response-qualified-qlik-detail',
          kind: 'knowledge',
          outcome: 'qualified',
          messages: [{ id: 'msg-qlik-detail', text: 'No hay más detalle confirmado sobre Qlik en la información disponible. Para un puesto que lo requiera, convendría preguntárselo directamente a Víctor.' }],
          evidence: { mode: 'required', knowledgeIds: [item.id] },
          safety: { mustQualify: true },
        }),
      };
    }

    if (item && /aws/.test(item.id)) {
      return {
        route: 'knowledge_direct',
        response: createResponseEnvelope({
          id: 'response-qualified-aws-detail',
          kind: 'knowledge',
          outcome: 'qualified',
          messages: [{ id: 'msg-aws-detail', text: 'No tengo documentado un uso profesional de AWS. Lo que consta es formación y exposición durante sus estudios de IA y Big Data.' }],
          evidence: { mode: 'required', knowledgeIds: [item.id] },
          safety: { mustQualify: true },
        }),
      };
    }

    if (item) {
      return {
        route: 'knowledge_direct',
        response: composeQualifiedResponse({
          knowledgeId: item.id,
          userText: `¿Ha usado profesionalmente ${item.title}?`,
          context,
        }),
      };
    }
  }

  const pendingQuestion = derivePendingQuestion(messages);

  if (pendingQuestion?.kind === PENDING_QUESTION_KIND.DATA_SCOPE) {
    const alignment = classifyAnswerToPendingQuestion(userText, pendingQuestion);
    if (alignment.relation === ANSWER_ALIGNMENT.TOPIC_SWITCH) return null;

    if (alignment.relation === ANSWER_ALIGNMENT.COMPLETE || alignment.relation === ANSWER_ALIGNMENT.CORRECTION) {
      if (/access/.test(text)) {
        return result(envelope('access', 'task', 'Entendido: Access forma parte del proceso. ¿Dónde está ahora el mayor trabajo manual: importar o exportar datos, mantener consultas/formularios o preparar informes?', ['Importar / exportar', 'Consultas / formularios', 'Preparar informes']));
      }
      if (/power bi|informe|report|dashboard/.test(text)) {
        return result(envelope('reporting', 'source', 'Entendido: el problema está alrededor de la preparación o actualización de informes. Para situar el flujo, ¿las fuentes llegan en archivos, por correo o desde un sistema?', ['Archivos', 'Por correo', 'Desde un sistema']));
      }
      if (/error|calidad|duplic|no cuadr|incorrect/.test(text)) {
        return result(envelope('dataquality', 'quality-source', 'Entendido: el problema está en la calidad o consistencia del dato. ¿Las diferencias vienen de varios ficheros o de un sistema central?'));
      }
      if (/excel|csv|archivo|fichero|reunir|juntar|consolid/.test(text)) {
        return result(envelope('excel', 'structure', 'Entendido: trabajáis con varios archivos. Antes de automatizar, necesito saber si comparten estructura. ¿Tienen las mismas columnas o cambian entre archivos?', ['Mismas columnas', 'Columnas distintas']));
      }
      if (/manual|automat|copi|peg|repet/.test(text)) {
        return result(envelope('automation', 'systems', 'Entendido: hay una tarea repetitiva con datos. Para ubicarla, ¿entre qué herramientas se mueve la información y con qué frecuencia ocurre?'));
      }
    }

    const reason = alignment.relation === ANSWER_ALIGNMENT.PARTIAL ? 'partial'
      : alignment.relation === ANSWER_ALIGNMENT.UNKNOWN ? 'unknown'
        : alignment.relation === ANSWER_ALIGNMENT.REFUSAL ? 'refusal'
          : alignment.relation === ANSWER_ALIGNMENT.INCOMPREHENSIBLE ? 'incomprehensible'
            : 'side';
    return result(genericDataScopeEnvelope({ retry: true, reason }));
  }

  let domain = activeDomain(messages) ?? priorDomain;
  const explicit = explicitDomain(text);

  if (explicit && !domain) {
    if (explicit === 'access') {
      return result(envelope(
        'access',
        'task',
        'Entendido, hablamos de Access. ¿Dónde está ahora el mayor trabajo manual: importar o exportar datos, mantener consultas/formularios o preparar informes?',
        ['Importar / exportar', 'Consultas / formularios', 'Preparar informes'],
      ));
    }
    if (composeProblemSolutionServiceResponse({ userText, context })) {
      return null;
    }
    return result(composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES[explicit].query, context }));
  }

  if (!domain) {
    return null;
  }

  // Do not trap social controls, commercial/operational requests or explicit
  // knowledge/topic changes inside discovery. Free text answers remain allowed.
  if (/otra consulta|cambi.*tema|experiencia|formacion|tecnolog|proyectos?|servicios?|contact|gracias|adios|hasta luego|reserv|reunion|calendly|precio|costar|plazo|garanti/.test(text)) {
    return null;
  }

  if (technologies.some(technology => !['technology-excel', 'technology-power-bi', 'technology-ai'].includes(technology.id)) && !/datos|archivos|informe/.test(text)) {
    return null;
  }

  const explicitNextStep = /^(?:como (?:lo )?(?:hacemos|revisamos|seguimos|continuamos|empezamos)|cual es el siguiente paso|que hacemos ahora|como podemos seguir|como procedemos|y ahora que)$/;
  if (explicitNextStep.test(text)) {
    return result(nextStepEnvelope(domain, { reason: 'asked', showPowerBiSeries: domain === 'reporting' && conversationMentionsPowerBi(messages, text) }));
  }

  if (text === 'y eso' || text === 'por que') {
    const currentStages = discoveryStages(messages, domain);
    if (domain === 'excel' && currentStages.has('duplicates')) {
      return result(envelope(domain, 'explain', 'Porque dos filas con el mismo importe y fecha pueden ser operaciones distintas. Un identificador o una combinación de campos permite distinguir duplicados reales antes de borrar información.'));
    }
    if (domain === 'excel' && currentStages.has('structure')) {
      return result(envelope(domain, 'explain', 'Porque archivos con estructuras distintas pueden unirse sin dar error y aun así dejar datos mal alineados. Por eso primero se acuerdan campos comunes y controles, y después se automatiza.'));
    }
    if (domain === 'ia') {
      return result(envelope(domain, 'explain', 'Porque antes de elegir un modelo conviene acordar qué resultado sería correcto y qué casos necesitan revisión humana. Así se puede medir si realmente ayuda.'));
    }
    return result(envelope(domain, 'explain', 'Porque automatizar sin controles puede hacer el proceso más rápido, pero también propagar errores. Primero se fijan las reglas de validación y después se automatiza.'));
  }

  if (/que me recomiendas|que recomendarias|que podriamos hacer|que se podria hacer|que hariais/.test(text)) {
    const detailText = domain === 'ia'
      ? 'Empezaría con una muestra pequeña, categorías claras y revisión humana para medir aciertos, errores y tiempo antes de ampliar.'
      : 'Empezaría con una muestra representativa, definiría los controles imprescindibles y compararía el resultado con el proceso actual antes de ampliar.';
    return result(nextStepEnvelope(domain, { detailText, showPowerBiSeries: domain === 'reporting' && conversationMentionsPowerBi(messages, text) }));
  }

  const pendingDomainAlignment = pendingQuestion?.kind === PENDING_QUESTION_KIND.DOMAIN_STAGE && pendingQuestion.domain === domain
    ? classifyAnswerToPendingQuestion(userText, pendingQuestion)
    : null;

  const replannedDomain = /(?:no cuadr|datos? incorrect|errores?|calidad|inconsisten)/.test(text)
    ? 'dataquality'
    : /(?:limpi|consolid|juntar|unir).*(?:datos?|archivos?|ficheros?)/.test(text)
      ? 'excel'
      : /(?:prepar|actualiz).*(?:informe|dashboard|power bi)/.test(text)
        ? 'reporting'
        : null;
  // A valid answer to the active stage belongs to the current dialogue. Only
  // replan when the utterance is not already answering what we just asked.
  // This keeps e.g. Access -> “Preparar informes” in the Access workflow,
  // while “A veces los datos no cuadran” can legitimately switch to quality.
  if (replannedDomain && replannedDomain !== domain && pendingDomainAlignment?.relation !== ANSWER_ALIGNMENT.COMPLETE) {
    const replanned = domainDiscoveryResponse(replannedDomain, text, messages);
    if (replanned) return result(replanned);
  }

  if (pendingDomainAlignment) {
    if (pendingDomainAlignment.relation === ANSWER_ALIGNMENT.TOPIC_SWITCH) return null;
    if (isUnansweredAlignment(pendingDomainAlignment)) {
      return result(retryPendingDomainQuestion(domain, pendingQuestion, pendingDomainAlignment, text));
    }
  }

  const stages = discoveryStages(messages, domain);
  const seenHandoff = stages.has('handoff');
  const nextStep = /^(?:como (?:lo )?(?:hacemos|revisamos|seguimos|continuamos|empezamos)|cual es el siguiente paso|que hacemos ahora|como podemos seguir|como procedemos|y ahora que)$/;

  if (nextStep.test(text)) {
    return result(nextStepEnvelope(domain, { reason: 'asked', showPowerBiSeries: domain === 'reporting' && conversationMentionsPowerBi(messages, text) }));
  }

  if (/ha hecho algo parecido/.test(text)) {
    const base = composeProblemSolutionServiceResponse({ userText: DOMAIN_PROFILES[domain].query, context });
    const evidence = base?.messages.find(message => message.id?.endsWith('-evidence'));
    const project = (base?.evidence.knowledgeIds ?? [])
      .map(getKnowledgeById)
      .find(item => item?.type === 'project');

    if (project) {
      return result(envelope(
        domain,
        'evidence',
        `${project.title}: ${project.shortDescription} Es una referencia para comparar enfoques; no demuestra que tu caso vaya a tener el mismo resultado.`,
        [],
        [project.id],
      ));
    }

    return result(envelope(
      domain,
      'evidence',
      evidence
        ? `${evidence.text} Puedes revisar el proyecto para comparar el proceso y los datos con tu caso.`
        : 'No tengo un caso documentado idéntico a lo que describes. Podemos comparar los proyectos del portfolio, sin asumir que demuestran ese resultado concreto.',
      [],
      base?.evidence.knowledgeIds ?? [],
    ));
  }

  if (text === 'y eso' || text === 'por que') {
    const currentStages = discoveryStages(messages, domain);
    if (domain === 'excel' && currentStages.has('duplicates')) {
      return result(envelope(domain, 'explain', 'Porque dos filas con el mismo importe y fecha pueden ser operaciones distintas. Un identificador o una combinación de campos permite distinguir duplicados reales antes de borrar información.'));
    }
    if (domain === 'excel' && currentStages.has('structure')) {
      return result(envelope(domain, 'explain', 'Porque archivos con estructuras distintas pueden unirse sin dar error y aun así dejar datos mal alineados. Por eso primero se acuerdan campos comunes y controles, y después se automatiza.'));
    }
    if (domain === 'ia') {
      return result(envelope(domain, 'explain', 'Porque antes de elegir un modelo conviene acordar qué resultado sería correcto y qué casos necesitan revisión humana. Así se puede medir si realmente ayuda.'));
    }
    return result(envelope(domain, 'explain', 'Porque automatizar sin controles puede hacer el proceso más rápido, pero también propagar errores. Primero se fijan las reglas de validación y después se automatiza.'));
  }

  if (/que me recomiendas|que recomendarias/.test(text)) {
    const detailText = domain === 'ia'
      ? 'Empezaría con una muestra pequeña, categorías claras y revisión humana para medir aciertos, errores y tiempo antes de ampliar.'
      : 'Empezaría con una muestra representativa, definiría los controles imprescindibles y compararía el resultado con el proceso actual antes de ampliar.';
    return result(nextStepEnvelope(domain, { detailText, showPowerBiSeries: domain === 'reporting' && conversationMentionsPowerBi(messages, text) }));
  }

  if (seenHandoff) {
    return result(postHandoffEnvelope(domain, text));
  }

  // Handoff is now driven by answered semantic stages, not by how many
  // questions the assistant happened to ask. domainDiscoveryResponse() only
  // returns nextStepEnvelope once the required information for that domain is
  // actually covered.
  const response = domainDiscoveryResponse(domain, text, messages);
  return response ? result(response) : null;
}

export function deduplicateEvidence(response, context = {}) {
  if (!response) {
    return response;
  }

  const prior = (context.recentMessages ?? [])
    .filter(message => message.role === 'assistant')
    .map(message => message.text);

  const messages = response.messages
    .filter(message => !(/-evidence$/.test(message.id ?? '') && prior.includes(message.text)));

  if (messages.length === response.messages.length) {
    return response;
  }

  return createResponseEnvelope({ ...response, messages });
}
