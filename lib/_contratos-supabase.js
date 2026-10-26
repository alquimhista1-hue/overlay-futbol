const supabase=require('./_supabase');

async function listContracts(){
  const[settings,rows,links]=await Promise.all([
    supabase.selectAll('configuracion_contratos',{select:'clave,valor'}),
    supabase.selectAll('contratos',{select:'id_contrato,creado_en,actualizado_en,fecha_contrato,estado,tipo_operacion,id_cliente,nombre_cliente,dpi_cliente,telefono_cliente,direccion_cliente,municipio_cliente,lugar_cliente,monto_prestamo,monto_letras,plazo,unidad_plazo,interes_porcentaje,forma_pago,mora_porcentaje,gastos_administrativos,tipo_fiador,id_fiador,nombre_fiador,dpi_fiador,telefono_fiador,direccion_fiador,municipio_fiador,lugar_fiador,observaciones,version_plantilla',order:'actualizado_en.desc'}),
    supabase.selectAll('solicitudes_clientes',{select:'id,id_contrato,estado',id_contrato:'not.is.null'})
  ]);
  const map=Object.fromEntries(settings.map(item=>[text(item.clave),text(item.valor)]));
  return{configuracion:{ciudad:map.CIUDAD||'Escuintla',prestamistaNombre:map.PRESTAMISTA_NOMBRE||'',prestamistaDpi:map.PRESTAMISTA_DPI||'',prestamistaDomicilio:map.PRESTAMISTA_DOMICILIO||'',formaPago:map.FORMA_PAGO||'',interes:number(map.INTERES),mora:number(map.MORA),gastosAdministrativos:number(map.GASTOS_ADMINISTRATIVOS),clausulaMonto:map.CLAUSULA_MONTO||'',clausulaPlazo:map.CLAUSULA_PLAZO||'',clausulaInteres:map.CLAUSULA_INTERES||'',clausulaInteresCero:map.CLAUSULA_INTERES_CERO||'',clausulaFormaPago:map.CLAUSULA_FORMA_PAGO||'',clausulaMora:map.CLAUSULA_MORA||'',pagoAnticipado:map.CLAUSULA_PAGO_ANTICIPADO||map.PAGO_ANTICIPADO||'',clausulaGastos:map.CLAUSULA_GASTOS||'',clausulaGastosCero:map.CLAUSULA_GASTOS_CERO||'',clausulaFiador:map.CLAUSULA_FIADOR||'',jurisdiccion:map.CLAUSULA_JURISDICCION||map.JURISDICCION||''},contratos:rows.map(row=>{const linked=links.find(item=>item.id_contrato===row.id_contrato);return{...publicContract(row),idSolicitud:linked?.id||'',estado:linked?.estado==='CREDITO_REGISTRADO'||(row.id_cliente&&row.tipo_operacion!=='CLIENTE EXISTENTE')?'CREDITO_REGISTRADO':linked?.estado==='RECHAZADA'?'RECHAZADO':row.estado}})};
}
function publicContract(row){return{idContrato:text(row.id_contrato),creadoEn:timestamp(row.creado_en),actualizadoEn:text(row.actualizado_en),fechaContrato:dateKey(row.fecha_contrato),estado:text(row.estado),tipoOperacion:text(row.tipo_operacion),idCliente:text(row.id_cliente),nombreCliente:text(row.nombre_cliente),dpiCliente:text(row.dpi_cliente),telefonoCliente:text(row.telefono_cliente),direccionCliente:text(row.direccion_cliente),municipioCliente:text(row.municipio_cliente),lugarCliente:text(row.lugar_cliente),montoPrestamo:number(row.monto_prestamo),montoLetras:text(row.monto_letras),plazoDias:optionalNumber(row.plazo),interesPorcentaje:optionalNumber(row.interes_porcentaje),formaPago:text(row.forma_pago),moraPorcentaje:optionalNumber(row.mora_porcentaje),gastosAdministrativos:number(row.gastos_administrativos),tipoFiador:text(row.tipo_fiador),idFiador:text(row.id_fiador),nombreFiador:text(row.nombre_fiador),dpiFiador:text(row.dpi_fiador),telefonoFiador:text(row.telefono_fiador),direccionFiador:text(row.direccion_fiador),municipioFiador:text(row.municipio_fiador),lugarFiador:text(row.lugar_fiador),observaciones:text(row.observaciones),versionPlantilla:text(row.version_plantilla),unidadPlazo:text(row.unidad_plazo)||(row.plazo===null||row.plazo===''?'':'DIAS')}}
function optionalNumber(value){return value===null||value===''?'':number(value)}
function number(value){return Number(value)||0}
function timestamp(value){if(!value)return'';const date=new Date(value);return Number.isNaN(date.getTime())?text(value):date.toISOString()}
function dateKey(value){return value?text(value).slice(0,10):''}
function text(value){return String(value??'').trim()}

module.exports={listContracts};
