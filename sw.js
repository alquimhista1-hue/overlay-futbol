const CACHE='rm-shell-v159';
// La instalación solo necesita recursos públicos, nunca las pantallas privadas.
const SHELL=['/login.html','/offline.html','/auth.css?v=3','/login.js?v=10','/pwa.js?v=5','/pwa-install.css?v=1','/update-notice.js?v=2','/update-notice.css?v=1','/manifest.webmanifest?v=4','/assets/logo.svg','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Validar cada respuesta evita guardar una redirección al login como un recurso.
  await Promise.all(SHELL.map(async path=>{const response=await fetch(path,{cache:'reload',credentials:'omit'});if(!response.ok||response.redirected)throw new Error('Recurso público no disponible: '+path);await cache.put(path,response)}));
}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rm-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    // Solo el HTML genérico del cobrador (sin datos/persona) puede abrirse offline.
    // La identidad local y sus datos permanecen separados, nunca en Cache Storage.
    event.respondWith((async()=>{try{const response=await fetch(request);if(url.pathname==='/cobrador.html'&&response.ok&&!response.redirected&&(response.headers.get('Content-Type')||'').includes('text/html')){const cache=await caches.open(CACHE);await cache.put('/cobrador.html',response.clone())}return response}catch{if(url.pathname==='/cobrador.html'){const shell=await caches.match('/cobrador.html');if(shell)return shell}if(url.pathname==='/login.html'){const login=await caches.match('/login.html');if(login)return login}return await caches.match('/offline.html')||new Response('Sin conexión. Abra una vez con internet para preparar la copia local.',{status:503})}})());return;
  }
  if(!/\.(?:css|js|png|svg|webmanifest|ico|mp3)$/i.test(url.pathname))return;
  // Una URL versionada identifica una versión concreta. Los cambios usan otra URL.
  if(url.searchParams.has('v')){
    event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;try{const response=await fetch(request);if(response.ok&&!response.redirected&&!(response.headers.get('Content-Type')||'').includes('text/html'))await cache.put(request,response.clone());return response}catch{return new Response('',{status:503})}})());return;
  }
  event.respondWith((async()=>{
    try{const response=await fetch(request);const type=response.headers.get('Content-Type')||'';if(response.ok&&!response.redirected&&!type.includes('text/html')){try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch{/* La caché no debe bloquear una respuesta válida de la red. */}}return response}
    catch{const cached=await caches.match(request);if(cached)return cached;return new Response('',{status:503})}
  })());
});
