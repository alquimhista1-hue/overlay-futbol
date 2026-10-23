import { createClient } from "npm:@supabase/supabase-js@2";

// Public registration only. Administrative credentials stay inside Supabase.
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const attempts=new Map();
function normalize(raw){const value=String(raw||'').normalize('NFKC').trim().toLowerCase();if(/^[+\d\s().-]+$/.test(value)&&/\d/.test(value)){const digits=value.replace(/\D/g,'');if(digits.length<8||digits.length>15)throw Error('Escribe un teléfono de 8 a 15 dígitos.');return {key:'phone:'+digits,label:digits};}if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(value))throw Error('Usa un usuario de 3 a 40 caracteres: letras sin tildes, números, punto, guion o guion bajo.');return {key:'user:'+value,label:value};}
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(request.method!=='POST')return reply(405,{error:'Método no permitido.'});
 if(Number(request.headers.get('content-length')||0)>4096)return reply(413,{error:'Solicitud demasiado grande.'});
 try{
  const text=await request.text();if(text.length>4096)return reply(413,{error:'Solicitud demasiado grande.'});
  let input;try{input=JSON.parse(text)}catch{return reply(400,{error:'Datos de registro inválidos.'})}
  if(!input||typeof input!=='object')return reply(400,{error:'Datos de registro inválidos.'});
  const identity=normalize(input.username),name=String(input.name||'').trim(),password=input.password;
  if(name.length<2||name.length>80)return reply(400,{error:'Escribe un nombre de 2 a 80 caracteres.'});
  if(typeof password!=='string'||password.length<6||password.length>128)return reply(400,{error:'La contraseña debe tener entre 6 y 128 caracteres.'});
  const url=Deno.env.get('SUPABASE_URL'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!secret)return reply(500,{error:'Falta configurar la función de registro.'});
  // A small per-instance guard supplements the platform limits, without logging credentials.
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown',now=Date.now();
  if(attempts.size>2000)for(const [key,value] of attempts)if(now-value.start>600000)attempts.delete(key);
  let limit=attempts.get(ip);if(!limit||now-limit.start>600000){limit={start:now,count:0};attempts.set(ip,limit)}
  if(++limit.count>10)return reply(429,{error:'Demasiados intentos de registro. Espera 10 minutos.'});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity.key));
  const token=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  // A valid internal Auth identifier, never an email delivery destination.
  const email=token+'@'+new URL(url).hostname;
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:name,login_name:identity.label}});
  if(error){if(/already|registered|exists/i.test(error.message)||error.code==='email_exists')return reply(409,{error:'Ese usuario o teléfono ya está registrado. Pulsa Entrar.'});return reply(400,{error:error.code==='weak_password'?'Supabase exige una contraseña más segura. Elige otra.':'No se pudo crear la cuenta. Revisa la configuración de Auth.'});}
  return reply(201,{ok:true});
 }catch(error){if(error instanceof Error&&/teléfono|usuario de/.test(error.message))return reply(400,{error:error.message});return reply(500,{error:'No se pudo completar el registro. Inténtalo de nuevo.'});}
});
