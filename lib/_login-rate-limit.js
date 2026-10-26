const crypto=require('crypto');

const WINDOW_SECONDS=15*60;
const LIMITS={ip:5,user:10};

function supabase(){
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Falta configurar la proteccion de acceso.');
  return{url,key};
}

function digest(kind,value){
  const secret=process.env.SESSION_SECRET;
  if(!secret)throw new Error('Falta SESSION_SECRET.');
  return crypto.createHmac('sha256',secret).update(`${kind}\0${String(value).slice(0,256)}`).digest('hex');
}

function requestIp(req){
  const forwarded=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim();
  return forwarded||String(req.headers['x-real-ip']||req.socket?.remoteAddress||'desconocida');
}

function identifiers(req,user){
  return[
    {hash:digest('ip',requestIp(req)),limit:LIMITS.ip},
    {hash:digest('usuario',String(user||'').trim().toLowerCase()),limit:LIMITS.user}
  ];
}

async function rpc(name,body){
  const{url,key}=supabase();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(`${url}/rest/v1/rpc/${name}`,{
      method:'POST',
      headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify(body),
      signal:controller.signal
    });
    const text=await response.text();
    const result=safeJson(text);
    if(!response.ok||!result)throw new Error('No fue posible comprobar el limite de acceso.');
    return result;
  }finally{clearTimeout(timeout)}
}

async function check(req,user){
  const keys=identifiers(req,user);
  const states=await Promise.all(keys.map(item=>rpc('estado_limite_login',{
    p_clave_hash:item.hash,
    p_limite:item.limit,
    p_ventana_segundos:WINDOW_SECONDS
  })));
  const blocked=states.filter(item=>item.permitido===false);
  return{keys,permitido:blocked.length===0,reintentarEn:Math.max(0,...blocked.map(item=>Number(item.reintentar_en)||0))};
}

async function record(keys,success){
  const states=await Promise.all(keys.map(item=>rpc('registrar_intento_login',{
    p_clave_hash:item.hash,
    p_exito:Boolean(success),
    p_limite:item.limit,
    p_ventana_segundos:WINDOW_SECONDS
  })));
  const blocked=states.filter(item=>item.permitido===false);
  return{permitido:blocked.length===0,reintentarEn:Math.max(0,...blocked.map(item=>Number(item.reintentar_en)||0))};
}

function safeJson(value){try{return JSON.parse(value)}catch{return null}}

module.exports={check,record};
