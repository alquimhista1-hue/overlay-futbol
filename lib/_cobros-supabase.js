const supabase=require('./_supabase');

async function collectionList(dateReceived=''){
  const date=dateKey(dateReceived)||todayKey();
  const[clients,credits]=await Promise.all([
    supabase.selectAll('clientes',{select:'id_cliente,nombre,telefono,direccion,municipio,lugar'}),
    supabase.selectAll('creditos',{select:'id_credito,id_cliente,modalidad_pago,dia_pago,cuota,fecha_inicio,total_pagar,total_abonado,saldo_actual,estado_credito,cantidad_cuotas,fila_google_sheets',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0',order:'fila_google_sheets.asc,id_credito.asc'})
  ]);
  const week=weekRange(date);
  const[payments,weekPayments]=await Promise.all([
    supabase.selectByIds('pagos_clientes','id_credito',credits.map(row=>row.id_credito),{select:'id_pago,id_credito,fecha_pago,monto_abonado,fila_google_sheets',fecha_pago:'lte.'+date,order:'fecha_pago.asc,id_pago.asc'}),
    supabase.selectAll('pagos_clientes',{select:'id_pago,fecha_pago,monto_abonado',and:`(fecha_pago.gte.${week.start},fecha_pago.lte.${week.end})`,order:'fecha_pago.asc,id_pago.asc'})
  ]);
  const clientsById=new Map(clients.map(item=>[text(item.id_cliente),item]));
  const paymentContext=createPaymentContext(date,payments);
  const active=credits.filter(item=>normalize(item.estado_credito)==='ACTIVO'&&money(item.saldo_actual)>0);
  const rows=active.map(credit=>collectionRow(credit,clientsById.get(text(credit.id_cliente))||{},date,paymentContext));
  sortRows(rows);
  const collected=weekPayments.reduce((sum,payment)=>{const paid=dateKey(payment.fecha_pago);return paid>=week.start&&paid<=week.end?sum+money(payment.monto_abonado):sum},0);
  return{
    fecha:date,fechaTexto:dayDateText(date),clientesEnLista:rows.length,abonosEscritos:0,recaudadoSemana:money(collected),
    cartera:money(active.reduce((sum,item)=>sum+money(item.saldo_actual),0)),clientes:rows
  };
}

function createPaymentContext(date,payments){
  const byCredit=new Map();payments.forEach(row=>{const paid=dateKey(row.fecha_pago);if(!paid||paid>date)return;const id=text(row.id_credito);if(!byCredit.has(id))byCredit.set(id,[]);byCredit.get(id).push({fecha:paid,monto:money(row.monto_abonado)})});
  return{fechaTrabajo:date,pagosPorCredito:byCredit};
}
function collectionRow(credit,client,date,context){
  const idCredit=text(credit.id_credito);const idClient=text(credit.id_cliente);const plan=normalize(credit.modalidad_pago);const installment=money(credit.cuota);const total=money(credit.total_pagar);const savedPaid=money(credit.total_abonado);const savedBalance=money(credit.saldo_actual);
  const savedInstallments=Math.max(0,Math.trunc(Number(credit.cantidad_cuotas)||0));const installments=savedInstallments>0?savedInstallments:(installment>0&&total>0?Math.ceil(total/installment):0);
  const motorCredit={idCredito:idCredit,modalidad:plan,diaPago:text(credit.dia_pago),cuota:installment,fechaInicio:dateKey(credit.fecha_inicio),totalAPagar:total||(savedBalance+savedPaid),cantidadCuotas:installments};
  const detail=calculateCredit(motorCredit,context,date);const follow=evaluateSpecial(motorCredit,detail,context,date);
  return{idCredito:idCredit,idCliente:idClient,plan,dia:normalize(credit.dia_pago),nombre:text(client.nombre)||`CLIENTE ${idClient}`,direccion:text(client.direccion),municipio:text(client.municipio),lugar:text(client.lugar),saldo:detail.saldo,fechaPago:date,abono:0,cuota:installment,cuotas:installments,telefono:text(client.telefono),cantidadAtrasada:detail.debePagarHoy,diasAtrasados:detail.atrasos,seguimientoEspecial:follow.especial,motivoSeguimiento:follow.motivo,abonadoSemanaAnterior:follow.abonadoSemanaAnterior,abonadoSemanaActual:follow.abonadoSemanaActual};
}

function calculateCredit(credit,context,dateReceived){
  const date=dateKey(dateReceived||context.fechaTrabajo);const start=dateKey(credit.fechaInicio);const installment=Math.max(0,money(credit.cuota));const total=Math.max(0,money(credit.totalAPagar));const installmentCount=Math.max(0,Math.floor(Number(credit.cantidadCuotas)||0));
  if(!start||installment<=0||total<=0||date<start)return emptyResult();
  const first=firstPayment(start,credit.modalidad,credit.diaPago);if(!first)return emptyResult();
  let expected=installmentsExpected(first,date,credit.modalidad);if(installmentCount>0)expected=Math.min(expected,installmentCount);
  const yesterday=addDays(date,-1);let expectedYesterday=installmentsExpected(first,yesterday,credit.modalidad);if(installmentCount>0)expectedYesterday=Math.min(expectedYesterday,installmentCount);
  const payments=context.pagosPorCredito.get(text(credit.idCredito))||[];const paid=money(payments.filter(item=>item.fecha<=date).reduce((sum,item)=>sum+money(item.monto),0));
  const balance=money(Math.max(0,total-paid));const scheduledToday=money(Math.min(total,expected*installment));const scheduledYesterday=money(Math.min(total,expectedYesterday*installment));
  const dueToday=money(Math.min(balance,Math.max(0,scheduledToday-paid)));const overdue=money(Math.min(balance,Math.max(0,scheduledYesterday-paid)));const late=installment>0?Math.ceil((overdue-0.000001)/installment):0;
  return{primerPago:first,cuotasEsperadas:expected,cuotasEsperadasAyer:expectedYesterday,totalPagado:paid,saldo:balance,montoProgramadoHoy:scheduledToday,montoProgramadoAyer:scheduledYesterday,montoAtrasado:overdue,atrasos:late,debePagarHoy:dueToday,esDiaPagoHoy:expected>expectedYesterday};
}
function evaluateSpecial(credit,detail,context,dateReceived){
  const mode=normalize(credit.modalidad);const late=Math.max(0,Number(detail.atrasos)||0);
  if(mode.includes('SEMANAL')&&!mode.includes('QUINCENAL'))return{especial:late>=4,motivo:late>=4?'Cuatro o más cuotas semanales atrasadas.':'',abonadoSemanaAnterior:0,abonadoSemanaActual:0};
  if(!mode.includes('DIARIO'))return{especial:false,motivo:'',abonadoSemanaAnterior:0,abonadoSemanaActual:0};
  const date=dateKey(dateReceived||context.fechaTrabajo);const currentWeek=weekRange(date);const previousStart=addDays(currentWeek.start,-7);const previousEnd=addDays(currentWeek.start,-1);const fullPrevious=detail.primerPago&&detail.primerPago<=previousStart;
  const payments=context.pagosPorCredito.get(text(credit.idCredito))||[];let previous=0;let current=0;
  payments.forEach(payment=>{if(payment.fecha>=previousStart&&payment.fecha<=previousEnd)previous+=money(payment.monto);if(payment.fecha>=currentWeek.start&&payment.fecha<=date)current+=money(payment.monto)});
  const special=late>0&&fullPrevious&&money(previous)<50&&money(current)<50;
  return{especial:special,motivo:special?'Menos de Q50 abonados en la semana anterior y en la semana actual.':'',abonadoSemanaAnterior:money(previous),abonadoSemanaActual:money(current)};
}
function firstPayment(start,modeReceived,dayReceived){
  const mode=normalize(modeReceived);
  if(mode.includes('DIARIO')){let date=addDays(start,1);while(dayOfWeek(date)===0)date=addDays(date,1);return date}
  if(mode.includes('QUINCENAL'))return addDays(start,15);
  if(mode.includes('SEMANAL')){const map={LUNES:1,MARTES:2,MIERCOLES:3,JUEVES:4,VIERNES:5,SABADO:6,DOMINGO:0};const target=map[normalize(dayReceived)];if(target===undefined)return addDays(start,7);let difference=(target-dayOfWeek(start)+7)%7;if(difference===0)difference=7;return addDays(start,difference)}
  return null;
}
function installmentsExpected(first,end,modeReceived){
  if(end<first)return 0;const mode=normalize(modeReceived);
  if(mode.includes('DIARIO')){let count=0;for(let cursor=first;cursor<=end;cursor=addDays(cursor,1))if(dayOfWeek(cursor)!==0)count++;return count}
  const days=differenceDays(first,end);if(mode.includes('QUINCENAL'))return Math.floor(days/15)+1;if(mode.includes('SEMANAL'))return Math.floor(days/7)+1;return 0;
}
function emptyResult(){return{primerPago:null,cuotasEsperadas:0,cuotasEsperadasAyer:0,totalPagado:0,saldo:0,montoProgramadoHoy:0,montoProgramadoAyer:0,montoAtrasado:0,atrasos:0,debePagarHoy:0,esDiaPagoHoy:false}}

function sortRows(rows){
  const dayOrder={LUNES:1,MARTES:2,MIERCOLES:3,JUEVES:4,VIERNES:5,SABADO:6,DOMINGO:7};const planNumber=plan=>plan.includes('SEMANAL')&&!plan.includes('QUINCENAL')?1:plan.includes('QUINCENAL')?2:plan.includes('DIARIO')?3:9;
  rows.sort((a,b)=>{if(Boolean(a.seguimientoEspecial)!==Boolean(b.seguimientoEspecial))return a.seguimientoEspecial?1:-1;const pa=planNumber(a.plan);const pb=planNumber(b.plan);if(pa!==pb)return pa-pb;if(pa===1){const da=dayOrder[a.dia]||9;const db=dayOrder[b.dia]||9;if(da!==db)return da-db}return a.municipio.localeCompare(b.municipio,'es',{sensitivity:'base'})||a.lugar.localeCompare(b.lugar,'es',{sensitivity:'base'})||a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})});
  let normalNumber=0;let specialNumber=0;rows.forEach(row=>{row.numero=row.seguimientoEspecial?`M${++specialNumber}`:++normalNumber});
}
function weekRange(value){const date=parseDate(value);const day=date.getUTCDay();const mondayDistance=day===0?-6:1-day;const start=addDays(dateKey(date),mondayDistance);return{start,end:addDays(start,6)}}
function dayDateText(value){const names=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];const date=parseDate(value);return`${names[date.getUTCDay()]} ${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`}
function dayOfWeek(value){return parseDate(value).getUTCDay()}
function differenceDays(start,end){return Math.floor((parseDate(end)-parseDate(start))/86400000)}
function addDays(value,days){const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);return dateKey(date)}
function parseDate(value){const key=dateKey(value);return new Date(`${key}T00:00:00.000Z`)}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const raw=text(value);const match=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];const date=new Date(raw);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={collectionList,collectionRow,createPaymentContext};
