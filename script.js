const reports = [
  {
    title: "Investment Dashboard",
    description:
      "Dashboard de inversión conectado a un pipeline en Python con métricas de cartera, dividendos, riesgo y señales de IA.",
    url: ""
  },
  {
    title: "Finanzas",
    description:
      "Informe financiero con KPIs, evolución de ingresos, márgenes, gastos y análisis ejecutivo.",
    url: ""
  },
  {
    title: "Operaciones",
    description:
      "Dashboard operativo para seguimiento de rendimiento, eficiencia, incidencias y evolución temporal.",
    url: ""
  }
];

const tabs = document.querySelectorAll(".report-tab");
const iframe = document.getElementById("powerbiIframe");
const title = document.getElementById("reportTitle");
const description = document.getElementById("reportDescription");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const reportIndex = tab.dataset.report;
    const report = reports[reportIndex];

    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");

    iframe.src = report.url;
    title.textContent = report.title;
    description.textContent = report.description;
  });
});

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