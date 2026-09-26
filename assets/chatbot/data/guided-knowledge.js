/**
 * CONV-G1 — Lightweight public view of approved Knowledge.
 *
 * This file intentionally contains only the public summaries/ids needed by
 * the guided graph. The full Knowledge remains the source of truth and is
 * covered by alignment tests. Keeping this view small avoids loading the
 * complete NLU/Knowledge corpus just to render click options.
 */

export const guidedKnowledge = Object.freeze({
  "profile": "Víctor lleva más de 20 años trabajando en tecnología, principalmente en el sector financiero. Su trayectoria empezó en desarrollo COBOL y ha evolucionado hacia datos, Business Intelligence, automatización e inteligencia artificial aplicada.",
  "assistant": {
    "id": "capability-deterministic-conversational-systems",
    "title": "Asistentes guiados y flujos conversacionales",
    "shortDescription": "Experiencia aplicada diseñando e implementando asistentes guiados deterministas mediante grafos de conversación, opciones predefinidas, multiselección, estado estructurado, navegación y handoff a formularios o acciones, sin depender de un LLM en tiempo de ejecución.",
    "about": "Claro. Funciona mediante un recorrido guiado: tú eliges entre distintas opciones y el asistente va teniendo en cuenta lo que seleccionas para ofrecerte el siguiente paso. Así puede ayudarte a explorar una necesidad, enseñarte información relevante o llevarte al diagnóstico y al contacto con Víctor.",
    "llm": "En esta conversación, no. El asistente no genera respuestas con un LLM: sigue recorridos y respuestas preparados de antemano. La experiencia de Víctor con inteligencia artificial es otro tema y puedes verla por separado.",
    "agent": "No. Este asistente no toma decisiones ni actúa por su cuenta. Te guía mediante opciones y respuestas preparadas para ayudarte a encontrar la información que necesitas.",
    "capabilities": "Aquí puedes conocer mejor a Víctor, descubrir proyectos y recursos, explorar una necesidad paso a paso y preparar la información necesaria antes de contactar con él. Si recorres una necesidad, el asistente conserva tus selecciones para resumir el caso y facilitar el diagnóstico.",
  },
  "currentExperience": "Responsabilidad actual centrada en datos, Business Intelligence, automatización y evolución hacia IA aplicada dentro del área de Control de Mercados Financieros.",
  "firstExperience": "Inicio profesional en desarrollo bancario COBOL dentro de una Software Factory, con fuerte orientación a testing, calidad y componentes reutilizables.",
  "technologies": {
    "technology-power-bi": {
      "title": "Power BI",
      "shortDescription": "Tecnología de uso profesional actual, aplicada también en proyectos de portfolio, formación específica y publicaciones en DataVerso.",
      "current": true
    },
    "technology-excel": {
      "title": "Excel",
      "shortDescription": "Herramienta de uso profesional actual y aplicada en modelado, análisis, automatización y proyectos avanzados de evaluación.",
      "current": true
    },
    "technology-power-query": {
      "title": "Power Query",
      "shortDescription": "Uso actual y aplicado en transformación de datos, proyectos de portfolio y contenidos publicados en DataVerso.",
      "current": true
    },
    "technology-python": {
      "title": "Python",
      "shortDescription": "Python cuenta con formación formal, aplicación práctica en varios proyectos de portfolio y uso/evolución reciente en el contexto profesional actual.",
      "current": true
    },
    "technology-sql": {
      "title": "SQL",
      "shortDescription": "SQL está respaldado por trabajo con bases de datos y formación específica en SQL Server y lenguaje SQL.",
      "current": true
    },
    "technology-oracle": {
      "title": "Oracle",
      "shortDescription": "Oracle aparece tanto en experiencias históricas de migración bancaria como en el contexto profesional actual de explotación de datos.",
      "current": true
    },
    "technology-cobol": {
      "title": "COBOL",
      "shortDescription": "Experiencia profesional histórica muy sólida en COBOL dentro de sistemas bancarios, procesos batch, online, migraciones y producción.",
      "current": false
    },
    "technology-ai": {
      "title": "Inteligencia Artificial",
      "shortDescription": "IA respaldada por formación formal, proyectos aplicados y evolución profesional actual; no se presenta como investigación académica ni décadas de experiencia.",
      "current": true
    },
    "technology-copilot": {
      "title": "Microsoft Copilot",
      "shortDescription": "Uso y aprendizaje aplicado actual de Copilot en contexto profesional.",
      "current": true
    },
    "technology-power-automate": {
      "title": "Power Automate",
      "shortDescription": "Área actual de aprendizaje y aplicación dentro del ecosistema Microsoft, todavía reciente frente a tecnologías más consolidadas.",
      "current": true
    },
    "technology-qlik": {
      "title": "Qlik",
      "shortDescription": "No existe actualmente experiencia profesional ni formación confirmada en QlikView, Qlik Sense o NPrinting.",
      "current": false
    }
  },
  "projects": [
    {
      "id": "project-business-cost-intelligence",
      "title": "Business Cost Intelligence",
      "shortDescription": "Automatización de extracción, transformación y análisis de información económica contenida en documentos, conectándola con Power BI para mejorar visibilidad, trazabilidad y análisis de costes.",
      "technologies": [
        "technology-python",
        "technology-pandas",
        "technology-power-bi",
        "technology-power-query",
        "technology-dax"
      ],
      "problems": [
        "problem-manual-pdf-extraction",
        "problem-unstructured-documents",
        "problem-manual-data-consolidation",
        "problem-manual-data-transformation",
        "problem-repetitive-reporting"
      ]
    },
    {
      "id": "project-auditoria-digital-cv",
      "title": "Auditoría Digital Automatizada",
      "shortDescription": "Proyecto de recopilación automatizada de información pública web, evaluación mediante indicadores y scoring, análisis geográfico y visualización para estudiar madurez digital.",
      "technologies": [
        "technology-python",
        "technology-power-bi",
        "technology-power-query",
        "technology-dax",
        "technology-ai"
      ],
      "problems": [
        "problem-web-data-collection",
        "problem-web-scoring-audit",
        "problem-scoring-rules"
      ]
    },
    {
      "id": "project-investment-dashboard-ai",
      "title": "Investment Dashboard con IA",
      "shortDescription": "Plataforma en desarrollo para recopilar y analizar información de inversión, dividendos, riesgo, valoración, noticias y señales cuantitativas mediante Python, Power BI e IA.",
      "technologies": [
        "technology-python",
        "technology-pandas",
        "technology-power-bi",
        "technology-ai"
      ],
      "problems": [
        "problem-financial-analysis"
      ]
    },
    {
      "id": "project-digital-competency-evaluation",
      "title": "Modelo de Evaluación de Competencias Digitales",
      "shortDescription": "Modelo avanzado en Excel y Power Query para representar jerarquías, reglas de negocio, ponderaciones, scoring, testing, validación y documentación de un sistema de evaluación.",
      "technologies": [
        "technology-excel",
        "technology-power-query"
      ],
      "problems": [
        "problem-fragile-excel-model",
        "problem-scoring-rules",
        "problem-complex-weighted-evaluation",
        "problem-data-quality",
        "problem-no-data-traceability"
      ]
    }
  ],
  "services": [
    {
      "id": "service-business-intelligence-dashboards",
      "title": "Dashboards y Business Intelligence",
      "shortDescription": "Diseño de cuadros de mando orientados a negocio, con KPIs útiles, modelos semánticos sólidos, transformación de datos y una experiencia visual que facilite el análisis y la toma de decisiones.",
      "definition": "Diseño de cuadros de mando orientados a negocio, con KPIs útiles, modelos semánticos sólidos, transformación de datos y una experiencia visual que facilite el análisis y la toma de decisiones."
    },
    {
      "id": "service-excel-business-models",
      "title": "Excel avanzado y modelos de negocio",
      "shortDescription": "Construcción de herramientas de evaluación y análisis en Excel mediante modelos estructurados, reglas de cálculo, automatización, controles, testing y documentación.",
      "definition": "Construcción de herramientas de evaluación y análisis en Excel mediante modelos estructurados, reglas de cálculo, automatización, controles, testing y documentación."
    },
    {
      "id": "service-data-process-automation",
      "title": "Automatización de procesos y datos",
      "shortDescription": "Transformación de tareas manuales y repetitivas en procesos estructurados mediante automatización, transformación, validación, tratamiento de archivos e integración de datos.",
      "definition": "Transformación de tareas manuales y repetitivas en procesos estructurados mediante automatización, transformación, validación, tratamiento de archivos e integración de datos."
    },
    {
      "id": "service-ai-process-analysis",
      "title": "IA aplicada a procesos y análisis",
      "shortDescription": "Aplicación de inteligencia artificial como apoyo para analizar información, extraer o clasificar datos, documentar procesos y plantear soluciones que ayuden a trabajar y decidir mejor.",
      "definition": "Aplicación de inteligencia artificial como apoyo para analizar información, extraer o clasificar datos, documentar procesos y plantear soluciones que ayuden a trabajar y decidir mejor."
    }
  ],
  "solutions": [
    {
      "id": "solution-data-consolidation-automation",
      "title": "Consolidación y automatización de datos",
      "shortDescription": "Centralización, transformación y automatización de información procedente de múltiples archivos o fuentes para reducir trabajo manual, errores y tareas repetitivas."
    },
    {
      "id": "solution-reporting-dashboard-automation",
      "title": "Automatización de reporting y dashboards",
      "shortDescription": "Estructuración y automatización de la preparación, transformación y actualización de datos para reducir tareas manuales recurrentes en informes y cuadros de mando."
    },
    {
      "id": "solution-evaluation-scoring-model",
      "title": "Modelos de evaluación y scoring trazables",
      "shortDescription": "Conversión de criterios, reglas, jerarquías y pesos en modelos de evaluación reproducibles, testeables y trazables."
    },
    {
      "id": "solution-document-data-extraction",
      "title": "Extracción estructurada de datos de documentos",
      "shortDescription": "Extracción, estructuración y preparación de información contenida en documentos digitales para reducir transcripción manual y facilitar su análisis posterior."
    },
    {
      "id": "solution-data-quality-traceability",
      "title": "Calidad, validación y trazabilidad de datos",
      "shortDescription": "Introducción de controles, validaciones y trazabilidad para detectar inconsistencias, explicar resultados y aumentar la confianza en los datos y modelos."
    },
    {
      "id": "solution-web-audit-scoring-automation",
      "title": "Automatización de auditoría y scoring web",
      "shortDescription": "Recopilación automatizada de información pública de múltiples webs, aplicación de reglas de scoring y presentación de resultados comparables para análisis y decisión."
    },
    {
      "id": "solution-financial-analysis-monitoring",
      "title": "Análisis y monitorización de datos financieros",
      "shortDescription": "Estructuración y análisis de datos financieros para seguimiento, comparación, riesgo y apoyo informativo a decisiones mediante modelos y cuadros de mando."
    },
    {
      "id": "solution-ai-opportunity-assessment",
      "title": "Identificación y evaluación de oportunidades con IA",
      "shortDescription": "Análisis del proceso, problema, datos y objetivo para identificar usos de IA con sentido y evaluar su encaje antes de proponer una automatización o implementación concreta."
    }
  ],
  "education": [
    {
      "id": "education-dai-2001-2003",
      "title": "CFGS Desarrollo de Aplicaciones Informáticas"
    },
    {
      "id": "education-ai-big-data-2021-2022",
      "title": "Especialización en Inteligencia Artificial y Big Data"
    },
    {
      "id": "education-data-scientist-2022",
      "title": "Data Scientist"
    },
    {
      "id": "education-power-bi-2022",
      "title": "Business Intelligence con Power BI"
    },
    {
      "id": "education-ai-business-2022-2023",
      "title": "Inteligencia Artificial aplicada a la empresa"
    },
    {
      "id": "education-marketing-online-2023",
      "title": "Marketing y Reputación Online"
    },
    {
      "id": "education-power-bi-ibm-2024",
      "title": "Power BI — IBM SkillsBuild"
    },
    {
      "id": "education-pl300-2024",
      "title": "Formación PL-300"
    },
    {
      "id": "education-sql-2024",
      "title": "SQL — IBM SkillsBuild"
    },
    {
      "id": "education-python-2024",
      "title": "Introducción a Python — IBM SkillsBuild"
    },
    {
      "id": "education-financial-markets-2025",
      "title": "Mercados Financieros Internacionales"
    },
    {
      "id": "education-wealth-management-2025",
      "title": "Gestión de Patrimonio"
    },
    {
      "id": "education-entrepreneurship-2025",
      "title": "Formación en emprendimiento"
    }
  ],
  "certification": [
    {
      "id": "certification-pl300",
      "title": "Microsoft PL-300",
      "shortDescription": "Víctor está preparando actualmente la certificación Microsoft PL-300. Ha completado formación específica, pero la certificación oficial todavía no está obtenida."
    }
  ],
  "contact": {
    "email": "victorguzman.data.pro@gmail.com",
    "linkedin": "https://www.linkedin.com/in/victorguzmanperez/"
  },
  "catalog": {
    "publication": {
      "id": "publication-dataverso",
      "type": "PUBLICATION",
      "title": "Dataverso",
      "url": "https://dataversodata.substack.com",
      "rss": "https://dataversodata.substack.com/feed"
    },
    "articles": [
      {
        "id": "article-4-que-es-un-modelo-de-datos",
        "title": "4 - ¿Qué es un modelo de datos?",
        "url": "https://dataversodata.substack.com/p/4-que-es-un-modelo-de-datos",
        "topics": [
          "power-bi"
        ],
        "summary": "Aprende qué es un modelo de datos en Power BI, cómo funcionan hechos y dimensiones y por qué es clave para crear informes claros y sin errores.",
        "access": "public-excerpt"
      },
      {
        "id": "article-6-errores-comunes-al-empezar-con",
        "title": "6. Errores comunes al empezar con Power BI",
        "url": "https://dataversodata.substack.com/p/6-errores-comunes-al-empezar-con",
        "topics": [
          "power-bi"
        ],
        "summary": "Cuando alguien empieza con Power BI, suele pensar que el problema está en los gráficos.",
        "access": "public-excerpt"
      },
      {
        "id": "article-bienvenido-a-dataverso",
        "title": "🌌 Bienvenido a Dataverso",
        "url": "https://dataversodata.substack.com/p/bienvenido-a-dataverso",
        "topics": [
          "learning"
        ],
        "summary": "Explorando el universo de los datos",
        "access": "public-excerpt"
      },
      {
        "id": "article-conexion-datos-power-bi",
        "title": "5 – Conexión a datos externos en Power BI",
        "url": "https://dataversodata.substack.com/p/conexion-datos-power-bi",
        "topics": [
          "power-bi"
        ],
        "summary": "El paso donde realmente empieza todo.",
        "access": "public-excerpt"
      },
      {
        "id": "article-conexion-datos-power-bi-premium",
        "title": "5 – Conexión a datos externos en Power BI",
        "url": "https://dataversodata.substack.com/p/conexion-datos-power-bi-premium",
        "topics": [
          "power-bi"
        ],
        "summary": "El paso donde realmente empieza todo. 🔒 Incluye contenido exclusivo para suscriptores.",
        "access": "partial"
      },
      {
        "id": "article-de-la-estabilidad-a-cuestionarlo",
        "title": "De la estabilidad a cuestionarlo todo",
        "url": "https://dataversodata.substack.com/p/de-la-estabilidad-a-cuestionarlo",
        "topics": [
          "investing",
          "learning"
        ],
        "summary": "Cómo pasé de seguir el camino tradicional a cuestionarlo todo, empezar a invertir y construir un proceso de aprendizaje para mejorar cada día",
        "access": "public-excerpt"
      },
      {
        "id": "article-el-mundo-de-los-datos",
        "title": "1 - El mundo de los datos 📊",
        "url": "https://dataversodata.substack.com/p/el-mundo-de-los-datos",
        "topics": [
          "learning"
        ],
        "summary": "De la información al conocimiento",
        "access": "public-excerpt"
      },
      {
        "id": "article-guia-completa-power-bi-desde-cero",
        "title": "📚 Guía completa: Power BI desde cero",
        "url": "https://dataversodata.substack.com/p/guia-completa-power-bi-desde-cero",
        "topics": [
          "power-bi"
        ],
        "summary": "Bienvenid@ a esta serie donde iremos construyendo paso a paso los fundamentos del análisis de datos y Power BI.",
        "access": "public-excerpt"
      },
      {
        "id": "article-guia-completa-power-bi-desde-cero-premium",
        "title": "📚 Guía completa: Power BI desde cero",
        "url": "https://dataversodata.substack.com/p/guia-completa-power-bi-desde-cero-premium",
        "topics": [
          "power-bi"
        ],
        "summary": "Incluye contenido con suscripción",
        "access": "partial"
      },
      {
        "id": "article-instalar-power-bi-desktop-primeros-pasos",
        "title": "3 - Instalación y primeros pasos en Power BI",
        "url": "https://dataversodata.substack.com/p/instalar-power-bi-desktop-primeros-pasos",
        "topics": [
          "power-bi"
        ],
        "summary": "Aprende a descargar, instalar y dar tus primeros pasos en Power BI Desktop. Recorremos el entorno de trabajo, configuraciones importantes y creamos nuestro primer gráfico importando datos desde Excel.",
        "access": "public-excerpt"
      },
      {
        "id": "article-lo-que-aporta-el-metodo-rico",
        "title": "El Método RICO",
        "url": "https://dataversodata.substack.com/p/lo-que-aporta-el-metodo-rico",
        "topics": [
          "finance",
          "books"
        ],
        "summary": "El libro que me dio claridad financiera cuando ningún otro lo hizo. Una guía práctica para empezar a mejorar tus finanzas personales.",
        "access": "public-excerpt"
      },
      {
        "id": "article-los-secretos-de-la-mente-millonaria",
        "title": "Los Secretos de la Mente Millonaria",
        "url": "https://dataversodata.substack.com/p/los-secretos-de-la-mente-millonaria",
        "topics": [
          "finance",
          "books"
        ],
        "summary": "Tu patrón del dinero: lo que hay detrás de todo (y por qué cambiarlo lo cambia todo)",
        "access": "public-excerpt"
      },
      {
        "id": "article-mover-6000-con-300",
        "title": "Invertí menos de 300$… y movía cerca de 6000$",
        "url": "https://dataversodata.substack.com/p/mover-6000-con-300",
        "topics": [
          "investing"
        ],
        "summary": "Cómo empecé a investigar el apalancamiento, los dividendos mensuales de JEPI y una app que me sorprendió muchísimo.",
        "access": "public-excerpt"
      },
      {
        "id": "article-padre-rico-padre-pobre-cambio-mentalidad",
        "title": "Lo que ‘Padre rico, Padre pobre’ me hizo replantearme sobre el dinero",
        "url": "https://dataversodata.substack.com/p/padre-rico-padre-pobre-cambio-mentalidad",
        "topics": [
          "finance",
          "books"
        ],
        "summary": "Ideas clave de Padre rico, Padre pobre",
        "access": "public-excerpt"
      },
      {
        "id": "article-power-query-explorando-el-menu-inicio",
        "title": "Power Query: Explorando el menú Inicio",
        "url": "https://dataversodata.substack.com/p/power-query-explorando-el-menu-inicio",
        "topics": [
          "power-query"
        ],
        "summary": "El punto de partida para limpiar, organizar y preparar tus datos antes de analizarlos.",
        "access": "public-excerpt"
      },
      {
        "id": "article-que-es-power-bi",
        "title": "2 - ¿Qué es Power BI y para qué sirve?",
        "url": "https://dataversodata.substack.com/p/que-es-power-bi",
        "topics": [
          "power-bi"
        ],
        "summary": "Hoy en día escuchamos hablar mucho de Business Intelligence (BI) y de cómo herramientas como Power BI están transformando la manera en que las empresas toman decisiones.",
        "access": "public-excerpt"
      },
      {
        "id": "article-que-es-power-query-power-bi",
        "title": "7. Transformación de datos con Power Query",
        "url": "https://dataversodata.substack.com/p/que-es-power-query-power-bi",
        "topics": [
          "power-bi",
          "power-query"
        ],
        "summary": "Descubre cómo Power Query extrae, transforma y prepara datos para crear informes más fiables y profesionales en Power BI.",
        "access": "public-excerpt"
      }
    ],
    "books": [
      {
        "id": "book-lo-que-aporta-el-metodo-rico",
        "type": "BOOK_REFERENCE",
        "title": "El Método RICO",
        "articleId": "article-lo-que-aporta-el-metodo-rico",
        "source": "https://dataversodata.substack.com/p/lo-que-aporta-el-metodo-rico",
        "url": "https://amzn.to/4giMntn",
        "affiliate": true,
        "disclosure": "Enlace de afiliado: Víctor puede recibir una comisión si compras desde este enlace.",
        "status": "approved"
      },
      {
        "id": "book-los-secretos-de-la-mente-millonaria",
        "type": "BOOK_REFERENCE",
        "title": "Los Secretos de la Mente Millonaria",
        "articleId": "article-los-secretos-de-la-mente-millonaria",
        "source": "https://dataversodata.substack.com/p/los-secretos-de-la-mente-millonaria",
        "url": "https://amzn.to/4tSs7mB",
        "affiliate": true,
        "disclosure": "Enlace de afiliado: Víctor puede recibir una comisión si compras desde este enlace.",
        "status": "approved"
      },
      {
        "id": "book-padre-rico-padre-pobre-cambio-mentalidad",
        "type": "BOOK_REFERENCE",
        "title": "Padre rico, Padre pobre",
        "articleId": "article-padre-rico-padre-pobre-cambio-mentalidad",
        "source": "https://dataversodata.substack.com/p/padre-rico-padre-pobre-cambio-mentalidad",
        "url": "https://amzn.to/4bSGsrs",
        "affiliate": true,
        "disclosure": "Enlace de afiliado: Víctor puede recibir una comisión si compras desde este enlace.",
        "status": "approved"
      }
    ]
  }
});
