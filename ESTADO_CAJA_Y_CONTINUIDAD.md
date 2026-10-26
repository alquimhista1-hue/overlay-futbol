# Estado confirmado de caja y continuidad

Actualizado: 11 de octubre de 2026. Este documento permite continuar el trabajo sin depender del chat. Describe lo observado hasta esta fecha; los importes de ejemplo no son saldos permanentes.

## Leer primero

### Financiamiento y movimientos restantes en Auditor — preparado 25/10/2026, sin SQL

Publicar seis archivos juntos: auditor.js, auditor.css, auditor.html, sw.js, lib/_auditor.js y api/auditor.js. JS10/CSS11/SW159. Menú Auditor añade Financiamiento, Abonos del personal y Otros movimientos de caja; Inicio incorpora sus importes semanales por categorías de auditoría oficial, sin recalcular ni escribir. Financiamiento separa caja de semana actual (grupos6/7) de deuda actual y fichas de aportes/préstamos/compras financiadas (servicio existente _financiamientos-supabase.overview, leído solo al entrar). Detalles por ID, movimientos descendentes con día y distingue afectaCaja e histórico. No confunde deuda pendiente o monto de referencia con entrada nueva. Abonos grupo5 y Otros grupo8 presentan entradas/salidas/neto y cada movimiento con descripción/fecha/importes. API nueva acción financiamiento exclusivamente GET AUDITOR/ADMIN, no habilita otras APIs ni escrituras. Estado de sección financiamiento invalida al actualizar resumen y retorno de segundo plano; carrera de consultas protegida con routeVersion. 101 pruebas automáticas y prueba navegador Auditor aprobadas localmente: permisos, histórico sin caja, préstamo/capital/compra, financiación/caja personal/otros/Atrás; captura revisada. Base4255 y registros intactos. No publicado ni probado con datos productivos desde este chat. Ver PUBLICAR_FINANCIAMIENTO_AUDITOR.md.

### Tarjeta completa vino/gris y crédito desde Papelería — preparado 23/10/2026

Publicar cinco archivos: auditor.js, auditor.css, auditor.html, sw.js y lib/_auditor-paperwork.js. JS9/CSS10/SW158. Título y resumen atrasos rojo #c62828/blanco, tarjetas completas alternan vino #963d50/blanco y gris #eceff1/texto oscuro, divisiones legibles, nombres bold. Papelería incluye datos del crédito exacto en respuesta GET existente, por id_credito, también créditos antiguos ligados al pago; filas pulsables abren el mismo render creditDetail de Créditos entregados dentro de ruta planilla con parámetro credito, conserva id de papelería. Volver/Back retorna a lista trabajador, sin depender de semana actual del crédito. No API nueva ni SQL ni escrituras. Diez pruebas dirigidas y una navegador con recorrido completo aprobadas, captura revisada; no publicado desde este chat.

### Planilla simple y papelería vinculada — preparado 23/10/2026, sin SQL

Publicar siete archivos juntos: auditor.js, auditor.css, auditor.html, sw.js, lib/_auditor.js, lib/_detalle-supabase.js y lib/_auditor-paperwork.js NUEVO. JS8/CSS9/SW157. Morosos alterna encabezados NOMBRE y PAGOS juntos: vino #963d50/blanco, vino30% sobre blanco/texto oscuro. Planilla verde oscuro/lima y etiquetas simples Sueldo, Descuento de préstamo, Total recibido/a recibir, Planilla pagada/Por pagar. Papelería abre vista propia con cliente/fecha/importe/total e historial Atrás. Servicio GET existente incorpora detalle: pagada por id_pago_planilla_papeleria exacto, permite créditos de otras fechas; prevista por id_empleado_papeleria/PENDIENTE/semana del cálculo. No une por nombres o asignación actual. Si suma no coincide con papeleria muestra aviso y total del detalle, sin inventar vínculos. _detalle añade IDs pago/empleado a salida de planilla, no modifica registros. 99 pruebas automáticas y navegador Auditor aprobadas localmente. Sin SQL/escrituras financieras/publicación. Ver PUBLICAR_PLANILLA_AUDITOR.md.

### Contraste de tarjetas — preparado 23/10/2026, sin SQL

Publicar auditor.css, auditor.html y sw.js: CSS8/JS7/SW156. Resumen verde oscuro #246047, letras/borde/división blancos; nombres peso800, encabezados alternan azul #2b5a76 con blanco y gris azulado claro #dce8f0 con texto #21455e. Solo encabezados alternan, datos y pagos blancos, encabezado Pagos azul conservado. Tres pruebas locales aprobadas, incluida navegador para colores/alternancia/negrita/clic de toda tarjeta/teclado/Atrás. No altera JS ni backend, filtros, cifras o finanzas. Preparado local, pendiente publicación.

### Tarjetas de atraso pulsables y resumen doble — preparado 23/10/2026, sin SQL

Publicar cuatro archivos: auditor.js, auditor.css, auditor.html y sw.js (Auditor7/SW155). Resumen superior dos columnas: clientes únicos incluidos y monto atrasado. Toda tarjeta tiene rol link/tabindex, flecha y navegación a ficha por nombre/ubicación/importes/pagos; Enter/Espacio y Atrás probados. Encabezado nombre azul igual a pagos, compacto; semanas blancas, borde azul grisáceo y sombra separan clientes. No cambia clasificación de rutas, importes ni backend. Doce pruebas dirigidas y una navegador ampliada aprobadas, captura revisada, preparado local sin publicación. Si publicación anterior quedó incompleta todavía requiere sus archivos backend.

### Morosos iguales a rutas y cuatro semanas — preparado 23/10/2026, sin SQL

Publicar cinco archivos juntos: lib/_auditor-arrears.js, auditor.js, auditor.css, auditor.html y sw.js (Auditor6/SW154). Sustituye filtro genérico de atraso anterior: ahora exige seguimientoEspecial de collectionRow, mismo clasificador que hojas de ruta. Semanales >=4 cuotas atrasadas; diarios atraso previo, primer pago <= inicio semana pasada y menos de Q50 en CADA semana pasada/actual. No cambia las reglas de rutas. Tarjetas por cliente agregan únicamente sus créditos clasificados y conservan exclusión/aviso de saldos inconsistentes. Pagos de cuatro semanas calendario, de antigua a actual, calculados desde pagos oficiales hasta fecha actual; fechas iniciales en respuesta. Encabezado sección vino/blanco, total destacado, nombre rojo en blanco, ubicación sin etiquetas pequeña, campos blancos y centrados, pagos encabezado azul/cuatro columnas. Preparado local, 98 pruebas automáticas y prueba navegador Auditor con anchos320–1280 aprobadas, captura revisada. Sin escrituras financieras, sin cambios de caja/base, sin despliegue ni SQL. Ver PUBLICAR_MOROSOS_RUTAS.md.

### Seguimiento Auditor y menú derecho móvil — preparado 23/10/2026, sin SQL

Ver PUBLICAR_ATRASOS_Y_MENU_MOVIL.md: trece archivos, versiones app115/portal40/mobile31/Auditor5/menu2/SW153. Menú derecho animado solo móvil, escritorio intacto; transición ligera de contenido. Auditor quita prefijo Abono de solo al mostrar, total Gastos verde distinto de días ámbar. Inicio añade tarjetas compactas de clientes diarios/semanales con atraso previo, total arriba/abajo, pagos dos semanas y acceso a ficha. Servicio privado nuevo lib/_auditor-arrears reutiliza motor de cobro, agrupa créditos atrasados por cliente y excluye inconsistentes con aviso. Sin escrituras ni cambios en base Q4,255. 97 pruebas y tres navegador aprobados localmente; datos productivos/publicación/teléfono pendientes. No repetir SQL036 ni anteriores.

### Menú lateral compartido y Auditor4 — preparado 22/10/2026, sin SQL

Ver PUBLICAR_MENU_LATERAL_Y_AUDITOR.md. Publicar once archivos: helper/estilo menú nuevos, mobile30/portal39, app114, Auditor4 y SW152. Menús de los tres roles con panel blanco lateral izquierdo y filas/iconos como referencia del usuario; solo presentación sobre accesos existentes, no navegación permanente escritorio ni permisos. Administrador foco/Escape/inert, Auditor conserva History API y cobrador filtros previos. Auditor préstamos: presentación descendente y día en fechas, no cambia saldos/backend. Espacio entre X y texto. Sonidos extraídos de initCollectorMobile a initCollectorSounds compartida, activada en Auditor sin inicializar operaciones de cobrador; mismos archivos existentes y narración intacta. 95 pruebas automáticas y comprobaciones navegador/capturas de tres menús/sonidos/fechas/cobrador/administración aprobadas localmente. No publicado desde este chat; teléfono y altavoz reales pendientes. SQL036 confirmado, no repetir.

### SQL036 instalado — confirmado por resultado del usuario, 22/10/2026

Usuario compartió sesiones_036_verificadas: instalada=true, diasSinActividad=180, modificaFinanzas=false, revocacionPorDispositivo=true. Confirma instalación de SQL036; NO repetir036 ni migraciones anteriores. Sustituye el estado pendiente de instalación de la nota siguiente. Publicación de quince archivos y prueba real de sesiones todavía no confirmadas. Tras publicar, iniciar sesión nuevamente una vez para adoptar la credencial persistente; antes de salir de cobrador, sincronizar pendientes. No se accedió directamente a producción desde este chat.

### Sesiones persistentes y Auditor v3 — preparado 22/10/2026, SQL036 pendiente

Ver PUBLICAR_SESIONES_036_Y_AUDITOR.md. SQL036 añade SOLO sesiones privadas revocables por dispositivo (hash aleatorio, RLS, RPC service-only), sin finanzas. Instalar036 primero, publicar quince archivos; no repetir035. Sesión nueva180d inactividad para ADMIN/COBRADOR/AUDITOR, cookie HttpOnly/Secure, validación DB por API, renovación máxima diaria /api/session al abrir/volver. Salir revoca fila; cuentas/versiones inactivas bloqueadas, legado vinculado a huella configuración. Ciclo frontend valida identidad/rol al volver y no borra colas; 503 no es revocación; offline cobrador24h previo conservado. Sesiones antiguas8h no convertidas: entrar una vez después de publicar, sin pendientes de sincronización antes de salir. Auditor únicamente: limpieza Buscar al salir, botones Buscar/X contrastados, Menú panel modal inferior con historial, días cobrados verde/gastos ámbar hasta hoy y futuros blancos, sin franjas laterales, totales compactos al pie según alcance. App113/portal38/Auditor3/lifecycle1/SW151. No desplegado ni SQL036 ejecutado desde este chat. Pendiente usuario confirmar SQL/publicación y teléfono real.

### Auditor navegación móvil v2 — preparado 22/10/2026, sin SQL nuevo

Ver PUBLICAR_AUDITOR_NAVEGACION.md: publicar ocho archivos. Inicio limpio solo resumen; actualización automática al abrir/volver (sin sondeo) y sello con día; Menú inferior Inicio/Cobros/Gastos/Buscar/Menú. Día de Cobros/Gastos y crédito abren vista individual coloreada con History API/Atrás/Volver. Menú incluye Créditos/Planilla/Préstamos/Salir. Buscar reutiliza módulo cobrador con callbacks opcionales, cuenta Auditor consulta todos los clientes con saldo positivo y ficha completa, no operaciones. API dedicada GET acciones explícitas con IDs validados y rol. Foto GET permitido Auditor; POST sigue ADMIN. Préstamos agrupa por empleado y muestra todos sus préstamos/movimientos de cualquier fecha. Planilla Pagada/Prevista separadas y coloreadas, sin explicaciones largas. Auditor2/shared mobile29/SW150; cobrador conserva importación28 y comportamiento predeterminado. 89 pruebas automáticas y tres navegador aprobadas; capturas móviles revisadas. No datos financieros modificados ni despliegue desde este chat. SQL035 ya confirmado; NO repetir. Pendiente publicación y teléfono real.

### SQL035 instalado — confirmado por resultado del usuario, 22/10/2026

Usuario compartió auditor_035_verificado: rol=AUDITOR, instalada=true, modificaFinanzas=false. Confirma instalación de SQL035 en Supabase; NO repetir035 ni migraciones anteriores. Sustituye el estado pendiente de instalación de la nota siguiente. Publicación de catorce archivos, creación de cuenta Auditor y prueba real todavía no confirmadas. No se accedió directamente a producción desde este chat.

### Auditor móvil — preparado 22/10/2026, SQL035 pendiente

Ver PUBLICAR_AUDITOR_035.md. Nuevo rol AUDITOR sin empleado ni permisos de escritura; portal separado auditor.html con Inicio/Cobros/Gastos/Créditos/Personal, sin Historial. Solo semana actual y saldos actuales de préstamos. API GET exclusiva AUDITOR/ADMIN; operaciones administrativas siguen ADMIN, portal cobrador bloquea Auditor y permit() exige rol Cobrador para permisos no admin. SQL035 solo amplía restricciones de usuarios, conserva RLS, sin importes financieros. Publicar catorce archivos juntos; app112/admin7/login10/SW149. Pendiente ejecución SQL035, despliegue y prueba de cuenta real. No repetir034. Datos oficiales reutilizados; planilla pagada separada de referencia calculada no final.

### Corrección del 15/10/2026 — confirmada por resultado del usuario

Usuario cambió directamente abonos de Jorge Rene Guzman Martinez de120 a180 y Oralia Iquic de60 a90. Consulta reveló caja120/60 y saldos todavía2700/840, total_abonado300/660. SQL transaccional con guardas exactas corrigió movimientos vinculados a180/90, saldo_despues_pago y saldo_actual a2640/810, total_abonado a360/690. No nuevos pagos ni base modificada. Usuario confirmó total_abonos=3225 y total_cobros_caja=3225. No repetir descuentos manualmente. El detalle diario clicable en auditoría administrativa antigua sigue pendiente; nuevo portal Auditor sí tiene días desplegables.

### SQL034 instalado — confirmado por resultado del usuario, 16/10/2026

Usuario compartió control_034_verificado con instalada=true, soloHoy=true, bloqueoPorCobradorDiaTipo=true y gastosConCorreccionJustificada=true. Confirma la instalación de SQL034; NO repetir SQL033 ni SQL034. Esta confirmación sustituye el estado pendiente de instalación de la nota siguiente. No confirma publicación de los once archivos ni prueba real de importación/interfaz. Pendiente comprobar publicación y probar primero el llenado de campos sin guardar. No se accedió directamente a producción desde este chat.

### Control diario y reportes por cobrador — preparado 16/10/2026, SQL034

Ver PUBLICAR_CONTROL_DIARIO_034.md: ejecutar034 después033 confirmado y publicar11 archivos. Ruta automática al seleccionar cobrador/fecha, sin Cargar ruta; Importar azul después fecha. Importación HOY calendario Guatemala, cierre persistente por empleado/fecha/tipo tras guardar importados; manual normal, sin cierre al cancelar/fallar. cierres_importacion_cobrador privada con backfill solo de vínculos033 comprobados. Nuevo RPC controlado envuelve033 con fechas/bloqueo y validación de correcciones; idempotencia permite recuperar resultado ya guardado después de medianoche, no importar ayer nuevo. Gastos manuales predeterminado y siempre Otros; elegir cobrador solo importa. Importados readonly; Modificar campos requiere motivo, evidencia original/registrado/actor conservada en033; no toca firma fuente. Resumen del día nuevo: oficiales por cobrador/neto, otros debajo, comparación firmada por abonos y gastos separados; cambia fecha medianoche sin borrar historia ni sondeo continuo. Reportes añade Por cobrador diario/semanal, sin caja inicial/disponible ni salidas generales; general conservado. Atribución por IDs históricos y vínculo probado, nunca por asignación actual. App111/operaciones20/reportes7/SW148. 82 pruebas automáticas y seis navegador local aprobadas; visual móvil/escritorio revisado. No desplegado/SQL034 no ejecutado desde este chat. Base Q4,255 y saldos históricos intactos al instalar; guardar explícito sí mueve caja como siempre. Prueba de exportación real del nuevo reporte pendiente tras publicar.

### SQL033 instalado — confirmado por resultado del usuario, 16/10/2026

Usuario compartió importacion_033_verificada: tabla=importaciones_anotaciones, instalada=true, importacionAutomatica=false. Confirma ejecución de la migración; no repetir SQL033. No confirma publicación de nueve archivos, importación real ni registro financiero posterior. Pendiente publicar/verificar interfaz y probar primero el llenado de campos sin guardar. No se accedió directamente a producción desde este chat.

### Importación administrativa — preparado 16/10/2026, SQL033

Ver PUBLICAR_IMPORTACION_033.md para instalar SQL033 completo y publicar nueve archivos. Importar abonos llena campos existentes en Registrar/Cobros del día con cobrador y fecha ya seleccionados; gastos añade selector propio y llena filas. Sin selección/lista intermedia. Importar solo lee; guardar confirmado registra oficialmente. Nueva importaciones_anotaciones privada enlaza fuente única/pago o movimiento, original y registrado; RPC exclusivo admin con transacción, bloqueos, guardas026 y funciones oficiales existentes. Advertencias de registros manuales parecidos requieren revisión, no autocorrección. Anuladas/ya importadas/ausentes/sobre saldo no se cargan. Cambios de contexto avisan y no mezclan. Se conservan notas/firmas; fuente importada no se anula, firma posterior permitida. Intentos inciertos persisten por cuenta y se pueden comprobar tras recargar, sin duplicación. NO cambia base Q4,255 ni historia al instalar; guardar sí afecta saldos/caja normalmente. 79 pruebas automáticas y cinco navegador local aprobadas; producción no modificada/publicada desde este chat. App110/operaciones19/SW147. Diseño de alertas se deja pendiente.

### Solicitudes por pasos y renovación — preparado 16/10/2026

Ver PUBLICAR_SOLICITUDES_WHATSAPP.md:13 archivos, sin SQL nuevo. Menú de cinco con Solicitudes y selectores personalizados. Guardar datos para enviar guarda solicitud PENDIENTE y PDF privado temporal, luego Copiar mensaje habilita Enviar solicitud por WhatsApp. Sin descarga automática. Editar campos/adjuntos/navegar y volver con borrador modificado invalida lo anterior. PDF separado en IndexedDB por UID/empleado/solicitud:versión, limpieza día siguiente al abrir/comprobación local; Supabase conserva solicitudes. Teléfono renovación editable o Sin teléfono, solo solicitud, no cambia ficha oficial automáticamente. Regla servidor/visual: monto_credito original <3000 saldo<=300, >=3000 saldo<=600; no total intereses ni importe nuevo ni anotaciones. Revalida servidor al guardar; ambiguos/datos faltantes requieren revisión. No cambia caja/créditos/pagos/base. Versiones portal37/common10/mobile28/notas11/request-mobile6/share5/SW146. 76 pruebas automáticas y cuatro navegador local aprobadas; compartir nativo simulado, pendiente publicación y teléfono real. No se desplegó ni ejecutó SQL desde este chat.

### Diseño de confirmación de ruta — preparado 15/10/2026

Mensaje elegido opción2: ¿Deseas finalizar la ruta? Confirma que ya anotaste el último cobro del recorrido. Después podrás revisar la lista y firmar el reporte. Diálogo cn-finish-confirm con texto/botones centrados, icono verde, tarjeta blanca redondeada, Continuar anotando gris con borde y Sí, finalizar ruta verde lima; foco visible y adaptación a pantallas pequeñas. Estilo limitado a este diálogo; no cambia comportamiento de firma/orden ni datos. Cinco pruebas dirigidas y prueba navegador con comprobación de colores/centrado móvil-escritorio, cancelación y firma/PDF aprobadas; captura móvil revisada. Subir collector-notes.js, collector-notes.css, portal-cobrador.js, cobrador.html, sw.js juntos (notes10/CSS5/portal36/SW145). No SQL ni publicación desde este chat.

### Confirmación antes de ordenar ruta — preparado 15/10/2026

Finalizar ruta y Volver a ordenar ruta abren diálogo: ¿Desea finalizar la ruta? Asegúrese de haber anotado al último cliente que abonó. Se ordenará la lista según la hoja de ruta, incluyendo a quienes no abonaron. Botones No, continuar anotando / Sí, finalizar ruta; foco inicial en No. Cancelar/Escape/navegar fuera no ejecutan finalizarRuta. Confirmar conserva flujo existente: ordena, permite revisar/corregir, habilita firma; SOLO firma confirmada asigna nuevos cobros a siguiente jornada. No exige cobros mínimos ni bloquea jornada por ordenar. Sin SQL/caja/pagos modificados. Cinco pruebas dirigidas y navegador local (cancelar/Escape sin RPC, confirmar, editar, reordenar, firma/PDF) aprobados. Subir collector-notes.js, portal-cobrador.js, cobrador.html y sw.js: notes9/portal35/SW144. No desplegado desde este chat.

### Actualización de aplicación obligatoria y textos — preparado 15/10/2026

Aviso de versión sin Más tarde; obligatorio, cancel nativo/Escape rechazado y fondo no cierra. Espera a que termine diálogo/campo activo antes de mostrarse; no recarga automáticamente cobros o firma. Controllerchange guarda marcador rm_required_app_update sin datos privados en localStorage para sobrevivir navegación/login/reapertura. Al aceptar comprueba respuesta de red del documento con cache reload y timeout; fallo conserva marcador y ofrece Reintentar; éxito quita marcador y recarga. Esto no es bloqueo de versiones en servidor ni garantía de aplicación antigua que todavía no cargó este código. La actualización diaria de clientes es distinta y conserva Ahora no para poder consultar sin señal. App cerrada no ejecuta tareas; no puede impedir cerrar la app o navegar fuera del sitio, pero pendiente vuelve al abrir.

Reporte modal: Reporte de [nombre_cobrador], nombre de archivo existente y Compartir PDF/Cerrar; desaparece aviso PDF preparado/no descarga automática. Se simplifican explicaciones de caja oficial del resumen, confirmación de quitar y pie del PDF; conservar advertencias de errores, sin conexión y pendientes para no fingir envíos exitosos. Sin cambios de pagos/caja/firma/SQL. 74 pruebas automáticas y dos pruebas navegador local aprobadas, incluyendo Escape, reapertura, fallo/reintento obligatorio y generación PDF. Falta publicación/prueba teléfono.

Subir juntos: update-notice.js, pwa.js, collector-daily-update.js, app.js, login.js, collector-mobile.js, portal-cobrador.js, index.html, login.html, cobrador.html, sw.js, collector-note-report.js y collector-notes.js. Versiones notice2/PWA5/daily2/app109/login9/mobile27/portal34/notas8/report6/SW143. Esta lista sustituye entregas anteriores; archivos nuevos anteriores como update-notice.css aún deben estar publicados. No SQL.

### PDF solo para compartir — preparado 15/10/2026

Por solicitud del usuario se quitó únicamente Ver PDF/iframe y se dejó Compartir PDF y Cerrar. Lista de reportes dice Compartir PDF. Nombre visible y archivo compartido: Edson Ajvik - miércoles - 14-10-2026.pdf; usa nombre del reporte firmado y fecha_jornada, no fecha actual. Conserva PDF privado, firma y generación de una página; no modifica Supabase ni requiere SQL. Subir collector-note-report.js, collector-notes.js, portal-cobrador.js, cobrador.html y sw.js juntos (report5/notes7/portal33/SW142). Mantener archivos de etapa anterior si aún no se publicaron. Tres pruebas unitarias/publicación y una prueba navegador de ruta-firma-PDF local aprobadas; compartir WhatsApp en teléfono real pendiente. Preparado localmente, no desplegado desde este chat.

### Avisos centrados y descarga diaria manual — preparado 15/10/2026

Consultar PUBLICAR_AVISOS_ACTUALIZACION.md: 15 archivos, sin SQL. Avisos de versión y primera actualización diaria desde las 06:00 Guatemala centrados. Solo descarga exitosa marca ciclo actualizado; fallos conservan copia anterior. Después del éxito, actualizaciones adicionales desde menú; no descarga diaria silenciosa ni temporizadores de red. App cerrada no ejecuta trabajos. Sincronización de anotaciones permanece independiente. Reportes firmados del día anterior se ocultan a las 06:00, pero NO se borran registros, metadatos ni PDF privados; no se comprueba entrega por WhatsApp. Versiones app108/portal32/SW141. 73 pruebas automáticas y tres de navegador local con datos ficticios aprobadas; capturas escritorio/móvil revisadas. No publicado ni SQL ejecutado desde este chat. Usuario indicó Listo tras etapa032, sin nueva verificación SQL de producción aquí. No cambia base financiera ni pagos oficiales.

### Lista completa al finalizar ruta — preparado 15/10/2026, SQL032

Consultar PUBLICAR_RUTA_COMPLETA_032.md: nueva revisión Finalizar ruta, Anotados completo (incluye Sin abono sin crear cobros), números/orden de hoja preparada, PDF con ruta completa y totales solo reales; firma031 sigue cierre. Antes de firma se puede corregir, pero cambiar notas/gastos exige finalizar otra vez. Nuevas tablas privadas hojas_ruta_diaria/rutas_jornada_cobrador, RPCs guardar_hoja_ruta/finalizar_ruta_anotaciones y guardia adicional en firmar_jornada_anotaciones; no cambia pagos/caja/base Q4,255. Orden guardado al preparar Rutas; hoja anterior a instalación no puede reconstruirse con certeza, muestra aviso si usa ruta actual. Incorporaciones posteriores N1/N2, notas fuera de hoja —, sin renumerar posiciones existentes. Cambio de hoja antes de firma exige nueva revisión. Reportes firmados previos intactos.

Panel administrativo más compacto: Todos antes de Actualizar, nombre al lado de totales, cuadrícula/contraste reforzado y columna de recepción en todos los abonos. 70 pruebas no navegador y dos pruebas navegador de datos ficticios aprobadas. Se extrajeron y renderizaron con Poppler PDFs reales de prueba de3 y83 clientes; una página en ambos (612x792 y612x2589pt), tabla/colores/recepción/Sin abono/totales/firma sin recortes. No son reportes reales ni archivos a publicar. SQL032/publicación y comprobación en teléfono de usuario pendientes. Archivo de publicación contiene los16 archivos y versiones107/portal31/SW140. No confundir con rediseño anterior sin SQL; ESTA etapa sí requiere032 después031.

### Panel administrativo simplificado — preparado 14/10/2026

Rediseño de Cobros de cobradores: Todos por defecto en cada entrada (corrige omisión de inicialización por caché general), tarjetas centradas de totales/por cobrador y detalle con Por cobrar azul izquierda y Cobros anotados verde derecha; responsive apilado. Solo personal con puesto cobrador/cobradora, no supervisor, filtrado también en servidor; activos sin notas visibles en cero. Cobros/gastos de supervisores no suman a este panel, pero no se borran. Lista por cobrar usa asignaciones actuales, créditos activos saldo>0 y notas activas de la jornada; anulaciones no ocultan cliente. Para otras fechas se muestra aviso y no se fabrica historial de pendientes con asignaciones actuales. Motor de cuotas existente; si historial difiere del saldo oficial el exigible queda Por revisar. Gastos y anulaciones separados abajo, detalle de solo lectura, ámbar conservado. No altera firma, pagos oficiales, caja ni base financiera.

Sin SQL nuevo. Subir los siete archivos de PUBLICAR_PANEL_COBRADORES.md. Versiones app106/admin-notes5/CSSadmin1/SW139. 67 pruebas no navegador y una prueba visual navegador local aprobadas con datos ficticios; capturas revisadas escritorio/móvil. Falta publicar/verificar datos reales de asignaciones y puestos; no se accedió a Supabase desde este chat. La captura del usuario mostró reporte firmado y 27 anotaciones del panel anterior, no constituye nueva ejecución de SQL confirmada aquí.

### Jornadas firmadas y PDF privado — preparado 14/10/2026, SQL031

Esta actualización sustituye el PDF que se descargaba automáticamente y el snapshot limitado al día descritos más abajo. Preparación local, NO ejecutada todavía en Supabase ni publicada desde este chat. Requiere SQL028,029,030 antes de `20261014_031_reportes_jornadas.sql`. No cambia pagos_clientes, creditos, movimientos_caja, cierres ni base confirmada Q4,255 del 05/10.

Cada anotación mantiene `fecha` y `capturado_en` de recepción real; `jornada` es el día de su reporte. `creado_en` sigue siendo recepción del servidor. El RPC firmar_jornada_anotaciones guarda firma y snapshot completo en nueva tabla privada reportes_jornada_cobrador, comprueba permisos/empleado, lista exacta de IDs y totales del servidor. Un bloqueo transaccional por cuenta serializa firma y anotaciones. Triggers impiden editar/borrar el reporte firmado y sus notas; RPCs de anulaciones también rechazan notas firmadas. No hay borrado automático histórico. Un reintento con mismo UUID/firma/IDs devuelve el mismo reporte, no otro.

Después de firmar miércoles, nuevas notas y gastos se asignan a jueves, pero conservan recepción miércoles. Otro abono del mismo cliente puede anotarse en esta nueva jornada sin eliminar el anterior. La jornada se decide en el servidor como máximo entre fecha calendario Guatemala y día posterior al último reporte firmado de la cuenta. Solo se firma la jornada del día calendario desde las 06:00 Guatemala; antes de eso sí se pueden guardar notas para ella. La app cerrada no ejecuta un temporizador: la regla se evalúa al abrir/consultar/anotar. No se permite firmar anticipadamente jueves el miércoles. Activos antiguos sin reporte se conservan y se incluyen una sola vez en la próxima firma; no se descartan por cambiar de fecha.

El intento de firma se conserva localmente antes de enviarlo. Mientras no se confirme una respuesta incierta se pide conexión y no se anotan más cobros, para evitar enviarlos a la jornada equivocada; esto no es bloqueo de una jornada ya confirmada. Una vez confirmado, inmediatamente se permite anotar para la siguiente. Rechazo transaccional confirmado se conserva como intento rechazado y deja revisar/firma nueva. Errores de sesión detienen envío. Pendientes ordinarios de días anteriores siguen requiriendo revisión, no se les cambia la fecha silenciosamente.

PDF: un solo archivo, UNA página larga (los PDF no pueden tener cero páginas). Columna Fecha y hora de recepción; fondo ámbar #fff1cf/texto #81500c si su día real precede al encabezado. Admin tiene mismo color en detalle y marca Reporte firmado. Se conserva estilo negro/verde, filas alternadas, firma y resumen. No contiene fotos. Se genera Blob sin descarga automática y se guarda en IndexedDB rm-private-reports-v1, separado por UID/empleado/ID reporte, NO Cache Storage público. Ver PDF y Compartir PDF desde gesto del usuario; selector nativo permite elegir WhatsApp solo si instalado y navegador admite compartir archivos. No se manda automáticamente a nadie. Últimos diez reportes listados; snapshot último firmado disponible localmente, anteriores se recuperan con API privada. Caché no cifrado, puede ser desalojado por dispositivo: snapshot y firma en Supabase permiten regenerar el PDF. Vista PDF incorporada depende del navegador; no prometer compatibilidad universal ni conservación local perpetua.

64 pruebas automáticas locales aprobadas: aislamiento, repetición de firma, inmutabilidad, jornada siguiente, fecha real, caja oficial intacta y PDF estructural de una página, junto a regresiones de funciones anteriores. Sintaxis de módulos modificados verificada. Falta ejecutar SQL031/publicar y prueba visual real en Android de firma, PDF largo, compartir con WhatsApp y captura posterior a firma. Usuario confirmó anteriormente un ensayo de modo avión/recuperación de red con notas, no es certificación completa de todos los escenarios.

Publicación de esta etapa: ver PUBLICAR_JORNADAS_031.md. Referencias app105, portal-cobrador30, collector-notes4, collector-note-report3, collector-note-sync2, admin-collector-notes4, SW138; collector-report-cache1 nuevo. No repetir SQL021–030 ni alterar base caja para implementar jornadas.

### Sin señal, sincronización y diseño compacto — preparado 14/10/2026

Reemplaza guardado solamente online de notas anterior. Nuevo collector-note-sync.js mantiene snapshot del día y outbox persistente en localStorage por ID estable de cuenta/empleado; cada operación tiene clave propia para no sobrescribir otras. Primero persiste, luego intenta envío inmediato; al recuperar red, abrir/focalizar/volver a app intenta sincronizar sin intervalos de15min. La sincronización se serializa (Web Locks cuando disponible), UUID/reintentos existentes en SQL evitan duplicados. Respuesta perdida conserva operación para reintentar; guarda confirmación local antes de quitar outbox. Rechazo con rollback probado o día anterior queda REVISAR, no se cambia fecha/importe ni se borra. Cliente ya anotado desaparece localmente de Por cobrar; anular sin señal también se encola antes de volver a anotar total, conservando orden crear/anular/crear. Outbox/importación del intento antiguo permanecen protegidos; intento antiguo sin propietario verificable se marca para revisión. Saldos desconocidos no se inventan. El snapshot local solo conserva confirmados del día; historial completo queda en Supabase, pendientes de días anteriores permanecen en outbox. No borrar datos del navegador con pendientes.

Se comprueba cuenta esperada (usuario, empleado, UID) en API del portal; UID se incluye en publicSession como idCuenta (no es token). Revalidación de sesión al volver a primer plano; cambio de cuenta/401/403 detiene envío, conservando pendientes. Cachés de información/fotos también ligadas a UID. No permite cerrar sesión con pendientes; requiere cierre de sesión confirmado online antes de limpiar sesión/datos privados. Información diaria después6 sigue copia privada: integra notas y ruta en snapshot, nunca sobrescribe datos confirmados más nuevos con copia matutina vieja. Vista Cobrar aparece desde copia local sin esperar red, las consultas se hacen en segundo plano. Si no hay snapshot inicial se necesita internet para descargar clientes. Fotos descargadas permanecen en IndexedDB; ficha puede usar miniatura guardada si la imagen completa no estuvo descargada y no hay conexión.

Acceso offline requiere preparación inicial con internet tras publicar: HTML cobrador genérico sin datos ni cuenta se conserva como carcasa estática; no se guarda HTML administrativo ni API en Cache Storage. Login sin red deriva solo a una cuenta cobrador previamente verificada localmente en últimas24h y con UID; metadata local contiene perfil/permisos, NO contraseñas ni cookies/tokens. Una cuenta revocada no puede verificarse sin señal: consulta/captura local hasta recuperación, servidor vuelve a validar antes de aceptar; no afirmar autenticación online al trabajar offline. No es almacenamiento cifrado; proteger dispositivo. Si transcurren24h sin verificar o no hubo descarga inicial se solicita conexión. Aplicación cerrada no ejecuta trabajos; outbox persiste hasta abrirla. Navegación administrativa permanece online.

SQL030 requiere028/029: añade capturado_en nullable a cobros_anotados/gastos_anotados e integra captura en RPCs, conserva creado_en como recepción de servidor. Valida hora reportada en mismo día y no adelantada más5min, conserva idempotencia/día actual/seguridad de RPCs; no cambia fechas de pagos oficiales ni caja. Nuevas anulaciones envían motivo automático Anulada por el cobrador mediante confirmación desde servidor, sin pedir escribir. UI advertencia personalizada con cliente/importe y botones Cancelar/Quitar rojo vino; historial sigue guardado.

Diseño: menú negro compacto SVG Por cobrar/Anotados/Gastos, activo verde, sin Actualizar en Cobrar. Tabla nombre/importe 34px por fila, letra11px, nombre una línea con ellipsis y completo en tarjeta. Firma/PDF al final; bloquea si queda cualquier operación pendiente/revisión y confirma datos frescos antes de firmar. Texto Confirma las anotaciones antes de firmar y descargar. Limpiar gris, Cancelar rojo vino, Guardar PDF verde. Admin Cobros de cobradores mantiene pestaña propia/actualización manual, filtros y detalles de cobrador, visual negro/verde/gris, hora capturada cuando existe. Totales de notas no son caja oficial.

Publicación pendiente: ejecutar SQL030 COMPLETO una vez028/029 instalados; no repetir migraciones antiguas. Nuevos collector-note-sync.js, collector-session-cache.js. Cambiados collector-notes.js, collector-notes.css, collector-note-report.js, collector-cache.js, collector-private-photos.js, portal-common.js, portal-cobrador.js, collector-mobile.js, login.js, login.html, sw.js137, app.js104, index.html, cobrador.html portal29/CSS3, admin-collector-notes.js3, lib/_portal.js, lib/_acceso.js, lib/_cobros-anotados.js y este documento. Common8/mobile25/cache3/notas3/report2. 60 pruebas locales no navegador aprobadas, incluida030 sobre esquema real/conservación, outbox/reinicio/HTTPrespuesta perdida/borrados/día anterior/storagequota, cacheUID/identidad, carcasa offline/API no cacheadas. Intento prueba navegador tests/pwa.test.cjs falló por falta del paquete playwright en este entorno, no por comprobación del producto; verificación real de teléfono y PDF pendiente. No se ejecutó SQL ni se publicó desde este chat.

### Gastos anotados, pestaña propia y reporte — preparado 14/10/2026

Reemplaza la actualización automática y vista en Administración de la sección anterior. Nueva pestaña administrativa cobroscobradores en menú de escritorio/móvil, con título Cobros de cobradores. Consulta al abrir/cambiar fecha o pulsar Actualizar cobros del día; elegir cobrador filtra datos ya descargados, sin petición nueva. Sin timer/consultas cada20s. Explica actualización manual y última hora; fallo advierte datos antiguos. Menú de escritorio y botones inferiores compactados levemente para espacio, sin ocultar opciones.

Cobrar del cobrador tiene Por cobrar, Cobros anotados y Gastos del día. Fecha de día actual automática (Guatemala), sin selector; buscador solo visible en Por cobrar. Cobros anotados: tabla Nombre/Cobro anotado, clic abre tarjeta modal con foto/nombre/cantidad/saldo restante; sin fecha visible, sin aclaración pendiente de registro ni datos del cobrador. Usuario pidió quitar esos elementos. No descarga de tarjeta. Quitar anotación desde detalle conserva motivo/historial. Datos históricos aún accesibles administrativamente. Al actualizar, si cambió día utiliza fecha nueva.

Gastos del día anota concepto (gasolina/comida/etc) y cantidad. SQL029 añade gastos_anotados e historial_gastos_anotados privados, RPC guardar/anular service_role, cuenta/permisos/empleado activo, fechaactual, centavos, concepto3-200 caracteres, UUID idempotente que rechaza contenido cambiado. Anular solo propio y del día, guarda motivo e historial. Totales en centavos: cobros activos, menos gastos activos, efectivo restante (admite negativo sin ocultarlo). Visible por empleado y general al administrador. No se confunde con saldo de caja oficial; ningún pago/crédito/movimiento financiero es modificado. Reintentos de gastos reutilizan misma protección local de notas; no consideran guardado sin confirmación.

Usuario pidió botón Firmar y guardar PDF del reporte completo, distinto de tarjeta, y omitir foto por ahora. Nuevo collector-note-report.js descarga reporte diario de notas y gastos con total/neto y firma local en canvas, fecha automática y nombre del cobrador (reporte interno, no tarjeta para cliente). No foto adjunta ni selfie. No guarda firma/reporte en Supabase ni aplica pagos; solo descarga local. Cancela modal al navegar, requiere dibujo de firma, consulta datos frescos antes de generar. Mantiene PDF blanco/negro/verde usando exportador existente, con aclaración interna reporte de anotaciones. No afirmar PDF renderizado visualmente en teléfono: se probaron cálculo/HTML y lógica, no navegador real.

SQL028 previo aún sin confirmación de ejecución del usuario. Ejecutar primero028 si no fue ejecutado y luego029 COMPLETO; si028 ya se ejecutó no repetirlo. SQL029 no desbloquea guardado oficial del cobrador ni cambia base/caja. Últimos archivos para publicación: collector-notes.js, collector-notes.css, collector-note-report.js NUEVO, note-summary.js NUEVO, admin-collector-notes.js, lib/_cobros-anotados.js, lib/_portal.js, lib/_supabase.js, administracion.js, app.js, index.html, cobrador.html, portal-cobrador.js, sw.js136 y este documento. Versiones app103/admin6, panel admin2, portal28/notas2/CSS2; incluye archivos de entrega028 si faltan (api/portal.js, portal-common.js, collector-mobile.js). 55 pruebas locales aprobadas, incluidas 029 sobre esquema completo/idempotencia, seguridad y conservación íntegra de caja/créditos, anulaciones/centavos/neto, ruta propia/sin timer, tarjeta y HTML reporte. Publicación, SQL y prueba real del teléfono pendientes.

### Cobros anotados separados — preparado 14/10/2026, NO desplegado/SQL NO confirmado

Usuario autorizó que el cobrador solamente anote dinero recibido; administrador conserva registro manual oficial. Sin descargas: tarjeta para captura con foto/nombre, fecha/hora Guatemala, cobro recibido y Saldo restante, aclaración Cobro recibido por el cobrador, pendiente de registro administrativo. Sin saldo anterior, nombre de cobrador ni estado en tarjeta. Saldo restante es fotografía del saldo oficial al anotar menos importe anotado, no saldo oficial actual ni acumulado histórico de anotaciones. No modifica Inicio/Buscar/saldos oficiales. No implementar conciliación automática ni registro desde nota sin nueva autorización.

Cobrar: Por cobrar / Cobros anotados, buscador, fecha consultada y Actualizar. Ruta obtenida fresca del servidor al abrir, lista solo asignados con saldo. Un cliente con nota activa desaparece de Por cobrar ese día; puede anularla con motivo y volver a anotar total recibido (no agregar segundo cobro mientras existe primera). Anulaciones solo del día actual y conservadas en historial. Días anteriores visibles en Cobros anotados. Se guarda fecha/hora de servidor, no hora libre del teléfono. No migrar antiguos borradores a notas automáticamente ni borrarlos; montos que aún estén pendientes del sistema anterior requieren revisión del administrador.

Administración incluye Cobros de cobradores, fecha/filtro, total por empleado y general, detalles y anulaciones, actualización cada20s solo con sección visible. No Supabase Realtime websocket ni prometer actualización instantánea; al fallar conserva vista con advertencia. No ofrece Registrar pago. Anotaciones no se marcan registradas al aplicar manualmente pago; el administrador debe revisar/controlar esa separación, no interpretar total anotado como dinero de caja.

SQL 028 crea cobros_anotados y historial_cobros_anotados privados, índices/único cliente+día activo, dos RPC service_role exclusivamente; verifica cuenta activa/COBRADOR/permiso cobrar, personal activo, asignación real, crédito ACTIVO saldo>0, importe positivo/centavos/<=saldo, día actual. Idempotencia por UUID con contenido verificable, bloqueos y unicidad de servidor. Identidad proviene sesión API, no payload. Rechaza anular notas de otra cuenta. No modifica pagos, caja, créditos ni base; bloquea y revoca service_role del antiguo guardar_cobros_firmados y API rechaza guardarCobros. API administrativas existentes siguen ADMIN solamente. Nuevas notas requieren internet; guardado pendiente protege UUID+payload en localStorage por cuenta para reintentar respuesta perdida, no se considera guardado hasta confirmación del servidor. Error con rollback confirmado libera intento. No elimina cookies/caché financiera ni borra borradores al instalar.

Publicación: ejecutar COMPLETO supabase/migrations/20261014_028_cobros_anotados.sql primero (bloquea inmediatamente RPC viejo), luego subir API/JS/HTML/CSS. Nuevos: lib/_cobros-anotados.js, collector-notes.js, collector-notes.css, admin-collector-notes.js. Cambiados: lib/_portal.js, lib/_supabase.js, api/portal.js, portal-common.js, portal-cobrador.js, collector-mobile.js, administracion.js, app.js, index.html, cobrador.html, sw.js v135 y este documento. Versiones app102/admin5, portal27/mobile24/common7; hojas collector-notes.css1. No repetir SQL anteriores. Para probar, permiso cobrar habilitado se llama Anotar cobros; nota pequeña debe cambiar solo Cobros anotados y reflejarse en Administración, no oficial. 54 pruebas locales aprobadas; incluye instalación sobre esquema completo, reejecución de migración, conservación íntegra de créditos/caja, seguridad RLS/RPC/API, identidad, duplicado, contenido, fecha/centavos, anulación y tarjeta sin datos privados/descargas. Prueba de interfaz real en teléfono y despliegue siguen pendientes.

### Corrección Irma/Jorge CONFIRMADA en Supabase — 14/10/2026

Usuario compartió correccion_verificada estado CORREGIDO. Irma: pago PAGO-20261010-211311-015-DBDD15 abono100/entradaCaja100, saldoDespuésAbono2000, totalAbonado350, saldoActual1900; saldo tras pago100 del13/10 también1900. Jorge: pago PAGO-20261010-211311-016-7420FF abono120/entradaCaja120, saldoDespuésAbono2820, totalAbonado180, saldoActual2820. TotalDosAbonos220. Reemplaza estado NO ejecutada de preparación siguiente. No repetir el SQL puntual; documentación basada en resultado proporcionado por usuario, no acceso directo. Falta confirmación de actualización/visualización en aplicación; renovar información del cobrador para dejar atrás copia previa.

### Corrección de abonos Irma/Jorge — preparada 14/10/2026, NO ejecutada

Usuario confirmó abonos del 10/10 intercambiados: Irma Lorena Martínez López PAGO-20261010-211311-015-DBDD15 Q120 debe ser Q100; Jorge René Guzmán Martínez PAGO-20261010-211311-016-7420FF Q100 debe ser Q120. Consulta productiva compartida: Irma crédito CRED-20261004-004736-481-A4220D saldo1880/abonado370 con posterior pago100 del13/10; Jorge CRED-20261006-220658-168-B8E2BF saldo2840/abonado160 sin posteriores. Un movimiento por pago.

SQL puntual supabase/corregir_abonos_irma_jorge_20261010.sql preparado con transacción/bloqueos/validación estricta y rechazo de cambios o reejecución. Actualiza pagos, saldo después del posterior de Irma (sin cambiar su importe100), créditos, caja vinculada, cobros_cobradores si existen; agrega dos eventos de corrección con importe20 y descripción anterior/nuevo. No modifica comprobantes firmados: si existe uno relacionado aborta y requiere diagnóstico. Conserva neto global de caja; no cambia base4255 ni ejecuta migraciones/cierres manualmente. Triggers existentes de movimientos pueden recalcular cierres normalmente. Esperados Irma saldo1900/abonado350, Jorge saldo2820/abonado180; total dos abonos220 intacto. Prueba PostgreSQL local aprobada: corrección, caja intacta, saldo posterior, rollback por crédito cambiado y bloqueo de reejecución. No afirmar ejecución en Supabase hasta recibir resultado del usuario. Actualizar información del cobrador después de confirmar.

### Corrección de publicación y versión — 12/10/2026

Usuario informó que la publicación anterior no produjo cambios. Revisión local detectó referencia app.js?v=100 sin incremento en index.html y SW que servía código anterior mientras renovaba en segundo plano, sin aviso de versión. No se verificó dominio desplegado; estas son causas locales identificadas, no confirmación del contenido en Vercel.

Ahora index app101, cobrador portal26/CSS6, pwa3, login6 y SW134. Recursos públicos versionados usan caché de la versión actual con URL nueva por cambio; HTML navega por red y API permanece excluida. Registro del SW updateViaCache:none y comprobación explícita; controllerchange, solo para páginas previamente controladas, muestra aviso Abrir versión nueva con recarga voluntaria para no interrumpir cobros/firmas. No borra localStorage/IndexedDB ni borradores. Título de pendientes también rojo vino.

Publicar index.html, app.js, cobrador.html, portal-cobrador.js, collector-home.css, pwa.js, login.html, login.js, sw.js y este documento. Mantener cambios anteriores api/foto-personal.js, administracion.js y collector-home.js ya publicados según usuario. No SQL. Si una página vieja no tiene el nuevo aviso, cerrar y volver a abrir después del despliegue; no borrar almacenamiento. Pruebas locales no sustituyen revisión de teléfono/despliegue.

### Foto gestionada exclusivamente por administrador — 12/10/2026

Reemplaza las instrucciones anteriores de edición por cobrador. Inicio muestra foto circular fija, sin botón, selector, ampliación ni edición. Administración incorpora Fotografías de los cobradores: empleado, foto y Subir / cambiar foto, con recorte/zoom existente. API foto-personal GET del cobrador siempre usa su empleado de sesión aunque envíe otro ID; ADMIN puede consultar por idEmpleado. POST solo ADMIN, valida empleado existente, JPEG 3:4 y límite 250KB. No SQL nuevo; usa tabla/función 027 existente. El cobrador ve sustituciones al actualizar información o renovación diaria de caché.

Pendientes: encabezado rojo vino #984c59 con blanco; nombres mismo rojo y filas alternadas rosa suave. Publicar api/foto-personal.js, administracion.js, app.js, collector-home.js, collector-home.css, portal-cobrador.js, cobrador.html, sw.js v133 y este documento. Preparado localmente, despliegue no confirmado; prueba real del panel administrador pendiente.

### Conteo, listas y apertura — ajuste local posterior 12/10/2026

Inicio contaba todas las asignaciones (incluidas sin deuda), Buscar solo saldo positivo. Ahora inicioCobrador cuenta la misma consulta de Buscar; la lectura local también obtiene el contador de snapshot.clientes para corregir copias anteriores. Renovaciones del cobrador ya no incluyen saldo cero. La búsqueda del administrador no se modifica. Historiales internos descargados conservan registros para comprobantes; no equivalen a clientes visibles.

Encabezados de tabla azul/blanco para hoy y verde apagado/blanco para pendientes; filas alternadas blancas/coloreadas y nombres subrayados azules con flecha de acceso. Carga de sección diferida 180ms para evitar parpadeo al consultar caché. SW v132 sirve archivos públicos versionados desde caché y los renueva en segundo plano; navegación HTML y sesión siguen comprobándose por red, ninguna API privada se almacena en caché pública. No prometer apertura instantánea ni funcionamiento sin conexión de la sesión. 48 pruebas locales aprobadas; comprobación visual real pendiente.

Publicar estos ajustes: lib/_portal.js, collector-cache.js, collector-home.css, portal-cobrador.js, cobrador.html, sw.js, ESTADO_CAJA_Y_CONTINUIDAD.md. Si la publicación anterior no se hizo, subir además los archivos indicados en la sección siguiente. No SQL nuevo.

### Inicio y caché privada — actualización local 12/10/2026

Esta sección reemplaza las descripciones anteriores de filtros/diseño de Inicio. Todos los créditos SEMANALES ACTIVOS con saldo positivo asignados al cobrador aparecen en su día de pago, aunque estén adelantados o pagados hasta hoy (Q0.00). No incluye créditos cancelados ni diarios. Los atrasados de otros días se muestran aparte; no se duplican entre grupos. Si los pagos no concuerdan con el saldo oficial, conserva el cliente de hoy pero muestra —, nunca inventa importe cero.

Perfil con día de semana y fecha; espacio superior 30px. Tarjetas posteriores de 48px, etiqueta y cantidad en la misma fila. Listas como tabla Nombre / Debe pagar hoy, importes alineados; hoy gris suave y pendientes verde suave. No cambia cálculos financieros.

Inicio se incorpora a informacionDescargada y a la copia privada por cuenta. Los cobros confirmados actualizan también Inicio. Datos conservados al navegar/recargar; renovación al primer uso después de las 06:00 Guatemala o Actualizar información, no una tarea en segundo plano con la aplicación cerrada. Se muestra estado de información antigua si falla la descarga. Cambios de otro dispositivo requieren actualizar o el corte diario.

Fotos en IndexedDB rm-private-photos-v1, separadas por usuario/empleado, nunca en caché pública del service worker. Precarga miniaturas de clientes; fotos completas se guardan cuando se abren. Renovación diaria/manual, sustitución de foto propia inmediata, eliminación al salir/cambiar cuenta. Si el navegador bloquea almacenamiento, no se garantiza persistencia tras recarga; si falla conexión se conserva foto anterior disponible. La copia local no equivale a cifrado del dispositivo ni elimina la necesidad de sesión para las API.

Publicación pendiente: collector-private-photos.js (nuevo), collector-cache.js, portal-common.js, client-photo.js, collector-profile-crop.js, collector-home.js, collector-home.css, collector-mobile.js, portal-cobrador.js, cobrador.html, sw.js (v131), lib/_portal.js y lib/_inicio-cobrador.js. No SQL nuevo para estos ajustes. 48 pruebas locales aprobadas, incluida persistencia/aislamiento de fotos y cliente adelantado visible con cero. Pruebas reales de navegador/teléfono pendientes; no afirmar despliegue confirmado.

### Inicio compacto y foto circular — cambios locales 12/10/2026

Solicitud posterior: foto circular (82x82, 72x72 en estrechos), sin texto visible Cambiar foto. Tocar imagen abre diálogo discreto «¿Quieres cambiar tu foto?» Cancelar/Cambiar foto. Confirmar abre archivos y editor circular con zoom y posición horizontal/vertical; Cancelar no sube ni sustituye foto. Recorte guardado 3:4 600x800, vista circular corresponde a área central cuadrada del mismo recorte, mantiene validación API y compresión <=250KB. No SQL nuevo.

Dos tarjetas de mismo alto 76px con Clientes asignados/cantidad y Mi planilla/cantidad; elimina explicación visual sueldo+papelería sin cambiar su cálculo de referencia. Listas sin desplegables, una fila con nombre clicable y pago hoy pequeño; no fotografía, municipio, saldo ni detalles adicionales por fila. No modifica filtros ni deudas. Archivo nuevo collector-profile-crop.js; cambiar collector-home.js, collector-home.css, portal-cobrador.js, cobrador.html, sw.js v130. Preparado, no desplegado confirmado. Pruebas locales de estructura, cancelación de selector, navegación y geometría del recorte; pendiente revisión real de interfaz y carga de foto en teléfono.

### Inicio del cobrador preparado — 12/10/2026

Nueva ruta Inicio como entrada predeterminada; nav móvil Inicio/Buscar/Cobrar/Menú. Directorio Teléfonos sigue accesible desde Menú, Buscar conserva ficha y llamadas en datos de contacto. Perfil propio con foto editable desde Inicio, nombre/cargo real de personal, total de asignaciones activas y enlace Mi planilla con la misma referencia sueldo + papelería de la sección existente (no neto definitivo con descuentos; rotulado referencia).

`lib/_inicio-cobrador.js` consulta exclusivamente créditos/clientes de IDs asignados y pagos de esos créditos, excluye diarios, filtra semanal. Motor collectionRow existente calcula pago hoy; pendiente anterior usa deuda programada hasta domingo anterior menos pagos posteriores hasta hoy, limitada a saldo oficial. Grupo de hoy incluye semanales con día correspondiente, crédito iniciado antes de hoy y cobro pendiente. Pendientes incluye atrasos de todas semanas anteriores, no duplica cliente en grupo de hoy. Deuda ya cubierta en la semana desaparece de pendientes. Base/caja/créditos no se modifican. Cuenta sin permiso clientes no recibe listas; sin información no recibe total planilla. Inicio requiere conexión para actualizarse, secciones anteriores mantienen caché propia.

Foto propia usa `/api/foto-personal` privado, sesión real sin aceptar otro empleado, valida JPEG 3:4 máximo 250 KB. Crop centrado y compresión local; se puede sustituir. SQL 027 crea `fotografias_empleados` privada y función service_role; sin tocar tabla personal ni registros financieros. SQL y publicación NO confirmados. Prueba local valida instalación, sustitución y denegación authenticated; API comprueba aislamiento y datos inválidos.

Publicar: api/foto-personal.js, lib/_inicio-cobrador.js, lib/_portal.js, collector-home.js, collector-home.css, collector-mobile.js, portal-cobrador.js, cobrador.html, sw.js. Primero SQL 027; no repetir anteriores. sw v129, mobile v22. Pruebas locales de pendientes, permiso, perfil/foto y conservación financiera aprobadas; pendiente verificación visual/uso real en teléfono. No afirmar total de planilla como pago definitivo.

### Nitidez de foto de ficha — ajuste local 12/10/2026

Usuario aclara que desea mejorar nitidez manteniendo tamaño actual 117x156, no agrandar de nuevo ni aplicar filtros artificiales. La ficha ahora usa /api/fotografia?id=... sin mini=1 (versión completa existente optimizada, subida limitada a 250 KB); búsqueda mantiene miniatura 90x120 con lazy loading. Solo la foto seleccionada de ficha carga full con eager y decoding async. Visor permanece full; no se modifican archivos de imagen ni se crean nuevas versiones. La calidad máxima sigue limitada por la foto almacenada. client-photo v6, collector-mobile v21, sw v128. Publicar client-photo.js, collector-mobile.js, portal-cobrador.js y sw.js. Sin SQL ni cambios CSS/tamaño. Preparado localmente, publicación no confirmada.

### Ajuste local más reciente del cobrador — 12/10/2026

Texto conversacional con conectores: nombre, lugar/municipio, «hoy lunes doce de octubre de dos mil veintiséis debe pagar …», atraso, saldo y cuota sin fragmentos de etiquetas. Se conservan fuentes y omisión de datos desconocidos. Lectura automática 500 ms y dos repeticiones; botón inmediato una repetición. Anula instrucciones anteriores de tres repeticiones. speech v4, mobile v20, foto v5, sw v127.

Miniatura de resultados no abre visor (data-photo-navigate, sin rol/button/tabindex de foto); evento pasa a tarjeta o enlace de ficha. La miniatura en detalles sí conserva visor. client-photo mantiene comportamiento interactivo por defecto fuera de resultados. Foto de ficha móvil aumenta de 78x104 a 117x156 (50% de tamaño visible, no nueva resolución del archivo); búsqueda permanece 45x60. Escritorio detalles también 117x156.

Publicar collector-speech.js, collector-mobile.js, portal-cobrador.js, client-photo.js, collector-mobile.css, sw.js. Sin SQL, sin cambio financiero. Pruebas específicas locales aprobadas; publicación y comprobación visual/audio en teléfono todavía no confirmadas.

### Narración y foto: cambios locales del 12/10/2026

Usuario solicita espera automática de 500 ms, fecha del día de consulta (Guatemala, igual fecha del sistema), municipio/lugar cuando existan y narración completa repetida tres veces. collector-speech v3 usa palabras para fecha/importe, mantiene nombres normalizados solo en audio y repeticiones en onend con pausa 500 ms; navegación cancela espera y repeticiones. Botón repetir vuelve a comenzar secuencia completa inmediatamente.

Botón «Escuchar resumen» ahora en misma fila que «Ver foto», debajo de identidad. Miniaturas del cobrador reservan espacio e icono sin foto; Ver foto permanece visible deshabilitado cuando no existe imagen. `client-photo.js` incorpora opciones reserve/keep usadas solo en cobrador, conservando comportamiento por defecto del administrador. Mobile foto 78x104 fija, tarjetas 45x60. Desktop también reserva miniatura y agrupa botones. sw v126, client-photo v4, collector-mobile v19.

Publicar: collector-speech.js, collector-mobile.js, collector-mobile.css, portal-cobrador.js, client-photo.js, sw.js. Sin SQL, sin cambios financieros. Pruebas de narración/cancelación/voz y placeholder local, no prueba visual/audio en teléfono real. Cambios preparados, despliegue no confirmado.

### Narración del cobrador preparada — 11/10/2026

Actualización local v2: nombres MAYÚSCULOS se normalizan a escritura de nombre solo al narrar (acentos preservados, pantalla sin cambios). Frase «Hoy debe pagar …» explícita; cero válido «Hoy no tiene un pago pendiente», datos faltantes no se inventan. Mobile reutiliza exactamente dueAmount ya mostrado y su disponibilidad; evita faltar al campo resumenCobro en copias antiguas. Autolectura programada dos segundos después de renderizar ficha/crédito, cancelable por navegación; botón repetir inmediato. Voz rate .92, tono normal y pausas por frases. sw v125, import collector-speech v2, collector-mobile v18. Tres pruebas específicas aprobadas (nombres, cantidades/estados, espera y callback cancelado, repetición y voz). Requiere publicar collector-speech.js, collector-mobile.js, portal-cobrador.js y sw.js. No SQL. Pronunciación final/autoplay siguen dependiendo de la voz real y políticas del teléfono; no se probó audio real en este entorno.

El usuario autorizó narrar automáticamente al abrir ficha de cliente y botón compacto verde «Escuchar resumen» para repetir; sin detener ni interruptor. Cambios locales, publicación no confirmada. `collector-speech.js` usa Web Speech y exclusivamente voces localService en español, preferencia Microsoft Sabina es-MX, luego local es-MX y luego otra local en español. No llama servicio externo. Disponibilidad de voz y reproducción automática dependen del navegador/dispositivo; si falta voz local o se bloquea, informa sin impedir consultar la ficha.

Se reutiliza collectionRow/createPaymentContext de `_cobros-supabase.js` para adjuntar `resumenCobro` (fecha, atrasos, pago hoy) a historial de `_clientes-supabase.js`; no otro motor financiero. Solo narra atraso/pago hoy con fecha actual y saldo del motor consistente con oficial; datos faltantes o copia de otro día no producen afirmación de estar al día. En semanal dice cuotas atrasadas, no días. PAGADO se narra pagado y CANCELADO cancelado solo con saldo cero; RENOVADO no equivale a cancelado. Conversión de moneda a palabras solo narración, cifras visuales conservadas. Selección de crédito narra ese crédito, no suma deuda otra vez.

Mobile botón absoluto al lado de Volver sin desplazar foto; escritorio flotante en ficha. Audio cancelado al navegar, abrir otro cliente, cambiar crédito/pestaña de movimientos, abrir menú, ocultar documento, salir y cerrar sesión. Caché sw v124. 40 pruebas no navegador aprobadas (incluyen dos de narración, preferencias y cancelación). Falta prueba visual y audio real en teléfonos; no prometer voz Sabina instalada en Android ni funcionamiento offline en todo equipo.

Publicar: collector-speech.js, collector-mobile.js, collector-mobile.css, portal-cobrador.js, lib/_clientes-supabase.js, lib/_cobros-supabase.js, sw.js. Sin SQL. Confirmar primero despliegue y recargar/Actualizar información para renovar historial almacenado antes del nuevo campo resumenCobro.

### Protecciones nuevas preparadas: SQL 026, sin ejecución productiva confirmada

El usuario autorizó implementar reintentos y validación de centavos. SQL 026 crea `contenidos_intentos` privada, conserva contenido JSON de operaciones nuevas con guard idempotente y rechaza reutilizar una clave con otros datos. Intentos anteriores sin contenido verificable se rechazan para revisión, no se reenvían automáticamente. Valida importes monetarios a máximo dos decimales antes de mutaciones, también en edición de cliente y cobros firmados. No altera base Q4,255 ni movimientos/pagos históricos. Requiere bloqueo de 021; repetible.

Web: `api.js` conserva por cuenta/acción clave + huella SHA256 en localStorage antes de enviar (no datos personales), reutiliza clave al recargar con los mismos datos y bloquea cambios mientras hay un intento incierto. Usa Web Locks donde disponible para coordinar pestañas. `lib/_supabase.js` y `api/operaciones.js` distinguen rechazo SQL con rollback comprobado de respuesta perdida/timeout. Conflictos de contenido RM001/RM002 no liberan intento pendiente. `sw.js` actualizado a rm-shell-v123.

38 pruebas no dependientes del navegador aprobadas tras cambios, incluyendo SQL 026, conservación financiera, repetición, rechazo de datos cambiados, centavos, aislamiento de cuentas, recarga simulada y falta de almacenamiento. Tres pruebas con navegador siguen pendientes por fallo de arranque de Edge en entorno aislado; no afirmar que toda interfaz quedó verificada. No hay prueba de simultaneidad real en varias pestañas/dispositivos. Recuperación necesita volver a los mismos datos; si no se recuerdan o el intento pertenece al código anterior, revisar registro existente antes de limpiar almacenamiento. No registrar de nuevo para resolver un bloqueo.

Publicación pendiente: respaldo actual de Supabase + aplicar únicamente SQL 026 sin capturas simultáneas, publicar `api.js`, `api/operaciones.js`, `lib/_supabase.js`, `sw.js`, recargar aplicación. No repetir 021–025. No se dispone de acceso productivo ni se generó backup completo en este turno.

### Plan posterior del usuario — retiro y reingreso Q430, solo documentado

Después de confirmar SQL 025, el usuario indicó que retirará Q430 del sistema para reflejar el efectivo disponible y volverá a ingresarlos cuando la persona que los cobró se los entregue. Solicita únicamente guardar esta intención. No se confirmó registro de retiro ni reingreso; el agente no realizó operaciones financieras. Base Q4,255 permanece vigente. No tratar esta nota como autorización para ejecutar movimientos automáticamente. La recepción posterior no es un nuevo abono del cliente ni debe duplicar los pagos existentes; una transferencia de cobros pendientes no debe clasificarse como gasto operativo. El Excel antiguo permanece sin cambios y no se sincroniza con Supabase. Ver nota local `C:/Users/Satanas/Documents/Codex/2026-10-03/estamos-continuando-la-migraci-n-del/PLAN_RETIRO_Y_REINGRESO_430.md`.

### Actualización prioritaria: Q430 explicados y SQL 025 preparado

**Ejecución confirmada por el usuario el 11/10/2026:** SQL 025 devolvió `base_4255_verificada` con `baseActual.fechaBase=2026-10-05`, `saldoInicial=4255`, `baseConfirmada=true`, `conciliacion=EXPLICADA`, `nuevosMovimientos=0` e `inicioSiguienteSemana.saldoInicial=1760`, confirmado desde la misma base. Por tanto, SQL 025 ya no está pendiente; no repetirlo ni revertir a Q3,825. El resultado es evidencia productiva aportada por el usuario; aún no se aportó captura de la interfaz ni ejecución automática posterior del cron. Los saldos futuros dependen de nuevos movimientos.

El 11/10 el usuario explicó que los abonos Q400 de Selvin y Q30 de Elvia eran válidos, pero la persona que los cobró todavía no los había entregado. Así, Q4,255 era el saldo total inicial del 05/10: Q3,825 efectivo más Q430 pendientes de entrega. Posteriormente confirmó que ya tiene los Q430 junto con el efectivo y autorizó corregir la base a Q4,255. Esta autorización sustituye la instrucción anterior de conservar indefinidamente Q3,825. No confundir total inicial con efectivo físico histórico ni afirmar que todo agosto está conciliado.

La consulta diagnóstica ejecutada por el usuario confirmó un pago y una entrada por cada caso, sin duplicados en las comprobaciones realizadas. El Excel `C:/Users/Satanas/Downloads/InversionesR&M.xlsx` coincide con los movimientos de septiembre: cierres guardados omitían Q30 y Q400. Agosto solo conserva resúmenes y detalle incompleto.

`supabase/migrations/20261011_025_conciliar_base_4255.sql` está preparado y probado localmente, NO confirmado ejecutado en Supabase. Conserva copia de base y conciliación anteriores en `correcciones_bases_caja` privada, cambia únicamente la base 05/10 a Q4,255, marca la diferencia histórica EXPLICADA conservando sus importes originales y actualiza saldos de cierres posteriores desde la base. No modifica abonos, créditos, movimientos ni cierres anteriores al 05/10. No genera un ingreso Q430 adicional. Un adelanto del propietario y su posterior devolución personal no deben generar otro cobro del negocio.

Con los movimientos de referencia Q15,165/Q17,660, resultado desde nueva base: Q1,760; no fijarlo en código, operaciones nuevas lo cambian. Cinco pruebas financieras aprobadas incluyendo no mutación de pagos/créditos/movimientos, conservación de cierres históricos, apertura Q4,255, arrastre Q1,760, evidencia anterior Q3,825, reejecución sin duplicación y permisos privados. Todavía requiere ejecución por el usuario y resultado `base_4255_verificada`. Las secciones siguientes describen el estado previo y su evidencia, no instrucciones para revertir SQL 025.

Proyecto activo: `C:/Users/Satanas/Desktop/inversiones-rm-supabase`.
Proyecto Supabase: `rm-gestion`. El usuario publica archivos manualmente en GitHub/Vercel y ejecuta los SQL en Supabase.
Respaldo anterior: `C:/Users/Satanas/Desktop/inversiones-rm-web-v2`; conservarlo.

Para caja, este documento actualiza las instrucciones históricas de `CONTINUIDAD_PROYECTO.md`. Las migraciones existentes no son una lista de tareas pendientes: 021 y 022 ya fueron ejecutadas por el usuario y verificadas mediante resultados y capturas.

## Base confirmada con efectivo

La base válida es **Q3,825.00 al comenzar el 05/10/2026**, guardada en `public.bases_caja_verificadas`.

El usuario confirmó con efectivo este reporte de la semana 05/10/2026–11/10/2026, consultado el 10/10:

| Concepto | Cantidad |
| --- | ---: |
| Dinero al comenzar la semana | Q3,825.00 |
| Cobrado | Q15,165.00 |
| Créditos entregados | Q13,620.00 |
| Gastos | Q610.00 |
| Planilla | Q2,330.00 |
| Préstamos al personal | Q100.00 |
| Pago de financiamiento | Q1,000.00 |
| Total de salidas | Q17,660.00 |
| Efectivo disponible confirmado | **Q1,330.00** |

Comprobación: `3825 + 15165 - 17660 = 1330`.
Q1,330 es el resultado de esos movimientos, no un valor que deba fijarse en código. Nuevas operaciones lo cambian.

## Qué ocurrió

1. Inicio y Gastos usaban consultas históricas que podían devolver una lista incompleta por paginación. Auditoría sí mostraba gastos recientes. El usuario volvió a registrar gasolina Q110 y comida Q35 del 10/10 al no verlos en Inicio.
2. Se corrigieron las lecturas con filtros por período, paginación completa y controles de conteo/orden. El límite exacto de producción no fue medido; no afirmar que era necesariamente 1,000. Las pruebas simularon un servidor que entrega solo 300 filas por página.
3. SQL 021 unificó el cálculo de caja desde movimientos y recalculó ocho cierres desde la base antigua del 10/08, Q8,800. El resultado fue Q5,480 al comenzar la semana del 05/10 y Q2,985 disponibles. Esos importes no coincidían con el efectivo.
4. La investigación mostró que el registro antiguo de caja estaba incompleto. Había pagos de clientes desde mayo, pero los movimientos de caja aportados comenzaban en septiembre. Ejemplo: semana del 10/08 tenía Q9,855 en `pagos_clientes` y Q0 en movimientos de caja para esos cobros.
5. SQL 021 asumió incorrectamente que podía reconstruir todo el histórico desde caja. Las semanas 10/08–06/09 quedaron con cero movimientos y Q8,800 repetidos. Sus ceros no prueban ausencia de operaciones.
6. La comparación por semana no mostró diferencias desde el 07/09 en los conceptos examinados: cobros, créditos nuevos/renovaciones, planilla y préstamos al personal. Esto no constituye validación completa de todo el historial.
7. El usuario confirmó mediante reporte y efectivo Q1,330, con base Q3,825. SQL 022 incorporó esa base explícita y separó el cálculo posterior del historial incompleto.

La diferencia Q1,655 entre Q5,480 y Q3,825 fue consecuencia del cambio de base y reconstrucción; no se identificó como un gasto real faltante. No crear una salida artificial para compensarla.
Las capturas posteriores mostraron gastos Q610, Q145 menos que Q755. El agente no eliminó gastos en producción y no dispone de confirmación de los identificadores eliminados.

## Cambios aplicados y confirmaciones

- `supabase/migrations/20261010_021_caja_consistente_y_reintentos.sql`: lecturas agregadas en servidor, cierre desde movimientos, propagación de correcciones históricas, bloqueo de reintentos financieros, índices y programación diaria. El usuario devolvió `ok:true`, `cerrado:true`, `semanas:8`, `saldoFinal:5480`. Ese resultado probó ejecución, no exactitud contable del histórico.
- `supabase/migrations/20261010_022_base_caja_verificada.sql`: crea la tabla de bases verificadas; guarda 05/10/2026 Q3,825; cambia `saldo_caja_al_inicio` y el origen del cierre automático para usar la base verificada. No inserta gastos, cobros ni créditos.
- Resultado de 022 aportado por el usuario: `{"fechaBase":"2026-10-05","saldoInicial":3825,"baseConfirmada":true}`.
- Capturas posteriores de Inicio y Auditoría actual: base Q3,825, entradas Q15,165, salidas Q17,660, disponible Q1,330. Coinciden con el efectivo confirmado por el usuario.
- El cron `inversiones-rm-cierre-semanal` aparece activo con `0 6 * * *` (programación UTC: medianoche de Guatemala). La ejecución observada con `succeeded` fue 05/10/2026, anterior a 021/022. Todavía no se aportó evidencia de una ejecución automática posterior a 022. No afirmar que se verificó ese evento futuro.

## Cómo funciona desde ahora

- `saldo_caja_al_inicio(fecha)` usa la base verificada más reciente que no sea posterior a la fecha y suma entradas menos salidas desde la base, incluyendo su día y excluyendo el día consultado.
- Inicio, Reportes y Auditoría consultan esa función. Las sumas históricas de apertura se hacen en PostgreSQL; no dependen de descargar la primera página de movimientos.
- El cierre automático parte de la base verificada y recalcula únicamente semanas terminadas, de lunes a domingo. No cierra anticipadamente la semana actual.
- El trigger de movimientos históricos puede ejecutar el cierre; un movimiento anterior al 05/10 no altera la base confirmada. Una corrección desde el 05/10 sí cambia los saldos posteriores, como corresponde.
- La base no vence al pasar de semana, mes o año. Si no hay más movimientos, Q1,330 sería el inicio de la siguiente semana; si los hay, se arrastra el resultado actualizado.
- Actualmente la apertura agrega movimientos desde la base y el cierre recorre semanas desde ella. No afirmar que solamente consulta una semana para todos los cálculos. Hay índices por fecha; no se ha realizado una prueba de carga de un año completo de producción.
- Los cierres son resúmenes. Las migraciones de corrección no reescribieron abonos ni saldos de créditos; los historiales de clientes usan sus pagos y créditos, no los ceros de la tabla comparativa.

## Limitaciones conocidas pendientes

1. Auditoría antes del 05/10 muestra saldo inicial/final sin confirmar y permite ver movimientos registrados. No significa saldo cero ni historial completo. El texto actual “No hay un cierre anterior” es impreciso: existen cierres antiguos, pero no una base verificada aplicable.
2. Las cuatro semanas originales de agosto fueron restauradas por 023 (confirmación visual). SQL 024 corrigió las cuatro semanas de septiembre, con resultado confirmado por el usuario. Falta comunicar en la interfaz la diferencia pendiente -Q430 al 05/10 y el estado de verificación del historial; no tratar el historial como conciliación completa de efectivo.
3. Reportes antiguos reciben `baseCajaConfirmada:false`, pero la presentación todavía no comunica esa limitación de forma consistente, incluyendo exportaciones. No tratar esos saldos como validados.
4. SQL 023 fue ejecutado por el usuario: su resultado confirmó los cuatro cierres originales restaurados (10/08–06/09) y la base actual Q3,825 intacta. No restaura los cierres de septiembre alterados por 021 ni completa el registro antiguo de movimientos de caja.
5. La coincidencia actual con efectivo no garantiza ausencia de futuros registros duplicados, omitidos o errores distintos. No prometer que nunca habrá fallos.

Estos pendientes históricos no alimentan la caja desde la base confirmada. El usuario pidió documentar el estado; esta documentación no implementa los pendientes de interfaz.

## Reglas para futuras modificaciones

- Mantener la base 05/10/2026 Q3,825 y su evidencia. No volver a escoger automáticamente el cierre más antiguo como base actual.
- No volver a ejecutar SQL 021 en producción: reemplazaría las funciones corregidas por 022. SQL 022 verifica la definición de 021 y no está diseñado para repetirse después de aplicado; usar una migración posterior revisada para cualquier cambio.
- No reimportar todo el histórico ni generar movimientos de caja por cada pago antiguo sin conciliar: podría duplicarse dinero ya incorporado a la base.
- No convertir resúmenes históricos no verificados en cambios de deuda, pagos o gastos artificiales.
- Antes de una reconstrucción contable, conservar los cierres y movimientos originales, definir el período y contrastar contra una base comprobada. Probar antes de producción.
- Mantener filtros de fecha, paginación completa, orden estable y comprobaciones de conteo; una actualización fallida no debe presentarse como exitosa usando datos viejos.
- En una revisión anterior el usuario excluyó el hallazgo 4: conservar la aceptación de montos positivos como Q750 en registro de crédito. No confundir esa decisión con la regla específica de papelería automática.
- Distinguir siempre código preparado localmente, SQL ejecutado por el usuario y comportamiento observado en producción. No inferir que todos los archivos locales fueron publicados.
- No guardar claves privadas ni datos de acceso en documentación.

## Archivos y pruebas de referencia

- Migraciones 021 y 022; `supabase/verificar_cierre_automatico.sql` (solo consultas).
- `lib/_caja-supabase.js`, `lib/_dashboard-supabase.js`, `lib/_reportes-supabase.js`, `lib/_auditoria-supabase.js`.
- `lib/_supabase.js`: paginación y consultas por IDs.
- `dashboard.js`, `reportes.js`, `auditoria.js`: presentación que debe considerar el estado de verificación histórica.
- `tests/financial-integrity.test.cjs`: cinco pruebas pasaron después de 022. Incluyen base Q3,825, movimientos Q15,165/Q17,660, resultado Q1,330, aislamiento de correcciones anteriores y permisos. Se probaron localmente con PGlite, no en la base productiva.
- Antes de 022 se reportaron 39 pruebas completas aprobadas; no afirmar que se repitió toda la batería después de 022. La verificación posterior fue la batería financiera de cinco pruebas.

Comando local de la batería financiera: `node --test tests/financial-integrity.test.cjs`. Requiere la dependencia local PGlite en `.tmp-portal-tests/node_modules`.

Consulta de solo lectura para revisar la base y apertura:

```sql
select fecha,saldo,motivo from public.bases_caja_verificadas order by fecha;
select public.saldo_caja_al_inicio('2026-10-05'::date);
```

El archivo `supabase/verificar_cierre_automatico.sql` consulta cron, ejecuciones y cierres. Los cierres anteriores al 05/10 siguen siendo históricos no verificados aunque aparezcan en sus resultados.

## Restauración confirmada de cuatro cierres originales — SQL 023

El usuario autorizó recuperar las cuatro semanas que quedaron en cero, manteniendo independiente la base del 05/10. Se encontró el respaldo local original en `C:/Users/Satanas/Downloads/importar_datos_supabase.sql`, líneas 3190–3193, SHA256 `DEC4407DA49780D6F798C0C85ED4E4E7DB0C9693A5D8FE73E6EE90FC3BFE56FB`.

Los datos guardados originales son:

| Inicio | Cobrado | Gastos | Créditos entregados | Saldo final |
| --- | ---: | ---: | ---: | ---: |
| 10/08/2026 | Q16,945 | Q4,275 | Q16,440 | Q3,320 |
| 17/08/2026 | Q16,685 | Q4,635 | Q14,525 | -Q500 |
| 24/08/2026 | Q15,135 | Q3,785 | Q6,475 | Q3,230 |
| 31/08/2026 | Q14,700 | Q2,995 | Q6,415 | Q7,575 |

El negativo -Q500 y los desgloses originales se conservan como estaban guardados; no constituyen una validación adicional del efectivo histórico. En las tres primeras semanas el respaldo conserva total de créditos distinto de la suma de sus subcategorías; no inventar un reparto para corregirlo. Los resúmenes originales tampoco coinciden necesariamente con la suma de los pagos importados: son fotografías del respaldo, no una conciliación nueva.

Archivo preparado: `supabase/migrations/20261010_023_restaurar_cuatro_cierres_originales.sql`.

- Verifica antes de escribir que exista la base 05/10 Q3,825 y que el cierre automático utilice bases verificadas. Exige las cuatro filas originales esperadas.
- Comparte el bloqueo del cierre automático; guarda copias de los valores actuales y restaurados en `public.restauraciones_cierres_historicos`, con fuente y fecha.
- Actualiza exclusivamente esas cuatro filas de `cierres_semanales`, conserva sus identificadores y recupera todos los campos disponibles en el respaldo. Campos de financiamiento posteriores a la importación original quedan en cero para esas filas.
- No cambia pagos, créditos, movimientos de caja, base verificada, cron ni las filas semanales posteriores. No vuelve a ejecutar 021 ni 022.
- Es repetible sin perder la primera copia de los valores anteriores. La evidencia está protegida con RLS y permisos privados.
- Devuelve `restauracion_verificada` con los cuatro resúmenes y `baseActual` Q3,825.
- La batería financiera de cinco pruebas pasó después de incorporar 023. Se comprobó igualdad de pagos, créditos, movimientos, base y otros cierres antes/después, conservación del respaldo al repetir y que el cierre automático no sobrescriba las cuatro semanas.
- Ejecutado en Supabase por el usuario y confirmado mediante el resultado `restauracion_verificada`: cuatro semanas con los valores de la tabla anterior, baseActual `fechaBase:2026-10-05`, `saldoInicial:3825`, `baseConfirmada:true`. El usuario también compartió la tabla de Inicio con las cuatro semanas restauradas. No es necesario volver a ejecutar SQL 023.

Auditoría histórica seguirá sin una base de efectivo verificada anterior al 05/10 y solo consulta movimientos de caja. Restaurar estas fotografías para la tabla de Inicio no agrega movimientos ausentes ni valida automáticamente sus saldos en Auditoría.

## Diagnóstico exacto de la diferencia Q1,655

Se compararon los cierres del respaldo original, los pagos individuales del mismo respaldo y los totales de Supabase proporcionados por el usuario. La diferencia se descompone así:

| Concepto | Cierre original | Recálculo 021 | Diferencia |
| --- | ---: | ---: | ---: |
| Base al iniciar 07/09 | Q7,575 | Q8,800 | Q1,225 |
| Cobros semana 07/09–13/09 | Q14,160 | Q14,190 | Q30 |
| Cobros semana 14/09–20/09 | Q14,335 | Q14,735 | Q400 |
| Total | | | **Q1,655** |

Las salidas comparadas de esas semanas coinciden. Los abonos individuales ya presentes en la importación original suman Q14,190 (154 pagos) y Q14,735 (164 pagos). El respaldo contiene exactamente estos dos pagos cuyos identificadores son posteriores al cierre de sus semanas:

- `PAGO-20260929-010309-3DD3C4`, cliente 76, ELVIA BEATRIZ RAMIREZ ESTEVEZ, fecha del abono 11/09/2026, Q30. Movimiento asociado `MOV-CAJA-COBRO-20260929-010310-039123`.
- `PAGO-20260924-193012-4A219F`, cliente 39, SELVIN ORLANDO MARTÍNEZ SANTOS, fecha del abono 16/09/2026, Q400. Movimiento asociado `MOV-CAJA-COBRO-20260924-193014-AF825B`.

El código original `apps-script/ListaDeCobro.gs::crearIdPagoCobroLista_` y `07_GuardarCobrosCobrador.gs::MC_GC_crearIdPago_` genera la fecha del identificador usando `new Date()` en Guatemala. Esto respalda la interpretación de que fueron registrados el 29/09 y el 24/09, con fechas de abono anteriores. No son timestamps productivos consultados directamente; la evidencia proviene del respaldo y la convención de IDs. No afirmar que son pagos falsos o duplicados.

Los cierres originales no incluían esos Q430 aunque los pagos y sus movimientos ya estaban en el respaldo exportado. El recálculo sí los incluyó. La causa contable completa queda descompuesta, pero validar por qué no están reflejados en el efectivo confirmado requiere revisar esos dos abonos con el usuario; no borrar ni descontarlos automáticamente.

Pruebas aritméticas:

- `Q5,480 - Q1,225 = Q4,255`: corrigiendo solo el arrastre de agosto, los movimientos registrados aún producen Q430 más que la base confirmada Q3,825.
- `Q4,255 - Q30 - Q400 = Q3,825`: explica la diferencia, no autoriza eliminar los abonos.
- El respaldo cierra 21/09–27/09 en Q1,525. Al sumar el neto Q2,300 de 28/09–04/10 aportado por el usuario se obtiene Q3,825. El respaldo disponible no contiene un cierre original del 28/09; este último cálculo es reconstrucción, no una fila recuperada.

El usuario confirmó el 11/10 que ambos pagos son válidos y fueron ingresados en Google Sheets con esas fechas de abono; el sistema antiguo no actualizó los cierres. Autorizó preparar SQL 024. La base confirmada Q3,825 se conserva según instrucción expresa; la diferencia residual Q430 debe explicarse antes de presentar todo el histórico como conciliado.

## Corrección de septiembre confirmada — SQL 024, 11/10/2026

Archivo: `supabase/migrations/20261011_024_corregir_arrastre_septiembre.sql`. Ejecutado en Supabase por el usuario y confirmado mediante `correccion_septiembre_verificada`: los cuatro cierres coinciden con la tabla siguiente, la base sigue Q3,825 y la diferencia -Q430 está PENDIENTE. No es necesario repetir las migraciones. No hay todavía una captura posterior de Inicio que confirme visualmente estos cuatro cierres corregidos.

Corrige exclusivamente el saldo inicial, resultado y saldo final de los cuatro cierres revisados:

| Inicio | Saldo inicial | Entradas | Salidas | Saldo final |
| --- | ---: | ---: | ---: | ---: |
| 07/09/2026 | Q7,575 | Q14,190 | Q13,570 | Q8,195 |
| 14/09/2026 | Q8,195 | Q14,735 | Q19,305 | Q3,625 |
| 21/09/2026 | Q3,625 | Q16,210 | Q17,880 | Q1,955 |
| 28/09/2026 | Q1,955 | Q16,475 | Q14,175 | Q4,255 |

La base actual sigue Q3,825. El salto de -Q430 al 05/10 queda documentado en `public.conciliaciones_caja_historica`: `saldo_historico=4255`, `saldo_base_confirmado=3825`, `diferencia=-430`, `estado=PENDIENTE`. No representa un gasto registrado ni resuelve su causa.

SQL 024 utiliza también `restauraciones_cierres_historicos` para guardar los valores antes/después con migración 024. Solo consulta `bases_caja_verificadas`, `pagos_clientes` y `movimientos_caja`; conserva base, pagos y movimientos. No cambia funciones, cron, clientes, créditos, agosto ni los cierres desde el 05/10.

Antes de actualizar valida: base 05/10 Q3,825, función de cierre de 022, cierre anterior Q7,575, presencia de las cuatro semanas, importes de los cierres y sumas reales de caja iguales a los revisados, y existencia de los dos pagos confirmados. Si algo difiere, cancela la transacción para revisar el nuevo estado. Usa bloqueo temporal de caja y cierre para evitar cambios durante la validación. No ejecutar mientras se está capturando un lote de operaciones para evitar esperas innecesarias.

Es repetible conservando la primera evidencia. La conciliación y las evidencias están protegidas por RLS y permisos privados. Devuelve `correccion_septiembre_verificada` con cuatro cierres, base actual y diferencia pendiente.

Cinco pruebas financieras aprobadas tras 024: conservación íntegra de base/pagos/créditos/movimientos/agosto y otros cierres; cadena corregida; Q430 pendientes; reejecución sin perder respaldo; cierre automático sin modificar septiembre corregido; Q3,825/Q1,330 desde la base; cancelación cuando los importes cambian; bloqueo de lectura pública de la conciliación. Son pruebas locales con PGlite, no ejecución productiva.

## Revisión de posible duplicación de Q430 — 11/10/2026

En el respaldo original, cada abono indicado (Selvin Q400 y Elvia Q30) aparece exactamente una vez para ese cliente y fecha, con una sola entrada de caja vinculada. No se encontró otra entrada con el mismo nombre y fecha. Esto no demuestra que Supabase actualmente esté libre de duplicados.

El cálculo actual de caja suma exclusivamente `movimientos_caja`; no suma además `pagos_clientes`. Por tanto, la existencia de un pago y su entrada de caja asociada no constituye doble conteo en ese cálculo.

Se preparó `supabase/diagnosticar_abonos_430.sql`, de solo lectura, para revisar los pagos, todas sus entradas vinculadas (incluso en otras fechas), pagos repetidos y movimientos candidatos sin pago asociado. Los candidatos no deben considerarse duplicados sin revisar. Está pendiente que el usuario lo ejecute en Supabase y comparta el resultado. No se modificaron pagos, caja ni la base confirmada.

Prueba local `tests/cash-payment-diagnostic.test.cjs`: una prueba aprobada, cubriendo vínculo normal, duplicación de caja en otra fecha, pagos repetidos y candidatos sin vínculo. No equivale a una comprobación productiva.

## Mensaje para comenzar otro chat (actualizado)

“Continuamos el proyecto en C:/Users/Satanas/Desktop/inversiones-rm-supabase. Lee primero AGENTS.md y ESTADO_CAJA_Y_CONTINUIDAD.md. La base confirmada es Q3,825 al 05/10/2026; SQL 021–024 ya fueron ejecutados. SQL 024 corrigió cuatro cierres de septiembre con los abonos válidos y confirmó cierre Q4,255 al 04/10, base Q3,825 intacta y diferencia -Q430 PENDIENTE. No recalcules desde agosto ni repitas las migraciones aplicadas.”
