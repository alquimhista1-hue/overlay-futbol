const supabase=require('./_supabase');
const caja=require('./_caja-supabase');

async function dashboard(){
  const period=weekRange(todayKey());
  const[stats,closures,cash,opening]=await Promise.all([
    supabase.rpc('estadisticas_creditos',{p_inicio:period.inicio,p_fin:todayKey()}),
    supabase.select('cierres_semanales',{select:'fecha_inicio,fecha_fin,saldo_semana_anterior,cobrado_clientes,total_creditos_entregados,gastos_pagados,planilla_pagada,prestamos_personal,total_salidas,saldo_siguiente_semana,clientes_con_deuda,total_cartera,aportes_capital,prestamos_recibidos,pagos_financiamiento',order:'fecha_inicio.desc',limit:26}),
    supabase.selectAll('movimientos_caja',{select:'fecha,tipo_movimiento,entrada,salida',and:`(fecha.gte.${period.inicio},fecha.lte.${period.fin})`,order:'fecha.asc,id_movimiento.asc'}),
    caja.openingBalance(period.inicio)
  ]);
  const cashTotals=caja.totals(cash);
  const collected=cashTotals.grupos[0].entrada;
  const newCredits=cash.filter(item=>normalize(item.tipo_movimiento)==='CREDITO NUEVO').reduce((total,item)=>total+money(item.salida),0);
  const renewals=cash.filter(item=>normalize(item.tipo_movimiento)==='RENOVACION').reduce((total,item)=>total+money(item.salida),0);
  const weekCash=cash.filter(item=>within(dateKey(item.fecha),period.inicio,period.fin));
  const financingInputs=money(weekCash.filter(item=>['APORTE CAPITAL','PRESTAMO RECIBIDO'].includes(normalize(item.tipo_movimiento))).reduce((total,item)=>total+money(item.entrada),0));
  const financingPayments=cashTotals.grupos[7].salida;
  const used=cashTotals.salida;
  const initial=opening.saldoInicial;
  const byDay=[0,0,0,0,0,0,0];cash.filter(row=>caja.category(row.tipo_movimiento)===0).forEach(item=>{const index=differenceDays(period.inicio,dateKey(item.fecha));if(index>=0&&index<7)byDay[index]+=money(item.entrada)});
  return{
    actualizado:new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date()),
    semana:{inicio:period.inicio,fin:period.fin,texto:`${displayDate(period.inicio)} al ${displayDate(period.fin)}`},
    indicadores:{saldoInicial:initial,cobrado:collected,entradasFinanciamiento:financingInputs,pagosFinanciamiento:financingPayments,creditosNuevos:money(newCredits),renovaciones:money(renewals),creditosEntregados:cashTotals.grupos[1].salida,gastos:cashTotals.grupos[2].salida,planilla:cashTotals.grupos[3].salida,prestamosPersonal:cashTotals.grupos[4].salida,dineroUsado:used,otrasEntradas:money(cashTotals.entrada-collected-financingInputs),resultadoSemana:cashTotals.resultado,saldoFinal:money(initial+cashTotals.resultado),baseCajaConfirmada:opening.baseConfirmada,clientesNuevos:Number(stats.clientesNuevos)||0,clientesActivos:Number(stats.clientesActivos)||0,cartera:money(stats.cartera)},
    cobrosPorDia:['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].map((day,index)=>({dia:day,monto:money(byDay[index])})),
    usoPorDia:caja.dailyUsage(cash,period.inicio),
    semanas:closures.map(row=>({inicio:dateKey(row.fecha_inicio),fin:dateKey(row.fecha_fin),saldoInicial:money(row.saldo_semana_anterior),cobrado:money(row.cobrado_clientes),creditosEntregados:money(row.total_creditos_entregados),gastos:money(row.gastos_pagados),planilla:money(row.planilla_pagada),prestamosPersonal:money(row.prestamos_personal),pagosFinanciamiento:money(row.pagos_financiamiento),entradasFinanciamiento:money(row.aportes_capital)+money(row.prestamos_recibidos),dineroUsado:money(row.total_salidas),saldoFinal:money(row.saldo_siguiente_semana),clientes:Number(row.clientes_con_deuda)||0,cartera:money(row.total_cartera)}))
  };
}

function weekRange(value){const date=parseDate(value);const day=date.getUTCDay();const distance=day===0?-6:1-day;const start=addDays(dateKey(date),distance);return{inicio:start,fin:addDays(start,6)}}
function within(value,start,end){return!!value&&value>=start&&value<=end}
function sum(rows,key){return money(rows.reduce((total,item)=>total+money(item[key]),0))}
function displayDate(value){const date=parseDate(value);return`${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`}
function differenceDays(start,end){return Math.floor((parseDate(end)-parseDate(start))/86400000)}
function addDays(value,days){const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);return dateKey(date)}
function parseDate(value){return new Date(`${dateKey(value)}T00:00:00.000Z`)}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const raw=text(value);const match=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];const date=new Date(raw);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={dashboard};
