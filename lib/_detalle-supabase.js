const supabase=require('./_supabase');

async function weeklyDetail(dateReceived=''){
  const period=weekRange(dateKey(dateReceived)||todayKey());
  const[clients,cash,credits,payroll,loanMovements]=await Promise.all([
    supabase.selectAll('clientes',{select:'id_cliente,nombre',order:'id_cliente.asc'}),
    supabase.selectAll('movimientos_caja',{select:'fecha,tipo_movimiento,descripcion,salida,fila_google_sheets',and:`(fecha.gte.${period.inicio},fecha.lte.${period.fin})`,order:'fecha.asc,id_movimiento.asc'}),
    supabase.selectAll('creditos',{select:'id_credito,id_cliente,fecha_inicio,tipo_credito,monto_credito,saldo_absorbido,papeleria,monto_entregado,papeleria_trabajador,id_empleado_papeleria,nombre_empleado_papeleria,estado_pago_papeleria,fila_google_sheets',and:`(fecha_inicio.gte.${period.inicio},fecha_inicio.lte.${period.fin})`,order:'fecha_inicio.asc,id_credito.asc'}),
    supabase.selectAll('pagos_planilla',{select:'id_pago,id_empleado,fecha,nombre_completo,puesto,sueldo_base,papeleria,descuento_prestamo,otros_descuentos,total_recibir,total_pagado,fila_google_sheets',and:`(fecha.gte.${period.inicio},fecha.lte.${period.fin})`,order:'fecha.asc,id_pago.asc'}),
    supabase.selectAll('movimientos_prestamos_personal',{select:'fecha,nombre_completo,tipo_movimiento,descripcion,cantidad_aumenta,saldo_despues_movimiento,fila_google_sheets',and:`(fecha.gte.${period.inicio},fecha.lte.${period.fin})`,order:'fecha.asc,id_movimiento.asc'})
  ]);
  const clientNames=new Map(clients.map(item=>[text(item.id_cliente),text(item.nombre)]));
  const within=value=>{const date=dateKey(value);return date&&date>=period.inicio&&date<=period.fin};
  const expenses=cash.filter(item=>within(item.fecha)&&normalize(item.tipo_movimiento).includes('GASTO')).map(item=>({fecha:dateKey(item.fecha),tipo:text(item.tipo_movimiento),descripcion:text(item.descripcion),salida:money(item.salida),origen:''})).sort(byDateDesc);
  const delivered=credits.filter(item=>within(item.fecha_inicio)&&!normalize(item.tipo_credito).includes('UNIFIC')).map(item=>({idCredito:text(item.id_credito),idCliente:text(item.id_cliente),fecha:dateKey(item.fecha_inicio),dia:dayName(item.fecha_inicio),tipo:text(item.tipo_credito),cliente:clientNames.get(text(item.id_cliente))||'',montoCredito:money(item.monto_credito),saldoAnterior:money(item.saldo_absorbido),papeleria:money(item.papeleria),dineroEntregado:money(item.monto_entregado),papeleriaTrabajador:money(item.papeleria_trabajador),idEmpleadoPapeleria:text(item.id_empleado_papeleria),nombreEmpleadoPapeleria:text(item.nombre_empleado_papeleria),estadoPapeleria:paperworkStatus(item)})).sort(byDateDesc);
  const paidPayroll=payroll.filter(item=>within(item.fecha)).map(item=>({idPago:text(item.id_pago),idEmpleado:text(item.id_empleado),fecha:dateKey(item.fecha),empleado:text(item.nombre_completo),puesto:text(item.puesto),sueldoBase:money(item.sueldo_base),papeleria:money(item.papeleria),descuentoPrestamo:money(item.descuento_prestamo),otrosDescuentos:money(item.otros_descuentos),totalRecibir:money(item.total_recibir)})).sort(byDateDesc);
  const staffLoans=loanMovements.filter(item=>within(item.fecha)&&money(item.cantidad_aumenta)>0).map(item=>({fecha:dateKey(item.fecha),empleado:text(item.nombre_completo),tipo:text(item.tipo_movimiento),descripcion:text(item.descripcion),cantidad:money(item.cantidad_aumenta),saldo:money(item.saldo_despues_movimiento)})).sort(byDateDesc);
  return{periodo:period,gastos:{total:sum(expenses,'salida'),items:expenses},creditos:{total:sum(delivered,'dineroEntregado'),items:delivered},planilla:{total:sum(paidPayroll,'totalRecibir'),items:paidPayroll},prestamos:{total:sum(staffLoans,'cantidad'),items:staffLoans}};
}

function weekRange(value){const date=parseDate(value);const day=date.getUTCDay();const distance=day===0?-6:1-day;const start=addDays(dateKey(date),distance);return{inicio:start,fin:addDays(start,6)}}
function sum(rows,key){return money(rows.reduce((total,item)=>total+money(item[key]),0))}
function byDateDesc(a,b){return String(b.fecha||'').localeCompare(String(a.fecha||''))}
function paperworkStatus(item){const saved=normalize(item.estado_pago_papeleria);if(saved==='PAGADO'||saved==='PAGADA')return'PAGADA';if(money(item.papeleria_trabajador)>0&&text(item.id_empleado_papeleria))return'PENDIENTE';if(saved==='NO SE PAGARA'||saved==='NO SE PAGARÁ'||money(item.papeleria_trabajador)===0&&saved)return'NO SE PAGARÁ';return'SIN DEFINIR'}
function dayName(value){const names=['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];return names[parseDate(value).getUTCDay()]||''}
function addDays(value,days){const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);return dateKey(date)}
function parseDate(value){const key=dateKey(value);return new Date(`${key}T00:00:00.000Z`)}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const raw=text(value);const match=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];const date=new Date(raw);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={weeklyDetail};
