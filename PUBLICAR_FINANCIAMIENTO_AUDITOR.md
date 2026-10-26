# Financiamiento Auditor — 25/10/2026

Preparado localmente. Publicar juntos:

1. auditor.js
2. auditor.css
3. auditor.html
4. sw.js
5. lib/_auditor.js
6. api/auditor.js

Versiones JS10/CSS11/SW159. Reutiliza lib/_financiamientos-supabase.js ya existente y los archivos previos del Auditor; no requiere SQL, tablas ni migraciones nuevas. No modifica caja, créditos, préstamos, pagos, roles o sesiones. Base confirmada4255 intacta.

## Secciones

- Financiamiento: dinero recibido y pagos en caja de la semana actual, deuda pendiente actual y lista de aportes/préstamos/compras financiadas. Cada ficha muestra datos guardados y movimientos propios ordenados recientes primero, con día. Capital aportado se etiqueta distinto de deuda pendiente. Registros históricos/no afectan caja se identifican sin convertirlos en entradas nuevas.
- Abonos del personal: categoría5 de auditoría oficial; no confundir descuentos por planilla con abonos efectivos en caja.
- Otros movimientos de caja: categoría8, entradas/salidas/neto y detalle por movimiento.
- Inicio: añade importes de estas categorías al resumen semanal, sin sumarlos nuevamente a indicadores existentes.

Caja de semana = grupos6/7; saldos y movimientos del financiamiento = servicio existente, pueden corresponder a otras fechas. No son dos fuentes que se suman entre sí. No reconstruye cierres ni historia general. Selección por IDs, no por nombre. No nuevo polling. Consulta financiación al entrar, invalida copia al refrescar resumen/volver a app. API privada no-store GET exclusiva AUDITOR/ADMIN. POST y rol COBRADOR rechazados.

## Verificación

101 pruebas automáticas y navegador con datos ficticios aprobados: permisos, totales del servicio, pagos históricos sin caja, navegación de entradas/pagos, abonos personal y otros, volver, móviles sin desbordamiento. Captura inspeccionada. No ejecución productiva ni publicación desde este chat.

Después de publicar: aceptar actualización, abrir Menú/Financiamiento, contrastar un aporte y un préstamo/pago conocido con el administrador. Revisar abonos/otros si existen esa semana; si no existen deben mostrar cero/Sin movimientos. Un error debe mostrar Reintentar y no presentar consulta fallida como actualización exitosa. Pendiente prueba de teléfono físico/cuenta real.
