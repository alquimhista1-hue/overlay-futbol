# Equipo CDN Escuintla

Cada cuenta conserva su propio marcador, equipos, cronómetro, cotizaciones y enlace OBS. El catálogo de imágenes es común. Cada cuenta elige su propia selección en Mi overlay; subir un anuncio lo añade solamente al overlay de quien lo sube. Buscar anuncios permite añadir imágenes del catálogo, una por una. Desactivar o Quitar modifica solo la selección del usuario, no la de otros. Quitar conserva la imagen en el catálogo para poder reutilizarla. Editar la imagen del catálogo está limitado a quien la subió; si se reutiliza en otros overlays, esas selecciones usan esa misma imagen. La rotación conserva 10 minutos y 10 segundos por anuncio seleccionado.

## Activación

Ejecuta supabase/02-shared-advertisers.sql en el proyecto OVERLAY, una sola vez para los proyectos existentes. No elimina anuncios ni cambia las políticas de marcadores, documentos, perfiles o enlaces. Las instalaciones nuevas ejecutan 01-studio.sql, que ya incluye este cambio.

Publica todos los archivos actualizados del proyecto. La función studio-register no cambia.

## Anuncios anteriores

El panel anterior aún contiene MuniEscuintla, JyM y Taquera. En Transmisión → Anunciantes pulsa Recuperar anuncios del panel anterior. Copia las imágenes al almacenamiento nuevo y crea sus referencias compartidas. No borra la lista anterior. Los identificadores de importación evitan duplicar anuncios al repetir el proceso; después de recuperarlos todos pueden encontrarlos en Buscar anuncios y cada uno decide cuáles añadir. Esta recuperación requiere la sesión de un trabajador y no se ejecuta desde SQL.

## Cotizaciones

El negocio es CDN Escuintla. El nombre de acceso del empleado no se usa como firmante. Se restaura la firma y los datos originales de la aplicación recibida. Los borradores y configuraciones de versiones anteriores sin companyVersion se ajustan en memoria a la identidad original; no se borran sus archivos. Después puedes modificar la firma y los textos en Configuración de datos y guardar una nueva configuración.

PNG de diseños: 1080 × 1080 píxeles, sin depender del tamaño de la vista previa. En cotizaciones los textos del documento y del PDF se aumentaron. Si hay demasiado contenido para una hoja, el exportador lo avisa en lugar de cortar la firma. Ampliar hoja abre una vista ampliable.
