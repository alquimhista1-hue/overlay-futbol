# CDN Studio

Una PWA con cuentas personales y herramientas de transmisión, diseños de noticias y cotizaciones.

## Estructura

```text
index.html                  Inicio de sesión y aplicación
assets/css/                 Estilos comunes
assets/js/                  Configuración, cuentas y puente de módulos
assets/icons/               Iconos de instalación
modules/transmision/        Marcador, cronómetro, equipos, anunciantes y OBS
modules/disenos/            Foto, titular y descarga PNG
modules/cotizaciones/       Editor y exportación de imagen/PDF
supabase/01-studio.sql      Tablas, almacenamiento y permisos por usuario
docs/CONFIGURACION.md       Activación de Supabase, Google, correo y publicación
manifest.webmanifest        Instalación de la PWA
sw.js                       Archivos de aplicación sin conexión
vercel.json                 Configuración de publicación
```

No necesita compilarse ni instalar dependencias para publicarse: sube el contenido completo a un repositorio GitHub y conéctalo a Vercel como proyecto estático. Lee docs/CONFIGURACION.md antes de usar cuentas reales. La aplicación necesita internet para iniciar sesión y guardar trabajos en la cuenta.

Cada cuenta tiene sus propios trabajos, perfil y transmisión. Los enlaces OBS son públicos de solo lectura y pueden regenerarse. Las carpetas originales conservadas fuera de este proyecto son respaldo y no se suben al repositorio.
