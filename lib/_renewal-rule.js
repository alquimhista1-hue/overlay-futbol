const db=require('./_supabase');
function eligibility(credits){
 const live=credits.filter(c=>c.estado_credito==='ACTIVO'&&Number(c.saldo_actual)>0);
 if(live.length!==1)return{permitida:false,motivo:live.length?'El cliente tiene varios créditos activos. Solicite revisión administrativa.':'No hay un crédito activo disponible para renovar.'};
 const c=live[0],principal=Number(c.monto_credito),saldo=Number(c.saldo_actual);
 if(c.monto_credito==null||!Number.isFinite(principal)||principal<=0||!Number.isFinite(saldo))return{permitida:false,motivo:'Falta verificar el monto prestado del crédito actual.'};
 const limite=principal>=3000?600:300;
 return{permitida:saldo<=limite,limite,montoPrestado:principal,saldo,idCredito:c.id_credito,motivo:saldo<=limite?'':`Para renovar, el saldo pendiente debe ser de Q${limite} o menos.`};
}
async function forClient(id){return eligibility(await db.selectAll('creditos',{select:'id_credito,id_cliente,monto_credito,saldo_actual,estado_credito',id_cliente:'eq.'+id,estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'}))}
async function candidates(rows,ids){
 if(!ids.size)return[];
 const credits=await db.selectByIds('creditos','id_cliente',ids,{select:'id_credito,id_cliente,monto_credito,saldo_actual,estado_credito',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'});
 return rows.filter(r=>ids.has(r.idCliente)&&Number(r.saldo)>0).map(r=>({...r,renovacion:eligibility(credits.filter(c=>c.id_cliente===r.idCliente))}));
}
module.exports={eligibility,forClient,candidates};
