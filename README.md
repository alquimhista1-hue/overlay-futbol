# Panel Overlay

Abre index.html desde un servidor web. Para instalar la PWA, publica el proyecto completo con HTTPS. La entrada de OBS sigue siendo obs.html.

## Organización

- index.html: panel de control.
- obs.html: overlay para OBS.
- assets/css/: estilos.
- assets/js/: lógica del panel y anunciantes.
- assets/images/logos/: logos.
- assets/images/sponsors/: los tres anuncios originales.
- assets/icons/: iconos de instalación.
- assets/audio/: reservado para sonidos futuros.
- supabase/setup.sql: configuración de base de datos y Storage.
- docs/LEEME.md: instrucciones de instalación y administración.
- manifest.webmanifest y sw.js: archivos de PWA, conservados en la raíz por su alcance.

Las imágenes nuevas de anunciantes se guardan en Supabase Storage. Las referencias originales en la base de datos siguen funcionando después de esta reorganización. No hace falta ejecutar SQL otra vez ni cambiar el enlace de OBS.
