// _logica.mjs  (el guion bajo evita que Netlify lo trate como función)
//
// Lógica compartida: jala los RSS, clasifica por país, limpia y guarda.
// La usan tanto la función manual (refrescar.mjs) como la programada
// (actualizar-noticias.mjs), para no duplicar código.

import Parser from "rss-parser";
import { getStore } from "@netlify/blobs";

const FEEDS = {
  "Mundial general":  { url: "https://news.google.com/rss/search?q=mundial+futbol+2026&hl=es-419&gl=MX&ceid=MX:es-419", pais: "Mundo" },
  "México selección": { url: "https://news.google.com/rss/search?q=mundial+2026+selecci%C3%B3n+mexicana&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Mediotiempo":      { url: "https://news.google.com/rss/search?q=mundial+2026+site:mediotiempo.com&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Récord":           { url: "https://news.google.com/rss/search?q=mundial+2026+site:record.com.mx&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "ESPN México":      { url: "https://news.google.com/rss/search?q=mundial+2026+site:espn.com.mx&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "TUDN":             { url: "https://news.google.com/rss/search?q=mundial+2026+site:tudn.com&hl=es-419&gl=MX&ceid=MX:es-419", pais: "MX" },
  "Marca":            { url: "https://e00-marca.uecdn.es/rss/futbol/mundial.xml", pais: "Mundo" },
};

const MAX_POR_FUENTE = 40;

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

// Nombre de almacén consistente y site-scoped (persiste entre deploys).
export function almacen() {
  return getStore({ name: "noticias", consistency: "strong" });
}

export async function jalarYGuardar() {
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
        feed = await parser.parseString(await res.text());
      }

      let cuenta = 0;
      for (const e of feed.items) {
        if (cuenta >= MAX_POR_FUENTE) break;

        let titulo = limpiar(e.title);
        const resumen = limpiar(e.contentSnippet || e.content || e.summary || "");
        if (!titulo) continue;

        let fuenteReal = fuente;
        if (cfg.url.includes("news.google.com")) {
          const m = titulo.match(/^(.*)\s+-\s+([^-]+)$/);
          if (m) { titulo = m[1].trim(); fuenteReal = m[2].trim(); }
        }

        const clave = titulo.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
        if (vistos.has(clave)) continue;
        vistos.add(clave);

        items.push({
          fuente: fuenteReal,
          pais: cfg.pais,
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

  items.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const payload = {
    generado: new Date().toISOString(),
    total: items.length,
    noticias: items,
  };

  await almacen().setJSON("ultimas", payload);
  return items.length;
}
