/* Mantener la escala de la aplicación y bloquear el fondo de las ventanas. */
(()=>{
 const viewport=document.querySelector('meta[name="viewport"]');if(viewport)viewport.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
 document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
 document.addEventListener('touchmove',e=>{if(e.touches.length>1&&!e.target.closest('#documentViewer .viewer-body'))e.preventDefault()},{passive:false});
 document.addEventListener('wheel',e=>{if((e.ctrlKey||e.metaKey)&&!e.target.closest('#documentViewer'))e.preventDefault()},{passive:false});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['+','-','=','0'].includes(e.key)&&!e.target.closest('#documentViewer'))e.preventDefault()});
 let locked=false,savedY=0,savedStyle='',childLock=false;
 function sync(){const modal=document.querySelector('dialog[open]'),should=!!modal||childLock;if(should===locked)return;locked=should;if(locked){savedY=scrollY;savedStyle=document.body.style.cssText;document.body.style.position='fixed';document.body.style.top=-savedY+'px';document.body.style.width='100%';document.body.style.overflow='hidden';document.documentElement.classList.add('modal-scroll-locked')}else{document.body.style.cssText=savedStyle;document.documentElement.classList.remove('modal-scroll-locked');window.scrollTo(0,savedY)}if(parent!==window)parent.postMessage({type:'studio:modal-lock',locked:!!modal},location.origin);}
 function growFields(){document.querySelectorAll('textarea').forEach(field=>{field.style.height='auto';field.style.height=Math.max(60,field.scrollHeight)+'px';field.style.overflow='hidden'})}function start(){document.addEventListener('input',event=>{if(event.target.matches('textarea'))growFields()});window.addEventListener('resize',growFields);new MutationObserver(growFields).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});growFields();new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open'],childList:true});sync();}
 window.addEventListener('message',event=>{if(parent!==window||event.origin!==location.origin||event.data?.type!=='studio:modal-lock')return;const frames=[...document.querySelectorAll('iframe')];if(!frames.some(f=>f.contentWindow===event.source))return;childLock=!!event.data.locked;sync()});
 document.addEventListener('touchmove',e=>{if(!locked||e.touches.length>1)return;const modal=document.querySelector('dialog[open]');if(!modal||!modal.contains(e.target))e.preventDefault()},{passive:false});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
