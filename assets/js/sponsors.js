// Public display, authenticated management. No administrator secrets in the app.
const SponsorStore = (() => {
  const bucket = 'overlay-sponsors';
  const defaults = [
    {id:'muni',name:'MUNI',image_path:'assets/images/sponsors/MUNI.jpg',bundled:true,active:true,sort_order:1},
    {id:'importadora',name:'Importadora',image_path:'assets/images/sponsors/Importadora.jpg',bundled:true,active:true,sort_order:2},
    {id:'taquerea',name:'TAQUEREA',image_path:'assets/images/sponsors/TAQUEREA.jpg',bundled:true,active:true,sort_order:3}
  ];
  let items = defaults, connected = false;
  const listeners = new Set();
  function url(item) { return item.bundled ? new URL(item.image_path.includes('/') ? item.image_path : 'assets/images/sponsors/'+item.image_path,location.href).href : sbClient.storage.from(bucket).getPublicUrl(item.image_path).data.publicUrl; }
  async function load() {
    if (!sbClient) return false;
    const {data,error} = await sbClient.from('overlay_sponsors').select('*').order('sort_order').order('id');
    if (error) { connected=false; return false; }
    items=data; connected=true; listeners.forEach(fn=>fn(items)); return true;
  }
  async function upload(name,file) {
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
  async function remove(item) {
    // Disable first so a partially failed deletion never leaves a broken active ad.
    const {error:off}=await sbClient.from('overlay_sponsors').update({active:false}).eq('id',item.id).select().single();if(off)throw off;
    await load();
    if(!item.bundled){const {error}=await sbClient.storage.from(bucket).remove([item.image_path]);if(error)throw error;}
    const {error}=await sbClient.from('overlay_sponsors').delete().eq('id',item.id).select().single();if(error)throw error;await load();
  }
  async function toggle(item){const {error}=await sbClient.from('overlay_sponsors').update({active:!item.active}).eq('id',item.id).select().single();if(error)throw error;await load();}
  return {load,upload,remove,toggle,url,get items(){return items},get connected(){return connected},subscribe(fn){listeners.add(fn)}};
})();
