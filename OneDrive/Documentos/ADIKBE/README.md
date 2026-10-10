# Sitio web de ADIKB'E

Sitio estático hecho con [Astro](https://astro.build), pensado para desplegarse
gratis en [Vercel](https://vercel.com) (sin costos de plan, a diferencia de Wix).

## Estructura del proyecto

```
src/
  components/      Header.astro, Footer.astro
  content/blog/     Publicaciones del blog en Markdown (.md)
  layouts/          Layout.astro (plantilla base: <head>, header, footer)
  pages/            Cada archivo .astro es una página del sitio
    index.astro          -> /
    quienes-somos.astro  -> /quienes-somos/
    ejes-de-trabajo.astro-> /ejes-de-trabajo/
    equipo-y-aliados.astro -> /equipo-y-aliados/  (la sección "Portfolio")
    contacto.astro        -> /contacto/  (formulario + donaciones)
    blog/index.astro      -> /blog/
    blog/[slug].astro     -> /blog/<slug-del-post>/
  styles/global.css  Colores, tipografías y estilos base
public/              Archivos estáticos (favicon, robots.txt, imágenes)
```

## Cómo correrlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 18 o superior instalado.

```bash
npm install
npm run dev
```

Abre http://localhost:4321 en tu navegador. Los cambios que hagas se ven al instante.

Para generar la versión final (la que se sube a producción):

```bash
npm run build
npm run preview   # para revisarla localmente antes de publicar
```

## Cómo publicar una nueva entrada de blog

1. Crea un archivo nuevo en `src/content/blog/`, por ejemplo `jornada-reforestacion-mayo.md`.
2. Cópialo de otro post existente y edita el encabezado (frontmatter) y el contenido:

```md
---
title: "Título de tu publicación"
description: "Un resumen corto de 1-2 líneas (aparece en las tarjetas y en Google)"
pubDate: 2026-05-20
autor: "Equipo ADIKB'E"
eje: "Restauración de Ecosistemas"   # opcional, debe coincidir con uno de los 7 ejes
---

Aquí escribes el contenido en Markdown. Puedes usar **negritas**, _cursivas_,
## subtítulos, y listas normales.
```

3. Guarda el archivo. Al hacer `npm run dev` o al desplegar de nuevo, la
   publicación aparece automáticamente en `/blog/` y en el inicio (las 3 más
   recientes).
4. Para ocultar temporalmente un post sin borrarlo, agrega `draft: true` en el frontmatter.

No necesitas tocar ningún otro archivo del código para publicar contenido nuevo.

## Configurar el formulario de contacto/donaciones (Web3Forms)

El formulario de `/contacto/` usa [Web3Forms](https://web3forms.com), un
servicio gratuito que recibe el formulario y lo reenvía por correo — sin
necesidad de programar un backend ni pagar hosting de servidor.

1. Entra a https://web3forms.com y crea una clave de acceso gratuita usando
   el correo `asociacionkakbe@gmail.com` (no requiere tarjeta ni pago).
2. Te va a llegar un "Access Key" (una cadena de texto).
3. Abre `src/pages/contacto.astro` y busca la línea:
   ```html
   <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE" />
   ```
   Reemplaza `YOUR_ACCESS_KEY_HERE` con tu clave real.
4. Guarda, vuelve a desplegar (o `npm run build` si lo haces manual), y listo:
   cada mensaje del formulario llegará directo a ese correo.

El formulario ya incluye protección básica contra spam (un campo "honeypot" oculto).

## Desplegar gratis en Vercel

1. Sube este proyecto a un repositorio de GitHub (puede ser privado).
   - Si nunca lo has hecho: crea un repo vacío en https://github.com/new,
     luego en esta carpeta:
     ```bash
     git init
     git add .
     git commit -m "Sitio inicial de ADIKB'E"
     git branch -M main
     git remote add origin <URL-DE-TU-REPO>
     git push -u origin main
     ```
2. Entra a https://vercel.com y crea una cuenta gratis con tu correo o con GitHub.
3. Click en "Add New Project", elige el repositorio que acabas de subir.
4. Vercel detecta Astro automáticamente (Framework Preset: Astro). No necesitas
   cambiar nada, solo dar click en "Deploy".
5. En unos segundos tendrás tu sitio publicado en una URL gratis tipo
   `https://adikbe-web.vercel.app`.

Cada vez que hagas `git push` con cambios nuevos, Vercel vuelve a publicar el
sitio automáticamente — no hay que repetir estos pasos.

### Conectar un dominio propio más adelante

Cuando tengan presupuesto para un dominio (ej. `adikbe.org`, ronda los
$10-15 USD al año en registradores como Namecheap o Cloudflare Registrar):

1. Cómpralo en el registrador que prefieran.
2. En el proyecto de Vercel, ve a **Settings → Domains** y agrega el dominio.
3. Vercel te da 1-2 registros DNS (tipo A o CNAME) para agregar en el panel
   del registrador donde compraron el dominio.
4. Una vez propagado el DNS (puede tardar hasta 24h), actualiza también
   `site` en `astro.config.mjs` con el dominio nuevo, para que el sitemap y
   las etiquetas SEO usen la URL correcta.

## Qué falta / ideas para después

- Reemplazar `/favicon.svg` por un logo real de ADIKB'E en PNG/SVG.
- Agregar una imagen para compartir en redes (Open Graph, 1200x630px) en
  `public/images/og-adikbe.jpg` y actualizar la referencia en `Layout.astro`.
- Fotos reales de las jornadas de reforestación, huertos y actividades
  comunitarias (hay espacio pensado para una galería en Equipo y Aliados).
- Cuando definan cómo recibir donaciones formalmente (cuenta bancaria,
  PayPal, etc.), se puede agregar esa información directamente en
  `/contacto/`.
