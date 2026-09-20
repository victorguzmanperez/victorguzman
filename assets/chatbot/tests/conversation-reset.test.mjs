import test
  from "node:test";

import assert
  from "node:assert/strict";

import {
  CONVERSATION_RESET_COMMANDS,
  isConversationResetCommand,
} from "../core/conversation-reset.js";


test(
  "UX-H0 recognizes explicit natural reset commands",
  () => {
    for (
      const command
      of CONVERSATION_RESET_COMMANDS
    ) {
      assert.equal(
        isConversationResetCommand(
          command,
        ),
        true,
        command,
      );
    }

    assert.equal(
      isConversationResetCommand(
        "¡Reinicia la conversación!",
      ),
      true,
    );

    assert.equal(
      isConversationResetCommand(
        "Quiero empezar de cero",
      ),
      true,
    );
  },
);


test(
  "UX-H0 does not hijack privacy questions or unrelated language",
  () => {
    for (
      const text
      of [
        "¿Puedo borrar la conversación?",
        "¿Guardáis mi conversación?",
        "¿Cómo funciona la privacidad?",
        "Quiero borrar datos de un Excel",
        "¿Qué proyectos tiene Víctor?",
        "",
      ]
    ) {
      assert.equal(
        isConversationResetCommand(
          text,
        ),
        false,
        text,
      );
    }
  },
);
