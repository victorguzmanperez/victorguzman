import test from "node:test";
import assert from "node:assert/strict";

import {
  CONVERSATION_TONE,
  SOCIAL_CUE,
  TONE_VALENCE,
  analyzeTone,
} from "../core/tone-analyzer.js";

import {
  analyzeMessage,
  toStateIntentResult,
} from "../core/nlu.js";


test(
  "assistant check-in is recognized without pretending to infer emotion",
  () => {
    const result =
      analyzeTone(
        "¿Cómo estás?",
      );

    assert.equal(
      result.socialCue,
      SOCIAL_CUE
        .ASSISTANT_CHECK_IN,
    );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .NEUTRAL,
    );
  },
);


test(
  "positive user state is detected",
  () => {
    const result =
      analyzeTone(
        "Estoy genial, gracias",
      );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .POSITIVE,
    );

    assert.equal(
      result.valence,
      TONE_VALENCE.POSITIVE,
    );

    assert.equal(
      result.socialCue,
      SOCIAL_CUE.USER_STATE,
    );
  },
);


test(
  "negative user state is detected",
  () => {
    const result =
      analyzeTone(
        "Estoy cansado",
      );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .NEGATIVE,
    );

    assert.equal(
      result.valence,
      TONE_VALENCE.NEGATIVE,
    );
  },
);


test(
  "frustration has precedence over generic negative tone",
  () => {
    const result =
      analyzeTone(
        "Estoy harto, esto no funciona",
      );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .FRUSTRATED,
    );

    assert.ok(
      result.signals.includes(
        "frustration_expression",
      ),
    );
  },
);


test(
  "uncertainty is detected",
  () => {
    const result =
      analyzeTone(
        "No sé por dónde empezar",
      );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .UNCERTAIN,
    );
  },
);


test(
  "neutral factual question remains neutral",
  () => {
    const result =
      analyzeTone(
        "¿Víctor tiene experiencia con AWS?",
      );

    assert.equal(
      result.tone,
      CONVERSATION_TONE
        .NEUTRAL,
    );

    assert.equal(
      result.socialCue,
      null,
    );
  },
);


test(
  "tone analysis contains only structured signals and no raw text",
  () => {
    const raw =
      "Estoy muy frustrado con esto";

    const result =
      analyzeTone(
        raw,
      );

    const serialized =
      JSON.stringify(
        result,
      );

    assert.equal(
      serialized.includes(
        raw,
      ),
      false,
    );

    assert.equal(
      Object.isFrozen(
        result,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        result.signals,
      ),
      true,
    );
  },
);


test(
  "NLU exposes tone ephemerally",
  () => {
    const analysis =
      analyzeMessage(
        "Estoy perdido",
      );

    assert.equal(
      analysis.tone.tone,
      CONVERSATION_TONE
        .UNCERTAIN,
    );
  },
);


test(
  "tone is deliberately excluded from persisted intent result",
  () => {
    const payload =
      toStateIntentResult(
        analyzeMessage(
          "Estoy harto",
        ),
      );

    assert.equal(
      Object.hasOwn(
        payload,
        "tone",
      ),
      false,
    );

    assert.equal(
      Object.hasOwn(
        payload.lastAnalysis,
        "tone",
      ),
      false,
    );
  },
);

test(
  "natural me siento wording is recognized for uncertainty",
  () => {
    const result =
      analyzeTone(
        "Me siento perdido y no sé por dónde empezar",
      );

    assert.equal(
      result.tone,
      "uncertain",
    );
  },
);
