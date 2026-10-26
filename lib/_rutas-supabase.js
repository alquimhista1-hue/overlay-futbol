const supabase=require('./_supabase');
const collectionsSupabase=require('./_cobros-supabase');

async function collectorRoute(collectorName='',dateReceived='',collectorId=''){
  const[staff,assignments,collection]=await Promise.all([
    supabase.selectAll('personal',{select:'id_empleado,nombre_completo,puesto,estado'}),
    supabase.selectAll('asignaciones_cobro',{select:'id_cliente,id_cobrador,estado'}),
    collectionsSupabase.collectionList(dateReceived)
  ]);
  const collectors=staff.filter(item=>text(item.id_empleado)&&text(item.nombre_completo)&&normalize(item.puesto).includes('COBRADOR')&&['ACTIVO','ACTIVA'].includes(normalize(item.estado))).map(item=>({id:text(item.id_empleado),nombre:text(item.nombre_completo)})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'}));
  if(!collectors.length)throw new Error('No hay cobradores activos en Supabase.');
  const requested=normalize(collectorName);const selected=collectorId?collectors.find(item=>item.id===collectorId):requested?collectors.find(item=>normalize(item.nombre)===requested):collectors[0];if(!selected)throw new Error('El cobrador seleccionado no existe o no esta activo.');
  const assigned=new Set(assignments.filter(item=>text(item.id_cobrador)===selected.id&&normalize(item.estado)==='ACTIVO').map(item=>text(item.id_cliente)));
  const clients=collection.clientes.filter(item=>assigned.has(text(item.idCliente))).map(item=>({idCliente:text(item.idCliente),idCredito:text(item.idCredito),nombre:text(item.nombre),telefono:text(item.telefono),modalidad:text(item.plan),diaPago:text(item.dia),cuota:money(item.cuota),cuotas:Number(item.cuotas)||0,saldo:money(item.saldo),atrasos:Number(item.diasAtrasados)||0,debePagarHoy:money(item.cantidadAtrasada),municipio:text(item.municipio),lugar:text(item.lugar),direccion:text(item.direccion),seguimientoEspecial:Boolean(item.seguimientoEspecial),motivoSeguimiento:text(item.motivoSeguimiento),abonadoSemanaAnterior:money(item.abonadoSemanaAnterior),abonadoSemanaActual:money(item.abonadoSemanaActual)}));
  sortClients(clients);const special=clients.filter(item=>item.seguimientoEspecial).length;
  return{fecha:collection.fecha,fechaTexto:collection.fechaTexto,cobrador:selected,cobradores:collectors,clientesEnLista:clients.length,hojas:Math.ceil((clients.length+(special>0?1:0))/20),totalARecaudar:money(clients.reduce((sum,item)=>sum+item.debePagarHoy,0)),cartera:money(clients.reduce((sum,item)=>sum+item.saldo,0)),clientes:clients};
}
function sortClients(clients){const days={LUNES:1,MARTES:2,MIERCOLES:3,JUEVES:4,VIERNES:5,SABADO:6,DOMINGO:7};const order=value=>{const mode=normalize(value);return mode.includes('SEMANAL')?1:mode.includes('QUINCENAL')?2:mode.includes('DIARIO')?3:9};clients.sort((a,b)=>{if(a.seguimientoEspecial!==b.seguimientoEspecial)return a.seguimientoEspecial?1:-1;const oa=order(a.modalidad);const ob=order(b.modalidad);if(oa!==ob)return oa-ob;if(oa===1||oa===2){const da=days[normalize(a.diaPago)]||99;const db=days[normalize(b.diaPago)]||99;if(da!==db)return da-db}return normalize(a.municipio).localeCompare(normalize(b.municipio),'es',{sensitivity:'base'})||normalize(a.lugar).localeCompare(normalize(b.lugar),'es',{sensitivity:'base'})||a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})});let normal=0;let special=0;clients.forEach(item=>{item.numero=item.seguimientoEspecial?`M${++special}`:++normal})}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
module.exports={collectorRoute};
