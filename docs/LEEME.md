# Panel Overlay

Publica la carpeta completa con HTTPS. Panel: index.html. Fuente de navegador de OBS: obs.html, 1280 × 720.

## Anunciantes sin inicio de sesión

Para un proyecto Supabase ya configurado, ejecuta supabase/enable-public-ads.sql en SQL Editor. Para un proyecto nuevo, ejecuta supabase/setup.sql. No se necesitan correo, contraseña ni usuarios administradores. Los permisos permiten a cualquier persona con acceso a la API gestionar anuncios; el enlace no es una contraseña.

Las imágenes se guardan en Storage, bucket overlay-sponsors. La tabla overlay_sponsors guarda sus nombres, rutas y estado activo. Formatos PNG/JPG/WebP, hasta 5 MB; tamaño recomendado 964 × 300. OBS consulta la lista cada 5 segundos; muestra cada anuncio activo durante 10 segundos en un ciclo de 10 minutos. Eliminar retira la imagen subida de Storage y su registro. Editar permite cambiar el nombre o reemplazar la imagen.

Los tres anuncios originales ya no se precargan ni se muestran. Sus archivos locales se conservan en assets/images/sponsors para subirlos manualmente. supabase/remove-original-ads.sql elimina solamente sus registros antiguos.

La tabla de administradores de la configuración anterior ya no interviene en las nuevas políticas. No se borran usuarios, otras tablas ni otros buckets. La modificación de permisos se aplica únicamente al ejecutar el SQL en Supabase.
