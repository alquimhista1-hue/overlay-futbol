const crypto=require('node:crypto'),db=require('./_supabase'),auth=require('./_auth');
const SECONDS=180*86400;
const hash=key=>crypto.createHash('sha256').update(key).digest('hex');
function credential(token){return token&&/^[a-f0-9-]{36}$/i.test(token.sid||'')&&/^[A-Za-z0-9_-]{43}$/.test(token.key||'')?{id:token.sid,hash:hash(token.key)}:null}
async function start(user,profile){
 const sid=crypto.randomUUID(),key=crypto.randomBytes(32).toString('base64url');
 await db.rpc('abrir_sesion_aplicacion',{datos:{id:sid,hash:hash(key),usuario:user,idUsuario:profile?.id||null,version:profile?.version_sesion||null,versionLegada:profile?null:auth.legacyVersion(user)}});
 return auth.cookie(auth.issue(user,profile,{sid,key}),SECONDS);
}
async function check(token){
 const c=credential(token);if(!c)return null;
 const row=(await db.select('sesiones_aplicacion',{select:'*',id_sesion:'eq.'+c.id,limit:1}))[0];
 if(!row||row.revocada_en||Date.parse(row.expira_en)<=Date.now()||row.usuario!==token.user||row.id_usuario!==(token.uid||null)||row.version_sesion!==(token.version||null))return null;
 const actual=Buffer.from(c.hash),saved=Buffer.from(String(row.credencial_hash||''));
 if(actual.length!==saved.length||!crypto.timingSafeEqual(actual,saved))return null;
 if(!token.uid&&(process.env.ALLOW_LEGACY_ADMIN==='false'||!auth.legacyVersion(token.user)||row.version_legada!==auth.legacyVersion(token.user)))return null;
 return row;
}
async function renew(req,session){
 const token=auth.verify(req);if(!token?.sid)return null;
 const c=credential(token);if(!c)return null;
 if(Date.now()-Date.parse(session._persistent.renovado_en)<86400000)return null;
 const result=await db.rpc('renovar_sesion_aplicacion',{p_id:c.id,p_hash:c.hash});
 if(!result?.ok){const e=new Error('Sesión revocada.');e.status=401;throw e}
 return auth.cookie(auth.issue(session.user,token.uid?{id:token.uid,version_sesion:token.version}:null,{sid:token.sid,key:token.key}),SECONDS);
}
async function revoke(req){
 const c=credential(auth.verify(req));if(c)await db.rpc('revocar_sesion_aplicacion',{p_id:c.id,p_hash:c.hash});
}
module.exports={start,check,renew,revoke,SECONDS};
