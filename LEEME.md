# NRM Originals — Noticias del Mundial · Cómo desplegarlo en Netlify

Esta carpeta es un sitio que jala las noticias del Mundial por RSS, las limpia,
y las muestra en una página que tu equipo puede consultar desde un link.

---

## ⚠️ LO MÁS IMPORTANTE QUE DEBES ENTENDER

Hay **dos formas** de subir esto a Netlify, y NO dan el mismo resultado:

| | Arrastrar la carpeta | Conectar GitHub |
|---|---|---|
| ¿Se actualiza sola? | ❌ NO | ✅ SÍ, cada 3 horas |
| Esfuerzo | Mínimo | Crear un repo (15 min) |

La función que actualiza las noticias automáticamente **SOLO se activa si conectas
GitHub**. Si arrastras la carpeta, el sitio sube pero las noticias quedan congeladas
y tendrías que resubir a mano cada vez. Para noticias del Mundial, eso no sirve.

**Recomendación: usa GitHub.** Abajo están las dos rutas.

---

## RUTA A — GitHub + Netlify (recomendada, se actualiza sola)

### 1. Sube el código a GitHub
1. Crea una cuenta en https://github.com (gratis) si no tienes.
2. Crea un repositorio nuevo (botón "New", ponle un nombre, déjalo público o privado).
3. Sube TODOS los archivos de esta carpeta al repo. La forma más fácil sin terminal:
   en la página del repo nuevo, clic en "uploading an existing file" y arrastra todo.
   - **Importante:** sube respetando las carpetas (`netlify/functions/...`, `public/...`).
     Si GitHub te deja arrastrar la carpeta completa, hazlo así.

### 2. Conecta Netlify a ese repo
1. Crea cuenta en https://netlify.com (gratis), puedes entrar con tu cuenta de GitHub.
2. "Add new site" → "Import an existing project" → elige GitHub → selecciona tu repo.
3. Netlify lee el archivo `netlify.toml` solo. No cambies nada, dale "Deploy".
4. Espera 1–2 min. Te da un link tipo `https://algo-random.netlify.app`.

### 3. Enciende las noticias por primera vez
La función programada corre cada 3 horas, pero al inicio el sitio está vacío.
Para llenarlo de inmediato sin esperar:
1. En tu sitio de Netlify, ve a la pestaña **"Functions"**.
2. Busca `actualizar-noticias` y ejecútala manualmente una vez (botón de run/trigger).
   - Alternativa: abre en el navegador
     `https://TU-SITIO.netlify.app/.netlify/functions/actualizar-noticias`
3. Recarga la página principal. Ya deben aparecer las noticias.

### 4. Comparte el link con tus 2 compañeros
Les pasas `https://TU-SITIO.netlify.app` y listo. Entran cuando quieran.
De ahí en adelante se actualiza sola cada 3 horas.

---

## RUTA B — Arrastrar la carpeta (rápida pero NO se actualiza sola)

Solo usa esto si quieres ver algo funcionando YA y no te importa actualizar a mano.

1. Entra a https://app.netlify.com/drop
2. Arrastra esta carpeta completa a la ventana.
3. Te da un link. **Pero ojo:** la función automática no se activará por esta vía,
   así que las noticias se quedarán en el estado inicial (probablemente vacío,
   porque la función nunca corrió).

> Por esto la Ruta A es la buena. La B prácticamente no te sirve para este proyecto.

---

## CÓMO CAMBIAR COSAS

**Agregar o quitar medios:** edita la lista `FEEDS` en
`netlify/functions/actualizar-noticias.mjs`. Es solo `"nombre": "url-del-rss"`.

**Cambiar cada cuánto se actualiza:** al final de ese mismo archivo, en
`schedule: "0 */3 * * *"`, cambia el `3` por las horas que quieras
(ej. `*/6` = cada 6 horas, `*/1` = cada hora).

**Cambiar palabras clave del filtro:** la lista `KEYWORDS` en el mismo archivo.

Después de cualquier cambio: si usaste GitHub, sube el archivo cambiado al repo y
Netlify redespliega solo.

---

## ¿Y la privacidad? (tus 2 compañeros vs. el mundo)

Por defecto el link es **público**: cualquiera que lo tenga entra. Para noticias del
Mundial probablemente da igual. Si necesitas que SOLO ustedes tres entren con
contraseña, eso requiere el plan de pago de Netlify (la protección con password no
viene en el gratis).
