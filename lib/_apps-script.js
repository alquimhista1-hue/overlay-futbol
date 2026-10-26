async function request(action,parameters={}){
  const scriptUrl=process.env.APPS_SCRIPT_URL;
  const secret=process.env.API_SECRET;
  if(!scriptUrl||!secret)throw new Error('Falta configurar la conexion segura con Google Sheets.');

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch(scriptUrl,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({...parameters,accion:action,clave:secret}),
      redirect:'follow',
      signal:controller.signal
    });
    const text=await response.text();
    const result=safeJson(text);
    if(!result)throw new Error('Apps Script devolvio una respuesta no valida.');
    if(!result.ok){const error=new Error(result.mensaje||'Google Sheets no pudo completar la consulta.');error.status=400;throw error}
    return result.datos;
  }catch(error){
    if(error&&error.name==='AbortError')throw new Error('La consulta a Google Sheets tardo demasiado.');
    throw error;
  }finally{clearTimeout(timeout)}
}

function safeJson(value){try{return JSON.parse(value)}catch{return null}}

module.exports={request};
