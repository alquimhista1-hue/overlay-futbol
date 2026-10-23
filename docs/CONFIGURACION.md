# Activación de CDN Studio

La carpeta completa es un proyecto independiente. Usa index.html como entrada y publica toda la carpeta en GitHub/Vercel con HTTPS. No subas las carpetas ANTIGUO.

## Supabase

1. Abre el proyecto Supabase existente. En SQL Editor ejecuta supabase/01-studio.sql. Crea tablas studio_* y dos buckets, sin tocar los datos del panel anterior.
2. En Authentication → URL Configuration establece Site URL en el dominio donde publicarás CDN Studio. Añade la URL completa de index.html a Redirect URLs. Añade localhost solo si vas a probar en tu computadora.
3. Activa Email en Authentication → Providers. Configura un servicio SMTP para los correos de confirmación y recuperación antes de invitar usuarios reales. Si dejas confirmación de correo activada, el usuario debe confirmar antes de entrar.
4. Para Google: crea un cliente OAuth de tipo aplicación web en Google Cloud. Configura la pantalla de consentimiento, los dominios y la URL callback que indica Supabase. Copia Client ID y Client Secret a Authentication → Providers → Google. El secreto se guarda en Supabase, nunca en GitHub. Si Google está en modo de prueba, añade los usuarios de prueba; para acceso general completa su configuración de publicación.
5. assets/js/config.js contiene la URL y clave pública del proyecto anterior. Es válido que sean públicas; las políticas del SQL son las que separan los datos. Nunca añadas claves service_role a esta carpeta.

## Verificación obligatoria antes de abrir registros

- Crea dos cuentas de prueba distintas. Guarda un diseño, una cotización y un anuncio en cada una. Confirma desde una ventana privada que ninguna ve los datos de la otra.
- Repite con teléfono y computadora usando la misma cuenta: debe aparecer el mismo historial.
- Prueba confirmación de correo, recuperación de contraseña y Google con las URLs definitivas.
- En Transmisión → OBS copia el enlace y úsalo en una fuente de navegador de 1280 × 720. Ese enlace permite ver el overlay sin iniciar sesión y no permite modificarlo. Regenerarlo invalida el anterior.
- Verifica las descargas PNG y PDF con una cotización de varias páginas y el PNG de diseño con una fotografía.

## Qué se guarda

Perfiles, metadatos de trabajos y control de transmisión: tablas studio_*. Diseños y cotizaciones completos (incluidas sus imágenes): archivos JSON del bucket privado studio-private, organizados por UUID del propietario. Logos del perfil también son privados. Imágenes de anunciantes: bucket público studio-files, con escritura restringida a la carpeta del propietario. El overlay consulta únicamente los datos autorizados por su token.

El editor de diseños conserva la plantilla CDN recibida. Cambiar el logo del perfil se aplica al cotizador; cambiar la marca dibujada dentro de la plantilla requiere editar esa plantilla.

## Datos anteriores

No se importan automáticamente datos de las aplicaciones antiguas ni se cambian sus permisos públicos. Conserva sus carpetas hasta comprobar esta versión. Los datos locales del cotizador anterior están en el navegador, no dentro de sus archivos: expórtalos antes de borrar sus datos del navegador. No elimines las tablas antiguas hasta decidir qué historial necesitas migrar y a qué cuenta pertenece.

La implementación local no configura automáticamente Supabase, Google Cloud, SMTP ni Vercel. Las pruebas de cuentas y servicios externos solo se completan después de esa configuración.
