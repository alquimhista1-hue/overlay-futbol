const db=require('./_supabase');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const cents=v=>Math.round(Number(v||0)*100),amount=n=>n/100;
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v}
function aggregate(data){
 const groups=new Map(),staff=new Map(data.staff.map(s=>[s.id_empleado,s])),names=new Map(data.clients.map(c=>[c.id_cliente,c.nombre])),warnings=[],unassigned=[],others=[];
 const ensure=id=>{if(!groups.has(id))groups.set(id,{idCobrador:id,nombre:staff.get(id)?.nombre_completo||data.attributions.find(a=>a.id_cobrador===id)?.nombre_cobrador||id,pagos:[],gastos:[],reportes:[]});return groups.get(id)};
 for(const s of data.staff)if(s.estado==='ACTIVO'&&/COBRADOR|COBRADORA/i.test(s.puesto||'')&&!/SUPERVISOR/i.test(s.puesto||''))ensure(s.id_empleado);
 for(const p of data.payments){
  const ids=new Set([...data.attributions.filter(a=>a.id_pago===p.id_pago).map(a=>a.id_cobrador),...data.links.filter(l=>l.id_pago===p.id_pago&&l.id_cobro).map(l=>l.id_empleado)]);
  const row={id:p.id_pago,fecha:p.fecha_pago,nombre:names.get(p.id_cliente)||p.id_cliente,monto:Number(p.monto_abonado)};
  if(ids.size!==1){unassigned.push(row);if(ids.size>1)warnings.push('Un pago tiene cobradores contradictorios y requiere revisión.');continue}ensure([...ids][0]).pagos.push(row);
 }
 for(const m of data.movements){
  const links=data.links.filter(l=>l.id_movimiento===m.id_movimiento&&l.id_gasto),ids=new Set(links.map(l=>l.id_empleado));
  const row={id:m.id_movimiento,fecha:m.fecha,descripcion:m.descripcion,monto:Number(m.salida),modificado:links.some(l=>l.registrado?.correccion?.motivo)};
  if(ids.size!==1){others.push(row);if(ids.size>1)warnings.push('Un gasto tiene cobradores contradictorios y requiere revisión.');continue}ensure([...ids][0]).gastos.push(row);
 }
 for(const r of new Map(data.reports.map(r=>[r.id,r])).values())ensure(r.id_empleado).reportes.push(r);
 const rows=[...groups.values()].map(g=>{
  const cobrado=g.pagos.reduce((s,p)=>s+cents(p.monto),0),gastos=g.gastos.reduce((s,p)=>s+cents(p.monto),0);
  const signed=g.reportes.flatMap(r=>(r.datos?.rows||[]).filter(n=>n.estado==='ANOTADO')),expenses=g.reportes.flatMap(r=>(r.datos?.gastos||[]).filter(n=>n.estado==='ANOTADO'));
  const signedIn=signed.reduce((s,n)=>s+cents(n.monto),0),signedOut=expenses.reduce((s,n)=>s+cents(n.monto),0);
  return{...g,reportes:undefined,cobrado:amount(cobrado),gastosTotal:amount(gastos),neto:amount(cobrado-gastos),comparacion:g.reportes.length?{cobrado:amount(signedIn),gastos:amount(signedOut),diferenciaAbonos:amount(cobrado-signedIn),diferenciaGastos:amount(gastos-signedOut),cuadra:cobrado===signedIn&&gastos===signedOut}:null};
 }).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 return{cobradores:rows,otrosGastos:others,totalOtrosGastos:amount(others.reduce((s,r)=>s+cents(r.monto),0)),abonosSinCobrador:unassigned,avisos:[...new Set(warnings)]};
}
async function period(start,end){
 const range={and:`(fecha.gte.${start},fecha.lte.${end})`};
 const[payments,movements,staff,reports]=await Promise.all([
  db.selectAll('pagos_clientes',{select:'id_pago,id_cliente,fecha_pago,monto_abonado',and:`(fecha_pago.gte.${start},fecha_pago.lte.${end})`,order:'fecha_pago.asc'}),
  db.selectAll('movimientos_caja',{select:'id_movimiento,fecha,descripcion,salida',tipo_movimiento:'eq.GASTO',...range,order:'fecha.asc'}),
  db.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,estado'}),
  db.selectAll('reportes_jornada_cobrador',{select:'id,id_empleado,datos',and:`(fecha_jornada.gte.${start},fecha_jornada.lte.${end})`})
 ]);
 const[attributions,paymentLinks,expenseLinks,clients]=await Promise.all([
  db.selectByIds('cobros_cobradores','id_pago',payments.map(p=>p.id_pago)),
  db.selectByIds('importaciones_anotaciones','id_pago',payments.map(p=>p.id_pago)),
  db.selectByIds('importaciones_anotaciones','id_movimiento',movements.map(m=>m.id_movimiento)),
  db.selectByIds('clientes','id_cliente',payments.map(p=>p.id_cliente),{select:'id_cliente,nombre'})
 ]);
 return aggregate({payments,movements,staff,reports,attributions,clients,links:[...new Map([...paymentLinks,...expenseLinks].map(l=>[l.id,l])).values()]});
}
async function daily(){const fecha=today();return{fecha,...await period(fecha,fecha)}}
async function report(data){
 const date=String(data.fecha||today());if(!validDate(date)||date>today())throw Error('Seleccione una fecha válida, no futura.');
 let start=date,end=date;if(data.modo==='semanal'){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);end=d.toISOString().slice(0,10);if(end>today())end=today()}
 const result=await period(start,end),row=result.cobradores.find(r=>r.idCobrador===String(data.idCobrador||''));if(!row)throw Error('Seleccione un cobrador disponible para este periodo.');
 return{tipo:'cobrador',periodo:{inicio:start,fin:end},...row,generado:new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date())};
}
module.exports={daily,report,aggregate};
