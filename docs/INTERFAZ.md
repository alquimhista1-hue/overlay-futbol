# Flujo de la interfaz

Acceso: CDN Studio, usuario o teléfono y contraseña. El nombre solo se solicita al crear cuenta. Al entrar se abre Inicio.

Inicio: botones para las tres herramientas. No muestra historial ni mensajes de lista vacía.

Diseños: Vista previa contiene titular, lienzo y descarga PNG. Configuración permite subir la foto y una plantilla PNG opcional; la plantilla CDN viene cargada por defecto. No hay categoría, guardado en cuenta ni historial de diseños en esta interfaz. Los diseños anteriormente guardados no se borran de la cuenta.

Cotizaciones: Actualizar datos contiene cliente, servicios/precios y páginas/imágenes. Configuración de datos contiene alcance, logo y textos/firma; Guardar configuración conserva esos valores para nuevas cotizaciones, en el archivo privado del usuario settings/quotation.json. Guardar cotización conserva el documento con el nombre del cliente y prepara uno vacío con esa misma configuración. La lista de cotizaciones guardadas aparece en Cotizar; tocar un nombre abre Previsualización y permite descargar imagen o PDF. Nueva cotización descarta el borrador actual, previa confirmación si tiene cambios, sin borrar cotizaciones guardadas.

Los módulos calculan su altura y usan el desplazamiento de la página principal. No se necesita ejecutar SQL ni cambiar la función de registro por esta reorganización.

Verificación: sintaxis, IDs y rutas locales revisados; navegación, configuración y guardado/reapertura probados con almacenamiento simulado local. El exportador informó PDF descargado de dos páginas. La comprobación automática del evento de descarga no obtuvo el archivo, por lo que no se inspeccionó su contenido. No se usaron cuentas ni datos reales en estas pruebas.
