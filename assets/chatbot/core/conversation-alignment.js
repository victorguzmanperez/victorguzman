/* ============================================================
 * CONV-H3.10 → H3.15 — SEMANTIC TURN ALIGNMENT
 *
 * The assistant must not advance a discovery flow merely because it
 * asked a question.  This module derives the pending question from the
 * structured responseId already persisted with assistant messages and
 * classifies the next visitor turn against that question.
 *
 * Deliberately no raw question text is persisted and no state schema
 * migration is required: pending state is derived from the conversation
 * transcript's canonical response ids.
 * ============================================================
 */

export const ANSWER_ALIGNMENT = Object.freeze({
  COMPLETE: 'complete',
  PARTIAL: 'partial',
  SIDE_INFORMATION: 'side_information',
  TOPIC_SWITCH: 'topic_switch',
  CORRECTION: 'correction',
  UNKNOWN: 'unknown',
  REFUSAL: 'refusal',
  INCOMPREHENSIBLE: 'incomprehensible',
});

export const PENDING_QUESTION_KIND = Object.freeze({
  BOTTLENECK: 'bottleneck',
  PROCESS_DETAIL: 'process_detail',
  FREQUENCY_CONTROLS: 'frequency_controls',
  DATA_SCOPE: 'data_scope',
  DOMAIN_STAGE: 'domain_stage',
});

const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[¿?¡!.,;:]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const frequencyPattern = /\b(?:diari|cada dia|todos los dias|seman|cada semana|mensual|cada mes|trimestr|anual|cada ano|todos los lunes|todos los viernes)\w*/;
const toolPattern = /\b(?:excel|access|power\s*bi|power\s*query|python|sql|csv|pdf|sharepoint|sap|erp|crm)\b/;
const quantityPattern = /\b(?:\d+|much[oa]s?|bastantes?|varios?|varias?|cientos?|miles?)\b/;
const correctionPattern = /\b(?:no[, ]|en realidad|queria decir|me referia|corrijo|correccion|mejor dicho|no es|no usamos|no uso|funciona bien)\b/;
const unknownPattern = /^(?:no se|no lo se|ni idea|no sabria decirte|no tengo claro|no estoy seguro|no estoy segura|depende|mas o menos|creo que no se)(?:\s.*)?$/;
const refusalPattern = /^(?:prefiero no|no quiero|no te lo puedo decir|no puedo decirlo|no quiero responder|paso de responder|ninguna|no hace falta)(?:\s.*)?$/;

function lastAssistantMessage(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'assistant') return messages[index];
  }
  return null;
}

export function derivePendingQuestion(messages = []) {
  const last = lastAssistantMessage(messages);
  const responseId = String(last?.responseId ?? '');
  if (!responseId) return null;

  if (/^response-h2-process-(?:0|bottleneck(?:-retry)?)$/.test(responseId)) {
    return Object.freeze({ kind: PENDING_QUESTION_KIND.BOTTLENECK, id: 'h2-bottleneck' });
  }

  if (/^response-h2-process-(?:1|frequency-controls(?:-retry)?)$/.test(responseId)) {
    return Object.freeze({ kind: PENDING_QUESTION_KIND.FREQUENCY_CONTROLS, id: 'h2-frequency-controls' });
  }

  if (/^response-h2-process-detail(?:-retry)?$/.test(responseId)) {
    return Object.freeze({ kind: PENDING_QUESTION_KIND.PROCESS_DETAIL, id: 'h2-process-detail' });
  }

  if (/^response-h3-generic-data-scope(?:-retry)?$/.test(responseId)) {
    return Object.freeze({ kind: PENDING_QUESTION_KIND.DATA_SCOPE, id: 'h3-data-scope' });
  }

  const initialDomainQuestions = {
    'response-problem-flow-problem-repetitive-copy-paste': ['automation', 'systems'],
    'response-problem-flow-problem-manual-pdf-extraction': ['documents', 'doc-format'],
    'response-problem-flow-problem-data-quality': ['dataquality', 'quality-problem'],
    'response-problem-flow-problem-financial-analysis': ['financial', 'financial-goal'],
  };
  const initialDomainQuestion = initialDomainQuestions[responseId];
  if (initialDomainQuestion) {
    const [domain, stage] = initialDomainQuestion;
    return Object.freeze({
      kind: PENDING_QUESTION_KIND.DOMAIN_STAGE,
      id: `progress-${domain}-${stage}`,
      domain,
      stage,
    });
  }

  const progress = responseId.match(/^response-progress-([a-z]+)-([a-z-]+)$/);
  if (progress) {
    const [, domain, rawStage] = progress;
    const stage = rawStage.replace(/-retry$/, '');
    if (!['handoff', 'post-handoff', 'recap', 'evidence', 'explain'].includes(stage)) {
      return Object.freeze({
        kind: PENDING_QUESTION_KIND.DOMAIN_STAGE,
        id: `progress-${domain}-${stage}`,
        domain,
        stage,
      });
    }
  }

  return null;
}

function isExplicitTopicSwitch(text) {
  return /(?:otra consulta|otra pregunta|cambi(?:ar|amos|emos).*tema|ahora quiero saber|volvamos|retomemos|regresemos|sobre victor|victor.*(?:experiencia|sabe|conoce|ha hecho)|(?:experiencia|sabe|conoce|ha hecho).*victor|privacidad|precio|cuanto cost|reservar|reunion|calendly)/.test(text);
}

function hasBottleneckAnswer(text) {
  return /(?:\b(?:mover|traslad|juntar|unir|consolid|recopil|import|export|recibir|cargar)\w*\b.*\b(?:datos?|archivos?|ficheros?|fuentes?)\b|\b(?:datos?|archivos?|ficheros?|fuentes?)\b.*\b(?:mover|traslad|juntar|unir|consolid|recopil|import|export|recibir|cargar)\w*\b|\b(?:revis|valid|comprob|cuadr|correg|control)\w*\b|\b(?:prepar|montar|actualiz|rehac|generar)\w*\b.*\b(?:datos?|informes?|reporting|dashboard|resultado)\b|\b(?:datos?|informes?|reporting|dashboard|resultado)\b.*\b(?:prepar|montar|actualiz|rehac|generar)\w*\b|\b(?:prepararlos?|revisarlos?|moverlos?|juntarlos?)\b)/.test(text);
}

function hasProcessDetail(text) {
  return /\b(?:manual|a mano|copi|peg|revis|valid|comprob|control|correo|descarg|import|export|archivo|fichero|sistema|departamento|fuente|column|campo|cuadr|error|duplic|limpi|prepar|actualiz|refresh)\w*/.test(text);
}

function domainStageAnswered(stage, text) {
  const patterns = {
    structure: /(?:mismas?|distintas?|column|duplic|vacio|format)/,
    duplicates: /(?:identificador|combinar|campo|clave|id\b)/,
    schema: /(?:nombre|column|campo|faltan|mismas?|distintas?)/,
    mapping: /(?:nombre|format|equivalen|column|campo)/,
    source: /(?:archivo|fichero|correo|sistema|excel|csv|access|api|base de datos|departamento|fuente)/,
    validation: /(?:valid|revis|control|comprob|cuadr|nadie|no hay)/,
    systems: /(?:excel|access|power bi|power query|csv|sql|sistema|herramient|erp|crm|correo)/,
    frequency: /(?:\d+|diari|cada dia|todos los dias|seman|cada semana|mensual|cada mes|trimestr|anual|cada ano)/,
    controls: /(?:valid|revis|control|comprob|campo|regla|cuadr)/,
    task: /(?:import|export|consulta|formulario|informe|report)/,
    'doc-format': /(?:pdf|texto|escanead|imagen|mezcla|foto)/,
    'doc-fields': /(?:campo|dato|proveedor|fecha|importe|numero de factura|nif|cif)/,
    'doc-review': /(?:revis|valid|comprueba|persona|equipo|responsable|nadie|automatic)/,
    'quality-problem': /(?:error|incorrect|duplic|trazab|origen|no cuadr|calidad)/,
    'quality-source': /(?:fichero|archivo|sistema|fuente|origen|departamento)/,
    'quality-check': /(?:compar|cuadr|total|campo obligatorio|reconcil|regla de control|control de)/,
    rules: /(?:cambian|estable|regla|peso|criterio)/,
    'rule-change': /(?:valid|prueba|caso|compar|revis|correct)/,
    'web-scope': /(?:parecid|distint|estructura|criterio|informacion)/,
    'web-frequency': /(?:\d+|much|pocas|seman|mes|dia|frecuencia)/,
    'financial-goal': /(?:seguim|compar|dashboard|control|analiz)/,
    metrics: /(?:margen|venta|rentab|dividend|precio|ratio|kpi|indicador|metrica|crecim|yield|volatil)/,
    'financial-source': /(?:api|archivo|fichero|manual|descarg|fuente|sistema)/,
    volume: /(?:\d+|much|cien|mil|volumen|dia|semana|mes)/,
    review: /(?:definid|categoria|criterio|si|no|hay que definir)/,
  };
  return patterns[stage]?.test(text) ?? false;
}

export function classifyAnswerToPendingQuestion(userText, pendingQuestion) {
  const text = normalize(userText);
  if (!pendingQuestion || !text) {
    return Object.freeze({ relation: ANSWER_ALIGNMENT.INCOMPREHENSIBLE });
  }

  if (isExplicitTopicSwitch(text)) {
    return Object.freeze({ relation: ANSWER_ALIGNMENT.TOPIC_SWITCH });
  }
  if (refusalPattern.test(text)) {
    return Object.freeze({ relation: ANSWER_ALIGNMENT.REFUSAL });
  }
  if (unknownPattern.test(text)) {
    return Object.freeze({ relation: ANSWER_ALIGNMENT.UNKNOWN });
  }

  const isCorrection = correctionPattern.test(text);
  const hasFrequency = frequencyPattern.test(text);
  const hasTool = toolPattern.test(text);
  const hasQuantity = quantityPattern.test(text);

  switch (pendingQuestion.kind) {
    case PENDING_QUESTION_KIND.BOTTLENECK:
      if (hasBottleneckAnswer(text)) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, corrected: isCorrection, hasFrequency });
      }
      if (/^(?:la primera|primera|mover datos|revisar datos|preparar informes?)$/.test(text)) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, hasFrequency });
      }
      if (hasFrequency || hasQuantity) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.PARTIAL, hasFrequency });
      }
      if (hasTool || isCorrection || text.length >= 6) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.SIDE_INFORMATION, corrected: isCorrection, hasFrequency });
      }
      break;

    case PENDING_QUESTION_KIND.PROCESS_DETAIL:
      if (hasProcessDetail(text)) return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, corrected: isCorrection, hasFrequency });
      if (hasFrequency || hasQuantity) return Object.freeze({ relation: ANSWER_ALIGNMENT.PARTIAL, hasFrequency });
      if (hasTool || text.length >= 6) return Object.freeze({ relation: ANSWER_ALIGNMENT.SIDE_INFORMATION, corrected: isCorrection, hasFrequency });
      break;

    case PENDING_QUESTION_KIND.FREQUENCY_CONTROLS: {
      const hasControl = /(?:valid|revis|control|comprob|cuadr|manual|nadie|no hay)/.test(text);
      if (hasFrequency && hasControl) return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, hasFrequency: true, hasControl: true });
      if (hasFrequency || hasControl) return Object.freeze({ relation: ANSWER_ALIGNMENT.PARTIAL, hasFrequency, hasControl });
      if (hasTool || text.length >= 6) return Object.freeze({ relation: ANSWER_ALIGNMENT.SIDE_INFORMATION, corrected: isCorrection, hasFrequency, hasControl });
      break;
    }

    case PENDING_QUESTION_KIND.DATA_SCOPE:
      if (/(?:excel|csv|access|archivo|fichero|power bi|informe|report|calidad|error|duplic|manual|automat|copi|peg|fuente|sistema)/.test(text)) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, hasFrequency });
      }
      if (hasQuantity || hasFrequency) return Object.freeze({ relation: ANSWER_ALIGNMENT.PARTIAL, hasFrequency });
      if (text.length >= 5) return Object.freeze({ relation: ANSWER_ALIGNMENT.SIDE_INFORMATION, hasFrequency });
      break;

    case PENDING_QUESTION_KIND.DOMAIN_STAGE:
      if (domainStageAnswered(pendingQuestion.stage, text)) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.COMPLETE, corrected: isCorrection, hasFrequency });
      }
      if (hasFrequency || hasQuantity || hasTool || text.length >= 6) {
        return Object.freeze({ relation: ANSWER_ALIGNMENT.SIDE_INFORMATION, corrected: isCorrection, hasFrequency });
      }
      break;

    default:
      break;
  }

  if (/^(?:si|no|eso|exacto|tambien|las dos|ambas|vale|ok)$/.test(text)) {
    return Object.freeze({ relation: ANSWER_ALIGNMENT.PARTIAL, hasFrequency });
  }

  return Object.freeze({ relation: ANSWER_ALIGNMENT.INCOMPREHENSIBLE, hasFrequency });
}


export function derivePendingQuestionFromHistory(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'assistant') continue;
    const responseId = String(message.responseId ?? '');
    if (/handoff|goodbye|feedback/.test(responseId)) return null;
    const pending = derivePendingQuestion(messages.slice(0, index + 1));
    if (pending) return pending;
  }
  return null;
}

export function isUnansweredAlignment(alignment) {
  return [
    ANSWER_ALIGNMENT.PARTIAL,
    ANSWER_ALIGNMENT.SIDE_INFORMATION,
    ANSWER_ALIGNMENT.UNKNOWN,
    ANSWER_ALIGNMENT.REFUSAL,
    ANSWER_ALIGNMENT.INCOMPREHENSIBLE,
  ].includes(alignment?.relation);
}
