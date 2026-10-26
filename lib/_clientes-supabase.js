const supabase=require('./_supabase');

async function searchClients(search='',allowedIds=null){
  const[clients,credits,payments]=await Promise.all([
    (allowedIds?supabase.selectByIds('clientes','id_cliente',allowedIds,{select:'id_cliente,nombre,telefono,municipio,lugar,estado,fila_google_sheets',order:'fila_google_sheets.asc,id_cliente.asc'}):supabase.selectAll('clientes',{select:'id_cliente,nombre,telefono,municipio,lugar,estado,fila_google_sheets',order:'fila_google_sheets.asc,id_cliente.asc'})),
    (allowedIds?supabase.selectByIds('creditos','id_cliente',allowedIds,{select:'id_credito,id_cliente,cuota,saldo_actual,estado_credito,fila_google_sheets',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0',order:'fila_google_sheets.asc,id_credito.asc'}):supabase.selectAll('creditos',{select:'id_credito,id_cliente,cuota,saldo_actual,estado_credito,fila_google_sheets',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0',order:'fila_google_sheets.asc,id_credito.asc'})),
    supabase.rpc('ultimos_pagos_clientes',{p_ids:allowedIds?[...allowedIds]:null})
  ]);
  const term=normalize(search);
  const creditsByClient=group(credits,'id_cliente');
  const lastPayment=new Map();
  payments.forEach(payment=>{
    const id=text(payment.id_cliente);const date=dateKey(payment.fecha_pago);const previous=lastPayment.get(id);
    if(date&&(!previous||date>previous.fecha))lastPayment.set(id,{fecha:date,monto:money(payment.monto_abonado)});
  });
  return clients.filter(client=>!allowedIds||allowedIds.has(text(client.id_cliente))).map(client=>{
    const id=text(client.id_cliente);
    const active=(creditsByClient.get(id)||[]).find(credit=>normalize(credit.estado_credito)==='ACTIVO'&&money(credit.saldo_actual)>0);
    const item={
      idCliente:id,nombre:text(client.nombre),telefono:text(client.telefono),municipio:text(client.municipio),lugar:text(client.lugar),ruta:'',
      estado:text(client.estado)||'ACTIVO',saldo:active?money(active.saldo_actual):0,cuota:active?money(active.cuota):0,ultimoPago:lastPayment.get(id)||null
    };
    return!term||normalize([item.idCliente,item.nombre,item.telefono,item.municipio,item.lugar,item.ruta].join(' ')).includes(term)?item:null;
  }).filter(Boolean);
}

async function clientHistory(clientId,downloaded=null){
  const id=text(clientId);
  if(!id)throw new Error('Falta el identificador del cliente.');
  const[clients,allCredits,payments,storedEvents]=downloaded||await Promise.all([
    supabase.selectAll('clientes',{select:'id_cliente,nombre,dpi,telefono,direccion,municipio,lugar,estado',id_cliente:`eq.${id}`}),
    supabase.selectAll('creditos',{select:'id_credito,id_cliente,tipo_credito,modalidad_pago,dia_pago,fecha_inicio,monto_credito,saldo_absorbido,papeleria,monto_entregado,total_pagar,total_abonado,saldo_actual,cuota,cantidad_cuotas,estado_credito,id_cliente_trasladado,saldo_trasladado,fila_google_sheets',or:`(id_cliente.eq.${id},id_cliente_trasladado.eq.${id})`,order:'fila_google_sheets.asc,id_credito.asc'}),
    supabase.selectAll('pagos_clientes',{select:'id_pago,id_credito,id_cliente,fecha_pago,monto_abonado,saldo_despues_pago,fila_google_sheets',id_cliente:`eq.${id}`,order:'fecha_pago.asc,fila_google_sheets.asc,id_pago.asc'}),
    supabase.selectAll('eventos_cliente',{select:'id_evento,fecha_evento,tipo_evento,id_credito,id_cliente_relacionado,monto,descripcion,fila_google_sheets',id_cliente:`eq.${id}`,order:'fila_google_sheets.asc,id_evento.asc'})
  ]);
  const client=clients[0];
  if(!client)throw new Error('No se encontro el cliente solicitado en Supabase.');
  const paymentsByCredit=group(payments,'id_credito');
  const credits=allCredits.filter(item=>text(item.id_cliente)===id).map(row=>{
    const currentBalance=money(row.saldo_actual);
    const paymentRows=(paymentsByCredit.get(text(row.id_credito))||[]).map(publicPayment).sort(byDate);
    const publicCredit={
      idCredito:text(row.id_credito),tipo:text(row.tipo_credito)||'CREDITO',modalidad:text(row.modalidad_pago),diaPago:text(row.dia_pago),fechaInicio:dateKey(row.fecha_inicio),
      montoCredito:row.monto_credito==null?null:positiveMoney(row.monto_credito),saldoAnterior:money(row.saldo_absorbido),papeleria:row.papeleria==null?null:money(row.papeleria),dineroEntregado:money(row.monto_entregado),
      totalPagar:money(row.total_pagar),totalAbonado:money(row.total_abonado),saldoActual:currentBalance,cuota:money(row.cuota),cantidadCuotas:row.cantidad_cuotas==null?null:Number(row.cantidad_cuotas),estado:text(row.estado_credito),
      pagos:recalculateBalances(paymentRows,currentBalance)
    };
    publicCredit.historialPagos=expectedPayments(publicCredit);
    const cobros=require('./_cobros-supabase'),fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala'}).format(new Date());
    const detail=cobros.collectionRow(row,client,fecha,cobros.createPaymentContext(fecha,payments));
    const consistent=Math.abs(detail.saldo-currentBalance)<0.01;
    publicCredit.resumenCobro={fecha,saldo:currentBalance,cuota:publicCredit.cuota,modalidad:publicCredit.modalidad,
      atrasos:consistent?detail.diasAtrasados:null,debePagarHoy:consistent?detail.cantidadAtrasada:null};
    return publicCredit;
  }).sort((a,b)=>String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
  const events=clientEvents(id,allCredits,storedEvents);
  const profile=clientProfile(credits);
  return{
    generado:new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date()),
    cliente:{idCliente:id,nombre:text(client.nombre),dpi:text(client.dpi),telefono:text(client.telefono),direccion:text(client.direccion),municipio:text(client.municipio),lugar:text(client.lugar),ruta:'',estado:text(client.estado)||'ACTIVO'},
    creditos:credits,eventos:events,perfil:profile,
    resumen:{cantidadCreditos:credits.length,totalPagado:money(credits.reduce((sum,item)=>sum+item.totalAbonado,0)),saldoPendiente:money(credits.reduce((sum,item)=>sum+item.saldoActual,0))}
  };
}

function publicPayment(row){return{idPago:text(row.id_pago),fecha:dateKey(row.fecha_pago),monto:money(row.monto_abonado),saldoDespues:money(row.saldo_despues_pago)}}
function recalculateBalances(payments,currentBalance){
  const list=payments.map(item=>({...item})).sort(byDate);let balance=Math.max(0,money(currentBalance));
  for(let index=list.length-1;index>=0;index--){list[index].saldoDespues=money(balance);balance+=Math.max(0,money(list[index].monto))}
  return list;
}
function expectedPayments(credit){
  const real=(credit.pagos||[]).map(payment=>({idPago:payment.idPago||'',fecha:payment.fecha,monto:money(payment.monto),saldoDespues:money(payment.saldoDespues),estado:'PAGADO',tipo:'PAGO'})).filter(item=>item.fecha).sort(byDate);
  const start=parseDate(credit.fechaInicio);const today=parseDate(todayKey());
  if(!start||!hasPaymentCalendar(credit))return real;
  const paidDates={};real.forEach(item=>{paidDates[item.fecha]=(paidDates[item.fecha]||0)+money(item.monto)});
  const last=real.length?parseDate(real[real.length-1].fecha):null;const state=normalize(credit.estado);const current=money(credit.saldoActual);
  let limit=state==='ACTIVO'&&current>0.005?today:(last||today);if(limit>today)limit=today;
  const missing=[];const cursor=new Date(start);cursor.setUTCDate(cursor.getUTCDate()+1);
  for(let checked=0;cursor<=limit&&checked<420;checked++,cursor.setUTCDate(cursor.getUTCDate()+1)){
    const iso=dateKey(cursor);
    if(isExpectedDate(cursor,credit)&&!paidDates[iso]){
      const before=balanceBeforeDate(credit,real,cursor);
      if(before>0.005)missing.push({fecha:iso,monto:0,saldoDespues:money(before),estado:'NO_PAGO',tipo:'NO_PAGO',nota:'No pagó en la fecha que correspondía'});
    }
  }
  return real.concat(missing).sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))||(a.estado==='NO_PAGO'?-1:1));
}
function hasPaymentCalendar(credit){const mode=normalize(credit.modalidad);return mode.includes('DIARI')||mode.includes('SEMAN')||!!text(credit.diaPago)}
function isExpectedDate(date,credit){const mode=normalize(credit.modalidad);if(mode.includes('DIARI'))return date.getUTCDay()!==0;const day=paymentDay(credit.diaPago);return(mode.includes('SEMAN')||day!==null)&&day!==null&&date.getUTCDay()===day}
function paymentDay(value){const normal=normalize(value);if(!normal)return null;const map={DOMINGO:0,LUNES:1,MARTES:2,MIERCOLES:3,JUEVES:4,VIERNES:5,SABADO:6};const name=Object.keys(map).find(key=>normal.includes(key));if(name)return map[name];if(!/\d/.test(normal))return null;const number=Number(normal.replace(/[^0-9.-]/g,''));return number>=0&&number<=6?number:null}
function balanceBeforeDate(credit,payments,date){const limit=dateKey(date);const total=money(credit.totalPagar)||money(credit.saldoActual);const paid=payments.reduce((sum,item)=>item.fecha&&item.fecha<limit?sum+money(item.monto):sum,0);return money(Math.max(0,total-paid))}

function clientEvents(clientId,credits,stored){
  const events=stored.map(row=>({idEvento:text(row.id_evento),fecha:dateKey(row.fecha_evento),tipo:text(row.tipo_evento),idCredito:text(row.id_credito),idClienteRelacionado:text(row.id_cliente_relacionado),monto:money(row.monto),descripcion:text(row.descripcion),origen:'REGISTRADO'}));
  const keys={};events.forEach(event=>{keys[`${normalize(event.tipo)}|${event.idCredito}`]=true});
  credits.forEach(row=>{
    const type=normalize(row.tipo_credito);const creditId=text(row.id_credito);const responsible=text(row.id_cliente);const transferred=text(row.id_cliente_trasladado);if(!type.includes('UNIFIC'))return;
    if(responsible===clientId&&!keys[`DEUDA UNIFICADA|${creditId}`])events.push({idEvento:`DERIVADO-${creditId}-R`,fecha:dateKey(row.fecha_inicio),tipo:'DEUDA UNIFICADA',idCredito:creditId,idClienteRelacionado:transferred,monto:money(row.saldo_trasladado),descripcion:'Se incorporó otra deuda a este cliente. Registro recuperado desde CREDITOS.',origen:'DERIVADO'});
    if(transferred===clientId&&!keys[`DEUDA TRASLADADA|${creditId}`])events.push({idEvento:`DERIVADO-${creditId}-T`,fecha:dateKey(row.fecha_inicio),tipo:'DEUDA TRASLADADA',idCredito:creditId,idClienteRelacionado:responsible,monto:money(row.saldo_trasladado),descripcion:'La deuda de este cliente fue trasladada a otro responsable. Registro recuperado desde CREDITOS.',origen:'DERIVADO'});
  });
  return events.sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
}
function clientProfile(credits){
  const payments=[];let missed=0;let closed=0;let special=0;
  credits.forEach(credit=>{(credit.pagos||[]).forEach(item=>payments.push(item));missed+=(credit.historialPagos||[]).filter(item=>normalize(item.estado||item.tipo)==='NO_PAGO').length;const state=normalize(credit.estado);if(money(credit.saldoActual)<=0.005&&state!=='ACTIVO')closed++;if(state==='UNIFICADO'||state==='TRASLADADO'||normalize(credit.tipo).includes('UNIFIC'))special++});
  payments.sort(byDate);const last=payments.length?payments[payments.length-1]:null;const balance=money(credits.reduce((sum,item)=>sum+money(item.saldoActual),0));const dates=credits.map(item=>item.fechaInicio).filter(Boolean).sort();
  return{estadoCuenta:balance>0.005?'CON DEUDA':'SIN DEUDA',cantidadCreditos:credits.length,creditosCerrados:closed,movimientosEspeciales:special,pagosRegistrados:payments.length,fechasSinPago:missed,totalPagado:money(credits.reduce((sum,item)=>sum+money(item.totalAbonado),0)),saldoPendiente:balance,primerCredito:dates[0]||'',ultimoCredito:dates[dates.length-1]||'',ultimoPago:last?{fecha:last.fecha,monto:money(last.monto)}:null};
}

function group(rows,key){const result=new Map();rows.forEach(row=>{const id=text(row[key]);if(!result.has(id))result.set(id,[]);result.get(id).push(row)});return result}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function positiveMoney(value){const number=money(value);return number>0?number:0}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase()}
function dateKey(value){if(!value)return'';if(value instanceof Date)return value.toISOString().slice(0,10);const raw=text(value);const match=raw.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];const date=new Date(raw);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
function parseDate(value){const key=dateKey(value);return key?new Date(`${key}T00:00:00.000Z`):null}
function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function byDate(a,b){return String(a.fecha||'').localeCompare(String(b.fecha||''))}

async function collectorHistories(ids){
  if(!ids.size)return{};
  const data=await Promise.all([
    supabase.selectByIds('clientes','id_cliente',ids,{select:'id_cliente,nombre,dpi,telefono,direccion,municipio,lugar,estado'}),
    supabase.selectByIds('creditos',['id_cliente','id_cliente_trasladado'],ids,{select:'*',order:'fila_google_sheets.asc,id_credito.asc'}),
    supabase.selectByIds('pagos_clientes','id_cliente',ids,{select:'*',order:'fecha_pago.asc,fila_google_sheets.asc,id_pago.asc'}),
    supabase.selectByIds('eventos_cliente','id_cliente',ids,{select:'*',order:'fila_google_sheets.asc,id_evento.asc'})
  ]);
  return Object.fromEntries(await Promise.all(data[0].filter(row=>ids.has(row.id_cliente)).map(async row=>[row.id_cliente,await clientHistory(row.id_cliente,[[row],data[1],data[2].filter(p=>p.id_cliente===row.id_cliente),data[3].filter(e=>e.id_cliente===row.id_cliente)])])));
}
module.exports={searchClients,clientHistory,collectorHistories};
