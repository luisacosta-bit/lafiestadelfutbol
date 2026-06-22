// netlify/functions/actualizar-noticias.mjs
//
// Función PROGRAMADA: Netlify la ejecuta sola cada 3 horas.
// Jala noticias del Mundial EN ESPAÑOL, las clasifica por país (MX / Mundo),
// las limpia y las guarda. Reemplaza al script local de Python.

import Parser from "rss-parser";
import { getStore } from "@netlify/blobs";

// --- Fuentes EN ESPAÑOL, cada una etiquetada por país -------------------
// "MX"    = noticias enfocadas en México / Selección Mexicana
// "Mundo" = Mundial en español, resto del mundo
//
// Nota: medios como AS, Récord o Mediotiempo bloquean su RSS directo (403),
// por eso usamos Google News con búsquedas "site:medio.com" para alcanzarlos.
const FEEDS = {
  "Mundial general": { url: "https://news.google.com/rss/search?q=mundial+futbol+2026&hl=es-419&gl=MX&ceid=MX:es-419", pais: "Mundo" },
  "México selección": { url: "https://news.google.com/rss/search?q=mundial+2026+selecci%C3%B3n+mexicana&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Mediotiempo":      { url: "https://news.google.com/rss/search?q=mundial+2026+site:mediotiempo.com&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Récord":           { url: "https://news.google.com/rss/search?q=mundial+2026+site:record.com.mx&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "ESPN México":      { url: "https://news.google.com/rss/search?q=mundial+2026+site:espn.com.mx&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "TUDN":             { url: "https://news.google.com/rss/search?q=mundial+2026+site:tudn.com&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Marca":            { url: "https://e00-marca.uecdn.es/rss/futbol/mundial.xml", pais: "Mundo" },
};

// Máximo de noticias por fuente (evita un muro infinito y reduce solapamiento)
const MAX_POR_FUENTE = 40;

// -----------------------------------------------------------------------

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "Mozilla/5.0 (NRM-Originals-Bot)" },
});

function limpiar(t) {
  if (!t) return "";
  return t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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

  for (const [fuente, cfg] of Object.entries(FEEDS)) {
    try {
      let feed;
      try {
        feed = await parser.parseURL(cfg.url);
      } catch {
        const res = await fetch(cfg.url, {
          headers: { "User-Agent": "Mozilla/5.0 (NRM-Originals-Bot)" },
        });
        const xml = await res.text();
        feed = await parser.parseString(xml);
      }

      let cuenta = 0;
      for (const e of feed.items) {
        if (cuenta >= MAX_POR_FUENTE) break;

        let titulo = limpiar(e.title);
        const resumen = limpiar(e.contentSnippet || e.content || e.summary || "");
        if (!titulo) continue;

        // Google News pega el medio al final: "Titular - Récord".
        // Lo extraemos como fuente real y limpiamos el título.
        let fuenteReal = fuente;
        const esGoogle = cfg.url.includes("news.google.com");
        if (esGoogle) {
          const m = titulo.match(/^(.*)\s+-\s+([^-]+)$/);
          if (m) {
            titulo = m[1].trim();
            fuenteReal = m[2].trim();
          }
        }

        const clave = titulo.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
        if (vistos.has(clave)) continue;
        vistos.add(clave);

        items.push({
          fuente: fuenteReal,
          pais: cfg.pais,          // "MX" o "Mundo" -> el marcador filtra por esto
          titulo,
          resumen,
          enlace: e.link || "",
          fecha: fechaISO(e),
        });
        cuenta++;
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

  const store = getStore("noticias");
  await store.setJSON("ultimas", payload);

  console.log(`Guardadas ${items.length} noticias en español.`);
  return new Response(`OK: ${items.length} noticias`, { status: 200 });
}

// "0 */3 * * *" = cada 3 horas. Cambia el 3 para otra frecuencia.
export const config = {
  schedule: "0 */3 * * *",
};
