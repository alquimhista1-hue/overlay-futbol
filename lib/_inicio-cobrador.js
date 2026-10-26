const db=require('./_supabase'),access=require('./_acceso'),motor=require('./_cobros-supabase');
const normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
async function inicio(session){
 if(session.rol!=='COBRADOR')throw access.forbidden();
 const fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala'}).format(new Date());
 const staff=(await db.select('personal',{select:'nombre_completo,puesto',id_empleado:'eq.'+session.id_empleado,limit:1}))[0];
 const ids=await access.assignedIds(session);let hoy=[],pendientes=[],sinClasificar=0;
 if(session.permisos.clientes&&ids.size){
  const [credits,clients]=await Promise.all([
   db.selectByIds('creditos','id_cliente',ids,{select:'*',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'}),
   db.selectByIds('clientes','id_cliente',ids,{select:'id_cliente,nombre,municipio,lugar'})]);
  const weekly=credits.filter(c=>ids.has(c.id_cliente)&&normal(c.modalidad_pago)==='SEMANAL'&&normal(c.estado_credito)==='ACTIVO'&&Number(c.saldo_actual)>0);
  const payments=await db.selectByIds('pagos_clientes','id_credito',weekly.map(c=>c.id_credito),{select:'id_credito,fecha_pago,monto_abonado',fecha_pago:'lte.'+fecha});
  const context=motor.createPaymentContext(fecha,payments),d=new Date(fecha+'T12:00:00Z');
  const day=['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'][d.getUTCDay()];
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)-1);const previousEnd=d.toISOString().slice(0,10),names=new Map(clients.map(c=>[c.id_cliente,c]));
  for(const c of weekly){
   const row=motor.collectionRow(c,names.get(c.id_cliente)||{},fecha,context);
   if(Math.abs(row.saldo-Number(c.saldo_actual))>=0.01){sinClasificar++;if(normal(c.dia_pago)===day)hoy.push({idCliente:row.idCliente,nombre:row.nombre,saldo:Number(c.saldo_actual),cuota:row.cuota,debePagarHoy:null,pendienteAnterior:null});continue;}
   const previous=motor.collectionRow(c,names.get(c.id_cliente)||{},previousEnd,context);
   const currentPaid=(context.pagosPorCredito.get(c.id_credito)||[]).filter(p=>p.fecha>previousEnd).reduce((s,p)=>s+p.monto,0);
   const pendienteAnterior=Math.round(Math.min(Number(c.saldo_actual),Math.max(0,previous.cantidadAtrasada-currentPaid))*100)/100;
   const item={idCliente:row.idCliente,nombre:row.nombre,municipio:row.municipio,lugar:row.lugar,saldo:Number(c.saldo_actual),cuota:row.cuota,debePagarHoy:row.cantidadAtrasada,pendienteAnterior};
   if(normal(c.dia_pago)===day)hoy.push(item);
   else if(pendienteAnterior>0)pendientes.push(item);
  }
 }
 const unique=rows=>[...new Map(rows.map(r=>[r.idCliente,r])).values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 return{fecha,staff,asignados:ids.size,hoy:unique(hoy),pendientes:unique(pendientes),sinClasificar};
}
module.exports={inicio};
