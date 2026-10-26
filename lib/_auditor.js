const dashboard=require('./_dashboard-supabase'),audit=require('./_auditoria-supabase'),detail=require('./_detalle-supabase'),operations=require('./_operaciones-supabase'),db=require('./_supabase');
async function overview(){
 const fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const home=await dashboard.dashboard();
 const [cash,details,loans,payroll,credits,morosidad]=await Promise.all([
  audit.audit(fecha,'semana'),detail.weeklyDetail(fecha),
  db.selectAll('prestamos_personal',{select:'id_prestamo,id_empleado,nombre_completo,estado,fecha_inicial,prestamo_inicial,dinero_adicional,total_descontado,saldo_pendiente',order:'nombre_completo.asc,id_prestamo.asc'}),
  operations.payrollPreview(fecha),
  db.selectAll('creditos',{select:'id_credito,id_cliente,fecha_inicio,tipo_credito,monto_credito,saldo_absorbido,papeleria,monto_entregado,papeleria_trabajador,nombre_empleado_papeleria,estado_pago_papeleria,saldo_trasladado,recargo_unificacion',and:`(fecha_inicio.gte.${home.semana.inicio},fecha_inicio.lte.${home.semana.fin})`,order:'fecha_inicio.desc,id_credito.asc'})
  ,require('./_auditor-arrears').arrears(fecha)
 ]);
 const clients=await db.selectByIds('clientes','id_cliente',credits.map(c=>c.id_cliente),{select:'id_cliente,nombre'}),names=new Map(clients.map(c=>[c.id_cliente,c.nombre]));
 const amount=v=>Math.round(Number(v||0)*100)/100;
 details.creditos={total:amount(credits.reduce((sum,c)=>sum+amount(c.monto_entregado),0)),items:credits.map(c=>({idCredito:c.id_credito,fecha:c.fecha_inicio,cliente:names.get(c.id_cliente)||c.id_cliente,tipo:c.tipo_credito,montoCredito:amount(c.monto_credito),saldoAnterior:amount(c.saldo_absorbido),papeleria:amount(c.papeleria),dineroEntregado:amount(c.monto_entregado),papeleriaTrabajador:amount(c.papeleria_trabajador),nombreEmpleadoPapeleria:c.nombre_empleado_papeleria,estadoPapeleria:c.estado_pago_papeleria||'SIN DEFINIR',saldoTrasladado:amount(c.saldo_trasladado),recargoUnificacion:amount(c.recargo_unificacion)}))};
 await require('./_auditor-paperwork').attach(details.planilla.items,payroll.items,home.semana);
 // No se entregan cierres históricos ni acciones administrativas al navegador.
 return{morosidad,fecha,actualizadoEn:new Date().toISOString(),semana:home.semana,indicadores:home.indicadores,secciones:cash.secciones,detalles:details,prestamos:loans.map(r=>({idPrestamo:r.id_prestamo,idEmpleado:r.id_empleado,nombre:r.nombre_completo,estado:r.estado,saldoPendiente:r.saldo_pendiente,fechaInicial:r.fecha_inicial,prestamoInicial:r.prestamo_inicial,dineroAdicional:r.dinero_adicional,totalDescontado:r.total_descontado})),planillaPrevista:payroll};
}
async function clients(){return(await require('./_clientes-supabase').searchClients('')).filter(r=>Number(r.saldo)>0)}
async function client(id){return require('./_clientes-supabase').clientHistory(id)}
async function loan(id){
 const selected=(await db.select('prestamos_personal',{select:'id_prestamo,id_empleado',id_prestamo:'eq.'+id,limit:1}))[0];
 if(!selected)throw new Error('Préstamo no encontrado.');
 const loans=await db.selectAll('prestamos_personal',{select:'id_prestamo,id_empleado,nombre_completo,estado,fecha_inicial,prestamo_inicial,dinero_adicional,total_descontado,saldo_pendiente',...(selected.id_empleado?{id_empleado:'eq.'+selected.id_empleado}:{id_prestamo:'eq.'+id}),order:'fecha_inicial.asc,id_prestamo.asc'});
 const movements=await db.selectByIds('movimientos_prestamos_personal','id_prestamo',loans.map(r=>r.id_prestamo),{select:'id_movimiento,id_prestamo,fecha,tipo_movimiento,descripcion,cantidad_aumenta,cantidad_disminuye,saldo_despues_movimiento',order:'fecha.asc,id_movimiento.asc'});
 movements.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id_movimiento).localeCompare(String(b.id_movimiento)));
 return{nombre:loans[0]?.nombre_completo||'',prestamos:loans,movimientos:movements};
}
async function financing(){return require('./_financiamientos-supabase').overview()}
module.exports={overview,clients,client,loan,financing};
