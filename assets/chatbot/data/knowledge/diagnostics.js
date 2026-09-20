import {
  ANSWER_DEPTH,
  ANSWER_EVIDENCE_MODE,
  CLAIM_STATUS,
  COVERAGE_LEVEL,
  FACT_VALUE_TYPE,
  KNOWLEDGE_TYPE,
  LIMITATION_TYPE,
} from "./constants.js";

import {
  createOperationalKnowledgeItem,
} from "./operational-knowledge-factory.js";


export const diagnosticKnowledge =
  Object.freeze([
    createOperationalKnowledgeItem({
      id:
        "diagnostic-portfolio-initial",

      type:
        KNOWLEDGE_TYPE.DIAGNOSTIC,

      title:
        "Diagnóstico inicial de datos y automatización",

      aliases: [
        "diagnóstico",
        "diagnostico",
        "analizar mi caso",
        "explicar mi problema",
        "solicitar diagnóstico",
      ],

      summary:
        "Flujo para estructurar el caso del visitante, recoger únicamente la información necesaria y trasladarla al formulario de diagnóstico para su revisión antes del envío.",

      sources: [
        "source-portfolio-diagnostic",
        "source-portfolio-privacy",
        "source-user-confirmed-chatbot-design",
      ],

      facts: [
        {
          suffix:
            "definition",

          key:
            "diagnostic-definition",

          value:
            "Diagnóstico inicial orientado a identificar necesidades relacionadas con datos, reporting, Excel, procesos manuales y automatización.",

          valueType:
            FACT_VALUE_TYPE.STRING,

          sources: [
            "source-portfolio-diagnostic",
          ],
        },

        {
          suffix:
            "route",

          key:
            "diagnostic-route",

          value:
            "diagnostico.html",

          valueType:
            FACT_VALUE_TYPE.STRING,

          sources: [
            "source-portfolio-diagnostic",
          ],
        },

        {
          suffix:
            "provider",

          key:
            "submission-provider",

          value:
            "formspree",

          valueType:
            FACT_VALUE_TYPE.STRING,

          sources: [
            "source-portfolio-diagnostic",
          ],
        },

        {
          suffix:
            "prefillable-fields",

          key:
            "prefillable-fields",

          value: [
            "nombre",
            "empresa",
            "email",
            "telefono",
            "que_quiere_mejorar",
            "gestion_actual",
            "personas_utilizan_proceso",
            "fecha_inicio",
            "resultado_esperado",
            "informacion_adicional",
          ],

          valueType:
            FACT_VALUE_TYPE.STRING_LIST,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix:
            "required-fields",

          key:
            "required-form-fields",

          value: [
            "nombre",
            "email",
            "que_quiere_mejorar",
            "gestion_actual",
            "fecha_inicio",
            "acepta_privacidad",
          ],

          valueType:
            FACT_VALUE_TYPE.STRING_LIST,

          sources: [
            "source-portfolio-diagnostic",
          ],
        },

        {
          suffix:
            "never-prefill",

          key:
            "never-prefill-fields",

          value: [
            "acepta_privacidad",
          ],

          valueType:
            FACT_VALUE_TYPE.STRING_LIST,

          status:
            CLAIM_STATUS.USER_CONFIRMED,

          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix:
            "conversation-prefill",

          key:
            "conversation-prefill-enabled",

          value:
            true,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.PLANNED,

          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix:
            "automatic-submit",

          key:
            "automatic-submit",

          value:
            false,

          valueType:
            FACT_VALUE_TYPE.BOOLEAN,

          status:
            CLAIM_STATUS.PLANNED,

          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },

        {
          suffix:
            "summary-mode",

          key:
            "summary-generation",

          value:
            "rule-based-no-llm",

          valueType:
            FACT_VALUE_TYPE.STRING,

          status:
            CLAIM_STATUS.PLANNED,

          sources: [
            "source-user-confirmed-chatbot-design",
          ],
        },
      ],

      coverage: {
        level:
          COVERAGE_LEVEL.ANSWERABLE,

        canAnswerDirectly:
          true,

        canRecommend:
          true,

        canProvideEvidence:
          false,

        canNavigate:
          true,
      },

      answerPolicy: {
        directAnswer:
          true,

        mentionEvidence:
          ANSWER_EVIDENCE_MODE.NEVER,

        maxEvidenceItems:
          0,

        allowInference:
          false,

        allowRecommendation:
          true,

        preferredDepth:
          ANSWER_DEPTH.SHORT,

        forbiddenClaims: [
          "automatic-form-submit",
          "prefilled-consent",
          "invented-diagnostic-result",
          "guaranteed-feasibility",
          "guaranteed-result",
          "automatic-price",
        ],
      },

      limitations: [
        {
          type:
            LIMITATION_TYPE.SAFETY,

          claim:
            "El diagnóstico debe aplicar minimización de datos y no solicitar información sensible que no sea necesaria para entender el caso.",
        },

        {
          type:
            LIMITATION_TYPE.NO_INFERENCE,

          claim:
            "Los campos que el usuario no haya proporcionado no deben completarse mediante suposiciones.",
        },

        {
          type:
            LIMITATION_TYPE.QUALIFICATION,

          claim:
            "Completar un diagnóstico no implica aceptación del proyecto, viabilidad confirmada, precio ni resultado garantizado.",
        },
      ],

      metadata: {
        category:
          "diagnostic",
      },
    }),
  ]);


export const diagnosticKnowledgeById =
  Object.freeze(
    Object.fromEntries(
      diagnosticKnowledge.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


export function getDiagnosticById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    diagnosticKnowledgeById[
      id
    ] ?? null
  );
}


export function getDiagnosticFact(
  diagnostic,
  key,
) {
  if (
    !diagnostic ||
    !Array.isArray(
      diagnostic.facts,
    ) ||
    typeof key !== "string" ||
    !key.trim()
  ) {
    return null;
  }

  return (
    diagnostic.facts.find(
      (fact) =>
        fact.key === key,
    ) ?? null
  );
}