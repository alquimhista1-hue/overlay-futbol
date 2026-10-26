import{initPwa}from'./pwa.js?v=5';
import{startSessionLifecycle}from'./session-lifecycle.js?v=1';
import{renderCollectorMobileClients,renderReadOnlyClient,setCollectorMobileRoute,initCollectorSounds}from'./collector-mobile.js?v=31';
import{decorateMenu,retireMenu}from'./menu-drawer.js?v=2';
import{stopSummary}from'./collector-speech.js?v=4';

const $=id=>document.getElementById(id);
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>value==null?'Sin confirmar':'Q '+new Intl.NumberFormat('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const date=value=>value?new Intl.DateTimeFormat('es-GT',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'—';
const dateWithDay=value=>value?new Intl.DateTimeFormat('es-GT',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'—';
const dayName=value=>new Intl.DateTimeFormat('es-GT',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const tabs=['inicio','cobros','gastos','buscar','menu','creditos','planilla','prestamos','financiamiento','abonos-personal','otros-caja'];
let data,financeData=null,clients=null,overviewFlight=null,routeVersion=0,ready=false,lastResume=0,query='',statusError='',menu=null;
let route=readRoute();
if('scrollRestoration' in history)history.scrollRestoration='manual';
const card=(label,value,style='')=>`<div class="card ${style}"><small>${e(label)}</small><strong>${e(value)}</strong></div>`;
const pair=(label,value)=>`<div class="label-value"><span>${e(label)}</span><b>${e(value)}</b></div>`;
const empty=(text='Sin registros.')=>`<p class="empty">${e(text)}</p>`;
const row=(label,value,sub='')=>`<div class="row"><span>${e(label)}${sub?`<small>${e(sub)}</small>`:''}</span><b>${e(value)}</b></div>`;
const rows=items=>items.length?`<div class="rows">${items.join('')}</div>`:empty();
const title=(label,tone='')=>`<h1 class="view-title ${tone}">${e(label)}</h1>`;
const total=(value,label='Total')=>`<div class="end-total"><span>${e(label)}</span><strong>${e(money(value))}</strong></div>`;
const back=()=>'<button class="back" data-back aria-label="Volver">← Volver</button>';
const link=(label,value,attrs,sub='',tone='')=>`<button class="list-link ${tone}" ${attrs}><span><strong>${e(label)}</strong>${sub?`<small>${e(sub)}</small>`:''}</span>${value!==''?`<b>${e(value)}</b>`:''}<i aria-hidden="true">›</i></button>`;

function readRoute(){
 const params=new URLSearchParams(location.hash.slice(1));const tab=params.get('tab')||location.hash.slice(1)||'inicio';
 return{tab:tabs.includes(tab)&&tab!=='menu'?tab:'inicio',id:params.get('id')||'',day:params.get('dia')||'',credit:params.get('credito')||''};
}
function hash(value){const p=new URLSearchParams({tab:value.tab});if(value.id)p.set('id',value.id);if(value.day)p.set('dia',value.day);if(value.credit)p.set('credito',value.credit);return'#'+p}
function navigate(next,{replace=false}={}){
 stopSummary();if(hash(next)===hash(route))return;
 if(route.tab==='buscar'&&next.tab!=='buscar')query='';
 history.replaceState({...history.state,scroll:window.scrollY},'',location.href);
 const depth=replace?(history.state?.depth||0):(history.state?.depth||0)+1;
 history[replace?'replaceState':'pushState']({auditor:true,depth,scroll:0},'',hash(next));route=next;renderRoute();
}
function goBack(){
 if(history.state?.auditor&&history.state.depth>0){history.back();return}
 if(route.credit&&['financiamiento','abonos-personal','otros-caja'].includes(route.tab)){navigate({...route,credit:''},{replace:true});return}
 if(route.tab==='planilla'&&route.credit){navigate({tab:'planilla',id:route.id},{replace:true});return}
 navigate({tab:route.day||route.id?route.tab:['creditos','planilla','prestamos','financiamiento','abonos-personal','otros-caja'].includes(route.tab)?'menu':'inicio'},{replace:true});
}
window.addEventListener('popstate',()=>{const wasMenu=!!menu;dismissMenu();const next=readRoute();if(history.state?.menu){route=next;openMenu(false);return}if(wasMenu&&hash(next)===hash(route)){updateNav();return}if(next.tab!=='buscar')query='';route=next;renderRoute(history.state?.scroll||0)});
function updateNav(){document.querySelectorAll('[data-tab]').forEach(b=>{const active=menu?b.dataset.tab==='menu':b.dataset.tab===(['creditos','planilla','prestamos','financiamiento','abonos-personal','otros-caja'].includes(route.tab)?'menu':route.tab);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function dismissMenu(){if(!menu)return;const dialog=menu;menu=null;retireMenu(dialog);updateNav()}
function closeMenu(){if(!menu)return;if(history.state?.menu)history.back();else dismissMenu()}
function openMenu(record=true){
 if(menu)return;stopSummary();
 if(record){history.replaceState({...history.state,scroll:window.scrollY},'',location.href);
 history.pushState({auditor:true,menu:true,depth:(history.state?.depth||0)+1,scroll:window.scrollY},'',location.href)}
 menu=document.createElement('dialog');menu.className='auditor-menu';menu.setAttribute('aria-label','Menú');
 menu.innerHTML='<div class="menu-handle"></div><header><h2>Menú</h2><button data-close-menu aria-label="Cerrar menú">×</button></header>'+link('Créditos entregados','','data-open="creditos"')+link('Planilla','','data-open="planilla"')+link('Préstamos personales','','data-open="prestamos"')+link('Financiamiento','','data-open="financiamiento"')+link('Abonos del personal','','data-open="abonos-personal"')+link('Otros movimientos de caja','','data-open="otros-caja"')+'<button class="logout" data-logout>Cerrar sesión</button>';
 menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu()});
 menu.addEventListener('click',event=>{if(event.target===menu){const r=menu.getBoundingClientRect();if(event.clientY<r.top||event.clientY>r.bottom||event.clientX<r.left||event.clientX>r.right)closeMenu();return}const b=event.target.closest('button');if(!b)return;if(b.hasAttribute('data-close-menu'))closeMenu();else if(b.dataset.open){const next={tab:b.dataset.open};if(hash(next)===hash(route)){closeMenu();return}dismissMenu();navigate(next,{replace:true})}else if(b.hasAttribute('data-logout'))logout(b)});
 decorateMenu(menu);document.body.append(menu);menu.showModal();updateNav();
}
async function logout(button){button.disabled=true;stopSummary();try{const response=await fetch('/api/logout',{method:'POST'});if(!response.ok)throw Error();data=null;financeData=null;clients=null;$('content').replaceChildren();location.replace('/login.html')}catch{statusError='No se pudo cerrar sesión. Reintenta con conexión.';updateStatus();button.disabled=false}}
async function read(action='resumen',id=''){
 const p=new URLSearchParams({accion:action});if(id)p.set('id',id);
 const response=await fetch('/api/auditor?'+p,{cache:'no-store',signal:AbortSignal.timeout(25000)});
 if([401,403].includes(response.status)){$('content').replaceChildren();location.replace('/login.html');throw Error('Sesión no disponible.')}
 const result=await response.json();if(!response.ok||!result.ok)throw Error(result.mensaje||'No se pudo consultar la información.');return result.datos;
}
function updateStatus(){
 const status=$('status');status.classList.toggle('error',!!statusError);
 if(statusError){status.replaceChildren(document.createTextNode(statusError+' '));const retry=document.createElement('button');retry.className='retry';retry.textContent='Reintentar';retry.onclick=()=>refresh();status.append(retry);return}
 status.textContent=data?'Actualizado '+new Intl.DateTimeFormat('es-GT',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Guatemala'}).format(new Date(data.actualizadoEn)):'Cargando información…';
}
async function refresh(){
 if(overviewFlight)return overviewFlight;
 overviewFlight=(async()=>{
  const scroll=window.scrollY;
  if(data&&data.fecha!==today()){data=null;financeData=null;clients=null;$('content').replaceChildren()}
  statusError='';updateStatus();
  try{data=await read();clients=null;financeData=null;statusError='';updateStatus();await renderRoute(scroll)}
  catch(error){statusError=(data?'No se pudo actualizar; se muestran datos anteriores. ':'')+error.message;updateStatus();$('content').setAttribute('aria-busy','false')}
  finally{overviewFlight=null}
 })();return overviewFlight;
}
function days(){
 const index=route.tab==='cobros'?0:2,group=data.secciones[index],tone=index===0?'green':'amber';
 let html=title(index===0?'Cobros':'Gastos',tone)+card('Total de la semana',money(index===0?group.entrada:group.salida),'green');
 for(let n=0;n<7;n++){
  const d=new Date(data.semana.inicio+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);const key=d.toISOString().slice(0,10);
  const items=group.movimientos.filter(r=>r.fecha===key),total=items.reduce((s,r)=>s+(index===0?r.entrada:r.salida),0);
  html+=link(dayName(key),money(total),`data-day="${key}"`,index===0?`${items.length} ${items.length===1?'abono':'abonos'}`:`${items.length} ${items.length===1?'gasto':'gastos'}`,key<=today()?(index===0?'collected':'spent'):'future');
 }return html+total(index===0?group.entrada:group.salida);
}
function dayDetail(){
 const index=route.tab==='cobros'?0:2,group=data.secciones[index],tone=index===0?'green':'amber';
 const valid=route.day>=data.semana.inicio&&route.day<=data.semana.fin&&/^\d{4}-\d{2}-\d{2}$/.test(route.day);
 if(!valid)return back()+empty('Este día no pertenece a la semana actual.');
 const items=group.movimientos.filter(r=>r.fecha===route.day),sum=items.reduce((s,r)=>s+(index===0?r.entrada:r.salida),0);
 return back()+`<section class="detail-header ${tone}"><small>${index===0?'Cobros':'Gastos'}</small><h1>${e(dayName(route.day))}</h1><strong>${e(money(sum))}</strong></section><section class="day-table ${tone}"><div class="table-head"><span>${index===0?'Cliente':'Concepto'}</span><span>${index===0?'Abonó':'Cantidad'}</span></div>${rows(items.map(r=>row(index===0?String(r.descripcion||'').replace(/^Abono\s+de\s+/i,''):r.descripcion,money(index===0?r.entrada:r.salida))))}</section>`+(index===0?total(sum):'');
}
function home(){
 const i=data.indicadores;
 return`<div class="grid">${card('Cobrado esta semana',money(i.cobrado),'lime')}${card('Dinero usado',money(i.dineroUsado),'dark')}${card('Disponible en caja',i.baseCajaConfirmada?money(i.saldoFinal):'Sin confirmar')}${card('Cartera en la calle',money(i.cartera))}</div><h2 class="section-title">Resumen de la semana</h2><div class="block">${pair('Dinero al comenzar',i.baseCajaConfirmada?money(i.saldoInicial):'Sin confirmar')}${pair('Clientes con deuda',i.clientesActivos)}${pair('Gastos',money(i.gastos))}${pair('Créditos entregados',money(i.creditosEntregados))}${pair('Planilla pagada',money(i.planilla))}${pair('Préstamos al personal',money(i.prestamosPersonal))}${pair('Financiamiento recibido',money(data.secciones[6]?.entrada||0))}${pair('Pagos de financiamiento',money(data.secciones[7]?.salida||0))}${pair('Abonos del personal',money(data.secciones[5]?.entrada||0))}${pair('Otras entradas de caja',money(data.secciones[8]?.entrada||0))}${pair('Otras salidas de caja',money(data.secciones[8]?.salida||0))}</div>`+arrearsCards();
}
function arrearsCards(){
 const m=data.morosidad;if(!m)return empty('No se pudo consultar el seguimiento de atrasos.');
 const field=(label,value)=>`<div><small>${e(label)}</small><strong>${e(value)}</strong></div>`;
 return `<section class="arrears-section"><h2>Clientes con atraso: dar seguimiento y acordar una solución</h2><div class="arrears-summary"><div><small>Clientes con atraso</small><strong>${m.items.length}</strong></div><div><small>Total en atraso</small><strong>${e(money(m.total))}</strong></div></div>${m.sinVerificar?'<p class="error">Hay créditos que requieren revisión de datos; no están incluidos en este total.</p>':''}${m.items.map(p=>`<article class="arrears-card" role="link" tabindex="0" data-client="${e(p.idCliente)}" aria-label="Ver detalles de ${e(p.nombre)}"><div class="arrears-name"><span>${e(p.nombre)}</span><span aria-hidden="true">›</span></div><div class="arrears-location"><span>${e(p.municipio||'—')}</span><span>${e(p.lugar||'—')}</span></div><div class="arrears-values">${field('Saldo pendiente',money(p.saldo))}${field('Monto atrasado',money(p.atraso))}${field('Cuotas atrasadas',p.cuotas)}</div><h3>Pagos últimas cuatro semanas</h3><div class="arrears-payments">${['Hace 3 semanas','Hace 2 semanas','Semana pasada','Esta semana'].map((label,index)=>field(label,money(p.pagosSemanas[index]))).join('')}</div>${p.creditos>1?'<small class="arrears-note">Suma de sus créditos con atraso</small>':''}</article>`).join('')||empty('No hay clientes con atraso para mostrar.')}${total(m.total,'Total en atraso')}</section>`;
}
function creditDetail(c){return back()+`<section class="detail-header blue"><small>Crédito entregado · ${e(date(c.fecha))}</small><h1>${e(c.cliente)}</h1><strong>${e(money(c.dineroEntregado))}</strong><small>Efectivo entregado</small></section><div class="block">${pair('Tipo',c.tipo)}${pair('Monto del crédito',money(c.montoCredito))}${pair('Saldo anterior absorbido',money(c.saldoAnterior))}${pair('Papelería descontada',money(c.papeleria))}${pair('Efectivo entregado',money(c.dineroEntregado))}${c.saldoTrasladado?pair('Saldo trasladado',money(c.saldoTrasladado)):''}${c.recargoUnificacion?pair('Recargo de unificación',money(c.recargoUnificacion)):''}</div><section class="block paper"><h2>Papelería del trabajador</h2>${pair('Cantidad',money(c.papeleriaTrabajador))}${pair('Corresponde a',c.nombreEmpleadoPapeleria||'Sin asignar')}${pair('Estado',c.estadoPapeleria)}</section>`+total(c.dineroEntregado,'Efectivo entregado')}
function paperworkDetail(){
 const paid=route.id.startsWith('paid:'),key=route.id.slice(route.id.indexOf(':')+1),list=paid?data.detalles.planilla.items:data.planillaPrevista.items;
 const person=list.find(r=>String(paid?r.idPago:r.idEmpleado)===key);
 if(!person)return back()+empty('No se encontró esta planilla.');
 const items=person.papeleriaDetalle||[],sum=items.reduce((n,c)=>n+Math.round(Number(c.cantidad)*100),0)/100;
 if(route.credit){const c=items.find(c=>c.idCredito===route.credit);return c?.detalleCredito?creditDetail(c.detalleCredito):back()+empty('No se encontró el crédito vinculado.')}
 return back()+`<section class="detail-header green"><small>Papelería · ${paid?'Planilla pagada':'Por pagar'}</small><h1>${e(person.empleado)}</h1><strong>${e(money(person.papeleria))}</strong></section>`+(person.papeleriaVerificada?'':'<p class="error">El detalle disponible no coincide con el total de esta planilla.</p>')+`<section class="paperwork-table"><div class="paperwork-head"><span>Cliente</span><span>Fecha</span><span>Papelería</span></div>${items.map(c=>`<button class="paperwork-row" data-paper-credit="${e(c.idCredito)}"><span>${e(c.cliente)} ›</span><span>${e(date(c.fecha))}</span><b>${e(money(c.cantidad))}</b></button>`).join('')||empty('Sin clientes vinculados.')}</section>`+total(sum,'Total del detalle');
}
const financeType=value=>({APORTE_CAPITAL:'Aporte de capital',PRESTAMO_RECIBIDO:'Préstamo recibido',COMPRA_FINANCIADA:'Compra financiada'}[value]||value||'Financiamiento');
function cashView(index,label){
 if(![5,6,7,8].includes(index))return back()+empty('Sección no disponible.');
 const group=data.secciones[index],items=[...(group?.movimientos||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(b.id).localeCompare(String(a.id)));
 if(route.credit){const r=items.find(r=>r.id===route.credit);return !r?back()+empty('El movimiento no pertenece a esta semana.'):back()+`<section class="detail-header green"><small>${e(label)}</small><h1>${e(r.tipo)}</h1><p>${e(dateWithDay(r.fecha))}</p></section><div class="block">${pair('Descripción',r.descripcion)}${pair('Entrada',money(r.entrada))}${pair('Salida',money(r.salida))}</div>`}
 return back()+title(label,'green')+`<p class="note">${e(date(data.semana.inicio))} al ${e(date(data.semana.fin))}</p><div class="grid cash-totals">${card('Entradas de la semana',money(group?.entrada||0),'lime')}${card('Salidas de la semana',money(group?.salida||0),'dark')}</div>`+items.map(r=>link(r.descripcion,money(r.entrada||r.salida),`data-cash="${e(r.id)}"`,`${dateWithDay(r.fecha)} · ${r.entrada?'Entrada':'Salida'}`)).join('')+(items.length?'':empty('Sin movimientos esta semana.'))+total((Math.round(Number(group?.entrada||0)*100)-Math.round(Number(group?.salida||0)*100))/100,'Movimiento neto');
}
function financingView(){
 const f=financeData;
 if(route.id){
  const item=f.items.find(r=>r.idFinanciamiento===route.id);if(!item)return back()+empty('No se encontró este financiamiento.');
  const movements=f.movimientos.filter(r=>r.idFinanciamiento===item.idFinanciamiento).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(b.idMovimiento).localeCompare(String(a.idMovimiento)));
  return back()+`<section class="detail-header green"><small>${e(financeType(item.tipo))}</small><h1>${e(item.nombre)}</h1><strong>${e(money(item.tipo==='APORTE_CAPITAL'?item.montoReferencia:item.saldoPendiente))}</strong><small>${item.tipo==='APORTE_CAPITAL'?'Capital aportado':'Saldo pendiente'}</small></section><div class="block">${pair('Fecha de inicio',dateWithDay(item.fechaInicio))}${pair('Estado',item.estado)}${pair('Monto de referencia',money(item.montoReferencia))}${pair('Entrada inicial a caja',money(item.montoCajaInicial))}${item.tipo==='APORTE_CAPITAL'?'':pair('Total a pagar',money(item.totalAcordado))+pair('Total pagado',money(item.totalPagado))+pair('Saldo pendiente',money(item.saldoPendiente))}${item.registroHistorico?'<p class="note">Registro histórico. No representa una entrada nueva de caja.</p>':''}${item.notas?pair('Notas',item.notas):''}</div><h2 class="section-title">Movimientos</h2>`+movements.map(r=>`<article class="finance-movement"><header><strong>${e(({APERTURA:'Apertura',REGISTRO_HISTORICO:'Registro histórico',PAGO:'Pago',PAGO_HISTORICO:'Pago histórico'})[r.tipoMovimiento]||r.tipoMovimiento)}</strong><span>${e(dateWithDay(r.fecha))}</span></header><div>${pair('Cantidad',money(r.monto))}${r.saldoDespues==null?'':pair('Saldo después',money(r.saldoDespues))}${pair('Movimiento de caja',r.afectaCaja?'Sí':'No')}${r.descripcion?pair('Descripción',r.descripcion):''}</div></article>`).join('')+(movements.length?'':empty());
 }
 return back()+title('Financiamiento','green')+`<h2 class="section-title">Esta semana · caja</h2>`+link('Dinero recibido',money(data.secciones[6]?.entrada||0),'data-cash-group="6"','','green')+link('Pagos de financiamiento',money(data.secciones[7]?.salida||0),'data-cash-group="7"','','green')+`<h2 class="section-title">Saldos actuales</h2>`+card('Deuda pendiente',money(f.resumen.deudaPendiente),'dark')+`<h2 class="section-title">Aportes y financiamientos</h2>`+f.items.map(r=>link(r.nombre,money(r.tipo==='APORTE_CAPITAL'?r.montoReferencia:r.saldoPendiente),`data-finance="${e(r.idFinanciamiento)}"`,`${financeType(r.tipo)} · ${r.estado}${r.registroHistorico?' · Histórico':''}`)).join('')+(f.items.length?'':empty('Sin financiamientos registrados.'));
}
function payroll(){
 const entry=(r,paid)=>`<details class="payroll-item ${paid?'paid':'pending'}"><summary><span><strong>${e(r.empleado)}</strong><small>${paid?date(r.fecha):'Por pagar'}</small></span><b>${e(money(r.totalRecibir))}</b><i aria-hidden="true">⌄</i></summary><div class="payroll-body">${pair('Sueldo',money(r.sueldoBase))}<button class="paperwork-link" data-paper="${e((paid?'paid:':'pending:')+(paid?r.idPago:r.idEmpleado))}"><span>Papelería</span><b>${e(money(r.papeleria))} ›</b></button>${pair('Descuento de préstamo',money(r.descuentoPrestamo))}${paid?pair('Otros descuentos',money(r.otrosDescuentos)):''}${pair(paid?'Total recibido':'Total a recibir',money(r.totalRecibir))}</div></details>`;
 return back()+title('Planilla','green')+'<h2 class="section-title">Planilla pagada</h2>'+card('Total pagado esta semana',money(data.detalles.planilla.total),'lime')+data.detalles.planilla.items.map(r=>entry(r,true)).join('')+(data.detalles.planilla.items.length?'':empty())+'<h2 class="section-title">Por pagar</h2>'+data.planillaPrevista.items.map(r=>entry(r,false)).join('');
}
function loanDetail(result){
 const balance=result.prestamos.reduce((sum,p)=>sum+Math.round(Number(p.saldo_pendiente||0)*100),0)/100;
 const dates=new Map(result.prestamos.map(p=>[p.id_prestamo,p.fecha_inicial]));
 return back()+`<section class="detail-header green"><small>Préstamos personales</small><h1>${e(result.nombre)}</h1><strong>${e(money(balance))}</strong><small>Saldo pendiente total</small></section>`+result.prestamos.map(p=>`<section class="block">${pair('Préstamo del',dateWithDay(p.fecha_inicial))}${pair('Estado',p.estado)}${pair('Préstamo inicial',money(p.prestamo_inicial))}${pair('Dinero adicional',money(p.dinero_adicional))}${pair('Total descontado',money(p.total_descontado))}${pair('Saldo pendiente',money(p.saldo_pendiente))}</section>`).join('')+'<h2 class="section-title">Movimientos</h2>'+[...result.movimientos].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(b.id_movimiento||'').localeCompare(String(a.id_movimiento||''))).map(r=>`<article class="loan-movement ${Number(r.cantidad_disminuye)>0?'deduction':'addition'}"><header><strong>${e(r.tipo_movimiento)}</strong><span>${e(dateWithDay(r.fecha))}</span></header><div>${result.prestamos.length>1?`<small>Préstamo del ${e(dateWithDay(dates.get(r.id_prestamo)))}</small>`:''}${r.descripcion?`<p>${e(r.descripcion)}</p>`:''}${Number(r.cantidad_aumenta)>0?pair('Entregado',money(r.cantidad_aumenta)):''}${Number(r.cantidad_disminuye)>0?pair('Descontado',money(r.cantidad_disminuye)):''}${pair('Saldo de ese préstamo',money(r.saldo_despues_movimiento))}</div></article>`).join('')+(result.movimientos.length?'':empty());
}
function loanPeople(){
 const people=new Map();
 for(const p of data.prestamos){const key=p.idEmpleado||p.idPrestamo;if(!people.has(key))people.set(key,{...p,balance:0,count:0});const person=people.get(key);person.balance+=Math.round(Number(p.saldoPendiente||0)*100);person.count++}
 return[...people.values()].map(p=>link(p.nombre,money(p.balance/100),`data-loan="${e(p.idPrestamo)}"`,`${p.count} ${p.count===1?'préstamo':'préstamos'}`,'green')).join('')||empty();
}
async function renderRoute(scroll=0){
 if(route.tab!=='buscar')query='';
 document.querySelectorAll('.client-photo-dialog[open]').forEach(dialog=>dialog.close());
 const version=++routeVersion;stopSummary();setCollectorMobileRoute('clientes');
 const content=$('content');content.setAttribute('aria-busy','true');
 updateNav();
 if(!data)return;
 try{
  let html='';
  if(route.tab==='inicio')html=home();
  else if(['cobros','gastos'].includes(route.tab))html=route.day?dayDetail():days();
  else if(route.tab==='menu')html=title('Menú')+link('Créditos entregados','', 'data-open="creditos"','','blue')+link('Planilla','','data-open="planilla"','','green')+link('Préstamos personales','','data-open="prestamos"','','green')+link('Financiamiento','','data-open="financiamiento"','','green')+link('Abonos del personal','','data-open="abonos-personal"','','green')+link('Otros movimientos de caja','','data-open="otros-caja"','','green')+'<button class="logout" data-logout>Cerrar sesión</button>';
  else if(route.tab==='creditos'){
   if(route.id){const item=data.detalles.creditos.items.find(c=>c.idCredito===route.id);html=item?creditDetail(item):back()+empty('El crédito ya no pertenece a esta semana.')}
   else html=back()+title('Créditos entregados','blue')+card('Efectivo entregado esta semana',money(data.detalles.creditos.total),'blue')+data.detalles.creditos.items.map(c=>link(c.cliente,money(c.dineroEntregado),`data-credit="${e(c.idCredito)}"`,date(c.fecha),'blue')).join('')+(data.detalles.creditos.items.length?'':empty())+total(data.detalles.creditos.total);
  }else if(route.tab==='planilla')html=route.id?paperworkDetail():payroll();
  else if(route.tab==='financiamiento'){
   if(!financeData){content.innerHTML=back()+empty('Cargando financiamiento…');const result=await read('financiamiento');if(version!==routeVersion)return;financeData=result}
   html=route.day?cashView(Number(route.day),'Movimientos de financiamiento'):financingView();
  }else if(route.tab==='abonos-personal')html=cashView(5,'Abonos del personal');
  else if(route.tab==='otros-caja')html=cashView(8,'Otros movimientos de caja');
  else if(route.tab==='prestamos'){
   if(route.id){content.innerHTML=back()+empty('Cargando movimientos…');const result=await read('prestamo',route.id);if(version!==routeVersion)return;html=loanDetail(result)}
   else html=back()+title('Préstamos personales','green')+loanPeople();
  }else if(route.tab==='buscar'){
   content.innerHTML='<div id="collectorContent"></div>';
   if(route.id){content.querySelector('#collectorContent').innerHTML=back()+empty('Cargando cliente…');const result=await read('cliente',route.id);if(version!==routeVersion)return;renderReadOnlyClient(result,goBack)}
   else{
    if(!clients){content.querySelector('#collectorContent').innerHTML=empty('Cargando clientes…');const result=await read('clientes');if(version!==routeVersion)return;clients=result}
    renderCollectorMobileClients('clientes',clients,{query,onQuery:value=>{query=value},onClient:async id=>{navigate({tab:'buscar',id})}});
    const label=content.querySelector('.cm-section-heading small');if(label)label.textContent='Clientes';
   }
   if(version===routeVersion)window.scrollTo({top:scroll,behavior:'instant'});return;
  }
  if(version!==routeVersion)return;content.innerHTML=html;window.scrollTo({top:scroll,behavior:'instant'});
 }catch(error){if(version===routeVersion)content.innerHTML=back()+`<div class="block error">${e(error.message)}<button class="retry" data-retry-view>Reintentar</button></div>`}
 finally{if(version===routeVersion)content.setAttribute('aria-busy','false')}
}
document.querySelector('nav').addEventListener('click',event=>{const b=event.target.closest('[data-tab]');if(b){if(b.dataset.tab==='menu')openMenu();else navigate({tab:b.dataset.tab})}});
$('content').addEventListener('click',async event=>{
 const b=event.target.closest('button,[data-client]');if(!b)return;
 if(b.hasAttribute('data-back'))goBack();
 else if(b.dataset.day)navigate({tab:route.tab,day:b.dataset.day});
 else if(b.dataset.open)navigate({tab:b.dataset.open});
 else if(b.dataset.credit)navigate({tab:'creditos',id:b.dataset.credit});
 else if(b.dataset.finance)navigate({tab:'financiamiento',id:b.dataset.finance});
 else if(b.dataset.cashGroup)navigate({tab:'financiamiento',day:b.dataset.cashGroup});
 else if(b.dataset.cash)navigate({...route,credit:b.dataset.cash});
 else if(b.dataset.paperCredit)navigate({tab:'planilla',id:route.id,credit:b.dataset.paperCredit});
 else if(b.dataset.paper)navigate({tab:'planilla',id:b.dataset.paper});
 else if(b.dataset.client)navigate({tab:'buscar',id:b.dataset.client});
 else if(b.dataset.loan)navigate({tab:'prestamos',id:b.dataset.loan});
 else if(b.hasAttribute('data-retry-view'))renderRoute();
 else if(b.hasAttribute('data-logout')){
  b.disabled=true;stopSummary();
  try{const response=await fetch('/api/logout',{method:'POST'});if(!response.ok)throw Error();data=null;financeData=null;clients=null;$('content').replaceChildren();location.replace('/login.html')}
  catch{statusError='No se pudo cerrar sesión. Reintenta con conexión.';updateStatus();b.disabled=false}
 }
});
$('content').addEventListener('keydown',event=>{const card=event.target.closest('.arrears-card[data-client]');if(card&&event.target===card&&['Enter',' '].includes(event.key)){event.preventDefault();card.click()}});
function resume(){if(!ready||document.hidden||Date.now()-lastResume<1500)return;lastResume=Date.now();refresh()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSummary();else resume()});
window.addEventListener('pageshow',event=>{if(event.persisted)resume()});
window.addEventListener('focus',resume);window.addEventListener('online',resume);
try{
 const response=await fetch('/api/session',{cache:'no-store'}),session=await response.json();
 if([401,403].includes(response.status))location.replace('/login.html');
 else if(!response.ok)throw Error('No se pudo verificar el acceso.');
 else if(!['AUDITOR','ADMIN'].includes(session.rol))location.replace('/cobrador.html');
 else{history.replaceState({auditor:true,depth:0,scroll:0},'',hash(route));ready=true;initCollectorSounds({login:false});startSessionLifecycle(session.rol,session);document.querySelector('nav').hidden=false;initPwa({autoOffer:true});await refresh()}
}catch{statusError='No se pudo verificar el acceso. Recarga con conexión.';updateStatus()}
