// netlify/functions/actualizar-noticias.mjs
//
// Función PROGRAMADA: Netlify la ejecuta sola cada 3 horas.
// Jala los RSS, los limpia, y guarda el resultado en el almacén de Netlify.
// (Esta es la pieza que reemplaza a tu script de Python en la nube.)

import Parser from "rss-parser";
import { getStore } from "@netlify/blobs";

// --- Fuentes (edita esta lista para agregar/quitar medios) -------------
const FEEDS = {
  "ESPN FC":            "https://www.espn.com/espn/rss/soccer/news",
  "BBC Sport Football": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "Sky Sports":         "https://www.skysports.com/rss/12040",
  "Marca Mundial":      "https://e00-marca.uecdn.es/rss/futbol/mundial.xml",
};

// --- Filtro por palabras clave -----------------------------------------
const KEYWORDS = [
  "world cup", "mundial", "fifa", "world-cup",
  "copa del mundo", "wc 2026", "world cup 2026",
];
const FEEDS_SIN_FILTRO = new Set(["Marca Mundial"]); // ya es 100% Mundial

// -----------------------------------------------------------------------

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "Mozilla/5.0 (NRM-Originals-Bot)" },
});

function limpiar(t) {
  if (!t) return "";
  return t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function relevante(titulo, resumen) {
  const blob = `${titulo} ${resumen}`.toLowerCase();
  return KEYWORDS.some((k) => blob.includes(k));
}

function fechaISO(item) {
  const f = item.isoDate || item.pubDate;
  if (!f) return "";
  const d = new Date(f);
  return isNaN(d) ? "" : d.toISOString();
}

export default async function () {
  const items = [];
  const vistos = new Set();

  for (const [fuente, url] of Object.entries(FEEDS)) {
    try {
      let feed;
      try {
        feed = await parser.parseURL(url);
      } catch {
        // Respaldo: algunos feeds (ESPN) fallan con el parser directo.
        // Los bajamos a mano y los parseamos desde el texto.
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (NRM-Originals-Bot)" },
        });
        const xml = await res.text();
        feed = await parser.parseString(xml);
      }

      for (const e of feed.items) {
        const titulo = limpiar(e.title);
        const resumen = limpiar(e.contentSnippet || e.content || e.summary || "");
        if (!titulo) continue;

        if (!FEEDS_SIN_FILTRO.has(fuente) && !relevante(titulo, resumen)) continue;

        const clave = titulo.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
        if (vistos.has(clave)) continue;
        vistos.add(clave);

        items.push({
          fuente,
          titulo,
          resumen,
          enlace: e.link || "",
          fecha: fechaISO(e),
        });
      }
    } catch (err) {
      console.log(`[AVISO] Falló '${fuente}': ${err.message}`);
    }
  }

  // Orden: más reciente primero
  items.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const payload = {
    generado: new Date().toISOString(),
    total: items.length,
    noticias: items,
  };

  // Guarda en el almacén de Netlify (persiste entre ejecuciones)
  const store = getStore("noticias");
  await store.setJSON("ultimas", payload);

  console.log(`Guardadas ${items.length} noticias.`);
  return new Response(`OK: ${items.length} noticias`, { status: 200 });
}

// Netlify lee esto para programar la ejecución automática.
// "0 */3 * * *" = cada 3 horas. Cambia el número 3 si quieres otra frecuencia.
export const config = {
  schedule: "0 */3 * * *",
};
