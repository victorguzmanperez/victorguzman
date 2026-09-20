/**
 * Asistente de Víctor
 * Control visual del avatar.
 *
 * PREPROD.1.11.3 — Avatar
 * HITO I0.5 — Launcher + avatar base
 *
 * Este módulo:
 * - resuelve el asset del avatar;
 * - aplica estados visuales;
 * - gestiona reduced-motion;
 * - implementa fallback visual;
 * - NO mantiene timers globales;
 * - NO modifica el estado conversacional.
 */

import {
  resolveAvatarAsset,
  debugLog,
} from "../core/config.js";

import {
  AVATAR_STATUS,
} from "../core/state.js";

/**
 * Único asset disponible físicamente
 * en este momento.
 *
 * Cuando incorporemos blink/thinking/speaking,
 * bastará con ampliar AVATAR_ASSET_BY_STATE.
 */
export const DEFAULT_AVATAR_FILENAME =
  "victor-assistant-default.webp";

/**
 * Por ahora todos los estados que necesitan
 * imagen utilizan el asset default.
 *
 * Evitamos deliberadamente pedir archivos
 * todavía inexistentes y generar 404.
 */
const AVATAR_ASSET_BY_STATE =
  Object.freeze({
    [AVATAR_STATUS.IDLE]:
      DEFAULT_AVATAR_FILENAME,

    [AVATAR_STATUS.BLINK]:
      DEFAULT_AVATAR_FILENAME,

    [AVATAR_STATUS.HOVER]:
      DEFAULT_AVATAR_FILENAME,

    [AVATAR_STATUS.THINKING]:
      DEFAULT_AVATAR_FILENAME,

    [AVATAR_STATUS.SPEAKING]:
      DEFAULT_AVATAR_FILENAME,

    [AVATAR_STATUS.NOTIFICATION]:
      DEFAULT_AVATAR_FILENAME,
  });

const ALLOWED_AVATAR_STATES =
  Object.freeze(
    Object.values(
      AVATAR_STATUS,
    ),
  );

/**
 * Comprueba que el estado visual sea válido.
 */
export function normalizeAvatarState(
  avatarState,
) {
  if (
    !ALLOWED_AVATAR_STATES.includes(
      avatarState,
    )
  ) {
    throw new RangeError(
      `Invalid avatar state: ${avatarState}`,
    );
  }

  return avatarState;
}

/**
 * Devuelve la presentación que corresponde
 * a un estado.
 *
 * Es deliberadamente una función pura:
 * podemos probarla en Node sin DOM.
 */
export function getAvatarPresentation(
  avatarState = AVATAR_STATUS.IDLE,
  {
    reducedMotion = false,
  } = {},
) {
  const normalizedState =
    normalizeAvatarState(
      avatarState,
    );

  if (
    typeof reducedMotion !== "boolean"
  ) {
    throw new TypeError(
      "reducedMotion must be a boolean",
    );
  }

  /**
   * Con reduced-motion mantenemos el estado
   * semántico, pero CSS eliminará movimiento.
   */
  return {
    state:
      normalizedState,

    filename:
      AVATAR_ASSET_BY_STATE[
        normalizedState
      ],

    src:
      resolveAvatarAsset(
        AVATAR_ASSET_BY_STATE[
          normalizedState
        ],
      ),

    reducedMotion,

    animated:
      !reducedMotion &&
      normalizedState !==
        AVATAR_STATUS.IDLE,
  };
}

/**
 * Aplica la presentación a elementos DOM.
 */
export function applyAvatarPresentation({
  container,
  image,
  avatarState =
    AVATAR_STATUS.IDLE,
  reducedMotion = false,
} = {}) {
  if (
    !container ||
    typeof container.setAttribute !==
      "function"
  ) {
    throw new TypeError(
      "avatar container is required",
    );
  }

  if (
    !image ||
    typeof image.setAttribute !==
      "function"
  ) {
    throw new TypeError(
      "avatar image is required",
    );
  }

  const presentation =
    getAvatarPresentation(
      avatarState,
      {
        reducedMotion,
      },
    );

  container.setAttribute(
    "data-avatar-state",
    presentation.state,
  );

  container.setAttribute(
    "data-reduced-motion",
    String(
      presentation.reducedMotion,
    ),
  );

  image.setAttribute(
    "src",
    presentation.src,
  );

  image.setAttribute(
    "data-avatar-state",
    presentation.state,
  );

  return presentation;
}

/**
 * Controller del avatar.
 *
 * Los listeners y referencias DOM permanecen
 * dentro del módulo UI; nunca dentro de state.js.
 */
export function createAvatarController({
  container,
  image,
  initialState =
    AVATAR_STATUS.IDLE,
  reducedMotion = false,
} = {}) {
  let currentState =
    normalizeAvatarState(
      initialState,
    );

  let motionReduced =
    Boolean(
      reducedMotion,
    );

  let destroyed = false;

  const handleImageError =
    () => {
      if (destroyed) {
        return;
      }

      /**
       * No intentamos cargar otro fichero
       * inexistente.
       *
       * CSS mostrará un fallback textual
       * dentro del círculo.
       */
      container.setAttribute(
        "data-avatar-image-failed",
        "true",
      );

      image.setAttribute(
        "aria-hidden",
        "true",
      );

      debugLog(
        "avatar image failed; using CSS fallback",
        {
          src:
            image.getAttribute?.(
              "src",
            ) ?? null,
        },
      );
    };

  const handleImageLoad =
    () => {
      if (destroyed) {
        return;
      }

      container.removeAttribute(
        "data-avatar-image-failed",
      );

      image.removeAttribute(
        "aria-hidden",
      );
    };

  if (
    typeof image.addEventListener ===
      "function"
  ) {
    image.addEventListener(
      "error",
      handleImageError,
    );

    image.addEventListener(
      "load",
      handleImageLoad,
    );
  }

  function render() {
    if (destroyed) {
      return null;
    }

    return applyAvatarPresentation({
      container,
      image,
      avatarState:
        currentState,
      reducedMotion:
        motionReduced,
    });
  }

  function setState(
    nextState,
  ) {
    const normalized =
      normalizeAvatarState(
        nextState,
      );

    if (
      normalized ===
      currentState
    ) {
      return render();
    }

    currentState =
      normalized;

    return render();
  }

  function setReducedMotion(
    nextReducedMotion,
  ) {
    if (
      typeof nextReducedMotion !==
        "boolean"
    ) {
      throw new TypeError(
        "reducedMotion must be a boolean",
      );
    }

    motionReduced =
      nextReducedMotion;

    return render();
  }

  function getStatus() {
    return {
      state:
        currentState,

      reducedMotion:
        motionReduced,

      destroyed,
    };
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    if (
      typeof image
        .removeEventListener ===
      "function"
    ) {
      image.removeEventListener(
        "error",
        handleImageError,
      );

      image.removeEventListener(
        "load",
        handleImageLoad,
      );
    }
  }

  render();

  return Object.freeze({
    setState,
    setReducedMotion,
    getStatus,
    destroy,
  });
}