const supabase=require('./_supabase');
const caja=require('./_caja-supabase');

async function dailyReport(dateReceived=''){return report('diario',dateReceived)}
async function weeklyReport(dateReceived=''){return report('semanal',dateReceived)}

async function report(type,dateReceived){
  const date=dateKey(dateReceived)||todayKey();const today=todayKey();
  if(date>today)throw new Error('No se puede generar un reporte de una fecha futura.');
  const period=weekRange(date);const end=type==='diario'?date:(period.fin>today?today:period.fin);
  const[payments,stats,cash,opening]=await Promise.all([
    supabase.selectAll('pagos_clientes',{select:'id_pago,id_cliente,id_credito,fecha_pago,monto_abonado,fila_google_sheets',and:`(fecha_pago.gte.${period.inicio},fecha_pago.lte.${end})`,order:'fecha_pago.asc,id_pago.asc'}),
    supabase.rpc('estadisticas_creditos',{p_inicio:type==='diario'?date:period.inicio,p_fin:end}),
    supabase.selectAll('movimientos_caja',{select:'fecha,tipo_movimiento,descripcion,entrada,salida,fila_google_sheets',and:`(fecha.gte.${period.inicio},fecha.lte.${end})`,order:'fecha.asc,id_movimiento.asc'}),
    caja.openingBalance(period.inicio)
  ]);
  const clients=await supabase.selectByIds('clientes','id_cliente',payments.map(row=>row.id_cliente),{select:'id_cliente,nombre'});
  const names=new Map(clients.map(item=>[text(item.id_cliente),text(item.nombre)]));
  const rangeStart=type==='diario'?date:period.inicio;const periodPayments=payments.filter(item=>within(dateKey(item.fecha_pago),rangeStart,end));
  const selectedCash=cash.filter(item=>within(dateKey(item.fecha),rangeStart,end));
  const selectedFinancing=financingCash(cash,rangeStart,end);
  const initial=opening.saldoInicial;const selectedTotals=caja.totals(selectedCash);const accumulatedTotals=caja.totals(cash);const collected=selectedTotals.grupos[0].entrada;
  const used=selectedTotals.salida;
  const process=cashProcess(cash,period.inicio,end,initial);const byDay=[0,0,0,0,0,0,0];
  periodPayments.forEach(item=>{const index=differenceDays(period.inicio,dateKey(item.fecha_pago));if(index>=0&&index<7)byDay[index]+=money(item.monto_abonado)});
  return{
    tipo:type,generado:generatedText(),fecha:date,...(type==='diario'?{fechaTexto:displayDate(date),dia:dayName(date)}:{}),periodo:period,
    indicadores:{saldoInicial:initial,cobrado:collected,entradasFinanciamiento:selectedFinancing.entradas,pagosFinanciamiento:selectedFinancing.pagos,usado:used,disponible:money(initial+accumulatedTotals.resultado),otrasEntradas:money(selectedTotals.entrada-collected-selectedFinancing.entradas),baseCajaConfirmada:opening.baseConfirmada,cartera:money(stats.cartera),clientesDeuda:Number(stats.clientesActivos)||0,clientesNuevos:Number(stats.clientesNuevos)||0},
    desglose:{creditos:selectedTotals.grupos[1].salida,gastos:selectedTotals.grupos[2].salida,planilla:selectedTotals.grupos[3].salida,prestamos:selectedTotals.grupos[4].salida,financiamiento:selectedTotals.grupos[7].salida,otros:selectedTotals.grupos[8].salida},
    cobrosPorDia:dayLabels().map((day,index)=>({dia:day,monto:money(byDay[index])})),
    usoPorDia:caja.dailyUsage(selectedCash,period.inicio),procesoCaja:process.days,movimientosCaja:process.movements,pagos:groupPayments(periodPayments,names)
  };
}

function financingCash(rows,start,end){let entradas=0,pagos=0;(rows||[]).filter(item=>within(dateKey(item.fecha),start,end)).forEach(item=>{const type=normalize(item.tipo_movimiento);if(type==='APORTE CAPITAL'||type==='PRESTAMO RECIBIDO')entradas+=money(item.entrada);if(type==='PAGO FINANCIAMIENTO'||type==='PAGO DEUDA')pagos+=money(item.salida)});return{entradas:money(entradas),pagos:money(pagos)}}
function groupPayments(rows,names){const grouped=new Map();rows.forEach(row=>{const id=text(row.id_cliente);const name=names.get(id)||id||'Cliente';const key=id||normalize(name);if(!grouped.has(key))grouped.set(key,{idCliente:id,cliente:name,monto:0,cantidadPagos:0});const item=grouped.get(key);item.monto+=money(row.monto_abonado);item.cantidadPagos++});return[...grouped.values()].map(item=>({...item,monto:money(item.monto)})).sort((a,b)=>b.monto-a.monto||a.cliente.localeCompare(b.cliente,'es'))}
function cashProcess(rows,start,end,initial){const days=[];const map=new Map();for(let cursor=start;cursor<=end;cursor=addDays(cursor,1)){const day={fecha:cursor,dia:dayName(cursor),saldoInicialCaja:0,cobradoClientes:0,otrasEntradas:0,totalEntradas:0,creditosEntregados:0,gastos:0,planilla:0,prestamosPersonal:0,otrasSalidas:0,totalSalidas:0,saldoFinalCaja:0,cambioNeto:0};days.push(day);map.set(cursor,day)}const movements=[];rows.filter(row=>within(dateKey(row.fecha),start,end)).forEach(row=>{const day=map.get(dateKey(row.fecha));if(!day)return;const type=text(row.tipo_movimiento);const input=money(row.entrada);const output=money(row.salida);if(input>0){if(caja.category(type)===0)day.cobradoClientes+=input;else day.otrasEntradas+=input}if(output>0){if(hasType(type,['CREDITO','RENOVACION','NUEVO']))day.creditosEntregados+=output;else if(hasType(type,['GASTO']))day.gastos+=output;else if(hasType(type,['PLANILLA','SUELDO','SALARIO']))day.planilla+=output;else if(hasType(type,['PRESTAMO PERSONAL','PRESTAMO AL PERSONAL','PRESTAMO EMPLEADO','PRESTAMO TRABAJADOR']))day.prestamosPersonal+=output;else day.otrasSalidas+=output}if(input||output)movements.push({fecha:dateKey(row.fecha),dia:dayName(row.fecha),tipo:type||(input>0?'Entrada de caja':'Salida de caja'),descripcion:text(row.descripcion),entrada:input,salida:output,neto:money(input-output)})});let balance=money(initial);days.forEach(day=>{day.saldoInicialCaja=balance;day.cobradoClientes=money(day.cobradoClientes);day.otrasEntradas=money(day.otrasEntradas);day.totalEntradas=money(day.cobradoClientes+day.otrasEntradas);day.creditosEntregados=money(day.creditosEntregados);day.gastos=money(day.gastos);day.planilla=money(day.planilla);day.prestamosPersonal=money(day.prestamosPersonal);day.otrasSalidas=money(day.otrasSalidas);day.totalSalidas=money(day.creditosEntregados+day.gastos+day.planilla+day.prestamosPersonal+day.otrasSalidas);day.cambioNeto=money(day.totalEntradas-day.totalSalidas);day.saldoFinalCaja=money(balance+day.cambioNeto);balance=day.saldoFinalCaja});movements.sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.tipo.localeCompare(b.tipo,'es'));return{days,movements}}
function hasType(value,keys){const type=normalize(value);return keys.some(key=>type.includes(normalize(key)))}
function dayLabels(){return['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']}
function dayName(value){return['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][parseDate(value).getUTCDay()]}
function generatedText(){return new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date())}
function displayDate(value){const date=parseDate(value);return`${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`}
function weekRange(value){const date=parseDate(value);const day=date.getUTCDay();const distance=day===0?-6:1-day;const start=addDays(dateKey(date),distance);return{inicio:start,fin:addDays(start,6)}}
function within(value,start,end){return!!value&&value>=start&&value<=end}
function sum(rows,key){return money((rows||[]).reduce((total,item)=>total+money(item[key]),0))}
function differenceDays(start,end){return Math.floor((parseDate(end)-parseDate(start))/86400000)}
function addDays(value,days){const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);return dateKey(date)}
function parseDate(value){return new Date(`${dateKey(value)}T00:00:00.000Z`)}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const raw=text(value);const match=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];const date=new Date(raw);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={dailyReport,weeklyReport};
