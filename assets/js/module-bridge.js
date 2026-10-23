(() => {
 const studio=window.parent!==window?window.parent.Studio:null;
 if(!studio?.session){location.replace('../../index.html');return;}
 window.STUDIO_OWNER=studio.userId;
 window.StudioBridge={studio,get profile(){return studio.profile},documentId:new URLSearchParams(location.search).get('doc'),kind:location.pathname.includes('/cotizaciones/')?'quotation':'design',async load(){if(!this.documentId)return null;return studio.readDocument(this.documentId)},async save(title,payload){this.documentId=await studio.saveDocument(this.documentId,this.kind,title,payload);history.replaceState(null,'','?doc='+encodeURIComponent(this.documentId));return this.documentId;}};
})();

(() => {
 if(window.parent===window)return;let lastHeight='',pending=false;
 function measure(){pending=false;const height=Math.ceil(document.body.getBoundingClientRect().height),fixed=location.pathname.includes('/transmision/')&&document.body.classList.contains('match-view'),key=height+':'+fixed;if(height>=50&&key!==lastHeight){lastHeight=key;parent.postMessage({type:'studio:resize',height,fixed},location.origin)}}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(measure)}}
 function start(){new ResizeObserver(schedule).observe(document.body);new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true});window.addEventListener('load',schedule);document.fonts?.ready.then(schedule);schedule()}
 window.addEventListener('message',event=>{if(event.source===parent&&event.origin===location.origin&&event.data?.type==='studio:measure'){lastHeight=0;schedule()}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
