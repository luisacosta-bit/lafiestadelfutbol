// netlify/functions/noticias.mjs
//
// Entrega el JSON guardado al visor. La página llama a /api/noticias
// y recibe lo último que la función programada haya guardado.

import { getStore } from "@netlify/blobs";

export default async function () {
  const store = getStore("noticias");
  const data = await store.get("ultimas", { type: "json" });

  if (!data) {
    // Todavía no ha corrido la función programada ni una vez.
    return Response.json(
      {
        generado: "",
        total: 0,
        noticias: [],
        aviso: "Aún no hay datos. Corre la función de actualización una vez.",
      },
      { headers: { "Cache-Control": "no-cache" } }
    );
  }

  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=300" }, // cache 5 min
  });
}
