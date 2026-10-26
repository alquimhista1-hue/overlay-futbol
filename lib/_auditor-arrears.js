const db=require('./_supabase');
const {collectionRow,createPaymentContext}=require('./_cobros-supabase');
// Solo lectura. Reutiliza el motor de cobro; nunca escribe saldos ni pagos.
async function arrears(fecha){
 const [clients,credits]=await Promise.all([
  db.selectAll('clientes',{select:'id_cliente,nombre,municipio,lugar'}),
  db.selectAll('creditos',{select:'id_credito,id_cliente,modalidad_pago,dia_pago,cuota,fecha_inicio,total_pagar,total_abonado,saldo_actual,estado_credito,cantidad_cuotas',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'})
 ]);
 const payments=await db.selectByIds('pagos_clientes','id_credito',credits.map(c=>c.id_credito),{select:'id_pago,id_credito,fecha_pago,monto_abonado',fecha_pago:'lte.'+fecha});
 return summarize(fecha,clients,credits,payments);
}
function summarize(fecha,clients,credits,payments){
 const cents=v=>Math.round(Number(v||0)*100),byClient=new Map(clients.map(c=>[String(c.id_cliente),c]));
 const context=createPaymentContext(fecha,payments),people=new Map();let sinVerificar=0;
 const d=new Date(fecha+'T12:00:00Z'),offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);
 const weekStarts=Array.from({length:4},(_,i)=>{const week=new Date(d);week.setUTCDate(week.getUTCDate()-(3-i)*7);return week.toISOString().slice(0,10)});
 for(const credit of credits){
  const mode=String(credit.modalidad_pago||'').toUpperCase();
  if(!['DIARIO','SEMANAL'].some(m=>mode.includes(m))||mode.includes('QUINCENAL')||String(credit.estado_credito).toUpperCase()!=='ACTIVO'||cents(credit.saldo_actual)<=0)continue;
  const r=collectionRow(credit,byClient.get(String(credit.id_cliente))||{},fecha,context);
  if(cents(r.saldo)!==cents(credit.saldo_actual)||!r.cuota||!credit.fecha_inicio){sinVerificar++;continue}
  if(!r.seguimientoEspecial)continue; // Exactamente la clasificación de las hojas de ruta.
  const id=r.idCliente;if(!people.has(id))people.set(id,{idCliente:id,nombre:r.nombre,municipio:r.municipio,lugar:r.lugar,saldo:0,atraso:0,cuotas:0,pagosSemanas:[0,0,0,0],creditos:0});
  const p=people.get(id);p.saldo+=cents(r.saldo);p.atraso+=cents(r.cantidadAtrasada);p.cuotas+=r.diasAtrasados;p.creditos++;
  for(const payment of context.pagosPorCredito.get(r.idCredito)||[]){const index=weekStarts.findLastIndex(key=>payment.fecha>=key);if(index>=0)p.pagosSemanas[index]+=cents(payment.monto)}
 }
 const items=[...people.values()].map(p=>({...p,saldo:p.saldo/100,atraso:p.atraso/100,pagosSemanas:p.pagosSemanas.map(n=>n/100)})).sort((a,b)=>b.atraso-a.atraso||a.nombre.localeCompare(b.nombre,'es'));
 return{items,semanas:weekStarts,total:items.reduce((s,p)=>s+cents(p.atraso),0)/100,sinVerificar};
}
module.exports={arrears,summarize};
