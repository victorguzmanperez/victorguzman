import test from "node:test";
import assert from "node:assert/strict";

import {
  RESPONSE_ACTION_TYPE,
  RESPONSE_EVIDENCE_MODE,
  RESPONSE_KIND,
  RESPONSE_OUTCOME,
  isValidResponseEnvelope,
} from "../core/response-contract.js";

import {
  PROBLEM_FLOW_MODE,
  PROBLEM_FLOW_TARGET,
  composeProblemSolutionServiceNaturalText,
  composeProblemSolutionServiceResponse,
  resolveProblemSolutionServiceFlow,
} from "../core/problem-solution-service-response-composer.js";


/* ============================================================
 * FLOW RESOLUTION
 * ============================================================
 */

test(
  "manual data consolidation resolves canonical Problem",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo que consolidar datos manualmente antes de preparar el informe.",
      });


    assert.ok(flow);

    assert.equal(
      flow.problem.id,
      "problem-manual-data-consolidation",
    );
  },
);


test(
  "manual data consolidation resolves canonical Solution",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo que consolidar datos manualmente antes de preparar el informe.",
      });


    assert.ok(
      flow.solutions.some(
        (solution) =>
          solution.id ===
          "solution-data-consolidation-automation",
      ),
    );
  },
);


test(
  "manual data consolidation resolves explicit automation Service",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo que consolidar datos manualmente antes de preparar el informe.",
      });


    assert.ok(
      flow.services.some(
        (service) =>
          service.id ===
          "service-data-process-automation",
      ),
    );

    assert.equal(
      flow.mode,
      PROBLEM_FLOW_MODE
        .SERVICE,
    );
  },
);


test(
  "multiple Excel files resolve automation flow",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      flow.problem.id,
      "problem-multiple-excel-files",
    );

    assert.ok(
      flow.services.some(
        (service) =>
          service.id ===
          "service-data-process-automation",
      ),
    );
  },
);


test(
  "repetitive reporting resolves BI Service",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Nuestro reporting manual nos consume demasiado tiempo.",
      });


    assert.ok(
      flow.solutions.some(
        (solution) =>
          solution.id ===
          "solution-reporting-dashboard-automation",
      ),
    );

    assert.ok(
      flow.services.some(
        (service) =>
          service.id ===
          "service-business-intelligence-dashboards",
      ),
    );
  },
);


test(
  "PDF extraction can resolve two explicit Services",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Necesito extraer datos de PDF automáticamente.",
      });


    const serviceIds =
      flow.services.map(
        (service) =>
          service.id,
      );


    assert.ok(
      serviceIds.includes(
        "service-data-process-automation",
      ),
    );

    assert.ok(
      serviceIds.includes(
        "service-ai-process-analysis",
      ),
    );
  },
);


test(
  "data quality may resolve Excel and automation Services",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Estamos teniendo problemas de calidad en los datos.",
      });


    const serviceIds =
      flow.services.map(
        (service) =>
          service.id,
      );


    assert.ok(
      serviceIds.includes(
        "service-excel-business-models",
      ),
    );

    assert.ok(
      serviceIds.includes(
        "service-data-process-automation",
      ),
    );
  },
);


test(
  "AI opportunity resolves explicit AI analysis Service",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Quiero usar IA pero no sé en qué proceso tiene sentido.",
      });


    assert.ok(
      flow.services.some(
        (service) =>
          service.id ===
          "service-ai-process-analysis",
      ),
    );
  },
);


/* ============================================================
 * SOLUTION ONLY
 * ============================================================
 */

test(
  "web audit remains Solution-only",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Necesito auditar webs de muchas empresas.",
      });


    assert.ok(flow);

    assert.equal(
      flow.mode,
      PROBLEM_FLOW_MODE
        .SOLUTION_ONLY,
    );

    assert.ok(
      flow.solutions.some(
        (solution) =>
          solution.id ===
          "solution-web-audit-scoring-automation",
      ),
    );

    assert.equal(
      flow.services.length,
      0,
    );
  },
);


test(
  "financial analysis remains Solution-only",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Quiero analizar dividendos y comparar activos.",
      });


    assert.equal(
      flow.mode,
      PROBLEM_FLOW_MODE
        .SOLUTION_ONLY,
    );

    assert.ok(
      flow.solutions.some(
        (solution) =>
          solution.id ===
          "solution-financial-analysis-monitoring",
      ),
    );

    assert.equal(
      flow.services.length,
      0,
    );
  },
);


/* ============================================================
 * MULTI SOLUTION
 * ============================================================
 */

test(
  "scoring rules may resolve several Solutions without inventing Services",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Necesito convertir unas reglas de scoring en un modelo reproducible.",
      });


    const solutionIds =
      flow.solutions.map(
        (solution) =>
          solution.id,
      );


    const serviceIds =
      flow.services.map(
        (service) =>
          service.id,
      );


    assert.ok(
      solutionIds.includes(
        "solution-evaluation-scoring-model",
      ),
    );

    assert.ok(
      solutionIds.includes(
        "solution-web-audit-scoring-automation",
      ),
    );

    assert.ok(
      serviceIds.includes(
        "service-excel-business-models",
      ),
    );

    assert.equal(
      serviceIds.includes(
        "service-data-process-automation",
      ),
      false,
    );
  },
);


/* ============================================================
 * PROJECT EVIDENCE
 * ============================================================
 */

test(
  "automation flow may expose explicit project examples",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo que consolidar datos manualmente antes de preparar el informe.",
      });


    assert.ok(
      flow.projectExamples.some(
        (project) =>
          project.id ===
          "project-business-cost-intelligence",
      ),
    );
  },
);


test(
  "Solution-only flow does not invent project evidence through a Service",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Quiero analizar dividendos y comparar activos.",
      });


    assert.equal(
      flow.services.length,
      0,
    );

    assert.equal(
      flow.projectExamples.length,
      0,
    );
  },
);


/* ============================================================
 * DEFENSIVE FLOW
 * ============================================================
 */

test(
  "unsupported problem returns null",
  () => {
    assert.equal(
      resolveProblemSolutionServiceFlow({
        userText:
          "¿Cuál es la capital de Francia?",
      }),
      null,
    );
  },
);


test(
  "empty problem text returns null",
  () => {
    assert.equal(
      resolveProblemSolutionServiceFlow({
        userText:
          "   ",
      }),
      null,
    );
  },
);


/* ============================================================
 * NATURAL LANGUAGE
 * ============================================================
 */

test(
  "service flow creates natural explanation",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    const text =
      composeProblemSolutionServiceNaturalText(
        flow,
      );


    assert.match(
      text,
      /quitar trabajo manual|juntar.*datos|preparen de forma repetible/i,
    );

    assert.doesNotMatch(
      text,
      /una línea de solución|este tipo de necesidad se relaciona/i,
    );
  },
);

test(
  "project evidence uses cautious partial-similarity wording",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Hola, tenemos varios Excel de distintas delegaciones y cada semana perdemos mucho tiempo uniéndolos.",
      });


    const text =
      composeProblemSolutionServiceNaturalText(
        flow,
      );


    assert.match(
      text,
      /Hay un proyecto del portfolio que comparte parte de este problema: Business Cost Intelligence\./i,
    );

    assert.doesNotMatch(
      text,
      /bastante cercano|problemas parecidos/i,
    );
  },
);

test(
  "Solution-only language avoids inventing or advertising a Service",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Necesito auditar webs de muchas empresas.",
      });


    const text =
      composeProblemSolutionServiceNaturalText(
        flow,
      );


    assert.doesNotMatch(
      text,
      /servicio\s+[A-ZÁÉÍÓÚÑ]/,
    );

    assert.match(
      text,
      /proceso repetible|recogida estructurada/i,
    );
  },
);


test(
  "visible response never exposes internal Knowledge ids",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      /problem-|solution-|service-|project-/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


test(
  "visible response never guarantees viability",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Necesito extraer datos de PDF automáticamente.",
      });


    assert.equal(
      /está garantizado|esta garantizado|seguro que funciona|garantizamos|es viable seguro/i
        .test(
          response.messages[0]
            .text,
        ),
      false,
    );
  },
);


/* ============================================================
 * RESPONSE CONTRACT
 * ============================================================
 */

test(
  "Problem flow creates valid Response Envelope",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      isValidResponseEnvelope(
        response,
      ),
      true,
    );
  },
);


test(
  "Problem flow uses DISCOVERY response kind",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Todos los meses preparo informes repetitivos.",
      });


    assert.equal(
      response.kind,
      RESPONSE_KIND.DISCOVERY,
    );
  },
);


test(
  "Problem flow remains qualified",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Todos los meses preparo informes repetitivos.",
      });


    assert.equal(
      response.outcome,
      RESPONSE_OUTCOME
        .QUALIFIED,
    );
  },
);


test(
  "Problem flow requires Knowledge evidence",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      response.evidence.mode,
      RESPONSE_EVIDENCE_MODE
        .REQUIRED,
    );

    assert.ok(
      response.evidence
        .knowledgeIds.length >
        0,
    );
  },
);


/* ============================================================
 * DIAGNOSTIC ACTION
 * ============================================================
 */

test(
  "service flow proposes diagnostic",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      response.actions.length,
      1,
    );

    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.equal(
      response.actions[0]
        .target,
      PROBLEM_FLOW_TARGET
        .DIAGNOSTIC,
    );
  },
);


test(
  "Solution-only flow may still propose diagnostic without inventing Service",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Quiero analizar dividendos y comparar activos.",
      });


    assert.equal(
      response.actions[0].type,
      RESPONSE_ACTION_TYPE
        .START_DIAGNOSTIC,
    );

    assert.equal(
      response.trace
        .serviceIds.length,
      0,
    );
  },
);


/* ============================================================
 * TRACEABILITY
 * ============================================================
 */

test(
  "trace preserves matched Problem",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.equal(
      response.trace.problemId,
      "problem-multiple-excel-files",
    );
  },
);


test(
  "trace preserves canonical Solutions",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.ok(
      response.trace
        .solutionIds
        .includes(
          "solution-data-consolidation-automation",
        ),
    );
  },
);


test(
  "trace preserves only explicit Services",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Necesito auditar webs de muchas empresas.",
      });


    assert.deepEqual(
      response.trace
        .serviceIds,
      [],
    );
  },
);


test(
  "FAQ and Answer QA trace may be preserved",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",

        faqId:
          "faq-problem-test",

        answerQaId:
          "answer-qa-problem-test",
      });


    assert.equal(
      response.trace.faqId,
      "faq-problem-test",
    );

    assert.equal(
      response.trace.answerQaId,
      "answer-qa-problem-test",
    );
  },
);


/* ============================================================
 * SAFETY
 * ============================================================
 */

test(
  "Problem flow never enables inference",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Necesito extraer datos de PDF automáticamente.",
      });


    assert.equal(
      response.safety
        .allowInference,
      false,
    );
  },
);


test(
  "Problem flow always requires qualification",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Necesito extraer datos de PDF automáticamente.",
      });


    assert.equal(
      response.safety
        .mustQualify,
      true,
    );
  },
);


test(
  "Solution and Service forbidden claims propagate",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      });


    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "guaranteed-feasibility",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-service-fit",
        ),
    );

    assert.ok(
      response.safety
        .forbiddenClaims
        .includes(
          "automatic-price",
        ),
    );
  },
);


/* ============================================================
 * CONTEXT / PERSONALIZATION
 * ============================================================
 */

test(
  "continuing Problem flow remains continuing",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tenemos varios Excel y queremos simplificar el proceso.",

        context: {
          continuing:
            true,
        },
      });


    assert.equal(
      response.conversation
        .continuity,
      "continuing",
    );
  },
);


test(
  "Problem response never interrupts to request visitor name",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tenemos varios Excel y queremos simplificar el proceso.",
      });


    assert.equal(
      response.personalization
        .mayAskName,
      false,
    );

    assert.equal(
      response.personalization
        .usedName,
      false,
    );
  },
);


/* ============================================================
 * SERIALIZATION
 * ============================================================
 */

test(
  "Problem flow response remains JSON serializable",
  () => {
    const response =
      composeProblemSolutionServiceResponse({
        userText:
          "Tenemos varios Excel y queremos simplificar el proceso.",
      });


    assert.doesNotThrow(
      () =>
        JSON.stringify(
          response,
        ),
    );
  },
);


test(
  "unsupported Problem cannot fabricate Response Envelope",
  () => {
    assert.equal(
      composeProblemSolutionServiceResponse({
        userText:
          "¿Quién ganó el último mundial de fútbol?",
      }),
      null,
    );
  },
);
test(
  "financial analysis response uses natural Spanish grammar",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Quiero analizar dividendos y comparar activos.",
      });


    const text =
      composeProblemSolutionServiceNaturalText(
        flow,
      );


    assert.match(
      text,
      /datos y seguimiento|propio análisis/i,
    );

    assert.doesNotMatch(
      text,
      /la análisis|asesoramiento financiero personalizado/i,
    );
  },
);


test(
  "Solution-only response avoids repetitive qualification wording",
  () => {
    const flow =
      resolveProblemSolutionServiceFlow({
        userText:
          "Necesito auditar webs de muchas empresas.",
      });


    const text =
      composeProblemSolutionServiceNaturalText(
        flow,
      );


    const qualificationCount =
      (
        text.match(
          /habría que/gi,
        ) ?? []
      ).length;


    assert.equal(
      qualificationCount,
      0,
    );
  },
);