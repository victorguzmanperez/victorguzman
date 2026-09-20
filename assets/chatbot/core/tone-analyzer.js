/* ============================================================
 * TONE ANALYZER
 * SOC-H1-T
 *
 * Analiza únicamente señales lingüísticas observables del turno.
 *
 * NO diagnostica emociones reales.
 * NO persiste estado emocional.
 * NO contiene texto libre en su salida.
 * NO modifica hechos ni routing de negocio por sí solo.
 * ============================================================
 */

export const CONVERSATION_TONE =
  Object.freeze({
    POSITIVE:
      "positive",

    NEUTRAL:
      "neutral",

    NEGATIVE:
      "negative",

    FRUSTRATED:
      "frustrated",

    UNCERTAIN:
      "uncertain",
  });


export const TONE_VALENCE =
  Object.freeze({
    POSITIVE:
      "positive",

    NEUTRAL:
      "neutral",

    NEGATIVE:
      "negative",
  });


export const TONE_INTENSITY =
  Object.freeze({
    LOW:
      "low",

    MEDIUM:
      "medium",

    HIGH:
      "high",
  });


export const SOCIAL_CUE =
  Object.freeze({
    ASSISTANT_CHECK_IN:
      "assistant_check_in",

    USER_STATE:
      "user_state",
  });


const SIGNAL =
  Object.freeze({
    POSITIVE_STATE:
      "positive_state",

    NEGATIVE_STATE:
      "negative_state",

    FRUSTRATION:
      "frustration_expression",

    UNCERTAINTY:
      "uncertainty_expression",

    ASSISTANT_CHECK_IN:
      "assistant_check_in",

    GRATITUDE:
      "gratitude",
  });


function normalizeToneText(
  value,
) {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[¿?¡!.,;:"“”()[\]{}<>/\\|]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


function hasAny(
  text,
  patterns,
) {
  return patterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}


const ASSISTANT_CHECK_IN_PATTERNS =
  Object.freeze([
    /^(?:hola\s+)?como\s+estas(?:\s+tu)?$/,
    /^que\s+tal(?:\s+estas)?$/,
    /^como\s+va\s+todo$/,
    /^todo\s+bien(?:\s+por\s+ahi)?$/,
    /^como\s+te\s+va$/,
    /^como\s+andas$/,
    /^que\s+tal\s+va\s+todo$/,
  ]);


const FRUSTRATION_PATTERNS =
  Object.freeze([
    /\b(?:estoy|me\s+siento)\s+(?:muy\s+)?(?:harto|harta|frustrado|frustrada|desesperado|desesperada)\b/,
    /\bme\s+(?:esta\s+)?(?:frustrando|desesperando)\b/,
    /\bno\s+funciona\s+nada\b/,
    /\besto\s+no\s+funciona\b/,
    /\besto\s+es\s+(?:desesperante|frustrante)\b/,
    /\bllevo\s+(?:horas|mucho\s+rato|toda\s+la\s+manana|toda\s+la\s+tarde)\b/,
    /\bya\s+no\s+se\s+que\s+hacer\b/,
  ]);


const UNCERTAINTY_PATTERNS =
  Object.freeze([
    /\b(?:estoy|me\s+siento)\s+(?:un\s+poco\s+)?(?:perdido|perdida|confundido|confundida)\b/,
    /\bno\s+(?:lo\s+)?entiendo\b/,
    /\bno\s+se\s+por\s+donde\s+empezar\b/,
    /\bno\s+se\s+como\s+seguir\b/,
    /\btengo\s+dudas\b/,
    /\bno\s+lo\s+tengo\s+claro\b/,
    /\bme\s+he\s+perdido\b/,
  ]);


const NEGATIVE_PATTERNS =
  Object.freeze([
    /\b(?:estoy|me\s+siento)\s+(?:muy\s+)?(?:cansado|cansada|mal|preocupado|preocupada|agobiado|agobiada)\b/,
    /\bno\s+me\s+(?:esta\s+)?gustando\b/,
    /\besto\s+va\s+mal\b/,
    /\bestoy\s+teniendo\s+problemas\b/,
    /\bme\s+esta\s+costando\b/,
    /\bque\s+mal\b/,
  ]);


const POSITIVE_PATTERNS =
  Object.freeze([
    /\b(?:estoy|me\s+siento)\s+(?:muy\s+)?(?:bien|genial|fenomenal|estupendo|estupenda|contento|contenta)\b/,
    /\bme\s+encanta\b/,
    /\bque\s+bien\b/,
    /\btodo\s+(?:va\s+)?(?:bien|genial|perfecto)\b/,
    /\bperfecto\b/,
    /\bgenial\b/,
  ]);


const GRATITUDE_PATTERNS =
  Object.freeze([
    /\bgracias\b/,
    /\bte\s+lo\s+agradezco\b/,
  ]);


function isLikelyStandaloneSocialState(
  text,
  matchedTone,
) {
  if (!text) {
    return false;
  }

  const tokenCount =
    text
      .split(" ")
      .filter(Boolean)
      .length;

  if (
    tokenCount <= 8
  ) {
    return true;
  }

  /*
   * Las expresiones más fuertes siguen siendo útiles como
   * small talk aunque añadan una breve explicación.
   * Los flujos de problema/operacionales tienen prioridad
   * antes de este cue en el Dialogue Manager.
   */
  return (
    matchedTone ===
      CONVERSATION_TONE
        .FRUSTRATED ||
    matchedTone ===
      CONVERSATION_TONE
        .UNCERTAIN
  ) &&
    tokenCount <= 14;
}


function confidenceFor(
  tone,
  socialCue,
) {
  if (
    socialCue ===
      SOCIAL_CUE
        .ASSISTANT_CHECK_IN
  ) {
    return 0.98;
  }

  switch (tone) {
    case CONVERSATION_TONE
      .FRUSTRATED:
      return 0.90;

    case CONVERSATION_TONE
      .UNCERTAIN:
      return 0.88;

    case CONVERSATION_TONE
      .POSITIVE:
    case CONVERSATION_TONE
      .NEGATIVE:
      return 0.84;

    default:
      return 0.50;
  }
}


export function analyzeTone(
  text,
) {
  const normalized =
    normalizeToneText(
      text,
    );

  const signals =
    new Set();

  let tone =
    CONVERSATION_TONE
      .NEUTRAL;

  let valence =
    TONE_VALENCE
      .NEUTRAL;

  let intensity =
    TONE_INTENSITY
      .LOW;

  let socialCue =
    null;


  if (
    hasAny(
      normalized,
      ASSISTANT_CHECK_IN_PATTERNS,
    )
  ) {
    signals.add(
      SIGNAL
        .ASSISTANT_CHECK_IN,
    );

    socialCue =
      SOCIAL_CUE
        .ASSISTANT_CHECK_IN;
  }


  if (
    hasAny(
      normalized,
      FRUSTRATION_PATTERNS,
    )
  ) {
    tone =
      CONVERSATION_TONE
        .FRUSTRATED;

    valence =
      TONE_VALENCE
        .NEGATIVE;

    intensity =
      /\b(?:muy|harto|harta|desesperad[oa]|no funciona nada)\b/
        .test(
          normalized,
        )
        ? TONE_INTENSITY
            .HIGH
        : TONE_INTENSITY
            .MEDIUM;

    signals.add(
      SIGNAL
        .FRUSTRATION,
    );
  } else if (
    hasAny(
      normalized,
      UNCERTAINTY_PATTERNS,
    )
  ) {
    tone =
      CONVERSATION_TONE
        .UNCERTAIN;

    valence =
      TONE_VALENCE
        .NEGATIVE;

    intensity =
      TONE_INTENSITY
        .MEDIUM;

    signals.add(
      SIGNAL
        .UNCERTAINTY,
    );
  } else if (
    hasAny(
      normalized,
      NEGATIVE_PATTERNS,
    )
  ) {
    tone =
      CONVERSATION_TONE
        .NEGATIVE;

    valence =
      TONE_VALENCE
        .NEGATIVE;

    intensity =
      /\bmuy\b/
        .test(
          normalized,
        )
        ? TONE_INTENSITY
            .HIGH
        : TONE_INTENSITY
            .MEDIUM;

    signals.add(
      SIGNAL
        .NEGATIVE_STATE,
    );
  } else if (
    hasAny(
      normalized,
      POSITIVE_PATTERNS,
    )
  ) {
    tone =
      CONVERSATION_TONE
        .POSITIVE;

    valence =
      TONE_VALENCE
        .POSITIVE;

    intensity =
      /\b(?:muy|genial|fenomenal|me encanta)\b/
        .test(
          normalized,
        )
        ? TONE_INTENSITY
            .HIGH
        : TONE_INTENSITY
            .MEDIUM;

    signals.add(
      SIGNAL
        .POSITIVE_STATE,
    );
  }


  if (
    hasAny(
      normalized,
      GRATITUDE_PATTERNS,
    )
  ) {
    signals.add(
      SIGNAL
        .GRATITUDE,
    );
  }


  if (
    !socialCue &&
    tone !==
      CONVERSATION_TONE
        .NEUTRAL &&
    isLikelyStandaloneSocialState(
      normalized,
      tone,
    )
  ) {
    socialCue =
      SOCIAL_CUE
        .USER_STATE;
  }


  const confidence =
    confidenceFor(
      tone,
      socialCue,
    );


  return Object.freeze({
    tone,
    valence,
    intensity,
    confidence,
    socialCue,

    signals:
      Object.freeze([
        ...signals,
      ]),
  });
}
