# Panel Overlay PWA

Publica esta carpeta en HTTPS para instalar la aplicación. OBS: fuente de navegador 1280 × 720, enlace de obs.html copiado desde la pestaña OBS.

Pestañas: Partido, Equipos, Anunciantes, OBS. Marcador, cronómetro, logo y anuncios conservan las ubicaciones originales. Ya no hay ajustes de posición ni parámetros de diseño en el enlace. Los períodos se mantienen dentro del manejo de Partido; no se añade otra pestaña.

## Activar la administración de anunciantes en Supabase

1. En el proyecto Supabase existente, abre SQL Editor y ejecuta supabase/setup.sql. Crea la tabla de anuncios, el bucket público overlay-sponsors y permisos de administración.
2. En Authentication → Users crea un usuario con correo y contraseña para el operador. Copia su UUID.
3. Ejecuta la última instrucción comentada del SQL sustituyendo USER_UUID_HERE por ese UUID. Solo los operadores autorizados pueden administrar anuncios. No pongas claves service_role en el navegador.
4. En Anunciantes inicia sesión con ese usuario. Sube una imagen y comprueba que aparece en otro navegador/OBS. La integración remota requiere estos pasos; no ha sido aplicada desde esta copia.

Los tres anuncios originales quedan precargados en la tabla como referencias a las imágenes incluidas en la PWA. Las imágenes nuevas se guardan en Supabase Storage y sus datos en overlay_sponsors. Eliminar un anuncio precargado quita su registro de la rotación; el archivo original permanece en la carpeta de distribución. Eliminar uno subido retira su archivo de Storage y su registro. Volver a ejecutar el SQL no restaura los anuncios borrados. Si falla una eliminación, el anuncio queda desactivado y se puede reintentar.

Formatos PNG/JPG/WebP, hasta 5 MB, dimensiones entre 100 × 50 y 4096 × 4096. Tamaño recomendado 964 × 300; presentación en una caja fija de 482 × 150 sin recortar. Cada anuncio activo dura 10 segundos; el ciclo comienza al abrir OBS y se repite cada 10 minutos. Hasta 60 anuncios activos por ciclo de 10 minutos. La lista se consulta cada 5 segundos sin necesitar recargar ni copiar otra vez el enlace. Desactivar conserva la imagen para usarla después.

Sin tabla o sin conexión inicial se muestran las tres imágenes originales; después de conectar, una lista vacía se respeta y no muestra anuncios. El marcador conserva la conexión y fila id=1 originales. Todos los paneles conectados a esa fila controlan el mismo partido. Las acciones locales sin internet no llegan a OBS en otro dispositivo hasta recuperar conexión. No se modificaron las políticas originales del marcador.

La sintaxis y las pruebas locales del módulo de anunciantes se verifican antes de entregar. La configuración SQL y las operaciones reales de Storage requieren acceso administrativo y verificación en tu proyecto.
