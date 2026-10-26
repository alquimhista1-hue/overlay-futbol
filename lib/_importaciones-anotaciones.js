const db=require('./_supabase');
function scope(data){
 const tipo=String(data.tipo||''),fecha=String(data.fecha||''),idCobrador=String(data.idCobrador||'');
 if(!['COBRO','GASTO'].includes(tipo)||!idCobrador||!/^\d{4}-\d{2}-\d{2}$/.test(fecha)||Number.isNaN(Date.parse(fecha+'T12:00:00Z'))||new Date(fecha+'T12:00:00Z').toISOString().slice(0,10)!==fecha)throw Error('Seleccione un cobrador y una fecha válida.');
 return{tipo,fecha,idCobrador};
}
const cents=n=>Math.round(Number(n)*100),norm=s=>String(s||'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function status(data){const s=scope(data);if(s.fecha!==today())return{permitida:false,motivo:'Solo se pueden importar anotaciones de hoy.'};const rows=await db.select('cierres_importacion_cobrador',{select:'fecha',id_empleado:'eq.'+s.idCobrador,fecha:'eq.'+s.fecha,tipo:'eq.'+s.tipo,limit:1});return{permitida:!rows.length,motivo:rows.length?'Importación guardada hoy. Puede registrar manualmente.':''}}
async function requireOpen(data){const state=await status(data);if(!state.permitida)throw Error(state.motivo)}
async function preview(data){
 await requireOpen(data);
 const s=scope(data),cobro=s.tipo==='COBRO';
 const notes=await db.selectAll(cobro?'cobros_anotados':'gastos_anotados',{select:'*',id_empleado:'eq.'+s.idCobrador,jornada:'eq.'+s.fecha,estado:'eq.ANOTADO',order:'creado_en.asc'});
 const links=await db.selectByIds('importaciones_anotaciones',cobro?'id_cobro':'id_gasto',notes.map(n=>n.id),{select:'id,id_cobro,id_gasto'});
 const used=new Set(links.map(r=>cobro?r.id_cobro:r.id_gasto));return{...s,rows:notes.filter(r=>!used.has(r.id)),yaImportadas:notes.filter(r=>used.has(r.id)).length};
}
async function review(data){
 await requireOpen(data);
 const s=scope(data),items=data.items;if(!Array.isArray(items)||items.length>2000)throw Error('Lista de importación no válida.');
 const cobro=s.tipo==='COBRO',records=await db.selectAll(cobro?'pagos_clientes':'movimientos_caja',cobro?{select:'id_pago,id_credito,monto_abonado',fecha_pago:'eq.'+s.fecha}:{select:'id_movimiento,descripcion,salida',fecha:'eq.'+s.fecha,tipo_movimiento:'eq.GASTO'});
 return{coincidencias:items.map((item,index)=>({index,ids:item.origenes?.length?records.filter(r=>cobro?r.id_credito===item.idCredito&&cents(r.monto_abonado)===cents(item.monto):norm(r.descripcion)===norm(item.descripcion)&&cents(r.salida)===cents(item.monto)).map(r=>cobro?r.id_pago:r.id_movimiento):[]})).filter(r=>r.ids.length)};
}
module.exports={preview,review,status};
