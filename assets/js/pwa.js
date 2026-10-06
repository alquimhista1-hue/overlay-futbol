if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)){
  let refreshing=false;const hadController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing&&(typeof teamInputsDirty==='undefined'||!teamInputsDirty)){refreshing=true;location.reload()}});
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(console.warn));
}
