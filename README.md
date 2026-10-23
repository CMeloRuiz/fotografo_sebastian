# Sebastián Sisa — sitio web y panel de autogestión

Portafolio de fotografía y video para eventos sociales, con un panel propio
para que el fotógrafo suba y organice su trabajo sin depender de nadie.

Migración del sitio original en HTML/CSS/JS a **React + Vite** (frontend) y
**Node + Express + Supabase** (backend), conservando paleta, logo y contenido.

---

## Índice

- [Qué hay en cada carpeta](#qué-hay-en-cada-carpeta)
- [Requisitos](#requisitos)
- [Puesta en marcha en local](#puesta-en-marcha-en-local)
- [Variables de entorno](#variables-de-entorno)
- [Supabase: base de datos y almacenamiento](#supabase-base-de-datos-y-almacenamiento)
- [El panel de administración](#el-panel-de-administración)
- [Fotos de clientes: la regla que no se rompe](#fotos-de-clientes-la-regla-que-no-se-rompe)
- [Rendimiento](#rendimiento)
- [Despliegue de la demo en Render](#despliegue-de-la-demo-en-render)
- [Despliegue en producción en Hostinger](#despliegue-en-producción-en-hostinger)
- [Migración desde el sitio antiguo](#migración-desde-el-sitio-antiguo)
- [Cambios de redacción](#cambios-de-redacción)
- [Qué queda pendiente](#qué-queda-pendiente)

---

## Qué hay en cada carpeta

```
frontend/      React + Vite. Sitio público y panel (/admin).
backend/       Express. API pública de lectura y API privada del panel.
scripts/       Optimización de las imágenes públicas del sitio antiguo.
legacy/        El sitio original en HTML/CSS/JS, intacto, como referencia.
images/        Imágenes originales. NO se versionan (ver .gitignore).
docs/          Guion de la galería de ejemplo con IA.
```

Dentro de `frontend/src`:

```
components/layout/   Header, Footer, Layout, botón flotante de WhatsApp
components/ui/       SmartImage, Lightbox, Reveal, Icon, SectionHeading...
components/home/     Las secciones de la portada
components/admin/    AdminLayout, Sortable, Dropzone, PhotoEditor...
pages/               Una página por ruta; pages/admin/ es el panel
context/             SiteDataProvider, AuthProvider, ToastProvider
hooks/               useReveal, useSeo, useLockBodyScroll
lib/                 Cliente de la API y utilidades
data/                Contenido estático y manifiesto de imágenes
styles/              variables.css (tokens), global.css, admin.css, fonts.css
```

---

## Requisitos

- **Node.js 20 o superior** (probado con 22.15)
- Una cuenta de **Supabase** (el plan gratuito alcanza para empezar)
- Opcional: un SMTP para el aviso por correo del formulario de contacto

---

## Puesta en marcha en local

```bash
# 1. Optimizar las imágenes públicas del sitio antiguo
cd scripts
npm install
npm run optimize
```

Esto lee `images/` y deja en `frontend/public/media/` las versiones AVIF y
WebP en cinco anchos, el JPEG de respaldo y el manifiesto
`frontend/src/data/images.json`. **Solo procesa las imágenes públicas**; aborta
con un error si alguna ruta apunta a fotos de clientes.

```bash
# 2. Backend
cd ../backend
npm install
cp .env.example .env     # y complétalo (ver abajo)
npm run dev              # http://localhost:4000
```

```bash
# 3. Frontend
cd ../frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:4000
npm run dev              # http://localhost:5173
```

El sitio público funciona **aunque el backend no esté levantado**: si la API no
responde, usa el contenido estático que viene en el bundle. El panel sí lo
necesita.

### Comandos útiles

| Carpeta | Comando | Qué hace |
|---|---|---|
| `frontend` | `npm run dev` | Servidor de desarrollo |
| `frontend` | `npm run build` | Build de producción en `dist/` |
| `frontend` | `npm run preview` | Sirve el build para probarlo |
| `backend` | `npm run dev` | API con recarga automática |
| `backend` | `npm start` | API en modo producción |
| `backend` | `npm run seed` | Carga el contenido inicial |
| `backend` | `npm run create-admin` | Crea o actualiza el usuario del panel |
| `backend` | `npm run verify` | Prueba de punta a punta los flujos que escriben datos |
| `scripts` | `npm run optimize` | Regenera las imágenes optimizadas |

---

## Variables de entorno

### `backend/.env`

| Variable | Obligatoria | Para qué |
|---|---|---|
| `NODE_ENV` | no | `production` activa cookies `Secure` y `SameSite=None` |
| `PORT` | no | Puerto de la API (4000 por defecto) |
| `SUPABASE_URL` | **sí** | URL del proyecto (Settings → Data API) |
| `SUPABASE_SERVICE_ROLE_KEY` | **sí** | Clave del servidor: la `secret key` (`sb_secret_…`) o la antigua `service_role`. **Nunca** la publishable/anon, y nunca en el navegador |
| `SUPABASE_STORAGE_BUCKET` | no | Bucket de fotos (`photos` por defecto) |
| `JWT_SECRET` | **sí** | Firma la sesión del panel |
| `JWT_TTL` | no | Duración de la sesión (`7d` por defecto) |
| `CORS_ORIGINS` | no | Orígenes permitidos, separados por comas |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` | no | Aviso por correo del formulario |
| `MAIL_FROM` / `MAIL_TO` | no | Remitente y destinatario de ese aviso |
| `MAX_UPLOAD_MB` | no | Tamaño máximo por foto (25 por defecto) |
| `MAX_UPLOAD_FILES` | no | Fotos por subida (20 por defecto) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | solo seed | Usuario inicial del panel |

Genera el `JWT_SECRET` con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `frontend/.env`

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL del backend. Vacío = sitio estático sin panel |
| `VITE_DEV_API_TARGET` | Destino del proxy `/api` en desarrollo |
| `VITE_SITE_URL` | URL pública, para sitemap y Open Graph |

> Las variables `VITE_*` se incrustan en el bundle y son públicas. No pongas
> ningún secreto ahí.

---

## Supabase: base de datos y almacenamiento

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta entero `backend/db/schema.sql`. Es idempotente:
   puedes volver a correrlo sin romper nada.
3. Copia la URL desde **Settings → Data API** y crea una clave de servidor en
   **Settings → API Keys → Secret keys → New secret key**. Pega las dos en tu
   `.env`. La clave solo se muestra una vez.

   > Supabase sustituyó `anon`/`service_role` por claves *publishable* y
   > *secret*, y retirará las antiguas a finales de 2026. Las dos funcionan
   > hoy; en un proyecto nuevo usa la *secret key*. Las nuevas son cadenas
   > opacas, no JWT, así que requieren `@supabase/supabase-js` reciente.
4. El bucket `photos` se crea solo la primera vez que arranca el backend. Si
   prefieres crearlo a mano: **Storage → New bucket**, nombre `photos`, público.
5. Carga el contenido inicial:

```bash
cd backend
npm run seed
```

El seed toma los textos del mismo archivo que usa el frontend
(`frontend/src/data/siteContent.js`), así que no hay dos copias que se puedan
desincronizar. Crea también el usuario del panel si definiste `ADMIN_EMAIL` y
`ADMIN_PASSWORD`.

### Seguridad de la base de datos

Las tablas tienen **Row Level Security** activo. El backend usa la clave
`service_role`, que la ignora, porque es él quien decide la autorización. Las
políticas existen como red de seguridad: si algún día alguien consulta con la
clave `anon` desde el navegador, solo podrá **leer lo publicado**, nunca
escribir, y `contact_messages` y `admins` quedan completamente fuera de
alcance.

---

## El panel de administración

Está en `/admin`. Si entras sin sesión te manda al acceso.

**Qué puede hacer el fotógrafo:**

- **Álbumes**: crear, editar, publicar o dejar en borrador, destacar para la
  portada, reordenar arrastrando y eliminar (borra también sus fotos del
  almacenamiento).
- **Fotos**: subir varias a la vez arrastrando o desde el carrete del celular,
  con barra de progreso por archivo; reordenar arrastrando; elegir portada;
  editar título y descripción; recortar y girar; borrar de una en una o por
  selección múltiple.
- **Contenido**: textos de la portada, "Sobre mí" (con su foto), servicios,
  testimonios, datos de contacto, WhatsApp y redes sociales. También puede
  cambiar la foto de fondo de la portada.
- **Mensajes**: las solicitudes del formulario, con estado y un botón que abre
  WhatsApp con el mensaje ya escrito.
- **Mi cuenta**: cambiar su contraseña.

**Credenciales de prueba.** No hay ninguna por defecto: se crean a propósito
para evitar que una contraseña conocida llegue a producción. Créalas tú:

```bash
cd backend
node db/createAdmin.js sebastian@sebastiansisa.com "una frase larga que recuerdes"
```

El mismo comando sirve para **recuperar el acceso** si olvida la contraseña: si
el correo ya existe, actualiza el hash.

**Para crear el usuario real del fotógrafo** en producción, ejecuta ese mismo
comando contra el `.env` de producción, o deja que él mismo cambie la
contraseña desde *Mi cuenta* en su primer ingreso.

### Qué pasa al subir una foto

`backend/src/services/imagePipeline.js` hace, sin que el fotógrafo tenga que
saberlo:

1. Corrige la orientación EXIF (sin esto, las verticales salen acostadas).
2. **Descarta todos los metadatos, incluido el GPS.** Las fotos de un evento
   social no deben publicar dónde vive nadie.
3. Genera AVIF y WebP en 480, 640, 800, 1200 y 1920 px, más un JPEG de
   respaldo y una miniatura cuadrada.
4. Genera el placeholder borroso y guarda las dimensiones reales, para que no
   haya saltos de maquetación al cargar.

---

## Fotos de clientes: la regla que no se rompe

Las fotos de los álbumes del sitio antiguo son **privadas de cada cliente**.

### Lista A — públicas, reutilizadas

| Archivo | Uso |
|---|---|
| `images/logo.png`, `logo_2.png`, `logo_3.png` | Logo y favicon |
| `images/background.jpg` | Fondo de la portada |
| `images/photographer_profile_1.jpg` | Retrato de Sebastián |
| `images/photographer_profile_2.jpg` | Segundo retrato |
| `images/servicios/eventos.jpg` | Tarjeta de servicio |
| `images/servicios/videografia.jpg` | Tarjeta de servicio |
| `images/servicios/retrato.jpg` | Tarjeta de servicio |
| `images/servicios/comercial.jpg` | Tarjeta de servicio |

### Lista B — privadas, excluidas

| Carpeta | Contenido |
|---|---|
| `images/portafolio/` | 5 álbumes reales de clientes (177 MB) |
| `images/categories/` | 7 portadas de categoría, confirmadas como fotos de clientes (22 MB) |

**Ninguna foto de la lista B** se copió a `frontend/public`, ni al backend, ni
al seed, ni al almacenamiento, ni a ningún commit, ni se subió a Higgsfield ni
a ningún otro servicio externo. Sus carpetas están en `.gitignore` desde el
primer commit y los archivos siguen intactos en disco.

El script `scripts/optimize-images.cjs` tiene una comprobación que **aborta**
si alguna ruta a procesar contiene `portafolio/`, `categories/` o
`categories_test/`.

### Sin clasificar y sin usar

`images/background_1` a `background_17`, `images/categories_test/` y
`images/video_ejemplo.mp4` no los referenciaba el sitio antiguo. Quedaron
fuera por precaución.

---

## Rendimiento

### Antes y después

Lighthouse móvil, mismo equipo, mismo método (`--throttling-method=simulate`):

| Métrica | Antes | Después |
|---|---|---|
| **Performance** | 61 | **93** |
| **Accesibilidad** | 91 | **100** |
| **Buenas prácticas** | 100 | **100** |
| **SEO** | 91 | **100** |
| First Contentful Paint | 4,4 s | **1,5 s** |
| **Largest Contentful Paint** | **77,0 s** | **2,8 s** |
| Speed Index | 6,4 s | **2,5 s** |
| Cumulative Layout Shift | 0 | **0** |
| **Peso de la portada** | **70,6 MB** | **278 KB** |

En escritorio: **99 / 100 / 100 / 100**, con LCP de 0,8 s.

### Cuál era el problema

No era el JavaScript: el *total blocking time* del sitio antiguo ya era de 0 ms.
Eran las imágenes. La portada cargaba **70 MB de JPEG sin optimizar**:
`servicios/eventos.jpg` pesaba 20,2 MB a 7900×5274 px para mostrarse en un
recuadro de 250 px de alto. Sumado a eso, cuatro `@import` encadenados a Google
Fonts dentro del CSS bloqueaban el render 3,4 s, y Font Awesome completo venía
de un CDN para pintar diez iconos.

### Qué se hizo

- **Pipeline de imágenes** con `sharp`: AVIF y WebP en cinco anchos con
  `srcset`/`sizes`, JPEG de respaldo, miniatura y placeholder borroso. Las 54 MB
  de imágenes públicas pasaron a 5,5 MB repartidos en variantes, de las que el
  navegador descarga solo la que necesita.
- `loading="lazy"` y `decoding="async"` en todo menos el hero, que lleva
  `fetchpriority="high"` y un `<link rel="preload">` en AVIF.
- `width` y `height` en cada imagen: CLS de 0.
- **Fuentes autoalojadas** (Oswald y Outfit, subconjuntos latinos) con
  `font-display: swap` y precarga. Fuera los cuatro `@import`.
- **Font Awesome eliminado**: los iconos son SVG inline en el bundle.
- **Code splitting por ruta** con `React.lazy`. El panel va en su propio trozo:
  un visitante nunca lo descarga.
- React y el router en un chunk aparte, que se cachea entre despliegues.

---

## Despliegue de la demo en Render

### Backend (Web Service)

1. **New → Web Service**, conecta el repositorio.
2. Root directory `backend`, build `npm install`, start `npm start`.
3. Variables de entorno: todas las de `backend/.env.example`, con
   `NODE_ENV=production` y `CORS_ORIGINS` apuntando a la URL del frontend.
4. Anota la URL que te da Render, por ejemplo
   `https://sebastian-sisa-api.onrender.com`.

> El plan gratuito de Render duerme el servicio tras un rato sin tráfico y la
> primera petición después tarda unos 50 segundos. El sitio público no se cae
> por eso —muestra el contenido estático—, pero el panel sí tarda en abrir.
> Si vas a enseñar la demo en vivo, entra un minuto antes.

### Frontend (Static Site)

1. **New → Static Site**, mismo repositorio.
2. Root directory `frontend`, build `npm install && npm run build`,
   publish directory `dist`.
3. Variable `VITE_API_URL` con la URL del backend.
4. En **Redirects/Rewrites** añade: origen `/*`, destino `/index.html`, tipo
   **Rewrite**. Sin esto, recargar `/portafolio` da 404. (El archivo
   `public/_redirects` ya lo cubre en Netlify; en Render se configura ahí.)

Luego vuelve al backend y pon la URL definitiva del frontend en `CORS_ORIGINS`.

---

## Despliegue en producción en Hostinger

El cliente ya tiene dominio y hosting pagados. **El dominio no se toca.**

**Plan confirmado (23 de octubre de 2026):** hosting **compartido**, servidor
`server1849` en Boston (EE. UU.), 10 GB de disco, 1 núcleo, 1024 MB de RAM,
25 PHP workers, 1 sitio web, 100 GB de transferencia. Dominio
`sebastiansisa.com`, IP `46.202.183.232`, DNS ya apuntando a Hostinger.

Que el panel hable de *PHP workers* y *máximo de procesos* es lo que delata que
es compartido: ahí no corren procesos persistentes de Node. Hostinger sí ofrece
Node.js, pero en los planes Business y Cloud hacia arriba, y este queda por
debajo. **Para confirmarlo en un segundo:** hPanel → *Avanzado*. Si no aparece
una entrada **Node.js**, está decidido.

👉 **Aplica la [variante C](#variante-c--hosting-compartido-solo-php):** el
frontend en Hostinger, el backend en Render. Las variantes A y B quedan abajo
como referencia por si algún día se sube de plan.

### Dimensionamiento

Las fotos no viven en Hostinger sino en Supabase, así que sus 10 GB y sus
100 GB de transferencia sobran: el hosting solo sirve el HTML, el CSS, el JS
y las imágenes fijas del sitio, que pesan 278 KB en total.

El límite real es Supabase. Medido sobre las imágenes ya optimizadas del
proyecto, **cada foto ocupa unos 635 KB** sumando sus cinco anchos en AVIF y
WebP, el JPEG de respaldo y la miniatura. En el gigabyte del plan gratuito
caben **unas 1.650 fotos**, que da para bastante; cuando se acerque, el salto
es a un plan de pago de Supabase, no a uno de Hostinger.

### Variante A — VPS (lo ideal)

Frontend y backend en el mismo servidor, Nginx como reverse proxy.

```bash
# En el servidor
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone <repo> /var/www/sebastiansisa
cd /var/www/sebastiansisa

# Backend
cd backend && npm ci --omit=dev
cp .env.example .env   # completar con los valores de producción
pm2 start src/server.js --name sebastiansisa-api
pm2 save && pm2 startup

# Frontend
cd ../frontend && npm ci
VITE_API_URL=https://sebastiansisa.com npm run build
sudo cp -r dist/* /var/www/sebastiansisa/public/
```

`/etc/nginx/sites-available/sebastiansisa`:

```nginx
server {
    listen 80;
    server_name sebastiansisa.com www.sebastiansisa.com;
    root /var/www/sebastiansisa/public;
    index index.html;

    # Las rutas del SPA las resuelve React, no el servidor
    location / {
        try_files $uri $uri/ /index.html;
    }

    # La API, al proceso de Node
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Las fotos tardan en subir desde el celular
        client_max_body_size 30M;
        proxy_read_timeout 300s;
    }

    # Los archivos con hash en el nombre no cambian nunca
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sebastiansisa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sebastiansisa.com -d www.sebastiansisa.com
```

Con `NODE_ENV=production` y todo bajo el mismo dominio, en `backend/src/middleware/auth.js`
conviene dejar la cookie como `SameSite=Lax` y `Secure`, que es más estricto que
el `None` que hace falta cuando frontend y API están en dominios distintos.

### Variante B — Hosting Cloud con Node

Algunos planes Cloud de Hostinger permiten aplicaciones Node desde hPanel. El
procedimiento es el mismo que en VPS pero sin tocar Nginx: se declara la
aplicación Node apuntando a `backend/src/server.js`, se cargan las variables de
entorno desde el panel y se sube el `dist/` del frontend a `public_html`.
Habría que verificar que el plan permite procesos persistentes.

### Variante C — Hosting compartido, solo PHP

El plan contratado no soporta Node, así que el backend no puede vivir en
Hostinger:

- El **frontend** sí: `frontend/dist/` a `public_html`, con el flujo de
  GitHub Actions de más abajo.
- El **backend** va a Render. La configuración está en
  [`render.yaml`](render.yaml), así que el servicio se crea leyendo ese
  archivo en vez de rellenar el formulario a mano.

#### La API va en un subdominio propio, no en la URL de Render

Esto no es cosmético. Si la API queda en `algo.onrender.com` mientras el sitio
está en `sebastiansisa.com`, la cookie de sesión es **de terceros**, y Safari
las bloquea de serie. El fotógrafo abriría el panel desde su iPhone y la
sesión no le duraría ni una pantalla.

Poniendo la API en `api.sebastiansisa.com`, para el navegador es *el mismo
sitio* —comparten dominio registrable— y la cookie pasa a ser de primera
parte. Funciona en todos los navegadores y además permite `SameSite=Lax`, que
es más estricto que `None`.

Por eso `COOKIE_SAMESITE` vale `lax` en `render.yaml`. Si alguna vez se usara
la URL de onrender.com directamente, habría que ponerlo en `none`; el código
soporta las dos y en ambos casos manda `Secure`.
- El `.htaccess` ya está resuelto: vive en [`frontend/public/.htaccess`](frontend/public/.htaccess),
  así que Vite lo copia a `dist/` en cada build y llega solo a `public_html`.
  Lleva las rutas del SPA, las redirecciones 301 del sitio antiguo, el caché
  y la compresión.

### Despliegue automático desde GitHub

Hostinger tiene su propio despliegue desde Git (**hPanel → Avanzado → Git**),
pero **no sirve para este repositorio**: hace un `git pull` y publica los
archivos tal cual, sin ejecutar el build. Aquí lo versionado es el código
fuente, no el sitio compilado, así que subiría `src/` y `package.json` a
`public_html` y el sitio no cargaría. Ese flujo sirve para sitios HTML planos
o WordPress, no para uno con build.

Por eso el build se hace en GitHub y a Hostinger solo viaja `frontend/dist/`.
El flujo está en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

> **Arranca en manual**, desde la pestaña *Actions* del repositorio, botón
> *Run workflow*. Es a propósito: mientras `public_html` tenga el sitio
> antiguo en vivo, un despliegue automático lo reemplazaría en el primer push,
> sin avisar y antes de que el backend esté listo. Cuando el sitio nuevo ya
> esté en producción, descomenta el bloque `push` del flujo y cada cambio en
> `frontend/` se desplegará solo.

**Antes del primer despliegue, haz una copia de `public_html`.** Desde hPanel,
en *Archivos → Administrador de archivos*, comprime la carpeta y descárgala.
El despliegue sobrescribe, y el sitio antiguo es lo único que hay si algo sale
mal.

Para activarlo hay que añadir en GitHub, en **Settings → Secrets and variables
→ Actions**:

| Dónde | Nombre | Valor |
|---|---|---|
| Secrets | `FTP_HOST` | La IP del hosting, **sin `ftp://`** (ver nota abajo) |
| Secrets | `FTP_USER` | El usuario FTP, con forma `uXXXXXXXXX` |
| Secrets | `FTP_PASSWORD` | La de hPanel. No se puede consultar; si no se recuerda, se cambia ahí mismo |
| Secrets | `FTP_REMOTE_DIR` | `/public_html/` |
| Variables | `VITE_API_URL` | `https://api.sebastiansisa.com` |
| Variables | `VITE_SITE_URL` | `https://sebastiansisa.com` |

Los tres primeros valores están en hPanel, en **Websites → Administrar →
Cuentas FTP**. No se escriben aquí: este repositorio es público, y el usuario
de FTP es la mitad de una credencial con permiso de escritura sobre el sitio.

> **El `ftp://` no va.** hPanel muestra el host como `ftp://sebastiansisa.com`,
> pero la acción de despliegue espera solo el nombre o la IP. Con el prefijo
> falla al conectar.

> En los planes con SSH, la contraseña FTP del dominio principal **es también
> la de SSH**: cambiar una cambia la otra.

Los tres primeros van como **Secrets**, no como Variables: dan acceso de
escritura al hosting. Los `VITE_*` van como Variables porque acaban dentro del
bundle y los ve cualquiera de todos modos.

---

## Migración desde el sitio antiguo

La estructura de URLs cambió. Para no perder el posicionamiento que ya tenga,
hay que redirigir las antiguas con **301** (permanente).

| URL antigua | URL nueva |
|---|---|
| `/index.html` | `/` |
| `/portafolio.html` | `/portafolio` |
| `/contacto.html` | `/contacto` |
| `/daniela.html` | `/portafolio` |
| `/dayana.html` | `/portafolio` |
| `/jimena_alejandro.html` | `/portafolio` |
| `/juanjose.html` | `/portafolio` |
| `/michelle.html` | `/portafolio` |

Los cinco álbumes antiguos apuntan al portafolio porque sus fotos eran privadas
y no se migraron: no existe una página equivalente a la que redirigir.

### En Apache (hosting compartido), antes del bloque del SPA

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^index\.html$ / [R=301,L]
  RewriteRule ^portafolio\.html$ /portafolio [R=301,L]
  RewriteRule ^contacto\.html$ /contacto [R=301,L]
  RewriteRule ^(daniela|dayana|jimena_alejandro|juanjose|michelle)\.html$ /portafolio [R=301,L]
</IfModule>
```

### En Nginx (VPS), dentro del `server`

```nginx
location = /index.html            { return 301 /; }
location = /portafolio.html       { return 301 /portafolio; }
location = /contacto.html         { return 301 /contacto; }
location ~ ^/(daniela|dayana|jimena_alejandro|juanjose|michelle)\.html$ {
    return 301 /portafolio;
}
```

### Lista de comprobación el día del cambio

1. Haz una copia del `public_html` actual antes de tocarlo.
2. Sube el nuevo `dist/` y el `.htaccess` con las redirecciones.
3. Comprueba una por una las ocho URLs antiguas: deben responder 301.
4. Sube el `sitemap.xml` nuevo a Google Search Console.
5. Revisa que `robots.txt` no bloquee nada (solo bloquea `/admin`).
6. Comprueba que las URLs del sitemap usen el dominio real: hay que cambiar
   `sebastiansisa.com` en `frontend/public/sitemap.xml` y `robots.txt` si el
   dominio definitivo es otro.

---

## Cambios de redacción

Solo se tocó lo que era un error o una contradicción. Todo lo demás está igual.

| Dónde | Antes | Ahora | Por qué |
|---|---|---|---|
| Sobre mí | "buscando que cada imagen **cuenta** una historia" | "**cuente**" | Error de concordancia |
| Sobre mí | "¿QUIEN SOY?" | "¿Quién soy?" | Faltaba la tilde |
| Pie de página | "Más de **una década** de experiencia" | "Fotografía y video para eventos sociales, retratos y contenido comercial" | **Se contradecía con el propio sitio**, que dice que tiene 20 años y empezó en 2023 |
| Todo el sitio | "Capturamos", "Narramos", "Nuestros servicios", "Síguenos" | "Capturo", "Narro", "Servicios", "Sígueme" | El sitio mezclaba plural de empresa con el "yo" de Sobre mí. Es un fotógrafo solo, y el trato cercano es parte de lo que vende |
| Portada | "Carrusel" como título de sección | "Cada celebración, con su propio lenguaje" | Era un texto de relleno que quedó publicado |
| Pie de página | "Copyright © 2025" | Año actual, calculado | Para que no envejezca |
| Portada | — | Subtítulo del hero, "Por qué elegirme", proceso de trabajo y cierre de contacto | Textos nuevos, escritos para la conversión |

### Decisiones de diseño

- **El carrusel infinito se eliminó.** Repetía las siete tarjetas dos veces en
  el HTML y animaba catorce imágenes a resolución completa sin parar, incluso
  fuera de pantalla. Ahora es una rejilla, que además se puede leer.
- **El hero ya no mide 2000 px fijos** ni usa `background-size: 100% 100%`, que
  deformaba la foto. Ocupa la pantalla y la imagen se recorta, no se estira.
- **Las cuñas verdes inclinadas se conservaron**, pero como pseudoelementos que
  no empujan el contenido.
- **Lightbox propio**, sin librerías: teclado, deslizar con el dedo, zoom,
  contador y precarga de la foto siguiente.
- **El panel tiene su propio lenguaje visual**: más denso, sin mayúsculas ni
  aire editorial, porque es una herramienta de trabajo. Comparte con el sitio
  solo el verde de la marca.

---

## Qué queda pendiente

### Necesita datos reales del cliente

Estos campos tienen valores heredados del sitio antiguo que parecen de ejemplo.
Todos se editan desde el panel, en *Contenido → Contacto y redes*:

- **Teléfono y WhatsApp**: `+57 321 123 4567`
- **Correo**: `info@fotografo.com`
- **Redes sociales**: en el sitio antiguo todos los enlaces eran `href="#"`.
  Mientras estén vacíos, los iconos no aparecen.
- **Testimonios**: los tres que hay son de ejemplo y están marcados como tales.

### Necesita una decisión

- **Plan de Hostinger**: de eso depende dónde vive el backend en producción.
- **Galería del portafolio**: está vacía a propósito. El guion completo para
  llenarla con imágenes de ejemplo generadas con IA, con prompts y costes, está
  en [`docs/galeria-de-ejemplo.md`](docs/galeria-de-ejemplo.md). No se gastó
  ningún crédito.

### Verificado y no verificado

**Verificado:** build de producción sin errores, Lighthouse en móvil y
escritorio, ausencia de desbordes horizontales en 360, 390, 768, 1024, 1440 y
1920 px, lightbox con teclado y contador, arranque del backend, rutas,
validación, guardas de sesión, manejo de errores y el flujo de acceso al panel
de punta a punta.

**Verificado contra Supabase real** (23 de octubre de 2026): los 32 pasos de
`npm run verify` pasan, y además se recorrió el panel en el navegador —entrar,
crear álbum, subir dos fotos con su barra de progreso, publicar, verlo en el
sitio público y borrarlo— comprobando que no quedan archivos huérfanos.

Esa prueba encontró dos bugs reales, los dos ya corregidos: el borrado dejaba
nueve de los doce archivos de cada foto en el almacenamiento, y un álbum recién
publicado tardaba un minuto en aparecer en el sitio.

**Pendiente:** el aviso por correo del formulario, que necesita credenciales
SMTP. Sin ellas el mensaje se guarda igual y se ve en el panel; solo no se
manda el correo.

Para repetir la comprobación está `npm run verify`, en `backend/`. Levanta el backend, apúntalo a
un Supabase real y ejecútalo: crea un administrador desechable y un álbum de
prueba, recorre los 32 pasos del flujo completo —sesión, subida con sus cinco
variantes, limpieza de EXIF, reordenar, portada, girar, publicar, formulario,
contenido, borrado y limpieza del storage— y borra todo lo que creó, pase lo
que pase. Informa paso por paso y sale con código 1 si algo falla.

```bash
cd backend && npm run dev          # en una terminal
cd backend && npm run verify       # en otra
```

Sirve igual contra el backend desplegado: `API=https://mi-api.onrender.com npm run verify`.

### Mejoras futuras

- **Galerías privadas con contraseña** para que cada cliente descargue sus
  fotos. Es lo que más valor le daría: resuelve la entrega, que hoy
  probablemente hace por WeTransfer o Drive.
- **Marca de agua opcional** al subir, configurable por álbum.
- **Blog** o bitácora de eventos, bueno para posicionamiento local.
- **Versión en inglés**, si llegan clientes de fuera.
- **Reserva de fecha** con señal, integrando pagos.
- **Un CDN delante del storage** cuando el volumen de fotos crezca.
