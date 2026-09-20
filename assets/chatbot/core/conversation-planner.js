import { planConversationV2 } from './conversation-planner-v2.js?v=conv-h3.22.2';
import { interpretTurn, updateDiscourse, discourseFromMessages, normalizeTurn } from './turn-interpreter.js';
import { createResponseEnvelope } from './response-contract.js';
import { createDiagnosticAction, createCalendlyAction, createContactAction, createAnswerQuickReply } from './response-interactions.js';
import { planContentResponse } from './dataverso-response.js';
import {
  ANSWER_ALIGNMENT,
  PENDING_QUESTION_KIND,
  classifyAnswerToPendingQuestion,
  derivePendingQuestion,
  isUnansweredAlignment,
} from './conversation-alignment.js';

const frequencyLabel = frequency => ({ daily: 'a diario', weekly: 'cada semana', monthly: 'cada mes' }[frequency] ?? null);

function quickReplies(labels, prefix) {
  return labels.map((label, index) => createAnswerQuickReply({ id: `${prefix}-${index}`, label, answer: label }));
}

function processEnvelope({ id, text, replies = [], actions = [], kind = 'discovery', outcome = 'qualified' }) {
  return createResponseEnvelope({
    id,
    kind,
    outcome,
    messages: [{ id: `${id}-message`, text }],
    quickReplies: quickReplies(replies, `${id}-answer`),
    actions,
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: id.replace(/^response-/, '') },
  });
}

function memoryLead(memory, turn) {
  const pieces = [];
  if (turn.name) pieces.push(`Encantado, ${turn.name}.`);
  if (turn.correction && turn.mentions.length) pieces.push('Gracias por la corrección.');
  if (memory.tools.length) pieces.push(`Tengo en cuenta que en el proceso usáis ${memory.tools.join(' y ')}.`);
  if (memory.frequency) pieces.push(`También que ocurre ${frequencyLabel(memory.frequency)}.`);
  return pieces.join(' ');
}

function bottleneckRetry({ alignment, memory, turn }) {
  const lead = memoryLead(memory, turn);
  let bridge = 'Para entender dónde está realmente el cuello de botella, me falta ese dato.';

  if (alignment.relation === ANSWER_ALIGNMENT.SIDE_INFORMATION || alignment.relation === ANSWER_ALIGNMENT.CORRECTION) {
    bridge = 'Ese dato ayuda y lo guardo, pero todavía no responde a dónde se os va más tiempo.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.PARTIAL) {
    bridge = 'Eso ayuda a dimensionarlo, pero aún necesito ubicar qué paso consume ese tiempo.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.UNKNOWN) {
    bridge = 'No hace falta que tengas localizado el fallo exacto; podemos acotarlo por el trabajo que más tiempo consume.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.REFUSAL) {
    bridge = 'De acuerdo, no hace falta entrar en detalles sensibles. Podemos situarlo de forma general.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.INCOMPREHENSIBLE) {
    bridge = 'No consigo relacionar esa respuesta con el paso que más tiempo os lleva.';
  }

  return processEnvelope({
    id: 'response-h2-process-bottleneck-retry',
    text: `${lead ? `${lead} ` : ''}${bridge} ¿Lo que más tiempo os lleva es mover/reunir los datos, revisarlos o preparar/actualizar el informe?`,
    replies: ['Mover / reunir datos', 'Revisar datos', 'Preparar informes'],
  });
}

function processDetailRetry({ alignment, memory, turn }) {
  const lead = memoryLead(memory, turn);
  let bridge = 'Me falta saber qué parte concreta seguís haciendo manualmente.';

  if (alignment.relation === ANSWER_ALIGNMENT.PARTIAL) {
    bridge = alignment.hasFrequency
      ? 'La frecuencia ya queda clara. Para no asumir el resto, me falta saber qué paso hacéis manualmente.'
      : 'Ese dato ayuda a dimensionarlo, pero todavía me falta saber qué paso hacéis manualmente.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.SIDE_INFORMATION || alignment.relation === ANSWER_ALIGNMENT.CORRECTION) {
    bridge = 'Ese matiz es útil, pero no quiero fingir que responde a la parte manual del proceso.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.UNKNOWN) {
    bridge = 'Si no lo tienes claro, basta con identificar qué tarea repite alguien cada vez.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.REFUSAL) {
    bridge = 'No necesitas describir datos sensibles; basta con el tipo de tarea.';
  } else if (alignment.relation === ANSWER_ALIGNMENT.INCOMPREHENSIBLE) {
    bridge = 'No he podido conectar esa respuesta con el paso manual que estamos intentando localizar.';
  }

  return processEnvelope({
    id: 'response-h2-process-detail-retry',
    text: `${lead ? `${lead} ` : ''}${bridge} ¿Se dedica más tiempo a preparar/limpiar los datos, validarlos o actualizar el informe?`,
    replies: ['Preparar / limpiar datos', 'Validar / revisar', 'Actualizar informe'],
  });
}

function handoffEnvelope({ memory, turn, explicitContact = false }) {
  const lead = memoryLead(memory, turn);
  const actions = [
    createDiagnosticAction({ id: 'h2-diagnostic', label: 'Completar diagnóstico' }),
    createCalendlyAction({ id: 'h2-meeting', label: 'Reservar reunión', priority: 'secondary' }),
  ];
  if (explicitContact) actions[0] = createContactAction({ id: 'h2-contact', label: 'Contactar con Víctor' });

  return processEnvelope({
    id: 'response-h2-process-handoff',
    kind: 'action',
    outcome: 'answered',
    text: `${lead ? `${lead} ` : ''}Ya hay suficiente contexto para aportar algo útil: primero conviene separar la preparación del dato, sus controles y la actualización del informe; después se automatiza solo lo repetible sin perder esas validaciones. Si quieres, el siguiente paso es ordenar el caso en el diagnóstico o revisarlo directamente con Víctor.`,
    actions,
  });
}

export function planConversation(text, context = {}) {
  const v2 = planConversationV2(text, context);
  if (v2) return v2;
  const turn = interpretTurn(text);
  const previous = discourseFromMessages(context.recentMessages);
  const memory = updateDiscourse(previous, turn);
  const n = normalizeTurn(text);
  const messages = context.recentMessages ?? [];
  const lastAssistant = messages.filter(message => message.role === 'assistant' && !/^response-privacy/.test(message.responseId ?? '')).at(-1);
  const pending = derivePendingQuestion(messages);
  const active = [PENDING_QUESTION_KIND.BOTTLENECK, PENDING_QUESTION_KIND.PROCESS_DETAIL, PENDING_QUESTION_KIND.FREQUENCY_CONTROLS].includes(pending?.kind) || String(lastAssistant?.responseId ?? '').startsWith('response-h2-process-');
  const content = planContentResponse(text, context);

  if (content && !turn.intents.includes('profile') && !turn.intents.includes('contact')) {
    const response = turn.problem
      ? createResponseEnvelope({
          ...content,
          messages: content.messages.map((message, index) => index ? message : {
            ...message,
            text: `${turn.name ? `Encantado, ${turn.name}. ` : ''}Tienes un problema de proceso${memory.tools.length ? ` con ${memory.tools.join(' y ')}` : ''}. Podemos retomarlo después de estas lecturas. ${message.text}`,
          }),
        })
      : content;
    return { response, route: 'knowledge', memory, turn };
  }

  // Knowledge, privacy, contact and explicit topic changes must be allowed to
  // escape discovery. The active business case remains recoverable from history.
  if (
    turn.intents.includes('privacy') ||
    turn.intents.includes('profile') ||
    turn.intents.includes('contact') ||
    turn.topicSwitch ||
    /(?:victor|víctor).*(?:sabe|conoce|experiencia|ha hecho|proyecto)|(?:sabe|conoce|experiencia|ha hecho).*(?:victor|víctor)/i.test(text)
  ) return null;

  if (/que (?:problema|caso).*?(?:contado|dicho|te acabo de contar)|que te acabo de contar|recuerdame.*(?:problema|caso)|resume.*(?:problema|caso)/.test(n)) return null;

  // Strong new evidence may invalidate the generic H2 hypothesis. Let the
  // domain continuation layer replan instead of forcing the pending form-like
  // question. This is deliberately evidence-based, not a generic topic switch.
  if (active && /(?:no cuadr|datos? incorrect|errores?|calidad|inconsisten)/.test(n)) return null;

  const processOwnership = /^(?:bueno[, ]+)?(?:tenemos|usamos|utilizamos|trabajamos con)\s+(?:un\s+)?(?:excel|access|power\s*bi|power\s*query|python|sql|csv|pdf|ia|inteligencia artificial)(?:\s+en (?:la|el|nuestro|nuestra) (?:empresa|proceso))?$/.test(n) && turn.mentions.length > 0 && !turn.intents.includes('content');
  const complexStart = turn.problem && (turn.name || turn.mentions.length > 1 || /procesos?|manualidades|informes?/.test(n) || /^tengo (?:un )?problema con/.test(n));
  const correction = turn.correction && turn.mentions.length && previous.problem;

  if (!complexStart && !correction && !active && !processOwnership) return null;
  if (/^(?:gracias(?:,? ya (?:esta|es todo))?|no[,]? gracias|adios|hasta luego|ya esta|eso es todo|nada mas|con eso es suficiente)[.! ]*$/.test(n)) return null;

  const explicitHandoff = /como (?:lo hacemos|seguimos|procedemos)|siguiente paso|que hacemos ahora/.test(n);
  if (explicitHandoff && (previous.problem || memory.tools.length)) {
    return { turn, memory, route: 'problem_flow', response: handoffEnvelope({ memory, turn }) };
  }

  if (pending?.kind === PENDING_QUESTION_KIND.BOTTLENECK) {
    const alignment = classifyAnswerToPendingQuestion(text, pending);
    if (alignment.relation === ANSWER_ALIGNMENT.TOPIC_SWITCH) return null;
    if (isUnansweredAlignment(alignment)) {
      const retryCount = messages.filter(message => message?.role === 'assistant' && message.responseId === 'response-h2-process-bottleneck-retry').length;
      if (retryCount >= 2) {
        return {
          turn,
          memory,
          route: 'problem_flow',
          response: processEnvelope({
            id: 'response-h2-process-detail',
            text: `${memoryLead(memory, turn)} No hace falta que elijas una de las tres opciones si no encaja. Para avanzar sin quedarnos bloqueados, cuéntame un paso concreto que alguien repite manualmente: por ejemplo, qué recibe, qué prepara o qué comprueba.`.trim(),
            replies: ['Recibimos archivos', 'Preparamos datos', 'Hacemos comprobaciones'],
          }),
        };
      }
      return { turn, memory, route: 'problem_flow', response: bottleneckRetry({ alignment, memory, turn }) };
    }

    const freq = frequencyLabel(memory.frequency);
    const lead = memoryLead(memory, turn);
    const detailPrompt = freq
      ? `Entendido. Entonces el cuello de botella está en ese paso y ocurre ${freq}. ¿Qué parte hacéis manualmente cada vez: preparar/limpiar los datos, validarlos o actualizar el informe?`
      : 'Entendido. Ya tenemos localizado el tipo de cuello de botella. ¿Qué parte hacéis manualmente y se repite con más frecuencia: preparar/limpiar los datos, validarlos o actualizar el informe?';
    return {
      turn,
      memory,
      route: 'problem_flow',
      response: processEnvelope({
        id: 'response-h2-process-detail',
        text: `${lead ? `${lead} ` : ''}${detailPrompt}`,
        replies: ['Preparar / limpiar datos', 'Validar / revisar', 'Actualizar informe'],
      }),
    };
  }

  if (pending?.kind === PENDING_QUESTION_KIND.PROCESS_DETAIL) {
    const alignment = classifyAnswerToPendingQuestion(text, pending);
    if (alignment.relation === ANSWER_ALIGNMENT.TOPIC_SWITCH) return null;
    if (isUnansweredAlignment(alignment)) {
      const retryCount = messages.filter(message => message?.role === 'assistant' && message.responseId === 'response-h2-process-detail-retry').length;
      if (retryCount >= 2) {
        return {
          turn,
          memory,
          route: 'problem_flow',
          response: processEnvelope({
            id: 'response-h2-process-detail-retry',
            text: `${memoryLead(memory, turn)} Podemos seguir sin conocer todavía el detalle exacto. Piensa solo en una acción repetida: ¿alguien descarga/recibe archivos, transforma datos, hace comprobaciones o actualiza un informe?`.trim(),
            replies: ['Recibe archivos', 'Transforma datos', 'Hace comprobaciones', 'Actualiza informe'],
          }),
        };
      }
      return { turn, memory, route: 'problem_flow', response: processDetailRetry({ alignment, memory, turn }) };
    }
    return { turn, memory, route: 'problem_flow', response: handoffEnvelope({ memory, turn }) };
  }

  // Legacy response ids can still exist in persisted sessions. Treat the old
  // combined frequency/control question conservatively: partial answers do not
  // advance to handoff.
  if (pending?.kind === PENDING_QUESTION_KIND.FREQUENCY_CONTROLS) {
    const alignment = classifyAnswerToPendingQuestion(text, pending);
    if (alignment.relation === ANSWER_ALIGNMENT.TOPIC_SWITCH) return null;
    if (alignment.relation !== ANSWER_ALIGNMENT.COMPLETE) {
      return { turn, memory, route: 'problem_flow', response: processDetailRetry({ alignment, memory, turn }) };
    }
    return { turn, memory, route: 'problem_flow', response: handoffEnvelope({ memory, turn }) };
  }

  if (
    String(lastAssistant?.responseId ?? '').includes('handoff') &&
    /que podriamos hacer|que se podria hacer|que recomiendas|que recomendarias|como lo mejorariamos/.test(n)
  ) {
    return {
      turn,
      memory,
      route: 'problem_flow',
      response: processEnvelope({
        id: 'response-h2-process-value-after-handoff',
        text: `${memoryLead(memory, turn)} Con lo que ya sabemos, empezaría por documentar de dónde entra cada dato, qué transformaciones se repiten y qué controles deben cumplirse antes del informe. Después automatizaría la preparación y las validaciones repetibles, dejando revisión humana solo donde aporte valor.`.trim(),
      }),
    };
  }

  if (String(lastAssistant?.responseId ?? '').includes('handoff')) {
    return {
      turn,
      memory,
      route: 'problem_flow',
      response: processEnvelope({
        id: 'response-h2-process-post-handoff',
        text: `${memoryLead(memory, turn)} Ese detalle también ayuda a concretar el caso. Podemos seguir afinándolo aquí sin volver a empezar, y el diagnóstico o la reunión siguen disponibles cuando te resulten útiles.`.trim(),
      }),
    };
  }

  const lead = memoryLead(memory, turn);
  return {
    turn,
    memory,
    route: 'problem_flow',
    response: processEnvelope({
      id: 'response-h2-process-bottleneck',
      text: `${lead ? `${lead} ` : ''}Para entender el problema sin asumir demasiado: ¿dónde se os va más tiempo, en mover/reunir los datos, revisarlos o preparar/actualizar el informe?`,
      replies: ['Mover / reunir datos', 'Revisar datos', 'Preparar informes'],
    }),
  };
}
