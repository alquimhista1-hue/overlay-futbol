const db=require('./_supabase'),routes=require('./_rutas-supabase');
const minimal=rows=>rows.map(r=>({numero:r.numero,idCliente:r.idCliente,idCredito:r.idCredito,nombre:r.nombre}));
async function rememberSheet(route){
 await db.rpc('guardar_hoja_ruta',{datos:{idEmpleado:route.cobrador.id,fecha:route.fecha,ruta:minimal(route.clientes)}});return route;
}
async function reportRoute(session,jornada){
 const saved=(await db.select('hojas_ruta_diaria',{select:'ruta,actualizado_en',id_empleado:'eq.'+session.id_empleado,fecha:'eq.'+jornada,limit:1}))[0];
 const current=await routes.collectorRoute('',jornada,session.id_empleado),live=minimal(current.clientes);
 if(!saved)return{ruta:live,hojaPreparada:false,hojaVersion:null};
 const result=[...saved.ruta],known=new Set(result.map(r=>r.idCredito));let extra=0;
 for(const row of live)if(!known.has(row.idCredito)){result.push({...row,numero:'N'+ ++extra});known.add(row.idCredito)}return{ruta:result,hojaPreparada:true,hojaVersion:saved.actualizado_en};
}
module.exports={rememberSheet,reportRoute};
