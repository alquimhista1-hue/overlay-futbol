const supabase=require('./_supabase');

const RPC={
  guardarEmpleado:'guardar_empleado_operacion',
  archivarEmpleado:'archivar_empleado_operacion',
  registrarClienteCredito:'registrar_cliente_credito_operacion',
  registrarCliente:'registrar_cliente_operacion',
  registrarCredito:'registrar_credito_operacion',
  registrarPagoCliente:'registrar_pago_cliente_operacion',
  registrarPagosLote:'registrar_pagos_lote_operacion',
  registrarGasto:'registrar_gasto_operacion',
  registrarGastosLote:'registrar_gastos_lote_operacion',
  registrarMovimientoPersonal:'registrar_movimiento_personal_operacion',
  asignarClientes:'asignar_clientes_operacion',
  guardarPapelerias:'guardar_papelerias_operacion',
  guardarBorradorPlanilla:'guardar_borrador_planilla_operacion',
  guardarPlanilla:'guardar_planilla_operacion',
  guardarContrato:'guardar_contrato_operacion',
  registrarFinanciamiento:'registrar_financiamiento_operacion',
  registrarPagosFinanciamiento:'registrar_pagos_financiamiento_operacion',
  editarFinanciamiento:'editar_financiamiento_operacion'
};

async function execute(action,data,user){
  if(action==='estadoImportacion')return require('./_importaciones-anotaciones').status(data);
  if(action==='resumenDelDia')return require('./_resumen-cobradores').daily();
  if(action==='reporteCobrador')return require('./_resumen-cobradores').report(data);
  if(action==='previsualizarAnotaciones')return require('./_importaciones-anotaciones').preview(data);
  if(action==='revisarImportacion')return require('./_importaciones-anotaciones').review(data);
  if(['registrarPagosLote','registrarGastosLote'].includes(action)&&data?.items?.some(item=>item.origenes?.length)){
    if(!String(data.clave||'').trim())throw Error('Falta el identificador de la operación.');
    return supabase.rpc('registrar_lote_anotaciones_controlado',{datos:{...data,usuario:String(user||''),tipo:action==='registrarPagosLote'?'COBRO':'GASTO'}});
  }
  if(action==='rechazarContratoManual'||(action==='registrarClienteCredito'&&data?.idContrato)){
    if(data?.idSolicitud)throw new Error('Seleccione solo una solicitud o un contrato manual.');
    if(!String(data?.clave||'').trim())throw new Error('Falta el identificador de la operación.');
    return supabase.rpc('administrar_contrato_manual',{datos:{...data,usuario:String(user||''),accion:action==='rechazarContratoManual'?'RECHAZAR':'REGISTRAR'}});
  }
  if(action==='guardarContrato'&&data?.idContrato){
    const existing=await supabase.select('contratos',{select:'estado',id_contrato:'eq.'+data.idContrato,limit:1});
    if(['CREDITO_REGISTRADO','RECHAZADO'].includes(existing[0]?.estado))throw new Error('Este contrato está archivado. Puede consultarlo e imprimirlo, pero no modificarlo.');
    const linked=await supabase.select('solicitudes_clientes',{select:'id,estado',id_contrato:'eq.'+data.idContrato,limit:1});
    if(linked[0]&&linked[0].estado!=='CREDITO_REGISTRADO'&&linked[0].id!==data.idSolicitud)throw new Error('Abra la solicitud vinculada para editar este contrato.');
  }
  const rpc=data?.idSolicitud&&action==='guardarContrato'?'guardar_contrato_solicitud':data?.idSolicitud&&['registrarClienteCredito','registrarCredito'].includes(action)?'registrar_credito_solicitud':RPC[action];if(!rpc)throw new Error('La operacion solicitada no existe.');
  const payload={...(data||{}),usuario:String(user||''),clave:String(data?.clave||'').trim()};
  if(!payload.clave)throw new Error('Falta el identificador unico de la operacion.');
  return supabase.rpc(rpc,{datos:payload});
}

async function catalogues(){
  const[clients,staff,credits,loans,assignments]=await Promise.all([
    supabase.selectAll('clientes',{select:'id_cliente,nombre,dpi,telefono,direccion,municipio,lugar,estado',order:'nombre.asc'}),
    supabase.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,sueldo_base,estado',order:'nombre_completo.asc'}),
    supabase.selectAll('creditos',{select:'id_credito,id_cliente,tipo_credito,modalidad_pago,dia_pago,cuota,saldo_actual,estado_credito',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0',order:'fecha_inicio.desc,id_credito.desc'}),
    supabase.selectAll('prestamos_personal',{select:'id_prestamo,id_empleado,saldo_pendiente,descuento_sugerido,estado',estado:'eq.ACTIVO',saldo_pendiente:'gt.0',order:'fecha_inicial.desc'}),
    supabase.selectAll('asignaciones_cobro',{select:'id_cliente,id_cobrador,nombre_cobrador,estado,fecha_asignacion',order:'fecha_asignacion.desc'})
  ]);
  const activeCredits=credits.filter(item=>normalize(item.estado_credito)==='ACTIVO'&&money(item.saldo_actual)>0);
  const activeLoans=loans.filter(item=>normalize(item.estado)==='ACTIVO'&&money(item.saldo_pendiente)>0);
  const activeAssignments=new Map();assignments.filter(item=>normalize(item.estado)==='ACTIVO').forEach(item=>{const id=text(item.id_cliente);if(!activeAssignments.has(id))activeAssignments.set(id,item)});
  return{
    clientes:clients.filter(item=>normalize(item.estado)==='ACTIVO').map(item=>{const id=text(item.id_cliente);const assignment=activeAssignments.get(id);return{idCliente:id,nombre:text(item.nombre),dpi:text(item.dpi),telefono:text(item.telefono),direccion:text(item.direccion),municipio:text(item.municipio),lugar:text(item.lugar),credito:publicCredit(activeCredits.find(credit=>text(credit.id_cliente)===id)),asignacion:assignment?{idCobrador:text(assignment.id_cobrador),nombreCobrador:text(assignment.nombre_cobrador)}:null}}),
    personal:staff.filter(item=>normalize(item.estado)==='ACTIVO').map(item=>({idEmpleado:text(item.id_empleado),nombre:text(item.nombre_completo),puesto:text(item.puesto),sueldoBase:money(item.sueldo_base),prestamo:publicLoan(activeLoans.find(loan=>text(loan.id_empleado)===text(item.id_empleado)))}))
  };
}

async function payrollPreview(dateReceived=''){
  const date=dateKey(dateReceived)||todayKey();const period=weekRange(date);
  const[staff,loans,credits]=await Promise.all([
    supabase.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,sueldo_base,estado',order:'fila_google_sheets.asc,id_empleado.asc'}),
    supabase.selectAll('prestamos_personal',{select:'id_prestamo,id_empleado,saldo_pendiente,descuento_sugerido,estado',order:'fecha_inicial.desc'}),
    supabase.selectAll('creditos',{select:'fecha_inicio,id_empleado_papeleria,papeleria_trabajador,estado_pago_papeleria',and:`(fecha_inicio.gte.${period.inicio},fecha_inicio.lte.${period.fin})`,estado_pago_papeleria:'eq.PENDIENTE',order:'fecha_inicio.asc,id_credito.asc'})
  ]);
  const activeLoans=new Map();loans.filter(item=>normalize(item.estado)==='ACTIVO'&&money(item.saldo_pendiente)>0).forEach(item=>{if(!activeLoans.has(text(item.id_empleado)))activeLoans.set(text(item.id_empleado),item)});
  const paperwork=new Map();credits.forEach(item=>{const id=text(item.id_empleado_papeleria);const creditDate=dateKey(item.fecha_inicio);if(!id||creditDate<period.inicio||creditDate>period.fin||money(item.papeleria_trabajador)<=0||normalize(item.estado_pago_papeleria)!=='PENDIENTE')return;paperwork.set(id,money((paperwork.get(id)||0)+money(item.papeleria_trabajador)))});
  const items=staff.filter(item=>normalize(item.estado)==='ACTIVO').map((item,index)=>{const id=text(item.id_empleado);const loan=activeLoans.get(id);const base=money(item.sueldo_base);const paper=money(paperwork.get(id));const loanBalance=money(loan?.saldo_pendiente);const discount=loan?money(Math.min(loanBalance,money(loan.descuento_sugerido))):0;return{numero:index+1,idEmpleado:id,empleado:text(item.nombre_completo),puesto:text(item.puesto),fecha:date,sueldoBase:base,papeleria:paper,bono:0,otroIngreso:0,tienePrestamo:!!loan,saldoPrestamo:loanBalance,descuentoPrestamo:discount,otrosDescuentos:0,totalRecibir:money(base+paper-discount)}});
  return{fecha:date,periodo:period,total:money(items.reduce((sum,item)=>sum+item.totalRecibir,0)),trabajadores:items.length,items,generado:new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date())};
}

async function payrollDraft(dateReceived=''){
  const date=dateKey(dateReceived)||todayKey();
  const rows=await supabase.select('borradores_planilla',{select:'fecha_pago,contenido,usuario,actualizado_en',fecha_pago:`eq.${date}`,limit:1});
  const row=rows[0];
  if(!row)return{existe:false,fecha:date,items:[]};
  return{existe:true,fecha:date,items:Array.isArray(row.contenido)?row.contenido:[],usuario:text(row.usuario),actualizadoEn:text(row.actualizado_en)};
}

function publicCredit(row){return row?{idCredito:text(row.id_credito),tipo:text(row.tipo_credito),modalidad:text(row.modalidad_pago),diaPago:text(row.dia_pago),cuota:money(row.cuota),saldo:money(row.saldo_actual)}:null}
function publicLoan(row){return row?{idPrestamo:text(row.id_prestamo),saldo:money(row.saldo_pendiente),descuentoSugerido:money(row.descuento_sugerido)}:null}
function weekRange(value){const date=parseDate(value);const distance=date.getUTCDay()===0?-6:1-date.getUTCDay();const start=addDays(dateKey(date),distance);return{inicio:start,fin:addDays(start,6)}}
function addDays(value,days){const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);return dateKey(date)}
function parseDate(value){return new Date(`${dateKey(value)}T00:00:00.000Z`)}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const match=text(value).match(/^(\d{4}-\d{2}-\d{2})/);return match?match[1]:''}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

async function staffDirectory(){return supabase.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,sueldo_base,estado',order:'nombre_completo.asc'})}
module.exports={execute,catalogues,payrollPreview,payrollDraft,staffDirectory};
