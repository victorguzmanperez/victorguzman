import test from "node:test";
import assert from "node:assert/strict";

import {
  SOCIAL_LANGUAGE_FAMILY,
  SOCIAL_LANGUAGE_TONE,
  socialLanguageCatalog,
  socialLanguageVariants,
  socialLanguageById,
  getSocialLanguageFamily,
  getSocialLanguageVariant,
  renderSocialTemplate,
  selectSocialVariant,
} from "../data/social-language.js";


test(
  "every social language family exists",
  () => {
    for (
      const familyId
      of Object.values(
        SOCIAL_LANGUAGE_FAMILY,
      )
    ) {
      assert.ok(
        socialLanguageCatalog[
          familyId
        ],
        familyId,
      );
    }
  },
);


test(
  "every language family contains variants",
  () => {
    for (
      const family
      of Object.values(
        socialLanguageCatalog,
      )
    ) {
      assert.ok(
        family.variants.length >
          0,
      );
    }
  },
);


test(
  "social language variant ids are globally unique",
  () => {
    const ids =
      socialLanguageVariants.map(
        (variant) =>
          variant.id,
      );

    assert.equal(
      new Set(ids).size,
      ids.length,
    );
  },
);


test(
  "variant index contains every social phrase",
  () => {
    assert.equal(
      Object.keys(
        socialLanguageById,
      ).length,
      socialLanguageVariants.length,
    );

    for (
      const variant
      of socialLanguageVariants
    ) {
      assert.equal(
        socialLanguageById[
          variant.id
        ],
        variant,
      );
    }
  },
);


test(
  "social language contains no HTML",
  () => {
    for (
      const variant
      of socialLanguageVariants
    ) {
      assert.equal(
        /<\/?[a-z][^>]*>/i
          .test(
            variant.text,
          ),
        false,
        variant.id,
      );
    }
  },
);


test(
  "every variant uses canonical tone",
  () => {
    const allowed =
      new Set(
        Object.values(
          SOCIAL_LANGUAGE_TONE,
        ),
      );

    for (
      const variant
      of socialLanguageVariants
    ) {
      assert.ok(
        allowed.has(
          variant.tone,
        ),
        variant.id,
      );
    }
  },
);


test(
  "generic greeting contains several natural alternatives",
  () => {
    const family =
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_GENERIC,
      );

    assert.ok(
      family.variants.length >=
        4,
    );
  },
);


test(
  "morning afternoon and evening greetings are separated",
  () => {
    assert.ok(
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_MORNING,
      ),
    );

    assert.ok(
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_AFTERNOON,
      ),
    );

    assert.ok(
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_EVENING,
      ),
    );
  },
);


test(
  "assistant introduction is transparent about digital identity",
  () => {
    const family =
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .INTRODUCTION,
      );

    assert.ok(
      family.variants.every(
        (variant) =>
          variant.text
            .toLowerCase()
            .includes(
              "asistente digital",
            ),
      ),
    );
  },
);


test(
  "optional name language clearly remains optional",
  () => {
    const family =
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .OPTIONAL_NAME,
      );

    assert.ok(
      family.variants.every(
        (variant) =>
          /si quieres|si te apetece|no es necesario/i
            .test(
              variant.text,
            ),
      ),
    );
  },
);


test(
  "provided name can be rendered safely",
  () => {
    const result =
      renderSocialTemplate(
        "Encantado, {name}.",
        {
          name:
            "Juan",
        },
      );

    assert.equal(
      result,
      "Encantado, Juan.",
    );
  },
);


test(
  "missing template variable stays visible instead of inventing data",
  () => {
    const result =
      renderSocialTemplate(
        "Encantado, {name}.",
        {},
      );

    assert.equal(
      result,
      "Encantado, {name}.",
    );
  },
);


test(
  "template renderer trims inserted values",
  () => {
    assert.equal(
      renderSocialTemplate(
        "Hola, {name}.",
        {
          name:
            "  Ana  ",
        },
      ),
      "Hola, Ana.",
    );
  },
);


test(
  "deterministic selector returns same variant for same context",
  () => {
    const first =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        {
          turnIndex:
            2,
        },
      );

    const second =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        {
          turnIndex:
            2,
        },
      );

    assert.equal(
      first.id,
      second.id,
    );
  },
);


test(
  "deterministic selector rotates by turn index",
  () => {
    const first =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_GENERIC,
        {
          turnIndex:
            0,
        },
      );

    const second =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .GREETING_GENERIC,
        {
          turnIndex:
            1,
        },
      );

    assert.notEqual(
      first.id,
      second.id,
    );
  },
);


test(
  "recent variant is avoided when alternatives exist",
  () => {
    const first =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        {
          turnIndex:
            0,
        },
      );

    const second =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        {
          turnIndex:
            0,

          recentVariantIds: [
            first.id,
          ],
        },
      );

    assert.notEqual(
      second.id,
      first.id,
    );
  },
);


test(
  "preferred tone is respected when available",
  () => {
    const variant =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .TRANSITION,
        {
          preferredTone:
            SOCIAL_LANGUAGE_TONE
              .PROFESSIONAL,
        },
      );

    assert.equal(
      variant.tone,
      SOCIAL_LANGUAGE_TONE
        .PROFESSIONAL,
    );
  },
);


test(
  "invalid preferred tone falls back safely",
  () => {
    const variant =
      selectSocialVariant(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
        {
          preferredTone:
            "does-not-exist",
        },
      );

    assert.ok(variant);
  },
);


test(
  "unknown family returns null",
  () => {
    assert.equal(
      selectSocialVariant(
        "does-not-exist",
      ),
      null,
    );
  },
);


test(
  "safe getters reject invalid values",
  () => {
    assert.equal(
      getSocialLanguageFamily(
        null,
      ),
      null,
    );

    assert.equal(
      getSocialLanguageVariant(
        null,
      ),
      null,
    );

    assert.equal(
      getSocialLanguageVariant(
        "does-not-exist",
      ),
      null,
    );
  },
);


test(
  "thanks has enough alternatives to avoid robotic repetition",
  () => {
    assert.ok(
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .THANKS,
      ).variants.length >=
        5,
    );
  },
);


test(
  "goodbye has enough alternatives to avoid robotic repetition",
  () => {
    assert.ok(
      getSocialLanguageFamily(
        SOCIAL_LANGUAGE_FAMILY
          .GOODBYE,
      ).variants.length >=
        5,
    );
  },
);


test(
  "social language structures are frozen",
  () => {
    assert.equal(
      Object.isFrozen(
        socialLanguageCatalog,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        socialLanguageVariants,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        socialLanguageById,
      ),
      true,
    );

    for (
      const family
      of Object.values(
        socialLanguageCatalog,
      )
    ) {
      assert.equal(
        Object.isFrozen(
          family,
        ),
        true,
      );

      assert.equal(
        Object.isFrozen(
          family.variants,
        ),
        true,
      );
    }
  },
);

test(
  "SOC-H1 tone families provide response variation",
  () => {
    for (
      const familyId
      of [
        SOCIAL_LANGUAGE_FAMILY
          .ASSISTANT_CHECK_IN,
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_POSITIVE,
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_NEGATIVE,
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_FRUSTRATED,
        SOCIAL_LANGUAGE_FAMILY
          .USER_STATE_UNCERTAIN,
      ]
    ) {
      assert.ok(
        getSocialLanguageFamily(
          familyId,
        ).variants.length >= 3,
        familyId,
      );
    }
  },
);
