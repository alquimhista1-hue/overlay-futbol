# Registro sin Google, correo ni SMS

La pantalla pide nombre, usuario o teléfono y contraseña. Supabase Auth conserva las contraseñas y los UUID usados por los permisos. El teléfono no se verifica y no recibe códigos.

## Activar la función (una sola vez)

1. En Supabase abre Edge Functions → Deploy a new function → Via Editor.
2. Nombra la función studio-register.
3. Abre supabase/functions/studio-register/index.ts y copia todo su contenido en el editor de la función.
4. Publica la función. En sus ajustes desactiva Verify JWT / Enforce JWT Verification únicamente para studio-register: es un registro público que debe funcionar antes de iniciar sesión.
5. SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY se leen del entorno del servidor Supabase. No copies esas claves a la aplicación, GitHub ni capturas. El SDK administrativo solo se usa dentro de la función.
6. Publica index.html, assets/js/app.js, assets/js/identity.js y sw.js en Vercel. No se necesita ejecutar otro SQL.

La función crea una identidad interna basada en el usuario normalizado y en el dominio real del proyecto Supabase. La marca como confirmada mediante auth.admin.createUser y no envía correos. No usa la ruta pública signUp, no depende del SMTP ni del límite de envío de emails. Ya no uses el dominio .invalid de la versión anterior. No es necesario desactivar la confirmación de correo para las demás aplicaciones del proyecto; se puede conservar habilitada.

Si se utiliza la CLI en vez del editor: ejecutar supabase functions deploy studio-register --no-verify-jwt desde esta carpeta, con el proyecto ya vinculado. El config.toml incluido configura el mismo comportamiento.

## Cuentas y recuperación

No se borran ni migran cuentas anteriores automáticamente. Las cuentas tradicionales con correo/contraseña todavía pueden entrar escribiendo su correo en Usuario o teléfono. Las cuentas que pudieron crearse con el identificador técnico .invalid necesitan migración administrativa si contienen trabajos; no borres cuentas para reparar el acceso. No hay recuperación automática por SMS ni correo en el modo usuario/teléfono. Mi cuenta permite cambiar la contraseña si la sesión sigue abierta.

## Pruebas

Crea una cuenta de prueba, cierra sesión y entra desde otro dispositivo con el mismo usuario. Verifica que aparece su mismo perfil. Prueba un usuario repetido, contraseña equivocada y dos usuarios diferentes. Los tests locales cubren normalización y funcionamiento de la función con el SDK simulado; la creación real requiere publicar la función en tu proyecto.
