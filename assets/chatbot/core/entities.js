/**
 * Asistente de Víctor
 * Entity extractor local y determinista.
 *
 * PREPROD.1.11.13 — Entity extractor
 *
 * No modifica state.
 * No genera respuestas.
 */


import { resolveTechnologyMentions } from "./technology-entities.js";


const BUSINESS_AREA_PATTERNS =
  Object.freeze([
    [
      "finanzas",
      /\b(?:finanzas?|financiero|financiera|contabilidad|contable)\b/i,
    ],

    [
      "ventas",
      /\b(?:ventas?|comercial(?:es)?)\b/i,
    ],

    [
      "operaciones",
      /\b(?:operaciones?|operativa)\b/i,
    ],

    [
      "rrhh",
      /\b(?:rrhh|recursos\s+humanos)\b/i,
    ],

    [
      "marketing",
      /\bmarketing\b/i,
    ],

    [
      "compras",
      /\bcompras?\b/i,
    ],
  ]);

const SPANISH_NUMBER_WORDS =
  Object.freeze({
    cero: 0,
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    dieciséis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiuno: 21,
    veintiuna: 21,
    veintidos: 22,
    veintidós: 22,
    veintitres: 23,
    veintitrés: 23,
    veinticuatro: 24,
    veinticinco: 25,
    veintiseis: 26,
    veintiséis: 26,
    veintisiete: 27,
    veintiocho: 28,
    veintinueve: 29,
    treinta: 30,
  });


function parseCount(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }


  if (
    /^\d+$/.test(
      value,
    )
  ) {
    return Number(
      value,
    );
  }


  return (
    SPANISH_NUMBER_WORDS[
      value.toLowerCase()
    ] ??
    null
  );
}


function cleanCapturedText(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }


  const cleaned =
    value
      .trim()
      .replace(
        /[.,;:!?]+$/g,
        "",
      )
      .replace(
        /\s+/g,
        " ",
      );


  return cleaned ||
    null;
}


export function extractEmail(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const match =
    text.match(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    );


  return match
    ? match[0].toLowerCase()
    : null;
}


export function extractPhone(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const match =
    text.match(
      /(?:\+34[\s.-]?)?[6789](?:[\s.-]?\d){8}\b/,
    );


  if (!match) {
    return null;
  }


  return match[0]
    .replace(
      /[\s.-]/g,
      "",
    );
}


export function extractName(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const patterns = [
    /\bme\s+llamo\s+([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{1,30}(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{1,30}){0,2})/i,

    /\bmi\s+nombre\s+es\s+([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{1,30}(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{1,30}){0,2})/i,
  ];


  for (
    const pattern
    of patterns
  ) {
    const match =
      text.match(
        pattern,
      );


    if (match?.[1]) {
      return cleanCapturedText(
        match[1],
      );
    }
  }


  return null;
}


export function extractCompany(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const patterns = [
    /\b(?:trabajo|trabajamos)\s+en\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&.' -]{2,60}?)(?=\s+(?:y|con|donde|pero|tenemos|hacemos)\b|[.,;!?]|$)/i,

    /\bmi\s+empresa\s+(?:es|se\s+llama)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&.' -]{2,60}?)(?=[.,;!?]|$)/i,
  ];


  for (
    const pattern
    of patterns
  ) {
    const match =
      text.match(
        pattern,
      );


    if (match?.[1]) {
      return cleanCapturedText(
        match[1],
      );
    }
  }


  return null;
}


export function extractTools(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return [];
  }


  return resolveTechnologyMentions(text)
    .map(item => item.id.replace(/^technology-/, ""));
}


export function extractFrequency(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const normalized =
    text.toLowerCase();


  if (
    /\b(?:cada\s+dia|diariamente|todos\s+los\s+dias)\b/
      .test(normalized)
  ) {
    return "daily";
  }


  if (
    /\b(?:cada\s+semana|semanalmente|todas\s+las\s+semanas|(?:cada|todos\s+los)\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo))\b/
      .test(normalized)
  ) {
    return "weekly";
  }


  if (
    /\b(?:cada\s+mes|mensualmente|todos\s+los\s+meses)\b/
      .test(normalized)
  ) {
    return "monthly";
  }


  if (
    /\b(?:cada\s+trimestre|trimestralmente)\b/
      .test(normalized)
  ) {
    return "quarterly";
  }


  if (
    /\b(?:cada\s+ano|anualmente|una\s+vez\s+al\s+ano)\b/
      .test(normalized)
  ) {
    return "yearly";
  }


  return null;
}


export function extractUsers(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const match =
    text.match(
      /\b(\d{1,6})\s+(?:usuarios?|personas?|empleados?|companeros?|miembros?)\b/i,
    );


  return match
    ? Number(
        match[1],
      )
    : null;
}


export function extractVolume(
  text,
) {
  const volume = {};


  if (
    typeof text !== "string"
  ) {
    return volume;
  }


  const countToken =
    [
      "\\d{1,7}",
      ...Object.keys(
        SPANISH_NUMBER_WORDS,
      ),
    ].join("|");


  const files =
    text.match(
      new RegExp(
        `\\b(${countToken})\\s+(?:ficheros?|archivos?|excels?|hojas?)\\b`,
        "i",
      ),
    );


  const records =
    text.match(
      /\b(\d{1,12})\s+(?:registros?|filas?|lineas?)\b/i,
    );


  const sources =
    text.match(
      /\b(\d{1,6})\s+(?:fuentes?|origenes?|sistemas?)\b/i,
    );


  if (files) {
    volume.files =
      parseCount(
        files[1],
      );
  }


  if (records) {
    volume.records =
      Number(
        records[1],
      );
  }


  if (sources) {
    volume.sources =
      Number(
        sources[1],
      );
  }


  return volume;
}


export function extractTimeframe(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const normalized =
    text.toLowerCase();


  if (
    /\b(?:urgente|cuanto\s+antes|lo\s+antes\s+posible)\b/
      .test(normalized)
  ) {
    return "urgent";
  }


  let match =
    normalized.match(
      /\ben\s+(\d{1,3})\s+dias?\b/,
    );


  if (match) {
    return `${match[1]} days`;
  }


  match =
    normalized.match(
      /\ben\s+(\d{1,3})\s+semanas?\b/,
    );


  if (match) {
    return `${match[1]} weeks`;
  }


  match =
    normalized.match(
      /\ben\s+(\d{1,2})\s+meses?\b/,
    );


  if (match) {
    return `${match[1]} months`;
  }


  return null;
}


export function extractBusinessArea(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  for (
    const [
      area,
      pattern,
    ]
    of BUSINESS_AREA_PATTERNS
  ) {
    if (
      pattern.test(text)
    ) {
      return area;
    }
  }


  return null;
}


export function extractCurrentProcess(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  if (
    /\b(?:manual|manualmente|a\s+mano|copio|copiamos|copiar|copiando|pego|pegamos|pegar|pegando|copiar\s+y\s+pegar)\b/i
      .test(text)
  ) {
    return "manual";
  }


  if (
    /\b(?:automatizado|automaticamente|automático|automatica)\b/i
      .test(text)
  ) {
    return "automated";
  }


  return null;
}


export function extractObjective(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return null;
  }


  const match =
    text.match(
      /\b(?:quiero|queremos|necesito|necesitamos|objetivo\s+es)\s+(.{3,140}?)(?=[.!?;]|$)/i,
    );


  return match?.[1]
    ? cleanCapturedText(
        match[1],
      )
    : null;
}


export function extractNeeds(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    return [];
  }


  const needs =
    [];


  if (
    /\b(?:automatizar|automatizacion|manual(?:mente)?)\b/i
      .test(text)
  ) {
    needs.push(
      "automation",
    );
  }


  if (
    /\b(?:informe|informes|reporting|dashboard|cuadro\s+de\s+mando)\b/i
      .test(text)
  ) {
    needs.push(
      "reporting",
    );
  }


  if (
    /\b(?:analizar|analisis|datos)\b/i
      .test(text)
  ) {
    needs.push(
      "data-analysis",
    );
  }


  return [
    ...new Set(
      needs,
    ),
  ];
}


export function extractEntities(
  text,
) {
  if (
    typeof text !== "string"
  ) {
    throw new TypeError(
      "extractEntities() requires a string",
    );
  }


  const contact = {};

  const caseEntities = {};


  const name =
    extractName(text);

  const company =
    extractCompany(text);

  const email =
    extractEmail(text);

  const phone =
    extractPhone(text);


  if (name !== null) {
    contact.name =
      name;
  }


  if (company !== null) {
    contact.company =
      company;
  }


  if (email !== null) {
    contact.email =
      email;
  }


  if (phone !== null) {
    contact.phone =
      phone;
  }


  const tools =
    extractTools(text);

  const needs =
    extractNeeds(text);

  const currentProcess =
    extractCurrentProcess(
      text,
    );

  const frequency =
    extractFrequency(
      text,
    );

  const users =
    extractUsers(
      text,
    );

  const volume =
    extractVolume(
      text,
    );

  const objective =
    extractObjective(
      text,
    );

  const timeframe =
    extractTimeframe(
      text,
    );

  const businessArea =
    extractBusinessArea(
      text,
    );


  if (tools.length > 0) {
    caseEntities.tools =
      tools;
  }


  if (needs.length > 0) {
    caseEntities.needs =
      needs;
  }


  if (
    currentProcess !== null
  ) {
    caseEntities.currentProcess =
      currentProcess;
  }


  if (frequency !== null) {
    caseEntities.frequency =
      frequency;
  }


  if (users !== null) {
    caseEntities.users =
      users;
  }


  if (
    Object.keys(volume)
      .length > 0
  ) {
    caseEntities.volume =
      volume;
  }


  if (objective !== null) {
    caseEntities.objective =
      objective;
  }


  if (timeframe !== null) {
    caseEntities.timeframe =
      timeframe;
  }


  if (
    businessArea !== null
  ) {
    caseEntities.businessArea =
      businessArea;
  }


  return {
    contact,
    case:
      caseEntities,
  };
}