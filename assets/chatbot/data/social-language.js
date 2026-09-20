/* ============================================================
 * SOCIAL LANGUAGE
 * 1.11.22.2
 *
 * Lenguaje conversacional reutilizable.
 *
 * NO contiene Knowledge.
 * NO contiene respuestas técnicas.
 * NO toma decisiones de negocio.
 *
 * Proporciona variantes naturales para:
 * greeting / thanks / goodbye / transitions / etc.
 * ============================================================
 */


/* ============================================================
 * FAMILY
 * ============================================================
 */

export const SOCIAL_LANGUAGE_FAMILY =
  Object.freeze({
    GREETING_GENERIC:
      "greeting_generic",

    GREETING_MORNING:
      "greeting_morning",

    GREETING_AFTERNOON:
      "greeting_afternoon",

    GREETING_EVENING:
      "greeting_evening",

    INTRODUCTION:
      "introduction",

    ASK_HOW_CAN_HELP:
      "ask_how_can_help",

    OPTIONAL_NAME:
      "optional_name",

    NAME_ACCEPTED:
      "name_accepted",

    THANKS:
      "thanks",

    GOODBYE:
      "goodbye",

    ACKNOWLEDGEMENT:
      "acknowledgement",

    AGREEMENT:
      "agreement",

    TRANSITION:
      "transition",

    QUALIFICATION:
      "qualification",

    DECLINE_ACKNOWLEDGEMENT:
      "decline_acknowledgement",

    REPAIR:
      "repair",

    CLARIFICATION:
      "clarification",

    CONTINUE:
      "continue",

    ASSISTANT_CHECK_IN:
      "assistant_check_in",

    USER_STATE_POSITIVE:
      "user_state_positive",

    USER_STATE_NEGATIVE:
      "user_state_negative",

    USER_STATE_FRUSTRATED:
      "user_state_frustrated",

    USER_STATE_UNCERTAIN:
      "user_state_uncertain",

    USER_STATE_NEUTRAL:
      "user_state_neutral",
  });


/* ============================================================
 * TONE
 * ============================================================
 */

export const SOCIAL_LANGUAGE_TONE =
  Object.freeze({
    NEUTRAL:
      "neutral",

    WARM:
      "warm",

    PROFESSIONAL:
      "professional",
  });


/* ============================================================
 * HELPERS
 * ============================================================
 */

function freezeVariant(
  variant,
) {
  return Object.freeze({
    ...variant,

    tags:
      Object.freeze([
        ...(variant.tags ?? []),
      ]),
  });
}


function family(
  id,
  variants,
) {
  return Object.freeze({
    id,

    variants:
      Object.freeze(
        variants.map(
          freezeVariant,
        ),
      ),
  });
}


/* ============================================================
 * CATALOG
 * ============================================================
 */

export const socialLanguageCatalog =
  Object.freeze({

    /* --------------------------------------------------------
     * GREETING — GENERIC
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .GREETING_GENERIC
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_GENERIC,
        [
          {
            id:
              "greeting-generic-01",

            text:
              "¡Hola! 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,

            tags: [
              "opening",
              "short",
            ],
          },

          {
            id:
              "greeting-generic-02",

            text:
              "¡Hola! Encantado de ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,

            tags: [
              "opening",
            ],
          },

          {
            id:
              "greeting-generic-03",

            text:
              "¡Hola! ¿Qué tal? 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,

            tags: [
              "opening",
              "casual",
            ],
          },

          {
            id:
              "greeting-generic-04",

            text:
              "¡Buenas! 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,

            tags: [
              "opening",
              "casual",
            ],
          },
        ],
      ),


    /* --------------------------------------------------------
     * MORNING
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .GREETING_MORNING
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_MORNING,
        [
          {
            id:
              "greeting-morning-01",

            text:
              "¡Buenos días! 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-morning-02",

            text:
              "¡Muy buenos días!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-morning-03",

            text:
              "¡Buenos días! Encantado de ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * AFTERNOON
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .GREETING_AFTERNOON
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_AFTERNOON,
        [
          {
            id:
              "greeting-afternoon-01",

            text:
              "¡Buenas tardes! 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-afternoon-02",

            text:
              "¡Muy buenas tardes!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-afternoon-03",

            text:
              "¡Buenas tardes! Encantado de ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * EVENING
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .GREETING_EVENING
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_EVENING,
        [
          {
            id:
              "greeting-evening-01",

            text:
              "¡Buenas noches! 👋",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-evening-02",

            text:
              "¡Muy buenas noches!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "greeting-evening-03",

            text:
              "¡Buenas noches! Encantado de ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * INTRODUCTION
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .INTRODUCTION
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .INTRODUCTION,
        [
          {
            id:
              "introduction-01",

            text:
              "Soy el asistente digital de Víctor.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "introduction-02",

            text:
              "Soy el asistente digital del portfolio de Víctor.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * HOW CAN I HELP
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .ASK_HOW_CAN_HELP
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .ASK_HOW_CAN_HELP,
        [
          {
            id:
              "ask-help-01",

            text:
              "¿En qué puedo ayudarte?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "ask-help-02",

            text:
              "Cuéntame, ¿en qué puedo ayudarte?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "ask-help-03",

            text:
              "¿Qué te gustaría saber?",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "ask-help-04",

            text:
              "¿Qué necesitas?",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * OPTIONAL NAME
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .OPTIONAL_NAME
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .OPTIONAL_NAME,
        [
          {
            id:
              "optional-name-01",

            text:
              "Si quieres, puedes decirme cómo te llamas y así puedo dirigirme a ti por tu nombre.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "optional-name-02",

            text:
              "Si te apetece, dime tu nombre y puedo personalizar un poco la conversación.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "optional-name-03",

            text:
              "Puedes decirme tu nombre si quieres; no es necesario para continuar.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * NAME ACCEPTED
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .NAME_ACCEPTED
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .NAME_ACCEPTED,
        [
          {
            id:
              "name-accepted-01",

            text:
              "Encantado, {name}.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "name-accepted-02",

            text:
              "Perfecto, {name}. Encantado de conocerte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "name-accepted-03",

            text:
              "Gracias, {name}.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * THANKS
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .THANKS
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        [
          {
            id:
              "thanks-01",

            text:
              "¡De nada!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "thanks-02",

            text:
              "¡De nada! Me alegro de haber podido ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "thanks-03",

            text:
              "Encantado de ayudarte.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "thanks-04",

            text:
              "Perfecto, me alegro de que te haya servido.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "thanks-05",

            text:
              "¡A ti! 😊",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "thanks-06",

            text:
              "No hay de qué.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * GOODBYE
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .GOODBYE
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .GOODBYE,
        [
          {
            id:
              "goodbye-01",

            text:
              "¡Hasta pronto!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "goodbye-02",

            text:
              "Ha sido un placer ayudarte. ¡Hasta pronto!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "goodbye-03",

            text:
              "Perfecto. Que vaya muy bien.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "goodbye-04",

            text:
              "Cuando quieras, aquí estaré. ¡Hasta luego!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "goodbye-05",

            text:
              "Gracias por pasarte por el portfolio. ¡Hasta la próxima!",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * ACKNOWLEDGEMENT
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .ACKNOWLEDGEMENT
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .ACKNOWLEDGEMENT,
        [
          {
            id:
              "ack-01",

            text:
              "Entiendo.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "ack-02",

            text:
              "De acuerdo.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "ack-03",

            text:
              "Perfecto.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "ack-04",

            text:
              "Vale, te sigo.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "ack-05",

            text:
              "Sí, entiendo lo que planteas.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * AGREEMENT
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .AGREEMENT
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .AGREEMENT,
        [
          {
            id:
              "agreement-01",

            text:
              "Sí.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "agreement-02",

            text:
              "Sí, exactamente.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "agreement-03",

            text:
              "Correcto.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "agreement-04",

            text:
              "Así es.",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * TRANSITIONS
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .TRANSITION
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .TRANSITION,
        [
          {
            id:
              "transition-01",

            text:
              "Hay un matiz importante.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "transition-02",

            text:
              "En este caso conviene distinguir dos cosas.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "transition-03",

            text:
              "Además, hay otro punto relevante.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "transition-04",

            text:
              "Por otro lado,",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "transition-05",

            text:
              "En cuanto a eso,",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * QUALIFICATION
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .QUALIFICATION
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .QUALIFICATION,
        [
          {
            id:
              "qualification-01",

            text:
              "Eso sí, conviene matizarlo.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "qualification-02",

            text:
              "Aquí hay que hacer una precisión.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "qualification-03",

            text:
              "Con la información disponible, puedo afirmarlo solo con ese matiz.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "qualification-04",

            text:
              "No sería correcto ir más allá de lo que está documentado.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * DECLINE
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .DECLINE_ACKNOWLEDGEMENT
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .DECLINE_ACKNOWLEDGEMENT,
        [
          {
            id:
              "decline-01",

            text:
              "Sin problema.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "decline-02",

            text:
              "Perfecto, no hace falta.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "decline-03",

            text:
              "Claro, podemos continuar sin ello.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * REPAIR
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .REPAIR
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .REPAIR,
        [
          {
            id:
              "repair-01",

            text:
              "Creo que no he entendido bien lo que necesitas.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "repair-02",

            text:
              "No estoy seguro de haber interpretado bien tu pregunta.",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },

          {
            id:
              "repair-03",

            text:
              "Puede que me falte algo de contexto.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * CLARIFICATION
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .CLARIFICATION
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .CLARIFICATION,
        [
          {
            id:
              "clarification-01",

            text:
              "¿Te refieres a {optionA} o a {optionB}?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "clarification-02",

            text:
              "Para asegurarme de entenderte: ¿hablas de {optionA} o de {optionB}?",

            tone:
              SOCIAL_LANGUAGE_TONE
                .PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * CONTINUE
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .CONTINUE
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .CONTINUE,
        [
          {
            id:
              "continue-01",

            text:
              "Cuéntame un poco más.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "continue-02",

            text:
              "Te escucho.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "continue-03",

            text:
              "Sigue, si quieres.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "continue-04",

            text:
              "¿Qué ocurre después en ese proceso?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * ASSISTANT CHECK-IN
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .ASSISTANT_CHECK_IN
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .ASSISTANT_CHECK_IN,
        [
          {
            id:
              "assistant-check-in-01",

            text:
              "¡Gracias por preguntar! Todo listo por aquí 😊. ¿En qué puedo ayudarte?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "assistant-check-in-02",

            text:
              "Todo listo por aquí. Estoy preparado para ayudarte con el portfolio de Víctor. ¿Qué te gustaría saber?",

            tone:
              SOCIAL_LANGUAGE_TONE.PROFESSIONAL,
          },

          {
            id:
              "assistant-check-in-03",

            text:
              "Funcionando y listo para ayudarte 😊. ¿Por dónde empezamos?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * USER STATE — POSITIVE
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .USER_STATE_POSITIVE
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_POSITIVE,
        [
          {
            id:
              "user-state-positive-01",

            text:
              "¡Qué bien leer eso! 😊 ¿Qué te gustaría conocer de Víctor?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-positive-02",

            text:
              "¡Qué bien! Podemos aprovechar yendo directamente a lo que quieras consultar del portfolio.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-positive-03",

            text:
              "Genial. Dime qué quieres saber y te ayudo a encontrarlo.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },
        ],
      ),


    /* --------------------------------------------------------
     * USER STATE — NEGATIVE
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .USER_STATE_NEGATIVE
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_NEGATIVE,
        [
          {
            id:
              "user-state-negative-01",

            text:
              "Entiendo. Si quieres, vamos directamente a lo que necesitas y lo vemos paso a paso.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-negative-02",

            text:
              "Vaya. Podemos centrarnos en una sola cosa cada vez. ¿Qué necesitas resolver ahora?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-negative-03",

            text:
              "De acuerdo. Cuéntame qué necesitas y trataré de orientarte de la forma más clara posible.",

            tone:
              SOCIAL_LANGUAGE_TONE.PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * USER STATE — FRUSTRATED
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .USER_STATE_FRUSTRATED
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_FRUSTRATED,
        [
          {
            id:
              "user-state-frustrated-01",

            text:
              "Veo que esto está resultando frustrante. Cuéntame qué está fallando y nos centramos en eso.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-frustrated-02",

            text:
              "Parece que te está dando bastante guerra. Vamos a aislar el problema: ¿qué es lo que no funciona?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-frustrated-03",

            text:
              "Vamos a centrarnos en desbloquearlo. Cuéntame el punto concreto donde se atasca.",

            tone:
              SOCIAL_LANGUAGE_TONE.PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * USER STATE — UNCERTAIN
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .USER_STATE_UNCERTAIN
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_UNCERTAIN,
        [
          {
            id:
              "user-state-uncertain-01",

            text:
              "Claro. Si estás un poco perdido, cuéntame qué intentas resolver y te ayudo a orientarlo.",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-uncertain-02",

            text:
              "No pasa nada. Podemos empezar por lo básico: ¿qué necesitas conseguir?",

            tone:
              SOCIAL_LANGUAGE_TONE.WARM,
          },

          {
            id:
              "user-state-uncertain-03",

            text:
              "Vamos a darle estructura. Dime el objetivo o el problema principal y empezamos por ahí.",

            tone:
              SOCIAL_LANGUAGE_TONE.PROFESSIONAL,
          },
        ],
      ),


    /* --------------------------------------------------------
     * USER STATE — NEUTRAL
     * --------------------------------------------------------
     */

    [
      SOCIAL_LANGUAGE_FAMILY
        .USER_STATE_NEUTRAL
    ]:
      family(
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_NEUTRAL,
        [
          {
            id:
              "user-state-neutral-01",

            text:
              "Entendido. ¿En qué puedo ayudarte?",

            tone:
              SOCIAL_LANGUAGE_TONE.NEUTRAL,
          },

          {
            id:
              "user-state-neutral-02",

            text:
              "De acuerdo. Dime qué te gustaría consultar.",

            tone:
              SOCIAL_LANGUAGE_TONE.PROFESSIONAL,
          },
        ],
      ),
  });


/* ============================================================
 * ALL VARIANTS
 * ============================================================
 */

export const socialLanguageVariants =
  Object.freeze(
    Object.values(
      socialLanguageCatalog,
    ).flatMap(
      (entry) =>
        entry.variants,
    ),
  );


export const socialLanguageById =
  Object.freeze(
    Object.fromEntries(
      socialLanguageVariants.map(
        (variant) => [
          variant.id,
          variant,
        ],
      ),
    ),
  );


/* ============================================================
 * GETTERS
 * ============================================================
 */

export function getSocialLanguageFamily(
  familyId,
) {
  if (
    typeof familyId !==
      "string" ||
    !familyId.trim()
  ) {
    return null;
  }

  return (
    socialLanguageCatalog[
      familyId
    ] ?? null
  );
}


export function getSocialLanguageVariant(
  variantId,
) {
  if (
    typeof variantId !==
      "string" ||
    !variantId.trim()
  ) {
    return null;
  }

  return (
    socialLanguageById[
      variantId
    ] ?? null
  );
}


/* ============================================================
 * TEMPLATE RENDERER
 *
 * Solo sustituye placeholders conocidos.
 * No interpreta HTML.
 * ============================================================
 */

export function renderSocialTemplate(
  text,
  variables = {},
) {
  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return "";
  }

  return text.replace(
    /\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
    (
      match,
      key,
    ) => {
      const value =
        variables[key];

      if (
        typeof value !==
          "string" ||
        !value.trim()
      ) {
        return match;
      }

      return value.trim();
    },
  );
}


/* ============================================================
 * DETERMINISTIC VARIANT PICKER
 *
 * No Math.random().
 *
 * El índice de conversación permite rotar de manera
 * reproducible y testeable.
 * ============================================================
 */

export function selectSocialVariant(
  familyId,
  {
    turnIndex = 0,
    recentVariantIds = [],
    preferredTone = null,
  } = {},
) {
  const entry =
    getSocialLanguageFamily(
      familyId,
    );

  if (!entry) {
    return null;
  }


  let candidates =
    entry.variants;


  if (
    preferredTone &&
    Object.values(
      SOCIAL_LANGUAGE_TONE,
    ).includes(
      preferredTone,
    )
  ) {
    const matchingTone =
      candidates.filter(
        (variant) =>
          variant.tone ===
          preferredTone,
      );

    if (
      matchingTone.length >
      0
    ) {
      candidates =
        matchingTone;
    }
  }


  const recent =
    new Set(
      Array.isArray(
        recentVariantIds,
      )
        ? recentVariantIds
        : [],
    );


  const notRecent =
    candidates.filter(
      (variant) =>
        !recent.has(
          variant.id,
        ),
    );


  if (
    notRecent.length >
    0
  ) {
    candidates =
      notRecent;
  }


  const safeTurnIndex =
    Number.isInteger(
      turnIndex,
    ) &&
    turnIndex >= 0
      ? turnIndex
      : 0;


  return candidates[
    safeTurnIndex %
    candidates.length
  ];
}