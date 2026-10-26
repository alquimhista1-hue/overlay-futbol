const db=require('./_supabase');
const cents=value=>Math.round((Number(value)||0)*100);
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
function category(value){const t=normalize(value);if(t==='ABONO PRESTAMO PERSONAL')return 5;if(t==='ABONO CLIENTE')return 0;if(t.includes('CREDITO')||t==='RENOVACION'||t.includes('UNIFIC'))return 1;if(t.includes('GASTO'))return 2;if(t.includes('PLANILLA')||t.includes('SUELDO'))return 3;if(t.includes('PRESTAMO PERSONAL'))return 4;if(['APORTE CAPITAL','PRESTAMO RECIBIDO'].includes(t))return 6;if(['PAGO FINANCIAMIENTO','PAGO DEUDA'].includes(t))return 7;return 8}
async function openingBalance(start){
 const data=await db.rpc('saldo_caja_al_inicio',{p_fecha:start});
 if(!data||!Number.isFinite(Number(data.saldoInicial)))throw new Error('No se pudo verificar el saldo inicial de caja.');
 return{saldoInicial:cents(data.saldoInicial)/100,baseConfirmada:Boolean(data.baseConfirmada),fechaBase:data.fechaBase};
}
function totals(rows){const groups=Array.from({length:9},()=>({entrada:0,salida:0}));let input=0,output=0;for(const row of rows){const i=cents(row.entrada),o=cents(row.salida);input+=i;output+=o;const g=groups[category(row.tipo_movimiento)];g.entrada+=i;g.salida+=o}return{entrada:input/100,salida:output/100,resultado:(input-output)/100,grupos:groups.map(g=>({entrada:g.entrada/100,salida:g.salida/100}))}}
function dailyUsage(rows,start){return ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].map((dia,index)=>{const d=new Date(start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+index);const t=totals(rows.filter(r=>String(r.fecha).slice(0,10)===d.toISOString().slice(0,10)));return{dia,creditos:t.grupos[1].salida,gastos:t.grupos[2].salida,planilla:t.grupos[3].salida,prestamos:t.grupos[4].salida,financiamiento:t.grupos[7].salida,otros:t.grupos[8].salida,total:t.salida}})}
module.exports={openingBalance,totals,dailyUsage,category};
