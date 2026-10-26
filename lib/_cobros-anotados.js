const db=require('./_supabase'),access=require('./_acceso');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function execute(session,action,data){
 if(action==='finalizarRuta'){
  if(session.rol!=='COBRADOR')throw access.forbidden();access.permit(session,'cobrar');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id||''))throw Error('Identificador no válido.');
  const jornada=await db.rpc('jornada_cobrador',{p_actor:session.uid});if(data.jornada!==jornada)throw Error('La jornada cambió. Revise la ruta.');
  const sheet=await require('./_ruta-reporte').reportRoute(session,jornada);
  return db.rpc('finalizar_ruta_anotaciones',{datos:{id:data.id,actor:session.uid,jornada,ruta:sheet.ruta,hojaPreparada:sheet.hojaPreparada,hojaVersion:sheet.hojaVersion}});
 }
 if(action==='firmarJornada'){
  if(session.rol!=='COBRADOR')throw access.forbidden();access.permit(session,'cobrar');
  return db.rpc('firmar_jornada_anotaciones',{datos:{id:data.id,actor:session.uid,jornada:data.jornada,firma:data.firma,cobros:data.cobros,gastos:data.gastos,idRuta:data.idRuta}});
 }
 if(action==='reporteAnotaciones'){
  if(session.rol!=='ADMIN'){if(session.rol!=='COBRADOR')throw access.forbidden();access.permit(session,'cobrar')}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id||''))throw Error('Reporte no válido.');
  const rows=await db.select('reportes_jornada_cobrador',{select:'*',id:'eq.'+data.id,...(session.rol==='ADMIN'?{}:{creado_por:'eq.'+session.uid}),limit:1});
  if(!rows[0])throw access.forbidden('Reporte no disponible.');return rows[0];
 }
 if(['guardarAnotacion','anularAnotacion','guardarGastoAnotado','anularGastoAnotado'].includes(action)){
  if(session.rol!=='COBRADOR')throw access.forbidden();access.permit(session,'cobrar');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id||''))throw Error('Identificador no válido.');
  const names={guardarAnotacion:'guardar_cobro_anotado',anularAnotacion:'anular_cobro_anotado',guardarGastoAnotado:'guardar_gasto_anotado',anularGastoAnotado:'anular_gasto_anotado'};
  return db.rpc(names[action],{datos:{id:data.id,actor:session.uid,idCredito:String(data.idCredito||''),fecha:data.fecha,monto:data.monto,motivo:data.motivo||'Anulada por el cobrador mediante confirmación.',concepto:data.concepto,capturadoEn:data.capturadoEn,jornada:data.jornada}});
 }
 if(action==='anotacionesAdministrador')access.admin(session);
 else {if(session.rol!=='COBRADOR')throw access.forbidden();access.permit(session,'cobrar')}
 const fecha=session.rol==='ADMIN'?(data.fecha||today()):await db.rpc('jornada_cobrador',{p_actor:session.uid});if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)||Number.isNaN(Date.parse(fecha+'T12:00:00Z'))||new Date(fecha+'T12:00:00Z').toISOString().slice(0,10)!==fecha)throw Error('Fecha no válida.');
 const filter=session.rol==='ADMIN'?{jornada:'eq.'+fecha}:{creado_por:'eq.'+session.uid,id_reporte:'is.null',or:'(and(estado.eq.ANOTADO,jornada.lte.'+fecha+'),jornada.eq.'+fecha+')'};
 const rows=await db.selectAll('cobros_anotados',{select:'*',...filter,order:'creado_en.desc'});
 const staff=session.rol==='ADMIN'?await db.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,estado',order:'nombre_completo.asc'}):[];
 const gastos=await db.selectAll('gastos_anotados',{select:'*',...filter,order:'creado_en.desc'});
 const reportes=session.rol==='ADMIN'?await db.selectAll('reportes_jornada_cobrador',{select:'id,fecha_jornada,id_empleado,creado_en',fecha_jornada:'eq.'+fecha,order:'creado_en.desc'}):await db.select('reportes_jornada_cobrador',{select:'id,fecha_jornada,id_empleado,creado_en',creado_por:'eq.'+session.uid,order:'fecha_jornada.desc',limit:10});
 if(session.rol==='ADMIN'){
  const view=require('./_admin-cobros-vista'),collectors=view.onlyCollectors(staff,rows,gastos,reportes),allowed=new Set(collectors.map(s=>s.id_empleado));
  const visibleRows=rows.filter(r=>allowed.has(r.id_empleado)),visibleExpenses=gastos.filter(r=>allowed.has(r.id_empleado)),visibleReports=reportes.filter(r=>allowed.has(r.id_empleado));
  const available=fecha===today(),pending=available?await view.pendingClients(collectors,rows,fecha):[];
  return{fecha,jornada:fecha,actualizado:new Date().toISOString(),rows:visibleRows,staff:collectors,gastos:visibleExpenses,reportes:visibleReports,porCobrar:pending,porCobrarDisponible:available};
 }
 const rutaFinalizada=(await db.select('rutas_jornada_cobrador',{select:'*',creado_por:'eq.'+session.uid,fecha_jornada:'eq.'+fecha,limit:1}))[0]||null;
 return{fecha,jornada:fecha,actualizado:new Date().toISOString(),rows,staff,gastos,reportes,rutaFinalizada};
}
module.exports={execute};
