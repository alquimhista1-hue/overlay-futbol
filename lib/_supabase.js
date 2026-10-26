const PRIMARY_KEYS={cobros_cobradores:'id_registro',importaciones_anotaciones:'id',reportes_jornada_cobrador:'id',gastos_anotados:'id',historial_gastos_anotados:'id',cobros_anotados:'id',historial_cobros_anotados:'id',clientes:'id_cliente',creditos:'id_credito',pagos_clientes:'id_pago',personal:'id_empleado',prestamos_personal:'id_prestamo',movimientos_prestamos_personal:'id_movimiento',movimientos_caja:'id_movimiento',pagos_planilla:'id_pago',cierres_semanales:'id_cierre',contratos:'id_contrato',configuracion_contratos:'clave',solicitudes_clientes:'id',asignaciones_cobro:'id_asignacion',eventos_cliente:'id_evento',financiamientos:'id_financiamiento',movimientos_financiamiento:'id_movimiento',usuarios_aplicacion:'id',comprobantes_cobrador:'id',borradores_planilla:'fecha_pago'};

function config(){
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Falta configurar la conexion privada con Supabase.');
  return{url,key};
}

async function select(table,query={}){
  const{url,key}=config();
  const search=new URLSearchParams();
  Object.entries(query).forEach(([name,value])=>{
    if(value!==undefined&&value!==null&&value!=='')search.set(name,String(value));
  });
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?${search}`,{
      method:'GET',
      headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/json',Prefer:'count=exact'},
      signal:controller.signal
    });
    const text=await response.text();
    const data=safeJson(text);
    if(!response.ok)throw new Error(data?.message||data?.hint||'Supabase no pudo completar la lectura.');
    if(!Array.isArray(data))throw new Error('Supabase devolvio una respuesta no valida.');
    const range=response.headers?.get('content-range');
    const total=range&&range.split('/')[1]!=='*'?Number(range.split('/')[1]):NaN;
    if(Number.isFinite(total))Object.defineProperty(data,'totalCount',{value:total});
    return data;
  }catch(error){
    if(error&&error.name==='AbortError')throw new Error('La lectura de Supabase tardo demasiado.');
    throw error;
  }finally{clearTimeout(timeout)}
}

async function selectAll(table,query={},pageSize=1000){
  const rows=[];
  const pk=PRIMARY_KEYS[table];
  if(!pk)throw new Error('Falta definir el orden estable de '+table+'.');
  const order=String(query.order||'');
  const stableOrder=order.split(',').some(part=>part.split('.')[0]===pk)?order:[order,pk+'.asc'].filter(Boolean).join(',');
  const size=Math.max(1,Math.min(1000,Math.trunc(Number(pageSize)||1000)));
  const seen=new Set();let expectedTotal;
  const projection=String(query.select||'*');
  const selectFields=projection==='*'||projection.split(',').includes(pk)?projection:projection+','+pk;
  for(let offset=0;;){
    const page=await select(table,{...query,select:selectFields,order:stableOrder,limit:size,offset});
    if(Number.isFinite(page.totalCount)){
      if(expectedTotal!==undefined&&expectedTotal!==page.totalCount)throw new Error('La información cambió mientras se consultaba. Actualice para intentarlo nuevamente.');
      expectedTotal=page.totalCount;
    }
    for(const row of page){if(row[pk]!==undefined){if(seen.has(row[pk]))throw new Error('La información cambió mientras se consultaba. Actualice para intentarlo nuevamente.');seen.add(row[pk])}}
    if(page.length===0&&expectedTotal!==undefined&&offset<expectedTotal)throw new Error('Supabase devolvió una lectura incompleta. Intente actualizar nuevamente.');
    rows.push(...page);offset+=page.length;
    if(page.length===0||(Number.isFinite(page.totalCount)&&offset>=page.totalCount))return rows;
    // Advance by actual rows even when the server cap is smaller than the requested page.
  }
}

async function rpc(name,parameters={}){
  const{url,key}=config();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(`${url}/rest/v1/rpc/${encodeURIComponent(name)}`,{
      method:'POST',
      headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(parameters),
      signal:controller.signal
    });
    const text=await response.text();
    const data=safeJson(text);
    if(!response.ok){const error=new Error(data?.message||data?.hint||'Supabase no pudo completar la operacion.');error.rollbackConfirmado=Boolean(data?.code&&/^(P0001|22|23)/.test(data.code));throw error;}
    return data;
  }catch(error){
    if(error&&error.name==='AbortError')throw new Error('La operacion en Supabase tardo demasiado.');
    throw error;
  }finally{clearTimeout(timeout)}
}

function safeJson(value){try{return JSON.parse(value)}catch{return null}}

async function selectByIds(table,columns,ids,query={}){
  const fields=Array.isArray(columns)?columns:[columns];
  const unique=[...new Set([...ids].map(String))],rows=new Map();
  for(let index=0;index<unique.length;index+=100){
    const filter='in.('+unique.slice(index,index+100).map(value=>JSON.stringify(value)).join(',')+')';
    const condition=fields.length===1?{[fields[0]]:filter}:{or:'('+fields.map(field=>field+'.'+filter).join(',')+')'};
    for(const row of await module.exports.selectAll(table,{...query,...condition}))rows.set(row[PRIMARY_KEYS[table]],row);
  }
  return [...rows.values()];
}
module.exports={select,selectAll,selectByIds,rpc};
