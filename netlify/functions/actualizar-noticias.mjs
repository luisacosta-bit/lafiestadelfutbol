// actualizar-noticias.mjs
//
// Función PROGRAMADA: Netlify la corre sola cada 3 horas.
// NO se puede disparar por URL (es una limitación de Netlify);
// para refresco manual usa /refrescar.

import { jalarYGuardar } from "./_logica.mjs";

export default async function () {
  const total = await jalarYGuardar();
  console.log(`Programada: guardadas ${total} noticias.`);
}

export const config = {
  schedule: "0 */3 * * *",  // cada 3 horas
};
