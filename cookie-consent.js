/* ==============================
   COOKIE CONSENT
   Victor Guzmán Portfolio
============================== */

const GA_MEASUREMENT_ID = "G-6DLSS21PER";

const CONSENT_STORAGE_KEY = "vg_cookie_consent";

let analyticsLoaded = false;


/* ------------------------------
   GOOGLE ANALYTICS
------------------------------ */

function loadGoogleAnalytics() {

  if (analyticsLoaded) {
    return;
  }

  analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];

  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");

  script.async = true;

  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" +
    GA_MEASUREMENT_ID;

  document.head.appendChild(script);

  window.gtag("js", new Date());

  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });
}


/* ------------------------------
   CONSENTIMIENTO
------------------------------ */

function getCookieConsent() {

  return localStorage.getItem(CONSENT_STORAGE_KEY);

}


function saveCookieConsent(value) {

  localStorage.setItem(CONSENT_STORAGE_KEY, value);

}


function acceptAnalytics() {

  saveCookieConsent("accepted");

  loadGoogleAnalytics();

  hideCookieBanner();

}


function rejectAnalytics() {

  const wasAccepted =
    getCookieConsent() === "accepted";

  saveCookieConsent("rejected");

  removeAnalyticsCookies();

  hideCookieBanner();

  /*
    Si Analytics ya se había autorizado y cargado,
    recargamos para garantizar que gtag.js deja
    de ejecutarse completamente.
  */
  if (wasAccepted) {
    window.location.reload();
  }

}


/* ------------------------------
   ELIMINAR COOKIES GA
------------------------------ */

function removeAnalyticsCookies() {

  const cookies = document.cookie.split(";");

  cookies.forEach(cookie => {

    const cookieName =
      cookie.split("=")[0].trim();

    if (
      cookieName === "_ga" ||
      cookieName.startsWith("_ga_")
    ) {

      document.cookie =
        cookieName +
        "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    }

  });

}


/* ------------------------------
   BANNER
------------------------------ */

function showCookieBanner() {

  const banner =
    document.getElementById("cookieBanner");

  if (banner) {
    banner.classList.add("show");
  }

}


function hideCookieBanner() {

  const banner =
    document.getElementById("cookieBanner");

  if (banner) {
    banner.classList.remove("show");
  }

}


/* ------------------------------
   CONFIGURAR DE NUEVO
------------------------------ */

function openCookiePreferences() {

  showCookieBanner();

}


/* ------------------------------
   INICIALIZACIÓN
------------------------------ */

document.addEventListener("DOMContentLoaded", () => {

  const consent = getCookieConsent();

  const acceptButton =
    document.getElementById("acceptAnalytics");

  const rejectButton =
    document.getElementById("rejectAnalytics");


  if (acceptButton) {

    acceptButton.addEventListener(
      "click",
      acceptAnalytics
    );

  }


  if (rejectButton) {

    rejectButton.addEventListener(
      "click",
      rejectAnalytics
    );

  }


  if (consent === "accepted") {

    loadGoogleAnalytics();

    return;

  }


  if (consent === "rejected") {

    return;

  }


  showCookieBanner();

});