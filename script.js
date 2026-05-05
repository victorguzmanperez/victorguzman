const useCase = document.getElementById("reportUseCase");
const comingSoon = document.getElementById("comingSoon");

const reports = [
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
  },
  {
    title: "Investment Dashboard",
    description:
      "Dashboard de inversión con métricas de cartera, dividendos y riesgo.",
    useCase:
      "Permite tomar decisiones de inversión basadas en datos, evaluando riesgo, rentabilidad y comportamiento histórico de los activos para optimizar la cartera.",
    url: ""
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