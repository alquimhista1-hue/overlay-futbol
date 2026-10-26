const db=require('./_supabase'),motor=require('./_cobros-supabase');
const normal=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function onlyCollectors(staff,rows=[],gastos=[],reportes=[]){
 const involved=new Set([...rows,...gastos,...reportes].map(r=>r.id_empleado));
 return staff.filter(s=>/\bCOBRADOR(?:A|ES|AS)?\b/.test(normal(s.puesto))&&!normal(s.puesto).includes('SUPERVISOR')&&(['ACTIVO','ACTIVA'].includes(normal(s.estado))||involved.has(s.id_empleado)));
}
async function pendingClients(staff,rows,fecha){
 const collectors=new Set(staff.filter(s=>['ACTIVO','ACTIVA'].includes(normal(s.estado))).map(s=>s.id_empleado));if(!collectors.size)return[];
 const assignments=[...new Map((await db.selectByIds('asignaciones_cobro','id_cobrador',collectors,{select:'id_asignacion,id_cliente,id_cobrador,estado',estado:'eq.ACTIVO'})).filter(a=>collectors.has(a.id_cobrador)&&normal(a.estado)==='ACTIVO').map(a=>[JSON.stringify([a.id_cobrador,a.id_cliente]),a])).values()];
 const ids=new Set(assignments.map(a=>a.id_cliente));if(!ids.size)return[];
 const[credits,clients]=await Promise.all([db.selectByIds('creditos','id_cliente',ids,{select:'*',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'}),db.selectByIds('clientes','id_cliente',ids,{select:'id_cliente,nombre'})]);
 const valid=credits.filter(c=>ids.has(c.id_cliente)&&normal(c.estado_credito)==='ACTIVO'&&Number(c.saldo_actual)>0);
 const payments=await db.selectByIds('pagos_clientes','id_credito',valid.map(c=>c.id_credito),{select:'id_pago,id_credito,fecha_pago,monto_abonado',fecha_pago:'lte.'+fecha});
 const context=motor.createPaymentContext(fecha,payments),names=new Map(clients.map(c=>[c.id_cliente,c])),annotated=new Set(rows.filter(r=>r.estado==='ANOTADO').map(r=>r.id_cliente));
 const byClient=new Map();for(const credit of valid){if(!byClient.has(credit.id_cliente))byClient.set(credit.id_cliente,[]);byClient.get(credit.id_cliente).push(credit)}
 const pending=new Map();for(const a of assignments){if(annotated.has(a.id_cliente))continue;for(const credit of byClient.get(a.id_cliente)||[]){
  const calculated=motor.collectionRow(credit,names.get(a.id_cliente)||{},fecha,context),key=JSON.stringify([a.id_cobrador,a.id_cliente]);
  const item=pending.get(key)||{id_empleado:a.id_cobrador,id_cliente:a.id_cliente,nombre_cliente:calculated.nombre,saldo:0,debe_pagar_hoy:0};
  item.saldo=Math.round((item.saldo+Number(credit.saldo_actual))*100)/100;
  // No inventar una cuota exigible si el historial y el saldo oficial no coinciden.
  item.debe_pagar_hoy=item.debe_pagar_hoy===null||Math.abs(calculated.saldo-Number(credit.saldo_actual))>=.01?null:Math.round((item.debe_pagar_hoy+calculated.cantidadAtrasada)*100)/100;
  pending.set(key,item);
 }}return [...pending.values()].sort((a,b)=>a.nombre_cliente.localeCompare(b.nombre_cliente,'es'));
}
module.exports={onlyCollectors,pendingClients};
