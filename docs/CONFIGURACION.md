# Configuración de CDN Studio

## Base de datos y archivos

Ejecuta supabase/01-studio.sql en el proyecto Supabase utilizado por la aplicación. Si ya lo ejecutaste, no hace falta repetirlo por el cambio de acceso. Las tablas studio_* y los buckets studio-files y studio-private separan los datos por usuario.

## Registro y acceso

Consulta ACCESO-SIMPLE.md. El registro actual pide nombre, usuario o teléfono y contraseña. No se utiliza Google ni un correo real para cuentas nuevas. Publica la función studio-register según ACCESO-SIMPLE.md; confirma internamente las cuentas sin enviar correos. No es necesario desactivar globalmente la confirmación de correo.

## Publicación

Sube el contenido completo de CDN Studio a la raíz de GitHub y publícalo en Vercel como sitio estático. No necesita compilación. No subas carpetas ANTIGUO. assets/js/config.js contiene únicamente la URL y clave pública de Supabase; nunca añadas una clave administrativa al navegador.

## Pruebas antes de uso general

Registra dos cuentas diferentes. Cada una debe ver únicamente sus diseños, cotizaciones, anunciantes y transmisión. Abre la misma cuenta en teléfono y computadora para comprobar el historial compartido. Comprueba guardar/reabrir trabajos y descargar PNG/PDF. En Transmisión copia el enlace OBS y úsalo como fuente de navegador de 1280 × 720. Regenerarlo invalida el anterior.

Los datos de las aplicaciones originales no se importan automáticamente. Conserva las carpetas anteriores hasta decidir qué información migrar. La plantilla de diseños conserva la marca CDN recibida; cambiarla requiere editar su imagen de plantilla.

La aplicación necesita internet para iniciar sesión y guardar trabajos en la cuenta. La configuración y las pruebas de cuentas reales requieren tu proyecto Supabase; no se activan por copiar archivos a GitHub.
