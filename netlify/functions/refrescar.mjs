// refrescar.mjs
//
// Función NORMAL: SÍ se puede disparar por URL.
// Ábrela cuando quieras refrescar las noticias al instante:
//   https://TU-SITIO.netlify.app/refrescar
//
// (Las funciones programadas NO se pueden disparar por URL, por eso
//  existe esta versión manual aparte.)

import { jalarYGuardar } from "./_logica.mjs";

export default async function () {
  const total = await jalarYGuardar();
  return new Response(`OK: ${total} noticias guardadas`, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
