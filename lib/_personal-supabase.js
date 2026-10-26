const supabase=require('./_supabase');

async function listLoans(search=''){
  const rows=await supabase.selectAll('prestamos_personal',{
    select:'id_prestamo,id_empleado,nombre_completo,puesto,estado,saldo_pendiente',
    order:'nombre_completo.asc,id_prestamo.asc'
  });
  const term=normalize(search);
  return rows.map(row=>({
    idPrestamo:text(row.id_prestamo),
    idEmpleado:text(row.id_empleado),
    nombre:text(row.nombre_completo),
    puesto:text(row.puesto),
    estado:text(row.estado),
    saldoPendiente:money(row.saldo_pendiente)
  })).filter(item=>!term||normalize([item.idEmpleado,item.nombre,item.puesto].join(' ')).includes(term));
}

async function loanHistory(employeeId='',loanId=''){
  const loans=await supabase.selectAll('prestamos_personal',{
    select:'id_prestamo,id_empleado,nombre_completo,puesto,fecha_inicial,prestamo_inicial,dinero_adicional,total_descontado,saldo_pendiente,descuento_sugerido,estado,notas',
    ...(loanId?{id_prestamo:'eq.'+text(loanId)}:employeeId?{id_empleado:'eq.'+text(employeeId)}:{}),order:'fecha_inicial.desc,id_prestamo.asc'
  });
  const loan=loans.find(row=>(loanId&&text(row.id_prestamo)===text(loanId))||(employeeId&&text(row.id_empleado)===text(employeeId)));
  if(!loan)throw new Error('No se encontro el prestamo del empleado en Supabase.');
  const movements=await supabase.selectAll('movimientos_prestamos_personal',{
    select:'id_movimiento,fecha,tipo_movimiento,descripcion,cantidad_aumenta,cantidad_disminuye,saldo_despues_movimiento,fila_google_sheets',
    id_prestamo:`eq.${text(loan.id_prestamo)}`,
    order:'fecha.asc,fila_google_sheets.asc,id_movimiento.asc'
  });
  return{
    generado:new Intl.DateTimeFormat('es-GT',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date()),
    prestamo:{
      idPrestamo:text(loan.id_prestamo),
      idEmpleado:text(loan.id_empleado),
      nombre:text(loan.nombre_completo),
      puesto:text(loan.puesto),
      fechaInicial:text(loan.fecha_inicial),
      prestamoInicial:money(loan.prestamo_inicial),
      dineroAdicional:money(loan.dinero_adicional),
      totalDescontado:money(loan.total_descontado),
      saldoPendiente:money(loan.saldo_pendiente),
      descuentoSugerido:money(loan.descuento_sugerido),
      estado:text(loan.estado),
      notas:text(loan.notas)
    },
    movimientos:movements.map(row=>{
      const aumenta=money(row.cantidad_aumenta);
      const disminuye=money(row.cantidad_disminuye);
      return{
        fecha:text(row.fecha),
        tipo:text(row.tipo_movimiento),
        descripcion:text(row.descripcion),
        aumenta,
        disminuye,
        cantidadFirmada:money(aumenta-disminuye),
        saldo:money(row.saldo_despues_movimiento)
      };
    })
  };
}

function text(value){return String(value??'').trim()}
function money(value){return Math.round((Number(value)||0)*100)/100}
function normalize(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

module.exports={listLoans,loanHistory};
