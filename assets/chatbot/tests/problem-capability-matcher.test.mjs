import test from "node:test";
import assert from "node:assert/strict";

import {
  getCapabilitiesForProblem,
  getProblemsForCapability,
  matchProblemCapabilities,
  matchProblemsByText,
  normalizeMatcherText,
} from "../data/knowledge/problem-matcher.js";


test(
  "matcher normalization removes accents and punctuation",
  () => {
    assert.equal(
      normalizeMatcherText(
        "¡Tengo varios Excel y actualización manual!",
      ),
      "tengo varios excel y actualizacion manual",
    );
  },
);


test(
  "manual data consolidation resolves capabilities",
  () => {
    const capabilities =
      getCapabilitiesForProblem(
        "problem-manual-data-consolidation",
      );

    const ids =
      capabilities.map(
        (item) => item.id,
      );

    assert.ok(
      ids.includes(
        "capability-data-consolidation",
      ),
    );

    assert.ok(
      ids.includes(
        "capability-process-automation",
      ),
    );
  },
);


test(
  "unknown problem resolves no capabilities",
  () => {
    assert.deepEqual(
      getCapabilitiesForProblem(
        "problem-does-not-exist",
      ),
      [],
    );
  },
);


test(
  "capability can resolve related problems",
  () => {
    const problems =
      getProblemsForCapability(
        "capability-data-consolidation",
      );

    const ids =
      problems.map(
        (problem) => problem.id,
      );

    assert.ok(
      ids.includes(
        "problem-manual-data-consolidation",
      ),
    );

    assert.ok(
      ids.includes(
        "problem-multiple-excel-files",
      ),
    );
  },
);


test(
  "twenty Excel manually consolidated matches manual consolidation",
  () => {
    const results =
      matchProblemsByText(
        "Tengo muchos Excel y tengo que consolidar los datos manualmente",
      );

    assert.ok(
      results.length > 0,
    );

    assert.equal(
      results[0].problemId,
      "problem-manual-data-consolidation",
    );
  },
);


test(
  "manual Power BI refresh matches dashboard refresh",
  () => {
    const results =
      matchProblemsByText(
        "Todos los lunes tengo que actualizar Power BI a mano",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-manual-dashboard-refresh",
      ),
    );
  },
);


test(
  "PDF invoice extraction matches PDF problem",
  () => {
    const results =
      matchProblemsByText(
        "Tenemos facturas en PDF y queremos extraer campos",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-manual-pdf-extraction",
      ),
    );
  },
);


test(
  "weighted criteria match weighted evaluation",
  () => {
    const results =
      matchProblemsByText(
        "Tengo categorías, subcompetencias, indicadores y pesos",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-complex-weighted-evaluation",
      ),
    );
  },
);


test(
  "web scoring query matches web audit problem",
  () => {
    const results =
      matchProblemsByText(
        "Necesito auditar cientos de webs y calcular un scoring",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-web-scoring-audit",
      ),
    );
  },
);


test(
  "generic AI request matches AI opportunity",
  () => {
    const results =
      matchProblemsByText(
        "Quiero incorporar inteligencia artificial pero no sé por dónde empezar",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-ai-process-opportunity",
      ),
    );
  },
);


test(
  "financial dividend query matches financial analysis",
  () => {
    const results =
      matchProblemsByText(
        "Quiero analizar dividendos, riesgo y valoración",
      );

    assert.ok(
      results.some(
        (result) =>
          result.problemId ===
          "problem-financial-analysis",
      ),
    );
  },
);


test(
  "irrelevant game request produces no useful match",
  () => {
    const results =
      matchProblemsByText(
        "Quiero crear un videojuego 3D multijugador con dragones",
      );

    assert.deepEqual(
      results,
      [],
    );
  },
);


test(
  "match result exposes capability ids",
  () => {
    const result =
      matchProblemsByText(
        "Tengo que extraer datos de PDF",
      )[0];

    assert.ok(
      Array.isArray(
        result.capabilityIds,
      ),
    );

    assert.ok(
      result.capabilityIds.length >
        0,
    );
  },
);


test(
  "enriched matcher returns capability objects",
  () => {
    const result =
      matchProblemCapabilities(
        "Tengo que extraer datos de PDF",
      )[0];

    assert.ok(result);

    assert.ok(
      Array.isArray(
        result.capabilities,
      ),
    );

    assert.ok(
      result.capabilities.some(
        (capability) =>
          capability.id ===
          "capability-document-data-extraction",
      ),
    );
  },
);


test(
  "matcher respects limit",
  () => {
    const results =
      matchProblemsByText(
        "excel datos manual reporting automatizar reglas calidad",
        {
          limit: 2,
        },
      );

    assert.ok(
      results.length <= 2,
    );
  },
);


test(
  "matcher handles empty input safely",
  () => {
    assert.deepEqual(
      matchProblemsByText(""),
      [],
    );

    assert.deepEqual(
      matchProblemsByText(null),
      [],
    );
  },
);