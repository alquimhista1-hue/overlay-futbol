// Public display, authenticated management. No administrator secrets in the app.
const SponsorStore = (() => {
  const bucket = 'overlay-sponsors';
  const defaults = [];
  // Retire only the original bundled ads; manually uploaded replacements stay visible.
  const currentAds = list => list.filter(item=>!(item.bundled && ['muni','importadora','taquerea'].includes(item.id)));
  let items = defaults, connected = false;
  try { const cached=JSON.parse(localStorage.getItem('overlay_sponsors_cache')); if(Array.isArray(cached)) items=currentAds(cached); } catch {}
  const listeners = new Set();
  function url(item) { if(item.bundled){const name=String(item.image_path).split('/').pop();return new URL('assets/images/sponsors/'+name,location.href).href;}return new URL('/storage/v1/object/public/'+bucket+'/'+item.image_path,SUPABASE_URL).href; }
  let lastError='';
  async function load() {
    // Public reads never wait for SDK authentication or a stale device session.
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const endpoint=new URL('/rest/v1/overlay_sponsors',SUPABASE_URL);
      endpoint.searchParams.set('select','*');endpoint.searchParams.set('order','sort_order.asc,id.asc');
      const response=await fetch(endpoint,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY},cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('No se pudo consultar la lista ('+response.status+').');
      const data=await response.json();if(!Array.isArray(data))throw Error('Respuesta de anunciantes inválida.');
      items=currentAds(data);connected=true;lastError='';
      try{localStorage.setItem('overlay_sponsors_cache',JSON.stringify(items))}catch{}
      listeners.forEach(fn=>fn(items));return true;
    }catch(e){connected=false;lastError=e.name==='AbortError'?'La conexión tardó demasiado. Pulsa Actualizar lista.':(e.message||'No se pudo conectar con anunciantes.');return false;}
    finally{clearTimeout(timeout)}
  }
  function requireClient(){if(!sbClient)throw Error('No se cargó la conexión para guardar. Comprueba internet y vuelve a abrir el panel.');}
  async function upload(name,file) {requireClient();
    if (!connected) throw Error('Configura primero Supabase siguiendo LEEME.');
    if (items.length>=60) throw Error('El ciclo admite hasta 60 anunciantes. Elimina uno antes de subir otro.');
    if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw Error('Selecciona una imagen PNG, JPG o WebP.');
    if (file.size>5*1024*1024) throw Error('La imagen debe pesar como máximo 5 MB.');
    const bitmap=await createImageBitmap(file); const valid=bitmap.width>=100 && bitmap.height>=50 && bitmap.width<=4096 && bitmap.height<=4096;bitmap.close();
    if(!valid) throw Error('Usa una imagen entre 100 × 50 y 4096 × 4096 píxeles.');
    const path=crypto.randomUUID()+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]);
    const {error:uploadError}=await sbClient.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError) throw uploadError;
    const {error}=await sbClient.from('overlay_sponsors').insert({id:crypto.randomUUID(),name,image_path:path,bundled:false,active:true,sort_order:Math.max(0,...items.map(i=>i.sort_order))+1});
    if(error){await sbClient.storage.from(bucket).remove([path]);throw error;}await load();
  }
  async function edit(item,name,file) {requireClient();
    if(!connected) throw Error('Sin conexión con anunciantes.');
    name=name.trim();if(!name||name.length>80)throw Error('Escribe un nombre de hasta 80 caracteres.');
    let newPath=null;
    if(file){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Usa PNG, JPG o WebP de hasta 5 MB.');
      const bitmap=await createImageBitmap(file);const valid=bitmap.width>=100&&bitmap.height>=50&&bitmap.width<=4096&&bitmap.height<=4096;bitmap.close();
      if(!valid)throw Error('Usa una imagen entre 100 × 50 y 4096 × 4096 píxeles.');
      newPath=crypto.randomUUID()+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]);
      const {error}=await sbClient.storage.from(bucket).upload(newPath,file,{contentType:file.type,upsert:false});if(error)throw error;
    }
    const changes={name};if(newPath){changes.image_path=newPath;changes.bundled=false;}
    const {error}=await sbClient.from('overlay_sponsors').update(changes).eq('id',item.id).select().single();
    if(error){if(newPath)await sbClient.storage.from(bucket).remove([newPath]);throw error;}
    await load();
    if(newPath&&!item.bundled){const {error:cleanupError}=await sbClient.storage.from(bucket).remove([item.image_path]);if(cleanupError)throw Error('Anuncio actualizado. No se pudo retirar la imagen anterior de Storage.');}
  }
  async function remove(item) {requireClient();
    // Disable first so a partially failed deletion never leaves a broken active ad.
    const {error:off}=await sbClient.from('overlay_sponsors').update({active:false}).eq('id',item.id).select().single();if(off)throw off;
    await load();
    if(!item.bundled){const {error}=await sbClient.storage.from(bucket).remove([item.image_path]);if(error)throw error;}
    const {error}=await sbClient.from('overlay_sponsors').delete().eq('id',item.id).select().single();if(error)throw error;await load();
  }
  async function toggle(item){requireClient();const {error}=await sbClient.from('overlay_sponsors').update({active:!item.active}).eq('id',item.id).select().single();if(error)throw error;await load();}
  return {load,upload,edit,remove,toggle,url,get items(){return items},get connected(){return connected},get lastError(){return lastError},subscribe(fn){listeners.add(fn)}};
})();
