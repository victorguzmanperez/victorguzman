/**
 * ============================================================
 * ASISTENTE DE VÍCTOR
 * Conversational reset command detector
 * UX-H0
 * ============================================================
 *
 * Detecta únicamente órdenes explícitas para iniciar una nueva
 * conversación. No interpreta preguntas sobre privacidad o borrado.
 */

function normalizeResetCommand(
  value,
) {
  if (
    typeof value !== "string"
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
      /[¿?¡!.,;:]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


export const CONVERSATION_RESET_COMMANDS =
  Object.freeze([
    "reinicia el chat",
    "reiniciar el chat",
    "reinicia la conversacion",
    "reiniciar la conversacion",
    "nueva conversacion",
    "empezar de nuevo",
    "empecemos de nuevo",
    "quiero empezar de cero",
    "empezar de cero",
    "borra esta conversacion",
    "borrar esta conversacion",
    "borra el chat",
    "borrar el chat",
  ]);


const RESET_COMMAND_SET =
  new Set(
    CONVERSATION_RESET_COMMANDS,
  );


export function isConversationResetCommand(
  value,
) {
  const normalized =
    normalizeResetCommand(
      value,
    );

  if (!normalized) {
    return false;
  }

  return RESET_COMMAND_SET.has(
    normalized,
  );
}
