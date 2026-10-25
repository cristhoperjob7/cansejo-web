# Cansejo — sitio web

Landing page de Juan Cansejo (construcción, electricidad y remodelaciones).
Sitio **estático**: HTML + CSS + JS sin dependencias, sin build y **sin base de datos**.

```
index.html              Página única (todas las secciones)
assets/css/styles.css   Estilos y animaciones
assets/js/main.js       Menú móvil, scroll, formulario
assets/img/             Imágenes optimizadas (WebP) + favicon + imagen para compartir
404.html                Página de error
robots.txt, sitemap.xml SEO
_headers, vercel.json   Caché y seguridad (Netlify/Cloudflare y Vercel)
```

## Probar en local

```bash
python3 -m http.server 8080      # o: npx serve .
# abrir http://localhost:8080
```

## Antes de publicar (checklist)

1. **Dominio:** reemplazar `https://TU-DOMINIO.cl` por el dominio real en
   `index.html` (canonical, og:url, og:image, JSON-LD), `robots.txt` y `sitemap.xml`.
   Buscar con: `grep -rn "TU-DOMINIO" .`
2. **Formulario:** ver la sección siguiente.
3. **Teléfono / WhatsApp:** está en `index.html` (botón flotante, `data-whatsapp` del formulario y JSON-LD): `56972433962`.
4. **Fotos nuevas:** exportar en WebP (≈ 900×1200 px, 3:4), guardarlas en `assets/img/` y copiar un bloque `<figure class="proj">` en la sección Trabajos.
5. Probar la página compartida en WhatsApp para verificar la imagen de vista previa.

## Formulario de contacto

Funciona de dos formas, según el atributo `data-endpoint` del `<form id="contact-form">`:

- **Vacío (configuración actual):** al enviar, se abre WhatsApp con el mensaje ya escrito
  (nombre, servicio, detalle y teléfono). Juan lo recibe directo en su celular.
- **Con una URL:** envía los datos por `fetch` (JSON) a un servicio de formularios y
  muestra "¡Mensaje enviado!". Opciones gratuitas: [Formspree](https://formspree.io)
  o [Web3Forms](https://web3forms.com). Ejemplo Formspree:
  `data-endpoint="https://formspree.io/f/XXXXXXXX"`.
  (Web3Forms pide además un campo `access_key`; se agrega al `body` en `main.js`.)

Incluye validación, campo anti-spam invisible (honeypot) y mensajes accesibles.

## Despliegue

Cualquiera de estas opciones sirve la carpeta tal cual (sin comando de build):

| Servicio | Pasos |
|---|---|
| **Netlify** | Arrastrar la carpeta a app.netlify.com/drop, o conectar el repo (Publish directory: `.`) |
| **Cloudflare Pages** | Conectar el repo · Build command: *(vacío)* · Output directory: `/` |
| **Vercel** | Importar el repo · Framework: *Other* · sin build |
| **Hosting tradicional** | Subir el contenido por FTP a `public_html/` |

Luego apuntar el dominio (registros DNS que indique el servicio) y activar HTTPS.

## Notas técnicas

- **Animaciones al scroll:** CSS nativo (`animation-timeline: view()`); en navegadores
  que no lo soportan, `main.js` usa `IntersectionObserver`. Se desactivan con
  "reducir movimiento" del sistema.
- **Tipografías:** Google Fonts (Archivo y Manrope). Para máxima privacidad y velocidad
  se pueden descargar y servir desde `assets/fonts/`.
- **Responsive:** menú desplegable bajo 960 px; galería 3 → 2 → 1 columnas.
- **Imágenes:** todas con `width`/`height` (sin saltos de diseño) y `loading="lazy"`,
  excepto la foto principal.
- La cara de la persona en el "Muro en ladrillo" y la patente de la camioneta están
  difuminadas en los archivos originales de `assets/img/`.
