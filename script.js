const useCase = document.getElementById("reportUseCase");
const comingSoon = document.getElementById("comingSoon");

const reports = [
  {
    title: "Optimización de Costes de Suministros",
    description:
      "Prototipo de aplicación analítica para detectar oportunidades de ahorro en suministros empresariales mediante lectura automática de facturas, simulación de escenarios y análisis interactivo.",

    useCase:
      "Permite analizar facturas eléctricas reales, identificar oportunidades de ahorro y comparar escenarios comerciales alternativos. El sistema utiliza Python para extraer automáticamente información desde facturas PDF y Power BI para construir una experiencia interactiva orientada a negocio. Este módulo es el primer paso de una plataforma más amplia destinada a optimizar distintos costes empresariales como electricidad, telecomunicaciones, seguros, software y servicios.",

    url: "https://app.powerbi.com/view?r=eyJrIjoiYmU2OGNmMjYtMjEwMC00NWJiLTljY2MtMzI0ODhmMTA1NTk1IiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  },
  {
    title: "Análisis de Presencia Digital de Hoteles de Alicante",

    description:
      "Proyecto de analítica turística que combina Python y Power BI para evaluar la madurez digital de los hoteles de Alicante mediante indicadores de presencia web, accesibilidad, SEO y experiencia digital.",

    useCase:
      "El proyecto parte de datos turísticos oficiales y utiliza Python para automatizar la auditoría digital de cientos de establecimientos hoteleros. El proceso analiza webs corporativas, HTTPS, diseño responsive, metadatos SEO, redes sociales, plataformas de reserva, geolocalización y otros indicadores digitales para generar un scoring de madurez digital. Posteriormente, Power BI transforma estos resultados en un informe interactivo con rankings, segmentaciones geográficas, oportunidades de mejora y conclusiones asistidas por IA orientadas a la transformación digital del sector turístico.",

    url: "https://app.powerbi.com/view?r=eyJrIjoiMjYwZjVhZDgtOGRjMy00NzAwLWEwZTEtZTEwNjdhZWJjYTkyIiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  },
  {
    title: "Investment Dashboard con IA",

    description:
      "Plataforma de análisis de inversiones desarrollada en Python y Power BI para evaluar dividendos, riesgo, valoración, noticias y optimización de cartera.",

    useCase:
      "Proyecto personal de investigación financiera que integra múltiples fuentes de datos, modelos cuantitativos y automatización avanzada. Combina análisis de dividendos, valoración, calidad empresarial, noticias financieras, régimen macroeconómico y optimización de cartera para apoyar decisiones de inversión basadas en datos. Actualmente continúa en desarrollo y evolucionará hacia una plataforma integral de análisis y seguimiento de inversiones.",

    url: ""
  },
  {
    title: "Seguimiento de Tickets de Agentes",
    description:
      "Dashboard de Power BI para el seguimiento operativo de tickets y rendimiento de agentes.",
    useCase:
      "Permite detectar cuellos de botella en la gestión de incidencias, evaluar el rendimiento de los agentes y mejorar la calidad del servicio mediante el análisis de tiempos de resolución y satisfacción del cliente.",
    url: "https://app.powerbi.com/view?r=eyJrIjoiYWE5YWZiMjktMTE5OC00ZWM5LTk1ZDEtN2JjMWQ0YWUxMDliIiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  },
  {
    title: "Resultados Campañas Marketing",
    description:
      "Dashboard de Power BI para el análisis de campañas de marketing en entorno retail.",
    useCase:
      "Permite evaluar la efectividad de las campañas de marketing, entender el comportamiento de los clientes y optimizar las acciones comerciales en función de la segmentación y la respuesta de los usuarios.",
    url: "https://app.powerbi.com/view?r=eyJrIjoiOWM4NTA5M2MtNzdjMi00ZDBlLTljNzMtNDc3ODE0NzQ5MzEzIiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  },
  {
    title: "Análisis de Ventas y Márgenes",
    description:
      "Dashboard financiero en Power BI para el análisis de ventas, utilidad y márgenes.",
    useCase:
      "Permite identificar qué productos, países o regiones generan mayor rentabilidad, analizar la evolución del negocio en el tiempo y detectar oportunidades de mejora en márgenes y ventas.",
    url: "https://app.powerbi.com/view?r=eyJrIjoiMWQ4Zjg0ZjItMWI5MS00ZjM5LTg4MGEtYzViZmJlNTZhMWYxIiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  },
  {
  title: "Analítica de Compras y Cadena de Suministro",
  description:
    "Dashboard de Power BI para el seguimiento de compras, proveedores y KPIs clave como OTIF, OnTime e InFull.",
  useCase:
    "Permite controlar el rendimiento de proveedores, analizar el cumplimiento de plazos, detectar desviaciones en entregas y optimizar la gestión de compras para mejorar eficiencia, costes y fiabilidad en la cadena de suministro.",
  url: "https://app.powerbi.com/view?r=eyJrIjoiNTJjZDAyOTAtNzU1YS00MjdhLTk5YjEtZGQ5ZjhhYWE5YjMyIiwidCI6IjBlOWM0ZDExLThjOWUtNDk2NS05ZjU4LTlhMjY3OTgyMjAwMiIsImMiOjl9&pageView=fitToPage"
  }

];

const tabs = document.querySelectorAll(".report-tab");
const iframe = document.getElementById("powerbiIframe");
const title = document.getElementById("reportTitle");
const description = document.getElementById("reportDescription");

function loadReport(index) {
  const report = reports[index];

  if (!report) return;

  title.textContent = report.title;
  description.textContent = report.description;

  if (useCase) {
    useCase.textContent = report.useCase;
  }

  if (report.url && report.url !== "") {
    iframe.src = report.url;
    iframe.style.visibility = "visible";

    comingSoon.classList.remove("show");
    comingSoon.classList.add("hidden");
  } else {
    iframe.src = "";
    iframe.style.visibility = "hidden";

    comingSoon.classList.remove("hidden");

    setTimeout(() => {
      comingSoon.classList.add("show");
    }, 10);
  }

  tabs.forEach((tab) => tab.classList.remove("active"));
  tabs[index].classList.add("active");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    loadReport(Number(tab.dataset.report));
  });
});

loadReport(0);

const elements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.2 }
);

elements.forEach((el) => observer.observe(el));