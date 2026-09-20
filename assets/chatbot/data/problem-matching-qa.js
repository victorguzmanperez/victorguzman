/* ============================================================
 * K9.3 — PROBLEM MATCHING QA
 *
 * Lenguaje real
 *   ↓
 * PROBLEM
 *   ↓
 * SOLUTION
 *   ↓
 * SERVICE / SOLUTION_ONLY
 *
 * No implementa matching.
 * Define expectativas de QA sobre el matcher y grafo existentes.
 * ============================================================
 */


/* ============================================================
 * SERVICE MODE
 * ============================================================
 */

export const PROBLEM_QA_SERVICE_MODE =
  Object.freeze({
    SERVICE:
      "service",

    SOLUTION_ONLY:
      "solution_only",
  });


/* ============================================================
 * FREEZE HELPERS
 * ============================================================
 */

function freezeFlow(
  flow,
) {
  return Object.freeze({
    ...flow,

    solutionIds:
      Object.freeze([
        ...flow.solutionIds,
      ]),

    serviceIds:
      Object.freeze([
        ...flow.serviceIds,
      ]),
  });
}


function freezeCase(
  item,
) {
  return Object.freeze({
    ...item,
  });
}


/* ============================================================
 * EXPECTED GRAPH FLOWS
 *
 * 17 Problems actuales.
 * ============================================================
 */

export const problemFlowExpectations =
  Object.freeze([

    freezeFlow({
      problemId:
        "problem-manual-data-consolidation",

      solutionIds: [
        "solution-data-consolidation-automation",
      ],

      serviceIds: [
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-multiple-excel-files",

      solutionIds: [
        "solution-data-consolidation-automation",
      ],

      serviceIds: [
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-repetitive-reporting",

      solutionIds: [
        "solution-reporting-dashboard-automation",
      ],

      serviceIds: [
        "service-business-intelligence-dashboards",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-manual-dashboard-refresh",

      solutionIds: [
        "solution-reporting-dashboard-automation",
      ],

      serviceIds: [
        "service-business-intelligence-dashboards",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-fragile-excel-model",

      solutionIds: [
        "solution-evaluation-scoring-model",
      ],

      serviceIds: [
        "service-excel-business-models",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    /*
     * SCORING RULES es especial:
     *
     * encaja en dos Solutions reales,
     * pero solo una dispone de Service explícito.
     */
    freezeFlow({
      problemId:
        "problem-scoring-rules",

      solutionIds: [
        "solution-evaluation-scoring-model",
        "solution-web-audit-scoring-automation",
      ],

      serviceIds: [
        "service-excel-business-models",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-complex-weighted-evaluation",

      solutionIds: [
        "solution-evaluation-scoring-model",
      ],

      serviceIds: [
        "service-excel-business-models",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-manual-pdf-extraction",

      solutionIds: [
        "solution-document-data-extraction",
      ],

      serviceIds: [
        "service-data-process-automation",
        "service-ai-process-analysis",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-unstructured-documents",

      solutionIds: [
        "solution-document-data-extraction",
      ],

      serviceIds: [
        "service-data-process-automation",
        "service-ai-process-analysis",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-data-quality",

      solutionIds: [
        "solution-data-quality-traceability",
      ],

      serviceIds: [
        "service-excel-business-models",
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-no-data-traceability",

      solutionIds: [
        "solution-data-quality-traceability",
      ],

      serviceIds: [
        "service-excel-business-models",
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    /*
     * No existe Service comercial explícito para
     * auditoría web. La Solution sí existe.
     */
    freezeFlow({
      problemId:
        "problem-web-data-collection",

      solutionIds: [
        "solution-web-audit-scoring-automation",
      ],

      serviceIds: [],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE
          .SOLUTION_ONLY,
    }),


    freezeFlow({
      problemId:
        "problem-web-scoring-audit",

      solutionIds: [
        "solution-web-audit-scoring-automation",
      ],

      serviceIds: [],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE
          .SOLUTION_ONLY,
    }),


    /*
     * También permanece Solution-only:
     * análisis de datos ≠ asesoramiento financiero
     * ni Service comercial inventado.
     */
    freezeFlow({
      problemId:
        "problem-financial-analysis",

      solutionIds: [
        "solution-financial-analysis-monitoring",
      ],

      serviceIds: [],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE
          .SOLUTION_ONLY,
    }),


    freezeFlow({
      problemId:
        "problem-ai-process-opportunity",

      solutionIds: [
        "solution-ai-opportunity-assessment",
      ],

      serviceIds: [
        "service-ai-process-analysis",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-repetitive-copy-paste",

      solutionIds: [
        "solution-data-consolidation-automation",
      ],

      serviceIds: [
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),


    freezeFlow({
      problemId:
        "problem-manual-data-transformation",

      solutionIds: [
        "solution-data-consolidation-automation",
      ],

      serviceIds: [
        "service-data-process-automation",
      ],

      serviceMode:
        PROBLEM_QA_SERVICE_MODE.SERVICE,
    }),
  ]);


/* ============================================================
 * FLOW INDEX
 * ============================================================
 */

export const problemFlowByProblemId =
  Object.freeze(
    Object.fromEntries(
      problemFlowExpectations.map(
        (flow) => [
          flow.problemId,
          flow,
        ],
      ),
    ),
  );


/* ============================================================
 * QA CASE BUILDER
 * ============================================================
 */

function qaCase(
  id,
  input,
  expectedProblemId,
) {
  return freezeCase({
    id,
    input,
    expectedProblemId,
  });
}


/* ============================================================
 * 51 REAL-LANGUAGE CASES
 *
 * Tres expresiones por cada uno de los 17 Problems.
 * Las frases contienen señales fuertes ya autorizadas
 * por problems.js, pero expresadas como mensajes naturales.
 * ============================================================
 */

export const problemMatchingQaCases =
  Object.freeze([

    /* --------------------------------------------------------
     * 01 — MANUAL DATA CONSOLIDATION
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-001",
      "Tengo que consolidar datos manualmente antes de preparar el informe.",
      "problem-manual-data-consolidation",
    ),

    qaCase(
      "pmq-002",
      "Cada semana tengo que unir datos a mano de varias fuentes.",
      "problem-manual-data-consolidation",
    ),

    qaCase(
      "pmq-003",
      "Tengo que juntar información manualmente para poder analizarla.",
      "problem-manual-data-consolidation",
    ),


    /* --------------------------------------------------------
     * 02 — MULTIPLE EXCEL
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-004",
      "Tengo muchos Excel y cada vez es más difícil mantenerlos.",
      "problem-multiple-excel-files",
    ),

    qaCase(
      "pmq-005",
      "Trabajo con muchos archivos Excel para hacer el mismo proceso.",
      "problem-multiple-excel-files",
    ),

    qaCase(
      "pmq-006",
      "Tenemos varios Excel y queremos simplificar el proceso.",
      "problem-multiple-excel-files",
    ),


    /* --------------------------------------------------------
     * 03 — REPETITIVE REPORTING
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-007",
      "Todos los meses preparo informes repetitivos.",
      "problem-repetitive-reporting",
    ),

    qaCase(
      "pmq-008",
      "Nuestro reporting manual nos consume demasiado tiempo.",
      "problem-repetitive-reporting",
    ),

    qaCase(
      "pmq-009",
      "Tengo que rehacer informes cada semana.",
      "problem-repetitive-reporting",
    ),


    /* --------------------------------------------------------
     * 04 — MANUAL DASHBOARD REFRESH
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-010",
      "Tengo que actualizar dashboard manualmente cada lunes.",
      "problem-manual-dashboard-refresh",
    ),

    qaCase(
      "pmq-011",
      "Tengo que actualizar Power BI a mano antes de cada reunión.",
      "problem-manual-dashboard-refresh",
    ),

    qaCase(
      "pmq-012",
      "El proceso sigue dependiendo de un refresh manual.",
      "problem-manual-dashboard-refresh",
    ),


    /* --------------------------------------------------------
     * 05 — FRAGILE EXCEL
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-013",
      "Tengo un Excel complejo con muchas reglas.",
      "problem-fragile-excel-model",
    ),

    qaCase(
      "pmq-014",
      "Nuestro Excel frágil se rompe cuando cambiamos los datos.",
      "problem-fragile-excel-model",
    ),

    qaCase(
      "pmq-015",
      "Tenemos un Excel difícil de mantener y de validar.",
      "problem-fragile-excel-model",
    ),


    /* --------------------------------------------------------
     * 06 — SCORING RULES
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-016",
      "Necesito convertir unas reglas de scoring en un modelo reproducible.",
      "problem-scoring-rules",
    ),

    qaCase(
      "pmq-017",
      "Ahora hacemos la puntuación manual y queremos automatizarla.",
      "problem-scoring-rules",
    ),

    qaCase(
      "pmq-018",
      "Tenemos muchos criterios de evaluación que aplicar siempre igual.",
      "problem-scoring-rules",
    ),


    /* --------------------------------------------------------
     * 07 — WEIGHTED EVALUATION
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-019",
      "Tengo una evaluación con pesos y varios niveles.",
      "problem-complex-weighted-evaluation",
    ),

    qaCase(
      "pmq-020",
      "Necesito construir un modelo jerárquico para calcular la nota final.",
      "problem-complex-weighted-evaluation",
    ),

    qaCase(
      "pmq-021",
      "Tenemos criterios ponderados y subcompetencias.",
      "problem-complex-weighted-evaluation",
    ),


    /* --------------------------------------------------------
     * 08 — PDF EXTRACTION
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-022",
      "Necesito extraer datos de PDF automáticamente.",
      "problem-manual-pdf-extraction",
    ),

    qaCase(
      "pmq-023",
      "Tenemos que leer facturas PDF una a una.",
      "problem-manual-pdf-extraction",
    ),

    qaCase(
      "pmq-024",
      "Ahora hacemos copiar datos de facturas manualmente.",
      "problem-manual-pdf-extraction",
    ),


    /* --------------------------------------------------------
     * 09 — UNSTRUCTURED DOCUMENTS
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-025",
      "Tenemos muchos documentos no estructurados que revisar.",
      "problem-unstructured-documents",
    ),

    qaCase(
      "pmq-026",
      "Recibimos muchos documentos diferentes y cuesta encontrar la información.",
      "problem-unstructured-documents",
    ),

    qaCase(
      "pmq-027",
      "Necesitamos analizar documentos con formatos distintos.",
      "problem-unstructured-documents",
    ),


    /* --------------------------------------------------------
     * 10 — DATA QUALITY
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-028",
      "Tenemos datos incorrectos y no confiamos en el resultado.",
      "problem-data-quality",
    ),

    qaCase(
      "pmq-029",
      "Hay datos inconsistentes entre varios ficheros.",
      "problem-data-quality",
    ),

    qaCase(
      "pmq-030",
      "Estamos teniendo problemas de calidad en los datos.",
      "problem-data-quality",
    ),


    /* --------------------------------------------------------
     * 11 — TRACEABILITY
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-031",
      "Tenemos resultados sin trazabilidad.",
      "problem-no-data-traceability",
    ),

    qaCase(
      "pmq-032",
      "No sé de dónde salen los datos del informe.",
      "problem-no-data-traceability",
    ),

    qaCase(
      "pmq-033",
      "No sabemos cómo se calcula el indicador final.",
      "problem-no-data-traceability",
    ),


    /* --------------------------------------------------------
     * 12 — WEB DATA COLLECTION
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-034",
      "Necesito recoger datos de webs de forma automática.",
      "problem-web-data-collection",
    ),

    qaCase(
      "pmq-035",
      "Quiero hacer scraping de información pública.",
      "problem-web-data-collection",
    ),

    qaCase(
      "pmq-036",
      "Tenemos que revisar cientos de webs para recopilar información.",
      "problem-web-data-collection",
    ),


    /* --------------------------------------------------------
     * 13 — WEB SCORING
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-037",
      "Necesito auditar webs de muchas empresas.",
      "problem-web-scoring-audit",
    ),

    qaCase(
      "pmq-038",
      "Queremos puntuar webs aplicando siempre los mismos criterios.",
      "problem-web-scoring-audit",
    ),

    qaCase(
      "pmq-039",
      "Necesitamos evaluar paginas web y obtener un scoring comparable.",
      "problem-web-scoring-audit",
    ),


    /* --------------------------------------------------------
     * 14 — FINANCIAL ANALYSIS
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-040",
      "Quiero analizar inversiones utilizando datos.",
      "problem-financial-analysis",
    ),

    qaCase(
      "pmq-041",
      "Necesito hacer un análisis financiero para seguimiento.",
      "problem-financial-analysis",
    ),

    qaCase(
      "pmq-042",
      "Quiero analizar dividendos y comparar activos.",
      "problem-financial-analysis",
    ),


    /* --------------------------------------------------------
     * 15 — AI OPPORTUNITY
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-043",
      "Quiero usar IA pero no sé en qué proceso tiene sentido.",
      "problem-ai-process-opportunity",
    ),

    qaCase(
      "pmq-044",
      "Queremos incorporar inteligencia artificial pero no sabemos por dónde empezar.",
      "problem-ai-process-opportunity",
    ),

    qaCase(
      "pmq-045",
      "Necesito saber dónde aplicar IA en la empresa.",
      "problem-ai-process-opportunity",
    ),


    /* --------------------------------------------------------
     * 16 — COPY / PASTE
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-046",
      "Paso buena parte del día en copiar y pegar entre herramientas.",
      "problem-repetitive-copy-paste",
    ),

    qaCase(
      "pmq-047",
      "Nuestro proceso es básicamente copy paste entre aplicaciones.",
      "problem-repetitive-copy-paste",
    ),

    qaCase(
      "pmq-048",
      "Copio datos todos los días de un fichero a otro.",
      "problem-repetitive-copy-paste",
    ),


    /* --------------------------------------------------------
     * 17 — MANUAL DATA TRANSFORMATION
     * --------------------------------------------------------
     */

    qaCase(
      "pmq-049",
      "Tengo que limpiar datos a mano antes del análisis.",
      "problem-manual-data-transformation",
    ),

    qaCase(
      "pmq-050",
      "Necesito transformar datos manualmente todas las semanas.",
      "problem-manual-data-transformation",
    ),

    qaCase(
      "pmq-051",
      "Tenemos que preparar datos manualmente antes de cargar el informe.",
      "problem-manual-data-transformation",
    ),
  ]);


/* ============================================================
 * CASE INDEX
 * ============================================================
 */

export const problemMatchingQaById =
  Object.freeze(
    Object.fromEntries(
      problemMatchingQaCases.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ),
  );


/* ============================================================
 * SAFE GETTERS
 * ============================================================
 */

export function getProblemFlowExpectation(
  problemId,
) {
  if (
    typeof problemId !==
      "string" ||
    !problemId.trim()
  ) {
    return null;
  }

  return (
    problemFlowByProblemId[
      problemId
    ] ?? null
  );
}


export function getProblemMatchingQaById(
  id,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    return null;
  }

  return (
    problemMatchingQaById[
      id
    ] ?? null
  );
}