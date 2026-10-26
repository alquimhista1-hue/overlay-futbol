const db=require('./_supabase');
async function attach(paid,preview,week){
 const [pending,settled]=await Promise.all([
  db.selectAll('creditos',{select:'id_credito,id_cliente,fecha_inicio,id_empleado_papeleria,papeleria_trabajador,tipo_credito,monto_credito,saldo_absorbido,papeleria,monto_entregado,nombre_empleado_papeleria,estado_pago_papeleria,saldo_trasladado,recargo_unificacion',estado_pago_papeleria:'eq.PENDIENTE',and:`(fecha_inicio.gte.${week.inicio},fecha_inicio.lte.${week.fin})`}),
  db.selectByIds('creditos','id_pago_planilla_papeleria',paid.map(r=>r.idPago).filter(Boolean),{select:'id_credito,id_cliente,fecha_inicio,id_pago_planilla_papeleria,papeleria_trabajador,tipo_credito,monto_credito,saldo_absorbido,papeleria,monto_entregado,nombre_empleado_papeleria,estado_pago_papeleria,saldo_trasladado,recargo_unificacion'})
 ]);
 const clients=await db.selectByIds('clientes','id_cliente',[...pending,...settled].map(c=>c.id_cliente),{select:'id_cliente,nombre'}),names=new Map(clients.map(c=>[String(c.id_cliente),c.nombre]));
 const cents=v=>Math.round(Number(v||0)*100);
 function items(list){return list.filter(c=>cents(c.papeleria_trabajador)>0).map(c=>({idCredito:c.id_credito,cliente:names.get(String(c.id_cliente))||'Cliente '+c.id_cliente,fecha:c.fecha_inicio,cantidad:cents(c.papeleria_trabajador)/100,detalleCredito:{idCredito:c.id_credito,cliente:names.get(String(c.id_cliente))||'Cliente '+c.id_cliente,fecha:c.fecha_inicio,tipo:c.tipo_credito,montoCredito:c.monto_credito,saldoAnterior:c.saldo_absorbido,papeleria:c.papeleria,dineroEntregado:c.monto_entregado,papeleriaTrabajador:c.papeleria_trabajador,nombreEmpleadoPapeleria:c.nombre_empleado_papeleria,estadoPapeleria:c.estado_pago_papeleria,saldoTrasladado:c.saldo_trasladado,recargoUnificacion:c.recargo_unificacion}})).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(a.idCredito).localeCompare(String(b.idCredito)))}
 for(const r of paid){r.papeleriaDetalle=items(settled.filter(c=>r.idPago&&c.id_pago_planilla_papeleria===r.idPago));r.papeleriaVerificada=r.papeleriaDetalle.reduce((n,c)=>n+cents(c.cantidad),0)===cents(r.papeleria)}
 for(const r of preview){r.papeleriaDetalle=items(pending.filter(c=>r.idEmpleado&&c.id_empleado_papeleria===r.idEmpleado));r.papeleriaVerificada=r.papeleriaDetalle.reduce((n,c)=>n+cents(c.cantidad),0)===cents(r.papeleria)}
}
module.exports={attach};
