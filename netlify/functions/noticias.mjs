// noticias.mjs
//
// Entrega el JSON guardado al visor (/api/noticias).

import { almacen } from "./_logica.mjs";

export default async function () {
  const data = await almacen().get("ultimas", { type: "json" });

  if (!data) {
    return Response.json(
      { generado: "", total: 0, noticias: [], aviso: "Aún no hay datos. Abre /refrescar una vez." },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
