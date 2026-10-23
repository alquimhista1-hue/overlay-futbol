/* Visor de todas las hojas: el zoom pertenece a este visor, no a la aplicación. */
window.openStudioDocument=function(pages){
 let dialog=document.getElementById('documentViewer');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='documentViewer';dialog.setAttribute('aria-label','Hojas de la cotización');dialog.innerHTML='<div class="viewer-toolbar"><button id="viewerMinus" type="button" aria-label="Reducir hoja">−</button><output id="viewerScale" aria-live="polite">100 %</output><button id="viewerPlus" type="button" aria-label="Ampliar hoja">+</button><button id="viewerFit" type="button">Ajustar</button><button id="viewerClose" type="button">Cerrar</button></div><div class="viewer-body" tabindex="0" aria-label="Páginas de la cotización"><div class="viewer-pages"></div></div>';document.body.append(dialog);dialog.querySelector('#viewerClose').onclick=()=>dialog.close();}
 const body=dialog.querySelector('.viewer-body'),stack=dialog.querySelector('.viewer-pages');let scale=1,pinch=null;
 stack.replaceChildren();(Array.isArray(pages)?pages:[pages]).forEach((src,i)=>{const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src=src;image.alt='Cotización, página '+(i+1);image.draggable=false;caption.textContent='Página '+(i+1);figure.append(caption,image);stack.append(figure)});
 function zoom(next,point){next=Math.min(4,Math.max(.5,next));const old=scale;const x=point?.x??body.clientWidth/2,y=point?.y??body.clientHeight/2;scale=next;stack.style.width=Math.max(1,body.clientWidth-16)*scale+'px';dialog.querySelector('#viewerScale').value=Math.round(scale*100)+' %';body.scrollLeft=(body.scrollLeft+x)*scale/old-x;body.scrollTop=(body.scrollTop+y)*scale/old-y;dialog.querySelector('#viewerMinus').disabled=scale<=.5;dialog.querySelector('#viewerPlus').disabled=scale>=4;}
 dialog.querySelector('#viewerMinus').onclick=()=>zoom(scale/1.25);dialog.querySelector('#viewerPlus').onclick=()=>zoom(scale*1.25);dialog.querySelector('#viewerFit').onclick=()=>{zoom(1);body.scrollTo(0,0)};
 const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 body.ontouchstart=e=>{if(e.touches.length===2){pinch={distance:distance(e.touches),scale};e.preventDefault()}};
 body.ontouchmove=e=>{if(e.touches.length===2&&pinch){e.preventDefault();const rect=body.getBoundingClientRect();zoom(pinch.scale*distance(e.touches)/Math.max(1,pinch.distance),{x:(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left,y:(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top})}};
 body.ontouchend=()=>pinch=null;
 body.onwheel=e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();const rect=body.getBoundingClientRect();zoom(scale*(e.deltaY<0?1.12:1/1.12),{x:e.clientX-rect.left,y:e.clientY-rect.top})}};
 dialog.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&['+','=','-','0'].includes(e.key)){e.preventDefault();zoom(e.key==='0'?1:e.key==='-'?scale/1.25:scale*1.25)}};
 if(!dialog.open)dialog.showModal();requestAnimationFrame(()=>{zoom(1);body.scrollTo(0,0)});
};
