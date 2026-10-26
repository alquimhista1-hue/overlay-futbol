const db=require('./_supabase');
const auth=require('./_auth');
const {randomUUID}=require('node:crypto');
const DEFAULT_PERMISSIONS={clientes:true,informacion:true,telefonos:true,cobrar:false,solicitudes:false};
function forbidden(message='No tiene permiso para esta acción.'){const error=new Error(message);error.status=403;return error}
function config(){const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Falta configurar Supabase.');return{url,key}}
async function request(path,{method='GET',body}={}){
  const{url,key}=config();
  const response=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const result=await response.json().catch(()=>null);
  if(!response.ok){const error=new Error(result?.msg||result?.message||'No se pudo completar la operación de acceso.');error.status=response.status;throw error}
  return result;
}
async function login(usuario,password){
  const name=String(usuario||'').trim().toLowerCase();
  const profiles=await db.select('usuarios_aplicacion',{select:'*',...(name.includes('@')?{email:'eq.'+name}:{usuario:'eq.'+name}),limit:1});
  const profile=profiles[0];if(!profile||!profile.activo)return null;
  let result;
  try{result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:profile.email,password}})}catch(error){if([400,401,422].includes(error.status))return null;throw error}
  if(result?.user?.id!==profile.id)return null;
  if(profile.rol==='COBRADOR')await activeEmployee(profile);
  return profile;
}
async function activeEmployee(profile){
  const rows=await db.select('personal',{select:'id_empleado,nombre_completo,estado',id_empleado:'eq.'+profile.id_empleado,limit:1});
  if(!rows[0]||String(rows[0].estado).toUpperCase()!=='ACTIVO')throw forbidden('El empleado está inactivo o archivado.');
  return rows[0];
}
async function resolve(req){
  const session=auth.verify(req);if(!session)return null;
  const persistent=session.sid?await require('./_sesiones').check(session):null;if(session.sid&&!persistent)return null;
  if(!session.uid){if(process.env.ALLOW_LEGACY_ADMIN==='false')return null;return{user:session.user,rol:'ADMIN',legacy:true,permisos:{},nombre:session.user,...(persistent?{_persistent:persistent}:{})}}
  const rows=await db.select('usuarios_aplicacion',{select:'*',id:'eq.'+session.uid,limit:1});
  const p=rows[0];if(!p||!p.activo||p.version_sesion!==session.version)return null;
  if(p.rol==='COBRADOR')await activeEmployee(p);
  return{...p,user:p.usuario,uid:p.id,permisos:{...DEFAULT_PERMISSIONS,...p.permisos},...(persistent?{_persistent:persistent}:{})};
}
function admin(session){if(session?.rol!=='ADMIN')throw forbidden()}
function permit(session,name){if(session?.rol==='ADMIN')return;if(session?.rol!=='COBRADOR'||!session.permisos?.[name])throw forbidden()}
function publicSession(session){return{usuario:session.user,nombre:session.nombre,rol:session.rol,idCuenta:session.uid||null,idEmpleado:session.id_empleado||null,permisos:session.permisos,legacy:!!session.legacy}}
async function assignedIds(session){const rows=await db.selectAll('asignaciones_cobro',{select:'id_cliente',id_cobrador:'eq.'+session.id_empleado,estado:'eq.ACTIVO'});return new Set(rows.map(row=>row.id_cliente))}
async function requireClient(session,id){permit(session,'clientes');if(session.rol==='ADMIN')return;if(!(await assignedIds(session)).has(id))throw forbidden('Este cliente no está asignado a usted.')}
function sameOrigin(req){const origin=req.headers.origin;if(origin&&new URL(origin).host!==String(req.headers.host||''))throw forbidden('Origen no permitido.')}
async function saveUser(session,data){
  admin(session);
  const username=String(data.usuario||'').trim().toLowerCase(),name=String(data.nombre||'').trim();
  if(!/^[a-z0-9._-]{3,40}$/.test(username)||!name)throw new Error('Complete nombre y usuario (3 a 40 letras, números, punto o guion).');
  if(!['ADMIN','COBRADOR','AUDITOR'].includes(data.rol))throw new Error('Tipo de cuenta no válido.');
  const role=data.rol,employee=role==='COBRADOR'?String(data.idEmpleado||''):null;
  if(role==='COBRADOR'&&data.activo!==false)await activeEmployee({id_empleado:employee});
  const password=String(data.password||'');if((!data.id||password)&&password.length<10)throw new Error('Use una contraseña de al menos 10 caracteres.');
  const existing=data.id?(await db.select('usuarios_aplicacion',{select:'*',id:'eq.'+data.id,limit:1}))[0]:null;
  if(data.id&&!existing)throw new Error('Cuenta no encontrada.');
  // Identidad técnica no entregable; se conserva al cambiar el usuario.
  // Nunca usar un correo enviado por el navegador ni modificar cuentas existentes.
  const email=existing?.email||('cuenta-'+randomUUID()+'@usuarios.invalid');
  if(existing?.id===session.uid&&(role!=='ADMIN'||data.activo===false))throw new Error('No puede quitar su propio acceso de administrador.');
  if(existing?.rol==='ADMIN'&&(role!=='ADMIN'||data.activo===false)){
    const admins=await db.select('usuarios_aplicacion',{select:'id',rol:'eq.ADMIN',activo:'eq.true',limit:2});
    if(admins.length<=1)throw new Error('Debe conservar al menos un administrador activo.');
  }
  for(const[field,val]of [['usuario',username],['email',email],...(employee?[['id_empleado',employee]]:[])]){
    const duplicates=await db.select('usuarios_aplicacion',{select:'id',[field]:'eq.'+val,limit:1});
    if(duplicates.some(row=>row.id!==data.id))throw new Error('El usuario o empleado ya tiene una cuenta.');
  }
  const permissions=Object.fromEntries(Object.keys(DEFAULT_PERMISSIONS).map(key=>[key,role==='COBRADOR'&&Boolean(data.permisos?.[key])]));
  let id=existing?.id;
  if(id){if(password)await request('/auth/v1/admin/users/'+encodeURIComponent(id),{method:'PUT',body:{password}})}
  else{const created=await request('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}});id=created.id||created.user?.id;if(!id)throw new Error('Supabase no devolvió la cuenta creada.')}
  const profile={id,usuario:username,email,nombre:name,rol:role,id_empleado:employee,activo:data.activo!==false,permisos:permissions,version_sesion:(existing?.version_sesion||0)+1,actualizado_en:new Date().toISOString()};
  try{await db.rpc('guardar_usuario_aplicacion',{datos:{actor:session.user,version:existing?.version_sesion||0,perfil:profile}})}
  catch(error){if(!existing)await request('/auth/v1/admin/users/'+encodeURIComponent(id),{method:'DELETE'}).catch(()=>{});throw error}
  return{ok:true,id};
}
module.exports={resolve,admin,permit,publicSession,assignedIds,requireClient,request,login,saveUser,sameOrigin,forbidden,DEFAULT_PERMISSIONS};
