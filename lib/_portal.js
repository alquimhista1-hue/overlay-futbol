const db=require('./_supabase');
const access=require('./_acceso');
const clients=require('./_clientes-supabase');
const routes=require('./_rutas-supabase');
const FIELD_NAMES=['tipoSolicitud','clienteExistente','nombre','dpi','telefono','sinTelefono','direccion','municipio','lugar','trabajoNegocio','montoPrestamo','cuotaSolicitada','totalSolicitado','plazoDias','unidadPlazo','interesPorcentaje','moraPorcentaje','gastosAdministrativos','formaPago','tipoFiador','nombreFiador','dpiFiador','telefonoFiador','direccionFiador','nota'];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function id(value){if(!UUID.test(String(value)))throw new Error('Identificador no válido.');return String(value)}
function fields(raw,complete=false,requireWork=false){
  const data=Object.fromEntries(FIELD_NAMES.map(key=>[key,String(raw?.[key]??'').trim().slice(0,2000)]));
  if(!['','NUEVO','RENOVACION'].includes(data.tipoSolicitud))throw new Error('Tipo de solicitud no válido.');
  if(data.tipoSolicitud==='RENOVACION'&&!data.clienteExistente)throw new Error('Seleccione el cliente de la renovación.');
  if(!data.nombre)throw new Error('Escriba el nombre del cliente.');
  if(data.sinTelefono==='SI')data.telefono='';
  if(complete&&data.tipoSolicitud==='RENOVACION'&&data.sinTelefono!=='SI'&&!/^[+\d\s()-]{8,25}$/.test(data.telefono))throw new Error('Escriba el teléfono o marque Sin teléfono.');
  if(complete&&data.tipoSolicitud!=='RENOVACION'&&['dpi','telefono','direccion','municipio','lugar'].some(key=>!data[key]))throw new Error('Complete los datos personales antes de enviar.');
  if(complete&&requireWork&&data.tipoSolicitud!=='RENOVACION'){
    const count=data.trabajoNegocio.split(/\s+/u).filter(Boolean).length;
    if(count<15||count>30)throw new Error('Describa el trabajo o negocio en entre 15 y 30 palabras.');
  }
  if(complete&&data.tipoSolicitud==='RENOVACION'&&!data.cuotaSolicitada)throw new Error('Complete la cuota y el plazo de la renovación.');
  if(data.cuotaSolicitada){
    const cuota=Number(data.cuotaSolicitada),count=Number(data.plazoDias),amount=Number(data.montoPrestamo);
    if(!Number.isFinite(cuota)||cuota<=0||!Number.isInteger(count)||count<=0||!Number.isFinite(amount)||amount<=0||!['DIAS','SEMANAS'].includes(data.unidadPlazo)||!Number.isFinite(cuota*count))throw new Error('Revise el monto, la cuota y el plazo de la solicitud.');
    data.totalSolicitado=(Math.round(cuota*100)*count/100).toFixed(2);
  }
  return data;
}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
async function execute(session,action,data={}){
  if(!['ADMIN','COBRADOR'].includes(session?.rol))throw access.forbidden('Esta cuenta es de solo consulta.');
  if(session.rol==='COBRADOR'&&data.cuentaEsperada&&(data.cuentaEsperada!==session.user||data.idEmpleadoEsperado!==session.id_empleado||(data.cuentaIdEsperada&&data.cuentaIdEsperada!==session.uid)))throw access.forbidden('La cuenta cambió. Inicie sesión con la cuenta de estas anotaciones.');
  if(action==='guardarCobros')throw access.forbidden('Los cobradores no pueden registrar pagos oficiales. Use Cobros anotados.');
  if(action==='rutaAnotaciones')return execute(session,'rutaCobro');
  if(['anotacionesCobrador','anotacionesAdministrador','guardarAnotacion','anularAnotacion','guardarGastoAnotado','anularGastoAnotado','finalizarRuta','firmarJornada','reporteAnotaciones'].includes(action))return require('./_cobros-anotados').execute(session,action,data);
  if(action==='inicioCobrador'){
    const result=await require('./_inicio-cobrador').inicio(session);
    if(session.permisos.clientes)result.asignados=(await execute(session,'clientes')).length;
    if(session.permisos.informacion){const info=await execute(session,'miInformacion');result.totalPlanilla=Number(info.staff?.sueldo_base||0)+info.paperwork.reduce((s,p)=>s+Number(p.papeleria_trabajador||0),0);}
    return result;
  }
  if(action==='informacionDescargada'){
    if(session.rol!=='COBRADOR')throw access.forbidden();
    const result={historiales:{},recibos:[]},p=session.permisos;
    if(p.clientes||p.telefonos||p.solicitudes){
      const ids=await access.assignedIds(session);
      const index=ids.size?await clients.searchClients('',ids):[];
      if(p.clientes)result.clientes=index.filter(row=>Number(row.saldo)>0);
      if(p.telefonos)result.telefonos=index.filter(row=>Number(row.saldo)>0).map(row=>({idCliente:row.idCliente,nombre:row.nombre,telefono:row.telefono}));
      if(p.solicitudes)result.clientesRenovacion=await require('./_renewal-rule').candidates(index,ids);
      if(p.clientes){
        result.historiales=await clients.collectorHistories(ids);
        for(const history of Object.values(result.historiales)){const credits=new Set(history.creditos.map(row=>row.idCredito));history.eventos=history.eventos.map(row=>{const copy={...row};if(copy.idClienteRelacionado&&!ids.has(copy.idClienteRelacionado)){delete copy.idClienteRelacionado;copy.descripcion='Movimiento asociado al crédito de este cliente.'}if(copy.idCredito&&!credits.has(copy.idCredito))delete copy.idCredito;return copy})}
      }
    }
    result.inicioCobrador=await execute(session,'inicioCobrador');
    if(p.informacion)result.miInformacion=await execute(session,'miInformacion');
    if(p.solicitudes)result.solicitudes=await execute(session,'solicitudes');
    if(p.cobrar){result.anotacionesCobrador=await execute(session,'anotacionesCobrador');result.rutaCobro=await execute(session,'rutaCobro');result.recibos=await db.selectAll('comprobantes_cobrador',{select:'*',creado_por:'eq.'+session.uid,order:'creado_en.desc'});result.comprobantes=result.recibos.map(({id,nombre_cobrador,fecha,total,creado_en})=>({id,nombre_cobrador,fecha,total,creado_en}))}
    return result;
  }
  if(action==='clientesRenovacion'){access.permit(session,'solicitudes');if(session.rol!=='COBRADOR')throw access.forbidden();const ids=await access.assignedIds(session);return require('./_renewal-rule').candidates(ids.size?await clients.searchClients('',ids):[],ids)}
  if(action==='eliminarSolicitud'||action==='rechazarSolicitud'){access.admin(session);return db.rpc('administrar_solicitud_cliente',{datos:{id:id(data.id),actor:session.user,version:Number(data.version),accion:action==='eliminarSolicitud'?'ELIMINAR':'RECHAZAR'}})}
  if(action==='cuentas'){access.admin(session);const[users,staff]=await Promise.all([db.selectAll('usuarios_aplicacion',{select:'*',order:'nombre.asc'}),db.selectAll('personal',{select:'id_empleado,nombre_completo,estado',order:'nombre_completo.asc'})]);return{users,staff}}
  if(action==='guardarCuenta')return access.saveUser(session,data);
  if(action==='solicitudes'){
    if(session.rol!=='ADMIN')access.permit(session,'solicitudes');
    return db.selectAll('solicitudes_clientes',{select:'*',...(session.rol==='ADMIN'?{estado:'neq.BORRADOR'}:{creado_por:'eq.'+session.uid}),order:'creado_en.desc'});
  }
  if(action==='guardarSolicitud'){
    access.permit(session,'solicitudes');if(session.rol!=='COBRADOR')throw access.forbidden();
    const campos=fields(data.campos,!!data.enviar,true);
    if(campos.tipoSolicitud==='RENOVACION'){
      const assigned=await access.assignedIds(session);if(!assigned.has(campos.clienteExistente))throw access.forbidden('Seleccione un cliente asignado a usted.');
      const existing=await db.select('clientes',{select:'nombre,telefono',id_cliente:'eq.'+campos.clienteExistente,limit:1});if(!existing[0])throw new Error('Cliente no disponible.');campos.nombre=existing[0].nombre;
      const renewal=await require('./_renewal-rule').forClient(campos.clienteExistente);if(!renewal.permitida)throw new Error(renewal.motivo);
      for(const key of FIELD_NAMES)if(!['tipoSolicitud','clienteExistente','nombre','telefono','sinTelefono','montoPrestamo','cuotaSolicitada','totalSolicitado','plazoDias','unidadPlazo'].includes(key))campos[key]='';
    }
    return db.rpc('guardar_solicitud_cobrador',{datos:{id:id(data.id),actor:session.uid,version:Number(data.version)||0,estado:data.enviar?'PENDIENTE':'BORRADOR',campos}});
  }
  if(action==='revisarSolicitud'){
    access.admin(session);
    return db.rpc('revisar_solicitud_cliente',{datos:{id:id(data.id),actor:session.user,version:Number(data.version),estado:data.estado,campos:fields(data.campos,true)}});
  }
  if(action==='clientes'||action==='telefonos'||action==='rutaCobro'){
    access.permit(session,action==='telefonos'?'telefonos':action==='rutaCobro'?'cobrar':'clientes');
    if(session.rol!=='COBRADOR')throw access.forbidden();
    const ids=await access.assignedIds(session);
    if(!ids.size)return[];
    if(action==='rutaCobro'){
      // Misma fuente, orden y numeración que las hojas de este empleado.
      const[collection,credits]=await Promise.all([routes.collectorRoute('',today(),session.id_empleado),db.selectAll('creditos',{select:'id_credito,id_cliente,cuota,saldo_actual',estado_credito:'eq.ACTIVO',saldo_actual:'gt.0'})]);
      const live=new Map(credits.filter(credit=>ids.has(credit.id_cliente)&&Number(credit.saldo_actual)>0).map(credit=>[credit.id_credito,credit]));
      return collection.clientes.filter(row=>ids.has(row.idCliente)&&live.has(row.idCredito)).map(row=>({...row,saldo:Number(live.get(row.idCredito).saldo_actual),cuota:Number(live.get(row.idCredito).cuota)}));
    }
    // Filtrar en el servidor; nunca enviar el índice general al cobrador.
    const result=(await clients.searchClients(String(data.busqueda||'').slice(0,100),ids)).filter(row=>Number(row.saldo)>0);
    if(action==='telefonos')return result.map(row=>({idCliente:row.idCliente,nombre:row.nombre,telefono:row.telefono}));
    return result;
  }
  if(action==='historialCliente'){
    await access.requireClient(session,String(data.idCliente||''));
    const history=await clients.clientHistory(String(data.idCliente));
    if(session.rol==='COBRADOR'){
      const assigned=await access.assignedIds(session),credits=new Set(history.creditos.map(row=>row.idCredito));
      history.eventos=history.eventos.map(row=>{const copy={...row};if(copy.idClienteRelacionado&&!assigned.has(copy.idClienteRelacionado)){delete copy.idClienteRelacionado;copy.descripcion='Movimiento asociado al crédito de este cliente.'}if(copy.idCredito&&!credits.has(copy.idCredito))delete copy.idCredito;return copy});
    }
    return history;
  }
  if(action==='miInformacion'){
    access.permit(session,'informacion');if(session.rol!=='COBRADOR')throw access.forbidden();
    const employee=session.id_empleado;
    const date=today(),d=new Date(date+'T12:00:00Z'),distance=(d.getUTCDay()+6)%7;
    d.setUTCDate(d.getUTCDate()-distance);const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);const end=d.toISOString().slice(0,10);
    const[staff,payroll,loans,movements,paperwork]=await Promise.all([
      db.select('personal',{select:'nombre_completo,puesto,sueldo_base',id_empleado:'eq.'+employee,limit:1}),
      db.selectAll('pagos_planilla',{select:'fecha,sueldo_base,papeleria,bono,otro_ingreso,descuento_prestamo,otros_descuentos,total_recibir',id_empleado:'eq.'+employee,order:'fecha.desc'}),
      db.selectAll('prestamos_personal',{select:'id_prestamo,fecha_inicial,prestamo_inicial,dinero_adicional,total_descontado,saldo_pendiente,estado',id_empleado:'eq.'+employee,order:'fecha_inicial.desc'}),
      db.selectAll('movimientos_prestamos_personal',{select:'fecha,tipo_movimiento,descripcion,cantidad_aumenta,cantidad_disminuye,saldo_despues_movimiento',id_empleado:'eq.'+employee,order:'fecha.desc'}),
      db.selectAll('creditos',{select:'fecha_inicio,monto_credito,papeleria_trabajador,clientes!creditos_id_cliente_fkey(nombre)',id_empleado_papeleria:'eq.'+employee,fecha_inicio:'gte.'+start,and:'(fecha_inicio.lte.'+end+')'})
    ]);
    return{staff:staff[0],payroll,loans,movements,paperwork:paperwork.map(row=>({...row,nombre_cliente:row.clientes?.nombre||'Cliente no disponible'})),periodo:{inicio:start,fin:end}};
  }
  if(action==='comprobantes'){
    access.permit(session,'cobrar');
    return db.selectAll('comprobantes_cobrador',{select:'id,nombre_cobrador,fecha,total,creado_en',...(session.rol==='ADMIN'?{}:{creado_por:'eq.'+session.uid}),order:'creado_en.desc'});
  }
  if(action==='comprobante'){
    access.permit(session,'cobrar');
    const rows=await db.select('comprobantes_cobrador',{select:'*',id:'eq.'+id(data.id),...(session.rol==='ADMIN'?{}:{creado_por:'eq.'+session.uid}),limit:1});
    if(!rows[0])throw access.forbidden('Comprobante no disponible.');return rows[0];
  }
  throw new Error('Acción no disponible.');
}
module.exports={execute,fields};
