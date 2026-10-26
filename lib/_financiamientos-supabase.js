const supabase=require('./_supabase');

async function overview(){
  const[rows,movements]=await Promise.all([
    supabase.selectAll('financiamientos',{select:'id_financiamiento,tipo,nombre,fecha_inicio,monto_referencia,monto_caja_inicial,total_acordado,total_pagado,saldo_pendiente,cuota_sugerida,estado,registro_historico,notas,creado_en,actualizado_en',order:'fecha_inicio.desc,creado_en.desc'}),
    supabase.selectAll('movimientos_financiamiento',{select:'id_movimiento,id_financiamiento,fecha,tipo_movimiento,monto,saldo_despues,afecta_caja,descripcion,creado_en',order:'fecha.desc,creado_en.desc'})
  ]);
  const items=rows.map(publicFinancing);
  const publicMovements=movements.map(publicMovement);
  const active=items.filter(item=>item.estado==='ACTIVO'&&item.saldoPendiente>0);
  return{
    resumen:{
      capitalAportado:money(items.filter(item=>item.tipo==='APORTE_CAPITAL').reduce((sum,item)=>sum+item.montoReferencia,0)),
      recibidoPrestamos:money(items.filter(item=>item.tipo==='PRESTAMO_RECIBIDO').reduce((sum,item)=>sum+item.montoReferencia,0)),
      deudaPendiente:money(active.reduce((sum,item)=>sum+item.saldoPendiente,0)),
      pagosRegistrados:money(publicMovements.filter(item=>item.tipoMovimiento==='PAGO').reduce((sum,item)=>sum+item.monto,0)),
      deudasActivas:active.length
    },
    activos:active,
    items,
    movimientos:publicMovements,
    generado:new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date())
  };
}

function publicFinancing(row){return{
  idFinanciamiento:text(row.id_financiamiento),tipo:text(row.tipo),nombre:text(row.nombre),fechaInicio:dateKey(row.fecha_inicio),
  montoReferencia:money(row.monto_referencia),montoCajaInicial:money(row.monto_caja_inicial),totalAcordado:money(row.total_acordado),
  totalPagado:money(row.total_pagado),saldoPendiente:money(row.saldo_pendiente),cuotaSugerida:money(row.cuota_sugerida),
  estado:normalize(row.estado),registroHistorico:Boolean(row.registro_historico),notas:text(row.notas)
}}
function publicMovement(row){return{idMovimiento:text(row.id_movimiento),idFinanciamiento:text(row.id_financiamiento),fecha:dateKey(row.fecha),tipoMovimiento:text(row.tipo_movimiento),monto:money(row.monto),saldoDespues:money(row.saldo_despues),afectaCaja:Boolean(row.afecta_caja),descripcion:text(row.descripcion)}}
function dateKey(value){const match=text(value).match(/^(\d{4}-\d{2}-\d{2})/);return match?match[1]:''}
function text(value){return String(value??'').trim()}
function money(value){return Math.round(((Number(value)||0)+Number.EPSILON)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={overview};
