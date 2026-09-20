import { catalog } from '../data/content/catalog.js';
import { normalizeTurn } from './turn-interpreter.js';
import { createResponseEnvelope } from './response-contract.js';
import { createAnswerQuickReply } from './response-interactions.js';

export const DATAVERSO_COLLECTIONS = Object.freeze({
  powerBi: Object.freeze({
    id: 'collection-power-bi-desde-cero',
    title: 'Power BI desde cero',
    url: 'https://dataversodata.substack.com/s/power-bi-desde-cero',
  }),
  learningFinance: Object.freeze({
    id: 'collection-aprender-mejorar-invertir',
    title: 'Aprender y mejorar cada día',
    url: 'https://dataversodata.substack.com/s/aprender-mejorar-e-invertir-con-datos',
  }),
});

export const approvedContentUrls = new Set([
  ...catalog.articles.map(article => article.url),
  ...catalog.books.map(book => book.url),
  ...Object.values(DATAVERSO_COLLECTIONS).map(collection => collection.url),
]);

const TOPIC_RULES = Object.freeze([
  [/power query/, 'power-query'],
  [/power\s*bi|modelo de datos|dashboard/, 'power-bi'],
  [/finanza|dinero|ahorro|mentalidad|habitos?|crecimiento personal/, 'finance'],
  [/inver|apalanc|dividendo|quantfury|jepi|broker|trading/, 'investing'],
  [/aprender|aprendiz|mejorar|crecimiento personal|habitos?/, 'learning'],
  [/libro|rico|millonaria|kiyosaki|eker|mentalidad|habitos?/, 'books'],
]);

function detectedTopics(normalizedText) {
  return TOPIC_RULES
    .filter(([pattern]) => pattern.test(normalizedText))
    .map(([, topic]) => topic);
}

function articleIntentBoost(article, normalizedText) {
  let score = 0;
  const boosts = [
    [/quantfury|jepi|apalanc/, 'article-mover-6000-con-300', 30],
    [/metodo rico/, 'article-lo-que-aporta-el-metodo-rico', 25],
    [/mente millonaria|millonaria/, 'article-los-secretos-de-la-mente-millonaria', 25],
    [/padre rico|kiyosaki/, 'article-padre-rico-padre-pobre-cambio-mentalidad', 25],
    [/mentalidad|habitos?/, 'article-los-secretos-de-la-mente-millonaria', 22],
    [/mentalidad|habitos?/, 'article-padre-rico-padre-pobre-cambio-mentalidad', 18],
    [/power bi desde cero|guia.*power bi/, 'article-guia-completa-power-bi-desde-cero', 20],
    [/finanzas personales|crecimiento personal/, 'article-lo-que-aporta-el-metodo-rico', 12],
    [/finanzas personales|crecimiento personal/, 'article-los-secretos-de-la-mente-millonaria', 11],
    [/finanzas personales|crecimiento personal/, 'article-padre-rico-padre-pobre-cambio-mentalidad', 10],
  ];

  for (const [pattern, articleId, value] of boosts) {
    if (pattern.test(normalizedText) && article.id === articleId) score += value;
  }

  return score;
}

export function recommendArticles(text, exclude = []) {
  const normalized = normalizeTurn(text);
  const topics = detectedTopics(normalized);
  const words = normalized.split(/\W+/).filter(word => word.length > 3);

  return catalog.articles
    .filter(article => article.status === 'approved' && !exclude.includes(article.id))
    .filter(article => !topics.length || article.topics.some(topic => topics.includes(topic)))
    .map(article => ({
      article,
      score:
        article.topics.filter(topic => topics.includes(topic)).length * 4 +
        words.filter(word => normalizeTurn(article.title).includes(word)).length +
        articleIntentBoost(article, normalized) +
        (article.access === 'partial' ? -1 : 0),
    }))
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id))
    .slice(0, /quantfury|jepi|apalanc|metodo rico|mente millonaria|padre rico|kiyosaki/.test(normalized) ? 1 : 2)
    .map(candidate => candidate.article);
}

function isContentTrigger(normalized) {
  return /articulo|substack|dataverso|libros?|finanzas personales|crecimiento personal|mentalidad|habitos?|aprender (?:power|sobre)|(?:quiero|como|empezar a) invertir|quantfury|jepi|apalancamiento|metodo rico|mente millonaria|padre rico|kiyosaki|\bcomprar\b|\bcompro\b|afiliad/.test(normalized);
}

function collectionFor(normalized) {
  if (/power\s*bi/.test(normalized)) return DATAVERSO_COLLECTIONS.powerBi;
  if (/finanza|dinero|inver|quantfury|jepi|apalanc|libro|crecimiento personal|mentalidad|habitos?|aprender|mejorar/.test(normalized)) {
    return DATAVERSO_COLLECTIONS.learningFinance;
  }
  return null;
}

function hasActiveBusinessCase(history) {
  return history.some(message =>
    message?.role === 'assistant' &&
    /^(?:response-problem-flow-|response-progress-|response-h2-process-|response-v2-)/.test(String(message.responseId ?? '')),
  );
}

function contentQuickReplies(normalized, history) {
  const replies = [];

  if (hasActiveBusinessCase(history)) {
    replies.push(createAnswerQuickReply({
      id: 'content-return-case',
      label: 'Volver a mi caso',
      answer: '¿Cómo seguimos con mi caso?',
    }));
  }

  if (/power\s*bi/.test(normalized)) {
    replies.push(
      createAnswerQuickReply({
        id: 'content-more-power-bi',
        label: 'Más Power BI',
        answer: 'Muéstrame otro artículo de Power BI.',
      }),
      createAnswerQuickReply({
        id: 'content-power-query',
        label: 'Power Query',
        answer: '¿Qué tienes publicado sobre Power Query?',
      }),
    );
  } else if (/libro|rico|millonaria|kiyosaki|eker/.test(normalized)) {
    replies.push(
      createAnswerQuickReply({
        id: 'content-another-book',
        label: 'Otro libro',
        answer: 'Muéstrame otro libro que haya leído Víctor.',
      }),
      createAnswerQuickReply({
        id: 'content-finance',
        label: 'Finanzas personales',
        answer: 'Quiero aprender más sobre finanzas personales.',
      }),
    );
  } else if (/finanza|inver|quantfury|jepi|apalanc|crecimiento personal|mentalidad|habitos?|aprender|mejorar/.test(normalized)) {
    replies.push(
      createAnswerQuickReply({
        id: 'content-investing',
        label: 'Inversión',
        answer: 'Muéstrame algo sobre inversión.',
      }),
      createAnswerQuickReply({
        id: 'content-books',
        label: 'Libros',
        answer: '¿Qué libros ha leído Víctor?',
      }),
    );
  }

  return replies.slice(0, 4);
}

function introFor(normalized) {
  if (/quantfury|jepi|apalanc/.test(normalized)) {
    return 'Sí. Víctor cuenta en Dataverso su experiencia investigando y probando Quantfury para entender mejor el apalancamiento, la exposición, el margen y el riesgo. Lo presenta como experiencia personal y educativa, no como una recomendación de inversión.';
  }
  if (/libro/.test(normalized)) {
    return 'Estas lecturas de Dataverso recogen libros que Víctor ha leído y las ideas que ha extraído de ellos:';
  }
  return 'Estas lecturas de Dataverso encajan con lo que preguntas:';
}

export function planContentResponse(text, context = {}) {
  const normalized = normalizeTurn(text);
  const history = context.recentMessages ?? [];

  if (/(?:que|cual).*?(?:inversion|accion|etf|cripto|activo).*?(?:recomiend|comprar)|(?:que|cual) compro|donde invierto/.test(normalized)) {
    return createResponseEnvelope({
      id: 'response-dataverso-investment-boundary',
      kind: 'knowledge',
      outcome: 'answered',
      messages: [{
        id: 'content-investment-boundary',
        text: 'Puedo enseñarte cómo está aprendiendo e invirtiendo Víctor y compartir contenido educativo, pero no elegir por ti qué activo comprar ni prometer rentabilidad. Si te interesa, podemos revisar su experiencia con Quantfury y apalancamiento, libros de finanzas o artículos de inversión.',
      }],
      quickReplies: [
        createAnswerQuickReply({ id: 'content-boundary-quantfury', label: 'Quantfury', answer: 'Háblame de Quantfury.' }),
        createAnswerQuickReply({ id: 'content-boundary-books', label: 'Libros', answer: '¿Qué libros ha leído Víctor?' }),
        createAnswerQuickReply({ id: 'content-boundary-investing', label: 'Artículos de inversión', answer: 'Muéstrame artículos de inversión.' }),
      ],
      stateEffects: { resetFallbacks: true },
      trace: { responseTemplateId: 'dataverso-investment-boundary' },
    });
  }
  const last = history.filter(message => message.role === 'assistant').at(-1);
  const continuing = String(last?.responseId ?? '').startsWith('response-dataverso-');
  const followup = continuing && /otro|mas|libro|enlace|ese|eso|\bcomprar\b|\bcompro\b|afiliad|power bi|power query|finanza|inver|aprendiz|quantfury|jepi|apalanc/.test(normalized);

  if (!isContentTrigger(normalized) && !followup) return null;
  if (/experiencia|profesional|recruiter|contact|reunion|reservar|datos personales/.test(normalized)) return null;

  const priorUsers = history.filter(message => message.role === 'user');
  const priorUsersBeforeCurrent = normalizeTurn(priorUsers.at(-1)?.text ?? '') === normalized
    ? priorUsers.slice(0, -1)
    : priorUsers;
  const previous = priorUsersBeforeCurrent.at(-1)?.text ?? '';
  const lastExplicitContentQuery = [...priorUsersBeforeCurrent].reverse().find(message =>
    /power bi|power query|finanza|inver|aprendiz|libro|quantfury|jepi|apalanc|crecimiento personal|mentalidad|habitos?|metodo rico|mente millonaria|padre rico|kiyosaki/.test(normalizeTurn(message.text ?? ''))
  )?.text ?? previous;
  const latestReferencedArticle = [...history].reverse().reduce((found, message) => {
    if (found || message?.role !== 'assistant') return found;
    return catalog.articles.find(article => message.text?.includes(article.url)) ?? null;
  }, null);
  const explicitTopic = /power bi|power query|finanza|inver|aprendiz|libro|quantfury|jepi|apalanc|crecimiento personal|mentalidad|habitos?|metodo rico|mente millonaria|padre rico|kiyosaki/.test(normalized);
  const genericReferenceFollowup = /(?:este|ese|eso)|enlace|afiliad|donde .*?(?:compro|comprar)/.test(normalized);
  const query = genericReferenceFollowup && latestReferencedArticle
    ? `${latestReferencedArticle.title} ${text}`
    : followup && !explicitTopic
      ? `${lastExplicitContentQuery} ${text}`
      : text;
  const exclude = /otro|mas/.test(normalized)
    ? catalog.articles
        .filter(article => history.some(message => message.role === 'assistant' && message.text?.includes(article.url)))
        .map(article => article.id)
    : [];

  const articles = recommendArticles(query, exclude);
  const collection = continuing && /otro|mas/.test(normalized) ? null : collectionFor(normalizeTurn(query));
  const quickReplies = contentQuickReplies(normalizeTurn(query), history);

  if (!articles.length) {
    return createResponseEnvelope({
      id: 'response-dataverso-empty',
      kind: 'knowledge',
      outcome: 'answered',
      messages: [{
        id: 'content-empty',
        text: 'No tengo otro artículo aprobado que encaje con ese tema. Puedo orientarte hacia Power BI, Power Query, finanzas personales, inversión, aprendizaje o libros.',
      }],
      quickReplies: quickReplies.length ? quickReplies : [
        createAnswerQuickReply({ id: 'content-empty-power-bi', label: 'Power BI', answer: 'Quiero aprender Power BI.' }),
        createAnswerQuickReply({ id: 'content-empty-finance', label: 'Finanzas', answer: 'Quiero aprender finanzas personales.' }),
        createAnswerQuickReply({ id: 'content-empty-books', label: 'Libros', answer: '¿Qué libros ha leído Víctor?' }),
      ],
      stateEffects: { resetFallbacks: true },
    });
  }

  const collectionText = collection
    ? ` Si quieres seguir el tema de forma ordenada, tienes la sección “${collection.title}”:\n${collection.url}`
    : '';
  const messages = [{ id: 'content-intro', text: `${introFor(normalized)}${collectionText}` }];

  messages.push(...articles.map((article, index) => ({
    id: `content-article-${index}`,
    text: `${article.title}. ${article.summary}${article.access === 'partial' ? ' Parte del contenido requiere suscripción.' : ''}\n${article.url}`,
  })));

  if (/libro|\bcomprar\b|\bcompro\b|enlace|afiliad/.test(normalized)) {
    for (const book of catalog.books.filter(candidate => articles.some(article => article.id === candidate.articleId))) {
      const articleIndex = articles.findIndex(article => article.id === book.articleId);
      const messageIndex = 1 + articleIndex;
      messages[messageIndex].text += `\n${book.title}: ${book.url}\n${book.disclosure}`;
    }
  }

  const investingContent = articles.some(article => article.topics.includes('investing')) || /inver|quantfury|jepi|apalanc|broker|trading/.test(normalized);
  const financeContent = articles.some(article => article.topics.includes('finance'));

  if (investingContent || financeContent) {
    messages.push({
      id: 'content-finance-boundary',
      text: investingContent
        ? 'Son lecturas educativas y experiencias del autor; no una recomendación personal de inversión. El apalancamiento amplifica también las pérdidas.'
        : 'Son lecturas educativas y experiencias del autor; no asesoramiento financiero personalizado.',
    });
  }

  return createResponseEnvelope({
    id: 'response-dataverso-articles',
    kind: 'knowledge',
    outcome: 'answered',
    messages,
    quickReplies,
    stateEffects: { resetFallbacks: true },
    trace: { responseTemplateId: 'dataverso-articles' },
  });
}
